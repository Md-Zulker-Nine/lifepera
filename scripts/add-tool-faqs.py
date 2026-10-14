#!/usr/bin/env python3
"""Add FAQ sections (visible HTML + FAQPage JSON-LD) to all tool pages."""
import glob
import json
from bs4 import BeautifulSoup

TOOL_FAQS = {
    "tool-how-rich": [
        ("Is this a real global income percentile?", "No. This tool compares your income with fixed USD bands. It is not a verified global percentile and does not adjust for purchasing power, taxes, or household size."),
        ("Do I need to sign up or enter personal data?", "No. The calculation runs entirely in your browser. No data is sent to LifePera's servers."),
        ("How accurate is the result?", "The result is a rough estimate based on fixed thresholds. For a defensible comparison, use an official income dataset with a clearly defined population and year."),
    ],
    "tool-underpaid": [
        ("Does this tool tell me if I'm underpaid?", "No. It only compares two salary figures you enter. It does not supply market data or verify whether your benchmark is representative."),
        ("Where does the benchmark data come from?", "It doesn't. You provide the benchmark yourself from a source that matches your role, location, seniority, and pay type."),
        ("Is the comparison fair for total compensation?", "Not directly. A base-salary figure is not directly comparable with total compensation that includes bonuses, equity, or benefits."),
    ],
    "tool-freelance": [
        ("Do I need to charge more as a freelancer?", "Generally yes. Freelancers typically need to charge 30-40% more per hour than an equivalent employee to cover taxes, benefits, and unpaid time off."),
        ("What tax rate does this tool use?", "It uses a simplified 30% overhead assumption for self-employment tax, benefits, and business costs. Actual tax treatment varies by jurisdiction."),
        ("Is freelancing really better than full-time?", "It depends on your priorities. Freelancing offers flexibility but comes with income instability and more administrative responsibility."),
    ],
    "tool-quit-job": [
        ("Should I quit my job?", "This tool helps you organize your thoughts but cannot make the decision for you. Consider your financial runway, growth options, and mental health."),
        ("How long should my emergency fund be?", "A common guideline is 3-6 months of living expenses, but this depends on your industry's hiring speed and personal circumstances."),
        ("What if the tool says stay?", "Try negotiating boundaries, salary, or role changes first. If nothing improves, start exploring options while still employed."),
    ],
    "tool-visa": [
        ("Does this tool list visa-free destinations?", "No. It shows a stored access count per passport. It does not list destinations or current entry rules."),
        ("Is the access count accurate?", "The stored count may be incomplete or outdated. Always verify with the destination government's immigration or embassy website."),
        ("Can I use this to plan a trip?", "Use it only as a rough prompt for further research. Check transit rules separately and verify again close to departure."),
    ],
    "tool-attachment": [
        ("What are the four attachment styles?", "Secure, anxious, avoidant, and disorganized. Most people recognize aspects of more than one style."),
        ("Can I change my attachment style?", "Yes. Secure attachment is learnable through self-awareness, therapy, and healthy relationship experiences."),
        ("Is this a clinical diagnosis?", "No. This is a self-reflection quiz for educational purposes, not a psychological assessment or diagnosis."),
    ],
    "tool-travel-budget": [
        ("Are these travel budgets accurate?", "They are illustrative estimates using broad regions and fixed assumptions. Actual costs vary by season, city, and travel style."),
        ("What does the budget include?", "Accommodation, meals, local transport, and activities. International flights, visas, and insurance are excluded."),
        ("How can I stretch my travel budget?", "Travel in shoulder season, eat where locals eat, use public transport, and keep a 20% buffer above your estimate."),
    ],
    "tool-solo-safety": [
        ("Is solo travel safe?", "It depends on the destination, your preparation, and your risk awareness. Research local conditions and share your itinerary with someone."),
        ("What should I check before traveling solo?", "Entry requirements, local laws, health advisories, transport safety, and reliable accommodation reviews."),
        ("Does this tool guarantee my safety?", "No. It provides general guidance only. Always verify current conditions with official sources before traveling."),
    ],
    "tool-best-visit": [
        ("When is the best time to visit?", "It depends on your priorities: weather, crowds, or budget. Shoulder seasons often offer the best balance."),
        ("Are these recommendations current?", "Seasonal patterns are generally stable, but always check current events, holidays, and weather forecasts."),
        ("Does this cover every country?", "No. It covers major destinations. For less common destinations, research region-specific climate patterns."),
    ],
    "tool-language-kit": [
        ("Does this tool teach full language skills?", "No. It provides essential travel phrases with pronunciation guides and cultural context for short trips."),
        ("Which languages are included?", "Major travel languages such as Spanish, French, Japanese, and others commonly needed by travelers."),
        ("Is the pronunciation accurate?", "It provides simplified pronunciation guides. For accurate speaking, supplement with native audio resources."),
    ],
    "tool-cultural": [
        ("What is a cultural faux pas?", "A behavior that is acceptable in your culture but offensive or disrespectful in another. Examples include gestures, tipping, and dress codes."),
        ("How do I avoid cultural mistakes?", "Research basic etiquette before you travel, observe local behavior, and ask politely when unsure."),
        ("Does this cover every country?", "No. It covers common travel destinations. For specific countries, research local customs in more depth."),
    ],
    "tool-culture-map": [
        ("What is cultural distance?", "The degree of difference between two cultures on dimensions like power distance, individualism, and communication context."),
        ("Why does cultural distance matter?", "It affects communication, negotiation, and relationship building in cross-cultural settings."),
        ("Is one culture better than another?", "No. The tool measures difference, not quality. Each cultural pattern has context-specific strengths."),
    ],
    "tool-age-cultures": [
        ("What is Korean age?", "In Korea, you are considered 1 at birth and gain a year on January 1st, making you 1-2 years older than your international age."),
        ("Why do cultures count age differently?", "Some cultures count from conception, others from birth, and some reset at lunar new year or other calendar events."),
        ("Is this tool accurate for legal purposes?", "No. It is for cultural curiosity. Legal age is always determined by the relevant jurisdiction's rules."),
    ],
    "tool-name-meaning": [
        ("Where do name meanings come from?", "The tool draws on common etymological and cultural associations. Meanings can vary by language and region."),
        ("Is my name's meaning definitive?", "No. Names often have multiple origins and meanings across cultures. Treat this as a starting point for research."),
        ("Does this work for every name?", "Coverage depends on the name's origin and popularity. Less common names may have limited information."),
    ],
    "tool-lucky": [
        ("Are lucky numbers real?", "Lucky numbers are cultural traditions, not facts. Different cultures assign different numbers special meaning."),
        ("Which numbers are considered lucky?", "7 is widely lucky in Western cultures, 8 in Chinese culture, while 4 is often avoided in East Asia."),
        ("Should I make decisions based on lucky numbers?", "No. This is for cultural curiosity and entertainment only."),
    ],
    "tool-generation": [
        ("What defines a generation?", "Generations are typically defined by shared cultural and historical experiences during formative years."),
        ("Can I belong to a different generation than my birth year?", "Yes. Cultural generation is about habits and mindset, not just birth year."),
        ("Are generation labels accurate?", "They are broad generalizations. Individual experiences vary widely within any generation."),
    ],
    "tool-era-born": [
        ("What does it mean to be born for a different era?", "It means your values, aesthetics, or mindset align more with a historical period than your birth decade."),
        ("Is this scientifically validated?", "No. It is a fun reflection tool based on cultural associations, not a psychological assessment."),
        ("Can I be born for multiple eras?", "Yes. The tool identifies your closest match, but many people relate to multiple eras."),
    ],
    "tool-rare-birthday": [
        ("How is birthday rarity calculated?", "It compares your birth date's frequency against all 365 days. Leap day and holidays often rank differently."),
        ("Is my birthday really rare?", "Rarity depends on birth year distribution. Some dates are less common due to seasonal birth patterns."),
        ("Does this include famous people?", "Yes. The tool shows notable people who share your birthday when available."),
    ],
    "tool-name-peak": [
        ("Where does name popularity data come from?", "It uses historical naming trend data. Coverage varies by country and time period."),
        ("Why did my name peak in a certain year?", "Names often peak due to cultural trends, celebrities, or media influence of that era."),
        ("Is this data current?", "Historical data is stable, but recent years may be incomplete. Check official statistics for the latest trends."),
    ],
    "tool-google-data": [
        ("How much does Google really know about me?", "It depends on your account activity, device usage, and privacy settings. The tool gives a rough estimate."),
        ("How do I reduce my Google data footprint?", "Review your Activity Controls, ad personalization, location history, and app permissions in your Google account."),
        ("Does this tool access my Google data?", "No. It only estimates based on common data collection practices. No personal data is accessed."),
    ],
    "tool-email-tone": [
        ("How does the tone checker work?", "It analyzes word choice, punctuation, and phrasing patterns associated with different communication tones."),
        ("Is the tone analysis accurate?", "It provides a general indication, not a perfect reading. Context and relationship matter in tone interpretation."),
        ("Can I use this for every email?", "It works best for professional emails. Personal or creative emails may use tone differently."),
    ],
    "tool-toxic-workplace": [
        ("What counts as a toxic workplace?", "Patterns like consistent disrespect, favoritism, unrealistic demands, or retaliation for raising concerns."),
        ("Is a tough boss the same as a toxic workplace?", "No. High standards are different from toxicity. Toxicity involves patterns of harm, not just pressure."),
        ("What should I do if I'm in a toxic workplace?", "Document specific incidents, check your rights, talk to HR if appropriate, and consider your exit options."),
    ],
    "tool-toxic-relationship": [
        ("What are signs of a toxic relationship?", "Patterns like control, disrespect, isolation from friends, or consistent disregard for your boundaries."),
        ("Is conflict the same as toxicity?", "No. Healthy relationships have conflict. Toxicity involves patterns of harm, manipulation, or control."),
        ("Can a toxic relationship improve?", "Sometimes, if both people acknowledge problems and commit to change. Professional help can support this."),
    ],
    "tool-breakup": [
        ("How do I know if it's time to break up?", "Consider trust, communication, shared future, and happiness. This tool helps you score these factors."),
        ("Is the breakup score definitive?", "No. It is a reflection aid. Complex relationships need more than a score to decide."),
        ("Should I try counseling first?", "If both people are willing, counseling can help clarify whether the relationship can improve."),
    ],
    "tool-breadcrumbing": [
        ("What is breadcrumbing?", "Sending just enough messages to keep someone interested without committing to real connection or plans."),
        ("How is breadcrumbing different from ghosting?", "Ghosting is cutting contact completely. Breadcrumbing maintains minimal contact to keep options open."),
        ("What should I do if someone breadcrumbs me?", "Decide if you accept occasional contact or want consistent effort. Communicate your needs clearly."),
    ],
    "tool-friendship": [
        ("How do I know if a friendship is healthy?", "Look for mutual effort, respect, support, and enjoyment. This tool helps you score these dimensions."),
        ("Can friendships fade naturally?", "Yes. Life changes can shift friendships. Some fading is normal and not anyone's fault."),
        ("When should I end a friendship?", "When the relationship consistently drains you, disrespects your boundaries, or causes more harm than good."),
    ],
    "tool-comm-clash": [
        ("What causes communication clashes?", "Differences in directness, context, emotional expression, and expectations about response time."),
        ("Is direct communication always better?", "No. Different cultures and personalities have different effective styles. Adapt to your audience."),
        ("How can I improve cross-cultural communication?", "Learn the other person's communication norms, ask clarifying questions, and confirm understanding."),
    ],
    "tool-cognitive-bias": [
        ("What is a cognitive bias?", "A mental shortcut that can lead to errors in judgment. Examples include confirmation bias and sunk cost fallacy."),
        ("Can I eliminate my biases?", "Not completely, but awareness and structured decision-making can reduce their impact."),
        ("Which bias am I most likely to have?", "Everyone has several. The tool identifies patterns based on your answers, not a fixed type."),
    ],
    "tool-eq": [
        ("What is emotional intelligence?", "The ability to perceive, understand, manage, and use emotions in yourself and others."),
        ("Is EQ more important than IQ?", "They measure different things. EQ strongly predicts relationship and workplace success."),
        ("Can EQ be improved?", "Yes. Self-awareness, empathy, and emotion regulation can all be developed with practice."),
    ],
    "tool-introvert": [
        ("Am I an introvert or extrovert?", "Most people are somewhere in between. This tool measures where you fall on the spectrum."),
        ("Is being introverted a disadvantage?", "No. Introverts often excel at deep work, listening, and thoughtful decision-making."),
        ("Can I change my social battery?", "You can expand it gradually with practice, but your baseline temperament is relatively stable."),
    ],
    "tool-core-values": [
        ("What are core values?", "The principles that guide your decisions and define what matters most to you."),
        ("How many values should I have?", "Most people have 5-10 core values. This tool helps you identify your top 5 from 30 options."),
        ("Do values change over time?", "Yes. Life experiences can shift your priorities. Reassessing values periodically is healthy."),
    ],
    "tool-zodiac": [
        ("Is astrology scientifically valid?", "No. Astrology is a cultural tradition, not a science. This tool compares it with the Big Five personality model."),
        ("What is the Big Five?", "A research-backed personality framework measuring openness, conscientiousness, extraversion, agreeableness, and neuroticism."),
        ("Should I make decisions based on my zodiac sign?", "No. Use it for entertainment. For self-understanding, validated tools are more useful."),
    ],
    "tool-texting": [
        ("What does my texting style say about me?", "It reflects habits like response speed, emoji use, and message length. It is not a clinical assessment."),
        ("Is slow replying rude?", "Not necessarily. Response time depends on context, culture, and personal habits."),
        ("Can I change my texting style?", "Yes, if you want to communicate differently. Awareness is the first step."),
    ],
    "tool-detox": [
        ("What is a digital detox?", "A period of reduced screen time or specific app use to reset your relationship with technology."),
        ("How long should a detox last?", "It depends on your goals. Some people benefit from a day, others from a week or more."),
        ("Will a detox improve my mental health?", "Reduced screen time can improve sleep and focus for many people, but results vary."),
    ],
}

DEFAULT_FAQS = [
    ("Is this tool free?", "Yes. Every LifePera tool is free to use with no account, signup, or payment required."),
    ("Do I need to enter personal data?", "No. All calculations run in your browser. Your inputs are not sent to LifePera's servers."),
    ("How accurate is this tool?", "Each tool page explains its method and limitations. Results are estimates, not verified facts."),
]


def get_faqs(tool_id):
    return TOOL_FAQS.get(tool_id, DEFAULT_FAQS)


FAQ_CSS = """.faq-section{margin:2rem 0}
.faq-item{margin-bottom:1.2rem}
.faq-q{font-size:1.05rem;font-weight:700;margin:0 0 .4rem;color:var(--text)}
.faq-a{font-size:.95rem;color:var(--muted);margin:0;line-height:1.7}"""


def fix_tool(filepath):
    with open(filepath, encoding="utf-8") as fh:
        soup = BeautifulSoup(fh.read(), "html.parser")

    if soup.find("div", class_="faq-section"):
        return False

    tool_id = filepath.replace(".html", "")
    qas = get_faqs(tool_id)

    parts = []
    for q, a in qas:
        parts.append(
            '<div class="faq-item"><h3 class="faq-q">' + q + '</h3><p class="faq-a">' + a + "</p></div>"
        )
    faq_html = '<h2>Frequently Asked Questions</h2><div class="faq-section">' + "".join(parts) + "</div>"

    # Insert before sidebar or at end of main
    sidebar = soup.find("aside")
    faq_div = BeautifulSoup(faq_html, "html.parser")
    if sidebar:
        sidebar.insert_before(faq_div)
    else:
        main = soup.find("main")
        if main:
            main.append(faq_div)

    style = soup.find("style")
    if style and "faq-section" not in style.string:
        style.string = style.string + "\n" + FAQ_CSS

    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in qas
        ],
    }
    head = soup.find("head")
    faq_script = soup.new_tag("script", type="application/ld+json")
    faq_script.string = json.dumps(faq_schema, ensure_ascii=False)
    ld = head.find_all("script", type="application/ld+json")
    if ld:
        ld[-1].insert_after(faq_script)
    else:
        head.append(faq_script)

    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(str(soup))
    return True


def main():
    fixed = 0
    for filepath in sorted(glob.glob("tool-*.html")):
        if fix_tool(filepath):
            fixed += 1
    print("Tool pages with FAQ:", fixed)


if __name__ == "__main__":
    main()
