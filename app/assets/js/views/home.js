/* Home view — greeting, Global/Local toggle, storefront picker, Top Picks,
   Trending everywhere, New Music, Today's Top Hits, Top 100 Global,
   Top by city, Browse moods & genres. */
(function () {
  'use strict';
  var OCT = window.OCT, D = window.OCTAVE_DATA, P = window.OCT_PLAYER;
  var I = window.OCT_ICON, A = window.OCT_ART, $ = OCT.$, esc = OCT.esc, fmt = OCT.fmt;

  var ctx = OCT.init({ active: 'home' });
  var view = ctx.view;

  var charts = D.tracks.filter(function (t) { return !t.albumId; });
  var topHits = ['t012', 't013', 't201', 't205', 't283', 't113', 't014', 't216', 't297', 't208',
                 't209', 't226', 't271', 't204'].map(function (id) { return D.trackById[id]; });
  var top100 = ['t012', 't205', 't113', 't216', 't013', 't201', 't283', 't014', 't209', 't271',
                't207', 't208', 't297', 't295', 't280', 't211', 't260', 't101', 't110', 't297']
               .map(function (id) { return D.trackById[id]; });

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function hero(id, veil, eyebrow, title, sub, href) {
    var art = '';
    if (id === 'pl-liked') {
      art = '<div class="hero-veil"><img src="assets/brand/liked-songs.webp" alt="" ' +
            'style="width:100%;height:100%;object-fit:cover"></div>';
    } else {
      art = '<div class="hero-veil">' + A.tile(id, title, { bare: true }) + '</div>';
    }
    return '<a class="hero-card" href="' + href + '">' + art +
      '<div class="hero-eyebrow">' + esc(eyebrow) + '</div>' +
      '<div class="hero-title">' + esc(title) + '</div>' +
      '<div class="hero-sub">' + esc(sub) + '</div></a>';
  }

  function pairCard(title, artist, href, playId) {
    return '<div class="card" data-cardplay="' + (playId || '') + '" role="button" tabindex="0">' +
      '<div class="card-art">' + A.tile(playId || href, artist || title) +
      '<span class="card-hover-play">' + I('play') + '</span></div>' +
      '<div class="card-body"><div class="card-title">' + esc(title) + '</div>' +
      '<div class="card-sub">' + esc(artist) + '</div></div></div>';
  }

  function shelf(title, icon, body, opts) {
    opts = opts || {};
    return '<section class="shelf">' +
      '<div class="shelf-head"><div class="shelf-title">' +
      (icon ? I(icon, 'chev') : '') + '<h2>' + esc(title) + '</h2></div>' +
      (opts.seeAll ? '<a class="see-all" href="' + opts.seeAll + '">See all</a>' : '') +
      '</div>' +
      (opts.sub ? '<div class="shelf-sub">' + esc(opts.sub) + '</div>' : '') +
      body + '</section>';
  }

  function rankedList(tracks) {
    return '<div class="panel" style="padding:8px 12px"><div class="rows">' +
      tracks.map(function (t, i) {
        return '<div class="row" data-track-row="' + t.id + '" data-n="' + (i + 1) + '">' +
          '<div class="row-idx"><span class="num">' + (i + 1) + '</span></div>' +
          '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
          A.tile(t.albumId || t.id, t.album || t.title, { small: true }) +
          '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
          '<div class="row-main"><div class="row-title">' + esc(t.title) +
          (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
          '<div class="row-sub">' + esc(t.artist) + '</div></div>' +
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
    '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px">' +
    '<h1 style="flex:1;min-width:200px">' + greeting() + '</h1>' +
    '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
    '<div class="pill-group">' +
    '<button class="pill" aria-pressed="true" id="scopeGlobal">Global</button>' +
    '<button class="pill" aria-pressed="false" id="scopeLocal">Local</button></div>' +
    OCT.storePick() + '</div></div>' +

    '<section class="shelf" style="margin-top:0">' +
    '<div class="shelf-head"><div class="shelf-title"><h2>Top Picks for You</h2></div></div>' +
    '<div class="hero-grid">' +
    hero('al-habibti', '', '#1 Today', 'Solar Eclipse', 'Drake', 'album.html?a=al-habibti') +
    hero('pl-liked', '', 'Your Library', 'Liked Songs', 'Playlist', 'library.html?tab=playlists') +
    hero('ps-lightbox', '', 'Listen', 'Podcasts', 'Shows and episodes', 'podcasts.html') +
    hero('pl-wrapped', '', '’26', 'Octave Wrapped', 'Replay what you played', 'wrapped.html') +
    '</div></section>' +

    shelf('Trending everywhere', 'trend',
      '<div class="card-grid card-grid-6">' +
      D.trending.map(function (t) {
        var id = D.tracks.filter(function (x) { return x.title === t[0]; })[0];
        return pairCard(t[0], t[1], 'charts.html', id ? id.id : t[0]);
      }).join('') + '</div>',
      { sub: 'Aggregated from every service scrobbling to Last.fm', seeAll: 'charts.html' }) +

    shelf('New Music', 'sparkle',
      '<div class="card-grid card-grid-6">' +
      D.newMusic.map(function (t) {
        var id = D.tracks.filter(function (x) { return x.title === t[0]; })[0];
        return pairCard(t[0], t[1], 'new.html', id ? id.id : t[0]);
      }).join('') + '</div>',
      { sub: 'Fresh drops, handpicked', seeAll: 'new.html' }) +

    shelf("Today's Top Hits", 'fire',
      rankedList(topHits),
      { sub: 'The songs everyone\'s playing', seeAll: 'charts.html' }) +

    shelf('Top 100: Global', 'trend',
      '<div class="panel" style="padding:8px 12px"><div class="rows">' +
      top100.map(function (t, i) {
        return '<div class="row" data-track-row="' + t.id + '" data-n="' + (i + 1) + '">' +
          '<div class="row-idx"><span class="num">' + (i + 1) + '</span></div>' +
          '<div class="row-art" data-play="' + t.id + '" role="button" tabindex="-1" aria-label="Play ' + esc(t.title) + '">' +
          A.tile(t.albumId || t.id, t.album || t.title, { small: true }) +
          '<span class="card-hover-play" style="width:32px;height:32px;margin:-16px 0 0 -16px">' + I('play') + '</span></div>' +
          '<div class="row-main"><div class="row-title">' + esc(t.title) +
          (t.e ? ' <span class="badge-explicit">E</span>' : '') + '</div>' +
          '<div class="row-sub">' + esc(t.artist) + '</div></div>' +
          '<div class="row-meta">' + fmt(t.dur) + '</div>' +
          '<div class="row-actions">' +
          '<button class="icon-btn" data-enq="' + t.id + '" aria-label="Add to queue">' + I('queue') + '</button>' +
          '<button class="icon-btn" data-like="' + t.id + '" aria-label="Favorite">' +
          (P.state.liked[t.id] ? I('heartFill') : I('heart')) + '</button>' +
          '<button class="icon-btn" data-more="' + t.id + '" aria-label="More">' + I('more') + '</button>' +
          '</div></div>';
      }).join('') + '</div></div>',
      { sub: 'Live chart — refreshes daily', seeAll: 'charts.html' }) +

    shelf('Top by city', 'compass',
      '<div class="cat-grid">' +
      D.cities.map(function (c) {
        return '<a class="cat-card" href="charts.html?city=' + encodeURIComponent(c) + '" ' +
          'style="color:#fff;' + A.backdrop('city-' + c, c) + '">' + esc(c) + '</a>';
      }).join('') + '</div>',
      { sub: 'Live top-25, city by city' }) +

    shelf('Browse moods & genres', 'hash',
      '<div class="card-grid card-grid-6">' +
      D.moodCategories.map(function (m) {
        return '<a class="card" href="browse.html#' + m.label.replace(/\s+/g, '-') + '">' +
          '<div class="card-art">' + A.tile('mood-' + m.label, m.label, { bare: true }) + '</div>' +
          '<div class="card-body"><div class="card-title">' + esc(m.label) + '</div></div></a>';
      }).join('') + '</div>');

  OCT.wireRows(view);
  OCT.wireStorePick();

  $('#scopeGlobal').addEventListener('click', function () {
    this.setAttribute('aria-pressed', 'true');
    $('#scopeLocal').setAttribute('aria-pressed', 'false');
    OCT.toast('Global — worldwide charts and editorial');
  });
  $('#scopeLocal').addEventListener('click', function () {
    this.setAttribute('aria-pressed', 'true');
    $('#scopeGlobal').setAttribute('aria-pressed', 'false');
    OCT.toast('Local — device-only playback');
  });

  OCT.$$('.card[data-cardplay]', view).forEach(function (c) {
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
    });
  });
})();