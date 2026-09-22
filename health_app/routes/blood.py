"""
Smart Blood Finder + Dynamic Blood Network.

Real, backend-driven: search registered blood banks by blood group and
location, create emergency blood requests, and progress each request
through REQUESTED -> RESERVED -> DISPATCHED -> RECEIVED.
"""

from datetime import datetime

from bson.objectid import ObjectId
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app, abort

from utils.decorators import login_required

blood_bp = Blueprint("blood", __name__, url_prefix="/blood")

BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]
REQUEST_STATUSES = ["REQUESTED", "RESERVED", "DISPATCHED", "RECEIVED"]


def get_db():
    return current_app.db


@blood_bp.route("/")
@login_required(role=("health_worker", "user", "hospital"))
def search():
    db = get_db()
    group = request.args.get("group", "")
    urgency = request.args.get("urgency", "")

    query = {}
    if group:
        query[f"stock.{group}"] = {"$gt": 0}

    banks = list(db.blood_banks.find(query).sort("distance_km", 1))
    return render_template("blood_search.html", banks=banks, group=group, urgency=urgency,
                            groups=BLOOD_GROUPS)


@blood_bp.route("/request", methods=["POST"])
@login_required(role=("health_worker", "user", "hospital"))
def create_request():
    db = get_db()
    form = request.form
    bank_id = form.get("bank_id", "")
    bank = db.blood_banks.find_one({"_id": ObjectId(bank_id)}) if bank_id else None

    doc = {
        "blood_group": form.get("blood_group", ""),
        "urgency": form.get("urgency", "Normal"),
        "patient_name": form.get("patient_name", "").strip(),
        "requested_by_role": session.get("role"),
        "requested_by_name": session.get("name") or session.get("hospital_name", ""),
        "bank_id": bank_id,
        "bank_name": bank["bank_name"] if bank else form.get("bank_name", ""),
        "hospital_context": session.get("facility", "") or session.get("hospital_name", ""),
        "status": "REQUESTED",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    db.blood_requests.insert_one(doc)
    flash("Blood request submitted.", "success")
    return redirect(url_for("blood.requests_list"))


@blood_bp.route("/requests")
@login_required(role=("health_worker", "user", "hospital"))
def requests_list():
    db = get_db()
    role = session.get("role")
    query = {}
    if role == "health_worker":
        query["requested_by_name"] = session.get("name")
    reqs = list(db.blood_requests.find(query).sort("createdAt", -1))
    return render_template("blood_requests.html", requests=reqs, statuses=REQUEST_STATUSES)


@blood_bp.route("/requests/<request_id>/status", methods=["POST"])
@login_required(role=("health_worker", "hospital"))
def update_request_status(request_id):
    db = get_db()
    new_status = request.form.get("status", "")
    if new_status not in REQUEST_STATUSES:
        flash("Invalid status.", "danger")
        return redirect(url_for("blood.requests_list"))

    req = db.blood_requests.find_one({"_id": ObjectId(request_id)})
    if not req:
        abort(404)

    update = {"status": new_status, "updatedAt": datetime.utcnow()}
    db.blood_requests.update_one({"_id": ObjectId(request_id)}, {"$set": update})

    # Reduce blood bank stock only when actually dispatched, to reflect real usage.
    if new_status == "DISPATCHED" and req.get("bank_id"):
        db.blood_banks.update_one(
            {"_id": ObjectId(req["bank_id"]), f"stock.{req['blood_group']}": {"$gt": 0}},
            {"$inc": {f"stock.{req['blood_group']}": -1}, "$set": {"last_updated": datetime.utcnow()}}
        )

    flash("Blood request status updated.", "success")
    return redirect(url_for("blood.requests_list"))
