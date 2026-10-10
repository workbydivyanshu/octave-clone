// Aubade library scanner: Web Worker that walks an imported folder, reads tags
// via the vendored music-metadata parser (header-range reads only, never full
// files), downscales cover art to 256px WebP per album, and commits batches
// of tracks incrementally so the library renders shelf-first. Untagged files
// fall back to filename + folder parsing instead of failing.
import { parseBlob, selectCover } from './vendor/music-metadata.mjs';

var ART_MAX = 256;

var AUDIO = /\.(mp3|flac|opus|ogg|m4a|mp4|aac|wav)$/i;

function fileMeta(message) {
  return {
    path: message.path,
    name: message.name,
    size: message.size,
    mtime: message.mtime,
  };
}

function folderOf(path) {
  var parts = path.split('/');
  return parts.length > 1 ? parts[parts.length - 2] : '';
}

function guessFromFilename(name) {
  var base = name.replace(AUDIO, '');
  var dash = base.indexOf(' - ');
  if (dash > 0) {
    return { artist: base.slice(0, dash).trim(), title: base.slice(dash + 3).trim() };
  }
  return { artist: '', title: base.replace(/^[\d]+[.\s-]*/, '').trim() || base };
}

async function makeArtBlob(cover) {
  if (!cover || !self.OffscreenCanvas) return null;
  try {
    var blob = new Blob([cover.data], { type: cover.format });
    var bmp = await createImageBitmap(blob);
    var scale = Math.min(1, ART_MAX / Math.max(bmp.width, bmp.height));
    var w = Math.max(1, Math.round(bmp.width * scale));
    var h = Math.max(1, Math.round(bmp.height * scale));
    var cnv = new OffscreenCanvas(w, h);
    cnv.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return await cnv.convertToBlob({ type: 'image/webp', quality: 0.8 });
  } catch (e) {
    return null;
  }
}

function hash(str) {
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

async function scan(messages, send, commitSize) {
  var pendingTracks = [];
  var pendingArt = {};
  var seenAlbums = {};
  var count = 0;

  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    if (!AUDIO.test(msg.name)) continue;
    var guess = guessFromFilename(msg.name);
    self.postMessage({ type: 'dbg', file: msg.name, hasFile: !!msg.file, slice: typeof (msg.file && msg.file.slice), ctor: msg.file && msg.file.constructor && msg.file.constructor.name, isFile: typeof File !== 'undefined' && msg.file instanceof File, isBlob: typeof Blob !== 'undefined' && msg.file instanceof Blob });
    var albumName = (guess.album) || folderOf(msg.path) || 'Unknown Album';
    var artistName = guess.artist || 'Unknown Artist';
    var title = guess.title;
    var dur = 0;

    try {
      var tags = await parseBlob(msg.file, { duration: true });
      var common = tags.common || {};
      if (common.title) title = common.title;
      if (common.artist) artistName = common.artist;
      if (common.album) albumName = common.album;
      dur = Math.round(tags.format && tags.format.duration) || 0;

      if (!seenAlbums[albumName]) {
        seenAlbums[albumName] = true;
        var cover = selectCover(common.picture);
        var art = await makeArtBlob(cover);
        if (art) pendingArt[albumName] = art;
      }
    } catch (e) {
      self.postMessage({ type: 'parse-error', file: msg.name, message: String(e && e.message || e) });
    }

    pendingTracks.push({
      id: 'local:' + hash(msg.path + ':' + msg.size),
      title: title || msg.name,
      artist: artistName,
      album: albumName,
      albumId: 'al-local:' + hash(albumName + '|' + artistName),
      artistId: 'ar-local:' + hash(artistName),
      dur: dur,
      e: 0,
      plays: 0,
      source: 'local',
      path: msg.path,
      size: msg.size,
      mtime: msg.mtime,
    });
    count++;

    if (pendingTracks.length >= (commitSize || 64)) {
      send({ type: 'commit', tracks: pendingTracks, art: pendingArt });
      pendingTracks = [];
      pendingArt = {};
    }
  }

  if (pendingTracks.length || Object.keys(pendingArt).length) {
    send({ type: 'commit', tracks: pendingTracks, art: pendingArt });
  }
  send({ type: 'done', count: count });
}

self.onmessage = async function (e) {
  if (e.data && e.data.type === 'scan') {
    try {
      await scan(e.data.files, function (msg) { self.postMessage(msg); }, e.data.commitSize);
    } catch (err) {
      self.postMessage({ type: 'fatal', message: String(err && err.message || err) });
    }
  }
};
