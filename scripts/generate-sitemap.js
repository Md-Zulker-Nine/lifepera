const fs = require('fs');

const SITE = 'https://lifepera.com';

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// Derive lastmod from post filename (blog/post-YYYY-MM-DD-slug.html); fallback to today.
function lastModFromFile(file) {
  const m = file.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : today();
}

const urls = [];

// 1) Core pages
urls.push(
  { loc: `${SITE}/`, freq: 'daily', pri: '1.0', mod: today() },
  { loc: `${SITE}/tools.html`, freq: 'weekly', pri: '0.9' },
  { loc: `${SITE}/blog.html`, freq: 'daily', pri: '0.8' },
  { loc: `${SITE}/about.html`, freq: 'monthly', pri: '0.6' },
  { loc: `${SITE}/contact.html`, freq: 'monthly', pri: '0.5' },
  { loc: `${SITE}/privacy.html`, freq: 'yearly', pri: '0.4' },
  { loc: `${SITE}/terms.html`, freq: 'yearly', pri: '0.4' }
);

// 2) Tools — sourced dynamically from all_tools.json
try {
  const tools = JSON.parse(fs.readFileSync('all_tools.json', 'utf8'));
  for (const t of tools) {
    if (!t.file || !t.file.endsWith('.html')) continue;
    urls.push({ loc: `${SITE}/${t.file}`, freq: 'monthly', pri: '0.8' });
  }
} catch (e) {
  console.error('WARN: could not read all_tools.json:', e.message);
}

// 3) Blog posts — sourced dynamically from blog-index.json
let postCount = 0;
try {
  const posts = JSON.parse(fs.readFileSync('blog-index.json', 'utf8'));
  if (Array.isArray(posts)) {
    for (const p of posts) {
      if (!p.file || !p.file.endsWith('.html')) continue;
      // Only include posts whose file actually exists on disk
      if (!fs.existsSync(p.file)) continue;
      urls.push({ loc: `${SITE}/${p.file}`, freq: 'monthly', pri: '0.7', mod: lastModFromFile(p.file) });
      postCount++;
    }
  }
} catch (e) {
  console.error('WARN: could not read blog-index.json:', e.message);
}

// Safety net: also include any blog/*.html on disk that are missing from blog-index.json
try {
  if (fs.existsSync('blog')) {
    for (const f of fs.readdirSync('blog')) {
      if (!f.endsWith('.html')) continue;
      const rel = `blog/${f}`;
      if (urls.some(u => u.loc === `${SITE}/${rel}`)) continue;
      urls.push({ loc: `${SITE}/${rel}`, freq: 'monthly', pri: '0.7', mod: lastModFromFile(rel) });
      postCount++;
    }
  }
} catch (e) {
  console.error('WARN: could not scan blog/ directory:', e.message);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ''}<changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>
`;

fs.writeFileSync('sitemap.xml', xml);
console.log(`sitemap.xml regenerated: ${urls.length} URLs (${postCount} blog posts included).`);
