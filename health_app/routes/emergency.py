"""
Emergency AI / Pre-hospital workflow.

A health worker (or the system, based on a HIGH-risk trend) can trigger an
SOS for a patient. This is a real state machine backed by MongoDB, not a
static badge: DETECTED -> CONFIRMATION_PENDING -> SOS_TRIGGERED ->
CONTACT_NOTIFIED -> HOSPITAL_NOTIFIED -> RESOLVED.

Emergency contact/hospital notification is SIMULATED for this demo (no
real SMS/call integration exists) and is clearly labelled as such.
"""

from datetime import datetime

from bson.objectid import ObjectId
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app, abort

from utils.decorators import login_required
from utils.rural_network import recommend_referral_destinations
from utils.audit import log_action

emergency_bp = Blueprint("emergency", __name__, url_prefix="/emergency")

STATES = ["DETECTED", "CONFIRMATION_PENDING", "SOS_TRIGGERED", "CONTACT_NOTIFIED",
          "HOSPITAL_NOTIFIED", "RESOLVED"]


def get_db():
    return current_app.db


@emergency_bp.route("/")
@login_required(role=("health_worker", "hospital"))
def dashboard():
    db = get_db()
    role = session.get("role")
    query = {}
    if role == "health_worker":
        query["triggered_by_worker_id"] = session.get("worker_id")
    alerts = list(db.emergency_alerts.find(query).sort("createdAt", -1))
    return render_template("emergency_dashboard.html", alerts=alerts)


@emergency_bp.route("/trigger/<patient_id>", methods=["GET", "POST"])
@login_required(role="health_worker")
def trigger(patient_id):
    db = get_db()
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        abort(404)

    if request.method == "POST":
        form = request.form
        last_visit = db.visits.find_one({"patient_id": patient_id}, sort=[("created_at", -1)])
        vitals_summary = last_visit["vitals"] if last_visit else {}

        # Simulated pre-hospital pipeline: since a health worker is
        # triggering this deliberately (not an automated sensor), we skip
        # straight past DETECTED/CONFIRMATION_PENDING to SOS_TRIGGERED and
        # simulate the notification steps immediately for the demo.
        nearest = recommend_referral_destinations(
            db, "General Medicine", priority="High",
            exclude_facility=session.get("facility", ""), limit=1)
        nearest_hospital = nearest[0]["hospital_name"] if nearest else "Nearest available hospital"

        doc = {
            "patient_id": patient_id,
            "patient_name": patient["name"],
            "emergency_type": form.get("emergency_type", "").strip(),
            "essential_summary": form.get("summary", "").strip(),
            "blood_group": form.get("blood_group", "").strip(),
            "vitals_snapshot": vitals_summary,
            "triggered_by_worker_id": session.get("worker_id"),
            "triggered_by_name": session.get("name"),
            "facility": session.get("facility", ""),
            "nearest_hospital": nearest_hospital,
            "state": "HOSPITAL_NOTIFIED",
            "simulated": True,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "state_history": [
                {"state": "SOS_TRIGGERED", "at": datetime.utcnow(), "note": "Health worker triggered SOS."},
                {"state": "CONTACT_NOTIFIED", "at": datetime.utcnow(), "note": "(Simulated) Emergency contact notified."},
                {"state": "HOSPITAL_NOTIFIED", "at": datetime.utcnow(), "note": f"(Simulated) {nearest_hospital} alerted."},
            ],
        }
        db.emergency_alerts.insert_one(doc)
        log_action(db, "health_worker", session.get("worker_id"), session.get("name"),
                   "TRIGGER_EMERGENCY_SOS", "emergency_alert", None,
                   details=f"Patient {patient['name']} — {doc['emergency_type']}")
        flash(f"Emergency SOS triggered. {nearest_hospital} has been (simulated) notified.", "danger")
        return redirect(url_for("emergency.dashboard"))

    return render_template("emergency_trigger.html", patient=patient)


@emergency_bp.route("/alerts/<alert_id>/resolve", methods=["POST"])
@login_required(role=("health_worker", "hospital"))
def resolve(alert_id):
    db = get_db()
    db.emergency_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"state": "RESOLVED", "updatedAt": datetime.utcnow()},
         "$push": {"state_history": {"state": "RESOLVED", "at": datetime.utcnow(), "note": "Marked resolved."}}}
    )
    flash("Emergency alert marked resolved.", "success")
    return redirect(url_for("emergency.dashboard"))
