import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve('dist');
const host = '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${host}`);
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
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
  response.writeHead(200, { 'content-type': types[extname(filePath)] || 'text/plain' });
  createReadStream(filePath).pipe(response);
});

await new Promise((resolveListen) => server.listen(0, host, resolveListen));
const port = server.address().port;

try {
  for (const path of ['/', '/videos/', '/playlists/', '/topics/', '/topics/openai-chatgpt/', '/posts/', '/posts/ai-iq-human-scale/', '/posts/how-to-choose-ai-model/', '/sitemap.xml', '/video-sitemap.xml', '/robots.txt']) {
    const response = await fetch(`http://${host}:${port}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    const text = await response.text();
    if (path.endsWith('/') && !text.includes('dir="rtl"')) {
      throw new Error(`${path} does not include RTL document direction`);
    }
    if (path === '/posts/ai-iq-human-scale/' && !text.includes('social-assets/ai-iq-linkedin-card.jpg') && !text.includes('media/ai-iq-infographic.svg')) {
      throw new Error(`${path} does not include the social infographic`);
    }
    if (path === '/topics/openai-chatgpt/' && !text.includes('ابدأ من هنا')) {
      throw new Error(`${path} does not include topic guidance content`);
    }
    if (path === '/video-sitemap.xml' && !text.includes('<video:video>')) {
      throw new Error(`${path} does not include video sitemap entries`);
    }
  }
  const imageResponse = await fetch(`http://${host}:${port}/social-assets/ai-iq-linkedin-card.jpg`);
  if (!imageResponse.ok) throw new Error(`/social-assets/ai-iq-linkedin-card.jpg returned ${imageResponse.status}`);
  if (!imageResponse.headers.get('content-type')?.startsWith('image/jpeg')) {
    throw new Error('/social-assets/ai-iq-linkedin-card.jpg is not served as image/jpeg');
  }
  const svgResponse = await fetch(`http://${host}:${port}/media/ai-iq-infographic.svg`);
  if (!svgResponse.ok) throw new Error(`/media/ai-iq-infographic.svg returned ${svgResponse.status}`);
  if (!svgResponse.headers.get('content-type')?.startsWith('image/svg+xml')) {
    throw new Error('/media/ai-iq-infographic.svg is not served as image/svg+xml');
  }
  console.log('Static output verification passed.');
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
