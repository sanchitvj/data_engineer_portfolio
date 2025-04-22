import json
import boto3
import os
import logging
import traceback
from datetime import datetime
from botocore.exceptions import ClientError
import requests  # Added for HTTP requests



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
        
        # Process and update each item's status
        updated_count = 0
        error_count = 0
        
        for item in items:
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
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Status check completed. Updated {updated_count} items, {error_count} errors",
                'updated_count': updated_count,
                'error_count': error_count,
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
    
    # Maximum number of retries
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            logger.info(f"Sending update to Google Sheet for {content_id}, status={status} (Attempt {retry_count+1})")
            
            # Prepare payload for the Google Sheet Web App
            payload = {
                'action': 'updateStatus',
                'content_id': content_id,
                'status': status,
                'processed_at': processed_at
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
                # Set a timeout to prevent hanging
                timeout = 15  # seconds
                
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
                            # This is a valid response but with an error message, 
                            # don't retry as it's likely a data issue
                            return {'success': False, 'error': error_msg}
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse response: {response.text}")
                        # Increment retry count and try again
                        retry_count += 1
                        if retry_count < max_retries:
                            logger.info(f"Retrying ({retry_count}/{max_retries})...")
                            continue
                        return {'success': False, 'error': 'Failed to parse response from Google Sheet'}
                else:
                    logger.error(f"HTTP error {response.status_code}: {response.text}")
                    # For HTTP errors, we'll retry
                    retry_count += 1
                    if retry_count < max_retries:
                        logger.info(f"Retrying ({retry_count}/{max_retries})...")
                        continue
                    return {'success': False, 'error': f"HTTP error {response.status_code}"}
                    
            except requests.RequestException as req_error:
                logger.error(f"Request error: {str(req_error)}")
                # Network/timeout errors should be retried
                retry_count += 1
                if retry_count < max_retries:
                    logger.info(f"Retrying ({retry_count}/{max_retries})...")
                    continue
                return {'success': False, 'error': f"Request error: {str(req_error)}"}
                
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            logger.error(traceback.format_exc())
            # For unexpected errors, we'll also retry
            retry_count += 1
            if retry_count < max_retries:
                logger.info(f"Retrying ({retry_count}/{max_retries})...")
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