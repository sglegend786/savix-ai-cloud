import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Hero Section fix
content = re.sub(r'<h3 class="hero-subheading">Introducing</h3>\s*<h1 class="hero-headline futureFramework__text-gradient">Healthcare 3\.0</h1>',
                 '<h3 class="hero-subheading">Connect Your Entire</h3>\n      <h1 class="hero-headline futureFramework__text-gradient">Healthcare Journey</h1>', content)

content = re.sub(r'<p class="hero-description">.*?</p>',
                 '<p class="hero-description">SAVIX_AI doesn\'t just monitor your health—it continuously connects wearable health data, doctors, medical reports, prescriptions, pharmacies, and emergency services to provide proactive, personalized healthcare.</p>', content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
