/* Podcast show — art, title, publisher link, rating, genres, description,
   Latest Episode / Follow / ⋯, Episodes + Trailers lists, About + Information. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: 'podcasts' });
  var view = ctx.view;

  var ABOUT = "Mark Henry Phillips has spent twenty years making music for a living. Then one night he typed a few words into an AI music generator and it did his job better than he ever could. In ten seconds. Basically for free. Light Box is what happened next: a season-long investigation into what AI is doing to music and the people who love it. What happens when a machine can do the thing you thought made you, you?";

  function episodeRow(e, kind) {
    return '<div class="list-row">' +
      '<div class="list-art">' + A.tile('ep-' + e.title, kind, { small: true }) + '</div>' +
      '<div class="grow">' +
      '<div class="faint t-xs">' + esc(e.date) + ' · ' + esc(e.code) + '</div>' +
      '<div class="list-title">' + esc(e.title) + '</div>' +
      '<div class="list-sub">' + esc(e.blurb) + '</div></div>' +
      '<span class="badge-lossless" style="height:26px">' + esc(e.dur) + '</span>' +
      '<button class="btn btn-accent" data-ep="' + esc(e.title) + '">' + I('play') + '</button>' +
      '<button class="icon-btn" data-epmore="' + esc(e.title) + '" aria-label="More">' + I('more') + '</button>' +
      '</div>';
  }

  view.innerHTML =
    '<div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap;margin-top:8px">' +
    '<div style="width:216px;height:216px;border-radius:12px;overflow:hidden;flex:none">' +
    A.tile('ps-lightbox', 'LIGHT BOX') + '</div>' +
    '<div style="flex:1;min-width:280px">' +
    '<div style="display:flex;align-items:flex-start;gap:12px">' +
    '<div style="flex:1"><h1 style="font-size:40px;line-height:44px">Light Box</h1>' +
    '<div class="muted" style="margin-top:4px">Mark Henry Phillips &amp; Radiotopia</div></div>' +
    '<button class="icon-btn" id="shShow" aria-label="Share">' + I('share') + '</button>' +
    '<button class="icon-btn" id="moShow" aria-label="More">' + I('more') + '</button>' +
    '</div>' +
    '<div class="t-sm muted" style="margin-top:10px">5.0 (87) · <a href="#" style="color:var(--accent)">Music Commentary</a> · Weekly Series</div>' +
    '<p class="muted" style="margin-top:16px;max-width:820px;line-height:25px">' + esc(ABOUT) + '</p>' +
    '<div style="margin-top:10px"><a class="see-all" href="#about" style="color:var(--accent)">MORE</a></div>' +
    '<div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">' +
    '<button class="btn btn-lg" id="latest" style="background:#fff;color:#000">' + I('play') +
    'Latest Episode</button>' +
    '<button class="btn btn-lg btn-glass" id="follow">' + I('plus') + 'Follow</button>' +
    '</div></div></div>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Episodes</h2></div><a class="see-all" href="#">See all</a></div>' +
    '<div class="panel" id="eps">' +
    D.episodesLightBox.map(function (e) { return episodeRow(e, 'EPISODE'); }).join('') + '</div>' +
    '<div class="t-sm faint" style="margin-top:10px">See All (7)</div></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Trailers</h2></div></div>' +
    '<div class="panel">' +
    D.episodesTrailers.map(function (e) { return episodeRow(e, 'TRAILER'); }).join('') +
    '</div></section>' +

    '<section class="shelf" id="about"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>About</h2></div></div>' +
    '<p class="muted" style="max-width:820px;line-height:25px">' + esc(ABOUT) + '</p></section>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Information</h2></div></div>' +
    '<div class="panel">' + D.lightBoxInfo.map(function (r) {
      var isUrl = /Website|Feed|Apple Podcasts/.test(r[0]);
      return '<div class="list-row"><div class="grow"><div class="faint t-sm">' + esc(r[0]) +
        '</div><div class="list-title"' + (isUrl ? ' style="color:var(--accent)"' : '') + '>' +
        esc(r[1]) + '</div></div>' +
        (r[0] === 'Apple Podcasts' ? '<span class="see-all">View</span>' : '') + '</div>';
    }).join('') + '</div></section>';

  function playEp(title) {
    var seeds = D.tracks.filter(function (t) { return !t.albumId; }).slice(0, 8);
    OCT.playCollection(seeds, 0);
    OCT.toast('Playing “' + title + '” — demo tone, no podcast audio');
  }
  $('#latest').addEventListener('click', function () { playEp(D.episodesLightBox[4].title); });
  $('#follow').addEventListener('click', function () { OCT.toast('Following Light Box'); });
  $('#shShow').addEventListener('click', function () { OCT.toast('Share link copied (demo)'); });
  $('#moShow').addEventListener('click', function (e) {
    e.stopPropagation();
    OCT.menu([
      { label: 'Play latest episode', icon: 'play', on: function () { playEp(D.episodesLightBox[4].title); } },
      { label: 'Add to queue', icon: 'queue', on: function () { OCT.toast('Added to queue'); } },
      { label: 'Go to show', icon: 'external', on: function () { location.reload(); } }
    ], 0, 0, this);
  });
  OCT.$$('[data-ep]').forEach(function (b) {
    b.addEventListener('click', function () { playEp(b.dataset.ep); });
  });
  OCT.$$('[data-epmore]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      OCT.menu([
        { label: 'Play episode', icon: 'play', on: function () { playEp(b.dataset.epmore); } },
        { label: 'Add to queue', icon: 'queue', on: function () { OCT.toast('Added to queue'); } },
        { label: 'Add to playlist', icon: 'listPlus', on: function () { OCT.toast('Account-gated'); } },
        { sep: 1 },
        { label: 'Show information', icon: 'info', on: function () { OCT.toast('Episode info'); } }
      ], 0, 0, b);
    });
  });
})();