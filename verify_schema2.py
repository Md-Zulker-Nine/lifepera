import json
from bs4 import BeautifulSoup

# Check a blog page
with open('blog/post-2026-08-28-workplace-weaponized-incompetence-why-coworkers-play-dumb-to.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
scripts = soup.find_all('script', type='application/ld+json')
for i, s in enumerate(scripts):
    data = json.loads(s.string)
    print('Script {}: @type = {}'.format(i+1, data.get('@type', 'N/A')))
    if data.get('@type') == 'Article':
        print('  headline: {}'.format(data.get('headline', '')[:60]))
        print('  author: {}'.format(data.get('author', {}).get('name')))
        print('  author url: {}'.format(data.get('author', {}).get('url')))
        print('  publisher: {}'.format(data.get('publisher', {}).get('name')))
        print('  datePublished: {}'.format(data.get('datePublished')))
        print('  mainEntityOfPage: {}'.format(data.get('mainEntityOfPage')))

print('---')
# Check index.html
with open('index.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
scripts = soup.find_all('script', type='application/ld+json')
for i, s in enumerate(scripts):
    data = json.loads(s.string)
    print('Script {}: @type = {}'.format(i+1, data.get('@type', 'N/A')))