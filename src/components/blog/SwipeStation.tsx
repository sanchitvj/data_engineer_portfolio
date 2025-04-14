import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { BlogPost } from '../../types/blog';

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
  const [dragOffset, setDragOffset] = useState(0);
  const [dragCards, setDragCards] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const totalItems = posts.length;
  const maxIndex = Math.max(0, totalItems - visibleCards);

  // Handle responsive behavior
  const [responsiveVisibleCards, setResponsiveVisibleCards] = useState(visibleCards);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

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

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay || hovering || isDragging) return;
    
    const interval = setInterval(() => {
      if (currentIndex < maxIndex) {
        handleNext();
      } else {
        setCurrentIndex(0);
      }
    }, autoplayInterval);
    
    return () => clearInterval(interval);
  }, [autoplay, currentIndex, hovering, isDragging, maxIndex, autoplayInterval]);

  // Reset the currentIndex when posts array changes (filtering happens)
  useEffect(() => {
    setCurrentIndex(0);
  }, [posts]);

  const handlePrev = () => {
    if (currentIndex > 0 && !animating) {
      setAnimating(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setAnimating(false), 500); // Match animation duration
    }
  };

  const handleNext = () => {
    if (currentIndex < maxIndex && !animating) {
      setAnimating(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setAnimating(false), 500); // Match animation duration
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
  
  // Calculate the exact position to translate to, keeping cards centered
  const translateX = singleCardWidth 
    ? (currentIndex * (singleCardWidth + gapSize)) 
    : 0;
    
  // Handle drag updates to provide live feedback
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const cardAndGapWidth = singleCardWidth + gapSize;
    const dragDistance = Math.abs(info.offset.x);
    
    // Calculate how many cards would be moved
    const potentialCardsMoved = Math.min(
      Math.max(1, Math.floor(dragDistance / cardAndGapWidth)),
      responsiveVisibleCards * 2
    );
    
    setDragOffset(info.offset.x);
    setDragCards(potentialCardsMoved);
  };

  // Drag handler functions
  const handleDragStart = () => {
    setIsDragging(true);
    setDragOffset(0);
    setDragCards(0);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // Calculate the card + gap width
    const cardAndGapWidth = singleCardWidth + gapSize;
    
    // Calculate how many cards to move based on drag distance
    const dragDistance = Math.abs(info.offset.x);
    const velocity = Math.abs(info.velocity.x);
    
    // Determine if we should change the index at all
    if (dragDistance > cardAndGapWidth / 3 || velocity > 500) {
      // Calculate how many cards to move
      const cardsMoved = Math.min(
        Math.max(1, Math.floor(dragDistance / cardAndGapWidth)),
        responsiveVisibleCards * 2 // Limit to prevent excessive jumps
      );
      
      if (info.offset.x > 0 && currentIndex > 0) {
        // Dragged right -> go to previous cards
        const newIndex = Math.max(0, currentIndex - cardsMoved);
        setCurrentIndex(newIndex);
      } else if (info.offset.x < 0 && currentIndex < maxIndex) {
        // Dragged left -> go to next cards
        const newIndex = Math.min(maxIndex, currentIndex + cardsMoved);
        setCurrentIndex(newIndex);
      }
    }
    
    // Reset drag state
    setDragOffset(0);
    setDragCards(0);
  };

  // Calculate drag constraints
  const dragConstraints = {
    left: -totalContentWidth,
    right: 0
  };

  // Touch swipe handlers (for devices that don't support drag properly)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isDragging && currentIndex < maxIndex) handleNext();
    },
    onSwipedRight: () => {
      if (!isDragging && currentIndex > 0) handlePrev();
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true
  });

  // Calculate which cards should be visible based on dragging
  const getCardVisibility = (index: number) => {
    // Default visibility based on current index
    const isVisible = index >= currentIndex && index < currentIndex + responsiveVisibleCards;
    
    // If dragging, adjust visibility based on drag direction and distance
    if (isDragging && dragCards > 0) {
      if (dragOffset > 0) { // Dragging right (showing previous)
        return index >= currentIndex - dragCards && index < currentIndex + responsiveVisibleCards - dragCards;
      } else if (dragOffset < 0) { // Dragging left (showing next)
        return index >= currentIndex + dragCards && index < currentIndex + responsiveVisibleCards + dragCards;
      }
    }
    
    return isVisible;
  };

  // Calculate the rightmost visible card for pagination display
  const getRightmostVisibleCard = () => {
    if (isDragging && dragCards > 0) {
      if (dragOffset > 0) { // Dragging right (showing previous)
        return Math.max(1, Math.min(currentIndex + responsiveVisibleCards - dragCards, totalItems));
      } else if (dragOffset < 0) { // Dragging left (showing next)
        return Math.min(currentIndex + responsiveVisibleCards + dragCards, totalItems);
      }
    }
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
    <div className={`mb-12 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-data mr-3"></div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <motion.div 
          className="ml-auto px-2 py-0.5 rounded-full bg-dark-300/40 backdrop-blur-sm border border-data/10"
          animate={{ 
            scale: isDragging ? 1.05 : 1 
          }}
        >
          <span className="text-xs font-medium text-data">
            {getRightmostVisibleCard()}/{totalItems}
          </span>
        </motion.div>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        {...swipeHandlers}
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
            drag={!animating ? "x" : false}
            dragConstraints={dragConstraints}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{ 
              x: -translateX 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
          >
            {posts.map((post, index) => {
              const isVisibleWithDrag = getCardVisibility(index);
              
              return (
                <div
                  key={post.id}
                  className="relative flex-none transition-all duration-300"
                  style={{
                    width: singleCardWidth > 0 ? `${singleCardWidth}px` : '100%',
                    opacity: isVisibleWithDrag ? 1 : 0.3,
                    pointerEvents: isVisibleWithDrag ? 'auto' : 'none',
                    transform: isDragging ? `scale(${isVisibleWithDrag ? 1 : 0.95})` : 'scale(1)',
                    ...getCardInnerStyles()
                  }}
                >
                  {renderCard(post, index)}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {currentIndex < maxIndex && !isDragging && (
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

        {/* Progress Indicators */}
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
      </div>
    </div>
  );
};

export default SwipeStation; 