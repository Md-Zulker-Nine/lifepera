const fs = require('fs');
const files = fs.readdirSync('blog').filter(f => f.endsWith('.html'));
let fixed = 0;
files.forEach(f => {
  const p = 'blog/' + f;
  let c = fs.readFileSync(p, 'utf8');
  const o = c;
  // Remove any remaining related-post-card anchor tags
  c = c.replace(/<a[^>]*class="related-post-card"[^>]*>[\s\S]*?<\/a>/g, '');
  // Remove any remaining rp-title divs
  c = c.replace(/<div class="rp-title">[^<]*<\/div>/g, '');
  // Remove any remaining rp-cat divs
  c = c.replace(/<div class="rp-cat">[^<]*<\/div>/g, '');
  // Remove any orphaned closing divs from related-posts removal
  c = c.replace(/<\/div>\s*<\/div>\s*<div class="related-tools"/, '<div class="related-tools"');
  // Clean up leftover empty divs
  c = c.replace(/<div>\s*<\/div>/g, '');
  if (c !== o) {
    fs.writeFileSync(p, c, 'utf8');
    fixed++;
    console.log('Fixed: ' + f);
  }
});
console.log('Total: ' + fixed);
