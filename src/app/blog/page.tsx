// Remove all imports related to client-side hooks and dynamic imports
// import React, { useState, useEffect, useRef } from 'react';
// import dynamic from 'next/dynamic'; 
// Keep necessary imports for types if needed elsewhere, or move them
import { BlogPost } from '@/types/blog'; 
// Import the new client component
import BlogClientContent from '@/components/blog/BlogClientContent';
// Import data fetching source directly
import { blogPosts, blogCategories } from '@/data/blog-data';

// Make the page component async for potential server-side operations (though direct import is sync here)
export default async function BlogPage() {
  // Fetch data directly on the server (or use server-side async fetch if needed)
  // In this case, we import it directly as it's local data
  const initialBlogPosts: BlogPost[] = blogPosts;
  const initialBlogCategories: { id: string; label: string }[] = blogCategories;

  return (
    <>
      <BlogClientContent 
        initialBlogPosts={initialBlogPosts}
        initialBlogCategories={initialBlogCategories} 
      />
    </>
  );
}

// Remove the entire getStaticProps function
// export async function getStaticProps() { ... } 