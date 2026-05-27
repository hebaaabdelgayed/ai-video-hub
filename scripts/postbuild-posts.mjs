import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const basePosts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const socialPosts = existsSync('data/social-posts.json')
  ? JSON.parse(readFileSync('data/social-posts.json', 'utf8'))
  : [];
const evergreenPosts = existsSync('data/evergreen-posts.json')
  ? JSON.parse(readFileSync('data/evergreen-posts.json', 'utf8'))
  : [];
const posts = uniquePosts([...socialPosts, ...evergreenPosts, ...basePosts]);
const videosData = JSON.parse(readFileSync('data/videos.json', 'utf8'));
const styles = readFileSync('src/styles.css', 'utf8');
const outDir = 'dist';
const baseUrl = config.baseUrl.replace(/\/+$/, '');

function uniquePosts(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function route(path) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function decodeBase64Assets(source, target) {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      decodeBase64Assets(sourcePath, targetPath);
    } else if (entry.isFile() && entry.name.endsWith('.base64')) {
      const outputPath = targetPath.replace(/\.base64$/, '');
      mkdirSync(dirname(outputPath), { recursive: true });
      const encoded = readFileSync(sourcePath, 'utf8').replace(/\s+/g, '');
      writeFileSync(outputPath, Buffer.from(encoded, 'base64'));
    }
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function sitemapLoc(path) {
  return escapeHtml(encodeURI(route(path)));
}

function writePage(path, html) {
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

function navLinks() {
  return `<a href="${route('/videos/')}">\u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a</a>
        <a href="${route('/playlists/')}">\u0627\u0644\u0642\u0648\u0627\u0626\u0645</a>
        <a href="${route('/topics/')}">\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639</a>
        <a href="${route('/posts/')}">\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a</a>
        <a href="${escapeHtml(config.channelUrl)}">\u064a\u0648\u062a\u064a\u0648\u0628</a>`;
}

function footerLinks() {
  const socialLinks = [
    config.facebookUrl ? `<a href="${escapeHtml(config.facebookUrl)}">Facebook</a>` : '',
    config.linkedinUrl ? `<a href="${escapeHtml(config.linkedinUrl)}">LinkedIn</a>` : ''
  ].filter(Boolean).join('\n    ');
  return `<nav class="footer-links" aria-label="\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0648\u0642\u0639">
    <a href="${route('/about/')}">\u0645\u0646 \u0646\u062d\u0646</a>
    <a href="${route('/contact/')}">\u062a\u0648\u0627\u0635\u0644</a>
    <a href="${route('/privacy/')}">\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629</a>
    <a href="${route('/terms/')}">\u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645</a>
    ${socialLinks}
  </nav>`;
}

function layout({ title, description, path, body, jsonLd, type = 'website', image }) {
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
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${canonical}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:card" content="summary_large_image">` : ''}
  <style>${styles}</style>
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="\u0627\u0644\u062a\u0646\u0642\u0644 \u0627\u0644\u0631\u0626\u064a\u0633\u064a">
      <a class="brand" href="${route('/')}">${escapeHtml(config.arabicName)}</a>
      <div class="nav-links">
        ${navLinks()}
      </div>
    </nav>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      ${footerLinks()}
      <p>\u00a9 ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629.</p>
    </div>
  </footer>
</body>
</html>`;
}

function postCard(post) {
  return `<article class="post-card">
    <p class="meta">${escapeHtml(post.category)} \u00b7 ${formatDate(post.date)}</p>
    <h3><a href="${route(`/posts/${post.slug}/`)}">${escapeHtml(post.title)}</a></h3>
    <p>${escapeHtml(post.description)}</p>
    <div class="tag-list">${post.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
  </article>`;
}

function renderSection(section) {
  if (section.type === 'h2') return `<h2>${escapeHtml(section.text)}</h2>`;
  if (section.type === 'list') return `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  return `<p>${escapeHtml(section.text)}</p>`;
}

function relatedVideos(post) {
  const selected = videosData.videos.filter((video) => post.relatedVideoIds?.includes(video.id));
  return selected.slice(0, 4);
}

function relatedTopics(post) {
  return videosData.topics.filter((topic) => post.relatedTopicSlugs?.includes(topic.slug));
}

function renderPost(post) {
  const videos = relatedVideos(post);
  const topics = relatedTopics(post);
  const imagePath = post.image?.src || '';
  const imageUrl = imagePath ? route(imagePath) : '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'ar',
    author: {
      '@type': 'Person',
      name: '\u0647\u0628\u0629 \u0623\u062d\u0645\u062f'
    },
    publisher: {
      '@type': 'Organization',
      name: config.arabicName,
      url: config.baseUrl
    },
    mainEntityOfPage: route(`/posts/${post.slug}/`),
    ...(imageUrl ? { image: [imageUrl] } : {})
  };

  writePage(`posts/${post.slug}`, layout({
    title: `${post.title} | ${config.arabicName}`,
    description: post.description,
    path: `/posts/${post.slug}/`,
    type: 'article',
    image: imagePath,
    jsonLd,
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
        ${post.sourceUrl ? `<div class="panel"><h2>\u0627\u0644\u0645\u0635\u062f\u0631</h2><p><a href="${escapeHtml(post.sourceUrl)}">\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0642\u0627\u0644 \u0627\u0644\u0623\u0635\u0644\u064a</a></p></div>` : ''}
        ${topics.length ? `<div class="panel"><h2>\u0645\u0648\u0627\u0636\u064a\u0639 \u0645\u0631\u062a\u0628\u0637\u0629</h2><div class="tag-list">${topics.map((topic) => `<a class="tag" href="${route(`/topics/${topic.slug}/`)}">${escapeHtml(topic.name)}</a>`).join('')}</div></div>` : ''}
        ${videos.length ? `<div class="panel"><h2>\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u0642\u062a\u0631\u062d\u0629</h2><ul class="list">${videos.map((video) => `<li><a href="${route(`/videos/${video.seo.slug}/`)}">${escapeHtml(video.title)}</a></li>`).join('')}</ul></div>` : ''}
      </aside>
    </main>`
  }));
}

function renderPostsIndex() {
  writePage('posts', layout({
    title: `\u0645\u0642\u0627\u0644\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a | ${config.arabicName}`,
    description: '\u0645\u0642\u0627\u0644\u0627\u062a \u0639\u0631\u0628\u064a\u0629 \u0639\u0645\u0644\u064a\u0629 \u0639\u0646 \u0623\u062e\u0628\u0627\u0631 \u0648\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a\u060c \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0647\u0628\u0629 \u0623\u062d\u0645\u062f \u0648\u0645\u0648\u0636\u0648\u0639\u0627\u062a ChatGPT \u0648Gemini \u0648Claude \u0648AI Agents.',
    path: '/posts/',
    body: `<main class="section">
      <h1 class="page-title">\u0645\u0642\u0627\u0644\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a</h1>
      <p class="lead">\u0645\u0642\u0627\u0644\u0627\u062a \u0639\u0631\u0628\u064a\u0629 \u0645\u062e\u062a\u0635\u0631\u0629 \u0648\u0639\u0645\u0644\u064a\u0629 \u062a\u0631\u0628\u0637 \u0623\u062e\u0628\u0627\u0631 \u0648\u0623\u062f\u0648\u0627\u062a AI \u0628\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u0642\u0646\u0627\u0629\u060c \u062d\u062a\u0649 \u062a\u0635\u0644 \u0644\u0644\u0634\u0631\u062d \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0648\u062a\u0641\u0647\u0645 \u0627\u0644\u0641\u0643\u0631\u0629 \u0642\u0628\u0644 \u0627\u0644\u062a\u062c\u0631\u0628\u0629.</p>
      <div class="post-grid">${posts.map(postCard).join('')}</div>
    </main>`
  }));
}

function patchExistingPages() {
  const files = allHtmlFiles(outDir);
  for (const file of files) {
    let html = readFileSync(file, 'utf8');
    if (!html.includes('/posts/')) {
      html = html.replace(
        /<a href="[^"]+\/topics\/">.*?<\/a>\s*<a href="https:\/\/www\.youtube\.com\/channel\/UCMvdDpKRU_-ZmSz9F1lKOVA">.*?<\/a>/s,
        `<a href="${route('/topics/')}">\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639</a><a href="${route('/posts/')}">\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a</a><a href="${escapeHtml(config.channelUrl)}">\u064a\u0648\u062a\u064a\u0648\u0628</a>`
      );
    }
    if (file.endsWith(join(outDir, 'index.html')) && !html.includes('latest-posts')) {
      html = html.replace(
        '<section class="section trust-section">',
        `<section class="section latest-posts">
      <div class="section-heading">
        <div>
          <h2>\u0623\u062d\u062f\u062b \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a</h2>
          <p class="lead">\u0634\u0631\u0648\u062d\u0627\u062a \u0645\u0643\u062a\u0648\u0628\u0629 \u062a\u0633\u0627\u0639\u062f\u0643 \u062a\u0641\u0647\u0645 \u0623\u062e\u0628\u0627\u0631 \u0648\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u062a\u0635\u0644 \u0644\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.</p>
        </div>
        <a class="button secondary" href="${route('/posts/')}">\u0643\u0644 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a</a>
      </div>
      <div class="post-grid">${posts.slice(0, 3).map(postCard).join('')}</div>
    </section>
    <section class="section trust-section">`
      );
    }
    writeFileSync(file, html);
  }
}

function allHtmlFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) files.push(...allHtmlFiles(fullPath));
    if (fullPath.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function patchSitemap() {
  const sitemapPath = join(outDir, 'sitemap.xml');
  let xml = readFileSync(sitemapPath, 'utf8');
  const urls = ['/posts/', ...posts.map((post) => `/posts/${post.slug}/`)];
  const additions = urls
    .filter((url) => !xml.includes(route(url)) && !xml.includes(sitemapLoc(url)))
    .map((url) => `  <url><loc>${sitemapLoc(url)}</loc></url>`)
    .join('\n');
  if (additions) {
    xml = xml.replace('</urlset>', `${additions}\n</urlset>`);
    writeFileSync(sitemapPath, xml);
  }
}

decodeBase64Assets('src/social-assets', join(outDir, 'social-assets'));
for (const post of posts) renderPost(post);
renderPostsIndex();
patchExistingPages();
patchSitemap();

console.log(`Added ${posts.length} article posts.`);
