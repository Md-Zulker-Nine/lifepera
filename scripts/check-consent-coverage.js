const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlFiles = [];
const consentScript = fs.readFileSync(path.join(root, 'cookie-consent.js'), 'utf8');

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
  if (/adsbygoogle\.js/i.test(content)) {
    failures.push(`${relative}: contains direct AdSense loading`);
  }
}

if (!/if\s*\(normalized === 'all'\)\s*\{[\s\S]*?loadAnalytics\(\);[\s\S]*?loadAdvertising\(\);/.test(consentScript) ||
    !/if\s*\(storedConsent === 'all'\)\s*\{[\s\S]*?loadAnalytics\(\);[\s\S]*?loadAdvertising\(\);/.test(consentScript)) {
  failures.push('Analytics and AdSense must load only for a stored or newly given all-consent choice.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Consent coverage passed for ${htmlFiles.length} HTML files.`);
