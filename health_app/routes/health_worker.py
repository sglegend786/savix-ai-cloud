from datetime import datetime
import io

from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort, send_file)

from utils.decorators import login_required
from utils.care_records import create_visit, create_referral, compute_referral_alerts, REFERRAL_STATUSES
from utils.early_warning import assess_patient_trend
from utils.rural_network import recommend_referral_destinations
from utils.health_intelligence import generate_insights
from utils.cost_optimizer import estimate_journey_cost, cheapest_option
from utils.health_score import compute_health_score
from utils.journey import get_patient_journey
from utils.medication import assess_treatment_review
from utils.audit import log_action
from utils.allergy_check import check_conflicts, check_all_adherence_records

health_worker_bp = Blueprint("health_worker", __name__, url_prefix="/worker")

SYMPTOM_OPTIONS = [
    "Fever", "Cough", "Breathing difficulty", "Chest pain", "Headache",
    "Vomiting", "Diarrhea", "Weakness",
]


def get_db():
    return current_app.db


def current_worker():
    return session.get("worker_id"), session.get("name"), session.get("facility", "")


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@health_worker_bp.route("/dashboard")
@login_required(role="health_worker")
def dashboard():
    db = get_db()
    wid, name, facility = current_worker()

    patient_count = db.care_patients.count_documents({"registered_by": wid})
    visit_count = db.visits.count_documents({"worker_id": wid})
    high_risk_count = db.care_patients.count_documents({"registered_by": wid, "high_risk": True})

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_patient_count = db.visits.count_documents({"worker_id": wid, "created_at": {"$gte": today_start}})

    all_referrals = list(db.referrals.find({"healthWorkerId": wid}))
    pending_referral_count = sum(1 for r in all_referrals if r["status"] not in ("COMPLETED", "CANCELLED"))
    alert_referral_count = sum(1 for r in all_referrals if compute_referral_alerts(r))

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    all_followup_visits = list(db.visits.find(
        {"worker_id": wid, "follow_up.date": {"$exists": True, "$ne": ""}}))
    missed_followup_count = sum(
        1 for v in all_followup_visits
        if v["follow_up"].get("status") != "Completed" and v["follow_up"].get("date", "") < today_str
    )

    recent_visits = list(db.visits.find({"worker_id": wid}).sort("created_at", -1).limit(5))
    upcoming_followups = list(db.visits.find(
        {"worker_id": wid, "follow_up.date": {"$exists": True, "$ne": ""}}
    ).sort("created_at", -1).limit(5))
    recent_referrals = list(db.referrals.find({"healthWorkerId": wid}).sort("createdAt", -1).limit(5))

    return render_template(
        "hw_dashboard.html",
        patient_count=patient_count, visit_count=visit_count,
        today_patient_count=today_patient_count,
        high_risk_count=high_risk_count,
        pending_referral_count=pending_referral_count,
        alert_referral_count=alert_referral_count,
        missed_followup_count=missed_followup_count,
        recent_visits=recent_visits, upcoming_followups=upcoming_followups,
        recent_referrals=recent_referrals,
    )


# ---------------------------------------------------------------------------
# New patient visit: registration + vitals + symptoms + AI-assisted triage
# ---------------------------------------------------------------------------

@health_worker_bp.route("/visits/new", methods=["GET", "POST"])
@login_required(role="health_worker")
def new_visit():
    db = get_db()
    wid, name, facility = current_worker()
    triage_result = None
    submitted = None

    if request.method == "POST":
        form = request.form
        patient_data = {
            "name": form.get("patient_name", "").strip(),
            "age": form.get("age", "").strip(),
            "gender": form.get("gender", "").strip(),
            "village": form.get("village", "").strip(),
            "phone": form.get("phone", "").strip(),
            "medical_history": form.get("medical_history", "").strip(),
            "abha_id": form.get("abha_id", "").strip(),
            "allergies": [a.strip().lower() for a in form.get("allergies", "").split(",") if a.strip()],
            "consent_given": bool(form.get("consent_given")),
        }
        vitals = {
            "heart_rate": form.get("heart_rate", "").strip(),
            "spo2": form.get("spo2", "").strip(),
            "temperature": form.get("temperature", "").strip(),
            "bp_systolic": form.get("bp_systolic", "").strip(),
            "bp_diastolic": form.get("bp_diastolic", "").strip(),
        }
        selected_symptoms = [s.lower() for s in form.getlist("symptoms")]
        notes = form.get("symptom_notes", "").strip()
        follow_up_date = form.get("follow_up_date", "").strip()

        record = {
            "localId": f"HW-ONLINE-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}",
            "patient": patient_data,
            "vitals": vitals,
            "symptoms": {"selected": selected_symptoms, "notes": notes},
            "followUp": {"date": follow_up_date} if follow_up_date else {},
        }
        visit_doc, _ = create_visit(db, record, wid, name, facility, source="online")
        triage_result = visit_doc["triage"]
        submitted = {
            "patient_name": patient_data["name"],
            "patient_id": visit_doc["patient_id"],
            "visit_id": str(visit_doc["_id"]),
        }
        flash("Visit recorded and triage completed.", "success")

    return render_template(
        "hw_new_visit.html",
        symptom_options=SYMPTOM_OPTIONS,
        triage_result=triage_result,
        submitted=submitted,
        facility=facility,
    )


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------

@health_worker_bp.route("/patients")
@login_required(role="health_worker")
def patients():
    db = get_db()
    wid, _, _ = current_worker()
    q = request.args.get("q", "").strip()
    query = {"registered_by": wid}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    patient_list = list(db.care_patients.find(query).sort("created_at", -1))
    for p in patient_list:
        p["visit_count"] = db.visits.count_documents({"patient_id": str(p["_id"])})
    return render_template("hw_patients.html", patients=patient_list, q=q)


@health_worker_bp.route("/patients/<patient_id>")
@login_required(role="health_worker")
def patient_detail(patient_id):
    db = get_db()
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        abort(404)
    visits = list(db.visits.find({"patient_id": patient_id}).sort("created_at", -1))
    referrals = list(db.referrals.find({"patientId": patient_id}).sort("createdAt", -1))
    trend = assess_patient_trend(db, patient_id)
    insights = generate_insights(db, patient_id)
    health_score = compute_health_score(db, patient_id, trend=trend)
    journey = get_patient_journey(db, patient_id)
    treatment_review_alert = assess_treatment_review(db, patient_id)
    adherence_records = list(db.medication_adherence.find({"patient_id": patient_id}).sort("created_at", -1))
    allergy_conflicts = check_all_adherence_records(patient.get("allergies", []), adherence_records)
    return render_template("hw_patient_detail.html", patient=patient, visits=visits, referrals=referrals,
                            trend=trend, insights=insights, health_score=health_score, journey=journey,
                            treatment_review_alert=treatment_review_alert, adherence_records=adherence_records,
                            allergy_conflicts=allergy_conflicts)


def _build_timeline_events(db, patient_id):
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        return None, []

    events = []
    events.append({
        "date": patient["created_at"], "type": "Registration",
        "text": f"Patient registered at {patient.get('facility', '-')}.",
    })

    for v in db.visits.find({"patient_id": patient_id}):
        events.append({
            "date": v["created_at"], "type": "Visit",
            "text": f"Vitals & symptoms recorded - triaged {v['triage']['priority']} priority. {v['triage']['message']}",
        })
        if v.get("follow_up", {}).get("date"):
            events.append({
                "date": v["created_at"], "type": "Follow-up Scheduled",
                "text": f"Follow-up scheduled for {v['follow_up']['date']}.",
            })

    for r in db.referrals.find({"patientId": patient_id}):
        events.append({
            "date": r["createdAt"], "type": "Referral Created",
            "text": f"Referred from {r['fromFacility']} to {r['toFacility']} ({r['specialist'] or 'General'}) - {r['reason']}",
        })
        for note in r.get("status_notes", []):
            events.append({
                "date": note["at"], "type": "Referral Update",
                "text": f"Status changed to {note['status'].replace('_', ' ').title()}" + (f" - {note['note']}" if note.get("note") else ""),
            })

    for a in db.emergency_alerts.find({"patient_id": patient_id}):
        events.append({
            "date": a["createdAt"], "type": "Emergency",
            "text": f"Emergency SOS triggered: {a['emergency_type']} - {a['nearest_hospital']} notified (simulated).",
        })

    for m in db.medication_adherence.find({"patient_id": patient_id}):
        events.append({
            "date": m["created_at"], "type": "Medication Adherence",
            "text": f"{m['medicine_name']} ({m['dosage']}, {m['duration']}) - adherence: {m['adherence_status']}.",
        })

    events.sort(key=lambda e: e["date"])
    return patient, events


@health_worker_bp.route("/patients/<patient_id>/timeline")
@login_required(role="health_worker")
def patient_timeline(patient_id):
    db = get_db()
    patient, events = _build_timeline_events(db, patient_id)
    if not patient:
        abort(404)
    return render_template("hw_patient_timeline.html", patient=patient, events=events)


@health_worker_bp.route("/patients/<patient_id>/timeline/pdf")
@login_required(role="health_worker")
def patient_timeline_pdf(patient_id):
    db = get_db()
    patient, events = _build_timeline_events(db, patient_id)
    if not patient:
        abort(404)

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 20 * mm
    y = height - margin

    def new_page_if_needed(min_space=15 * mm):
        nonlocal y
        if y < min_space:
            c.showPage()
            y = height - margin
            c.setFont("Helvetica", 9)

    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, "SAVIX-AI - Patient Health Timeline")
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawString(margin, y, f"Patient: {patient['name']}  |  Age/Gender: {patient.get('age','-')}/{patient.get('gender','-')}  |  Village: {patient.get('village','-')}")
    y -= 6 * mm
    c.drawString(margin, y, f"Facility: {patient.get('facility','-')}  |  ABHA ID: {patient.get('abha_id') or 'Not linked'}")
    y -= 6 * mm
    c.drawString(margin, y, f"Generated: {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}")
    y -= 10 * mm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Timeline")
    y -= 8 * mm
    c.setFont("Helvetica", 9)

    for e in events:
        new_page_if_needed()
        date_str = e["date"].strftime("%d %b %Y, %H:%M") if e.get("date") else "-"
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y, f"{date_str}  [{e['type']}]")
        y -= 5 * mm
        c.setFont("Helvetica", 9)
        text = e["text"]
        max_chars = 100
        while text:
            new_page_if_needed()
            c.drawString(margin + 4 * mm, y, text[:max_chars])
            text = text[max_chars:]
            y -= 5 * mm
        y -= 2 * mm

    new_page_if_needed()
    y -= 4 * mm
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(margin, y, "AI-generated content in this record is decision support only and does not replace a qualified healthcare professional.")

    c.showPage()
    c.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True,
                      download_name=f"health_timeline_{patient['name'].replace(' ', '_')}.pdf",
                      mimetype="application/pdf")



@health_worker_bp.route("/patients/<patient_id>/adherence", methods=["POST"])
@login_required(role="health_worker")
def record_adherence(patient_id):
    db = get_db()
    wid, name, facility = current_worker()
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        abort(404)

    form = request.form
    medicine_name = form.get("medicine_name", "").strip()
    allergy_warnings = check_conflicts(patient.get("allergies", []), medicine_name)

    db.medication_adherence.insert_one({
        "patient_id": patient_id,
        "medicine_name": medicine_name,
        "dosage": form.get("dosage", "").strip(),
        "duration": form.get("duration", "").strip(),
        "adherence_status": form.get("adherence_status", "Good"),
        "notes": form.get("notes", "").strip(),
        "allergy_warnings": allergy_warnings,
        "recorded_by": wid,
        "created_at": datetime.utcnow(),
    })
    if allergy_warnings:
        for w in allergy_warnings:
            flash(f"⚠ Allergy alert: {w}", "danger")
    else:
        flash("Medication adherence recorded.", "success")
    return redirect(url_for("health_worker.patient_detail", patient_id=patient_id))


# ---------------------------------------------------------------------------
# High-risk patients quick-access
# ---------------------------------------------------------------------------

@health_worker_bp.route("/high-risk")
@login_required(role="health_worker")
def high_risk():
    db = get_db()
    wid, _, _ = current_worker()
    high_risk_patients = list(db.care_patients.find({"registered_by": wid, "high_risk": True}))
    for p in high_risk_patients:
        last_visit = db.visits.find_one({"patient_id": str(p["_id"])}, sort=[("created_at", -1)])
        p["last_visit"] = last_visit
        last_referral = db.referrals.find_one({"patientId": str(p["_id"])}, sort=[("createdAt", -1)])
        p["last_referral"] = last_referral
    return render_template("hw_high_risk.html", patients=high_risk_patients)


# ---------------------------------------------------------------------------
# Follow-ups
# ---------------------------------------------------------------------------

@health_worker_bp.route("/followups")
@login_required(role="health_worker")
def followups():
    db = get_db()
    wid, _, _ = current_worker()
    all_visits = list(db.visits.find(
        {"worker_id": wid, "follow_up.date": {"$exists": True, "$ne": ""}}
    ).sort("follow_up.date", 1))

    today = datetime.utcnow().strftime("%Y-%m-%d")
    upcoming, pending, completed = [], [], []
    for v in all_visits:
        status = v["follow_up"].get("status", "Pending")
        if status == "Completed":
            completed.append(v)
        elif v["follow_up"].get("date", "") < today:
            pending.append(v)
        else:
            upcoming.append(v)

    return render_template("hw_followups.html", upcoming=upcoming, pending=pending, completed=completed)


@health_worker_bp.route("/followups/<visit_id>/complete", methods=["POST"])
@login_required(role="health_worker")
def complete_followup(visit_id):
    db = get_db()
    wid, _, _ = current_worker()
    visit = db.visits.find_one({"_id": ObjectId(visit_id), "worker_id": wid})
    if not visit:
        abort(403)
    db.visits.update_one({"_id": ObjectId(visit_id)}, {"$set": {"follow_up.status": "Completed"}})
    flash("Follow-up marked as completed.", "success")
    return redirect(url_for("health_worker.followups"))


@health_worker_bp.route("/offline-queue")
@login_required(role="health_worker")
def offline_queue():
    # Purely a client-side shell: the actual pending/synced/failed records
    # live in the browser's IndexedDB (see static/js/offline.js) since they
    # by definition haven't reached the server yet.
    return render_template("hw_offline_queue.html")


# ---------------------------------------------------------------------------
# Create a referral directly from a visit (referral if required)
# ---------------------------------------------------------------------------

@health_worker_bp.route("/visits/<visit_id>/refer", methods=["GET", "POST"])
@login_required(role="health_worker")
def refer_from_visit(visit_id):
    db = get_db()
    wid, name, facility = current_worker()
    visit = db.visits.find_one({"_id": ObjectId(visit_id), "worker_id": wid})
    if not visit:
        abort(404)
    patient = db.care_patients.find_one({"_id": ObjectId(visit["patient_id"])})

    if request.method == "POST":
        form = request.form
        data = {
            "patientId": visit["patient_id"],
            "patientName": patient["name"] if patient else visit["patient_snapshot"].get("name", ""),
            "fromFacility": facility,
            "toFacility": form.get("toFacility", "").strip(),
            "specialist": form.get("specialist", "").strip(),
            "reason": form.get("reason", "").strip(),
            "symptoms": visit.get("symptoms", {}).get("selected", []),
            "priority": form.get("priority", visit["triage"].get("priority", "Medium").title()),
            "appointmentDate": form.get("appointmentDate", "").strip(),
            "expectedArrivalDate": form.get("expectedArrivalDate", "").strip(),
            "followUpDate": form.get("followUpDate", "").strip(),
            "notes": form.get("notes", "").strip(),
            "visitId": str(visit["_id"]),
        }
        referral, _ = create_referral(db, data, worker_id=wid, worker_name=name)
        log_action(db, "health_worker", wid, name, "CREATE_REFERRAL", "referral", referral["_id"],
                   details=f"Referred patient to {data.get('toFacility')} (from visit)")
        flash(f"Referral {referral['referralId']} created.", "success")
        return redirect(url_for("referral.detail", referral_id=str(referral["_id"])))

    recommended_hospitals = recommend_referral_destinations(
        db, visit["triage"]["suggested_department"], priority=visit["triage"]["priority"].title(),
        exclude_facility=facility,
    )
    for h in recommended_hospitals:
        h["estimated_cost"] = estimate_journey_cost(h, priority=visit["triage"]["priority"])
    cheapest = cheapest_option(recommended_hospitals)
    return render_template("hw_referral_create.html", visit=visit, patient=patient, facility=facility,
                            recommended_hospitals=recommended_hospitals, cheapest=cheapest)
