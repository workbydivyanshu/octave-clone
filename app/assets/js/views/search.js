/* Search — live filtering over the demo dataset with the as-you-type
   suggestion dropdown and the full results page (tabs + filters). */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'search' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var q = (params.get('q') || '').toLowerCase();

  view.innerHTML =
    '<div class="searchbox" id="sb">' + I('search') +
    '<input id="q" type="search" placeholder="Artists, Songs, Lyrics, and More" ' +
    'value="' + esc(params.get('q') || '') + '" aria-label="Search" autocomplete="off">' +
    '<span class="sb-actions"><button class="icon-btn" id="sbMic" aria-label="Search with your voice">' + I('mic') + '</button>' +
    '<button class="icon-btn" id="sbClear" aria-label="Clear" hidden>' + I('x') + '</button></span></div>' +
    '<div id="drop" style="position:relative"></div>' +
    '<div id="results"></div>' +
    '<div id="idle"><h3 style="margin-top:32px;font-size:16px">Browse Categories</h3>' +
    '<div class="cat-grid" style="margin-top:16px">' +
    D.searchCategories.map(function (c) {
      return '<button class="cat-card" data-cat="' + esc(c) + '" style="color:#fff;' +
        A.backdrop('cat-' + c, c) + '">' + esc(c) + '</button>';
    }).join('') + '</div></div>';

  var input = $('#q'), drop = $('#drop'), results = $('#results'), idle = $('#idle');
  var TABS = ['Top Results', 'Songs', 'Lyrics', 'Artists', 'Albums', 'Playlists', 'Podcasts'];
  var activeTab = 'Top Results';
  var dropOpen = !!q;

  function match(list, fields) {
    if (!q) return list;
    return list.filter(function (item) {
      return fields.some(function (f) { return String(item[f] || '').toLowerCase().indexOf(q) >= 0; });
    });
  }

  function songs() { return match(D.tracks, ['title', 'artist', 'album']); }
  function artists() {
    return match(D.artists, ['name', 'sub']).concat(
      match(D.tracks, ['artist']).filter(function (t) {
        return !D.artists.some(function (a) { return a.name === t.artist; });
      }).map(function (t) { return { id: 'x-' + t.artist, name: t.artist, sub: 'Artist', fans: '', adob: '' }; })
    ).filter(function (v, i, arr) { return arr.findIndex(function (x) { return x.name === v.name; }) === i; });
  }
  function albums() {
    var seeded = match(D.albums, ['title', 'artist', 'genre']);
    var fromTracks = match(D.tracks, ['album', 'artist']).filter(function (t) { return t.album; })
      .filter(function (t, i, arr) {
        return arr.findIndex(function (x) { return x.album === t.album; }) === i;
      })
      .map(function (t) {
        var ex = D.albums.filter(function (a) { return a.id === t.albumId; })[0];
        return { id: t.albumId || t.id, title: t.album, artist: t.artist,
          genre: ex ? ex.genre : 'Album', year: ex ? ex.year : 2026 };
      });
    var seen = {};
    return seeded.concat(fromTracks).filter(function (a) {
      if (seen[a.title]) return false; seen[a.title] = 1; return true;
    });
  }
  function playlists() { return match(D.playlists, ['title', 'subtitle']); }
  function podcasts() {
    return match(D.shows, ['title', 'publisher']).map(function (s) { return { title: s.title, publisher: s.publisher, href: s.href || 'podcasts.html' }; });
  }
  function lyricHits() {
    return Object.keys(D.lyrics).map(function (id) {
      var t = D.trackById[id];
      var lines = D.lyrics[id].map(function (l) { return l[1]; }).join(' ');
      return { id: id, title: t.title, artist: t.artist, hit: lines.toLowerCase().indexOf(q) >= 0,
        line: D.lyrics[id].filter(function (l) { return l[1].toLowerCase().indexOf(q) >= 0; })[0] };
    }).filter(function (r) { return !q || r.hit; });
  }

  function topResult() {
    var a = artists()[0], s = songs()[0], al = albums()[0];
    var cand = [];
    if (a) cand.push({ kind: 'Artist', name: a.name, sub: a.fans || 'Artist', href: 'artist.html', seed: 'ar-' + a.name, round: true });
    if (s) cand.push({ kind: 'Song', name: s.title, sub: s.artist, href: 'search.html?q=' + encodeURIComponent(s.title), seed: s.albumId || s.id });
    if (al) cand.push({ kind: 'Album', name: al.title, sub: al.artist, href: 'album.html?a=' + al.id, seed: al.id });
    return cand[0] || null;
  }

  function tabsHtml() {
    return '<div style="display:flex;align-items:center;gap:12px;margin:20px 0 8px;flex-wrap:wrap">' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap" id="tabs">' +
      TABS.map(function (t) {
        return '<button class="pill' + (t === activeTab ? ' on' : '') + '" data-tab="' + esc(t) + '">' +
          esc(t) + '</button>';
      }).join('') + '</div>' +
      '<div style="flex:1"></div>' +
      '<button class="btn btn-glass" id="filtersBtn">' + I('filter') + 'Filters</button></div>';
  }

  function resultsHtml() {
    var parts = [tabsHtml()];
    var any = false;

    if (activeTab === 'Top Results') {
      var tr = topResult();
      if (tr) {
        any = true;
        parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Top result</h2>' +
          '<a class="panel" href="' + tr.href + '" style="display:flex;gap:20px;padding:20px;' +
          'max-width:560px;align-items:center">' +
          '<div class="list-art' + (tr.round ? ' sm' : '') + '" style="' +
          (tr.round ? 'width:120px;height:120px;border-radius:50%' : 'width:120px;height:120px;border-radius:12px') + '">' +
          A.tile(tr.seed, tr.name) + '</div>' +
          '<div><div style="font-size:24px;font-weight:700;letter-spacing:-.025em">' + esc(tr.name) + '</div>' +
          '<div class="muted">' + esc(tr.sub) + '</div></div></a>');
        var ar = artists().slice(0, 6);
        if (ar.length) {
          any = true;
          parts.push('<h2 style="font-size:24px;margin:32px 0 12px">Artists</h2>' +
            '<div class="card-grid card-grid-6">' + ar.map(function (a) {
              return '<a class="card" href="artist.html">' +
                '<div class="card-art card-art-round">' + A.tile('ar-' + a.name, a.name) +
                '<span class="card-hover-play">' + I('play') + '</span></div>' +
                '<div class="card-body" style="text-align:center">' +
                '<div class="card-title">' + esc(a.name) + '</div>' +
                '<div class="card-sub">' + esc(a.fans || a.sub || '') + '</div></div></a>';
            }).join('') + '</div>');
        }
        var al2 = albums().slice(0, 6);
        if (al2.length) {
          any = true;
          parts.push('<h2 style="font-size:24px;margin:32px 0 12px">Albums</h2>' +
            '<div class="card-grid card-grid-6">' + al2.map(function (a) {
              return OCT.albumCard({ id: a.id, title: a.title, sub: a.artist });
            }).join('') + '</div>');
        }
      }
    }

    if (activeTab === 'Songs') {
      var so = songs().slice(0, 40);
      any = any || so.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Songs</h2>' +
        (so.length ? '<div class="panel" style="padding:8px 12px"><div class="rows">' +
          so.map(function (t, i) { return OCT.songRow(t, i); }).join('') + '</div></div>'
          : OCT.emptyState('search', 'No songs found', 'Try a different spelling or search for an artist, album or lyric.')));
    }

    if (activeTab === 'Lyrics') {
      var ly = lyricHits();
      any = any || ly.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Lyrics</h2>' +
        (ly.length ? '<div class="panel">' + ly.map(function (r) {
          return '<div class="list-row"><div class="list-art sm">' +
            A.tile(r.id, r.title, { small: true }) + '</div><div class="grow">' +
            '<div class="list-title">' + esc(r.title) + '</div>' +
            '<div class="list-sub">' + esc(r.artist) + (r.line ? ' — “' + esc(r.line[1]) + '”' : '') +
            '</div></div>' +
            '<button class="btn btn-glass" data-play="' + r.id + '">' + I('play') + 'Play</button></div>';
        }).join('') + '</div>'
          : OCT.emptyState('lyrics', 'No lyrics found', 'We could not find lyrics matching that search.')));
    }

    if (activeTab === 'Artists') {
      var ar2 = artists();
      any = any || ar2.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Artists</h2>' +
        '<div class="card-grid card-grid-6">' + ar2.map(function (a) {
          return '<a class="card" href="artist.html"><div class="card-art card-art-round">' +
            A.tile('ar-' + a.name, a.name) + '<span class="card-hover-play">' + I('play') + '</span></div>' +
            '<div class="card-body" style="text-align:center"><div class="card-title">' + esc(a.name) + '</div>' +
            '<div class="card-sub">' + esc(a.fans || a.sub || '') + '</div></div></a>';
        }).join('') + '</div>');
    }

    if (activeTab === 'Albums') {
      var al3 = albums();
      any = any || al3.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Albums</h2>' +
        '<div class="card-grid card-grid-6">' +
        al3.map(function (a) { return OCT.albumCard({ id: a.id, title: a.title, sub: a.artist }); }).join('') +
        '</div>');
    }

    if (activeTab === 'Playlists') {
      var pl = playlists();
      any = any || pl.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Playlists</h2>' +
        '<div class="card-grid card-grid-6">' + pl.map(function (p) {
          return OCT.albumCard({ id: p.id, title: p.title, sub: p.subtitle },
            { href: 'library.html?tab=playlists' });
        }).join('') + '</div>');
    }

    if (activeTab === 'Podcasts') {
      var pd = podcasts();
      any = any || pd.length > 0;
      parts.push('<h2 style="font-size:24px;margin:24px 0 12px">Podcasts</h2>' +
        '<div class="panel">' + pd.map(function (s) {
          return '<a class="list-row" href="' + (s.href || 'podcasts.html') + '">' +
            '<div class="list-art">' + A.tile('pod-' + s.title, s.title) + '</div>' +
            '<div class="grow"><div class="list-title">' + esc(s.title) + '</div>' +
            '<div class="list-sub">' + esc(s.publisher) + '</div></div></a>';
        }).join('') + '</div>');
    }

    if (!any) {
      parts.push(OCT.emptyState('search', 'No results found',
        'Try a different spelling or search for an artist, album, lyric or show.'));
    }
    return parts.join('');
  }

  function suggestions() {
    if (!q) return '';
    var art = artists().slice(0, 3);
    var so = songs().slice(0, 4);
    var al = albums().slice(0, 2);
    var recent = D.tracks.slice(0, 1);
    var rows = '';
    if (recent.length) {
      rows += '<div style="padding:8px 10px;border-radius:8px;background:#ffffff0a;font-size:14px">' +
        I('clock') + ' <span class="muted">Recent</span> · ' + esc(recent[0].title) + '</div>';
    }
    if (so.length) {
      rows += '<div class="eyebrow" style="padding:8px 10px 4px">Songs</div>' +
        so.map(function (t) {
          return '<button class="menu-item" data-sug="' + esc(t.title) + '">' +
            I('search') + '<span>' + esc(t.title) + '</span>' +
            '<span class="end muted" style="font-size:12px">' + esc(t.artist) + '</span></button>';
        }).join('');
    }
    if (art.length) {
      rows += '<div class="eyebrow" style="padding:8px 10px 4px">Artists</div>' +
        art.map(function (a) {
          return '<a class="menu-item" href="artist.html">' +
            I('users') + '<span>' + esc(a.name) + '</span>' +
            '<span class="end muted" style="font-size:12px">' + esc(a.fans || '') + '</span></a>';
        }).join('');
    }
    if (al.length) {
      rows += '<div class="eyebrow" style="padding:8px 10px 4px">Albums</div>' +
        al.map(function (a) {
          return '<a class="menu-item" href="album.html?a=' + a.id + '">' +
            I('library') + '<span>' + esc(a.title) + '</span>' +
            '<span class="end muted" style="font-size:12px">' + esc(a.artist) + '</span></a>';
        }).join('');
    }
    var rel = D.tracks.filter(function (t) {
      return t.title.toLowerCase().indexOf(q) < 0 && t.artist.toLowerCase().indexOf(q) < 0;
    }).slice(0, 2);
    if (rel.length) {
      rows += '<div class="eyebrow" style="padding:8px 10px 4px">Try searching for</div>' +
        rel.map(function (t) {
          return '<button class="menu-item" data-sug="' + esc(t.title) + '">' +
            I('search') + '<span>' + esc(t.title) + '</span></button>';
        }).join('');
    }
    return '<div class="menu" style="position:absolute;left:0;right:0;top:8px;z-index:30;' +
      'max-height:min(62vh,540px);overflow:auto"> ' + rows +
      '<div class="menu-sep"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px;font-size:12px">' +
      '<span class="muted">Press <kbd>Enter</kbd> for all results</span>' +
      '<button class="icon-btn" id="dropClose" aria-label="Close">' + I('x') + '</button></div></div>';
  }

  function paint() {
    drop.innerHTML = (q && dropOpen) ? suggestions() : '';
    $('#sbClear').hidden = !q;
    if (q) { idle.hidden = true; results.innerHTML = resultsHtml(); }
    else { idle.hidden = false; results.innerHTML = ''; }
    OCT.wireRows(results);
    var dc = $('#dropClose');
    if (dc) dc.addEventListener('click', function () {
      input.value = ''; q = ''; dropOpen = false; paint(); input.focus();
    });
    OCT.$$('[data-sug]', drop).forEach(function (b) {
      b.addEventListener('click', function () {
        input.value = b.dataset.sug; q = b.dataset.sug.toLowerCase(); dropOpen = false; paint();
      });
    });
    OCT.$$('[data-tab]', results).forEach(function (b) {
      b.addEventListener('click', function () { activeTab = b.dataset.tab; dropOpen = false; paint(); });
    });
    var fb = $('#filtersBtn');
    if (fb) fb.addEventListener('click', function () { OCT.toast('Filters are a live-facet demo — no network in this build'); });
  }

  input.addEventListener('input', function () {
    q = input.value.trim().toLowerCase();
    activeTab = 'Top Results';
    dropOpen = true;
    paint();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var t = input.value.trim();
      if (t) { q = t.toLowerCase(); dropOpen = false; paint(); }
    } else if (e.key === 'Escape') { dropOpen = false; paint(); }
  });
  input.addEventListener('focus', function () {
    if (q && !dropOpen) { dropOpen = true; paint(); }
  });
  $('#sbClear').addEventListener('click', function () {
    input.value = ''; q = ''; dropOpen = false; paint(); input.focus();
  });
  $('#sbMic').addEventListener('click', function () { OCT.toast('Voice search needs a mic permission — demo stub'); });
  document.addEventListener('mousedown', function (e) {
    if (dropOpen && !e.target.closest('#sb') && !e.target.closest('#drop')) {
      dropOpen = false;
      drop.innerHTML = '';
    }
  });
  document.addEventListener('click', function (e) {
    var cat = e.target.closest('[data-cat]');
    if (cat) { input.value = cat.dataset.cat; q = cat.dataset.cat.toLowerCase(); dropOpen = false; paint(); }
  });

  paint();
  if (!q) input.focus();
})();