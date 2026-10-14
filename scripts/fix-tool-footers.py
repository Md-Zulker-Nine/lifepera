#!/usr/bin/env python3
"""Fix tool page footers: unique entries, names matching page titles."""
import glob
from bs4 import BeautifulSoup

NEW_FOOTER_TOOLS = (
    '<div class="f-col"><h4>Popular Tools</h4><ul>'
    '<li><a href="/tool-how-rich">Global Income Band Estimator</a></li>'
    '<li><a href="/tool-visa">Passport Mobility Snapshot</a></li>'
    '<li><a href="/tool-quit-job">Should I Quit My Job?</a></li>'
    '<li><a href="/tool-underpaid">Salary Benchmark Comparison</a></li>'
    '<li><a href="/tool-attachment">Attachment Style Quiz</a></li>'
    '</ul></div>'
)

fixed = 0
for filepath in glob.glob("tool-*.html"):
    with open(filepath, encoding="utf-8") as fh:
        soup = BeautifulSoup(fh.read(), "html.parser")
    footer = soup.find("footer")
    if not footer:
        continue
    cols = footer.find_all("div", class_="f-col")
    if not cols:
        continue
    new_col = BeautifulSoup(NEW_FOOTER_TOOLS, "html.parser").find("div")
    cols[0].replace_with(new_col)
    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(str(soup))
    fixed += 1

print("Fixed tool footers:", fixed)
