# Error Handling Guide for Google Sheets to DynamoDB Pipeline

This document outlines the error handling mechanisms, error types, and troubleshooting procedures for the Google Sheets to DynamoDB content pipeline.

## Error Types and Status Codes

### Google Apps Script Errors

The Google Apps Script uses the following status values:

| Status | Description |
|--------|-------------|
| `new` | Content is ready to be processed |
| `pending` | Content is currently being processed |
| `processed` | Content has been successfully processed and stored in DynamoDB |
| `error` | An error occurred during processing |

### Lambda Function Errors

The Lambda function returns standardized error responses with the following structure:

```json
{
  "error": {
    "type": "ErrorType",
    "message": "Detailed error message",
    "timestamp": "ISO timestamp"
  }
}
```

Error types include:

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| `ValidationError` | 400 | Invalid or missing required fields |
| `DatabaseError` | 500 | Error when interacting with DynamoDB |
| `InternalError` | 500 | Unexpected errors within the Lambda function |
| `AuthenticationError` | 401/403 | Authentication or authorization errors |

## Data Flow and Error Handling Points

1. **Google Sheet Edit**
   - Status column set to `new`
   - Error Handling: None (input stage)

2. **Google Apps Script Processing**
   - Status changed to `pending`
   - Error Handling: Try/catch blocks, status set to `error`, error details recorded
   - Automatic retry mechanism with exponential backoff

3. **API Gateway Request**
   - Forwards request to Lambda
   - Error Handling: Timeout settings, throttling limits

4. **Lambda Function Processing**
   - Validates input data
   - Processes request
   - Writes to DynamoDB
   - Error Handling: Structured error responses, CloudWatch logging

5. **API Gateway Response**
   - Returns Lambda response to Google Apps Script
   - Error Handling: Gateway configurations for error responses

6. **Google Apps Script Response Processing**
   - Updates sheet status to `processed` or `error`
   - Logs error details if applicable
   - Error Handling: Status updates, error logging

## Troubleshooting Common Errors

### Missing Required Fields

**Symptoms:**
- Status: `error`
- Error Details: "Missing required field: [field_name]"

**Resolution:**
1. Check the Google Sheet row for the specified missing field
2. Add the required data
3. Set status back to `new` to retry

### API Gateway Connectivity Issues

**Symptoms:**
- Status: `error` 
- Error Details: "Error connecting to API Gateway" or timeout errors

**Resolution:**
1. Verify API Gateway URL in Apps Script
2. Check AWS service health dashboard
3. Review API Gateway CloudWatch logs for errors
4. Ensure proper IAM permissions are in place

### DynamoDB Write Failures

**Symptoms:**
- Status: `error`
- Error Details: "Database error: [details]"

**Resolution:**
1. Check DynamoDB capacity and throttling metrics
2. Verify Lambda IAM role has write permissions
3. Check for malformed data causing validation errors
4. Review CloudWatch logs for detailed error information

### Triggering Manual Retry

For items in `error` status:

1. Fix the underlying issue based on the error details
2. Either:
   - Change status to `new` to trigger a new processing attempt
   - Run the `retryErrorItems()` function manually from the script editor
   - Wait for the automatic hourly retry (if configured)

## Monitoring and Alerts

### CloudWatch Alarms

The following CloudWatch alarms are recommended:

1. Lambda Error Rate > 5% (5-minute period)
2. API Gateway 4xx/5xx Error Rate > 5%
3. DynamoDB Throttled Requests > 0

### Google Apps Script Monitoring

1. Add a dashboard sheet with error counts and success rates
2. Set up email notifications for persistent errors using time-driven triggers
3. Create a daily summary of processing statistics

## Recovery Procedures

### For Items Stuck in Error State

If an item has reached the maximum retry count (default: 3):

1. Manually review the error details
2. Fix the underlying data issue
3. Reset the attempt count to 0
4. Set status to `new`

### For System-Wide Failures

If a large number of items are failing:

1. Halt processing by removing time-based triggers
2. Fix the underlying system issue
3. Re-enable triggers once fixed
4. Manually process items in batches to avoid throttling

## Best Practices

1. Always check the error details column for specific error information
2. Maintain proper column structure in the Google Sheet
3. Don't modify data while it's in the `pending` state
4. Run batch operations during off-peak hours
5. Set up CloudWatch Dashboards to monitor the entire pipeline
6. Review error logs periodically to identify patterns
7. Test significant data changes in a staging environment first 