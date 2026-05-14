import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const posts = existsSync('data/social-posts.json')
  ? JSON.parse(readFileSync('data/social-posts.json', 'utf8'))
  : [];
const styles = readFileSync('src/styles.css', 'utf8');
const outDir = 'dist';

function route(path) {
  return `${config.baseUrl}${path}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function writePage(path, html) {
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

function copySocialAssets(source, target) {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      copySocialAssets(sourcePath, targetPath);
    } else if (entry.isFile() && entry.name.endsWith('.base64')) {
      const outputPath = targetPath.replace(/\.base64$/, '');
      mkdirSync(dirname(outputPath), { recursive: true });
      const encoded = readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
      writeFileSync(outputPath, Buffer.from(encoded, 'base64'));
    } else if (entry.isFile()) {
      mkdirSync(dirname(targetPath), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function renderSection(section) {
  if (section.type === 'h2') return `<h2>${escapeHtml(section.text)}</h2>`;
  if (section.type === 'list') return `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  return `<p>${escapeHtml(section.text)}</p>`;
}

function layout({ title, description, path, image, body }) {
  const canonical = route(path);
  const imageUrl = image ? route(image) : '';
  return `<!doctype html>
<html lang="${config.language}" dir="${config.direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:card" content="summary_large_image">` : ''}
  <style>${styles}</style>
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="التنقل الرئيسي">
      <a class="brand" href="${route('/')}">${escapeHtml(config.arabicName)}</a>
      <div class="nav-links">
        <a href="${route('/videos/')}">الفيديوهات</a>
        <a href="${route('/playlists/')}">القوائم</a>
        <a href="${route('/topics/')}">المواضيع</a>
        <a href="${route('/posts/')}">المقالات</a>
        <a href="${escapeHtml(config.channelUrl)}">يوتيوب</a>
      </div>
    </nav>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="footer-inner"><p>© ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. جميع الحقوق محفوظة.</p></div>
  </footer>
</body>
</html>`;
}

function renderPost(post) {
  const imagePath = post.image?.src || '';
  writePage(`posts/${post.slug}`, layout({
    title: `${post.title} | ${config.arabicName}`,
    description: post.description,
    path: `/posts/${post.slug}/`,
    image: imagePath,
    body: `<main class="article-layout">
      <article class="article-content panel">
        <p class="eyebrow">${escapeHtml(post.category)}</p>
        <h1 class="page-title">${escapeHtml(post.title)}</h1>
        <p class="meta">${formatDate(post.date)}</p>
        <p class="lead">${escapeHtml(post.description)}</p>
        ${imagePath ? `<figure class="article-image"><img src="${escapeHtml(route(imagePath))}" alt="${escapeHtml(post.image?.alt || post.title)}" loading="eager"></figure>` : ''}
        <div class="tag-list">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="article-body">${post.sections.map(renderSection).join('')}</div>
      </article>
      <aside>
        ${post.sourceUrl ? `<div class="panel"><h2>المصدر</h2><p><a href="${escapeHtml(post.sourceUrl)}">قراءة المقال الأصلي</a></p></div>` : ''}
      </aside>
    </main>`
  }));
}

function patchSitemap() {
  const sitemapPath = join(outDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return;
  let xml = readFileSync(sitemapPath, 'utf8');
  const additions = posts
    .map((post) => `/posts/${post.slug}/`)
    .filter((url) => !xml.includes(route(url)))
    .map((url) => `  <url><loc>${route(url)}</loc></url>`)
    .join('\n');
  if (additions) {
    xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
    writeFileSync(sitemapPath, xml);
  }
}

copySocialAssets('src/social-assets', join(outDir, 'assets'));
for (const post of posts) renderPost(post);
patchSitemap();

console.log(`Added ${posts.length} social article posts.`);
