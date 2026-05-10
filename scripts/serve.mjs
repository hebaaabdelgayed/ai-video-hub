import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const host = '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  let filePath = join(root, pathname);

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

  response.writeHead(200, {
    'content-type': types[extname(filePath)] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`Preview server running at http://${host}:${port}`);
});
