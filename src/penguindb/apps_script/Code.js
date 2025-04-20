function onEdit(e) {
  // Get the edited range and sheet
  var range = e.range;
  var sheet = range.getSheet();
  
  // Check if we're in the right sheet and if the status column was edited to "new"
  if (sheet.getName() === "Sheet1" && range.getColumn() === 8 && range.getValue().toLowerCase() === "new") {
    // Get the row data
    var row = range.getRow();
    if (row <= 1) return; // Skip header row
    
    // Get all data from the row
    var rowData = sheet.getRange(row, 1, 1, 8).getValues()[0];
    var headers = sheet.getRange(1, 1, 1, 8).getValues()[0];
    
    // Create an object with the data
    var data = {};
    for (var i = 0; i < headers.length; i++) {
      data[headers[i]] = rowData[i];
    }
    
    // Send data to AWS API Gateway
    var result = sendToAWS(data);
    
    // Update status based on result
    if (result.success) {
      sheet.getRange(row, 8).setValue("processed");
    } else {
      sheet.getRange(row, 8).setValue("error");
    }
  }
}

function sendToAWS(data) {
  try {
    // Your API Gateway URL
    var url = "API_GATEWAY_URL"; // Replace with your actual URL
    
    // Prepare the HTTP request
    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(data),
      'muteHttpExceptions': true
    };
    
    // Send the request
    var response = UrlFetchApp.fetch(url, options);
    
    // Process response
    if (response.getResponseCode() === 200) {
      return { success: true, data: JSON.parse(response.getContentText()) };
    } else {
      Logger.log("Error: " + response.getContentText());
      return { success: false, error: response.getContentText() };
    }
  } catch (e) {
    Logger.log("Exception: " + e.toString());
    return { success: false, error: e.toString() };
  }
}
