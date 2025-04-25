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
}

const SwipeStation: React.FC<SwipeStationProps> = ({
  title,
  posts,
  renderCard,
  visibleCards,
  autoplay = false,
  autoplayInterval = 5000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const totalItems = posts.length;
  
  // Track prefetched images to avoid duplicate prefetching
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());
  
  // Handle responsive behavior
  const [responsiveVisibleCards, setResponsiveVisibleCards] = useState(visibleCards);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Correct maxIndex calculation depends on responsiveVisibleCards and totalItems
  const [maxIndex, setMaxIndex] = useState(0);

  useEffect(() => {
    setMaxIndex(Math.max(0, totalItems - responsiveVisibleCards));
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
      setCurrentIndex(prev => {
        const nextIndex = prev + 1;
        // Loop back to start if we exceed maxIndex based on visible cards
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, autoplayInterval);
    
    return () => clearInterval(interval);
  }, [autoplay, currentIndex, hovering, isDragging, maxIndex, autoplayInterval]); // Added isDragging dependency

  // Reset index and update width when posts change
  useEffect(() => {
    setCurrentIndex(0);
    
    // Ensure container width is updated AFTER the posts have likely rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    }, 50); // Small delay for DOM update

    return () => clearTimeout(timer);
  }, [posts]); // Trigger only when the posts array itself changes

  // Adjust currentIndex if it becomes invalid after filtering or resize
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

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

  // Simplified handlePrev/handleNext - directly set index
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
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
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Unified Drag End Handler
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const cardAndGapWidth = singleCardWidth + gapSize;
    if (!cardAndGapWidth) return; // Avoid division by zero

    // Current position when drag ended (relative to the start of the drag)
    const offset = info.offset.x;
    // Estimate velocity influence - adjust target slightly based on flick
    const velocity = info.velocity.x;
    const velocityFactor = 0.1; // Adjust sensitivity to velocity
    const projectedOffset = offset + velocity * velocityFactor;

    // Calculate the fractional index based on the projected final position
    // targetX = -currentTranslateX + projectedOffset 
    // targetFractionalIndex = -targetX / cardAndGapWidth 
    // targetFractionalIndex = (currentTranslateX - projectedOffset) / cardAndGapWidth
    // targetFractionalIndex = (currentIndex * cardAndGapWidth - projectedOffset) / cardAndGapWidth
    const targetFractionalIndex = currentIndex - (projectedOffset / cardAndGapWidth);

    // Round to the nearest whole index
    const nearestIndex = Math.round(targetFractionalIndex);

    // Clamp the index within valid bounds [0, maxIndex]
    const finalIndex = Math.max(0, Math.min(nearestIndex, maxIndex));

    // Set the state to trigger the animation to the final index
    setCurrentIndex(finalIndex);
  };

  // Calculate drag constraints
  const dragConstraints = {
    // Prevent dragging beyond the last card
    left: currentIndex >= maxIndex ? -translateX : -totalContentWidth,
    right: currentIndex <= 0 ? 0 : totalContentWidth
  };

  // Calculate which cards should be visible based on dragging
  const getCardVisibility = (index: number) => {
    if (posts.length > 0 && posts.length <= responsiveVisibleCards) {
      return index < responsiveVisibleCards;
    }
    return index >= currentIndex && index < currentIndex + responsiveVisibleCards;
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
        <div className="flex items-center space-x-3">
          {/* Show pagination indicator if there are posts */}
          {totalItems > 0 && (
            <div className="px-2 py-0.5 rounded-full bg-dark-300/40 backdrop-blur-sm border border-data/10">
              <span className="text-xs font-medium text-data">
                {getRightmostVisibleCard()}/{totalItems}
              </span>
            </div>
          )}
          
          {/* Hide navigation buttons on mobile */}
          {!isMobile && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  currentIndex === 0 ? 'bg-dark-300/40 text-gray-500 cursor-not-allowed' : 'bg-dark-300/40 hover:bg-data/20 text-gray-300 hover:text-data'
                }`}
                aria-label="Previous slides"
              >
                <FaChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  currentIndex >= maxIndex ? 'bg-dark-300/40 text-gray-500 cursor-not-allowed' : 'bg-dark-300/40 hover:bg-data/20 text-gray-300 hover:text-data'
                }`}
                aria-label="Next slides"
              >
                <FaChevronRight className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Left Arrow */}
        <AnimatePresence>
          {currentIndex > 0 && !isDragging && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={handlePrev}
              className={`absolute left-0 top-[calc(50%-28px)] -translate-y-1/2 z-20 ${
                isMobile ? 'w-8 h-8 bg-dark-300/90' : 'w-10 h-10 bg-dark-300/80'
              } hover:bg-data/40 rounded-full flex items-center justify-center text-white transition-colors shadow-lg`}
              aria-label="View previous items"
              disabled={currentIndex === 0}
            >
              <FaChevronLeft size={isMobile ? 14 : 16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Cards Container */}
        <div
          ref={containerRef}
          className={`overflow-hidden ${isMobile ? 'px-7' : 'px-16'}`}
        >
          <motion.div 
            className="flex gap-4 pb-4 cursor-grab active:cursor-grabbing"
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
            }}
            style={{ width: totalContentWidth }} // Explicitly set width for constraints
          >
            {posts.map((post, index) => {
              const isVisible = getCardVisibility(index);
              
              return (
                <div
                  key={post.id}
                  className="relative flex-none transition-opacity duration-300" // Use opacity transition
                  style={{
                    width: singleCardWidth > 0 ? `${singleCardWidth}px` : '100%',
                    opacity: isVisible ? 1 : 0.4, // Adjust non-visible opacity
                    pointerEvents: 'none', // Let drag happen on parent
                    userSelect: 'none', // Prevent text selection
                    ...getCardInnerStyles()
                  }}
                >
                  {/* Ensure content inside is interactive if needed */} 
                  <div style={{ pointerEvents: 'auto' }}>
                     {renderCard(post, index)}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {currentIndex < maxIndex && !isDragging && posts.length > responsiveVisibleCards && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={handleNext}
              className={`absolute right-0 top-[calc(50%-28px)] -translate-y-1/2 z-20 ${
                isMobile ? 'w-8 h-8 bg-dark-300/90' : 'w-10 h-10 bg-dark-300/80'
              } hover:bg-data/40 rounded-full flex items-center justify-center text-white transition-colors shadow-lg`}
              aria-label="View next items"
              disabled={currentIndex >= maxIndex}
            >
              <FaChevronRight size={isMobile ? 14 : 16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Progress Indicators - hide on mobile */}
        {!isMobile && (
          <div className="flex justify-center mt-4 gap-1.5">
            {Array.from({ length: Math.ceil(totalItems / responsiveVisibleCards) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(Math.min(i * responsiveVisibleCards, maxIndex))}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === Math.floor(currentIndex / responsiveVisibleCards)
                    ? 'bg-data w-4'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide group ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SwipeStation; 