'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaEnvelope, FaLinkedin, FaChevronRight } from 'react-icons/fa';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactSubmenuOpen, setIsContactSubmenuOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

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

  // Dispatch custom event when menu state changes for the FloatingContact component
  useEffect(() => {
    const event = new CustomEvent('mobileMenuStateChange', { 
      detail: { isOpen: isMenuOpen } 
    });
    window.dispatchEvent(event);
  }, [isMenuOpen]);

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
  };

  const submenuVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      x: 300, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const handleContactClick = () => {
    setIsContactSubmenuOpen(true);
  };

  const handleBackClick = () => {
    setIsContactSubmenuOpen(false);
  };

  const copyEmailToClipboard = () => {
    const email = 'sanchit.aiwork@gmail.com';
    navigator.clipboard.writeText(email)
      .then(() => {
        // You could add a visual indication that the email was copied
        console.log('Email copied to clipboard');
      })
      .catch(err => {
        console.error('Could not copy email: ', err);
      });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-1">
            <Image
              src="/images/penguindb_main_logo.png"
              alt="Logo"
              width={36}
              height={36}
            />
            <span className="text-xl font-bold text-white hidden md:block">Sanchit</span>
            <span className="text-xl font-bold text-data hidden md:block">Vijay</span>
            <div className="flex items-center space-x-0 md:hidden">
              <span className="text-xl font-bold text-white">S</span>
              <span className="text-xl font-bold text-data">V</span>
            </div>
          </Link>
          
          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 relative z-[100]"
            animate={isMenuOpen ? "open" : "closed"}
            initial="closed"
          >
            <div className="relative w-6 h-5 flex flex-col justify-between overflow-hidden">
              <motion.span 
                className="w-full h-0.5 bg-white transform origin-left"
                variants={{
                  closed: { rotate: 0 },
                  open: { rotate: 45, y: -1, width: "130%" }
                }}
              />
              <motion.span 
                className="w-full h-0.5 bg-white"
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 }
                }}
              />
              <motion.span 
                className="w-full h-0.5 bg-white transform origin-left"
                variants={{
                  closed: { rotate: 0 },
                  open: { rotate: -45, y: 1, width: "150%", backgroundColor: "#3B82F6" }
                }}
              />
            </div>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/resume" className="text-dark-600 hover:text-data transition-colors">
              Resume
            </Link>
            {/* <Link href="/projects" className="text-dark-600 hover:text-data transition-colors">
              Projects
            </Link> */}
            <Link href="/projects" className="text-dark-600 hover:text-data transition-colors">
              Projects
            </Link>
            <Link href="/archive" className="text-dark-600 hover:text-data transition-colors">
              Archive
            </Link>
          </nav>

          {/* Mobile Navigation Menu (Full Screen) */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/95 backdrop-blur-lg z-40 flex items-center justify-center overflow-hidden"
                initial="closed"
                animate="open"
                exit="exit"
                variants={menuVariants}
                style={{ position: 'fixed', width: '100vw', height: '100vh' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-dark-100/10 to-dark-300/20" />
                <AnimatePresence mode="wait">
                  {!isContactSubmenuOpen ? (
                    <motion.nav
                      key="main-menu"
                      className="flex flex-col items-center justify-center w-full h-full space-y-8 text-center px-4 relative"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                    >
                      <motion.div variants={itemVariants} className="relative">
                        <Link
                          href="/"
                          className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Home
                          <motion.span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </Link>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="relative">
                        <Link
                          href="/resume"
                          className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Resume
                          <motion.span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </Link>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="relative">
                        <Link
                          href="/projects"
                          className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Projects
                          <motion.span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </Link>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="relative">
                        <Link
                          href="/archive"
                          className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Archive
                          <motion.span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </Link>
                      </motion.div>
                      
                      <motion.div variants={itemVariants} className="relative">
                        <button
                          className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-flex items-center group"
                          onClick={handleContactClick}
                        >
                          Contact
                          <motion.span 
                            className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </button>
                      </motion.div>
                      
                      <motion.div 
                        variants={itemVariants}
                        className="mt-8"
                      >
                        <Image 
                          src="/images/penguindb_main_logo.png" 
                          alt="PenguinDB Logo" 
                          width={100} 
                          height={100}
                          className="animate-menu-float"
                        />
                      </motion.div>
                    </motion.nav>
                  ) : (
                    <motion.div
                      key="contact-submenu"
                      className="flex flex-col items-center w-full h-full px-6 relative"
                      variants={submenuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsContactSubmenuOpen(false);
                        }}
                        className="absolute top-7 left-6 text-white hover:text-data transition-colors"
                      >
                        <svg 
                          className="w-6 h-6" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M15 19l-7-7 7-7" 
                          />
                        </svg>
                      </button>
                      <div className="flex flex-col items-center w-full max-w-sm h-full pt-[25vh]">
                        <Image 
                          src="/images/penguin_envelope.png" 
                          alt="Contact Penguin" 
                          width={100} 
                          height={100}
                          className="animate-menu-float mb-24"
                        />
                        
                        <div className="flex flex-col items-center space-y-8 w-full">
                          <motion.div className="relative">
                            <button
                              className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEmailModalOpen(!isEmailModalOpen);
                              }}
                            >
                              Email
                              <motion.span 
                                className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                                whileHover={{ width: "100%" }}
                                transition={{ duration: 0.3 }}
                              />
                            </button>
                            <AnimatePresence>
                              {isEmailModalOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  transition={{ duration: 0.2 }}
                                  className="fixed inset-0 flex items-center justify-center z-[200]"
                                  onClick={(e) => {
                                    // Close modal when clicking the backdrop
                                    setIsEmailModalOpen(false);
                                  }}
                                >
                                  <div 
                                    className="p-4 bg-dark-300 rounded-lg shadow-lg w-auto -mt-40"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <a 
                                        href="mailto:sanchit.aiwork@gmail.com"
                                        className="text-white text-lg font-mono"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsMenuOpen(false);
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
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          
                          <motion.div className="relative">
                            <a
                              href="https://www.linkedin.com/in/sanchit-vijay"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white text-2xl font-semibold hover:text-data transition-colors relative inline-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(false);
                              }}
                            >
                              LinkedIn
                              <motion.span 
                                className="absolute bottom-0 left-0 w-0 h-0.5 bg-data"
                                whileHover={{ width: "100%" }}
                                transition={{ duration: 0.3 }}
                              />
                            </a>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header; 