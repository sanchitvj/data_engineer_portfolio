// Constants for status values (should match those in Code.js)
const STATUS = {
  NEW: "new",
  PENDING: "pending",
  PROCESSED: "processed",
  ERROR: "error"
};

// Column indices (must match those in Code.js)
const COLUMNS = {
  CONTENT_ID: 0,
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

// Web App entry point - handles POST requests from AWS Lambda
function doPost(e) {
  try {
    // Parse the incoming request
    const requestData = JSON.parse(e.postData.contents);
    Logger.log("Received request: " + JSON.stringify(requestData));
    
    // Validate the request
    if (!requestData.action || !requestData.content_id) {
      return createErrorResponse("Missing required fields: action, content_id");
    }
    
    // Handle different actions
    switch (requestData.action) {
      case "updateStatus":
        const result = updateItemStatus(
          requestData.content_id, 
          requestData.status, 
          requestData.processed_at,
          requestData.generated_title
        );
        return createSuccessResponse(result);
        
      default:
        return createErrorResponse("Unknown action: " + requestData.action);
    }
    
  } catch (error) {
    Logger.log("Error processing request: " + error.toString());
    return createErrorResponse("Error processing request: " + error.toString());
  }
}

// Web App entry point - handles GET requests (for testing)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "success",
      message: "Status updater is running. Use POST to update status.",
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// Update the status of an item in the sheet
function updateItemStatus(contentId, status, processedAt, generatedTitle) {
  if (!contentId) {
    throw new Error("Content ID is required");
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet) {
    throw new Error("Sheet1 not found");
  }
  
  // Find the row with the matching content_id
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) { // Skip header row
    if (values[i][COLUMNS.CONTENT_ID] === contentId) {
      rowIndex = i + 1; // +1 because array is 0-indexed, sheet is 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    throw new Error("Content ID not found: " + contentId);
  }
  
  // Update the status and last updated columns
  let newStatus;
  if (status === "PROCESSED") {
    newStatus = STATUS.PROCESSED;
  } else if (status === "ERROR") {
    newStatus = STATUS.ERROR;
  } else {
    newStatus = status; // Use as-is if it's a valid status
  }
  
  sheet.getRange(rowIndex, COLUMNS.STATUS + 1).setValue(newStatus);
  sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1).setValue(new Date());
  
  // Optionally update additional information
  if (processedAt) {
    // You could store this in a notes column or additional field
    const cell = sheet.getRange(rowIndex, COLUMNS.LAST_UPDATED + 1);
    cell.setNote("Processed at: " + processedAt);
  }
  
  if (generatedTitle && generatedTitle.trim() !== "") {
    // Optionally add a column or note with the generated title
    const statusCell = sheet.getRange(rowIndex, COLUMNS.STATUS + 1);
    statusCell.setNote("Generated title: " + generatedTitle);
  }
  
  return {
    message: "Status updated successfully",
    contentId: contentId,
    rowIndex: rowIndex,
    status: newStatus
  };
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

// For testing in the script editor
function testFindRow() {
  // Replace with an actual content_id from your sheet
  const testContentId = "12345-test-id"; 
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    Logger.log("Looking for content_id: " + testContentId);
    Logger.log("Total rows: " + values.length);
    
    let rowFound = false;
    for (let i = 1; i < values.length; i++) {
      Logger.log("Row " + (i+1) + " content_id: " + values[i][COLUMNS.CONTENT_ID]);
      if (values[i][COLUMNS.CONTENT_ID] === testContentId) {
        Logger.log("Found at row: " + (i+1));
        rowFound = true;
        break;
      }
    }
    
    if (!rowFound) {
      Logger.log("Content ID not found");
    }
    
  } catch (error) {
    Logger.log("Error in test: " + error.toString());
  }
} 