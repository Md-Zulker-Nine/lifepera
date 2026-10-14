#!/usr/bin/env python3
"""Add AdSense script to <head> of all pages missing it."""
import glob

SCRIPT = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5091974481484084" crossorigin="anonymous"></script>'

files = glob.glob("*.html") + glob.glob("blog/post-*.html") + glob.glob("tool-*.html")
count = 0
for filepath in files:
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()
    if "ca-pub-5091974481484084" in content:
        continue
    if "</head>" not in content:
        continue
    content = content.replace("</head>", SCRIPT + "\n</head>", 1)
    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(content)
    count += 1

print("Pages updated:", count)
