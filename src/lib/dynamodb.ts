import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromEnv } from '@aws-sdk/credential-providers';

const REGION = process.env.REGION || 'us-east-1';
const client = new DynamoDBClient({ region: REGION });

// Create a document client for DynamoDB
const docClient = DynamoDBDocumentClient.from(client);

// Table name for content data
const CONTENT_TABLE = process.env.DDB_TABLE || 'content_data_test';

/**
 * Fetch all content items from DynamoDB
 */
export async function getAllContentItems() {
  try {
    const command = new ScanCommand({
      TableName: CONTENT_TABLE,
      // Add any FilterExpression if needed
    });

    const response = await docClient.send(command);
    return response.Items || [];
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