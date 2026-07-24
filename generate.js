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

Do NOT include: html, head, body, header tags, code blocks, or CSS. Just the HTML elements directly.`;

const requestData = JSON.stringify({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
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
      let content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        console.error('No content returned from Gemini API:', data);
        process.exit(1);
      }

      // 1. ROBUST MARKDOWN STRIPPING
      content = content
        .replace(/```(?:html)?\s*([\s\S]*?)\s*```/gi, '$1')
        .trim();

      // 2. READ MASTER TEMPLATE (blog-post.html)
      const templatePath = path.join(__dirname, 'blog-post.html');
      if (!fs.existsSync(templatePath)) {
        console.error('Error: blog-post.html template not found in root directory.');
        process.exit(1);
      }
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Generate date and slug
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const niceDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const slug = topic.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60);

      const filename = `blog/post-${dateStr}-${slug}.html`;

      // 3. INJECT CONTENT INTO TEMPLATE PLACEHOLDERS
      // Ensure your blog-post.html uses these exact placeholders:
      // {{TITLE}}, {{CAT}}, {{EMOJI}}, {{DATE}}, {{CONTENT}}
      let finalHtml = htmlTemplate
        .replace(/{{TITLE}}/g, topic.title)
        .replace(/{{CAT}}/g, topic.cat)
        .replace(/{{EMOJI}}/g, topic.emoji)
        .replace(/{{DATE}}/g, niceDate)
        .replace(/{{CONTENT}}/g, content);

      // Ensure output directory exists
      if (!fs.existsSync('blog')) fs.mkdirSync('blog');

      // 4. WRITE GENERATED FILE
      fs.writeFileSync(filename, finalHtml, 'utf8');
      console.log(`✅ Generated new post: ${filename}`);

      // 5. UPDATE blog-index.json
      const blogIndexFile = 'blog-index.json';
      let blogPosts = [];
      if (fs.existsSync(blogIndexFile)) {
        try {
          blogPosts = JSON.parse(fs.readFileSync(blogIndexFile, 'utf8'));
        } catch (e) {}
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
