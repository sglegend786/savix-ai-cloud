"""
Wearable / device integration foundation.

No real hardware is connected. This provides a genuine simulation layer:
a health worker (or a demo "device") can push a simulated reading, it is
stored exactly like a real device reading would be, and it is fed into
the same triage/risk engine used for manually recorded vitals. Every
reading is clearly marked as DEMO/SIMULATED.
"""

import random
from datetime import datetime

from bson.objectid import ObjectId
from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, abort, session

from utils.decorators import login_required
from utils.triage import run_triage

wearable_bp = Blueprint("wearable", __name__, url_prefix="/wearable")


def get_db():
    return current_app.db


def _simulate_reading():
    """Generate a plausible simulated reading. Occasionally simulates an
    abnormal reading so the risk engine has something to detect."""
    abnormal = random.random() < 0.25
    if abnormal:
        return {
            "heart_rate": random.randint(115, 145),
            "spo2": random.randint(84, 91),
            "temperature": round(random.uniform(100.5, 103.5), 1),
            "activity": random.choice(["resting", "lying down"]),
        }
    return {
        "heart_rate": random.randint(65, 95),
        "spo2": random.randint(95, 99),
        "temperature": round(random.uniform(97.5, 99.2), 1),
        "activity": random.choice(["resting", "walking", "light activity"]),
    }


@wearable_bp.route("/<patient_id>")
@login_required(role="health_worker")
def dashboard(patient_id):
    db = get_db()
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        abort(404)
    readings = list(db.wearable_readings.find({"patient_id": patient_id}).sort("recorded_at", -1).limit(20))
    return render_template("hw_wearable.html", patient=patient, readings=readings)


@wearable_bp.route("/<patient_id>/simulate", methods=["POST"])
@login_required(role="health_worker")
def simulate(patient_id):
    db = get_db()
    patient = db.care_patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        abort(404)

    reading = _simulate_reading()
    triage = run_triage(reading, [])

    doc = {
        "patient_id": patient_id,
        "heart_rate": reading["heart_rate"],
        "spo2": reading["spo2"],
        "temperature": reading["temperature"],
        "activity": reading["activity"],
        "location": "DEMO — GPS not available in simulation",
        "simulated": True,
        "triage": triage,
        "recorded_at": datetime.utcnow(),
    }
    db.wearable_readings.insert_one(doc)

    if triage["high_risk"]:
        db.care_patients.update_one({"_id": ObjectId(patient_id)},
                                     {"$set": {"high_risk": True, "high_risk_since": datetime.utcnow()}})
        flash("Simulated wearable reading flagged HIGH RISK — patient marked high-risk.", "danger")
    else:
        flash("Simulated wearable reading recorded.", "success")

    return redirect(url_for("wearable.dashboard", patient_id=patient_id))
