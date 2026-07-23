const https = require('https');
const fs = require('fs');
const path = require('path');

// Topic rotation list
const TOPICS = [
  { title: "10 Cultural Mistakes Tourists Make in Thailand", cat: "Culture & Travel", emoji: "🇹🇭", keywords: "thailand culture travel mistakes tourists" },
  { title: "How to Know if You're Being Underpaid in 2026", cat: "Career & Finance", emoji: "💰", keywords: "underpaid salary negotiation career" },
  { title: "What Your Attachment Style Says About Your Communication", cat: "Relationships & Psychology", emoji: "💕", keywords: "attachment style relationships communication" },
  { title: "Visa-Free Countries You Probably Didn't Know About", cat: "Travel & Passport", emoji: "✈️", keywords: "visa free travel passport countries" },
  { title: "7 Signs You're in a Toxic Workplace (And What to Do)", cat: "Career & Wellbeing", emoji: "🚨", keywords: "toxic workplace signs career mental health" },
  { title: "The Psychology Behind Why Relationships Repeat Patterns", cat: "Psychology & Relationships", emoji: "🧠", keywords: "relationship patterns psychology attachment" },
  { title: "How Rich Are You Really? A Global Perspective on Income", cat: "Finance & Global", emoji: "💵", keywords: "global income wealth comparison finance" },
  { title: "Lucky Numbers Around the World: What Different Cultures Believe", cat: "Culture & Numerology", emoji: "🍀", keywords: "lucky numbers culture numerology worldwide" },
  { title: "Email Mistakes That Make You Sound Passive-Aggressive", cat: "Communication & Career", emoji: "📧", keywords: "email tone passive aggressive professional" },
  { title: "The Most Powerful Passports in the World Right Now", cat: "Travel & Global", emoji: "🌍", keywords: "powerful passports visa free travel 2026" },
  { title: "Should You Quit Your Job? 10 Questions to Ask Yourself", cat: "Career & Decision", emoji: "🤔", keywords: "quit job career decision change work" },
  { title: "What Gaslighting Really Looks Like in Relationships", cat: "Relationships & Psychology", emoji: "🚩", keywords: "gaslighting relationships toxic patterns" },
  { title: "Best Time to Visit Japan: Month by Month Guide", cat: "Travel & Japan", emoji: "🇯🇵", keywords: "best time visit japan travel guide seasons" },
  { title: "How Your Name Sounds in Different Languages", cat: "Culture & Language", emoji: "🗣️", keywords: "name meaning cultures languages global" },
  { title: "Understanding the 4 Attachment Styles and How They Affect You", cat: "Psychology & Relationships", emoji: "💕", keywords: "4 attachment styles secure anxious avoidant" },
  { title: "Freelance vs Full-Time: Which Actually Pays More in 2026?", cat: "Career & Finance", emoji: "💻", keywords: "freelance vs full time salary comparison 2026" },
  { title: "Can You Drink the Tap Water? A Guide for 50 Countries", cat: "Travel & Safety", emoji: "🚰", keywords: "tap water safety countries travel guide" },
  { title: "Why Your Emotional Intelligence Matters More Than Your IQ", cat: "Psychology & Self-Growth", emoji: "❤️", keywords: "emotional intelligence EQ IQ psychology" },
  { title: "Cultural Faux Pas to Avoid in the Middle East", cat: "Culture & Travel", emoji: "🕌", keywords: "middle east culture travel mistakes etiquette" },
  { title: "How to Identify Your Core Values and Use Them to Make Better Decisions", cat: "Psychology & Self-Discovery", emoji: "✨", keywords: "core values identify decision making life" },
  { title: "The Science Behind Why Breakups Hurt So Much", cat: "Relationships & Psychology", emoji: "💔", keywords: "breakup science psychology attachment healing" },
  { title: "10 Signs You Have an Anxious Attachment Style", cat: "Relationships & Psychology", emoji: "😰", keywords: "anxious attachment style signs relationships" },
  { title: "What Breadcrumbing Looks Like (And Why It Keeps Happening)", cat: "Relationships & Dating", emoji: "🍞", keywords: "breadcrumbing dating relationships signs" },
  { title: "How Different Cultures View Aging and What We Can Learn", cat: "Culture & Lifestyle", emoji: "🌱", keywords: "aging cultures perspective life stages global" },
  { title: "Travel Budget Reality Check: What Things Actually Cost", cat: "Travel & Finance", emoji: "💳", keywords: "travel budget real costs destinations finance" }
];

// Select topic based on current timestamp
const topicIndex = Math.floor(Date.now() / (8 * 3600 * 1000)) % TOPICS.length;
const topic = TOPICS[topicIndex];

const prompt = `Write a high-quality, SEO-optimized blog post for a website called LifePera (lifepera.com) — a free tools website.

Title: "${topic.title}"
Category: ${topic.cat}
Target keywords: ${topic.keywords}

Requirements:
- 900-1200 words of genuinely useful, original content
- Written in a smart, conversational tone — not corporate, not academic
- Include practical takeaways people can act on
- Use subheadings (H2) to break up sections
- Include a brief intro that hooks the reader immediately
- End with a call to action mentioning a relevant free tool on LifePera
- No fluff, no padding, no "In conclusion" sections
- Write for a global audience (not US-only perspective)

Format the response as valid HTML with these exact tags only:
- <h2> for section headings
- <p> for paragraphs   
- <ul> and <li> for lists
- <strong> for emphasis

Do NOT include: html, head, body, header tags, or any CSS. Just the content HTML fragments.`;

const requestData = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json', 
    'Content-Length': Buffer.byteLength(requestData) 
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        console.error('No content returned from Gemini API:', data);
        process.exit(1);
      }

      // Generate filename from date and slug
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const slug = topic.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);
      const filename = `blog/post-${dateStr}-${slug}.html`;

      // Ensure target directory exists
      if (!fs.existsSync('blog')) fs.mkdirSync('blog');

      const niceDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="description" content="${topic.title} — Free insights and tools on LifePera. ${topic.keywords}."/>
<meta name="keywords" content="${topic.keywords}"/>
<meta property="og:title" content="${topic.title} — LifePera"/>
<meta property="og:description" content="Read the full guide on LifePera — free tools for real life decisions."/>
<meta property="og:url" content="https://lifepera.com/${filename}"/>
<title>${topic.title} — LifePera</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#07080b;--surface:#0d0f14;--card:#121520;--border:#1c2030;--border2:#242b3d;--gold:#c8a84b;--gold2:#e8cc80;--teal:#00c2a8;--rose:#e8547a;--text:#eef0f8;--text2:#b0b8cc;--muted:#626880;--col:1180px;--article:720px}
html{font-size:16px}body{background:var(--bg);color:var(--text);font-family:'Lora',serif;line-height:1.7;-webkit-font-smoothing:antialiased}
::selection{background:var(--gold);color:#000}a{text-decoration:none;color:inherit}
nav{position:sticky;top:0;z-index:500;background:rgba(7,8,11,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:var(--col);margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 2rem;height:64px}
.logo{font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:900;letter-spacing:-.03em}.logo-dot{color:var(--gold)}
.nav-btn{font-family:'Syne',sans-serif;font-size:.82rem;font-weight:700;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#000;padding:8px 20px;border-radius:6px;border:none;cursor:pointer}
.wrap{max-width:var(--article);margin:0 auto;padding:3rem 2rem}
.breadcrumb{font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--muted);margin-bottom:2rem}
.post-cat{font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--gold);letter-spacing:.12em;text-transform:uppercase;margin-bottom:.8rem}
h1{font-family:'Syne',sans-serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-.03em;line-height:1.1;margin-bottom:1rem}
.meta{font-family:'JetBrains Mono',monospace;font-size:.7rem;color:var(--muted);padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem}
.hero-img{aspect-ratio:16/7;background:linear-gradient(135deg,#1a1208,#2d1f0a);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:4rem;margin-bottom:2.5rem}
.ad-slot{background:var(--surface);border:1px dashed var(--border2);height:90px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:.62rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;border-radius:8px;margin:1.5rem 0}
.body p{font-size:1rem;color:var(--text2);line-height:1.8;margin-bottom:1.3rem}
.body p:first-child{font-size:1.08rem;color:var(--text)}
.body h2{font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:900;letter-spacing:-.02em;margin:2.5rem 0 1rem;color:var(--text)}
.body strong{color:var(--text);font-weight:600}
.body ul,.body ol{margin:1rem 0 1.5rem 1.5rem;color:var(--text2)}
.body li{margin-bottom:.5rem;line-height:1.65}
.tool-cta{background:linear-gradient(135deg,var(--card),#161a24);border:1px solid rgba(200,168,75,.25);border-radius:12px;padding:1.8rem;margin:2rem 0;display:flex;gap:1.2rem;align-items:center}
.tc-icon{font-size:2rem;flex-shrink:0}
.tc-title{font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;margin-bottom:.3rem}
.tc-desc{font-size:.85rem;color:var(--muted);margin-bottom:.8rem}
.tc-btn{display:inline-block;font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#000;padding:8px 18px;border-radius:6px}
.share-row{border-top:1px solid var(--border);margin-top:2.5rem;padding-top:1.5rem}
.sr-label{font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:.8rem}
.share-btns{display:flex;gap:.6rem;flex-wrap:wrap}
.share-btn{font-family:'JetBrains Mono',monospace;font-size:.72rem;padding:7px 14px;border-radius:6px;border:1px solid var(--border2);cursor:pointer;background:none;color:var(--text2);transition:all .2s}
.share-btn.tw{border-color:#1DA1F2;color:#1DA1F2}.share-btn.fb{border-color:#4267B2;color:#4267B2}.share-btn.wa{border-color:#25D366;color:#25D366}
footer{background:var(--surface);border-top:1px solid var(--border);margin-top:3rem}
.footer-bottom{max-width:var(--col);margin:0 auto;padding:1.5rem 2rem;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:.65rem;color:var(--muted);flex-wrap:wrap;gap:1rem}
.footer-bottom a{color:var(--muted)}.footer-bottom a:hover{color:var(--gold)}
@media(max-width:768px){.wrap{padding:2rem 1.5rem}.tool-cta{flex-direction:column}}
</style>
</head>
<body>
<nav><div class="nav-inner">
  <a class="logo" href="/index.html">Life<span class="logo-dot">Pera</span></a>
  <a class="nav-btn" href="/tools.html">All Tools</a>
</div></nav>
<div class="wrap">
  <div class="breadcrumb"><a href="/index.html">Home</a> — <a href="/blog.html">Blog</a> — ${topic.cat}</div>
  <div class="post-cat">${topic.cat}</div>
  <h1>${topic.title}</h1>
  <div class="meta">Zulker Nine • ${niceDate} • LifePera Blog</div>
  <div class="hero-img">${topic.emoji}</div>
  <div class="ad-slot">Advertisement • 728×90</div>
  <div class="body">
${content}
  </div>
  <div class="tool-cta">
    <div class="tc-icon">🛠️</div>
    <div>
      <div class="tc-title">Try Our Free Tools on LifePera</div>
      <div class="tc-desc">36 free tools covering travel, relationships, career, culture, psychology and finance. No signup required.</div>
      <a class="tc-btn" href="/tools.html">Explore All Free Tools →</a>
    </div>
  </div>
  <div class="share-row">
    <div class="sr-label">Share this post</div>
    <div class="share-btns">
      <button class="share-btn tw" onclick="window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent('${topic.title}\\nhttps://lifepera.com/${filename}'),'_blank')">𝕏 Tweet</button>
      <button class="share-btn fb" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent('https://lifepera.com/${filename}'),'_blank')">Facebook</button>
      <button class="share-btn wa" onclick="window.open('https://wa.me/?text='+encodeURIComponent('${topic.title}\\nhttps://lifepera.com/${filename}'),'_blank')">WhatsApp</button>
      <button class="share-btn" onclick="navigator.clipboard.writeText('https://lifepera.com/${filename}').then(()=>alert('Copied!'))">📋 Copy</button>
    </div>
  </div>
</div>
<footer><div class="footer-bottom">
  <span>© 2026 LifePera • lifepera.com</span>
  <span><a href="/privacy.html">Privacy</a> • <a href="/terms.html">Terms</a> • <a href="/blog.html">Blog</a></span>
</div></footer>
</body></html>`;

      fs.writeFileSync(filename, html);
      console.log(`✅ Generated: ${filename}`);

      // Update blog index JSON file
      const blogIndexFile = 'blog-index.json';
      let blogPosts = [];
      if (fs.existsSync(blogIndexFile)) {
        blogPosts = JSON.parse(fs.readFileSync(blogIndexFile, 'utf8'));
      }
      blogPosts.unshift({
        title: topic.title,
        cat: topic.cat,
        emoji: topic.emoji,
        date: niceDate,
        file: filename
      });
      blogPosts = blogPosts.slice(0, 100);
      fs.writeFileSync(blogIndexFile, JSON.stringify(blogPosts, null, 2));
      console.log('✅ Updated blog-index.json');

    } catch (err) {
      console.error('Error processing response:', err.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(requestData);
req.end();
