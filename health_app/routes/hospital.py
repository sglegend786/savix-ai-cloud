from datetime import datetime

from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort)
from bson.objectid import ObjectId

from utils.decorators import login_required
from utils.recommendation import score_hospitals
from utils.queue import (get_or_assign_token, get_queue, queue_position,
                          estimated_wait_minutes, call_next, mark_completed)
from utils.geo import valid_latitude, valid_longitude, valid_pincode
from utils.image_upload import validate_and_save_image, delete_image
from config import Config

hospital_bp = Blueprint("hospital", __name__, url_prefix="/hospital")


def get_db():
    return current_app.db


def current_hospital_id():
    return session.get("hospital_id")


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@hospital_bp.route("/dashboard")
@login_required(role="hospital")
def dashboard():
    db = get_db()
    hid = current_hospital_id()
    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})

    doctor_count = db.doctors.count_documents({"hospital_id": hid})
    dept_count = db.departments.count_documents({"hospital_id": hid})
    appt_count = db.appointments.count_documents({"hospital_id": hid})
    pending_appts = list(db.appointments.find(
        {"hospital_id": hid, "status": "Pending"}).sort("date", 1).limit(5))

    return render_template("hospital_dashboard.html", hospital=hospital,
                            doctor_count=doctor_count, dept_count=dept_count,
                            appt_count=appt_count, pending_appts=pending_appts)


# ---------------------------------------------------------------------------
# My Hospital Profile
# ---------------------------------------------------------------------------

@hospital_bp.route("/profile", methods=["GET", "POST"])
@login_required(role="hospital")
def profile():
    db = get_db()
    hid = current_hospital_id()

    if request.method == "POST":
        form = request.form
        lat = form.get("latitude", "").strip()
        lng = form.get("longitude", "").strip()
        pincode = form.get("pincode", "").strip()

        # Location validation - reject invalid coordinates rather than storing them
        if lat and not valid_latitude(lat):
            flash("Latitude must be between -90 and 90.", "danger")
            return redirect(url_for("hospital.profile"))
        if lng and not valid_longitude(lng):
            flash("Longitude must be between -180 and 180.", "danger")
            return redirect(url_for("hospital.profile"))
        if pincode and not valid_pincode(pincode):
            flash("Pincode must be 5 or 6 digits.", "danger")
            return redirect(url_for("hospital.profile"))

        update = {
            "hospital_name": form.get("hospital_name", "").strip(),
            "phone": form.get("phone", "").strip(),
            "address": form.get("address", "").strip(),
            "city": form.get("city", "").strip(),
            "state": form.get("state", "").strip(),
            "pincode": pincode,
            "latitude": lat,
            "longitude": lng,
            "distance_km": float(form.get("distance_km") or 5.0),
            "hospital_type": form.get("hospital_type", "Multi-Specialty"),
            "emergency": form.get("emergency") == "on",
            "available_247": form.get("available_247") == "on",
            "avg_cost": float(form.get("avg_cost") or 1000),
            "facilities": [f.strip() for f in form.get("facilities", "").split(",") if f.strip()],
        }
        db.hospitals.update_one({"_id": ObjectId(hid)}, {"$set": update})
        flash("Hospital profile updated.", "success")
        return redirect(url_for("hospital.profile"))

    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})
    gallery = list(db.hospital_images.find({"hospital_id": hid}).sort("uploaded_at", -1))
    return render_template("hospital_profile.html", hospital=hospital, gallery=gallery)


# ---------------------------------------------------------------------------
# Hospital image management (upload / replace / delete)
# ---------------------------------------------------------------------------

@hospital_bp.route("/image/upload", methods=["POST"])
@login_required(role="hospital")
def upload_hospital_image():
    db = get_db()
    hid = current_hospital_id()
    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})
    image_kind = request.form.get("image_kind", "profile")  # profile | logo | gallery

    filename, error = validate_and_save_image(
        request.files.get("image"), Config.HOSPITAL_IMAGE_FOLDER, prefix=f"h{hid}_")
    if error:
        flash(error, "danger")
        return redirect(url_for("hospital.profile"))

    if image_kind == "gallery":
        db.hospital_images.insert_one({
            "hospital_id": hid, "filename": filename, "status": "Pending",
            "uploaded_at": datetime.utcnow(),
        })
        flash("Gallery image uploaded and is awaiting admin approval.", "success")
    else:
        field = "logo_filename" if image_kind == "logo" else "image_filename"
        old = hospital.get(field)
        db.hospitals.update_one({"_id": ObjectId(hid)}, {"$set": {
            field: filename,
            "image_url": url_for("media.hospital_image", filename=filename) if image_kind == "profile" else hospital.get("image_url"),
            "image_status": "Pending" if image_kind == "profile" else hospital.get("image_status"),
        }})
        if old:
            delete_image(Config.HOSPITAL_IMAGE_FOLDER, old)
        flash("Image uploaded and is awaiting admin approval.", "success")

    return redirect(url_for("hospital.profile"))


@hospital_bp.route("/image/delete", methods=["POST"])
@login_required(role="hospital")
def delete_hospital_image():
    db = get_db()
    hid = current_hospital_id()
    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})
    image_kind = request.form.get("image_kind", "profile")
    gallery_id = request.form.get("gallery_id", "")

    if image_kind == "gallery" and gallery_id:
        img = db.hospital_images.find_one({"_id": ObjectId(gallery_id), "hospital_id": hid})
        if not img:
            abort(403)
        delete_image(Config.HOSPITAL_IMAGE_FOLDER, img["filename"])
        db.hospital_images.delete_one({"_id": ObjectId(gallery_id)})
    else:
        field = "logo_filename" if image_kind == "logo" else "image_filename"
        old = hospital.get(field)
        if old:
            delete_image(Config.HOSPITAL_IMAGE_FOLDER, old)
        unset = {field: "", "image_status": ""} if image_kind == "profile" else {field: ""}
        db.hospitals.update_one({"_id": ObjectId(hid)}, {"$unset": unset})
        if image_kind == "profile":
            db.hospitals.update_one({"_id": ObjectId(hid)},
                                     {"$set": {"image_url": "/static/images/hospital_default.jpg"}})

    flash("Image deleted.", "info")
    return redirect(url_for("hospital.profile"))


# ---------------------------------------------------------------------------
# Departments (hospital-scoped, admin only)
# ---------------------------------------------------------------------------

@hospital_bp.route("/departments", methods=["GET", "POST"])
@login_required(role="hospital")
def departments():
    db = get_db()
    hid = current_hospital_id()

    if request.method == "POST":
        form = request.form
        name = form.get("name", "").strip()
        if not name:
            flash("Department name is required.", "danger")
            return redirect(url_for("hospital.departments"))
        if db.departments.find_one({"hospital_id": hid, "name": name}):
            flash(f"A department named '{name}' already exists.", "danger")
            return redirect(url_for("hospital.departments"))

        db.departments.insert_one({
            "hospital_id": hid,
            "name": name,
            "description": form.get("description", "").strip(),
            "specialist_type": form.get("specialist_type", "").strip(),
            "timings": form.get("timings", "").strip(),
            "contact": form.get("contact", "").strip(),
            "status": form.get("status", "Active"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        flash(f"Department '{name}' added.", "success")
        return redirect(url_for("hospital.departments"))

    dept_list = list(db.departments.find({"hospital_id": hid}))
    for d in dept_list:
        d["doctor_count"] = db.doctors.count_documents(
            {"hospital_id": hid, "department": d["name"]})
    return render_template("hospital_departments.html", departments=dept_list)


@hospital_bp.route("/departments/edit/<dept_id>", methods=["POST"])
@login_required(role="hospital")
def edit_department(dept_id):
    db = get_db()
    hid = current_hospital_id()
    dept = db.departments.find_one({"_id": ObjectId(dept_id), "hospital_id": hid})
    if not dept:
        abort(403)  # cannot edit another hospital's department

    form = request.form
    new_name = form.get("name", "").strip() or dept["name"]
    db.departments.update_one({"_id": ObjectId(dept_id)}, {"$set": {
        "name": new_name,
        "description": form.get("description", "").strip(),
        "specialist_type": form.get("specialist_type", "").strip(),
        "timings": form.get("timings", "").strip(),
        "contact": form.get("contact", "").strip(),
        "status": form.get("status", dept.get("status", "Active")),
        "updated_at": datetime.utcnow(),
    }})
    # Keep doctors' department label in sync if the name changed
    if new_name != dept["name"]:
        db.doctors.update_many({"hospital_id": hid, "department": dept["name"]},
                                {"$set": {"department": new_name}})
    flash("Department updated.", "success")
    return redirect(url_for("hospital.departments"))


@hospital_bp.route("/departments/toggle/<dept_id>", methods=["POST"])
@login_required(role="hospital")
def toggle_department(dept_id):
    db = get_db()
    hid = current_hospital_id()
    dept = db.departments.find_one({"_id": ObjectId(dept_id), "hospital_id": hid})
    if not dept:
        abort(403)
    new_status = "Inactive" if dept.get("status", "Active") == "Active" else "Active"
    db.departments.update_one({"_id": ObjectId(dept_id)},
                               {"$set": {"status": new_status, "updated_at": datetime.utcnow()}})
    flash(f"Department marked {new_status}.", "info")
    return redirect(url_for("hospital.departments"))


@hospital_bp.route("/departments/delete/<dept_id>", methods=["POST"])
@login_required(role="hospital")
def delete_department(dept_id):
    db = get_db()
    hid = current_hospital_id()
    # Backend check: department MUST belong to this hospital
    dept = db.departments.find_one({"_id": ObjectId(dept_id), "hospital_id": hid})
    if not dept:
        abort(403)
    db.departments.delete_one({"_id": ObjectId(dept_id)})
    flash("Department removed.", "info")
    return redirect(url_for("hospital.departments"))


# ---------------------------------------------------------------------------
# Facilities
# ---------------------------------------------------------------------------

@hospital_bp.route("/facilities", methods=["GET", "POST"])
@login_required(role="hospital")
def facilities():
    db = get_db()
    hid = current_hospital_id()
    hospital = db.hospitals.find_one({"_id": ObjectId(hid)})

    if request.method == "POST":
        facility = request.form.get("facility", "").strip()
        if facility:
            db.hospitals.update_one({"_id": ObjectId(hid)},
                                     {"$addToSet": {"facilities": facility}})
            flash(f"Facility '{facility}' added.", "success")
        return redirect(url_for("hospital.facilities"))

    return render_template("hospital_facilities.html", hospital=hospital)


@hospital_bp.route("/facilities/remove", methods=["POST"])
@login_required(role="hospital")
def remove_facility():
    db = get_db()
    hid = current_hospital_id()
    facility = request.form.get("facility", "")
    db.hospitals.update_one({"_id": ObjectId(hid)}, {"$pull": {"facilities": facility}})
    flash("Facility removed.", "info")
    return redirect(url_for("hospital.facilities"))


# ---------------------------------------------------------------------------
# Appointments management (hospital side)
# ---------------------------------------------------------------------------

@hospital_bp.route("/appointments")
@login_required(role="hospital")
def manage_appointments():
    db = get_db()
    hid = current_hospital_id()
    appts = list(db.appointments.find({"hospital_id": hid}).sort("date", -1))
    return render_template("hospital_appointments.html", appointments=appts)


@hospital_bp.route("/appointments/update/<appt_id>", methods=["POST"])
@login_required(role="hospital")
def update_appointment_status(appt_id):
    db = get_db()
    hid = current_hospital_id()
    # Backend check: appointment must belong to THIS hospital
    appt = db.appointments.find_one({"_id": ObjectId(appt_id), "hospital_id": hid})
    if not appt:
        abort(403)
    new_status = request.form.get("status")
    if new_status in ("Pending", "Confirmed", "Completed", "Cancelled"):
        db.appointments.update_one({"_id": ObjectId(appt_id)}, {"$set": {"status": new_status}})
        if new_status == "Confirmed":
            get_or_assign_token(db, appt_id)
        if new_status == "Cancelled":
            db.appointments.update_one({"_id": ObjectId(appt_id)}, {"$set": {"queue_status": "CANCELLED"}})
        flash("Appointment status updated.", "success")
    return redirect(url_for("hospital.manage_appointments"))


# ---------------------------------------------------------------------------
# Live Queue / Token system
# ---------------------------------------------------------------------------

@hospital_bp.route("/queue")
@login_required(role="hospital")
def live_queue():
    db = get_db()
    hid = current_hospital_id()
    date = request.args.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    tokens = get_queue(db, hid, date)
    for t in tokens:
        t["position"] = queue_position(db, t)
        t["wait_minutes"] = estimated_wait_minutes(t["position"])
    return render_template("hospital_queue.html", tokens=tokens, date=date)


@hospital_bp.route("/queue/call-next", methods=["POST"])
@login_required(role="hospital")
def queue_call_next():
    db = get_db()
    hid = current_hospital_id()
    date = request.form.get("date") or datetime.utcnow().strftime("%Y-%m-%d")
    nxt = call_next(db, hid, date)
    if nxt:
        flash(f"Token {nxt['token_number']} ({nxt.get('user_name','')}) called in.", "success")
    else:
        flash("No patients waiting in the queue.", "info")
    return redirect(url_for("hospital.live_queue", date=date))


@hospital_bp.route("/queue/<appt_id>/complete", methods=["POST"])
@login_required(role="hospital")
def queue_complete(appt_id):
    db = get_db()
    hid = current_hospital_id()
    appt = db.appointments.find_one({"_id": ObjectId(appt_id), "hospital_id": hid})
    if not appt:
        abort(403)
    mark_completed(db, appt_id)
    flash(f"Token {appt.get('token_number')} marked completed.", "success")
    return redirect(url_for("hospital.live_queue", date=appt.get("date")))


# ---------------------------------------------------------------------------
# Patient reports relevant to this hospital's appointments
# ---------------------------------------------------------------------------

@hospital_bp.route("/patient-reports")
@login_required(role="hospital")
def patient_reports():
    db = get_db()
    hid = current_hospital_id()
    # Only patients who have an appointment at this hospital are visible
    patient_ids = db.appointments.distinct("user_id", {"hospital_id": hid})
    reports = list(db.reports.find({"user_id": {"$in": patient_ids}}).sort("upload_date", -1))
    # attach patient names
    for r in reports:
        patient = db.users.find_one({"_id": ObjectId(r["user_id"])})
        r["patient_name"] = patient["name"] if patient else "Unknown"
    return render_template("hospital_patient_reports.html", reports=reports)
