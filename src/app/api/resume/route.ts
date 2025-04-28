import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Cache the PDF buffer to avoid repeated S3 requests
let cachedPdf: Buffer | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function GET(request: Request) {  
  try {
    // Check if we have a recent cached version
    const now = Date.now();
    if (cachedPdf && now - lastFetchTime < CACHE_TTL) {
      return createPdfResponse(cachedPdf);
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Configure parameters for S3 getObject
    const params = {
      Bucket: process.env.S3_BUCKET_NAME || 'pdb-resume', 
      Key: 'Sanchit_Vijay_Resume.pdf',
    };

    // Get object from S3
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      console.error('S3 response has no body');
      return new Response('No content in S3 response', { status: 404 });
    }
    
    // Convert S3 stream to buffer
    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    
    for await (const chunk of stream) {
      chunks.push(chunk);
      totalBytes += chunk.length;
    }
    
    const buffer = Buffer.concat(chunks);
    
    // Cache the PDF for future requests
    cachedPdf = buffer;
    lastFetchTime = now;
    
    return createPdfResponse(buffer);
  } catch (error) {
    console.error('Error fetching resume from S3:', error);
    return new Response(
      `Failed to fetch resume: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { status: 500 }
    );
  }
}

// Helper function to create a consistent PDF response
function createPdfResponse(buffer: Buffer): Response {
  // Create a response with explicit content type and dispositions
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Sanchit_Vijay_Resume.pdf"',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
    }
  });
} 