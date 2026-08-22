const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('blog-index.json', 'utf8'));

const blogCrossCSS = `.maylike{margin:2.5rem 0}.maylike h3{font-size:1.1rem;font-weight:700;margin-bottom:1rem}.maylike-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.maylike-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem;text-decoration:none;color:var(--text);transition:border-color .15s,box-shadow .15s}.maylike-card:hover{border-color:var(--blue);box-shadow:0 2px 8px rgba(26,115,232,.1)}.maylike-card .mc-cat{font-size:.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:.4rem}.maylike-card .mc-title{font-size:.9rem;font-weight:600;line-height:1.4;color:var(--text)}@media(max-width:700px){.maylike-grid{grid-template-columns:1fr}}`;

let updated = 0;
for (const post of posts) {
  const filePath = post.file;
  if (!fs.existsSync(filePath)) { console.log(`SKIP: ${filePath}`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');

  // Remove old cross-links section if present
  html = html.replace(/<div class="cross-links">[\s\S]*?<\/div>\s*/g, '');
  html = html.replace(/\.cross-links\{[^}]+\}/g, '');
  html = html.replace(/\.cross-links h3\{[^}]+\}/g, '');
  html = html.replace(/\.cross-links ul\{[^}]+\}/g, '');
  html = html.replace(/\.cross-links li\{[^}]+\}/g, '');
  html = html.replace(/\.cross-links a\{[^}]+\}/g, '');
  html = html.replace(/\.cross-links a:hover\{[^}]+\}/g, '');

  if (html.includes('maylike')) { console.log(`SKIP (done): ${filePath}`); continue; }

  const postCat = (post.cat || '').toLowerCase();

  // Find 3 related posts from same category, excluding current
  const related = posts.filter(p =>
    p.title !== post.title &&
    (p.cat || '').toLowerCase().includes(postCat.split(' ')[0])
  ).slice(0, 3);

  // If not enough, fill with others
  if (related.length < 3) {
    const extra = posts.filter(p =>
      p.title !== post.title && !related.find(r => r.title === p.title)
    ).slice(0, 3 - related.length);
    related.push(...extra);
  }

  if (related.length === 0) continue;

  const cards = related.map(p =>
    `<a href="/${p.file}" class="maylike-card"><div class="mc-cat">${p.cat || ''}</div><div class="mc-title">${p.title}</div></a>`
  ).join('\n    ');

  const widget = `<div class="maylike">
    <h3>You may also like</h3>
    <div class="maylike-grid">
    ${cards}
    </div>
  </div>`;

  // Add CSS
  if (!html.includes('.maylike{')) {
    html = html.replace('</style>', blogCrossCSS + '\n</style>');
  }

  // Insert before footer
  html = html.replace(/<footer>/, widget + '\n<footer>');

  fs.writeFileSync(filePath, html, 'utf8');
  updated++;
  console.log(`UPDATED: ${filePath}`);
}

console.log(`\nTotal: ${updated}`);
