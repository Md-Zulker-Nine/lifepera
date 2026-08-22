const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('blog-index.json', 'utf8'));

const TOOL_BLOG_MAP = {
  'tool-underpaid.html': ['career', 'finance'],
  'tool-quit-job.html': ['career'],
  'tool-attachment.html': ['relationships', 'psychology'],
  'tool-visa.html': ['travel'],
  'tool-how-rich.html': ['finance'],
  'tool-tap-water.html': ['travel'],
  'tool-breakup.html': ['relationships', 'psychology'],
  'tool-toxic-relationship.html': ['relationships', 'psychology'],
  'tool-email-tone.html': ['career'],
  'tool-eq.html': ['psychology'],
  'tool-core-values.html': ['psychology'],
  'tool-breadcrumbing.html': ['relationships'],
  'tool-lucky.html': ['culture'],
  'tool-best-visit.html': ['travel'],
  'tool-name-meaning.html': ['culture'],
  'tool-freelance.html': ['career', 'finance'],
  'tool-zodiac.html': ['culture'],
  'tool-cognitive-bias.html': ['psychology'],
  'tool-introvert.html': ['psychology'],
  'tool-friendship.html': ['relationships'],
  'tool-travel-budget.html': ['travel', 'finance'],
  'tool-toxic-workplace.html': ['career'],
  'tool-cultural.html': ['culture'],
  'tool-generation.html': ['culture'],
  'tool-solo-safety.html': ['travel'],
  'tool-texting.html': ['relationships'],
  'tool-detox.html': ['psychology'],
  'tool-google-data.html': ['finance'],
  'tool-name-peak.html': ['culture'],
  'tool-rare-birthday.html': ['culture'],
  'tool-country-match.html': ['travel'],
  'tool-era-born.html': ['culture'],
  'tool-language-kit.html': ['culture'],
  'tool-comm-clash.html': ['relationships', 'psychology'],
  'tool-culture-map.html': ['culture'],
  'tool-age-cultures.html': ['culture'],
};

const blogWidgetCSS = `.blog-widget{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;margin-top:1.5rem}.blog-widget h4{font-size:.9rem;font-weight:700;margin-bottom:.8rem;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted)}.blog-widget ul{list-style:none}.blog-widget li{margin-bottom:.6rem}.blog-widget a{font-size:.88rem;color:var(--text);text-decoration:none;line-height:1.4;display:block;padding:4px 0}.blog-widget a:hover{color:var(--blue)}`;

let updated = 0;
for (const [file, cats] of Object.entries(TOOL_BLOG_MAP)) {
  if (!fs.existsSync(file)) { console.log(`SKIP: ${file}`); continue; }
  let html = fs.readFileSync(file, 'utf8');

  // Skip if already has blog-widget
  if (html.includes('blog-widget')) { console.log(`SKIP (done): ${file}`); continue; }

  // Find matching blog posts
  const related = posts.filter(p => {
    const postCat = (p.cat || '').toLowerCase();
    return cats.some(c => postCat.includes(c));
  }).slice(0, 3);

  if (related.length === 0) { console.log(`SKIP (no matches): ${file}`); continue; }

  const blogLinks = related.map(p =>
    `<li><a href="/${p.file}">${p.title}</a></li>`
  ).join('\n        ');

  const widget = `<div class="blog-widget">
      <h4>Related Articles</h4>
      <ul>
        ${blogLinks}
      </ul>
    </div>`;

  // Add CSS before </style>
  if (!html.includes('.blog-widget{')) {
    html = html.replace('</style>', blogWidgetCSS + '\n</style>');
  }

  // Add widget before </aside> (after related tools widget)
  html = html.replace(/<\/aside>/, widget + '\n  </aside>');

  fs.writeFileSync(file, html, 'utf8');
  updated++;
  console.log(`UPDATED: ${file}`);
}

console.log(`\nTotal: ${updated}`);
