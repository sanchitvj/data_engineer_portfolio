'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, unregisterServiceWorker } from '@/lib/serviceWorkerRegistration';

export default function ServiceWorkerHandler() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Add global error handler for service worker errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && (
          event.message.includes('service worker') || 
          event.message.includes('Cache'))) {
        console.error('Service Worker error detected:', event);
        setHasError(true);
        
        // Try to unregister problematic service workers
        unregisterServiceWorker();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && 
          typeof event.reason.toString === 'function' && (
          event.reason.toString().includes('service worker') || 
          event.reason.toString().includes('Cache'))) {
        console.error('Unhandled service worker promise rejection:', event.reason);
        setHasError(true);
        
        // Try to unregister problematic service workers
        unregisterServiceWorker();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Register service worker
    try {
      registerServiceWorker();
    } catch (error) {
      console.error('Error in service worker registration:', error);
      setHasError(true);
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Component doesn't render anything unless there's an error
  if (hasError) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-800/80 text-white p-2 rounded-lg text-sm z-50">
        <p>Service worker error detected</p>
        <button 
          onClick={() => {
            unregisterServiceWorker();
            window.location.reload();
          }}
          className="underline hover:text-gray-200"
        >
          Reset & Reload
        </button>
      </div>
    );
  }
  
  return null;
} 