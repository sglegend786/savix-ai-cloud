import os
import re

replacements = {
    r'https://savix-scheme-ui.vercel.app': 'https://savix-scheme-ui.vercel.app',
    r'https://savix-scheme-ui.vercel.app': 'https://savix-scheme-ui.vercel.app'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for pattern, replacement in replacements.items():
            new_content = re.sub(pattern, replacement, new_content)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or 'venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.html', '.py', '.txt', '.md', '.env', '.json', '.mjs')):
            replace_in_file(os.path.join(root, file))

print("Done replacing Scheme UI URLs.")
