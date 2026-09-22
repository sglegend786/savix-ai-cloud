import re

with open('about.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Mission Hero
new_vision = '''
        <h1 class="futureFramework__text-gradient" style="font-size:clamp(34px,4.5vw,56px);font-weight:700;line-height:1.06;margin-bottom:18px">
          SAVIX_AI doesn't just monitor your health—it connects your entire healthcare journey.
        </h1>
        <p style="font-size:16.5px;color:var(--text-ash-2);line-height:1.65">
          SAVIX_AI is an AI-powered personalized health management ecosystem that continuously connects wearable health data, doctors, hospitals, medical reports, prescriptions, pharmacies, healthcare schemes, healthcare finances, daily health activities, and emergency services to provide proactive, personalized, and connected healthcare.
        </p>
'''

content = re.sub(r'<h1 class="futureFramework__text-gradient"[^>]*>.*?</h1>\s*<p[^>]*>.*?</p>', new_vision.strip(), content, flags=re.DOTALL)

with open('about.html', 'w', encoding='utf-8') as f:
    f.write(content)
