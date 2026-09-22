from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort)

from utils.decorators import login_required
from utils.care_records import (create_referral, update_referral_status,
                                 compute_referral_alerts, estimate_dropout_risk,
                                 REFERRAL_STATUSES, REFERRAL_STATUS_LABELS,
                                 REFERRAL_TIMELINE_STATUSES)
from utils.audit import log_action

referral_bp = Blueprint("referral", __name__, url_prefix="/referrals")


def get_db():
    return current_app.db


def _patient_for(db, referral):
    pid = referral.get("patientId")
    if not pid:
        return None
    try:
        return db.care_patients.find_one({"_id": ObjectId(pid)})
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Referral Dashboard - health workers see referrals they created,
# hospitals see referrals sent to them (toFacility).
# ---------------------------------------------------------------------------

@referral_bp.route("/")
@login_required(role=("health_worker", "hospital"))
def dashboard():
    db = get_db()
    role = session.get("role")

    query = {}
    if role == "health_worker":
        query["healthWorkerId"] = session.get("worker_id")
    else:
        hospital = db.hospitals.find_one({"_id": ObjectId(session.get("hospital_id"))})
        hospital_name = hospital["hospital_name"] if hospital else ""
        query["toFacility"] = hospital_name

    status = request.args.get("status", "")
    priority = request.args.get("priority", "")
    q = request.args.get("q", "")
    only_alerts = request.args.get("alerts", "")

    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if q:
        query["patientName"] = {"$regex": q, "$options": "i"}

    referrals = list(db.referrals.find(query).sort("createdAt", -1))

    for r in referrals:
        r["alerts"] = compute_referral_alerts(r)

    if only_alerts:
        referrals = [r for r in referrals if r["alerts"]]

    active_count = sum(1 for r in referrals if r["status"] not in ("COMPLETED", "CANCELLED"))
    pending_count = sum(1 for r in referrals if r["status"] == "REFERRED")
    completed_count = sum(1 for r in referrals if r["status"] == "COMPLETED")
    high_priority_count = sum(1 for r in referrals if r["priority"] == "High" and r["status"] not in ("COMPLETED", "CANCELLED"))
    alert_count = sum(1 for r in referrals if r["alerts"])

    return render_template(
        "referrals_dashboard.html", referrals=referrals, statuses=REFERRAL_STATUSES,
        status_labels=REFERRAL_STATUS_LABELS,
        current_status=status, current_priority=priority, q=q, only_alerts=only_alerts,
        active_count=active_count, pending_count=pending_count,
        completed_count=completed_count, high_priority_count=high_priority_count,
        alert_count=alert_count,
    )


@referral_bp.route("/new", methods=["GET", "POST"])
@login_required(role="health_worker")
def create():
    db = get_db()
    wid = session.get("worker_id")
    name = session.get("name")
    facility = session.get("facility", "")

    if request.method == "POST":
        form = request.form
        patient_id = form.get("patientId", "").strip()
        patient = db.care_patients.find_one({"_id": ObjectId(patient_id)}) if patient_id else None
        data = {
            "patientId": patient_id,
            "patientName": patient["name"] if patient else form.get("patientName", "").strip(),
            "fromFacility": facility,
            "toFacility": form.get("toFacility", "").strip(),
            "specialist": form.get("specialist", "").strip(),
            "reason": form.get("reason", "").strip(),
            "symptoms": [s.strip() for s in form.get("symptoms", "").split(",") if s.strip()],
            "priority": form.get("priority", "Medium"),
            "appointmentDate": form.get("appointmentDate", "").strip(),
            "expectedArrivalDate": form.get("expectedArrivalDate", "").strip(),
            "followUpDate": form.get("followUpDate", "").strip(),
            "notes": form.get("notes", "").strip(),
        }
        referral, _ = create_referral(db, data, worker_id=wid, worker_name=name)
        log_action(db, "health_worker", wid, name, "CREATE_REFERRAL", "referral", referral["_id"],
                   details=f"Referred patient to {data.get('toFacility')}")
        flash(f"Referral {referral['referralId']} created.", "success")
        return redirect(url_for("referral.detail", referral_id=str(referral["_id"])))

    patients = list(db.care_patients.find({"registered_by": wid}).sort("name", 1))
    return render_template("referral_create.html", patients=patients)


@referral_bp.route("/<referral_id>")
@login_required(role=("health_worker", "hospital"))
def detail(referral_id):
    db = get_db()
    referral = db.referrals.find_one({"_id": ObjectId(referral_id)})
    if not referral:
        abort(404)
    patient = _patient_for(db, referral)
    alerts = compute_referral_alerts(referral)
    risk = estimate_dropout_risk(referral, patient=patient)
    return render_template(
        "referral_detail.html", referral=referral, statuses=REFERRAL_STATUSES,
        status_labels=REFERRAL_STATUS_LABELS, timeline_statuses=REFERRAL_TIMELINE_STATUSES,
        alerts=alerts, risk=risk,
    )


@referral_bp.route("/<referral_id>/status", methods=["POST"])
@login_required(role=("health_worker", "hospital"))
def set_status(referral_id):
    db = get_db()
    new_status = request.form.get("status", "")
    note = request.form.get("note", "").strip()
    if update_referral_status(db, referral_id, new_status, note):
        log_action(db, session.get("role"), session.get("worker_id") or session.get("hospital_id"),
                   session.get("name") or session.get("hospital_name", ""),
                   "UPDATE_REFERRAL_STATUS", "referral", referral_id, details=f"-> {new_status}")
        flash("Referral status updated.", "success")
    else:
        flash("Invalid status.", "danger")
    return redirect(url_for("referral.detail", referral_id=referral_id))
