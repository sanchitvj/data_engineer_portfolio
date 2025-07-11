import { NextResponse } from 'next/server';
import { getAllContentItems } from '@/lib/dynamodb';

export const dynamic = 'force-dynamic'; // Make this API route dynamic

/**
 * Process a Substack CDN URL to make it more compatible with Next.js Image component
 * @param url Substack CDN URL
 * @returns Processed URL that works with Next.js Image
 */
function processSubstackImageUrl(url: string): string {
  if (!url) return url;
  
  // Verify URL completeness - Substack URLs should have these components
  if (url.includes('substackcdn.com/image/fetch/')) {
    // Check if URL is truncated (common issue with long URLs)
    if (!url.includes('substack-post-media.s3.amazonaws.com')) {
      console.warn(`[MediaLinkWarning] Truncated Substack URL detected: "${url}"`);
      
      // If the URL is truncated, attempt to use a fixed URL template instead
      // Example of complete Substack URL format
      const fullTemplateUrl = "https://substackcdn.com/image/fetch/w_1456,c_limit,f_webp,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb4ccc3ef-8f65-4eb5-a28f-0d3927c4b1f5_2691x954.png";
      
      console.warn(`[MediaLinkFix] Using fallback template URL: "${fullTemplateUrl}"`);
      return fullTemplateUrl;
    }
    
    // Sanity check: Ensure the URL ends with proper extension
    const hasProperEnding = /.+\.(png|jpg|jpeg|gif|webp)/i.test(url);
    if (!hasProperEnding) {
      console.warn(`[MediaLinkWarning] Substack URL missing extension: ${url}`);
    }
  }
  
  // Log every URL for debugging
  // console.log(`[ProcessSubstackImage] Final URL: ${url}`);
  
  return url;
}

/**
 * Parse DynamoDB StringSet format to regular array
 * Handles both raw DynamoDB format and SDK converted format
 */
function parseTagsField(tags: any): string[] {
  if (!tags) return [];
  
  // If it's already an array of strings, return it
  if (Array.isArray(tags) && typeof tags[0] === 'string') {
    return tags;
  }
  
  // If it's an array of objects with S property (DynamoDB format)
  if (Array.isArray(tags) && typeof tags[0] === 'object' && tags[0].S) {
    return tags.map(tag => tag.S);
  }
  
  // If it's a string, split by comma
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }
  
  return [];
}

/**
 * GET handler for content API
 * Fetches all content from DynamoDB
 */
export async function GET() {
  try {
    const items = await getAllContentItems();
    // console.log(`Retrieved ${items.length} total items from DynamoDB`);
    
    // Map DynamoDB items to a structure matching your BlogPost type
    const posts = items.map(item => {
      // Parse tags from DynamoDB format
      const tags = parseTagsField(item.tags);
      const generatedTags = parseTagsField(item.generated_tags);
      
      // Handle media links (now separated by !.!)
      let mediaLink = '';
      let allMediaLinks: string[] = [];
      if (item.media_link) {
        // Split on !.! to get all image links
        const links = item.media_link.split('!.!')
          .map((link: string) => link.trim())
          .filter(Boolean);
        
        if (links.length > 0 && links[0]) {
          mediaLink = processSubstackImageUrl(links[0]);
          allMediaLinks = links.map((link: string) => processSubstackImageUrl(link));
          // console.log(`[MediaLinkParse] Processed ${links.length} media links for item ${item.content_id}. Main link: ${mediaLink}`);
        } else {
          console.warn('[MediaLinkParse] No valid links found after parsing media_link:', item.media_link);
        }
      } else {
        // console.log('[MediaLinkParse] media_link field is empty or undefined for item:', item.content_id);
      }
      
      // Set type based on content_type
      let type = 'research-report';
      if (item.content_type === 'post') {
        // Enhanced humor detection - check tags, generated_tags, and description for humor indicators
        const hasHumorTag = tags.includes('humor');
        const hasHumorGeneratedTag = generatedTags.includes('humor');
        const hasHumorInTitle = (item.title || '').toLowerCase().includes('humor') || 
                              (item.generated_title || '').toLowerCase().includes('humor');
        const hasLOLInTitle = (item.title || '').toLowerCase().includes('lol') || 
                            (item.generated_title || '').toLowerCase().includes('lol');
        
        // More aggressive detection for humor posts
        const isHumorContent = hasHumorTag || hasHumorGeneratedTag || hasHumorInTitle || hasLOLInTitle;
        
        // Debug info for humor detection
        if (isHumorContent || item.title?.toLowerCase().includes('fun') || item.description?.toLowerCase().includes('fun')) {
          // console.log(`[Humor Debug] Post "${item.title}" - hasHumorTag: ${hasHumorTag}, generatedTags:`, generatedTags);
        }
        
        type = isHumorContent ? 'quick-note' : 'linkedin-post';
      } else if (item.content_type === 'article') {
        type = 'research-report';
      } else if (item.content_type === 'substack') {
        type = 'comprehensive-study';
      } else if (item.content_type === 'medium') {
        type = 'medium-post';
      } else if (item.content_type === 'youtube') {
        // For YouTube content, use the 'youtube-video' type
        type = 'youtube-video';
      }
      
      // For YouTube videos, ensure we have a thumbnail
      let thumbnailUrl = '';
      if (type === 'youtube-video') {
        // First try to use the media_link directly
        thumbnailUrl = mediaLink;
        
        // If no media_link but we have a URL, try to extract YouTube ID and create thumbnail URL
        if (!thumbnailUrl && item.url) {
          const url = item.url;
          // Try to extract video ID from different YouTube URL formats
          let videoId = '';
          
          if (url.includes('youtu.be/')) {
            // Format: https://youtu.be/VIDEO_ID
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
          } else if (url.includes('youtube.com/watch')) {
            // Format: https://www.youtube.com/watch?v=VIDEO_ID
            const urlObj = new URL(url);
            videoId = urlObj.searchParams.get('v') || '';
          } else if (url.includes('youtube.com/embed/')) {
            // Format: https://www.youtube.com/embed/VIDEO_ID
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
          }
          
          if (videoId) {
            // Create high quality thumbnail URL
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }
      }
      
      // Make sure generated ID is consistent
      let postId = item.content_id;
      if (!postId) {
        // Create deterministic ID based on content properties instead of random
        const contentHash = `${item.content_type || ''}-${item.title || ''}-${item.date_published || ''}`;
        postId = `dynamo-${contentHash.replace(/\s+/g, '-').substring(0, 20)}`;
      }
      
      return {
        id: postId,
        title: item.title || item.generated_title || 'Untitled Post',
        excerpt: item.generated_description || item.description || '',
        description: item.generated_description || item.description || '',
        content: item.generated_content || '',
        date: item.date_published || item.processed_at || new Date().toISOString(),
        tags: [...generatedTags, ...tags].filter((v, i, a) => a.indexOf(v) === i), // Combine tags and remove duplicates
        category: generatedTags.length > 0 ? generatedTags : tags.length > 0 ? tags : [item.content_type || 'article'],
        type,
        link: item.url || item.embed_link || '',
        url: item.url || '',
        image: type === 'youtube-video' ? thumbnailUrl : mediaLink || '/images/oops_penguin.png',
        thumbnail: thumbnailUrl || '',
        author: {
          name: 'Sanchit Vijay',
          avatar: '/images/penguindb_main_logo.png'
        },
        featured: false,
        readTime: '3 min read',
        embed_link: item.embed_link || null, // Preserve the embed_link for iframe display
        // Store all media links for access in components
        media_link: allMediaLinks.length > 0 ? allMediaLinks : undefined,
        // Add raw tags for better searching
        raw_tags: tags,
        generated_tags: generatedTags,
        // Keep both titles available for reference
        original_title: item.title,
        generated_title: item.generated_title
      };
    });

    // Log counts of each content type to debug production issues
    const typeCounts = posts.reduce((acc: Record<string, number>, post) => {
      acc[post.type] = (acc[post.type] || 0) + 1;
      return acc;
    }, {});
    
    // console.log('Content type counts:', typeCounts);
    
    // Sort posts by date (newest first) - but don't limit them
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // console.log(`Returning ${posts.length} total posts, including ${typeCounts['linkedin-post']} LinkedIn posts and ${typeCounts['quick-note']} LOL Hub posts`);

    return NextResponse.json({ 
      posts,
      success: true,
    });
  } catch (error) {
    console.error('API error fetching content:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch content',
      success: false 
    }, { status: 500 });
  }
}

/**
 * Revalidation period for this API
 * This doesn't directly affect ISR - that's done in page props
 */
export const revalidate = 3600; // Revalidate every hour 