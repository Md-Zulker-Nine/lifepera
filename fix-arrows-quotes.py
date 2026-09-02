import glob

files = []
for pattern in ['blog/*.html', '*.html', 'tool-*.html']:
    files.extend(glob.glob(pattern))

replacements = {
    '\u2192': '->',
    '\u201d': '"',
    '\u201c': '"',
    '\u2019': "'",
    '\u2018': "'",
    '\u2014': '—',
    '\u00c2': '',
}

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    fixed = content
    for bad, good in replacements.items():
        fixed = fixed.replace(bad, good)
    if fixed != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(fixed)
        count += 1
        print('Fixed: ' + f)
print('Total: ' + str(count))