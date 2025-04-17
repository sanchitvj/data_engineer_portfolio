'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  // Pages with custom backgrounds (blog and projects)
  const hasCustomBackground = pathname?.startsWith('/blog') || pathname?.startsWith('/projects');
  
  // For pages with custom backgrounds, add special styling to make the footer more visible
  const footerClass = hasCustomBackground 
    ? 'border-t border-gray-700/30 mt-auto z-20 relative backdrop-blur-sm' 
    : 'border-t border-gray-700/30 mt-auto bg-background';

  return (
    <footer className={footerClass}>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sanchit Vijay. All rights reserved.
          </p>
          <div>
            <Link 
              href="/privacy-policy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 