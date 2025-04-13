import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
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
    if (!autoplay || hovering) return;
    
    const interval = setInterval(() => {
      if (currentIndex < maxIndex) {
        handleNext();
      } else {
        setCurrentIndex(0);
      }
    }, autoplayInterval);
    
    return () => clearInterval(interval);
  }, [autoplay, currentIndex, hovering, maxIndex, autoplayInterval]);

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

  // Touch swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  // Calculate the width of a single card including its gap
  const contentPadding = isMobile ? 32 : 128; // 16px * 2 (left+right) or 64px * 2
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

  return (
    <div className={`mb-12 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-data mr-3"></div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        {...handlers}
      >
        {/* Left Arrow */}
        <AnimatePresence>
          {currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-dark-300/80 hover:bg-data/40 flex items-center justify-center text-white transition-colors shadow-lg"
              aria-label="View previous items"
              disabled={currentIndex === 0}
            >
              <FaChevronLeft size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Cards Container */}
        <div
          ref={containerRef}
          className={`overflow-hidden ${isMobile ? 'px-4' : 'px-16'}`}
        >
          <motion.div 
            className="flex gap-4 pb-4"
            initial={false}
            animate={{ 
              x: -translateX 
            }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="relative flex-none transition-opacity duration-300"
                style={{
                  width: singleCardWidth > 0 ? `${singleCardWidth}px` : '100%',
                  opacity: 
                    (index < currentIndex || index >= currentIndex + responsiveVisibleCards) 
                      ? 0.3 : 1,
                  pointerEvents: 
                    (index < currentIndex || index >= currentIndex + responsiveVisibleCards)
                      ? 'none' : 'auto'
                }}
              >
                {renderCard(post, index)}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {currentIndex < maxIndex && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-dark-300/80 hover:bg-data/40 flex items-center justify-center text-white transition-colors shadow-lg"
              aria-label="View next items"
              disabled={currentIndex >= maxIndex}
            >
              <FaChevronRight size={16} />
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