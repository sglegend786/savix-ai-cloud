import os
import re

# Dictionary mapping localhost ports to their new Render URLs
replacements = {
    # APIs
    r'https://savix-auth-2aso.onrender.com': 'https://savix-auth-2aso.onrender.com',
    r'http://127\.0\.0\.1:4000': 'https://savix-auth-2aso.onrender.com',
    
    r'https://savix-pharmacy-api-sy7t.onrender.com': 'https://savix-pharmacy-api-sy7t.onrender.com',
    r'http://127\.0\.0\.1:5003': 'https://savix-pharmacy-api-sy7t.onrender.com',
    
    r'https://savix-scheme-api.onrender.com': 'https://savix-scheme-api.onrender.com',
    r'http://127\.0\.0\.1:5005': 'https://savix-scheme-api.onrender.com',
    
    r'https://savix-tasks-api-9lyi.onrender.com': 'https://savix-tasks-api-9lyi.onrender.com',
    r'http://127\.0\.0\.1:5002': 'https://savix-tasks-api-9lyi.onrender.com',
    
    r'https://savix-finance-api-zqa8.onrender.com': 'https://savix-finance-api-zqa8.onrender.com',
    r'http://127\.0\.0\.1:5001': 'https://savix-finance-api-zqa8.onrender.com',
    
    r'https://savix-hospital-api-7qqi.onrender.com': 'https://savix-hospital-api-7qqi.onrender.com',
    r'http://127\.0\.0\.1:5004': 'https://savix-hospital-api-7qqi.onrender.com',
    
    # 5000 is used by health_app and sometimes hospital_management locally
    # We will just replace it with health_app since we can fix hospital separately if needed
    r'https://savix-health-app-api.onrender.com': 'https://savix-health-app-api.onrender.com',
    r'http://127\.0\.0\.1:5000': 'https://savix-health-app-api.onrender.com'
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
        pass # skip binary files or unreadable files

# Walk through all directories
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or 'venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.html', '.py', '.txt', '.md', '.env', '.json', '.mjs')):
            replace_in_file(os.path.join(root, file))

print("Done replacing API URLs.")
