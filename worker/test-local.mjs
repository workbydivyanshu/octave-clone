import http from 'node:http';
import { Request } from 'undici';

// Local proof harness: runs the worker's fetch handler under plain Node with a
// Map-backed CacheStorage stand-in, so curl can exercise the real routes before
// deployment. The production target remains real Cloudflare Workers.

const memoryCache = new Map();
const cacheStub = {
  async match(req) {
    const key = req.url;
    return memoryCache.has(key) ? memoryCache.get(key).clone() : undefined;
  },
  async put(req, res) {
    memoryCache.set(req.url, res.clone());
    return undefined;
  },
};
globalThis.caches = { default: cacheStub };

const worker = (await import('./src/index.js')).default;
const PORT = process.env.PORT || 8788;

const server = http.createServer(async (req, res) => {
  try {
    const url = `http://localhost:${PORT}${req.url}`;
    const request = new Request(url, { method: req.method, headers: req.headers });
    const response = await worker.fetch(request, {});
    const headers = Object.fromEntries(response.headers.entries());
    const body = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, headers);
    res.end(body);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
});

server.listen(PORT, () => console.log(`worker harness on :${PORT}`));
