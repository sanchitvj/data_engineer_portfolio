import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Don't specify credentials at all - let the SDK use the provider chain
});

// Create a document client for DynamoDB
const docClient = DynamoDBDocumentClient.from(client);

// Table name for content data
const CONTENT_TABLE = process.env.DDB_TABLE || 'content_data';

/**
 * Fetch all content items from DynamoDB
 */
export async function getAllContentItems() {
  try {
    // Log environment information to help debug prod vs. dev differences
    console.log(`DynamoDB Table: ${CONTENT_TABLE}, Region: ${process.env.AWS_REGION || 'us-east-1'}, NODE_ENV: ${process.env.NODE_ENV}`);
    
    let allItems: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;
    
    // Use pagination to get all items, even if there are more than the limit
    do {
      const command = new ScanCommand({
        TableName: CONTENT_TABLE,
        Limit: 100, // Keep a reasonable limit per request
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response: ScanCommandOutput = await docClient.send(command);
      
      // Add items from this page to our collection
      if (response.Items) {
        allItems = [...allItems, ...response.Items];
      }
      
      // Get the key for the next page
      lastEvaluatedKey = response.LastEvaluatedKey;
      
    } while (lastEvaluatedKey);
    
    console.log(`Retrieved ${allItems.length} items from DynamoDB`);
    return allItems;
  } catch (error) {
    console.error('Error fetching content from DynamoDB:', error);
    return [];
  }
}

/**
 * Fetch a specific content item by ID
 */
export async function getContentById(contentId: string) {
  try {
    // Using scan with filter as the example uses content_id as a string attribute
    const command = new ScanCommand({
      TableName: CONTENT_TABLE,
      FilterExpression: 'content_id = :contentId',
      ExpressionAttributeValues: {
        ':contentId': contentId,
      },
    });

    const response = await docClient.send(command);
    return response.Items?.[0] || null;
  } catch (error) {
    console.error(`Error fetching content ID ${contentId}:`, error);
    return null;
  }
}

export { docClient, CONTENT_TABLE }; 