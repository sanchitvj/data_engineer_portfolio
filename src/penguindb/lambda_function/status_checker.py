import json
import boto3
import os
import logging
import traceback
from datetime import datetime
from botocore.exceptions import ClientError
import requests  # Added for HTTP requests
import time
import random



# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')
GOOGLE_SHEET_URL = os.environ.get('GOOGLE_SHEET_URL')

# WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjDaqitE6g7wSCImSDgcujtCvyW0H_gIJuekQXAy3C9eKao0zf12d00o0FvNAbFmijxg/exec"

# Initialize clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event, context):
    """
    Check DynamoDB for items with pending status and update the Google Sheet.
    This can be triggered on a schedule or manually.
    
    If content_ids are provided in the event, only those will be processed.
    Otherwise, it scans for all recent items.
    """
    logger.info("Status Checker Lambda started")
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Calculate available execution time (leave 15 seconds buffer)
    remaining_time_ms = context.get_remaining_time_in_millis() - 15000 if hasattr(context, 'get_remaining_time_in_millis') else 180000
    logger.info(f"Remaining execution time: {remaining_time_ms/1000} seconds")
    
    # If we have very little time left, don't even try
    if remaining_time_ms < 20000:  # Less than 20 seconds
        logger.warning("Insufficient time remaining for status checking")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Insufficient execution time remaining'})
        }
    
    # Validate GOOGLE_SHEET_URL is set
    if not GOOGLE_SHEET_URL:
        error_msg = "GOOGLE_SHEET_URL environment variable not set"
        logger.error(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }
    elif not GOOGLE_SHEET_URL.startswith('https://script.google.com/'):
        error_msg = f"Invalid GOOGLE_SHEET_URL: {GOOGLE_SHEET_URL}. Must be a Google Apps Script URL."
        logger.error(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }
    
    logger.info(f"Using Google Sheet URL: {GOOGLE_SHEET_URL}")
    
    try:
        # Check if we received an empty or invalid event
        if not event or not isinstance(event, dict):
            logger.warning(f"Received empty or invalid event: {event}")
            event = {}  # Initialize as empty dict to prevent further errors
            
        # Check if specific content_ids were provided
        content_ids = []
        if 'content_ids' in event and isinstance(event['content_ids'], list):
            content_ids = event['content_ids']
            logger.info(f"Processing specific content_ids: {content_ids}")
        
        # Get items to process
        items = []
        
        if content_ids:
            # Get specific items by content_id
            for content_id in content_ids:
                try:
                    # Use scan instead of getItem to avoid schema mismatches
                    scan_response = table.scan(
                        FilterExpression=boto3.dynamodb.conditions.Key('content_id').eq(content_id),
                        Limit=1
                    )
                    items_found = scan_response.get('Items', [])
                    
                    if items_found:
                        items.append(items_found[0])
                        logger.info(f"Retrieved item for content_id: {content_id}")
                    else:
                        logger.warning(f"Item not found for content_id: {content_id}")
                except Exception as get_error:
                    logger.error(f"Error getting item for {content_id}: {str(get_error)}")
                    logger.error(traceback.format_exc())
        else:
            # Scan for all recent items if no specific IDs
            logger.info("No specific content_ids provided, scanning for recent items")
            try:
                scan_filter = {
                    'Limit': 50,  # Limit items per batch for efficiency
                }
                
                scan_response = table.scan(**scan_filter)
                items = scan_response.get('Items', [])
                logger.info(f"Found {len(items)} items in scan")
            except Exception as scan_error:
                logger.error(f"Error scanning DynamoDB: {str(scan_error)}")
                logger.error(traceback.format_exc())
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': f"Failed to scan DynamoDB: {str(scan_error)}"})
                }
        
        # Process and update each item's status, but in smaller batches with delays
        total_items = len(items)
        updated_count = 0
        error_count = 0
        
        # Process in smaller batches to avoid overwhelming Apps Script quotas
        # and track time to prevent Lambda timeouts
        batch_size = 3  # Reduce batch size to 3 (from 5)
        start_time = time.time()
        
        for i in range(0, total_items, batch_size):
            # Check if we're approaching Lambda timeout
            elapsed_ms = (time.time() - start_time) * 1000
            if elapsed_ms > (remaining_time_ms - 20000):  # 20 second safety margin
                logger.warning(f"Approaching Lambda timeout, processed {i}/{total_items} items")
                # Don't process more items, just return what we've done so far
                break
                
            batch = items[i:i+batch_size]
            logger.info(f"Processing batch {i//batch_size + 1} of {(total_items + batch_size - 1)//batch_size} ({len(batch)} items)")
            
            for item in batch:
                content_id = item.get('content_id')
                if not content_id:
                    logger.warning("Found item without content_id, skipping")
                    continue
                    
                logger.info(f"Processing status for content_id: {content_id}")
                
                # Determine item status based on generated content
                has_generated_title = item.get('generated_title', '') != ''
                has_generated_tags = bool(item.get('generated_tags', []))
                
                # Set status based on what we found
                status = "processed" if (has_generated_title or has_generated_tags) else "error"
                
                # Update Google Sheet
                try:
                    update_result = update_sheet_status(
                        content_id=content_id,
                        status=status.upper(),  # Use uppercase for the API
                        processed_at=item.get('processed_at', datetime.now().isoformat()),
                        generated_title=item.get('generated_title', '')
                    )
                    
                    if update_result.get('success'):
                        logger.info(f"Successfully updated sheet for {content_id} to {status}")
                        updated_count += 1
                    else:
                        logger.error(f"Failed to update sheet for {content_id}: {update_result.get('error')}")
                        error_count += 1
                        
                except Exception as update_error:
                    logger.error(f"Error updating sheet for {content_id}: {str(update_error)}")
                    logger.error(traceback.format_exc())
                    error_count += 1
            
            # Add a delay between batches to avoid overwhelming Apps Script quotas
            if i + batch_size < total_items:
                logger.info("Waiting 3 seconds before processing next batch...")
                time.sleep(3)  # 3 second delay between batches
        
        # If we processed some but not all items, and we're running out of time,
        # trigger another Lambda to process the remaining items
        remaining_items = total_items - (i + len(batch))
        if remaining_items > 0:
            logger.info(f"Still have {remaining_items} items to process, triggering another Lambda")
            try:
                # Create a new list of remaining content_ids
                remaining_content_ids = [item.get('content_id') for item in items[i+batch_size:] if item.get('content_id')]
                
                if remaining_content_ids:
                    # Self-invoke to process remaining items
                    lambda_client = boto3.client('lambda')
                    lambda_client.invoke(
                        FunctionName=context.function_name,
                        InvocationType='Event',  # Asynchronous
                        Payload=json.dumps({'content_ids': remaining_content_ids})
                    )
                    logger.info(f"Triggered follow-up processing for {len(remaining_content_ids)} remaining items")
            except Exception as invoke_error:
                logger.error(f"Error triggering follow-up processing: {str(invoke_error)}")
                logger.error(traceback.format_exc())
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Status check completed. Updated {updated_count} of {total_items} items, {error_count} errors",
                'updated_count': updated_count,
                'error_count': error_count,
                'total_items': total_items,
                'remaining_items': remaining_items if 'remaining_items' in locals() else 0,
                'content_ids_processed': content_ids if content_ids else "all recent items"
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in Status Checker Lambda: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f"Unexpected error: {str(e)}"})
        }

def update_sheet_status(content_id, status, processed_at, generated_title):
    """
    Update the status of an item in the Google Sheet via the Web App.
    
    Args:
        content_id: The unique ID of the content
        status: The new status (PROCESSED or ERROR)
        processed_at: Timestamp when the item was processed
        generated_title: The generated title if available
        
    Returns:
        Dictionary with success flag and any error message
    """
    if not GOOGLE_SHEET_URL:
        logger.error("GOOGLE_SHEET_URL not configured")
        return {'success': False, 'error': 'Google Sheet URL not configured'}
    
    # More aggressive retry settings
    max_retries = 5
    retry_count = 0
    initial_backoff = 1  # Start with 1 second
    max_backoff = 16     # Maximum backoff of 16 seconds
    backoff_time = initial_backoff
    
    while retry_count < max_retries:
        try:
            if retry_count > 0:
                logger.info(f"Retry attempt {retry_count}/{max_retries} for {content_id} after {backoff_time}s delay")
                time.sleep(backoff_time)
                # Exponential backoff with jitter to avoid thundering herd
                backoff_time = min(max_backoff, backoff_time * 2) * (0.9 + 0.2 * random.random())
            
            logger.info(f"Sending update to Google Sheet for {content_id}, status={status} (Attempt {retry_count+1})")
            
            # Prepare payload for the Google Sheet Web App with retry information
            payload = {
                'action': 'updateStatus',
                'content_id': content_id,
                'status': status,
                'processed_at': processed_at,
                'retry_count': retry_count
            }
            
            if generated_title:
                payload['generated_title'] = generated_title
                
            # Convert payload to JSON and encode for HTTP request
            json.dumps(payload).encode('utf-8')
            
            # Set up the request
            headers = {
                'Content-Type': 'application/json'
            }
            
            # Log the payload being sent
            logger.info(f"Sending payload to Google Sheet: {json.dumps(payload)}")
            
            # Use requests library which has better error handling
            try:
                # Extend timeout for Google Apps Script
                timeout = 20  # seconds
                
                # Send the request
                response = requests.post(
                    GOOGLE_SHEET_URL,
                    json=payload,
                    headers=headers,
                    timeout=timeout
                )
                
                # Check if request was successful
                if response.status_code == 200:
                    try:
                        response_data = response.json()
                        logger.info(f"Response from Google Sheet: {response.text}")
                        
                        if response_data.get('status') == 'success':
                            logger.info(f"Status update successful for {content_id}")
                            return {'success': True, 'data': response_data.get('data', {})}
                        else:
                            error_msg = response_data.get('message', 'Unknown error from Google Sheet')
                            logger.warning(f"Google Sheet returned error: {error_msg}")
                            
                            # If this looks like a quota error or timeout, retry
                            if 'quota' in error_msg.lower() or 'timeout' in error_msg.lower() or 'limit' in error_msg.lower():
                                retry_count += 1
                                if retry_count < max_retries:
                                    continue
                            
                            # For other errors, don't retry as it's likely a data issue
                            return {'success': False, 'error': error_msg}
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse response: {response.text}")
                        # Increment retry count and try again
                        retry_count += 1
                        if retry_count < max_retries:
                            continue
                        return {'success': False, 'error': 'Failed to parse response from Google Sheet'}
                elif response.status_code >= 500:
                    # For 5xx server errors, always retry
                    logger.error(f"Server error {response.status_code}: {response.text}")
                    retry_count += 1
                    if retry_count < max_retries:
                        continue
                    return {'success': False, 'error': f"Server error {response.status_code}"}
                elif response.status_code >= 400:
                    # For 4xx client errors, check if we should retry based on error type
                    logger.error(f"Client error {response.status_code}: {response.text}")
                    
                    # Retry on 429 (Too Many Requests) and specific 4xx errors that might be temporary
                    if response.status_code == 429 or response.status_code in [408, 425, 449]:
                        retry_count += 1
                        if retry_count < max_retries:
                            # Use longer backoff for rate limiting errors
                            backoff_time = min(max_backoff * 2, backoff_time * 3)
                            continue
                    
                    return {'success': False, 'error': f"Client error {response.status_code}"}
                else:
                    logger.error(f"Unexpected HTTP status {response.status_code}: {response.text}")
                    retry_count += 1
                    if retry_count < max_retries:
                        continue
                    return {'success': False, 'error': f"Unexpected HTTP status {response.status_code}"}
                    
            except requests.Timeout:
                logger.error(f"Request timed out after {timeout}s")
                retry_count += 1
                if retry_count < max_retries:
                    # Increase timeout for next retry
                    timeout += 5
                    continue
                return {'success': False, 'error': "Request timed out after multiple attempts"}
                
            except requests.RequestException as req_error:
                logger.error(f"Request error: {str(req_error)}")
                # Network errors should be retried
                retry_count += 1
                if retry_count < max_retries:
                    continue
                return {'success': False, 'error': f"Request error: {str(req_error)}"}
                
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            # For unexpected errors, we'll also retry
            retry_count += 1
            if retry_count < max_retries:
                continue
            return {'success': False, 'error': f"Unexpected error: {str(e)}"}
            
    # If we get here, all retries failed
    logger.error(f"All {max_retries} attempts failed for content_id {content_id}")
    return {'success': False, 'error': 'All retry attempts failed'}

def get_pending_items_from_event(event):
    """Extract pending items from the event or query DynamoDB for recent items."""
    # Check if we have explicit content_ids passed in the event
    if 'content_ids' in event:
        content_ids = event.get('content_ids', [])
        if not content_ids:
            return []
            
        # Convert to list of items with content_id
        return [{'content_id': content_id} for content_id in content_ids]
    
    # Otherwise, check for API Gateway request with content_ids
    elif 'body' in event:
        try:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
            content_ids = body.get('content_ids', [])
            if content_ids:
                return [{'content_id': content_id} for content_id in content_ids]
        except Exception as e:
            logger.warning(f"Error parsing content_ids from event: {str(e)}")
            pass
    
    # If no content_ids provided, scan DynamoDB for pending items
    try:
        logger.info("No specific content_ids provided, scanning for PENDING items")
        response = table.scan(
            FilterExpression="attribute_exists(#status) AND #status = :status_val",
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status_val": "pending"
            },
            Limit=50  # Limit to avoid too many items at once
        )
        
        if 'Items' in response and response['Items']:
            logger.info(f"Found {len(response['Items'])} pending items in DynamoDB")
            return response['Items']
        else:
            logger.info("No pending items found in DynamoDB")
            return []
            
    except Exception as e:
        logger.error(f"Error scanning for pending items: {str(e)}")
        return []

def get_item_from_dynamodb(content_id):
    """Fetch an item from DynamoDB using scan with filter."""
    try:
        # Use scan with filter instead of getItem
        response = table.scan(
            FilterExpression=boto3.dynamodb.conditions.Key('content_id').eq(content_id),
            Limit=1
        )
        
        items = response.get('Items', [])
        if items:
            return items[0]  # Return the first matching item
        return None
    except ClientError as e:
        logger.error(f"Error getting item {content_id} from DynamoDB: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def send_status_update(content_id, status, db_item=None):
    """
    Send status update to Google Sheets using the Apps Script Web App.
    
    Args:
        content_id: The unique ID of the content to update
        status: The new status value (PROCESSED or ERROR)
        db_item: Optional DynamoDB item with additional data
        
    Returns:
        Boolean indicating success or failure
    """
    if not GOOGLE_SHEET_URL:
        logger.warning("No Google Sheet URL configured")
        return False
        
    try:
        # Prepare data to send
        payload = {
            'action': 'updateStatus',
            'content_id': content_id,
            'status': status
        }
        
        # Include additional details that might be helpful
        if db_item:
            if 'processed_at' in db_item:
                payload['processed_at'] = db_item['processed_at']
            
            if 'generated_title' in db_item:
                payload['generated_title'] = db_item['generated_title']
            
            # Include generated tags if available
            if 'generated_tags' in db_item:
                tags = db_item['generated_tags']
                if isinstance(tags, set):
                    payload['generated_tags'] = list(tags)
                else:
                    payload['generated_tags'] = tags
            
        # Log the payload for debugging
        logger.info(f"Sending status update to Google Sheet: {json.dumps(payload)}")
        
        # Make the HTTP request to the Google Apps Script Web App
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Set a timeout to prevent hanging
        timeout = 10  # seconds
        
        # Send the POST request
        response = requests.post(
            GOOGLE_SHEET_URL,
            json=payload,
            headers=headers,
            timeout=timeout
        )
        
        # Check if request was successful
        if response.status_code == 200:
            try:
                # Parse response to see if Google Script reported success
                response_data = response.json()
                if response_data.get('status') == 'success':
                    logger.info(f"Status update successful for {content_id}")
                    
                    # Update DynamoDB item to mark as reported to sheet
                    try:
                        table.update_item(
                            Key={'content_id': content_id},
                            UpdateExpression="SET sheet_updated = :val, sheet_updated_at = :time",
                            ExpressionAttributeValues={
                                ':val': True,
                                ':time': datetime.now().isoformat()
                            }
                        )
                    except Exception as update_error:
                        logger.warning(f"Failed to mark item as updated in DynamoDB: {str(update_error)}")
                    
                    return True
                else:
                    logger.error(f"Google Apps Script returned error: {response_data}")
                    return False
            except json.JSONDecodeError:
                logger.error(f"Failed to parse response from Google Apps Script: {response.text}")
                return False
        else:
            logger.error(f"HTTP error {response.status_code} when updating Google Sheet: {response.text}")
            return False
            
    except requests.RequestException as e:
        logger.error(f"Request exception when sending status update for {content_id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending status update for {content_id}: {str(e)}")
        return False

def finalize_response(response):
    """Prepare the final response with proper JSON formatting."""
    if isinstance(response['body'], dict):
        response['body'] = json.dumps(response['body'])
    return response 