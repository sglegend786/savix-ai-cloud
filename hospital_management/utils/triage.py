"""
Rule-based triage / decision-support engine for frontline health workers.

This is DECISION SUPPORT ONLY. It never claims to diagnose a disease -
it only suggests a priority level and a department, based on vitals and
reported symptoms, so a health worker can decide whether to refer a
patient to a higher facility.

The same rules are mirrored in static/js/offline.js (see `localTriage`)
so that triage keeps working when the device has no Internet connection.
Keep the two implementations in sync if you change the thresholds here.
"""

HIGH_RISK_SYMPTOMS = {
    "breathing difficulty", "chest pain", "unconscious", "severe bleeding",
    "seizure", "not responding",
}

MODERATE_SYMPTOMS = {
    "fever", "vomiting", "diarrhea", "weakness", "headache", "cough",
}

SYMPTOM_TO_DEPARTMENT = {
    "chest pain": "Cardiology",
    "breathing difficulty": "Pulmonology",
    "cough": "Pulmonology",
    "headache": "Neurology",
    "seizure": "Neurology",
    "vomiting": "Liver / Gastroenterology",
    "diarrhea": "Liver / Gastroenterology",
    "fever": "General Medicine",
    "weakness": "General Medicine",
    "severe bleeding": "General Medicine",
    "unconscious": "General Medicine",
    "not responding": "General Medicine",
}


def run_triage(vitals, symptoms):
    """Compute a priority level and suggested action from vitals + symptoms.

    vitals: dict with optional keys heart_rate, spo2, temperature,
            bp_systolic, bp_diastolic (numbers, may be missing/blank)
    symptoms: list of symptom strings (lowercase-ish, from a fixed set)

    Returns a dict:
        priority: "HIGH" | "MEDIUM" | "LOW"
        referral_required: bool
        high_risk: bool
        suggested_department: str
        reasons: list[str]  (plain-language reasons, no diagnosis)
        message: str
    """
    symptoms = [s.strip().lower() for s in (symptoms or []) if s and s.strip()]
    reasons = []
    priority = "LOW"

    def to_float(v):
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    spo2 = to_float(vitals.get("spo2")) if vitals else None
    temp = to_float(vitals.get("temperature")) if vitals else None
    hr = to_float(vitals.get("heart_rate")) if vitals else None
    bp_sys = to_float(vitals.get("bp_systolic")) if vitals else None

    high_risk = False

    # --- Vitals based rules -------------------------------------------------
    if spo2 is not None and spo2 < 90:
        high_risk = True
        reasons.append(f"Oxygen level (SpO2 {spo2:.0f}%) is critically low.")
    elif spo2 is not None and spo2 < 94:
        priority = "MEDIUM" if priority == "LOW" else priority
        reasons.append(f"Oxygen level (SpO2 {spo2:.0f}%) is below normal.")

    if temp is not None and temp >= 103:
        high_risk = True
        reasons.append(f"Very high temperature ({temp:.1f}°F).")
    elif temp is not None and temp >= 100.4:
        priority = "MEDIUM" if priority == "LOW" else priority
        reasons.append(f"Fever detected ({temp:.1f}°F).")

    if hr is not None and (hr > 130 or hr < 45):
        high_risk = True
        reasons.append(f"Heart rate ({hr:.0f} bpm) is far outside the normal range.")

    if bp_sys is not None and (bp_sys >= 180 or bp_sys < 90):
        high_risk = True
        reasons.append(f"Blood pressure reading ({bp_sys:.0f} systolic) needs urgent attention.")

    # --- Symptom based rules -------------------------------------------------
    matched_high = [s for s in symptoms if s in HIGH_RISK_SYMPTOMS]
    matched_moderate = [s for s in symptoms if s in MODERATE_SYMPTOMS]

    if matched_high:
        high_risk = True
        reasons.append("Reported symptom(s) considered serious: " + ", ".join(matched_high) + ".")
    elif len(matched_moderate) >= 2:
        priority = "MEDIUM" if priority == "LOW" else priority
        reasons.append("Multiple symptoms reported: " + ", ".join(matched_moderate) + ".")

    # Combination rule from the spec: fever + breathing difficulty -> HIGH
    if "fever" in symptoms and "breathing difficulty" in symptoms:
        high_risk = True
        reasons.append("Fever combined with breathing difficulty.")

    if high_risk:
        priority = "HIGH"

    # --- Suggested department -------------------------------------------------
    dept = "General Medicine"
    for s in symptoms:
        if s in SYMPTOM_TO_DEPARTMENT:
            dept = SYMPTOM_TO_DEPARTMENT[s]
            if s in HIGH_RISK_SYMPTOMS:
                break

    referral_required = priority in ("HIGH", "MEDIUM")

    if priority == "HIGH":
        message = "HIGH PRIORITY — Suggested action: refer to a higher healthcare facility as soon as possible."
    elif priority == "MEDIUM":
        message = "MEDIUM PRIORITY — Suggested action: monitor closely and consider a referral."
    else:
        message = "LOW PRIORITY — Suggested action: routine care and monitoring."

    if not reasons:
        reasons.append("No significant warning signs detected in the vitals or symptoms entered.")

    return {
        "priority": priority,
        "referral_required": referral_required,
        "high_risk": high_risk,
        "suggested_department": dept,
        "reasons": reasons,
        "message": message,
    }
