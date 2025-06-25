'use client'; // Mark this as a Client Component

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback, CSSProperties, Dispatch, SetStateAction, RefObject, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import LegacyImage from 'next/legacy/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { FaSearch, FaStar, FaExternalLinkAlt, FaChevronRight, FaMicroscope, FaNewspaper, FaPlay, FaExpandAlt, FaArrowUp } from 'react-icons/fa';
import { X } from 'lucide-react';
import { BlogPost } from '@/types/blog'; // Keep BlogPost type
import LazyComponent from '@/components/blog/LazyComponent';
import { formatTagDisplayName } from '@/components/blog/SearchModal';

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
const SwipeStation = dynamic<{
  title: string;
  posts: BlogPost[];
  visibleCards: number;
  renderCard: (post: BlogPost, index: number, isLoading?: boolean) => React.ReactNode;
  onLastSlideReached?: () => void;
  totalPostCount?: number;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
}>(() => import('@/components/blog/SwipeStation'), {
  loading: () => (
    <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-8 flex items-center justify-center">
      <div className="text-gray-500">Loading station...</div>
    </div>
  )
});

// Lazy load the search modal component
const SearchModal = dynamic<{
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  activeFilter: string;
  activeSearchTerms: string[];
  blogCategories: { id: string; label: string }[];
  searchInputRef: RefObject<HTMLInputElement>;
  showSuggestions: boolean;
  setShowSuggestions: Dispatch<SetStateAction<boolean>>;
  searchSuggestions: { value: string; display: string; type: string }[];
  suggestionsRef: RefObject<(HTMLButtonElement | null)[]>;
  focusedSuggestionIndex: number;
  handleSearchEnter: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleFilterButtonClick: (categoryId: string) => void;
  handleSuggestionClick: (suggestion: { value: string; display: string; type: string }) => void;
  removeSearchTerm: (termToRemove: string) => void;
  resetAllFilters: () => void;
  showSearchModal: boolean;
  setShowSearchModal: Dispatch<SetStateAction<boolean>>;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchDisabled?: boolean;
  showSearchDisabledMessage?: boolean;
  setShowSearchDisabledMessage?: Dispatch<SetStateAction<boolean>>;
}>(() => import('@/components/blog/SearchModal'), {
  ssr: false,
  loading: () => null,
});

// Define the props type expected from the Server Component
interface BlogClientContentProps {
  initialBlogPosts: BlogPost[];
  initialBlogCategories: { id: string; label: string }[];
  postCounts?: Record<string, number>;
  initialLimits?: {
    desktop: Record<string, number>;
    mobile: Record<string, number>;
  };
}

// Create a loading card component for each post type
const LoadingCard = ({ type, style }: { type: string, style?: CSSProperties }) => {
  // Different loading card layouts based on post type
  switch (type) {
    case 'youtube-video':
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg animate-pulse h-[340px] flex flex-col" style={style}>
          <div className="bg-dark-300/80 h-[180px] rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-dark-200/50 to-dark-300/50" />
          </div>
          <div className="px-4 py-4 flex flex-col flex-grow">
            <div className="h-5 bg-dark-300/80 rounded mb-3 w-3/4"></div>
            <div className="h-4 bg-dark-300/80 rounded mb-2 w-full"></div>
            <div className="h-4 bg-dark-300/80 rounded mb-2 w-5/6"></div>
            <div className="h-4 bg-dark-300/80 rounded mb-4 w-2/3"></div>
            <div className="mt-auto flex justify-between items-center">
              <div className="h-4 bg-dark-300/80 rounded w-20"></div>
              <div className="h-4 bg-dark-300/80 rounded w-16"></div>
            </div>
          </div>
        </div>
      );
    
    case 'research-report':
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg animate-pulse h-[410px] flex flex-col" style={style}>
          <div className="h-48 mb-4 bg-dark-300/80 rounded-lg"></div>
          <div className="h-6 bg-dark-300/80 rounded mb-3 w-4/5"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-full"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-11/12"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-4 w-4/5"></div>
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="h-3 bg-dark-300/80 rounded w-20"></div>
              <div className="h-3 bg-dark-300/80 rounded w-16"></div>
            </div>
            <div className="h-8 bg-dark-300/80 rounded w-32"></div>
          </div>
        </div>
      );
      
    case 'comprehensive-study':
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg animate-pulse h-[580px] flex flex-col" style={style}>
          <div className="h-80 mb-4 bg-dark-300/80 rounded-lg"></div>
          <div className="h-6 bg-dark-300/80 rounded mb-3 w-4/5"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-full"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-11/12"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-4 w-4/5"></div>
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="h-3 bg-dark-300/80 rounded w-20"></div>
              <div className="h-3 bg-dark-300/80 rounded w-16"></div>
            </div>
            <div className="h-8 bg-dark-300/80 rounded w-32"></div>
          </div>
        </div>
      );
    
    case 'medium-post':
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg animate-pulse h-[560px] flex flex-col" style={style}>
          <div className="h-80 mb-4 bg-dark-300/80 rounded-lg"></div>
          <div className="h-6 bg-dark-300/80 rounded mb-3 w-4/5"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-full"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-11/12"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-4 w-4/5"></div>
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="h-3 bg-dark-300/80 rounded w-20"></div>
              <div className="h-3 bg-dark-300/80 rounded w-16"></div>
            </div>
            <div className="h-8 bg-dark-300/80 rounded w-32"></div>
          </div>
        </div>
      );
    
    // Default card for linkedin-post and quick-note
    default:
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg animate-pulse h-[230px] flex flex-col" style={style}>
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-dark-300/80"></div>
            <div className="ml-1.5 h-3 bg-dark-300/80 rounded w-20"></div>
          </div>
          <div className="h-5 bg-dark-300/80 rounded mb-2 w-11/12"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-full"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-2 w-5/6"></div>
          <div className="h-4 bg-dark-300/80 rounded mb-4 w-2/3"></div>
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-dark-300/80 rounded w-20"></div>
              <div className="h-4 bg-dark-300/80 rounded w-5"></div>
              <div className="h-3 bg-dark-300/80 rounded w-16"></div>
            </div>
          </div>
        </div>
      );
  }
};

// Add this after the LoadingCard component to create a utility function for generating placeholder posts
const createPlaceholderPost = (type: string, index: number): BlogPost => {
  return {
    id: `loading-${type}-${index}`,
    title: 'Loading...',
    excerpt: '',
    description: '',
    content: '',
    date: new Date().toISOString(),
    tags: [],
    category: [],
    type: type as BlogPost['type'], // Properly cast to the BlogPost type
    link: '',
    url: '',
    image: '',
    author: {
      name: '',
      avatar: ''
    },
    featured: false,
    readTime: '',
    isPlaceholder: true
  };
};

const BlogClientContent: React.FC<BlogClientContentProps> = ({ 
  initialBlogPosts, 
  initialBlogCategories,
  postCounts = {}, 
  initialLimits
}) => {
  // All the state, effects, refs, handlers, and JSX from the original BlogPage go here
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSearchTerms, setActiveSearchTerms] = useState<string[]>([]);
  // Use the props for initial state and keep a copy for filtering
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlogPosts); 
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
    type: 'embed' | 'no-embed' | 'article'; 
    title: string; 
    content: string; 
    link?: string; 
    date?: string; 
    mediaLinks?: string | string[]; 
    postIndex?: number; // Add post index to remember position
    stationType?: string; // Add station type to remember context
  } | null>(null);
  const [showSearchDisabledMessage, setShowSearchDisabledMessage] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Add state for card behavior info modal
  const [showCardInfoModal, setShowCardInfoModal] = useState(false);
  
  // Add state for posts loading
  const [loadingPosts, setLoadingPosts] = useState<Record<string, boolean>>({});
  const [hasMorePosts, setHasMorePosts] = useState<Record<string, boolean>>({});
  const [loadedPostsByType, setLoadedPostsByType] = useState<Record<string, number>>({});
  
  // First, update the state management - add a state to track if a modal is being opened
  // to prevent SwipeStation from resetting
  const [preventSwipeReset, setPreventSwipeReset] = useState(false);
  
  // Add state to track current index for each SwipeStation type
  const [stationIndexes, setStationIndexes] = useState<Record<string, number>>({});
  
  // First add a new state to track the number of posts to show on mobile for each type
  const [mobilePagination, setMobilePagination] = useState<Record<string, number>>({});
  const [mobileScrollObserver, setMobileScrollObserver] = useState<IntersectionObserver | null>(null);
  
  // Detect device size to determine initial loading limits
  const getPostsLimit = useCallback((type: string) => {
    if (!initialLimits) {
      return 10; // Default limit
    }
    if (isMobileDevice) {
      return initialLimits.mobile[type] || 3;
    }
    return initialLimits.desktop[type] || 6;
  }, [initialLimits, isMobileDevice]);

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
  
  // Initialize loading states for each post type based on post counts
  useEffect(() => {
    if (postCounts && Object.keys(postCounts).length > 0) {
      // Initialize hasMorePosts state
      const initialHasMore: Record<string, boolean> = {};
      const initialLoadedCount: Record<string, number> = {};
      
      Object.keys(postCounts).forEach(type => {
        // If we have post counts, check if there are more than the initial limit
        const limit = getPostsLimit(type);
        initialHasMore[type] = (postCounts[type] || 0) > limit;
        initialLoadedCount[type] = 0; // Start with 0 loaded posts
      });
      
      setHasMorePosts(initialHasMore);
      setLoadedPostsByType(initialLoadedCount);
      
      // Trigger initial loading for each type
      Object.keys(postCounts).forEach(type => {
        loadMorePosts(type);
      });
    }
  }, [postCounts, getPostsLimit]);

  // Function to load more posts for a specific type
  const loadMorePosts = useCallback(async (type: string) => {
    // Prevent multiple simultaneous loading requests for the same type
    if (loadingPosts[type]) return;
    
    try {
      setLoadingPosts(prev => ({ ...prev, [type]: true }));
      
      const loadedCount = loadedPostsByType[type] || 0;
      const limit = getPostsLimit(type);
      
      // For LinkedIn posts, ensure we're loading enough to get all posts
      const adjustedLimit = type === 'linkedin-post' ? Math.max(limit, 20) : limit;
      
      // Construct API URL with parameters
      let apiUrl = `/api/posts?type=${type}&offset=${loadedCount}&limit=${adjustedLimit}`;
      
      // Add tags parameter if search terms are active
      if (activeFilter !== 'all') {
        // If filtering by category, use it as a tag
        apiUrl += `&tags=${encodeURIComponent(activeFilter)}`;
      } else if (activeSearchTerms.length > 0) {
        // If searching, pass all search terms as tags
        apiUrl += `&tags=${encodeURIComponent(activeSearchTerms.join(','))}`;
      }
      
      // Log the API URL in production to help diagnose issues
      // console.log(`Loading more posts: ${apiUrl}`);
      
      // Fetch posts through API
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      
      const data = await response.json();
      const newPosts = data.posts as BlogPost[];
      const totalCount = data.total;
      
      // console.log(`API returned ${newPosts.length} posts of type ${type} (total: ${totalCount})`);
      
      // Update loaded count
      const newLoadedCount = loadedCount + newPosts.length;
      setLoadedPostsByType(prev => ({ ...prev, [type]: newLoadedCount }));
      
      // Check if there are more posts to load
      setHasMorePosts(prev => ({ 
        ...prev, 
        [type]: newLoadedCount < totalCount
      }));
      
      // Fix: Add new posts to state with deduplication by ID
      setBlogPosts(prev => {
        // Get existing post IDs for fast lookup
        const existingIds = new Set(prev.map(post => post.id));
        
        // Filter out any new posts that already exist in the state
        const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
        
        // console.log(`Adding ${uniqueNewPosts.length} unique posts to state (filtered out ${newPosts.length - uniqueNewPosts.length} duplicates)`);
        
        return [...prev, ...uniqueNewPosts];
      });
    } catch (error) {
      console.error(`Error loading more ${type} posts:`, error);
    } finally {
      setLoadingPosts(prev => ({ ...prev, [type]: false }));
    }
  }, [loadingPosts, loadedPostsByType, getPostsLimit, activeFilter, activeSearchTerms]);
  
  // Load more posts when the user reaches the end of a section
  const handleLoadMoreForType = useCallback((type: string) => {
    if (hasMorePosts[type] && !loadingPosts[type]) {
      // console.log(`Loading more posts for ${type}`);
      loadMorePosts(type);
    }
  }, [hasMorePosts, loadingPosts, loadMorePosts]);
  
  // Monitor scroll position to trigger loading more posts when near the end of a section
  useEffect(() => {
    const handleSwipeSectionScroll = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionType = entry.target.getAttribute('data-type');
          if (sectionType) {
            handleLoadMoreForType(sectionType);
          }
        }
      });
    };
    
    const observer = new IntersectionObserver(handleSwipeSectionScroll, {
      root: null,
      rootMargin: '0px 0px 200px 0px', // Start loading when within 200px of the bottom
      threshold: 0.1
    });
    
    // Observe loading trigger elements
    document.querySelectorAll('.load-more-trigger').forEach(el => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, [handleLoadMoreForType]);

  // Generate search suggestions with debounce
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 100), // Reduced from 300ms to 100ms for better responsiveness
    []
  );

  // Memoize search suggestions calculation for better performance
  const searchSuggestions = useMemo(() => {
    // Don't generate suggestions on mobile devices at all
    if (isMobileDevice) {
      return [];
    }
    
    // Don't generate suggestions for very short queries
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return [];
    }
    
    const query = searchQuery.toLowerCase();
    
    // Only compute categories that match the query
    const matchingCategories = blogCategories
      .filter(cat => cat.label.toLowerCase().includes(query))
      .map(cat => ({ value: cat.id, display: cat.label, type: 'category' as const }));
    
    // Extract words only once from all titles and memoize the result
    const currentActiveTermsLower = activeSearchTerms.map(t => t.toLowerCase());
    
    // Fixed keyword list for the archive page
    const fixedKeywords = [
      'humor', 'data_engineering', 'open_source', 'ai', 'learning', 'achievement'
    ];
    
    // Filter keywords by prefix (very efficient operation)
    const prefixSuggestions = fixedKeywords
      .filter(keyword => keyword.toLowerCase().startsWith(query))
      .filter(keyword => !currentActiveTermsLower.includes(keyword.toLowerCase()))
      .map(keyword => ({ 
        value: keyword, 
        display: formatTagDisplayName(keyword),
        type: 'keyword' as const 
      }))
      .slice(0, 3); // Limit to top 3 matching keywords

    // Combine all suggestions with priority
    const allSuggestions = [
      ...prefixSuggestions, // Fixed keywords first
      ...matchingCategories.slice(0, 2) // Limit categories
    ];

    // Remove duplicates and limit results
    return Array.from(
      new Set(allSuggestions.map(item => JSON.stringify(item)))
    )
      .map(item => JSON.parse(item))
      .slice(0, 5); // Limit to 5 suggestions
  }, [searchQuery, blogCategories, activeSearchTerms, activeFilter, isMobileDevice]);

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

  // Set loaded state after initial render with minimum delay
  useEffect(() => {
    const timer = setTimeout(() => {
    setIsLoaded(true);
      setShowContent(true);
    }, 200); // 2 second delay

    return () => clearTimeout(timer);
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

  // Memoize filtered posts calculation with optimized tag-based search
  const filteredPostsResult = useMemo(() => {
    // console.log("Recalculating filtered posts");
    
    // First deduplicate posts by ID (keep only the first occurrence of each ID)
    const uniquePosts = blogPosts
      .filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );
    
    let tempFiltered = [...uniquePosts]; // Start with deduplicated original posts

    // Either apply category filter OR search terms filtering, but not both
    if (activeFilter !== 'all') {
      // If category filter is active, use it - match against tags
      tempFiltered = tempFiltered.filter(post => 
        Array.isArray(post.tags) 
          ? post.tags.includes(activeFilter) 
          : post.tags === activeFilter
      );
    } else if (activeSearchTerms.length > 0) {
      // Optimize search to only look at tags for better performance
      // Normalize search terms for case-insensitive comparison
      const normalizedTerms = activeSearchTerms.map(term => term.toLowerCase());
      
      tempFiltered = tempFiltered.filter(post => {
        // Get post tags, ensuring we have an array to work with
        const postTags = Array.isArray(post.tags) 
          ? post.tags 
          : typeof post.tags === 'string' 
            ? [post.tags] 
            : [];
            
        // Convert tags to lowercase for case-insensitive matching
        const normalizedTags = postTags.map(tag => tag.toLowerCase());
        
        // A post matches if ANY search term is found in ANY tag (including partial matches)
        return normalizedTerms.some(searchTerm => 
          normalizedTags.some(tag => tag.includes(searchTerm))
        );
      });
    }
    
    return tempFiltered;
  }, [activeFilter, activeSearchTerms, blogPosts]); // Dependencies

  // Update state when memoized result changes
  useEffect(() => {
    setFilteredPosts(filteredPostsResult);
  }, [filteredPostsResult]);

  // Memoize the featured post
  const featuredPost = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return filteredPosts.find(post => 
      post.type === 'comprehensive-study' && 
      new Date(post.date) > sevenDaysAgo
    );
  }, [filteredPosts]);
  
  // Memoize escapeRegExp to avoid recreation on every render
  const escapeRegExp = useCallback((string: string) => 
    string.replace(/[.*+?^${}()|[\]\\\\]/g, '\\$&'),
    []
  );
  
  // Optimize highlightText with memoization for each post/terms combination
  const highlightText = useCallback((text: string, terms: string[]) => {
    // Return plain text without highlighting for better performance
    return text;
  }, []);

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
      // Clear search terms when selecting a category
      setActiveSearchTerms([]);
    } else if (suggestion.type === 'keyword') {
      // Clear category filter when adding a search term
      if (activeFilter !== 'all') {
        setActiveFilter('all');
      }
      if (activeSearchTerms.length < 3 && !activeSearchTerms.find(term => term.toLowerCase() === suggestion.value.toLowerCase())) {
        setActiveSearchTerms(prevTerms => [...prevTerms, suggestion.value]);
      }
    }
    setSearchQuery(''); // Clear input after selection
    setShowSuggestions(false);
    setFocusedSuggestionIndex(-1);
  }, [activeSearchTerms, setActiveFilter, setActiveSearchTerms, setSearchQuery, setShowSuggestions, activeFilter]);

  const removeSearchTerm = useCallback((termToRemove: string) => {
    setActiveSearchTerms(prevTerms => prevTerms.filter(t => t.toLowerCase() !== termToRemove.toLowerCase()));
  }, []);

  const handleSearchEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const newTerm = searchQuery.trim();
      // Clear category filter when adding a search term
      if (activeFilter !== 'all') {
        setActiveFilter('all');
      }
      if (activeSearchTerms.length < 3 && !activeSearchTerms.find(term => term.toLowerCase() === newTerm.toLowerCase())) {
         setActiveSearchTerms(prevTerms => [...prevTerms, newTerm]);
      }
      setSearchQuery(''); // Clear input after Enter
      setShowSuggestions(false);
      setFocusedSuggestionIndex(-1);
    }
  }, [activeSearchTerms, searchQuery, activeFilter, setActiveFilter]);

  const handleFilterButtonClick = useCallback((categoryId: string) => {
    setActiveFilter(categoryId);
    // Clear any active search terms when selecting a category
    if (activeSearchTerms.length > 0) {
      setActiveSearchTerms([]);
    }
  }, [activeSearchTerms.length]);

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
        // After modal closes, allow swipe reset on next data change
        setTimeout(() => setPreventSwipeReset(false), 300);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  // Update the renderSwipeStation function to preserve currentIndex
  const renderSwipeStation = useCallback((type: string, title: string, visibleCards: number, renderCard: any) => {
    // Get unique posts of this type by filtering by ID
    const postsOfType = filteredPosts
      .filter(post => post.type === type)
      // Deduplicate by ID (keep only the first occurrence of each ID)
      .filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );
      
    // Add debug logging for LOL Hub section
    if (type === 'quick-note') {
      // console.log(`[LOL Hub Debug] Found ${postsOfType.length} posts of type ${type}`);
      if (postsOfType.length > 0) {
        // console.log(`[LOL Hub Debug] First post title: "${postsOfType[0].title}"`);
      }
    }
    
    // Debug LinkedIn posts too
    if (type === 'linkedin-post') {
      // console.log(`[LinkedIn Debug] Found ${postsOfType.length} posts of type ${type}`);
      // console.log(`[LinkedIn Debug] Post IDs: ${postsOfType.map(p => p.id).join(', ')}`);
    }
      
    const isLoading = loadingPosts[type] || false;
    const hasMore = hasMorePosts[type] && postsOfType.length < (postCounts[type] || 0);
    
    // Get the current index for this station type
    const currentIndex = stationIndexes[type] || 0;
    
    // Update the total count to reflect the actual number of posts after filtering
    // If no filter is applied, use the postCounts, otherwise use the filtered count
    const totalPosts = 
      (activeFilter !== 'all' || activeSearchTerms.length > 0) 
        ? postsOfType.length 
        : Math.max(postCounts[type] || 0, postsOfType.length); // Use the greater of postCounts or actual length
    
    // Create an array with posts and loading placeholders if needed
    let displayPosts = [...postsOfType];
    
    // Critical: Make sure we're not limiting the posts here - we're showing ALL posts
    // console.log(`[${type}] Displaying ${displayPosts.length} posts (total: ${totalPosts})`);
    
    // If loading and fewer posts than minimum to show, add loading placeholders
    if (isLoading && displayPosts.length < visibleCards) {
      const placeholdersNeeded = visibleCards - displayPosts.length;
      
      // Create placeholder posts
      for (let i = 0; i < placeholdersNeeded; i++) {
        displayPosts.push(createPlaceholderPost(type, i));
      }
    }
    
    // Early return if we don't have posts of this type and aren't loading any
    // Also return null when we have a search active and no matching posts
    if (displayPosts.length === 0 && !isLoading) {
      return null;
    }
    
    // For search results, don't show sections with no matches
    if ((activeFilter !== 'all' || activeSearchTerms.length > 0) && postsOfType.length === 0) {
      return null;
    }
    
    // Add debug logging in development
    if (process.env.NODE_ENV === 'development') {
      // console.log(`Rendering ${type} swipe station with ${displayPosts.length} posts, currentIndex=${currentIndex}`);
    }
    
    // Handle index change callback from SwipeStation
    const handleIndexChange = (newIndex: number) => {
      setStationIndexes(prev => ({
        ...prev,
        [type]: newIndex
      }));
      
      // Enhanced onLastSlideReached handler that specifically handles edge cases for LOL Hub and LinkedIn Articles
      // Only load more if we're showing unfiltered results and near the end
      if (activeFilter === 'all' && activeSearchTerms.length === 0) {
        const maxIndex = Math.max(0, totalPosts - visibleCards);
        if (newIndex >= maxIndex - 1 && hasMore && !isLoading) {
          // console.log(`Near last slide for ${type}, loading more...`);
          handleLoadMoreForType(type);
        }
      }
    };
    
    // Map content types to section IDs as defined in MainLayout.tsx
    const getSectionId = (contentType: string) => {
      switch(contentType) {
        case 'youtube-video': return 'youtube-videos';
        case 'linkedin-post': return 'linkedin-posts';
        case 'quick-note': return 'lol-hub';
        case 'research-report': return 'linkedin-articles';
        case 'comprehensive-study': return 'substack-unpacked';
        case 'medium-post': return 'medium-insights';
        default: return contentType;
      }
    };
    
    return (
      <LazyComponent 
        placeholder={
          <div className="animate-pulse bg-dark-200/40 rounded-lg h-80 mb-12 flex items-center justify-center">
            <div className="text-gray-500">Loading {title}...</div>
          </div>
        }
      >
        <div className="mb-12 section-container" id={getSectionId(type)} data-type={type}>
          <h2 id={`${getSectionId(type)}-title`} className="sr-only">{title}</h2>
          <SwipeStation 
            key={`${type}-${searchStateKey}`} // No need for the posts.length anymore
            title={title} 
            posts={displayPosts} 
            visibleCards={visibleCards}
            currentIndex={currentIndex} // Pass the controlled index
            onIndexChange={handleIndexChange} // Handle index changes
            onLastSlideReached={() => {
              if (hasMore && !isLoading) {
                handleLoadMoreForType(type);
              }
            }}
            renderCard={(post, index) => {
              // If this is a placeholder post, render the loading card
              if (post.isPlaceholder) {
                return <LoadingCard type={type} />;
              }
              // Otherwise render the actual post card
              return renderCard(post, index, isLoading);
            }}
            totalPostCount={totalPosts} // Pass the correct filtered count for pagination display
          />
          
          {/* Only show loading indicator when viewing unfiltered results */}
          {(isLoading || (hasMore && activeFilter === 'all' && activeSearchTerms.length === 0)) && (
            <div 
              className="load-more-trigger mt-2 text-center text-sm text-gray-400" 
              data-type={type}
            >
              {isLoading ? "Loading more..." : "Scroll to load more"}
            </div>
          )}
        </div>
      </LazyComponent>
    );
  }, [filteredPosts, loadingPosts, hasMorePosts, postCounts, searchStateKey, handleLoadMoreForType, activeFilter, activeSearchTerms, stationIndexes]);

  // Add this after the other useEffect hooks to set up mobile pagination
  useEffect(() => {
    if (isMobileDevice) {
      const initialPagination: Record<string, number> = {};
      // Start with smaller chunks on mobile for each content type
      initialPagination['youtube-video'] = 2;
      initialPagination['linkedin-post'] = 3;
      initialPagination['quick-note'] = 3;
      initialPagination['research-report'] = 2;
      initialPagination['comprehensive-study'] = 1;
      initialPagination['medium-post'] = 1;
      
      setMobilePagination(initialPagination);
      
      // Create intersection observer for mobile infinite scroll
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const sectionType = entry.target.getAttribute('data-section-type');
              if (sectionType) {
                // Increase pagination limit for this section
                setMobilePagination(prev => ({
                  ...prev,
                  [sectionType]: Math.min(
                    (prev[sectionType] || 0) + 2, // Add 2 more items
                    filteredPosts.filter(post => post.type === sectionType).length // Don't exceed available posts
                  )
                }));
              }
            }
          });
        },
        { rootMargin: '0px 0px 300px 0px' } // Load more when scrolling within 300px of the bottom
      );
      
      setMobileScrollObserver(observer);
    } else {
      // On desktop, don't limit pagination
      setMobilePagination({});
    }
  }, [isMobileDevice, filteredPosts]);

  // Observe loading triggers when they're rendered
  useEffect(() => {
    if (mobileScrollObserver) {
      // First disconnect from any existing elements
      mobileScrollObserver.disconnect();
      
      // Then observe all loading triggers
      document.querySelectorAll('.mobile-load-more-trigger').forEach(el => {
        mobileScrollObserver.observe(el);
      });
    }
  }, [mobileScrollObserver, mobilePagination]);

  // Scroll to top button
  const scrollToTopButton = (
    <motion.button
      className="fixed bottom-5 right-5 z-50 rounded-full bg-black dark:bg-white p-3 text-white dark:text-black shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-opacity"
      initial={{ opacity: 0 }}
      animate={{ opacity: showScrollToTop ? 1 : 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if (window) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      aria-label="Scroll to top"
    >
      <FaArrowUp size={20} />
    </motion.button>
  );

  // --- Return JSX Structure ---
  return (
    <>
      <BlogIcebergBackground />
      <div className="container mx-auto px-4 pt-20 pb-16 z-10 relative">
        {/* Header Section */}
        {showContent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto mb-8 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Research <span className="text-data">Station</span>
            <Image 
              src="/images/penguin_right_mac.png" 
              alt="Penguin" 
              width={50} 
              height={50}
              className="inline-block ml-4 animate-float"
              priority // Keep priority as it might be ATF
            />
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Welcome to my Antarctic Research Station, where I document insights and discoveries from my data engineering expeditions.
            Explore these content iceberg cards with a gentle swipe — they float freely in the water, just like the real ones!
            {/* Swipe through our Arctic Archives — like penguins on ice, they might slide a bit during navigation! */}
            <br />
            <button 
              onClick={() => setShowCardInfoModal(true)}
              className="ml-1 inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-r from-[#25B7D3]/40 to-[#6559F5]/30 hover:from-[#25B7D3]/60 hover:to-[#6559F5]/50 text-white shadow-md border border-[#25B7D3]/30 transition-all group relative overflow-hidden"
              aria-label="View AI content information"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-md opacity-0 group-hover:opacity-100 animate-pulse transition-opacity"></span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </button>
          </p>
        </motion.div>
        )}

        {/* Search Trigger Button & Active Filters Display */}
        <div className="max-w-6xl mx-auto mb-8 flex justify-center items-center gap-2">
          <motion.div
            onClick={() => setShowSearchModal(true)}
            className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-data/20 px-3 py-3 text-white flex items-center hover:bg-dark-200/90 hover:border-data/40 transition-all flex-wrap gap-1 w-full max-w-md cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button to open modal */}
            <div
              className="flex items-center mr-2 shrink-0" // Prevent shrinking
              aria-label="Open search and filter options"
            >
              <FaSearch className="text-data/80 mr-2" />
              {activeSearchTerms.length === 0 && activeFilter === 'all' && (
                <span className="opacity-50">Explore Antarctic Archives</span>
              )}
              {/* {activeFilter !== 'all' && activeSearchTerms.length === 0 && (
                <span className="text-xs text-data/70">Clear category to use search</span>
              )} */}
            </div>
            {/* Display active category filter */}
            {activeFilter !== 'all' && (
              <div className="group bg-data/20 text-data text-xs px-2 py-1 rounded-full flex items-center relative shrink-0">
                <span>{blogCategories.find(c => c.id === activeFilter)?.label || formatTagDisplayName(activeFilter)}</span>
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
                <span>{formatTagDisplayName(term)}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSearchTerm(term); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-4 h-4"
                  aria-label={`Remove keyword ${formatTagDisplayName(term)}`}
                >
                  <X size={12} className="text-data hover:text-white" />
                </button>
              </div>
            ))}

            <div className="ml-auto">
              <Image 
                src="/images/search_penguin.png" 
                alt="Search Penguin" 
                width={24} 
                height={24}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
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
              searchDisabled={activeFilter !== 'all'}
              showSearchDisabledMessage={showSearchDisabledMessage}
              setShowSearchDisabledMessage={setShowSearchDisabledMessage}
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
                    {featuredPost.image.includes('substackcdn.com') ? (
                      <>
                        {/* Try the image proxy first */}
                        {featuredPost.image.includes('substack-post-media.s3.amazonaws.com') ? (
                          <img 
                            src={`/api/image-proxy?url=${encodeURIComponent(featuredPost.image)}`}
                            alt={featuredPost.title}
                            className="w-full h-64 lg:h-full object-cover transition-transform duration-300 hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          // Fallback to template image for truncated URLs
                          <img 
                            src="/api/image-proxy?url=https%3A%2F%2Fsubstackcdn.com%2Fimage%2Ffetch%2Fw_1456%2Cc_limit%2Cf_webp%2Cq_auto%3Agood%2Cfl_progressive%3Asteep%2Fhttps%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252Fb4ccc3ef-8f65-4eb5-a28f-0d3927c4b1f5_2691x954.png"
                            alt={featuredPost.title} 
                            className="w-full h-64 lg:h-full object-cover transition-transform duration-300 hover:scale-105"
                            loading="lazy"
                          />
                        )}
                      </>
                    ) : (
                      <Image 
                        src={featuredPost.image} 
                        alt={featuredPost.title} 
                        loading="lazy" 
                        width={600} 
                        height={400} 
                        className="w-full h-64 lg:h-full object-cover transition-transform duration-300 hover:scale-105" 
                      />
                    )}
                  </div>
                )}
                <div className={`p-6 lg:p-8 ${featuredPost.image ? 'lg:w-1/2' : 'w-full'} flex flex-col`}>
                  <div className="flex items-center mb-3">
                    <FaStar className="text-data mr-2 text-2xl" />
                    <span className="text-data text-xl font-medium">Featured Research</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight">
                    {highlightText(featuredPost.title, activeSearchTerms)}
                  </h2>
                  <p className="text-gray-300 mb-4 line-clamp-4">
                    {highlightText(featuredPost.excerpt || '', activeSearchTerms)}
                  </p>
                  <div className="flex items-center text-sm text-gray-400 mb-6">
                    <span>{formatDate(featuredPost.date)}</span>
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

        {/* Swipe Stations Section - Remove "Research Stations" heading */}
        {filteredPosts.length > 0 && (
           <div className="max-w-6xl mx-auto mb-8"> 
             
             {/* Lazy-load all SwipeStation components with IntersectionObserver for deferred loading */}
             <Suspense fallback={null}>
             
               {/* YouTube Station - Now positioned above LinkedIn Posts Station */}
               <div id="youtube-videos-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'youtube-video',
                 'YouTube Videos',
                 3,
                 (post: BlogPost, index: number, isLoading: boolean) => (
                         <motion.div 
                           initial={{ opacity: 0, y: 20 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ duration: 0.5, delay: index * 0.1 }} 
                           className="bg-dark-300 overflow-hidden h-[360px] rounded-xl flex flex-col"
                           onClick={(e) => {
                             // Only redirect if not clicking a specific button or link
                             if (!(e.target as HTMLElement).closest('button')) {
                         window.open(post.url || post.link, '_blank', 'noopener,noreferrer');
                             }
                           }}
                           style={{ cursor: 'pointer' }}
                         > 
                           <div className="relative h-[180px] overflow-hidden"> 
                       {(post.image || post.thumbnail) ? (
                             <Image 
                           src={post.image || post.thumbnail || '/images/oops_penguin.png'} 
                               alt={post.title} 
                               width={640} 
                               height={360} 
                               className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                             /> 
                       ) : (
                         <div className="w-full h-full bg-dark-400/50 flex items-center justify-center">
                           <FaPlay size={30} className="text-data/70" />
                         </div>
                       )}
                             <div className="absolute inset-0 bg-gradient-to-t from-dark-300/80 to-transparent" /> 
                             <div className="absolute bottom-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-data/90 text-white"> 
                               <FaPlay size={14} className="ml-0.5" /> 
                             </div> 
                           </div> 
                           <div className="px-4 py-4 flex flex-col flex-grow h-[180px]"> 
                       <h3 className="font-bold mb-3 text-white line-clamp-2 h-[52px]">{highlightText(post.title, activeSearchTerms)}</h3> 
                       <p className="text-gray-300 text-sm line-clamp-3 mb-4 h-[72px]">{highlightText(post.excerpt, activeSearchTerms)}</p> 
                             <div className="mt-auto flex justify-between items-center"> 
                               <a 
                           href={post.url || post.link || "#"} 
                                 target="_blank" 
                                 rel="noopener noreferrer" 
                                 className="text-data hover:text-data-light text-sm inline-flex items-center" 
                               > 
                                 Watch Video <FaExternalLinkAlt className="w-3 h-3 ml-1 opacity-70" /> 
                               </a> 
                               <span className="text-gray-400 text-xs"> 
                                 {formatDate(post.date)} 
                               </span> 
                             </div> 
                           </div> 
                         </motion.div> 
                 )
               )}
              
               {/* LinkedIn Posts Station (Original) */}
               <div id="linkedin-posts-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'linkedin-post',
                 'LinkedIn Posts',
                 3,
                 (post: BlogPost, index: number, isLoading: boolean) => (
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
                     <h4 className="font-semibold text-lg mb-2 text-white overflow-auto max-h-[60px]"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                       {highlightText(post.title, activeSearchTerms)}
                     </h4>
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
                                 <button 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     
                             try {
                               // Pass the post index and station type to remember position
                               const stationType = 'linkedin-post';
                               const postIndex = index;
                               
                               // Parse multiple image URLs from media_link field
                               let imageUrls: string | string[] | undefined = undefined;
                               
                               // First try to get multiple images from media_link
                               if (post.media_link && typeof post.media_link === 'string' && post.media_link.includes(',')) {
                                 // Handle comma-separated URLs
                                 const links = post.media_link.split(',')
                                   .map(url => url.trim())
                                   .filter(url => url.length > 0 && url.startsWith('http'))
                                   .slice(0, 2); // Get up to 2 images
                                   
                                   if (links.length > 0) {
                                     imageUrls = links;
                                     // console.log('Using multiple image URLs:', links);
                                   }
                               } 
                               // If no multiple images, fallback to single image
                               else if (post.image && post.image !== '/images/oops_penguin.png') {
                                 imageUrls = post.image;
                                //  console.log('Using single image URL:', post.image);
                               }
                               
                               // Check if there's an embed_link to display
                               if (post.embed_link) {
                                     const embedHtml = post.embed_link as string;
                                     
                                     setModalContent({
                                       type: 'embed',
                                       title: post.title,
                                       content: embedHtml,
                                       link: post.link || post.url || '#',
                                   date: post.date,
                                   mediaLinks: imageUrls,
                                   postIndex,
                                   stationType
                                 });
                               } else {
                                 // For posts without embed_link
                                 setModalContent({
                                   type: 'no-embed',
                                   title: post.title,
                                   content: '',
                                   link: post.link || post.url || '#',
                                   date: post.date,
                                   mediaLinks: imageUrls,
                                   postIndex,
                                   stationType
                                 });
                               }
                                     setShowModal(true);
                             } catch (error) {
                               console.error('Error setting modal content:', error);
                             }
                                   }}
                                   className="w-7 h-7 bg-data/20 hover:bg-data/30 text-data rounded-full flex items-center justify-center transition-colors"
                                   aria-label="View in modal"
                                 >
                           <FaExpandAlt className="w-3 h-3" />
                                 </button>
                               <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                 )
               )}

               {/* Humorous Data Insights Station (previously Quick Notes) */}
               <div id="lol-hub-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'quick-note',
                 'LOL Hub',
                 3,
                 (post: BlogPost, index: number, isLoading: boolean) => (
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
                     <h4 className="font-semibold text-lg mb-2 text-white overflow-auto max-h-[60px]"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                       {highlightText(post.title, activeSearchTerms)}
                     </h4>
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
                                 <button 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     
                             try {
                               // Pass the post index and station type to remember position
                               const stationType = 'quick-note';
                               const postIndex = index;
                               
                               // Parse multiple image URLs from media_link field
                               let imageUrls: string | string[] | undefined = undefined;
                               
                               // First try to get multiple images from media_link
                               if (post.media_link && typeof post.media_link === 'string' && post.media_link.includes(',')) {
                                 // Handle comma-separated URLs
                                 const links = post.media_link.split(',')
                                   .map(url => url.trim())
                                   .filter(url => url.length > 0 && url.startsWith('http'))
                                   .slice(0, 2); // Get up to 2 images
                                   
                                   if (links.length > 0) {
                                     imageUrls = links;
                                     // console.log('Using multiple image URLs:', links);
                                   }
                               } 
                               // If no multiple images, fallback to single image
                               else if (post.image && post.image !== '/images/oops_penguin.png') {
                                 imageUrls = post.image;
                                //  console.log('Using single image URL:', post.image);
                               }
                               
                               // Check if there's an embed_link to display
                               if (post.embed_link) {
                                     const embedHtml = post.embed_link as string;
                                     
                                     setModalContent({
                                       type: 'embed',
                                       title: post.title,
                                       content: embedHtml,
                                       link: post.link || post.url || '#',
                                   date: post.date,
                                   mediaLinks: imageUrls,
                                   postIndex,
                                   stationType
                                 });
                               } else {
                                 // For posts without embed_link
                                 setModalContent({
                                   type: 'no-embed',
                                   title: post.title,
                                   content: '',
                                   link: post.link || post.url || '#',
                                   date: post.date,
                                   mediaLinks: imageUrls,
                                   postIndex,
                                   stationType
                                 });
                               }
                                     setShowModal(true);
                             } catch (error) {
                               console.error('Error setting modal content:', error);
                             }
                                   }}
                                   className="w-7 h-7 bg-data/20 hover:bg-data/30 text-data rounded-full flex items-center justify-center transition-colors"
                                   aria-label="View in modal"
                                 >
                           <FaExpandAlt className="w-3 h-3" />
                                 </button>
                               <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                 )
               )}
              
               {/* Technical Articles Station (previously Research Reports) */}
               <div id="linkedin-articles-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'research-report',
                 'LinkedIn Articles',
                 2,
                 (post: BlogPost, index: number, isLoading: boolean) => (
                         <motion.div 
                           key={post.id} 
                           initial={{ opacity: 0, y: 20 }} 
                           animate={{ opacity: 1, y: 0 }} 
                           transition={{ duration: 0.3, delay: index * 0.05 }}
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[410px] flex flex-col"
                         >
                           <div className="h-48 mb-4 overflow-hidden rounded-lg bg-dark-300/60 relative">
                             {post.image ? (
                               <Image 
                                 src={post.image} 
                                 alt={post.title} 
                           loading="lazy"
                                 width={600} 
                                 height={300}
                                 className="object-cover h-full w-full transition-transform hover:scale-105"
                           unoptimized={post.image.includes('substackcdn.com')}
                               />
                             ) : (
                               <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200">
                                 <FaMicroscope className="text-3xl text-gray-400" />
                               </div>
                             )}
                           </div>
                     <h4 className="font-semibold text-lg mb-2 text-white overflow-auto max-h-[60px]"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                       {highlightText(post.title, activeSearchTerms)}
                     </h4>
                     <p className="text-gray-300 text-sm mb-4 flex-grow overflow-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                             {highlightText(post.excerpt || '', activeSearchTerms)}
                           </p>
                           <div className="mt-auto">
                             <div className="flex justify-between items-center">
                               <a 
                                 href={post.link || post.url || '#'}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="py-1.5 px-4 bg-data/20 hover:bg-data/30 text-data rounded-md text-sm inline-flex items-center transition-colors"
                               >
                                 Read Article <FaChevronRight className="ml-1 w-3 h-3" />
                               </a>
                               <span className="text-s text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                 )
               )}
              
               {/* Substack Publications Station (previously Comprehensive Studies) */}
               <div id="substack-unpacked-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'comprehensive-study',
                 'Substack Unpacked',
                 1,
                 (post: BlogPost, index: number, isLoading: boolean) => {
                   // Enhanced debug logging
                  //  console.log(`[Substack Debug] Post ${post.id}:`);
                  //  console.log('- Image URL:', post.image);
                  //  console.log('- Media links:', post.media_link);
                  //  console.log('- Full post data:', post);
                   
                   return (
                                 <motion.div 
                                   key={post.id} 
                                   initial={{ opacity: 0, y: 20 }} 
                                   animate={{ opacity: 1, y: 0 }} 
                                   transition={{ duration: 0.3, delay: index * 0.05 }} 
                           className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[560px] flex flex-col"
                         >
                           <div className="h-80 mb-4 overflow-hidden rounded-lg bg-dark-300/60 relative">
                             {post.image ? (
                               <>
                                 {/* Version 1: Original img tag with improved error handling - now hidden */}
                                 <img 
                                   src={post.image}
                                   alt={post.title}
                                   className="w-full h-full object-cover"
                                   loading="lazy"
                                   crossOrigin="anonymous"
                                   onLoad={() => console.log(`[Image Success] Successfully loaded image: ${post.image}`)}
                                   onError={(e) => {
                                     console.error(`[Image Error] Failed to load image: ${post.image}`);
                                     console.error(e);
                                   }}
                                   style={{ display: 'none' }} // Hidden since it may fail due to CORS
                                 />
                                 
                                 {/* Version 2: Using a server-side proxy for Substack images */}
                                 {post.image && post.image.includes('substackcdn.com') ? (
                                   <>
                                     {/* Log detailed debugging info */}
                                     {process.env.NODE_ENV === 'development' && post.image && (
                                       <div style={{ display: 'none' }}>
                                         {/* Using comments instead of console.log to avoid linter errors */}
                                         {/* The logs will run but won't return a React node */}
                                         <span className="hidden">
                                           {(() => {
                                            //  console.log(`[SubstackImg] Original URL: ${post.image}`);
                                            //  console.log(`[SubstackImg] URL length: ${post.image.length}`);
                                            //  console.log(`[SubstackImg] Encoded length: ${encodeURIComponent(post.image).length}`);
                                            //  console.log(`[SubstackImg] Contains substack-post-media: ${post.image.includes('substack-post-media')}`);
                                             return null;
                                           })()}
                                         </span>
                                       </div>
                                     )}
                                     
                                     {/* Try the image proxy first */}
                                     {post.image.includes('substack-post-media.s3.amazonaws.com') ? (
                                       <img 
                                         src={`/api/image-proxy?url=${encodeURIComponent(post.image)}`}
                                         alt={post.title || "Blog post image"}
                                         className="w-full h-full object-cover"
                                         loading="lazy"
                                         onError={(e) => {
                                           if (post.image) {
                                            //  console.error(`[SubstackImg] Error loading: ${post.image.substring(0, 50)}...`);
                                             // Try direct loading as fallback
                                             const img = e.currentTarget;
                                             img.onerror = null; // Prevent infinite error loop
                                             img.src = post.image;
                                           }
                                         }}
                                       />
                                     ) : (
                                       // Fallback to template image for truncated URLs
                                       <img 
                                         src="/api/image-proxy?url=https%3A%2F%2Fsubstackcdn.com%2Fimage%2Ffetch%2Fw_1456%2Cc_limit%2Cf_webp%2Cq_auto%3Agood%2Cfl_progressive%3Asteep%2Fhttps%253A%252F%252Fsubstack-post-media.s3.amazonaws.com%252Fpublic%252Fimages%252Fb4ccc3ef-8f65-4eb5-a28f-0d3927c4b1f5_2691x954.png"
                                         alt={post.title || "Blog post image"}
                                         className="w-full h-full object-cover"
                                         loading="lazy"
                                       />
                                     )}
                                   </>
                                 ) : (
                                   <img 
                                     src={post.image}
                                     alt={post.title}
                                     className="w-full h-full object-cover"
                                     loading="lazy"
                                   />
                                 )}
                               </>
                             ) : (
                               <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200">
                                 <FaNewspaper className="text-4xl text-gray-400" />
                               </div>
                             )}
                           </div>
                     <h4 className="font-semibold text-xl mb-2 text-white overflow-auto max-h-[60px]"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                       {highlightText(post.title, activeSearchTerms)}
                     </h4>
                     <p className="text-gray-300 text-sm mb-4 flex-grow overflow-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}>
                             {highlightText(post.excerpt || '', activeSearchTerms)}
                           </p>
                           <div className="mt-auto">
                             <div className="flex justify-between items-center">
                               <a 
                                 href={post.link || post.url || '#'}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="py-2 px-5 bg-data/20 hover:bg-data/30 text-data rounded-md inline-flex items-center justify-center transition-colors"
                               >
                                 Read on Substack <FaExternalLinkAlt className="ml-2 w-3 h-3" />
                               </a>
                               <span className="text-s text-gray-400">{formatDate(post.date)}</span>
                             </div>
                           </div>
                         </motion.div> 
                   );
                 }
               )}

               {/* Medium Publications Station */}
               <div id="medium-insights-anchor" className="section-anchor"></div>
               {renderSwipeStation(
                 'medium-post',
                 'Medium Insights',
                 1,
                 (post: BlogPost, index: number, isLoading: boolean) => {
                   return (
                     <motion.div 
                       key={post.id} 
                       initial={{ opacity: 0, y: 20 }} 
                       animate={{ opacity: 1, y: 0 }} 
                       transition={{ duration: 0.3, delay: index * 0.05 }} 
                       className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-all p-4 h-[560px] flex flex-col"
                     >
                       <div className="h-80 mb-4 overflow-hidden rounded-lg bg-dark-300/60 relative">
                         {post.image ? (
                           <>
                             {/* Medium images are typically from miro.medium.com CDN */}
                             {post.image.includes('miro.medium.com') || post.image.includes('medium.com') ? (
                               <img 
                                 src={post.image}
                                 alt={post.title || "Medium post image"}
                                 className="w-full h-full object-contain bg-dark-300/60 transition-transform duration-300 hover:scale-105"
                                 loading="lazy"
                                 onError={(e) => {
                                   console.error(`[Medium Image] Error loading: ${post.image}`);
                                   // Show fallback on error
                                   const img = e.currentTarget;
                                   img.style.display = 'none';
                                   const fallback = img.parentElement?.querySelector('.medium-fallback') as HTMLElement;
                                   if (fallback) {
                                     fallback.style.display = 'flex';
                                   }
                                 }}
                               />
                             ) : (
                               <img 
                                 src={post.image}
                                 alt={post.title}
                                 className="w-full h-full object-contain bg-dark-300/60 transition-transform duration-300 hover:scale-105"
                                 loading="lazy"
                                 onError={(e) => {
                                   console.error(`[Medium Image] Error loading non-Medium image: ${post.image}`);
                                   const img = e.currentTarget;
                                   img.style.display = 'none';
                                   const fallback = img.parentElement?.querySelector('.medium-fallback') as HTMLElement;
                                   if (fallback) {
                                     fallback.style.display = 'flex';
                                   }
                                 }}
                               />
                             )}
                             
                             {/* Fallback for failed image loads */}
                             <div className="medium-fallback h-full w-full items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200 absolute inset-0" style={{ display: 'none' }}>
                               <svg className="text-4xl text-gray-400 w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                               </svg>
                             </div>
                           </>
                         ) : (
                           <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-dark-300 to-dark-200">
                             {/* Medium's signature icon */}
                             <svg className="text-4xl text-gray-400 w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                             </svg>
                           </div>
                         )}
                       </div>
                       <h4 className="font-semibold text-xl mb-2 text-white overflow-auto max-h-[60px]"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}>
                         {highlightText(post.title, activeSearchTerms)}
                       </h4>
                       <p className="text-gray-300 text-sm mb-4 flex-grow overflow-auto"
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}>
                         {highlightText(post.excerpt || '', activeSearchTerms)}
                       </p>
                       <div className="mt-auto">
                         <div className="flex justify-between items-center">
                           <a 
                             href={post.link || post.url || '#'}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="py-2 px-5 bg-data/20 hover:bg-data/30 text-data rounded-md inline-flex items-center justify-center transition-colors"
                           >
                             Read on Medium <FaExternalLinkAlt className="ml-2 w-3 h-3" />
                           </a>
                           <span className="text-s text-gray-400">{formatDate(post.date)}</span>
                         </div>
                       </div>
                     </motion.div> 
                   );
                 }
               )}

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
              <div className="mb-6"> <Image src="/images/oops_penguin.png" alt="No results" width={150} height={150} className="mx-auto" /> </div> 
              <h3 className="text-xl font-bold text-white mb-2">No Content Found</h3> 
              <p className="text-gray-400"> No posts match your current search criteria. Try adjusting your filters or search query. </p> 
              <button onClick={resetAllFilters} className="mt-4 px-4 py-2 bg-data hover:bg-data-dark text-dark-300 font-medium rounded-lg transition-colors" > 
                Reset Filters 
              </button>
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
              
              {modalContent?.type === 'no-embed' && (
                <div className="w-full flex flex-col items-center">
                  <div className="text-center mb-4 text-gray-300">
                    <p className="mb-4">LinkedIn hasn't quite figured out how to embed posts with multiple images yet...</p>
                    
                    {/* Display media if available using Next.js Image - just like in the article cards */}
                    {modalContent.mediaLinks ? (
                      <div className="mt-4 max-w-[504px] w-full mx-auto">
                        {/* Debug info - hidden in production */}
                        {/* {process.env.NODE_ENV === 'development' && (
                          <div className="mb-4 text-xs text-left bg-dark-300/50 p-2 rounded">
                            <p className="text-gray-400 mb-1">Debug info:</p>
                            <pre className="whitespace-pre-wrap break-words text-gray-500 text-[10px]">
                              {typeof modalContent.mediaLinks === 'string' 
                                ? modalContent.mediaLinks 
                                : JSON.stringify(modalContent.mediaLinks, null, 2)}
                            </pre>
                          </div>
                        )} */}
                        
                        {Array.isArray(modalContent.mediaLinks) ? (
                          <div className={`grid ${modalContent.mediaLinks.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-4 mx-auto`}>
                            {modalContent.mediaLinks.slice(0, 2).map((mediaUrl, idx) => (
                              <div key={idx} className="overflow-hidden rounded-lg border border-data/20">
                                <div className="h-[200px] relative bg-dark-300/50">
                                  <Image 
                                    src={mediaUrl}
                                    alt={`Media ${idx + 1} for ${modalContent.title}`}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-contain"
                                    // Important: This allows external URLs
                                    unoptimized={true}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-data/20 mx-auto">
                            <div className="h-[300px] relative bg-dark-300/50">
                              <Image 
                                src={modalContent.mediaLinks}
                                alt={`Media for ${modalContent.title}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 600px"
                                className="object-contain"
                                // Important: This allows external URLs
                                unoptimized={true}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No media available for this post</p>
                    )}
                  </div>
                  
                  <div className="flex justify-center mt-4">
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
      {scrollToTopButton}
      
      {/* Card Info Modal */}
      {showCardInfoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowCardInfoModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-dark-200 border border-data/30 rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-700 flex justify-center items-center">
              <h3 className="text-xl font-semibold text-white flex items-center">
                AI-Enhanced Content Note
              </h3>
            </div>
            <div className="p-2 text-gray-300 space-y-2">
              <p>
                This research station leverages AI to enhance content discovery and organization. The content titles and descriptions are AI-assisted.
              </p>
            </div>
            <div className="p-2 bg-dark-300/50 flex justify-center">
              <button
                onClick={() => setShowCardInfoModal(false)}
                className="px-2 py-2 bg-data/20 hover:bg-data/30 text-data rounded-md transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default BlogClientContent; // Export the client component 