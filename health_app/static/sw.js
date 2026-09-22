/*
 * Minimal Service Worker for the Health Worker interface.
 *
 * Scope is limited to /static/ (its own directory) on purpose: it only
 * caches the static app shell (CSS/JS/icons) so the Health Worker screens
 * can still load their styling and scripts during a brief connectivity
 * drop. It deliberately does NOT cache any patient data pages or API
 * responses — those are dynamic and may contain sensitive information;
 * offline patient records live only in IndexedDB (see offline.js).
 */

const CACHE_NAME = "savix-static-shell-v1";
const SHELL_ASSETS = [
  "/static/css/style.css",
  "/static/js/script.js",
  "/static/js/offline.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only ever serve/cache same-origin static assets — never API or page routes.
  if (url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
