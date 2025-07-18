# src/penguindb/lambda_function/llm_worker.py
import json
import boto3
import os
import logging
import traceback
from datetime import datetime
import requests
import time
import threading
import queue

from penguindb.utils.content_processing_utils import (
    generate_content_with_llm,
)

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data') # Ensure this is set
LLM_MODEL = os.environ.get('LLM_MODEL', 'us.anthropic.claude-3-5-haiku-20241022-v1:0')
GOOGLE_SHEET_URL = os.environ.get('GOOGLE_SHEET_URL') # Needed for final status update

# AWS Clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# Queue for async sheet updates
sheet_update_queue = queue.Queue()

# --- Reusable Sheet Update Logic (Adapted from status_checker.py) ---
def update_sheet_final_status(content_id, status, llm_result=None, error_message=None):
    """Updates the Google Sheet status to PROCESSED or LLM_ERROR."""
    if not GOOGLE_SHEET_URL:
        logger.warning("GOOGLE_SHEET_URL not configured, skipping final sheet status update.")
        return False

    try:
        # Convert status to lowercase to match what the Apps Script expects
        # Apps Script expects "processed" but Lambda sends "PROCESSED"
        normalized_status = status.lower() if isinstance(status, str) else status
        
        payload = {
            'action': 'updateStatus',
            'content_id': content_id,
            'status': normalized_status, # Now using lowercase status
            'processed_at': datetime.now().isoformat()
        }
        # Add generated content details if successful
        if status == 'PROCESSED' and llm_result:
             if 'title' in llm_result:
                payload['generated_title'] = llm_result['title']
             # Include tags if needed by Apps Script (check Apps Script updateItemStatus)
             if 'tags' in llm_result:
                payload['generated_tags'] = llm_result['tags']
        # Add error details if failed
        elif status == 'LLM_ERROR' and error_message:
             payload['error_details'] = error_message[:500] # Limit error message length

        headers = {'Content-Type': 'application/json'}
        timeout = 15 # Longer timeout as it might do more work

        logger.info(f"Sending final status '{status}' update to Google Sheet for {content_id}")
        logger.info(f"Payload: {json.dumps(payload)}")
        response = requests.post(GOOGLE_SHEET_URL, json=payload, headers=headers, timeout=timeout)

        if response.status_code == 200:
            response_data = response.json()
            logger.info(f"Sheet update response: {response.text}")
            if response_data.get('status') == 'success':
                logger.info(f"Sheet status updated to {status} for {content_id}")
                return True
            else:
                logger.error(f"Google Apps Script returned error for {status} update: {response_data}")
                return False
        else:
            logger.error(f"HTTP error {response.status_code} updating sheet to {status}: {response.text}")
            return False
    except requests.RequestException as e:
        logger.error(f"Request exception updating sheet to {status} for {content_id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error updating sheet to {status} for {content_id}: {str(e)}")
        return False

def update_sheet_with_retry(content_id, status, llm_result=None, error_message=None, max_retries=3):
    """Updates sheet status with retries and exponential backoff."""
    for attempt in range(max_retries):
        try:
            success = update_sheet_final_status(content_id, status, llm_result, error_message)
            if success:
                return True
            time.sleep(2 ** attempt)  # Exponential backoff: 1, 2, 4 seconds
        except Exception as e:
            logger.warning(f"Sheet update attempt {attempt+1} failed for {content_id}: {str(e)}")
    
    logger.error(f"All {max_retries} attempts to update sheet for {content_id} failed")
    return False

def async_sheet_update(content_id, status, llm_result=None, error_message=None):
    """Queue a sheet status update to be performed asynchronously."""
    if not GOOGLE_SHEET_URL:
        return
    
    # Add update request to queue
    sheet_update_queue.put({
        'content_id': content_id,
        'status': status,
        'llm_result': llm_result,
        'error_message': error_message,
        'timestamp': datetime.now().isoformat()
    })
    
    # Start update thread if not already running
    update_thread = threading.Thread(target=process_sheet_updates)
    update_thread.daemon = True
    update_thread.start()
    
    logger.info(f"Queued sheet update for {content_id} with status {status}")

def process_sheet_updates():
    """Process queued sheet updates in background thread."""
    try:
        while not sheet_update_queue.empty():
            try:
                update = sheet_update_queue.get(block=False)
                logger.info(f"Processing queued sheet update for {update['content_id']}")
                
                success = update_sheet_with_retry(
                    update['content_id'],
                    update['status'],
                    update.get('llm_result'),
                    update.get('error_message')
                )
                
                if success:
                    logger.info(f"Async sheet update succeeded for {update['content_id']}")
                else:
                    logger.warning(f"Async sheet update failed for {update['content_id']} after retries")
                
                sheet_update_queue.task_done()
            except queue.Empty:
                break
            except Exception as e:
                logger.error(f"Error in sheet update thread: {str(e)}")
                # Continue processing other updates
    except Exception as e:
        logger.error(f"Fatal error in sheet update thread: {str(e)}")

def dynamodb_to_dict(dynamodb_item):
    """Converts a DynamoDB item (low-level format) to a standard Python dict."""
    from boto3.dynamodb.types import TypeDeserializer
    deserializer = TypeDeserializer()
    return {k: deserializer.deserialize(v) for k, v in dynamodb_item.items()}

def lambda_handler(event, context):
    """
    Processes DynamoDB Stream events (batches) to generate LLM content.
    """
    logger.info(f"LLM Worker received event with {len(event.get('Records', []))} records.")
    # logger.debug(f"Full event: {json.dumps(event)}") # Optional: Log full event for debug

    failed_record_sequences = [] # For potential partial batch failure reporting

    for record in event.get('Records', []):
        sequence_number = record.get('dynamodb', {}).get('SequenceNumber')
        try:
            # --- Process Stream Record ---
            if record.get('eventName') in ['INSERT', 'MODIFY']: # Only process new or modified items
                new_image = record.get('dynamodb', {}).get('NewImage')
                if not new_image:
                    logger.warning("No NewImage found in INSERT or MODIFY record, skipping.")
                    continue

                # Convert DynamoDB format to Python dict
                raw_item = dynamodb_to_dict(new_image)
                content_id = raw_item.get('content_id')

                # ENSURE content_id is a string here
                if content_id is not None and not isinstance(content_id, str):
                    content_id = str(content_id)

                if not content_id:
                    logger.error(f"Missing content_id in DynamoDB stream record: {json.dumps(raw_item)}")
                    continue

                if not raw_item.get('content_type'):
                    logger.error(f"Missing content_type for {content_id} - cannot update record with composite key")
                    if GOOGLE_SHEET_URL:
                        # Use async update with retry for sheet error
                        async_sheet_update(content_id, 'DB_UPDATE_ERROR', 
                                          error_message="Missing content_type for composite key")
                    continue

                logger.info(f"Processing content_id: {content_id} from stream")

                # Check if LLM fields already exist (e.g., from a previous partial run)
                if (raw_item.get('generated_title') and 
                    raw_item.get('generated_description') and 
                    raw_item.get('generated_tags')):
                     logger.info(f"All LLM fields already exist for {content_id}, skipping LLM generation.")
                     # Optionally, ensure sheet status is correct
                     if GOOGLE_SHEET_URL:
                         # Use async update with retry for existing item
                         async_sheet_update(content_id, 'PROCESSED', 
                                          {'title': raw_item.get('generated_title'), 'tags': raw_item.get('generated_tags')})
                     continue


                # --- Call LLM with Persistent Retries ---
                llm_result = None
                llm_error_message = None
                try:
                    llm_result = generate_content_with_llm(
                        content_type=raw_item.get('content_type', ''),
                        model=LLM_MODEL,
                        description=raw_item.get('description', ''),
                        tags=raw_item.get('tags', []), # Pass tags if they exist
                        logger=logger,
                        timeout=240, # 4 minutes timeout per attempt
                        max_retries=10, # Retry up to 10 times inside the function
                        # original_title=raw_item.get('title')  # Temporarily commented until deployment
                    )
                    logger.info(f"LLM generation successful for {content_id}")
                    # Debug: Log what the LLM actually returned
                    logger.info(f"LLM result fields: title='{llm_result.get('title')}', description='{llm_result.get('description')}', tags={llm_result.get('tags')}")

                except Exception as llm_error:
                    llm_error_message = f"LLM generation failed after retries: {str(llm_error)}"
                    logger.error(f"LLM Worker - {llm_error_message} for {content_id}")
                    # Update sheet status to LLM_ERROR
                    if GOOGLE_SHEET_URL:
                         # Use async update with retry for LLM error
                         async_sheet_update(content_id, 'LLM_ERROR', error_message=llm_error_message)
                    # We will let this record fail, potentially triggering DLQ
                    raise llm_error # Re-raise to indicate failure for this record
                # --- End LLM Call ---


                # --- Update DynamoDB with Generated Content ---
                if llm_result:
                    try:
                        # Print content_id details for debugging
                        logger.info(f"Content ID type: {type(content_id)}, Value: {content_id}")
                        
                        # Debug the table schema
                        try:
                            table_info = dynamodb.meta.client.describe_table(TableName=DYNAMODB_TABLE_NAME)
                            key_schema = table_info['Table']['KeySchema']
                            logger.info(f"Table key schema: {json.dumps(key_schema)}")
                        except Exception as e:
                            logger.error(f"Failed to get table schema: {str(e)}")
                        
                        update_expression_parts = []
                        expression_attribute_values = {}
                        expression_attribute_names = {} # Needed if using reserved words

                        fields_to_update = {
                            'generated_title': llm_result.get('title'),
                            'generated_description': llm_result.get('description'),
                            'generated_tags': llm_result.get('tags'),
                            'llm_processed_at': datetime.now().isoformat(),
                            'llm_retries_used': llm_result.get('retry_count', 0)
                        }

                        for i, (key, value) in enumerate(fields_to_update.items()):
                             # Only skip truly None values, but allow empty strings and empty lists
                             if value is not None:
                                 # Handle potential reserved words
                                 name_placeholder = f"#k{i}"
                                 value_placeholder = f":v{i}"
                                 expression_attribute_names[name_placeholder] = key
                                 update_expression_parts.append(f"{name_placeholder} = {value_placeholder}")
                                 expression_attribute_values[value_placeholder] = value
                                 logger.info(f"Adding field to update: {key} = {value}")


                        if update_expression_parts:
                            update_expression = "SET " + ", ".join(update_expression_parts)
                            logger.info(f"Updating DynamoDB for {content_id} with generated fields.")
                            # logger.debug(f"UpdateExpression: {update_expression}")
                            # logger.debug(f"ExpressionAttributeValues: {json.dumps(expression_attribute_values, default=str)}")
                            # logger.debug(f"ExpressionAttributeNames: {json.dumps(expression_attribute_names)}")

                            table.update_item(
                                Key={
                                    'content_id': content_id,
                                    'content_type': raw_item.get('content_type', '')  # Get content_type from raw_item
                                },
                                UpdateExpression=update_expression,
                                ExpressionAttributeValues=expression_attribute_values,
                                ExpressionAttributeNames=expression_attribute_names
                            )
                            logger.info(f"Successfully updated DynamoDB for {content_id}")

                            # --- Update Google Sheet Status to PROCESSED ---
                            if GOOGLE_SHEET_URL:
                                 # Use async update with retry for successful processing
                                 async_sheet_update(content_id, 'PROCESSED', llm_result)
                            # --- End Sheet Update ---

                        else:
                             logger.warning(f"No valid generated fields to update for {content_id}")
                             # Update sheet to error? Or leave as INGESTED? Let's mark error
                             if GOOGLE_SHEET_URL:
                                 # Use async update with retry for no valid fields
                                 async_sheet_update(content_id, 'LLM_ERROR', 
                                                  error_message="LLM returned no valid fields")

                    except Exception as db_update_error:
                        logger.error(f"Error updating DynamoDB for {content_id}: {str(db_update_error)}")
                        logger.error(traceback.format_exc())
                        # Update sheet to indicate DB update error
                        if GOOGLE_SHEET_URL:
                             # Use async update with retry for DB error
                             async_sheet_update(content_id, 'DB_UPDATE_ERROR', 
                                              error_message=str(db_update_error))
                        # Let this record fail
                        raise db_update_error
                # --- End DynamoDB Update ---

            else:
                 logger.info(f"Skipping event {record.get('eventName')} for record.")

        except Exception as record_error:
             logger.error(f"Failed to process record sequence {sequence_number}: {str(record_error)}")
             logger.error(traceback.format_exc())
             if sequence_number:
                  failed_record_sequences.append(sequence_number)
             # Continue processing other records in the batch if possible

    # --- Process any remaining sheet updates ---
    try:
        remaining_updates = sheet_update_queue.qsize()
        if remaining_updates > 0:
            logger.info(f"Processing {remaining_updates} remaining sheet updates")
            process_sheet_updates()
    except Exception as e:
        logger.error(f"Error processing remaining sheet updates: {str(e)}")

    # --- Handle Batch Failures (Optional but Recommended) ---
    # If using Lambda event source mapping with 'ReportBatchItemFailures: True'
    if failed_record_sequences:
         logger.warning(f"Reporting {len(failed_record_sequences)} failed records.")
         # Note: The actual sequence number might not be the right identifier
         # The event source mapping needs 'itemIdentifier' which is usually the SQS messageId
         # For DynamoDB streams, the identifier is the sequence number.
         # Check AWS docs for exact format if enabling this feature.
         # return {'batchItemFailures': [{'itemIdentifier': seq} for seq in failed_record_sequences]}
         # For now, we'll just log and let the whole batch potentially retry if errors occurred

    logger.info("LLM Worker batch processing complete.")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Batch processed successfully (individual record errors logged)'})
    }
