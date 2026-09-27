// ═══════════════════════════════════════════════════════════════════
// infodrop.live Service Worker — Offline-first strategy
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME = 'infodrop-editions-20260927';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pyrenees/',
    '/pyrenees/index.html',
    '/config/sources-pyrenees.json',
];

// ─── INSTALL: cache static assets ───
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// ─── ACTIVATE: clean old caches ───
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// ─── FETCH: network-first for API, cache-first for static ───
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // API calls & Supabase: network-first with cache fallback
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets: cache-first with network fallback
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                // Cache successful responses for future offline use
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        }).catch(() => {
            // Ultimate fallback: return the matching edition shell for navigation.
            if (event.request.mode === 'navigate') {
                if (url.pathname.startsWith('/pyrenees') || url.pathname.startsWith('/pyr%C3%A9n%C3%A9es')) {
                    return caches.match('/pyrenees/index.html');
                }
                return caches.match('/index.html');
            }
        })
    );
});
