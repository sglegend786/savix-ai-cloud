"""
Admin console: image approval/rejection and hospital/doctor verification.

Admins are stored in the `admins` collection and use the same
session-based auth pattern as the other roles. Verification is NEVER
automatic - a human admin must explicitly mark a profile verified.
"""

from datetime import datetime

from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort)
from werkzeug.security import check_password_hash

from config import Config
from utils.decorators import login_required
from utils.image_upload import delete_image
from utils.audit import log_action
from werkzeug.security import generate_password_hash

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def get_db():
    return current_app.db


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# One-time bootstrap: create the very first System Admin account.
# Deliberately has no ongoing public registration - this route only works
# while zero admin accounts exist anywhere in the system, then locks
# itself permanently (further admins must be created by an existing admin,
# which is out of scope for this demo but the collection/roles support it).
# ---------------------------------------------------------------------------

@admin_bp.route("/register", methods=["GET", "POST"])
def register():
    db = get_db()
    if db.admins.count_documents({}) > 0:
        flash("A System Admin account already exists. Please log in instead.", "info")
        return redirect(url_for("admin.login"))

    if request.method == "POST":
        form = request.form
        name = form.get("name", "").strip()
        email = form.get("email", "").strip().lower()
        password = form.get("password", "")

        if not (name and email and password):
            flash("Name, email and password are required.", "danger")
            return render_template("admin_register.html")
        if len(password) < 6:
            flash("Password must be at least 6 characters.", "danger")
            return render_template("admin_register.html")

        # Re-check right before insert to avoid a race between two people
        # loading this one-time form at the same moment.
        if db.admins.count_documents({}) > 0:
            flash("A System Admin account already exists. Please log in instead.", "info")
            return redirect(url_for("admin.login"))

        db.admins.insert_one({
            "name": name,
            "email": email,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow(),
            "role": "admin",
        })
        flash("System Admin account created. Please log in.", "success")
        return redirect(url_for("admin.login"))

    return render_template("admin_register.html")


@admin_bp.route("/login", methods=["GET", "POST"])
def login():
    db = get_db()
    no_admin_exists = db.admins.count_documents({}) == 0

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        admin = db.admins.find_one({"email": email})
        if not admin or not check_password_hash(admin["password_hash"], password):
            flash("Invalid email or password.", "danger")
            return render_template("login.html", role="admin", no_admin_exists=no_admin_exists)

        _lang = session.get("lang")
        session.clear()
        session.permanent = True
        if _lang:
            session["lang"] = _lang
        session["role"] = "admin"
        session["admin_id"] = str(admin["_id"])
        session["name"] = admin.get("name", "Administrator")
        if admin.get("preferred_language"):
            session["lang"] = admin["preferred_language"]
        flash(f"Welcome back, {session['name']}!", "success")
        return redirect(url_for("admin.dashboard"))

    return render_template("login.html", role="admin", no_admin_exists=no_admin_exists)


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@admin_bp.route("/dashboard")
@login_required(role="admin")
def dashboard():
    db = get_db()
    pending_hospital_images = db.hospitals.count_documents({"image_status": "Pending"})
    pending_doctor_images = db.doctors.count_documents({"image_status": "Pending"})
    pending_gallery = db.hospital_images.count_documents({"status": "Pending"})
    return render_template(
        "admin_dashboard.html",
        hospital_count=db.hospitals.count_documents({}),
        doctor_count=db.doctors.count_documents({}),
        verified_hospitals=db.hospitals.count_documents({"verified": True}),
        verified_doctors=db.doctors.count_documents({"verified": True}),
        pending_images=pending_hospital_images + pending_doctor_images + pending_gallery,
    )


# ---------------------------------------------------------------------------
# Image moderation
# ---------------------------------------------------------------------------

@admin_bp.route("/images")
@login_required(role="admin")
def images():
    db = get_db()
    status = request.args.get("status", "Pending")

    hospitals = list(db.hospitals.find({"image_status": status}))
    doctors = list(db.doctors.find({"image_status": status}))
    gallery = list(db.hospital_images.find({"status": status}))
    for g in gallery:
        hosp = db.hospitals.find_one({"_id": ObjectId(g["hospital_id"])})
        g["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown"

    return render_template("admin_images.html", hospitals=hospitals, doctors=doctors,
                            gallery=gallery, status=status)


@admin_bp.route("/images/<entity>/<entity_id>/<action>", methods=["POST"])
@login_required(role="admin")
def moderate_image(entity, entity_id, action):
    db = get_db()
    if action not in ("approve", "reject", "delete"):
        abort(400)
    new_status = {"approve": "Approved", "reject": "Rejected"}.get(action)

    if entity == "hospital":
        hospital = db.hospitals.find_one({"_id": ObjectId(entity_id)})
        if not hospital:
            abort(404)
        if action == "delete":
            if hospital.get("image_filename"):
                delete_image(Config.HOSPITAL_IMAGE_FOLDER, hospital["image_filename"])
            db.hospitals.update_one({"_id": ObjectId(entity_id)}, {
                "$unset": {"image_filename": "", "image_status": ""},
                "$set": {"image_url": "/static/images/hospital_default.jpg"}})
        else:
            update = {"image_status": new_status}
            if new_status == "Rejected":
                # Rejected images are not shown publicly
                update["image_url"] = "/static/images/hospital_default.jpg"
            db.hospitals.update_one({"_id": ObjectId(entity_id)}, {"$set": update})

    elif entity == "doctor":
        doctor = db.doctors.find_one({"_id": ObjectId(entity_id)})
        if not doctor:
            abort(404)
        if action == "delete":
            if doctor.get("image_filename"):
                delete_image(Config.DOCTOR_IMAGE_FOLDER, doctor["image_filename"])
            db.doctors.update_one({"_id": ObjectId(entity_id)}, {
                "$unset": {"image_filename": "", "image_status": ""},
                "$set": {"image_url": "/static/images/doctor_default.jpg"}})
        else:
            update = {"image_status": new_status}
            if new_status == "Rejected":
                update["image_url"] = "/static/images/doctor_default.jpg"
            db.doctors.update_one({"_id": ObjectId(entity_id)}, {"$set": update})

    elif entity == "gallery":
        img = db.hospital_images.find_one({"_id": ObjectId(entity_id)})
        if not img:
            abort(404)
        if action == "delete":
            delete_image(Config.HOSPITAL_IMAGE_FOLDER, img["filename"])
            db.hospital_images.delete_one({"_id": ObjectId(entity_id)})
        else:
            db.hospital_images.update_one({"_id": ObjectId(entity_id)},
                                           {"$set": {"status": new_status}})
    else:
        abort(404)

    log_action(db, "admin", session.get("admin_id"), session.get("name"),
               f"IMAGE_{action.upper()}", entity, entity_id)
    flash(f"Image {action}d.", "success")
    return redirect(url_for("admin.images"))


# ---------------------------------------------------------------------------
# Profile verification
# ---------------------------------------------------------------------------

@admin_bp.route("/verify")
@login_required(role="admin")
def verify_list():
    db = get_db()
    hospitals = list(db.hospitals.find({}, {"hospital_name": 1, "city": 1, "verified": 1}))
    doctors = list(db.doctors.find({}, {"name": 1, "specialization": 1, "verified": 1, "hospital_id": 1}))
    for d in doctors:
        try:
            hosp = db.hospitals.find_one({"_id": ObjectId(d["hospital_id"])})
        except Exception:
            hosp = None
        d["hospital_name"] = hosp["hospital_name"] if hosp else "Unknown"
    return render_template("admin_verify.html", hospitals=hospitals, doctors=doctors)


@admin_bp.route("/verify/<entity>/<entity_id>", methods=["POST"])
@login_required(role="admin")
def toggle_verify(entity, entity_id):
    db = get_db()
    collection = {"hospital": db.hospitals, "doctor": db.doctors}.get(entity)
    if collection is None:
        abort(404)
    doc = collection.find_one({"_id": ObjectId(entity_id)})
    if not doc:
        abort(404)
    new_value = not doc.get("verified", False)
    collection.update_one({"_id": ObjectId(entity_id)},
                           {"$set": {"verified": new_value,
                                      "verified_at": datetime.utcnow() if new_value else None}})
    log_action(db, "admin", session.get("admin_id"), session.get("name"),
               "VERIFY" if new_value else "UNVERIFY", entity, entity_id)
    flash(f"{entity.title()} {'verified' if new_value else 'unverified'}.", "success")
    return redirect(url_for("admin.verify_list"))

@admin_bp.route("/hospital/add", methods=["POST"])
@login_required(role="admin")
def add_hospital():
    db = get_db()
    name = request.form.get("hospital_name", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    if not (name and email and password):
        flash("Name, email, and password required.", "danger")
        return redirect(url_for("admin.verify_list"))
    
    existing = db.hospitals.find_one({"email": email})
    if existing:
        flash("Email already used for a hospital.", "danger")
        return redirect(url_for("admin.verify_list"))
        
    from werkzeug.security import generate_password_hash
    import datetime
    db.hospitals.insert_one({
        "hospital_name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "verified": True,
        "created_at": datetime.datetime.utcnow()
    })
    flash("Hospital added successfully.", "success")
    return redirect(url_for("admin.verify_list"))

@admin_bp.route("/hospital/delete/<hospital_id>", methods=["POST"])
@login_required(role="admin")
def delete_hospital(hospital_id):
    db = get_db()
    db.hospitals.delete_one({"_id": ObjectId(hospital_id)})
    db.doctors.delete_many({"hospital_id": hospital_id})
    flash("Hospital and associated doctors deleted.", "success")
    return redirect(url_for("admin.verify_list"))
