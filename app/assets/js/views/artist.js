/* Artist — hero panel, Latest Release card, Top Songs 2-col, Essential
   Albums, Albums, Top Videos, Artist Playlists. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: '' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var ar = D.artists[0];
  var topIds = D.artistTopSongs.map(function (id) { return D.trackById[id]; }).filter(Boolean);
  var al = D.albums;

  function pairRow(t) {
    return '<div class="row" data-track-row="' + t.id + '" tabindex="0" style="gap:12px">' +
      '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
      A.tile(t.albumId || t.id, t.album || t.title, { small: true }) +
      '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
      '<div class="row-main"><div class="row-title">' + esc(t.title) +
      (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
      '<div class="row-sub">' + esc(t.artist) + '</div></div>' +
      '<div class="row-meta">' + fmt(t.dur) + '</div></div>';
  }

  var videoIds = ['t012', 't283', 't014', 't299'];

  view.innerHTML =
    '<div style="position:relative;margin:-24px -32px 0;padding:56px 32px 32px;' +
    A.backdrop('artist-' + ar.name, ar.name) + '">' +
    '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:14px">' +
    '<div style="width:230px;height:230px;border-radius:50%;overflow:hidden;box-shadow:0 20px 60px #00000080">' +
    A.tile('ar-' + ar.name, ar.name) + '</div>' +
    '<h1 style="font-size:44px;line-height:48px">' + esc(ar.name) + '</h1>' +
    '<div class="muted">' + esc(ar.sub) + ' · ' + esc(ar.fans) + '</div>' +
    '<div style="display:flex;align-items:center;gap:14px;margin-top:10px">' +
    '<button class="btn btn-round btn-glass" id="infoBtn" aria-label="Artist info">' + I('info') + '</button>' +
    '<button class="btn btn-round" id="aplay" style="width:52px;height:52px;background:#fff;color:#000" aria-label="Play">' + I('play') + '</button>' +
    '<button class="btn btn-round btn-glass" id="starBtn" aria-label="Follow">' + I('star') + '</button>' +
    '</div></div></div>' +

    '<div style="display:flex;gap:40px;align-items:flex-start;margin-top:32px;flex-wrap:wrap">' +
    '<div style="flex:0 0 224px">' +
    '<div style="display:flex;gap:20px;align-items:center">' +
    '<div style="width:140px;height:140px;border-radius:10px;overflow:hidden;flex:none">' +
    A.tile(al[0].id, al[0].title) + '</div>' +
    '<div><div class="muted t-sm">Latest Release</div>' +
    '<a href="album.html?a=' + al[0].id + '" style="font-size:17px;font-weight:600;display:block">' +
    esc(al[0].title) + '</a>' +
    '<div class="t-sm muted">' + monthName(al[0]) + '</div></div></div></div>' +

    '<div style="flex:1;min-width:340px">' +
    '<div class="shelf-head" style="margin-bottom:12px"><div class="shelf-title">' +
    '<h2 style="font-size:20px">Top Songs</h2>' + I('chevR', 'chev') + '</div></div>' +
    '<div class="rows" style="display:grid;grid-template-columns:1fr 1fr;gap:0 24px">' +
    topIds.map(pairRow).join('') + '</div></div></div>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Essential Albums</h2></div></div>' +
    '<div class="card-grid card-grid-6">' +
    al.concat(al).map(function (a, i) {
      return OCT.albumCard({ id: a.id + '-ess' + i, title: a.title, sub: a.artist });
    }).join('') + '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Albums</h2></div></div>' +
    '<div class="card-grid card-grid-6">' +
    al.map(function (a) { return OCT.albumCard({ id: a.id, title: a.title, sub: a.artist }); }).join('') +
    '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Top Videos</h2></div></div>' +
    '<div class="card-grid card-grid-4">' +
    videoIds.map(function (id) {
      var t = D.trackById[id];
      return '<div class="card" role="button" tabindex="0">' +
        '<div class="card-art" style="aspect-ratio:1.6">' + A.tile('vid-' + id, t.artist) +
        '<span class="card-hover-play">' + I('play') + '</span></div>' +
        '<div class="card-body"><div class="card-title">' + esc(t.title) + '</div>' +
        '<div class="card-sub">' + esc(t.artist) + '</div></div></div>';
    }).join('') + '</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Artist Playlists</h2></div></div>' +
    '<div class="card-grid card-grid-6">' +
    ['Night Drive', 'Toronto Nights', 'Fans’ Picks', 'R&B Now', 'Playlists We Like', 'Early Hours']
      .map(function (n) {
        return '<a class="card" href="library.html?tab=playlists"><div class="card-art">' +
          A.tile('ap-' + n + ar.name, n) + '<span class="card-hover-play">' + I('play') + '</span></div>' +
          '<div class="card-body"><div class="card-title">' + esc(n) + '</div></div></a>';
      }).join('') + '</div></section>';

  OCT.wireRows(view);
  $('#aplay').addEventListener('click', function () { OCT.playCollection(topIds, 0); });
  $('#starBtn').addEventListener('click', function () {
    if (window.OCT_LIBRARY_STORE) {
      window.OCT_LIBRARY_STORE.artists[ar.id] = ar;
      OCT.toast('Following ' + ar.name);
    }
  });
  $('#infoBtn').addEventListener('click', function () { OCT.toast('Artist bio lives behind the account gate'); });
  OCT.$$('[role="button"][tabindex="0"]', view).forEach(function (n) {
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); OCT.toast('Video playback needs a stream — demo stub'); }
    });
  });

  function monthName(a) {
    return new Date(a.year, 8, 25).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
})();