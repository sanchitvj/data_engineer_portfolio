'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaPhone, FaGoogle, FaLinkedin } from 'react-icons/fa';

const FloatingContact: React.FC = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const contactButtonRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside of the contact menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactButtonRef.current && !contactButtonRef.current.contains(event.target as Node)) {
        setIsContactOpen(false);
      }
    }

    if (isContactOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isContactOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  // Toggle contact menu on click
  const handleContactClick = () => {
    setIsContactOpen(prev => !prev);
  };

  return (
    <motion.div
      ref={contactButtonRef}
      className="fixed bottom-8 right-8 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => {
        const timeout = setTimeout(() => {
          if (!isContactOpen) {
            setIsContactOpen(true);
          }
        }, 300);
        setHoverTimeout(timeout);
      }}
      onMouseLeave={() => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        // Don't close if the contact menu was opened via click
      }}
    >
      <motion.button
        className="bg-data text-white p-4 rounded-full shadow-lg hover:bg-data-light transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleContactClick}
      >
        <FaEnvelope className="text-2xl" />
      </motion.button>

      <AnimatePresence>
        {isContactOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-dark-100 rounded-lg shadow-xl border border-dark-200 p-4 w-48"
          >
            <div className="space-y-3">
              <a
                href="mailto:sanchit.aiwork@gmail.com"
                className="flex items-center space-x-2 text-gray-300 hover:text-data transition-colors"
              >
                <FaEnvelope className="text-data" />
                <span>Email</span>
              </a>
              <a
                href="https://www.linkedin.com/in/sanchit-vijay"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-data transition-colors"
              >
                <FaLinkedin className="text-data" />
                <span>LinkedIn</span>
              </a>
              {/* <a
                href="https://forms.gle/your-form-id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-data transition-colors"
              >
                <FaGoogle className="text-data" />
                <span>Google Form</span>
              </a> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingContact; 