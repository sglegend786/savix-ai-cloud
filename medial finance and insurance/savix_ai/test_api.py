import requests

url = "http://127.0.0.1:5001/api/insurance/recommend"
payload = {
  "age": 28,
  "familyMembers": 3,
  "coverageRequired": 1000000,
  "budget": 20000,
  "requirements": ["family", "cashless"]
}
try:
    res = requests.post(url, json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Top Recommendations:", [r['scheme']['name'] for r in data.get('recommendations', [])])
    print("Ineligible:", len(data.get('ineligible', [])))
except Exception as e:
    print("Error:", e)
