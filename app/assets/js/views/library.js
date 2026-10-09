/* Library hub — Playlists / Artists / Albums / Podcasts / Songs / Downloaded /
   Local Files / Recently Played, all live off the in-memory library. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'library' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var TABS = [
    ['playlists', 'Playlists'], ['artists', 'Artists'], ['albums', 'Albums'],
    ['podcasts', 'Podcasts'], ['songs', 'Songs'], ['downloaded', 'Downloaded'],
    ['local', 'Local Files'], ['recently-added', 'Recently Played']
  ];
  var tab = params.get('tab') || '';

  var store = {
    albums: {}, artists: {}, songs: {}, follows: {},
    liked: function () { return Object.keys(P.state.liked).filter(function (k) { return P.state.liked[k]; })
      .map(function (k) { return D.trackById[k]; }).filter(Boolean); }
  };

  P.on('like', function () { if (tab === 'songs') paint(); });
  P.on('save', function () { if (tab === 'albums') paint(); });

  function tabsHtml() {
    return '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 8px" id="tabs">' +
      TABS.map(function (t) {
        return '<a class="pill' + (tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '" href="library.html?tab=' + t[0] + '">' +
          esc(t[1]) + '</a>';
      }).join('') + '</div>';
  }

  function grid(items, hrefFn, seedFn) {
    if (!items.length) return null;
    return '<div class="card-grid card-grid-6">' + items.map(function (it) {
      return '<a class="card" href="' + hrefFn(it) + '">' +
        '<div class="card-art">' + A.tile(seedFn(it), it.title) +
        '<span class="card-hover-play">' + I('play') + '</span></div>' +
        '<div class="card-body"><div class="card-title">' + esc(it.title) + '</div>' +
        '<div class="card-sub">' + esc(it.sub || '') + '</div></div></a>';
    }).join('') + '</div>';
  }

  function body() {
    if (!tab) {
      return '<div style="display:flex;align-items:center;gap:24px;margin:24px 0 8px">' +
        '<div><div style="width:168px;height:168px;border-radius:12px;overflow:hidden">' +
        '<img src="assets/brand/liked-songs.webp" alt="" style="width:100%;height:100%;object-fit:cover"></div>' +
        '<div class="card-title" style="margin-top:12px;font-size:14px">Liked Songs</div>' +
        '<div class="card-sub">Playlist</div></div></div>' +
        '<div class="nav-list" style="flex:1;min-width:280px">' +
        TABS.map(function (t) {
          var ic = { playlists: 'queue', artists: 'users', albums: 'library', podcasts: 'mic',
            songs: 'music', downloaded: 'download', local: 'file', 'recently-added': 'clock' }[t[0]];
          return '<a class="nav-list-item" href="library.html?tab=' + t[0] + '">' + I(ic) +
            esc(t[1]) + I('chevR', 'chev') + '</a>';
        }).join('') + '</div>';
    }

    if (tab === 'playlists') {
      var pls = D.playlists.concat(Object.keys(store.albums).length ? [] : []);
      return '<div style="display:flex;justify-content:flex-end;margin-bottom:12px">' +
        '<button class="btn btn-glass" id="newPl">' + I('plus') + 'New</button></div>' +
        (grid(pls, function (p) { return 'library.html?tab=playlists'; },
              function (p) { return p.id; }) || OCT.emptyState('queue', 'Nothing here yet', 'Create your first playlist.'));
    }

    if (tab === 'artists') {
      var ar = Object.keys(store.artists).map(function (k) {
        return { title: store.artists[k].name, sub: store.artists[k].sub || 'Artist', id: k };
      });
      return '<div class="eyebrow" style="margin-bottom:12px">Recently added</div>' +
        (grid(ar, function () { return 'artist.html'; }, function (a) { return a.id; }) ||
          OCT.emptyState('users', 'Nothing here yet', 'Follow an artist to see them here.',
            'browse.html', 'Find music'));
    }

    if (tab === 'albums') {
      var al = Object.keys(store.albums).map(function (k) {
        return { title: store.albums[k].title, sub: store.albums[k].artist, id: k };
      });
      return '<div class="eyebrow" style="margin-bottom:12px">Recently added</div>' +
        (grid(al, function (a) { return 'album.html?a=' + a.id; }, function (a) { return a.id; }) ||
          OCT.emptyState('library', 'Nothing here yet', 'Open an album and tap + to keep it here.',
            'browse.html', 'Find music'));
    }

    if (tab === 'podcasts') {
      return grid(D.shows.slice(0, 12).map(function (s) {
        return { title: s.title, sub: s.publisher, id: s.id };
      }), function (s) { return s.href || 'podcasts.html'; }, function (s) { return 'pod-' + s.id; }) ||
        OCT.emptyState('mic', 'No podcasts followed', 'Follow a show to keep it here.');
    }

    if (tab === 'songs') {
      var lk = store.liked();
      return '<div class="eyebrow" style="margin-bottom:12px">Liked Songs</div>' +
        (lk.length ? '<div class="panel" style="padding:8px 12px"><div class="rows">' +
          lk.map(function (t, i) { return OCT.songRow(t, i); }).join('') + '</div></div>'
          : OCT.emptyState('heart', 'Nothing here yet', 'Tap the heart on any song to save it here.',
              'search.html', 'Find music'));
    }

    if (tab === 'downloaded') {
      return OCT.emptyState('download', 'No Downloads', 'You haven’t downloaded any music.');
    }

    if (tab === 'local') {
      return '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:22px">' +
        '<div style="flex:1;min-width:260px">' +
        '<h2>0 songs · 0 MB on this device</h2>' +
        '<div class="muted t-sm">Files live in this browser’s IndexedDB — never uploaded anywhere.</div></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-accent" id="addFiles">' + I('plus') + 'Add files</button>' +
        '<button class="btn btn-glass" id="addFolder">' + I('file') + 'Add folder</button>' +
        '<button class="btn btn-glass" id="useDl">' + I('download') + 'Use my downloads folder</button>' +
        '</div></div>' +
        '<div class="panel" style="padding:64px 24px;text-align:center;border-style:dashed" id="dropzone">' +
        '<div class="empty-ico" style="margin:0 auto 14px">' + I('file') + '</div>' +
        '<h3>Your local library, side-by-side</h3>' +
        '<p class="muted" style="max-width:440px;margin:6px auto 0">Drag songs or a whole folder ' +
        'anywhere on this page, or add them with the picker. Files stay on your device — nothing uploads.</p>' +
        '<div style="display:flex;gap:12px;justify-content:center;margin-top:22px">' +
        '<button class="btn btn-accent" id="addFiles2">' + I('plus') + 'Add files</button>' +
        '<button class="btn btn-glass" id="addFolder2">' + I('file') + 'Add a folder</button></div>' +
        '<div class="faint t-xs" style="margin-top:16px">MP3 · FLAC · M4A / AAC · Ogg · Opus · WAV</div></div>';
    }

    if (tab === 'recently-added') {
      var recent = store.liked().slice(0, 8);
      return OCT.emptyState('clock', 'Nothing here yet',
        'Things you add to your library will show up here.', 'browse.html', 'Find music');
    }
    return '';
  }

  function paint() {
    view.innerHTML =
      '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
      '<h1 style="flex:1;min-width:160px">Library</h1>' +
      '<button class="btn" id="editBtn" style="color:var(--accent)">Edit</button>' +
      '<button class="btn btn-glass" id="importBtn">' + I('download') + 'Import</button>' +
      '<button class="btn btn-glass" id="partyBtn">' + I('party') + 'Party</button>' +
      '<button class="btn btn-glass" id="newBtn">' + I('plus') + 'New</button></div>' +
      (tab === 'local' || !tab ? '' : tabsHtml()) +
      '<div id="body" style="margin-top:24px">' + body() + '</div>';

    OCT.wireRows(view);
    ['editBtn', 'importBtn', 'partyBtn', 'newBtn'].forEach(function (id) {
      var b = $('#' + id);
      if (!b) return;
      b.addEventListener('click', function () {
        OCT.toast(id === 'partyBtn' ? 'Listening parties need a signed-in account'
          : 'Library editing is account-gated in the real app');
      });
    });
    var np = $('#newPl');
    if (np) np.addEventListener('click', function () { OCT.toast('Playlist creation is account-gated'); });
    ['addFiles', 'addFiles2'].forEach(function (id) {
      var b = $('#' + id);
      if (b) b.addEventListener('click', function () { OCT.toast('IndexedDB file writes are disabled in this static demo'); });
    });
    ['addFolder', 'addFolder2', 'useDl'].forEach(function (id) {
      var b = $('#' + id);
      if (b) b.addEventListener('click', function () { OCT.toast('Folder picking needs a browser file-system grant — demo stub'); });
    });
    var dz = $('#dropzone');
    if (dz) {
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.style.borderColor = 'var(--accent)'; });
      dz.addEventListener('dragleave', function () { dz.style.borderColor = ''; });
      dz.addEventListener('drop', function (e) {
        e.preventDefault(); dz.style.borderColor = '';
        OCT.toast('Dropped ' + (e.dataTransfer.files.length || 0) + ' file(s) — local import is a demo stub');
      });
    }
  }

  window.OCT_LIBRARY_STORE = store;
  paint();
})();