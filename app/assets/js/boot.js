// Aubade boot: loads AFTER shell.js, derives this page's view from its
// <body data-view>, runs the data upgrade, then injects the view script.
(function (root) {
  'use strict';
  var viewName = document.body.getAttribute('data-view');
  if (!viewName) return;
  var script = 'assets/js/views/' + viewName + '.js';
  root.AUB_BOOT.start(script);
})(window);

// PWA: offline shell. Registers the service worker that lives next to the
// pages (app/sw.js). The worker only ever touches same-origin static files;
// the worker API (/stream), googlevideo, lrclib and all media traffic pass
// through untouched. Boot never depends on this succeeding.
(function (root) {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  var proto = root.location.protocol;
  if (proto !== 'http:' && proto !== 'https:') return;
  root.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function (err) {
      console.warn('Aubade: service worker registration failed:', err);
    });
  });
})(window);
