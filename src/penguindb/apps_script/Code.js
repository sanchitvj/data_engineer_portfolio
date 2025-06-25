// =============================================================
// CONSTANTS AND CONFIGURATION
// =============================================================

// Constants for status values
var STATUS = typeof STATUS !== 'undefined' ? STATUS : {
  NEW: "new",
  PENDING: "pending",
  PROCESSED: "processed",
  ERROR: "error"
};

// Column indices (adjust based on your actual sheet structure)
var COLUMNS = typeof COLUMNS !== 'undefined' ? COLUMNS : {
  CONTENT_ID: 0,  // Column for unique identifier
  CONTENT_TYPE: 1,
  DATE_PUBLISHED: 2,
  TITLE: 3,       // Original title from source content
  DESCRIPTION: 4,
  URL: 5,
  EMBED_LINK: 6,
  TAGS: 7,
  MEDIA_LINK: 8,
  STATUS: 9,
  ERROR_DETAILS: 10,
  LAST_UPDATED: 11,
  ATTEMPT_COUNT: 12
};

// Configuration
const CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,
  API_GATEWAY_URL: "https://nksl4ooqzg.execute-api.us-east-1.amazonaws.com/prod/",
  SHEET_NAME: "prod",
  REQUEST_TIMEOUT: 30000, // 30 seconds timeout
  STATUS_CHECK_API: "" // Optional: API endpoint for status checking (if you create one)
};

// =============================================================
// MAIN PROCESSING FUNCTIONS (SENDING DATA TO AWS)
// =============================================================

// Main function triggered on edit
function onEdit(e) {
  try {
  // Get the edited range and sheet
    const range = e.range;
    const sheet = range.getSheet();
  
  // Check if we're in the right sheet and if the status column was edited to "new"
    if (isStatusColumnEditedToNew(sheet, range)) {
      processRow(sheet, range.getRow());
    }
  } catch (error) {
    console.error("Error in onEdit: " + error.toString());
  }
}

// Process rows with "new" status
function processNewItems() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      console.error(`Sheet '${CONFIG.SHEET_NAME}' not found`);
      return;
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.STATUS] === STATUS.NEW) {
        processRow(sheet, i + 1); // +1 because array is 0-indexed but sheet is 1-indexed
      }
    }
  } catch (error) {
    console.error("Error in processNewItems: " + error.toString());
  }
}

// Retry items in error state (can be triggered manually or on a schedule)
function retryErrorItems() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return;
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    for (let i = 1; i < values.length; i++) {
      const status = values[i][COLUMNS.STATUS];
      const attemptCount = values[i][COLUMNS.ATTEMPT_COUNT] || 0;
      
      if (status === STATUS.ERROR && attemptCount < CONFIG.MAX_RETRY_ATTEMPTS) {
        processRow(sheet, i + 1);
      }
    }
  } catch (error) {
    console.error("Error in retryErrorItems: " + error.toString());
  }
}

// Check if the status column was edited to "new"
function isStatusColumnEditedToNew(sheet, range) {
  return sheet.getName() === CONFIG.SHEET_NAME && 
         range.getColumn() === COLUMNS.STATUS + 1 && 
         range.getValue().toLowerCase() === STATUS.NEW;
}

// Process a single row
function processRow(sheet, rowIndex) {
  try {
    // Get row data
    if (rowIndex <= 1) return; // Skip header row
    
    // Get or generate content_id
    const contentIdCell = sheet.getRange(rowIndex, COLUMNS.CONTENT_ID + 1);
    let contentId = contentIdCell.getValue();
    
    // Always generate a new content_id if it's empty or invalid
    if (!contentId || typeof contentId !== 'string' || contentId.trim() === '') {
      contentId = generateUUID();
      contentIdCell.setValue(contentId);
      Logger.log(`Generated new content_id: ${contentId} for row ${rowIndex}`);
    }

    // Track attempt count
    const attemptCell = sheet.getRange(rowIndex, COLUMNS.ATTEMPT_COUNT + 1);
    const attemptCount = attemptCell.getValue() || 0;
    attemptCell.setValue(attemptCount + 1);

    // Clear previous error if any
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue("");

    // Set status to PENDING before sending
    updateStatus(sheet, rowIndex, STATUS.PENDING);

    // Collect data from the row
    const rowData = sheet.getRange(rowIndex, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];
    const headers = sheet.getRange(1, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];

    const data = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) {
        // Handle array/object values
        if (typeof rowData[i] === 'object' && rowData[i] !== null && typeof rowData[i].values === 'function') { 
          data[headers[i]] = Array.from(rowData[i]).join(', ');
        } else {
      data[headers[i]] = rowData[i];
        }
      }
    }
    
    // Ensure key fields are included and properly formatted
    data.content_id = contentId;
    data.timestamp = new Date().toISOString();
    
    // Log the data being sent
    Logger.log(`Processing row ${rowIndex} with content_id: ${contentId}`);
    Logger.log(`Data being sent: ${JSON.stringify(data)}`);
    
    // Send data to AWS API Gateway
    const result = sendToAWS(data);
    
    // Update status based on result
    if (result.success) {
      // Success response means it was either accepted (202) or processed (200)
      // If we get generated content back, we can update status to PROCESSED immediately
      if (result.data && result.data.generated_title) {
        updateStatus(sheet, rowIndex, STATUS.PROCESSED);
        
        // Optionally add generated title as a note
        const statusCell = sheet.getRange(rowIndex, COLUMNS.STATUS + 1);
        statusCell.setNote("Generated title: " + result.data.generated_title);
        
        Logger.log("Content processed for content_id: " + contentId + " with title: " + result.data.generated_title);
      } else {
        // Keep as PENDING if no generated content yet
        Logger.log("Request accepted for content_id: " + contentId);
      }
    } else if (result.error && result.error.includes("504")) {
      // Special handling for 504 Gateway Timeout
      // The request might still be processing, even though API Gateway timed out
      updateStatus(sheet, rowIndex, STATUS.PENDING, 
        "Request accepted but API timed out. Your data may still be processing. Check status later or run manualStatusSync.");
      Logger.log("API Gateway timeout for content_id: " + contentId + " - item may still process successfully");
    } else {
      // Other API call failures
      updateStatus(sheet, rowIndex, STATUS.ERROR, result.error);
    }
  } catch (error) {
    console.error("Error in processRow for row " + rowIndex + ": " + error.toString() + " Stack: " + error.stack);
    // Ensure status is updated to ERROR on script exception
    try {
        updateStatus(sheet, rowIndex, STATUS.ERROR, "Script error: " + error.toString());
    } catch (updateErr) {
        console.error("Failed to update status after error: " + updateErr.toString());
    }
  }
}

/**
 * Sends data to the AWS API Gateway endpoint with retry logic.
 * Updates the sheet status based on the outcome.
 *
 * @param {string} content_id The unique ID for the content.
 * @param {object} data The data object to send.
 * @param {Sheet} sheet The Google Sheet object.
 * @param {Range} statusCell The cell where the status should be updated.
 * @param {Range} errorCell The cell where error details should be updated.
 */
function sendToAWS(data) {
  const apiGatewayUrl = CONFIG.API_GATEWAY_URL;
  if (!apiGatewayUrl) {
    Logger.log("API Gateway URL is not set.");
    return {
      success: false,
      error: "API Gateway URL not configured in script."
    };
  }

  const payload = JSON.stringify(data);
  const options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true, // Prevent throwing exceptions on HTTP errors like 500
    timeout: CONFIG.REQUEST_TIMEOUT || 30000 // Default 30 seconds timeout
  };

  const MAX_RETRIES = 4; // Max number of retries (total 5 attempts)
  const INITIAL_BACKOFF_MS = 1000; // Start with 1 second backoff
  let response;
  let success = false;
  let attempt = 0;
  let responseBody = "";
  let responseCode = 0;
  let lastError = "";

  for (attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      Logger.log(`Attempt ${attempt + 1} to send data for content_id: ${data.content_id} to ${apiGatewayUrl}`);
      response = UrlFetchApp.fetch(apiGatewayUrl, options);
      responseCode = response.getResponseCode();
      responseBody = response.getContentText();

      Logger.log(`Response Code: ${responseCode}`);
      Logger.log(`Response Body: ${responseBody}`); // For debugging API response format

      // Handle API Gateway wrapped responses, which might contain a statusCode within a 200 response
      let actualResponseCode = responseCode;
      let actualResponseBody = responseBody;
      let parsedResponse = null;
      
      // Try to parse the response to see if it's wrapped by API Gateway
      try {
        parsedResponse = JSON.parse(responseBody);
        
        // Check if this is an API Gateway wrapped response
        if (parsedResponse.statusCode && parsedResponse.body) {
          actualResponseCode = parsedResponse.statusCode;
          
          // The body is often a stringified JSON, so we need to parse it again
          try {
            actualResponseBody = JSON.parse(parsedResponse.body);
            Logger.log(`Unwrapped API Gateway response. Inner status: ${actualResponseCode}`);
            Logger.log(`Unwrapped body: ${JSON.stringify(actualResponseBody)}`);
          } catch (innerErr) {
            // If inner parsing fails, use the string as is
            actualResponseBody = parsedResponse.body;
          }
        }
      } catch (parseErr) {
        // If parsing fails, use original response
        Logger.log(`Failed to parse response as JSON: ${parseErr.toString()}`);
        // Continue with original responseCode and responseBody
      }
      
      // Now handle based on the actualResponseCode, which might be from the inner response
      if (actualResponseCode === 202 || 
          (actualResponseCode === 200 && parsedResponse && parsedResponse.statusCode === 202) ||
          // Handle SQS success responses
          (actualResponseCode === 200 && parsedResponse && parsedResponse.SendMessageResponse)) {
        Logger.log(`Request accepted by API Gateway for content_id: ${data.content_id}.`);
        success = true;
        
        // Return the unwrapped response if available
        if (typeof actualResponseBody === 'object') {
          return {
            success: true,
            data: actualResponseBody
          };
        } else {
          // Try to parse the actualResponseBody if it's a string
          try {
            const innerData = JSON.parse(actualResponseBody);
            return {
              success: true,
              data: innerData
            };
          } catch (e) {
            // Return the string as is if parsing fails
            return {
              success: true,
              data: {
                message: actualResponseBody
              }
            };
          }
        }
      } else if (actualResponseCode === 500 || actualResponseCode === 429 || 
                 actualResponseCode === 503 || actualResponseCode === 504) {
        // Retryable errors (Internal Server Error, Rate Limit, Service Unavailable)
        Logger.log(`Received retryable error code: ${actualResponseCode}. Retrying attempt ${attempt + 1}/${MAX_RETRIES + 1}...`);
        
        if (typeof actualResponseBody === 'object') {
          lastError = `API Error ${actualResponseCode}: ${JSON.stringify(actualResponseBody)}`;
        } else {
          lastError = `API Error ${actualResponseCode}: ${actualResponseBody}`;
        }
        
        if (attempt < MAX_RETRIES) {
          // Calculate backoff with jitter
          const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          const jitter = Math.random() * 1000; // Add up to 1s jitter
          const waitTime = backoffTime + jitter;
          Logger.log(`Waiting for ${waitTime.toFixed(0)} ms before next retry.`);
          Utilities.sleep(waitTime);
        } else {
          Logger.log(`Max retries reached for content_id: ${data.content_id}. Final error code: ${actualResponseCode}.`);
        }
      } else {
        // Non-retryable error (e.g., 400 Bad Request, 403 Forbidden)
        // Special handling for SQS success responses that might be misinterpreted as errors
        if (actualResponseCode === 200 && responseBody.includes("SendMessageResponse")) {
          Logger.log(`SQS success response detected for content_id: ${data.content_id}`);
          success = true;
          return {
            success: true,
            data: parsedResponse || responseBody
          };
        }
        
        Logger.log(`Received non-retryable error code: ${actualResponseCode} for content_id: ${data.content_id}.`);
        
        if (typeof actualResponseBody === 'object') {
          lastError = `API Error ${actualResponseCode}: ${JSON.stringify(actualResponseBody)}`;
        } else {
          lastError = `API Error ${actualResponseCode}: ${actualResponseBody}`;
        }
        break; // Exit loop on non-retryable error
      }
    } catch (e) {
      // Catch potential network errors from UrlFetchApp itself
      Logger.log(`Network or fetch error during attempt ${attempt + 1}: ${e.message}`);
      lastError = `Network/Fetch Error: ${e.message}`;
      
      if (attempt < MAX_RETRIES) {
         const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
         const jitter = Math.random() * 1000;
         const waitTime = backoffTime + jitter;
         Logger.log(`Waiting for ${waitTime.toFixed(0)} ms before retrying after fetch error.`);
         Utilities.sleep(waitTime);
      } else {
         Logger.log(`Max retries reached after fetch error for content_id: ${data.content_id}. Final error: ${e.message}`);
      }
    }
  }

  if (success) {
    // This code shouldn't be reached if success is true, but just in case
    return {
      success: true,
      data: {
        message: "Request accepted",
        content_id: data.content_id
      }
    };
  } else {
    return {
      success: false,
      error: lastError || `Failed after ${attempt + 1} attempts. Last response code: ${responseCode}`
    };
  }
}

// Update status and related columns
function updateStatus(sheet, rowIndex, status, errorDetails = "") {
  sheet.getRange(rowIndex, COLUMNS.STATUS + 1).setValue(status);
  sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1).setValue(new Date());
  
  if (errorDetails) {
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue(errorDetails);
  }
}

// To run all rows with "error" status:
function manualRetry() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Skip header row
  for (let i = 1; i < values.length; i++) {
    if (values[i][COLUMNS.STATUS] === STATUS.ERROR) {
      // Reset attempt count
      sheet.getRange(i + 1, COLUMNS.ATTEMPT_COUNT + 1).setValue(0);
      // Set status to new
      sheet.getRange(i + 1, COLUMNS.STATUS + 1).setValue(STATUS.NEW);
    }
  }
  
  // Then process all "new" rows
  processNewItems();
}

// =============================================================
// WEB APP ENDPOINTS (RECEIVING UPDATES FROM AWS)
// =============================================================

// Web App entry point - handles POST requests from AWS Lambda
function doPost(e) {
  try {
    // Parse the incoming request
    const requestData = JSON.parse(e.postData.contents);
    Logger.log("Received POST request: " + JSON.stringify(requestData));
    
    // Validate the request
    if (!requestData.action) {
      Logger.log("Missing required field: action");
      return createErrorResponse("Missing required field: action");
    }
    
    if (!requestData.content_id) {
      Logger.log("Missing required field: content_id");
      return createErrorResponse("Missing required field: content_id");
    }
    
    // Handle different actions
    switch (requestData.action.toLowerCase()) {
      case "updatestatus":
        Logger.log(`Processing status update for content_id: ${requestData.content_id}, status: ${requestData.status}`);
        
        // Map status to proper format if needed (allow for case differences)
        let newStatus;
        if (requestData.status) {
          // Use raw status directly without any case manipulation, since Lambda is 
          // already sending normalized lowercase status that matches our STATUS constants
          if (requestData.status === "processed" || 
              requestData.status === "error" || 
              requestData.status === "pending" || 
              requestData.status === "new") {
            // Use the status as-is since it already matches our expected format
            newStatus = requestData.status;
          } else {
            // For any other status (like DB_UPDATE_ERROR or LLM_ERROR), convert to error
            Logger.log(`Non-standard status received: ${requestData.status}, mapping to error`);
            newStatus = STATUS.ERROR;
          }
        } else {
          // Default to PROCESSED if status not specified but we're getting an update
          newStatus = STATUS.PROCESSED;
        }
        
        // Log the status update
        Logger.log(`Updating status for ${requestData.content_id} to ${newStatus}`);
        
        // Call helper function to update the status (includes better error handling)
        try {
          const result = updateItemStatus(
            requestData.content_id, 
            newStatus, 
            requestData.processed_at,
            requestData.generated_title,
            requestData.generated_tags || requestData.generated_tag  // Handle both forms
          );
          
          Logger.log(`Status update result: ${JSON.stringify(result)}`);
          return createSuccessResponse(result);
        } catch (updateError) {
          Logger.log(`Error updating status: ${updateError.toString()}`);
          return createErrorResponse(`Error updating status: ${updateError.toString()}`);
        }
        
      default:
        Logger.log(`Unknown action: ${requestData.action}`);
        return createErrorResponse(`Unknown action: ${requestData.action}`);
    }
    
  } catch (error) {
    Logger.log(`Error processing request: ${error.toString()}`);
    Logger.log(`Stack trace: ${error.stack}`);
    return createErrorResponse(`Error processing request: ${error.toString()}`);
  }
}

// Web App entry point - handles GET requests (for testing)
function doGet(e) {
  try {
    // Check if there's an action parameter
    if (e && e.parameter && e.parameter.action) {
      const action = e.parameter.action;
      
      // Handle getPendingItems action
      if (action === "getPendingItems") {
        Logger.log("Received request for pending items");
        const pendingItems = getPendingItemsForStatusChecker();
        return ContentService.createTextOutput(
          JSON.stringify({
            status: "success",
            data: pendingItems,
            count: pendingItems.length,
            timestamp: new Date().toISOString()
          })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Default response if no action or unknown action
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "success",
        message: "Content Manager is running. Use POST to update status.",
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: "Error processing request: " + error.toString(),
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to get all pending items for the status checker
function getPendingItemsForStatusChecker() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      Logger.log("Sheet not found: " + CONFIG.SHEET_NAME);
      return [];
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0]; // First row is headers
    
    // Find indices of important columns
    const contentIdIdx = headers.indexOf("content_id");
    const statusIdx = headers.indexOf("status");
    
    // If we can't find the required columns, return empty array
    if (contentIdIdx === -1 || statusIdx === -1) {
      Logger.log("Required columns not found in sheet");
      return [];
    }
    
    // Collect all pending items
    const pendingItems = [];
    
    // Start from row 1 (skip header row 0)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const status = row[statusIdx];
      
      // Check if this row has PENDING status
      if (status && status.toString().toLowerCase() === STATUS.PENDING) {
        const contentId = row[contentIdIdx];
        if (contentId) {
          // Create object with all columns
          const item = {
            content_id: contentId,
            status: status
          };
          
          // Add other columns that exist
          for (let j = 0; j < headers.length; j++) {
            if (j !== contentIdIdx && j !== statusIdx && headers[j]) {
              item[headers[j]] = row[j] || "";
            }
          }
          
          pendingItems.push(item);
        }
      }
    }
    
    Logger.log(`Found ${pendingItems.length} pending items`);
    return pendingItems;
  } catch (error) {
    Logger.log("Error getting pending items: " + error.toString());
    return [];
  }
}

// Update the status of an item in the sheet based on content_id
function updateItemStatus(contentId, status, processedAt, generatedTitle, generatedTags) {
  if (!contentId) {
    throw new Error("Content ID is required");
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet '${CONFIG.SHEET_NAME}' not found`);
  }
  
  // Find the row with the matching content_id
  const rowIndex = findRowByContentId(sheet, contentId);
  if (rowIndex === -1) {
    throw new Error(`Content ID not found: ${contentId}`);
  }
  
  Logger.log(`Found content_id ${contentId} at row ${rowIndex}, setting status to "${status}"`);
  
  // Verify that status is a valid value
  const validStatusValues = [STATUS.NEW, STATUS.PENDING, STATUS.PROCESSED, STATUS.ERROR];
  if (!validStatusValues.includes(status)) {
    Logger.log(`WARNING: Status "${status}" is not one of the standard values: ${JSON.stringify(validStatusValues)}`);
  }
  
  // Update the status and timestamp
  sheet.getRange(rowIndex, COLUMNS.STATUS + 1).setValue(status);
  sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1).setValue(new Date());
  
  // Clear error details if status is no longer ERROR
  if (status !== STATUS.ERROR) {
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue("");
  }
  
  // Add additional info as cell notes
  if (processedAt) {
    const cell = sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1);
    cell.setNote(`Processed at: ${processedAt}`);
  }
  
  // Handle generated content (title, tags, etc.)
  let notesUpdated = false;
  
  if (generatedTitle && generatedTitle.trim() !== "") {
    const statusCell = sheet.getRange(rowIndex, COLUMNS.STATUS + 1);
    const currentNote = statusCell.getNote() || "";
    // Add generated title to notes, keeping any existing notes
    const newNote = currentNote ? `${currentNote}\nGenerated title: ${generatedTitle}` : `Generated title: ${generatedTitle}`;
    statusCell.setNote(newNote);
    notesUpdated = true;
  }
  
  // Format tags for display if available
  if (generatedTags) {
    let tagsStr;
    if (Array.isArray(generatedTags)) {
      tagsStr = generatedTags.join(", ");
    } else if (typeof generatedTags === 'string') {
      tagsStr = generatedTags;
    }
    
    if (tagsStr) {
      // Add to the notes
      try {
        const tagsCell = sheet.getRange(rowIndex, COLUMNS.TAGS + 1);
        const currentNote = tagsCell.getNote() || "";
        const newNote = currentNote ? `${currentNote}\nGenerated tags: ${tagsStr}` : `Generated tags: ${tagsStr}`;
        tagsCell.setNote(newNote);
      } catch (tagsError) {
        Logger.log(`Error setting tags note: ${tagsError.toString()}`);
      }
    }
  }
  
  return {
    message: "Status updated successfully",
    contentId: contentId,
    rowIndex: rowIndex,
    status: status,
    updated: new Date().toISOString(),
    notes_updated: notesUpdated
  };
}

// Find row by content_id
function findRowByContentId(sheet, contentId) {
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) { // Skip header row
    if (values[i][COLUMNS.CONTENT_ID] === contentId) {
      return i + 1; // +1 because array is 0-indexed, sheet is 1-indexed
    }
  }
  
  return -1; // Not found
}

// Helper function to create a standardized error response
function createErrorResponse(message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "error",
      message: message,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Helper function to create a standardized success response
function createSuccessResponse(data) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      data: data,
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// =============================================================
// UTILITIES AND SETUP
// =============================================================

// Generate a UUID (RFC4122 version 4 compliant)
function generateUUID() {
  return Utilities.getUuid();
}

// Create time-based triggers (run once to set up automated processing)
function createTriggers() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // Create a trigger to process new items every 5 minutes
  ScriptApp.newTrigger('processNewItems')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  // Create a trigger to retry error items every hour
  ScriptApp.newTrigger('retryErrorItems')
    .timeBased()
    .everyHours(1)
    .create();
}

// Create a menu in the spreadsheet with actions
function onOpen(e) {
  // This is a safer way to handle both simple and installable triggers
  try {
    // Check if we're in a UI context where getUi() is available
    var ui = SpreadsheetApp.getUi();
    
    // Create the menu
    ui.createMenu('Content Pipeline')
      .addItem('Process New Items', 'processNewItems')
      .addItem('Retry Error Items', 'retryErrorItems')
      .addItem('Reset & Retry All Errors', 'manualRetry')
      .addItem('Sync Statuses with DynamoDB', 'manualStatusSync')
      .addSeparator()
      .addItem('Reset Selected Row to NEW', 'resetSelectedRowToNew')
      .addItem('Process Selected Row Only', 'processSelectedRow')
      .addSeparator()
      .addItem('Setup Triggers', 'createTriggers')
      .addToUi();
      
    Logger.log("Added Content Pipeline menu");
  } catch (error) {
    // If getUi() isn't available (web app context, etc.), log and continue
    Logger.log("Running in non-UI context, skipping menu creation: " + error.toString());
  }
}

// Function to manually add the menu (run this from the script editor)
function addMenu() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Content Pipeline')
      .addItem('Process New Items', 'processNewItems')
      .addItem('Retry Error Items', 'retryErrorItems')
      .addItem('Reset & Retry All Errors', 'manualRetry')
      .addItem('Sync Statuses with DynamoDB', 'manualStatusSync')
      .addSeparator()
      .addItem('Reset Selected Row to NEW', 'resetSelectedRowToNew')
      .addItem('Process Selected Row Only', 'processSelectedRow')
      .addSeparator()
      .addItem('Setup Triggers', 'createTriggers')
      .addToUi();
    
    Logger.log("Menu added successfully");
  } catch (error) {
    Logger.log("Error adding menu: " + error.toString());
  }
}

// Process selected row(s)
function processSelectedRow() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const activeRange = sheet.getActiveRange();
    
    if (!activeRange) {
      SpreadsheetApp.getUi().alert("Please select cell(s) in the row(s) you want to process");
      return;
    }
    
    // Get all selected rows
    const startRow = activeRange.getRow();
    const numRows = activeRange.getNumRows();
    
    // Check if header row is selected
    if (startRow <= 1 && startRow + numRows > 1) {
      SpreadsheetApp.getUi().alert("Cannot process header row. Please select only data rows.");
      return;
    }
    
    // Track processed rows
    let processedRows = 0;
    let errorRows = 0;
    
    // Process each selected row
    for (let i = 0; i < numRows; i++) {
      const currentRow = startRow + i;
      
      // Skip header row if somehow included
      if (currentRow <= 1) continue;
      
      try {
        // Process this specific row
        processRow(sheet, currentRow);
        processedRows++;
        
        // Log for debugging
        Logger.log(`Processed row ${currentRow}`);
      } catch (rowError) {
        errorRows++;
        Logger.log(`Error processing row ${currentRow}: ${rowError.toString()}`);
      }
    }
    
    // Show confirmation based on how many rows were processed
    if (errorRows === 0) {
      if (processedRows === 1) {
        SpreadsheetApp.getUi().alert(`1 row has been processed successfully.`);
      } else {
        SpreadsheetApp.getUi().alert(`${processedRows} rows have been processed successfully.`);
      }
    } else {
      SpreadsheetApp.getUi().alert(`Processed ${processedRows} rows with ${errorRows} errors. Check the logs for details.`);
    }
    
  } catch (error) {
    Logger.log("Error in processSelectedRow: " + error.toString());
    SpreadsheetApp.getUi().alert("Error: " + error.toString());
  }
}

// Reset the selected row(s) to NEW status
function resetSelectedRowToNew() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const activeRange = sheet.getActiveRange();
    
    if (!activeRange) {
      SpreadsheetApp.getUi().alert("Please select cell(s) in the row(s) you want to reset");
      return;
    }
    
    // Get all selected rows
    const startRow = activeRange.getRow();
    const numRows = activeRange.getNumRows();
    
    // Check if header row is selected
    if (startRow <= 1 && startRow + numRows > 1) {
      SpreadsheetApp.getUi().alert("Cannot reset header row. Please select only data rows.");
      return;
    }
    
    // Track processed rows
    let processedRows = 0;
    
    // Process each selected row
    for (let i = 0; i < numRows; i++) {
      const currentRow = startRow + i;
      
      // Skip header row if somehow included
      if (currentRow <= 1) continue;
      
      // Reset this row
      sheet.getRange(currentRow, COLUMNS.STATUS + 1).setValue(STATUS.NEW);
      sheet.getRange(currentRow, COLUMNS.ATTEMPT_COUNT + 1).setValue(0);
      sheet.getRange(currentRow, COLUMNS.ERROR_DETAILS + 1).setValue("");
      sheet.getRange(currentRow, COLUMNS.LAST_UPDATED + 1).setValue(new Date());
      
      processedRows++;
      
      // Log for debugging
      Logger.log(`Reset row ${currentRow} to NEW status`);
    }
    
    // Show confirmation based on how many rows were processed
    if (processedRows === 1) {
      SpreadsheetApp.getUi().alert(`1 row has been reset to NEW status.`);
    } else {
      SpreadsheetApp.getUi().alert(`${processedRows} rows have been reset to NEW status.`);
    }
    
  } catch (error) {
    Logger.log("Error in resetSelectedRowToNew: " + error.toString());
    SpreadsheetApp.getUi().alert("Error: " + error.toString());
  }
}

// Manual check for all pending statuses
function manualStatusSync() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return;
    
    let checkedCount = 0;
    
    // Get all rows with PENDING status
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    for (let i = 1; i < values.length; i++) {
      if (values[i][COLUMNS.STATUS] === STATUS.PENDING) {
        const contentId = values[i][COLUMNS.CONTENT_ID];
        if (!contentId) continue;
        
        // Log for debugging
        Logger.log(`Checking status for content_id: ${contentId}`);
        
        // Add a note to indicate we checked this row
        const statusCell = sheet.getRange(i + 1, COLUMNS.STATUS + 1);
        const currentNote = statusCell.getNote() || "";
        statusCell.setNote(currentNote + "\nStatus checked: " + new Date().toLocaleString());
        
        checkedCount++;
      }
    }
    
    // Display summary message
    const ui = SpreadsheetApp.getUi();
    ui.alert(`Status check initiated for ${checkedCount} pending items.\n\nIMPORTANT: This does not update statuses immediately. The Status Checker Lambda must be configured with your Apps Script Web App URL to receive updates back from DynamoDB.\n\nCheck if your Lambda has the correct GOOGLE_SHEET_URL environment variable set.`);
    
    // Return a summary for logging
    return `Checked ${checkedCount} pending items`;
    
  } catch (error) {
    Logger.log("Error in manualStatusSync: " + error.toString());
    const ui = SpreadsheetApp.getUi();
    ui.alert("Error during status sync: " + error.toString());
    return "Error: " + error.toString();
  }
}

// Helper function to reset configuration errors
function checkConfiguration() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    Logger.log(`ERROR: Sheet '${CONFIG.SHEET_NAME}' not found`);
    return false;
  }
  
  // Collect information for diagnosis
  const info = {
    sheetName: sheet.getName(),
    rowCount: sheet.getLastRow(),
    apiGatewayUrl: CONFIG.API_GATEWAY_URL,
    webAppUrl: ScriptApp.getService().getUrl()
  };
  
  Logger.log("Configuration check results:");
  Logger.log(JSON.stringify(info, null, 2));
  
  // Show to user
  const ui = SpreadsheetApp.getUi();
  ui.alert(`Configuration Information:
  - Sheet name: ${info.sheetName}
  - Row count: ${info.rowCount}
  - API Gateway URL: ${info.apiGatewayUrl}
  - This Web App URL: ${info.webAppUrl}
  
IMPORTANT: Make sure your Status Checker Lambda is configured with this Web App URL in its GOOGLE_SHEET_URL environment variable.`);
  
  return true;
}

// Setup function to deploy as web app
function setup() {
  // You must manually deploy as web app after running this
  // 1. From the Apps Script editor: Deploy > New deployment
  // 2. Select type: Web app
  // 3. Who has access: Anyone (anonymous) or Anyone (with Google account)
  // 4. Deploy and copy the URL for AWS Lambda environment variable
  
  Logger.log("Setup complete. Now deploy as web app from the Deploy menu.");
  
  // Show the Web App URL if already deployed
  try {
    const webAppUrl = ScriptApp.getService().getUrl();
    if (webAppUrl) {
      Logger.log("Your Web App URL: " + webAppUrl);
      Logger.log("Use this URL in your Status Checker Lambda's GOOGLE_SHEET_URL environment variable");
    }
  } catch (e) {
    Logger.log("Web App not deployed yet. Please deploy from the Deploy menu.");
  }
}

// For testing in the script editor
function testFindRow() {
  // Replace with an actual content_id from your sheet
  const testContentId = "123456-test-id"; 
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    const rowIndex = findRowByContentId(sheet, testContentId);
    
    if (rowIndex > 0) {
      Logger.log("Found at row: " + rowIndex);
    } else {
      Logger.log("Content ID not found");
    }
  } catch (error) {
    Logger.log("Error in test: " + error.toString());
  }
} 