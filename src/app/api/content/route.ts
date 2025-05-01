import { NextResponse } from 'next/server';
import { getAllContentItems } from '@/lib/dynamodb';

export const dynamic = 'force-dynamic'; // Make this API route dynamic

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
    
    // Map DynamoDB items to a structure matching your BlogPost type
    const posts = items.map(item => {
      // Parse tags from DynamoDB format
      const tags = parseTagsField(item.tags);
      const generatedTags = parseTagsField(item.generated_tags);
      
      // Handle media links (may be comma-separated)
      let mediaLink = '';
      if (item.media_link) {
        const links = item.media_link.split(',');
        mediaLink = links[0].trim(); // Get first image if multiple
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
          console.log(`[Humor Debug] Post "${item.title}" - hasHumorTag: ${hasHumorTag}, generatedTags:`, generatedTags);
        }
        
        type = isHumorContent ? 'quick-note' : 'linkedin-post';
      } else if (item.content_type === 'article') {
        type = 'research-report';
      } else if (item.content_type === 'substack') {
        type = 'comprehensive-study';
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
        title: item.generated_title || item.title || 'Untitled Post',
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
        // Add raw tags for better searching
        raw_tags: tags,
        generated_tags: generatedTags
      };
    });

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