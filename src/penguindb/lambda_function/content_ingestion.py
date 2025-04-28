import json
import boto3
import os
import logging
import traceback
from datetime import datetime
import uuid
import requests

from penguindb.utils.content_processing_utils import validate_field_types

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data') # Ensure this is set
GOOGLE_SHEET_URL = os.environ.get('GOOGLE_SHEET_URL') # Optional: For sheet status update

# AWS Clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# --- Reusable Sheet Update Logic (Adapted from status_checker.py) ---
def update_sheet_ingested_status(content_id):
    """Updates the Google Sheet status to INGESTED."""
    if not GOOGLE_SHEET_URL:
        logger.warning("GOOGLE_SHEET_URL not configured, skipping sheet status update.")
        return False

    try:
        payload = {
            'action': 'updateStatus',
            'content_id': content_id,
            'status': 'INGESTED', # Use a specific intermediate status
            'processed_at': datetime.now().isoformat() # Or maybe 'ingested_at'
        }
        headers = {'Content-Type': 'application/json'}
        timeout = 10 # Shorter timeout for this simpler update

        logger.info(f"Sending INGESTED status update to Google Sheet for {content_id}")
        response = requests.post(GOOGLE_SHEET_URL, json=payload, headers=headers, timeout=timeout)

        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('status') == 'success':
                logger.info(f"Sheet status updated to INGESTED for {content_id}")
                return True
            else:
                logger.error(f"Google Apps Script returned error for INGESTED update: {response_data}")
                return False
        else:
            logger.error(f"HTTP error {response.status_code} updating sheet to INGESTED: {response.text}")
            return False
    except requests.RequestException as e:
        logger.error(f"Request exception updating sheet to INGESTED for {content_id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error updating sheet to INGESTED for {content_id}: {str(e)}")
        return False
# --- End Sheet Update Logic ---

def lambda_handler(event, context):
    """
    SQS handler: Processes batches of messages, validates, writes raw data to DynamoDB.
    Optionally updates Google Sheet status to 'INGESTED'.
    Supports SQS Batch Item Failures reporting.
    """
    logger.info(f"Ingestion Lambda received event with {len(event.get('Records', []))} records.")
    # logger.debug(f"Full SQS event: {json.dumps(event)}")

    # Use context to track time remaining if needed, especially with larger batches
    start_time_lambda = datetime.now()

    # *** MODIFIED: Initialize list for Batch Item Failures ***
    batch_item_failures = []

    for record in event.get('Records', []):
        message_id = record.get('messageId', 'N/A')
        # receipt_handle = record.get('receiptHandle', 'N/A') # Not needed if using batch item failures
        content_id = 'UNKNOWN' # Default
        record_start_time = datetime.now()

        try:
            logger.info(f"Processing messageId: {message_id}")
            # --- Parse SQS Message Body ---
            if 'body' not in record:
                logger.error(f"Missing 'body' in SQS record {message_id}")
                # *** MODIFIED: Report failure, continue batch ***
                batch_item_failures.append({"itemIdentifier": message_id})
                continue

            try:
                body = json.loads(record['body'])
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse SQS message body as JSON for {message_id}: {record['body']}. Error: {e}")
                # *** MODIFIED: Report failure (bad data), continue batch ***
                batch_item_failures.append({"itemIdentifier": message_id})
                continue
            # --- End Parsing ---

            # --- Validation ---
            content_id = body.get('content_id')
            if not content_id or not isinstance(content_id, str) or content_id.strip() == '':
                content_id = str(uuid.uuid4())
                body['content_id'] = content_id
                logger.info(f"Generated new content_id: {content_id} for message {message_id}")

            validation_error = validate_field_types(body)
            if validation_error:
                logger.error(f"Validation error for {content_id} (Msg: {message_id}): {validation_error}")
                # *** MODIFIED: Report failure (bad data), continue batch ***
                batch_item_failures.append({"itemIdentifier": message_id})
                continue
            # --- End Validation ---

            # --- Prepare Raw Data for DynamoDB ---
            initial_item_data = {}
            # Add 'status' and 'timestamp' to excluded fields since they're unnecessary
            excluded_fields = ['generated_title', 'generated_description', 'generated_tags', 'llm_retries', 'used_fallback', 'status', 'timestamp']
            for key, value in body.items():
                 # Skip excluded fields and None/empty strings
                 if key not in excluded_fields and value is not None and value != '':
                    if isinstance(value, list):
                        # Filter list items that are None or just whitespace
                        filtered_list = [str(v).strip() for v in value if v is not None and str(v).strip()]
                        if filtered_list: 
                            initial_item_data[key] = filtered_list
                    elif isinstance(value, (str, int, float, bool)):
                        initial_item_data[key] = value
                    else:
                        # Attempt conversion for other types, skip if fails
                        try: 
                            initial_item_data[key] = str(value)
                        except Exception as conv_err: 
                            logger.warning(f"Could not convert field '{key}' for {content_id} (type: {type(value)}), skipping. Error: {conv_err}")

            initial_item_data['ingested_at'] = record_start_time.isoformat()
            initial_item_data['ingestion_lambda_request_id'] = context.aws_request_id
            initial_item_data['sqs_message_id'] = message_id

            item_to_write = {'content_id': content_id, **initial_item_data}
            # --- End Data Preparation ---

            # --- Write to DynamoDB ---
            try:
                # logger.debug(f"Writing raw item to DynamoDB for {content_id}: {json.dumps(item_to_write, default=str)}")
                table.put_item(Item=item_to_write)
                logger.info(f"Successfully wrote raw item {content_id} (Msg: {message_id}) to DynamoDB")
            except Exception as db_error:
                logger.error(f"Database error writing raw item {content_id} (Msg: {message_id}): {str(db_error)}")
                logger.error(traceback.format_exc())
                # *** MODIFIED: Re-raise for retryable errors. This will cause the *entire batch* to fail and retry. ***
                # If you only want THIS message retried, you'd add to batch_item_failures and NOT raise.
                # However, failing the batch on DB error is often safer.
                raise db_error
            # --- End DynamoDB Write ---

            # --- Optional: Update Google Sheet Status ---
            if GOOGLE_SHEET_URL:
                try:
                    update_sheet_ingested_status(content_id)
                except Exception as sheet_error:
                     # Log error but don't fail the message processing, as DB write succeeded
                    logger.error(f"Non-fatal: Failed to update sheet status for {content_id} (Msg: {message_id}): {sheet_error}")
            # --- End Sheet Update ---

            duration = (datetime.now() - record_start_time).total_seconds()
            logger.info(f"Processed message {message_id} for {content_id} in {duration:.2f} seconds.")

        except Exception as e:
            # Catch errors that were re-raised (like db_error)
            logger.error(f"Failed processing message {message_id} within loop: {str(e)}")
            # Add message ID to failures
            batch_item_failures.append({"itemIdentifier": message_id})
            # If we re-raised the exception (like for db_error), the whole batch invocation will fail
            # regardless of adding it here. If we didn't re-raise (like for validation), adding it here is essential.
            # It's safe to add it in both cases if ReportBatchItemFailures is enabled.

    # --- Lambda Function Exit ---
    lambda_duration = (datetime.now() - start_time_lambda).total_seconds()
    logger.info(f"Ingestion Lambda batch finished in {lambda_duration:.2f} seconds. Failures reported: {len(batch_item_failures)}")

    # *** MODIFIED: Return structure for SQS Batch Item Failures ***
    # This structure is ONLY used by Lambda if 'ReportBatchItemFailures' is enabled on the SQS trigger.
    # Otherwise, any unhandled exception fails the whole batch, and an empty return means success.
    if batch_item_failures:
        logger.warning(f"Returning {len(batch_item_failures)} failed message identifiers to SQS.")
        return {'batchItemFailures': batch_item_failures}
    else:
        logger.info("Batch processed successfully with no reported failures.")
        # Return empty dict or standard success for clarity if not using batchItemFailures,
        # but an empty return also signals success to SQS when no exceptions are raised.
        return {'statusCode': 200, 'body': json.dumps('Batch processed successfully')}
