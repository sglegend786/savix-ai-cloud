"""
Shared data-access helpers for the frontline Health Worker features:
village patients, visits (registration + vitals + symptoms + triage) and
referrals. Used by both the HTML routes (routes/health_worker.py,
routes/referral.py) and the JSON API (routes/api.py) so the offline sync
endpoint and the normal web forms go through the exact same logic.
"""

from datetime import datetime

from bson.objectid import ObjectId

from utils.triage import run_triage

REFERRAL_STATUSES = [
    "REFERRED", "APPOINTMENT_SCHEDULED", "TRAVEL_PENDING", "PATIENT_ARRIVED",
    "DOCTOR_CONSULTED", "TREATMENT_STARTED", "FOLLOW_UP_PENDING", "COMPLETED",
    "CANCELLED",
]

REFERRAL_STATUS_LABELS = {
    "REFERRED": "Referred",
    "APPOINTMENT_SCHEDULED": "Appointment Scheduled",
    "TRAVEL_PENDING": "Travel Pending",
    "PATIENT_ARRIVED": "Patient Arrived",
    "DOCTOR_CONSULTED": "Doctor Consulted",
    "TREATMENT_STARTED": "Treatment Started",
    "FOLLOW_UP_PENDING": "Follow-up Pending",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
}

# Statuses shown on the visual timeline, in order (CANCELLED is an
# out-of-band terminal state and is shown separately, not on the timeline).
REFERRAL_TIMELINE_STATUSES = [s for s in REFERRAL_STATUSES if s != "CANCELLED"]


# ---------------------------------------------------------------------------
# Patients (village / frontline patients registered by a health worker)
# ---------------------------------------------------------------------------

def find_or_create_patient(db, patient_data, worker_id, facility):
    """Find an existing care_patient by phone (+name) or create a new one.
    Returns the patient _id as a string.
    """
    phone = (patient_data.get("phone") or "").strip()
    name = (patient_data.get("name") or "").strip()

    existing = None
    if phone:
        existing = db.care_patients.find_one({"phone": phone, "name": name})

    if existing:
        db.care_patients.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "age": patient_data.get("age", existing.get("age")),
                "gender": patient_data.get("gender", existing.get("gender")),
                "village": patient_data.get("village", existing.get("village")),
                "medical_history": patient_data.get("medical_history", existing.get("medical_history")),
                "abha_id": patient_data.get("abha_id", existing.get("abha_id", "")),
                "updated_at": datetime.utcnow(),
            }}
        )
        return str(existing["_id"])

    doc = {
        "name": name,
        "age": patient_data.get("age", ""),
        "gender": patient_data.get("gender", ""),
        "village": patient_data.get("village", ""),
        "phone": phone,
        "medical_history": patient_data.get("medical_history", ""),
        "abha_id": patient_data.get("abha_id", ""),
        "consent_given": bool(patient_data.get("consent_given")),
        "registered_by": worker_id,
        "facility": facility,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = db.care_patients.insert_one(doc)
    patient_id = str(result.inserted_id)

    if patient_data.get("consent_given"):
        db.consents.insert_one({
            "patient_id": patient_id,
            "consent_type": "share_health_records_for_referral_coordination",
            "granted_by": "patient_or_guardian_via_health_worker",
            "worker_id": worker_id,
            "granted_at": datetime.utcnow(),
        })

    return patient_id


# ---------------------------------------------------------------------------
# Visits (registration + vitals + symptoms + triage, the offline record)
# ---------------------------------------------------------------------------

def create_visit(db, record, worker_id, worker_name, facility, source="online"):
    """Create (or, if localId already synced, return) a visit record.

    `record` follows the shared offline/online record shape:
        {
          localId, patient: {...}, vitals: {...}, symptoms: {selected, notes},
          followUp: {date}, referral: {create: bool, ...referral fields}
        }

    Idempotent on localId: sending the same localId twice never creates a
    duplicate visit or a duplicate referral.
    """
    local_id = record.get("localId") or ""

    if local_id:
        existing = db.visits.find_one({"localId": local_id})
        if existing:
            return existing, False  # already synced, not new

    patient_data = record.get("patient") or {}
    patient_id = record.get("patient_id") or find_or_create_patient(
        db, patient_data, worker_id, facility)

    vitals = record.get("vitals") or {}
    symptoms_block = record.get("symptoms") or {}
    selected_symptoms = symptoms_block.get("selected") or []

    triage = run_triage(vitals, selected_symptoms)

    visit_doc = {
        "localId": local_id or None,
        "patient_id": patient_id,
        "patient_snapshot": {
            "name": patient_data.get("name", ""),
            "age": patient_data.get("age", ""),
            "gender": patient_data.get("gender", ""),
            "village": patient_data.get("village", ""),
            "phone": patient_data.get("phone", ""),
        },
        "vitals": {
            "heart_rate": vitals.get("heart_rate", ""),
            "spo2": vitals.get("spo2", ""),
            "temperature": vitals.get("temperature", ""),
            "bp_systolic": vitals.get("bp_systolic", ""),
            "bp_diastolic": vitals.get("bp_diastolic", ""),
        },
        "symptoms": {
            "selected": selected_symptoms,
            "notes": symptoms_block.get("notes", ""),
        },
        "triage": triage,
        "follow_up": record.get("followUp") or {},
        "worker_id": worker_id,
        "worker_name": worker_name,
        "facility": facility,
        "source": source,
        "created_at": datetime.utcnow(),
    }
    result = db.visits.insert_one(visit_doc)
    visit_doc["_id"] = result.inserted_id

    # Mark high-risk patients for quick-access monitoring
    if triage["high_risk"] or triage["priority"] == "HIGH":
        db.care_patients.update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": {"high_risk": True, "high_risk_since": datetime.utcnow()}}
        )

    return visit_doc, True


# ---------------------------------------------------------------------------
# Referrals
# ---------------------------------------------------------------------------

def _next_referral_code(db):
    year = datetime.utcnow().year
    count = db.referrals.count_documents({"referralId": {"$regex": f"^REF-{year}-"}})
    return f"REF-{year}-{count + 1:05d}"


def create_referral(db, data, worker_id=None, worker_name=None, idempotency_key=None):
    """Create a referral. If idempotency_key is given and a referral was
    already created with that key (used for offline sync), return the
    existing one instead of duplicating it.
    """
    if idempotency_key:
        existing = db.referrals.find_one({"source_local_id": idempotency_key})
        if existing:
            return existing, False

    now = datetime.utcnow()
    doc = {
        "referralId": _next_referral_code(db),
        "patientId": data.get("patientId") or data.get("patient_id"),
        "patientName": data.get("patientName", ""),
        "referredBy": worker_id or data.get("referredBy"),
        "healthWorkerId": worker_id or data.get("healthWorkerId"),
        "healthWorkerName": worker_name or data.get("healthWorkerName", ""),
        "fromFacility": data.get("fromFacility", ""),
        "toFacility": data.get("toFacility", ""),
        "specialist": data.get("specialist", ""),
        "reason": data.get("reason", ""),
        "symptoms": data.get("symptoms", []),
        "priority": data.get("priority", "Medium"),
        "appointmentDate": data.get("appointmentDate", ""),
        "expectedArrivalDate": data.get("expectedArrivalDate", ""),
        "actualArrivalDate": "",
        "status": "REFERRED",
        "consultationStatus": "Pending",
        "treatmentStatus": "Pending",
        "followUpDate": data.get("followUpDate", ""),
        "followUpCompleted": False,
        "notes": data.get("notes", ""),
        "visitId": data.get("visitId"),
        "source_local_id": idempotency_key,
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.referrals.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc, True


def update_referral_status(db, referral_id, status, note=None):
    if status not in REFERRAL_STATUSES:
        return False
    update = {"status": status, "updatedAt": datetime.utcnow()}
    if status == "PATIENT_ARRIVED":
        update["actualArrivalDate"] = datetime.utcnow().strftime("%Y-%m-%d")
    if status == "DOCTOR_CONSULTED":
        update["consultationStatus"] = "Done"
    if status == "TREATMENT_STARTED":
        update["treatmentStatus"] = "In Progress"
    if status == "COMPLETED":
        update["treatmentStatus"] = "Completed"
        update["followUpCompleted"] = True
    db.referrals.update_one({"_id": ObjectId(referral_id)}, {"$set": update})
    if note:
        db.referrals.update_one(
            {"_id": ObjectId(referral_id)},
            {"$push": {"status_notes": {"status": status, "note": note, "at": datetime.utcnow()}}}
        )
    return True


# ---------------------------------------------------------------------------
# Zero-loss referral alerts — explainable, rule-based dropout warnings.
# This is decision support only; it never makes a medical/clinical claim.
# ---------------------------------------------------------------------------

def compute_referral_alerts(referral, today=None):
    """Return a list of short alert strings for a single referral, e.g.
    overdue, missed appointment, patient did not arrive, follow-up missed,
    high-priority pending. Used to drive UI badges and dashboard counts.
    """
    today = today or datetime.utcnow().date()
    alerts = []
    status = referral.get("status", "REFERRED")

    def parse_date(value):
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    created = referral.get("createdAt")
    created_date = created.date() if isinstance(created, datetime) else None
    appointment_date = parse_date(referral.get("appointmentDate"))
    expected_arrival = parse_date(referral.get("expectedArrivalDate"))
    follow_up_date = parse_date(referral.get("followUpDate"))

    if status not in ("COMPLETED", "CANCELLED"):
        # Overdue: still just REFERRED for more than 3 days with no appointment.
        if status == "REFERRED" and created_date and (today - created_date).days > 3:
            alerts.append(f"Overdue: referred {(today - created_date).days} days ago with no appointment scheduled.")

        if appointment_date and appointment_date < today and status in ("REFERRED", "APPOINTMENT_SCHEDULED", "TRAVEL_PENDING"):
            alerts.append(f"Missed appointment: appointment date ({referral.get('appointmentDate')}) has passed.")

        if expected_arrival and expected_arrival < today and status in ("REFERRED", "APPOINTMENT_SCHEDULED", "TRAVEL_PENDING"):
            alerts.append("Patient did not arrive by the expected arrival date.")

        if follow_up_date and follow_up_date < today and not referral.get("followUpCompleted"):
            alerts.append(f"Follow-up missed: follow-up was due on {referral.get('followUpDate')}.")

        if referral.get("priority") == "High" and status == "REFERRED":
            alerts.append("High-priority referral still pending action.")

    return alerts


def estimate_dropout_risk(referral, patient=None, today=None):
    """Simple, explainable rule-based risk score for whether a patient is
    likely to drop out of the referral journey before completing it.
    NOT a medical diagnosis — purely a workflow/logistics risk estimate.

    Returns dict: {level: LOW|MEDIUM|HIGH, score: int, reasons: [str]}
    """
    today = today or datetime.utcnow().date()
    score = 0
    reasons = []

    alerts = compute_referral_alerts(referral, today=today)
    for a in alerts:
        if "Overdue" in a:
            score += 2
            reasons.append(a)
        elif "Missed appointment" in a:
            score += 3
            reasons.append(a)
        elif "did not arrive" in a:
            score += 3
            reasons.append(a)
        elif "Follow-up missed" in a:
            score += 2
            reasons.append(a)
        elif "High-priority" in a:
            score += 1
            reasons.append(a)

    if referral.get("priority") == "High":
        score += 1

    if patient:
        if patient.get("high_risk"):
            score += 1
            reasons.append("Patient is currently flagged high-risk.")
        try:
            age = int(patient.get("age") or 0)
            if age >= 60 or age <= 5:
                score += 1
                reasons.append("Patient age group (under 5 or 60+) has a higher dropout tendency in rural referral journeys.")
        except (TypeError, ValueError):
            pass

    prior_missed = referral.get("prior_missed_followups", 0)
    if prior_missed:
        score += min(prior_missed, 3)
        reasons.append(f"Patient has {prior_missed} previously missed follow-up(s).")

    if score >= 6:
        level = "HIGH"
    elif score >= 3:
        level = "MEDIUM"
    else:
        level = "LOW"

    if not reasons:
        reasons.append("No dropout risk factors detected so far.")

    return {"level": level, "score": score, "reasons": reasons}
