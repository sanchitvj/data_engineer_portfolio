'use client'; // Mark this as a Client Component

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FaSearch, FaFilter, FaStar, FaTimes, FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaChevronDown, FaMicroscope, FaNewspaper } from 'react-icons/fa';
import { X } from 'lucide-react';
import { BlogPost } from '@/types/blog'; // Keep BlogPost type
import LazyComponent from '@/components/blog/LazyComponent';

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Dynamically import components
const BlogIcebergBackground = dynamic(() => import('@/components/blog/BlogIcebergBackground').catch(() => {
  return {
    default: () => (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image 
            src="/images/oops_penguin.png" 
            alt="Oops! Something went wrong" 
            width={100} 
            height={100}
          />
        </div>
      </div>
    )
  };
}), {
  ssr: true,
  loading: () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-100 to-dark-200" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Image 
          src="/images/loading_penguin.png" 
          alt="Loading..." 
          width={100} 
          height={100}
          className="animate-pulse"
        />
      </div>
    </div>
  )
});

// Lazy load SwipeStation with loading fallback
const SwipeStation = dynamic(() => import('@/components/blog/SwipeStation'), {
  loading: () => (
    <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-8 flex items-center justify-center">
      <div className="text-gray-500">Loading station...</div>
    </div>
  )
});

// Lazy load the search modal component
const SearchModal = dynamic<{
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeFilter: string;
  activeSearchTerms: string[];
  blogCategories: { id: string; label: string }[];
  searchInputRef: React.RefObject<HTMLInputElement>;
  showSuggestions: boolean;
  setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
  searchSuggestions: { value: string; display: string; type: string }[];
  suggestionsRef: React.RefObject<(HTMLButtonElement | null)[]>;
  focusedSuggestionIndex: number;
  handleSearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleFilterButtonClick: (categoryId: string) => void;
  handleSuggestionClick: (suggestion: { value: string; display: string; type: string }) => void;
  removeSearchTerm: (termToRemove: string) => void;
  resetAllFilters: () => void;
  showSearchModal: boolean;
  setShowSearchModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>(() => import('@/components/blog/SearchModal'), {
  loading: () => null,
  ssr: false,
});

// Define the props type expected from the Server Component
interface BlogClientContentProps {
  initialBlogPosts: BlogPost[];
  initialBlogCategories: { id: string; label: string }[];
}

const BlogClientContent: React.FC<BlogClientContentProps> = ({ initialBlogPosts, initialBlogCategories }) => {
  // All the state, effects, refs, handlers, and JSX from the original BlogPage go here
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSearchTerms, setActiveSearchTerms] = useState<string[]>([]);
  // Use the props for initial state and keep a copy for filtering
  const [blogPosts] = useState<BlogPost[]>(initialBlogPosts); 
  const [blogCategories] = useState<{ id: string; label: string }[]>(initialBlogCategories);
  // State for the currently displayed posts after filtering
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialBlogPosts); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestionsState, setSearchSuggestionsState] = useState<{value: string, display: string, type: string}[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchStateKey, setSearchStateKey] = useState(0);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [isLinkedInIframeFolded, setIsLinkedInIframeFolded] = useState(true); // Start folded
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ 
    type: string; 
    title: string; 
    content: string; 
    link?: string; 
    date?: string; 
  } | null>(null);

  // --- Start of useEffects and Handlers ---

  // Check for mobile device on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileDevice(window.innerWidth < 640); // 640px is typical small screen breakpoint
    };
    
    // Check immediately
    checkIfMobile();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Generate search suggestions with debounce
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 100), // Reduced from 300ms to 100ms for better responsiveness
    []
  );

  // Memoize search suggestions calculation for better performance
  const searchSuggestions = useMemo(() => {
    // Don't generate suggestions for very short queries (efficiency)
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return [];
    }
    
    const query = searchQuery.toLowerCase();
    
    // Only compute categories that match the query (optimization)
    const matchingCategories = blogCategories
      .filter(cat => cat.label.toLowerCase().includes(query))
      .map(cat => ({ value: cat.id, display: cat.label, type: 'category' as const }));
    
    // Extract words only once from all titles and memoize the result
    const currentActiveTermsLower = activeSearchTerms.map(t => t.toLowerCase());
    
    // Data engineering related keywords for context-relevant suggestions
    const dataEngineeringKeywords = [
      'processing', 'pipeline', 'etl', 'data', 'lake', 'warehouse', 'snowflake', 
      'databricks', 'spark', 'hadoop', 'bigquery', 'analytics', 'streaming', 
      'batch', 'real-time', 'database', 'sql', 'nosql', 'architecture', 
      'framework', 'cloud', 'aws', 'azure', 'gcp', 'airflow', 'dbt', 'kafka', 
      'flink', 'python', 'scala', 'java', 'optimization', 'performance', 'storage',
      'quality', 'governance', 'metadata', 'security', 'integration', 'migration',
      'transform', 'extract', 'load', 'elt', 'api', 'orchestration', 'monitoring'
    ];
    
    // Limit the number of posts to search through for performance
    const postsToSearch = blogPosts.slice(0, 15); // Only search through most recent posts
    
    // Filter keywords by prefix (very efficient operation)
    const prefixSuggestions = dataEngineeringKeywords
      .filter(keyword => keyword.toLowerCase().startsWith(query))
      .filter(keyword => !currentActiveTermsLower.includes(keyword.toLowerCase()))
      .map(keyword => ({ value: keyword, display: keyword, type: 'keyword' as const }))
      .slice(0, 3); // Limit to top 3 matching keywords
    
    // If we already have enough prefix suggestions, we can skip the more expensive content search
    if (prefixSuggestions.length >= 3 && query.length < 3) {
      // Return early with just the prefix suggestions and categories
      return [...prefixSuggestions, ...matchingCategories].slice(0, 5);
    }
    
    // Optimize title word extraction with Set for uniqueness
    const uniqueTitleWords = new Set<string>();
    
    // Process in batches if needed for longer queries
    postsToSearch.forEach(post => {
      // Extract individual words (more efficient with RegExp compiled once)
      const wordSplitter = /\s+/;
      const wordCleaner = /[^\w]/g;
      
      // Extract individual words
      post.title.split(wordSplitter)
        .map(word => word.toLowerCase().replace(wordCleaner, ''))
        // Filter for prefix matches and minimum length
        .filter(word => word.length > 3 && word.startsWith(query))
        .forEach(word => uniqueTitleWords.add(word));
      
      // Only process phrases for longer queries (optimization)
      if (query.length >= 3) {
        // Extract phrases (2-3 words) that start with the query
        const words = post.title.toLowerCase().split(wordSplitter);
        for (let i = 0; i < words.length; i++) {
          if (words[i].startsWith(query)) {
            // Extract 2-word phrase
            if (i < words.length - 1) {
              const twoWordPhrase = words[i] + ' ' + words[i+1];
              uniqueTitleWords.add(twoWordPhrase);
            }
            // Extract 3-word phrase (only for longer queries)
            if (i < words.length - 2 && query.length >= 4) {
              const threeWordPhrase = words[i] + ' ' + words[i+1] + ' ' + words[i+2];
              uniqueTitleWords.add(threeWordPhrase);
            }
          }
        }
        
        // Also check excerpt for relevant keywords
        if (post.excerpt) {
        post.excerpt.split(wordSplitter)
          .map(word => word.toLowerCase().replace(wordCleaner, ''))
          .filter(word => word.length > 3 && word.startsWith(query))
          .forEach(word => uniqueTitleWords.add(word));
        }
      }
    });
    
    // Convert to the expected format and filter out already selected terms
    const contentWords = Array.from(uniqueTitleWords)
      .map(word => ({ value: word, display: word, type: 'keyword' as const }))
      .filter(suggestion => !currentActiveTermsLower.includes(suggestion.value.toLowerCase()))
      .slice(0, 4); // Limit content words to avoid processing too many
    
    // Filter out categories that match the current filter
    const filteredMatchingCategories = matchingCategories.filter(
      suggestion => suggestion.value !== activeFilter
    ).slice(0, 2); // Limit categories

    // Combine all suggestions with priority
    const allSuggestions = [
      ...prefixSuggestions, // Data engineering keywords first
      ...contentWords,      // Content-specific words second
      ...filteredMatchingCategories // Categories last
    ];

    // Remove duplicates and limit results
    return Array.from(
      new Set(allSuggestions.map(item => JSON.stringify(item)))
    )
      .map(item => JSON.parse(item))
      .slice(0, 5); // Limit to 5 suggestions
  }, [searchQuery, blogPosts, blogCategories, activeSearchTerms, activeFilter]);

  // Replace the previous state setter with the memoized result
  useEffect(() => {
    // Only set suggestions if not on mobile
    if (!isMobileDevice) {
      setSearchSuggestionsState(searchSuggestions);
    } else {
      // Clear suggestions on mobile
      setSearchSuggestionsState([]);
    }
  }, [searchSuggestions, isMobileDevice]);

  // Set loaded state after initial render
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Update searchStateKey whenever search parameters change (for SwipeStation reset)
  useEffect(() => {
    setSearchStateKey(prev => prev + 1);
  }, [activeFilter, activeSearchTerms]);

  // Keyboard navigation for suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || searchSuggestions.length === 0) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedSuggestionIndex(prev => (prev < searchSuggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0)); // Ensure index can go back to 0
          break;
        case 'Enter':
          if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < searchSuggestions.length) { // Check bounds
            e.preventDefault();
            handleSuggestionClick(searchSuggestions[focusedSuggestionIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault(); // Prevent modal close if needed
          setShowSuggestions(false);
          setFocusedSuggestionIndex(-1); // Reset focus index
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, searchSuggestions]);

  // Focus the suggestion item when index changes
  useEffect(() => {
    if (focusedSuggestionIndex >= 0 && suggestionsRef.current[focusedSuggestionIndex]) {
      suggestionsRef.current[focusedSuggestionIndex]?.focus();
    }
  }, [focusedSuggestionIndex]);

  // Reset focused index when suggestions change
  useEffect(() => {
    setFocusedSuggestionIndex(-1);
    suggestionsRef.current = suggestionsRef.current.slice(0, searchSuggestions.length);
  }, [searchSuggestions]);

  // Handle clicks outside search input/suggestions
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       const target = event.target as Node;
       const isClickInsideInput = searchInputRef.current?.contains(target);
       const isClickInsideSuggestions = suggestionsRef.current.some(ref => ref?.contains(target));

       if (!isClickInsideInput && !isClickInsideSuggestions) {
         setShowSuggestions(false);
       }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []); // Empty dependency array means this runs once on mount

  // Memoize filtered posts calculation
  const filteredPostsResult = useMemo(() => {
    console.log("Recalculating filtered posts");
    let tempFiltered = [...blogPosts]; // Start with original posts

    // Apply category filter
    if (activeFilter !== 'all') {
      tempFiltered = tempFiltered.filter(post => 
        Array.isArray(post.category) 
          ? post.category.includes(activeFilter) 
          : post.category === activeFilter
      );
    }
    
    // Apply search terms filtering (all terms must match)
    if (activeSearchTerms.length > 0) {
      // Create a single normalized array of search terms for faster lookups
      const normalizedTerms = activeSearchTerms.map(term => term.toLowerCase());
      
      tempFiltered = tempFiltered.filter(post => {
        // Pre-compute the lowercase values once per post
        const titleLower = post.title.toLowerCase();
        const excerptLower = post.excerpt?.toLowerCase() ?? ''; // Handle undefined excerpt
        const categoriesLower = Array.isArray(post.category)
          ? post.category.map(cat => cat.toLowerCase())
          : post.category ? [post.category.toLowerCase()] : [];
        
        // Check if all search terms match
        return normalizedTerms.every(term => (
          titleLower.includes(term) ||
          excerptLower.includes(term) ||
          categoriesLower.some(cat => cat.includes(term))
        ));
      });
    }
    
    return tempFiltered;
  }, [activeFilter, activeSearchTerms, blogPosts]); // Dependencies

  // Update state when memoized result changes
  useEffect(() => {
    setFilteredPosts(filteredPostsResult);
  }, [filteredPostsResult]);

  // Memoize the featured post
  const featuredPost = useMemo(() => 
    filteredPosts.find(post => post.featured),
    [filteredPosts]
  );
  
  // Memoize escapeRegExp to avoid recreation on every render
  const escapeRegExp = useCallback((string: string) => 
    string.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&'),
    []
  );
  
  // Optimize highlightText with memoization for each post/terms combination
  const highlightText = useCallback((text: string, terms: string[]) => {
    if (!text) return ''; // Handle cases where text might be undefined
    if (!terms.length) return text;
    
    // Ensure terms are strings and escape them
    const escapedTerms = terms.filter(t => typeof t === 'string').map(escapeRegExp);
    if (!escapedTerms.length) return text;
    
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => {
          if (!part) return null; // Skip empty parts
          const isMatch = escapedTerms.some(term => 
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
  }, [escapeRegExp]);

  // Optimize formatDate and truncateToWords with useCallback
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid Date'; // Handle potential errors
    }
  }, []);

  const truncateToWords = useCallback((text: string, wordCount: number = 36) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length <= wordCount) return text;
    return words.slice(0, wordCount).join(' ') + '...';
  }, []);

  const shouldShowStation = useCallback((stationType: string) => {
    if (filteredPosts.length === 0) return false; // Check filtered posts
    return filteredPosts.some(post => post.type === stationType);
  }, [filteredPosts]);

  // --- Event Handlers ---
  // Modify search input handler to update UI immediately while still debouncing the processing
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Update UI immediately with the current input value
    e.persist(); // Needed for React synthetic events in some cases
    const currentValue = e.target.value;
    
    // For UI responsiveness, we immediately update what the user sees
    setSearchQuery(currentValue);
    
    // Still debounce the expensive operations (suggestion generation, etc.)
    debouncedSetSearchQuery(currentValue);
  }, [debouncedSetSearchQuery]);
  
  const handleSuggestionClick = useCallback((suggestion: {value: string, display: string, type: string}) => {
    if (suggestion.type === 'category') {
      setActiveFilter(suggestion.value);
    } else if (suggestion.type === 'keyword') {
      if (activeSearchTerms.length < 3 && !activeSearchTerms.find(term => term.toLowerCase() === suggestion.value.toLowerCase())) {
        setActiveSearchTerms(prevTerms => [...prevTerms, suggestion.value]);
      }
    }
    setSearchQuery(''); // Clear input after selection
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  }, [activeSearchTerms, setActiveFilter, setActiveSearchTerms, setSearchQuery, setShowSuggestions]);

  const removeSearchTerm = useCallback((termToRemove: string) => {
    setActiveSearchTerms(prevTerms => prevTerms.filter(t => t.toLowerCase() !== termToRemove.toLowerCase()));
  }, []);

  const handleSearchEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const newTerm = searchQuery.trim();
      if (activeSearchTerms.length < 3 && !activeSearchTerms.find(term => term.toLowerCase() === newTerm.toLowerCase())) {
         setActiveSearchTerms(prevTerms => [...prevTerms, newTerm]);
      }
      setSearchQuery(''); // Clear input after Enter
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    }
  }, [activeSearchTerms, searchQuery]);

  const handleFilterButtonClick = useCallback((categoryId: string) => {
     setActiveFilter(categoryId);
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
    setActiveSearchTerms([]);
    setShowSuggestions(false); // Close suggestions too
    setFocusedSuggestionIndex(-1);
  }, []);

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
        setModalContent(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  // --- Return JSX Structure ---
  return (
    <>
      <BlogIcebergBackground />
      <div className="container mx-auto px-4 pt-20 pb-16 z-10 relative">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
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
              priority // Keep priority as it might be ATF
            />
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Welcome to my Antarctic Research Station, where I document insights and discoveries from my data engineering expeditions.
          </p>
        </motion.div>

        {/* Search Trigger Button & Active Filters Display */}
        <div className="max-w-6xl mx-auto mb-8 flex justify-end items-center gap-2">
          <motion.div
            className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 px-3 py-2 text-white flex items-center hover:bg-dark-200/90 hover:border-data/40 transition-all flex-wrap gap-1 max-w-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button to open modal */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center mr-2 shrink-0" // Prevent shrinking
              aria-label="Open search and filter options"
            >
              <FaSearch className="text-data mr-2" />
              <span>Search</span>
            </button>
            
            {/* Display active category filter */}
            {activeFilter !== 'all' && (
              <div className="group bg-data/20 text-data text-xs px-2 py-1 rounded-full flex items-center relative shrink-0">
                <span>{blogCategories.find(c => c.id === activeFilter)?.label || activeFilter}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveFilter('all'); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-4 h-4"
                  aria-label="Remove category filter"
                >
                  <X size={12} className="text-data hover:text-white" />
                </button>
              </div>
            )}

            {/* Display active search terms */}
            {activeSearchTerms.map(term => (
              <div
                key={term}
                className="group bg-data/20 text-data text-xs px-2 py-1 rounded-full flex items-center relative shrink-0"
              >
                <span>{term}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSearchTerm(term); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-4 h-4"
                  aria-label={`Remove keyword ${term}`}
                >
                  <X size={12} className="text-data hover:text-white" />
                </button>
              </div>
            ))}
          </motion.div>
          
          {/* Clear all button */}
          {(activeSearchTerms.length > 0 || activeFilter !== 'all') && (
            <button
              onClick={resetAllFilters}
              className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 p-2 text-data hover:bg-dark-200/90 hover:text-white transition-all shrink-0"
              aria-label="Clear all filters"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Lazy-loaded Search Modal */}
        {showSearchModal && (
          <Suspense fallback={
            <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-3xl h-64 bg-dark-200/95 rounded-xl border border-data/30 flex items-center justify-center">
                <div className="text-gray-400">Loading search...</div>
              </div>
            </div>
          }>
            <SearchModal 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeFilter={activeFilter}
              activeSearchTerms={activeSearchTerms}
              blogCategories={blogCategories}
              searchInputRef={searchInputRef}
              showSuggestions={showSuggestions && !isMobileDevice}
              setShowSuggestions={setShowSuggestions}
              searchSuggestions={isMobileDevice ? [] : searchSuggestions}
              suggestionsRef={suggestionsRef}
              focusedSuggestionIndex={focusedSuggestionIndex}
              handleSearchEnter={handleSearchEnter}
              handleFilterButtonClick={handleFilterButtonClick}
              handleSuggestionClick={handleSuggestionClick}
              removeSearchTerm={removeSearchTerm}
              resetAllFilters={resetAllFilters}
              showSearchModal={showSearchModal}
              setShowSearchModal={setShowSearchModal}
              handleSearchInputChange={handleSearchInputChange}
            />
          </Suspense>
        )}
        {/* Featured Post Section */}
        {featuredPost && ( 
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.95 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-6xl mx-auto mb-12"
          >
            <div className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/30 overflow-hidden shadow-lg">
              <div className="flex flex-col lg:flex-row">
                {featuredPost.image && (
                  <div className="lg:w-1/2 overflow-hidden relative">
                    <Image 
                      src={featuredPost.image} 
                      alt={featuredPost.title} 
                      width={600} 
                      height={400} 
                      className="w-full h-64 lg:h-full object-cover transition-transform duration-300 hover:scale-105" 
                    />
                  </div>
                )}
                <div className={`p-6 lg:p-8 ${featuredPost.image ? 'lg:w-1/2' : 'w-full'} flex flex-col`}>
                  <div className="flex items-center mb-3">
                    <FaStar className="text-data mr-2" />
                    <span className="text-data text-sm font-medium">Featured Research</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight">
                    {highlightText(featuredPost.title, activeSearchTerms)}
                  </h2>
                  <p className="text-gray-300 mb-4 line-clamp-4">
                    {highlightText(featuredPost.excerpt || '', activeSearchTerms)}
                  </p>
                  <div className="flex items-center text-sm text-gray-400 mb-6">
                    <span>{formatDate(featuredPost.date)}</span>
                    <span className="mx-2">•</span>
                    <span>{featuredPost.readTime}</span>
                  </div>
                  {featuredPost.link && (
                    <Link 
                      href={featuredPost.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-auto inline-flex items-center px-4 py-2 bg-data hover:bg-data-dark text-dark-300 font-medium rounded-lg transition-colors"
                    >
                      Read Full Report
                      <FaExternalLinkAlt className="ml-2" size={12}/>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swipe Stations Section */}
        {filteredPosts.length > 0 && ( // Only render stations if there are posts
           <div className="max-w-6xl mx-auto mb-8"> 
             <h2 className="text-2xl font-bold mb-6 text-white">Research Stations</h2> 
             
             {/* Lazy-load all SwipeStation components with IntersectionObserver for deferred loading */}
             <Suspense fallback={null}>
              
               {/* LinkedIn Posts Station (Original) */}
               {shouldShowStation('linkedin-post') && (
                 <LazyComponent 
                   placeholder={
                     <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-12 flex items-center justify-center">
                       <div className="text-gray-500">Loading LinkedIn Posts...</div>
                     </div>
                   }
                 >
                   <div className="mb-12">
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
                           transition={{ duration: 0.3, delay: index * 0.05 }} 
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-3 h-[230px] flex flex-col"
                           onClick={(e) => {
                             // Prevent any unwanted navigation
                             if (!(e.target as HTMLElement).closest('a, button')) {
                               e.preventDefault();
                             }
                           }}
                         >
                           <div className="flex items-center mb-2"> <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0"> <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"> <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path> </svg> </div> <span className="ml-1.5 text-xs text-gray-400">LinkedIn Post</span> </div> 
                           <h4 className="font-semibold text-md mb-1.5 text-white line-clamp-2 leading-snug">{highlightText(post.title, activeSearchTerms)}</h4> 
                           <p className="text-gray-300 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden"> {highlightText(truncateToWords(post.excerpt || '', 24), activeSearchTerms)} </p>
                           <div className="mt-auto">
                             <div className="flex justify-between items-center mb-2">
                               <a 
                                 href={post.url || post.link || "#"}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-data hover:text-data-light text-sm inline-flex items-center"
                               >
                                 View Post <FaExternalLinkAlt className="w-3 h-3 ml-1 opacity-70" />
                               </a>
                               {post.embed_link && (
                                 <button 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     
                                     const embedHtml = post.embed_link as string;
                                     
                                     setModalContent({
                                       type: 'embed',
                                       title: post.title,
                                       content: embedHtml,
                                       link: post.link || post.url || '#',
                                       date: post.date
                                     });
                                     setShowModal(true);
                                   }}
                                   className="w-7 h-7 bg-data/20 hover:bg-data/30 text-data rounded-full flex items-center justify-center transition-colors"
                                   aria-label="View in modal"
                                 >
                                   <FaChevronRight className="w-3 h-3" />
                                 </button>
                               )}
                               <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                       )} 
                     /> 
                   </div>
                 </LazyComponent>
               )}

               {/* Humorous Data Insights Station (previously Quick Notes) */}
               {shouldShowStation('quick-note') && (
                 <LazyComponent 
                   placeholder={
                     <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-12 flex items-center justify-center">
                       <div className="text-gray-500">Loading Humorous Data Insights...</div>
                     </div>
                   }
                 >
                   <div className="mb-12">
                     <SwipeStation 
                       key={`quick-note-${searchStateKey}-${filteredPosts.filter(post => post.type === 'quick-note').length}`} 
                       title="Humorous Data Insights" 
                       posts={filteredPosts.filter(post => post.type === 'quick-note')} 
                       visibleCards={3} 
                       renderCard={(post, index) => ( 
                         <motion.div 
                           key={post.id} 
                           initial={{ opacity: 0, y: 20 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ duration: 0.3, delay: index * 0.05 }} 
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-3 h-[230px] flex flex-col"
                           onClick={(e) => {
                             // Prevent any unwanted navigation
                             if (!(e.target as HTMLElement).closest('a, button')) {
                               e.preventDefault();
                             }
                           }}
                         >
                           <div className="flex items-center mb-2"> 
                             <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                               <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                               </svg>
                             </div> 
                             <span className="ml-1.5 text-xs text-gray-400">LinkedIn Post</span> 
                           </div> 
                           <h4 className="font-semibold text-md mb-1.5 text-white line-clamp-2 leading-snug">{highlightText(post.title, activeSearchTerms)}</h4> 
                           <p className="text-gray-300 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden"> {highlightText(truncateToWords(post.excerpt || '', 24), activeSearchTerms)} </p>
                           <div className="mt-auto">
                             <div className="flex justify-between items-center mb-2">
                               <a 
                                 href={post.url || post.link || "#"}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="text-data hover:text-data-light text-sm inline-flex items-center"
                               >
                                 View Post <FaExternalLinkAlt className="w-3 h-3 ml-1 opacity-70" />
                               </a>
                               {post.embed_link && (
                                 <button 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     
                                     const embedHtml = post.embed_link as string;
                                     
                                     setModalContent({
                                       type: 'embed',
                                       title: post.title,
                                       content: embedHtml,
                                       link: post.link || post.url || '#',
                                       date: post.date
                                     });
                                     setShowModal(true);
                                   }}
                                   className="w-7 h-7 bg-data/20 hover:bg-data/30 text-data rounded-full flex items-center justify-center transition-colors"
                                   aria-label="View in modal"
                                 >
                                   <FaChevronRight className="w-3 h-3" />
                                 </button>
                               )}
                               <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                       )} 
                     /> 
                   </div>
                 </LazyComponent>
               )}
              
               {/* Technical Articles Station (previously Research Reports) */}
               {shouldShowStation('research-report') && (
                 <LazyComponent 
                   placeholder={
                     <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-12 flex items-center justify-center">
                       <div className="text-gray-500">Loading Technical Articles...</div>
                     </div>
                   }
                 >
                   <div className="mb-12">
                     <SwipeStation 
                       key={`research-report-${searchStateKey}-${filteredPosts.filter(post => post.type === 'research-report' && !post.featured).length}`} 
                       title="Technical Articles" 
                       posts={filteredPosts.filter(post => post.type === 'research-report' && !post.featured)} 
                       visibleCards={2} 
                       renderCard={(post, index) => ( 
                         <motion.div 
                           key={post.id} 
                           initial={{ opacity: 0, y: 20 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ duration: 0.3, delay: index * 0.05 }}
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[400px] flex flex-col"
                         >
                           <div className="h-48 mb-4 overflow-hidden rounded-lg bg-dark-300/60 relative">
                             {post.image ? (
                               <Image 
                                 src={post.image} 
                                 alt={post.title} 
                                 width={600} 
                                 height={300}
                                 className="object-cover h-full w-full transition-transform hover:scale-105"
                               />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200">
                                 <FaMicroscope className="text-3xl text-gray-400" />
                               </div>
                             )}
                           </div>
                           <h4 className="font-semibold text-lg mb-2 text-white line-clamp-2">{highlightText(post.title, activeSearchTerms)}</h4>
                           <p className="text-gray-300 text-sm mb-4 flex-grow overflow-hidden line-clamp-3">
                             {highlightText(truncateToWords(post.excerpt || '', 24), activeSearchTerms)}
                           </p>
                           <div className="mt-auto">
                             <div className="flex justify-between text-xs text-gray-400 mb-2">
                               <span>{formatDate(post.date)}</span>
                               <span>{post.readTime}</span>
                             </div>
                             <a 
                               href={post.link || post.url || '#'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="py-1.5 px-4 bg-data/20 hover:bg-data/30 text-data rounded-md text-sm inline-flex items-center transition-colors"
                             >
                               Read Article <FaChevronRight className="ml-1 w-3 h-3" />
                             </a>
                           </div>
                         </motion.div> 
                       )} 
                     /> 
                   </div>
                 </LazyComponent>
               )}
              
               {/* Substack Publications Station (previously Comprehensive Studies) */}
               {shouldShowStation('comprehensive-study') && (
                 <LazyComponent 
                   placeholder={
                     <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-12 flex items-center justify-center">
                       <div className="text-gray-500">Loading Substack Publications...</div>
                     </div>
                   }
                 >
                   <div className="mb-12">
                     <SwipeStation 
                       key={`comprehensive-study-${searchStateKey}-${filteredPosts.filter(post => post.type === 'comprehensive-study').length}`} 
                       title="Substack Publications" 
                       posts={filteredPosts.filter(post => post.type === 'comprehensive-study')} 
                       visibleCards={1} 
                       renderCard={(post, index) => ( 
                         <motion.div 
                           key={post.id} 
                           initial={{ opacity: 0, y: 20 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ duration: 0.3, delay: index * 0.05 }}
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[480px] flex flex-col"
                         >
                           <div className="h-60 mb-4 overflow-hidden rounded-lg bg-dark-300/60 relative">
                             {post.image ? (
                               <Image 
                                 src={post.image} 
                                 alt={post.title} 
                                 width={800} 
                                 height={400}
                                 className="object-cover h-full w-full transition-transform hover:scale-105"
                               />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200">
                                 <FaNewspaper className="text-4xl text-gray-400" />
                               </div>
                             )}
                           </div>
                           <h4 className="font-semibold text-xl mb-2 text-white">{highlightText(post.title, activeSearchTerms)}</h4>
                           <p className="text-gray-300 text-sm mb-4 flex-grow overflow-hidden line-clamp-4">
                             {highlightText(truncateToWords(post.excerpt || '', 50), activeSearchTerms)}
                           </p>
                           <div className="mt-auto">
                             <div className="flex justify-between text-xs text-gray-400 mb-3">
                               <span>{formatDate(post.date)}</span>
                               <span>{post.readTime}</span>
                             </div>
                             <a 
                               href={post.link || post.url || '#'}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="py-2 px-5 bg-data/20 hover:bg-data/30 text-data rounded-md inline-flex items-center justify-center transition-colors"
                             >
                               Read on Substack <FaExternalLinkAlt className="ml-2 w-3 h-3" />
                             </a>
                           </div>
                         </motion.div> 
                       )} 
                     /> 
                   </div>
                 </LazyComponent>
               )}

               {/* LinkedIn Iframe Posts Station (Moved to Last) */}
               {/* Temporarily removed LinkedIn Iframe Posts Station */}

             </Suspense>
           </div>
         )}

        {/* Empty State */}
        {filteredPosts.length === 0 && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="max-w-6xl mx-auto py-16 text-center"
           >
             {/* ... Empty state JSX ... */}
              <div className="mb-6"> <Image src="/images/penguin_confused.png" alt="No results" width={100} height={100} className="mx-auto" /> </div> <h3 className="text-xl font-bold text-white mb-2">No Research Logs Found</h3> <p className="text-gray-400"> No posts match your current search criteria. Try adjusting your filters or search query. </p> <button onClick={resetAllFilters} className="mt-4 px-4 py-2 bg-data hover:bg-data-dark text-dark-300 font-medium rounded-lg transition-colors" > Reset Filters </button>
         </motion.div>
        )}
      </div>

      {/* Modal for content display */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            // Close modal when clicking outside the content
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setModalContent(null);
            }
          }}
        >
          <div className="bg-dark-200 border border-data/20 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-700 p-4">
              <h3 className="text-xl font-semibold text-white">{modalContent?.title}</h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setModalContent(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
              {modalContent?.type === 'embed' && modalContent.content && (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-[504px] mb-4">
                    <div dangerouslySetInnerHTML={{ __html: modalContent.content }} />
                  </div>
                  <div className="flex justify-center mt-2">
                    <a 
                      href={modalContent.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="py-2 px-4 bg-data/20 hover:bg-data/30 text-data rounded transition-colors inline-flex items-center"
                    >
                      View on LinkedIn <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              
              {modalContent?.type === 'article' && (
                <div className="text-gray-200 prose prose-invert max-w-none">
                  <p className="text-sm text-gray-400 mb-4">
                    {modalContent.date ? formatDate(modalContent.date) : 'Publication date not available'}
                  </p>
                  {modalContent.content ? (
                    <div dangerouslySetInnerHTML={{ __html: modalContent.content }} />
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-400">Content will be available soon.</p>
                      {modalContent.link && (
                        <a 
                          href={modalContent.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-4 py-2 px-4 bg-data/20 hover:bg-data/30 text-data rounded inline-flex items-center"
                        >
                          View on LinkedIn <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogClientContent; // Export the client component 