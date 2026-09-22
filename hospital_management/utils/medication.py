"""
Medication adherence + treatment-review alerting.

Detects the specific pattern the spec calls out: adherence is good, but
symptoms/triage are not improving -> flag for the treating doctor. Never
changes or suggests changing medication automatically.
"""


def assess_treatment_review(db, patient_id):
    adherence_records = list(db.medication_adherence.find({"patient_id": patient_id}).sort("created_at", -1))
    visits = list(db.visits.find({"patient_id": patient_id}).sort("created_at", 1))

    if not adherence_records or len(visits) < 2:
        return None

    latest_adherence = adherence_records[0]
    if latest_adherence["adherence_status"] != "Good":
        return None

    last_two = visits[-2:]
    priorities = [v["triage"]["priority"] for v in last_two]
    not_improving = priorities[-1] in ("HIGH", "MEDIUM") and priorities[0] in ("HIGH", "MEDIUM")

    if not_improving:
        return ("Possible treatment-review alert: medication adherence is good, but the patient's triage "
                "priority has not improved across the last two visits. Please consult the treating doctor. "
                "This is not a suggestion to change medication.")
    return None
