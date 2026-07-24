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

      // Perfect Light-Theme Page HTML
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
<style>
:root {
  --bg: #f8f9fa;
  --surface: #ffffff;
  --text-main: #202124;
  --text-muted: #5f6368;
  --primary-blue: #1a73e8;
  --primary-hover: #1557b0;
  --border: #dadce0;
  --radius: 12px;
  --max-width: 1200px;
  --article-width: 760px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background-color: var(--bg);
  color: var(--text-main);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { text-decoration: none; color: var(--primary-blue); transition: color 0.2s; }
a:hover { color: var(--primary-hover); }

/* Header & Nav */
header {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}
.nav-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo span { color: var(--primary-blue); }
.logo-badge {
  background: #e8f0fe;
  color: var(--primary-blue);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.nav-links { display: flex; gap: 2rem; font-weight: 600; font-size: 0.95rem; align-items: center; }
.nav-links a { color: var(--text-muted); transition: color 0.2s; }
.nav-links a:hover, .nav-links a.active { color: var(--primary-blue); }
.btn-nav {
  background: var(--primary-blue);
  color: #fff !important;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  display: inline-block;
}
.btn-nav:hover { background: var(--primary-hover); }

/* Article Container */
.wrap { max-width: var(--article-width); margin: 2.5rem auto; padding: 0 1.5rem; }
.breadcrumb { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem; }
.post-cat {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary-blue);
  letter-spacing: 0.5px;
  margin-bottom: 0.6rem;
}
h1 {
  font-size: clamp(2rem, 4vw, 2.7rem);
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.5px;
  margin-bottom: 1rem;
  color: var(--text-main);
}
.meta {
  font-size: 0.9rem;
  color: var(--text-muted);
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 2rem;
}
.hero-icon-box {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4.5rem;
  margin-bottom: 2rem;
}
.ad-slot-leaderboard {
  background: #f1f3f4;
  border: 1px dashed #bdc1c6;
  text-align: center;
  padding: 1.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  border-radius: var(--radius);
  margin: 2rem 0;
}

/* Article Body Content */
.body p { font-size: 1.05rem; color: var(--text-main); line-height: 1.8; margin-bottom: 1.4rem; }
.body p:first-child { font-size: 1.12rem; color: #1a1d20; }
.body h2 { font-size: 1.5rem; font-weight: 800; margin: 2.5rem 0 1rem; color: var(--text-main); letter-spacing: -0.3px; }
.body strong { color: #1a1d20; font-weight: 700; }
.body ul, .body ol { margin: 1rem 0 1.5rem 1.5rem; color: var(--text-main); }
.body li { margin-bottom: 0.6rem; line-height: 1.7; }

/* Call to Action Box */
.tool-cta {
  background: #ffffff;
  border: 1px solid var(--border);
  border-left: 4px solid var(--primary-blue);
  border-radius: var(--radius);
  padding: 2rem;
  margin: 2.5rem 0;
  display: flex;
  gap: 1.5rem;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
}
.tc-icon { font-size: 2.5rem; flex-shrink: 0; }
.tc-title { font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; }
.tc-desc { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.5; }

/* Share Buttons */
.share-row { border-top: 1px solid var(--border); margin-top: 3rem; padding-top: 1.5rem; }
.sr-label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 1rem; }
.share-btns { display: flex; gap: 0.8rem; flex-wrap: wrap; }
.share-btn {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--border);
  cursor: pointer;
  background: #fff;
  color: var(--text-main);
  transition: all 0.2s;
}
.share-btn:hover { border-color: #bdc1c6; background: #f8f9fa; }
.share-btn.tw { border-color: #1DA1F2; color: #1DA1F2; }
.share-btn.fb { border-color: #4267B2; color: #4267B2; }
.share-btn.wa { border-color: #25D366; color: #25D366; }

/* Footer */
footer {
  background: #111827;
  color: #9ca3af;
  border-top: 1px solid #1f2937;
  padding: 4rem 1.5rem 2rem;
  margin-top: 4rem;
}
.footer-container {
  max-width: var(--max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 2.5rem;
}
.footer-brand .logo { color: #ffffff !important; margin-bottom: 1rem; }
.footer-brand p { font-size: 0.9rem; color: #9ca3af; line-height: 1.6; max-width: 320px; margin-bottom: 1.5rem; }
.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1f2937;
  border: 1px solid #374151;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #d1d5db;
  font-weight: 500;
}
.footer-col h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff !important;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
}
.footer-col ul { list-style: none; padding: 0; margin: 0; }
.footer-col li { margin-bottom: 0.7rem; }
.footer-col a { color: #9ca3af !important; font-size: 0.9rem; transition: color 0.2s; }
.footer-col a:hover { color: #ffffff !important; }
.footer-bottom {
  max-width: var(--max-width);
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #6b7280;
}
.footer-disclaimer {
  max-width: var(--max-width);
  margin: 1.5rem auto 0;
  font-size: 0.78rem;
  color: #4b5563;
  line-height: 1.5;
  text-align: center;
}
@media (max-width: 900px) {
  .footer-container { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 1rem; text-align: center; }
  .tool-cta { flex-direction: column; text-align: center; }
}
</style>
</head>
<body>

<header>
  <div class="nav-container">
    <a href="/index.html" class="logo">
      Life<span>Pera</span>
      <span class="logo-badge">Pro</span>
    </a>
    <div class="nav-links">
      <a href="/tools.html">Tools</a>
      <a href="/blog.html" class="active">Blog</a>
      <a href="/about.html">About</a>
      <a href="/contact.html">Contact</a>
    </div>
  </div>
</header>

<div class="wrap">
  <div class="breadcrumb"><a href="/index.html">Home</a> — <a href="/blog.html">Blog</a> — ${topic.cat}</div>
  <div class="post-cat">${topic.cat}</div>
  <h1>${topic.title}</h1>
  <div class="meta">By Zulker Nine · ${niceDate} · LifePera Editorial</div>
  <div class="hero-icon-box">${topic.emoji}</div>
  <div class="ad-slot-leaderboard">[ AdSense Responsive Leaderboard ]</div>
  
  <div class="body">
${content}
  </div>

  <div class="tool-cta">
    <div class="tc-icon">🛠️</div>
    <div>
      <div class="tc-title">Try Our Free Tools on LifePera</div>
      <div class="tc-desc">36 free data-driven tools covering travel, relationships, career, culture, psychology, and finance. No signup required.</div>
      <a class="btn-nav" href="/tools.html">Explore All Free Tools →</a>
    </div>
  </div>

  <div class="share-row">
    <div class="sr-label">Share this article</div>
    <div class="share-btns">
      <button class="share-btn tw" onclick="window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent('${topic.title}\\nhttps://lifepera.com/${filename}'),'_blank')">𝕏 Tweet</button>
      <button class="share-btn fb" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent('https://lifepera.com/${filename}'),'_blank')">Facebook</button>
      <button class="share-btn wa" onclick="window.open('https://wa.me/?text='+encodeURIComponent('${topic.title}\\nhttps://lifepera.com/${filename}'),'_blank')">WhatsApp</button>
      <button class="share-btn" onclick="navigator.clipboard.writeText('https://lifepera.com/${filename}').then(()=>alert('Copied link!'))">📋 Copy Link</button>
    </div>
  </div>
</div>

<footer>
  <div class="footer-container">
    <div class="footer-brand">
      <a href="/index.html" class="logo" style="color:#ffffff;">Life<span>Pera</span></a>
      <p>Free premium tools for real life decisions. Data-backed, privacy-focused, no signup required.</p>
      <div class="trust-badge">
        <span>🛡️</span> 100% Free • Privacy Protected • Data-Backed
      </div>
    </div>

    <div class="footer-col">
      <h4>Popular Tools</h4>
      <ul>
        <li><a href="/tool-how-rich.html">"How Rich Am I?" Comparator</a></li>
        <li><a href="/tool-visa.html">Visa-Free Travel Checker</a></li>
        <li><a href="/tool-quit-job.html">Should I Quit My Job? Matrix</a></li>
        <li><a href="/tool-underpaid.html">Am I Underpaid? Analyzer</a></li>
        <li><a href="/tool-attachment.html">Attachment Style Quiz</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h4>Company & Trust</h4>
      <ul>
        <li><a href="/about.html">About Us</a></li>
        <li><a href="/about.html#editorial">Editorial & Fact-Checking</a></li>
        <li><a href="/blog.html">Editorial Blog</a></li>
        <li><a href="/contact.html">Contact & Support</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h4>Legal & Standards</h4>
      <ul>
        <li><a href="/privacy.html">Privacy Policy</a></li>
        <li><a href="/terms.html">Terms of Service</a></li>
        <li><a href="/sitemap.xml">Sitemap.xml</a></li>
      </ul>
    </div>
  </div>

  <div class="footer-disclaimer">
    Disclaimer: LifePera tools and calculators are provided for informational and educational purposes only. They do not constitute formal financial, legal, medical, or career advice.
  </div>

  <div class="footer-bottom">
    <div>© 2026 LifePera. All rights reserved.</div>
    <div>Built for curious minds worldwide.</div>
  </div>
</footer>

</body>
</html>`;

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
