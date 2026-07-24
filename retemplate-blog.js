/**
 * retemplate-blog.js
 *
 * Re-applies the CURRENT blog-post.html master template to every
 * already-generated post in /blog/, so old posts stop carrying whatever
 * old design happened to be baked in when they were first created.
 *
 * It does NOT touch your article content — it only pulls out:
 *   - <title>
 *   - .post-cat text
 *   - <h1> text
 *   - .meta text
 *   - the emoji (from .hero-icon-box OR the older .hero-img)
 *   - the .body div's inner HTML (your actual article paragraphs)
 * ...and re-injects them into a fresh copy of blog-post.html.
 *
 * USAGE:
 *   1. Put this file in your repo root (same level as blog-post.html)
 *   2. Run:  node retemplate-blog.js
 *   3. Check the diffs, then commit + push
 *
 * Safe to re-run any time you update blog-post.html's design —
 * it will re-stamp every post again with the latest look.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATE_PATH = path.join(ROOT, 'blog-post.html');
const BLOG_DIR = path.join(ROOT, 'blog');

if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('❌ Could not find blog-post.html in', ROOT);
  process.exit(1);
}
if (!fs.existsSync(BLOG_DIR)) {
  console.error('❌ Could not find /blog directory in', ROOT);
  process.exit(1);
}

const masterTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function extract(regex, html, groupIndex = 1) {
  const match = html.match(regex);
  return match ? match[groupIndex] : null;
}

function extractBodyContent(html) {
  // Grab everything between <div class="body"> and the NEXT top-level
  // closing </div> that precedes the tool-cta / share-row block.
  // This assumes the article body itself has no unescaped top-level
  // sibling <div> tags (true for Gemini's h2/p/ul/li/strong output).
  const startMarker = '<div class="body">';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;

  const afterStart = startIdx + startMarker.length;

  // Look for the first "</div>" that appears right before a known
  // next-section marker (tool-cta or share-row), scanning forward.
  const rest = html.slice(afterStart);
  const endMarkers = ['<div class="tool-cta"', '<div class="share-row"'];
  let cutIdx = -1;
  for (const marker of endMarkers) {
    const idx = rest.indexOf(marker);
    if (idx !== -1 && (cutIdx === -1 || idx < cutIdx)) cutIdx = idx;
  }
  if (cutIdx === -1) return null;

  // Walk backward from cutIdx to the nearest preceding "</div>"
  const beforeMarker = rest.slice(0, cutIdx);
  const lastCloseDiv = beforeMarker.lastIndexOf('</div>');
  if (lastCloseDiv === -1) return null;

  return beforeMarker.slice(0, lastCloseDiv).trim();
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  const title =
    extract(/<title>(.*?)<\/title>/i, original) ||
    extract(/<h1[^>]*>(.*?)<\/h1>/i, original);

  const postCat = extract(/<div class="post-cat">(.*?)<\/div>/i, original);
  const h1 = extract(/<h1[^>]*>(.*?)<\/h1>/i, original);
  const meta = extract(/<div class="meta">(.*?)<\/div>/i, original);

  // emoji may live in .hero-icon-box (new template) or .hero-img (old one)
  const emoji =
    extract(/<div class="hero-icon-box">(.*?)<\/div>/i, original) ||
    extract(/<div class="hero-img">(.*?)<\/div>/i, original);

  const bodyContent = extractBodyContent(original);

  if (!title || !postCat || !h1 || !meta || !emoji || !bodyContent) {
    console.warn(`⚠️  Skipped (couldn't extract all fields): ${path.basename(filePath)}`);
    return false;
  }

  let rebuilt = masterTemplate
    .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<div class="post-cat">.*?<\/div>/i, `<div class="post-cat">${postCat}</div>`)
    .replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${h1}</h1>`)
    .replace(/<div class="meta">.*?<\/div>/i, `<div class="meta">${meta}</div>`)
    .replace(/<div class="hero-icon-box">.*?<\/div>/i, `<div class="hero-icon-box">${emoji}</div>`)
    .replace(/<div class="body">[\s\S]*?<\/div>\s*<div class="tool-cta"/i, `<div class="body">\n${bodyContent}\n</div>\n\n<div class="tool-cta"`);

  fs.writeFileSync(filePath, rebuilt, 'utf8');
  console.log(`✅ Re-templated: ${path.basename(filePath)}`);
  return true;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));

console.log(`Found ${files.length} blog post(s). Re-templating...\n`);

let success = 0;
for (const file of files) {
  const ok = processFile(path.join(BLOG_DIR, file));
  if (ok) success++;
}

console.log(`\nDone. ${success}/${files.length} posts re-templated successfully.`);
if (success < files.length) {
  console.log('Any skipped files were left untouched — check them manually.');
}
