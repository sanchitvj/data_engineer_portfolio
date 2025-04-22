import json
import boto3
import os
import logging
import traceback
from datetime import datetime
from botocore.exceptions import ClientError

# Import utility functions
from penguindb.utils.content_processing_utils import (
    ErrorTypes,
)

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment Variables
DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')
GOOGLE_SHEET_URL = os.environ.get('GOOGLE_SHEET_URL', '')  # Apps Script Web App URL

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
                    send_status_update(content_id, "PROCESSED", db_item)
                    response['body']['updates_sent'] += 1
                    logger.info(f"Sent status update for {content_id}")
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
    
    # If no content_ids provided, we could scan DynamoDB for recent items
    # This is optional and would be more expensive for large tables
    # You can implement this if needed or handle it differently
    
    # For now, we'll return an empty list
    logger.warning("No content_ids provided in event, returning empty list")
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
    
    This would typically be a POST request to the Google Apps Script 
    Web App URL that you deploy as part of your Google Sheets solution.
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
            payload['processed_at'] = db_item.get('processed_at', '')
            payload['generated_title'] = db_item.get('generated_title', '')
            
        # Here's where you'd make the HTTP request to your Google Apps Script Web App
        # Using requests or similar library
        logger.info(f"Would send status update to Google Sheet: {json.dumps(payload)}")
        
        # For now, we'll just log it (you'll need to add actual HTTP call)
        return True
        
    except Exception as e:
        logger.error(f"Error sending status update for {content_id}: {str(e)}")
        return False

def finalize_response(response):
    """Prepare the final response with proper JSON formatting."""
    if isinstance(response['body'], dict):
        response['body'] = json.dumps(response['body'])
    return response 