'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaFilter, FaStar, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { X } from 'lucide-react';
import BlogIcebergBackground from '@/components/blog/BlogIcebergBackground';
import Header from '@/components/layout/Header';
import SwipeStation from '@/components/blog/SwipeStation';
import { BlogPost } from '@/types/blog';
import { blogPosts, blogCategories } from '@/data/blog-data';

const BlogPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSearchTerms, setActiveSearchTerms] = useState<string[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{value: string, display: string, type: string}[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchStateKey, setSearchStateKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Generate search suggestions based on the current query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Get categories that match the query - store the full category object
    const matchingCategories = blogCategories
      .filter(cat => cat.label.toLowerCase().includes(query))
      .map(cat => ({ value: cat.id, display: cat.label, type: 'category' }));
    
    // Get keywords from titles and excerpts
    const titleWords = blogPosts
      .flatMap(post => post.title.split(' '))
      .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
      .filter(word => word.length > 4)
      .filter(word => word.includes(query))
      .map(word => ({ value: word, display: word, type: 'keyword' }));
    
    // Combine unique suggestions - now with type information
    const allSuggestions = Array.from(
      new Set([...matchingCategories, ...titleWords].map(item => JSON.stringify(item)))
    )
      .map(item => JSON.parse(item))
      .slice(0, 5);
    
    setSearchSuggestions(allSuggestions);
  }, [searchQuery, blogPosts, blogCategories]);
  
  // Handle keyboard navigation for suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || searchSuggestions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedSuggestionIndex(prev => 
            prev < searchSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          if (focusedSuggestionIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(searchSuggestions[focusedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, searchSuggestions, focusedSuggestionIndex]);

  // Focus the suggestion when focusedSuggestionIndex changes
  useEffect(() => {
    if (focusedSuggestionIndex >= 0 && suggestionsRef.current[focusedSuggestionIndex]) {
      suggestionsRef.current[focusedSuggestionIndex]?.focus();
    }
  }, [focusedSuggestionIndex]);

  // Reset focused suggestion when suggestions change
  useEffect(() => {
    setFocusedSuggestionIndex(-1);
    suggestionsRef.current = suggestionsRef.current.slice(0, searchSuggestions.length);
  }, [searchSuggestions]);

  // Handle clicks outside the search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.some(ref => ref && ref.contains(event.target as Node))
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
    
    // Apply search terms filtering
    if (activeSearchTerms.length > 0) {
      filtered = filtered.filter(post => {
        // Check if all search terms are present
        return activeSearchTerms.every(term => {
          const normalizedTerm = term.toLowerCase();
          
          // Check title
          const titleMatch = post.title.toLowerCase().includes(normalizedTerm);
          
          // Check excerpt
          const excerptMatch = post.excerpt.toLowerCase().includes(normalizedTerm);
          
          // Check categories
          let categoryMatch = false;
          if (Array.isArray(post.category)) {
            categoryMatch = post.category.some(cat => 
              cat.toLowerCase().includes(normalizedTerm)
            );
          } else if (post.category) {
            categoryMatch = post.category.toLowerCase().includes(normalizedTerm);
          }
          
          return titleMatch || excerptMatch || categoryMatch;
        });
      });
    }
    
    // Apply direct search query if it exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(post => {
        // Check title
        const titleMatch = post.title.toLowerCase().includes(query);
        
        // Check excerpt
        const excerptMatch = post.excerpt.toLowerCase().includes(query);
        
        // Check categories
        let categoryMatch = false;
        if (Array.isArray(post.category)) {
          categoryMatch = post.category.some(cat => 
            cat.toLowerCase().includes(query)
          );
        } else if (post.category) {
          categoryMatch = post.category.toLowerCase().includes(query);
        }
        
        return titleMatch || excerptMatch || categoryMatch;
      });
    }
    
    console.log("Filtered posts count:", filtered.length);
    console.log("Active search terms:", activeSearchTerms);
    setFilteredPosts(filtered);
  }, [activeFilter, searchQuery, activeSearchTerms, blogPosts]);
  
  // Set loaded state after initial render
  useEffect(() => {
    setIsLoaded(true);
    setFilteredPosts(blogPosts);
  }, []);

  // Get featured post
  const featuredPost = filteredPosts.find(post => post.featured);

  // Utility function to highlight matched terms in text
  const highlightText = (text: string, terms: string[]) => {
    if (!terms.length) return text;
    
    // Create a regex that matches any of the search terms (case insensitive)
    const regex = new RegExp(`(${terms.map(term => escapeRegExp(term)).join('|')})`, 'gi');
    
    // Split the text by matches and create JSX elements
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => {
          // Check if this part matches any of the search terms (case insensitive)
          const isMatch = terms.some(term => 
            part.toLowerCase() === term.toLowerCase()
          );
          
          return isMatch ? (
            <span key={i} className="bg-data/30 text-white font-medium px-1 rounded">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
      </>
    );
  };
  
  // Utility to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Format date consistently
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to truncate text to approximately 36 words
  const truncateToWords = (text: string, wordCount: number = 36) => {
    const words = text.split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  };

  // Function to determine if a station should be shown based on the filter
  const shouldShowStation = (stationType: string) => {
    if (filteredPosts.length === 0) return false;
    return filteredPosts.some(post => post.type === stationType);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: {value: string, display: string, type: string}) => {
    if (suggestion.type === 'category') {
      // If it's a category, set it as the active filter using the stored ID
      setActiveFilter(suggestion.value);
      console.log(`Setting active filter to: ${suggestion.value} (${suggestion.display})`);
    } else {
      // If it's a keyword and we have less than 3 active search terms, add it
      if (activeSearchTerms.length < 3 && !activeSearchTerms.includes(suggestion.value)) {
        setActiveSearchTerms([...activeSearchTerms, suggestion.value]);
        console.log(`Adding search term: ${suggestion.value}`);
      }
    }
    
    // Clear the search query
    setSearchQuery('');
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  };

  // Remove a search term
  const removeSearchTerm = (term: string) => {
    setActiveSearchTerms(activeSearchTerms.filter(t => t !== term));
  };

  // Update searchStateKey whenever search parameters change
  useEffect(() => {
    // Increment the key to force SwipeStation components to remount
    setSearchStateKey(prev => prev + 1);
  }, [activeFilter, activeSearchTerms]);

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

          {/* Search Button */}
          <div className="max-w-6xl mx-auto mb-8 flex justify-end items-center gap-2">
            <motion.div
              className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 px-3 py-2 text-white flex items-center hover:bg-dark-200/90 hover:border-data/40 transition-all flex-wrap max-w-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center"
              >
                <FaSearch className="text-data mr-2" />
                <span className="mr-1">Search</span>
              </button>
              
              {/* Display active search terms */}
              {activeSearchTerms.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2">
                  {activeSearchTerms.map(term => (
                    <div
                      key={term}
                      className="group bg-data/20 text-data text-xs px-2 py-1 rounded-full flex items-center relative"
                    >
                      <span>{term}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearchTerm(term);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label={`Remove ${term}`}
                      >
                        <X size={12} className="text-data hover:text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Display active category if set */}
              {activeFilter !== 'all' && (
                <div className="flex items-center ml-2">
                  <div className="bg-data/20 text-data text-xs px-2 py-1 rounded-full flex items-center group relative">
                    <span>{blogCategories.find(c => c.id === activeFilter)?.label}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilter('all');
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label="Remove category filter"
                    >
                      <X size={12} className="text-data hover:text-white" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Clear all button */}
            {(activeSearchTerms.length > 0 || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setActiveSearchTerms([]);
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 p-2 text-data hover:bg-dark-200/90 hover:text-white transition-all"
                aria-label="Clear all filters"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search Modal */}
          <AnimatePresence>
            {showSearchModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowSearchModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="relative w-full max-w-3xl max-h-[80vh] overflow-auto bg-dark-200/95 rounded-xl border border-data/30 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button 
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-dark-300/50 hover:bg-dark-300 text-data transition-colors"
                    onClick={() => setShowSearchModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <FaSearch className="text-data mr-3" />
                      Research Terminal
                    </h2>
                    
                    {/* Filter and Search Panel - Same as original */}
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
                          <div className="flex items-center bg-dark-300/50 rounded-lg border border-data/30">
                            <input 
                              ref={searchInputRef}
                              type="text" 
                              placeholder="Search blogs (max 3 keywords)..." 
                              className="bg-transparent border-none focus:outline-none text-white w-full font-poppins px-3 py-2"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={() => setShowSuggestions(true)}
                              onKeyDown={(e) => {
                                // If Enter is pressed and there's text in the search box
                                if (e.key === 'Enter' && searchQuery.trim()) {
                                  e.preventDefault();
                                  
                                  // Don't add if already at 3 terms or if term already exists
                                  if (activeSearchTerms.length < 3 && !activeSearchTerms.includes(searchQuery.trim())) {
                                    setActiveSearchTerms([...activeSearchTerms, searchQuery.trim()]);
                                    setSearchQuery('');
                                    setShowSuggestions(false);
                                  }
                                }
                              }}
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
                                  src="/images/blog/search_penguin.png" 
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
                                    ref={el => { suggestionsRef.current[index] = el }}
                                    className={`w-full px-4 py-2 text-left hover:bg-data/10 text-gray-300 hover:text-white flex items-center ${
                                      focusedSuggestionIndex === index ? 'bg-data/10 text-white' : ''
                                    }`}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setFocusedSuggestionIndex(index)}
                                  >
                                    <FaSearch className="text-data mr-2 opacity-70" size={12} />
                                    <span>{suggestion.display} {suggestion.type === 'category' && <span className="text-xs text-data ml-1">(category)</span>}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                      
                      {/* Search Status */}
                      {(searchQuery || activeFilter !== 'all' || activeSearchTerms.length > 0) && (
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
                          {activeSearchTerms.map(term => (
                            <span key={term} className="bg-data/20 text-data px-2 py-1 rounded-full flex items-center">
                              Keyword: "{term}"
                              <button 
                                onClick={() => removeSearchTerm(term)} 
                                className="ml-2 text-gray-400 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
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
                              setActiveSearchTerms([]);
                            }}
                            className="text-data hover:text-data-light ml-auto"
                          >
                            Reset All
                          </button>
                        </div>
                      )}
                      
                      {/* Apply Button */}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setShowSearchModal(false)}
                          className="bg-data hover:bg-data-light text-dark-300 px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">{highlightText(featuredPost.title, activeSearchTerms)}</h2>
                    <p className="text-gray-300 mb-4">{highlightText(featuredPost.excerpt, activeSearchTerms)}</p>
                    <div className="flex items-center text-sm text-gray-400 mb-6">
                      <span>{formatDate(featuredPost.date)}</span>
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
            {shouldShowStation('linkedin-post') && (
              <SwipeStation
                key={`linkedin-${searchStateKey}-${filteredPosts.filter(post => post.type === 'linkedin-post').length}`}
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
                    <h4 className="font-bold text-md mb-1.5 text-white line-clamp-2">{highlightText(post.title, activeSearchTerms)}</h4>
                    <p className="text-gray-300 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden">
                      {highlightText(truncateToWords(post.excerpt, 24), activeSearchTerms)}
                    </p>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                        <span>{formatDate(post.date)}</span>
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
            )}
            
            {/* Quick Notes Station */}
            {shouldShowStation('quick-note') && (
              <SwipeStation
                key={`quick-note-${searchStateKey}-${filteredPosts.filter(post => post.type === 'quick-note').length}`}
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
                    <h4 className="font-bold text-lg mb-2 text-white line-clamp-2">{highlightText(post.title, activeSearchTerms)}</h4>
                    <p className="text-gray-300 text-sm mb-3 line-clamp-3 flex-grow overflow-hidden">
                      {highlightText(truncateToWords(post.excerpt, 28), activeSearchTerms)}
                    </p>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
                        <span>{formatDate(post.date)}</span>
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
            )}
            
            {/* Research Reports Station */}
            {shouldShowStation('research-report') && (
              <SwipeStation
                key={`research-report-${searchStateKey}-${filteredPosts.filter(post => post.type === 'research-report' && !post.featured).length}`}
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
                    <h4 className="font-bold text-xl mb-3 text-white line-clamp-2">{highlightText(post.title, activeSearchTerms)}</h4>
                    <p className="text-gray-300 mb-4 line-clamp-4 flex-grow overflow-hidden">
                      {highlightText(truncateToWords(post.excerpt, 36), activeSearchTerms)}
                    </p>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                        <span>{formatDate(post.date)}</span>
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
            )}
            
            {/* Comprehensive Studies Station */}
            {shouldShowStation('comprehensive-study') && (
              <SwipeStation
                key={`comprehensive-study-${searchStateKey}-${filteredPosts.filter(post => post.type === 'comprehensive-study').length}`}
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
                        <h4 className="font-bold text-xl mb-3 text-white line-clamp-2">{highlightText(post.title, activeSearchTerms)}</h4>
                        <p className="text-gray-300 mb-4 line-clamp-5 flex-grow overflow-hidden">
                          {highlightText(truncateToWords(post.excerpt, 50), activeSearchTerms)}
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                            <span>{formatDate(post.date)}</span>
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
            )}
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
                  setActiveSearchTerms([]);
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