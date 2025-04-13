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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // Mobile
        setResponsiveVisibleCards(1);
      } else if (window.innerWidth < 1024) { // Tablet
        setResponsiveVisibleCards(Math.max(1, visibleCards - 1));
      } else { // Desktop
        setResponsiveVisibleCards(visibleCards);
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

  // Get visible posts with consideration for responsive behavior
  const visiblePosts = posts.slice(
    currentIndex,
    currentIndex + responsiveVisibleCards
  );

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
          className="overflow-hidden px-16"
        >
          <motion.div 
            className={`flex gap-4 pb-4`}
            initial={false}
            animate={{ 
              x: `calc(-${currentIndex * 100}% / ${responsiveVisibleCards})`
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
                className={`relative flex-none transform transition-opacity duration-300`}
                style={{
                  width: `calc((100% - ${(responsiveVisibleCards-1) * 16}px) / ${responsiveVisibleCards})`,
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
              onClick={() => setCurrentIndex(i * responsiveVisibleCards)}
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