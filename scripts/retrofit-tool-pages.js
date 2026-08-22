const fs = require('fs');

const TOOL_CATEGORIES = {
  'tool-underpaid.html': { cat: 'career', related: ['tool-quit-job.html','tool-freelance.html','tool-how-rich.html'] },
  'tool-quit-job.html': { cat: 'career', related: ['tool-underpaid.html','tool-freelance.html','tool-travel-budget.html'] },
  'tool-attachment.html': { cat: 'psychology', related: ['tool-breakup.html','tool-toxic-relationship.html','tool-breadcrumbing.html'] },
  'tool-visa.html': { cat: 'travel', related: ['tool-travel-budget.html','tool-solo-safety.html','tool-best-visit.html'] },
  'tool-how-rich.html': { cat: 'finance', related: ['tool-underpaid.html','tool-travel-budget.html','tool-freelance.html'] },
  'tool-tap-water.html': { cat: 'travel', related: ['tool-visa.html','tool-travel-budget.html','tool-solo-safety.html'] },
  'tool-breakup.html': { cat: 'psychology', related: ['tool-attachment.html','tool-toxic-relationship.html','tool-breadcrumbing.html'] },
  'tool-toxic-relationship.html': { cat: 'psychology', related: ['tool-breakup.html','tool-attachment.html','tool-comm-clash.html'] },
  'tool-email-tone.html': { cat: 'communication', related: ['tool-comm-clash.html','tool-texting.html','tool-toxic-workplace.html'] },
  'tool-eq.html': { cat: 'psychology', related: ['tool-attachment.html','tool-core-values.html','tool-cognitive-bias.html'] },
  'tool-core-values.html': { cat: 'psychology', related: ['tool-eq.html','tool-quit-job.html','tool-cognitive-bias.html'] },
  'tool-breadcrumbing.html': { cat: 'relationships', related: ['tool-toxic-relationship.html','tool-attachment.html','tool-texting.html'] },
  'tool-lucky.html': { cat: 'culture', related: ['tool-zodiac.html','tool-name-meaning.html','tool-era-born.html'] },
  'tool-best-visit.html': { cat: 'travel', related: ['tool-visa.html','tool-tap-water.html','tool-travel-budget.html'] },
  'tool-name-meaning.html': { cat: 'culture', related: ['tool-name-peak.html','tool-language-kit.html','tool-zodiac.html'] },
  'tool-freelance.html': { cat: 'career', related: ['tool-underpaid.html','tool-quit-job.html','tool-how-rich.html'] },
  'tool-zodiac.html': { cat: 'culture', related: ['tool-lucky.html','tool-name-meaning.html','tool-era-born.html'] },
  'tool-cognitive-bias.html': { cat: 'psychology', related: ['tool-eq.html','tool-core-values.html','tool-comm-clash.html'] },
  'tool-introvert.html': { cat: 'psychology', related: ['tool-eq.html','tool-friendship.html','tool-comm-clash.html'] },
  'tool-friendship.html': { cat: 'relationships', related: ['tool-introvert.html','tool-comm-clash.html','tool-breadcrumbing.html'] },
  'tool-travel-budget.html': { cat: 'travel', related: ['tool-visa.html','tool-solo-safety.html','tool-tap-water.html'] },
  'tool-toxic-workplace.html': { cat: 'career', related: ['tool-quit-job.html','tool-underpaid.html','tool-email-tone.html'] },
  'tool-cultural.html': { cat: 'culture', related: ['tool-age-cultures.html','tool-culture-map.html','tool-comm-clash.html'] },
  'tool-generation.html': { cat: 'culture', related: ['tool-age-cultures.html','tool-era-born.html','tool-zodiac.html'] },
  'tool-solo-safety.html': { cat: 'travel', related: ['tool-visa.html','tool-travel-budget.html','tool-tap-water.html'] },
  'tool-texting.html': { cat: 'communication', related: ['tool-email-tone.html','tool-breadcrumbing.html','tool-comm-clash.html'] },
  'tool-detox.html': { cat: 'lifestyle', related: ['tool-google-data.html','tool-introvert.html','tool-generation.html'] },
  'tool-google-data.html': { cat: 'tech', related: ['tool-detox.html','tool-how-rich.html','tool-travel-budget.html'] },
  'tool-name-peak.html': { cat: 'culture', related: ['tool-name-meaning.html','tool-lucky.html','tool-zodiac.html'] },
  'tool-rare-birthday.html': { cat: 'culture', related: ['tool-zodiac.html','tool-name-meaning.html','tool-era-born.html'] },
  'tool-country-match.html': { cat: 'travel', related: ['tool-visa.html','tool-tap-water.html','tool-solo-safety.html'] },
  'tool-era-born.html': { cat: 'culture', related: ['tool-generation.html','tool-zodiac.html','tool-age-cultures.html'] },
  'tool-language-kit.html': { cat: 'culture', related: ['tool-name-meaning.html','tool-cultural.html','tool-culture-map.html'] },
  'tool-comm-clash.html': { cat: 'communication', related: ['tool-email-tone.html','tool-texting.html','tool-toxic-relationship.html'] },
  'tool-culture-map.html': { cat: 'culture', related: ['tool-cultural.html','tool-language-kit.html','tool-age-cultures.html'] },
  'tool-age-cultures.html': { cat: 'culture', related: ['tool-cultural.html','tool-generation.html','tool-culture-map.html'] },
};

const TOOL_NAMES = {
  'tool-underpaid.html': 'Am I Underpaid? Analyzer',
  'tool-quit-job.html': 'Should I Quit My Job?',
  'tool-attachment.html': 'Attachment Style Quiz',
  'tool-visa.html': 'Visa-Free Travel Checker',
  'tool-how-rich.html': 'How Rich Am I? Comparator',
  'tool-tap-water.html': 'Tap Water Safety Checker',
  'tool-breakup.html': 'Breakup Recovery Guide',
  'tool-toxic-relationship.html': 'Toxic Relationship Checker',
  'tool-email-tone.html': 'Email Tone Analyzer',
  'tool-eq.html': 'Emotional Intelligence Quiz',
  'tool-core-values.html': 'Core Values Identifier',
  'tool-breadcrumbing.html': 'Breadcrumbing Detector',
  'tool-lucky.html': 'Lucky Number Generator',
  'tool-best-visit.html': 'Best Time to Visit Japan',
  'tool-name-meaning.html': 'Name Meaning Explorer',
  'tool-freelance.html': 'Freelance vs Full-Time Calculator',
  'tool-zodiac.html': 'Zodiac Personality Decoder',
  'tool-cognitive-bias.html': 'Cognitive Bias Decoder',
  'tool-introvert.html': 'Introvert/Extrovert Scale',
  'tool-friendship.html': 'Friendship Compatibility Quiz',
  'tool-travel-budget.html': 'Travel Budget Planner',
  'tool-toxic-workplace.html': 'Toxic Workplace Checklist',
  'tool-cultural.html': 'Cultural Faux Pas Guide',
  'tool-generation.html': 'Generation Personality Quiz',
  'tool-solo-safety.html': 'Solo Travel Safety Score',
  'tool-texting.html': 'Texting Style Analyzer',
  'tool-detox.html': 'Digital Detox Planner',
  'tool-google-data.html': 'Google Data Privacy Check',
  'tool-name-peak.html': 'Name Peak Popularity',
  'tool-rare-birthday.html': 'Rare Birthday Finder',
  'tool-country-match.html': 'Country Match Finder',
  'tool-era-born.html': 'Which Era Were You Born In?',
  'tool-language-kit.html': 'Language Learning Kit',
  'tool-comm-clash.html': 'Communication Clash Detector',
  'tool-culture-map.html': 'Culture Map Quiz',
  'tool-age-cultures.html': 'Age Across Cultures Quiz',
};

let updated = 0;
for (const [file, config] of Object.entries(TOOL_CATEGORIES)) {
  if (!fs.existsSync(file)) { console.log(`SKIP (missing): ${file}`); continue; }
  let html = fs.readFileSync(file, 'utf8');

  const relatedLinks = config.related
    .filter(r => TOOL_NAMES[r])
    .map(r => `<li><a href="${r}" style="font-weight: 400;">${TOOL_NAMES[r]}</a></li>`)
    .join('\n        ');

  // Replace Related Tools sidebar widget
  html = html.replace(
    /<div class="widget-title">Related LifePera Tools<\/div>\s*<ul class="category-list">[\s\S]*?<\/ul>/,
    `<div class="widget-title">Related LifePera Tools</div>\n        <ul class="category-list">\n        ${relatedLinks}\n      </ul>`
  );

  // Also update footer "Popular Tools" to include category-relevant tools
  const footerTools = config.related.slice(0, 3).map(r =>
    `<li><a href="${r}">${TOOL_NAMES[r] || r}</a></li>`
  ).join('\n<li><a href="tool-underpaid.html">Am I Underpaid?</a></li>\n');

  html = html.replace(
    /<h4>Popular Tools<\/h4>\s*<ul>[\s\S]*?<\/ul>/,
    `<h4>Popular Tools</h4>\n<ul>\n${footerTools}\n</ul>`
  );

  fs.writeFileSync(file, html);
  updated++;
  console.log(`UPDATED: ${file}`);
}

console.log(`\nTotal tool pages updated: ${updated}`);
