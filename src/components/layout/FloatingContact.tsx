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
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
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

  // Add click outside listener for email modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEmailModalOpen) {
        setIsEmailModalOpen(false);
      }
    };
    
    // Add the event listener when the modal is open
    if (isEmailModalOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isEmailModalOpen]);

  // Toggle contact menu on click
  const handleContactClick = () => {
    setIsContactOpen(prev => !prev);
  };

  // Copy email to clipboard function
  const copyEmailToClipboard = () => {
    const email = 'sanchit.aiwork@gmail.com';
    navigator.clipboard.writeText(email)
      .then(() => {
        console.log('Email copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy email: ', err);
      });
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
          src="/images/envelope_penguin.png" 
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEmailModalOpen(true);
                }}
                className="flex items-center space-x-2 text-gray-300 hover:text-data transition-colors w-full text-left"
              >
                <FaEnvelope className="text-data" />
                <span>Email</span>
              </button>
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
        
        {/* Email Modal */}
        {isEmailModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-40 right-0 p-2 bg-dark-300 rounded-lg shadow-lg z-[100]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <a 
                href="mailto:sanchit.aiwork@gmail.com"
                className="text-white text-lg font-mono"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEmailModalOpen(false);
                }}
              >
                sanchit.aiwork@gmail.com
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyEmailToClipboard();
                }}
                className="text-data hover:text-data/80 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4V16C8 16.5304 8.21071 17.0391 8.58579 17.4142C8.96086 17.7893 9.46957 18 10 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V7.242C20 6.97556 19.9467 6.71181 19.8433 6.46624C19.7399 6.22068 19.5885 5.99824 19.398 5.812L16.188 2.602C15.8129 2.22698 15.3133 2.01679 14.788 2H10C9.46957 2 8.96086 2.21071 8.58579 2.58579C8.21071 2.96086 8 3.46957 8 4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 18V20C16 20.5304 15.7893 21.0391 15.4142 21.4142C15.0391 21.7893 14.5304 22 14 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V8C4 7.46957 4.21071 6.96086 4.58579 6.58579C4.96086 6.21071 5.46957 6 6 6H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingContact; 