// Tiny static server for local checks: node scripts/serve.mjs [port]
// Mirrors Vercel's cleanUrls (/crm -> crm.html) and serves 404.html for misses.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../site');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json' };
const port = Number(process.argv[2] || 5190);
const file = (p) => { const f = path.join(root, p); return f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : null; };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = file(p) || (path.extname(p) ? null : file(p + '.html'));
  if (!f) { res.writeHead(404, { 'Content-Type': types['.html'] }); const nf = file('/404.html'); return nf ? fs.createReadStream(nf).pipe(res) : res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`http://localhost:${port}`));
