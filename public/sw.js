/* Klau's Shop service worker (pilot QA P3-06).
 * - Static chunks and optimized images: cache first (they are immutable / keyed by URL).
 * - /cart page: network first, cached copy when offline (the guest cart lives in localStorage).
 * - Other page navigations: network only, with a Spanish offline page as fallback.
 * - Never cached: APIs, admin, orders, account, auth and Supabase (prices/stock stay live).
 * Bump VERSION when a file in /public changes (logos/icons are cached until then).
 */
const VERSION = "v1";
const STATIC_CACHE = `ks-static-${VERSION}`;
const IMAGE_CACHE = `ks-images-${VERSION}`;
const PAGE_CACHE = `ks-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_IMAGES = 200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("ks-") && !keep.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
    if (maxEntries) trimCache(cacheName, maxEntries);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build chunks and the logos/icons in /public (they change only with a deploy)
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(svg|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, MAX_IMAGES));
    return;
  }

  if (request.mode !== "navigate") return;

  if (url.pathname === "/cart") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put("/cart", copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(PAGE_CACHE);
          return (
            (await cache.match("/cart")) || (await cache.match(OFFLINE_URL))
          );
        }),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(PAGE_CACHE);
      return cache.match(OFFLINE_URL);
    }),
  );
});
