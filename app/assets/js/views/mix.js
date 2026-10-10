// Aubade mix: an automatic queue built from everything available right now —
// imported local tracks plus live YTM picks — shuffled and playable in one tap.
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'radio' });
  var view = ctx.view;

  function mixPool() {
    var pool = D.tracks.filter(function (t) {
      return t.source === 'local' || t.source === 'ytm';
    });
    if (!pool.length) pool = D.tracks.slice(0, 25);
    return pool;
  }

  function build() {
    var pool = mixPool();
    var shuffled = pool.slice().sort(function () { return Math.random() - 0.5; });
    var picked = shuffled.slice(0, 20);

    var seed = picked[0] || { id: 'mix', title: 'Your Mix', artist: '' };

    view.innerHTML =
      '<h1>Mix</h1>' +
      '<section class="shelf" style="margin-top:32px">' +
      '<div class="shelf-head">' +
      '<div class="list-art" style="width:160px;height:160px;border-radius:12px">' +
      A.tile(seed.albumId || seed.id, seed.title) + '</div>' +
      '<div class="grow" style="padding:20px 0 0 20px">' +
      '<div class="faint" style="font-size:12px;letter-spacing:.08em">AUTOMATIC MIX</div>' +
      '<h2 style="font-size:32px;letter-spacing:-.03em;margin:4px 0 8px">Mix for you</h2>' +
      '<div class="muted">' + picked.length + ' songs · refreshed every visit · ' +
      (D.mode === 'live' || D.mode === 'local' ? 'your library' : 'quick picks') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
      '<button class="btn btn-glass" id="playMix">' + I('play') + 'Play mix</button>' +
      '<button class="btn btn-glass" id="refreshMix">' + I('shuffle') + 'Reshuffle</button>' +
      '</div></div></div>' +
      (picked.length
        ? '<div class="panel" style="padding:8px 12px;margin-top:20px"><div class="rows">' +
          picked.map(function (t, i) { return OCT.songRow(t, i); }).join('') +
          '</div></div>'
        : OCT.emptyState('mix', 'Nothing to mix yet', 'Import a folder in Settings or connect the streaming worker, then come back.')) +
      '</section>';

    OCT.wireRows(view);
    $('#playMix').addEventListener('click', function () {
      if (!picked.length) { OCT.toast('Nothing to play'); return; }
      OCT.playCollection(picked, 0);
      OCT.toast('Playing your mix');
    });
    $('#refreshMix').addEventListener('click', function () { build(); });
  }

  build();
})();
