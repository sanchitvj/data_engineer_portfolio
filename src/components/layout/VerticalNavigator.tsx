'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Section {
  id: string;
  label: string;
}

interface VerticalNavigatorProps {
  sections: Section[];
  page: 'home' | 'resume' | 'archive' | 'projects';
}

const VerticalNavigator: React.FC<VerticalNavigatorProps> = ({ sections, page }) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [indicatorPosition, setIndicatorPosition] = useState(0);

  // Filter out specific sections if needed
  const filteredSections = page === 'resume' 
    ? sections.filter(section => section.id !== 'resume-section')
    : sections;

  // Calculate dynamic spacing based on number of sections
  const calculateSpacing = () => {
    const numSections = filteredSections.length;
    // Adjust spacing based on page type
    const baseSpacing = 
      page === 'home' ? 20 : 
      page === 'archive' ? 12 : 
      page === 'projects' ? 14 :
      15;
    const adjustedSpacing = Math.max(baseSpacing, 30 / numSections);
    return adjustedSpacing;
  };

  const spacing = calculateSpacing();
  const totalHeight = (filteredSections.length - 1) * spacing;

  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    
    // Update indicator position immediately
    const clickedIndex = filteredSections.findIndex(section => section.id === id);
    if (clickedIndex !== -1) {
      setIndicatorPosition(clickedIndex * spacing);
      setActiveSection(id);
    }

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Reset scrolling state after animation completes
      setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 1500) {
        setIsVisible(false);
        return;
      }
      setIsVisible(true);

      // Find the active section
      if (!isScrolling) {
        const sectionElements = filteredSections.map(section => ({
          id: section.id,
          element: document.getElementById(section.id),
          position: document.getElementById(section.id)?.getBoundingClientRect().top || 0
        }));

        const active = sectionElements.reduce((closest, current) => {
          if (!current.element) return closest;
          const distance = Math.abs(current.position);
          if (distance < Math.abs(closest.position)) {
            return current;
          }
          return closest;
        }, sectionElements[0]);

        setActiveSection(active.id);
        
        // Calculate smooth position for the indicator
        const activeIndex = filteredSections.findIndex(section => section.id === active.id);
        const targetPosition = activeIndex * spacing;
        setIndicatorPosition(targetPosition);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [filteredSections, isScrolling, spacing]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`fixed left-[50px] ${
        page === 'archive' || page === 'projects' 
          ? 'top-1/4 -translate-y-1/2' 
          : 'top-[25vh]'
      } z-50 hidden lg:block`}
    >
      <div className="relative" style={{ height: `${totalHeight}vh` }}>
        {/* Vertical Line with Dots */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-400 transform -translate-x-1/2">
          {/* Dots at each node position */}
          {filteredSections.map((_, index) => (
            <div
              key={index}
              className="absolute left-1/2 w-4 h-4 rounded-full bg-dark-400 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                top: `${index * spacing}vh`
              }}
            />
          ))}
        </div>

        {/* Penguin Indicator */}
        <motion.div
          className="absolute left-1/2 w-8 h-8 transform -translate-x-1/2"
          style={{
            transform: `translate(-50%, -50%)`,
          }}
          animate={{
            top: `${indicatorPosition}vh`,
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            top: { duration: 0.3, ease: "easeInOut" },
            opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <img 
            src="/icons/school_penguin.svg" 
            alt="Section Indicator" 
            className="w-full h-full"
          />
        </motion.div>

        {/* Section Nodes */}
        <div className="flex flex-col h-full justify-between">
          {filteredSections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="relative flex items-center group"
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