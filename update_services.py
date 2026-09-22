import re

with open('services.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's add Group 5: Healthcare Schemes & Financial Management before the closing </section>
group_5 = '''
      <!-- Group 5: Financials, Schemes & Multilingual -->
      <div class="service-group" id="finance-schemes">
        <div class="service-group-title">05 — Financials, Schemes &amp; Multilingual Support</div>

        <div class="service-accordion-item f-acc-item">
          <button class="service-accordion-trigger f-acc-trigger">
            <span>Healthcare Government Scheme Management</span>
            <span class="acc-icon">+</span>
          </button>
          <div class="service-accordion-panel f-acc-panel">
            <div class="service-accordion-content">
              <p>Identify relevant health-related government schemes based on your eligibility profile to maximize benefits.</p>
              <ul>
                <li>Explain benefits, eligibility, and provide notifications.</li>
                <li>Direct links to official information and application processes.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="service-accordion-item f-acc-item">
          <button class="service-accordion-trigger f-acc-trigger">
            <span>Financial Management &amp; Savings Preparedness</span>
            <span class="acc-icon">+</span>
          </button>
          <div class="service-accordion-panel f-acc-panel">
            <div class="service-accordion-content">
              <p>Track medicine, consultation, hospitalization, and treatment expenses. Set monthly healthcare savings targets to build a financial buffer for medical emergencies.</p>
            </div>
          </div>
        </div>

        <div class="service-accordion-item f-acc-item">
          <button class="service-accordion-trigger f-acc-trigger">
            <span>Multilingual Healthcare Assistant</span>
            <span class="acc-icon">+</span>
          </button>
          <div class="service-accordion-panel f-acc-panel">
            <div class="service-accordion-content">
              <p>Medical reports and terminology are often in English. SAVIX_AI translates and explains healthcare information in supported Indian languages.</p>
              <ul>
                <li>Supports Hindi, Marathi, Gujarati, Bengali, and more.</li>
                <li>Localized app interface to improve accessibility for everyone.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
'''

content = re.sub(r'(\s*)<!-- Closing section in services.html -->(\s*)</section>', r'\1' + group_5.replace('\n', '\\n') + r'\1</section>', content)

# But there is no <!-- Closing section... in services.html, let's just insert it right before </section>
# We need to find the </section> inside the <main> tag.
content = content.replace('      </div>\n\n    </div>\n  </section>', '      </div>\n' + group_5 + '\n    </div>\n  </section>')

with open('services.html', 'w', encoding='utf-8') as f:
    f.write(content)
