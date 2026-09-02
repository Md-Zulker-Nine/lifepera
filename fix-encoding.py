import os
import glob

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

files = []
for pattern in ['blog/*.html', '*.html', 'tool-*.html']:
    files.extend(glob.glob(pattern))

exclude = {'404.html', 'tools.html', 'blog.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', 'index.html'}
count = 0

for filepath in files:
    filename = os.path.basename(filepath)
    if filename in exclude:
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if any(bad in content for bad in replacements.keys()):
        fixed = content
        for bad, good in replacements.items():
            fixed = fixed.replace(bad, good)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        count += 1
        print(f"Fixed: {filename}")

print(f"Total fixed: {count}")