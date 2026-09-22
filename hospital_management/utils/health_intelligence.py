"""
AI Health Intelligence: combines a patient's visits, triage history,
referrals and follow-ups into a short list of explainable observations.
Decision support only - never a diagnosis, never auto-prescribes.
"""

from datetime import datetime


def generate_insights(db, patient_id):
    visits = list(db.visits.find({"patient_id": patient_id}).sort("created_at", 1))
    referrals = list(db.referrals.find({"patientId": patient_id}).sort("createdAt", 1))

    insights = []

    if not visits:
        return ["No visits recorded yet for this patient."]

    latest = visits[-1]
    insights.append(f"Most recent visit ({latest['created_at'].strftime('%d %b %Y') if latest.get('created_at') else '-'}): "
                     f"triaged {latest['triage']['priority']} priority — {latest['triage']['message']}")

    bp_values = [v["vitals"].get("bp_systolic") for v in visits if v["vitals"].get("bp_systolic")]
    try:
        bp_values = [float(b) for b in bp_values]
        high_bp_count = sum(1 for b in bp_values if b >= 140)
        if high_bp_count >= 2:
            insights.append(f"Repeated elevated blood pressure readings ({high_bp_count} of {len(bp_values)} visits). Please consult a healthcare professional.")
    except (TypeError, ValueError):
        pass

    completed_followups = sum(1 for v in visits if v.get("follow_up", {}).get("status") == "Completed")
    total_followups = sum(1 for v in visits if v.get("follow_up", {}).get("date"))
    if total_followups:
        insights.append(f"Follow-up adherence: {completed_followups} of {total_followups} completed.")

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    upcoming = [v for v in visits if v.get("follow_up", {}).get("date", "") >= today_str
                and v["follow_up"].get("status") != "Completed"]
    if upcoming:
        insights.append(f"Upcoming follow-up due {upcoming[-1]['follow_up']['date']}.")

    active_referrals = [r for r in referrals if r["status"] not in ("COMPLETED", "CANCELLED")]
    if active_referrals:
        insights.append(f"{len(active_referrals)} referral(s) still in progress — most recent to {active_referrals[-1]['toFacility']} ({active_referrals[-1]['status'].replace('_', ' ').title()}).")

    high_priority_visits = sum(1 for v in visits if v["triage"]["priority"] == "HIGH")
    if high_priority_visits >= 2:
        insights.append(f"{high_priority_visits} visits triaged HIGH priority — recommend closer monitoring.")

    insights.append("AI-generated information for decision support. Consult a qualified healthcare professional for diagnosis.")
    return insights
