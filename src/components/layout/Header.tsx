'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/penguindb_front.png"
              alt="Logo"
              width={36}
              height={36}
            />
            <span className="text-xl font-bold text-white hidden md:block">Sanchit Vijay</span>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/resume" className="text-dark-600 hover:text-data transition-colors">
              Resume
            </Link>
            <Link href="/projects" className="text-dark-600 hover:text-data transition-colors">
              Projects
            </Link>
            <Link href="/blogs" className="text-dark-600 hover:text-data transition-colors">
              Blogs
            </Link>
          </nav>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-full left-0 right-0 bg-dark/95 backdrop-blur-sm md:hidden"
              >
                <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                  <Link
                    href="/resume"
                    className="text-white hover:text-data transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Resume
                  </Link>
                  <Link
                    href="/projects"
                    className="text-white hover:text-data transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    href="/blogs"
                    className="text-white hover:text-data transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blogs
                  </Link>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header; 