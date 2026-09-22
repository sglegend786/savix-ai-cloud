import io
from datetime import datetime

from bson.objectid import ObjectId
from flask import (Blueprint, render_template, request, redirect, url_for,
                    session, flash, current_app, abort, send_file)

from utils.decorators import login_required

appointment_bp = Blueprint("appointment", __name__)


def get_db():
    return current_app.db


# ---------------------------------------------------------------------------
# USER: book / view appointments
# ---------------------------------------------------------------------------

@appointment_bp.route("/appointments/book/<doctor_id>", methods=["GET", "POST"])
@login_required(role="user")
def book_appointment(doctor_id):
    db = get_db()
    doctor = db.doctors.find_one({"_id": ObjectId(doctor_id)})
    if not doctor:
        abort(404)
    hospital = db.hospitals.find_one({"_id": ObjectId(doctor["hospital_id"])})

    if request.method == "POST":
        appt_date = request.form.get("date")
        appt_time = request.form.get("time")
        reason = request.form.get("reason", "").strip()

        appt_doc = {
            "user_id": session["user_id"],
            "user_name": session.get("name"),
            "doctor_id": doctor_id,
            "doctor_name": doctor["name"],
            "hospital_id": doctor["hospital_id"],
            "hospital_name": hospital["hospital_name"] if hospital else "",
            "date": appt_date,
            "time": appt_time,
            "reason": reason,
            "status": "Pending",
            "created_at": datetime.utcnow(),
        }
        db.appointments.insert_one(appt_doc)
        flash("Appointment requested successfully. Await confirmation.", "success")
        return redirect(url_for("appointment.my_appointments"))

    return render_template("book_appointment.html", doctor=doctor, hospital=hospital)


@appointment_bp.route("/appointments/my")
@login_required(role="user")
def my_appointments():
    db = get_db()
    uid = session["user_id"]
    appts = list(db.appointments.find({"user_id": uid}).sort("date", -1))
    from utils.queue import queue_position, estimated_wait_minutes
    for a in appts:
        if a.get("token_number") and a.get("queue_status") == "WAITING":
            a["position"] = queue_position(db, a)
            a["wait_minutes"] = estimated_wait_minutes(a["position"])
    return render_template("appointments.html", appointments=appts)


@appointment_bp.route("/appointments/cancel/<appt_id>", methods=["POST"])
@login_required(role="user")
def cancel_appointment(appt_id):
    db = get_db()
    uid = session["user_id"]
    # Backend check: only the owning patient can cancel their own appointment
    appt = db.appointments.find_one({"_id": ObjectId(appt_id), "user_id": uid})
    if not appt:
        abort(403)
    db.appointments.update_one({"_id": ObjectId(appt_id)}, {"$set": {"status": "Cancelled"}})
    flash("Appointment cancelled.", "info")
    return redirect(url_for("appointment.my_appointments"))


# ---------------------------------------------------------------------------
# HOSPITAL/DOCTOR: create prescription for an appointment
# ---------------------------------------------------------------------------

@appointment_bp.route("/hospital/prescriptions/create/<appt_id>", methods=["GET", "POST"])
@login_required(role="hospital")
def create_prescription(appt_id):
    db = get_db()
    hid = session["hospital_id"]
    appt = db.appointments.find_one({"_id": ObjectId(appt_id), "hospital_id": hid})
    if not appt:
        abort(403)

    if request.method == "POST":
        form = request.form
        medicines = []
        names = form.getlist("med_name[]")
        dosages = form.getlist("med_dosage[]")
        frequencies = form.getlist("med_frequency[]")
        durations = form.getlist("med_duration[]")
        for i in range(len(names)):
            if names[i].strip():
                medicines.append({
                    "name": names[i].strip(),
                    "dosage": dosages[i] if i < len(dosages) else "",
                    "frequency": frequencies[i] if i < len(frequencies) else "",
                    "duration": durations[i] if i < len(durations) else "",
                })

        prescription_doc = {
            "appointment_id": appt_id,
            "user_id": appt["user_id"],
            "patient_name": appt["user_name"],
            "doctor_id": appt["doctor_id"],
            "doctor_name": appt["doctor_name"],
            "hospital_id": hid,
            "hospital_name": appt["hospital_name"],
            "date": datetime.utcnow(),
            "diagnosis": form.get("diagnosis", "").strip(),
            "medicines": medicines,
            "instructions": form.get("instructions", "").strip(),
        }
        result = db.prescriptions.insert_one(prescription_doc)
        db.appointments.update_one({"_id": ObjectId(appt_id)}, {"$set": {"status": "Completed"}})
        flash("Prescription created.", "success")
        return redirect(url_for("appointment.view_prescription", prescription_id=str(result.inserted_id)))

    return render_template("create_prescription.html", appointment=appt)


@appointment_bp.route("/prescriptions/<prescription_id>")
@login_required()
def view_prescription(prescription_id):
    db = get_db()
    prescription = db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
    if not prescription:
        abort(404)
    # Backend authorization: only the owning patient or the issuing hospital can view
    role = session.get("role")
    if role == "user" and prescription["user_id"] != session.get("user_id"):
        abort(403)
    if role == "hospital" and prescription["hospital_id"] != session.get("hospital_id"):
        abort(403)
    return render_template("prescription.html", prescription=prescription)


@appointment_bp.route("/prescriptions/my")
@login_required(role="user")
def my_prescriptions():
    db = get_db()
    uid = session["user_id"]
    prescriptions = list(db.prescriptions.find({"user_id": uid}).sort("date", -1))
    return render_template("prescriptions_list.html", prescriptions=prescriptions)


@appointment_bp.route("/prescriptions/<prescription_id>/download")
@login_required()
def download_prescription(prescription_id):
    db = get_db()
    prescription = db.prescriptions.find_one({"_id": ObjectId(prescription_id)})
    if not prescription:
        abort(404)
    role = session.get("role")
    if role == "user" and prescription["user_id"] != session.get("user_id"):
        abort(403)
    if role == "hospital" and prescription["hospital_id"] != session.get("hospital_id"):
        abort(403)

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 25 * mm
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, y, "HealthCare+ Prescription")
    y -= 10 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, f"Hospital: {prescription.get('hospital_name', '')}")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Doctor: {prescription.get('doctor_name', '')}")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Patient: {prescription.get('patient_name', '')}")
    y -= 6 * mm
    date_str = prescription["date"].strftime("%d %b %Y") if prescription.get("date") else ""
    c.drawString(20 * mm, y, f"Date: {date_str}")
    y -= 10 * mm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Diagnosis / Notes:")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, prescription.get("diagnosis", "-")[:100])
    y -= 10 * mm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Medicines:")
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    for med in prescription.get("medicines", []):
        line = f"- {med.get('name')} | {med.get('dosage')} | {med.get('frequency')} | {med.get('duration')}"
        c.drawString(22 * mm, y, line[:110])
        y -= 6 * mm

    y -= 6 * mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Instructions:")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, prescription.get("instructions", "-")[:100])

    c.showPage()
    c.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True,
                      download_name=f"prescription_{prescription_id}.pdf",
                      mimetype="application/pdf")
