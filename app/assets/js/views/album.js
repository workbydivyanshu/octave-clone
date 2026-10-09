/* Album — blurred-colour backdrop from the generated art, LOSSLESS pill,
   Play / Shuffle / Download + like / add / share / ⋯, sortable track table,
   label + ℗ line, Other versions. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: '' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var id = params.get('a') || 'al-habibti';
  var al = D.albums.filter(function (a) { return a.id === id; })[0] || D.albums[0];
  var list = D.tracks.filter(function (t) { return t.albumId === al.id; });
  var sortAsc = true;

  function trackRow(t, i) {
    return '<div class="row row-2col" data-track-row="' + t.id + '" data-n="' + (i + 1) + '" tabindex="0">' +
      '<div class="row-idx"><span class="num">' + (i + 1) + '</span></div>' +
      '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
      A.tile(t.albumId || t.id, t.album || t.title, { small: true }) +
      '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
      '<div class="row-main"><div class="row-title">' + esc(t.title) +
      (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
      '<div class="row-sub rowartist">' + esc(t.artist) + '</div></div>' +
      '<div class="row-meta col-artist">' + esc(t.artist) + '</div>' +
      '<div class="row-meta col-plays">' + (t.plays || '—') + '</div>' +
      '<div class="row-meta">' + fmt(t.dur) + '</div>' +
      '<div class="row-actions">' +
      '<button class="icon-btn" data-enq="' + t.id + '" aria-label="Add to queue">' + I('queue') + '</button>' +
      '<button class="icon-btn" data-like="' + t.id + '" aria-label="Favorite">' +
      (P.state.liked[t.id] ? I('heartFill') : I('heart')) + '</button>' +
      '<button class="icon-btn" data-more="' + t.id + '" aria-label="More">' + I('more') + '</button>' +
      '</div></div>';
  }

  function paintList() {
    var arr = sortAsc ? list.slice() : list.slice().reverse();
    $('#rows').innerHTML = arr.map(trackRow).join('');
    OCT.wireRows($('#rows'));
  }

  view.innerHTML =
    '<div style="position:fixed;inset:0;z-index:-1;' + A.backdrop(al.id, al.title) + '"></div>' +
    '<div id="alHeader" style="position:relative;margin:-24px -32px 0;padding:56px 32px 28px;' +
    A.backdrop(al.id, al.title) + '">' +
    '<div style="position:relative;z-index:1;display:flex;gap:40px;align-items:flex-end;flex-wrap:wrap;padding-left:48px">' +
    '<div style="width:300px;height:300px;border-radius:10px;overflow:hidden;flex:none;box-shadow:0 24px 70px #00000090">' +
    A.tile(al.id, al.title) + '</div>' +
    '<div style="flex:1;min-width:260px">' +
    '<h1 style="font-size:44px;line-height:48px">' + esc(al.title) + '</h1>' +
    '<div style="font-size:22px;color:var(--accent-soft);font-weight:600;margin-top:2px">' +
    '<a href="artist.html">' + esc(al.artist) + '</a></div>' +
    '<div class="t-sm muted" style="margin-top:6px">' + esc(al.genre) + ' · ' + al.year + '</div>' +
    (al.lossless ? '<div style="margin-top:10px"><span class="badge-lossless">' + I('volume') +
      'LOSSLESS</span></div>' : '') +
    (al.tagline ? '<div class="muted" style="margin-top:18px">' + esc(al.tagline) + '</div>' : '') +
    '<div style="display:flex;align-items:center;gap:12px;margin-top:24px;flex-wrap:wrap">' +
    '<button class="btn btn-lg" id="playBtn" style="background:#fff;color:#000">' + I('play') + 'Play</button>' +
    '<button class="btn btn-lg btn-glass" id="shufBtn">' + I('shuffle') + 'Shuffle</button>' +
    '<button class="btn btn-round btn-glass" id="dlBtn" aria-label="Download">' + I('download') + '</button>' +
    '<div style="flex:1"></div>' +
    '<button class="btn btn-round btn-glass" id="likeBtn" aria-label="Favorite">' + I('heart') + '</button>' +
    '<button class="btn btn-round btn-glass" id="addBtn" aria-label="Add to library">' + I('plus') + '</button>' +
    '<button class="btn btn-round btn-glass" id="shareBtn" aria-label="Share">' + I('share') + '</button>' +
    '<button class="btn btn-round btn-glass" id="moreBtn" aria-label="More actions for this collection">' +
    I('more') + '</button>' +
    '</div></div></div></div>' +

    '<div class="rowhead row-2col" style="margin-top:24px">' +
    '<button class="num-sort" id="sortNum" aria-label="Sort by track number"># ' +
    '<span style="display:inline-flex;vertical-align:-1px">' +
    I('chevU').replace('<svg', '<svg width="10" height="10"') + '</span></button>' +
    '<span class="rh-art"></span><span class="rh-name" id="nameHead" style="cursor:pointer">Name</span>' +
    '<span class="col-artist" style="text-align:left">Artist</span>' +
    '<span class="col-plays" style="text-align:left">Plays</span>' +
    '<span style="text-align:left">Time</span>' +
    '<span style="text-align:right">' + I('more').replace('<svg', '<svg width="14" height="14"') + '</span></div>' +
    '<div class="rows" id="rows"></div>' +

    (al.blurb ? '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
      '<h2>From the editors</h2></div></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px"><span class="badge-lossless">' +
      esc(al.tagline || 'EDITORIAL') + '</span></div>' +
      '<p class="muted" style="max-width:900px;line-height:26px">' + esc(al.blurb) + ' ' +
      '<a href="#" style="color:var(--accent)">Read more</a></p></section>' : '') +

    '<div style="margin-top:32px;color:var(--color-faint)" class="t-sm">' +
    esc(al.footer) + '</div>' +
    '<div style="margin-top:8px"><a href="artist.html">' + esc(al.artist) + '</a></div>' +
    '<div class="faint t-sm" style="margin-top:4px">' + esc(al.copyright) + '</div>' +

    (al.otherVersions && al.otherVersions.length ?
    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Other versions</h2></div></div>' +
    '<div class="panel">' + al.otherVersions.map(function (v) {
      return '<div class="list-row"><div class="list-art sm">' + A.tile('ov-' + v.title + v.note, v.title, { small: true }) +
        '</div><div class="grow"><div class="list-title">' + esc(v.title) + '</div>' +
        '<div class="list-sub">' + esc(v.note) + '</div></div></div>';
    }).join('') + '</div></section>' : '');

  paintList();
  OCT.wireStorePick();

  $('#playBtn').addEventListener('click', function () { OCT.playCollection(list, 0); });
  $('#shufBtn').addEventListener('click', function () {
    P.state.shuffle = true; OCT.renderPlayer();
    OCT.playCollection(list.slice().reverse(), 0);
  });
  $('#dlBtn').addEventListener('click', function () { OCT.toast('Downloads are account-gated in the real app'); });
  $('#likeBtn').addEventListener('click', function () { OCT.toast('Liking this album also hearts its songs in the demo'); });
  $('#addBtn').addEventListener('click', function () {
    if (window.OCT_LIBRARY_STORE) {
      window.OCT_LIBRARY_STORE.albums[al.id] = { title: al.title, artist: al.artist };
      OCT.toast('Saved to your Library');
    }
  });
  $('#shareBtn').addEventListener('click', function () { OCT.toast('Share link copied (demo)'); });
  $('#moreBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    OCT.menu([
      { label: 'Play next', icon: 'queue', on: function () { list.forEach(function (t) { P.enqueue(t, true); }); OCT.toast('Album set to play next'); } },
      { label: 'Add to queue', icon: 'queue', on: function () { list.forEach(function (t) { P.enqueue(t); }); OCT.toast('Album added to queue'); } },
      { label: 'Add to playlist', icon: 'listPlus', on: function () { OCT.toast('Playlist creation is account-gated'); } }
    ], 0, 0, this);
  });
  $('#sortNum').addEventListener('click', function () { sortAsc = !sortAsc; paintList(); });
  $('#nameHead').addEventListener('click', function () { sortAsc = !sortAsc; paintList(); });

  P.on('change', function () { OCT.renderPlayer(); });
})();