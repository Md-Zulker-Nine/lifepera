const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlFiles = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
}

collect(root);

const failures = [];
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (!content.includes('<script src="/cookie-consent.js"></script>')) {
    failures.push(`${relative}: missing cookie-consent.js`);
  }
  if (/googletagmanager\.com|G-SBT0X71YW2|gtag\s*\(/.test(content)) {
    failures.push(`${relative}: contains direct analytics loading`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Consent coverage passed for ${htmlFiles.length} HTML files.`);
