"""
JSON API blueprint.

- GET  /api/health                      -> backend reachability check (used by
                                            the offline-first frontend, not just navigator.onLine)
- POST /api/referrals                    -> create a referral
- GET  /api/referrals                    -> list referrals (scoped to the caller)
- GET  /api/referrals/<id>               -> referral detail
- PUT  /api/referrals/<id>/status        -> update referral status
- GET  /api/patient/<id>/referrals       -> a patient's referral history
- POST /api/offline/sync                 -> idempotent sync of offline-queued
                                            Health Worker records (patients,
                                            vitals, symptoms, triage, referrals,
                                            follow-ups) into MongoDB
"""

from datetime import datetime

from bson.objectid import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, request, session, current_app

from utils.decorators import api_login_required
from utils.care_records import create_visit, create_referral, update_referral_status, REFERRAL_STATUSES
from utils.voice_intake import extract_structured_intake

api_bp = Blueprint("api", __name__, url_prefix="/api")


def get_db():
    return current_app.db


def _referral_json(r):
    return {
        "id": str(r["_id"]),
        "referralId": r.get("referralId"),
        "patientId": r.get("patientId"),
        "patientName": r.get("patientName"),
        "fromFacility": r.get("fromFacility"),
        "toFacility": r.get("toFacility"),
        "specialist": r.get("specialist"),
        "reason": r.get("reason"),
        "priority": r.get("priority"),
        "appointmentDate": r.get("appointmentDate"),
        "status": r.get("status"),
        "followUpDate": r.get("followUpDate"),
        "notes": r.get("notes"),
        "createdAt": r["createdAt"].isoformat() if r.get("createdAt") else None,
        "updatedAt": r["updatedAt"].isoformat() if r.get("updatedAt") else None,
    }


# ---------------------------------------------------------------------------
# Health check — used by the frontend network-detection logic. A device can
# be technically "online" (navigator.onLine) but unable to reach this
# backend (captive portal, server down, etc.), so the client polls this too.
# ---------------------------------------------------------------------------

@api_bp.route("/health")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


# ---------------------------------------------------------------------------
# Multilingual Voice AI - structured intake extraction (English/Hindi)
# ---------------------------------------------------------------------------

@api_bp.route("/voice-intake", methods=["POST"])
@api_login_required(role="health_worker")
def voice_intake():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"success": False, "error": "No speech text provided."}), 400
    structured = extract_structured_intake(text)
    return jsonify({"success": True, "structured": structured})


# ---------------------------------------------------------------------------
# Referrals
# ---------------------------------------------------------------------------

@api_bp.route("/referrals", methods=["POST"])
@api_login_required(role="health_worker")
def api_create_referral():
    db = get_db()
    data = request.get_json(silent=True) or {}
    referral, created = create_referral(
        db, data, worker_id=session.get("worker_id"), worker_name=session.get("name"))
    return jsonify({"success": True, "created": created, "referral": _referral_json(referral)}), 201


@api_bp.route("/referrals", methods=["GET"])
@api_login_required(role=("health_worker", "hospital"))
def api_list_referrals():
    db = get_db()
    query = {}
    if session.get("role") == "health_worker":
        query["healthWorkerId"] = session.get("worker_id")
    else:
        hospital = db.hospitals.find_one({"_id": ObjectId(session.get("hospital_id"))})
        query["toFacility"] = hospital["hospital_name"] if hospital else ""

    status = request.args.get("status")
    priority = request.args.get("priority")
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    referrals = list(db.referrals.find(query).sort("createdAt", -1))
    return jsonify({"success": True, "referrals": [_referral_json(r) for r in referrals]})


@api_bp.route("/referrals/<referral_id>", methods=["GET"])
@api_login_required(role=("health_worker", "hospital"))
def api_get_referral(referral_id):
    db = get_db()
    try:
        referral = db.referrals.find_one({"_id": ObjectId(referral_id)})
    except InvalidId:
        return jsonify({"success": False, "error": "Invalid referral id."}), 400
    if not referral:
        return jsonify({"success": False, "error": "Referral not found."}), 404
    return jsonify({"success": True, "referral": _referral_json(referral)})


@api_bp.route("/referrals/<referral_id>/status", methods=["PUT"])
@api_login_required(role=("health_worker", "hospital"))
def api_update_referral_status(referral_id):
    db = get_db()
    data = request.get_json(silent=True) or {}
    status = data.get("status", "")
    if status not in REFERRAL_STATUSES:
        return jsonify({"success": False, "error": f"status must be one of {REFERRAL_STATUSES}"}), 400
    ok = update_referral_status(db, referral_id, status, data.get("note"))
    if not ok:
        return jsonify({"success": False, "error": "Update failed."}), 400
    referral = db.referrals.find_one({"_id": ObjectId(referral_id)})
    return jsonify({"success": True, "referral": _referral_json(referral)})


@api_bp.route("/patient/<patient_id>/referrals", methods=["GET"])
@api_login_required(role=("health_worker", "hospital"))
def api_patient_referrals(patient_id):
    db = get_db()
    referrals = list(db.referrals.find({"patientId": patient_id}).sort("createdAt", -1))
    return jsonify({"success": True, "referrals": [_referral_json(r) for r in referrals]})


# ---------------------------------------------------------------------------
# Offline sync
# ---------------------------------------------------------------------------

@api_bp.route("/offline/sync", methods=["POST"])
@api_login_required(role="health_worker")
def offline_sync():
    """Accepts a batch of offline-queued Health Worker records and stores
    them in MongoDB. Idempotent: each record carries a unique localId, and
    resubmitting the same localId (e.g. a retried sync after a dropped
    connection) will never create a duplicate visit or referral.
    """
    db = get_db()
    wid = session.get("worker_id")
    name = session.get("name")
    facility = session.get("facility", "")

    payload = request.get_json(silent=True) or {}
    records = payload.get("records", [])

    results = []
    synced = 0
    failed = 0

    for record in records:
        local_id = record.get("localId")
        record_type = record.get("recordType", "visit")
        # Records are wrapped as {localId, recordType, patientId, data:{...}, ...}.
        # Fall back to the record itself for older/flat-shaped visit records.
        data = record.get("data", record)

        try:
            if record_type == "referral":
                patient_id = record.get("patientId") or data.get("patientId")
                patient = db.care_patients.find_one({"_id": ObjectId(patient_id)}) if patient_id else None
                ref_data = {
                    "patientId": patient_id,
                    "patientName": patient["name"] if patient else data.get("patientName", ""),
                    "fromFacility": facility,
                    "toFacility": data.get("toFacility", ""),
                    "specialist": data.get("specialist", ""),
                    "reason": data.get("reason", ""),
                    "symptoms": data.get("symptoms", []),
                    "priority": data.get("priority", "Medium"),
                    "appointmentDate": data.get("appointmentDate", ""),
                    "expectedArrivalDate": data.get("expectedArrivalDate", ""),
                    "followUpDate": data.get("followUpDate", ""),
                    "notes": data.get("notes", ""),
                    "visitId": data.get("visitId"),
                }
                referral_doc, is_new = create_referral(
                    db, ref_data, worker_id=wid, worker_name=name, idempotency_key=local_id)
                synced += 1
                results.append({
                    "localId": local_id, "success": True, "isNew": is_new,
                    "referralId": referral_doc["referralId"],
                })
                continue

            # --- visit record (default) ---
            visit_record = {
                "localId": local_id,
                "patient": data.get("patient", {}),
                "vitals": data.get("vitals", {}),
                "symptoms": data.get("symptoms", {}),
                "followUp": data.get("followUp", {}),
            }
            visit_doc, is_new = create_visit(db, visit_record, wid, name, facility, source="offline")

            referral_info = None
            referral_block = data.get("referral") or {}
            if referral_block.get("required") or referral_block.get("create"):
                ref_key = f"{local_id}-referral" if local_id else None
                patient = db.care_patients.find_one({"_id": ObjectId(visit_doc["patient_id"])})
                ref_data = {
                    "patientId": visit_doc["patient_id"],
                    "patientName": patient["name"] if patient else visit_doc["patient_snapshot"].get("name", ""),
                    "fromFacility": facility,
                    "toFacility": referral_block.get("toFacility", ""),
                    "specialist": referral_block.get("specialist", ""),
                    "reason": referral_block.get("reason", visit_doc["triage"]["message"]),
                    "priority": referral_block.get("priority", visit_doc["triage"]["priority"].title()),
                    "appointmentDate": referral_block.get("appointmentDate", ""),
                    "expectedArrivalDate": referral_block.get("expectedArrivalDate", ""),
                    "followUpDate": referral_block.get("followUpDate", ""),
                    "notes": referral_block.get("notes", ""),
                    "visitId": str(visit_doc["_id"]),
                }
                referral_doc, _ = create_referral(db, ref_data, worker_id=wid, worker_name=name,
                                                    idempotency_key=ref_key)
                referral_info = referral_doc["referralId"]

            synced += 1
            results.append({
                "localId": local_id, "success": True, "isNew": is_new,
                "visitId": str(visit_doc["_id"]), "referralId": referral_info,
            })
        except Exception as exc:  # keep the batch going even if one record is malformed
            failed += 1
            results.append({"localId": local_id, "success": False, "error": str(exc)})

    return jsonify({"success": True, "synced": synced, "failed": failed, "results": results})
