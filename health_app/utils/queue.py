"""
Live Queue / Token system for hospital appointments.

Real, DB-backed queue: confirming an appointment assigns a sequential
token number (per hospital, per appointment date). The hospital can call
the next token and mark tokens completed; patients see their live queue
position and an estimated wait time computed from real queue state, not
a static placeholder.
"""

from datetime import datetime

from bson.objectid import ObjectId

QUEUE_STATUSES = ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
MINUTES_PER_PATIENT = 10  # simple, explainable estimate - not a guarantee


def get_or_assign_token(db, appt_id):
    """Assign a token number the first time an appointment is confirmed.
    Idempotent: calling this again on an already-tokened appointment
    returns the existing token rather than re-assigning."""
    appt = db.appointments.find_one({"_id": ObjectId(appt_id)})
    if not appt:
        return None
    if appt.get("token_number"):
        return appt["token_number"]

    existing_count = db.appointments.count_documents({
        "hospital_id": appt["hospital_id"],
        "date": appt.get("date"),
        "token_number": {"$exists": True, "$ne": None},
    })
    token_number = existing_count + 1
    db.appointments.update_one(
        {"_id": ObjectId(appt_id)},
        {"$set": {"token_number": token_number, "queue_status": "WAITING",
                   "queue_updated_at": datetime.utcnow()}}
    )
    return token_number


def get_queue(db, hospital_id, date):
    """All tokened appointments for a hospital on a given date, in token order."""
    return list(db.appointments.find({
        "hospital_id": hospital_id, "date": date,
        "token_number": {"$exists": True, "$ne": None},
    }).sort("token_number", 1))


def queue_position(db, appt):
    """How many WAITING patients are ahead of this one (0 = next up)."""
    if not appt.get("token_number"):
        return None
    return db.appointments.count_documents({
        "hospital_id": appt["hospital_id"], "date": appt.get("date"),
        "queue_status": "WAITING",
        "token_number": {"$lt": appt["token_number"]},
    })


def estimated_wait_minutes(position):
    if position is None:
        return None
    return position * MINUTES_PER_PATIENT


def call_next(db, hospital_id, date):
    """Move the lowest-token WAITING appointment to IN_PROGRESS.
    Any appointment already IN_PROGRESS is completed first (single active
    token per hospital queue for this demo)."""
    current = db.appointments.find_one({
        "hospital_id": hospital_id, "date": date, "queue_status": "IN_PROGRESS",
    })
    if current:
        db.appointments.update_one({"_id": current["_id"]},
                                    {"$set": {"queue_status": "COMPLETED", "status": "Completed",
                                               "queue_updated_at": datetime.utcnow()}})

    nxt = db.appointments.find_one(
        {"hospital_id": hospital_id, "date": date, "queue_status": "WAITING"},
        sort=[("token_number", 1)]
    )
    if nxt:
        db.appointments.update_one({"_id": nxt["_id"]},
                                    {"$set": {"queue_status": "IN_PROGRESS",
                                               "queue_updated_at": datetime.utcnow()}})
    return nxt


def mark_completed(db, appt_id):
    db.appointments.update_one(
        {"_id": ObjectId(appt_id)},
        {"$set": {"queue_status": "COMPLETED", "status": "Completed",
                   "queue_updated_at": datetime.utcnow()}}
    )
