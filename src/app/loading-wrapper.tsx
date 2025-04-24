'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Loading from './loading';

export default function LoadingWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // This approach avoids the direct dependency on useSearchParams
  // during the initial render, fixing the hydration error
  const [navigationKey, setNavigationKey] = useState<string>('');
  
  // Handle navigation changes safely
  useEffect(() => {
    // Get current search params safely inside useEffect
    const searchParams = new URLSearchParams(window.location.search);
    const currentNav = pathname + searchParams.toString();
    
    // Only trigger loading on actual navigation changes
    if (navigationKey && navigationKey !== currentNav) {
      setIsLoading(true);
    }
    
    // Update navigation key
    setNavigationKey(currentNav);
    
    // Initial load or navigation change - show loader for fixed time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 second delay
    
    return () => clearTimeout(timer);
  }, [pathname, navigationKey]);

  // Show loading component for 3 seconds
  if (isLoading) {
    return <Loading />;
  }

  return <>{children}</>;
} 