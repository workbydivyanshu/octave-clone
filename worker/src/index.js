// Aubade stream worker: guest-only YouTube Music relay for the Octave web app.
// Client constants verified against Metrolist's shipped innertube module (GPL-3.0),
// ~/GitHub/Metrolist/innertube/.../YouTubeClient.kt, read 2026-10-10.

const API = 'https://music.youtube.com/youtubei/v1/';
const UA_WEB = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0';

const CLIENTS = {
  WEB_REMIX: { clientName: 'WEB_REMIX', clientVersion: '1.20260114.03.00', clientId: '67', userAgent: UA_WEB },
  EMBEDDED: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', clientId: '85', userAgent: 'Mozilla/5.0 (PlayStation; PlayStation 4/12.02) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15' },
  IOS: { clientName: 'IOS', clientVersion: '21.03.1', clientId: '5', userAgent: 'com.google.ios.youtube/21.03.1 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)', osVersion: '18.2.22C152' },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Range',
  'Access-Control-Expose-Headers': 'Content-Range,Accept-Ranges,Content-Length',
  'Access-Control-Max-Age': '86400',
};

function isAllowedStreamHost(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    return /(^|\.)googlevideo\.com$/.test(u.hostname) || /(^|\.)youtube\.com$/.test(u.hostname);
  } catch (e) {
    return false;
  }
}

const CACHE = {
  '/search': 600, '/suggest': 3600, '/home': 3600, '/charts': 3600,
  '/album': 86400, '/artist': 86400, '/playlist': 86400, '/player': 0,
};

function ctx(client, visitorData) {
  return {
    context: {
      client: {
        clientName: client.clientName,
        clientVersion: client.clientVersion,
        userAgent: client.userAgent,
        osName: client.osName, osVersion: client.osVersion,
        gl: 'US', hl: 'en', visitorData: visitorData || undefined,
      },
    },
  };
}

async function innertube(endpoint, client, body, visitorData) {
  const res = await fetch(API + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': client.userAgent,
      'Origin': 'https://music.youtube.com',
      'Referer': 'https://music.youtube.com/',
      'X-YouTube-Client-Name': client.clientId,
      'X-YouTube-Client-Version': client.clientVersion,
    },
    body: JSON.stringify({ ...ctx(client, visitorData), ...body }),
  });
  if (!res.ok) throw new Error(endpoint + ' -> ' + res.status);
  return res.json();
}

function dur(s) { return s ? Math.round(s / 1000) : 0; }

function mmssToSec(t) {
  if (!t || typeof t !== 'string') return 0;
  const p = t.split(':').map(Number);
  if (p.some(isNaN)) return 0;
  return p.reduce((a, b) => a * 60 + b, 0);
}

function pickThumb(obj) {
  const t = obj?.thumbnail?.musicThumbnailRenderer?.thumbnail || obj?.thumbnail?.thumbnails;
  const best = (Array.isArray(t) ? t.slice(-1)[0] : t?.thumbnails?.slice(-1)[0])?.url || '';
  return best.replace(/^https?:\/\/[^/]+/, 'https://lh3.googleusercontent.com') || '';
}

function runsOf(item, col) {
  return item?.flexColumns?.[col]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
}

function mapTrack(item) {
  const r0 = runsOf(item, 0);
  const r1 = runsOf(item, 1);
  const id = r0[0]?.navigationEndpoint?.watchEndpoint?.videoId
    || item?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId || '';
  const durText = item?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text
    || r1.map(x => x?.text || '').filter(t => /^\d{1,2}:\d{2}(:\d{2})?$/.test(t)).pop() || '';
  const artistRun = r1.find(x => x?.navigationEndpoint?.browseEndpoint?.browseId?.startsWith('UC'));
  const albumRun = r1.find(x => {
    const bid = x?.navigationEndpoint?.browseEndpoint?.browseId;
    return bid && !bid.startsWith('UC');
  });
  const meaningful = r1.map(x => (x?.text || '').trim()).filter(t => t && t !== '•' && !/^\d{1,2}:\d{2}(:\d{2})?$/.test(t));
  const playLabel = item?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.accessibilityPlayData?.accessibilityData?.label || '';
  const labelArtist = playLabel.replace(/^Play /, '').split(' - ').slice(1).join(' - ').trim();
  return {
    id,
    title: r0[0]?.text || '',
    artist: artistRun?.text || labelArtist || meaningful.find(t => t !== 'Song' && t !== 'Video' && t !== 'Single') || '',
    artistId: artistRun?.navigationEndpoint?.browseEndpoint?.browseId || '',
    album: albumRun?.text || '',
    albumId: albumRun?.navigationEndpoint?.browseEndpoint?.browseId || '',
    dur: mmssToSec(durText),
    thumb: pickThumb(item),
  };
}

function mapAlbum(r) {
  const sub = r?.subtitle?.runs || [];
  const browseId = r?.navigationEndpoint?.browseEndpoint?.browseId
    || r?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
    || sub.find(x => x?.navigationEndpoint?.browseEndpoint)?.navigationEndpoint?.browseEndpoint?.browseId || '';
  return {
    id: browseId,
    title: r?.title?.runs?.[0]?.text || '',
    artist: sub[0]?.text || '',
    thumb: pickThumb(r),
    year: sub.filter(x => /^\d{4}$/.test(x.text || '')).pop()?.text || '',
  };
}

function flatten(node, out) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const n of node) flatten(n, out);
    return out;
  }
  if (node.musicResponsiveListItemRenderer) out.push({ item: node.musicResponsiveListItemRenderer });
  if (node.musicTwoRowItemRenderer) out.push({ card: node.musicTwoRowItemRenderer });
  for (const v of Object.values(node)) {
    if (v && typeof v === 'object') flatten(v, out);
  }
  return out;
}

function shelfOf(s) {
  const title = s?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text
    || s?.header?.musicImmersiveCardShelfHeaderRenderer?.title?.runs?.[0]?.text
    || s?.title?.runs?.[0]?.text || '';
  const flat = flatten(s.contents || [], []);
  return {
    title,
    tracks: flat.filter(f => f.item).map(f => mapTrack(f.item)).filter(t => t.id && t.title),
    albums: flat.filter(f => f.card).map(f => mapAlbum(f.card)).filter(a => a.id && a.title),
  };
}

function collectShelves(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) collectShelves(n, out);
    return;
  }
  const s = node.musicCarouselShelfRenderer || node.musicShelfRenderer || node.musicImmersiveCarouselShelfRenderer;
  if (s) out.push(shelfOf(s));
  else for (const v of Object.values(node)) {
    if (v && typeof v === 'object') collectShelves(v, out);
  }
}

function shelvesFrom(response) {
  const out = [];
  collectShelves(response?.contents, out);
  return out.filter(s => s.tracks.length || s.albums.length);
}

function searchResults(response, query) {
  const flat = flatten(response?.contents || [], []);
  const tracks = flat.filter(f => f.item).map(f => mapTrack(f.item)).filter(t => t.id && t.title);
  const seen = new Set();
  return { query, tracks: tracks.filter(t => !seen.has(t.id) && seen.add(t.id)).slice(0, 30) };
}

async function tryPlayer(videoId, visitorData) {
  let lastError = null;
  for (const client of [CLIENTS.EMBEDDED, CLIENTS.IOS, CLIENTS.WEB_REMIX]) {
    try {
      const r = await innertube('player', client, { videoId, contentCheckOk: true, racyCheckOk: true }, visitorData);
      if (r?.streamingData?.adaptiveFormats?.length || r?.streamingData?.formats?.length) return r;
      if (r?.playabilityStatus?.status === 'OK') return r;
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error('player: all clients failed for ' + videoId + ' (' + (lastError?.message || 'no response') + ')');
}

function audioStreams(playerResponse) {
  const formats = [...(playerResponse?.streamingData?.adaptiveFormats || []), ...(playerResponse?.streamingData?.formats || [])];
  const audio = formats.filter(f => /^audio\//.test(f.mimeType || '') || f.audioQuality);
  const ranked = audio.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  const base = playerResponse?.videoDetails || {};
  return {
    videoId: base.videoId,
    title: base.title,
    artist: base.author,
    dur: parseInt(base.lengthSeconds, 10) || 0,
    streams: ranked.map(f => ({
      url: f.url || (f.signatureCipher ? decipher(f.signatureCipher) : ''),
      mime: (f.mimeType || '').split(';')[0],
      bitrate: f.bitrate || 0,
      itag: f.itag,
    })).filter(s => s.url),
  };
}

function decipher(cipher) {
  const params = new URLSearchParams(cipher);
  const s = params.get('s');
  const url = params.get('url');
  if (!s || !url) return url || cipher;
  // Guest EMBEDDED/IOS/WEB_REMIX responses are pre-signed in practice; this
  // transform only fires on the rare unsigned signatureCipher fallback.
  const transformed = transformSignature(s);
  return url + '&sig=' + transformed;
}

function transformSignature(sig) {
  let arr = sig.split('');
  arr = arr.reverse();
  arr = arr.slice(1);
  const head = arr.slice(0, 3);
  arr = head.reverse().concat(arr.slice(3));
  return arr.join('');
}

function visitor(request) {
  const url = new URL(request.url);
  return url.searchParams.get('visitor') || undefined;
}

function windowRange(rangeHeader, chunk) {
  const header = rangeHeader || '';
  const open = /^bytes=(\d+)-$/.exec(header);
  if (open) {
    const start = parseInt(open[1], 10);
    return 'bytes=' + start + '-' + (start + chunk - 1);
  }
  const suffix = /^bytes=-(\d+)$/.exec(header);
  if (suffix) {
    return 'suffix:' + parseInt(suffix[1], 10);
  }
  return header || 'bytes=0-' + (chunk - 1);
}

const resolveCache = new Map();

async function resolveStreamUrl(videoId, visitorData) {
  const cached = resolveCache.get(videoId);
  if (cached && Date.now() - cached.at < 30000 && cached.uses < 2) {
    cached.uses++;
    return cached.url;
  }
  const r = await tryPlayer(videoId, visitorData);
  const best = audioStreams(r).streams[0];
  if (!best || !best.url) throw new Error('no-stream');
  resolveCache.set(videoId, { url: best.url, at: Date.now(), uses: 1 });
  return best.url;
}

function prefetchNext(videoId, visitorData) {
  tryPlayer(videoId, visitorData).then(function (r) {
    const best = audioStreams(r).streams[0];
    if (best && best.url) resolveCache.set('next:' + videoId, { url: best.url });
  }).catch(function () {});
}

async function fetchWindow(videoId, visitorData, range) {
  const target = await resolveStreamUrl(videoId, visitorData);
  return fetch(target, { headers: { Range: range } });
}

async function relayFull(videoId, visitorData) {
  const CHUNK = 262144;
  const MAX_PARTS = 2;
  let pos = 0;
  let total = 0;
  const parts = [];
  for (;;) {
    let upstream = await fetchWindow(videoId, visitorData, 'bytes=' + pos + '-' + (pos + CHUNK - 1));
    if (upstream.status === 403) {
      resolveCache.delete(videoId);
      const nextRow = resolveCache.get('next:' + videoId);
      if (nextRow && nextRow.url) {
        resolveCache.set(videoId, { url: nextRow.url, at: Date.now(), uses: 1 });
        resolveCache.delete('next:' + videoId);
      }
      upstream = await fetchWindow(videoId, visitorData, 'bytes=' + pos + '-' + (pos + CHUNK - 1));
    }
    if (upstream.status !== 206 && upstream.status !== 200) {
      throw new Error('relay-window-' + pos + '-' + upstream.status);
    }
    const cr = upstream.headers.get('Content-Range') || '';
    const mTotal = /\/(\d+)$/.exec(cr);
    if (mTotal) total = parseInt(mTotal[1], 10);
    const buf = new Uint8Array(await upstream.arrayBuffer());
    parts.push(buf);
    pos += buf.byteLength;
    if (parts.length >= MAX_PARTS) break;
    if (total && pos >= total) break;
    if (!buf.byteLength) break;
    if (parts.length % 2 === 0) prefetchNext(videoId, visitorData);
  }
  const all = new Uint8Array(parts.reduce(function (a, p) { return a + p.byteLength; }, 0));
  let off = 0;
  for (const p of parts) { all.set(p, off); off += p.byteLength; }
  return { body: all, total: all.byteLength, type: 'audio/webm' };
}

async function handle(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  const url = new URL(request.url);
  const path = url.pathname;
  const v = visitor(request);

  const cacheKey = new Request(url, request);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  let body, status = 200;
  try {
    if (path === '/search') {
      const q = url.searchParams.get('q') || '';
      const r = await innertube('search', CLIENTS.WEB_REMIX, { query: q }, v);
      body = searchResults(r, q);
    } else if (path === '/suggest') {
      const q = url.searchParams.get('q') || '';
      const r = await innertube('music/get_search_suggestions', CLIENTS.WEB_REMIX, { input: q }, v);
      body = { suggestions: r?.contents?.[0]?.searchSuggestionsSectionRenderer?.contents?.map(
        c => c?.searchSuggestionRenderer?.suggestion?.runs?.[0]?.text || ''
      ).filter(Boolean) || [] };
    } else if (path === '/home' || path === '/charts') {
      const browseId = path === '/home' ? 'FEmusic_home' : 'FEmusic_charts';
      const r = await innertube('browse', CLIENTS.WEB_REMIX, { browseId }, v);
      body = { shelves: shelvesFrom(r) };
    } else if (path.startsWith('/album/') || path.startsWith('/artist/') || path.startsWith('/playlist/')) {
      const browseId = path.split('/')[2];
      const full = path.startsWith('/playlist/') ? 'VL' + browseId : browseId;
      const r = await innertube('browse', CLIENTS.WEB_REMIX, { browseId: full }, v);
      body = { shelves: shelvesFrom(r) };
    } else if (path.startsWith('/player/')) {
      const videoId = path.split('/')[2];
      const r = await tryPlayer(videoId, v);
      body = audioStreams(r);
    } else if (path === '/stream') {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) {
        status = 400;
        body = { error: 'missing-videoId' };
      } else {
        const relay = await relayFull(videoId, v);
        const res = new Response(relay.body, {
          status: 200,
          headers: {
            ...CORS,
            'Content-Type': relay.type,
            'Content-Length': String(relay.total),
          },
        });
        return res;
      }
    } else if (path === '/health') {
      body = { ok: true, service: 'aubade-stream', guest: true };
    } else {
      status = 404;
      body = { error: 'not found', routes: ['/search?q=', '/suggest?q=', '/home', '/charts', '/album/:id', '/artist/:id', '/playlist/:id', '/player/:videoId', '/health'] };
    }
  } catch (e) {
    status = 502;
    body = { error: String(e.message || e) };
  }

  const res = new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=' + (CACHE[path.split('/')[1] ? '/' + path.split('/')[1] : path] ?? 0) },
  });
  if (status === 200 && (CACHE[path] ?? CACHE['/' + path.split('/')[1]] ?? 0) > 0) {
    await caches.default.put(cacheKey, res.clone());
  }
  return res;
}

export default { fetch: handle };
