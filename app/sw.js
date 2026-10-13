/* Aubade service worker — offline shell for the static app.
 *
 * Strategies:
 *   - app/*.html documents: network-first, fallback to cache (then index.html).
 *   - same-origin static assets (css, js, fonts, icons, images):
 *     stale-while-revalidate.
 *
 * Never intercepted: every cross-origin request (aubade-stream worker API,
 * googlevideo, lrclib, any media), any request with a /stream path segment,
 * non-GET requests and Range requests. They go straight to the network.
 *
 * The cache name is versioned; activate deletes every older cache.
 */
'use strict';

var CACHE = 'aubade-v1';

/* Full offline shell: every app page + every static asset.
 * Paths are relative to this file, i.e. the app/ directory. */
var PRECACHE = [
  "album.html",
  "artist.html",
  "browse.html",
  "charts.html",
  "collab.html",
  "episode.html",
  "gate-members.html",
  "gate-onboarding.html",
  "genre.html",
  "index.html",
  "library.html",
  "mix.html",
  "new.html",
  "party.html",
  "playlist.html",
  "podcast-show.html",
  "podcasts-charts.html",
  "podcasts.html",
  "profile.html",
  "radio.html",
  "search.html",
  "settings.html",
  "stats.html",
  "wrapped.html",
  "assets/brand/apple-touch-icon.png",
  "assets/brand/black_logo.png",
  "assets/brand/defaultSongImage.png",
  "assets/brand/favicon-16x16.png",
  "assets/brand/favicon-32x32.png",
  "assets/brand/liked-songs.webp",
  "assets/brand/white_logo.png",
  "assets/css/app.css",
  "assets/fonts/inter-cyrillic-ext.woff2",
  "assets/fonts/inter-cyrillic.woff2",
  "assets/fonts/inter-greek.woff2",
  "assets/fonts/inter-japanese.woff2",
  "assets/fonts/inter-latin-ext-a.woff2",
  "assets/fonts/inter-latin-ext.woff2",
  "assets/fonts/inter-latin.woff2",
  "assets/js/art.js",
  "assets/js/boot.js",
  "assets/js/data.js",
  "assets/js/demo-data.js",
  "assets/js/icons.js",
  "assets/js/library-worker.js",
  "assets/js/library.js",
  "assets/js/lrc.js",
  "assets/js/player.js",
  "assets/js/shell.js",
  "assets/js/store.js",
  "assets/js/vendor/music-metadata.mjs",
  "assets/js/views/album.js",
  "assets/js/views/artist.js",
  "assets/js/views/charts.js",
  "assets/js/views/episode.js",
  "assets/js/views/gates.js",
  "assets/js/views/genre.js",
  "assets/js/views/home.js",
  "assets/js/views/library.js",
  "assets/js/views/mix.js",
  "assets/js/views/new.js",
  "assets/js/views/playlist.js",
  "assets/js/views/podcast-show.js",
  "assets/js/views/podcasts-charts.js",
  "assets/js/views/podcasts.js",
  "assets/js/views/radio.js",
  "assets/js/views/search.js",
  "assets/js/views/settings.js",
  "assets/js/views/states.js",
  "assets/js/ytm.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-192.png",
  "assets/icons/icon-maskable-512.png"
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(url).catch(function () {
          /* one missing file must not break install; it caches on first use */
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key !== CACHE ? caches.delete(key) : undefined;
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Root directory of this worker = the app/ directory, wherever it is deployed. */
function appRoot() {
  return new URL('./', self.location.href).href;
}

/* Only touch same-origin GETs inside the app directory that are not the
 * worker API and not media range requests. */
function shouldHandle(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false;
  if (url.href.indexOf(appRoot()) !== 0) return false;
  if (url.pathname.indexOf('/stream') !== -1) return false; /* aubade-stream worker API */
  if (request.headers.has('range')) return false; /* media seeking */
  return true;
}

function isDocument(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').indexOf('text/html') !== -1;
}

function putInCache(request, response) {
  if (!response || !response.ok || response.type === 'opaque') return;
  caches.open(CACHE).then(function (cache) {
    return cache.put(request, response.clone());
  }).catch(function () {});
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (!shouldHandle(request, url)) return;

  if (isDocument(request)) {
    /* network-first, cache fallback */
    event.respondWith(
      fetch(request).then(function (response) {
        putInCache(request, response);
        return response;
      }).catch(function () {
        return caches.match(request, { ignoreSearch: true }).then(function (cached) {
          return cached || caches.match('index.html');
        });
      })
    );
    return;
  }

  /* stale-while-revalidate for static assets */
  var fetched = fetch(request).then(function (response) {
    putInCache(request, response);
    return response;
  });
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) {
        fetched.catch(function () {}); /* refresh in the background */
        return cached;
      }
      return fetched;
    })
  );
});
