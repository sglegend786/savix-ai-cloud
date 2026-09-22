import os
from datetime import datetime

from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort, send_from_directory,
                    jsonify)
from werkzeug.utils import secure_filename

from config import Config, allowed_file
from utils.decorators import login_required
from utils.report_parser import extract_report_text, get_file_extension
from utils.analysis import analyze_single_report, analyze_multiple_reports, dashboard_stats
from utils.recommendation import score_hospitals, rank_doctors
from utils.analysis import REPORT_TYPE_DEPARTMENT

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")

REPORT_TYPES = ["Blood Test", "Vitamin D Test", "X-Ray", "MRI", "ECG", "CBC",
                 "Liver Function Test", "Kidney Function Test", "Other"]


def get_db():
    return current_app.db


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

@reports_bp.route("/upload", methods=["GET", "POST"])
@login_required(role="user")
def upload_report():
    if request.method == "POST":
        db = get_db()
        uid = session["user_id"]

        if "report_file" not in request.files:
            flash("No file selected.", "danger")
            return redirect(url_for("reports.upload_report"))

        file = request.files["report_file"]
        report_name = request.form.get("report_name", "").strip()
        report_type = request.form.get("report_type", "Other")

        if file.filename == "":
            flash("No file selected.", "danger")
            return redirect(url_for("reports.upload_report"))

        if not allowed_file(file.filename):
            flash("Invalid file type. Only PDF, JPG, JPEG, PNG are allowed.", "danger")
            return redirect(url_for("reports.upload_report"))

        ext = get_file_extension(file.filename)
        safe_name = secure_filename(file.filename)
        unique_filename = f"{uid}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{safe_name}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(filepath)

        extracted_text = extract_report_text(filepath, ext)

        report_doc = {
            "user_id": uid,
            "report_name": report_name or safe_name,
            "report_type": report_type,
            "upload_date": datetime.utcnow(),
            "file_path": unique_filename,
            "file_ext": ext,
            "extracted_text": extracted_text,
            "analysis_status": "Ready",
        }
        db.reports.insert_one(report_doc)
        flash("Report uploaded successfully.", "success")
        return redirect(url_for("reports.my_reports"))

    return render_template("upload_report.html", report_types=REPORT_TYPES)


# ---------------------------------------------------------------------------
# List / view / delete (strictly own reports only)
# ---------------------------------------------------------------------------

@reports_bp.route("/my")
@login_required(role="user")
def my_reports():
    db = get_db()
    uid = session["user_id"]
    reports = list(db.reports.find({"user_id": uid}).sort("upload_date", -1))
    return render_template("reports.html", reports=reports)


@reports_bp.route("/view/<report_id>")
@login_required(role="user")
def view_report(report_id):
    db = get_db()
    uid = session["user_id"]
    report = db.reports.find_one({"_id": ObjectId(report_id), "user_id": uid})
    if not report:
        abort(403)
    single_analysis = analyze_single_report(report)
    return render_template("report_view.html", report=report, analysis=single_analysis)


@reports_bp.route("/file/<report_id>")
@login_required()
def serve_report_file(report_id):
    db = get_db()
    report = db.reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        abort(404)
    # Backend authorization: owning patient, OR a hospital admin whose
    # hospital has an appointment with this patient
    role = session.get("role")
    if role == "user" and report["user_id"] != session.get("user_id"):
        abort(403)
    if role == "hospital":
        hid = session.get("hospital_id")
        has_appt = db.appointments.find_one({"hospital_id": hid, "user_id": report["user_id"]})
        if not has_appt:
            abort(403)
    return send_from_directory(Config.UPLOAD_FOLDER, report["file_path"])


@reports_bp.route("/delete/<report_id>", methods=["POST"])
@login_required(role="user")
def delete_report(report_id):
    db = get_db()
    uid = session["user_id"]
    report = db.reports.find_one({"_id": ObjectId(report_id), "user_id": uid})
    if not report:
        abort(403)
    filepath = os.path.join(Config.UPLOAD_FOLDER, report["file_path"])
    if os.path.exists(filepath):
        os.remove(filepath)
    db.reports.delete_one({"_id": ObjectId(report_id)})
    flash("Report deleted.", "info")
    return redirect(url_for("reports.my_reports"))


# ---------------------------------------------------------------------------
# Selected-report analysis (1, 2, 3, ... N reports chosen via checkboxes)
# ---------------------------------------------------------------------------

@reports_bp.route("/analyze-selected", methods=["POST"])
@login_required(role="user")
def analyze_selected():
    db = get_db()
    uid = session["user_id"]
    report_ids = request.form.getlist("report_ids")

    if not report_ids:
        flash("Please select at least one report to analyze.", "warning")
        return redirect(url_for("reports.my_reports"))

    # Backend check: every selected report must belong to this user
    reports = list(db.reports.find({
        "_id": {"$in": [ObjectId(rid) for rid in report_ids]},
        "user_id": uid,
    }))
    if not reports:
        abort(403)

    result = _build_combined_result(db, reports)
    return render_template("report_analysis.html", result=result, mode="selected")


@reports_bp.route("/analyze-all")
@login_required(role="user")
def analyze_all():
    db = get_db()
    uid = session["user_id"]
    reports = list(db.reports.find({"user_id": uid}))

    if not reports:
        flash("You have no uploaded reports yet.", "warning")
        return redirect(url_for("reports.my_reports"))

    result = _build_combined_result(db, reports)
    return render_template("all_reports_analysis.html", result=result, mode="all")


def _build_combined_result(db, reports):
    if len(reports) == 1:
        single = analyze_single_report(reports[0])
        result = {
            "total_reports": 1,
            "individual_summaries": [single],
            "combined_observations": [
                f"{p['parameter']} is {p['status']}" for p in single["parameters"]
                if p["status"] != "Normal"
            ] or ["All analyzed parameters fall within the simulated normal reference range."],
            "recommended_department": single["recommended_department"],
            "contributing_reports": [single["report_name"]] if single["recommended_department"] else [],
            "total_normal_parameters": single["normal_count"],
            "total_abnormal_parameters": single["abnormal_count"],
            "disclaimer": single["disclaimer"],
        }
    else:
        result = analyze_multiple_reports(reports)

    # Attach recommended doctor / hospital
    dept = result.get("recommended_department")
    if dept:
        doctors_in_dept = list(db.doctors.find({"department": dept}))
        ranked = rank_doctors(doctors_in_dept)
        best_doc = ranked[0] if ranked else None
        if best_doc:
            hosp = db.hospitals.find_one({"_id": ObjectId(best_doc["hospital_id"])})
            best_doc["hospital_name"] = hosp["hospital_name"] if hosp else ""
        result["recommended_doctor"] = best_doc
    else:
        result["recommended_doctor"] = None

    all_hospitals = list(db.hospitals.find())
    for h in all_hospitals:
        h["doctor_count"] = db.doctors.count_documents({"hospital_id": str(h["_id"])})
    ranked_hospitals = score_hospitals(all_hospitals)
    result["recommended_hospital"] = ranked_hospitals[0] if ranked_hospitals else None

    return result


# ---------------------------------------------------------------------------
# Health Analysis Dashboard (Chart.js data)
# ---------------------------------------------------------------------------

@reports_bp.route("/dashboard")
@login_required(role="user")
def report_dashboard():
    db = get_db()
    uid = session["user_id"]
    reports = list(db.reports.find({"user_id": uid}))
    stats = dashboard_stats(reports)
    return render_template("health_dashboard.html", stats=stats)


@reports_bp.route("/dashboard/data")
@login_required(role="user")
def report_dashboard_data():
    """JSON endpoint consumed by Chart.js on the frontend."""
    db = get_db()
    uid = session["user_id"]
    reports = list(db.reports.find({"user_id": uid}))
    stats = dashboard_stats(reports)
    return jsonify(stats)
