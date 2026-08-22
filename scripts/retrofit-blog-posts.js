const fs = require('fs');
const path = require('path');

const TOOL_MAP = [
  { keywords: ['toxic workplace','boss','colleague','office'], tool: 'tool-toxic-workplace.html', name: 'Toxic Workplace Checklist' },
  { keywords: ['toxic','gaslight','manipulate','red flag','abus'], tool: 'tool-toxic-relationship.html', name: 'Toxic Relationship Checker' },
  { keywords: ['travel budget','cost','price','afford'], tool: 'tool-travel-budget.html', name: 'Travel Budget Planner' },
  { keywords: ['solo travel','safety','alone','backpack'], tool: 'tool-solo-safety.html', name: 'Solo Travel Safety Score' },
  { keywords: ['tap water','drink','water','safety','destination'], tool: 'tool-tap-water.html', name: 'Tap Water Safety Checker' },
  { keywords: ['emotional intelligence','eq','iq','empathy'], tool: 'tool-eq.html', name: 'Emotional Intelligence Quiz' },
  { keywords: ['core values','values','decision','purpose'], tool: 'tool-core-values.html', name: 'Core Values Identifier' },
  { keywords: ['cognitive','bias','thinking','decision'], tool: 'tool-cognitive-bias.html', name: 'Cognitive Bias Decoder' },
  { keywords: ['culture map','cross-cultural','global','international'], tool: 'tool-culture-map.html', name: 'Culture Map Quiz' },
  { keywords: ['age culture','aging','elder','youth'], tool: 'tool-age-cultures.html', name: 'Age Across Cultures Quiz' },
  { keywords: ['comm clash','conflict','miscommunic','argue'], tool: 'tool-comm-clash.html', name: 'Communication Clash Detector' },
  { keywords: ['name peak','peak','viral','trend'], tool: 'tool-name-peak.html', name: 'Name Peak Popularity' },
  { keywords: ['rare birthday','birthday','date','birth'], tool: 'tool-rare-birthday.html', name: 'Rare Birthday Finder' },
  { keywords: ['country match','match','where live','relocate'], tool: 'tool-country-match.html', name: 'Country Match Finder' },
  { keywords: ['era born','historical','era','time'], tool: 'tool-era-born.html', name: 'Which Era Were You Born In?' },
  { keywords: ['language kit','learn','polyglot','alphabet'], tool: 'tool-language-kit.html', name: 'Language Learning Kit' },
  { keywords: ['name','meaning','language','culture'], tool: 'tool-name-meaning.html', name: 'Name Meaning Explorer' },
  { keywords: ['underpaid','salary','pay','income','earn','wage'], tool: 'tool-underpaid.html', name: 'Am I Underpaid? Analyzer' },
  { keywords: ['job','quit','career','burnout'], tool: 'tool-quit-job.html', name: 'Should I Quit My Job?' },
  { keywords: ['attachment','relationship','anxious','avoidant','partner'], tool: 'tool-attachment.html', name: 'Attachment Style Quiz' },
  { keywords: ['visa','passport','travel','country','countries'], tool: 'tool-visa.html', name: 'Visa-Free Travel Checker' },
  { keywords: ['rich','wealth','income','money','global','afford'], tool: 'tool-how-rich.html', name: 'How Rich Am I?' },
  { keywords: ['breakup','heartbreak','healing','loss','grief'], tool: 'tool-breakup.html', name: 'Breakup Recovery Guide' },
  { keywords: ['email','tone','passive','aggressive','communication'], tool: 'tool-email-tone.html', name: 'Email Tone Analyzer' },
  { keywords: ['breadcrumb','dating','texting','ghost'], tool: 'tool-breadcrumbing.html', name: 'Breadcrumbing Detector' },
  { keywords: ['lucky','number','numerology','belief'], tool: 'tool-lucky.html', name: 'Lucky Number Generator' },
  { keywords: ['japan','visit','travel','season','best time'], tool: 'tool-best-visit.html', name: 'Best Time to Visit Japan' },
  { keywords: ['freelance','full-time','self-employ','gig'], tool: 'tool-freelance.html', name: 'Freelance vs Full-Time Calculator' },
  { keywords: ['zodiac','horoscope','astrology','birth'], tool: 'tool-zodiac.html', name: 'Zodiac Personality Decoder' },
  { keywords: ['introvert','extrovert','personality','social'], tool: 'tool-introvert.html', name: 'Introvert/Extrovert Scale' },
  { keywords: ['friend','friendship','social','connection'], tool: 'tool-friendship.html', name: 'Friendship Compatibility Quiz' },
  { keywords: ['cultural','faux pas','etiquette','mistake'], tool: 'tool-cultural.html', name: 'Cultural Faux Pas Guide' },
  { keywords: ['generation','gen z','millennial','boomer'], tool: 'tool-generation.html', name: 'Generation Personality Quiz' },
  { keywords: ['text','texting','reply','message'], tool: 'tool-texting.html', name: 'Texting Style Analyzer' },
  { keywords: ['detox','digital','screen','phone'], tool: 'tool-detox.html', name: 'Digital Detox Planner' },
  { keywords: ['google','data','privacy','track'], tool: 'tool-google-data.html', name: 'Google Data Privacy Check' },
];

const FALLBACK = [
  { tool: 'tool-how-rich.html', name: 'How Rich Am I?' },
  { tool: 'tool-visa.html', name: 'Visa-Free Travel Checker' },
  { tool: 'tool-attachment.html', name: 'Attachment Style Quiz' },
];

function findRelatedTools(title, keywords, cat) {
  const text = (title + ' ' + keywords + ' ' + cat).toLowerCase();
  const matches = [];
  for (const entry of TOOL_MAP) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      matches.push(entry);
      if (matches.length >= 2) break;
    }
  }
  if (matches.length < 2) {
    for (const fb of FALLBACK) {
      if (!matches.find(m => m.tool === fb.tool)) matches.push(fb);
      if (matches.length >= 2) break;
    }
  }
  return matches;
}

// Load index
const posts = JSON.parse(fs.readFileSync('blog-index.json', 'utf8'));
let updated = 0;

for (const post of posts) {
  const filePath = path.join('blog', post.file.replace('blog/', ''));
  if (!fs.existsSync(filePath)) { console.log(`SKIP (missing): ${post.file}`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');

  const tools = findRelatedTools(post.title, '', post.cat || '');
  const related = posts.filter(p => p.title !== post.title).slice(0, 3);

  const toolsHtml = `<div class="related-tools">
<h3>Tools Related to This Article</h3>
<ul>
${tools.map(t => `<li><a href="/${t.tool}">${t.name} →</a></li>`).join('\n')}
</ul>
</div>`;

  const relatedHtml = `<div class="related-posts">
<h3>You May Also Like</h3>
<div class="related-posts-grid">
${related.map(p => `<a href="/${p.file}" class="related-post-card"><div class="rp-cat">${p.cat || ''}</div><div class="rp-title">${p.title}</div></a>`).join('\n')}
</div>
</div>`;

  // Inject CSS before </style> (only if not already present)
  if (!html.includes('.related-tools{')) {
    const cssAddition = `.related-tools{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;margin:2.5rem 0}.related-tools h3{font-size:1.1rem;font-weight:700;margin-bottom:1rem}.related-tools ul{list-style:none;display:flex;flex-direction:column;gap:.7rem}.related-tools a{display:flex;align-items:center;gap:.5rem;padding:8px 12px;background:var(--bg);border-radius:8px;font-weight:500;font-size:.95rem;transition:background .15s}.related-tools a:hover{background:#e8f0fe}.related-posts{margin:2.5rem 0;padding:2rem 0;border-top:1px solid var(--border)}.related-posts h3{font-size:1.1rem;font-weight:700;margin-bottom:1rem}.related-posts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.related-post-card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:1rem;text-decoration:none;color:var(--text);transition:border-color .15s}.related-post-card:hover{border-color:var(--blue)}.related-post-card .rp-cat{font-size:.75rem;font-weight:600;color:var(--blue);text-transform:uppercase;margin-bottom:.3rem}.related-post-card .rp-title{font-size:.92rem;font-weight:600;line-height:1.4}`;
    html = html.replace('</style>', cssAddition + '\n</style>');
  }

  // Strip existing related-tools + related-posts sections if present
  html = html.replace(/<div class="related-tools">[\s\S]*?<\/div>\s*<div class="related-posts">[\s\S]*?<\/div>\s*/, '');
  html = html.replace(/<div class="related-tools">[\s\S]*?<\/div>\s*/, '');

  // Replace </main> with tools + related posts + </main>
  html = html.replace('</main>', toolsHtml + '\n' + relatedHtml + '\n</main>');

  fs.writeFileSync(filePath, html);
  updated++;
  console.log(`UPDATED: ${post.file}`);
}

console.log(`\nTotal updated: ${updated}`);
