/* Offline cache for Cart v1 only.
   The worker file lives in /v1/, so the browser limits it to that folder.
   v2 needs its own worker and a cart-v2- cache name. This file only deletes
   old cart-v1- caches, never another version's. */
var CACHE = "cart-v1-shell-1";

var ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./logic.js",
  "./dictionary.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(ASSETS.map(function (url) {
        return fetch(new Request(url, { cache: "reload" })).then(function (response) {
          if (!response.ok) throw new Error("Could not cache " + url);
          return cache.put(url, response);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf("cart-v1-") === 0 && key !== CACHE) return caches.delete(key);
        return Promise.resolve();
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(request).then(function (cached) {
        var network = fetch(request).then(function (response) {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        }).catch(function () {
          if (cached) return cached;
          if (request.mode === "navigate") return cache.match("./index.html");
          return undefined;
        });
        if (cached) return cached;
        return network.then(function (response) {
          return response || new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
        });
      });
    })
  );
});
