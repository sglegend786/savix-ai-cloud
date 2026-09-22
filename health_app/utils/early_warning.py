"""
Patient Deterioration Early Warning: longitudinal trend monitoring.

Upgrades single-visit triage (utils/triage.py) into a trend view across a
patient's recorded visits. This is DECISION SUPPORT ONLY - it flags
patterns worth a health worker's/doctor's attention, it never diagnoses a
disease or condition.
"""

from datetime import datetime


def _to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def assess_patient_trend(db, patient_id):
    """Look across a patient's visit history and return a longitudinal
    risk assessment.

    Returns dict:
        level: "NORMAL" | "WATCH" | "HIGH RISK" | "INSUFFICIENT_DATA"
        reasons: list[str]
        visit_count: int
    """
    visits = list(db.visits.find({"patient_id": patient_id}).sort("created_at", 1))

    if len(visits) < 2:
        return {
            "level": "INSUFFICIENT_DATA",
            "reasons": ["Not enough visits recorded yet to detect a trend. At least 2 visits are needed."],
            "visit_count": len(visits),
        }

    reasons = []
    score = 0

    spo2_values = [_to_float(v["vitals"].get("spo2")) for v in visits]
    spo2_values = [s for s in spo2_values if s is not None]
    low_spo2_count = sum(1 for s in spo2_values if s < 94)
    if low_spo2_count >= 2:
        score += 3
        reasons.append(f"SpO2 has been below normal in {low_spo2_count} of the last {len(spo2_values)} recorded visits.")

    temp_values = [_to_float(v["vitals"].get("temperature")) for v in visits]
    temp_values = [t for t in temp_values if t is not None]
    if len(temp_values) >= 2 and temp_values[-1] >= 100.4 and temp_values[-1] >= temp_values[-2]:
        score += 2
        reasons.append("Temperature is elevated and has not improved since the last visit.")

    bp_values = [_to_float(v["vitals"].get("bp_systolic")) for v in visits]
    bp_values = [b for b in bp_values if b is not None]
    abnormal_bp_count = sum(1 for b in bp_values if b >= 140 or b < 90)
    if abnormal_bp_count >= 2:
        score += 2
        reasons.append(f"Blood pressure has been outside the normal range in {abnormal_bp_count} recorded visits.")

    high_triage_count = sum(1 for v in visits if v.get("triage", {}).get("priority") == "HIGH")
    if high_triage_count >= 2:
        score += 3
        reasons.append(f"{high_triage_count} recent visits were triaged as HIGH priority.")

    symptom_counts = [len(v.get("symptoms", {}).get("selected", [])) for v in visits]
    if len(symptom_counts) >= 2 and symptom_counts[-1] > symptom_counts[-2] and symptom_counts[-1] >= 2:
        score += 1
        reasons.append("The number of reported symptoms has increased since the last visit.")

    missed_followups = sum(
        1 for v in visits
        if v.get("follow_up", {}).get("date")
        and v["follow_up"].get("status") != "Completed"
        and v["follow_up"]["date"] < datetime.utcnow().strftime("%Y-%m-%d")
    )
    if missed_followups:
        score += min(missed_followups, 2)
        reasons.append(f"{missed_followups} follow-up(s) were missed.")

    if score >= 6:
        level = "HIGH RISK"
    elif score >= 3:
        level = "WATCH"
    else:
        level = "NORMAL"

    if not reasons:
        reasons.append("Vitals and symptoms have stayed within a stable range across recorded visits.")

    return {"level": level, "reasons": reasons, "visit_count": len(visits), "score": score}
