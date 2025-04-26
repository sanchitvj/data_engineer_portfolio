import { NextRequest, NextResponse } from 'next/server';
import { getAllContentItems } from '@/lib/dynamodb';
import { BlogPost } from '@/types/blog';

// Force this route to be dynamically rendered
export const dynamic = 'force-dynamic';

/**
 * Parse DynamoDB StringSet format to regular array
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
 * GET handler for fetching posts with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const postType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchTags = searchParams.get('tags'); // Get tag search parameter
    
    // Add validation for limit to prevent excessive loads
    // Increase limit for certain post types that require more cards
    let safeLimit = Math.min(limit, 20); // Maximum 20 posts per request
    
    // Special handling for sections that tend to have display issues
    if (postType === 'quick-note' || postType === 'research-report') {
      safeLimit = Math.min(limit, 50); // Allow more posts for these sections
    }
    
    // Fetch all content items
    const items = await getAllContentItems();
    
    // Map DynamoDB items to match BlogPost structure
    let allPosts: BlogPost[] = items.map((item: any) => {
      // Parse tags from DynamoDB format
      const tags = parseTagsField(item.tags);
      const generatedTags = parseTagsField(item.generated_tags);
      
      // Set type based on content_type
      let type: BlogPost['type'] = 'research-report';
      if (item.content_type === 'post') {
        // Check if it has humor tag
        const hasHumorTag = tags.includes('humor');
        type = hasHumorTag ? 'quick-note' : 'linkedin-post';
      } else if (item.content_type === 'article') {
        type = 'research-report';
      } else if (item.content_type === 'substack') {
        type = 'comprehensive-study';
      } else if (item.content_type === 'youtube') {
        // For YouTube content, use the 'youtube-video' type
        type = 'youtube-video';
      }
      
      // Handle media links (may be comma-separated)
      let mediaLink = '';
      if (item.media_link) {
        const links = item.media_link.split(',');
        mediaLink = links[0].trim(); // Get first image if multiple
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
      
      // Create a leaner post object with only the fields needed for display
      return {
        id: postId,
        title: item.generated_title || item.title || 'Untitled Post',
        excerpt: item.generated_description || item.description || '',
        description: item.generated_description || item.description || '',
        // Don't include full content until needed
        // content: item.generated_content || '',
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
          avatar: '/images/profile.jpeg'
        },
        featured: false,
        readTime: '3 min read',
        embed_link: item.embed_link || null, // Preserve the embed_link for iframe display
        // Add raw tags for better searching
        raw_tags: tags,
        generated_tags: generatedTags
      };
    });
    
    // Deduplicate posts by ID (keep only the first occurrence of each ID)
    const idMap = new Map();
    allPosts = allPosts.filter(post => {
      if (idMap.has(post.id)) {
        return false; // Skip this post if its ID is already in the map
      }
      idMap.set(post.id, true); // Otherwise add it to the map and keep the post
      return true;
    });
    
    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter by type if provided
    if (postType) {
      allPosts = allPosts.filter(post => post.type === postType);
    }
    
    // Apply tag search if provided
    if (searchTags) {
      // Parse comma-separated tag list
      const searchTagList = searchTags.split(',').map(tag => tag.trim().toLowerCase());
      
      // Filter posts that have at least one matching tag
      allPosts = allPosts.filter(post => {
        // Get combined tags and generated tags
        const postTags = [
          ...(post.tags || []),
          ...(post.generated_tags || []),
        ];
        
        // Convert to lowercase for case-insensitive matching
        const normalizedTags = postTags.map(tag => tag.toLowerCase());
        
        // Check if any search tag matches (including partial match)
        return searchTagList.some(searchTag => 
          normalizedTags.some(tag => tag.includes(searchTag))
        );
      });
    }
    
    // Calculate total count before pagination
    const totalCount = allPosts.length;
    
    // Apply pagination
    const paginatedPosts = allPosts.slice(offset, offset + safeLimit);
    
    // Log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.log(`API: Returning ${paginatedPosts.length} posts of type ${postType || 'all'} (offset: ${offset}, limit: ${safeLimit}, total: ${totalCount}, tags: ${searchTags || 'none'})`);
    }
    
    // Return posts with metadata
    return NextResponse.json({
      posts: paginatedPosts,
      total: totalCount,
      offset,
      limit: safeLimit,
      type: postType || 'all'
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', message: (error as Error).message },
      { status: 500 }
    );
  }
} 