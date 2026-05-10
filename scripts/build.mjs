import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const data = JSON.parse(readFileSync('data/videos.json', 'utf8'));
const styles = readFileSync('src/styles.css', 'utf8');

const outDir = 'dist';
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function route(path) {
  return `${config.baseUrl}${path}`;
}

function writePage(path, html) {
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function layout({ title, description, path = '/', body, jsonLd }) {
  const canonical = route(path);
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
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <style>${styles}</style>
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
  <header class="site-header">
    <nav class="nav" aria-label="التنقل الرئيسي">
      <a class="brand" href="${route('/')}">${escapeHtml(config.arabicName)}</a>
      <div class="nav-links">
        <a href="${route('/videos/')}">الفيديوهات</a>
        <a href="${route('/playlists/')}">القوائم</a>
        <a href="${route('/topics/')}">المواضيع</a>
        <a href="${escapeHtml(config.channelUrl)}">يوتيوب</a>
      </div>
    </nav>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="footer-inner">
      <p>© ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. مكتبة غير رسمية لتنظيم فيديوهات القناة وزيادة قابلية الوصول إليها.</p>
    </div>
  </footer>
</body>
</html>`;
}

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

function videoCard(video) {
  const path = `/videos/${video.seo.slug}/`;
  return `<article class="video-card">
    <a href="${route(path)}">
      ${video.thumbnail ? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy">` : ''}
    </a>
    <div class="card-body">
      <h3><a href="${route(path)}">${escapeHtml(video.title)}</a></h3>
      <p class="meta">${formatDate(video.publishedAt)} · ${video.viewCount?.toLocaleString('ar') || 0} مشاهدة</p>
      <div class="tag-list">${(video.seo?.topics || []).slice(0, 2).map((topic) => `<span class="tag">${escapeHtml(topic.name)}</span>`).join('')}</div>
    </div>
  </article>`;
}

function latestVideos(count = 9) {
  return data.videos.slice(0, count).map(videoCard).join('');
}

writePage('', layout({
  title: `${config.arabicName} | فيديوهات وأدوات الذكاء الاصطناعي`,
  description: config.description,
  path: '/',
  body: `<main>
    <section class="hero">
      <div>
        <h1>${escapeHtml(config.arabicName)}</h1>
        <p class="lead">${escapeHtml(config.description)}</p>
        <div class="hero-actions">
          <a class="button" href="${route('/videos/')}">تصفح الفيديوهات</a>
          <a class="button secondary" href="${escapeHtml(config.channelUrl)}">زيارة قناة يوتيوب</a>
        </div>
      </div>
      <div class="stats" aria-label="إحصاءات القناة">
        <div class="stat"><strong>${data.videos.length.toLocaleString('ar')}</strong><span>فيديو منظم</span></div>
        <div class="stat"><strong>${data.playlists.length.toLocaleString('ar')}</strong><span>قائمة تشغيل</span></div>
        <div class="stat"><strong>${data.topics.length.toLocaleString('ar')}</strong><span>موضوع AI</span></div>
      </div>
    </section>
    <section class="section">
      <h2>أحدث الفيديوهات</h2>
      <div class="grid">${latestVideos()}</div>
    </section>
    <section class="section">
      <h2>مواضيع شائعة</h2>
      <div class="grid">${data.topics.slice(0, 8).map((topic) => `<a class="topic-card card-body" href="${route(`/topics/${topic.slug}/`)}"><h3>${escapeHtml(topic.name)}</h3><p class="meta">${topic.count.toLocaleString('ar')} فيديو</p></a>`).join('')}</div>
    </section>
  </main>`
}));

writePage('videos', layout({
  title: `كل الفيديوهات | ${config.arabicName}`,
  description: 'تصفح كل فيديوهات هبة أحمد عن الذكاء الاصطناعي والأدوات والشروحات العملية.',
  path: '/videos/',
  body: `<main class="section"><h1 class="page-title">كل الفيديوهات</h1><div class="grid">${data.videos.map(videoCard).join('')}</div></main>`
}));

writePage('playlists', layout({
  title: `قوائم التشغيل | ${config.arabicName}`,
  description: 'قوائم تشغيل منظمة لفيديوهات الذكاء الاصطناعي.',
  path: '/playlists/',
  body: `<main class="section"><h1 class="page-title">قوائم التشغيل</h1><div class="grid">${data.playlists.map((playlist) => `<a class="topic-card card-body" href="${route(`/playlists/${playlist.slug}/`)}"><h3>${escapeHtml(playlist.title)}</h3><p class="meta">${playlist.itemCount.toLocaleString('ar')} فيديو</p></a>`).join('')}</div></main>`
}));

writePage('topics', layout({
  title: `المواضيع | ${config.arabicName}`,
  description: 'مواضيع الذكاء الاصطناعي الموجودة في مكتبة فيديوهات هبة أحمد.',
  path: '/topics/',
  body: `<main class="section"><h1 class="page-title">المواضيع</h1><div class="grid">${data.topics.map((topic) => `<a class="topic-card card-body" href="${route(`/topics/${topic.slug}/`)}"><h3>${escapeHtml(topic.name)}</h3><p class="meta">${topic.count.toLocaleString('ar')} فيديو</p></a>`).join('')}</div></main>`
}));

for (const playlist of data.playlists) {
  const videos = data.videos.filter((video) => video.playlists?.includes(playlist.id));
  writePage(`playlists/${playlist.slug}`, layout({
    title: `${playlist.title} | ${config.arabicName}`,
    description: playlist.description || `فيديوهات ${playlist.title} من قناة هبة أحمد.`,
    path: `/playlists/${playlist.slug}/`,
    body: `<main class="section"><h1 class="page-title">${escapeHtml(playlist.title)}</h1><p class="lead">${escapeHtml(playlist.description || '')}</p><div class="grid">${videos.map(videoCard).join('')}</div></main>`
  }));
}

for (const topic of data.topics) {
  const videos = data.videos.filter((video) => video.seo?.topics?.some((item) => item.slug === topic.slug));
  writePage(`topics/${topic.slug}`, layout({
    title: `${topic.name} | ${config.arabicName}`,
    description: `فيديوهات عربية عن ${topic.name} من قناة هبة أحمد.`,
    path: `/topics/${topic.slug}/`,
    body: `<main class="section"><h1 class="page-title">${escapeHtml(topic.name)}</h1><div class="grid">${videos.map(videoCard).join('')}</div></main>`
  }));
}

for (const video of data.videos) {
  const related = data.videos
    .filter((candidate) => candidate.id !== video.id && candidate.seo?.topics?.some((topic) => video.seo?.topics?.some((own) => own.slug === topic.slug)))
    .slice(0, 4);
  const path = `/videos/${video.seo.slug}/`;
  writePage(`videos/${video.seo.slug}`, layout({
    title: video.seo.title,
    description: video.seo.metaDescription,
    path,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: video.title,
      description: video.seo.metaDescription,
      thumbnailUrl: video.thumbnail ? [video.thumbnail] : [],
      uploadDate: video.publishedAt,
      duration: video.duration,
      embedUrl: `https://www.youtube.com/embed/${video.id}`,
      url: video.youtubeUrl
    },
    body: `<main class="video-layout">
      <article>
        <iframe class="video-frame" src="https://www.youtube.com/embed/${video.id}" title="${escapeHtml(video.title)}" allowfullscreen></iframe>
        <div class="panel">
          <h1 class="page-title">${escapeHtml(video.title)}</h1>
          <p class="meta">${formatDate(video.publishedAt)} · ${video.viewCount?.toLocaleString('ar') || 0} مشاهدة</p>
          <p>${escapeHtml(video.seo.summary)}</p>
          <div class="tag-list">${video.seo.keywords.map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`).join('')}</div>
          <div class="actions"><a class="button" href="${escapeHtml(video.youtubeUrl)}">فتح الفيديو على يوتيوب</a></div>
        </div>
        <section class="panel">
          <h2>أسئلة سريعة</h2>
          ${video.seo.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('')}
        </section>
      </article>
      <aside>
        <div class="panel">
          <h2>المواضيع</h2>
          <div class="tag-list">${video.seo.topics.map((topic) => `<a class="tag" href="${route(`/topics/${topic.slug}/`)}">${escapeHtml(topic.name)}</a>`).join('')}</div>
        </div>
        <div class="panel">
          <h2>فيديوهات ذات صلة</h2>
          <ul class="list">${related.map((item) => `<li><a href="${route(`/videos/${item.seo.slug}/`)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>
        </div>
      </aside>
    </main>`
  }));
}

const urls = ['/', '/videos/', '/playlists/', '/topics/']
  .concat(data.videos.map((video) => `/videos/${video.seo.slug}/`))
  .concat(data.playlists.map((playlist) => `/playlists/${playlist.slug}/`))
  .concat(data.topics.map((topic) => `/topics/${topic.slug}/`));

writeFileSync(join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${route(url)}</loc></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(outDir, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${route('/sitemap.xml')}
`);

copyFileSync('data/videos.json', join(outDir, 'videos.json'));
console.log(`Built ${urls.length} routes into ${outDir}.`);
