"use client";

import { useEffect, useState } from 'react';

export default function ContentArchitecturePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // This effect will run on the client side only
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Content Processing Pipeline Architecture</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <iframe 
            frameBorder="0" 
            style={{ width:'100%', height:'573px' }} 
            src="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&highlight=0000ff&edit=_blank&layers=1&nav=1&transparent=1&dark=auto#G1dZee_CUFhiqvzcznKuRg4Q1NhkZ-7IDT"
            allowTransparency={true}
            title="Architecture Diagram 1"
          ></iframe>
        </div>
        
        <div className="mb-8">
          <iframe 
            frameBorder="0" 
            style={{ width:'100%', height:'450px' }}
            src="https://viewer.diagrams.net/?tags=%7B%7D&lightbox=1&highlight=0000ff&edit=_blank&layers=1&nav=1&transparent=1&dark=auto#G1jeCNpOeCvTxRqpaxmXDIF22BxzAFpAOA"
            allowTransparency={true}
            title="Architecture Diagram 2"
          ></iframe>
        </div>

        {/* <div className="mt-8 prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Pipeline Flow</h2>
          <p className="mb-4">
            This architecture illustrates the content processing pipeline that automates the workflow from data entry to LLM-based text generation:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Google Sheet</strong> interacts bidirectionally with <strong>Google Apps Script</strong> when data changes</li>
            <li>When a row is added or modified, <strong>Google Apps Script</strong> is triggered and sends data to <strong>AWS API Gateway</strong></li>
            <li>API Gateway puts the message in an <strong>SQS Queue</strong></li>
            <li>An <strong>AWS Lambda function</strong> is triggered by SQS</li>
            <li>This function stores the data in <strong>DynamoDB</strong> and updates the sheet status (via Apps Script) to <code>INGESTED</code></li>
            <li><strong>DynamoDB Streams</strong> trigger another Lambda function</li>
            <li>This second function uses <strong>Amazon Bedrock</strong> for LLM text generation</li>
            <li>The generated content is stored back in DynamoDB</li>
            <li>The sheet status is updated (via Apps Script) to <code>PROCESSED</code></li>
            <li>All logs throughout the process are saved in <strong>CloudWatch</strong></li>
            <li><strong>AWS Amplify</strong> fetches data directly from DynamoDB to display in the frontend</li>
          </ol>
        </div> */}
      </div>
    </div>
  );
} 