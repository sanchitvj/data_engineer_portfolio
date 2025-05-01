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
    let requestCount = 0;
    
    // Use pagination to get all items, even if there are more than the limit
    do {
      requestCount++;
      console.log(`Making DynamoDB request #${requestCount}, items so far: ${allItems.length}`);
      
      const command = new ScanCommand({
        TableName: CONTENT_TABLE,
        Limit: 1000, // Increase limit to 1000 to get more items per request
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response: ScanCommandOutput = await docClient.send(command);
      
      // Add items from this page to our collection
      if (response.Items && response.Items.length > 0) {
        console.log(`Request #${requestCount} returned ${response.Items.length} items`);
        allItems = [...allItems, ...response.Items];
      } else {
        console.log(`Request #${requestCount} returned no items`);
      }
      
      // Get the key for the next page
      lastEvaluatedKey = response.LastEvaluatedKey;
      
      // Log the continuation token if present
      if (lastEvaluatedKey) {
        console.log(`More items available, continuation token present: ${JSON.stringify(lastEvaluatedKey)}`);
      }
      
    } while (lastEvaluatedKey);
    
    console.log(`Retrieved ${allItems.length} total items from DynamoDB after ${requestCount} requests`);
    
    // Sort the items by date_published (newest first) to ensure consistent order
    allItems.sort((a, b) => {
      const dateA = new Date(a.date_published || a.processed_at || 0).getTime();
      const dateB = new Date(b.date_published || b.processed_at || 0).getTime();
      return dateB - dateA; // Newest first
    });
    
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