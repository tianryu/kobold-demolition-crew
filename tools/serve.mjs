import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)), process.argv[2] === 'dist' ? 'dist' : '');
const port = Number(process.env.PORT || 4175);
const types = {
  html: 'text/html; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', webp: 'image/webp', png: 'image/png', mp3: 'audio/mpeg',
  m4a: 'audio/mp4', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const requested = decodeURIComponent(url.pathname);
    // 将同一份构建挂在一个嵌套目录，便于验证发行包的相对资源路径。
    const relative = requested.replace(/^\/preview\/kobold\//, '/');
    const path = resolve(root, '.' + (relative.endsWith('/') ? relative + 'index.html' : relative));
    if (!path.startsWith(root + sep)) throw new Error();
    const info = await stat(path);
    const type = types[path.split('.').pop()];
    if (!info.isFile() || !type) throw new Error();
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(path).pipe(res);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
