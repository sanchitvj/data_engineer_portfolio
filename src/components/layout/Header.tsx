'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-dark-100 border-b border-dark-200 sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/penguin_db_substack.jpeg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full"
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