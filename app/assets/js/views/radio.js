/* Radio — station tiles with EXCLUSIVE / LISTEN NOW badges, schedule slots,
   descriptions, Schedule link, On Air Now rail, editorial radio. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: 'radio' });
  var view = ctx.view;

  function stationTile(s, compact) {
    var body = compact
      ? '<div class="card-body"><div class="card-title">' + esc(s.name) + '</div>' +
        '<div class="card-sub">' + esc(s.slot || '') + '</div></div>'
      : '<div class="card-body">' +
        '<div class="faint t-xs">' + esc(s.slot) + '</div>' +
        '<div class="card-title" style="margin-top:2px">' + esc(s.name) + '</div>' +
        '<div class="card-sub" style="white-space:normal;margin-top:4px">' + esc(s.desc) + '</div>' +
        '<a class="t-xs" href="#" style="color:var(--accent);display:inline-block;margin-top:6px" ' +
        'data-sched="' + esc(s.id) + '">Schedule ›</a></div>';
    return '<div class="card" data-station="' + esc(s.id) + '" role="button" tabindex="0">' +
      '<div class="card-art"' + (compact ? '' : ' style="background:#f2f2f4"') + '>' +
      A.tile(s.id, s.name.split(' ').slice(-1)[0], { bare: true }) +
      (s.badge ? '<span style="position:absolute;left:8px;top:8px;background:#000000cc;color:#fff;' +
        'font-size:10px;font-weight:700;letter-spacing:.06em;padding:3px 7px;border-radius:4px">' +
        esc(s.badge) + '</span>' : '') +
      '<span class="card-hover-play">' + I('play') + '</span></div>' +
      body + '</div>';
  }

  view.innerHTML =
    '<h1>Radio</h1>' +
    '<div class="searchbox" style="margin-top:16px">' + I('search') +
    '<input id="rq" type="search" placeholder="Search stations — Pop, Jazz, Chill…" aria-label="Search stations">' +
    '<span class="sb-actions">' + I('mic') + '</span></div>' +

    '<div class="card-grid card-grid-6" style="margin-top:24px" id="stations">' +
    D.stations.map(function (s) { return stationTile(s); }).join('') + '</div>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>On Air Now</h2></div></div>' +
    '<div class="card-grid card-grid-6" id="onair">' +
    D.stations.map(function (s) { return stationTile(s, true); }).join('') + '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Shows Hosted by Artists</h2></div></div>' +
    '<div class="card-grid card-grid-6">' +
    ['SOULATION', 'Rocket Hour', '5 on Fridays', 'Time Crisis', 'The Mark Hoppus Show', 'The Estelle Show']
      .map(function (n) {
        return '<a class="card" href="radio.html#' + encodeURIComponent(n) + '"><div class="card-art">' +
          A.tile('artist-radio-' + n, n) + '<span class="card-hover-play">' + I('play') + '</span></div>' +
          '<div class="card-body"><div class="card-title">' + esc(n) + '</div></div></a>';
      }).join('') + '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Editorial radio</h2></div></div>' +
    '<div class="chips">' + D.editorialRadio.map(function (n) {
      return '<a class="chip" href="radio.html#' + encodeURIComponent(n) + '">' + esc(n) + '</a>';
    }).join('') + '</div></section>';

  var rq = $('#rq');
  rq.addEventListener('input', function () {
    var v = rq.value.trim().toLowerCase();
    OCT.$$('#stations .card').forEach(function (c) {
      c.hidden = v && c.textContent.toLowerCase().indexOf(v) < 0;
    });
  });
  OCT.$$('[data-station]').forEach(function (c) {
    function go() {
      var seeds = D.tracks.filter(function (t) { return !t.albumId; }).slice(0, 10);
      OCT.playCollection(seeds, 0);
      OCT.toast('Tuning in — demo tone, no live stream');
    }
    c.addEventListener('click', function (e) {
      if (e.target.closest('[data-sched]')) return;
      go();
    });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
  OCT.$$('[data-sched]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      OCT.toast('Schedule opens the Apple Music schedule — external link, demo stub');
    });
  });
  if (location.hash) {
    var t = document.querySelector(location.hash);
    if (t) t.scrollIntoView();
  }
})();