import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist';
const data = JSON.parse(readFileSync(join(outDir, 'videos.json'), 'utf8'));

const toolPatterns = [
  ['ChatGPT', /chatgpt|gpt|openai|o1|o3|o4/i],
  ['Codex', /codex/i],
  ['Gemini', /gemini|google ai studio|vertex/i],
  ['Claude', /claude|anthropic/i],
  ['DeepSeek', /deepseek/i],
  ['Perplexity', /perplexity/i],
  ['NotebookLM', /notebooklm|notebook lm/i],
  ['n8n', /n8n/i],
  ['Canva', /canva/i],
  ['Gamma', /gamma/i],
  ['Microsoft Copilot', /copilot|microsoft/i],
  ['Mistral', /mistral/i],
  ['Qwen', /qwen/i],
  ['Kimi', /kimi/i],
  ['GLM', /glm/i],
  ['Grok', /grok/i],
  ['Llama', /llama|meta ai/i],
  ['PowerPoint', /powerpoint|presentation|presentations/i],
  ['AI Agents', /agent|agents|\u0648\u0643\u064a\u0644|\u0648\u0643\u0644\u0627\u0621/i]
];

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

function cleanText(value = '') {
  return String(value)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max = 155) {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}\u2026`;
}

function topicNames(video) {
  return (video.seo?.topics || []).map((topic) => topic.name).filter(Boolean).slice(0, 3);
}

function detectTools(video) {
  const text = `${video.title} ${video.description || ''} ${(video.tags || []).join(' ')}`;
  const found = toolPatterns.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  return [...new Set(found)].slice(0, 8);
}

function seoFor(video) {
  const title = cleanText(video.title);
  const topics = topicNames(video);
  const tools = detectTools(video);
  const topicText = topics.length ? topics.join('\u060c ') : '\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0623\u062f\u0648\u0627\u062a\u0647 \u0627\u0644\u0639\u0645\u0644\u064a\u0629';
  const toolText = tools.length ? tools.join('\u060c ') : '\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a';

  return {
    title: truncate(`${title} | \u0634\u0631\u062d \u0639\u0631\u0628\u064a \u0639\u0645\u0644\u064a \u0645\u0646 \u0647\u0628\u0629 \u0623\u062d\u0645\u062f`, 68),
    description: truncate(`\u0634\u0631\u062d \u0639\u0631\u0628\u064a \u0639\u0645\u0644\u064a \u062d\u0648\u0644 ${title}. \u062a\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629\u060c \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629\u060c \u0644\u0645\u0646 \u064a\u0646\u0627\u0633\u0628 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u060c \u0648\u0623\u0647\u0645 \u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0645\u0648\u0636\u0648\u0639 ${topicText}.`, 155),
    summary: `\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629 \u062a\u0644\u062e\u0635 \u0641\u064a\u062f\u064a\u0648 "${title}" \u0645\u0646 \u0642\u0646\u0627\u0629 \u0647\u0628\u0629 \u0623\u062d\u0645\u062f\u060c \u0648\u062a\u0636\u0639\u0647 \u0641\u064a \u0633\u064a\u0627\u0642 \u0648\u0627\u0636\u062d \u0636\u0645\u0646 \u0645\u0648\u0636\u0648\u0639 ${topicText}. \u0627\u0644\u0647\u062f\u0641 \u0647\u0648 \u0645\u0633\u0627\u0639\u062f\u062a\u0643 \u0639\u0644\u0649 \u0641\u0647\u0645 \u0641\u0643\u0631\u0629 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0628\u0633\u0631\u0639\u0629\u060c \u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0623\u0648 \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629\u060c \u062b\u0645 \u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0644\u0644\u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u064a\u0648\u062a\u064a\u0648\u0628 \u0639\u0646\u062f \u0627\u0644\u062d\u0627\u062c\u0629.`,
    keyPoints: [
      `\u0641\u0647\u0645 \u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629 \u0648\u0631\u0627\u0621 \u0627\u0644\u0641\u064a\u062f\u064a\u0648: ${title}.`,
      `\u0627\u0644\u062a\u0639\u0631\u0641 \u0639\u0644\u0649 \u0627\u0631\u062a\u0628\u0627\u0637 \u0627\u0644\u0634\u0631\u062d \u0628\u0645\u0648\u0636\u0648\u0639 ${topicText}.`,
      `\u0631\u0624\u064a\u0629 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0623\u0648 \u0627\u0644\u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629 \u0641\u064a \u0633\u064a\u0627\u0642 \u0639\u0645\u0644\u064a \u0645\u062b\u0644 ${toolText}.`,
      '\u062a\u062d\u062f\u064a\u062f \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0645\u0646\u0627\u0633\u0628\u0627 \u0644\u0627\u062d\u062a\u064a\u0627\u062c\u0643 \u0642\u0628\u0644 \u0641\u062a\u062d\u0647 \u0623\u0648 \u0645\u0634\u0627\u0631\u0643\u062a\u0647.',
      '\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0645\u0631\u062a\u0628\u0637\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0645\u0648\u0636\u0648\u0639 \u0644\u0627\u0633\u062a\u0643\u0645\u0627\u0644 \u0627\u0644\u062a\u0639\u0644\u0645.'
    ],
    audience: [
      '\u0627\u0644\u0645\u0647\u062a\u0645\u0648\u0646 \u0628\u062a\u0639\u0644\u0645 \u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0628\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0639\u0631\u0628\u064a\u0629.',
      '\u0645\u0646 \u064a\u0631\u064a\u062f \u0634\u0631\u062d\u0627 \u0639\u0645\u0644\u064a\u0627 \u0642\u0628\u0644 \u062a\u062c\u0631\u0628\u0629 \u0623\u062f\u0627\u0629 \u0623\u0648 \u0646\u0645\u0648\u0630\u062c \u062c\u062f\u064a\u062f.',
      '\u0627\u0644\u0628\u0627\u062d\u062b\u0648\u0646 \u0648\u0635\u0646\u0627\u0639 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0648\u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0630\u064a\u0646 \u064a\u062a\u0627\u0628\u0639\u0648\u0646 \u062a\u0637\u0628\u064a\u0642\u0627\u062a AI \u0641\u064a \u0627\u0644\u0639\u0645\u0644 \u0648\u0627\u0644\u062a\u0639\u0644\u0645.',
      `\u0623\u064a \u0634\u062e\u0635 \u064a\u0628\u062d\u062b \u0639\u0646 \u0645\u062d\u062a\u0648\u0649 \u0645\u0646\u0638\u0645 \u062d\u0648\u0644 ${topicText}.`
    ],
    tools: tools.length ? tools : ['AI', '\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a', ...topics].slice(0, 6),
    outcomes: [
      '\u0633\u062a\u0639\u0631\u0641 \u0645\u0648\u0636\u0648\u0639 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0628\u0633\u0631\u0639\u0629 \u0642\u0628\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629.',
      '\u0633\u062a\u0641\u0647\u0645 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0623\u0648 \u0627\u0644\u0645\u0641\u0627\u0647\u064a\u0645 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0634\u0631\u062d.',
      '\u0633\u062a\u062c\u062f \u0631\u0648\u0627\u0628\u0637 \u0644\u0645\u0648\u0627\u0636\u064a\u0639 \u0648\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0630\u0627\u062a \u0635\u0644\u0629 \u062f\u0627\u062e\u0644 \u0646\u0641\u0633 \u0627\u0644\u0645\u0643\u062a\u0628\u0629.'
    ],
    faq: [
      ['\u0645\u0627 \u0645\u0648\u0636\u0648\u0639 \u0647\u0630\u0627 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u061f', `\u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u064a\u0642\u062f\u0645 \u0634\u0631\u062d\u0627 \u0639\u0631\u0628\u064a\u0627 \u062d\u0648\u0644 ${title} \u0648\u064a\u0631\u062a\u0628\u0637 \u0628\u0645\u0648\u0636\u0648\u0639 ${topicText}.`],
      ['\u0647\u0644 \u064a\u0645\u0643\u0646 \u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0645\u0646 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629\u061f', '\u0646\u0639\u0645\u060c \u064a\u0645\u0643\u0646 \u0645\u0634\u0627\u0647\u062f\u0629 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0627\u0644\u0635\u0641\u062d\u0629 \u0623\u0648 \u0641\u062a\u062d\u0647 \u0639\u0644\u0649 \u0642\u0646\u0627\u0629 \u0647\u0628\u0629 \u0623\u062d\u0645\u062f \u0641\u064a \u064a\u0648\u062a\u064a\u0648\u0628.'],
      ['\u0644\u0645\u0646 \u064a\u0646\u0627\u0633\u0628 \u0647\u0630\u0627 \u0627\u0644\u0634\u0631\u062d\u061f', '\u064a\u0646\u0627\u0633\u0628 \u0627\u0644\u0645\u0647\u062a\u0645\u064a\u0646 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0639\u0645\u0644\u064a\u0627 \u0641\u064a \u0627\u0644\u062a\u0639\u0644\u0645\u060c \u0627\u0644\u0639\u0645\u0644\u060c \u0627\u0644\u0628\u062d\u062b\u060c \u0627\u0644\u0625\u0646\u062a\u0627\u062c\u064a\u0629 \u0623\u0648 \u0635\u0646\u0627\u0639\u0629 \u0627\u0644\u0645\u062d\u062a\u0648\u0649.']
    ]
  };
}

function list(items) {
  return `<ul class="seo-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function faqJsonLd(faq) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  })}</script>`;
}

function panel(video, seo) {
  return `<section class="panel seo-enhancement" data-video-seo="${video.id}">
    <h2>\u0645\u0644\u062e\u0635 \u0639\u0645\u0644\u064a \u0644\u0644\u0641\u064a\u062f\u064a\u0648</h2>
    <p>${escapeHtml(seo.summary)}</p>
    <h2>\u0623\u0647\u0645 \u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u062a\u064a \u064a\u063a\u0637\u064a\u0647\u0627 \u0627\u0644\u0634\u0631\u062d</h2>
    ${list(seo.keyPoints)}
    <h2>\u0644\u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u061f</h2>
    ${list(seo.audience)}
    <h2>\u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0648\u0627\u0644\u0645\u0641\u0627\u0647\u064a\u0645 \u0627\u0644\u0645\u0630\u0643\u0648\u0631\u0629</h2>
    <div class="tag-list">${seo.tools.map((tool) => `<span class="tag">${escapeHtml(tool)}</span>`).join('')}</div>
    <h2>\u0645\u0627\u0630\u0627 \u0633\u062a\u062a\u0639\u0644\u0645 \u0628\u0639\u062f \u0627\u0644\u0645\u0634\u0627\u0647\u062f\u0629\u061f</h2>
    ${list(seo.outcomes)}
    <h2>\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629 \u062d\u0648\u0644 \u0627\u0644\u0641\u064a\u062f\u064a\u0648</h2>
    ${seo.faq.map(([question, answer]) => `<h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p>`).join('')}
  </section>`;
}

function enhancePage(file, video) {
  let html = readFileSync(file, 'utf8');
  if (html.includes('class="panel seo-enhancement"')) return false;

  const seo = seoFor(video);
  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(seo.title)}</title>`)
    .replace(/<meta name="description" content=".*?">/s, `<meta name="description" content="${escapeHtml(seo.description)}">`)
    .replace(/<meta property="og:title" content=".*?">/s, `<meta property="og:title" content="${escapeHtml(seo.title)}">`)
    .replace(/<meta property="og:description" content=".*?">/s, `<meta property="og:description" content="${escapeHtml(seo.description)}">`)
    .replace('</head>', `${faqJsonLd(seo.faq)}\n</head>`)
    .replace(/(\s*<section class="panel">)/, `\n        ${panel(video, seo)}$1`);

  if (!html.includes('seo-enhancement h2')) {
    html = html.replace('</style>', `.seo-enhancement h2{font-size:1.25rem;margin-top:22px;margin-bottom:8px}.seo-enhancement h2:first-child{margin-top:0}.seo-list{margin:0;padding-inline-start:22px;color:var(--text)}.seo-list li{margin-bottom:6px}</style>`);
  }

  if (!html.includes(`data-video-seo="${video.id}"`)) {
    throw new Error(`SEO insertion failed for ${video.id}`);
  }

  writeFileSync(file, html);
  return true;
}

const files = allHtmlFiles(join(outDir, 'videos'));
let enhanced = 0;
let skipped = 0;

for (const video of data.videos) {
  const file = files.find((candidate) => candidate.includes(video.id));
  if (!file) throw new Error(`Could not find generated video page for ${video.id}`);
  if (enhancePage(file, video)) enhanced += 1;
  else skipped += 1;
}

console.log(`Enhanced SEO content for ${enhanced} video pages; skipped ${skipped} already-enhanced pages.`);
