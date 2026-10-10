// Aubade boot: loads AFTER shell.js, derives this page's view from its
// <body data-view>, runs the data upgrade, then injects the view script.
(function (root) {
  'use strict';
  var viewName = document.body.getAttribute('data-view');
  if (!viewName) return;
  var script = 'assets/js/views/' + viewName + '.js';
  root.AUB_BOOT.start(script);
})(window);
