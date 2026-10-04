const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const indexFile = path.join(root, 'blog-index.json');
const listingFile = path.join(root, 'blog.html');
const posts = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getExcerpt(html) {
  const bodyPosition = html.search(/class=["'][^"']*\b(?:body|article-body)\b[^"']*["']/i);
  const body = bodyPosition >= 0 ? html.slice(bodyPosition) : html;
  const firstParagraph = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!firstParagraph) return '';

  const plainText = decodeHtml(firstParagraph[1].replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (plainText.length <= 220) return plainText;
  const shortened = plainText.slice(0, 217);
  return `${shortened.slice(0, shortened.lastIndexOf(' '))}...`;
}

function card(post) {
  const file = post.file.replace(/\\/g, '/').replace(/\.html$/, '');
  return `<a class="post-card" href="${escapeHtml(file)}"><div class="post-icon">&#8226;</div><div class="post-body"><div class="post-cat">${escapeHtml(post.cat || 'Article')}</div><h2 class="post-title">${escapeHtml(post.title)}</h2><p class="post-excerpt">${escapeHtml(post.excerpt)}</p><div class="post-meta">By LifePera · ${escapeHtml(post.date || '')}</div></div></a>`;
}

if (!Array.isArray(posts) || posts.length === 0) {
  throw new Error('blog-index.json must contain at least one published post.');
}

for (const post of posts) {
  if (!post.file || !post.title) throw new Error('Every blog index entry must have a title and file.');
  const postFile = path.resolve(root, post.file);
  if (!postFile.startsWith(`${path.join(root, 'blog')}${path.sep}`) || !fs.existsSync(postFile)) {
    throw new Error(`Blog index points to a missing or out-of-scope file: ${post.file}`);
  }
  const excerpt = getExcerpt(fs.readFileSync(postFile, 'utf8'));
  if (!excerpt) throw new Error(`Could not extract a useful opening paragraph from ${post.file}.`);
  post.excerpt = excerpt;
}

const listing = fs.readFileSync(listingFile, 'utf8');
const start = '<!-- BLOG_POSTS_START -->';
const end = '<!-- BLOG_POSTS_END -->';
const startIndex = listing.indexOf(start);
const endIndex = listing.indexOf(end);
if (startIndex < 0 || endIndex < startIndex) {
  throw new Error('blog.html must contain BLOG_POSTS_START and BLOG_POSTS_END markers.');
}

const staticCards = posts.slice(0, 10).map(card).join('\n');
const allCardsLink = `<p style="text-align:center;margin-top:1rem"><a href="blog" style="font-weight:600">Browse all ${posts.length} articles &rarr;</a></p>`;
const counts = new Map();
for (const post of posts) {
  for (const category of (post.cat || '').split(/·|&/).map(value => value.trim())) {
    counts.set(category, (counts.get(category) || 0) + 1);
  }
}
const renderedListing = `${listing.slice(0, startIndex + start.length)}\n${staticCards}\n${allCardsLink}\n${listing.slice(endIndex)}`;
const updatedListing = renderedListing.replace(
  /(<a href="#[^"]+" onclick="filterByCat\('([^']+)'\);return false;">[^<]*<span class="num">)\(\d+\)/g,
  (match, prefix, category) => `${prefix}(${counts.get(category) || 0})`
);

fs.writeFileSync(indexFile, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
fs.writeFileSync(listingFile, updatedListing, 'utf8');
console.log(`Updated excerpts for ${posts.length} articles and pre-rendered ${Math.min(10, posts.length)} blog cards.`);
