'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import DataBackground from '../DataBackground';
import VerticalNavigator from './VerticalNavigator';
import FloatingContact from './FloatingContact';
import LoadingWrapper from '@/app/loading-wrapper';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isResumePage = pathname === '/resume';
  const isBlogPage = pathname === '/archive';
  const isProjectPage = pathname === '/projects' || pathname === '/projects_old';
  const isPrivacyPage = pathname === '/privacy-policy';
  const is404Page = pathname === '/404';
  
  // Determine which page we're on for section navigation
  let page: 'home' | 'resume' | 'archive' = 'home';
  if (isResumePage) page = 'resume';
  if (isBlogPage) page = 'archive';
  
  // Skip rendering default background on certain pages that have their own
  const skipDefaultBackground = isBlogPage || isProjectPage;
  
  // Show navigator only on specific pages
  const showNavigator = isHomePage || isResumePage || isBlogPage;
  
  // Define sections for the navigator
  const sections = showNavigator ? (
    isHomePage ? [
      { id: 'hero', label: 'Introduction' },
      { id: 'about', label: 'About Me' },
      { id: 'journey', label: 'My Data Journey' },
    ] : isResumePage ? [
      { id: 'experience-section', label: 'Experience' },
      { id: 'education-section', label: 'Education' },
      { id: 'skills-section', label: 'Technical Skills' }
    ] : isBlogPage ? [
      { id: 'youtube-videos', label: 'YouTube Videos' },
      { id: 'linkedin-posts', label: 'LinkedIn Posts' },
      { id: 'lol-hub', label: 'LOL Hub' },
      { id: 'linkedin-articles', label: 'LinkedIn Articles' },
      { id: 'substack-unpacked', label: 'Substack Unpacked' },
      { id: 'medium-insights', label: 'Medium Notes' },
    ] : []
  ) : [];

  return (
    <div className="font-poppins flex flex-col min-h-screen">
      {/* Only show default background on pages that don't have custom backgrounds */}
      {!skipDefaultBackground && <DataBackground />}
      <Header />
      {showNavigator && <VerticalNavigator sections={sections} page={page} />}
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
          <LoadingWrapper>
            {children}
          </LoadingWrapper>
        </Suspense>
      </main>
      <Footer />
      <FloatingContact hideWhenMenuOpen={true} />
    </div>
  );
};

export default MainLayout; 