"""
Shared utility functions for content processing Lambdas.
Contains validation, data preparation, error handling, and LLM functions.
"""
import json
from datetime import datetime
import logging
import threading
import enum

# Import LLM client with fallback
try:
    from penguindb.utils.llm_client import call_claude
except ImportError:
    logging.warning("Could not import call_claude from penguindb.utils.llm_client. LLM features will be disabled.")
    # Define a dummy function if import fails
    def call_claude(*args, **kwargs):
        logging.error("call_claude is not available.")
        return {"error": "LLM client not imported"}

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Define error types
class ErrorTypes(enum.Enum):
    VALIDATION_ERROR = "ValidationError"
    SERVICE_ERROR = "ServiceError"
    INTERNAL_ERROR = "InternalError"
    QUEUE_ERROR = "QueueError"
    DATABASE_ERROR = "DatabaseError"

def create_error_response(error_type, message, log_message=None):
    """
    Create a standardized error response.
    
    Args:
        error_type: Type of error (from ErrorTypes enum)
        message: Error message to be returned to the client
        log_message: Optional message to log (if different from client message)
    
    Returns:
        Dictionary with statusCode, headers, and body containing error details
    """
    if log_message:
        logger.error(log_message)
    else:
        logger.error(message)
        
    error_body = {
        "error": {
            "type": error_type.value if isinstance(error_type, ErrorTypes) else str(error_type),
            "message": message,
            "timestamp": datetime.datetime.now().isoformat()
        }
    }
    
    return {
        "statusCode": 400 if error_type == ErrorTypes.VALIDATION_ERROR else 500,
        "body": json.dumps(error_body),
        "headers": {
            "Content-Type": "application/json"
        }
    }

def validate_field_types(data):
    """
    Validates the types of fields in the request body.
    
    Args:
        data: Dictionary containing the request data
        
    Returns:
        None if validation passes, error message string if validation fails
    """
    type_validations = {
        'content_id': str,
        'media_link': str,
        'tags': (str, list),
        'generated_tags': (str, list)
    }
    
    for field, expected_type in type_validations.items():
        if field in data and data[field] is not None:
            if isinstance(expected_type, tuple):
                if not any(isinstance(data[field], t) for t in expected_type):
                    type_names = [t.__name__ for t in expected_type]
                    return f"Field '{field}' must be one of types: {', '.join(type_names)}"
            elif not isinstance(data[field], expected_type):
                return f"Field '{field}' must be of type {expected_type.__name__}"
    
    return None

def prepare_data_for_dynamodb(item):
    """
    Prepares data for writing to DynamoDB.
    Converts string lists (comma-separated) to sets and handles other type conversions.
    
    Args:
        item: Dictionary containing the item data
        
    Returns:
        Dictionary with data formatted for DynamoDB
    """
    dynamodb_item = {}
    
    # Process each field
    for key, value in item.items():
        # Skip null values
        if value is None:
            continue
            
        # Handle comma-separated tags as StringSet
        if key in ['tags', 'generated_tags'] and isinstance(value, str):
            if value.strip():  # Only process non-empty strings
                tag_list = [tag.strip() for tag in value.split(',') if tag.strip()]
                if tag_list:
                    dynamodb_item[key] = {'SS': tag_list}
        # Handle actual list as StringSet
        elif key in ['tags', 'generated_tags'] and isinstance(value, list):
            if value:  # Only process non-empty lists
                tag_list = [str(tag).strip() for tag in value if str(tag).strip()]
                if tag_list:
                    dynamodb_item[key] = {'SS': tag_list}
        # Handle standard types
        elif isinstance(value, str):
            dynamodb_item[key] = {'S': value}
        elif isinstance(value, (int, float)):
            dynamodb_item[key] = {'N': str(value)}
        elif isinstance(value, bool):
            dynamodb_item[key] = {'BOOL': value}
        elif isinstance(value, dict):
            # Convert dict to JSON string
            dynamodb_item[key] = {'S': json.dumps(value)}
        else:
            # Default to string representation
            dynamodb_item[key] = {'S': str(value)}
    
    return dynamodb_item

def generate_content_with_llm(content_type, description, tags, logger, timeout=120):
    """
    Generate content using Claude LLM with timeout handling.
    
    Args:
        content_type: Type of content ('post', 'article', etc.)
        description: Original content description
        tags: Original tags (string or list)
        logger: Logger instance
        timeout: Timeout in seconds
    
    Returns:
        Dictionary with generated title, description, and tags
    """
    # Convert tags to string for prompt if needed
    if isinstance(tags, (list, set)):
        tags_str = ", ".join(str(tag) for tag in tags)
    else:
        tags_str = tags or ""

    # Adjust word count based on content type
    word_count = "10-15" if content_type.lower() == "post" else "15-20"
    
    # Create prompt for LLM
    prompt = f"""
    Content Type: {content_type}
    My Draft: {description}
    Current Tags: {tags_str}

    Hey, help me refine this {content_type} I'm working on. I need:

    1. An attention-grabbing title (3-6 words) - something that would make YOU want to click. Be intriguing but not clickbaity.

    2. A punchy description (around {word_count} words) that sounds like a real person wrote it - conversational, occasionally using "I" statements, and avoiding perfectionist language or overly formal structure.

    3. Exactly 4 tags that would help this content reach the right audience - focus on data engineering concepts, cloud technologies, or specific tools mentioned in the content. Avoid generic tech terms like "software-dev" or irrelevant fields like "machine-learning" unless directly addressed.

    Style guidelines:
    - For content tagged with "humor" or where humor is explicitly requested: Use my conversational style with witty elements and occasional wordplay.
    - For all other content (especially technical/educational): Maintain a professional tone with clarity and technical precision. My professional content should convey expertise in data engineering while remaining accessible.

    I work specifically in data engineering with expertise in data infrastructure, ML, cloud services, analytics, generative AI, and agentic AI. My content should reflect this specialization rather than general tech topics.

    My writing style is straightforward with clear technical explanations. I prefer active voice and concrete examples over abstract concepts. I sometimes use short sentences for emphasis.

    Return as JSON with keys: title, description, tags (array of 4 strings)
    """

    # Run LLM call with timeout using threading
    llm_result = {"title": "", "description": "", "tags": []}
    llm_error = None
    
    def _generate_llm_content_thread():
        nonlocal llm_result, llm_error
        try:
            response = call_claude(
                prompt=prompt,
                model_id="anthropic.claude-3-sonnet-20240229-v1:0",  # Use the specific Bedrock model ID
                extract_json=True,
                max_tokens=500
            )
            
            if "error" in response:
                logger.warning(f"LLM response contained an error: {response.get('error')}")
                if "raw_response" in response:
                    logger.info(f"Raw LLM response: {response.get('raw_response')}")
                llm_error = response.get('error')
                return
                
            llm_result.update(response)
        except Exception as e:
            llm_error = str(e)
            logger.error(f"Error in LLM thread: {llm_error}")

    # Run in thread with timeout
    llm_thread = threading.Thread(target=_generate_llm_content_thread)
    llm_thread.start()
    llm_thread.join(timeout=timeout)

    # Handle timeout and results
    if llm_thread.is_alive():
        logger.warning(f"LLM generation timed out after {timeout} seconds")
        # Thread is still running but we're moving on
        return {"title": "", "description": "", "tags": []}
        
    if llm_error:
        logger.error(f"LLM generation error: {llm_error}")
        return {"title": "", "description": "", "tags": []}
        
    # Ensure tags is a list
    if 'tags' in llm_result and not isinstance(llm_result['tags'], list):
        try:
            # Try converting comma-separated string if LLM returned wrong format
            parsed_tags = [tag.strip() for tag in str(llm_result['tags']).split(',') if tag.strip()]
            llm_result['tags'] = parsed_tags
        except Exception as e:
            logger.warning(f"Could not parse 'tags' from LLM into a list: {llm_result['tags']}. Error: {str(e)}")
            llm_result['tags'] = []

    logger.info(f"LLM Response: {json.dumps(llm_result)}")
    return llm_result 