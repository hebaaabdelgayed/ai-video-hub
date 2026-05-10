const TOPIC_RULES = [
  { slug: 'chatgpt', name: 'ChatGPT', terms: ['chatgpt', 'شات جي بي تي', 'شاتجبت', 'gpt'] },
  { slug: 'ai-tools', name: 'أدوات الذكاء الاصطناعي', terms: ['tool', 'tools', 'اداة', 'أداة', 'ادوات', 'أدوات'] },
  { slug: 'image-ai', name: 'توليد الصور بالذكاء الاصطناعي', terms: ['image', 'photo', 'صورة', 'صور', 'midjourney', 'leonardo', 'canva'] },
  { slug: 'video-ai', name: 'توليد الفيديو بالذكاء الاصطناعي', terms: ['video', 'فيديو', 'runway', 'pika', 'sora'] },
  { slug: 'productivity', name: 'الإنتاجية والعمل بالذكاء الاصطناعي', terms: ['productivity', 'انتاجية', 'إنتاجية', 'work', 'شغل', 'عمل'] },
  { slug: 'education-ai', name: 'الذكاء الاصطناعي للتعلم', terms: ['learn', 'study', 'تعلم', 'تعليم', 'دراسة'] },
  { slug: 'prompts', name: 'برومبتات وأوامر AI', terms: ['prompt', 'prompts', 'برومبت', 'اوامر', 'أوامر'] }
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

export function inferTopics(video) {
  const haystack = `${video.title || ''} ${video.description || ''} ${(video.tags || []).join(' ')}`.toLowerCase();
  const matches = TOPIC_RULES.filter((topic) => topic.terms.some((term) => haystack.includes(term.toLowerCase())));
  return matches.length ? matches.map(({ slug, name }) => ({ slug, name })) : [{ slug: 'ai-tools', name: 'أدوات الذكاء الاصطناعي' }];
}

export function buildSeo(video, playlistNames = []) {
  const title = video.title || 'فيديو عن الذكاء الاصطناعي';
  const topics = inferTopics(video);
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
