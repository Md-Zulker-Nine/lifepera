const fs = require('fs');
const files = fs.readdirSync('blog').filter(f => f.endsWith('.html'));
let fixed = 0;
files.forEach(f => {
  const p = 'blog/' + f;
  let c = fs.readFileSync(p, 'utf8');
  const o = c;
  // Remove related-posts div (the whole section)
  c = c.replace(/<div class="related-posts">[\s\S]*?<\/div>\s*<\/div>/g, '');
  // Remove leftover related-posts CSS from style blocks
  c = c.replace(/\.related-posts\{[^}]+\}/g, '');
  c = c.replace(/\.related-posts h3\{[^}]+\}/g, '');
  c = c.replace(/\.related-posts-grid\{[^}]+\}/g, '');
  c = c.replace(/\.related-post-card\{[^}]+\}/g, '');
  c = c.replace(/\.related-post-card:hover\{[^}]+\}/g, '');
  c = c.replace(/\.related-post-card \.rp-cat\{[^}]+\}/g, '');
  c = c.replace(/\.related-post-card \.rp-title\{[^}]+\}/g, '');
  if (c !== o) {
    fs.writeFileSync(p, c, 'utf8');
    fixed++;
    console.log('Fixed: ' + f);
  }
});
console.log('Total: ' + fixed);
