"""
Rural -> Tertiary Healthcare Network: explainable referral-destination
recommendation.

Reuses the existing hospital/doctor scoring engine in
utils/recommendation.py (score_hospitals, rank_doctors) instead of building
a second scoring system. This module only adds the referral-specific
framing: filter candidates to the required specialty, weigh emergency
capability higher for high-priority referrals, and produce a short
plain-language explanation. This is NOT a medical diagnosis or a
guarantee of admission/appointment - just a decision-support suggestion
for the health worker.
"""

from bson.objectid import ObjectId

from utils.recommendation import score_hospitals


def recommend_referral_destinations(db, department, priority="Medium", exclude_facility=None, limit=3):
    """Return up to `limit` recommended hospitals for a referral, each with
    an explanation, sorted best first.

    department: suggested specialist/department (e.g. "Pulmonology")
    priority: "High" | "Medium" | "Low" (from triage / referral priority)
    """
    doctors = list(db.doctors.find({"department": department}))
    hospital_ids_with_dept = {d.get("hospital_id") for d in doctors if d.get("hospital_id")}

    if hospital_ids_with_dept:
        candidates = list(db.hospitals.find({"_id": {"$in": [
            ObjectId(hid) for hid in hospital_ids_with_dept
        ]}}))
    else:
        # No hospital has this exact department on record - fall back to
        # the full hospital list so the health worker still gets a suggestion.
        candidates = list(db.hospitals.find({}))

    if exclude_facility:
        candidates = [h for h in candidates if h.get("hospital_name") != exclude_facility]

    if not candidates:
        return []

    scored = score_hospitals(candidates)

    if priority == "High":
        # Boost hospitals with 24x7 emergency capability for high-priority referrals.
        scored.sort(key=lambda h: (
            1 if (h.get("emergency") and h.get("available_247")) else 0,
            h["score"],
        ), reverse=True)

    results = []
    for h in scored[:limit]:
        dept_doctor_count = sum(1 for d in doctors if d.get("hospital_id") == str(h.get("_id")))
        reasons = []
        if dept_doctor_count:
            reasons.append(f"has {dept_doctor_count} {department} doctor(s) on record")
        if h.get("emergency") and h.get("available_247"):
            reasons.append("24x7 emergency facility available")
        elif h.get("emergency"):
            reasons.append("emergency facility available")
        if h.get("distance_km") is not None:
            reasons.append(f"{h['distance_km']} km away")
        if h.get("avg_cost") is not None:
            reasons.append(f"approx. cost level ₹{h['avg_cost']}")
        if h.get("rating"):
            reasons.append(f"rated {h['rating']}/5")

        explanation = f"Recommended {h.get('hospital_name', 'this facility')} because it " + ", ".join(reasons) + "." if reasons else \
            f"{h.get('hospital_name', 'This facility')} is the best available match on record."

        results.append({
            "hospital_id": str(h.get("_id")),
            "hospital_name": h.get("hospital_name"),
            "score": h.get("score"),
            "distance_km": h.get("distance_km"),
            "avg_cost": h.get("avg_cost"),
            "emergency": h.get("emergency"),
            "available_247": h.get("available_247"),
            "department_doctor_count": dept_doctor_count,
            "explanation": explanation,
        })

    return results
