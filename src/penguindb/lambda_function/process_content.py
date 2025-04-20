import json
import boto3
import uuid
from datetime import datetime
import logging

from penguindb.utils.llm_client import call_claude

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        # Parse input from API Gateway
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        logger.info(f"Received data: {json.dumps(body)}")
        
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('LinkedInContent')  # Use your table name
        
        # Generate ID if not provided
        if 'id' not in body or not body['id']:
            body['id'] = str(uuid.uuid4())
        
        # Add timestamp if not present
        if 'timestamp' not in body:
            body['timestamp'] = datetime.now().isoformat()
        
        # Validate required fields
        required_fields = ['content_type', 'description', 'url']
        for field in required_fields:
            if field not in body or not body[field]:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'message': f'Missing required field: {field}'
                    })
                }
        
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
        
        # Write to DynamoDB
        response = table.put_item(Item=body)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data successfully processed',
                'id': body['id'],
                'generated_title': body.get('generated_title', ''),
                'generated_description': body.get('generated_description', ''),
                'generated_tags': body.get('generated_tags', '')
            })
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Error processing data: {str(e)}'
            })
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
            extract_json=True,
            max_tokens=1000
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