// Remove all imports related to client-side hooks and dynamic imports
// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic'; 
// Keep necessary imports for types if needed elsewhere, or move them
import { BlogPost } from '@/types/blog';
import { Metadata } from 'next';
// Import the new client component
import BlogClientContent from '@/components/blog/BlogClientContent';
// Import data fetching source directly
import { blogPosts, blogCategories } from '@/data/blog-data';
import { getAllContentItems } from '@/lib/dynamodb';

// Set metadata for SEO
export const metadata: Metadata = {
  title: 'Archive | Sanchit Vijay',
  description: 'Explore my collection of technical articles and insights.',
};

// This enables ISR - Incremental Static Regeneration
export const revalidate = 3600; // Revalidate every hour (3600 seconds)

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

// Make the page component async for potential server-side operations (though direct import is sync here)
export default async function ArchivePage() {
  // Get static data from local file
  const staticBlogPosts: BlogPost[] = blogPosts;
  const blogCategoriesData = blogCategories;
  
  // Fetch dynamic data from DynamoDB
  let dynamoDBPosts: BlogPost[] = [];
  
  try {
    const items = await getAllContentItems();
    
    // Map DynamoDB items to match BlogPost structure
    dynamoDBPosts = items.map((item: any) => {
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
      let type: BlogPost['type'] = 'research-report';
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
        category: generatedTags.length > 0 ? generatedTags : tags.length > 0 ? tags : [item.content_type || 'article'],
        type,
        link: item.url || item.embed_link || '',
        url: item.url || '',
        image: mediaLink || '/images/blog/placeholder.jpg',
        author: {
          name: 'Sanchit Vijay',
          avatar: '/images/profile.jpeg'
        },
        featured: false,
        readTime: '3 min read',
        embed_link: item.embed_link || null, // Preserve the embed_link for iframe display
      };
    });
    
    console.log(`Fetched ${dynamoDBPosts.length} posts from DynamoDB`);
  } catch (error) {
    console.error('Error fetching posts from DynamoDB:', error);
    // Continue with static data even if DynamoDB fetch fails
  }
  
  // Sort dynamoDB posts by date (newest first)
  dynamoDBPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Combine static and dynamic data
  // Place DynamoDB posts before (newer content)
  const combinedPosts = [...dynamoDBPosts, ...staticBlogPosts];
  
  // Extract all unique categories from dynamic posts to add to existing categories
  const dynamicCategories = new Set<string>();
  dynamoDBPosts.forEach(post => {
    if (typeof post.category === 'string') {
      dynamicCategories.add(post.category);
    } else if (Array.isArray(post.category)) {
      post.category.forEach(cat => dynamicCategories.add(cat));
    }
    
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => dynamicCategories.add(tag));
    }
  });
  
  // Add any new categories from DynamoDB posts
  const allCategories = [...blogCategoriesData];
  dynamicCategories.forEach(category => {
    if (!allCategories.some(c => c.id === category)) {
      allCategories.push({
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
      });
    }
  });

  return (
    <BlogClientContent
      initialBlogPosts={combinedPosts}
      initialBlogCategories={allCategories}
    />
  );
}

// Remove the entire getStaticProps function
// export async function getStaticProps() { ... } 