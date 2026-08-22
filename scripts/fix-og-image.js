const fs = require('fs');
const path = require('path');

const files = [];
fs.readdirSync('.').filter(f => f.endsWith('.html')).forEach(f => files.push(f));
fs.readdirSync('blog').filter(f => f.endsWith('.html')).forEach(f => files.push(path.join('blog', f)));

let count = 0;
files.forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;
  s = s.replace(/content="https:\/\/lifepera\.com\/favicon\.svg"/g, 'content="https://lifepera.com/og-image.svg"');
  if (s !== orig) {
    fs.writeFileSync(f, s, 'utf8');
    count++;
  }
});

console.log('Updated OG image in ' + count + ' files');
