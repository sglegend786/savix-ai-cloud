import re

with open('ecosystem.html', 'r', encoding='utf-8') as f:
    content = f.read()

fourteen_steps = '''
      <!-- End-to-End Care Workflow -->
      <div style="margin-top:80px">
        <div class="eyebrow-fittr">CARE PIPELINE</div>
        <h2 class="futureFramework__text-gradient" style="font-size:36px;font-weight:700;margin-bottom:12px">The 14-Step Healthcare Journey</h2>
        <p style="font-size:16px;color:rgba(255,255,255,0.6);max-width:600px">Connecting your entire healthcare journey from continuous monitoring to emergency response.</p>

        <div class="flow-grid-fittr" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
          <div class="flow-box-fittr"><div class="flow-num">01</div><h4 style="font-size:16px;margin-bottom:6px">Patient</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">The center of the ecosystem.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">02</div><h4 style="font-size:16px;margin-bottom:6px">Wearable + Data</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Continuous vitals monitoring.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">03</div><h4 style="font-size:16px;margin-bottom:6px">Health Profile</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Structured digital health history.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">04</div><h4 style="font-size:16px;margin-bottom:6px">AI Intelligence</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Central intelligence connecting data.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">05</div><h4 style="font-size:16px;margin-bottom:6px">Hospital & Doctor</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Consultations and expert care.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">06</div><h4 style="font-size:16px;margin-bottom:6px">Prescription & History</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Digital and structured records.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">07</div><h4 style="font-size:16px;margin-bottom:6px">Tests & AI Reports</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Upload and simplify diagnostic lab results.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">08</div><h4 style="font-size:16px;margin-bottom:6px">Pharmacy & Compare</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Find affordable medicine options.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">09</div><h4 style="font-size:16px;margin-bottom:6px">Government Schemes</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Identify applicable health subsidies.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">10</div><h4 style="font-size:16px;margin-bottom:6px">Financial Management</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Track medical expenses and savings.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">11</div><h4 style="font-size:16px;margin-bottom:6px">Daily Health Tasks</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Schedules for meds, water, and sleep.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">12</div><h4 style="font-size:16px;margin-bottom:6px">Multilingual Assistant</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Translate medical reports to local languages.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">13</div><h4 style="font-size:16px;margin-bottom:6px">Emergency SOS</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Location-aware rapid dispatch.</p></div>
          <div class="flow-box-fittr"><div class="flow-num">14</div><h4 style="font-size:16px;margin-bottom:6px">Personalized Action</h4><p style="font-size:13px;color:var(--text-ash-2);margin:0">Actionable, proactive health steps.</p></div>
        </div>
      </div>
'''

content = re.sub(r'<!-- End-to-End Care Workflow -->.*?</section>', fourteen_steps + '\n\n    </div>\n  </section>', content, flags=re.DOTALL)

with open('ecosystem.html', 'w', encoding='utf-8') as f:
    f.write(content)
