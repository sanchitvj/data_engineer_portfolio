"""
Shared utility functions for content processing Lambdas.
Contains validation, data preparation, error handling, and LLM functions.
"""
import json
from datetime import datetime
import logging
import threading
import enum
import time

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
            "timestamp": datetime.now().isoformat()
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
    Only validates fields that are present in the data.
    
    Args:
        data: Dictionary containing the request data
        
    Returns:
        None if validation passes, error message string if validation fails
    """
    type_validations = {
        'content_id': str,
        'media_link': str,
        'embed_link': str,
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
    Safely handles missing fields like media_link or embed_link.
    
    Args:
        item: Dictionary containing the item data
        
    Returns:
        Dictionary with data formatted for DynamoDB
    """
    dynamodb_item = {}
    
    # Fields to exclude from DynamoDB (often from spreadsheet metadata)
    excluded_fields = [
        'Column 1',                   # Spreadsheet metadata
        'Column 2',                   # Spreadsheet metadata
        'Column 3',                   # Spreadsheet metadata
        'Row',                        # Spreadsheet metadata
        'Row Number',                 # Spreadsheet metadata
        'INDEX',                      # Spreadsheet metadata
        'ID',                         # Use content_id instead
        'sheet_id',                   # Spreadsheet metadata
        'headers',                    # Spreadsheet metadata
        'error_details',              # Handle separately
        'attempt_count',              # Handle separately
        'status'                      # Only track status in Google Sheet, not in DynamoDB
    ]
    
    # Process each field
    for key, value in item.items():
        # Skip excluded fields
        if key in excluded_fields:
            continue
            
        # Skip null values
        if value is None:
            continue
        
        # Special handling for content_id (should be a plain string in the main item)
        if key == 'content_id':
            dynamodb_item[key] = value
            continue
            
        # Handle comma-separated tags as StringSet
        if key in ['tags', 'generated_tags'] and isinstance(value, str):
            if value.strip():  # Only process non-empty strings
                tag_list = [tag.strip() for tag in value.split(',') if tag.strip()]
                if tag_list:
                    dynamodb_item[key] = tag_list  # Use plain list for boto3 client
                    
        # Handle actual list as StringSet
        elif key in ['tags', 'generated_tags'] and isinstance(value, list):
            if value:  # Only process non-empty lists
                tag_list = [str(tag).strip() for tag in value if str(tag).strip()]
                if tag_list:
                    dynamodb_item[key] = tag_list  # Use plain list for boto3 client
                    
        # Handle standard types - let boto3 handle the conversion
        else:
            dynamodb_item[key] = value
    
    return dynamodb_item

def generate_content_with_llm(content_type, model, description, tags, logger, timeout=180, max_retries=10, original_title=None):
    """
    Generate content using Claude LLM with aggressive timeout handling and persistent retries.
    Will retry until successful or until max_retries is reached.
    
    Args:
        content_type: Type of content ('post', 'article', etc.)
        description: Original content description
        tags: Original tags (string or list)
        logger: Logger instance
        timeout: Timeout in seconds for each attempt
        max_retries: Maximum number of retry attempts for failure
        original_title: Original title from the source content (optional)
    
    Returns:
        Dictionary with generated title, description, and tags
    """
    # Convert tags to string for prompt if needed
    if isinstance(tags, (list, set)):
        tags_str = ", ".join(str(tag) for tag in tags)
    else:
        tags_str = tags or ""

    # Adjust word count based on content type
    if content_type.lower() == "post":
        desc_word_count = "10-15"
    elif content_type.lower() == "article":
        desc_word_count = "15-20"
    elif content_type.lower() == "youtube":
        desc_word_count = "7-10"
    else:
        desc_word_count = "20-25"

    title_word_count = "3-4" if content_type.lower() == "youtube" else "3-6"
    
    # Include original title in prompt if available
    title_context = ""
    if original_title:
        title_context = f"Original Title: {original_title}\n"
    
    prompt = f"""
    Content Type: {content_type}
    {title_context}My Draft: {description}
    Current Tags: {tags_str}

    Hey, help me refine this {content_type} I'm working on. I need:

    1. An attention-grabbing title ({title_word_count} words) - something that would make YOU want to click. Be intriguing but not clickbaity and not dramatic.{" Use the original title as reference if provided." if original_title else ""}

    2. A punchy description (around {desc_word_count} words) that sounds like a real person wrote it - conversational, occasionally using "I" statements, and avoiding perfectionist language or overly formal structure.

    3. Generate up to 10 relevant tags that comprehensively cover all key technical concepts, tools, and topics mentioned in my description. Extract specific technologies, methodologies, platforms, and concepts that would make excellent search terms. Prioritize specific technical terms (like "Apache Airflow", "AWS Glue", "data lake") over generic categories ("tool", "cloud", "storage"). Ensure each tag directly relates to content in the description.

    Style guidelines:
    - For content tagged with "humor" or where humor is explicitly requested: Use my conversational style with witty elements and occasional wordplay.
    - For all other content (especially technical/educational): Maintain a professional tone with clarity and technical precision. My professional content should convey expertise in data engineering while remaining accessible.

    I work specifically in data engineering with expertise in data infrastructure, ML, cloud services, analytics, generative AI, and agentic AI. My content should reflect this specialization rather than general tech topics.

    My writing style is straightforward with clear technical explanations. I prefer active voice and concrete examples over abstract concepts. I sometimes use short sentences for emphasis.

    Return as JSON with keys: title, description, tags (array of up to 10 strings)
    """
    
    # Initialize empty result
    llm_result = {"title": "", "description": "", "tags": []}
    
    # PERSISTENT RETRY LOOP
    for retry_attempt in range(max_retries):
        # Calculate exponential backoff with some randomness
        backoff_time = min(300, 2 ** retry_attempt + (retry_attempt * 5))  # Max 5 minute backoff
        
        # Log the retry attempt
        if retry_attempt > 0:
            logger.info(f"LLM RETRY ATTEMPT {retry_attempt}/{max_retries} after {backoff_time}s backoff")
            time.sleep(backoff_time)
        
        # Thread variables
        llm_error = None
        thread_completed = False
        
        def _generate_llm_content_thread():
            nonlocal llm_result, llm_error, thread_completed
            try:
                response = call_claude(
                    prompt=prompt,
                    model_id=model,
                    extract_json=True,
                    max_tokens=500
                )
                
                if "error" in response:
                    error_msg = response.get('error', '')
                    logger.warning(f"LLM response contained an error: {error_msg}")
                    llm_error = error_msg
                    return
                    
                # Check for valid content in response
                if not response.get('title') or not response.get('tags'):
                    logger.warning(f"LLM returned incomplete data: {json.dumps(response)}")
                    llm_error = "Incomplete LLM response"
                    return
                
                # Success path
                llm_result.update(response)
                thread_completed = True
                
            except Exception as e:
                llm_error = str(e)
                logger.error(f"Error in LLM thread: {llm_error}")

        # Run in thread with timeout
        llm_thread = threading.Thread(target=_generate_llm_content_thread)
        llm_thread.daemon = True  # Allow thread to be killed when lambda exits
        llm_thread.start()
        llm_thread.join(timeout=timeout)

        # Check for timeout
        if llm_thread.is_alive():
            logger.warning(f"LLM generation timed out after {timeout} seconds on attempt {retry_attempt+1}")
            # Continue to next retry
            continue
            
        # Check for success
        if thread_completed and llm_result.get('title') and llm_result.get('tags'):
            logger.info(f"LLM generation successful on attempt {retry_attempt+1}")
            break
            
        # If we got here, the thread completed but with errors or empty results
        logger.warning(f"LLM attempt {retry_attempt+1} failed: {llm_error or 'Unknown error'}")
        # Continue to next retry
    
    # Check if we have valid content after all retries
    if not llm_result.get('title') or not llm_result.get('tags'):
        logger.error(f"LLM generation failed after {max_retries} attempts")
        raise ValueError(f"Failed to generate content with LLM after {max_retries} attempts")
    
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