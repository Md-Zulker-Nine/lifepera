const fs = require('fs');
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('GEMINI_API_KEY missing'); process.exit(1); }

const TOPICS = [
  { title: "10 Cultural Mistakes Tourists Make in Thailand", cat: "Culture \u00b7 Travel", emoji: "\ud83c\uddf9\ud83c\udded", keywords: "thailand culture travel mistakes tourists" },
  { title: "How to Know if You're Being Underpaid in 2026", cat: "Career \u00b7 Finance", emoji: "\ud83d\udcb0", keywords: "underpaid salary negotiation career" },
  { title: "What Your Attachment Style Says About Your Communication", cat: "Relationships \u00b7 Psychology", emoji: "\ud83e\udde0", keywords: "attachment style relationships communication" },
  { title: "Visa-Free Countries You Probably Didn't Know About", cat: "Travel \u00b7 Passport", emoji: "\u2708\ufe0f", keywords: "visa free travel passport countries" },
  { title: "7 Signs You're in a Toxic Workplace (And What to Do)", cat: "Career \u00b7 Wellbeing", emoji: "\u26a0\ufe0f", keywords: "toxic workplace signs career mental health" },
  { title: "The Psychology Behind Why Relationships Repeat Patterns", cat: "Psychology \u00b7 Relationships", emoji: "\ud83d\udd04", keywords: "relationship patterns psychology attachment" },
  { title: "How Rich Are You Really? A Global Perspective on Income", cat: "Finance \u00b7 Global", emoji: "\ud83d\udcca", keywords: "global income wealth comparison finance" },
  { title: "Lucky Numbers Around the World: What Different Cultures Believe", cat: "Culture \u00b7 Numerology", emoji: "\ud83d\udd22", keywords: "lucky numbers culture numerology worldwide" },
  { title: "Email Mistakes That Make You Sound Passive-Aggressive", cat: "Communication \u00b7 Career", emoji: "\u2709\ufe0f", keywords: "email tone passive aggressive professional" },
  { title: "The Most Powerful Passports in the World Right Now", cat: "Travel \u00b7 Global", emoji: "\ud83d\udec2", keywords: "powerful passports visa free travel 2026" },
  { title: "Should You Quit Your Job? 10 Questions to Ask Yourself", cat: "Career \u00b7 Decision", emoji: "\ud83d\udeaa", keywords: "quit job career decision change work" },
  { title: "What Gaslighting Really Looks Like in Relationships", cat: "Relationships \u00b7 Psychology", emoji: "\ud83d\udc41\ufe0f", keywords: "gaslighting relationships toxic patterns" },
  { title: "Best Time to Visit Japan: Month by Month Guide", cat: "Travel \u00b7 Japan", emoji: "\ud83c\uddef\ud83c\uddf5", keywords: "best time visit japan travel guide seasons" },
  { title: "How Your Name Sounds in Different Languages", cat: "Culture \u00b7 Language", emoji: "\ud83d\udd24", keywords: "name meaning cultures languages global" },
  { title: "Understanding the 4 Attachment Styles and How They Affect You", cat: "Psychology \u00b7 Relationships", emoji: "\ud83d\udd17", keywords: "4 attachment styles secure anxious avoidant" },
  { title: "Freelance vs Full-Time: Which Actually Pays More in 2026?", cat: "Career \u00b7 Finance", emoji: "\ud83d\udcbb", keywords: "freelance vs full time salary comparison 2026" },
  { title: "Can You Drink the Tap Water? A Guide for 50 Countries", cat: "Travel \u00b7 Safety", emoji: "\ud83d\udeb0", keywords: "tap water safety countries travel guide" },
  { title: "Why Your Emotional Intelligence Matters More Than Your IQ", cat: "Psychology \u00b7 Self-Growth", emoji: "\u2764\ufe0f", keywords: "emotional intelligence EQ IQ psychology" },
  { title: "Cultural Faux Pas to Avoid in the Middle East", cat: "Culture \u00b7 Travel", emoji: "\ud83e\udded", keywords: "middle east culture travel mistakes etiquette" },
  { title: "How to Identify Your Core Values and Use Them to Make Better Decisions", cat: "Psychology \u00b7 Self-Discovery", emoji: "\u2728", keywords: "core values identify decision making life" },
  { title: "The Science Behind Why Breakups Hurt So Much", cat: "Relationships \u00b7 Psychology", emoji: "\ud83d\udc94", keywords: "breakup science psychology attachment healing" },
  { title: "10 Signs You Have an Anxious Attachment Style", cat: "Relationships \u00b7 Psychology", emoji: "\ud83d\udccc", keywords: "anxious attachment style signs relationships" },
  { title: "What Breadcrumbing Looks Like (And Why It Keeps Happening)", cat: "Relationships \u00b7 Dating", emoji: "\ud83c\udf5e", keywords: "breadcrumbing dating relationships signs" },
  { title: "How Different Cultures View Aging and What We Can Learn", cat: "Culture \u00b7 Lifestyle", emoji: "\u23f3", keywords: "aging cultures perspective life stages global" },
  { title: "Travel Budget Reality Check: What Things Actually Cost", cat: "Travel \u00b7 Finance", emoji: "\ud83d\udcb5", keywords: "travel budget real costs destinations finance" }
];

const MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function generate(prompt) {
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const url = 'https://generativelanguage.googleapis.com/v1/models/' + model + ':generateContent?key=' + apiKey;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
          })
        });
        const data = await res.json();
        const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : null;
        if (res.ok && text) return text;
        const isRateLimit = res.status === 429 || (data.error && data.error.message && (data.error.message.indexOf('quota') >= 0 || data.error.message.indexOf('exceeded') >= 0));
        if (isRateLimit && attempt < 3) {
          console.log('Rate limit, retrying in 20s...');
          await sleep(20000);
          continue;
        }
        break;
      } catch(e) {
        break;
      }
    }
  }
  throw new Error('All models failed');
}

async function run() {
  const idx = Math.floor(Date.now() / (8 * 3600 * 1000)) % TOPICS.length;
  const topic = TOPICS[idx];

  const prompt = 'Write a high-quality blog post for LifePera (lifepera.com).\nTitle: "' + topic.title + '"\nCategory: ' + topic.cat + '\nKeywords: ' + topic.keywords + '\n- 900-1200 words, conversational tone\n- Practical takeaways, H2 subheadings\n- Hook intro, end with CTA to a LifePera tool\n- Global audience, no fluff\n- Only output valid HTML fragments: h2, p, ul/li, strong\n- Do NOT include html, head, body, or CSS tags';

  const content = await generate(prompt);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = topic.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').substring(0, 60);
  if (!fs.existsSync('blog')) fs.mkdirSync('blog');
  const filename = 'blog/post-' + dateStr + '-' + slug + '.html';
  const niceDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n' +
'<meta name="description" content="' + topic.title + ' \u2014 LifePera Blog. ' + topic.keywords + '."/>\n' +
'<meta name="robots" content="index, follow"/>\n' +
'<link rel="canonical" href="https://lifepera.com/' + filename + '"/>\n' +
'<meta property="og:title" content="' + topic.title + ' \u2014 LifePera"/>\n' +
'<meta property="og:description" content="' + topic.title + ' \u2014 Read the full guide on LifePera \u2014 free tools for real life decisions."/>\n' +
'<meta property="og:url" content="https://lifepera.com/' + filename + '"/>\n' +
'<meta property="og:type" content="article"/>\n' +
'<meta property="og:site_name" content="LifePera"/>\n' +
'<meta name="twitter:card" content="summary_large_image"/>\n' +
'<meta name="twitter:title" content="' + topic.title + ' \u2014 LifePera"/>\n' +
'<meta name="twitter:description" content="' + topic.title + ' \u2014 Read the full guide on LifePera."/>\n' +
'<script type="application/ld+json">\n' +
'{"@context":"https://schema.org","@type":"Article","headline":"' + topic.title + '","author":{"@type":"Person","name":"Zulker Nine"},"publisher":{"@type":"Organization","name":"LifePera","url":"https://lifepera.com"},"datePublished":"' + dateStr + '","description":"' + topic.title + '"}\n' +
'</script>\n' +
'<title>' + topic.title + ' \u2014 LifePera</title>\n' +
'<style>\n' +
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\n' +
':root{--bg:#f8f9fa;--surface:#fff;--text:#202124;--muted:#5f6368;--blue:#1a73e8;--border:#dadce0;--radius:12px;--max-w:1200px}\n' +
'body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}\n' +
'a{color:var(--blue);text-decoration:none}\n' +
'header{background:rgba(255,255,255,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1000}\n' +
'.nav{max-width:var(--max-w);margin:0 auto;padding:0 1.5rem;height:72px;display:flex;justify-content:space-between;align-items:center}\n' +
'.logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;display:flex;align-items:center;gap:8px}\n' +
'.logo span{color:var(--blue)}\n' +
'.badge{background:#e8f0fe;color:var(--blue);font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:.5px}\n' +
'.nav-links{display:flex;gap:2rem;font-weight:600;font-size:.92rem;align-items:center}\n' +
'.nav-links a{color:var(--muted)}.nav-links a:hover{color:var(--blue)}\n' +
'main{max-width:860px;margin:2rem auto;padding:0 1.5rem}\n' +
'.post-cat{font-size:.82rem;font-weight:600;text-transform:uppercase;color:var(--blue);margin-bottom:.5rem;letter-spacing:.5px}\n' +
'h1{font-size:2.5rem;font-weight:800;line-height:1.15;margin-bottom:1rem;letter-spacing:-.5px}\n' +
'.meta{font-size:.88rem;color:var(--muted);padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem;display:flex;align-items:center;gap:.8rem}\n' +
'.ad-slot{background:#f1f3f4;border:1px dashed #bdc1c6;text-align:center;padding:1.8rem;color:var(--muted);font-size:.85rem;border-radius:var(--radius);margin-bottom:2rem}\n' +
'.body{font-size:1.05rem;line-height:1.8}\n' +
'.body p{margin-bottom:1.3rem;color:var(--text)}\n' +
'.body h2{font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}\n' +
'.body strong{font-weight:700}\n' +
'.body ul{margin:1rem 0 1.5rem 1.5rem}\n' +
'.body li{margin-bottom:.5rem;line-height:1.7}\n' +
'.cta{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;margin:2rem 0;text-align:center}\n' +
'.cta h3{margin-bottom:.5rem;font-size:1.2rem}\n' +
'.cta p{font-size:.95rem;color:var(--muted);margin-bottom:1rem}\n' +
'.cta-btn{display:inline-block;background:var(--blue);color:#fff!important;padding:10px 24px;border-radius:6px;font-weight:600;font-size:.9rem}\n' +
'.cta-btn:hover{background:#1557b0}\n' +
'footer{background:#111827;color:#9ca3af;border-top:1px solid #1f2937;padding:4rem 1.5rem 2rem;margin-top:4rem}\n' +
'.footer-inner{max-width:var(--max-w);margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2.5rem}\n' +
'.footer-brand .logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;color:#fff;margin-bottom:1rem}\n' +
'.footer-brand p{font-size:.88rem;color:#9ca3af;line-height:1.6;max-width:320px;margin-bottom:1.5rem}\n' +
'.trust{display:inline-flex;align-items:center;gap:8px;background:#1f2937;border:1px solid #374151;padding:6px 12px;border-radius:6px;font-size:.78rem;color:#d1d5db;font-weight:500}\n' +
'.f-col h4{font-size:1rem;font-weight:700;color:#fff;margin-bottom:1.2rem;letter-spacing:.5px}\n' +
'.f-col ul{list-style:none}.f-col li{margin-bottom:.7rem}\n' +
'.f-col a{color:#9ca3af;font-size:.88rem}.f-col a:hover{color:#fff}\n' +
'.footer-bot{max-width:var(--max-w);margin:3rem auto 0;padding-top:2rem;border-top:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center;font-size:.82rem;color:#6b7280}\n' +
'.footer-disc{max-width:var(--max-w);margin:1.5rem auto 0;font-size:.76rem;color:#4b5563;line-height:1.5;text-align:center}\n' +
'.cookie-bar{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#d1d5db;padding:1rem 1.5rem;z-index:9999;display:none;border-top:1px solid #374151}\n' +
'.cookie-inner{max-width:var(--max-w);margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}\n' +
'.cookie-inner p{font-size:.85rem;line-height:1.5}\n' +
'.cookie-btn{background:var(--blue);color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;cursor:pointer;font-size:.88rem;white-space:nowrap}\n' +
'.cookie-btn:hover{background:#1557b0}\n' +
'@media(max-width:900px){.footer-inner{grid-template-columns:1fr}.footer-bot{flex-direction:column;gap:1rem;text-align:center}h1{font-size:1.8rem}}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<header>\n' +
'<div class="nav">\n' +
'<a href="index.html" class="logo">Life<span>Pera</span><span class="badge">Pro</span></a>\n' +
'<div class="nav-links">\n' +
'<a href="tools.html">Tools</a><a href="blog.html">Blog</a><a href="about.html">About</a><a href="contact.html">Contact</a>\n' +
'</div>\n' +
'</div>\n' +
'</header>\n' +
'<main>\n' +
'<div class="post-cat">' + topic.cat + '</div>\n' +
'<h1>' + topic.title + '</h1>\n' +
'<div class="meta"><span>Zulker Nine</span><span>\u00b7</span><span>' + niceDate + '</span></div>\n' +
'<div class="ad-slot">[ AdSense In-Article ]</div>\n' +
'<div class="body">' + content + '</div>\n' +
'<div class="cta">\n' +
'<h3>Try Our Free Tools</h3>\n' +
'<p>36 free tools covering travel, relationships, career, culture, psychology and finance. No signup required.</p>\n' +
'<a class="cta-btn" href="tools.html">Explore All Free Tools &rarr;</a>\n' +
'</div>\n' +
'</main>\n' +
'<footer>\n' +
'<div class="footer-inner">\n' +
'<div class="footer-brand">\n' +
'<a href="index.html" class="logo" style="color:#fff">Life<span style="color:#1a73e8">Pera</span></a>\n' +
'<p>Free premium tools for real life decisions. Data-backed, privacy-focused, no signup required.</p>\n' +
'<span class="trust">\ud83d\udee1\ufe0f 100% Free \u00b7 Privacy Protected \u00b7 Data-Backed</span>\n' +
'</div>\n' +
'<div class="f-col">\n' +
'<h4>Tools</h4>\n' +
'<ul>\n' +
'<li><a href="tool-how-rich.html">Global Wealth Comparator</a></li>\n' +
'<li><a href="tool-visa.html">Visa-Free Travel Checker</a></li>\n' +
'<li><a href="tool-attachment.html">Attachment Style Quiz</a></li>\n' +
'</ul>\n' +
'</div>\n' +
'<div class="f-col">\n' +
'<h4>Company</h4>\n' +
'<ul>\n' +
'<li><a href="about.html">About Us</a></li>\n' +
'<li><a href="blog.html">Editorial Blog</a></li>\n' +
'<li><a href="contact.html">Contact & Support</a></li>\n' +
'</ul>\n' +
'</div>\n' +
'<div class="f-col">\n' +
'<h4>Legal</h4>\n' +
'<ul>\n' +
'<li><a href="privacy.html">Privacy Policy</a></li>\n' +
'<li><a href="terms.html">Terms of Service</a></li>\n' +
'<li><a href="sitemap.xml">Sitemap</a></li>\n' +
'</ul>\n' +
'</div>\n' +
'</div>\n' +
'<div class="footer-disc">Disclaimer: LifePera tools and calculators are provided for informational and educational purposes only. They do not constitute formal financial, legal, medical, or career advice.</div>\n' +
'<div class="footer-bot"><span>&copy; 2026 LifePera. All rights reserved.</span><span>Built for curious minds worldwide.</span></div>\n' +
'</footer>\n' +
'<div class="cookie-bar" id="cookieBar">\n' +
'<div class="cookie-inner">\n' +
'<p>\ud83c\udf6a LifePera uses cookies to improve your experience and serve personalized ads. By continuing, you agree to our <a href="privacy.html" style="color:#8ab4f8">Privacy Policy</a>.</p>\n' +
'<button class="cookie-btn" onclick="acceptCookies()">Accept All</button>\n' +
'</div>\n' +
'</div>\n' +
'<script>\n' +
'function acceptCookies(){document.getElementById(\'cookieBar\').style.display=\'none\';localStorage.setItem(\'cookiesAccepted\',\'true\')}\n' +
'(function(){if(!localStorage.getItem(\'cookiesAccepted\'))document.getElementById(\'cookieBar\').style.display=\'block\'})();\n' +
'</script>\n' +
'</body></html>';

  fs.writeFileSync(filename, html);
  console.log('Generated: ' + filename);

  const indexFile = 'blog-index.json';
  let posts = [];
  if (fs.existsSync(indexFile)) {
    try { posts = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch(e) {}
  }
  posts.unshift({ title: topic.title, cat: topic.cat, emoji: topic.emoji, date: niceDate, file: filename });
  posts = posts.slice(0, 100);
  fs.writeFileSync(indexFile, JSON.stringify(posts, null, 2));
  console.log('Updated blog-index.json');
}

run().catch(err => { console.error(err.message); process.exit(1); });
