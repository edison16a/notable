/*
 * Notable's service worker. It keeps the app usable offline after the first
 * visit: pages are network first (so updates arrive) with a cached fallback,
 * and build assets plus the ONNX runtime files from the CDN are cache first,
 * since their URLs change whenever their contents do. Model weights are
 * cached by Transformers.js itself, so they are left alone here.
 */
const CACHE = "notable-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isImmutable(url) {
  return (
    (url.origin === self.location.origin &&
      (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/worklets/"))) ||
    url.hostname === "cdn.jsdelivr.net"
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("/"));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate") event.respondWith(networkFirst(request));
  else if (isImmutable(url)) event.respondWith(cacheFirst(request));
});
