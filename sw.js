/* PIER NINE service worker.
 *
 * It exists for two reasons and no others:
 *   1. Chrome only fires beforeinstallprompt for a site with a real fetch()
 *      handler. Empty handlers are deliberately ignored, so this one has to
 *      actually do something.
 *   2. The hub shell then loads offline.
 *
 * It is NETWORK-FIRST on purpose. Cache-first would mean you commit a change,
 * Vercel deploys it, and you keep seeing the old arcade until the worker
 * updates. Network-first costs nothing online and still works offline.
 *
 * It touches ONLY the paths listed below. Everything else - cross-origin
 * requests, and every proxied game path like /coldwake/ in proxy mode - is
 * passed through without respondWith(), so this worker can never interfere
 * with a game or cache one by accident.
 */

var CACHE = 'piernine-shell-v1';

var PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png'
];

// paths this worker is allowed to answer at runtime
var HANDLE = PRECACHE.concat(['/index.html']);

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(PRECACHE); })
      .catch(function(){ /* a missing icon must not block installation */ })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch(err){ return; }

  if (url.origin !== self.location.origin) return;   // never the games' own origins
  if (HANDLE.indexOf(url.pathname) === -1) return;   // never proxied game paths

  e.respondWith(
    fetch(req).then(function(res){
      if (res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('/');
      });
    })
  );
});
