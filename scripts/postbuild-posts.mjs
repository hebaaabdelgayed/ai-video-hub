import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const posts = JSON.parse(readFileSync('data/posts.json', 'utf8'));
const videosData = JSON.parse(readFileSync('data/videos.json', 'utf8'));
const styles = readFileSync('src/styles.css', 'utf8');
const outDir = 'dist';

function route(path) { return `${config.baseUrl}${path}`; }
function escapeHtml(value = '') { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function writePage(path, html) { const file = join(outDir, path, 'index.html'); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, html); }
function formatDate(date) { return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date)); }
function allHtmlFiles(dir) { const files = []; if (!existsSync(dir)) return files; for (const entry of readdirSync(dir)) { const fullPath = join(dir, entry); if (statSync(fullPath).isDirectory()) files.push(...allHtmlFiles(fullPath)); if (fullPath.endsWith('.html')) files.push(fullPath); } return files; }

function layout({ title, description, path, body, jsonLd, type = 'website' }) {
  const canonical = route(path);
  return `<!doctype html><html lang="${config.language}" dir="${config.direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="${type}"><meta property="og:url" content="${canonical}"><style>${styles}</style>${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}</head><body><header class="site-header"><nav class="nav" aria-label="التنقل الرئيسي"><a class="brand" href="${route('/')}">${escapeHtml(config.arabicName)}</a><div class="nav-links"><a href="${route('/videos/')}">الفيديوهات</a><a href="${route('/playlists/')}">القوائم</a><a href="${route('/topics/')}">المواضيع</a><a href="${route('/posts/')}">المقالات</a><a href="${escapeHtml(config.channelUrl)}">يوتيوب</a></div></nav></header>${body}<footer class="site-footer"><div class="footer-inner"><nav class="footer-links" aria-label="روابط الموقع"><a href="${route('/about/')}">من نحن</a><a href="${route('/contact/')}">تواصل</a><a href="${route('/privacy/')}">سياسة الخصوصية</a><a href="${route('/terms/')}">شروط الاستخدام</a></nav><p>© ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. جميع الحقوق محفوظة.</p></div></footer></body></html>`;
}

function postCard(post) { return `<article class="post-card"><p class="meta">${escapeHtml(post.category)} · ${formatDate(post.date)}</p><h3><a href="${route(`/posts/${post.slug}/`)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.description)}</p><div class="tag-list">${post.tags.slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></article>`; }
function renderSection(section) { if (section.type === 'h2') return `<h2>${escapeHtml(section.text)}</h2>`; if (section.type === 'list') return `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`; return `<p>${escapeHtml(section.text)}</p>`; }
function relatedVideos(post) { return videosData.videos.filter((video) => post.relatedVideoIds?.includes(video.id)).slice(0, 4); }
function relatedTopics(post) { return videosData.topics.filter((topic) => post.relatedTopicSlugs?.includes(topic.slug)); }

function renderPost(post) {
  const videos = relatedVideos(post);
  const topics = relatedTopics(post);
  writePage(`posts/${post.slug}`, layout({
    title: `${post.title} | ${config.arabicName}`,
    description: post.description,
    path: `/posts/${post.slug}/`,
    type: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.description, datePublished: post.date, dateModified: post.date, inLanguage: 'ar', author: { '@type': 'Person', name: 'هبة أحمد' }, publisher: { '@type': 'Organization', name: config.arabicName, url: config.baseUrl }, mainEntityOfPage: route(`/posts/${post.slug}/`) },
    body: `<main class="article-layout"><article class="article-content panel"><p class="eyebrow">${escapeHtml(post.category)}</p><h1 class="page-title">${escapeHtml(post.title)}</h1><p class="meta">${formatDate(post.date)}</p><p class="lead">${escapeHtml(post.description)}</p><div class="tag-list">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><div class="article-body">${post.sections.map(renderSection).join('')}</div></article><aside>${topics.length ? `<div class="panel"><h2>مواضيع مرتبطة</h2><div class="tag-list">${topics.map((topic) => `<a class="tag" href="${route(`/topics/${topic.slug}/`)}">${escapeHtml(topic.name)}</a>`).join('')}</div></div>` : ''}${videos.length ? `<div class="panel"><h2>فيديوهات مقترحة</h2><ul class="list">${videos.map((video) => `<li><a href="${route(`/videos/${video.seo.slug}/`)}">${escapeHtml(video.title)}</a></li>`).join('')}</ul></div>` : ''}</aside></main>`
  }));
}

function renderPostsIndex() {
  writePage('posts', layout({ title: `مقالات الذكاء الاصطناعي | ${config.arabicName}`, description: 'مقالات عربية عملية عن أخبار وأدوات الذكاء الاصطناعي، مرتبطة بفيديوهات هبة أحمد وموضوعات ChatGPT وGemini وClaude وAI Agents.', path: '/posts/', body: `<main class="section"><h1 class="page-title">مقالات الذكاء الاصطناعي</h1><p class="lead">مقالات عربية مختصرة وعملية تربط أخبار وأدوات AI بفيديوهات القناة، حتى تصل للشرح المناسب وتفهم الفكرة قبل التجربة.</p><div class="post-grid">${posts.map(postCard).join('')}</div></main>` }));
}

function patchExistingPages() {
  for (const file of allHtmlFiles(outDir)) {
    let html = readFileSync(file, 'utf8');
    if (!html.includes('/posts/')) html = html.replace(/<a href="[^"]+\/topics\/">.*?<\/a>\s*<a href="https:\/\/www\.youtube\.com\/channel\/UCMvdDpKRU_-ZmSz9F1lKOVA">.*?<\/a>/s, `<a href="${route('/topics/')}">المواضيع</a><a href="${route('/posts/')}">المقالات</a><a href="${escapeHtml(config.channelUrl)}">يوتيوب</a>`);
    if (file.endsWith(join(outDir, 'index.html')) && !html.includes('latest-posts')) html = html.replace('<section class="section trust-section">', `<section class="section latest-posts"><div class="section-heading"><div><h2>أحدث المقالات</h2><p class="lead">شروحات مكتوبة تساعدك تفهم أخبار وأدوات الذكاء الاصطناعي وتصل للفيديوهات المناسبة.</p></div><a class="button secondary" href="${route('/posts/')}">كل المقالات</a></div><div class="post-grid">${posts.slice(0, 3).map(postCard).join('')}</div></section><section class="section trust-section">`);
    writeFileSync(file, html);
  }
}

function patchSitemap() {
  const sitemapPath = join(outDir, 'sitemap.xml');
  let xml = readFileSync(sitemapPath, 'utf8');
  const additions = ['/posts/', ...posts.map((post) => `/posts/${post.slug}/`)].filter((url) => !xml.includes(route(url))).map((url) => `  <url><loc>${route(url)}</loc></url>`).join('\n');
  if (additions) writeFileSync(sitemapPath, xml.replace('</urlset>', `${additions}\n</urlset>`));
}

for (const post of posts) renderPost(post);
renderPostsIndex();
patchExistingPages();
patchSitemap();
console.log(`Added ${posts.length} article posts.`);
