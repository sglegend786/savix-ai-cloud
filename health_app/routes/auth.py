from datetime import datetime

from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app)
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

auth_bp = Blueprint("auth", __name__)


def get_db():
    return current_app.db

import jwt

@auth_bp.route("/sso")
def sso_login():
    token = request.args.get("token")
    if not token:
        flash("No SSO token provided.", "error")
        return redirect(url_for("auth.user_login"))
    
    try:
        # Verify central auth token (SchemeSathi secret)
        payload = jwt.decode(token, "schemesathi_secret_key_2026", algorithms=["HS256"])
        email = payload.get("email")
        name = payload.get("name", "SSO User")
        role = payload.get("role", "user")
        
        if not email:
            flash("Invalid token payload.", "error")
            return redirect(url_for("auth.user_login"))
            
        db = get_db()
        session.clear()
        session.permanent = True
        
        if role == "hospital":
            hospital = db.hospitals.find_one({"email": email})
            if not hospital:
                new_hospital = {
                    "hospital_name": name,
                    "email": email,
                    "password_hash": generate_password_hash("sso-login"),
                    "created_at": datetime.utcnow()
                }
                res = db.hospitals.insert_one(new_hospital)
                hospital = db.hospitals.find_one({"_id": res.inserted_id})
            
            session["role"] = "hospital"
            session["hospital_id"] = str(hospital["_id"])
            session["name"] = hospital["hospital_name"]
            return redirect(url_for("hospital.dashboard"))
            
        elif role == "admin":
            admin = db.admins.find_one({"email": email})
            if not admin:
                new_admin = {
                    "username": name,
                    "email": email,
                    "password_hash": generate_password_hash("sso-login")
                }
                res = db.admins.insert_one(new_admin)
                admin = db.admins.find_one({"_id": res.inserted_id})
                
            session["role"] = "admin"
            session["admin_id"] = str(admin["_id"])
            session["name"] = admin["username"]
            return redirect(url_for("admin.dashboard"))
            
        else:
            user = db.users.find_one({"email": email})
            if not user:
                # Auto-register
                new_user = {
                    "name": name,
                    "email": email,
                    "phone": payload.get("phone", ""),
                    "password": generate_password_hash("sso-login"),
                    "age": payload.get("age", 25),
                    "gender": payload.get("gender", "Other"),
                    "preferred_language": "en",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                res = db.users.insert_one(new_user)
                user = db.users.find_one({"_id": res.inserted_id})
                
            session["role"] = "user"
            session["user_id"] = str(user["_id"])
            session["name"] = user["name"]
            session["lang"] = user.get("preferred_language", "en")
            
            return redirect(url_for("user.dashboard"))
            
    except Exception as e:
        flash(f"SSO Error: {str(e)}", "error")
        return redirect(url_for("auth.user_login"))


# ---------------------------------------------------------------------------
# USER (patient) auth
# ---------------------------------------------------------------------------

@auth_bp.route("/user/register", methods=["GET", "POST"])
def user_register():
    if request.method == "POST":
        db = get_db()
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        phone = request.form.get("phone", "").strip()
        password = request.form.get("password", "")
        age = request.form.get("age", "")
        gender = request.form.get("gender", "")

        if not (name and email and password):
            flash("Name, email and password are required.", "danger")
            return render_template("register.html", role="user")

        if db.users.find_one({"email": email}):
            flash("An account with this email already exists.", "danger")
            return render_template("register.html", role="user")

        user_doc = {
            "name": name,
            "email": email,
            "phone": phone,
            "age": age,
            "gender": gender,
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow(),
            "role": "user",
        }
        db.users.insert_one(user_doc)
        flash("Registration successful. Please login.", "success")
        return redirect(url_for("auth.user_login"))

    return render_template("register.html", role="user")


@auth_bp.route("/user/login", methods=["GET", "POST"])
def user_login():
    if request.method == "POST":
        db = get_db()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        user = db.users.find_one({"email": email})
        if not user or not check_password_hash(user["password_hash"], password):
            flash("Invalid email or password.", "danger")
            return render_template("login.html", role="user")

        _lang = session.get("lang")
        session.clear()
        session.permanent = True
        if _lang:
            session["lang"] = _lang
        session["role"] = "user"
        session["user_id"] = str(user["_id"])
        session["name"] = user["name"]
        if user.get("preferred_language"):
            session["lang"] = user["preferred_language"]
        flash(f"Welcome back, {user['name']}!", "success")
        return redirect(url_for("user.dashboard"))

    return render_template("login.html", role="user")


# ---------------------------------------------------------------------------
# HOSPITAL / ADMIN auth
# ---------------------------------------------------------------------------

@auth_bp.route("/hospital/register", methods=["GET", "POST"])
def hospital_register():
    if request.method == "POST":
        db = get_db()
        form = request.form

        hospital_name = form.get("hospital_name", "").strip()
        email = form.get("email", "").strip().lower()
        password = form.get("password", "")

        if not (hospital_name and email and password):
            flash("Hospital name, email and password are required.", "danger")
            return render_template("register.html", role="hospital")

        if db.hospitals.find_one({"email": email}):
            flash("A hospital account with this email already exists.", "danger")
            return render_template("register.html", role="hospital")

        hospital_doc = {
            "hospital_name": hospital_name,
            "hospital_id_code": form.get("hospital_id_code", "").strip(),
            "email": email,
            "phone": form.get("phone", "").strip(),
            "password_hash": generate_password_hash(password),
            "address": form.get("address", "").strip(),
            "city": form.get("city", "").strip(),
            "state": form.get("state", "").strip(),
            "pincode": form.get("pincode", "").strip(),
            "latitude": form.get("latitude", ""),
            "longitude": form.get("longitude", ""),
            "distance_km": float(form.get("distance_km") or 5.0),
            "hospital_type": form.get("hospital_type", "Multi-Specialty"),
            "emergency": form.get("emergency") == "on",
            "available_247": form.get("available_247") == "on",
            "avg_cost": float(form.get("avg_cost") or 1000),
            "facilities": [f.strip() for f in form.get("facilities", "").split(",") if f.strip()],
            "departments": [d.strip() for d in form.get("departments", "").split(",") if d.strip()],
            "rating": 4.0,
            "image_url": "/static/images/hospital_default.jpg",
            "created_at": datetime.utcnow(),
            "role": "hospital",
        }
        result = db.hospitals.insert_one(hospital_doc)

        # Auto-create the default departments for this hospital if given
        for dept_name in hospital_doc["departments"]:
            db.departments.insert_one({
                "hospital_id": str(result.inserted_id),
                "name": dept_name,
                "created_at": datetime.utcnow(),
            })

        flash("Hospital registered successfully. Please login.", "success")
        return redirect(url_for("auth.hospital_login"))

    return render_template("register.html", role="hospital")


@auth_bp.route("/hospital/login", methods=["GET", "POST"])
def hospital_login():
    if request.method == "POST":
        db = get_db()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        hospital = db.hospitals.find_one({"email": email})
        if not hospital or not check_password_hash(hospital["password_hash"], password):
            flash("Invalid email or password.", "danger")
            return render_template("login.html", role="hospital")

        _lang = session.get("lang")
        session.clear()
        session.permanent = True
        if _lang:
            session["lang"] = _lang
        session["role"] = "hospital"
        session["hospital_id"] = str(hospital["_id"])
        session["name"] = hospital["hospital_name"]
        if hospital.get("preferred_language"):
            session["lang"] = hospital["preferred_language"]
        flash(f"Welcome back, {hospital['hospital_name']}!", "success")
        return redirect(url_for("hospital.dashboard"))

    return render_template("login.html", role="hospital")


# ---------------------------------------------------------------------------
# HEALTH WORKER auth (ASHA / ANM / PHC frontline workers)
# ---------------------------------------------------------------------------

@auth_bp.route("/worker/register", methods=["GET", "POST"])
def health_worker_register():
    if request.method == "POST":
        db = get_db()
        form = request.form

        name = form.get("name", "").strip()
        email = form.get("email", "").strip().lower()
        password = form.get("password", "")

        if not (name and email and password):
            flash("Name, email and password are required.", "danger")
            return render_template("register.html", role="health_worker")

        if db.health_workers.find_one({"email": email}):
            flash("A health worker account with this email already exists.", "danger")
            return render_template("register.html", role="health_worker")

        worker_doc = {
            "name": name,
            "email": email,
            "phone": form.get("phone", "").strip(),
            "worker_type": form.get("worker_type", "ASHA"),
            "facility": form.get("facility", "").strip(),
            "village_coverage": [v.strip() for v in form.get("village_coverage", "").split(",") if v.strip()],
            "password_hash": generate_password_hash(password),
            "created_at": datetime.utcnow(),
            "role": "health_worker",
        }
        db.health_workers.insert_one(worker_doc)
        flash("Registration successful. Please login.", "success")
        return redirect(url_for("auth.health_worker_login"))

    return render_template("register.html", role="health_worker")


@auth_bp.route("/worker/login", methods=["GET", "POST"])
def health_worker_login():
    if request.method == "POST":
        db = get_db()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        worker = db.health_workers.find_one({"email": email})
        if not worker or not check_password_hash(worker["password_hash"], password):
            flash("Invalid email or password.", "danger")
            return render_template("login.html", role="health_worker")

        _lang = session.get("lang")
        session.clear()
        session.permanent = True
        if _lang:
            session["lang"] = _lang
        session["role"] = "health_worker"
        session["worker_id"] = str(worker["_id"])
        session["name"] = worker["name"]
        session["facility"] = worker.get("facility", "")
        if worker.get("preferred_language"):
            session["lang"] = worker["preferred_language"]
        flash(f"Welcome back, {worker['name']}!", "success")
        return redirect(url_for("health_worker.dashboard"))

    return render_template("login.html", role="health_worker")


# ---------------------------------------------------------------------------
# Logout (shared)
# ---------------------------------------------------------------------------

@auth_bp.route("/logout")
def logout():
    _lang = session.get("lang")
    session.clear()
    if _lang:
        session["lang"] = _lang
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))
