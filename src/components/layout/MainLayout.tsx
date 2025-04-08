'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import DataBackground from '../DataBackground';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <DataBackground />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 