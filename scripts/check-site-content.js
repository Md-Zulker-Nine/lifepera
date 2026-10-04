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
    /git\s+(?:add|commit|push)\b/.test(workflow) ||
    /contents:\s*write/.test(workflow)) {
  failures.push('Blog workflow must create drafts only, use its cadence gate, and never push content.');
}
const topicSelector = fs.readFileSync(path.join(root, 'scripts', 'select-blog-topic.js'), 'utf8');
if (!/daysSinceAnchor\s*%\s*3\s*===\s*0/.test(topicSelector)) {
  failures.push('Scheduled blog drafts must be gated to one run every three days.');
} else {
  for (const [date, expectedRun, expectedTitle] of [
    ['2026-10-04', 'true', 'How to compare total compensation across job offers'],
    ['2026-10-05', 'false', ''],
    ['2026-10-06', 'false', ''],
    ['2026-10-07', 'true', 'How to check a rental listing before paying a deposit'],
  ]) {
    const output = execFileSync(process.execPath, [path.join(root, 'scripts', 'select-blog-topic.js')], {
      encoding: 'utf8',
      env: { ...process.env, TOPIC_DATE: date, GITHUB_OUTPUT: '' },
    });
    const lines = output.split(/\r?\n/);
    if (!lines.includes(`run=${expectedRun}`) ||
        (expectedTitle && !lines.includes(`title=${expectedTitle}`)) ||
        (!expectedTitle && lines.some(line => line.startsWith('title=')))) {
      failures.push(`Three-day topic selector returned the wrong schedule result for ${date}.`);
    }
  }
}
const generator = fs.readFileSync(path.join(root, 'scripts', 'generate-blog-post.js'), 'utf8');
const titleValidatorSource = generator.match(/function validateTitle\(value\) \{[\s\S]*?\n\}/);
if (!titleValidatorSource) {
  failures.push('Blog draft generator is missing its title quality gate.');
} else {
  const validateTitle = vm.runInNewContext(`${titleValidatorSource[0]}; validateTitle;`);
  validateTitle('How to compare total compensation across job offers');
  try {
    validateTitle('The tipping trap: why requests keep draining your budget');
    failures.push('Blog title quality gate allowed a repeated headline formula.');
  } catch (error) {
    if (!/repeatedly used headline formula/.test(error.message)) throw error;
  }
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
