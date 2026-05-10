const TAXONOMY_VERSION = 4;

const TOPIC_RULES = [
  { slug: 'openai-chatgpt', name: 'OpenAI و ChatGPT', terms: ['chatgpt', 'gpt-', 'gpt ', 'openai', 'codex', 'sora', 'dall-e', 'dalle', 'شات جي بي تي', 'شاتجبت'] },
  { slug: 'google-gemini', name: 'Google Gemini و AI Studio', terms: ['gemini', 'google ai studio', 'vertex ai', 'nano banana', 'veo', 'imagen', 'جيميناي'] },
  { slug: 'claude-anthropic', name: 'Claude و Anthropic', terms: ['claude', 'anthropic', 'opus', 'sonnet', 'haiku'] },
  { slug: 'ai-agents-automation', name: 'AI Agents والأتمتة', terms: ['agent', 'agents', 'ai agent', 'n8n', 'automation', 'automate', 'mcp', 'model context protocol', 'وكيل', 'وكلاء', 'أتمتة', 'اتمتة'] },
  { slug: 'coding-ai', name: 'البرمجة بالذكاء الاصطناعي', terms: ['coding', 'code', 'programming', 'developer', 'cursor', 'vscode', 'github', 'برمجة', 'كود', 'مطور'] },
  { slug: 'design-image-ai', name: 'التصميم وتوليد الصور', terms: ['image', 'photo', 'design', 'canva', 'midjourney', 'leonardo', 'photoshop', 'تصميم', 'صورة', 'صور', 'فوتوشوب'] },
  { slug: 'video-generation-ai', name: 'توليد وتحرير الفيديو', terms: ['runway', 'pika', 'veo', 'sora', 'capcut', 'video generation', 'توليد الفيديو', 'تحرير الفيديو', 'مونتاج'] },
  { slug: 'research-study-ai', name: 'البحث والدراسة بالذكاء الاصطناعي', terms: ['notebooklm', 'zotero', 'research', 'study', 'paper', 'pdf', 'scientific', 'دراسة', 'بحث', 'مذاكرة', 'تعلم', 'تعليم'] },
  { slug: 'presentations-documents', name: 'العروض والملفات والمستندات', terms: ['slides', 'slide deck', 'powerpoint', 'word', 'docs', 'document', 'pdf', 'presentation', 'عرض', 'عروض', 'ملف', 'مستند'] },
  { slug: 'ai-news-comparisons', name: 'أخبار ومقارنات نماذج AI', terms: ['news', 'launch', 'release', 'compare', 'comparison', 'vs', 'benchmark', 'إطلاق', 'مقارنة', 'أخبار', 'اختبار ضد'] },
  { slug: 'chinese-open-models', name: 'النماذج الصينية والمفتوحة', terms: ['deepseek', 'kimi', 'glm', 'qwen', 'alibaba', 'open source', 'local model', 'ollama', 'مفتوحة المصدر', 'النماذج الصينية'] },
  { slug: 'perplexity-search', name: 'Perplexity والبحث الذكي', terms: ['perplexity', 'search ai', 'ai search', 'بحث ذكي'] },
  { slug: 'prompts-ai-skills', name: 'Prompts ومهارات استخدام AI', terms: ['prompt', 'prompts', 'prompting', 'skill', 'skills', 'برومبت', 'أوامر', 'اوامر', 'مهارات'] },
  { slug: 'productivity-ai-tools', name: 'أدوات الإنتاجية بالذكاء الاصطناعي', terms: ['productivity', 'tool', 'tools', 'workflow', 'browser', 'extension', 'إنتاجية', 'انتاجية', 'أداة', 'اداة', 'أدوات', 'ادوات'] }
];

const COMMON_KEYWORDS = [
  'الذكاء الاصطناعي',
  'AI',
  'أدوات AI',
  'شرح أدوات الذكاء الاصطناعي',
  'هبة أحمد'
];

export function slugify(input, fallback = 'item') {
  const cleaned = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return cleaned || fallback;
}

function scoreTopic(rule, title, playlistText, bodyText) {
  let score = 0;
  for (const term of rule.terms) {
    const normalized = term.toLowerCase();
    if (title.includes(normalized)) score += 4;
    if (playlistText.includes(normalized)) score += 3;
    if (bodyText.includes(normalized)) score += 1;
  }
  return score;
}

export function inferTopics(video, playlistNames = []) {
  const title = `${video.title || ''}`.toLowerCase();
  const playlistText = playlistNames.join(' ').toLowerCase();
  const bodyText = `${video.description || ''} ${(video.tags || []).join(' ')}`.toLowerCase();

  const matches = TOPIC_RULES
    .map((topic) => ({ ...topic, score: scoreTopic(topic, title, playlistText, bodyText) }))
    .filter((topic) => topic.score >= 3)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ar'))
    .slice(0, 3)
    .map(({ slug, name }) => ({ slug, name }));

  return matches.length ? matches : [{ slug: 'productivity-ai-tools', name: 'أدوات الإنتاجية بالذكاء الاصطناعي' }];
}

export function buildSeo(video, playlistNames = []) {
  const title = video.title || 'فيديو عن الذكاء الاصطناعي';
  const topics = inferTopics(video, playlistNames);
  const keywords = Array.from(new Set([
    ...COMMON_KEYWORDS,
    ...topics.map((topic) => topic.name),
    ...playlistNames,
    ...(video.tags || []).slice(0, 8)
  ])).filter(Boolean).slice(0, 14);

  const description = video.description?.replace(/\s+/g, ' ').trim();
  const summary = description
    ? description.slice(0, 220)
    : `شاهد شرح ${title} مع هبة أحمد ضمن مكتبة عربية منظمة لفيديوهات الذكاء الاصطناعي.`;

  return {
    taxonomyVersion: TAXONOMY_VERSION,
    title: `${title} | شرح عربي للذكاء الاصطناعي`,
    slug: `${slugify(title, 'video')}-${video.id}`,
    metaDescription: summary.slice(0, 155),
    summary,
    keywords,
    topics,
    faq: [
      {
        question: `ما موضوع فيديو ${title}؟`,
        answer: `الفيديو يشرح ${title} بطريقة عربية عملية ويرتبط بموضوعات ${topics.map((topic) => topic.name).join('، ')}.`
      },
      {
        question: 'هل يمكن مشاهدة الشرح من الموقع؟',
        answer: 'نعم، يمكنك مشاهدة الفيديو مباشرة من الصفحة أو فتحه على قناة هبة أحمد في يوتيوب.'
      }
    ]
  };
}

export function shouldReuseSeo(seo) {
  return seo?.taxonomyVersion === TAXONOMY_VERSION;
}

export function mergeTopics(videos) {
  const topicMap = new Map();
  for (const video of videos) {
    for (const topic of video.seo?.topics || []) {
      if (!topicMap.has(topic.slug)) {
        topicMap.set(topic.slug, { ...topic, count: 0 });
      }
      topicMap.get(topic.slug).count += 1;
    }
  }
  return [...topicMap.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ar'));
}
