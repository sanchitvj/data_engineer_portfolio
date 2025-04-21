"""
Shared utility functions for content processing Lambdas.
Contains validation, data preparation, error handling, and LLM functions.
"""
import json
from datetime import datetime
import logging
import threading

# Import LLM client with fallback
try:
    from penguindb.utils.llm_client import call_claude
except ImportError:
    logging.warning("Could not import call_claude from penguindb.utils.llm_client. LLM features will be disabled.")
    # Define a dummy function if import fails
    def call_claude(*args, **kwargs):
        logging.error("call_claude is not available.")
        return {"error": "LLM client not imported"}

# Error type classes
class ErrorTypes:
    VALIDATION_ERROR = "ValidationError"
    DATABASE_ERROR = "DatabaseError"
    INTERNAL_ERROR = "InternalError"
    QUEUE_ERROR = "QueueError"
    AUTHENTICATION_ERROR = "AuthenticationError"

def create_error_response(status_code, error_type, message, logger):
    """
    Create a standardized error response for API Gateway.
    
    Args:
        status_code: HTTP status code
        error_type: Error type from ErrorTypes class
        message: Error message
        logger: Logger instance
    
    Returns:
        Dictionary with format expected by API Gateway
    """
    logger.error(f"Error: {error_type} - {message}")
    return {
        'statusCode': status_code,
        'body': json.dumps({
            'error': {
                'type': error_type,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
        }),
        'headers': {'Content-Type': 'application/json'}
    }

def validate_field_types(body):
    """
    Validate the types of fields in the request body.
    
    Args:
        body: Request body dictionary
    
    Returns:
        String with error messages or None if validation passes
    """
    errors = []
    if 'content_type' in body and not isinstance(body['content_type'], str):
        errors.append("content_type must be a string")
    if 'description' in body and not isinstance(body['description'], str):
        errors.append("description must be a string")
    if 'url' in body and not isinstance(body['url'], str):
        errors.append("url must be a string")
    if 'tags' in body and body['tags'] and not isinstance(body['tags'], (str, list)):
        errors.append("tags must be a comma-separated string or list")
    if 'media_link' in body and body['media_link'] and not isinstance(body['media_link'], (str, list)):
        errors.append("media_link must be a comma-separated string or list")
    if 'generated_tags' in body and body['generated_tags'] and not isinstance(body['generated_tags'], list):
        pass  # Handled during processing
    return "; ".join(errors) if errors else None

def prepare_data_for_dynamodb(body):
    """
    Prepare data for DynamoDB, converting fields to Sets and cleaning data.
    
    Args:
        body: Request body dictionary to prepare
    
    Returns:
        Modified body ready for DynamoDB
    """
    # Create a copy to avoid modifying the original
    prepared_body = body.copy()
    
    # Convert comma-separated strings or lists to sets for tags fields
    for field in ['tags', 'media_link', 'generated_tags']:
        if field in prepared_body and prepared_body[field]:
            value = prepared_body[field]
            processed_set = set()
            
            if isinstance(value, str):
                # Split comma-separated string and clean values
                processed_set = set(item.strip() for item in value.split(',') if item.strip())
            elif isinstance(value, list):
                # Convert list to set with string conversion
                processed_set = set(str(item).strip() for item in value if str(item).strip())

            # Only keep the field if the set has values
            if processed_set:
                prepared_body[field] = processed_set
            else:
                # Remove empty sets
                if field in prepared_body:
                    del prepared_body[field]

    # Remove transient fields not meant for persistent storage
    transient_fields = [
        'sqs_message_id', 'sqs_receipt_handle', 'api_request_id', 
        'received_at', 'rowIndex'
    ]
    for field in transient_fields:
        prepared_body.pop(field, None)

    # Remove empty strings (DynamoDB doesn't allow them by default)
    keys_to_delete = [k for k, v in prepared_body.items() if v == ""]
    for k in keys_to_delete:
        del prepared_body[k]

    return prepared_body

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
    3. Exactly 3 tags that would help this content reach the right audience - be specific rather than generic.

    My writing style is straightforward with occasional humor. I prefer active voice and concrete examples over abstract concepts. I sometimes use short sentences for emphasis.

    Return as JSON with keys: title, description, tags (array of 3 strings)
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