'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import DataBackground from '../DataBackground';
import VerticalNavigator from './VerticalNavigator';
import FloatingContact from './FloatingContact';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const homeSections = [
    { id: 'hero-section', label: 'Intro' },
    { id: 'about-section', label: 'About Me' },
    { id: 'journey-section', label: 'My Data Journey' },
  ];

  const resumeSections = [
    { id: 'resume-section', label: 'Resume' },
    { id: 'experience-section', label: 'Experience' },
    { id: 'education-section', label: 'Education' },
    { id: 'skills-section', label: 'Technical Skills' },
  ];

  const sections = pathname === '/' ? homeSections : resumeSections;
  const page = pathname === '/' ? 'home' : 'resume';
  const showNavigator = pathname === '/' || pathname === '/resume';
  
  // Don't show DataBackground on blog or projects pages because they have their own backgrounds
  const skipDefaultBackground = pathname?.startsWith('/blog') || pathname?.startsWith('/projects');

  return (
    <div className="font-poppins flex flex-col min-h-screen">
      {/* Only show default background on pages that don't have custom backgrounds */}
      {!skipDefaultBackground && <DataBackground />}
      <Header />
      {showNavigator && <VerticalNavigator sections={sections} page={page} />}
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
      <Footer />
      <FloatingContact />
    </div>
  );
};

export default MainLayout; 