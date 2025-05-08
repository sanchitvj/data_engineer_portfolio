import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the full URL from the request
  const requestUrl = new URL(request.url);
  
  // Get the raw URL parameter to avoid double-decoding
  const params = requestUrl.searchParams;
  const imageUrl = params.get('url');
  // Initialize finalImageUrl at function scope
  let finalImageUrl = '';

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // Log the full URL for debugging
    // console.log(`[ImageProxy] Full image URL parameter: ${imageUrl}`);
    // console.log(`[ImageProxy] URL length: ${imageUrl.length}`);
    
    // If URL is truncated Substack URL, use fallback
    finalImageUrl = imageUrl;
    if (imageUrl.includes('substackcdn.com/image/fetch/') && 
        !imageUrl.includes('substack-post-media.s3.amazonaws.com')) {
      console.warn(`[ImageProxy] Truncated Substack URL detected: ${imageUrl}`);
      
      // Use the template URL instead of returning an error
      finalImageUrl = "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb4ccc3ef-8f65-4eb5-a28f-0d3927c4b1f5_2691x954.png";
    //   console.log(`[ImageProxy] Using fallback URL: ${finalImageUrl}`);
    }

    // console.log(`[ImageProxy] Attempting to fetch: ${finalImageUrl}`);
    
    const response = await fetch(finalImageUrl, { 
      headers: { 
        'Accept': 'image/webp,image/png,image/jpeg,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; MyApp/1.0; +https://example.com)'
      } 
    });

    if (!response.ok) {
      console.error(`[ImageProxy] Upstream fetch failed for ${finalImageUrl}. Status: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    const imageData = await response.arrayBuffer();
    let contentType = response.headers.get('content-type');

    // console.log(`[ImageProxy] Upstream content-type for ${finalImageUrl}: ${contentType}`);

    // If response type is octet-stream but URL indicates an image type, use appropriate content type
    if (!contentType || contentType === 'application/octet-stream') {
      if (finalImageUrl.endsWith('.webp')) contentType = 'image/webp';
      else if (finalImageUrl.endsWith('.png')) contentType = 'image/png';
      else if (finalImageUrl.endsWith('.jpg') || finalImageUrl.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (finalImageUrl.includes('substackcdn.com')) contentType = 'image/webp'; // Default for Substack
      else contentType = 'image/jpeg'; // Safe default
      
    //   console.log(`[ImageProxy] Inferred content-type: ${contentType}`);
    }

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
        'Access-Control-Allow-Origin': '*', // Allow any origin to use this proxy
      },
    });
  } catch (error: any) {
    console.error(`[ImageProxy] Error proxying image ${finalImageUrl || imageUrl}: ${error.message}`, error);
    return new NextResponse('Error proxying image', { status: 500 });
  }
}

export const runtime = 'edge'; 