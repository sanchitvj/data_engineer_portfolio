import json
import boto3
import uuid
from datetime import datetime
import logging
import traceback

from penguindb.utils.llm_client import call_claude

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Define error types
class ErrorTypes:
    VALIDATION_ERROR = "ValidationError"
    DATABASE_ERROR = "DatabaseError"
    INTERNAL_ERROR = "InternalError"
    AUTHENTICATION_ERROR = "AuthenticationError"

def lambda_handler(event, context):
    """
    Main Lambda handler function with comprehensive error handling.
    
    Args:
        event: The event from API Gateway
        context: The Lambda context
        
    Returns:
        A response object with statusCode and body
    """
    try:
        # Log the incoming event
        logger.info(f"Processing event: {json.dumps(event)}")
        
        # Parse input from API Gateway
        try:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        except (KeyError, json.JSONDecodeError) as e:
            return create_error_response(
                400,
                ErrorTypes.VALIDATION_ERROR,
                f"Invalid request body: {str(e)}"
            )
        
        # Validate required fields
        required_fields = ['content_type', 'description', 'url']
        missing_fields = [field for field in required_fields if field not in body or not body[field]]
        
        if missing_fields:
            return create_error_response(
                400,
                ErrorTypes.VALIDATION_ERROR,
                f"Missing required fields: {', '.join(missing_fields)}"
            )
            
        # Validate field types
        validation_errors = validate_field_types(body)
        if validation_errors:
            return create_error_response(
                400,
                ErrorTypes.VALIDATION_ERROR,
                f"Field validation errors: {validation_errors}"
            )

        # Add metadata
        try:
            # Generate ID if not provided
            if 'id' not in body or not body['id']:
                body['id'] = str(uuid.uuid4())
            
            # Add timestamp if not present
            if 'timestamp' not in body:
                body['timestamp'] = datetime.now().isoformat()
                
            # Add processing metadata
            body['processed_at'] = datetime.now().isoformat()
            body['processed_by'] = context.function_name
            body['aws_request_id'] = context.aws_request_id
        except Exception as e:
            logger.error(f"Error adding metadata: {str(e)}")
            return create_error_response(
                500,
                ErrorTypes.INTERNAL_ERROR,
                f"Error preparing data: {str(e)}"
            )
        
        # Generate content using Claude LLM
        try:
            llm_generated = generate_content_with_llm(
                content_type=body.get('content_type', ''),
                description=body.get('description', ''),
                tags=body.get('tags', '')
            )
            
            # Add the generated content to the body
            body['generated_title'] = llm_generated.get('title', '')
            body['generated_description'] = llm_generated.get('description', '')
            body['generated_tags'] = llm_generated.get('tags', '')
            
            logger.info(f"Generated content: {json.dumps(llm_generated)}")
        except Exception as llm_error:
            logger.error(f"Error generating content with LLM: {str(llm_error)}")
            # Continue processing even if LLM fails
        
        # Write to DynamoDB with proper error handling
        try:
            # Initialize DynamoDB client
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table('LinkedInContent')
            
            # Write to DynamoDB
            table.put_item(Item=body)
            
            logger.info(f"Successfully wrote item {body['id']} to DynamoDB")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data successfully processed',
                    'id': body['id'],
                    'timestamp': body['timestamp'],
                    'generated_title': body.get('generated_title', ''),
                    'generated_description': body.get('generated_description', ''),
                    'generated_tags': body.get('generated_tags', '')
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }
        except boto3.exceptions.Boto3Error as e:
            logger.error(f"DynamoDB error: {str(e)}")
            return create_error_response(
                500,
                ErrorTypes.DATABASE_ERROR,
                f"Database error: {str(e)}"
            )
            
    except Exception as e:
        # Catch any unexpected errors
        trace = traceback.format_exc()
        logger.error(f"Unexpected error: {str(e)}\n{trace}")
        return create_error_response(
            500,
            ErrorTypes.INTERNAL_ERROR,
            f"Internal server error: {str(e)}"
        )

def validate_field_types(body):
    """
    Validate the types of fields in the request body.
    
    Args:
        body: The request body to validate
        
    Returns:
        A string with validation errors or None if validation passes
    """
    errors = []
    
    # Check content_type
    if 'content_type' in body and not isinstance(body['content_type'], str):
        errors.append("content_type must be a string")
    
    # Check description
    if 'description' in body and not isinstance(body['description'], str):
        errors.append("description must be a string")
    
    # Check url
    if 'url' in body and not isinstance(body['url'], str):
        errors.append("url must be a string")
    
    # Check tags (should be a string for comma-separated values)
    if 'tags' in body and body['tags'] and not isinstance(body['tags'], str):
        errors.append("tags must be a comma-separated string")
    
    return "; ".join(errors) if errors else None


def create_error_response(status_code, error_type, message):
    """
    Create a standardized error response.
    
    Args:
        status_code: HTTP status code
        error_type: Type of error (from ErrorTypes)
        message: Error message
        
    Returns:
        A formatted error response object
    """
    logger.error(f"{error_type}: {message}")
    
    return {
        'statusCode': status_code,
        'body': json.dumps({
            'error': {
                'type': error_type,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
        }),
        'headers': {
            'Content-Type': 'application/json'
        }
    }

def generate_content_with_llm(content_type, description, tags):
    """
    Generate title, description, and additional tags using Claude LLM via our utility
    
    Args:
        content_type (str): Type of content (post, article, substack)
        description (str): Original content description
        tags (str): Comma-separated tags
        
    Returns:
        dict: Generated title, description, and additional tags
    """
    try:
        # Prepare prompt based on content type
        word_count = "10-15" if content_type.lower() == "post" else "15-20"
        
        prompt = f"""
        Content Type: {content_type}
        Original Description: {description}
        Original Tags: {tags}
        
        Based on the above content, please generate the following:
        
        1. A concise title (3-6 words)
        2. A small description ({word_count} words)
        3. Additional relevant keyword tags that could improve search functionality
        
        Format your response as a JSON object with keys: title, description, tags
        """
        
        # Call our generic LLM client
        result = call_claude(
            prompt=prompt,
            model_id="us.anthropic.claude-3-5-haiku-20241022-v1:0",
            extract_json=True,
            max_tokens=1500
        )
        
        # Check for errors from LLM call
        if "error" in result:
            logger.warning(f"LLM response contained an error: {result.get('error')}")
            # If we have raw response but JSON extraction failed, use fallback
            if "raw_response" in result:
                logger.info(f"Raw LLM response: {result.get('raw_response')}")
                
            # Return fallback values
            return {
                "title": "Generated Title",
                "description": "Generated Description",
                "tags": "additional, tags"
            }
            
        logger.info(f"LLM Response: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in generate_content_with_llm: {str(e)}")
        # Return default values in case of error
        return {
            "title": "Generated Title",
            "description": "Generated Description",
            "tags": "additional, tags"
        } 