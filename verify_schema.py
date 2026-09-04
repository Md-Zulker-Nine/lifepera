import json
from bs4 import BeautifulSoup

# Check a tool page
with open('tool-underpaid.html', 'r', encoding='utf-8') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')
scripts = soup.find_all('script', type='application/ld+json')
for i, s in enumerate(scripts):
    data = json.loads(s.string)
    print('Script {}: @type = {}'.format(i+1, data.get('@type', 'N/A')))
    if data.get('@type') == 'SoftwareApplication':
        print('  name: {}'.format(data.get('name')))
        print('  applicationCategory: {}'.format(data.get('applicationCategory')))
        print('  operatingSystem: {}'.format(data.get('operatingSystem')))
        print('  offers: {}'.format(data.get('offers')))
        print('  author: {}'.format(data.get('author', {}).get('name')))
        print('  publisher: {}'.format(data.get('publisher', {}).get('name')))
        print('  disclaimer present: {}'.format('disclaimer' in data))