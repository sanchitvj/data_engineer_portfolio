import json
import boto3
from datetime import datetime
import logging
import traceback
import os

# Import utility functions
from penguindb.utils.content_processing_utils import (
    ErrorTypes, 
    create_error_response, 
)

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
SQS_QUEUE_URL = os.environ.get('SQS_QUEUE_URL')  # Required: Set in Lambda Environment

# Initialize clients
sqs_client = boto3.client('sqs')

def lambda_handler(event, context):
    """
    API Gateway handler that validates the request and sends it to SQS for asynchronous processing.
    Returns a 202 Accepted response with the message ID.
    """
    if not SQS_QUEUE_URL:
        return create_error_response(500, ErrorTypes.INTERNAL_ERROR, 
                                    "SQS_QUEUE_URL environment variable not set.", logger)

    try:
        logger.info("API Handler - Received event from API Gateway")

        # Parse input
        try:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        except (KeyError, json.JSONDecodeError) as e:
            return create_error_response(400, ErrorTypes.VALIDATION_ERROR, 
                                        f"Invalid request body: {str(e)}", logger)

        # Validate required fields
        required_fields = ['content_id', 'content_type', 'description', 'url']
        missing_fields = [field for field in required_fields if field not in body or not body[field]]
        if missing_fields:
            return create_error_response(400, ErrorTypes.VALIDATION_ERROR, 
                                        f"Missing required fields: {', '.join(missing_fields)}", logger)

        # Validate content_id
        content_id = body.get('content_id')
        if not content_id:
            return create_error_response(400, ErrorTypes.VALIDATION_ERROR, 
                                        "Missing required field: 'content_id'", logger)
        
        logger.info(f"API Handler - Processing request for content_id: {content_id}")

        # Add timestamps
        if 'timestamp' not in body:
            body['timestamp'] = datetime.now().isoformat()
            
        body['received_at'] = datetime.now().isoformat()
        body['api_request_id'] = context.aws_request_id

        # Send to SQS Queue
        try:
            # Prepare SQS message args
            send_args = {
                'QueueUrl': SQS_QUEUE_URL,
                'MessageBody': json.dumps(body),
                'MessageAttributes': {}  # Can be used for filtering if needed
            }
            
            # Add MessageGroupId for FIFO queues
            if SQS_QUEUE_URL.endswith('.fifo'):
                send_args['MessageGroupId'] = content_id
                # For FIFO content-based deduplication, you might need MessageDeduplicationId
                # send_args['MessageDeduplicationId'] = f"{content_id}-{body['timestamp']}"

            # Send message to SQS
            sqs_response = sqs_client.send_message(**send_args)
            message_id = sqs_response.get('MessageId')
            
            logger.info(f"API Handler - Successfully queued content_id {content_id}, SQS message ID: {message_id}")

        except Exception as e:
            logger.error(f"API Handler - Error sending to SQS: {str(e)}")
            return create_error_response(500, ErrorTypes.QUEUE_ERROR, 
                                        f"Failed to queue request: {str(e)}", logger)

        # Return 202 Accepted response
        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': 'Request accepted for processing',
                'content_id': content_id,
                'message_id': message_id
            }),
            'headers': {'Content-Type': 'application/json'}
        }

    except Exception as e:
        trace = traceback.format_exc()
        logger.error(f"API Handler - Unexpected error: {str(e)}\n{trace}")
        return create_error_response(500, ErrorTypes.INTERNAL_ERROR, 
                                    f"Internal server error: {str(e)}", logger) 