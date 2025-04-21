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

```mermaid
graph TD
    subgraph "Google Sheets"
        GS[Google Sheet] --> GSA[Google Apps Script]
        GSA --> |generate content_id| CD[Content Data]
        CD -->|status: PENDING| SU[Status Updater Web App]
    end

    subgraph "AWS Cloud"
        subgraph "API Gateway"
            APIG[API Endpoint]
        end
        
        subgraph "Lambda Functions"
            AHL[API Handler Lambda]
            SWL[SQS Worker Lambda]
            SCL[Status Checker Lambda]
        end
        
        subgraph "Messaging"
            SQS[SQS Queue]
            DLQ[Dead Letter Queue]
        end
        
        subgraph "Database"
            DDB[DynamoDB Table]
        end

        subgraph "Orchestration"
            CWE[CloudWatch Events]
        end
        
        subgraph "AI Services"
            BDB[Bedrock Claude]
        end
    end

    %% Data flow
    GSA -->|1. POST content| APIG
    APIG -->|2. Forward request| AHL
    AHL -->|3. Send message| SQS
    SQS -->|4. Trigger| SWL
    SWL -->|5. Generate content| BDB
    BDB -->|6. Return content| SWL
    SWL -->|7. Store data| DDB
    SQS -->|Failed messages| DLQ
    CWE -->|8. Scheduled trigger| SCL
    SCL -->|9. Read status| DDB
    SCL -->|10. Update status| SU
    SU -->|11. Update status: PROCESSED| GS

    classDef google fill:#4285F4,stroke:#333,stroke-width:1px,color:white;
    classDef aws fill:#FF9900,stroke:#333,stroke-width:1px,color:white;
    classDef lambda fill:#FF9900,stroke:#333,stroke-width:1px,color:white;
    classDef db fill:#3B48CC,stroke:#333,stroke-width:1px,color:white;
    classDef queue fill:#FF4F8B,stroke:#333,stroke-width:1px,color:white;
    classDef ai fill:#00A86B,stroke:#333,stroke-width:1px,color:white;

    class GS,GSA,CD,SU google;
    class APIG,AHL,SWL,SCL,CWE aws;
    class AHL,SWL,SCL lambda;
    class DDB db;
    class SQS,DLQ queue;
    class BDB ai;
```