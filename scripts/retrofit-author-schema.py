#!/usr/bin/env python3
"""
Retrofit all existing blog posts:
1. Fix author schema: Organization -> Person (Zulker Nine) + GitHub sameAs
2. Add Organization JSON-LD block
3. Add author bio section after article
"""
import json
import glob
import os
from bs4 import BeautifulSoup

AUTHOR_PERSON = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Zulker Nine",
    "url": "https://lifepera.com/about.html",
    "sameAs": ["https://github.com/Md-Zulker-Nine"],
}

ORG_BLOCK = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LifePera",
    "url": "https://lifepera.com",
    "logo": "https://lifepera.com/og-image.svg",
    "sameAs": ["https://github.com/Md-Zulker-Nine/lifepera"],
    "founder": {"@type": "Person", "name": "Zulker Nine", "url": "https://lifepera.com/about.html"},
}

AUTHOR_BIO_HTML = """<div class="author-bio">
<img src="/assets/author-zulker-nine.webp" alt="Zulker Nine" class="author-avatar">
<div class="author-info">
<strong>Zulker Nine</strong>
<span class="author-role">Founder &amp; Creator, LifePera</span>
<p>Zulker builds free, privacy-first decision tools for real life. He reviews every tool, article, and data update published on LifePera.</p>
<a href="/about">Read full bio →</a>
</div>
</div>"""

AUTHOR_BIO_CSS = """.author-bio{display:flex;gap:1rem;align-items:flex-start;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1.2rem 1.4rem;margin:2rem 0}
.author-avatar{width:56px;height:56px;border-radius:50%;object-fit:cover;flex-shrink:0}
.author-info strong{font-size:1rem}
.author-role{display:block;font-size:.8rem;color:var(--blue);font-weight:600;margin:.2rem 0 .4rem}
.author-info p{font-size:.88rem;color:var(--muted);margin:0 0 .5rem}
.author-info a{font-size:.85rem;font-weight:600}"""


def fix_blog_post(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    soup = BeautifulSoup(content, "html.parser")
    changed = False

    # 1. Fix author schema in existing Article JSON-LD
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
        except Exception:
            continue
        if data.get("@type") == "Article":
            data["author"] = AUTHOR_PERSON
            if "dateModified" not in data:
                data["dateModified"] = data.get("datePublished", "")
            script.string = json.dumps(data, ensure_ascii=False)
            changed = True

    # 2. Add Organization JSON-LD block if missing
    has_org = False
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            if json.loads(script.string).get("@type") == "Organization":
                has_org = True
                break
        except Exception:
            continue
    if not has_org:
        head = soup.find("head")
        org_script = soup.new_tag("script", type="application/ld+json")
        org_script.string = json.dumps(ORG_BLOCK, ensure_ascii=False)
        # Insert after existing ld+json scripts
        ld_scripts = head.find_all("script", type="application/ld+json")
        if ld_scripts:
            ld_scripts[-1].insert_after(org_script)
        else:
            head.append(org_script)
        changed = True

    # 3. Add author bio CSS if missing
    if "author-bio" not in content:
        style = soup.find("style")
        if style:
            style.string = style.string + "\n" + AUTHOR_BIO_CSS
            changed = True

    # 4. Add author bio HTML after </article> if missing
    if "author-bio" not in content.split("</article>")[1] if "</article>" in content else True:
        article = soup.find("article")
        if article:
            bio_div = BeautifulSoup(AUTHOR_BIO_HTML, "html.parser")
            article.insert_after(bio_div)
            changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(str(soup))
        return True
    return False


def main():
    files = sorted(glob.glob("blog/post-*.html"))
    fixed = 0
    for filepath in files:
        if fix_blog_post(filepath):
            fixed += 1
            print(f"[FIXED] {os.path.basename(filepath)}")
    print(f"\nTotal fixed: {fixed}/{len(files)}")


if __name__ == "__main__":
    main()
