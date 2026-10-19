const CACHE_NAME = 'pureview-android-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/pureview-mobile.css',
  '/js/pureview-ai-engine.js',
  '/js/pureview-app.js',
  '/js/pureview-webview-inject.js',
  '/icons/pureview-icon-192.svg',
  '/icons/pureview-icon-512.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Automatically route direct cross-origin YouTube/Facebook image requests through local CORS proxy if needed
  if (
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('ggpht.com') ||
    url.hostname.includes('fbcdn.net')
  ) {
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(event.request.url)}`;
    event.respondWith(fetch(proxiedUrl));
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
