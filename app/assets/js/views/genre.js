/* Genre — eyebrow GENRE, huge name, Play CTA, Featured {genre} artists
   (circular portraits + sub-genre), {genre} stations. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: '' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var genre = params.get('g') || 'Pop';
  var featured = D.artists.slice(0, 6);
  var stations = ['The ’80s', 'Hits', 'Indie', 'TNTF', genre].map(function (n, i) {
    return { id: 'gs-' + n + i, name: n };
  });

  view.innerHTML =
    '<div class="eyebrow" style="margin-top:6px">GENRE</div>' +
    '<h1 style="font-size:56px;line-height:.95;font-weight:800;letter-spacing:-.04em;margin:8px 0 24px">' +
    esc(genre) + '</h1>' +
    '<button class="btn btn-accent btn-lg" id="gplay">' + I('play') + 'Play</button>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    I('users') + '<h2>Featured ' + esc(genre) + ' artists</h2></div></div>' +
    '<div class="muted t-sm" style="margin:-10px 0 16px">Curated picks</div>' +
    '<div class="card-grid card-grid-6">' +
    featured.map(function (a) {
      return '<a class="card" href="artist.html"><div class="card-art card-art-round">' +
        A.tile('ar-' + a.name, a.name) + '<span class="card-hover-play">' + I('play') + '</span></div>' +
        '<div class="card-body" style="text-align:center"><div class="card-title">' + esc(a.name) + '</div>' +
        '<div class="card-sub">' + esc(a.sub) + '</div></div></a>';
    }).join('') + '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>' + esc(genre) + ' stations</h2></div></div>' +
    '<div class="card-grid card-grid-6">' +
    stations.map(function (s) {
      return '<a class="card" href="radio.html#' + encodeURIComponent(s.id) + '">' +
        '<div class="card-art">' + A.tile(s.id, s.name, { bare: true }) +
        '<span class="card-hover-play">' + I('play') + '</span></div>' +
        '<div class="card-body"><div class="card-title">' + esc(s.name) + '</div>' +
        '<div class="card-sub">Station</div></div></a>';
    }).join('') + '</div></section>';

  $('#gplay').addEventListener('click', function () {
    var picks = D.tracks.filter(function (t) {
      return !t.albumId && t.artist;
    }).slice(0, 15);
    OCT.playCollection(picks, 0);
  });
  OCT.wireRows(view);
})();