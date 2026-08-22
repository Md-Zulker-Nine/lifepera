const fs = require('fs');

function stripEmojis(str) {
  return str.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/[\u{2600}-\u{26FF}]/gu, '')
            .replace(/[\u{2700}-\u{27BF}]/gu, '')
            .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
            .replace(/[\u{200D}]/gu, '')
            .replace(/[\u{20E3}]/gu, '')
            .replace(/[\u{E0020}-\u{E007F}]/gu, '')
            .replace(/\u{200B}/gu, '')
            .replace(/\u{FFFD}/gu, '')
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
            .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
            .replace(/[\u{1FA00}-\u{1FAFF}]/gu, '')
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
}

const files = [
  ...fs.readdirSync('.').filter(f => f.endsWith('.html')),
  ...fs.readdirSync('blog').filter(f => f.endsWith('.html')).map(f => 'blog/' + f)
];

let fixed = 0;
for (const f of files) {
  const original = fs.readFileSync(f, 'utf8');
  let cleaned = stripEmojis(original);
  
  // Also fix the specific garbled patterns from mojibake
  cleaned = cleaned.replace(/\?\?\? Tools Related/g, 'Tools Related');
  cleaned = cleaned.replace(/\?\?\? You May Also Like/g, 'You May Also Like');
  cleaned = cleaned.replace(/\?\?\? Related LifePera Tools/g, 'Related LifePera Tools');
  cleaned = cleaned.replace(/\?\?\? LifePera uses cookies/g, 'LifePera uses cookies');
  cleaned = cleaned.replace(/\?\?\?/g, '');
  
  if (cleaned !== original) {
    fs.writeFileSync(f, cleaned, 'utf8');
    fixed++;
    console.log('Fixed: ' + f);
  }
}
console.log('Total fixed: ' + fixed);
