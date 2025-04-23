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
  const searchParams = useSearchParams();

  // Reset loading state when navigation occurs
  useEffect(() => {
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Show loading component for at least 2 seconds
  if (isLoading) {
    return <Loading />;
  }

  return <>{children}</>;
} 