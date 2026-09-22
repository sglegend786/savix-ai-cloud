from datetime import datetime

from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort)
from bson.objectid import ObjectId

from utils.decorators import login_required
from utils.recommendation import rank_doctors
from utils.image_upload import validate_and_save_image, delete_image
from config import Config

doctor_bp = Blueprint("doctor", __name__)


def get_db():
    return current_app.db


# ---------------------------------------------------------------------------
# HOSPITAL ADMIN: manage doctors (own hospital only)
# ---------------------------------------------------------------------------

@doctor_bp.route("/hospital/doctors", methods=["GET", "POST"])
@login_required(role="hospital")
def manage_doctors():
    db = get_db()
    hid = session.get("hospital_id")

    if request.method == "POST":
        form = request.form
        doctor_doc = {
            "hospital_id": hid,
            "name": form.get("name", "").strip(),
            "specialization": form.get("specialization", "").strip(),
            "qualification": form.get("qualification", "").strip(),
            "department": form.get("department", "").strip(),
            "experience_years": int(form.get("experience_years") or 0),
            "rating": float(form.get("rating") or 4.0),
            "consultation_fee": float(form.get("consultation_fee") or 500),
            "available_today": form.get("available_today") == "on",
            "contact_number": form.get("contact_number", "").strip(),
            "description": form.get("description", "").strip(),
            "image_url": form.get("image_url") or "/static/images/doctor_default.jpg",
            "created_at": datetime.utcnow(),
        }
        db.doctors.insert_one(doctor_doc)
        flash(f"Doctor '{doctor_doc['name']}' added.", "success")
        return redirect(url_for("doctor.manage_doctors"))

    doctors = list(db.doctors.find({"hospital_id": hid}))
    departments = list(db.departments.find({"hospital_id": hid}))
    return render_template("hospital_doctors.html", doctors=doctors, departments=departments)


@doctor_bp.route("/hospital/doctors/edit/<doctor_id>", methods=["POST"])
@login_required(role="hospital")
def edit_doctor(doctor_id):
    db = get_db()
    hid = session.get("hospital_id")
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id), "hospital_id": hid})
    if not doctor:
        abort(403)  # cannot edit another hospital's doctor

    form = request.form
    update = {
        "name": form.get("name", "").strip(),
        "specialization": form.get("specialization", "").strip(),
        "qualification": form.get("qualification", "").strip(),
        "department": form.get("department", "").strip(),
        "experience_years": int(form.get("experience_years") or 0),
        "rating": float(form.get("rating") or 4.0),
        "consultation_fee": float(form.get("consultation_fee") or 500),
        "available_today": form.get("available_today") == "on",
        "contact_number": form.get("contact_number", "").strip(),
        "description": form.get("description", "").strip(),
    }
    db.doctors.update_one({"_id": ObjectId(doctor_id)}, {"$set": update})
    flash("Doctor details updated.", "success")
    return redirect(url_for("doctor.manage_doctors"))


@doctor_bp.route("/hospital/doctors/delete/<doctor_id>", methods=["POST"])
@login_required(role="hospital")
def delete_doctor(doctor_id):
    db = get_db()
    hid = session.get("hospital_id")
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id), "hospital_id": hid})
    if not doctor:
        abort(403)
    db.doctors.delete_one({"_id": ObjectId(doctor_id)})
    flash("Doctor removed.", "info")
    return redirect(url_for("doctor.manage_doctors"))


@doctor_bp.route("/hospital/doctors/image/<doctor_id>", methods=["POST"])
@login_required(role="hospital")
def upload_doctor_image(doctor_id):
    db = get_db()
    hid = session.get("hospital_id")
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id), "hospital_id": hid})
    if not doctor:
        abort(403)  # cannot upload for another hospital's doctor

    filename, error = validate_and_save_image(
        request.files.get("image"), Config.DOCTOR_IMAGE_FOLDER, prefix=f"d{doctor_id}_")
    if error:
        flash(error, "danger")
        return redirect(url_for("doctor.manage_doctors"))

    old = doctor.get("image_filename")
    db.doctors.update_one({"_id": ObjectId(doctor_id)}, {"$set": {
        "image_filename": filename,
        "image_url": url_for("media.doctor_image", filename=filename),
        "image_status": "Pending",
    }})
    if old:
        delete_image(Config.DOCTOR_IMAGE_FOLDER, old)
    flash("Doctor photograph uploaded and is awaiting admin approval.", "success")
    return redirect(url_for("doctor.manage_doctors"))


@doctor_bp.route("/hospital/doctors/image/delete/<doctor_id>", methods=["POST"])
@login_required(role="hospital")
def delete_doctor_image(doctor_id):
    db = get_db()
    hid = session.get("hospital_id")
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id), "hospital_id": hid})
    if not doctor:
        abort(403)
    if doctor.get("image_filename"):
        delete_image(Config.DOCTOR_IMAGE_FOLDER, doctor["image_filename"])
    db.doctors.update_one({"_id": ObjectId(doctor_id)}, {
        "$unset": {"image_filename": "", "image_status": ""},
        "$set": {"image_url": "/static/images/doctor_default.jpg"},
    })
    flash("Doctor photograph deleted.", "info")
    return redirect(url_for("doctor.manage_doctors"))


# ---------------------------------------------------------------------------
# PUBLIC / USER: browse, compare, best doctor
# ---------------------------------------------------------------------------

@doctor_bp.route("/doctors")
@login_required()
def list_doctors():
    db = get_db()
    q = request.args.get("q", "").strip()
    department = request.args.get("department", "").strip()
    specialization = request.args.get("specialization", "").strip()
    hospital_filter = request.args.get("hospital", "").strip()
    sort_by = request.args.get("sort", "")

    query = {}
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    if department:
        query["department"] = department
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if hospital_filter:
        query["hospital_id"] = hospital_filter

    doctors = list(db.doctors.find(query))
    for d in doctors:
        try:
            hosp = db.hospitals.find_one({"_id": ObjectId(d["hospital_id"])})
        except Exception:
            hosp = None
        d["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown Hospital"

    if sort_by == "name":
        doctors.sort(key=lambda d: d.get("name", "").lower())
    elif sort_by == "rating":
        doctors.sort(key=lambda d: d.get("rating", 0), reverse=True)
    elif sort_by == "availability":
        doctors.sort(key=lambda d: not d.get("available_today"))

    departments = sorted([d for d in db.doctors.distinct("department") if d])
    all_hospitals = list(db.hospitals.find({}, {"hospital_name": 1}))

    return render_template("doctors.html", doctors=doctors, departments=departments,
                            selected_department=department, q=q,
                            specialization=specialization, hospital_filter=hospital_filter,
                            sort_by=sort_by, all_hospitals=all_hospitals)


@doctor_bp.route("/doctors/<doctor_id>")
@login_required()
def doctor_detail(doctor_id):
    db = get_db()
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        abort(404)
    hosp = db.hospitals.find_one({"_id": ObjectId(doctor["hospital_id"])})
    doctor["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown Hospital"
    return render_template("doctor_detail.html", doctor=doctor, hospital=hosp)


@doctor_bp.route("/doctors/compare")
@login_required()
def compare_doctors():
    db = get_db()
    department = request.args.get("department")
    all_doctors = list(db.doctors.find())
    ranked = rank_doctors(all_doctors, department=department)
    for d in ranked:
        hosp = db.hospitals.find_one({"_id": ObjectId(d["hospital_id"])})
        d["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown Hospital"
    departments = db.doctors.distinct("department")
    return render_template("compare_doctors.html", doctors=ranked, departments=departments,
                            selected_department=department)


@doctor_bp.route("/doctors/best")
@login_required()
def best_doctor():
    db = get_db()
    department = request.args.get("department")
    all_doctors = list(db.doctors.find())
    ranked = rank_doctors(all_doctors, department=department)
    top = ranked[0] if ranked else None
    if top:
        hosp = db.hospitals.find_one({"_id": ObjectId(top["hospital_id"])})
        top["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown Hospital"
    departments = db.doctors.distinct("department")
    return render_template("best_doctor.html", doctor=top, departments=departments,
                            selected_department=department)
