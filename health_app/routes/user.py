from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort)

from utils.decorators import login_required
from utils.recommendation import score_hospitals, analyze_symptom, rank_doctors
from utils.analysis import dashboard_stats
from utils.geo import attach_distance, has_coordinates, directions_url

user_bp = Blueprint("user", __name__, url_prefix="/user")


def get_db():
    return current_app.db


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@user_bp.route("/dashboard")
@login_required(role="user")
def dashboard():
    db = get_db()
    uid = session["user_id"]

    hospitals = list(db.hospitals.find())
    for h in hospitals:
        h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
    ranked_hospitals = score_hospitals(hospitals)
    best_hospital = ranked_hospitals[0] if ranked_hospitals else None

    upcoming_appts = list(db.appointments.find(
        {"user_id": uid, "status": {"$in": ["Pending", "Confirmed"]}}
    ).sort("date", 1).limit(5))
    for a in upcoming_appts:
        hosp = db.hospitals.find_one({"_id": ObjectId(a["hospital_id"])})
        a["hospital_name"] = hosp["hospital_name"] if hosp else ""

    reports = list(db.reports.find({"user_id": uid}))
    stats = dashboard_stats(reports)

    latest_prescription = db.prescriptions.find_one(
        {"user_id": uid}, sort=[("date", -1)])

    return render_template("user_dashboard.html", best_hospital=best_hospital,
                            hospitals=ranked_hospitals[:4], upcoming_appts=upcoming_appts,
                            stats=stats, latest_prescription=latest_prescription)


# ---------------------------------------------------------------------------
# Hospitals: list / compare / best
# ---------------------------------------------------------------------------

@user_bp.route("/hospitals")
@login_required(role="user")
def hospitals():
    db = get_db()
    q = request.args.get("q", "").strip()
    city = request.args.get("city", "").strip()
    department = request.args.get("department", "").strip()
    emergency_only = request.args.get("emergency", "")
    sort_by = request.args.get("sort", "")
    user_lat = request.args.get("lat", "")
    user_lng = request.args.get("lng", "")

    query = {}
    if q:
        query["hospital_name"] = {"$regex": q, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if emergency_only:
        query["emergency"] = True

    all_hospitals = list(db.hospitals.find(query))

    # Department filter: keep hospitals that have a department by this name
    if department:
        hospital_ids_with_dept = set(
            db.departments.distinct("hospital_id", {"name": department, "status": {"$ne": "Inactive"}})
        )
        hospital_ids_with_dept |= set(db.doctors.distinct("hospital_id", {"department": department}))
        all_hospitals = [h for h in all_hospitals if str(h["_id"]) in hospital_ids_with_dept]

    for h in all_hospitals:
        h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
        h["has_location"] = has_coordinates(h)
        dept_names = db.departments.distinct("name", {"hospital_id": str(h["_id"]),
                                                       "status": {"$ne": "Inactive"}})
        if not dept_names:
            dept_names = db.doctors.distinct("department", {"hospital_id": str(h["_id"])})
        h["department_names"] = dept_names[:3]

    ranked = score_hospitals(all_hospitals)
    attach_distance(ranked, user_lat, user_lng)

    if sort_by == "nearest":
        # Hospitals without a computed distance sort last, not crash
        ranked.sort(key=lambda h: (h.get("computed_distance_km") is None,
                                    h.get("computed_distance_km") or 0))
    elif sort_by == "name":
        ranked.sort(key=lambda h: h.get("hospital_name", "").lower())
    elif sort_by == "rating":
        ranked.sort(key=lambda h: h.get("rating", 0), reverse=True)

    # Filter options drawn from real data only
    all_cities = sorted([c for c in db.hospitals.distinct("city") if c])
    all_departments = sorted(set(
        [d for d in db.departments.distinct("name") if d] +
        [d for d in db.doctors.distinct("department") if d]
    ))

    return render_template("hospitals.html", hospitals=ranked, q=q, city=city,
                            department=department, emergency_only=emergency_only,
                            sort_by=sort_by, all_cities=all_cities,
                            all_departments=all_departments,
                            user_lat=user_lat, user_lng=user_lng)


@user_bp.route("/hospitals/compare")
@login_required(role="user")
def compare_hospitals():
    db = get_db()
    all_hospitals = list(db.hospitals.find())
    for h in all_hospitals:
        h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
    ranked = score_hospitals(all_hospitals)
    return render_template("compare_hospitals.html", hospitals=ranked)


@user_bp.route("/hospitals/best")
@login_required(role="user")
def best_hospital():
    db = get_db()
    all_hospitals = list(db.hospitals.find())
    for h in all_hospitals:
        h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
    ranked = score_hospitals(all_hospitals)
    top = ranked[0] if ranked else None
    return render_template("best_hospital.html", hospital=top, all_ranked=ranked)


@user_bp.route("/hospitals/<hospital_id>")
@login_required(role="user")
def hospital_detail(hospital_id):
    db = get_db()
    hospital = db.hospitals.find_one({"_id": ObjectId(hospital_id)})
    if not hospital:
        abort(404)
    doctors = list(db.doctors.find({"hospital_id": hospital_id}))
    departments = list(db.departments.find({"hospital_id": hospital_id,
                                             "status": {"$ne": "Inactive"}}))

    hospital["has_location"] = has_coordinates(hospital)
    hospital["directions_url"] = (
        directions_url(hospital["latitude"], hospital["longitude"])
        if hospital["has_location"] else None
    )
    gallery = list(db.hospital_images.find({"hospital_id": hospital_id,
                                             "status": "Approved"}))

    return render_template("hospital_detail.html", hospital=hospital,
                            doctors=doctors, departments=departments,
                            gallery=gallery)


@user_bp.route("/hospitals/<hospital_id>/departments/<dept_id>")
@login_required(role="user")
def department_detail(hospital_id, dept_id):
    db = get_db()
    hospital = db.hospitals.find_one({"_id": ObjectId(hospital_id)})
    dept = db.departments.find_one({"_id": ObjectId(dept_id), "hospital_id": hospital_id})
    if not hospital or not dept:
        abort(404)
    doctors = list(db.doctors.find({"hospital_id": hospital_id, "department": dept["name"]}))
    return render_template("department_detail.html", hospital=hospital,
                            department=dept, doctors=doctors)


# ---------------------------------------------------------------------------
# Departments overview (public/user)
# ---------------------------------------------------------------------------

@user_bp.route("/departments")
@login_required(role="user")
def departments_overview():
    db = get_db()
    dept_names = db.doctors.distinct("department")
    dept_data = []
    for name in dept_names:
        doctors_in_dept = list(db.doctors.find({"department": name}))
        ranked = rank_doctors(doctors_in_dept)
        best = ranked[0] if ranked else None
        hospital_ids = {d["hospital_id"] for d in doctors_in_dept}
        dept_data.append({
            "name": name,
            "doctor_count": len(doctors_in_dept),
            "available_count": len([d for d in doctors_in_dept if d.get("available_today")]),
            "best_doctor": best,
            "hospital_count": len(hospital_ids),
        })
    return render_template("departments.html", departments=dept_data)


# ---------------------------------------------------------------------------
# Problem / Symptom Analysis
# ---------------------------------------------------------------------------

@user_bp.route("/problem-analysis", methods=["GET", "POST"])
@login_required(role="user")
def problem_analysis():
    result = None
    if request.method == "POST":
        db = get_db()
        symptom_text = request.form.get("symptom_text", "").strip()
        department, matched_keywords, confidence = analyze_symptom(symptom_text)

        doctors_in_dept = list(db.doctors.find({"department": department}))
        ranked = rank_doctors(doctors_in_dept)
        best_doc = ranked[0] if ranked else None
        best_hosp = None
        if best_doc:
            best_hosp = db.hospitals.find_one({"_id": ObjectId(best_doc["hospital_id"])})
        else:
            all_hospitals = list(db.hospitals.find())
            for h in all_hospitals:
                h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
            ranked_h = score_hospitals(all_hospitals)
            best_hosp = ranked_h[0] if ranked_h else None

        result = {
            "symptom_text": symptom_text,
            "department": department,
            "matched_keywords": matched_keywords,
            "confidence": confidence,
            "best_doctor": best_doc,
            "best_hospital": best_hosp,
        }

    return render_template("problem_analysis.html", result=result)


# ---------------------------------------------------------------------------
# Live Consultation (list of doctors currently online, launch Jitsi room)
# ---------------------------------------------------------------------------

@user_bp.route("/live-consultation")
@login_required(role="user")
def live_consultation():
    db = get_db()
    available_doctors = list(db.doctors.find({"available_today": True}))
    for d in available_doctors:
        hosp = db.hospitals.find_one({"_id": ObjectId(d["hospital_id"])})
        d["hospital_name"] = hosp["hospital_name"] if hosp else ""
        d["room_name"] = f"HealthCarePlus-{str(d['_id'])}"
    return render_template("live_consultation.html", doctors=available_doctors)


# ---------------------------------------------------------------------------
# Profile settings
# ---------------------------------------------------------------------------

@user_bp.route("/profile", methods=["GET", "POST"])
@login_required(role="user")
def profile():
    db = get_db()
    uid = session["user_id"]
    if request.method == "POST":
        form = request.form
        update = {
            "name": form.get("name", "").strip(),
            "phone": form.get("phone", "").strip(),
            "age": form.get("age", ""),
            "gender": form.get("gender", ""),
        }
        db.users.update_one({"_id": ObjectId(uid)}, {"$set": update})
        session["name"] = update["name"]
        flash("Profile updated.", "success")
        return redirect(url_for("user.profile"))

    user = db.users.find_one({"_id": ObjectId(uid)})
    return render_template("user_profile.html", user=user)
