import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { BlogPost } from '../../types/blog';
import dynamic from 'next/dynamic';

// Prefetch limit defines how many posts ahead/behind to prefetch
const PREFETCH_LIMIT = 3;

interface SwipeStationProps {
  title: string;
  posts: BlogPost[];
  renderCard: (post: BlogPost, index: number) => React.ReactNode;
  visibleCards: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
  onLastSlideReached?: () => void;
  totalPostCount?: number;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const SwipeStation: React.FC<SwipeStationProps> = ({
  title,
  posts,
  renderCard,
  visibleCards,
  autoplay = false,
  autoplayInterval = 5000,
  className = '',
  onLastSlideReached,
  totalPostCount,
  currentIndex: controlledIndex,
  onIndexChange
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  // Use controlled index if provided, otherwise use internal state
  const currentIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  
  const [animating, setAnimating] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const totalItems = totalPostCount !== undefined ? totalPostCount : posts.length;
  
  // Track prefetched images to avoid duplicate prefetching
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());
  
  // Handle responsive behavior
  const [responsiveVisibleCards, setResponsiveVisibleCards] = useState(visibleCards);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Correct maxIndex calculation depends on responsiveVisibleCards and totalItems
  const [maxIndex, setMaxIndex] = useState(0);

  useEffect(() => {
    // If we have same or fewer posts than visible cards, still allow at least 1 maxIndex
    // to enable arrow navigation (useful for peeking at end of content)
    if (totalItems <= responsiveVisibleCards) {
      setMaxIndex(Math.max(0, totalItems - Math.max(1, Math.floor(responsiveVisibleCards * 0.7))));
    } else {
    setMaxIndex(Math.max(0, totalItems - responsiveVisibleCards));
    }
  }, [totalItems, responsiveVisibleCards]);

  // Update container width on resize or when container ref updates
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Create a ResizeObserver to detect container size changes
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(containerRef.current);
      
      return () => {
        window.removeEventListener('resize', updateWidth);
        resizeObserver.disconnect();
      };
    }
    
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // Mobile
        setResponsiveVisibleCards(1);
        setIsMobile(true);
      } else if (width < 1024) { // Tablet
        setResponsiveVisibleCards(Math.max(1, visibleCards - 1));
        setIsMobile(false);
      } else { // Desktop
        setResponsiveVisibleCards(visibleCards);
        setIsMobile(false);
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleCards]);

  // Simplified Autoplay Effect
  useEffect(() => {
    // Pause autoplay if hovering or dragging
    if (!autoplay || hovering || isDragging) return;
    
    const interval = setInterval(() => {
      setInternalIndex(prev => {
        const nextIndex = prev + 1;
        // Loop back to start if we exceed maxIndex based on visible cards
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, autoplayInterval);
    
    return () => clearInterval(interval);
  }, [autoplay, currentIndex, hovering, isDragging, maxIndex, autoplayInterval]); // Added isDragging dependency

  // Update the setCurrentIndex calls to properly handle both controlled and uncontrolled mode
  const updateCurrentIndex = (newIndex: number) => {
    // Set animating to true to show transition cards
    setAnimating(true);
    
    // Update the index
    setInternalIndex(newIndex);
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
    
    // Reset animating flag after animation completes
    setTimeout(() => {
      setAnimating(false);
    }, 300); // Match this with animation duration
  }
  
  // Reset index and update width when posts change, but only if not controlled externally
  useEffect(() => {
    // Only reset if we're not controlled and there's no specific index provided
    if (controlledIndex === undefined) {
      setInternalIndex(0);
    }
    
    // Ensure container width is updated AFTER the posts have likely rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }, 50); // Small delay for DOM update

    return () => clearTimeout(timer);
  }, [posts, controlledIndex]);

  // Additional effect to sync internal state with controlled value
  useEffect(() => {
    if (controlledIndex !== undefined && controlledIndex !== internalIndex) {
      setInternalIndex(controlledIndex);
    }
  }, [controlledIndex]);

  // Recalculate container width specifically on mobile state change
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.clientWidth);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // Prefetch images of adjacent posts
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const imagesToPrefetch: string[] = [];
    
    // Calculate range of posts to prefetch (current + next few + previous few)
    const startIdx = Math.max(0, currentIndex - PREFETCH_LIMIT);
    const endIdx = Math.min(posts.length - 1, currentIndex + PREFETCH_LIMIT);
    
    for (let i = startIdx; i <= endIdx; i++) {
      const post = posts[i];
      if (post.image && !prefetchedImages.has(post.image)) {
        imagesToPrefetch.push(post.image);
      }
    }
    
    // Prefetch images that haven't been prefetched yet
    imagesToPrefetch.forEach(imageUrl => {
      if (!prefetchedImages.has(imageUrl)) {
        const img = new Image();
        img.src = imageUrl;
        // Once the image is loaded, add to our prefetched set
        img.onload = () => {
          setPrefetchedImages(prev => {
            const newSet = new Set(prev);
            newSet.add(imageUrl);
            return newSet;
          });
        };
      }
    });
  }, [currentIndex, posts, prefetchedImages]);

  // Modify handleNext to use updateCurrentIndex
  const handleNext = () => {
    if (currentIndex < maxIndex) {
      const newIndex = Math.min(currentIndex + 1, maxIndex);
      updateCurrentIndex(newIndex);
      
      // If we're at or beyond the last post minus 2, trigger load more
      if (newIndex >= posts.length - responsiveVisibleCards && onLastSlideReached) {
        onLastSlideReached();
      }
    }
  };

  // Add effect to properly constrain maxIndex based on available cards
  useEffect(() => {
    if (totalItems <= responsiveVisibleCards) {
      // If we have fewer cards than visible cards, don't allow scrolling
      setMaxIndex(0);
    } else {
      // Otherwise, set max index to show the last card at the rightmost position
      setMaxIndex(Math.max(0, totalItems - responsiveVisibleCards));
    }
    
    // If current index is beyond max, adjust it
    if (currentIndex > maxIndex) {
      updateCurrentIndex(maxIndex);
    }
  }, [totalItems, responsiveVisibleCards, maxIndex]);

  // Modify handlePrev to use updateCurrentIndex
  const handlePrev = () => {
    if (currentIndex > 0) {
      updateCurrentIndex(currentIndex - 1);
    }
  };

  // Calculate the width of a single card including its gap
  const contentPadding = isMobile ? 56 : 128; // Increase mobile padding from 32px to 56px (28px on each side)
  const availableWidth = containerWidth - contentPadding;
  const gapSize = 16; // gap-4 = 16px
  const totalGapWidth = (responsiveVisibleCards - 1) * gapSize;
  const singleCardWidth = availableWidth 
    ? (availableWidth - totalGapWidth) / responsiveVisibleCards 
    : 0;

  // Calculate the total width of all cards + gaps
  const totalContentWidth = (singleCardWidth * totalItems) + (gapSize * (totalItems - 1));
  
  // Calculate the exact position to translate to
  const translateX = singleCardWidth 
    ? (currentIndex * (singleCardWidth + gapSize)) 
    : 0;
    
  // Drag handler functions - Simplified
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Check if the event came from a scrollable element
    if (event.target instanceof Element) {
      const scrollableParent = findScrollableParent(event.target);
      // If the event target has a scrollable parent that's not the main swipe container,
      // prevent drag from starting
      if (scrollableParent && 
          scrollableParent !== containerRef.current && 
          !scrollableParent.contains(containerRef.current)) {
        return;
      }
    }
    
    setIsDragging(true);
  };
  
  // Helper function to find scrollable parent
  const findScrollableParent = (element: Element): Element | null => {
    if (!element || element === document.body) return null;
    
    const style = window.getComputedStyle(element);
    const overflowX = style.getPropertyValue('overflow-x');
    const overflowY = style.getPropertyValue('overflow-y');
    
    if (overflowX === 'auto' || overflowX === 'scroll' || 
        overflowY === 'auto' || overflowY === 'scroll') {
      return element;
    }
    
    return element.parentElement ? findScrollableParent(element.parentElement) : null;
  };

  // Modify handleDragEnd to also check if we should process the drag
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If we weren't dragging (due to interaction with a scrollable element), just exit
    if (!isDragging) return;
    
    setIsDragging(false);

    const cardAndGapWidth = singleCardWidth + gapSize;
    if (!cardAndGapWidth) return; // Avoid division by zero

    // Current position when drag ended (relative to the start of the drag)
    const offset = info.offset.x;
    // Estimate velocity influence - adjust target slightly based on flick
    const velocity = info.velocity.x;
    const velocityFactor = 0.1; // Adjust sensitivity to velocity
    const projectedOffset = offset + velocity * velocityFactor;

    // Add a minimum drag threshold (20% of card width)
    const dragThreshold = cardAndGapWidth * 0.2;
    
    // If the drag was very small and slow, snap back to the current position
    if (Math.abs(projectedOffset) < dragThreshold && Math.abs(velocity) < 300) {
      // Just return to current index - no change
      updateCurrentIndex(currentIndex);
      return;
    }

    // Calculate the fractional index based on the projected final position
    const targetFractionalIndex = currentIndex - (projectedOffset / cardAndGapWidth);

    // Round to the nearest whole index
    const nearestIndex = Math.round(targetFractionalIndex);

    // Clamp the index within valid bounds [0, maxIndex]
    const finalIndex = Math.max(0, Math.min(nearestIndex, maxIndex));

    // Set the state to trigger the animation to the final index
    updateCurrentIndex(finalIndex);
  };

  // Calculate drag constraints
  const dragConstraints = {
    // Prevent dragging beyond the last card
    left: currentIndex >= maxIndex ? -translateX : -totalContentWidth,
    right: currentIndex <= 0 ? 0 : totalContentWidth
  };

  // Calculate which cards should be visible based on dragging
  const getCardVisibility = (index: number) => {
    // If we have fewer or equal posts than visibleCards, show all of them
    if (posts.length <= responsiveVisibleCards) {
      return true;
    }
    
    // Special handling for end of collection to ensure all cards are visible
    if (currentIndex >= maxIndex) {
      // When at the last position, show the last batch of cards
      return index >= totalItems - responsiveVisibleCards && index < totalItems;
    }
    
    // When dragging, extend the visible range to show additional cards
    // This prevents empty space during drag operations
    if (isDragging) {
      // Show cards in an extended window (current + next + previous)
      const extendedRange = 3; // Increased from 2 to 3 for smoother transitions
      return index >= currentIndex - extendedRange && 
             index < currentIndex + responsiveVisibleCards + extendedRange &&
             index < totalItems; // Don't go beyond total items
    }
    
    // Otherwise, show the current window of posts plus one extra on each side to prevent empty space
    return (index >= currentIndex - 1 && index < currentIndex + responsiveVisibleCards + 1) && 
           index < totalItems;
  };

  // Determine card appearance state (fully visible, partially visible placeholder, or hidden)
  const getCardAppearance = (index: number) => {
    // Always fully show cards in the main visible window
    if (index >= currentIndex && index < currentIndex + responsiveVisibleCards) {
      return 'visible';
    }
    
    // During dragging or right after (transition phase), show placeholders for cards just outside the visible window
    if (isDragging || animating) {
      const extendedRange = 3; // Match the value in getCardVisibility
      if ((index >= currentIndex - extendedRange && index < currentIndex) || 
          (index >= currentIndex + responsiveVisibleCards && index < currentIndex + responsiveVisibleCards + extendedRange) &&
           index < totalItems) {
        return 'placeholder';
      }
    } else {
      // When not dragging, still show adjacent cards as placeholders for smoother transitions
      if ((index === currentIndex - 1) || (index === currentIndex + responsiveVisibleCards) && index < totalItems) {
        return 'placeholder';
      }
    }
    
    // Otherwise hide the card
    return 'hidden';
  };

  // Calculate the rightmost visible card for pagination display
  const getRightmostVisibleCard = () => {
    return Math.min(currentIndex + responsiveVisibleCards, totalItems);
  };

  // Mobile card container style adjustment function
  const getCardInnerStyles = () => {
    if (isMobile) {
      return {
        paddingLeft: '4px',  // Add slight padding on the left side of card content on mobile
        paddingRight: '4px', // Add slight padding on the right side of card content on mobile
      };
    }
    return {};
  };

  return (
    <section className={`relative w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        
        {/* Only show pagination on top for desktop */}
        {!isMobile && totalItems > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-dark-300/40 backdrop-blur-sm border border-data/10">
            <span className="text-xs font-medium text-data">
              {getRightmostVisibleCard()}/{totalItems}
            </span>
          </div>
        )}
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Left Arrow - Only show on larger displays */}
        {!isMobile && (
        <AnimatePresence>
          {currentIndex > 0 && !isDragging && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={handlePrev}
                className="absolute left-0 top-[calc(50%-28px)] -translate-y-1/2 z-20 w-10 h-10 bg-dark-300/80 hover:bg-data/40 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              aria-label="View previous items"
              disabled={currentIndex === 0}
            >
                <FaChevronLeft size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        )}

        {/* Cards Container */}
        <div
          ref={containerRef}
          className={`overflow-hidden ${isMobile ? 'px-7' : 'px-16'}`}
        >
          <motion.div 
            className="flex gap-4 pb-4 cursor-grab active:cursor-grabbing relative"
            drag="x" // Always allow dragging on x-axis
            dragConstraints={{ left: -totalContentWidth + availableWidth, right: 0 }} // Set stricter constraints
            dragElastic={0.15} // Adjust elasticity
            dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }} // Adjust bounce
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{ x: -translateX }}
            transition={{ 
              type: "spring",
              stiffness: 350, // Slightly adjusted stiffness/damping
              damping: 35,
              restDelta: 0.001, // More precise resting point
              restSpeed: 0.001, // Slower rest speed for smoother ending
            }}
            style={{ width: totalContentWidth }} // Explicitly set width for constraints
          >
            {/* Add non-scrollable edges for swiping */}
            <div 
              className="absolute inset-y-0 left-0 w-[20%] cursor-grab active:cursor-grabbing z-0" 
              aria-hidden="true"
            />
            <div 
              className="absolute inset-y-0 right-0 w-[20%] cursor-grab active:cursor-grabbing z-0" 
              aria-hidden="true"
            />
            
            {posts.map((post, index) => {
              // Debug logging in development
              if (process.env.NODE_ENV === 'development' && index >= posts.length - 3) {
                // console.log(`Card ${index} (${post.id}): currentIndex=${currentIndex}, visible=${getCardVisibility(index)}`);
              }
              
              const isVisible = getCardVisibility(index);
              const appearance = getCardAppearance(index);
              
              return (
                <div
                  key={post.id}
                  className="relative flex-none transition-all duration-300" // Use transition-all for smoother effects
                  style={{
                    width: singleCardWidth > 0 ? `${singleCardWidth}px` : '100%',
                    opacity: appearance === 'hidden' ? 0 : appearance === 'placeholder' ? 0.4 : 1,
                    filter: appearance === 'placeholder' ? 'blur(2px)' : 'none',
                    transform: appearance === 'placeholder' ? 'scale(0.98)' : 'scale(1)',
                    pointerEvents: appearance === 'visible' ? 'auto' : 'none', // Only allow interaction with fully visible cards
                    userSelect: 'none', // Prevent text selection
                    ...getCardInnerStyles()
                  }}
                >
                  {/* Always render the content, but control visibility and interaction with CSS */}
                  <div>
                     {renderCard(post, index)}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Arrow - Only show on larger displays */}
        {!isMobile && (
        <AnimatePresence>
          {currentIndex < maxIndex && !isDragging && posts.length > responsiveVisibleCards && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={handleNext}
                className="absolute right-0 top-[calc(50%-28px)] -translate-y-1/2 z-20 w-10 h-10 bg-dark-300/80 hover:bg-data/40 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              aria-label="View next items"
              disabled={currentIndex >= maxIndex}
            >
                <FaChevronRight size={16} />
            </motion.button>
          )}
        </AnimatePresence>
        )}

        {/* Progress Indicators - Bottom center on mobile, hidden on desktop */}
        {isMobile ? (
          <div className="flex justify-center items-center mt-4 space-x-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="w-8 h-8 bg-dark-300/60 hover:bg-data/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Previous slides"
              >
                <FaChevronLeft size={14} />
              </button>
            )}
            
            <div className="px-2 py-0.5 rounded-full bg-dark-300/40 backdrop-blur-sm border border-data/10">
              <span className="text-xs font-medium text-data">
                {getRightmostVisibleCard()}/{totalItems}
              </span>
            </div>
            
            {currentIndex < maxIndex && currentIndex + responsiveVisibleCards < totalItems && (
              <button
                onClick={handleNext}
                className="w-8 h-8 bg-dark-300/60 hover:bg-data/30 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Next slides"
              >
                <FaChevronRight size={14} />
              </button>
            )}
          </div>
        ) : (
          // Only show pagination dots if we have more than one page of content
          totalItems > responsiveVisibleCards && (
        <div className="flex justify-center mt-4 gap-1.5">
          {Array.from({ length: Math.ceil(totalItems / responsiveVisibleCards) }).map((_, i) => (
            <button
              key={i}
                  onClick={() => updateCurrentIndex(Math.min(i * responsiveVisibleCards, maxIndex))}
              className={`w-2 h-2 rounded-full transition-all ${
                i === Math.floor(currentIndex / responsiveVisibleCards)
                  ? 'bg-data w-4'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide group ${i + 1}`}
            />
          ))}
        </div>
          )
        )}
      </div>
    </section>
  );
};

export default SwipeStation; 