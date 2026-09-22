"""
Recommendation engine: hospital scoring, doctor ranking, and a simple
rule-based symptom -> department classifier.

All of this is DEMO / ACADEMIC logic. It is intentionally simple and
transparent (no black-box ML) so it is easy to explain in a project report.
"""

from config import Config

# ---------------------------------------------------------------------------
# Symptom -> Department rule based classifier
# ---------------------------------------------------------------------------
# Each department has a list of keywords. We score by keyword overlap.
SYMPTOM_KEYWORDS = {
    "Bone & Orthopedics": [
        "knee", "bone", "joint", "fracture", "back pain", "spine", "shoulder",
        "hip", "arthritis", "sprain", "muscle pain", "leg pain", "elbow",
        "ankle", "swelling in joint", "walking", "climbing stairs",
    ],
    "Cardiology": [
        "chest pain", "heart", "palpitation", "breathless", "high blood pressure",
        "bp", "cholesterol", "chest tightness", "irregular heartbeat", "sweating",
        "left arm pain",
    ],
    "Liver / Gastroenterology": [
        "liver", "stomach", "abdominal pain", "vomiting", "jaundice", "nausea",
        "acidity", "indigestion", "diarrhea", "constipation", "gastric",
        "loss of appetite",
    ],
    "Neurology": [
        "headache", "migraine", "dizziness", "seizure", "numbness", "memory loss",
        "tremor", "vision problem", "balance", "fainting", "weakness in limb",
    ],
    "Pulmonology": [
        "breathing", "cough", "asthma", "lungs", "wheeze", "shortness of breath",
        "chest congestion", "cold", "flu", "pneumonia",
    ],
}

DEFAULT_DEPARTMENT = "General Medicine"


def analyze_symptom(text):
    """Very simple keyword based rule classifier.
    Returns (department, matched_keywords, confidence_label)
    """
    text_lower = (text or "").lower()
    scores = {}
    matches = {}
    for dept, keywords in SYMPTOM_KEYWORDS.items():
        found = [kw for kw in keywords if kw in text_lower]
        if found:
            scores[dept] = len(found)
            matches[dept] = found

    if not scores:
        return DEFAULT_DEPARTMENT, [], "low"

    best_dept = max(scores, key=scores.get)
    confidence = "high" if scores[best_dept] >= 2 else "medium"
    return best_dept, matches[best_dept], confidence


# ---------------------------------------------------------------------------
# Hospital scoring ("Best Hospital")
# ---------------------------------------------------------------------------

def _normalize(value, min_v, max_v, invert=False):
    """Normalize a value into 0-1 range. If invert=True, lower is better."""
    if max_v == min_v:
        return 1.0
    norm = (value - min_v) / (max_v - min_v)
    if invert:
        norm = 1 - norm
    return max(0.0, min(1.0, norm))


def score_hospitals(hospitals):
    """Given a list of hospital dicts, compute a weighted score for each and
    return the list sorted best-first, with a `score` (0-100) and
    `score_breakdown` field attached to each hospital dict.
    """
    if not hospitals:
        return []

    weights = Config.HOSPITAL_SCORE_WEIGHTS

    ratings = [h.get("rating", 0) for h in hospitals]
    doctor_counts = [h.get("doctor_count", 0) for h in hospitals]
    costs = [h.get("avg_cost", 0) for h in hospitals]
    distances = [h.get("distance_km", 0) for h in hospitals]

    min_rating, max_rating = min(ratings), max(ratings)
    min_doc, max_doc = min(doctor_counts), max(doctor_counts)
    min_cost, max_cost = min(costs), max(costs)
    min_dist, max_dist = min(distances), max(distances)

    for h in hospitals:
        rating_n = _normalize(h.get("rating", 0), min_rating, max_rating)
        doctor_n = _normalize(h.get("doctor_count", 0), min_doc, max_doc)
        cost_n = _normalize(h.get("avg_cost", 0), min_cost, max_cost, invert=True)
        distance_n = _normalize(h.get("distance_km", 0), min_dist, max_dist, invert=True)
        emergency_n = 1.0 if (h.get("emergency", False) and h.get("available_247", False)) else (
            0.5 if (h.get("emergency", False) or h.get("available_247", False)) else 0.0
        )

        breakdown = {
            "rating": round(rating_n * weights["rating"] * 100, 1),
            "doctor_availability": round(doctor_n * weights["doctor_availability"] * 100, 1),
            "cost": round(cost_n * weights["cost"] * 100, 1),
            "distance": round(distance_n * weights["distance"] * 100, 1),
            "emergency_247": round(emergency_n * weights["emergency_247"] * 100, 1),
        }
        total = round(sum(breakdown.values()), 1)
        h["score"] = total
        h["score_breakdown"] = breakdown

    return sorted(hospitals, key=lambda h: h["score"], reverse=True)


# ---------------------------------------------------------------------------
# Doctor ranking
# ---------------------------------------------------------------------------

def rank_doctors(doctors, department=None):
    """Rank doctors by rating, experience, availability and cost.
    Optionally filter by department first.
    """
    pool = doctors
    if department:
        pool = [d for d in doctors if d.get("department") == department]

    def doctor_score(d):
        rating = d.get("rating", 0) * 20          # 0-100 scale (rating out of 5)
        experience = min(d.get("experience_years", 0), 25) * 2  # cap contribution
        availability = 15 if d.get("available_today") else 0
        cost = d.get("consultation_fee", 500)
        cost_score = max(0, 30 - (cost / 50))      # cheaper => higher score
        return rating * 0.4 + experience * 0.25 + availability * 0.2 + cost_score * 0.15

    ranked = sorted(pool, key=doctor_score, reverse=True)
    for i, d in enumerate(ranked):
        d["rank"] = i + 1
    return ranked


def best_hospital_for_department(hospitals, doctors, department):
    """Find hospital that best serves a given department (has doctors there and
    scores well overall)."""
    hospital_ids_with_dept = {
        d["hospital_id"] for d in doctors if d.get("department") == department
    }
    candidates = [h for h in hospitals if str(h.get("_id")) in hospital_ids_with_dept]
    if not candidates:
        candidates = hospitals
    scored = score_hospitals(candidates)
    return scored[0] if scored else None
