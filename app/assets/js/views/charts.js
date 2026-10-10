/* Charts — "Today's biggest, right now." ranked 1..100 with duration column,
   plus city charts. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'charts' });
  var view = ctx.view;
  var params = new URLSearchParams(location.search);
  var city = params.get('city');

  // Ranked list is the demo catalogue, expanded to 100 entries deterministically.
  var RS = D.realShelves || [];
  var realChart = RS.filter(function (s) { return s.tracks.length; })[0];
  var ranked;
  if (realChart) {
    ranked = realChart.tracks;
  } else {
    var singles = D.tracks.filter(function (t) { return !t.albumId; });
    ranked = [];
    for (var i = 0; i < 100; i++) ranked.push(singles[i % singles.length]);
  }

  function rows(tracks, offset) {
    return '<div class="panel" style="padding:8px 12px"><div class="rows">' +
      tracks.map(function (t, i) {
        var n = (offset || 0) + i + 1;
        return '<div class="row row-2col" data-track-row="' + t.id + '" data-n="' + n + '" tabindex="0">' +
          '<div class="row-idx"><span class="num">' + n + '</span></div>' +
          '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
          A.tile(t.albumId || t.id, t.album || t.title, { small: true }) +
          '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
          '<div class="row-main"><div class="row-title">' + esc(t.title) +
          (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
          '<div class="row-sub">' + esc(t.artist) + '</div></div>' +
          '<div class="row-meta col-artist">' + esc(t.artist) + '</div>' +
          '<div class="row-meta col-plays">' + (900 - i * 7) + '</div>' +
          '<div class="row-meta">' + fmt(t.dur) + '</div>' +
          '<div class="row-actions">' +
          '<button class="icon-btn" data-enq="' + t.id + '" aria-label="Add to queue">' + I('queue') + '</button>' +
          '<button class="icon-btn" data-like="' + t.id + '" aria-label="Favorite">' +
          (P.state.liked[t.id] ? I('heartFill') : I('heart')) + '</button>' +
          '<button class="icon-btn" data-more="' + t.id + '" aria-label="More">' + I('more') + '</button>' +
          '</div></div>';
      }).join('') + '</div></div>';
  }

  view.innerHTML =
    '<div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:240px">' +
    '<div class="eyebrow-row" style="color:var(--accent)">' + I('trend') +
    '<h1>Charts</h1></div>' +
    '<div class="muted" style="margin-top:6px">' +
    (city ? esc(city) + ' — Top 25 today' : "Today's biggest, right now.") + '</div></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="btn btn-glass" id="playAll">' + I('play') + 'Play all</button>' +
    '<button class="btn btn-glass" id="shuffleAll">' + I('shuffle') + 'Shuffle</button>' +
    OCT.storePick() + '</div></div>' +

    '<section class="shelf" style="margin-top:32px">' +
    '<div class="shelf-head"><div class="shelf-title">' + I('fire') + '<h2>Top songs</h2></div></div>' +
    '<div class="rowhead row-2col">' +
    '<button class="num-sort" id="sortNum" aria-label="Sort by rank"># ' +
    '<span style="display:inline-flex;vertical-align:-1px"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg></span></button>' +
    '<span class="rh-art"></span><span class="rh-name">Name</span>' +
    '<span class="col-artist" style="text-align:left">Artist</span>' +
    '<span class="col-plays" style="text-align:left">Plays</span>' +
    '<span style="text-align:left">Time</span><span></span></div>' +
    '<div id="list">' + rows(ranked.slice(0, city ? 25 : 100)) + '</div></section>' +

    (city ? '' :
    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' + I('compass') +
    '<h2>Top by city</h2></div></div>' +
    '<div class="cat-grid">' + D.cities.map(function (c) {
      return '<a class="cat-card" href="charts.html?city=' + encodeURIComponent(c) +
        '" style="color:#fff;' + A.backdrop('city-' + c, c) + '">' + esc(c) + '</a>';
    }).join('') + '</div></section>');

  OCT.wireRows(view);
  OCT.wireStorePick();
  $('#playAll').addEventListener('click', function () {
    OCT.playCollection(ranked.slice(0, city ? 25 : 100), 0);
    OCT.toast('Playing the chart');
  });
  $('#shuffleAll').addEventListener('click', function () {
    P.state.shuffle = true;
    OCT.renderPlayer();
    OCT.playCollection(ranked.slice(0, 25).slice().reverse(), 0);
  });
  $('#sortNum').addEventListener('click', function () {
    ranked.reverse();
    $('#list').innerHTML = rows(ranked.slice(0, city ? 25 : 100));
    OCT.wireRows($('#list'));
    OCT.toast('Sort order reversed');
  });
})();