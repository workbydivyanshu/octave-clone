// Aubade YTM data layer: guest-only YouTube Music via the aubade-stream worker.
// Shapes map 1:1 onto OCTAVE_DATA track {id,title,artist,album,albumId,dur} +
// workerUrl in localStorage; no worker configured => available:false and every
// streaming surface renders its designed empty state (never fake content).
(function (root) {
  'use strict';

  var URL_KEY = 'aubade.workerUrl';

  function workerUrl() {
    try { return localStorage.getItem(URL_KEY) || ''; } catch (e) { return ''; }
  }
  function setWorkerUrl(u) {
    try {
      if (u) localStorage.setItem(URL_KEY, u.replace(/\/+$/, ''));
      else localStorage.removeItem(URL_KEY);
      root.dispatchEvent(new CustomEvent('ytm-config', { detail: { url: workerUrl() } }));
    } catch (e) { /* storage unavailable: degrade to unavailable */ }
  }

  function available() { return !!workerUrl(); }

  async function call(path) {
    var base = workerUrl();
    if (!base) throw new Error('worker-not-configured');
    var res = await fetch(base + path, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(path + ' -> ' + res.status);
    return res.json();
  }

  function toTrack(t) {
    return {
      id: t.id, title: t.title, artist: t.artist,
      artistId: t.artistId || '', album: t.album || '', albumId: t.albumId || '',
      dur: t.dur || 0, e: 0, plays: 0, thumb: t.thumb || '', source: 'ytm',
    };
  }
  function toCard(a) {
    return { id: a.id, title: a.title, artist: a.artist, thumb: a.thumb, year: a.year || '' };
  }

  function normalizeShelves(json) {
    var shelves = (json && json.shelves) || [];
    return shelves.map(function (s) {
      return {
        title: s.title,
        tracks: (s.tracks || []).map(toTrack),
        albums: (s.albums || []).map(toCard),
      };
    }).filter(function (s) { return s.tracks.length || s.albums.length; });
  }

  root.AUB_YTM = {
    available: available,
    getWorkerUrl: workerUrl,
    setWorkerUrl: setWorkerUrl,

    search: async function (q) {
      var j = await call('/search?q=' + encodeURIComponent(q));
      return (j.tracks || []).map(toTrack);
    },
    suggest: async function (q) {
      var j = await call('/suggest?q=' + encodeURIComponent(q));
      return j.suggestions || [];
    },
    home: async function () { return normalizeShelves(await call('/home')); },
    charts: async function () { return normalizeShelves(await call('/charts')); },
    album: async function (id) { return normalizeShelves(await call('/album/' + encodeURIComponent(id))); },
    artist: async function (id) { return normalizeShelves(await call('/artist/' + encodeURIComponent(id))); },
    playlist: async function (id) { return normalizeShelves(await call('/playlist/' + encodeURIComponent(id))); },

    playerUrl: async function (videoId) {
      return workerUrl() + '/stream?videoId=' + encodeURIComponent(videoId);
    },
    playerMeta: async function (videoId) {
      var j = await call('/player/' + encodeURIComponent(videoId));
      return { dur: j.dur, title: j.title, artist: j.artist, source: 'ytm', id: videoId };
    },
  };
})(window);
