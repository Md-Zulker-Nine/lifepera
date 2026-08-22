const fs = require('fs');
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error('GEMINI_API_KEY missing'); process.exit(1); }

const TOPICS = [
  { title: "10 Cultural Mistakes Tourists Make in Thailand", cat: "Culture · Travel", emoji: "🇹🇭", keywords: "thailand culture travel mistakes tourists" },
  { title: "How to Know if You're Being Underpaid in 2026", cat: "Career · Finance", emoji: "💰", keywords: "underpaid salary negotiation career" },
  { title: "What Your Attachment Style Says About Your Communication", cat: "Relationships · Psychology", emoji: "🧠", keywords: "attachment style relationships communication" },
  { title: "Visa-Free Countries You Probably Didn't Know About", cat: "Travel · Passport", emoji: "✈️", keywords: "visa free travel passport countries" },
  { title: "7 Signs You're in a Toxic Workplace (And What to Do)", cat: "Career · Wellbeing", emoji: "⚠️", keywords: "toxic workplace signs career mental health" },
  { title: "The Psychology Behind Why Relationships Repeat Patterns", cat: "Psychology · Relationships", emoji: "🔄", keywords: "relationship patterns psychology attachment" },
  { title: "How Rich Are You Really? A Global Perspective on Income", cat: "Finance · Global", emoji: "📊", keywords: "global income wealth comparison finance" },
  { title: "Lucky Numbers Around the World: What Different Cultures Believe", cat: "Culture · Numerology", emoji: "🔢", keywords: "lucky numbers culture numerology worldwide" },
  { title: "Email Mistakes That Make You Sound Passive-Aggressive", cat: "Communication · Career", emoji: "✉️", keywords: "email tone passive aggressive professional" },
  { title: "The Most Powerful Passports in the World Right Now", cat: "Travel · Global", emoji: "🛂", keywords: "powerful passports visa free travel 2026" },
  { title: "Should You Quit Your Job? 10 Questions to Ask Yourself", cat: "Career · Decision", emoji: "🚪", keywords: "quit job career decision change work" },
  { title: "What Gaslighting Really Looks Like in Relationships", cat: "Relationships · Psychology", emoji: "👁️", keywords: "gaslighting relationships toxic patterns" },
  { title: "Best Time to Visit Japan: Month by Month Guide", cat: "Travel · Japan", emoji: "🇯🇵", keywords: "best time visit japan travel guide seasons" },
  { title: "How Your Name Sounds in Different Languages", cat: "Culture · Language", emoji: "🔤", keywords: "name meaning cultures languages global" },
  { title: "Understanding the 4 Attachment Styles and How They Affect You", cat: "Psychology · Relationships", emoji: "🔗", keywords: "4 attachment styles secure anxious avoidant" },
  { title: "Freelance vs Full-Time: Which Actually Pays More in 2026?", cat: "Career · Finance", emoji: "💻", keywords: "freelance vs full time salary comparison 2026" },
  { title: "Can You Drink the Tap Water? A Guide for 50 Countries", cat: "Travel · Safety", emoji: "🚰", keywords: "tap water safety countries travel guide" },
  { title: "Why Your Emotional Intelligence Matters More Than Your IQ", cat: "Psychology · Self-Growth", emoji: "❤️", keywords: "emotional intelligence EQ IQ psychology" },
  { title: "Cultural Faux Pas to Avoid in the Middle East", cat: "Culture · Travel", emoji: "🧭", keywords: "middle east culture travel mistakes etiquette" },
  { title: "How to Identify Your Core Values and Use Them to Make Better Decisions", cat: "Psychology · Self-Discovery", emoji: "✨", keywords: "core values identify decision making life" },
  { title: "The Science Behind Why Breakups Hurt So Much", cat: "Relationships · Psychology", emoji: "💔", keywords: "breakup science psychology attachment healing" },
  { title: "10 Signs You Have an Anxious Attachment Style", cat: "Relationships · Psychology", emoji: "📌", keywords: "anxious attachment style signs relationships" },
  { title: "What Breadcrumbing Looks Like (And Why It Keeps Happening)", cat: "Relationships · Dating", emoji: "🍞", keywords: "breadcrumbing dating relationships signs" },
  { title: "How Different Cultures View Aging and What We Can Learn", cat: "Culture · Lifestyle", emoji: "⏳", keywords: "aging cultures perspective life stages global" },
  { title: "Travel Budget Reality Check: What Things Actually Cost", cat: "Travel · Finance", emoji: "💵", keywords: "travel budget real costs destinations finance" },
  { title: "Digital Nomad Burnout: When Freedom Becomes Loneliness", cat: "Travel · Lifestyle", emoji: "🧳", keywords: "digital nomad burnout remote work loneliness" },
  { title: "Why Sharing Your True Self Feels Terrifying (And How to Overcome It)", cat: "Psychology · Relationships", emoji: "🧠", keywords: "vulnerability fear sharing emotions psychology" },
  { title: "Career Cushioning: Why Everyone Is Quietly Building a Backup Plan", cat: "Career · Wellbeing", emoji: "💼", keywords: "career cushioning backup plan job security" },
  { title: "The Hidden Epidemic of Financial Infidelity in Relationships", cat: "Finance · Relationships", emoji: "💳", keywords: "financial infidelity hidden money relationships" },
  { title: "How to Take a Mini-Retirement Without Going Broke", cat: "Career · Finance", emoji: "🌴", keywords: "mini retirement mid career break finance planning" },
  { title: "Why Making More Money Isn't Making You Richer (And How to Fix It)", cat: "Finance · Lifestyle", emoji: "💸", keywords: "lifestyle creep income inflation spending habits" },
  { title: "High-Functioning Anxiety: The Silent Epidemic Among High Achievers", cat: "Psychology · Wellbeing", emoji: "⚡", keywords: "high functioning anxiety burnout performance masking" }
];

const MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const MIN_WORDS = 800;
const MAX_ATTEMPTS = 3;

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
  { keywords: ['rich','wealth','income','money','global','afford'], tool: 'tool-how-rich.html', name: 'How Rich Am I? Comparator' },
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

function wordCount(html) {
  return (html.replace(/<[^>]+>/g, '').match(/\S+/g) || []).length;
}

function findRelatedTools(topic) {
  const text = (topic.title + ' ' + topic.keywords + ' ' + topic.cat).toLowerCase();
  const matches = [];
  for (const entry of TOOL_MAP) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      matches.push(entry);
      if (matches.length >= 2) break;
    }
  }
  if (matches.length < 2) {
    const fallback = [
      { tool: 'tool-how-rich.html', name: 'How Rich Am I?' },
      { tool: 'tool-visa.html', name: 'Visa-Free Travel Checker' },
      { tool: 'tool-attachment.html', name: 'Attachment Style Quiz' },
    ];
    for (const fb of fallback) {
      if (!matches.find(m => m.tool === fb.tool)) matches.push(fb);
      if (matches.length >= 2) break;
    }
  }
  return matches;
}

function findRelatedPosts(currentTitle, posts) {
  const related = posts.filter(p => p.title !== currentTitle).slice(0, 3);
  return related;
}

async function callGemini(payload) {
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (res.ok && text) return text;
        if ((res.status === 429 || (data.error?.message||'').includes('quota')) && attempt < 3) {
          await sleep(20000);
          continue;
        }
        break;
      } catch(e) { break; }
    }
  }
  throw new Error('All models failed to generate content');
}

async function run() {
  const indexFile = 'blog-index.json';
  let posts = [];
  if (fs.existsSync(indexFile)) {
    try { posts = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch(e) {}
  }

  const publishedTitles = new Set(posts.map(p => p.title));
  let topic;
  let content;

  const nextTopic = TOPICS.find(t => !publishedTitles.has(t.title));

  if (nextTopic) {
    topic = nextTopic;
    console.log(`Publishing from manual list: "${topic.title}"`);

    for (let wcAttempt = 1; wcAttempt <= MAX_ATTEMPTS; wcAttempt++) {
      const wcHint = wcAttempt > 1
        ? `\n\nCRITICAL: Your previous response was only ${wordCount(content || '')} words. You MUST write AT LEAST 1000 words of substantive, detailed content. Every section must have multiple paragraphs with concrete examples and practical advice. Do NOT write fewer than 1000 words.`
        : '';
      const prompt = `Write a comprehensive, in-depth blog post for LifePera (lifepera.com).

Title: "${topic.title}"
Category: ${topic.cat}
Keywords: ${topic.keywords}

- AT LEAST 1000 words (aim for 1200-1400), conversational tone
- Detailed explanations, multiple H2 subheadings, and bullet points where helpful
- Hook intro, deep practical insights, and end with a clear CTA to LifePera tools
- Global audience, high quality, no fluff
- Only use these HTML tags in the body: <h2>, <p>, <ul><li>, <strong>
- Do not include html, head, body, or CSS tags in this response.${wcHint}`;

      content = await callGemini({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
      });

      const wc = wordCount(content);
      console.log(`Attempt ${wcAttempt}: ${wc} words`);
      if (wc >= MIN_WORDS) break;
      if (wcAttempt < MAX_ATTEMPTS) await sleep(5000);
    }

    if (wordCount(content) < 600) {
      console.log(`SKIPPED: Content too thin (${wordCount(content)} words) after ${MAX_ATTEMPTS} attempts.`);
      return;
    }
  } else {
    console.log('Manual list complete. Switching to Google Trending mode...');
    const existingTitles = posts.map(p => p.title).join('\n- ');

    for (let wcAttempt = 1; wcAttempt <= MAX_ATTEMPTS; wcAttempt++) {
      const wcHint = wcAttempt > 1
        ? `\n\nCRITICAL: Your previous body content was only ${wordCount(content || '')} words. You MUST write AT LEAST 1000 words of substantive, detailed content in the body. Every section must have multiple paragraphs. Do NOT write fewer than 1000 words.`
        : '';
      const prompt = `You are the lead content creator and SEO expert for LifePera (lifepera.com), a website offering free tools for real-life decisions in Career, Finance, Travel, Relationships, Psychology, and Culture.

Task:
1. Identify a current trending topic, common modern dilemma, or high-interest search angle relevant to LifePera's audience.
2. Ensure the topic is completely different from these already published titles:
- ${existingTitles || 'None yet'}

Output Format:
You must output your response strictly starting with a JSON block on the very first line containing the topic metadata, followed by the HTML body content.

Line 1 (JSON metadata only): 
{"title": "Your Generated Title Here", "cat": "Category Name", "emoji": "🎯", "keywords": "comma separated SEO keywords"}

Lines 2 onwards: The full blog post content (AT LEAST 1000 words, conversational tone, practical takeaways, multiple H2 subheadings, hook intro, ending with a CTA reference to LifePera tools). 
Constraints for body content: Only use tags <h2>, <p>, <ul><li>, <strong>. No html, head, body, or CSS tags in the body content.${wcHint}`;

      const rawOutput = await callGemini({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
        tools: [{ googleSearch: {} }]
      });

      const firstLineEnd = rawOutput.indexOf('\n');
      if (firstLineEnd === -1) throw new Error('Invalid response format from Gemini');

      let topicData;
      try {
        topicData = JSON.parse(rawOutput.substring(0, firstLineEnd).trim());
      } catch(e) {
        const jsonMatch = rawOutput.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) throw new Error('Could not parse topic JSON from Gemini response');
        topicData = JSON.parse(jsonMatch[0]);
      }

      topic = topicData;
      content = rawOutput.substring(firstLineEnd).trim();

      const wc = wordCount(content);
      console.log(`Attempt ${wcAttempt}: ${wc} words (trending topic)`);
      if (wc >= MIN_WORDS) break;
      if (wcAttempt < MAX_ATTEMPTS) await sleep(5000);
    }

    if (wordCount(content) < 600) {
      console.log(`SKIPPED: Trending content too thin (${wordCount(content)} words) after ${MAX_ATTEMPTS} attempts.`);
      return;
    }
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const niceDate = now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const slug = topic.title.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,'-').substring(0,60);
  
  if (!fs.existsSync('blog')) fs.mkdirSync('blog');
  const filename = `blog/post-${dateStr}-${slug}.html`;

  if (fs.existsSync(filename)) {
    console.log('Post file already exists: ' + filename);
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="description" content="${topic.title} — LifePera Blog. ${topic.keywords}."/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="https://lifepera.com/${filename}"/>
<meta property="og:title" content="${topic.title} — LifePera"/>
<meta property="og:description" content="${topic.title} — Read the full guide on LifePera — free tools for real life decisions."/>
<meta property="og:url" content="https://lifepera.com/${filename}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="LifePera"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${topic.title} — LifePera"/>
<meta name="twitter:description" content="${topic.title} — Read the full guide on LifePera."/>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"${topic.title}","author":{"@type":"Person","name":"Zulker Nine"},"publisher":{"@type":"Organization","name":"LifePera","url":"https://lifepera.com"},"datePublished":"${dateStr}","description":"${topic.title}"}
</script>
<title>${topic.title} — LifePera</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f8f9fa;--surface:#fff;--text:#202124;--muted:#5f6368;--blue:#1a73e8;--border:#dadce0;--radius:12px;--max-w:1200px}
body{background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--blue);text-decoration:none}
header{background:rgba(255,255,255,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1000}
.nav{max-width:var(--max-w);margin:0 auto;padding:0 1.5rem;height:72px;display:flex;justify-content:space-between;align-items:center}
.logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;display:flex;align-items:center;gap:8px}
.logo span{color:var(--blue)}
.badge{background:#e8f0fe;color:var(--blue);font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:12px;text-transform:uppercase;letter-spacing:.5px}
.nav-links{display:flex;gap:2rem;font-weight:600;font-size:.92rem;align-items:center}
.nav-links a{color:var(--muted)}.nav-links a:hover{color:var(--blue)}
main{max-width:860px;margin:2rem auto;padding:0 1.5rem}
.post-cat{font-size:.82rem;font-weight:600;text-transform:uppercase;color:var(--blue);margin-bottom:.5rem;letter-spacing:.5px}
h1{font-size:2.5rem;font-weight:800;line-height:1.15;margin-bottom:1rem;letter-spacing:-.5px}
.meta{font-size:.88rem;color:var(--muted);padding-bottom:1.5rem;border-bottom:1px solid var(--border);margin-bottom:2rem;display:flex;align-items:center;gap:.8rem}
.ad-slot{background:#f1f3f4;border:1px dashed #bdc1c6;text-align:center;padding:1.8rem;color:var(--muted);font-size:.85rem;border-radius:var(--radius);margin-bottom:2rem}
.body{font-size:1.05rem;line-height:1.8}
.body p{margin-bottom:1.3rem;color:var(--text)}
.body h2{font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}
.body strong{font-weight:700}
.body ul{margin:1rem 0 1.5rem 1.5rem}
.body li{margin-bottom:.5rem;line-height:1.7}
.cta{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;margin:2rem 0;text-align:center}
.cta h3{margin-bottom:.5rem;font-size:1.2rem}
.cta p{font-size:.95rem;color:var(--muted);margin-bottom:1rem}
.cta-btn{display:inline-block;background:var(--blue);color:#fff!important;padding:10px 24px;border-radius:6px;font-weight:600;font-size:.9rem}
.cta-btn:hover{background:#1557b0}
.related-tools{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.8rem;margin:2.5rem 0}
.related-tools h3{font-size:1.1rem;font-weight:700;margin-bottom:1rem}
.related-tools ul{list-style:none;display:flex;flex-direction:column;gap:.7rem}
.related-tools a{display:flex;align-items:center;gap:.5rem;padding:8px 12px;background:var(--bg);border-radius:8px;font-weight:500;font-size:.95rem;transition:background .15s}
.related-tools a:hover{background:#e8f0fe}
.related-posts{margin:2.5rem 0;padding:2rem 0;border-top:1px solid var(--border)}
.related-posts h3{font-size:1.1rem;font-weight:700;margin-bottom:1rem}
.related-posts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
.related-post-card{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:1rem;text-decoration:none;color:var(--text);transition:border-color .15s}
.related-post-card:hover{border-color:var(--blue)}
.related-post-card .rp-cat{font-size:.75rem;font-weight:600;color:var(--blue);text-transform:uppercase;margin-bottom:.3rem}
.related-post-card .rp-title{font-size:.92rem;font-weight:600;line-height:1.4}
footer{background:#111827;color:#9ca3af;border-top:1px solid #1f2937;padding:4rem 1.5rem 2rem;margin-top:4rem}
.footer-inner{max-width:var(--max-w);margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2.5rem}
.footer-brand .logo{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;color:#fff;margin-bottom:1rem}
.footer-brand p{font-size:.88rem;color:#9ca3af;line-height:1.6;max-width:320px;margin-bottom:1.5rem}
.trust{display:inline-flex;align-items:center;gap:8px;background:#1f2937;border:1px solid #374151;padding:6px 12px;border-radius:6px;font-size:.78rem;color:#d1d5db;font-weight:500}
.f-col h4{font-size:1rem;font-weight:700;color:#fff;margin-bottom:1.2rem;letter-spacing:.5px}
.f-col ul{list-style:none}.f-col li{margin-bottom:.7rem}
.f-col a{color:#9ca3af;font-size:.88rem}.f-col a:hover{color:#fff}
.footer-bot{max-width:var(--max-w);margin:3rem auto 0;padding-top:2rem;border-top:1px solid #1f2937;display:flex;justify-content:space-between;align-items:center;font-size:.82rem;color:#6b7280}
.footer-disc{max-width:var(--max-w);margin:1.5rem auto 0;font-size:.76rem;color:#4b5563;line-height:1.5;text-align:center}
.cookie-bar{position:fixed;bottom:0;left:0;right:0;background:#1f2937;color:#d1d5db;padding:1rem 1.5rem;z-index:9999;display:none;border-top:1px solid #374151}
.cookie-inner{max-width:var(--max-w);margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap}
.cookie-inner p{font-size:.85rem;line-height:1.5}
.cookie-btn{background:var(--blue);color:#fff;border:none;padding:10px 24px;border-radius:6px;font-weight:600;cursor:pointer;font-size:.88rem;white-space:nowrap}
.cookie-btn:hover{background:#1557b0}
@media(max-width:900px){.footer-inner{grid-template-columns:1fr}.footer-bot{flex-direction:column;gap:1rem;text-align:center}h1{font-size:1.8rem}}
</style>
</head>
<body>
<header>
<div class="nav">
<a href="/" class="logo">Life<span>Pera</span><span class="badge">Pro</span></a>
<div class="nav-links">
<a href="/tools.html">Tools</a><a href="/blog.html">Blog</a><a href="/about.html">About</a><a href="/contact.html">Contact</a>
</div>
</div>
</header>
<main>
<div class="post-cat">${topic.cat}</div>
<h1>${topic.title}</h1>
<div class="meta"><span>Zulker Nine</span><span>·</span><span>${niceDate}</span></div>
<div class="ad-slot" style="display:none">Reserved for AdSense</div>
<div class="body">${content}</div>
<div class="cta">
<h3>Try Our Free Tools</h3>
<p>36 free tools covering travel, relationships, career, culture, psychology and finance. No signup required.</p>
<a class="cta-btn" href="/tools.html">Explore All Free Tools &rarr;</a>
</div>
<div class="related-tools">
<h3>🛠️ Tools Related to This Article</h3>
<ul>
${findRelatedTools(topic).map(t => `<li><a href="/${t.tool}">${t.name} →</a></li>`).join('\n')}
</ul>
</div>
<div class="related-posts">
<h3>📖 You May Also Like</h3>
<div class="related-posts-grid">
${findRelatedPosts(topic.title, posts).map(p => `<a href="/${p.file}" class="related-post-card"><div class="rp-cat">${p.cat}</div><div class="rp-title">${p.title}</div></a>`).join('\n')}
</div>
</div>
</main>
<footer>
<div class="footer-inner">
<div class="footer-brand">
<a href="/" class="logo" style="color:#fff">Life<span style="color:#1a73e8">Pera</span></a>
<p>Free premium tools for real life decisions. Data-backed, privacy-focused, no signup required.</p>
<span class="trust">🛡️ 100% Free · Privacy Protected · Data-Backed</span>
</div>
<div class="f-col">
<h4>Tools</h4>
<ul>
<li><a href="/tool-how-rich.html">Global Wealth Comparator</a></li>
<li><a href="/tool-visa.html">Visa-Free Travel Checker</a></li>
<li><a href="/tool-attachment.html">Attachment Style Quiz</a></li>
</ul>
</div>
<div class="f-col">
<h4>Company</h4>
<ul>
<li><a href="/about.html">About Us</a></li>
<li><a href="/blog.html">Editorial Blog</a></li>
<li><a href="/contact.html">Contact & Support</a></li>
</ul>
</div>
<div class="f-col">
<h4>Legal</h4>
<ul>
<li><a href="/privacy.html">Privacy Policy</a></li>
<li><a href="/terms.html">Terms of Service</a></li>
<li><a href="/sitemap.xml">Sitemap</a></li>
</ul>
</div>
</div>
<div class="footer-disc">Disclaimer: LifePera tools and calculators are provided for informational and educational purposes only. They do not constitute formal financial, legal, medical, or career advice.</div>
<div class="footer-bot"><span>&copy; 2026 LifePera. All rights reserved.</span><span>Built for curious minds worldwide.</span></div>
</footer>
<div class="cookie-bar" id="cookieBar">
<div class="cookie-inner">
<p>🍪 LifePera uses cookies to improve your experience and serve personalized ads. By continuing, you agree to our <a href="/privacy.html" style="color:#8ab4f8">Privacy Policy</a>.</p>
<button class="cookie-btn" onclick="acceptCookies()">Accept All</button>
</div>
</div>
<script>
function acceptCookies(){document.getElementById('cookieBar').style.display='none';localStorage.setItem('cookiesAccepted','true')}
(function(){if(!localStorage.getItem('cookiesAccepted'))document.getElementById('cookieBar').style.display='block'})();
</script>
</body></html>`;

  fs.writeFileSync(filename, html);
  console.log('Successfully generated post: ' + filename);

  posts = posts.filter(p => p.file !== filename && p.title !== topic.title);
  posts.unshift({ title: topic.title, cat: topic.cat, emoji: topic.emoji, date: niceDate, file: filename });
  fs.writeFileSync(indexFile, JSON.stringify(posts, null, 2));
  console.log('Updated blog-index.json successfully.');

  // Keep sitemap.xml in sync with the new post (dynamic sitemap)
  try {
    require('./generate-sitemap.js');
    console.log('sitemap.xml regenerated with new post.');
  } catch (e) {
    console.error('WARN: sitemap regeneration failed:', e.message);
  }
}

run().catch(err => { console.error(err.message); process.exit(1); });
