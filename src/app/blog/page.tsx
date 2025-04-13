'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaFilter, FaStar } from 'react-icons/fa';
import BlogIcebergBackground from '@/components/blog/BlogIcebergBackground';
import Header from '@/components/layout/Header';
import SwipeStation from '@/components/blog/SwipeStation';
import { BlogPost } from '@/types/blog';
import { blogPosts, blogCategories } from '@/data/blog-data';

const BlogPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate search suggestions based on the current query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Get unique categories from all posts
    const allCategories = blogPosts.reduce<string[]>((acc, post) => {
      if (Array.isArray(post.category)) {
        post.category.forEach(cat => {
          if (!acc.includes(cat)) acc.push(cat);
        });
      } else {
        if (!acc.includes(post.category)) acc.push(post.category);
      }
      return acc;
    }, []);
    
    // Filter categories that match the query
    const matchingCategories = allCategories.filter(
      cat => cat.toLowerCase().includes(query)
    );
    
    // Get keywords from titles and excerpts
    const titleWords = blogPosts
      .flatMap(post => post.title.split(' '))
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => word.length > 4)
      .filter(word => word.includes(query));
    
    // Combine unique suggestions
    const allSuggestions = Array.from(new Set([...matchingCategories, ...titleWords])).slice(0, 5);
    
    setSearchSuggestions(allSuggestions);
  }, [searchQuery, blogPosts]);
  
  // Handle clicks outside the search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter posts based on active filter and search query
  useEffect(() => {
    let filtered = [...blogPosts];
    
    // Apply category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(post => {
        if (Array.isArray(post.category)) {
          return post.category.includes(activeFilter);
        }
        return post.category === activeFilter;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query) ||
        (Array.isArray(post.category) && 
          post.category.some(cat => cat.toLowerCase().includes(query))) ||
        (!Array.isArray(post.category) && 
          post.category.toLowerCase().includes(query))
      );
    }
    
    setFilteredPosts(filtered);
  }, [activeFilter, searchQuery, blogPosts]);
  
  // Set loaded state after initial render
  useEffect(() => {
    setIsLoaded(true);
    setFilteredPosts(blogPosts);
  }, []);

  // Get featured post
  const featuredPost = filteredPosts.find(post => post.featured);

  // Function to highlight text based on search query
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const query = searchQuery.toLowerCase();
    const index = text.toLowerCase().indexOf(query);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <>
        {before}
        <span className="bg-data/30 text-white">{match}</span>
        {after}
      </>
    );
  };

  // Function to truncate text to approximately 36 words
  const truncateToWords = (text: string, wordCount: number = 36) => {
    const words = text.split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Use BlogIcebergBackground component */}
      <BlogIcebergBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <main className="container mx-auto px-4 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Research <span className="text-data">Station</span>
              <Image 
                src="/images/right_mac_penguin.png" 
                alt="Penguin" 
                width={50} 
                height={50}
                className="inline-block ml-4 animate-float"
              />
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Welcome to my Antarctic Research Station, where I document insights and discoveries from my data engineering expeditions.
            </p>
          </motion.div>

          {/* Research Terminal (Filter Controls) */}
          <div className="max-w-6xl mx-auto mb-8 bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 p-6">
            <div className="flex flex-col gap-6">
              {/* Keyword Filter Assistant */}
              <div className="w-full">
                <div className="flex items-center mb-4">
                  <FaFilter className="text-data mr-3" />
                  <h3 className="text-lg font-semibold text-white">Research Department Filters</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blogCategories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveFilter(category.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors duration-300 font-poppins ${
                        activeFilter === category.id
                          ? 'bg-data text-dark-300 font-medium'
                          : 'bg-dark-300/50 text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Divider */}
              <div className="w-full h-px bg-data/10"></div>
              
              {/* Search Assistant */}
              <div className="w-full">
                <div className="flex items-center mb-4">
                  <FaSearch className="text-data mr-3" />
                  <h3 className="text-lg font-semibold text-white">Research Content Search</h3>
                </div>
                <div className="relative">
                  <div className="flex items-center bg-dark-300/50 rounded-lg border border-data/30 p-2">
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search research logs (e.g., 'Spark', 'Data Lake')..." 
                      className="bg-transparent border-none focus:outline-none text-white w-full font-poppins px-3 py-2"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <div className="flex items-center">
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-gray-400 hover:text-white mr-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <div className="bg-dark-300/70 rounded-full p-1">
                        <Image 
                          src="/images/small_penguin.png" 
                          alt="Search Assistant" 
                          width={30} 
                          height={30}
                          className="animate-wave" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Search Suggestions */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute z-20 w-full mt-1 bg-dark-300/95 backdrop-blur-md rounded-lg border border-data/20 shadow-lg overflow-hidden"
                    >
                      <div className="py-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            className="w-full px-4 py-2 text-left hover:bg-data/10 text-gray-300 hover:text-white flex items-center"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                          >
                            <FaSearch className="text-data mr-2 opacity-70" size={12} />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Search Status */}
              {(searchQuery || activeFilter !== 'all') && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                  <span className="mr-2">Active filters:</span>
                  {activeFilter !== 'all' && (
                    <span className="bg-data/20 text-data px-2 py-1 rounded-full flex items-center">
                      Category: {blogCategories.find(c => c.id === activeFilter)?.label}
                      <button 
                        onClick={() => setActiveFilter('all')} 
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-data/20 text-data px-2 py-1 rounded-full flex items-center">
                      Search: "{searchQuery}"
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="text-data hover:text-data-light ml-auto"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Command Center (Featured Post) */}
          {featuredPost && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-6xl mx-auto mb-12"
            >
              <div className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/30 overflow-hidden shadow-lg">
                <div className="flex flex-col lg:flex-row">
                  {featuredPost.image && (
                    <div className="lg:w-1/2 overflow-hidden">
                      <Image 
                        src={featuredPost.image} 
                        alt={featuredPost.title}
                        width={600}
                        height={400}
                        className="w-full h-64 lg:h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <div className={`p-6 lg:p-8 ${featuredPost.image ? 'lg:w-1/2' : 'w-full'}`}>
                    <div className="flex items-center mb-4">
                      <FaStar className="text-data mr-2" />
                      <span className="text-data text-sm font-medium">Featured Research</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">{highlightText(featuredPost.title)}</h2>
                    <p className="text-gray-300 mb-4">{highlightText(featuredPost.excerpt)}</p>
                    <div className="flex items-center text-sm text-gray-400 mb-6">
                      <span>{new Date(featuredPost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="mx-2">•</span>
                      <span>{featuredPost.readTime} read</span>
                    </div>
                    <Link 
                      href={featuredPost.link} 
                      target="_blank"
                      className="inline-flex items-center px-4 py-2 bg-data hover:bg-data-dark text-dark-300 font-medium rounded-lg transition-colors"
                    >
                      Read Full Report
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Research Stations (Blog Posts by Type) */}
          <div className="max-w-6xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Research Stations</h2>
            
            {/* LinkedIn Posts Station */}
            <SwipeStation
              title="LinkedIn Posts Station"
              posts={filteredPosts.filter(post => post.type === 'linkedin-post')}
              visibleCards={3}
              renderCard={(post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-3 h-[220px] flex flex-col"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                      </svg>
                    </div>
                    <span className="ml-1.5 text-xs text-gray-400">LinkedIn Post</span>
                  </div>
                  <h4 className="font-bold text-md mb-1.5 text-white line-clamp-2">{highlightText(post.title)}</h4>
                  <p className="text-gray-300 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden">
                    {highlightText(truncateToWords(post.excerpt, 24))}
                  </p>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>{post.readTime} read</span>
                    </div>
                    <Link 
                      href={post.link} 
                      target="_blank" 
                      className="mt-1 text-blue-400 hover:text-blue-300 text-xs flex items-center"
                    >
                      View on LinkedIn
                      <svg className="w-3 h-3 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              )}
            />
            
            {/* Quick Notes Station */}
            <SwipeStation
              title="Quick Notes Station"
              posts={filteredPosts.filter(post => post.type === 'quick-note')}
              visibleCards={3}
              renderCard={(post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[220px] flex flex-col"
                >
                  <h4 className="font-bold text-lg mb-2 text-white line-clamp-2">{highlightText(post.title)}</h4>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3 flex-grow overflow-hidden">
                    {highlightText(truncateToWords(post.excerpt, 28))}
                  </p>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>{post.readTime} read</span>
                    </div>
                    <Link 
                      href={post.link} 
                      target="_blank" 
                      className="text-data hover:text-data-light text-sm"
                    >
                      View Note
                    </Link>
                  </div>
                </motion.div>
              )}
            />
            
            {/* Research Reports Station */}
            <SwipeStation
              title="Research Reports Station"
              posts={filteredPosts.filter(post => post.type === 'research-report' && !post.featured)}
              visibleCards={2}
              renderCard={(post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-6 h-[280px] flex flex-col"
                >
                  <h4 className="font-bold text-xl mb-3 text-white line-clamp-2">{highlightText(post.title)}</h4>
                  <p className="text-gray-300 mb-4 line-clamp-4 flex-grow overflow-hidden">
                    {highlightText(truncateToWords(post.excerpt, 36))}
                  </p>
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                      <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>{post.readTime} read</span>
                    </div>
                    <Link 
                      href={post.link} 
                      target="_blank" 
                      className="inline-flex items-center px-3 py-1.5 bg-dark-300 hover:bg-data/20 text-data rounded-lg transition-colors text-sm"
                    >
                      Read Report
                    </Link>
                  </div>
                </motion.div>
              )}
            />
            
            {/* Comprehensive Studies Station */}
            <SwipeStation
              title="Comprehensive Studies Station"
              posts={filteredPosts.filter(post => post.type === 'comprehensive-study')}
              visibleCards={1}
              renderCard={(post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all overflow-hidden h-[320px]"
                >
                  <div className="flex flex-col md:flex-row h-full">
                    {post.image && (
                      <div className="md:w-1/3 overflow-hidden">
                        <Image 
                          src={post.image} 
                          alt={post.title}
                          width={400}
                          height={300}
                          className="w-full h-48 md:h-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    )}
                    <div className={`p-6 ${post.image ? 'md:w-2/3' : 'w-full'} flex flex-col`}>
                      <h4 className="font-bold text-xl mb-3 text-white line-clamp-2">{highlightText(post.title)}</h4>
                      <p className="text-gray-300 mb-4 line-clamp-5 flex-grow overflow-hidden">
                        {highlightText(truncateToWords(post.excerpt, 50))}
                      </p>
                      <div className="mt-auto">
                        <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                          <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          <span>{post.readTime} read</span>
                        </div>
                        <Link 
                          href={post.link} 
                          target="_blank" 
                          className="inline-flex items-center px-4 py-2 bg-dark-300 hover:bg-data/20 text-data rounded-lg transition-colors"
                        >
                          Read Full Study
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            />
          </div>
          
          {/* Empty State */}
          {filteredPosts.length === 0 && (
            <div className="max-w-6xl mx-auto py-16 text-center">
              <div className="mb-6">
                <Image 
                  src="/images/penguin_confused.png" 
                  alt="No results" 
                  width={100}
                  height={100}
                  className="mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Research Logs Found</h3>
              <p className="text-gray-400">
                No posts match your current search criteria. Try adjusting your filters or search query.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-data hover:bg-data-dark text-dark-300 font-medium rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogPage; 