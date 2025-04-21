import json
import boto3
import os
import logging
import traceback
from datetime import datetime
from botocore.exceptions import ClientError
import requests  # Added for HTTP requests

from penguindb.utils.content_processing_utils import (
    ErrorTypes,
)

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')
GOOGLE_SHEET_URL = os.environ.get('GOOGLE_SHEET_URL', 'https://docs.google.com/spreadsheets/d/1TIIfrEKqb58ljctZorOqJmO3EZtCS0VkfqRkBTt2ULY/edit?gid=0#gid=0')  # Apps Script Web App URL

# WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjDaqitE6g7wSCImSDgcujtCvyW0H_gIJuekQXAy3C9eKao0zf12d00o0FvNAbFmijxg/exec"

# Initialize clients
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(DYNAMODB_TABLE_NAME)

def lambda_handler(event, context):
    """
    Scheduled Lambda that checks DynamoDB for processed items
    and updates their status in Google Sheets.
    """
    try:
        # Start with a response assuming success
        response = {
            'statusCode': 200,
            'body': {
                'message': 'Status checker completed successfully',
                'items_checked': 0,
                'updates_sent': 0,
                'errors': []
            }
        }
        
        # Get pending items from DynamoDB
        pending_items = get_pending_items_from_event(event)
        
        if not pending_items:
            logger.info("No pending items to check")
            response['body']['message'] = 'No pending items to process'
            return finalize_response(response)
        
        logger.info(f"Processing {len(pending_items)} pending items")
        response['body']['items_checked'] = len(pending_items)
        
        # Process each pending item
        for item in pending_items:
            try:
                content_id = item.get('content_id')
                if not content_id:
                    continue
                    
                # Check item status in DynamoDB
                db_item = get_item_from_dynamodb(content_id)
                
                if not db_item:
                    logger.warning(f"Item {content_id} not found in DynamoDB")
                    continue
                
                # The item exists in DynamoDB, meaning it was processed
                # Send status update to Google Sheets
                if GOOGLE_SHEET_URL:
                    success = send_status_update(content_id, "PROCESSED", db_item)
                    if success:
                        response['body']['updates_sent'] += 1
                        logger.info(f"Sent status update for {content_id}")
                    else:
                        error_msg = f"Failed to update status for {content_id}"
                        logger.error(error_msg)
                        response['body']['errors'].append(error_msg)
                else:
                    logger.warning("No Google Sheet URL configured, skipping update")
                
            except Exception as item_error:
                error_msg = f"Error processing item {content_id}: {str(item_error)}"
                logger.error(error_msg)
                response['body']['errors'].append(error_msg)
        
        return finalize_response(response)
        
    except Exception as e:
        trace = traceback.format_exc()
        logger.error(f"Unexpected error: {str(e)}\n{trace}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': {
                    'type': ErrorTypes.INTERNAL_ERROR,
                    'message': f"Internal server error: {str(e)}",
                    'timestamp': datetime.now().isoformat()
                }
            })
        }

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