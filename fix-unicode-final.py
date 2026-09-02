import glob

files = []
for p in ['blog/*.html', '*.html', 'tool-*.html']:
    files.extend(glob.glob(p))

replacements = {
    '\u201d': '"',   # RIGHT DOUBLE QUOTATION MARK
    '\u201c': '"',   # LEFT DOUBLE QUOTATION MARK
    '\u2019': "'",   # RIGHT SINGLE QUOTATION MARK
    '\u2018': "'",   # LEFT SINGLE QUOTATION MARK
    '\u2014': '—',   # EM DASH
    '\u2192': '->',  # RIGHTWARDS ARROW
    '\u00c2': '',    # LATIN CAPITAL LETTER A WITH CIRCUMFLEX
}

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    fixed = content
    for bad, good in replacements.items():
        fixed = fixed.replace(bad, good)
    if fixed != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(fixed)
        print('Fixed: ' + f)