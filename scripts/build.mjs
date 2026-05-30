import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
const data = JSON.parse(readFileSync('data/videos.json', 'utf8'));
const topicContent = existsSync('data/topic-content.json')
  ? JSON.parse(readFileSync('data/topic-content.json', 'utf8'))
  : {};
const styles = readFileSync('src/styles.css', 'utf8');
const baseUrl = config.baseUrl.replace(/\/+$/, '');

const outDir = 'dist';
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

function copyDirectory(source, target) {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      mkdirSync(dirname(targetPath), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    }
  }
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

copyDirectory('src/social-assets', join(outDir, 'social-assets'));
decodeBase64Assets('src/social-assets', join(outDir, 'social-assets'));

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function route(path) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function sitemapLoc(path) {
  return escapeHtml(encodeURI(route(path)));
}

function sameAsLinks() {
  return [
    config.channelUrl,
    config.facebookUrl,
    config.linkedinUrl,
    'https://github.com/hebaaabdelgayed'
  ].filter(Boolean);
}

function stripContext(item) {
  if (!item || typeof item !== 'object') return item;
  const { '@context': _context, ...rest } = item;
  return rest;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function structuredData(path, extra = []) {
  const canonical = route(path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: config.arabicName,
        url: baseUrl,
        sameAs: sameAsLinks()
      },
      {
        '@type': 'Person',
        '@id': `${baseUrl}/#person`,
        name: 'هبة أحمد',
        url: baseUrl,
        sameAs: sameAsLinks(),
        worksFor: { '@id': `${baseUrl}/#organization` }
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        inLanguage: config.language,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${baseUrl}/#website`,
          name: config.arabicName,
          url: baseUrl,
          publisher: { '@id': `${baseUrl}/#organization` }
        },
        publisher: { '@id': `${baseUrl}/#organization` }
      },
      ...asArray(extra).map(stripContext)
    ]
  };
}

function breadcrumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: route(item.path)
    }))
  };
}

function writePage(path, html) {
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function footerLinks() {
  const socialLinks = [
    config.facebookUrl ? `<a href="${escapeHtml(config.facebookUrl)}">Facebook</a>` : '',
    config.linkedinUrl ? `<a href="${escapeHtml(config.linkedinUrl)}">LinkedIn</a>` : ''
  ].filter(Boolean).join('\n    ');
  return `<nav class="footer-links" aria-label="روابط الموقع">
    <a href="${route('/about/')}">من نحن</a>
    <a href="${route('/contact/')}">تواصل</a>
    <a href="${route('/privacy/')}">سياسة الخصوصية</a>
    <a href="${route('/terms/')}">شروط الاستخدام</a>
    ${socialLinks}
  </nav>`;
}

function layout({ title, description, path = '/', body, jsonLd }) {
  const canonical = route(path);
  const pageJsonLd = structuredData(path, jsonLd);
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
  <script type="application/ld+json">${JSON.stringify(pageJsonLd)}</script>
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
    <div class="footer-inner">
      ${footerLinks()}
      <p>© ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. جميع الحقوق محفوظة.</p>
    </div>
  </footer>
</body>
</html>`;
}

function videoCard(video) {
  const path = `/videos/${video.seo.slug}/`;
  const primaryTopic = video.seo?.topics?.[0];
  return `<article class="video-card">
    <a href="${route(path)}">
      ${video.thumbnail ? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" loading="lazy">` : ''}
    </a>
    <div class="card-body">
      <h3><a href="${route(path)}">${escapeHtml(video.title)}</a></h3>
      <p class="meta">${formatDate(video.publishedAt)} · ${video.viewCount?.toLocaleString('ar') || 0} مشاهدة</p>
      <div class="tag-list">${primaryTopic ? `<a class="tag" href="${route(`/topics/${primaryTopic.slug}/`)}">${escapeHtml(primaryTopic.name)}</a>` : ''}</div>
    </div>
  </article>`;
}

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('ar', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date));
}

function latestVideos(count = 9) {
  return data.videos.slice(0, count).map(videoCard).join('');
}

const videosById = new Map(data.videos.map((video) => [video.id, video]));

function playlistVideos(playlist) {
  if (playlist.videoIds?.length) {
    return playlist.videoIds.map((id) => videosById.get(id)).filter(Boolean);
  }
  return data.videos.filter((video) => video.playlists?.includes(playlist.id));
}

function publicPlaylists() {
  return data.playlists.filter((playlist) => playlist.privacyStatus !== 'private' && playlist.privacyStatus !== 'unlisted');
}

function primaryPlaylists() {
  return publicPlaylists().filter((playlist) => playlist.slug !== 'all-videos' && playlist.itemCount > 0);
}

function playlistCard(playlist) {
  const videos = playlistVideos(playlist).slice(0, 3);
  return `<article class="playlist-card">
    <div class="playlist-card-main">
      <h3><a href="${route(`/playlists/${playlist.slug}/`)}">${escapeHtml(playlist.title)}</a></h3>
      ${playlist.description ? `<p>${escapeHtml(playlist.description)}</p>` : ''}
      <p class="meta">${playlist.itemCount.toLocaleString('ar')} فيديو</p>
    </div>
    ${compactVideoList(videos)}
  </article>`;
}

function videosForTopic(slug, count = 3) {
  return data.videos
    .filter((video) => video.seo?.topics?.some((topic) => topic.slug === slug))
    .slice(0, count);
}

function sectionHeader(title, text, actionHref, actionText) {
  return `<div class="section-heading">
    <div>
      <h2>${escapeHtml(title)}</h2>
      ${text ? `<p class="lead">${escapeHtml(text)}</p>` : ''}
    </div>
    ${actionHref ? `<a class="button secondary" href="${actionHref}">${escapeHtml(actionText)}</a>` : ''}
  </div>`;
}

function compactVideoList(videos) {
  return `<ul class="compact-list">${videos.map((video) => `<li>
    <a href="${route(`/videos/${video.seo.slug}/`)}">${escapeHtml(video.title)}</a>
    <span>${formatDate(video.publishedAt)}</span>
  </li>`).join('')}</ul>`;
}

function topicDetails(slug) {
  return topicContent[slug] || {};
}

function topicExcerpt(topic) {
  const firstIntro = topicDetails(topic.slug).intro?.[0];
  return firstIntro || `فيديوهات عربية عملية عن ${topic.name} من قناة هبة أحمد.`;
}

function renderTopicIntro(topic) {
  const details = topicDetails(topic.slug);
  const intro = details.intro?.length
    ? details.intro
    : [`هذا القسم يجمع فيديوهات ${topic.name} في مكان واحد حتى تبدأ من الشرح المناسب بدل البحث العشوائي داخل يوتيوب.`];
  const startHere = details.startHere || [];
  return `<section class="panel topic-intro">
    ${intro.map((paragraph, index) => index === 0 ? `<p class="lead">${escapeHtml(paragraph)}</p>` : `<p>${escapeHtml(paragraph)}</p>`).join('')}
    ${startHere.length ? `<h2>ابدأ من هنا</h2><ul>${startHere.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  </section>`;
}

function videoSitemapEntry(video) {
  const pagePath = `/videos/${video.seo.slug}/`;
  return `  <url>
    <loc>${sitemapLoc(pagePath)}</loc>
    <video:video>
      ${video.thumbnail ? `<video:thumbnail_loc>${escapeHtml(video.thumbnail)}</video:thumbnail_loc>` : ''}
      <video:title>${escapeHtml(video.title)}</video:title>
      <video:description>${escapeHtml(video.seo.metaDescription || video.seo.summary || video.title)}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeHtml(video.id)}</video:player_loc>
      ${video.publishedAt ? `<video:publication_date>${escapeHtml(video.publishedAt)}</video:publication_date>` : ''}
    </video:video>
  </url>`;
}

function learningPathCard(topicSlug, title, text) {
  const topic = data.topics.find((item) => item.slug === topicSlug);
  const videos = videosForTopic(topicSlug, 3);
  const href = topic ? route(`/topics/${topic.slug}/`) : route('/topics/');
  return `<article class="path-card">
    <div class="path-card-main">
      <h3><a href="${href}">${escapeHtml(title)}</a></h3>
      <p>${escapeHtml(text)}</p>
      <p class="meta">${topic ? `${topic.count.toLocaleString('ar')} فيديو` : 'مسار تعليمي'}</p>
    </div>
    ${compactVideoList(videos)}
  </article>`;
}

writePage('', layout({
  title: `${config.arabicName} | فيديوهات وأدوات الذكاء الاصطناعي`,
  description: config.description,
  path: '/',
  body: `<main>
    <section class="hero">
      <div>
        <p class="eyebrow">مكتبة عربية عملية لفهم واستخدام AI</p>
        <h1>كل شروحات الذكاء الاصطناعي من هبة أحمد في مكان واحد</h1>
        <p class="lead">تصفح فيديوهات القناة حسب الأداة أو الهدف: ChatGPT، Gemini، Claude، AI Agents، البرمجة، التصميم، الدراسة، والأتمتة. الهدف أن تصل للفيديو المناسب بسرعة بدل البحث داخل يوتيوب فقط.</p>
        <div class="hero-actions">
          <a class="button" href="${route('/playlists/')}">قوائم التشغيل</a>
          <a class="button secondary" href="${route('/videos/')}">كل الفيديوهات</a>
          <a class="button secondary" href="${route('/topics/')}">المواضيع</a>
          <a class="button secondary" href="${escapeHtml(config.channelUrl)}">قناة يوتيوب</a>
        </div>
      </div>
      <div class="stats" aria-label="إحصاءات القناة">
        <div class="stat"><strong>${data.videos.length.toLocaleString('ar')}</strong><span>فيديو منظم</span></div>
        <div class="stat"><strong>${publicPlaylists().length.toLocaleString('ar')}</strong><span>قائمة تشغيل عامة</span></div>
        <div class="stat"><strong>${data.topics.length.toLocaleString('ar')}</strong><span>موضوع AI</span></div>
      </div>
    </section>
    <section class="section">
      ${sectionHeader('قوائم التشغيل على YouTube', 'تصفح الفيديوهات بنفس تنظيم قوائم التشغيل الموجودة على القناة، مع الحفاظ على ترتيب كل قائمة كما هو في YouTube.', route('/playlists/'), 'كل قوائم التشغيل')}
      <div class="path-grid">${primaryPlaylists().slice(0, 6).map(playlistCard).join('')}</div>
    </section>
    <section class="section topic-band">
      ${sectionHeader('اختار المسار المناسب لك', 'ابدأ من طريقة استخدامك للذكاء الاصطناعي، ثم انتقل للفيديوهات المرتبطة بهذا الهدف.', route('/topics/'), 'كل المواضيع')}
      <div class="path-grid">
        ${learningPathCard('openai-chatgpt', 'ChatGPT و OpenAI', 'شروحات لاستخدام ChatGPT وأدوات OpenAI في العمل والتعلم وصناعة المحتوى.')}
        ${learningPathCard('google-gemini', 'Gemini و Google AI Studio', 'كل ما يخص Gemini، Google AI Studio، Vertex AI، وتجارب نماذج Google.')}
        ${learningPathCard('ai-agents-automation', 'AI Agents والأتمتة', 'فيديوهات عن الوكلاء الذكيين، MCP، n8n، وبناء workflows عملية.')}
        ${learningPathCard('research-study-ai', 'الدراسة والبحث العلمي', 'استخدام AI في المذاكرة، NotebookLM، PDF، البحث، والمراجع العلمية.')}
      </div>
    </section>
    <section class="section">
      ${sectionHeader('أحدث الفيديوهات', 'آخر الشروحات والتجارب المنشورة على القناة.', route('/videos/'), 'عرض كل الفيديوهات')}
      <div class="grid">${latestVideos(6)}</div>
    </section>
    <section class="section">
      ${sectionHeader('المواضيع الرئيسية', 'تصنيفات واسعة تساعدك تصل للفيديو المناسب حسب الأداة أو مجال الاستخدام.', route('/topics/'), 'كل التصنيفات')}
      <div class="grid">${data.topics.slice(0, 12).map((topic) => `<a class="topic-card card-body" href="${route(`/topics/${topic.slug}/`)}"><h3>${escapeHtml(topic.name)}</h3><p class="meta">${topic.count.toLocaleString('ar')} فيديو</p></a>`).join('')}</div>
    </section>
    <section class="section trust-section">
      <div>
        <h2>لماذا هذا الموقع؟</h2>
        <p class="lead">القناة فيها أكثر من ٢٠٠ فيديو. هذا الموقع يحولها إلى مكتبة منظمة قابلة للبحث، مع صفحات لكل فيديو وروابط بين المواضيع، حتى يكون الوصول للشروحات أسهل من البحث العشوائي.</p>
      </div>
      <div class="trust-points">
        <div><strong>منظم حسب الهدف</strong><span>أدوات، نماذج، دراسة، تصميم، برمجة، وأتمتة.</span></div>
        <div><strong>مرتبط بيوتيوب</strong><span>كل صفحة تقودك للفيديو الأصلي أو تشغله مباشرة.</span></div>
        <div><strong>قابل للتوسع</strong><span>كل فيديو جديد يمكن إضافته تلقائيا بعد النشر.</span></div>
      </div>
    </section>
  </main>`
}));

writePage('videos', layout({
  title: `كل الفيديوهات | ${config.arabicName}`,
  description: 'تصفح كل فيديوهات هبة أحمد عن الذكاء الاصطناعي والأدوات والشروحات العملية.',
  path: '/videos/',
  body: `<main>
    <section class="section">
      <h1 class="page-title">كل الفيديوهات</h1>
      <p class="lead">الفيديوهات مرتبة هنا حسب قوائم التشغيل الموجودة على قناة YouTube، حتى يكون التنقل بين السلاسل والموضوعات أسهل.</p>
    </section>
    ${primaryPlaylists().map((playlist) => {
      const videos = playlistVideos(playlist);
      return `<section class="section playlist-section">
        ${sectionHeader(playlist.title, playlist.description || `${videos.length.toLocaleString('ar')} فيديو في هذه القائمة.`, route(`/playlists/${playlist.slug}/`), 'فتح القائمة')}
        <div class="grid">${videos.slice(0, 8).map(videoCard).join('')}</div>
      </section>`;
    }).join('')}
  </main>`
}));

writePage('playlists', layout({
  title: `قوائم التشغيل | ${config.arabicName}`,
  description: 'قوائم تشغيل منظمة لفيديوهات الذكاء الاصطناعي.',
  path: '/playlists/',
  body: `<main class="section">
    <h1 class="page-title">قوائم التشغيل</h1>
    <p class="lead">هذه الصفحة تعكس قوائم التشغيل الموجودة على قناة YouTube، وكل قائمة تعرض فيديوهاتها بترتيب القائمة نفسه.</p>
    <div class="path-grid">${publicPlaylists().map(playlistCard).join('')}</div>
  </main>`
}));

writePage('topics', layout({
  title: `المواضيع | ${config.arabicName}`,
  description: 'مواضيع الذكاء الاصطناعي الموجودة في مكتبة فيديوهات هبة أحمد.',
  path: '/topics/',
  body: `<main class="section"><h1 class="page-title">المواضيع</h1><p class="lead">تم تنظيم الفيديوهات حسب الأدوات والاستخدامات الفعلية بدل التصنيف العام فقط.</p><div class="grid">${data.topics.map((topic) => `<a class="topic-card card-body" href="${route(`/topics/${topic.slug}/`)}"><h3>${escapeHtml(topic.name)}</h3><p>${escapeHtml(topicExcerpt(topic))}</p><p class="meta">${topic.count.toLocaleString('ar')} فيديو</p></a>`).join('')}</div></main>`
}));

writePage('about', layout({
  title: `من نحن | ${config.arabicName}`,
  description: 'تعرف على موقع هبة أحمد للذكاء الاصطناعي ومكتبة الفيديوهات التعليمية.',
  path: '/about/',
  body: `<main class="section text-page">
    <h1 class="page-title">من نحن</h1>
    <p class="lead">هذا الموقع هو مساحة منظمة لفيديوهات هبة أحمد عن الذكاء الاصطناعي، الأدوات الحديثة، الشروحات العملية، وتجارب استخدام AI في التعلم والعمل وصناعة المحتوى.</p>
    <div class="panel">
      <h2>هدف الموقع</h2>
      <p>نرتب محتوى القناة حسب المواضيع والأدوات حتى يسهل الوصول إلى الشرح المناسب، سواء كنت تبحث عن ChatGPT، Gemini، Claude، AI Agents، أدوات التصميم، البرمجة، الدراسة، أو الإنتاجية.</p>
      <h2>عن المحتوى</h2>
      <p>المحتوى تعليمي ومبني على فيديوهات منشورة على قناة هبة أحمد في يوتيوب. كل صفحة فيديو تحتوي على رابط للفيديو الأصلي ومعلومات تساعدك على فهم موضوعه بسرعة.</p>
    </div>
  </main>`
}));

writePage('contact', layout({
  title: `تواصل | ${config.arabicName}`,
  description: 'طرق التواصل مع هبة أحمد ومتابعة قناة الذكاء الاصطناعي.',
  path: '/contact/',
  body: `<main class="section text-page">
    <h1 class="page-title">تواصل</h1>
    <p class="lead">للاقتراحات أو التنبيهات الخاصة بالمحتوى، يمكنك التواصل أو المتابعة من خلال القنوات العامة المرتبطة بالمشروع.</p>
    <div class="panel">
      <h2>قناة يوتيوب</h2>
      <p><a href="${escapeHtml(config.channelUrl)}">زيارة قناة هبة أحمد على يوتيوب</a></p>
      ${config.facebookUrl ? `<h2>Facebook</h2><p><a href="${escapeHtml(config.facebookUrl)}">Facebook</a></p>` : ''}
      ${config.linkedinUrl ? `<h2>LinkedIn</h2><p><a href="${escapeHtml(config.linkedinUrl)}">LinkedIn</a></p>` : ''}
      <h2>GitHub</h2>
      <p><a href="https://github.com/hebaaabdelgayed">زيارة حساب GitHub</a></p>
    </div>
  </main>`
}));

writePage('privacy', layout({
  title: `سياسة الخصوصية | ${config.arabicName}`,
  description: 'سياسة الخصوصية لموقع هبة أحمد للذكاء الاصطناعي.',
  path: '/privacy/',
  body: `<main class="section text-page">
    <h1 class="page-title">سياسة الخصوصية</h1>
    <div class="panel">
      <p>لا يطلب هذا الموقع من الزائر إنشاء حساب أو إدخال بيانات شخصية لاستخدام مكتبة الفيديوهات.</p>
      <h2>المحتوى المضمن</h2>
      <p>قد تحتوي الصفحات على فيديوهات مدمجة من يوتيوب. عند تشغيل الفيديو أو التفاعل معه، قد تطبق سياسات الخصوصية الخاصة بيوتيوب/Google.</p>
      <h2>التحليلات والإعلانات</h2>
      <p>قد نضيف لاحقا أدوات قياس أو إعلانات مثل Google Search Console أو Google AdSense. عند إضافة أي خدمة من هذا النوع، سيتم تحديث هذه الصفحة بما يناسبها.</p>
      <h2>الروابط الخارجية</h2>
      <p>قد يحتوي الموقع على روابط إلى يوتيوب أو مواقع أدوات الذكاء الاصطناعي. نحن غير مسؤولين عن سياسات الخصوصية في المواقع الخارجية.</p>
    </div>
  </main>`
}));

writePage('terms', layout({
  title: `شروط الاستخدام | ${config.arabicName}`,
  description: 'شروط استخدام موقع هبة أحمد للذكاء الاصطناعي.',
  path: '/terms/',
  body: `<main class="section text-page">
    <h1 class="page-title">شروط الاستخدام</h1>
    <div class="panel">
      <h2>استخدام تعليمي</h2>
      <p>الموقع يقدم محتوى تعليميا وتنظيميا حول فيديوهات الذكاء الاصطناعي. المعلومات المعروضة لا تعتبر استشارة مهنية أو ضمانا لنتائج محددة.</p>
      <h2>حقوق المحتوى</h2>
      <p>حقوق الفيديوهات والمحتوى الأصلي محفوظة لأصحابها. يتم عرض الفيديوهات من خلال روابط أو تضمينات يوتيوب الرسمية.</p>
      <h2>دقة المعلومات</h2>
      <p>مجال الذكاء الاصطناعي يتغير بسرعة. نحاول تنظيم المحتوى بشكل مفيد، لكن قد تتغير الأدوات أو الأسعار أو الخصائص بعد نشر الفيديوهات.</p>
      <h2>التعديلات</h2>
      <p>قد يتم تحديث صفحات الموقع أو هذه الشروط من وقت لآخر لتحسين التجربة أو مواكبة تغييرات المحتوى.</p>
    </div>
  </main>`
}));

for (const playlist of publicPlaylists()) {
  const videos = playlistVideos(playlist);
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
    description: topicExcerpt(topic),
    path: `/topics/${topic.slug}/`,
    jsonLd: [
      {
        '@type': 'CollectionPage',
        name: `${topic.name} | ${config.arabicName}`,
        description: topicExcerpt(topic),
        url: route(`/topics/${topic.slug}/`),
        mainEntity: videos.slice(0, 12).map((video) => ({
          '@type': 'VideoObject',
          name: video.title,
          url: route(`/videos/${video.seo.slug}/`),
          thumbnailUrl: video.thumbnail ? [video.thumbnail] : [],
          uploadDate: video.publishedAt
        }))
      },
      breadcrumbs([
        { name: 'الرئيسية', path: '/' },
        { name: 'المواضيع', path: '/topics/' },
        { name: topic.name, path: `/topics/${topic.slug}/` }
      ])
    ],
    body: `<main class="section"><h1 class="page-title">${escapeHtml(topic.name)}</h1>${renderTopicIntro(topic)}<div class="grid">${videos.map(videoCard).join('')}</div></main>`
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
    jsonLd: [
      {
        '@type': 'VideoObject',
        name: video.title,
        description: video.seo.metaDescription,
        thumbnailUrl: video.thumbnail ? [video.thumbnail] : [],
        uploadDate: video.publishedAt,
        duration: video.duration,
        embedUrl: `https://www.youtube.com/embed/${video.id}`,
        contentUrl: video.youtubeUrl,
        url: route(path),
        publisher: { '@id': `${baseUrl}/#organization` }
      },
      {
        '@type': 'FAQPage',
        mainEntity: video.seo.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      },
      breadcrumbs([
        { name: 'الرئيسية', path: '/' },
        { name: 'الفيديوهات', path: '/videos/' },
        { name: video.title, path }
      ])
    ],
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

const urls = ['/', '/videos/', '/playlists/', '/topics/', '/about/', '/contact/', '/privacy/', '/terms/']
  .concat(data.videos.map((video) => `/videos/${video.seo.slug}/`))
  .concat(publicPlaylists().map((playlist) => `/playlists/${playlist.slug}/`))
  .concat(data.topics.map((topic) => `/topics/${topic.slug}/`));

writeFileSync(join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${sitemapLoc(url)}</loc></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(outDir, 'video-sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${data.videos.map(videoSitemapEntry).join('\n')}
</urlset>
`);

writeFileSync(join(outDir, 'robots.txt'), `User-agent: *
Allow: /
Sitemap: ${route('/sitemap.xml')}
Sitemap: ${route('/video-sitemap.xml')}
`);

const siteHost = new URL(baseUrl).hostname;
if (siteHost && !siteHost.endsWith('.github.io')) {
  writeFileSync(join(outDir, 'CNAME'), `${siteHost}\n`);
}

copyFileSync('data/videos.json', join(outDir, 'videos.json'));
console.log(`Built ${urls.length} routes into ${outDir}.`);
