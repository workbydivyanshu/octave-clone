// Aubade web journey suite — five canonical journeys driven through a real
// Chromium via omowright's owned engine. Stages its own fixture files, cleans
// up after itself, exits non-zero on any failure. Run: node test/run.js
import { mkdtempSync, rmSync, copyFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadOmowright } from '/home/divyu/.omo/binary-runtime/5.1.29/plugin/skills/browser/scripts/omowright.mjs';

const APP = 'http://localhost:5177/app';
const WORKER = 'http://localhost:8788';
const SKILL = '/home/divyu/.omo/binary-runtime/5.1.29/plugin/skills/browser/scripts/omowright.mjs';
const REPO = fileURLToPath(new URL('..', import.meta.url));

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
}

async function newSession(browser, freshIdb) {
  const page = await browser.newTab(APP + '/index.html');
  const errs = [];
  try { page.on('console', (m) => { if (m.type && m.type() === 'error') errs.push(m.text()); }); } catch (e) {}
  try { page.on('pageerror', (e) => errs.push(String(e && e.message || e))); } catch (e) {}
  await page.evaluate((cfg) => {
    try {
      if (cfg.wipe) indexedDB.deleteDatabase('aubade');
      localStorage.setItem('aubade.workerUrl', cfg.workerUrl);
    } catch (e) {}
  }, { workerUrl: WORKER, wipe: freshIdb });
  return { page, errs };
}

async function journeySearchPlay(browser) {
  const { page, errs } = await newSession(browser, true);
  await page.goto(APP + '/search.html', { waitUntil: 'load' });
  let settled = false;
  for (let i = 0; i < 20; i++) {
    settled = await page.evaluate(() => !!document.querySelector('#q'));
    if (settled) break;
    await new Promise(r => setTimeout(r, 500));
  }
  if (!settled) { record('search->play', false, 'search view never mounted'); return; }
  await page.evaluate(() => {
    const input = document.querySelector('#q');
    input.value = 'taylor swift';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => {
    document.querySelector('#q').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => { document.querySelector('[data-tab="Songs"]').click(); });
  await new Promise(r => setTimeout(r, 1800));
  const rows = await page.evaluate(() => document.querySelectorAll('[data-track-row]').length);
  const firstId = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-track-row]'));
    const live = rows.filter(function (r) {
      const id = r.querySelector('[data-play]').getAttribute('data-play');
      const t = window.OCTAVE_DATA.trackById[id];
      return t && t.source === 'ytm';
    });
    const el = (live[0] || rows[0]).querySelector('[data-play]');
    return el ? el.getAttribute('data-play') : null;
  });
  if (!rows || !firstId) { record('search->play', false, rows + ' rows'); return; }
  await page.evaluate((id) => { document.querySelector('[data-play="' + id + '"]').click(); }, firstId);
  await new Promise(r => setTimeout(r, 9000));
  const state = await page.evaluate(() => {
    const P = window.OCT_PLAYER;
    return { playing: P.state.playing, t: P.audioState().currentTime, source: P.state.track ? P.state.track.source : null };
  });
  const ok = state.playing === true && state.t > 2 && state.source === 'ytm' && errs.length === 0;
  record('search->play', ok, ok ? 'live audio at ' + state.t.toFixed(1) + 's' : JSON.stringify(state) + ' errs:' + errs.length);
}

async function journeyImportPlay(browser) {
  const { page, errs } = await newSession(browser, true);
  await page.goto(APP + '/library.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  const imported = await page.evaluate(async () => {
    const res = await fetch('/qa-tmp/b1.mp3');
    const buf = await res.arrayBuffer();
    const file = new File([buf], 'track1.mp3');
    const messages = [{ name: 'track1.mp3', path: 'AlbumB/track1.mp3', size: file.size, mtime: 1700000000000, file: file }];
    return window.AUB_LIBRARY.importFallback({ files: messages });
  });
  await new Promise(r => setTimeout(r, 3500));
  const tags = await page.evaluate(async () => {
    const tracks = await window.AUB_STORE.all('tracks');
    return tracks.map(function (t) { return t.artist + '|' + t.title; });
  });
  await page.evaluate(async () => {
    const tracks = await window.AUB_STORE.all('tracks');
    window.OCT_PLAYER.play(tracks[0]);
  });
  await new Promise(r => setTimeout(r, 7000));
  const state = await page.evaluate(() => {
    const P = window.OCT_PLAYER;
    return { playing: P.state.playing, t: P.audioState().currentTime };
  });
  const tagged = tags.some(function (t) { return t.indexOf('Bambi Sleep') === 0; });
  const ok = imported >= 1 && tagged && state.playing === true && state.t > 2 && errs.length === 0;
  record('import->play', ok, ok ? 'tagged + playing ' + state.t.toFixed(1) + 's' : JSON.stringify({ imported, tags, state, errs: errs.length }));
}

async function journeyQueue(browser) {
  const { page, errs } = await newSession(browser, false);
  await page.goto(APP + '/library.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2000));
  const q = await page.evaluate(() => {
    const P = window.OCT_PLAYER;
    const fake = { id: 'x1', title: 'A', artist: 'B', dur: 10, source: 'local' };
    const fake2 = { id: 'x2', title: 'C', artist: 'D', dur: 10, source: 'local' };
    P.setQueue([fake, fake2], 0);
    P.enqueue({ id: 'x3', title: 'E', artist: 'F', dur: 10, source: 'local' });
    const lenAfterEnqueue = P.state.queue.length;
    P.next();
    const idxAfterNext = P.state.queueIndex;
    P.removeAt(0);
    const lenAfterRemove = P.state.queue.length;
    P.toggleLike('x1');
    const liked = P.state.liked['x1'];
    return { lenAfterEnqueue, idxAfterNext, lenAfterRemove, liked };
  });
  const ok = q.lenAfterEnqueue === 3 && q.idxAfterNext === 1 && q.lenAfterRemove === 2 && q.liked === true && errs.length === 0;
  record('queue-ops', ok, JSON.stringify(q));
}

async function journeyPlaylistCrud(browser) {
  const { page, errs } = await newSession(browser, true);
  await page.goto(APP + '/playlist.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  const crud = await page.evaluate(async () => {
    const L = window.AUB_LIBRARY;
    const id = 'pl-test-' + Date.now();
    await L.savePlaylist({ id: id, title: 'Suite Playlist', subtitle: 'created by test', trackIds: [] });
    const found = (await L.playlists()).filter(function (p) { return p.id === id; }).length;
    await L.savePlaylist({ id: id, title: 'Suite Playlist Renamed', subtitle: 'created by test', trackIds: ['a', 'b'] });
    const renamed = (await L.playlists()).filter(function (p) { return p.id === id && p.title === 'Suite Playlist Renamed'; }).length;
    await L.deletePlaylist(id);
    const gone = (await L.playlists()).filter(function (p) { return p.id === id; }).length;
    return { found, renamed, gone };
  });
  const ok = crud.found === 1 && crud.renamed === 1 && crud.gone === 0 && errs.length === 0;
  record('playlist-crud', ok, JSON.stringify(crud));
}

async function journeyPersistence(browser) {
  const { page, errs } = await newSession(browser, true);
  await page.goto(APP + '/library.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(async () => {
    const res = await fetch('/qa-tmp/b1.mp3');
    const buf = await res.arrayBuffer();
    const file = new File([buf], 'track1.mp3');
    await window.AUB_LIBRARY.importFallback({ files: [{ name: 'track1.mp3', path: 'AlbumB/track1.mp3', size: file.size, mtime: 1700000000000, file: file }] });
  });
  await new Promise(r => setTimeout(r, 3500));
  await page.goto(APP + '/library.html', { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 3000));
  const persisted = await page.evaluate(async () => (await window.AUB_STORE.all('tracks')).length);
  const ok = persisted === 1 && errs.length === 0;
  record('persistence-reload', ok, ok ? '1 track survived reload' : 'persisted=' + persisted + ' errs:' + errs.length);
}

async function main() {
  mkdirSync(join(REPO, 'qa-tmp'), { recursive: true });
  copyFileSync('/tmp/aubade-testlib/AlbumB/track1.mp3', join(REPO, 'qa-tmp', 'b1.mp3'));
  const { omowright } = await loadOmowright();
  const profile = mkdtempSync(join(tmpdir(), 'aubade-suite-'));
  const browser = await omowright.connectPipe({
    browserPath: '/home/divyu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    browserArgs: ['--headless', '--no-first-run', '--user-data-dir=' + profile, '--autoplay-policy=no-user-gesture-required'],
    storageRoot: profile,
    dialogPolicy: { accept: true },
  });
  let failed = 0;
  try {
    await journeyQueue(browser);
    await journeyPlaylistCrud(browser);
    await journeyImportPlay(browser);
    await journeyPersistence(browser);
    await journeySearchPlay(browser);
  } catch (e) {
    record('suite-harness', false, String(e && e.message || e));
  } finally {
    await browser.close();
    rmSync(profile, { recursive: true, force: true });
    rmSync(join(REPO, 'qa-tmp'), { recursive: true, force: true });
  }
  for (const r of results) if (!r.pass) failed++;
  console.log('');
  console.log(results.length + ' journeys, ' + (results.length - failed) + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

main();
