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
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f8f9fa;--surface:#fff;--text:#202124;--muted:#5f6368;--blue:#1a73e8;--border:#dadce0;--radius:12px;--max-w:1200px}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--blue);text-decoration:none}
header{background:rgba(255,255,255,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1000}
.nav{max-width:var(--max-w);margin:0 auto;padding:0 1.5rem;height:72px;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;display:flex;align-items:center;gap:8px}
.logo span{color:var(--blue)}
.badge{background:#e8f0fe;color:var(--blue);font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:.5px}
.nav-links{display:flex;gap:2rem;font-weight:600;font-size:.92rem;align-items:center}
.nav-links a{color:var(--muted)}.nav-links a:hover{color:var(--blue)}
main{max-width:860px;margin:2rem auto;padding:0 1.5rem}
.post-cat{font-size:.82rem;font-weight:600;text-transform:uppercase;color:var(--blue);margin-bottom:.5rem;letter-spacing:.5px}
h1{font-size:2.5rem;font-weight:800;line-height:1.15;margin-bottom:1rem;letter-spacing:-.5px}
.meta{font-size:.88rem;color:var(--muted);padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem;display:flex;align-items:center;gap:.8rem}
.body{font-size:1.05rem;line-height:1.8}
.body p{margin-bottom:1.3rem;color:var(--text)}
.body h2{font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}
.body strong{font-weight:700}.body ul{margin:1rem 0 1.5rem 1.5rem}.body li{margin-bottom:.5rem;line-height:1.7}
.editorial-note{background:#f1f3f4;border-left:4px solid var(--blue);padding:1rem 1.2rem;margin:2rem 0;font-size:.92rem;color:var(--muted);line-height:1.6}.editorial-note a{font-weight:600}
.sources{margin:1.5rem 0;color:var(--muted);font-size:.9rem}.sources summary{cursor:pointer;font-weight:600;color:var(--blue)}.sources p{margin:.75rem 0}.sources ul{padding-left:1.5rem}.sources li{margin:.4rem 0;overflow-wrap:anywhere}
footer{background:#111827;color:#9ca3af;border-top:1px solid #1f2937;padding:4rem 1.5rem 2rem;margin-top:4rem}
.footer-inner{max-width:var(--max-w);margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2.5rem}
.footer-brand .logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;color:#fff;margin-bottom:1rem}
.footer-brand p{font-size:.88rem;color:#9ca3af;line-height:1.6;max-width:320px;margin-bottom:1.5rem}
.trust{display:inline-flex;align-items:center;gap:8px;background:#1f2937;border:1px solid #374151;padding:6px 12px;border-radius:6px;font-size:.78rem;color:#d1d5db;font-weight:500}
.f-col h4{font-size:1rem;font-weight:700;color:#fff;margin-bottom:1.2rem;letter-spacing:.5px}
.f-col ul{list-style:none}.f-col li{margin-bottom:.7rem}.f-col a{color:#9ca3af;font-size:.88rem}.f-col a:hover{color:#fff}
.footer-bot{max-width:var(--max-w);margin:3rem auto 0;padding-top:2rem;border-top:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center;font-size:.82rem;color:#9ca3af}
.footer-disc{max-width:var(--max-w);margin:1.5rem auto 0;font-size:.76rem;color:#9ca3af;line-height:1.5;text-align:center}
@media(max-width:900px){.footer-inner{grid-template-columns:1fr}.footer-bot{flex-direction:column;gap:1rem;text-align:center}h1{font-size:1.8rem}}
@media(max-width:700px){.nav-links{gap:.8rem;font-size:.82rem}.logo{font-size:1.3rem}main{padding:0 1rem}}
</style>
</head>
<body>
<header>
<div class="nav">
<a href="/" class="logo">Life<span>Pera</span><span class="badge">Pro</span></a>
<div class="nav-links"><a href="/tools">Tools</a><a href="/blog">Blog</a><a href="/about">About</a><a href="/contact">Contact</a></div>
</div>
</header>
<main>
<div class="post-cat">${safeCategory}</div>
<h1>${safeTitle}</h1>
<div class="meta">By LifePera · ${displayDate}</div>
<article class="body">${body}</article>
</main>
<footer>
<div class="footer-inner">
<div class="footer-brand">
<a href="/" class="logo" style="color:#fff">Life<span style="color:#1a73e8">Pera</span></a>
<p>Free browser-based tools for real life decisions. No signup required.</p>
<span class="trust">Free tools | Privacy-conscious | No signup</span>
</div>
<div class="f-col"><h4>Popular Tools</h4><ul><li><a href="/tool-how-rich">"How Rich Am I?" Comparator</a></li><li><a href="/tool-visa">Visa-Free Travel Checker</a></li><li><a href="/tool-quit-job">Should I Quit My Job?</a></li><li><a href="/tool-underpaid">Am I Underpaid? Analyzer</a></li><li><a href="/tool-attachment">Attachment Style Quiz</a></li></ul></div>
<div class="f-col"><h4>Company &amp; Trust</h4><ul><li><a href="/about">About Us</a></li><li><a href="/about#editorial">Editorial Policy</a></li><li><a href="/blog">Editorial Blog</a></li><li><a href="/contact">Contact &amp; Support</a></li></ul></div>
<div class="f-col"><h4>Legal &amp; Standards</h4><ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul></div>
</div>
<div class="footer-disc">Disclaimer: LifePera tools and calculators are provided for informational and educational purposes only. They do not constitute formal financial, legal, medical, or career advice.</div>
<div class="footer-bot"><span>&copy; ${new Date().getUTCFullYear()} LifePera. All rights reserved.</span><span>Built for curious minds worldwide.</span></div>
</footer>
<script src="/cookie-consent.js"></script>
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
