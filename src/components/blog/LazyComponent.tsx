'use client';

import React, { useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface LazyComponentProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: ReactNode;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '200px 0px',
  placeholder = null,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Memoize the intersection callback for better performance
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      // When the component is visible
      if (entry.isIntersecting) {
        setIsVisible(true);
        setHasBeenVisible(true);
        
        // Once it's been visible once, we can disconnect the observer
        if (ref.current && observer.current) {
          observer.current.unobserve(ref.current);
        }
      } else {
        setIsVisible(false);
      }
    },
    []
  );
  
  // Store the observer instance in a ref to avoid recreating it
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create observer only once
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        handleIntersection,
        {
          root: null, // viewport
          rootMargin, // load before it's visible
          threshold, // percentage visible
        }
      );
    }

    const currentRef = ref.current;
    const currentObserver = observer.current;
    
    if (currentRef && currentObserver) {
      currentObserver.observe(currentRef);
    }

    return () => {
      if (currentRef && currentObserver) {
        currentObserver.unobserve(currentRef);
      }
    };
  }, [rootMargin, threshold, handleIntersection]);

  // Once the component has been visible, we always render it
  // This prevents the component from unloading if it leaves the viewport
  return (
    <div ref={ref} className="w-full">
      {hasBeenVisible ? children : placeholder}
    </div>
  );
};

export default LazyComponent; 