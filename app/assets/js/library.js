// Aubade library: folder import + rescan orchestration on the main thread.
// File System Access API primary (handle persisted in IndexedDB), webkitdirectory
// fallback; the scan itself runs in library-worker.js and commits batches.
// AUB_LIBRARY is the surface the player and views consume: tracks(), albums(),
// artists(), playlists(), resolveFile(track), importFolder(), rescanIfNeeded().
(function (root) {
  'use strict';

  var ART_STORE = 'art';
  var ALBUM_ART = {};

  var AUDIO_RE = /\.(mp3|flac|opus|ogg|m4a|mp4|aac|wav)$/i;

  function fsAccess() {
    return root.showDirectoryPicker && typeof FileSystemDirectoryHandle !== 'undefined';
  }

  async function walkHandle(dir, prefix, out) {
    for await (var entry of dir.values()) {
      var path = prefix ? prefix + '/' + entry.name : entry.name;
      if (entry.kind === 'directory') {
        await walkHandle(entry, path, out);
      } else if (AUDIO_RE.test(entry.name)) {
        var file = await entry.getFile();
        out.push({ name: entry.name, path: path, size: file.size, mtime: file.lastModified, file: file, handleEntry: entry });
      }
    }
  }

  function walkInput(input) {
    var out = [];
    var list = input && input.files ? input.files : [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (f instanceof Blob) {
        out.push({ name: f.name, path: f.webkitRelativePath || f.name, size: f.size, mtime: f.lastModified, file: f });
      } else if (f && f.file instanceof Blob && f.name) {
        out.push({ name: f.name, path: f.path || f.name, size: f.size || f.file.size, mtime: f.mtime || 1700000000000, file: f.file });
      }
    }
    return out.filter(function (m) { return AUDIO_RE.test(m.name); });
  }

  async function commitBatch(msg) {
    var S = root.AUB_STORE;
    await S.putMany('tracks', msg.tracks);

    var albums = {};
    msg.tracks.forEach(function (t) {
      if (!albums[t.albumId]) {
        albums[t.albumId] = {
          id: t.albumId, title: t.album, artist: t.artist,
          year: '', genre: '', trackIds: [],
        };
      }
      albums[t.albumId].trackIds.push(t.id);
    });
    await S.putMany('albums', Object.values(albums));

    for (var albumName in msg.art) {
      await S.put(ART_STORE, { albumId: albumName, blob: msg.art[albumName] });
      ALBUM_ART[albumName] = msg.art[albumName];
    }

    var artists = {};
    msg.tracks.forEach(function (t) { artists[t.artistId] = { id: t.artistId, name: t.artist }; });
    root.dispatchEvent(new CustomEvent('library-commit', { detail: { count: msg.tracks.length } }));
  }

  function spawnScan(files, onDone) {
    var worker = new Worker('assets/js/library-worker.js', { type: 'module' });
    var settle = new Promise(function (resolve) {
      worker.onmessage = async function (e) {
        var msg = e.data;
        if (msg.type === 'commit') await commitBatch(msg);
        else if (msg.type === 'done') resolve(msg.count);
        else if (msg.type === 'fatal') resolve(0);
      };
    });
    worker.postMessage({ type: 'scan', files: files, commitSize: 64 });
    return settle.then(function (count) { worker.terminate(); if (onDone) onDone(count); return count; });
  }

  function localId(path, size) {
    var h = 5381;
    var str = path + ':' + size;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return 'local:' + h.toString(36);
  }

  var SESSION_FILES = {};

  async function scanFiles(files) {
    var S = root.AUB_STORE;
    var known = {};
    var all = await S.all('tracks');
    all.forEach(function (t) { known[t.path + ':' + t.size + ':' + t.mtime] = true; });
    var fresh = files.filter(function (m) { return !known[m.path + ':' + m.size + ':' + m.mtime]; });
    fresh.forEach(function (m) {
      if (m.file) SESSION_FILES[localId(m.path, m.size)] = m.file;
    });
    if (fresh.length) return spawnScan(fresh);
    return 0;
  }

  var api = {
    usesFsAccess: fsAccess,

    importFolder: async function () {
      if (!fsAccess()) throw new Error('fs-unavailable');
      var dir = await root.showDirectoryPicker();
      await root.AUB_STORE.saveHandle(dir);
      var files = [];
      await walkHandle(dir, '', files);
      return scanFiles(files);
    },

    importFallback: async function (input) {
      return scanFiles(walkInput(input));
    },

    rescanIfNeeded: async function () {
      if (!fsAccess()) return 0;
      var handle = await root.AUB_STORE.loadHandle();
      if (!handle) return 0;
      var perm = await handle.queryPermission({ mode: 'read' });
      if (perm === 'granted') {
        var files = [];
        await walkHandle(handle, '', files);
        return scanFiles(files);
      }
      return -1;
    },

    requestPermission: async function () {
      var handle = await root.AUB_STORE.loadHandle();
      if (!handle) return false;
      return (await handle.requestPermission({ mode: 'read' })) === 'granted';
    },

    resolveFile: async function (track) {
      if (SESSION_FILES[track.id]) return SESSION_FILES[track.id];
      var handle = await root.AUB_STORE.loadHandle();
      if (!handle) return null;
      var parts = track.path.split('/');
      var dir = handle;
      for (var i = 0; i < parts.length - 1; i++) {
        try { dir = await dir.getDirectoryHandle(parts[i]); }
        catch (e) { return null; }
      }
      try {
        var fh = await dir.getFileHandle(parts[parts.length - 1]);
        return await fh.getFile();
      } catch (e) { return null; }
    },

    tracks: async function () { return (await root.AUB_STORE.all('tracks')).sort(function (a, b) { return a.path < b.path ? -1 : 1; }); },
    albums: async function () { return root.AUB_STORE.all('albums'); },
    artists: async function () {
      var seen = {};
      var list = [];
      (await root.AUB_STORE.all('tracks')).forEach(function (t) {
        if (!seen[t.artistId]) { seen[t.artistId] = 1; list.push({ id: t.artistId, name: t.artist }); }
      });
      return list;
    },
    albumTracks: async function (albumId) { return root.AUB_STORE.byIndex('tracks', 'albumId', albumId); },

    artFor: function (albumTitle) { return ALBUM_ART[albumTitle] || null; },
    loadArt: async function () {
      var rows = await root.AUB_STORE.all(ART_STORE);
      rows.forEach(function (r) { ALBUM_ART[r.albumId] = r.blob; });
      return rows.length;
    },

    playlist: async function (id) { return root.AUB_STORE.get('playlists', id); },
    playlists: async function () { return root.AUB_STORE.all('playlists'); },
    savePlaylist: async function (pl) { return root.AUB_STORE.put('playlists', pl); },
    deletePlaylist: async function (id) { return root.AUB_STORE.del('playlists', id); },
  };

  root.AUB_LIBRARY = api;
})(window);
