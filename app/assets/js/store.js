// Aubade store: IndexedDB persistence for library, playlists, art, handles, kv.
// Schema per WEB-PLAN §1: tracks[albumId,artist,source] / albums / playlists /
// art[albumId] / handles / kv. Raw IDB promise wrapper, no dependencies.
(function (root) {
  'use strict';

  var DB = 'aubade';
  var VERSION = 1;

  function open() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB, VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('tracks')) {
          var t = db.createObjectStore('tracks', { keyPath: 'id' });
          t.createIndex('albumId', 'albumId');
          t.createIndex('artist', 'artist');
          t.createIndex('source', 'source');
        }
        if (!db.objectStoreNames.contains('albums')) db.createObjectStore('albums', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('art')) db.createObjectStore('art', { keyPath: 'albumId' });
        if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function tx(db, store, mode) {
    return db.transaction(store, mode).objectStore(store);
  }
  function wrap(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  root.AUB_STORE = {
    get: async function (store, key) {
      var db = await open();
      return wrap(tx(db, store, 'readonly').get(key));
    },
    all: async function (store) {
      var db = await open();
      return wrap(tx(db, store, 'readonly').getAll());
    },
    byIndex: async function (store, index, value) {
      var db = await open();
      return wrap(tx(db, store, 'readonly').index(index).getAll(value));
    },
    put: async function (store, value) {
      var db = await open();
      return wrap(tx(db, store, 'readwrite').put(value));
    },
    putMany: async function (store, values) {
      var db = await open();
      return new Promise(function (resolve, reject) {
        var os = db.transaction(store, 'readwrite').objectStore(store);
        for (var i = 0; i < values.length; i++) os.put(values[i]);
        os.transaction.oncomplete = function () { resolve(values.length); };
        os.transaction.onerror = function () { reject(os.transaction.error); };
      });
    },
    del: async function (store, key) {
      var db = await open();
      return wrap(tx(db, store, 'readwrite').delete(key));
    },
    clear: async function (store) {
      var db = await open();
      return wrap(tx(db, store, 'readwrite').clear());
    },

    kvGet: async function (key, fallback) {
      var row = await root.AUB_STORE.get('kv', key);
      return row ? row.value : fallback;
    },
    kvSet: async function (key, value) {
      return root.AUB_STORE.put('kv', { key: key, value: value });
    },

    saveHandle: async function (handle) {
      return root.AUB_STORE.put('handles', { key: 'music', handle: handle, lastScanAt: Date.now() });
    },
    loadHandle: async function () {
      var row = await root.AUB_STORE.get('handles', 'music');
      return row ? row.handle : null;
    },
  };
})(window);
