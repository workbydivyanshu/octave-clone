/* Podcasts — New Season / Featured Collection editorial cards, search,
   9 genre filter chips, Top Shows ranked. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc;

  var ctx = OCT.init({ active: 'podcasts' });
  var view = ctx.view;
  var activeGenre = 'Series';

  function editorialCard(e) {
    return '<a class="card" style="min-width:0" href="' + e.href + '">' +
      '<div class="card-art" style="aspect-ratio:1.6">' + A.tile('pod-ed-' + e.title, e.title) +
      '<span class="card-hover-play">' + I('play') + '</span></div>' +
      '<div class="card-body"><div class="eyebrow">' + esc(e.kind) + '</div>' +
      '<div class="card-title" style="font-size:14px;line-height:19px;margin-top:2px;white-space:normal">' +
      esc(e.title) + '</div>' +
      (e.show ? '<div class="card-sub">' + esc(e.show) + '</div>' : '') +
      '</div></a>';
  }

  function paintShows() {
    var list = D.shows;
    $('#shows').innerHTML = '<div class="rows">' + list.map(function (s, i) {
      return '<div class="row" style="gap:12px">' +
        '<div class="row-idx"><span class="num">' + (i + 1) + '</span></div>' +
        '<div class="list-art sm" style="width:52px;height:52px">' + A.tile('pod-' + s.title, s.title, { small: true }) + '</div>' +
        '<div class="row-main"><div class="row-title">' + esc(s.title) +
        (s.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
        '<div class="row-sub">' + esc(s.publisher) + '</div></div>' +
        '<div class="row-actions">' +
        '<button class="icon-btn" data-pshow="' + i + '" aria-label="More actions for ' + esc(s.title) + '">' +
        I('more') + '</button></div>' +
        '</div>';
    }).join('') + '</div>';
    OCT.$$('#shows [data-pshow]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = +b.dataset.pshow;
        OCT.menu([
          { label: 'Play latest episode', icon: 'play', on: function () {
            OCT.playCollection(D.tracks.filter(function (t) { return !t.albumId; }).slice(0, 8), 0);
            OCT.toast('Playing latest episode — demo tone'); } },
          { label: 'Add to queue', icon: 'queue', on: function () { OCT.toast('Episode added to queue'); } },
          { label: 'Follow', icon: 'heart', on: function () { OCT.toast('Followed ' + D.shows[i].title); } },
          { sep: 1 },
          { label: 'Go to show', icon: 'external', on: function () { location.href = D.shows[i].href || 'podcast-show.html'; } }
        ], 0, 0, b);
      });
    });
    // make rows clickable
    OCT.$$('#shows .row').forEach(function (row, i) {
      row.style.cursor = 'pointer';
      row.addEventListener('click', function () {
        var s = D.shows[i];
        location.href = (s && s.href) || 'podcast-show.html';
      });
      row.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        var s = D.shows[i];
        OCT.menu([
          { label: 'Play latest episode', icon: 'play', on: function () {
            OCT.playCollection(D.tracks.filter(function (t) { return !t.albumId; }).slice(0, 8), 0);
            OCT.toast('Playing latest episode — demo tone'); } },
          { label: 'Add to queue', icon: 'queue', on: function () { OCT.toast('Episode added to queue'); } },
          { label: 'Follow', icon: 'heart', on: function () { OCT.toast('Followed'); } },
          { sep: 1 },
          { label: 'Go to show', icon: 'external', on: function () { location.href = (s && s.href) || 'podcast-show.html'; } }
        ], e.clientX, e.clientY);
      });
    });
  }

  view.innerHTML =
    '<div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:240px">' +
    '<div class="eyebrow-row" style="color:var(--accent)">' + I('mic') + '<h1>Podcasts</h1></div>' +
    '<div class="muted" style="margin-top:4px">New shows, new episodes and the collections Apple’s ' +
    'editors are listening to this week.</div></div>' +
    '<div style="display:flex;gap:10px"><a class="btn btn-glass" href="podcasts-charts.html">' +
    I('columns') + 'Top Charts</a>' + OCT.storePick() + '</div></div>' +

    '<div class="searchbox" style="margin-top:18px">' + I('search') +
    '<input id="pq" type="search" placeholder="Shows, episodes and more" aria-label="Search podcasts">' +
    '<span class="sb-actions">' + I('mic') + '</span></div>' +

    '<div class="card-grid card-grid-4" style="margin-top:22px" id="editorial">' +
    D.podcastEditorial.slice(0, 4).map(editorialCard).join('') + '</div>' +

    '<div class="chips" style="margin-top:22px" id="genres">' +
    D.podcastGenres.map(function (g, i) {
      return '<button class="chip' + (i === 0 ? ' on' : '') + '" data-pg="' + esc(g.label) + '">' +
        '<span class="chip-dot" style="background:' + g.color + '"></span>' + esc(g.label) + '</button>';
    }).join('') + '</div>' +

    '<section class="shelf"><div class="shelf-head"><div class="shelf-title">' +
    '<h2>Top Shows</h2>' + I('chevR', 'chev') + '</div>' +
    '<a class="see-all" href="podcasts-charts.html">See all</a></div>' +
    '<div class="panel" style="padding:8px 12px"><div id="shows"></div></div></section>';

  paintShows();
  OCT.wireStorePick();
  OCT.$$('[data-pg]').forEach(function (b) {
    b.addEventListener('click', function () {
      OCT.$$('[data-pg]').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      activeGenre = b.dataset.pg;
      OCT.toast(activeGenre + ' — filtered in the live app');
    });
  });
  $('#pq').addEventListener('input', function () {
    var v = this.value.trim().toLowerCase();
    var shown = 0;
    OCT.$$('#shows .row').forEach(function (row) {
      var hit = !v || row.textContent.toLowerCase().indexOf(v) >= 0;
      row.hidden = !hit;
      if (hit) shown++;
    });
    OCT.$$('#editorial .card').forEach(function (c) {
      c.hidden = !!v && c.textContent.toLowerCase().indexOf(v) < 0;
    });
    OCT.$$('.shelf').forEach(function (s) {
      s.hidden = !!v && shown === 0;
    });
  });
})();