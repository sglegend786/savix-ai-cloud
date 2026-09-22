import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Title
content = re.sub(r'<title>.*?</title>', '<title>SAVIX_AI | AI-Powered Personalized Health Management</title>', content)

# Update Hero
content = re.sub(r'<h1 class="hero-title">Introducing Healthcare <br><span class="futureFramework__text-gradient">3\\.0</span></h1>', 
                 '<h1 class="hero-title">Connect Your Entire <br><span class="futureFramework__text-gradient">Healthcare Journey</span></h1>', content)

content = re.sub(r'<p class="hero-desc">.*?</p>', 
                 '<p class="hero-desc">SAVIX_AI doesn\'t just monitor your health—it continuously connects wearable health data, doctors, medical reports, prescriptions, pharmacies, and emergency services to provide proactive, personalized healthcare.</p>', content, flags=re.DOTALL)

# Update Statement
content = re.sub(r'<h2 class="statement-text futureFramework__text-gradient">.*?</h2>',
                 '<h2 class="statement-text futureFramework__text-gradient">A single centralized AI assistant connecting your entire healthcare ecosystem.</h2>', content)

# Bento 1
content = re.sub(r'<span class="bento-tag">EXPERT DOCTORS &amp; TELEHEALTH</span>', '<span class="bento-tag">HOSPITAL &amp; DOCTOR MANAGEMENT</span>', content)
content = re.sub(r'<h3 class="bento-title futureFramework__text-gradient">Doctor<br>consultation</h3>', '<h3 class="bento-title futureFramework__text-gradient">Personalized<br>Healthcare</h3>', content)
content = re.sub(r'<p class="bento-desc">Get clinical insights from qualified physicians who understand your continuous wearable vitals, medical history, and treatment goals.</p>', '<p class="bento-desc">Search hospitals, book online appointments, have video consultations, and maintain a complete consultation history on a single platform.</p>', content)

# Bento 2
content = re.sub(r'<h3 class="bento-title futureFramework__text-gradient">Generic Price<br>Comparison</h3>', '<h3 class="bento-title futureFramework__text-gradient">Medicine Price<br>Comparison</h3>', content)
content = re.sub(r'<p class="bento-desc">Compare nearest Jan Aushadhi and retail pharmacies to discover identical generic formulations with up to 70% savings.</p>', '<p class="bento-desc">Compare participating pharmacies by availability, price, and location. Prioritize lower-cost options while keeping the final choice yours.</p>', content)

# Bento 3
content = re.sub(r'<span class="bento-tag">DIAGNOSTIC TEST &amp; LAB OCR</span>', '<span class="bento-tag">AI REPORT ANALYSIS</span>', content)
content = re.sub(r'<h3 class="bento-title futureFramework__text-gradient">Diagnostic<br>Labs</h3>', '<h3 class="bento-title futureFramework__text-gradient">Medical Tests &amp;<br>AI Reports</h3>', content)
content = re.sub(r'<p class="bento-desc">Know your body from within - uncover what\'s hidden with precise blood biomarkers and instant AI report breakdown.</p>', '<p class="bento-desc">Upload reports and let SAVIX_AI analyze and explain them in simple language, highlighting parameters outside reference ranges for doctor discussion.</p>', content)
content = re.sub(r'<span>Book a Lab Test</span>', '<span>Analyze Reports</span>', content)

# Bento 4
content = re.sub(r'<h3 class="bento-title futureFramework__text-gradient">SAVIX Sense Scale</h3>', '<h3 class="bento-title futureFramework__text-gradient">Continuous Monitoring</h3>', content)
content = re.sub(r'<p class="bento-desc">Tracks 50\\+ body metrics - from visceral fat and muscle mass to metabolic age and injury risks.</p>', '<p class="bento-desc">Bridge real-world data with the digital platform. Periodic measurements are visualized as trends, analyzed by AI, and reviewed by doctors.</p>', content)

# Bento 5
content = re.sub(r'<span class="bento-tag">SMART RING &amp; SOS</span>', '<span class="bento-tag">ADVANCED EMERGENCY SOS</span>', content)
content = re.sub(r'<h3 class="bento-title futureFramework__text-gradient">SAVIX Smart Ring</h3>', '<h3 class="bento-title futureFramework__text-gradient">Location-Aware SOS</h3>', content)
content = re.sub(r'<p class="bento-desc">Monitor your body 24x7 - sleep stages, HRV, stress index, recovery, temperature, plus 1-tap rapid SOS dispatch.</p>', '<p class="bento-desc">Activate via button, shake, or voice to share live location and medical details with ambulance, police, and registered emergency contacts.</p>', content)
content = re.sub(r'<span>Discover Hardware</span>', '<span>Explore SOS System</span>', content)

# Step 01
content = re.sub(r'<span class="step-num">01</span>\s*<h3 class="step-title">Baseline Evaluation</h3>', '<span class="step-num">01</span>\n              <h3 class="step-title">Continuous Health Monitoring</h3>', content)
content = re.sub(r'<p class="step-desc">Establish your current metabolic.*?</p>', '<p class="step-desc">Periodic wearable measurements are stored, visualized as trends, and analyzed by AI to move from static records to continuous management.</p>', content, flags=re.DOTALL)

# Step 02
content = re.sub(r'<span class="step-num">02</span>\s*<h3 class="step-title">Evidence-based Protocol</h3>', '<span class="step-num">02</span>\n              <h3 class="step-title">Digital Prescription &amp; History</h3>', content)
content = re.sub(r'<p class="step-desc">Receive a personalized, scientifically backed.*?</p>', '<p class="step-desc">Doctors provide digital prescriptions including medicine, dosage, frequency, and timing, creating a structured digital health history.</p>', content, flags=re.DOTALL)

# Step 03
content = re.sub(r'<span class="step-num">03</span>\s*<h3 class="step-title">Continuous Feedback Loop</h3>', '<span class="step-num">03</span>\n              <h3 class="step-title">Daily Health Tasks &amp; Savings</h3>', content)
content = re.sub(r'<p class="step-desc">Your protocol adapts dynamically.*?</p>', '<p class="step-desc">Manage medicine schedules, water intake, sleep, and exercise. Track healthcare expenses and set monthly savings targets to build financial buffers.</p>', content, flags=re.DOTALL)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
