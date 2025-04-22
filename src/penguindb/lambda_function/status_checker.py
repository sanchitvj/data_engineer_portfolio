import json
import boto3
import os
import logging
import traceback
from datetime import datetime
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

def debug_imports():
    """Debug function to check if all imports are working"""
    logger.info("All imports successful")

def get_pending_items():
    """Get pending items from Google Sheet"""
    try:
        # Get the Google Sheet URL from environment variables
        sheet_url = os.environ.get('GOOGLE_SHEET_URL')
        if not sheet_url:
            logger.error("GOOGLE_SHEET_URL environment variable not set")
            return []
            
        # Make request to Google Sheet
        response = requests.get(sheet_url)
        if response.status_code != 200:
            logger.error(f"Failed to get data from Google Sheet: {response.status_code}")
            return []
            
        # Parse response and filter pending items
        try:
            data = response.json()
            logger.info(f"Response data type: {type(data)}")
            
            # Handle different response formats
            if isinstance(data, list):
                # Format: Array of items
                pending_items = [item for item in data if isinstance(item, dict) and item.get('status') == 'PENDING']
            elif isinstance(data, dict):
                # Format: Object with items property or other structure
                if 'items' in data and isinstance(data['items'], list):
                    pending_items = [item for item in data['items'] if isinstance(item, dict) and item.get('status') == 'PENDING']
                elif 'data' in data and isinstance(data['data'], list):
                    pending_items = [item for item in data['data'] if isinstance(item, dict) and item.get('status') == 'PENDING']
                elif 'rows' in data and isinstance(data['rows'], list):
                    pending_items = [item for item in data['rows'] if isinstance(item, dict) and item.get('status') == 'PENDING']
                else:
                    # Log the structure to better understand it
                    logger.error(f"Unknown dictionary structure: {list(data.keys())}")
                    pending_items = []
            else:
                logger.error(f"Unexpected response format from Google Sheet: {type(data)}")
                pending_items = []
                
            logger.info(f"Found {len(pending_items)} pending items")
            return pending_items
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from Google Sheet: {str(e)}")
            logger.error(f"Response content: {response.text}")
            return []
        
    except Exception as e:
        logger.error(f"Error getting pending items: {str(e)}")
        logger.error(traceback.format_exc())
        return []

def get_item_from_dynamodb(content_id):
    """Get item from DynamoDB using content_id"""
    try:
        response = table.scan(
            FilterExpression='content_id = :content_id',
            ExpressionAttributeValues={
                ':content_id': content_id
            }
        )
        
        items = response.get('Items', [])
        if not items:
            logger.warning(f"No items found for content_id: {content_id}")
            return None
            
        return items[0]  # Return first matching item
        
    except Exception as e:
        logger.error(f"Error getting item from DynamoDB: {str(e)}")
        return None

def update_google_sheet(content_id, dynamo_item):
    """Update Google Sheet with DynamoDB item status"""
    try:
        # Get the Google Sheet URL from environment variables
        sheet_url = os.environ.get('GOOGLE_SHEET_URL')
        if not sheet_url:
            logger.error("GOOGLE_SHEET_URL environment variable not set")
            return False
            
        # Prepare update data
        update_data = {
            'content_id': content_id,
            'status': dynamo_item.get('status', 'ERROR'),
            'last_updated': datetime.now().isoformat()
        }
        
        # Add generated content if available
        if 'generated_content' in dynamo_item:
            update_data['generated_content'] = dynamo_item['generated_content']
            
        # Make request to update Google Sheet
        response = requests.post(sheet_url, json=update_data)
        if response.status_code != 200:
            logger.error(f"Failed to update Google Sheet: {response.status_code}")
            return False
            
        logger.info(f"Successfully updated Google Sheet for content_id: {content_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error updating Google Sheet: {str(e)}")
        return False

def lambda_handler(event, context):
    try:
        logger.info("Starting status checker Lambda")
        debug_imports()
        
        # Initialize variables
        total_items = 0
        processed_items = 0
        remaining_items = 0
        batch_size = 0
        
        # Get pending items from Google Sheet
        pending_items = get_pending_items()
        if not pending_items:
            logger.info("No pending items found")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No pending items found',
                    'processed': 0
                })
            }
            
        total_items = len(pending_items)
        logger.info(f"Found {total_items} pending items")
        
        # Process items in batches
        batch_size = 10  # Process 10 items at a time
        for i in range(0, total_items, batch_size):
            batch = pending_items[i:i + batch_size]
            remaining_items = total_items - (i + len(batch))
            
            logger.info(f"Processing batch of {len(batch)} items (remaining: {remaining_items})")
            
            # Process each item in the batch
            for item in batch:
                try:
                    content_id = item['content_id']
                    logger.info(f"Processing item with content_id: {content_id}")
                    
                    # Get item from DynamoDB
                    dynamo_item = get_item_from_dynamodb(content_id)
                    if not dynamo_item:
                        logger.warning(f"Item not found in DynamoDB: {content_id}")
                        continue
                        
                    # Update Google Sheet
                    update_google_sheet(content_id, dynamo_item)
                    processed_items += 1
                    
                except Exception as e:
                    logger.error(f"Error processing item {content_id}: {str(e)}")
                    continue
                    
            # Check if we're running out of time
            if context.get_remaining_time_in_millis() < 10000:  # Less than 10 seconds remaining
                logger.warning(f"Lambda timeout approaching. Processed {processed_items}/{total_items} items")
                break
                
        logger.info(f"Completed processing. Total items: {total_items}, Processed: {processed_items}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Status check completed',
                'total_items': total_items,
                'processed_items': processed_items
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
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