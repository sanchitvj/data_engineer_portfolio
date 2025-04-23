'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaPhone, FaGoogle, FaLinkedin } from 'react-icons/fa';
import Image from 'next/image';

interface FloatingContactProps {
  hideWhenMenuOpen?: boolean;
}

const FloatingContact: React.FC<FloatingContactProps> = ({ hideWhenMenuOpen = false }) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const contactButtonRef = useRef<HTMLDivElement>(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };
    
    // Check on initial load
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Listen for mobile menu open/close
  useEffect(() => {
    const handleMenuOpenStateChange = (event: CustomEvent) => {
      setMenuIsOpen(event.detail.isOpen);
    };

    window.addEventListener('mobileMenuStateChange' as any, handleMenuOpenStateChange);
    
    return () => {
      window.removeEventListener('mobileMenuStateChange' as any, handleMenuOpenStateChange);
    };
  }, []);

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

  // Hide on mobile or when menu is open
  if (isMobile || (hideWhenMenuOpen && menuIsOpen)) {
    return null;
  }

  return (
    <motion.div
      ref={contactButtonRef}
      className={`fixed bottom-8 right-8 ${menuIsOpen ? 'z-30' : 'z-50'}`}
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
      }}
    >
      <motion.div
        className="cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleContactClick}
      >
        <Image 
          src="/images/penguin_envelope.png" 
          alt="Contact Penguin" 
          width={64} 
          height={64}
          className="bg-transparent"
        />
      </motion.div>

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