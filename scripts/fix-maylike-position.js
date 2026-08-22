const fs = require('fs');
const files = fs.readdirSync('blog').filter(f => f.endsWith('.html'));
let fixed = 0;
files.forEach(f => {
  const p = 'blog/' + f;
  let c = fs.readFileSync(p, 'utf8');
  const o = c;
  // Move maylike div from after </main> to before </main>
  c = c.replace(/<\/main>\s*<div class="maylike">([\s\S]*?)<\/div>\s*<\/div>/, '<div class="maylike">$1</div>\n</div>\n</main>');
  if (c !== o) {
    fs.writeFileSync(p, c, 'utf8');
    fixed++;
    console.log('Fixed: ' + f);
  }
});
console.log('Total: ' + fixed);
