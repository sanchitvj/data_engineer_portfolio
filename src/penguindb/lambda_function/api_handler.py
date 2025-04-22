import json
import boto3
import os
import logging
import datetime
import uuid
from penguindb.utils.content_processing_utils import ErrorTypes, create_error_response, validate_field_types

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sqs = boto3.client('sqs')
SQS_QUEUE_URL = os.environ.get('SQS_QUEUE_URL')

def lambda_handler(event, context):
    """
    Lambda handler for API Gateway requests.
    Validates the request and sends a message to SQS.
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extra debugging to see exactly what we're getting
        logger.info(f"Event type: {type(event).__name__}")
        if isinstance(event, dict):
            for k, v in event.items():
                logger.info(f"Key: {k}, Type: {type(v).__name__}")
                
        # Handle various API Gateway integration types
        body = None
        
        # Case 1: Direct JSON payload (non-proxy integration)
        if 'content_id' in event:
            body = event
            
        # Case 2: Standard proxy integration (body as string)
        elif 'body' in event and event['body']:
            try:
                if isinstance(event['body'], str):
                    body = json.loads(event['body'])
                else:
                    body = event['body']
            except json.JSONDecodeError:
                logger.error(f"Failed to parse request body: {event['body']}")
                return create_error_response(ErrorTypes.VALIDATION_ERROR, "Invalid JSON in request body")
                
        # Case 3: API Gateway test invocation
        elif all(k in event for k in ['path', 'httpMethod', 'headers']):
            # This is likely an API Gateway test without a body
            logger.warning("Received API Gateway test event without valid body")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing request body. Please provide a valid JSON payload with content_id.'
                }),
                'headers': {'Content-Type': 'application/json'}
            }
            
        # Case 4: Direct Lambda invocation with test data
        elif 'key1' in event and 'key2' in event:
            logger.warning("Received test invocation, not a real request")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'This is a test invocation. For real requests, please include content_id.'
                }),
                'headers': {'Content-Type': 'application/json'}
            }
            
        # No valid payload found
        if not body:
            logger.error("Could not determine request body format")
            return create_error_response(
                ErrorTypes.VALIDATION_ERROR, 
                "Invalid request format. Please ensure you're sending a JSON object with content_id."
            )
        
        logger.info(f"Parsed request body: {json.dumps(body)}")
        
        # Validate required fields
        required_fields = ['content_id']
        for field in required_fields:
            if field not in body or not body[field]:
                logger.error(f"Missing required field: {field}")
                return create_error_response(ErrorTypes.VALIDATION_ERROR, f"Missing required field: {field}")
        
        # Validate field types
        validation_error = validate_field_types(body)
        if validation_error:
            logger.error(f"Validation error: {validation_error}")
            return create_error_response(ErrorTypes.VALIDATION_ERROR, validation_error)
        
        # Add timestamp
        body['timestamp'] = datetime.datetime.now().isoformat()
        
        # Send message to SQS
        message_attributes = {}
        
        # For FIFO queues, make sure we have a MessageGroupId
        if SQS_QUEUE_URL and SQS_QUEUE_URL.endswith('.fifo'):
            message_group_id = body.get('content_id', str(uuid.uuid4()))
        else:
            message_group_id = None
        
        try:
            message_body = json.dumps(body)
            
            sqs_params = {
                'QueueUrl': SQS_QUEUE_URL,
                'MessageBody': message_body,
                'MessageAttributes': message_attributes
            }
            
            if message_group_id:
                sqs_params['MessageGroupId'] = message_group_id
                
            response = sqs.send_message(**sqs_params)
            logger.info(f"Message sent to SQS: {response['MessageId']}")
            
            # Return a success response
            return {
                'statusCode': 202,
                'body': json.dumps({
                    'message': 'Request accepted for processing',
                    'content_id': body['content_id'],
                    'message_id': response['MessageId']
                }),
                'headers': {
                    'Content-Type': 'application/json'
                }
            }
            
        except Exception as e:
            logger.error(f"Error sending message to SQS: {str(e)}")
            return create_error_response(ErrorTypes.SERVICE_ERROR, f"Failed to queue message: {str(e)}")
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_error_response(ErrorTypes.SERVICE_ERROR, f"Unexpected error: {str(e)}") 