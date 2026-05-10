import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist';
const targetVideoId = 'Y-QXzk9d-ds';

const seo = {
  title: 'تجربة Codex: وكيل ذكاء اصطناعي لتنظيم الشغل والملفات والإنتاجية | هبة أحمد',
  description: 'شرح عربي عملي لتجربة Codex من OpenAI كوكيل ذكاء اصطناعي يساعد في تنظيم الملفات، الإيميل، التقويم، الجداول، العروض التقديمية، ومهام الإنتاجية اليومية.',
  summary: 'في هذا الفيديو تشارك هبة أحمد تجربة عملية مع Codex من OpenAI، ليس فقط كأداة للبرمجة، بل كوكيل ذكاء اصطناعي يمكنه المساعدة في تنظيم الملفات، ترتيب البريد الإلكتروني، إدارة المواعيد، وإنشاء ملفات عمل مثل الجداول والعروض التقديمية. الصفحة تلخص أهم استخدامات Codex وتوضح لمن يناسب هذا النوع من أدوات AI Agents.',
  keyPoints: [
    'ما الفرق بين Codex كمساعد برمجي وCodex كوكيل ذكاء اصطناعي عملي.',
    'كيف يمكن استخدام Codex في تنظيم الملفات والمهام اليومية بدل الاعتماد على العمل اليدوي المتكرر.',
    'أمثلة على استخدامه مع الإيميل، التقويم، Spreadsheets، وPowerPoint.',
    'لماذا يمكن أن يكون Codex مفيدا لأصحاب القنوات، الباحثين، وصناع المحتوى وليس للمبرمجين فقط.',
    'حدود الاستخدام: متى نراجعه جيدا ومتى لا نعتمد عليه بشكل أعمى.'
  ],
  audience: [
    'من يريد فهم AI Agents بطريقة عملية بعيدا عن الشرح النظري.',
    'صناع المحتوى والباحثون الذين يحتاجون إلى تنظيم ملفات ومهام كثيرة.',
    'أي شخص يستخدم ChatGPT أو أدوات OpenAI ويريد الانتقال لاستخدام أكثر إنتاجية.',
    'المبتدئون الذين يريدون رؤية مثال واقعي لاستخدام Codex في الحياة اليومية.'
  ],
  tools: ['Codex', 'OpenAI', 'ChatGPT', 'AI Agents', 'Spreadsheets', 'PowerPoint'],
  outcomes: [
    'ستعرف كيف يمكن تحويل Codex إلى مساعد عملي لإدارة أجزاء من الشغل اليومي.',
    'ستفهم ما إذا كان Codex مناسبا لك حتى لو لم تكن مبرمجا.',
    'ستخرج بأفكار لاستخدام AI Agents في التنظيم، المتابعة، وتجهيز الملفات.'
  ],
  faq: [
    {
      question: 'هل Codex مفيد لغير المبرمجين؟',
      answer: 'نعم. رغم أن Codex معروف في البرمجة، يوضح الفيديو أنه يمكن استخدامه أيضا في تنظيم الملفات، تجهيز الجداول، إدارة المهام، والمساعدة في أعمال إنتاجية يومية.'
    },
    {
      question: 'ما أهم فكرة في هذا الشرح؟',
      answer: 'الفكرة الأساسية أن Codex يمكن التعامل معه كوكيل ذكاء اصطناعي ينفذ خطوات عملية داخل مشروع أو مساحة عمل، وليس مجرد صندوق دردشة يجيب على الأسئلة.'
    },
    {
      question: 'هل يمكن الاعتماد على Codex بدون مراجعة؟',
      answer: 'لا. الأفضل استخدامه كمساعد قوي مع مراجعة النتائج، خصوصا في الملفات المهمة أو المهام التي قد تؤثر على بياناتك أو عملك.'
    }
  ]
};

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

function list(items) {
  return `<ul class="seo-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function extraJsonLd() {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  })}</script>`;
}

function enhancedPanel() {
  return `<section class="panel seo-enhancement" data-seo-pilot="${targetVideoId}">
    <h2>ملخص عملي للفيديو</h2>
    <p>${escapeHtml(seo.summary)}</p>

    <h2>أهم النقاط التي يغطيها الشرح</h2>
    ${list(seo.keyPoints)}

    <h2>لمن هذا الفيديو؟</h2>
    ${list(seo.audience)}

    <h2>الأدوات والمفاهيم المذكورة</h2>
    <div class="tag-list">${seo.tools.map((tool) => `<span class="tag">${escapeHtml(tool)}</span>`).join('')}</div>

    <h2>ماذا ستتعلم بعد المشاهدة؟</h2>
    ${list(seo.outcomes)}

    <h2>أسئلة شائعة حول الفيديو</h2>
    ${seo.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('')}
  </section>`;
}

const file = allHtmlFiles(join(outDir, 'videos')).find((candidate) => candidate.includes(targetVideoId));
if (!file) {
  throw new Error(`Could not find generated video page for ${targetVideoId}`);
}

let html = readFileSync(file, 'utf8');
if (html.includes(`data-seo-pilot="${targetVideoId}"`)) {
  console.log('SEO pilot already applied.');
} else {
  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="description" content=".*?">/s, `<meta name="description" content="${escapeHtml(seo.description)}">`)
    .replace(/<meta property="og:title" content=".*?">/s, `<meta property="og:title" content="${escapeHtml(seo.title)}">`)
    .replace(/<meta property="og:description" content=".*?">/s, `<meta property="og:description" content="${escapeHtml(seo.description)}">`)
    .replace('</head>', `${extraJsonLd()}\n</head>`)
    .replace('<section class="panel">\n          <h2>أسئلة سريعة</h2>', `${enhancedPanel()}\n        <section class="panel">\n          <h2>أسئلة سريعة</h2>`)
    .replace('</style>', `.seo-enhancement h2{font-size:1.25rem;margin-top:22px;margin-bottom:8px}.seo-enhancement h2:first-child{margin-top:0}.seo-list{margin:0;padding-inline-start:22px;color:var(--text)}.seo-list li{margin-bottom:6px}</style>`);

  writeFileSync(file, html);
  console.log(`Applied SEO pilot to ${file}`);
}
