'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Section {
  id: string;
  label: string;
}

interface VerticalNavigatorProps {
  sections: Section[];
  page: 'home' | 'resume' | 'archive';
}

const VerticalNavigator: React.FC<VerticalNavigatorProps> = ({ sections, page }) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [indicatorPosition, setIndicatorPosition] = useState(0);
  const [debugMode] = useState(process.env.NODE_ENV === 'development');
  const [sliderHeight, setSliderHeight] = useState(0);
  const [sliderTop, setSliderTop] = useState('20vh');
  const [nodeSpacing, setNodeSpacing] = useState(0);
  const attemptedScrollsRef = useRef<Set<string>>(new Set());
  const isInitialMount = useRef(true);
  const pageRef = useRef(page);
  const pageReady = useRef(false);
  const visibilityTimer = useRef<NodeJS.Timeout | null>(null);

  // Each page now has its correct sections from MainLayout
  const filteredSections = sections;

  // Helper to log debug info only in development
  const debugLog = (...args: any[]) => {
    if (debugMode) {
      // console.log('[VerticalNavigator]', ...args);
    }
  };

  // Automatically toggle visibility on window resize or orientation change
  useEffect(() => {
    const onResize = () => {
      // Only set visibility if the page is ready
      if (pageReady.current) {
        setIsVisible(window.innerWidth >= 1024);
      }
    };
    
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    
    // Don't immediately initialize visibility on mount
    // Let the page-change effect handle initial visibility
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  // Calculate slider dimensions based on viewport and number of sections
  useEffect(() => {
    const calculateSliderDimensions = () => {
    const numSections = filteredSections.length;
      if (numSections <= 1) return;

      // Get viewport height
      const viewportHeight = window.innerHeight;
      
      // Dynamically adjust margins based on section count
      // More sections = smaller margins, fewer sections = larger margins
      // minMargin = 20% (for 5+ sections)
      // maxMargin = 35% (for 2-3 sections)
      const minMarginPercent = 20;
      const maxMarginPercent = 35;
      
      // Calculate margin percentage based on section count
      // For 5+ sections, use minMargin (20%)
      // For fewer sections, scale between maxMargin and minMargin
      let marginPercent;
      if (numSections >= 5) {
        marginPercent = minMarginPercent;
      } else {
        // Linear scaling between maxMargin and minMargin
        // (5-numSections)/(5-2) * (maxMargin-minMargin) + minMargin
        marginPercent = ((5 - numSections) / 3) * (maxMarginPercent - minMarginPercent) + minMarginPercent;
      }
      
      // Calculate available height between margins
      const availableHeight = viewportHeight * (1 - (marginPercent * 2 / 100));
      
      // Top position is the calculated margin percentage of viewport height
      const topPosition = viewportHeight * (marginPercent / 100);
      setSliderTop(`${topPosition}px`);
      
      // Calculate spacing between nodes
      // We have (numSections - 1) spaces between numSections nodes
      const spacing = availableHeight / (numSections - 1);
      
      // Convert to vh units for consistency
      const spacingVh = (spacing / viewportHeight) * 100;
      setNodeSpacing(spacingVh);
      
      // Total height is the distance from first to last node
      setSliderHeight(spacingVh * (numSections - 1));
      
      debugLog('Calculated dimensions:', {
        viewportHeight,
        numSections,
        marginPercent: `${marginPercent}%`,
        availableHeight,
        sliderTop: `${topPosition}px`,
        spacingVh,
        sliderHeight: spacingVh * (numSections - 1),
        verticalCoverage: `${marginPercent}% to ${100 - marginPercent}%`
      });
    };

    // Calculate immediately
    calculateSliderDimensions();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateSliderDimensions);
    
    return () => {
      window.removeEventListener('resize', calculateSliderDimensions);
    };
  }, [filteredSections, debugMode]);

  // Handle page changes - hide and then show the navigator with delay
  useEffect(() => {
    // Detect page change
    if (pageRef.current !== page) {
      // Hide the navigator immediately on page change
      setIsVisible(false);
      pageRef.current = page;
      
      // Reset penguin position to first node when page changes
      setActiveSection(sections[0]?.id || '');
      setIndicatorPosition(0);
      
      // Reset page ready state
      pageReady.current = false;
    }
    
    // Clear any existing timer
    if (visibilityTimer.current) {
      clearTimeout(visibilityTimer.current);
    }
    
    // Add delay before showing navigator when page loads or changes
    visibilityTimer.current = setTimeout(() => {
      // Mark the page as ready
      pageReady.current = true;
      
      // Only make visible on wider screens
      if (window.innerWidth >= 1500) {
        setIsVisible(true);
      }
      
      visibilityTimer.current = null;
    }, 2000); // 2 second delay for page load
    
    return () => {
      if (visibilityTimer.current) {
        clearTimeout(visibilityTimer.current);
      }
    };
  }, [page, sections]);

  // Find an element by attempting multiple ID variants and selector strategies
  const findElementById = (id: string, retryStrategy = 'default'): HTMLElement | null => {
    // Try direct ID lookup
    let element = document.getElementById(id);
    if (element) {
      debugLog(`Found element with direct ID: ${id}`);
      return element;
    }

    // Try with underscores instead of hyphens
    const underscoreId = id.replace(/-/g, '_');
    element = document.getElementById(underscoreId);
    if (element) {
      debugLog(`Found element with underscore ID: ${underscoreId}`);
      return element;
    }

    // Try without trailing 's'
    const singularId = id.replace(/s$/, '');
    element = document.getElementById(singularId);
    if (element) {
      debugLog(`Found element with singular ID: ${singularId}`);
      return element;
    }

    // Try with data-type attribute
    // For archive page, content types might differ from section IDs
    if (page === 'archive') {
      // Map section IDs to content types
      const contentTypeMap: Record<string, string> = {
        'youtube-videos': 'youtube-video',
        'linkedin-posts': 'linkedin-post',
        'lol-hub': 'quick-note',
        'linkedin-articles': 'research-report',
        'substack-unpacked': 'comprehensive-study'
      };
      
      // Try finding by data-type
      const contentType = contentTypeMap[id] || id.replace(/s$/, '');
      const possibleElements = document.querySelectorAll(`[data-type="${contentType}"]`);
      if (possibleElements.length > 0) {
        const firstElement = possibleElements[0] as HTMLElement;
        debugLog(`Found element with data-type: ${contentType}`);
        return firstElement;
      }
      
      // Try main content area as fallback
      if (retryStrategy === 'aggressive') {
        const mainContent = document.querySelector('.container.mx-auto');
        if (mainContent) {
          const sectionHeadings = mainContent.querySelectorAll('h2, h3');
          for (let i = 0; i < sectionHeadings.length; i++) {
            const heading = sectionHeadings[i];
            if (heading.textContent?.toLowerCase().includes(id.replace(/-/g, ' ').toLowerCase()) ||
                heading.textContent?.toLowerCase().includes(id.replace(/-/g, ' ').replace(/s$/, '').toLowerCase())) {
              debugLog(`Found element by heading text containing: ${id}`);
              return heading as HTMLElement;
            }
          }
        }
      }
    }

    debugLog(`Could not find element with ID: ${id}`);
    return null;
  };

  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    
    // Update indicator position immediately to provide visual feedback
    const clickedIndex = filteredSections.findIndex(section => section.id === id);
    if (clickedIndex !== -1) {
      setIndicatorPosition(clickedIndex * nodeSpacing);
      setActiveSection(id);
    }

    // Add this ID to attempted scrolls set
    attemptedScrollsRef.current.add(id);
    
    // Try to find the element, first with default strategy, then with aggressive if needed
    let element = findElementById(id);
    
    // If element wasn't found but this is the archive page, try again with more aggressive matching
    if (!element && page === 'archive') {
      debugLog('Trying aggressive element finding for archive page');
      element = findElementById(id, 'aggressive');
    }

    if (element) {
      debugLog(`Scrolling to section: ${id}`);
      
      const headerOffset = 120; // Increased offset to account for fixed header and margins
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Reset scrolling state after animation completes
      setTimeout(() => {
        setIsScrolling(false);
        // After scroll is complete, verify we're at the right position
        const newPosition = element?.getBoundingClientRect().top;
        if (Math.abs(newPosition - headerOffset) > 50) {
          debugLog('Position after scroll not accurate, adjusting...');
          // Adjust scroll position if needed
          window.scrollTo({
            top: window.pageYOffset + (newPosition - headerOffset),
            behavior: 'smooth'
          });
        }
      }, 1000);
    } else {
      debugLog(`Element with id "${id}" not found - deferring scroll`);
      
      // If not found, it might be that the content is still loading - set a retry
      if (page === 'archive') {
        // For archive, check again after a short delay since content might load dynamically
        setTimeout(() => {
          const retryElement = findElementById(id, 'aggressive');
          if (retryElement) {
            debugLog(`Delayed finding - scrolling to section: ${id}`);
            const headerOffset = 120;
            const elementPosition = retryElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          } else {
            debugLog(`Still couldn't find element with id "${id}" after delay`);
          }
          setIsScrolling(false);
        }, 3000); // Longer delay to allow for content to load
      } else {
        setIsScrolling(false);
      }
    }
  };

  useEffect(() => {
    // On initial mount, check and scroll to hash fragment if present
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const matchingSection = filteredSections.find(section => 
          section.id === hash || 
          section.id === hash.replace(/_/g, '-') ||
          section.id.replace(/s$/, '') === hash
        );
        
        if (matchingSection) {
          setTimeout(() => {
            scrollToSection(matchingSection.id);
          }, 1000); // Give time for page to render
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Skip if page isn't ready yet
      if (!pageReady.current) return;
      
      if (window.innerWidth >= 1500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        return;
      }
      
      // Skip activity detection during manual scrolling
      if (isScrolling) return;

      // Use requestAnimationFrame to optimize scroll performance
      requestAnimationFrame(() => {
        // Find all potential section elements first
        const sectionElements = filteredSections.map(section => {
          // Try all possible ways to find the element
          const element = findElementById(section.id);
          return {
            id: section.id,
            element: element,
            position: element?.getBoundingClientRect().top || Infinity
          };
        });

        // Filter out sections without elements
        const validSections = sectionElements.filter(section => section.element);
        
        if (validSections.length > 0) {
          // Find the closest section to the viewport top
          const active = validSections.reduce((closest, current) => {
            // Calculate distance to top of viewport, considering elements below the fold too
            // This uses absolute distance for elements above viewport, but actual position for elements below
            const currentPos = current.position;
            const distance = currentPos < 0 ? Math.abs(currentPos) : currentPos * 0.5;
            const closestPos = closest.position;
            const closestDistance = closestPos < 0 ? Math.abs(closestPos) : closestPos * 0.5;
            
            return distance < closestDistance ? current : closest;
          }, validSections[0]);

          // Only update if the active section has changed
          if (activeSection !== active.id) {
            debugLog(`Setting active section to: ${active.id}`);
        setActiveSection(active.id);
        
        // Calculate smooth position for the indicator
        const activeIndex = filteredSections.findIndex(section => section.id === active.id);
            if (activeIndex !== -1) {
              const targetPosition = activeIndex * nodeSpacing;
              setIndicatorPosition(targetPosition);
            }
          }
        } else if (page === 'archive' && validSections.length === 0) {
          // For archive page, if no valid sections found, try more aggressive approaches
          debugLog('No valid sections found on archive page, trying fallback approaches');
          
          // Look for sections by examining page content
          const mainContent = document.querySelector('.container.mx-auto');
          if (mainContent) {
            const swipeStations = mainContent.querySelectorAll('[id]');
            if (swipeStations.length > 0) {
              debugLog(`Found ${swipeStations.length} elements with IDs`);
              // Use the first one as a fallback
              const firstId = swipeStations[0].id;
              const matchingSection = filteredSections.find(s => 
                s.id === firstId || 
                firstId.includes(s.id.replace(/s$/, ''))
              );
              
              if (matchingSection && activeSection !== matchingSection.id) {
                setActiveSection(matchingSection.id);
                const activeIndex = filteredSections.findIndex(section => section.id === matchingSection.id);
                const targetPosition = activeIndex * nodeSpacing;
        setIndicatorPosition(targetPosition);
      }
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Also run the handler after content might have loaded
    const initialCheckTimer = setTimeout(() => {
      // Only run check if page is marked ready
      if (pageReady.current) {
        handleScroll();
      }
    }, 1000);
    
    const secondCheckTimer = setTimeout(() => {
      // By this point, the page should definitely be ready
      if (!pageReady.current) {
        pageReady.current = true;
      }
      handleScroll();
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(initialCheckTimer);
      clearTimeout(secondCheckTimer);
    };
  }, [filteredSections, isScrolling, nodeSpacing, page, activeSection]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed left-[50px] z-50 hidden lg:block"
      style={{ top: sliderTop }}
    >
      <div className="relative" style={{ height: `${sliderHeight}vh` }}>
        {/* Vertical Line with Dots */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-400 transform -translate-x-1/2">
          {/* Dots at each node position */}
          {filteredSections.map((_, index) => (
            <div
              key={index}
              className="absolute left-1/2 w-3 h-3 rounded-full bg-dark-400 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                top: `${index * nodeSpacing}vh`
              }}
            />
          ))}
        </div>

        {/* Penguin Indicator */}
        <motion.div
          className="absolute left-1/2 w-8 h-8 transform -translate-x-1/2"
          style={{
            transform: `translate(-50%, -50%)`,
            opacity: 1,
          }}
          animate={{
            top: `${indicatorPosition}vh`,
            // opacity: [1.7, 1, 0.7],
          }}
          transition={{
            top: { duration: 0.3, ease: "easeInOut" },
            // opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img 
            src="/images/school_penguin.png" 
            alt="Section Indicator" 
            className="w-full h-full"
          />
        </motion.div>

        {/* Section Nodes */}
        <div className="flex flex-col h-full justify-between">
          {filteredSections.map((section, index) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="relative flex items-center group"
              style={{
                position: 'absolute',
                top: `${index * nodeSpacing}vh`,
                transform: 'translateY(-50%)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Node */}
              <motion.div
                className={`w-3 h-3 rounded-full transition-colors ${
                  activeSection === section.id
                    ? 'bg-data scale-125'
                    : 'bg-dark-200'
                }`}
                animate={{
                  scale: activeSection === section.id ? 1.25 : 1,
                  backgroundColor: activeSection === section.id ? 'var(--data)' : 'var(--dark-200)',
                }}
                transition={{ duration: 0.2 }}
              />

              {/* Label - Modified for text wrapping and left alignment */}
              <motion.span
                className={`absolute left-5 ml-2 text-sm transition-all text-left max-w-[120px] leading-tight ${
                  activeSection === section.id
                    ? 'text-data font-medium opacity-100'
                    : 'text-gray-400 opacity-70'
                }`}
                animate={{
                  opacity: activeSection === section.id ? 1 : 0.7,
                  x: activeSection === section.id ? 0 : -5,
                }}
                transition={{ duration: 0.2 }}
              >
                {section.label}
              </motion.span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default VerticalNavigator; 