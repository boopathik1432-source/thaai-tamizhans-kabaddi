// 🏆 தாய் தமிழன்ஸ் கபடி கழகம் — High Performance PWA Service Worker
const CACHE_NAME = 'thaai-tamizhans-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/firebase-config.js',
  './js/firebase-service.js',
  './js/data.js',
  './js/app.js',
  './assets/kabaddi_logo.jpg',
  './assets/icons/icon-72.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-144.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-384.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png'
];

// Install Event: Cache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use addAll with error catching to avoid failure if any optional file is missing
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[PWA SW] Pre-cache skipped:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear Old Caches & Claim Clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First for Documents & API, Cache-First for Static Assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Do not intercept non-GET or Firebase/Firestore real-time calls
  if (req.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('firebaseinstallations.googleapis.com') ||
      url.hostname.includes('firebasestorage.googleapis.com') ||
      url.protocol === 'chrome-extension:' ||
      url.protocol === 'ws:' ||
      url.protocol === 'wss:') {
    return;
  }

  // Static Assets (Icons, Images, Fonts, Stylesheets): Cache First, background update
  if (req.destination === 'image' || req.destination === 'font' || req.destination === 'style') {
    event.respondWith(
      caches.match(req).then((cachedResp) => {
        const fetchPromise = fetch(req)
          .then((networkResp) => {
            if (networkResp && networkResp.status === 200) {
              const respClone = networkResp.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
            }
            return networkResp;
          })
          .catch(() => cachedResp);

        return cachedResp || fetchPromise;
      })
    );
    return;
  }

  // Navigation and Script files: Network First with Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
        }
        return networkResp;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Network offline', { status: 503, statusText: 'Offline' });
      })
  );
});
