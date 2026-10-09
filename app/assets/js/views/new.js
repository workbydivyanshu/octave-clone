/* New & editorial — UPDATED PLAYLIST / NEW ALBUM / PRE-ADD ALBUM /
   NEW LIVE ALBUM cards, Best New Songs, New This Week, More to Explore,
   #genres anchor chip wall. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'new' });
  var view = ctx.view;

  function find(title) {
    return D.tracks.filter(function (t) { return t.title === title; })[0];
  }

  function editorialCard(e) {
    var t = find(e.title);
    return '<div class="card" data-cardplay="' + (t ? t.id : '') + '" role="button" tabindex="0">' +
      '<div class="card-art" style="aspect-ratio:1.35">' + A.tile('ed-' + e.title, e.title) +
      '<span class="card-hover-play">' + I('play') + '</span></div>' +
      '<div class="card-body">' +
      '<div class="eyebrow">' + esc(e.kind) + '</div>' +
      '<div class="card-title" style="font-size:15px;line-height:20px;margin-top:2px">' + esc(e.title) + '</div>' +
      '<div class="card-sub">' + esc(e.sub) + '</div></div></div>';
  }

  function shelf(title, titles, extraClass) {
    var tracks = titles.map(function (t) {
      var id = find(t);
      return id ? { id: id.id, title: t, artist: id.artist, album: id.album || id.title,
        albumId: id.albumId || id.id, dur: id.dur, e: id.e } : null;
    }).filter(Boolean);
    return '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
      '<h2>' + esc(title) + '</h2></div></div>' +
      (extraClass || '') +
      '<div class="panel" style="padding:8px 12px"><div class="rows">' +
      tracks.map(function (t, i) { return OCT.songRow(t, i); }).join('') +
      '</div></div></section>';
  }

  function cardShelf(title, titles) {
    return '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
      '<h2>' + esc(title) + '</h2></div></div><div class="card-grid card-grid-6">' +
      titles.map(function (t) {
        var id = find(t);
        return '<div class="card" data-cardplay="' + (id ? id.id : t) + '" role="button" tabindex="0">' +
          '<div class="card-art">' + A.tile(id ? id.id : t, id ? id.artist : t) +
          '<span class="card-hover-play">' + I('play') + '</span></div>' +
          '<div class="card-body"><div class="card-title">' + esc(t) + '</div>' +
          '<div class="card-sub">' + esc(id ? id.artist : '') + '</div></div></div>';
      }).join('') + '</div></section>';
  }

  view.innerHTML =
    '<h1>New</h1>' +

    '<section class="shelf" style="margin-top:32px">' +
    '<div class="shelf-head"><div class="shelf-title"><h2>Featured</h2></div></div>' +
    '<div class="card-grid card-grid-4">' +
    D.editorialNew.slice(0, 3).map(editorialCard).join('') +
    '<div class="card" data-cardplay="t311" role="button" tabindex="0">' +
    '<div class="card-art" style="aspect-ratio:1.35">' + A.tile('ed-live-001', 'NEW LIVE ALBUM') +
    '<span class="card-hover-play">' + I('play') + '</span></div>' +
    '<div class="card-body"><div class="eyebrow">NEW LIVE ALBUM</div>' +
    '<div class="card-title" style="font-size:15px;line-height:20px;margin-top:2px">' +
    'Live at the O2</div><div class="card-sub">Mollie Elizabeth</div></div></div>' +
    '</div></section>' +

    shelf('Best New Songs', D.editorialShelves['Best New Songs']) +
    cardShelf('New This Week', D.editorialShelves['New This Week']) +
    cardShelf('More to Explore', D.editorialShelves['More to Explore']) +

    '<section class="shelf" id="genres"><div class="shelf-head"><div class="shelf-title">' +
    I('hash', 'chev') + '<h2>Genres</h2></div></div>' +
    '<div class="chips">' +
    D.genres.map(function (g) {
      return '<a class="chip" href="genre.html?g=' + encodeURIComponent(g) + '">' + esc(g) + '</a>';
    }).join('') + '</div></section>';

  OCT.wireRows(view);
  OCT.$$('.card[data-cardplay]', view).forEach(function (c) {
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
    });
  });
  if (location.hash) {
    var t = document.querySelector(location.hash);
    if (t) t.scrollIntoView();
  }
})();