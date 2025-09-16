// Simple service worker for PWA app shell
const VERSION = 'v1';
const CORE_CACHE = `core-${VERSION}`;

const CORE = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CORE_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// NetworkFirst for index.html, CacheFirst for vite assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CORE_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CORE_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    throw e;
  }
}

