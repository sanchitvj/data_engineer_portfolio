'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';

export default function ServiceWorkerHandler() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Component doesn't render anything
  return null;
} 