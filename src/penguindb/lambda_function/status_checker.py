import json
import boto3
import os
import logging
import urllib.request
import urllib.parse
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
    
    if not GOOGLE_SHEET_URL:
        error_msg = "GOOGLE_SHEET_URL environment variable not set"
        logger.error(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }
    
    logger.info(f"Using Google Sheet URL: {GOOGLE_SHEET_URL}")
    
    try:
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
                    item = table.get_item(Key={'content_id': content_id})
                    if 'Item' in item:
                        items.append(item['Item'])
                        logger.info(f"Retrieved item for content_id: {content_id}")
                    else:
                        logger.warning(f"Item not found for content_id: {content_id}")
                except Exception as get_error:
                    logger.error(f"Error getting item for {content_id}: {str(get_error)}")
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
        return {'success': False, 'error': 'Google Sheet URL not configured'}
    
    try:
        logger.info(f"Sending update to Google Sheet for {content_id}, status={status}")
        
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
        data = json.dumps(payload).encode('utf-8')
        
        # Set up the request
        headers = {
            'Content-Type': 'application/json'
        }
        
        # Log the payload being sent
        logger.info(f"Sending payload to Google Sheet: {json.dumps(payload)}")
        
        # Create request and add headers
        req = urllib.request.Request(
            url=GOOGLE_SHEET_URL,
            data=data,
            headers=headers,
            method='POST'
        )
        
        # Send the request and get response
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = response.read().decode('utf-8')
            logger.info(f"Response from Google Sheet: {response_data}")
            
            # Parse response JSON
            response_json = json.loads(response_data)
            
            # Check if the update was successful
            if response_json.get('status') == 'success':
                return {'success': True, 'data': response_json.get('data', {})}
            else:
                error_msg = response_json.get('message', 'Unknown error from Google Sheet')
                logger.error(f"Google Sheet returned error: {error_msg}")
                return {'success': False, 'error': error_msg}
                
    except urllib.error.HTTPError as http_err:
        error_msg = f"HTTP error: {http_err.code} - {http_err.reason}"
        logger.error(error_msg)
        logger.error(f"Response: {http_err.read().decode('utf-8')}")
        return {'success': False, 'error': error_msg}
        
    except urllib.error.URLError as url_err:
        error_msg = f"URL error: {str(url_err.reason)}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}
        
    except json.JSONDecodeError as json_err:
        error_msg = f"JSON decode error: {str(json_err)}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}
        
    except Exception as e:
        error_msg = f"Unexpected error sending update to Google Sheet: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return {'success': False, 'error': error_msg}

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
    """Fetch an item from DynamoDB."""
    try:
        response = table.get_item(Key={'content_id': content_id})
        return response.get('Item')
    except ClientError as e:
        logger.error(f"Error getting item {content_id} from DynamoDB: {str(e)}")
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