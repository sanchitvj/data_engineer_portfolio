// Remove all imports related to client-side hooks and dynamic imports
// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic'; 
// Keep necessary imports for types if needed elsewhere, or move them
import { BlogPost } from '@/types/blog';
import { Metadata } from 'next';
// Import the new client component
import BlogClientContent from '@/components/blog/BlogClientContent';
// Remove static data import
// import { blogPosts, blogCategories } from '@/data/blog-data';
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
  // Define initial post count limits based on device type (will be used client-side)
  const initialLimits = {
    desktop: {
      'youtube-video': 6,
      'linkedin-post': 6,
      'quick-note': 6,
      'research-report': 4,
      'comprehensive-study': 2
    },
    mobile: {
      'youtube-video': 3,
      'linkedin-post': 3,
      'quick-note': 3,
      'research-report': 3,
      'comprehensive-study': 3
    }
  };
  
  // Storage for post counts and categories
  let postCounts: Record<string, number> = {
    'youtube-video': 0,
    'linkedin-post': 0, 
    'quick-note': 0,
    'research-report': 0,
    'comprehensive-study': 0
  };
  
  // Fetch all content items just for counts and categories
  let dynamicCategories = new Set<string>();
  
  try {
    const items = await getAllContentItems();
    
    // Count posts by type and collect categories
    items.forEach((item: any) => {
      // Parse tags for categorization
      const tags = parseTagsField(item.tags);
      const generatedTags = parseTagsField(item.generated_tags);
      
      // Determine post type
      let type: BlogPost['type'] = 'research-report';
      if (item.content_type === 'post') {
        const hasHumorTag = tags.includes('humor');
        type = hasHumorTag ? 'quick-note' : 'linkedin-post';
      } else if (item.content_type === 'article') {
        type = 'research-report';
      } else if (item.content_type === 'substack') {
        type = 'comprehensive-study';
      } else if (item.content_type === 'youtube') {
        type = 'youtube-video';
      }
      
      // Increment count for this type
      postCounts[type] = (postCounts[type] || 0) + 1;
      
      // Collect categories
      if (generatedTags.length > 0) {
        generatedTags.forEach(tag => dynamicCategories.add(tag));
      }
      if (tags.length > 0) {
        tags.forEach(tag => dynamicCategories.add(tag)); 
      }
      if (item.content_type) {
        dynamicCategories.add(item.content_type);
      }
    });
    
    console.log('Post counts:', postCounts);
  } catch (error) {
    console.error('Error fetching content counts:', error);
    // Keep default count values
  }
  
  // Create categories from collected unique values
  const allCategories = Array.from(dynamicCategories).map(category => ({
    id: category,
    label: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
  }));
  
  // Add 'all' category at the beginning
  allCategories.unshift({
    id: 'all',
    label: 'All'
  });

  return (
    <BlogClientContent
      initialBlogPosts={[]} // No initial posts, will load through API
      initialBlogCategories={allCategories}
      postCounts={postCounts}
      initialLimits={initialLimits}
    />
  );
}

// Remove the entire getStaticProps function
// export async function getStaticProps() { ... } 