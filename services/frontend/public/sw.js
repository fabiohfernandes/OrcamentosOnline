// Simple service worker - placeholder
self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
});

self.addEventListener('fetch', function(event) {
  // No caching for now, just pass through
  return;
});