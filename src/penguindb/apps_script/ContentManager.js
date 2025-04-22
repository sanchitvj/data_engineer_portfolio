// Constants for status values
const STATUS = {
  NEW: "new",
  PENDING: "pending",
  PROCESSED: "processed",
  ERROR: "error"
};

// Column indices (adjust based on your actual sheet structure)
const COLUMNS = {
  CONTENT_ID: 0,  // New column for the unique identifier
  CONTENT_TYPE: 1,
  DATE_PUBLISHED: 2,
  DESCRIPTION: 3,
  URL: 4,
  EMBED_LINK: 5,
  TAGS: 6,
  MEDIA_LINK: 7,
  STATUS: 8,
  ERROR_DETAILS: 9,
  LAST_UPDATED: 10,
  ATTEMPT_COUNT: 11
};

// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 3;

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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    for (let i = 1; i < values.length; i++) {
      const status = values[i][COLUMNS.STATUS];
      const attemptCount = values[i][COLUMNS.ATTEMPT_COUNT] || 0;
      
      if (status === STATUS.ERROR && attemptCount < MAX_RETRY_ATTEMPTS) {
        processRow(sheet, i + 1);
      }
    }
  } catch (error) {
    console.error("Error in retryErrorItems: " + error.toString());
  }
}

// Check if the status column was edited to "new"
function isStatusColumnEditedToNew(sheet, range) {
  return sheet.getName() === "Sheet1" && 
         range.getColumn() === COLUMNS.STATUS + 1 && 
         range.getValue().toLowerCase() === STATUS.NEW;
}

// Process a single row
function processRow(sheet, rowIndex) {
  try {
    // Get row data
    if (rowIndex <= 1) return; // Skip header row
    
    const contentIdCell = sheet.getRange(rowIndex, COLUMNS.CONTENT_ID + 1);
    let contentId = contentIdCell.getValue();
    if (!contentId) {
      contentId = generateUUID();
      contentIdCell.setValue(contentId);
    }

    const attemptCell = sheet.getRange(rowIndex, COLUMNS.ATTEMPT_COUNT + 1);
    const attemptCount = attemptCell.getValue() || 0;
    attemptCell.setValue(attemptCount + 1);

    // Clear previous error if any
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue("");

    // Set status to PENDING before sending
    // If sendToAWS fails with an error, it will be updated to ERROR later
    // If sendToAWS succeeds (202), it remains PENDING until worker confirms processing
    updateStatus(sheet, rowIndex, STATUS.PENDING);

    // Get all data from the row
    const rowData = sheet.getRange(rowIndex, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];
    const headers = sheet.getRange(1, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];

    const data = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) {
        // Convert Sets (like tags, media_link if stored as such) back to comma-separated strings for sending
        if (typeof rowData[i] === 'object' && rowData[i] !== null && typeof rowData[i].values === 'function') { 
          data[headers[i]] = Array.from(rowData[i]).join(', ');
        } else {
          data[headers[i]] = rowData[i];
        }
      }
    }
    data.content_id = contentId; // Ensure content_id is explicitly included
    data.timestamp = new Date().toISOString(); // Add current timestamp for the request

    // Send data to AWS API Gateway
    const result = sendToAWS(data); // No need for retry logic here, as API is fast

    // Update status based on result
    if (result.success) {
      // A 202 response means it was accepted, keep status as PENDING
      // No further action needed here; status remains PENDING.
      // We could log the message ID if needed: Logger.log("Request accepted for content_id: " + contentId + ", Message ID: " + result.data.messageId);
      Logger.log("Request accepted for content_id: " + contentId);
    } else {
      // If the API call itself failed (e.g., 4xx, 5xx error from API Gateway Lambda)
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

// Update status column and timestamp
function updateStatus(sheet, rowIndex, status, errorDetails = "") {
  sheet.getRange(rowIndex, COLUMNS.STATUS + 1).setValue(status);
  sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1).setValue(new Date());
  
  if (errorDetails) {
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue(errorDetails);
  }
}

function sendToAWS(data) {
  try {
    const url = "https://ngcfdfcplh.execute-api.us-east-1.amazonaws.com/prod/content";
    if (!data.content_id) {
      throw new Error("Missing content_id in the data");
    }

    const payload = {
      content_type: data.content_type || "",
      content_id: data.content_id,
      description: data.description || "",
      url: data.url || "",
      embed_link: data.embed_link || "", // Ensure these are strings
      tags: data.tags || "",             // Ensure these are strings
      media_link: data.media_link || "", // Ensure these are strings
      timestamp: data.timestamp
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true,
      'timeout': 30000, // 30 seconds timeout
      'followRedirects': true
    };

    // Send the request (no retry needed for the fast API call)
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    // Check for 202 Accepted as success
    if (responseCode === 202) {
      return {
        success: true,
        data: JSON.parse(responseText) // Contains { message: '...', content_id: '...' }
      };
    } else {
      // Handle other responses as errors
      let errorMessage = `API Error ${responseCode}: `;
      try {
        const errorResponse = JSON.parse(responseText);
        // Look for nested error message from create_error_response
        errorMessage += (errorResponse.error && errorResponse.error.message) ? errorResponse.error.message : JSON.stringify(errorResponse);
      } catch (e) {
        errorMessage += responseText || "Unknown error";
      }
      console.error(`API call failed for content_id ${data.content_id}: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (e) {
    console.error(`Exception in sendToAWS for content_id ${data.content_id || 'unknown'}: ${e.toString()} Stack: ${e.stack}`);
    return {
      success: false,
      error: `Script exception: ${e.toString()}`
    };
  }
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

// To run all rows with "error" status:
function manualRetry() {
  // First reset the status of rows you want to retry to "new"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
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

// Generate a UUID (RFC4122 version 4 compliant)
function generateUUID() {
  return Utilities.getUuid();
}