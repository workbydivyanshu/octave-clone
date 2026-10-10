// Aubade playlists: real playlist view over the playlists store — local
// playlists from IndexedDB, demo set as fallback. Every row plays through
// OCT_PLAYER with the full collection queued.
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'library' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var plId = params.get('p');

  function rows(list) {
    return '<div class="panel" style="padding:8px 12px"><div class="rows">' +
      list.map(function (id, i) {
        var t = D.trackById[id];
        if (!t) return '';
        return OCT.songRow(t, i);
      }).join('') + '</div></div>';
  }

  function playlistPanel(pl) {
    var ids = pl.trackIds || [];
    return '<section class="shelf"><div class="shelf-head">' +
      '<div class="list-art" style="width:120px;height:120px;border-radius:12px">' +
      A.tile(pl.id, pl.title) + '</div>' +
      '<div class="grow" style="padding:12px 0 0 16px">' +
      '<div class="faint" style="font-size:12px;letter-spacing:.08em">PLAYLIST</div>' +
      '<h1 style="font-size:40px;letter-spacing:-.03em;margin:4px 0 8px">' + esc(pl.title) + '</h1>' +
      '<div class="muted">' + esc(pl.subtitle || pl.description || ids.length + ' songs') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
      '<button class="btn btn-glass" data-playpl="' + esc(pl.id) + '">' + I('play') + 'Play</button>' +
      '<button class="btn btn-glass" data-shufflepl="' + esc(pl.id) + '">' + I('shuffle') + 'Shuffle</button>' +
      '</div></div></div>' +
      (ids.length ? rows(ids) : OCT.emptyState('playlist', 'Empty playlist', 'Add songs from search or your library.')) +
      '</section>';
  }

  function render(playlists) {
    var list = playlists.length ? playlists : [];
    var active = plId ? list.filter(function (p) { return p.id === plId; })[0] : null;

    var html = '<h1>Playlists</h1>' +
      '<div style="display:flex;gap:8px;margin:16px 0 24px">' +
      '<button class="btn btn-glass" id="newPl">' + I('plus') + 'New playlist</button>' +
      '</div>';

    if (active) {
      html = '<h1>' + esc(active.title) + '</h1>' + playlistPanel(active) +
        '<div style="margin-top:16px"><a class="chip" href="playlist.html">&larr; All playlists</a></div>';
    } else if (list.length) {
      html += '<div class="card-grid card-grid-6">' +
        list.map(function (pl) {
          return '<a class="card" href="playlist.html?p=' + encodeURIComponent(pl.id) + '">' +
            '<div class="card-art">' + A.tile(pl.id, pl.title) +
            '<span class="card-hover-play">' + I('play') + '</span></div>' +
            '<div class="card-body"><div class="card-title">' + esc(pl.title) + '</div>' +
            '<div class="card-sub">' + esc(pl.subtitle || (pl.trackIds || []).length + ' songs') + '</div></div></a>';
        }).join('') + '</div>';
    } else {
      html += OCT.emptyState('playlists', 'No playlists yet',
        'Import your music folder in Settings, then like songs or create playlists — they stay on this device.');
    }

    view.innerHTML = html;
    OCT.wireRows(view);

    OCT.$$('[data-playpl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pl = list.filter(function (p) { return p.id === b.dataset.playpl; })[0];
        if (!pl || !pl.trackIds || !pl.trackIds.length) { OCT.toast('Playlist is empty'); return; }
        var tracks = pl.trackIds.map(function (id) { return D.trackById[id]; }).filter(Boolean);
        OCT.playCollection(tracks, 0);
        OCT.toast('Playing ' + pl.title);
      });
    });
    OCT.$$('[data-shufflepl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pl = list.filter(function (p) { return p.id === b.dataset.shufflepl; })[0];
        if (!pl || !pl.trackIds || !pl.trackIds.length) { OCT.toast('Playlist is empty'); return; }
        var tracks = pl.trackIds.map(function (id) { return D.trackById[id]; }).filter(Boolean);
        tracks.sort(function () { return Math.random() - 0.5; });
        OCT.playCollection(tracks, 0);
      });
    });
    var np = $('#newPl');
    if (np) np.addEventListener('click', function () {
      var name = 'New Playlist ' + (list.length + 1);
      window.AUB_LIBRARY.savePlaylist({ id: 'pl-' + Date.now().toString(36), title: name, subtitle: 'Created on this device', trackIds: [] })
        .then(function () { location.reload(); });
    });
  }

  window.AUB_LIBRARY.playlists().then(function (pls) {
    var local = pls || [];
    var demo = (D.playlists || []).map(function (p) {
      var ids = (p.trackIds || (p.tracks || []).map(function (t) { return t.id; }));
      return { id: p.id, title: p.title, subtitle: p.subtitle || 'Playlist', trackIds: ids };
    });
    render(local.concat(demo));
  }).catch(function () { render([]); });
})();
