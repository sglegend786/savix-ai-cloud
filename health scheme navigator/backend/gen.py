import re, json

with open('raw_schemes.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if line.strip()]

schemes = []
i = 0
while i < len(lines):
    if re.match(r'^\d+$', lines[i]):
        i += 1
        continue
    
    name = lines[i]
    i += 1
    link_line = lines[i] if i < len(lines) else ""
    
    link = ""
    source = "Official Government Portal"
    
    match = re.search(r'\[(.*?)\]\((.*?)\)', link_line)
    if match:
        source = match.group(1)
        link = match.group(2)
        i += 1
    else:
        source = link_line
        link = "https://mohfw.gov.in/"
        i += 1
        
    category = "General Health"
    if any(x in name for x in ["Matritva", "Janani", "Vandana", "Mother", "LaQshya", "SUMAN"]):
        category = "Women & Maternity"
    elif any(x in name for x in ["Bal", "Kishor", "Child", "School", "Adolescent"]):
        category = "Children & Youth"
    elif any(x in name for x in ["Mental", "MANAS"]):
        category = "Mental Health"
    elif any(x in name for x in ["Elderly", "Senior", "70+"]):
        category = "Senior Citizens"
    elif any(x in name for x in ["Digital", "eSanjeevani", "eHospital", "CoWIN", "ABHA"]):
        category = "Digital Health"
    
    schemes.append({
        "name": name,
        "description": f"Official government scheme: {name}. Provides healthcare benefits and support to eligible citizens.",
        "about": f"The {name} is a comprehensive initiative to improve health outcomes, ensure accessible care, and provide specialized services.",
        "category": category,
        "tags": ["healthcare", "government", "welfare", category.lower().replace(' & ', '-').replace(' ', '-')],
        "department": "Ministry of Health and Family Welfare (MoHFW) / NHM",
        "benefits": [
            "Provides targeted health coverage and support.",
            "Ensures accessible and quality healthcare services.",
            "Reduces out-of-pocket expenditure for beneficiaries."
        ],
        "eligibility": [
            "Must be an Indian citizen.",
            "Must meet specific criteria outlined in the scheme guidelines.",
            "Additional eligibility conditions may apply based on health or socio-economic status."
        ],
        "documents": [
            "Aadhaar Card",
            "Proof of Identity & Address",
            "Relevant medical/income certificates as required"
        ],
        "howToApply": [
            "Visit the official portal linked below or nearest government health facility.",
            "Submit the required documentation.",
            "Complete the registration and verification process."
        ],
        "link": link,
        "source": source
    })

js_content = "const schemes = " + json.dumps(schemes, indent=2) + ";\n\nexport default schemes;\n"

with open('seed/schemes.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated {len(schemes)} schemes.")
