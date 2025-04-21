# Content Processor Lambda Function

This Lambda function processes content from Google Sheets and stores it in DynamoDB.

```mermaid
flowchart TD
    A[New Content in Google Sheet] --> B[Apps Script Triggered]
    B --> C[Mark Row as 'pending']
    C --> D[Send Data to API Gateway]
    D --> E[API Gateway Forwards to Lambda]
    E --> F[Lambda Processes Data]
    F --> G{Write to DynamoDB}
    
    G -->|Success| H[Return Success Response]
    H --> I[Mark Row as 'processed' in Sheet]
    
    G -->|Error| J[Format Error Response]
    J --> K[Return Error to API Gateway]
    K --> L[API Gateway Returns Error to Apps Script]
    L --> M[Mark Row as 'error' with Details]
    M --> N{Retry?}
    
    N -->|Yes| O[Wait for Retry Interval]
    O --> C
    
    N -->|No| P[Log Failed Record]
    P --> Q[Alert Admin if Needed]

    style G fill:#ffcccc,stroke:#ff0000
    style N fill:#ffffcc,stroke:#ffcc00
    style I fill:#ccffcc,stroke:#00cc00
    style M fill:#ffcccc,stroke:#ff0000
```