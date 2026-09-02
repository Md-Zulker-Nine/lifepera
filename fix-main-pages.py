replacements = {
    'â€"': '—',
    'â€œ': '"',
    'â€': '"',
    'â€˜': "'",
    'â€™': "'",
    'Â': '',
    'â€¢': '•',
    'â€¦': '…',
    'â€°': '°',
    'â€š': '›',
    'â€¡': '¡',
    'â‚¬': '€',
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