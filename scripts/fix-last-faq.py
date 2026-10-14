#!/usr/bin/env python3
"""Add FAQ to the one remaining post (crowdsourced-living)."""
import json
from bs4 import BeautifulSoup

filepath = "blog/post-2026-09-03-crowdsourced-living-why-you-cant-make-big-decisions-without-.html"
with open(filepath, encoding="utf-8") as fh:
    soup = BeautifulSoup(fh.read(), "html.parser")

body = soup.find("div", class_="body")
qas = []
for h2 in body.find_all("h2"):
    q = h2.get_text(strip=True).rstrip("?")
    ans = ""
    for sib in h2.find_next_siblings():
        if sib.name == "h2":
            break
        if sib.name in ("p", "ul", "ol"):
            ans = sib.get_text(strip=True)
            break
    if q and ans and len(ans) > 40:
        qas.append((q, ans))

parts = []
for q, a in qas:
    parts.append(
        '<div class="faq-item"><h3 class="faq-q">' + q + '?</h3><p class="faq-a">' + a + "</p></div>"
    )
faq_html = '<h2>Frequently Asked Questions</h2><div class="faq-section">' + "".join(parts) + "</div>"
cta = soup.find("div", class_="cta")
faq_div = BeautifulSoup(faq_html, "html.parser")
cta.insert_before(faq_div)

style = soup.find("style")
if "faq-section" not in style.string:
    style.string += (
        ".faq-section{margin:1.5rem 0}.faq-item{margin-bottom:1.2rem}"
        ".faq-q{font-size:1.05rem;font-weight:700;margin:0 0 .4rem;color:var(--text)}"
        ".faq-a{font-size:.95rem;color:var(--muted);margin:0;line-height:1.7}"
    )

faq_schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {"@type": "Question", "name": q + "?", "acceptedAnswer": {"@type": "Answer", "text": a}}
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
print("Fixed:", filepath, "| Q&A count:", len(qas))
