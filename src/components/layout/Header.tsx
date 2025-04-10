'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/icons/penguindb_icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-white">Sanchit Vijay</span>
          </Link>
          <nav className="flex space-x-8">
            <Link href="/resume" className="text-dark-600 hover:text-data transition-colors">
              Resume
            </Link>
            <Link href="/projects" className="text-dark-600 hover:text-data transition-colors">
              Projects
            </Link>
            <Link href="/skills" className="text-dark-600 hover:text-data transition-colors">
              Skills
            </Link>
            <Link href="/blogs" className="text-dark-600 hover:text-data transition-colors">
              Blogs
            </Link>
            <Link href="/contact" className="text-dark-600 hover:text-data transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 