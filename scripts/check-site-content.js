const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const vm = require('vm');

const root = path.join(__dirname, '..');
const failures = [];
const htmlFiles = [];

function collectHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'drafts') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectHtml(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
}

function routeExists(sourceFile, route) {
  const cleanRoute = decodeURIComponent(route.split(/[?#]/)[0]);
  if (!cleanRoute) return true;
  const target = cleanRoute.startsWith('/')
    ? path.join(root, cleanRoute.slice(1))
    : path.resolve(path.dirname(sourceFile), cleanRoute);
  return fs.existsSync(target) || fs.existsSync(`${target}.html`) || fs.existsSync(path.join(target, 'index.html'));
}

collectHtml(root);
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  for (const match of content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const url = match[1];
    if (!url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) continue;
    if (!routeExists(file, url)) failures.push(`${relative}: missing local link or resource "${url}"`);
  }
}

const posts = JSON.parse(fs.readFileSync(path.join(root, 'blog-index.json'), 'utf8'));
const indexedFiles = new Set();
const indexedTitles = new Set();
for (const post of posts) {
  if (!post.file || !post.title || !post.excerpt) {
    failures.push(`Blog index entry is missing title, file, or excerpt: ${post.title || '(untitled)'}`);
    continue;
  }
  if (indexedFiles.has(post.file) || indexedTitles.has(post.title)) {
    failures.push(`Duplicate blog index entry: ${post.title}`);
  }
  indexedFiles.add(post.file);
  indexedTitles.add(post.title);
  if (!post.file.startsWith('blog/') || !fs.existsSync(path.join(root, post.file))) {
    failures.push(`Blog index points to a missing post: ${post.file}`);
  } else {
    const content = fs.readFileSync(path.join(root, post.file), 'utf8');
    const heading = content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const normalize = value => value
      .replace(/&amp;/g, '&')
      .replace(/&#39;|&apos;|&#x27;/gi, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!heading || normalize(heading[1]) !== normalize(post.title)) {
      failures.push(`${post.file}: H1 does not match the title in blog-index.json.`);
    }
  }
}

const postDirectory = path.join(root, 'blog');
for (const entry of fs.readdirSync(postDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    const relative = `blog/${entry.name}`;
    if (!indexedFiles.has(relative)) failures.push(`Published post is missing from blog-index.json: ${relative}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const post of posts) {
  const publicPath = post.file.replace(/\.html$/, '');
  if (!sitemap.includes(`https://lifepera.com/${publicPath}`)) {
    failures.push(`Published post is missing from sitemap.xml: ${post.file}`);
  }
  const page = fs.readFileSync(path.join(root, post.file), 'utf8');
  const modified = page.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (modified && !sitemap.includes(`<loc>https://lifepera.com/${publicPath}</loc><lastmod>${modified[1]}</lastmod>`)) {
    failures.push(`${post.file}: sitemap lastmod must match the article's dateModified.`);
  }
}

function checkCanonical(relative, expected) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  const tag = content.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i);
  const href = tag && tag[0].match(/\bhref=["']([^"']+)["']/i);
  if (!href || href[1] !== expected) failures.push(`${relative}: canonical URL must be ${expected}`);
}
function getMetaContent(content, attribute, value) {
  const tags = content.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(candidate => new RegExp(`\\b${attribute}=["']${value}["']`, 'i').test(candidate));
  const contentMatch = tag && tag.match(/\bcontent=(["'])(.*?)\1/i);
  return contentMatch ? contentMatch[2] : '';
}
function normalizeTitle(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
for (const post of posts) {
  checkCanonical(post.file, `https://lifepera.com/${post.file.replace(/\.html$/, '')}`);
  const content = fs.readFileSync(path.join(root, post.file), 'utf8');
  const titleTag = content.match(/<title>([\s\S]*?)<\/title>/i);
  const expectedTitle = `${post.title} — LifePera`;
  if (!titleTag || normalizeTitle(titleTag[1]) !== normalizeTitle(expectedTitle) ||
      normalizeTitle(getMetaContent(content, 'property', 'og:title')) !== normalizeTitle(expectedTitle) ||
      normalizeTitle(getMetaContent(content, 'name', 'twitter:title')) !== normalizeTitle(expectedTitle)) {
    failures.push(`${post.file}: <title>, Open Graph, Twitter, and blog-index headlines must agree.`);
  }
  if (!/<div class="meta"><span>LifePera<\/span>/.test(content)) {
    failures.push(`${post.file}: published author byline must use LifePera.`);
  }
  if (/author-bio|60\+ deep-dive guides|Zulker builds data-driven decision tools/i.test(content)) {
    failures.push(`${post.file}: contains a superseded personal-author claim.`);
  }
}

const tools = JSON.parse(fs.readFileSync(path.join(root, 'all_tools.json'), 'utf8'));
if (tools.length !== 34) failures.push(`Expected 34 active tools after retiring unsupported tools; found ${tools.length}.`);
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/tool-(?:tap-water|country-match)(?:\.html)?/i.test(content)) {
    failures.push(`${path.relative(root, file)}: links to a retired tool remain.`);
  }
}
for (const route of ['/tool-tap-water', '/tool-tap-water.html', '/tool-country-match', '/tool-country-match.html']) {
  if (!new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+/tools\\s+301$`, 'm')
    .test(fs.readFileSync(path.join(root, '_redirects'), 'utf8'))) {
    failures.push(`Retired tool route must redirect to /tools: ${route}`);
  }
  if (sitemap.includes(`https://lifepera.com/${route.replace(/\.html$/, '')}`)) {
    failures.push(`Retired tool route must be removed from sitemap.xml: ${route}`);
  }
}
let guidanceCount = 0;
for (const tool of tools) {
  if (!tool.file || !fs.existsSync(path.join(root, tool.file))) {
    failures.push(`Tool index points to a missing page: ${tool.file || '(no file)'}`);
  }
  if (tool.file && !sitemap.includes(`https://lifepera.com/${tool.file.replace(/\.html$/, '')}`)) {
    failures.push(`Tool is missing from sitemap.xml: ${tool.file}`);
  }
  if (tool.file && fs.existsSync(path.join(root, tool.file))) {
    checkCanonical(tool.file, `https://lifepera.com/${tool.file.replace(/\.html$/, '')}`);
    const content = fs.readFileSync(path.join(root, tool.file), 'utf8');
    const guidance = content.match(/<section data-editorial-section="additional-guidance">([\s\S]*?)<\/section>/);
    if (!guidance) {
      failures.push(`${tool.file}: missing its tool-specific additional guidance.`);
    } else {
      guidanceCount += 1;
      const wordCount = (guidance[1].replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
      if (wordCount < 70) failures.push(`${tool.file}: additional guidance is too short (${wordCount} words).`);
    }
    const guide = content.match(/<div class="tool-guide">([\s\S]*?)<\/div>/);
    if (guide) {
      const headings = [...guide[1].matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
        .map(match => normalizeTitle(match[1].replace(/<[^>]+>/g, ' ')).toLowerCase());
      if (new Set(headings).size !== headings.length) failures.push(`${tool.file}: tool guide contains duplicate section headings.`);
    }
  }
}
if (guidanceCount !== tools.length) failures.push(`Expected additional guidance on all ${tools.length} tools; found ${guidanceCount}.`);

for (const route of ['', 'tools', 'blog', 'about', 'contact', 'privacy', 'terms']) {
  if (!sitemap.includes(`https://lifepera.com/${route}`)) {
    failures.push(`Core page is missing from sitemap.xml: /${route}`);
  }
  checkCanonical(route ? `${route}.html` : 'index.html', `https://lifepera.com/${route}`);
}
for (const file of ['tool-tap-water.html', 'tool-country-match.html']) {
  if (fs.existsSync(path.join(root, file))) failures.push(`Retired tool page must not be published: ${file}`);
}
for (const [file, expected] of [['index.html', 34], ['tools.html', 34]]) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  const cardCount = [...content.matchAll(/<a class="card"/g)].length;
  if (cardCount !== expected) failures.push(`${file}: expected ${expected} active tool cards; found ${cardCount}.`);
}

const blogHtml = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
const cardRegion = blogHtml.match(/<!-- BLOG_POSTS_START -->([\s\S]*?)<!-- BLOG_POSTS_END -->/);
if (!cardRegion) {
  failures.push('blog.html is missing its pre-rendered card markers.');
} else {
  const cards = [...cardRegion[1].matchAll(/class="post-card"/g)];
  const excerpts = [...cardRegion[1].matchAll(/class="post-excerpt"/g)];
  if (cards.length === 0 || cards.length !== excerpts.length) {
    failures.push('Initial blog HTML must include an excerpt for every pre-rendered card.');
  }
  if (posts.length && !cardRegion[1].includes(posts[0].file.replace(/\.html$/, ''))) {
    failures.push('The first pre-rendered blog card is not the latest indexed post.');
  }
}

const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'main-blog.yml'), 'utf8');
if (!/^\s{2}workflow_dispatch:/m.test(workflow) ||
    /^\s{2}(?:push|pull_request|workflow_run):/m.test(workflow) ||
    !/^\s{2}schedule:\s*$/m.test(workflow) ||
    !/cron:\s*['"]0 6 \* \* \*['"]/.test(workflow) ||
    !/steps\.topic\.outputs\.run\s*==\s*'true'/.test(workflow) ||
    !/contents:\s*write/.test(workflow) ||
    !/inputs\.intent/.test(workflow) ||
    !/git\s+push\b/.test(workflow)) {
  failures.push('Blog workflow must publish generated posts every 48 hours and accept a reader intent.');
}
const topicSelector = fs.readFileSync(path.join(root, 'scripts', 'select-blog-topic.js'), 'utf8');
if (!/daysSinceAnchor\s*%\s*2\s*===\s*0/.test(topicSelector)) {
  failures.push('Scheduled blog posts must be published every 48 hours.');
} else {
  for (const [date, expectedRun, expectedTitle] of [
    ['2026-10-04', 'true', 'How to compare total compensation across job offers'],
    ['2026-10-05', 'false', ''],
    ['2026-10-06', 'true', 'How to check a rental listing before paying a deposit'],
    ['2026-10-07', 'false', ''],
  ]) {
    const output = execFileSync(process.execPath, [path.join(root, 'scripts', 'select-blog-topic.js')], {
      encoding: 'utf8',
      env: { ...process.env, TOPIC_DATE: date, GITHUB_OUTPUT: '' },
    });
    const lines = output.split(/\r?\n/);
    if (!lines.includes(`run=${expectedRun}`) ||
        (expectedTitle && !lines.includes(`intent=${expectedTitle}`)) ||
        (!expectedTitle && lines.some(line => line.startsWith('intent=')))) {
      failures.push(`48-hour intent selector returned the wrong schedule result for ${date}.`);
    }
  }
}
const editorialChecks = [
  {
    file: 'blog/post-2026-08-10-can-you-drink-the-tap-water-a-guide-for-50-countries.html',
    forbidden: ['The 50-Country Tap Water Safety Matrix', 'Safe to Drink Directly from the Tap'],
    required: ['https://wwwnc.cdc.gov/travel/page/food-water-safety', 'https://wwwnc.cdc.gov/travel/page/water-disinfection'],
  },
  {
    file: 'blog/post-2026-08-05-how-to-know-if-youre-being-underpaid-in-2026.html',
    forbidden: ['20% to 40%', '75th percentile', 'between $95,000 and $110,000'],
    required: ['https://www.bls.gov/oes/'],
  },
];
for (const check of editorialChecks) {
  const content = fs.readFileSync(path.join(root, check.file), 'utf8');
  for (const phrase of check.forbidden) {
    if (content.includes(phrase)) failures.push(`${check.file}: unsupported audited claim remains: "${phrase}".`);
  }
  for (const phrase of check.required) {
    if (!content.includes(phrase)) failures.push(`${check.file}: missing grounding or qualification: "${phrase}".`);
  }
}
const generator = fs.readFileSync(path.join(root, 'scripts', 'generate-blog-post.js'), 'utf8');
const titleValidatorSource = generator.match(/function validateTitle\(value\) \{[\s\S]*?\n\}/);
if (!titleValidatorSource) {
  failures.push('Blog post generator is missing its title quality gate.');
} else {
  const validateTitle = vm.runInNewContext(`${titleValidatorSource[0]}; validateTitle;`);
  validateTitle('How to compare total compensation across job offers');
  try {
    validateTitle('The tipping trap: why requests keep draining your budget');
    failures.push('Blog title quality gate allowed a repeated headline formula.');
  } catch (error) {
    if (!/repetitive headline formula/.test(error.message)) throw error;
  }
}
if (!/BLOG_INTENT/.test(generator) ||
    !/TITLE:\s*\[a specific, natural, original title generated/.test(generator) ||
    !/posts\.unshift\(/.test(generator) ||
    !/class="footer-inner"/.test(generator) ||
    !/Popular Tools/.test(generator) ||
    !/href="\/about#editorial">Editorial Policy/.test(generator) ||
    !/Legal &amp; Standards/.test(generator) ||
    !/footer-disc/.test(generator) ||
    !/footer-bot/.test(generator) ||
    !/cookie-consent\.js/.test(generator)) {
  failures.push('Blog publisher must generate and index posts from reader intent and provide the standard site footer.');
}
for (const title of indexedTitles) {
  if (/\b(?:stealth[- ]draining|the\s+.+?\s+trap\b|the\s+.+?\s+epidemic\b|and how to reclaim)\b/i.test(title)) {
    failures.push(`Blog index title still uses a repeated headline formula: ${title}`);
  }
}
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (/adsbygoogle\.js/i.test(content)) {
    failures.push(`${relative}: AdSense must not load directly from HTML before consent.`);
  }
  if (/Last reviewed\s*:|Last data review\s*:|Framework reviewed\s*:|rates updated quarterly|Data Engine|500\+ global destinations|authored 60\+ deep-dive guides|personally review every tool|free forever|free premium tools|globally inclusive - works for users worldwide|Free tools \? Privacy-conscious \? No signup|<div\s+<div/i.test(content)) {
    failures.push(`${relative}: contains a superseded editorial claim or malformed CTA markup.`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Site content checks passed: ${posts.length} indexed posts, ${tools.length} tools, ${htmlFiles.length} HTML pages.`);
