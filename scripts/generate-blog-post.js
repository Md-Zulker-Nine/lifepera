const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required.');

const intent = (process.env.BLOG_INTENT || '').trim();
const category = (process.env.BLOG_CATEGORY || '').trim() || 'General';
const keywords = (process.env.BLOG_KEYWORDS || '').trim();
if (!intent) throw new Error('BLOG_INTENT is required.');

const root = path.join(__dirname, '..');
const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function validateTitle(value) {
  if (value.length < 12 || value.length > 100) {
    throw new Error('The generated title must be between 12 and 100 characters.');
  }
  if (/\bstealth[- ]draining\b|\bthe\s+.+?\s+trap\b|\bthe\s+.+?\s+epidemic\b|\band how to reclaim\b/i.test(value)) {
    throw new Error('The generated title matches a repetitive headline formula.');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function wordCount(html) {
  return (html.replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
}

function validateBody(html) {
  const tags = html.match(/<\/?[^>]+>/g) || [];
  const allowedTags = new Set(['<h2>', '</h2>', '<p>', '</p>', '<ul>', '</ul>', '<li>', '</li>', '<strong>', '</strong>', '<em>', '</em>']);
  if (tags.some(tag => !allowedTags.has(tag.trim().toLowerCase()))) {
    throw new Error('The generated article contains unsupported HTML; refusing to publish it.');
  }

  const headings = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)]
    .map(match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase());
  const words = wordCount(html);
  if (new Set(headings).size < 4 || words < 700) {
    throw new Error(`Article quality gate failed: ${words} words and ${new Set(headings).size} distinct section headings (need at least 700 words and 4 headings).`);
  }
  if (headings.some(heading => /^(?:introduction|overview|conclusion|final thoughts|summary)$/i.test(heading))) {
    throw new Error('Article quality gate failed: generic section headings are not allowed.');
  }
}

function getGroundedSources(candidate) {
  const chunks = candidate.groundingMetadata?.groundingChunks || [];
  const unique = new Map();
  for (const chunk of chunks) {
    const web = chunk.web;
    if (!web?.uri) continue;
    let url;
    try {
      url = new URL(web.uri);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:') continue;
    unique.set(url.href, { title: web.title || url.hostname, url: url.href });
  }
  return [...unique.values()];
}

async function callGemini(prompt) {
  let lastError;
  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 8192 },
            tools: [{ googleSearch: {} }],
          }),
        });
        const data = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.map(part => part.text || '').join('').trim();
        if (response.ok && text) {
          return { text, sources: getGroundedSources(candidate) };
        }

        lastError = new Error(data.error?.message || `Gemini request failed with HTTP ${response.status}.`);
        if ((response.status === 429 || /quota/i.test(lastError.message)) && attempt < 3) {
          await sleep(20000);
          continue;
        }
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) await sleep(5000);
      }
    }
  }
  throw new Error(`Article generation failed: ${lastError?.message || 'all configured models failed.'}`);
}

function renderSources(sources) {
  return sources.map(source =>
    `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.title)}</a></li>`
  ).join('\n');
}

async function run() {
  const prompt = `Write a publish-ready LifePera informational article based on this reader intent.

Reader intent: ${intent}
Category: ${category}
Keywords or specific reader questions: ${keywords || 'Choose a useful, specific question or task that serves the reader intent.'}

First output exactly one plain-text line in this format: TITLE: [a specific, natural, original title generated for this article]. On the next line, begin the article body as HTML. Do not use a title template, colon-led formula, markdown, or a stock headline pattern. Do not include a title in the body.

Provide original, practical help: define the reader's problem, give a concrete decision process or checklist, explain limits and exceptions, and make clear what the reader can do next. Use only factual claims supported by the web search sources available to you. Do not invent statistics, studies, quotes, citations, firsthand experience, credentials, or claims that an editor reviewed the article. Avoid diagnosis or individualized financial, legal, health, or immigration advice. If reliable evidence is unavailable, state what remains uncertain.

Avoid repetitive headline and article formulas such as “The [X] Trap: Why ... (And How to Reclaim ...)”, “The [X] Epidemic”, “stealth-draining”, and generic lists of “signs” that do not add a useful method. Vary the section structure to fit the topic; do not use stock headings or repeat the title as the opening.

Write 700-1100 useful words with at least four distinct, descriptive section headings tied to this topic. Use only these HTML tags in the body: <h2>, <p>, <ul>, <li>, <strong>, <em>. Do not include a byline, source list, markdown fences, or any other HTML in the body.`;

  const generated = await callGemini(prompt);
  const result = generated.text.match(/^TITLE:\s*(.+)\r?\n([\s\S]+)$/i);
  if (!result) throw new Error('Generation must return a generated TITLE line followed by the article body.');

  const title = result[1].trim();
  const body = result[2].trim();
  validateTitle(title);
  validateBody(body);
  if (generated.sources.length < 3) {
    throw new Error(`Article quality gate failed: search grounding returned ${generated.sources.length} distinct HTTPS sources; at least 3 are required.`);
  }

  const indexPath = path.join(root, 'blog-index.json');
  const posts = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  if (posts.some(post => post.title.toLowerCase() === title.toLowerCase())) {
    throw new Error(`A post with the generated title already exists: ${title}`);
  }

  const date = new Date().toISOString().slice(0, 10);
  const displayDate = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-+$/g, '');
  const relativeFile = `blog/post-${date}-${slug}.html`;
  const postPath = path.join(root, relativeFile);
  if (fs.existsSync(postPath)) throw new Error(`A post already exists at ${relativeFile}; refusing to overwrite it.`);

  const publicUrl = `https://lifepera.com/${relativeFile.replace(/\.html$/, '')}`;
  const safeTitle = escapeHtml(title);
  const safeCategory = escapeHtml(category);
  const plainDescription = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const description = escapeHtml(plainDescription);
  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    author: { '@type': 'Organization', name: 'LifePera', url: 'https://lifepera.com/about#editorial' },
    publisher: { '@type': 'Organization', name: 'LifePera', url: 'https://lifepera.com' },
    datePublished: date,
    dateModified: date,
    description: plainDescription,
    mainEntityOfPage: { '@type': 'WebPage', '@id': publicUrl },
  };
  const safeArticleData = JSON.stringify(articleData).replace(/</g, '\\u003c');
  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="description" content="${description}"/><meta name="robots" content="index, follow"/>
<link rel="canonical" href="${publicUrl}"/>
<meta property="og:title" content="${safeTitle} — LifePera"/><meta property="og:description" content="${description}"/><meta property="og:url" content="${publicUrl}"/><meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${safeTitle} — LifePera"/><meta name="twitter:description" content="${description}"/>
<script type="application/ld+json">${safeArticleData}</script>
<title>${safeTitle} — LifePera</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f8f9fa;color:#202124;font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}a{color:#1a73e8;text-decoration:none}.nav{background:#fff;border-bottom:1px solid #dadce0;padding:1rem max(1rem,calc((100% - 1100px)/2));font-weight:700}.nav span{color:#1a73e8}main{max-width:820px;margin:2.5rem auto;padding:0 1.25rem}.category{color:#1a73e8;font-size:.85rem;font-weight:700;text-transform:uppercase}h1{font-size:clamp(2rem,6vw,2.8rem);line-height:1.2}.meta{color:#5f6368;border-bottom:1px solid #dadce0;padding-bottom:1rem}.body{font-size:1.05rem}.body p{margin:1.2rem 0}.body h2{margin-top:2.2rem;line-height:1.3}.body li{margin:.5rem 0}.sources,.policy{margin-top:2rem;padding:1rem 1.2rem;background:#eef2f7;border-radius:8px}.sources h2{font-size:1.15rem}.sources li{overflow-wrap:anywhere}footer{margin-top:4rem;background:#111827;color:#d1d5db;padding:2rem;text-align:center}footer a{color:#fff}
</style>
</head>
<body>
<header class="nav"><a href="/" style="color:#202124">Life<span>Pera</span></a> <a href="/blog" style="float:right">Blog</a></header>
<main>
<div class="category">${safeCategory}</div>
<h1>${safeTitle}</h1>
<div class="meta">By LifePera · ${displayDate}</div>
<article class="body">${body}</article>
</main>
<footer><a href="/blog">LifePera Blog</a> · <a href="/about#editorial">Editorial policy</a></footer>
</body>
</html>`;

  fs.writeFileSync(postPath, page, 'utf8');
  posts.unshift({
    title,
    cat: category,
    date: displayDate,
    file: relativeFile,
    excerpt: '',
  });
  fs.writeFileSync(indexPath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
  console.log(`Published ${relativeFile}`);
}

run().catch(error => {
  console.error(error.message);
  process.exit(1);
});
