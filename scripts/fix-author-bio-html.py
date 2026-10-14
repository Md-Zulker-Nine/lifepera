#!/usr/bin/env python3
"""Insert author-bio HTML between editorial-note/body and CTA on all posts missing it."""
import glob
from bs4 import BeautifulSoup

AUTHOR_BIO_HTML = """<div class="author-bio">
<img src="/assets/author-zulker-nine.webp" alt="Zulker Nine" class="author-avatar">
<div class="author-info">
<strong>Zulker Nine</strong>
<span class="author-role">Founder &amp; Creator, LifePera</span>
<p>Zulker builds free, privacy-first decision tools for real life. He reviews every tool, article, and data update published on LifePera.</p>
<a href="/about">Read full bio →</a>
</div>
</div>"""

fixed = 0
for filepath in sorted(glob.glob("blog/post-*.html")):
    with open(filepath, encoding="utf-8") as fh:
        soup = BeautifulSoup(fh.read(), "html.parser")

    # Skip if bio already present
    if soup.find("div", class_="author-bio"):
        continue

    # Insert after editorial-note if present, otherwise after body div
    anchor = soup.find("div", class_="editorial-note")
    if anchor is None:
        anchor = soup.find("div", class_="body")
    if anchor is None:
        continue

    bio_div = BeautifulSoup(AUTHOR_BIO_HTML, "html.parser").find("div")
    anchor.insert_after(bio_div)

    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(str(soup))
    fixed += 1

print("Inserted author-bio HTML:", fixed)
