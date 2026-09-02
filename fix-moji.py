import glob

files = []
for pattern in ['blog/*.html', '*.html', 'tool-*.html']:
    files.extend(glob.glob(pattern))

# The mojibake for → (RIGHTWARDS ARROW, U+2192) when UTF-8 read as Windows-1252 and re-encoded
# Original: E2 86 92
# Misread as: â (E2) † (86) ' (92) -> C3 A2 E2 80 A0 27 in UTF-8
# So we need to replace the 3-char sequence: â†' (U+00E2 U+2020 U+0027)
mojibake_fixes = {
    'â\u2020\'': '->',      # â†' -> ->
    'â\u201e\'': '->',      # â„\' -> ->
    '\u2192': '->',         # → -> ->
    '\u201d': '"',          # " -> "
    '\u201c': '"',          # " -> "
    '\u2019': "'",          # ' -> '
    '\u2018': "'",          # ' -> '
    '\u2014': '—',          # — -> —
    '\u00c2': '',           # Â -> (empty)
    'â€™': "'",             # â€™ -> '
    'â€˜': "'",             # â€˜ -> '
    'â€œ': '"',             # â€œ -> "
    'â€': '"',              # â€ -> "
    'â€"': '—',             # â€" -> —
    'Â': '',                # Â -> empty
    'â€¢': '•',             # â€¢ -> •
    'â€¦': '…',             # â€¦ -> …
    'â€š': '›',             # â€š -> ›
    'â€¡': '¡',             # â€¡ -> ¡
    'â‚¬': '€',             # â‚¬ -> €
}

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    fixed = content
    
    # Apply mojibake fixes
    for bad, good in mojibake_fixes.items():
        fixed = fixed.replace(bad, good)
    
    # Fix duplicate author-bio sections
    marker = 'class="author-bio"'
    if fixed.count(marker) > 1:
        first = fixed.find(marker)
        second = fixed.find(marker, first + 1)
        if second > 0:
            div_depth = 0
            end_pos = second
            for i in range(second, len(fixed)):
                if fixed[i:i+5] == '<div ' or fixed[i:i+4] == '<div>':
                    div_depth += 1
                elif fixed[i:i+6] == '</div>':
                    if div_depth == 0:
                        end_pos = i + 6
                        break
                    div_depth -= 1
            fixed = fixed[:second] + fixed[end_pos:]
    
    if fixed != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(fixed)
        count += 1
        print('Fixed: ' + f)
print('Total: ' + str(count))