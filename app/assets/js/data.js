// Aubade data facade: assigns window.OCTAVE_DATA synchronously (shell.js reads
// it at eval), then AUB_BOOT.start() upgrades the SAME object in place with the
// real sources — IndexedDB library, YTM shelves via the worker — before the
// page's view script is injected. The demo dataset survives only as the
// labeled fallback when no real source exists; OCTAVE_DATA.mode names it.
(function (root) {
  'use strict';

  var demo = root.OCTAVE_DEMO_DATA || null;
  var D = demo ? JSON.parse(JSON.stringify(demo)) : {
    tracks: [], trackById: {}, albums: [], artists: [], playlists: [],
    stations: [], genres: [], moodCategories: [], searchCategories: [],
    shows: [], settingsSections: [], shortcuts: [], lyrics: {},
    trending: [], newMusic: [], cities: [], editorialShelves: [], storefronts: [],
  };
  D.mode = 'booting';
  root.OCTAVE_DATA = D;

  root.AUB_BOOT = {
    data: D,

    async upgradeLibrary() {
      var L = root.AUB_LIBRARY;
      if (!L) return 0;
      var count = 0;
      try {
        count = await L.rescanIfNeeded();
      } catch (e) { count = 0; }
      await L.loadArt();
      var tracks = await L.tracks();
      var albums = await L.albums();
      if (tracks.length) {
        D.tracks = D.tracks.filter(function (t) { return t.source !== 'local'; });
        tracks.forEach(function (t) {
          D.tracks.push(t);
          D.trackById[t.id] = t;
        });
        D.localAlbums = albums;
        D.libraryArtFor = function (albumTitle) {
          var blob = root.AUB_LIBRARY.artFor(albumTitle);
          return blob || null;
        };
      }
      return tracks.length;
    },

    async upgradePlaylists() {
      var pls = await root.AUB_LIBRARY.playlists();
      if (pls && pls.length) {
        D.playlists = pls;
      }
      return pls.length;
    },

    async upgradeYtm() {
      var Y = root.AUB_YTM;
      D.ytmAvailable = !!(Y && Y.available());
      if (!D.ytmAvailable) return false;
      try {
        var homeShelves = await Y.home();
        var chartShelves = [];
        try { chartShelves = await Y.charts(); } catch (e2) { chartShelves = []; }
        var shelves = homeShelves.concat(chartShelves);
        if (shelves.length) {
          D.realShelves = shelves;
          var ytmTracks = [];
          shelves.forEach(function (s) {
            s.tracks.forEach(function (t) {
              ytmTracks.push(t);
              D.trackById[t.id] = t;
            });
          });
          D.ytmTracks = ytmTracks;
          var byTitle = {};
          shelves.forEach(function (s) { byTitle[s.title] = s; });
          D.ytmShelfByTitle = byTitle;
        }
        return true;
      } catch (e) {
        D.ytmAvailable = false;
        return false;
      }
    },

    settleMode(localCount) {
      var hasYtm = !!D.ytmAvailable && (D.ytmTracks || []).length > 0;
      var hasLocal = localCount > 0;
      if (hasLocal && hasYtm) D.mode = 'live';
      else if (hasLocal) D.mode = 'local';
      else if (hasYtm) D.mode = 'ytm';
      else D.mode = 'demo';
    },

    async start(viewScript) {
      var localCount = 0;
      try { localCount = await this.upgradeLibrary(); } catch (e) { /* library optional */ }
      try { await this.upgradePlaylists(); } catch (e) { /* playlists optional */ }
      try { await this.upgradeYtm(); } catch (e) { /* worker optional */ }
      this.settleMode(localCount);
      root.dispatchEvent(new CustomEvent('aubade-ready', { detail: { mode: D.mode, local: localCount } }));
      if (viewScript) {
        var s = document.createElement('script');
        s.src = viewScript;
        document.body.appendChild(s);
      }
    },
  };
})(window);
