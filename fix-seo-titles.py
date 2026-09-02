replacements = {
    # Fix smart quotes in titles - use | separator for SEO
    'About "“ LifePera': 'About | LifePera',
    'Contact "“ LifePera': 'Contact | LifePera',
    'Privacy Policy "“ LifePera': 'Privacy Policy | LifePera',
    'Terms of Service "“ LifePera': 'Terms of Service | LifePera',
    'All 36 Free Tools "“ LifePera': 'All 36 Free Tools | LifePera',
    'LifePera Blog "“ LifePera': 'Blog | LifePera',
    '404 "“ LifePera': '404 | LifePera',
    'LifePera â€“ Tools That Actually Matter': 'LifePera | Tools That Actually Matter',
    'LifePera â€” Tools That Actually Matter': 'LifePera | Tools That Actually Matter',
    
    # Fix meta descriptions
    'About LifePera "“ free premium tools': 'About LifePera | Free premium tools',
    'Contact LifePera "“ get in touch': 'Contact LifePera | Get in touch',
    'LifePera Privacy Policy "“ we don': "LifePera Privacy Policy | We don't",
    'LifePera Terms of Service "” rules for using': 'LifePera Terms of Service | Rules for using',
    'Browse all 36 free premium tools from LifePera': 'Browse all 36 free premium tools from LifePera',
    'LifePera Blog "“ free tools for real life decisions': 'LifePera Blog | Free tools for real life decisions',
    
    # Fix og:titles
    'About "“ LifePera': 'About | LifePera',
    'Contact "“ LifePera': 'Contact | LifePera',
    'Privacy Policy "“ LifePera': 'Privacy Policy | LifePera',
    'Terms of Service "“ LifePera': 'Terms of Service | LifePera',
    'All 36 Free Tools "“ LifePera': 'All 36 Free Tools | LifePera',
    'LifePera Blog "“ LifePera': 'Blog | LifePera',
    '404 "“ LifePera': '404 | LifePera',
}

files = ['about.html', 'contact.html', 'privacy.html', 'terms.html', 'index.html', 'tools.html', 'blog.html', '404.html']

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    fixed = content
    for bad, good in replacements.items():
        fixed = fixed.replace(bad, good)
    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(fixed)
    print(f'Fixed: {f}')