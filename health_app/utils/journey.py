"""
AI Patient Journey Orchestrator: derives the current/next step in a
patient's care journey purely from data already stored across visits,
referrals and follow-ups. No new collection - a pure read/derivation
layer that ties the existing modules together.
"""


def get_patient_journey(db, patient_id):
    visits = list(db.visits.find({"patient_id": patient_id}).sort("created_at", 1))
    referrals = list(db.referrals.find({"patientId": patient_id}).sort("createdAt", 1))

    if not visits:
        return {"current_step": "Not yet registered for care", "next_step": "Register patient and record vitals",
                "pending_action": "Registration", "recommended_facility": None,
                "appointment": None, "follow_up": None}

    last_visit = visits[-1]
    active_referral = next((r for r in reversed(referrals) if r["status"] not in ("COMPLETED", "CANCELLED")), None)

    if active_referral:
        status = active_referral["status"]
        step_map = {
            "REFERRED": ("Referral created", "Schedule appointment at destination facility"),
            "APPOINTMENT_SCHEDULED": ("Appointment scheduled", "Travel to destination facility"),
            "TRAVEL_PENDING": ("Travel pending", "Arrive at destination facility"),
            "PATIENT_ARRIVED": ("Arrived at facility", "Await doctor consultation"),
            "DOCTOR_CONSULTED": ("Consultation done", "Begin treatment"),
            "TREATMENT_STARTED": ("Treatment in progress", "Complete treatment and prepare for follow-up"),
            "FOLLOW_UP_PENDING": ("Treatment done, follow-up pending", "Attend follow-up visit"),
        }
        current, nxt = step_map.get(status, ("Referral in progress", "Continue referral journey"))
        return {
            "current_step": current, "next_step": nxt,
            "pending_action": active_referral["status"].replace("_", " ").title(),
            "recommended_facility": active_referral["toFacility"],
            "appointment": active_referral.get("appointmentDate") or None,
            "follow_up": active_referral.get("followUpDate") or None,
        }

    if last_visit["triage"]["referral_required"]:
        return {
            "current_step": "Triage completed — referral recommended", "next_step": "Create a referral",
            "pending_action": "Create Referral", "recommended_facility": last_visit["triage"]["suggested_department"],
            "appointment": None, "follow_up": last_visit.get("follow_up", {}).get("date"),
        }

    follow_up_date = last_visit.get("follow_up", {}).get("date")
    follow_up_status = last_visit.get("follow_up", {}).get("status")
    if follow_up_date and follow_up_status != "Completed":
        return {
            "current_step": "Routine care — follow-up scheduled", "next_step": f"Attend follow-up on {follow_up_date}",
            "pending_action": "Follow-up", "recommended_facility": None,
            "appointment": None, "follow_up": follow_up_date,
        }

    return {
        "current_step": "Visit recorded — no further action pending", "next_step": "Routine monitoring",
        "pending_action": "None", "recommended_facility": None, "appointment": None, "follow_up": None,
    }
