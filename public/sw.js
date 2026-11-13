const CACHE_PREFIX = 'lumora-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_ROOT = new URL('./', self.registration.scope);
const APP_ENTRY = new URL('index.html', APP_ROOT).href;
const PRECACHE_URLS = [
  APP_ENTRY,
  new URL('manifest.webmanifest', APP_ROOT).href,
  new URL('lumora-logo.png', APP_ROOT).href,
  new URL('icons/lumora-192.png', APP_ROOT).href,
  new URL('icons/lumora-512.png', APP_ROOT).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const entryResponse = await fetch(APP_ENTRY);
      if (!entryResponse.ok) throw new Error(`Could not cache the app shell (${entryResponse.status}).`);
      const html = await entryResponse.clone().text();
      const assets = Array.from(html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g), (match) =>
        new URL(match[1], APP_ROOT).href,
      );
      await cache.put(APP_ENTRY, entryResponse);
      await cache.addAll([...PRECACHE_URLS.filter((url) => url !== APP_ENTRY), ...assets]);
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.href.startsWith(APP_ROOT.href)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match(APP_ENTRY))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
