"""
Hospital Digital Twin + Predictive Hospital Resource Engine.

Real CRUD-backed operational dashboard (beds/ICU/OT/doctors/OPD/emergency/
ambulance) with a simple explainable prediction layer built from the
resource record plus pending referrals already in the database (not
random numbers). Where a hospital hasn't entered real-time data, demo
values are used and clearly labelled.
"""

from datetime import datetime

from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app, abort
from bson.objectid import ObjectId

from utils.decorators import login_required

hospital_resources_bp = Blueprint("hospital_resources", __name__, url_prefix="/hospital/resources")


def get_db():
    return current_app.db


DEFAULT_RESOURCES = {
    "beds_total": 100, "beds_occupied": 62,
    "icu_total": 20, "icu_occupied": 12,
    "ot_available": 2, "ot_total": 3,
    "doctors_on_duty": 8,
    "opd_queue_length": 14,
    "emergency_load": "MEDIUM",
    "ambulances_total": 5, "ambulances_available": 3,
}


def _predict_load(db, hospital_id, hospital_name, resources):
    """Simple, explainable, rule-based estimate - not a validated
    operational forecast. Uses pending referrals addressed to this
    hospital (real data) plus current occupancy ratio."""
    pending_referrals = db.referrals.count_documents({
        "toFacility": hospital_name, "status": {"$nin": ["COMPLETED", "CANCELLED"]}
    })
    occupancy_ratio = resources["beds_occupied"] / resources["beds_total"] if resources["beds_total"] else 0
    icu_ratio = resources["icu_occupied"] / resources["icu_total"] if resources["icu_total"] else 0

    notes = []
    if pending_referrals:
        notes.append(f"{pending_referrals} referral(s) currently pending arrival at this hospital — "
                      f"expect additional OPD/bed demand if they arrive as scheduled.")
    if occupancy_ratio >= 0.85:
        notes.append("Bed occupancy is already high — limited spare capacity for new admissions.")
    if icu_ratio >= 0.8:
        notes.append("ICU occupancy is high — consider coordinating ICU transfers in advance.")
    if not notes:
        notes.append("No unusual demand signals detected from current data.")

    predicted_bed_demand = resources["beds_occupied"] + min(pending_referrals, resources["beds_total"] - resources["beds_occupied"])
    return {"pending_referrals": pending_referrals, "predicted_bed_demand": predicted_bed_demand, "notes": notes}


@hospital_resources_bp.route("/")
@login_required(role="hospital")
def dashboard():
    db = get_db()
    hid = session.get("hospital_id")
    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})
    resources = db.hospital_resources.find_one({"hospital_id": hid})
    if not resources:
        resources = dict(DEFAULT_RESOURCES)
        resources["hospital_id"] = hid
        resources["updated_at"] = datetime.utcnow()
        resources["is_demo_data"] = True
        db.hospital_resources.insert_one(dict(resources))

    blood_bank = db.blood_banks.find_one({"facility": hospital["hospital_name"]}) if hospital else None
    prediction = _predict_load(db, hid, hospital["hospital_name"] if hospital else "", resources)

    return render_template("hospital_resources.html", hospital=hospital, resources=resources,
                            blood_bank=blood_bank, prediction=prediction)


@hospital_resources_bp.route("/update", methods=["POST"])
@login_required(role="hospital")
def update():
    db = get_db()
    hid = session.get("hospital_id")
    form = request.form

    def to_int(key, default=0):
        try:
            return int(form.get(key, default))
        except (TypeError, ValueError):
            return default

    update_doc = {
        "beds_total": to_int("beds_total"), "beds_occupied": to_int("beds_occupied"),
        "icu_total": to_int("icu_total"), "icu_occupied": to_int("icu_occupied"),
        "ot_total": to_int("ot_total"), "ot_available": to_int("ot_available"),
        "doctors_on_duty": to_int("doctors_on_duty"),
        "opd_queue_length": to_int("opd_queue_length"),
        "emergency_load": form.get("emergency_load", "MEDIUM"),
        "ambulances_total": to_int("ambulances_total"), "ambulances_available": to_int("ambulances_available"),
        "updated_at": datetime.utcnow(),
        "is_demo_data": False,
    }
    db.hospital_resources.update_one({"hospital_id": hid}, {"$set": update_doc}, upsert=True)
    flash("Hospital resource status updated.", "success")
    return redirect(url_for("hospital_resources.dashboard"))
