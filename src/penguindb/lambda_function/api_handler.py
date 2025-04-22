import json
import boto3
import os
import logging
import datetime
import uuid
from src.penguindb.utils.content_processing_utils import ErrorTypes, create_error_response, validate_field_types

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize SQS client
sqs = boto3.client('sqs')
SQS_QUEUE_URL = os.environ.get('SQS_QUEUE_URL')

def lambda_handler(event, context):
    """
    Lambda handler for API Gateway requests.
    Validates the request and sends a message to SQS.
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Check if this is a direct integration or proxy integration
        if 'body' in event:
            # This is a proxy integration
            try:
                # Handle proxy integration (body is a string)
                if isinstance(event['body'], str):
                    body = json.loads(event['body'])
                else:
                    body = event['body']
            except json.JSONDecodeError:
                logger.error(f"Failed to parse request body: {event['body']}")
                return create_error_response(ErrorTypes.VALIDATION_ERROR, "Invalid JSON in request body")
        else:
            # This is a direct integration - event is the actual payload
            body = event
        
        logger.info(f"Parsed request body: {json.dumps(body)}")
        
        # Validate required fields
        required_fields = ['content_id', 'media_link']
        for field in required_fields:
            if field not in body:
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