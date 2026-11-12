import os
import re

app_dir = r'frontend\src\app'
all_pages = set()
for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f in ['page.tsx', 'page.js']:
            rel = os.path.relpath(root, app_dir).replace('\\', '/')
            if rel == '.':
                all_pages.add('/')
            else:
                all_pages.add('/' + rel)

print(f'Known route pages ({len(all_pages)}):')
for p in sorted(all_pages):
    print(f'  {p}')

href_pattern = re.compile(r'href=[\"\']([^\"\']+)[\"\']')
router_push_pattern = re.compile(r'router\.push\([\"\']([^\"\']+)[\"\']\)')
broken_links = []
scanned_count = 0

for root, dirs, files in os.walk(r'frontend\src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            matches = href_pattern.findall(content) + router_push_pattern.findall(content)
            for match in matches:
                scanned_count += 1
                link = match.split('?')[0].split('#')[0]
                if link.startswith('http') or link.startswith('mailto:') or link.startswith('tel:') or '{' in link or '$' in link or link == '':
                    continue
                if link.endswith('/') and len(link) > 1:
                    link = link[:-1]
                
                matched = False
                if link in all_pages:
                    matched = True
                else:
                    for p in all_pages:
                        if '[' in p:
                            p_regex = '^' + re.sub(r'\[\w+\]', r'[^/]+', p) + '$'
                            if re.match(p_regex, link):
                                matched = True
                                break
                if not matched:
                    broken_links.append((path, match))

print(f'\nTotal navigation links & router pushes scanned: {scanned_count}')
print(f'Broken / unresolved internal routes: {len(broken_links)}')
for src, link in broken_links:
    print(f'   {src} -> {link}')

