const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required.');

const title = (process.env.BLOG_TOPIC || '').trim();
const category = (process.env.BLOG_CATEGORY || '').trim() || 'General';
const keywords = (process.env.BLOG_KEYWORDS || '').trim();
if (!title) throw new Error('BLOG_TOPIC is required; generated posts are editorial drafts only.');

const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function validateTitle(value) {
  if (value.length < 12 || value.length > 100) {
    throw new Error('Choose a specific, readable title between 12 and 100 characters.');
  }
  if (/\bstealth[- ]draining\b|\bthe\s+.+?\s+trap\s*:|\bthe\s+.+?\s+epidemic\s*:|\band how to reclaim\b/i.test(value)) {
    throw new Error('This title matches a repeatedly used headline formula. Use a specific reader question or task instead.');
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
    throw new Error('The draft contains unsupported HTML; refusing to save it.');
  }

  const headings = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)]
    .map(match => match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase());
  const uniqueHeadings = new Set(headings);
  const words = wordCount(html);
  if (uniqueHeadings.size < 4 || words < 700) {
    throw new Error(`Draft quality gate failed: ${words} words and ${uniqueHeadings.size} distinct section headings (need at least 700 words and 4 distinct headings).`);
  }
  if (headings.some(heading => /^(?:introduction|overview|conclusion|final thoughts|summary)$/i.test(heading))) {
    throw new Error('Draft quality gate failed: replace generic section headings with headings specific to the reader’s question.');
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
  throw new Error(`Content draft generation failed: ${lastError?.message || 'all configured models failed.'}`);
}

function renderSources(sources) {
  return sources.map(source =>
    `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(source.title)}</a></li>`
  ).join('\n');
}

async function run() {
  validateTitle(title);
  const prompt = `Prepare an editorial draft for the LifePera blog.

Topic: ${title}
Category: ${category}
Keywords or reader questions: ${keywords || 'Choose a useful, specific reader question related to the topic.'}

This is a draft for a human editor, not publish-ready copy. Provide original, practical help rather than generic filler: define the reader's problem, give a concrete decision process or checklist, explain limits and meaningful exceptions, and make clear what the reader can do next. Use only factual claims supported by the web search sources available to you. Do not invent statistics, studies, quotes, citations, firsthand experience, credentials, or claims that an editor has reviewed the article. Avoid diagnosis or individualized financial, legal, health, or immigration advice. If reliable evidence is unavailable, say what remains uncertain.

Avoid repetitive headline and article formulas such as “The [X] Trap: Why ... (And How to Reclaim ...)”, “The [X] Epidemic”, “stealth-draining”, and generic lists of “signs” that do not add a useful method. Prefer the exact reader question, task, or decision in plain language. Vary section structure to fit the topic; do not reuse stock headings or repeat the title as the opening.

Write 700-1100 useful words with at least four distinct, descriptive section headings tied to this topic. Use only these HTML tags: <h2>, <p>, <ul>, <li>, <strong>, <em>. Do not include a title, author byline, source list, markdown fences, or any other HTML in the body.`;

  const generated = await callGemini(prompt);
  validateBody(generated.text);
  if (generated.sources.length < 3) {
    throw new Error(`Draft quality gate failed: search grounding returned ${generated.sources.length} distinct HTTPS sources; at least 3 are required.`);
  }

  const safeTitle = escapeHtml(title);
  const safeCategory = escapeHtml(category);
  const sourcesHtml = renderSources(generated.sources);
  const draft = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Draft: ${safeTitle} — LifePera</title>
  <style>
    body{font:16px/1.7 system-ui,sans-serif;color:#202124;max-width:820px;margin:2rem auto;padding:0 1rem}
    .status{padding:1rem;background:#fff4ce;border:1px solid #e5c75c;border-radius:8px}
    .status h1{font-size:1.3rem;margin:0 0 .5rem}
    main{margin-top:2rem}h2{margin-top:2rem}li{margin:.5rem 0}
  </style>
</head>
<body>
  <aside class="status">
    <h1>EDITORIAL DRAFT — NOT PUBLISHED</h1>
    <p>AI-assisted draft for ${safeCategory}. No author, review date, canonical URL, or article structured data is assigned.</p>
    <p>Before publication, verify every factual claim against the sources below, add useful original detail, check links and currentness, and obtain editor approval. Search results are leads, not proof that a claim is correct.</p>
  </aside>
  <main>
    <h1>${safeTitle}</h1>
    <div class="article-body">${generated.text}</div>
    <section aria-labelledby="sources-heading">
      <h2 id="sources-heading">Search sources for editorial verification</h2>
      <p>These pages were returned by search grounding for this draft. They have not been independently checked or mapped to individual claims.</p>
      <ul>${sourcesHtml}</ul>
    </section>
  </main>
</body>
</html>`;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'blog-draft';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDirectory = path.resolve(process.env.DRAFT_OUTPUT_DIR || path.join(__dirname, '..', 'drafts'));
  fs.mkdirSync(outputDirectory, { recursive: true });
  const filename = path.join(outputDirectory, `${timestamp}-${slug}.html`);
  fs.writeFileSync(filename, draft, 'utf8');
  console.log(`Saved unpublished editorial draft: ${filename}`);
  console.log(`Quality checks passed: ${wordCount(generated.text)} words, ${(generated.text.match(/<h2>/gi) || []).length} headings, ${generated.sources.length} grounded sources.`);
}

run().catch(error => {
  console.error(error.message);
  process.exit(1);
});
