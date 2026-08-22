const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('blog-index.json', 'utf8'));

const blogCrossCSS = `.cross-links{margin:2.5rem 0;padding:1.5rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)}.cross-links h3{font-size:1rem;font-weight:700;margin-bottom:.8rem}.cross-links ul{list-style:none}.cross-links li{margin-bottom:.5rem}.cross-links a{font-size:.92rem;color:var(--blue);text-decoration:none;line-height:1.5}.cross-links a:hover{text-decoration:underline}`;

let updated = 0;
for (const post of posts) {
  const filePath = post.file.replace('blog/', 'blog/');
  if (!fs.existsSync(filePath)) { console.log(`SKIP: ${filePath}`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('cross-links')) { console.log(`SKIP (done): ${filePath}`); continue; }

  const postCat = (post.cat || '').toLowerCase();

  // Find 2 related posts from same category, excluding current
  const related = posts.filter(p =>
    p.title !== post.title &&
    (p.cat || '').toLowerCase().includes(postCat.split(' ')[0])
  ).slice(0, 2);

  // If not enough matches, fill with any other posts
  if (related.length < 2) {
    const extra = posts.filter(p =>
      p.title !== post.title && !related.find(r => r.title === p.title)
    ).slice(0, 2 - related.length);
    related.push(...extra);
  }

  if (related.length === 0) continue;

  const links = related.map(p =>
    `<li><a href="/${p.file}">${p.title}</a></li>`
  ).join('\n    ');

  const widget = `<div class="cross-links">
    <h3>Continue Reading</h3>
    <ul>
    ${links}
    </ul>
  </div>`;

  // Add CSS
  if (!html.includes('.cross-links{')) {
    html = html.replace('</style>', blogCrossCSS + '\n</style>');
  }

  // Insert before footer
  html = html.replace(/<footer>/, widget + '\n<footer>');

  fs.writeFileSync(filePath, html, 'utf8');
  updated++;
  console.log(`UPDATED: ${filePath}`);
}

console.log(`\nTotal: ${updated}`);
