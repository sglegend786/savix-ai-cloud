"""
Personal Health Score: explainable, non-diagnostic score built from data
already recorded for a patient (visit vitals stability, follow-up
adherence, appointment/referral adherence, report/trend status).
"""


def compute_health_score(db, patient_id, trend=None):
    visits = list(db.visits.find({"patient_id": patient_id}))
    score = 100
    positives = []
    negatives = []

    if not visits:
        return {"score": None, "positives": [], "negatives": ["No visits recorded yet."]}

    total_followups = sum(1 for v in visits if v.get("follow_up", {}).get("date"))
    completed_followups = sum(1 for v in visits if v.get("follow_up", {}).get("status") == "Completed")
    if total_followups:
        ratio = completed_followups / total_followups
        if ratio >= 0.8:
            positives.append("Follow-ups completed")
        elif ratio < 0.5:
            score -= 15
            negatives.append("Missed appointment(s)/follow-up(s)")

    high_triage = sum(1 for v in visits if v["triage"]["priority"] == "HIGH")
    if high_triage == 0:
        positives.append("Stable recent vitals")
    else:
        score -= min(high_triage * 8, 30)
        negatives.append(f"Abnormal recent reading(s) — {high_triage} HIGH-priority visit(s)")

    if trend and trend.get("level") == "HIGH RISK":
        score -= 15
        negatives.append("Deteriorating trend across recent visits")
    elif trend and trend.get("level") == "WATCH":
        score -= 5
        negatives.append("Early warning signs being watched")
    elif trend and trend.get("level") == "NORMAL":
        positives.append("No worsening trend detected")

    score = max(0, min(100, score))
    return {"score": score, "positives": positives, "negatives": negatives}
