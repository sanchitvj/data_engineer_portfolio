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
      let type: 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study' = 'research-report';
      if (item.content_type === 'post') {
        // Check if it has humor tag
        const hasHumorTag = tags.includes('humor');
        type = hasHumorTag ? 'quick-note' : 'linkedin-post';
      } else if (item.content_type === 'article') {
        type = 'research-report';
      } else if (item.content_type === 'substack') {
        type = 'comprehensive-study';
      }
      
      return {
        id: item.content_id || `dynamo-${Math.random().toString(36).substring(2, 9)}`,
        title: item.generated_title || item.title || 'Untitled Post',
        excerpt: item.generated_description || item.description || '',
        description: item.generated_description || item.description || '',
        content: item.generated_content || '',
        date: item.date_published || item.processed_at || new Date().toISOString(),
        tags: [...generatedTags, ...tags].filter((v, i, a) => a.indexOf(v) === i), // Combine tags and remove duplicates
        category: generatedTags[0] || tags[0] || item.content_type || 'article',
        type,
        link: item.url || item.embed_link || '',
        image: mediaLink || '/images/oops_penguin.png',
        author: {
          name: 'Sanchit Vijay',
          avatar: '/images/penguindb_main_logo.png'
        },
        featured: false,
        readTime: '3 min read',
        embed_link: item.embed_link || null, // Preserve the embed_link for iframe display
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