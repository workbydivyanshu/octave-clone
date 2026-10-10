/* Octave demo clone — shared app shell: sidebar, topbar, player bar,
   queue panel, Now Playing surface, context menus, shortcuts dialog,
   keyboard handling, toasts, and the library/search helpers. */
(function (root) {
  'use strict';

  var D = root.OCTAVE_DATA;
  var P = root.OCT_PLAYER;
  var I = root.OCT_ICON;
  var A = root.OCT_ART;

  var NAV = [
    { id: 'home',   label: 'Home',        href: 'index.html',         icon: 'home' },
    { id: 'search', label: 'Search',      href: 'search.html',        icon: 'search' },
    { id: 'new',    label: 'New',         href: 'new.html',           icon: 'grid' },
    { id: 'radio',  label: 'Radio',       href: 'radio.html',         icon: 'radio' },
    { id: 'podcasts', label: 'Podcasts',  href: 'podcasts.html',      icon: 'mic' },
    { id: 'library', label: 'Your Library', href: 'library.html',     icon: 'library' }
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtLong(sec) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h ? h + ' hr ' + m + ' min' : m + ' min';
  }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---- Toasts ---------------------------------------------------------- */
  var toastHost;
  function toast(msg, icon) {
    if (!toastHost) {
      toastHost = el('<div class="toasts" role="status" aria-live="polite"></div>');
      document.body.appendChild(toastHost);
    }
    var t = el('<div class="toast">' + I(icon || 'check') + '<span>' + esc(msg) + '</span></div>');
    toastHost.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(8px)';
      setTimeout(function () { t.remove(); }, 260);
    }, 2200);
  }

  /* ---- Context menu ---------------------------------------------------- */
  var openMenu = null;
  function closeMenu() {
    if (openMenu) { openMenu.remove(); openMenu = null; }
  }
  document.addEventListener('click', function (e) {
    if (openMenu && !openMenu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); closeQueue(); closeNowPlaying(); }
  });

  /* items: [{label, icon, end, sep, check, on}] */
  function menu(items, x, y, anchor) {
    closeMenu();
    var m = el('<div class="menu" role="menu"></div>');
    items.forEach(function (it) {
      if (it.sep) { m.appendChild(el('<div class="menu-sep"></div>')); return; }
      var b = el('<button class="menu-item" role="menuitem" type="button">' +
        I(it.icon || 'music') + '<span>' + esc(it.label) + '</span>' +
        (it.end ? '<span class="end">' + it.end + '</span>' : '') + '</button>');
      if (it.check) b.setAttribute('aria-checked', 'true');
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        closeMenu();
        if (it.on) it.on();
      });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    var r = m.getBoundingClientRect();
    var px = x, py = y;
    if (anchor) {
      var a = anchor.getBoundingClientRect();
      px = a.left;
      py = a.bottom + 6;
    }
    if (px + r.width > window.innerWidth - 10) px = window.innerWidth - r.width - 10;
    if (py + r.height > window.innerHeight - 10) py = Math.max(10, y - r.height - (anchor ? 34 : 0));
    m.style.left = Math.max(8, px) + 'px';
    m.style.top = Math.max(8, py) + 'px';
    openMenu = m;
    return m;
  }
  document.addEventListener('contextmenu', function (e) {
    var row = e.target.closest('[data-track-row]');
    if (!row) return;
    e.preventDefault();
    trackMenu(D.trackById[row.dataset.trackRow], e.clientX, e.clientY);
  });

  function trackMenu(track, x, y) {
    if (!track) return;
    var liked = P.state.liked[track.id];
    menu([
      { label: 'View song', icon: 'info', on: function () { goNowPlaying(); } },
      { label: 'Get Info', icon: 'info', end: '<kbd>⌘I</kbd>', on: function () { showInfo(track); } },
      { sep: 1 },
      { label: liked ? 'Remove from Liked Songs' : 'Add to Liked Songs', icon: 'heart',
        on: function () { P.toggleLike(track.id); toast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs'); } },
      { label: 'Play next', icon: 'queue', on: function () { P.enqueue(track, true); toast('Playing next: ' + track.title); } },
      { label: 'Add to queue', icon: 'queue', on: function () { P.enqueue(track); toast('Added to queue'); } },
      { label: 'Create Station', icon: 'radio', on: function () { toast('Station demo — no network in this build'); } },
      { label: 'Add to playlist', icon: 'listPlus', on: function () { toast('Playlist creation is account-gated in the real app'); } },
      { sep: 1 },
      { label: 'Go to album', icon: 'library', on: function () { location.href = 'album.html?a=' + (track.albumId || 'al-habibti'); } },
      { label: 'Go to artist', icon: 'users', on: function () { location.href = 'artist.html'; } },
      { label: 'View lyrics', icon: 'lyrics', on: function () { P.play(track); openNowPlaying(true); } },
      { label: 'View credits', icon: 'caption', on: function () { showInfo(track); } },
      { label: 'Music video', icon: 'video', on: function () { toast('Music video is a live-stream feature — demo stub'); } }
    ], x, y);
  }

  function collectionMenu(track, anchor) {
    menu([
      { label: 'Play next', icon: 'queue', on: function () { P.enqueue(track, true); toast('Playing next'); } },
      { label: 'Add to queue', icon: 'queue', on: function () { P.enqueue(track); toast('Added to queue'); } },
      { label: 'Add to playlist', icon: 'listPlus', on: function () { toast('Playlist creation is account-gated in the real app'); } }
    ], 0, 0, anchor);
  }

  function showInfo(track) {
    var html =
      '<div class="scrim" role="dialog" aria-label="Get Info">' +
      '<div class="dialog" style="width:min(460px,100%)">' +
      '<div class="dialog-head">' + I('info') + '<h2>Get Info</h2>' +
      '<div style="flex:1"></div>' +
      '<button class="icon-btn" data-close aria-label="Close">' + I('x') + '</button></div>' +
      '<div class="dialog-body" style="display:flex;gap:16px">' +
      '<div style="width:120px;height:120px;border-radius:10px;overflow:hidden;flex:none">' +
      A.tile(track.albumId || track.id, track.album || track.title) + '</div>' +
      '<div style="min-width:0">' +
      '<div style="font-size:19px;font-weight:700;letter-spacing:-.02em">' + esc(track.title) +
      (track.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
      '<div class="muted" style="margin-top:2px">' + esc(track.artist) + '</div>' +
      '<dl style="margin:16px 0 0;display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13px">' +
      '<dt class="faint">Album</dt><dd style="margin:0">' + esc(track.album || '—') + '</dd>' +
      '<dt class="faint">Time</dt><dd style="margin:0">' + fmt(track.dur) + '</dd>' +
      '<dt class="faint">Codec</dt><dd style="margin:0">Demo tone · WebAudio</dd>' +
      '<dt class="faint">Source</dt><dd style="margin:0">Synthesized locally</dd>' +
      '</dl></div></div></div></div>';
    var wrap = el(html);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('[data-close]')) wrap.remove();
    });
    document.body.appendChild(wrap);
  }

  /* ---- Shell ----------------------------------------------------------- */
  var shellReady = false;

  function buildSidebar(active) {
    return el(
      '<nav class="sidebar" id="sidebar" aria-label="Primary">' +
      '<div class="side-head">' +
      '<a class="brand" href="index.html">' +
      '<img class="brand-mark" src="assets/brand/white_logo.png" alt="" width="22" height="22">' +
      '<span>Octave</span></a>' +
      '<button class="collapse-btn" id="collapseBtn" aria-label="Collapse sidebar" title="Collapse sidebar">' +
      I('panelLeft') + '</button>' +
      '</div>' +
      '<div class="nav">' +
      NAV.map(function (n) {
        return '<a class="nav-link" href="' + n.href + '"' +
          (n.id === active ? ' aria-current="page"' : '') + '>' +
          I(n.icon) + '<span class="nav-label">' + n.label + '</span></a>';
      }).join('') +
      '<div class="side-divider"></div>' +
      '<div class="pin-head"><span class="collapse-hint">' + I('bookmark') + 'PINNED</span>' +
      '<button class="icon-btn" data-create aria-label="Create">' + I('plus') + '</button></div>' +
      '<a class="pin-link" href="library.html?tab=playlists">' +
      '<span class="pin-art"><img src="assets/brand/liked-songs.webp" alt=""></span>' +
      '<span class="pin-meta"><span class="pin-title">Liked Songs</span>' +
      '<span class="pin-sub">Pinned · Playlist</span></span></a>' +
      '</div>' +
      '<div class="side-foot">' +
      '<div class="made-by">Made by <b>CloakGPT</b></div>' +
      '</div>' +
      '</nav>');
  }

  function buildTopbar() {
    return el(
      '<header class="topbar" id="topbar">' +
      '<div class="nav-arrows">' +
      '<button class="arrow" id="navBack" aria-label="Back">' + I('chevL') + '</button>' +
      '<button class="arrow" id="navFwd" aria-label="Forward">' + I('chevR') + '</button>' +
      '</div>' +
      '<div class="topbar-spacer"></div>' +
      '<button class="icon-btn bell" id="bellBtn" aria-label="Notifications">' + I('bell') +
      '<span class="bell-dot"></span></button>' +
      '<button class="avatar" id="avatarBtn" aria-label="Account">' + I('user') + '</button>' +
      '</header>');
  }

  function buildPlayerBar() {
    return el(
      '<div class="playerbar" id="playerbar" role="region" aria-label="Player" hidden>' +
      '<div class="pb-now">' +
      '<div class="pb-art" id="pbArt" role="button" tabindex="0" aria-label="Open Now Playing"></div>' +
      '<div class="pb-meta"><div class="pb-title" id="pbTitle">—</div>' +
      '<div class="pb-artist" id="pbArtist">—</div></div>' +
      '<button class="icon-btn" id="pbLike" aria-label="Favorite">' + I('heart') + '</button>' +
      '</div>' +
      '<div class="pb-center">' +
      '<div class="pb-transport">' +
      '<button class="tbtn sm" id="btnShuffle" aria-label="Shuffle" aria-pressed="false">' + I('shuffle') + '</button>' +
      '<button class="tbtn" id="btnPrev" aria-label="Previous track">' + I('prev') + '</button>' +
      '<button class="tbtn pb-play" id="btnPlay" aria-label="Play">' + I('play') + '</button>' +
      '<button class="tbtn" id="btnNext" aria-label="Next track">' + I('next') + '</button>' +
      '<button class="tbtn sm" id="btnRepeat" aria-label="Repeat" aria-pressed="false">' + I('repeat') + '</button>' +
      '</div>' +
      '<div class="pb-scrub">' +
      '<span class="pb-time" id="tCur">0:00</span>' +
      '<div class="scrub" id="scrub" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="scrub-fill" id="scrubFill"></div><div class="scrub-dot" id="scrubDot"></div></div>' +
      '<span class="pb-time" id="tDur">0:00</span>' +
      '</div></div>' +
      '<div class="pb-right">' +
      '<button class="tbtn sm" id="btnLyrics" aria-label="Lyrics" aria-pressed="false">' + I('lyrics') + '</button>' +
      '<button class="tbtn sm" id="btnQueue" aria-label="Playing Next" aria-pressed="false">' + I('queue') + '</button>' +
      '<button class="tbtn sm" id="btnMute" aria-label="Mute">' + I('volume') + '</button>' +
      '<div class="vol"><input class="slider" id="volSlider" type="range" min="0" max="100" value="70" aria-label="Volume"></div>' +
      '</div>' +
      '</div>');
  }

  function buildQueuePanel() {
    return el(
      '<aside class="queue-panel" id="queuePanel" aria-label="Playing Next" data-open="false">' +
      '<div class="q-head">' + I('queue') + '<h2>Playing Next</h2>' +
      '<button class="icon-btn" id="qClose" aria-label="Close queue">' + I('x') + '</button></div>' +
      '<div class="q-tabs"><div class="pill-group">' +
      '<button class="pill on" data-qtab="queue">Queue</button>' +
      '<button class="pill" data-qtab="next">Playing Next</button></div></div>' +
      '<div class="q-list" id="qList"></div>' +
      '<div class="q-foot">' +
      '<button class="btn btn-glass" id="qClear" style="flex:1">Clear</button>' +
      '<button class="btn btn-accent" id="qShuffle" style="flex:1">' + I('shuffle') + 'Shuffle</button>' +
      '</div></aside>');
  }

  function buildTabbar(active) {
    // Home / New / Radio / Library + a floating Search FAB (matches the recon
    // mobile chrome, which has no Search tab).
    var items = [NAV[0], NAV[2], NAV[3], NAV[5]];
    return el(
      '<nav class="tabbar" aria-label="Primary mobile">' +
      items.map(function (n) {
        return '<a class="tab" href="' + n.href + '"' +
          (n.id === active ? ' aria-current="page"' : '') + '>' +
          I(n.icon) + '<span>' + n.label.replace('Your ', '') + '</span></a>';
      }).join('') + '</nav>');
  }

  function init(opts) {
    opts = opts || {};
    var app = $('#app');
    var active = opts.active || '';
    document.body.insertBefore(buildSidebar(active), document.body.firstChild);
    var main = el('<div class="main"></div>');
    document.body.appendChild(main);
    main.appendChild(buildTopbar());
    var view = el('<div class="view" id="view"></div>');
    main.appendChild(view);
    document.body.appendChild(buildPlayerBar());
    document.body.appendChild(buildQueuePanel());
    document.body.appendChild(buildTabbar(active));
    var fab = el('<button class="fab" id="fabSearch" aria-label="Search">' + I('search') + '</button>');
    document.body.appendChild(fab);
    fab.addEventListener('click', function () { location.href = 'search.html'; });

    wireSidebar();
    wireTopbar();
    wirePlayerBar();
    wireQueue();
    wireScroll();
    initKeyboard();
    P.on('change', renderPlayer);
    P.on('tick', renderScrub);
    P.on('queue', renderQueue);
    P.on('like', function () { renderPlayer(); markRows(); });
    renderPlayer();
    renderQueue();
    shellReady = true;
    return { view: view };
  }

  function wireSidebar() {
    var sb = $('#sidebar');
    var btn = $('#collapseBtn');
    if (btn) btn.addEventListener('click', function () {
      var c = sb.getAttribute('data-collapsed') === 'true';
      sb.setAttribute('data-collapsed', c ? 'false' : 'true');
      btn.setAttribute('aria-label', c ? 'Collapse sidebar' : 'Expand sidebar');
    });
    var create = $('[data-create]');
    if (create) create.addEventListener('click', function (e) {
      e.stopPropagation();
      menu([
        { label: 'New Playlist', icon: 'plus', end: '<kbd>⌃N</kbd>', on: function () { toast('Playlist creation is account-gated in the real app'); } },
        { label: 'New Smart Playlist', icon: 'sparkle', end: '<kbd>⌃⌥N</kbd>', on: function () { toast('Smart playlists need a synced account'); } },
        { label: 'Import…', icon: 'download', end: '<kbd>⌃0</kbd>', on: function () { toast('Import flow is account-gated'); } }
      ], create.getBoundingClientRect().right + 6, create.getBoundingClientRect().top);
    });
    var avatar = $('#avatarBtn');
    if (avatar) avatar.addEventListener('click', function (e) {
      e.stopPropagation();
      menu([
        { label: 'Listener — Free account', icon: 'user', on: function () { location.href = 'settings.html'; } },
        { sep: 1 },
        { label: 'Settings…', icon: 'sliders', end: '<kbd>⌃,</kbd>', on: function () { location.href = 'settings.html'; } },
        { label: 'Account & sync', icon: 'key', on: function () { location.href = 'settings.html'; } },
        { label: 'Keyboard Shortcuts', icon: 'file', end: '<kbd>?</kbd>', on: function () { shortcutsDialog(); } }
      ], 0, 0, avatar);
    });
    var bell = $('#bellBtn');
    if (bell) bell.addEventListener('click', function (e) {
      e.stopPropagation();
      menu([{ label: 'No new notifications', icon: 'bell', on: function () { toast('No new notifications'); } }], 0, 0, bell);
    });
  }

  function wireTopbar() {
    $('#navBack').addEventListener('click', function () { history.back(); });
    $('#navFwd').addEventListener('click', function () { history.forward(); });
  }

  function wireScroll() {
    var view = $('#view');
    var bar = $('#topbar');
    view.addEventListener('scroll', function () {
      bar.setAttribute('data-scrolled', view.scrollTop > 4 ? 'true' : 'false');
    });
  }

  function wirePlayerBar() {
    $('#btnPlay').addEventListener('click', function () { P.toggle(); });
    $('#btnNext').addEventListener('click', function () { P.next(); });
    $('#btnPrev').addEventListener('click', function () { P.prev(); });
    $('#btnShuffle').addEventListener('click', function () {
      P.state.shuffle = !P.state.shuffle;
      this.setAttribute('aria-pressed', String(P.state.shuffle));
      toast(P.state.shuffle ? 'Shuffle on' : 'Shuffle off');
    });
    $('#btnRepeat').addEventListener('click', function () {
      P.state.repeat = P.state.repeat === false ? 'all' : P.state.repeat === 'all' ? 'one' : false;
      this.setAttribute('aria-pressed', String(P.state.repeat !== false));
      toast('Repeat: ' + P.state.repeat);
    });
    $('#btnMute').addEventListener('click', function () { P.toggleMute(); });
    $('#volSlider').addEventListener('input', function () { P.setVolume(this.value / 100); });
    $('#btnQueue').addEventListener('click', function () { toggleQueue(); });
    $('#btnLyrics').addEventListener('click', function () { openNowPlaying(true); });
    $('#pbArt').addEventListener('click', function () { openNowPlaying(false); });
    $('#pbArt').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNowPlaying(false); }
    });
    $('#pbLike').addEventListener('click', function () {
      if (P.state.track) P.toggleLike(P.state.track.id);
    });

    var scrub = $('#scrub');
    var dragging = false;
    function posFrom(e) {
      var r = scrub.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return Math.max(0, Math.min(1, x / r.width));
    }
    function move(e) {
      if (!dragging) return;
      e.preventDefault();
      P.seek(posFrom(e) * P.state.duration);
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      P.seek(posFrom(e) * P.state.duration);
    }
    scrub.addEventListener('pointerdown', function (e) {
      dragging = true;
      scrub.setPointerCapture(e.pointerId);
      P.seek(posFrom(e) * P.state.duration);
    });
    scrub.addEventListener('pointermove', move);
    scrub.addEventListener('pointerup', up);
    scrub.addEventListener('pointercancel', up);
    scrub.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); P.skip(5); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); P.skip(-5); }
    });
  }

  function renderPlayer() {
    var bar = $('#playerbar');
    if (!bar) return;
    var s = P.state;
    if (!s.track) { bar.hidden = true; document.documentElement.classList.remove('has-player'); return; }
    bar.hidden = false;
    document.documentElement.classList.add('has-player');
    $('#pbArt').innerHTML = A.tile(s.track.albumId || s.track.id, s.track.album || s.track.title, { small: true });
    $('#pbTitle').textContent = s.track.title;
    $('#pbArtist').textContent = s.track.artist;
    $('#tDur').textContent = fmt(s.duration);
    $('#btnPlay').innerHTML = I(s.playing ? 'pause' : 'play');
    $('#btnPlay').setAttribute('aria-label', s.playing ? 'Pause' : 'Play');
    $('#btnMute').innerHTML = I(s.muted || s.volume === 0 ? 'volumeX' : 'volume');
    $('#volSlider').value = Math.round(s.volume * 100);
    var liked = !!s.liked[s.track.id];
    $('#pbLike').innerHTML = liked ? I('heartFill') : I('heart');
    $('#pbLike').style.color = liked ? 'var(--accent)' : '';
    $('#btnShuffle').setAttribute('aria-pressed', String(s.shuffle));
    $('#btnRepeat').setAttribute('aria-pressed', String(s.repeat !== false));
    $('#btnLyrics').setAttribute('aria-pressed', String(s.lyricsOpen));
    markRows();
  }

  /* The playing equaliser bars are driven by the real analyser level of the
     synthesized tone, so the bars move only while audio is actually flowing. */
  function paintEq() {
    var eq = $('.eq');
    if (!eq) return;
    if (!P.state.playing) { eq.classList.add('paused'); return; }
    eq.classList.remove('paused');
    var lv = P.level();
    var bars = eq.children;
    for (var i = 0; i < bars.length; i++) {
      var k = 0.35 + 0.65 * Math.abs(Math.sin(P.state.position * (2.4 + i * 0.7) + i));
      bars[i].style.transform = 'scaleY(' + Math.max(0.18, Math.min(1, lv * 3.2 * k + 0.2)) + ')';
    }
  }

  function markRows() {
    $$('[data-track-row]').forEach(function (r) {
      r.setAttribute('data-current', String(P.state.track && P.state.track.id === r.dataset.trackRow));
      var idx = $('.row-idx', r);
      if (idx && P.state.track && P.state.track.id === r.dataset.trackRow) {
        var playing = P.state.playing;
        idx.innerHTML = '<span class="eq' + (playing ? '' : ' paused') + '"><i></i><i></i><i></i></span>' +
          '<span class="num" style="display:none">' + (r.dataset.n || '') + '</span>';
      } else if (idx) {
        idx.innerHTML = '<span class="num">' + (r.dataset.n || '') + '</span>';
      }
    });
    $$('[data-card-track]').forEach(function (c) {
      c.setAttribute('data-current', String(P.state.track && P.state.track.id === c.dataset.cardTrack));
    });
  }

  function renderScrub() {
    if (!shellReady) return;
    var s = P.state;
    var fill = $('#scrubFill'), dot = $('#scrubDot'), scrub = $('#scrub');
    if (!fill) return;
    var pct = s.duration ? Math.max(0, Math.min(1, s.position / s.duration)) : 0;
    fill.style.width = (pct * 100) + '%';
    dot.style.left = (pct * 100) + '%';
    $('#tCur').textContent = fmt(s.position);
    if (scrub) scrub.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
    paintEq();
    var np = $('#npScrubFill');
    if (np) {
      np.style.width = (pct * 100) + '%';
      var nd = $('#npScrubDot');
      if (nd) nd.style.left = (pct * 100) + '%';
    }
    var nc = $('#npCur');
    if (nc) nc.textContent = fmt(s.position);
    updateLyric();
  }

  /* ---- Queue panel ----------------------------------------------------- */
  function toggleQueue(force) {
    var q = $('#queuePanel');
    if (!q) return;
    var open = force == null ? q.getAttribute('data-open') !== 'true' : force;
    q.setAttribute('data-open', String(open));
    var b = $('#btnQueue');
    if (b) b.setAttribute('aria-pressed', String(open));
    if (open) renderQueue();
  }
  function closeQueue() { toggleQueue(false); }

  function renderQueue() {
    var list = $('#qList');
    if (!list) return;
    var s = P.state;
    if (!s.queue.length) {
      list.innerHTML = '<div class="empty" style="padding:48px 20px">' +
        '<div class="empty-ico">' + I('queue') + '</div>' +
        '<h3>Queue is empty</h3>' +
        '<p>Play an album or add songs from the ⋯ menu.</p></div>';
      return;
    }
    list.innerHTML = s.queue.map(function (t, i) {
      return '<div class="q-row" draggable="true" data-qi="' + i + '"' +
        (i === s.queueIndex ? ' data-current="true"' : '') + '>' +
        '<span class="q-drag" aria-label="Drag to reorder">' + I('grip') + '</span>' +
        '<span class="row-art">' + A.tile(t.albumId || t.id, t.album || t.title, { small: true }) + '</span>' +
        '<span style="min-width:0;cursor:pointer" data-qplay="' + i + '">' +
        '<span class="q-title">' + esc(t.title) + '</span>' +
        '<span class="q-sub">' + esc(t.artist) + '</span></span>' +
        '<button class="icon-btn" data-qremove="' + i + '" aria-label="Remove ' + esc(t.title) + ' from queue">' +
        I('x') + '</button>' +
        '<span class="q-idx">' + (i + 1) + '</span></div>';
    }).join('');
    wireQueueRows();
  }

  function wireQueueRows() {
    $$('[data-qremove]').forEach(function (b) {
      b.addEventListener('click', function () { P.removeAt(+b.dataset.qremove); });
    });
    $$('[data-qplay]').forEach(function (b) {
      b.addEventListener('click', function () { P.playIndex(+b.dataset.qplay); });
    });
    var dragging = null;
    $$('.q-row').forEach(function (row) {
      row.addEventListener('dragstart', function (e) {
        dragging = +row.dataset.qi;
        row.setAttribute('data-dragging', 'true');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(dragging)); } catch (err) { /* ignore */ }
      });
      row.addEventListener('dragend', function () {
        row.removeAttribute('data-dragging');
        $$('.q-row').forEach(function (r) { r.removeAttribute('data-dropbefore'); });
        dragging = null;
      });
      row.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (dragging == null) return;
        $$('.q-row').forEach(function (r) { r.removeAttribute('data-dropbefore'); });
        row.setAttribute('data-dropbefore', 'true');
      });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        var to = +row.dataset.qi;
        if (dragging != null && dragging !== to) P.move(dragging, to);
      });
    });
  }

  function wireQueue() {
    $('#qClose').addEventListener('click', closeQueue);
    $('#qClear').addEventListener('click', function () { P.clearQueue(); toast('Queue cleared'); });
    $('#qShuffle').addEventListener('click', function () {
      var s = P.state;
      if (s.queue.length < 2) { toast('Add more songs to shuffle'); return; }
      var cur = s.queue[s.queueIndex];
      var rest = s.queue.filter(function (_, i) { return i !== s.queueIndex; });
      for (var i = rest.length - 1; i > 0; i--) {
        var j = Math.floor(A.hash('sh' + i + rest.length) % (i + 1));
        var t = rest[i]; rest[i] = rest[j]; rest[j] = t;
      }
      P.setQueue([cur].concat(rest), 0);
      toast('Queue shuffled');
    });
    $$('[data-qtab]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-qtab]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
  }

  /* ---- Now Playing surface + lyrics ------------------------------------ */
  var npOpen = false;
  var npEl = null;

  function openNowPlaying(lyrics) {
    var s = P.state;
    if (!s.track) { toast('Nothing is playing'); return; }
    s.lyricsOpen = !!lyrics;
    if (npOpen) { updateLyric(); $('#btnLyrics').setAttribute('aria-pressed', String(s.lyricsOpen)); return; }
    npOpen = true;
    var t = s.track;
    var ramp = A.ramp(t.albumId || t.id);
    var lines = (D.lyrics[t.id] || demoLyrics(t)).map(function (l, i) {
      return '<button class="lyric-line" data-ly="' + i + '" data-t="' + l[0] + '">' + esc(l[1]) + '</button>';
    }).join('');

    npEl = el(
      '<section class="np-surface" role="dialog" aria-label="Now Playing" ' +
      'style="--np-c1:' + ramp.c1 + ';--np-c2:' + ramp.c2 + ';--np-c3:' + ramp.c3 + ';--np-c4:' + ramp.c4 + '">' +
      '<div class="np-backdrop" style="' + A.backdrop(t.albumId || t.id, t.album) + '"></div>' +
      '<div class="np-scrim"></div>' +
      '<div class="np-chrome">' +
      '<div class="np-top">' +
      '<button class="tbtn" id="npClose" aria-label="Close Now Playing">' + I('chevD') + '</button>' +
      '<div class="np-context"><div class="np-eyebrow">Playing from</div>' +
      '<div class="np-context-title">' + esc(t.album || 'Queue') + '</div></div>' +
      '<button class="tbtn" id="npMore" aria-label="More">' + I('more') + '</button>' +
      '</div>' +
      '<div class="np-body">' +
      '<div class="np-left">' +
      '<div class="np-art" id="npArt" role="button" tabindex="0" aria-label="Toggle lyrics">' +
      A.tile(t.albumId || t.id, t.album || t.title) + '</div>' +
      '<div style="text-align:center">' +
      '<h1 class="np-title">' + esc(t.title) + (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</h1>' +
      '<div class="np-artist">' + esc(t.artist) + '</div></div>' +
      '</div>' +
      '<div class="np-right">' +
      '<div class="dialog-head" style="padding:0 0 10px;border:0;position:static;background:none">' +
      I('lyrics') + '<h2>Lyrics</h2>' +
      '<div style="flex:1"></div>' +
      '<span class="demo-note">demo clock</span></div>' +
      '<div class="lyrics" id="lyricsList">' + lines + '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn btn-glass" id="npLrc">' + I('download') + 'Export .lrc</button>' +
      '<button class="btn btn-glass" id="npEmph">' + I('sparkle') + 'Line emphasis: ' +
      (P.state.lineEmphasis === 'animated' ? 'Animated' : 'Static') + '</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="np-foot">' +
      '<div class="np-transport">' +
      '<button class="np-btn" id="npPrev" aria-label="Previous track">' + I('prev') + '</button>' +
      '<button class="tbtn sm" id="npShuffle" aria-label="Shuffle">' + I('shuffle') + '</button>' +
      '<button class="np-btn np-play" id="npPlay" aria-label="Play">' + I('play') + '</button>' +
      '<button class="tbtn sm" id="npRepeat" aria-label="Repeat">' + I('repeat') + '</button>' +
      '<button class="np-btn" id="npNext" aria-label="Next track">' + I('next') + '</button>' +
      '</div>' +
      '<div class="np-scrub">' +
      '<span class="pb-time" id="npCur">0:00</span>' +
      '<div class="scrub" id="npScrub" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="scrub-fill" id="npScrubFill"></div><div class="scrub-dot" id="npScrubDot"></div></div>' +
      '<span class="pb-time" id="npDur">0:00</span>' +
      '</div></div>' +
      '</div></div></section>');

    document.body.appendChild(npEl);
    wireNowPlaying();
    P.emit('change', P.state);
  }

  function demoLyrics(t) {
    // Deterministic static lyric block for tracks without a hand-written set.
    var seed = A.hash(t.id);
    var bank = [
      ['First verse opens', 'a little low and late'],
      ['The chorus lands', 'and the room turns over'],
      ['Instrumental break —', 'demo tone, synthesized'],
      ['Bridge: hold the note,', 'let the envelope fall'],
      ['Last chorus, same words,', 'higher register now'],
      ['Outro fades on the', 'generated demo clock'],
      ['(instrumental)', '· synthesized ·']
    ];
    var out = [];
    var off = seed % 7;
    for (var i = 0; i < bank.length; i++) {
      out.push([i * 4.4 + (off % 3), bank[i][0] + ' ' + bank[i][1]]);
    }
    return out;
  }

  function wireNowPlaying() {
    var np = npEl;
    if (!np) return;
    $('#npClose', np).addEventListener('click', closeNowPlaying);
    $('#npPlay', np).addEventListener('click', function () { P.toggle(); });
    $('#npNext', np).addEventListener('click', function () { P.next(); rebuildNowPlaying(); });
    $('#npPrev', np).addEventListener('click', function () { P.prev(); rebuildNowPlaying(); });
    $('#npShuffle', np).addEventListener('click', function () {
      P.state.shuffle = !P.state.shuffle;
      renderPlayer();
      toast('Shuffle ' + (P.state.shuffle ? 'on' : 'off'));
    });
    $('#npRepeat', np).addEventListener('click', function () {
      P.state.repeat = P.state.repeat === false ? 'all' : P.state.repeat === 'all' ? 'one' : false;
      renderPlayer();
      toast('Repeat: ' + P.state.repeat);
    });
    $('#npArt', np).addEventListener('click', function () {
      P.state.lyricsOpen = !P.state.lyricsOpen;
      updateLyric();
    });
    $('#npMore', np).addEventListener('click', function (e) {
      e.stopPropagation();
      trackMenu(P.state.track, 0, 0, this);
    });
    $('#npLrc', np).addEventListener('click', function () { toast('Exporting a .lrc is disabled in this static demo'); });
    $('#npEmph', np).addEventListener('click', function () {
      P.state.lineEmphasis = P.state.lineEmphasis === 'animated' ? 'static' : 'animated';
      this.innerHTML = I('sparkle') + 'Line emphasis: ' + (P.state.lineEmphasis === 'animated' ? 'Animated' : 'Static');
      updateLyric();
    });
    var scrub = $('#npScrub', np);
    function seekAt(e) {
      var r = scrub.getBoundingClientRect();
      var x = (e.clientX == null ? 0 : e.clientX) - r.left;
      P.seek(Math.max(0, Math.min(1, x / r.width)) * P.state.duration);
    }
    scrub.addEventListener('pointerdown', function (e) { scrub.setPointerCapture(e.pointerId); seekAt(e); });
    scrub.addEventListener('pointermove', function (e) { if (e.buttons) seekAt(e); });
    scrub.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); P.skip(5); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); P.skip(-5); }
    });
    $$('[data-ly]', np).forEach(function (b) {
      b.addEventListener('click', function () { P.seek(parseFloat(b.dataset.t)); });
    });
    $('#npDur', np).textContent = fmt(P.state.duration);
    updateLyric();
  }

  function rebuildNowPlaying() {
    if (!npOpen) return;
    closeNowPlaying(true);
    openNowPlaying(P.state.lyricsOpen);
  }

  function closeNowPlaying(silent) {
    if (!npEl) { npOpen = false; return; }
    npEl.remove();
    npEl = null;
    npOpen = false;
    if (!silent) $('#btnLyrics').setAttribute('aria-pressed', 'false');
  }

  function updateLyric() {
    if (!npOpen || !npEl) return;
    var list = $('#lyricsList', npEl);
    if (!list) return;
    var pos = P.state.position;
    var items = $$('[data-ly]', list);
    var idx = -1;
    items.forEach(function (b, i) {
      if (parseFloat(b.dataset.t) <= pos) idx = i;
    });
    var emph = P.state.lineEmphasis === 'animated';
    items.forEach(function (b, i) {
      b.classList.toggle('static-em', !emph);
      b.setAttribute('data-active', String(i === idx));
      b.setAttribute('data-done', String(i < idx));
    });
    if (idx >= 0 && items[idx]) {
      var r = items[idx].getBoundingClientRect(), lr = list.getBoundingClientRect();
      if (r.top < lr.top + 20 || r.bottom > lr.bottom - 20) {
        list.scrollTop += (r.top - lr.top) - lr.height / 2 + r.height / 2;
      }
    }
    var npBody = $('.np-body', npEl);
    if (npBody) npBody.setAttribute('data-lyrics', String(P.state.lyricsOpen));
  }

  function goNowPlaying() { if (P.state.track) openNowPlaying(true); }

  /* ---- Keyboard shortcuts dialog --------------------------------------- */
  function comboHtml(combo) {
    return combo.map(function (k) { return '<kbd>' + esc(k) + '</kbd>'; }).join('');
  }
  function shortcutsDialog() {
    var cols = [
      D.shortcuts.slice(0, 3),
      D.shortcuts.slice(3, 5),
      D.shortcuts.slice(5)
    ];
    var html = '<div class="scrim" role="dialog" aria-label="Keyboard shortcuts"><div class="dialog">' +
      '<div class="dialog-head">' + I('file') + '<h2>Keyboard Shortcuts</h2>' +
      '<span class="note">· Music’s defaults, ⌘ → Ctrl on this keyboard</span>' +
      '<div style="flex:1"></div>' +
      '<button class="btn btn-glass" id="ksCustom">Customise</button>' +
      '<button class="icon-btn" data-close aria-label="Close">' + I('x') + '</button></div>' +
      '<div class="dialog-body"><div class="ks-grid">' +
      cols.map(function (set) {
        return set.map(function (grp) {
          return '<div class="ks-group"><h3>' + esc(grp.g) + '</h3>' +
            grp.rows.map(function (r) {
              return '<div class="ks-row"><span class="label">' + esc(r.l) + '</span>' +
                '<span class="combo">' + comboHtml(r.c) +
                (r.alt ? '<span class="or">or</span>' + comboHtml(r.alt) : '') +
                '</span></div>' + (r.note ? '<div class="ks-note">' + esc(r.note) + '</div>' : '');
            }).join('') + '</div>';
        }).join('');
      }).join('') +
      '</div>' +
      '<div style="margin-top:8px;border-top:1px solid var(--color-line);padding-top:14px">' +
      '<h3 style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-faint);margin-bottom:6px">' +
      'Music shortcuts with no Octave equivalent · 28</h3>' +
      '<div class="t-sm muted">Rename Track…, Duplicate, Get Album Artwork, Import…, Library Preferences, ' +
      'Play Library Music, Show/Hide Sidebar, Show/Hide Status Bar, Show/Hide Toolbar and Control Strip, ' +
      'Update Song Rating, Get Song Menu, Show Current Song Menu, Show Main Menu, Show View Menu, and more from Music.app.</div>' +
      '</div></div>' +
      '<div class="dialog-foot">Shortcuts pause while you type in a field · ' +
      'press <kbd>?</kbd> anywhere to reopen this</div></div></div>';
    var wrap = el(html);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || e.target.closest('[data-close]')) wrap.remove();
    });
    $('#ksCustom', wrap).addEventListener('click', function () { toast('Customising shortcuts is disabled in this demo'); });
    document.body.appendChild(wrap);
  }

  /* ---- Keyboard -------------------------------------------------------- */
  function typing(e) {
    var t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      if (typing(e)) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      var ctrl = e.ctrlKey || e.metaKey;
      var k = e.key;

      if (k === '?') { e.preventDefault(); shortcutsDialog(); return; }
      if (k === '/' && !ctrl) { e.preventDefault(); location.href = 'search.html'; return; }
      if (ctrl && (k === 'f' || k === 'F')) { e.preventDefault(); location.href = 'search.html'; return; }
      if (ctrl && k === ',') { e.preventDefault(); location.href = 'settings.html'; return; }
      if (ctrl && e.altKey && k === '1') { e.preventDefault(); location.href = 'index.html'; return; }
      if (ctrl && e.altKey && k === '2') { e.preventDefault(); location.href = 'new.html'; return; }
      if (ctrl && e.altKey && k === '3') { e.preventDefault(); location.href = 'radio.html'; return; }
      if (ctrl && k === '1') { e.preventDefault(); location.href = 'library.html?tab=recently-added'; return; }
      if (ctrl && k === '2') { e.preventDefault(); location.href = 'library.html?tab=artists'; return; }
      if (ctrl && k === '3') { e.preventDefault(); location.href = 'library.html?tab=albums'; return; }
      if (ctrl && k === '4') { e.preventDefault(); location.href = 'library.html?tab=songs'; return; }
      if (ctrl && k === '5') { e.preventDefault(); location.href = 'browse.html'; return; }
      if (ctrl && k === 'i') { e.preventDefault(); if (P.state.track) showInfo(P.state.track); return; }
      if (ctrl && k === 'u' || (ctrl && e.shiftKey && k === 'U')) {
        e.preventDefault(); openNowPlaying(true); return;
      }
      if (ctrl && (k === 'u' || k === 'U') || k === 'q') {
        if (k === 'q') { e.preventDefault(); toggleQueue(true); return; }
      }
      if (ctrl && e.altKey && (k === 'u' || k === 'U')) { e.preventDefault(); toggleQueue(true); return; }

      if (k === ' ') { e.preventDefault(); P.toggle(); return; }
      if (ctrl && k === '.') { e.preventDefault(); P.stop(); return; }
      if (k === 'ArrowRight' && ctrl) { e.preventDefault(); P.next(); return; }
      if (k === 'ArrowLeft' && ctrl) { e.preventDefault(); P.prev(); return; }
      if (ctrl && e.altKey && k === 'ArrowRight') { e.preventDefault(); P.skip(10); return; }
      if (ctrl && e.altKey && k === 'ArrowLeft') { e.preventDefault(); P.skip(-10); return; }
      if (k === 'ArrowUp' && ctrl) { e.preventDefault(); P.nudgeVolume(0.05); return; }
      if (k === 'ArrowDown' && ctrl) { e.preventDefault(); P.nudgeVolume(-0.05); return; }
      if (k === 'm' || k === 'M') { e.preventDefault(); P.toggleMute(); return; }
      if (k === 's' || k === 'S') { e.preventDefault(); P.state.shuffle = !P.state.shuffle; renderPlayer(); toast('Shuffle ' + (P.state.shuffle ? 'on' : 'off')); return; }
      if (k === 'r' || k === 'R') {
        e.preventDefault();
        P.state.repeat = P.state.repeat === false ? 'all' : P.state.repeat === 'all' ? 'one' : false;
        renderPlayer(); toast('Repeat: ' + P.state.repeat); return;
      }
      if (k === 'l' || k === 'L') {
        e.preventDefault();
        if (P.state.track) { P.toggleLike(P.state.track.id); toast(P.state.liked[P.state.track.id] ? 'Loved' : 'Unloved'); }
        return;
      }
      if (k === 'n' || k === 'N') { e.preventDefault(); openNowPlaying(false); return; }
      if (k === '[' && ctrl) { e.preventDefault(); history.back(); return; }
      if (k === ']' && ctrl) { e.preventDefault(); history.forward(); return; }
    });
  }

  /* ---- Shared render helpers ------------------------------------------- */
  function storePick() {
    var sf = D.storefronts[0];
    return '<button class="store-pick" id="storePick"><span class="flag">' + sf.flag + '</span>' +
      '<span>' + sf.code + '</span>' + I('chevD') + '</button>';
  }
  function wireStorePick() {
    var b = $('#storePick');
    if (!b) return;
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      menu(D.storefronts.map(function (s) {
        return {
          label: s.name + ' (' + s.code + ')', icon: s.code === 'US' ? 'star' : 'compass',
          check: s.code === 'US',
          on: function () { b.innerHTML = '<span class="flag">' + s.flag + '</span><span>' + s.code + '</span>' + I('chevD'); toast('Storefront: ' + s.name); }
        };
      }), 0, 0, b);
    });
  }

  /* Album / track / playlist cards */
  function albumCard(al, opts) {
    opts = opts || {};
    var href = opts.href || 'album.html?a=' + al.id;
    return '<a class="card" href="' + href + '" data-card-track="' + (al.trackId || '') + '">' +
      '<div class="card-art">' + (al.thumb ? A.img(al.thumb, al.title) : A.tile(al.id, al.title)) +
      '<span class="card-hover-play">' + I('play') + '</span></div>' +
      '<div class="card-body"><div class="card-title">' + esc(al.title) + '</div>' +
      '<div class="card-sub">' + esc(al.sub || al.artist || '') + '</div></div></a>';
  }

  function songRow(t, i, opts) {
    opts = opts || {};
    return '<div class="row' + (opts.cols ? ' row-2col' : '') + '" data-track-row="' + t.id + '" data-n="' + (i + 1) + '" tabindex="0">' +
      '<div class="row-idx"><span class="num">' + (i + 1) + '</span></div>' +
      '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
      (t.thumb ? A.img(t.thumb, t.album || t.title, { small: true }) : A.tile(t.albumId || t.id, t.album || t.title, { small: true })) +
      '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
      '<div class="row-main"><div class="row-title">' + esc(t.title) +
      (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
      '<div class="row-sub">' + esc(t.artist) + '</div></div>' +
      (opts.cols ? '<div class="row-meta col-artist">' + esc(t.artist) + '</div>' +
        '<div class="row-meta col-plays">' + (t.plays || '—') + '</div>' : '') +
      '<div class="row-meta">' + fmt(t.dur) + '</div>' +
      '<div class="row-actions">' +
      '<button class="icon-btn" data-enq="' + t.id + '" aria-label="Add to queue">' + I('queue') + '</button>' +
      '<button class="icon-btn" data-like="' + t.id + '" aria-label="Favorite">' +
      (P.state.liked[t.id] ? I('heartFill') : I('heart')) + '</button>' +
      '<button class="icon-btn" data-more="' + t.id + '" aria-label="More">' + I('more') + '</button>' +
      '</div></div>';
  }

  function wireRows(root) {
    (root || document).querySelectorAll('[data-play]').forEach(function (n) {
      n.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = n.dataset.play;
        var t = D.trackById[id];
        if (!t) return;
        if (P.state.track && P.state.track.id === id) P.toggle();
        else { P.play(t); P.setQueue(queueFor(t)); }
      });
    });
    (root || document).querySelectorAll('[data-enq]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = D.trackById[b.dataset.enq];
        P.enqueue(t);
        toast('Added to queue: ' + t.title);
      });
    });
    (root || document).querySelectorAll('[data-like]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = b.dataset.like;
        P.toggleLike(id);
        b.innerHTML = P.state.liked[id] ? I('heartFill') : I('heart');
        b.style.color = P.state.liked[id] ? 'var(--accent)' : '';
        toast(P.state.liked[id] ? 'Loved' : 'Removed from Liked Songs');
      });
    });
    (root || document).querySelectorAll('[data-more]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        trackMenu(D.trackById[b.dataset.more], 0, 0, b);
      });
    });
    (root || document).querySelectorAll('[data-cardplay]').forEach(function (c) {
      c.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var t = D.trackById[c.dataset.cardplay];
        if (!t) return;
        P.play(t);
        P.setQueue(queueFor(t));
      });
    });
    markRows();
  }

  function queueFor(t) {
    if (t.albumId) {
      var list = D.tracks.filter(function (x) { return x.albumId === t.albumId; });
      if (list.length) return list;
    }
    return [t];
  }

  function playCollection(list, startIdx) {
    if (!list.length) { toast('Nothing to play'); return; }
    P.setQueue(list, startIdx || 0);
    P.playIndex(startIdx || 0);
  }

  function emptyState(icon, title, body, ctaHref, ctaLabel) {
    return '<div class="empty">' +
      '<div class="empty-ico">' + I(icon) + '</div>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(body) + '</p>' +
      (ctaHref ? '<a class="btn btn-glass" style="margin-top:8px" href="' + ctaHref + '">' +
        esc(ctaLabel || 'Find music') + '</a>' : '') + '</div>';
  }

  root.OCT = {
    esc: esc, fmt: fmt, fmtLong: fmtLong, el: el, $: $, $$: $$,
    icon: I, art: A, data: D, player: P,
    init: init, toast: toast, menu: menu, trackMenu: trackMenu,
    collectionMenu: collectionMenu, shortcutsDialog: shortcutsDialog,
    openNowPlaying: openNowPlaying, closeNowPlaying: closeNowPlaying,
    toggleQueue: toggleQueue, renderPlayer: renderPlayer, markRows: markRows,
    storePick: storePick, wireStorePick: wireStorePick,
    albumCard: albumCard, songRow: songRow, wireRows: wireRows,
    queueFor: queueFor, playCollection: playCollection, emptyState: emptyState,
    showInfo: showInfo
  };
})(window);