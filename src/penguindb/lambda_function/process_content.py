# import json
# import boto3
# from datetime import datetime
# import logging
# import traceback
# import os  # Import os module to get environment variables
# import threading

# from penguindb.utils.llm_client import call_claude

# logger = logging.getLogger()
# logger.setLevel(logging.INFO)

# # --- Environment Variables ---
# # Make sure these are set in your Lambda environment
# SQS_QUEUE_URL = os.environ.get('SQS_QUEUE_URL', 'YOUR_SQS_QUEUE_URL')  # Replace with your SQS queue URL
# DYNAMODB_TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME', 'content_data')

# # --- Clients ---
# sqs_client = boto3.client('sqs')
# dynamodb = boto3.resource('dynamodb')
# table = dynamodb.Table(DYNAMODB_TABLE_NAME)

# # Define error types
# class ErrorTypes:
#     VALIDATION_ERROR = "ValidationError"
#     DATABASE_ERROR = "DatabaseError"
#     INTERNAL_ERROR = "InternalError"
#     AUTHENTICATION_ERROR = "AuthenticationError"
#     QUEUE_ERROR = "QueueError"

# # ==============================================================
# # == API Gateway Lambda Handler (Initial Request Processor) ==
# # ==============================================================
# def lambda_handler(event, context):
#     """
#     Handles incoming API Gateway requests.
#     Validates the request, adds initial metadata, sends it to SQS for background processing,
#     and returns a 202 Accepted response immediately.
#     """
#     try:
#         logger.info(f"API Handler - Received event: {json.dumps(event)}")

#         # Parse input
#         try:
#             body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
#         except (KeyError, json.JSONDecodeError) as e:
#             return create_error_response(400, ErrorTypes.VALIDATION_ERROR, f"Invalid request body: {str(e)}")

#         # Validate required fields (only essential ones for queuing)
#         required_fields = ['content_id', 'content_type', 'description', 'url']
#         missing_fields = [field for field in required_fields if field not in body or not body[field]]
#         if missing_fields:
#             return create_error_response(400, ErrorTypes.VALIDATION_ERROR, f"Missing required fields: {', '.join(missing_fields)}")

#         # Use content_id from request (must be provided by Apps Script now)
#         if 'content_id' not in body or not body['content_id']:
#              return create_error_response(400, ErrorTypes.VALIDATION_ERROR, "Missing required field: 'content_id'")
#         logger.info(f"API Handler - Using content_id from request: {body['content_id']}")

#         # Add timestamp if not present
#         if 'timestamp' not in body:
#             body['timestamp'] = datetime.now().isoformat()

#         # Add received timestamp
#         body['received_at'] = datetime.now().isoformat()
#         body['api_request_id'] = context.aws_request_id

#         # Send to SQS Queue
#         try:
#             sqs_client.send_message(
#                 QueueUrl=SQS_QUEUE_URL,
#                 MessageBody=json.dumps(body),
#                 MessageGroupId=body['content_id'] # Use content_id for FIFO queue grouping if applicable
#             )
#             logger.info(f"API Handler - Successfully sent message for content_id {body['content_id']} to SQS queue {SQS_QUEUE_URL}")
#         except Exception as e:
#             logger.error(f"API Handler - Error sending message to SQS: {str(e)}")
#             return create_error_response(500, ErrorTypes.QUEUE_ERROR, f"Failed to queue request: {str(e)}")

#         # Return 202 Accepted
#         return {
#             'statusCode': 202,
#             'body': json.dumps({
#                 'message': 'Request accepted for processing',
#                 'content_id': body['content_id']
#             }),
#             'headers': {'Content-Type': 'application/json'}
#         }

#     except Exception as e:
#         trace = traceback.format_exc()
#         logger.error(f"API Handler - Unexpected error: {str(e)}\n{trace}")
#         return create_error_response(500, ErrorTypes.INTERNAL_ERROR, f"Internal server error: {str(e)}")


# # ==============================================================
# # == SQS Worker Lambda Handler (Background Processor) ==
# # ==============================================================
# def process_sqs_message(event, context):
#     """
#     Handles messages from the SQS queue.
#     Processes the content, calls the LLM, prepares data, and writes to DynamoDB.
#     This function should be deployed as a SEPARATE Lambda triggered by SQS.
#     """
#     logger.info(f"SQS Worker - Received event: {json.dumps(event)}")

#     for record in event.get('Records', []):
#         try:
#             # Parse the message body
#             body = json.loads(record['body'])
#             content_id = body.get('content_id', 'UNKNOWN_ID')
#             logger.info(f"SQS Worker - Processing message for content_id: {content_id}")

#             # --- Start of original processing logic ---

#             # Validate field types (more comprehensive validation can happen here)
#             validation_errors = validate_field_types(body)
#             if validation_errors:
#                  logger.error(f"SQS Worker - Validation Error for {content_id}: {validation_errors}")
#                  # Consider moving to DLQ or updating status in DynamoDB
#                  continue # Move to next record

#             # Add processing metadata
#             body['processed_at'] = datetime.now().isoformat()
#             body['processed_by'] = context.function_name
#             body['sqs_message_id'] = record.get('messageId')
#             body['sqs_receipt_handle'] = record.get('receiptHandle') # Needed if using manual deletes

#             # Generate content using Claude LLM (with timeout)
#             try:
#                 llm_timeout = 120 # Allow longer timeout for worker (e.g., 2 minutes)
#                 llm_result = {}
#                 llm_error = None

#                 def generate_llm_content():
#                     nonlocal llm_result, llm_error # Use nonlocal to modify vars in outer scope
#                     try:
#                         llm_result.update(generate_content_with_llm(
#                             content_type=body.get('content_type', ''),
#                             description=body.get('description', ''),
#                             tags=body.get('tags', '') # Pass tags as received (string or list)
#                         ))
#                     except Exception as e:
#                         llm_error = str(e)
#                         logger.error(f"SQS Worker - Error during LLM generation for {content_id}: {llm_error}")

#                 llm_thread = threading.Thread(target=generate_llm_content)
#                 llm_thread.start()
#                 llm_thread.join(timeout=llm_timeout)

#                 if llm_thread.is_alive():
#                     logger.warning(f"SQS Worker - LLM generation timed out for {content_id}")
#                     llm_result = {"title": "", "description": "", "tags": []}
#                 elif llm_error:
#                      llm_result = {"title": "", "description": "", "tags": []}

#                 body['generated_title'] = llm_result.get('title', '')
#                 body['generated_description'] = llm_result.get('description', '')
#                 # Ensure generated_tags is a list, even if LLM returns string
#                 raw_tags = llm_result.get('tags', [])
#                 body['generated_tags'] = raw_tags if isinstance(raw_tags, list) else [tag.strip() for tag in str(raw_tags).split(',') if tag.strip()]

#                 logger.info(f"SQS Worker - LLM generated content for {content_id}: {json.dumps(llm_result)}")

#             except Exception as llm_overall_error:
#                 logger.error(f"SQS Worker - Overall error during LLM handling for {content_id}: {str(llm_overall_error)}")
#                 body['generated_title'] = ''
#                 body['generated_description'] = ''
#                 body['generated_tags'] = []

#             # Prepare data for DynamoDB (Convert to Sets)
#             try:
#                 prepared_body = prepare_data_for_dynamodb(body.copy()) # Use copy to avoid modifying original body
#             except Exception as prep_error:
#                  logger.error(f"SQS Worker - Error preparing data for DynamoDB for {content_id}: {str(prep_error)}")
#                  continue # Move to next record

#             # Write to DynamoDB
#             try:
#                 # Check if item exists (optional, put_item handles updates)
#                 try:
#                     existing_item = table.get_item(Key={'content_id': content_id})
#                     is_update = 'Item' in existing_item
#                 except Exception as e_check:
#                     logger.warning(f"SQS Worker - Error checking for existing item {content_id}: {str(e_check)}")
#                     is_update = False # Assume new if check fails

#                 table.put_item(Item=prepared_body)

#                 if is_update:
#                     logger.info(f"SQS Worker - Successfully updated item {content_id} in DynamoDB table {DYNAMODB_TABLE_NAME}")
#                 else:
#                     logger.info(f"SQS Worker - Successfully created item {content_id} in DynamoDB table {DYNAMODB_TABLE_NAME}")

#                 # If processing is successful, the message will be automatically deleted from the SQS queue
#                 # by Lambda if the function executes without unhandled exceptions.

#             except boto3.exceptions.Boto3Error as db_error:
#                 logger.error(f"SQS Worker - DynamoDB error for {content_id}: {str(db_error)}")
#                 # Let Lambda handle retry/DLQ based on SQS trigger config
#                 raise db_error # Re-raise to signal failure to the SQS trigger

#         except Exception as e:
#             # Catch-all for errors processing a single record
#             trace = traceback.format_exc()
#             content_id_err = 'UNKNOWN_ID'
#             try: # Try to get content_id from body if parsing succeeded
#                 content_id_err = json.loads(record['body']).get('content_id', 'UNKNOWN_ID_IN_BODY')
#             except Exception as parse_error:
#                 logger.warning(f"SQS Worker - Failed to parse record body for content_id: {str(parse_error)}")
#             logger.error(f"SQS Worker - Failed to process record for {content_id_err}: {str(e)}\n{trace}")
#             # Re-raise the exception to ensure the message is not deleted and potentially retried or sent to DLQ
#             raise e

# # ==============================================================
# # == Helper Functions (Used by both handlers potentially) ==
# # ==============================================================

# def validate_field_types(body):
#     """Validate the types of fields in the request body."""
#     errors = []
#     if 'content_type' in body and not isinstance(body['content_type'], str):
#         errors.append("content_type must be a string")
#     if 'description' in body and not isinstance(body['description'], str):
#         errors.append("description must be a string")
#     if 'url' in body and not isinstance(body['url'], str):
#         errors.append("url must be a string")
#     # Allow tags/media_link to be string OR list coming into worker
#     if 'tags' in body and body['tags'] and not isinstance(body['tags'], (str, list)):
#         errors.append("tags must be a comma-separated string or list")
#     if 'media_link' in body and body['media_link'] and not isinstance(body['media_link'], (str, list)):
#         errors.append("media_link must be a comma-separated string or list")
#     # Generated tags from LLM should be a list
#     if 'generated_tags' in body and body['generated_tags'] and not isinstance(body['generated_tags'], list):
#          # This might happen if LLM returns a string despite prompt; we handle it during processing
#          pass # Logged during processing if needed
#     return "; ".join(errors) if errors else None

# def prepare_data_for_dynamodb(body):
#     """Prepare data for DynamoDB, converting fields to Sets."""
#     # Convert comma-separated strings or lists to sets for DynamoDB
#     for field in ['tags', 'media_link', 'generated_tags']:
#         if field in body and body[field]:
#             value = body[field]
#             if isinstance(value, str):
#                 # Split by comma, strip whitespace, remove empty strings
#                 body[field] = set(item.strip() for item in value.split(',') if item.strip())
#             elif isinstance(value, list):
#                 # Convert list to set, ensure items are strings and stripped
#                 body[field] = set(str(item).strip() for item in value if str(item).strip())

#             # If the set is empty after processing, remove the field or store empty set based on preference
#             if not body[field]:
#                  del body[field] # Remove empty sets before writing to DynamoDB

#     # Ensure generated_tags is handled correctly (it should be list from LLM processing step)
#     if 'generated_tags' in body and isinstance(body['generated_tags'], list):
#          body['generated_tags'] = set(str(tag).strip() for tag in body['generated_tags'] if str(tag).strip())
#          if not body['generated_tags']:
#              del body['generated_tags']

#     # Remove fields not meant for DynamoDB (like SQS details)
#     body.pop('sqs_message_id', None)
#     body.pop('sqs_receipt_handle', None)

#     return body

# def create_error_response(status_code, error_type, message):
#     """Create a standardized error response for API Gateway."""
#     logger.error(f"Returning Error: {error_type} - {message}")
#     return {
#         'statusCode': status_code,
#         'body': json.dumps({
#             'error': {
#                 'type': error_type,
#                 'message': message,
#                 'timestamp': datetime.now().isoformat()
#             }
#         }),
#         'headers': {'Content-Type': 'application/json'}
#     }

# def generate_content_with_llm(content_type, description, tags):
#     """Generate content using Claude LLM."""
#     # Convert tags to string if received as list/set for the prompt
#     if isinstance(tags, (list, set)):
#         tags_str = ", ".join(tags)
#     else:
#         tags_str = tags or ""

#     word_count = "10-15" if content_type.lower() == "post" else "15-20"
#     prompt = f"""
#     Content Type: {content_type}
#     My Draft: {description}
#     Current Tags: {tags_str}

#     Hey, help me refine this {content_type} I'm working on. I need:

#     1. An attention-grabbing title (3-6 words) - something that would make YOU want to click. Be intriguing but not clickbaity.
#     2. A punchy description (around {word_count} words) that sounds like a real person wrote it - conversational, occasionally using "I" statements, and avoiding perfectionist language or overly formal structure.
#     3. Exactly 3 tags that would help this content reach the right audience - be specific rather than generic.

#     My writing style is straightforward with occasional humor. I prefer active voice and concrete examples over abstract concepts. I sometimes use short sentences for emphasis.

#     Return as JSON with keys: title, description, tags (array of 3 strings)
#     """

#     # Use a specific model known for JSON output if possible
#     result = call_claude(
#         prompt=prompt,
#         model_id="us.anthropic.claude-3-sonnet-20240229-v1:0", # Or another reliable model
#         extract_json=True,
#         max_tokens=500 # Reduced tokens slightly
#     )

#     if "error" in result:
#         logger.warning(f"LLM response contained an error: {result.get('error')}")
#         if "raw_response" in result:
#             logger.info(f"Raw LLM response: {result.get('raw_response')}")
#         # Return fallback structure matching expected output
#         return {"title": "", "description": "", "tags": []}

#     # Ensure tags is a list
#     if 'tags' in result and not isinstance(result['tags'], list):
#          try:
#              # Try converting comma-separated string if LLM messed up
#              result['tags'] = [tag.strip() for tag in str(result['tags']).split(',') if tag.strip()]
#          except Exception as e:
#              logger.warning(f"Could not parse 'tags' from LLM into a list: {result['tags']}. Error: {str(e)}")
#              result['tags'] = [] # Fallback to empty list

#     logger.info(f"LLM Response: {json.dumps(result)}")
#     return result # Should contain title, description, tags (as list) 