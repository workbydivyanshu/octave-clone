/* Aubade player UI: playerbar, queue panel, Now Playing surface */
(function (root) {
  'use strict';

  var P = root.OCT_PLAYER;
  var I = root.OCT_ICON;
  var A = root.OCT_ART;
  var D = root.AUBADE_DATA;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
      .replace(/"/g, '"').replace(/'/g, ''');
  }

  function fmt(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---- Player Bar ------------------------------------------------------ */
  var playerBarHtml =
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
    '</div></div>';

  function buildPlayerBar() {
    return el(playerBarHtml);
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

  /* ---- Queue Panel (inside Now Playing) -------------------------------- */
  var queuePanelHtml =
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
    '</div></aside>';

  function buildQueuePanel() {
    return el(queuePanelHtml);
  }

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
      b.addEventEventListener('click', function () {
        $$('[data-qtab]').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      });
    });
  }

  /* ---- Now Playing surface + lyrics ------------------------------------ */
  var npOpen = false;
  var npEl = null;

  function demoLyrics(t) {
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

  /* ---- Shared render helpers ------------------------------------------- */
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

  /* ---- Exports --------------------------------------------------------- */
  root.OCT_PLAYER_UI = {
    buildPlayerBar: buildPlayerBar,
    wirePlayerBar: wirePlayerBar,
    renderPlayer: renderPlayer,
    renderScrub: renderScrub,
    buildQueuePanel: buildQueuePanel,
    wireQueue: wireQueue,
    renderQueue: renderQueue,
    toggleQueue: toggleQueue,
    closeQueue: closeQueue,
    openNowPlaying: openNowPlaying,
    closeNowPlaying: closeNowPlaying,
    rebuildNowPlaying: rebuildNowPlaying,
    goNowPlaying: goNowPlaying,
    updateLyric: updateLyric,
    markRows: markRows,
    queueFor: queueFor,
    paintEq: paintEq,
    demoLyrics: demoLyrics,
    esc: esc,
    fmt: fmt,
    $: $,
    $$: $$,
    el: el,
    I: I,
    A: A,
    D: D,
    P: P
  };
})(window);