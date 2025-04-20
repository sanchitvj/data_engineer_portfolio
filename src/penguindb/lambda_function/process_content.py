import json
import boto3
import uuid
from datetime import datetime

def lambda_handler(event, context):
    try:
        # Parse input from API Gateway
        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table('LinkedInContent')  # Use your table name
        
        # Generate ID if not provided
        if 'id' not in body or not body['id']:
            body['id'] = str(uuid.uuid4())
        
        # Add timestamp if not present
        if 'timestamp' not in body:
            body['timestamp'] = datetime.now().isoformat()
        
        # Write to DynamoDB
        response = table.put_item(Item=body)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data successfully processed',
                'id': body['id']
            })
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Error processing data: {str(e)}'
            })
        } 