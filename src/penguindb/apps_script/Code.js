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
    
    // Check if content_id exists, if not generate one
    const contentIdCell = sheet.getRange(rowIndex, COLUMNS.CONTENT_ID + 1);
    let contentId = contentIdCell.getValue();
    
    // Generate a new UUID if the content_id is empty
    if (!contentId) {
      contentId = generateUUID();
      contentIdCell.setValue(contentId);
    }
    
    // Get current attempt count and increment
    const attemptCell = sheet.getRange(rowIndex, COLUMNS.ATTEMPT_COUNT + 1);
    const attemptCount = attemptCell.getValue() || 0;
    attemptCell.setValue(attemptCount + 1);
    
    // Clear previous error if any
    sheet.getRange(rowIndex, COLUMNS.ERROR_DETAILS + 1).setValue("");
    
    // Update status to pending and timestamp
    updateStatus(sheet, rowIndex, STATUS.PENDING);
    
    // Get all data from the row
    const rowData = sheet.getRange(rowIndex, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];
    const headers = sheet.getRange(1, 1, 1, COLUMNS.ATTEMPT_COUNT + 1).getValues()[0];
    
    // Create an object with the data
    const data = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) { // Skip empty headers
        data[headers[i]] = rowData[i];
      }
    }
    
    // Ensure content_id is explicitly set
    data.content_id = contentId;
    
    // Add metadata
    data.rowIndex = rowIndex;
    data.timestamp = new Date().toISOString();
    
    // Send data to AWS API Gateway with exponential backoff
    const result = sendToAWSWithRetry(data, attemptCount);
    
    // Update status based on result
    if (result.success) {
      updateStatus(sheet, rowIndex, STATUS.PROCESSED);
    } else {
      updateStatus(sheet, rowIndex, STATUS.ERROR, result.error);
    }
  } catch (error) {
    console.error("Error in processRow: " + error.toString());
    updateStatus(sheet, rowIndex, STATUS.ERROR, "Script error: " + error.toString());
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

// Send data to AWS with exponential backoff retry logic
function sendToAWSWithRetry(data, attemptCount) {
  const maxRetries = 3;
  const baseDelay = 1000; // Start with 1 second delay
  
  for (let retryAttempt = 0; retryAttempt < maxRetries; retryAttempt++) {
    try {
      // Calculate backoff delay: 1s, 2s, 4s for retries within this function
      if (retryAttempt > 0) {
        const backoffDelay = baseDelay * Math.pow(2, retryAttempt - 1);
        Utilities.sleep(backoffDelay);
      }
      
      const result = sendToAWS(data);
      return result;
    } catch (error) {
      console.warn(`Retry ${retryAttempt + 1}/${maxRetries} failed: ${error.toString()}`);
      
      // If we've exhausted all retries, throw the error to be caught by the caller
      if (retryAttempt === maxRetries - 1) {
        return { 
          success: false, 
          error: `Failed after ${maxRetries} attempts: ${error.toString()}` 
        };
      }
    }
  }
}

function sendToAWS(data) {
  try {
    // Your API Gateway URL for the content processing Lambda
    const url = "https://ngcfdfcplh.execute-api.us-east-1.amazonaws.com/prod/content"; // Replace with your actual API Gateway URL
    
    // Ensure content_id is included
    if (!data.content_id) {
      throw new Error("Missing content_id in the data");
    }
    
    // Extract key fields and structure payload according to Lambda expectations
    const payload = {
      content_type: data.content_type || "",
      content_id: data.content_id,
      description: data.description || "",
      url: data.url || "",
      embed_link: data.embed_link || "",
      tags: data.tags || "",
      media_link: data.media_link || "",
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    // Prepare the HTTP request
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    // Send the request
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    // Process response
    if (responseCode >= 200 && responseCode < 300) {
      // Success (2xx status code)
      return { 
        success: true, 
        data: JSON.parse(responseText) 
      };
    } else {
      // Handle different error types based on status code
      let errorMessage = `HTTP Error ${responseCode}: `;
      
      try {
        const errorResponse = JSON.parse(responseText);
        errorMessage += errorResponse.message || responseText;
      } catch (e) {
        errorMessage += responseText || "Unknown error";
      }
      
      console.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  } catch (e) {
    console.error("Exception in sendToAWS: " + e.toString());
    return { 
      success: false, 
      error: e.toString() 
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
