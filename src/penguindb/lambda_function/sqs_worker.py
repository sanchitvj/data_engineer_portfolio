import json
import boto3
from datetime import datetime
import logging
import traceback
import os

from penguindb.utils.content_processing_utils import (
    validate_field_types,
    prepare_data_for_dynamodb,
    generate_content_with_llm
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')

# Initialize clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event, context):
    """
    SQS triggered Lambda that processes content items asynchronously.
    Handles LLM generation and DynamoDB storage.
    """
    logger.info(f"SQS Worker - Received event with {len(event.get('Records', []))} records")

    # Track failures for batch item failure reporting (if enabled)
    failed_message_ids = []

    for record in event.get('Records', []):
        message_id = record.get('messageId', 'N/A')
        receipt_handle = record.get('receiptHandle', 'N/A')
        content_id = 'UNKNOWN_ID'  # Default

        try:
            # Parse the message body
            body = json.loads(record['body'])
            content_id = body.get('content_id', 'UNKNOWN_ID_FROM_BODY')
            logger.info(f"SQS Worker - Processing message {message_id} for content_id: {content_id}")

            # Validate field types
            validation_errors = validate_field_types(body)
            if validation_errors:
                logger.error(f"SQS Worker - Validation error for {content_id}: {validation_errors}")
                raise ValueError(f"Validation failed: {validation_errors}")  # Will trigger retry/DLQ

            # Add processing metadata
            body['sqs_message_id'] = message_id
            body['sqs_receipt_handle'] = receipt_handle
            body['worker_request_id'] = context.aws_request_id
            # body['processed_by'] = context.function_name
            body['processed_at'] = datetime.now().isoformat()

            # Generate content with LLM
            try:
                # Pass logger to the utility function
                llm_result = generate_content_with_llm(
                    content_type=body.get('content_type', ''),
                    description=body.get('description', ''),
                    tags=body.get('tags', ''),
                    logger=logger,
                    timeout=120  # 2 minute timeout
                )

                body['generated_title'] = llm_result.get('title', '')
                body['generated_description'] = llm_result.get('description', '')
                body['generated_tags'] = llm_result.get('tags', [])

                logger.info(f"SQS Worker - Generated content for {content_id}")
            except Exception as llm_error:
                logger.error(f"SQS Worker - LLM error for {content_id}: {str(llm_error)}")
                # Continue with empty content rather than failing
                body['generated_title'] = ''
                body['generated_description'] = ''
                body['generated_tags'] = []

            # Prepare and store data in DynamoDB
            try:
                # Prepare data
                prepared_body = prepare_data_for_dynamodb(body)

                # Check if record exists (for logging)
                is_update = False
                try:
                    existing_item = table.get_item(Key={'content_id': content_id})
                    is_update = 'Item' in existing_item
                except Exception as check_error:
                    logger.warning(f"SQS Worker - Error checking for existing item {content_id}: {str(check_error)}")
                
                # Write to DynamoDB
                table.put_item(Item=prepared_body)
                
                status = "updated" if is_update else "created"
                logger.info(f"SQS Worker - Successfully {status} item {content_id} in DynamoDB")
                
            except Exception as db_error:
                logger.error(f"SQS Worker - Database error for {content_id}: {str(db_error)}")
                # Since this is a critical operation, we re-raise to trigger SQS retry/DLQ
                raise db_error

        except Exception as e:
            # Log the error
            trace = traceback.format_exc()
            logger.error(f"SQS Worker - Failed to process record {message_id} for {content_id}: {str(e)}\n{trace}")
            
            # Track the failure
            failed_message_ids.append(message_id)
            
            # Re-raise for standard Lambda-SQS retry behavior
            raise e

    # If using batch item failures reporting
    if failed_message_ids:
        logger.warning(f"SQS Worker - Failed to process {len(failed_message_ids)} messages")
        # Uncomment if you configure your Lambda trigger to use batch item failure reporting
        # return {'batchItemFailures': [{'itemIdentifier': msg_id} for msg_id in failed_message_ids]} 