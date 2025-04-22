import json
import boto3
import os
import logging
import sys
import traceback
from datetime import datetime

from penguindb.utils.content_processing_utils import (
    validate_field_types,
    prepare_data_for_dynamodb,
    generate_content_with_llm
)

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')
LLM_MODEL = os.environ.get('LLM_MODEL', 'us.anthropic.claude-3-5-haiku-20241022-v1:0')

# Initialize clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)
cloudwatch = boto3.client('cloudwatch')

# Function to publish metrics to CloudWatch
def publish_metric(metric_name, value, unit='Count', dimensions=None):
    """
    Publish a metric to CloudWatch.
    
    Args:
        metric_name: Name of the metric
        value: Value of the metric
        unit: Unit of the metric (default: Count)
        dimensions: Optional dimensions for the metric
    """
    try:
        metric_data = {
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit
        }
        
        if dimensions:
            metric_data['Dimensions'] = dimensions
            
        cloudwatch.put_metric_data(
            Namespace='PenguinDB/ContentProcessing',
            MetricData=[metric_data]
        )
        logger.debug(f"Published metric {metric_name}: {value} {unit}")
    except Exception as e:
        logger.warning(f"Failed to publish metric {metric_name}: {str(e)}")
        # Non-critical operation, don't raise exception

# Debug import paths
def debug_imports():
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Python path: {sys.path}")
    logger.info(f"Current directory: {os.getcwd()}")
    logger.info(f"Directory contents: {os.listdir('.')}")
    
    # Try imports with try/except to see what's failing
    try:
        # Use importlib to check if module exists without triggering linter warnings
        import importlib
        spec = importlib.util.find_spec('penguindb.utils.content_processing_utils')
        if spec is not None:
            logger.info("penguindb.utils.content_processing_utils module found")
        else:
            logger.error("penguindb.utils.content_processing_utils module NOT found")
    except ImportError as e:
        logger.error(f"Failed to import from penguindb.utils: {str(e)}")
        logger.error(traceback.format_exc())

def lambda_handler(event, context):
    """
    Process messages from SQS queue.
    """
    # Debug logging on every invocation
    logger.info(f"SQS Worker received event: {json.dumps(event)}")
    
    # Run import diagnostics on cold start
    debug_imports()
    
    try:
        # Process SQS messages
        if 'Records' not in event:
            logger.error("Event does not contain Records. Not an SQS event?")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Not a valid SQS event',
                    'event_keys': list(event.keys())
                })
            }
        
        # Track failures for batch item failure reporting (if enabled)
        failed_message_ids = []
        
        # Collect content_ids for batch status checking
        successful_content_ids = []

        # Track metrics
        record_count = len(event.get('Records', []))
        success_count = 0
        llm_error_count = 0
        db_error_count = 0
        
        # Publish initial metrics
        publish_metric('RecordsReceived', record_count)

        for record in event.get('Records', []):
            message_id = record.get('messageId', 'N/A')
            receipt_handle = record.get('receiptHandle', 'N/A')
            content_id = 'UNKNOWN_ID'  # Default

            try:
                # Log the raw record first
                logger.info(f"Processing SQS record: {json.dumps(record)}")
                
                # Extract and parse the message body
                message_body = record.get('body')
                if not message_body:
                    logger.error("Missing message body in SQS record")
                    continue
                    
                logger.info(f"Message body: {message_body}")
                
                # Parse JSON body
                try:
                    body = json.loads(message_body)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse message body as JSON: {str(e)}")
                    continue
                
                # Log parsed body
                logger.info(f"Parsed body: {json.dumps(body)}")
                
                # Validate the required fields are present
                content_id = body.get('content_id')
                if not content_id:
                    logger.error("Missing content_id in message body")
                    continue
                
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
                        model=LLM_MODEL,
                        description=body.get('description', ''),
                        tags=body.get('tags', ''),
                        logger=logger,
                        timeout=120  # 2 minute timeout
                    )

                    body['generated_title'] = llm_result.get('title', '')
                    body['generated_description'] = llm_result.get('description', '')
                    body['generated_tags'] = llm_result.get('tags', [])

                    logger.info(f"SQS Worker - Generated content for {content_id}")
                    
                    # Check if we got meaningful content from LLM
                    has_content = bool(body['generated_title'] or body['generated_tags'])
                    
                    # Track LLM success/failure
                    if has_content:
                        publish_metric('LLMSuccess', 1)
                    else:
                        publish_metric('LLMEmptyResult', 1)
                        llm_error_count += 1
                        
                except Exception as llm_error:
                    logger.error(f"SQS Worker - LLM error for {content_id}: {str(llm_error)}")
                    # Continue with empty content rather than failing
                    body['generated_title'] = ''
                    body['generated_description'] = ''
                    body['generated_tags'] = []
                    
                    # Track LLM errors
                    publish_metric('LLMError', 1)
                    llm_error_count += 1

                # Prepare and store data in DynamoDB
                try:
                    # First make a regular item with content_id as plain string
                    item_for_dynamodb = {
                        'content_id': content_id,  # Keep this as a plain string
                    }
                    
                    # Prepare the attribute data with proper DynamoDB types
                    dynamodb_attributes = prepare_data_for_dynamodb(body)
                    
                    # Remove content_id from the attributes (it's already in the main item)
                    if 'content_id' in dynamodb_attributes:
                        del dynamodb_attributes['content_id']
                    
                    # Add all the properly formatted attributes
                    for key, value in dynamodb_attributes.items():
                        item_for_dynamodb[key] = value
                    
                    # Log the item being written for debugging
                    logger.info(f"Writing to DynamoDB: {json.dumps(item_for_dynamodb, default=str)}")
                    
                    # Simplified existing record check that avoids errors
                    is_update = False
                    try:
                        # Just check if we can scan for this content_id
                        response = table.scan(
                            FilterExpression=boto3.dynamodb.conditions.Key('content_id').eq(content_id),
                            Limit=1
                        )
                        is_update = len(response.get('Items', [])) > 0
                        logger.info(f"Found existing record for {content_id}: {is_update}")
                    except Exception as check_error:
                        logger.warning(f"SQS Worker - Error checking for existing item {content_id}: {str(check_error)}")
                        logger.warning(traceback.format_exc())
                    
                    # Write to DynamoDB
                    table.put_item(Item=item_for_dynamodb)
                    
                    status = "updated" if is_update else "created"
                    logger.info(f"SQS Worker - Successfully {status} item {content_id} in DynamoDB")
                    
                    # Add to the list of successful content_ids for batch status checking
                    successful_content_ids.append(content_id)
                    success_count += 1
                    
                    # Track successful writes to DynamoDB
                    publish_metric('DynamoDBSuccess', 1)

                except Exception as db_error:
                    logger.error(f"SQS Worker - Database error for {content_id}: {str(db_error)}")
                    logger.error(traceback.format_exc())
                    
                    # Track DynamoDB errors
                    publish_metric('DynamoDBError', 1)
                    db_error_count += 1
                    
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

        # Process all successful content_ids in a single batch if there are any
        if successful_content_ids:
            try:
                # Wait a few seconds to allow DynamoDB to reach consistency
                import time
                time.sleep(5)  # 5 second delay
                
                # Initialize Lambda client
                lambda_client = boto3.client('lambda')
                
                # Get the status checker Lambda name or ARN from environment variable
                status_checker_function = os.environ.get('STATUS_CHECKER_FUNCTION', 'status_checker')
                
                # Prepare batch payload with all content_ids
                checker_payload = {
                    'content_ids': successful_content_ids
                }
                
                # Log the batch invocation
                logger.info(f"Invoking status checker for batch of {len(successful_content_ids)} items: {successful_content_ids}")
                
                # Invoke status checker Lambda asynchronously
                response = lambda_client.invoke(
                    FunctionName=status_checker_function,
                    InvocationType='Event',  # Asynchronous
                    Payload=json.dumps(checker_payload)
                )
                
                # Check if the invocation was successful
                status_code = response.get('StatusCode')
                if status_code == 202:  # 202 Accepted indicates successful async invocation
                    logger.info(f"Successfully triggered status_checker Lambda for batch of {len(successful_content_ids)} items")
                    
                    # Track successful status checker invocation
                    publish_metric('StatusCheckerInvoked', 1)
                    publish_metric('ItemsSubmittedForStatusCheck', len(successful_content_ids))
                else:
                    logger.error(f"Unexpected status code from Lambda invoke: {status_code}")
                    logger.error(f"Response: {response}")
                    
                    # Track failed status checker invocation
                    publish_metric('StatusCheckerError', 1)
                    
            except Exception as trigger_error:
                logger.error(f"Failed to trigger status_checker batch: {str(trigger_error)}")
                logger.error(traceback.format_exc())
                
                # Track error
                publish_metric('StatusCheckerInvocationError', 1)
        else:
            logger.info("No successful items to update status for")

        # Publish final summary metrics
        publish_metric('ProcessingSuccessCount', success_count)
        publish_metric('ProcessingErrorCount', len(failed_message_ids))
        publish_metric('LLMErrorCount', llm_error_count)
        publish_metric('DynamoDBErrorCount', db_error_count)
        
        if record_count > 0:
            success_rate = (success_count / record_count) * 100
            publish_metric('ProcessingSuccessRate', success_rate, 'Percent')

        # If using batch item failures reporting
        if failed_message_ids:
            logger.warning(f"SQS Worker - Failed to process {len(failed_message_ids)} messages")
            # Uncomment if you configure your Lambda trigger to use batch item failure reporting
            # return {'batchItemFailures': [{'itemIdentifier': msg_id} for msg_id in failed_message_ids]} 

        # Return success
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {len(event.get("Records", []))} messages, updated {len(successful_content_ids)} items'
            })
        }
            
    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f'Unexpected error: {str(e)}'
            })
        } 