// Kill-switch service worker.
// Existing installs will update to this version, which unregisters itself
// and clears all caches so users get the fresh site on the next navigation.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

// Don't intercept any fetches — pass them through to the network.
self.addEventListener("fetch", () => {});
