import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const config = JSON.parse(readFileSync('src/site.config.json', 'utf8'));
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

function allHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) files.push(...allHtmlFiles(fullPath));
    if (fullPath.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function footerLinks() {
  return `<nav class="footer-links" aria-label="روابط الموقع">
    <a href="${route('/about/')}">من نحن</a>
    <a href="${route('/contact/')}">تواصل</a>
    <a href="${route('/privacy/')}">سياسة الخصوصية</a>
    <a href="${route('/terms/')}">شروط الاستخدام</a>
  </nav>`;
}

function addFooterLinks() {
  for (const file of allHtmlFiles(outDir)) {
    let html = readFileSync(file, 'utf8');
    if (html.includes('class="footer-links"')) continue;
    html = html.replace('<div class="footer-inner">', `<div class="footer-inner">\n      ${footerLinks()}`);
    writeFileSync(file, html);
  }
}

function page(path, title, description, body) {
  const canonical = route(`/${path}/`);
  const html = `<!doctype html>
<html lang="${config.language}" dir="${config.direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
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
        <a href="${escapeHtml(config.channelUrl)}">يوتيوب</a>
      </div>
    </nav>
  </header>
  <main class="section text-page">${body}</main>
  <footer class="site-footer"><div class="footer-inner">${footerLinks()}<p>© ${new Date().getFullYear()} ${escapeHtml(config.arabicName)}. جميع الحقوق محفوظة.</p></div></footer>
</body>
</html>`;
  const file = join(outDir, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

page('about', `من نحن | ${config.arabicName}`, 'تعرف على موقع هبة أحمد للذكاء الاصطناعي ومكتبة الفيديوهات التعليمية.', `
  <h1 class="page-title">من نحن</h1>
  <p class="lead">هذا الموقع مساحة منظمة لفيديوهات هبة أحمد عن الذكاء الاصطناعي، الأدوات الحديثة، الشروحات العملية، وتجارب استخدام AI في التعلم والعمل وصناعة المحتوى.</p>
  <div class="panel">
    <h2>هدف الموقع</h2>
    <p>نرتب محتوى القناة حسب المواضيع والأدوات حتى يسهل الوصول إلى الشرح المناسب، سواء كنت تبحث عن ChatGPT، Gemini، Claude، AI Agents، أدوات التصميم، البرمجة، الدراسة، أو الإنتاجية.</p>
    <h2>عن المحتوى</h2>
    <p>المحتوى تعليمي ومبني على فيديوهات منشورة على قناة هبة أحمد في يوتيوب. كل صفحة فيديو تحتوي على رابط للفيديو الأصلي ومعلومات تساعدك على فهم موضوعه بسرعة.</p>
  </div>`);

page('contact', `تواصل | ${config.arabicName}`, 'طرق التواصل مع هبة أحمد ومتابعة قناة الذكاء الاصطناعي.', `
  <h1 class="page-title">تواصل</h1>
  <p class="lead">للاقتراحات أو التنبيهات الخاصة بالمحتوى، يمكنك التواصل أو المتابعة من خلال القنوات العامة المرتبطة بالمشروع.</p>
  <div class="panel">
    <h2>قناة يوتيوب</h2>
    <p><a href="${escapeHtml(config.channelUrl)}">زيارة قناة هبة أحمد على يوتيوب</a></p>
    <h2>GitHub</h2>
    <p><a href="https://github.com/hebaaabdelgayed">زيارة حساب GitHub</a></p>
  </div>`);

page('privacy', `سياسة الخصوصية | ${config.arabicName}`, 'سياسة الخصوصية لموقع هبة أحمد للذكاء الاصطناعي.', `
  <h1 class="page-title">سياسة الخصوصية</h1>
  <div class="panel">
    <p>لا يطلب هذا الموقع من الزائر إنشاء حساب أو إدخال بيانات شخصية لاستخدام مكتبة الفيديوهات.</p>
    <h2>المحتوى المضمن</h2>
    <p>قد تحتوي الصفحات على فيديوهات مدمجة من يوتيوب. عند تشغيل الفيديو أو التفاعل معه، قد تطبق سياسات الخصوصية الخاصة بيوتيوب/Google.</p>
    <h2>التحليلات والإعلانات</h2>
    <p>قد نضيف لاحقا أدوات قياس أو إعلانات مثل Google Search Console أو Google AdSense. عند إضافة أي خدمة من هذا النوع، سيتم تحديث هذه الصفحة بما يناسبها.</p>
    <h2>الروابط الخارجية</h2>
    <p>قد يحتوي الموقع على روابط إلى يوتيوب أو مواقع أدوات الذكاء الاصطناعي. نحن غير مسؤولين عن سياسات الخصوصية في المواقع الخارجية.</p>
  </div>`);

page('terms', `شروط الاستخدام | ${config.arabicName}`, 'شروط استخدام موقع هبة أحمد للذكاء الاصطناعي.', `
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
  </div>`);

addFooterLinks();
console.log('Added trust pages and footer links.');
