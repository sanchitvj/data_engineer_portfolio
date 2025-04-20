# Content Processor Lambda Function

This Lambda function processes content from Google Sheets and stores it in DynamoDB.

## Directory Structure
```
lambda/
├── content_processor/
│   └── lambda_function.py
└── requirements.txt
```

## Setup Instructions

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Deploy to AWS Lambda:
- Create a new Lambda function in AWS Console
- Upload the `content_processor` directory as a zip file
- Set the handler to `lambda_function.lambda_handler`
- Configure the appropriate IAM role with DynamoDB access

## Environment Variables
- None required

## Input Format
The function expects a JSON payload with the following structure:
```json
{
    "id": "optional-uuid",
    "title": "Content Title",
    "content": "Content Body",
    "source": "LinkedIn/Substack",
    "url": "Content URL",
    "timestamp": "optional-iso-timestamp"
}
```

## Output Format
Success Response:
```json
{
    "statusCode": 200,
    "body": {
        "message": "Data successfully processed",
        "id": "generated-uuid"
    }
}
```

Error Response:
```json
{
    "statusCode": 500,
    "body": {
        "message": "Error processing data: [error details]"
    }
}
``` 