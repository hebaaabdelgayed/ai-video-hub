import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');
const host = '127.0.0.1';
const port = 4174;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  let filePath = join(root, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': types[extname(filePath)] || 'text/plain' });
  createReadStream(filePath).pipe(response);
});

await new Promise((resolveListen) => server.listen(port, host, resolveListen));

try {
  for (const path of ['/', '/videos/', '/playlists/', '/topics/', '/sitemap.xml', '/robots.txt']) {
    const response = await fetch(`http://${host}:${port}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    const text = await response.text();
    if (path.endsWith('/') && !text.includes('dir="rtl"')) {
      throw new Error(`${path} does not include RTL document direction`);
    }
  }
  console.log('Static output verification passed.');
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
