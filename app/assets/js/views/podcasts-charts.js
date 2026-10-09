/* Podcasts Top Charts — 20 category chips + ranked show/episode lists. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: 'podcasts' });
  var view = ctx.view;
  var activeCat = 'All Categories';

  function showGrid(list) {
    return '<div class="card-grid card-grid-6">' + list.map(function (s, i) {
      return '<a class="card" href="' + (s.href || 'podcast-show.html') + '">' +
        '<div class="card-art">' + A.tile('pod-' + s.title, s.title) +
        '<span class="card-hover-play">' + I('play') + '</span></div>' +
        '<div class="card-body">' +
        '<div class="faint t-xs">' + (i + 1) + '</div>' +
        '<div class="card-title">' + esc(s.title) +
        (s.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
        '<div class="card-sub">' + esc(s.publisher) + '</div></div></a>';
    }).join('') + '</div>';
  }

  function episodeList(cat) {
    var rows = D.episodesLightBox.concat(D.episodesTrailers);
    if (cat !== 'All Categories') {
      rows = rows.slice(0, 4).concat(rows.slice(2, 5));
    }
    return '<div class="panel">' + rows.map(function (e, i) {
      return '<div class="list-row"><div class="list-num">' + (i + 1) + '</div>' +
        '<div class="list-art">' + A.tile('epc-' + e.title, 'EP', { small: true }) + '</div>' +
        '<div class="grow"><div class="faint t-xs">' + esc(e.date) + '</div>' +
        '<div class="list-title">' + esc(e.title) + '</div>' +
        '<div class="list-sub">' + esc(e.show || 'Light Box') + '</div></div>' +
        '<span class="badge-lossless">' + esc(e.dur) + '</span></div>';
    }).join('') + '</div>';
  }

  function paint() {
    $('#shows').innerHTML = showGrid(D.shows);
    $('#episodes').innerHTML = episodeList(activeCat);
    OCT.$$('[data-cat]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.cat === activeCat);
    });
  }

  view.innerHTML =
    '<a class="eyebrow-row" href="podcasts.html" style="color:var(--color-faint);margin-bottom:10px">' +
    I('chevL') + '<span class="t-sm" style="font-weight:600">Podcasts</span></a>' +
    '<h1>Top Charts</h1>' +
    '<div class="muted" style="margin-top:4px">The most popular shows and episodes on Apple Podcasts right now.</div>' +
    '<div class="chips" style="margin-top:20px" id="cats">' +
    D.podcastChartCategories.map(function (c) {
      return '<button class="chip' + (c === activeCat ? ' on' : '') + '" data-cat="' + esc(c) + '">' +
        esc(c) + '</button>';
    }).join('') + '</div>' +
    '<section class="shelf" style="margin-top:34px"><div class="shelf-head">' +
    '<div class="shelf-title"><h2>Top Shows</h2></div></div><div id="shows"></div></section>' +
    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Top Episodes</h2></div></div><div id="episodes"></div></section>';

  paint();
  OCT.$$('[data-cat]').forEach(function (b) {
    b.addEventListener('click', function () { activeCat = b.dataset.cat; paint(); });
  });
})();