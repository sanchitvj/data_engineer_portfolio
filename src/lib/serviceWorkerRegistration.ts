// This function registers a service worker for production environments
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
      // First check for and unregister any problematic service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        const promises = registrations.map(registration => {
          // Check if this is our service worker
          if (registration.scope.includes(window.location.origin)) {
            console.log('Updating existing service worker');
            return registration.update().catch(error => {
              console.warn('Failed to update service worker, unregistering:', error);
              return registration.unregister();
            });
          }
          return Promise.resolve();
        });
        
        return Promise.all(promises);
      }).then(() => {
        // Now register the service worker
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }).catch(error => {
        console.error('Error managing service workers:', error);
      });
    });
  }
}

// This function unregisters all service workers
export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('Service worker unregistered');
      }
    }).catch(error => {
      console.error('Error unregistering service worker:', error);
    });
  }
} 