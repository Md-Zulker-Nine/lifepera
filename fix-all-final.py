import glob

files = []
for pattern in ['blog/*.html', '*.html', 'tool-*.html']:
    files.extend(glob.glob(pattern))

# Unicode code point replacements (using chr())
replacements = {
    chr(0x2192): '->',      # RIGHTWARDS ARROW
    chr(0x201D): '"',       # RIGHT DOUBLE QUOTATION MARK
    chr(0x201C): '"',       # LEFT DOUBLE QUOTATION MARK
    chr(0x2019): "'",       # RIGHT SINGLE QUOTATION MARK
    chr(0x2018): "'",       # LEFT SINGLE QUOTATION MARK
    chr(0x2014): '—',       # EM DASH
    chr(0x00C2): '',        # LATIN CAPITAL LETTER A WITH CIRCUMFLEX
}

# Mojibake patterns (common UTF-8 misreadings)
mojibake = {
    '\xc3\xa2\xe2\x82\xac\xe2\x80\x9d': '"',  # â€" -> "
    '\xc3\xa2\xe2\x82\xac\xe2\x80\x9c': '"',  # â€œ -> "
    '\xc3\xa2\xe2\x82\xac\xe2\x80\x99': "'",  # â€™ -> '
    '\xc3\xa2\xe2\x82\xac\xe2\x80\x98': "'",  # â€˜ -> '
    '\xc3\xa2\xe2\x82\xac\xe2\x80\x94': '—',  # â€" -> —
    '\xc3\x82': '',  # Â -> (empty)
    '\xc3\xa2\xe2\x82\xac': '',  # â€ partial
    '\xe2\x86\x92': '->',  # â†' -> ->
    '\xc3\xa2\xe2\x80\x9a': '->',  # â€š -> ->
    '\xc3\xa2\xe2\x80\xb0': '',  # â€° -> empty
}

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    fixed = content
    
    # Apply Unicode replacements
    for bad, good in replacements.items():
        fixed = fixed.replace(bad, good)
    
    # Apply mojibake fixes
    for bad, good in mojibake.items():
        fixed = fixed.replace(bad, good)
    
    # Fix duplicate author-bio sections
    marker = 'class="author-bio"'
    if fixed.count(marker) > 1:
        # Find first occurrence
        first = fixed.find(marker)
        second = fixed.find(marker, first + 1)
        if second > 0:
            # Find end of second author-bio (matching </div>)
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
            # Remove the second author-bio section
            fixed = fixed[:second] + fixed[end_pos:]
    
    if fixed != content:
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(fixed)
        count += 1
        print('Fixed: ' + f)
print('Total: ' + str(count))