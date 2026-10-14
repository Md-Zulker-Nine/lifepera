#!/usr/bin/env python3
"""Update stale footer tool names across all pages to match current page titles."""
import glob

REPLACEMENTS = {
    "Global Wealth Calculator": "Global Income Band Estimator",
    "Visa-Free Travel Checker": "Passport Mobility Snapshot",
    '"How Rich Am I?" Comparator': "Global Income Band Estimator",
}

files = glob.glob("blog/post-*.html") + glob.glob("*.html")
fixed = 0
for filepath in files:
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()
    original = content
    for old, new in REPLACEMENTS.items():
        content = content.replace(old, new)
    if content != original:
        with open(filepath, "w", encoding="utf-8") as fh:
            fh.write(content)
        fixed += 1

print("Files updated:", fixed)
