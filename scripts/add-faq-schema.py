#!/usr/bin/env python3
"""
Add FAQ sections (visible HTML + FAQPage JSON-LD) to all blog posts.
Q&As are generated from each article's own H2 headings + first paragraph,
so they're genuinely relevant to each post (good for AI Overviews).
"""
import glob
import json
from bs4 import BeautifulSoup

MIN_QA = 3


def extract_qas(soup):
    """Extract Q&A pairs from H2 sections: question=heading, answer=first paragraph."""
    qas = []
    body = soup.find("div", class_="body") or soup.find("article", class_="body")
    if not body:
        return qas
    for h2 in body.find_all("h2"):
        question = h2.get_text(strip=True)
        # Find first paragraph after this heading
        answer = ""
        for sib in h2.find_next_siblings():
            if sib.name == "h2":
                break
            if sib.name == "p":
                answer = sib.get_text(strip=True)
                break
            if sib.name in ("ul", "ol"):
                answer = sib.get_text(strip=True)
                break
        if question and answer and len(answer) > 40:
            # Clean up question
            q = question.rstrip("?")
            qas.append({"q": q, "a": answer})
        if len(qas) >= 5:
            break
    return qas


def build_faq_html(qas):
    items = []
    for qa in qas:
        items.append(
            '<div class="faq-item">'
            f'<h3 class="faq-q">{qa["q"]}?</h3>'
            f'<p class="faq-a">{qa["a"]}</p>'
            "</div>"
        )
    return (
        '<h2>Frequently Asked Questions</h2>'
        '<div class="faq-section">' + "".join(items) + "</div>"
    )


FAQ_CSS = """.faq-section{margin:1.5rem 0}
.faq-item{margin-bottom:1.2rem}
.faq-q{font-size:1.05rem;font-weight:700;margin:0 0 .4rem;color:var(--text)}
.faq-a{font-size:.95rem;color:var(--muted);margin:0;line-height:1.7}"""


def fix_post(filepath):
    with open(filepath, encoding="utf-8") as fh:
        soup = BeautifulSoup(fh.read(), "html.parser")

    # Skip if FAQ already present
    if soup.find("div", class_="faq-section"):
        return False

    qas = extract_qas(soup)
    if len(qas) < MIN_QA:
        return False

    # Insert FAQ HTML before CTA
    cta = soup.find("div", class_="cta")
    faq_html = build_faq_html(qas)
    faq_div = BeautifulSoup(faq_html, "html.parser")
    if cta:
        cta.insert_before(faq_div)
    else:
        main = soup.find("main")
        if main:
            main.append(faq_div)

    # Add FAQ CSS
    style = soup.find("style")
    if style and "faq-section" not in style.string:
        style.string = style.string + "\n" + FAQ_CSS

    # Add FAQPage JSON-LD
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": qa["q"] + "?", "acceptedAnswer": {"@type": "Answer", "text": qa["a"]}}
            for qa in qas
        ],
    }
    head = soup.find("head")
    faq_script = soup.new_tag("script", type="application/ld+json")
    faq_script.string = json.dumps(faq_schema, ensure_ascii=False)
    ld_scripts = head.find_all("script", type="application/ld+json")
    if ld_scripts:
        ld_scripts[-1].insert_after(faq_script)
    else:
        head.append(faq_script)

    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(str(soup))
    return True


def main():
    fixed = 0
    skipped = 0
    for filepath in sorted(glob.glob("blog/post-*.html")):
        if fix_post(filepath):
            fixed += 1
        else:
            skipped += 1
    print(f"FAQ added: {fixed} | skipped (too few sections): {skipped}")


if __name__ == "__main__":
    main()
