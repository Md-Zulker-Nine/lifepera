#!/usr/bin/env python3
"""
Fix all schema markup for AdSense compliance.
- Tool pages: SoftwareApplication with all required fields
- Blog posts: Article with complete publisher/author
- All pages: Consistent Organization schema
- Uses only GitHub for author links (no Twitter)
"""
import json
import glob
import os
from bs4 import BeautifulSoup

ORG_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LifePera",
    "url": "https://lifepera.com",
    "logo": "https://lifepera.com/og-image.svg",
    "sameAs": [
        "https://github.com/Md-Zulker-Nine/lifepera"
    ],
    "founder": {
        "@type": "Person",
        "name": "Zulker Nine",
        "url": "https://lifepera.com/about.html"
    },
    "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "contact@lifepera.com",
        "availableLanguage": "English"
    }
}

AUTHOR_SCHEMA = {
    "@type": "Person",
    "name": "Zulker Nine",
    "url": "https://lifepera.com/about.html",
    "sameAs": [
        "https://github.com/Md-Zulker-Nine"
    ],
    "description": "Founder of LifePera. Builds free, privacy-first decision tools for career, finance, travel, relationships, psychology, and culture."
}

PUBLISHER_SCHEMA = {
    "@type": "Organization",
    "name": "LifePera",
    "url": "https://lifepera.com",
    "logo": {
        "@type": "ImageObject",
        "url": "https://lifepera.com/og-image.svg",
        "width": 512,
        "height": 512
    }
}

def get_category_from_path(filepath):
    """Determine page type from filepath"""
    filename = os.path.basename(filepath)
    if filename.startswith("tool-"):
        return "tool"
    elif filename.startswith("post-"):
        return "blog"
    elif filename in ["index.html", "about.html", "contact.html", "privacy.html", "terms.html", "tools.html", "blog.html", "404.html"]:
        return "static"
    return "unknown"

def get_tool_category(tool_id):
    """Map tool ID to category"""
    tool_categories = {
        "tool-how-rich": "finance",
        "tool-underpaid": "finance",
        "tool-freelance": "career",
        "tool-quit-job": "career",
        "tool-visa": "travel",
        "tool-travel-budget": "travel",
        "tool-solo-safety": "travel",
        "tool-tap-water": "travel",
        "tool-best-visit": "travel",
        "tool-language-kit": "travel",
        "tool-country-match": "travel",
        "tool-attachment": "relationships",
        "tool-toxic-relationship": "relationships",
        "tool-breakup": "relationships",
        "tool-breadcrumbing": "relationships",
        "tool-friendship": "relationships",
        "tool-comm-clash": "relationships",
        "tool-cognitive-bias": "psychology",
        "tool-eq": "psychology",
        "tool-introvert": "psychology",
        "tool-core-values": "psychology",
        "tool-zodiac": "psychology",
        "tool-texting": "psychology",
        "tool-detox": "psychology",
        "tool-cultural": "culture",
        "tool-culture-map": "culture",
        "tool-age-cultures": "culture",
        "tool-name-meaning": "culture",
        "tool-lucky": "culture",
        "tool-generation": "culture",
        "tool-era-born": "culture",
        "tool-rare-birthday": "culture",
        "tool-name-peak": "culture",
        "tool-google-data": "psychology",
        "tool-email-tone": "career",
        "tool-toxic-workplace": "career",
    }
    return tool_categories.get(tool_id, "general")

def build_tool_schema(filepath, soup):
    """Build SoftwareApplication schema for tool pages"""
    tool_id = os.path.basename(filepath).replace(".html", "")
    title_tag = soup.find("title")
    title = title_tag.get_text().replace("— LifePera", "").replace("– LifePera", "").strip() if title_tag else tool_id
    
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag.get("content", "") if desc_tag else ""
    
    category = get_tool_category(tool_id)
    app_category_map = {
        "finance": "FinanceApplication",
        "career": "BusinessApplication",
        "travel": "TravelApplication",
        "relationships": "LifestyleApplication",
        "psychology": "MedicalApplication",
        "culture": "EducationalApplication",
        "general": "UtilityApplication"
    }
    
    schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": title,
        "applicationCategory": app_category_map.get(category, "UtilityApplication"),
        "operatingSystem": "Any browser",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        "description": description[:500],
        "author": AUTHOR_SCHEMA,
        "publisher": PUBLISHER_SCHEMA,
        "featureList": [
            "Free forever - no signup required",
            "Privacy-first - all calculations run in your browser",
            "Data-backed - sourced from authoritative sources",
            "Globally inclusive - works for users worldwide"
        ],
        "operatingSystem": "Web Browser",
        "permissions": "No personal data collected",
        "disclaimer": "Educational and informational purposes only. Does not constitute professional financial, legal, medical, or career advice. Consult qualified professionals for important decisions."
    }
    return schema

def build_blog_schema(filepath, soup):
    """Build Article schema for blog posts"""
    title_tag = soup.find("title")
    title = title_tag.get_text().replace("— LifePera", "").replace("– LifePera", "").strip() if title_tag else ""
    
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag.get("content", "") if desc_tag else ""
    
    # Extract date from filename
    filename = os.path.basename(filepath)
    date_part = filename.replace("post-", "").replace(".html", "")
    date_str = date_part[:10]  # YYYY-MM-DD
    
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description[:500],
        "author": AUTHOR_SCHEMA,
        "publisher": PUBLISHER_SCHEMA,
        "datePublished": date_str,
        "dateModified": date_str,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": f"https://lifepera.com/{filepath.replace(os.sep, '/')}"
        },
        "articleSection": "Life Decisions",
        "keywords": "free tools, life decisions, career, finance, travel, relationships, psychology, culture"
    }
    return schema

def build_static_schema(filepath, soup):
    """Build WebPage schema for static pages"""
    title_tag = soup.find("title")
    title = title_tag.get_text().replace("— LifePera", "").replace("– LifePera", "").strip() if title_tag else ""
    
    desc_tag = soup.find("meta", attrs={"name": "description"})
    description = desc_tag.get("content", "") if desc_tag else ""
    
    schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": title,
        "description": description[:500],
        "publisher": PUBLISHER_SCHEMA,
        "author": AUTHOR_SCHEMA,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": f"https://lifepera.com/{filepath}"
        }
    }
    return schema

def fix_file(filepath):
    """Fix schema in a single HTML file"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    soup = BeautifulSoup(content, "html.parser")
    
    # Remove existing ld+json scripts
    for script in soup.find_all("script", type="application/ld+json"):
        script.decompose()
    
    # Determine page type and build schema
    page_type = get_category_from_path(filepath)
    
    if page_type == "tool":
        schema = build_tool_schema(filepath, soup)
    elif page_type == "blog":
        schema = build_blog_schema(filepath, soup)
    else:
        schema = build_static_schema(filepath, soup)
    
    # Add organization schema to every page
    org_script = soup.new_tag("script", type="application/ld+json")
    org_script.string = json.dumps(ORG_SCHEMA, ensure_ascii=False)
    
    # Add page-specific schema
    page_script = soup.new_tag("script", type="application/ld+json")
    page_script.string = json.dumps(schema, ensure_ascii=False)
    
    # Insert both in head
    head = soup.find("head")
    if head:
        head.append(org_script)
        head.append(page_script)
    
    # Write back
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(str(soup))
    
    return page_type

def main():
    files = []
    for pattern in ["*.html", "blog/*.html", "tool-*.html"]:
        files.extend(glob.glob(pattern))
    
    # Remove duplicates
    files = list(set(files))
    
    counts = {"tool": 0, "blog": 0, "static": 0, "error": 0}
    
    for filepath in files:
        try:
            page_type = fix_file(filepath)
            counts[page_type] = counts.get(page_type, 0) + 1
            print(f"[OK] {filepath} -> {page_type}")
        except Exception as e:
            counts["error"] += 1
            print(f"[ERROR] {filepath}: {e}")
    
    print(f"\nSummary: {counts}")

if __name__ == "__main__":
    main()