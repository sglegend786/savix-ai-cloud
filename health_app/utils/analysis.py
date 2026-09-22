"""
Report analysis engine.

IMPORTANT ACADEMIC DISCLAIMER (shown throughout the UI as well):
This module performs a simple, rule-based, DEMO analysis. Because real lab
values are not reliably machine-extractable from arbitrary uploaded
PDFs/images without a paid OCR/NLP medical service, each report is assigned
a deterministic simulated parameter set (seeded from the report's own ID, so
the same report always shows the same demo values). This is clearly labelled
as simulated/demo data everywhere it is shown and must never be presented as
a real medical diagnosis.
"""

import random

from utils.recommendation import SYMPTOM_KEYWORDS

DISCLAIMER = ("This is an informational, academic-project demonstration and "
              "NOT a medical diagnosis. Always consult a qualified doctor.")

# Reference ranges per report type: parameter -> (low, high, unit)
REFERENCE_RANGES = {
    "Blood Test": {
        "Hemoglobin": (13.0, 17.0, "g/dL"),
        "WBC Count": (4000, 11000, "/µL"),
        "RBC Count": (4.5, 5.9, "million/µL"),
        "Platelets": (150000, 450000, "/µL"),
    },
    "Vitamin D Test": {
        "Vitamin D (25-OH)": (30, 100, "ng/mL"),
    },
    "ECG": {
        "Heart Rate": (60, 100, "bpm"),
        "PR Interval": (120, 200, "ms"),
        "QRS Duration": (80, 120, "ms"),
    },
    "CBC": {
        "Hemoglobin": (13.0, 17.0, "g/dL"),
        "WBC Count": (4000, 11000, "/µL"),
        "Platelets": (150000, 450000, "/µL"),
        "Hematocrit": (38, 50, "%"),
    },
    "Liver Function Test": {
        "SGPT (ALT)": (7, 56, "U/L"),
        "SGOT (AST)": (5, 40, "U/L"),
        "Bilirubin (Total)": (0.1, 1.2, "mg/dL"),
    },
    "Kidney Function Test": {
        "Creatinine": (0.6, 1.3, "mg/dL"),
        "Urea": (7, 20, "mg/dL"),
        "Uric Acid": (3.4, 7.0, "mg/dL"),
    },
    "X-Ray": {
        "Bone Alignment": None,
        "Joint Space": None,
    },
    "MRI": {
        "Soft Tissue Signal": None,
        "Structural Integrity": None,
    },
}

# Departments most relevant per report type - used for recommendation
REPORT_TYPE_DEPARTMENT = {
    "Blood Test": "General Medicine",
    "Vitamin D Test": "General Medicine",
    "ECG": "Cardiology",
    "CBC": "General Medicine",
    "Liver Function Test": "Liver / Gastroenterology",
    "Kidney Function Test": "General Medicine",
    "X-Ray": "Bone & Orthopedics",
    "MRI": "Bone & Orthopedics",
}


def _seeded_random(seed_str):
    rnd = random.Random(seed_str)
    return rnd


def generate_demo_parameters(report_id, report_type):
    """Deterministically generate simulated parameter values for a report,
    seeded by report_id so results are stable across repeated views."""
    ranges = REFERENCE_RANGES.get(report_type)
    if not ranges:
        return []

    rnd = _seeded_random(str(report_id) + report_type)
    results = []
    for param, bounds in ranges.items():
        if bounds is None:
            # Qualitative/imaging parameter - no numeric reference range
            status = rnd.choice(["Normal", "Normal", "Mild Findings"])
            results.append({
                "parameter": param,
                "value": status,
                "reference_range": "N/A (imaging finding)",
                "unit": "",
                "status": "Normal" if status == "Normal" else "Attention",
                "numeric": False,
            })
            continue

        low, high, unit = bounds
        # Bias mostly-normal with occasional borderline/abnormal, deterministically
        roll = rnd.random()
        if roll < 0.65:
            value = round(rnd.uniform(low, high), 2)
            status = "Normal"
        elif roll < 0.85:
            value = round(low - (high - low) * rnd.uniform(0.02, 0.15), 2)
            status = "Low"
        else:
            value = round(high + (high - low) * rnd.uniform(0.02, 0.20), 2)
            status = "High"

        results.append({
            "parameter": param,
            "value": value,
            "reference_range": f"{low} - {high}",
            "unit": unit,
            "status": status,
            "numeric": True,
        })
    return results


def analyze_single_report(report):
    """report: a MongoDB report document (dict)."""
    report_type = report.get("report_type", "Blood Test")
    params = generate_demo_parameters(report.get("_id"), report_type)

    abnormal = [p for p in params if p["status"] in ("Low", "High", "Attention")]
    dept = REPORT_TYPE_DEPARTMENT.get(report_type, "General Medicine")

    return {
        "report_name": report.get("report_name"),
        "report_type": report_type,
        "parameters": params,
        "abnormal_count": len(abnormal),
        "normal_count": len(params) - len(abnormal),
        "recommended_department": dept if abnormal else None,
        "disclaimer": DISCLAIMER,
    }


def analyze_multiple_reports(reports):
    """Combined analysis for 2+ selected reports (or 'all reports')."""
    individual = []
    all_params = []
    dept_votes = {}
    contributing = {}

    for report in reports:
        single = analyze_single_report(report)
        individual.append(single)
        all_params.extend([(report.get("report_name"), p) for p in single["parameters"]])
        if single["abnormal_count"] > 0:
            dept = single["recommended_department"] or "General Medicine"
            dept_votes[dept] = dept_votes.get(dept, 0) + single["abnormal_count"]
            contributing.setdefault(dept, []).append(report.get("report_name"))

    observations = []
    for report_name, p in all_params:
        if p["status"] != "Normal":
            unit = f" {p['unit']}" if p.get("unit") else ""
            observations.append(
                f"{p['parameter']} is {p['status']} in {report_name} "
                f"(value: {p['value']}{unit}, reference: {p['reference_range']})"
            )

    if dept_votes:
        recommended_department = max(dept_votes, key=dept_votes.get)
    else:
        recommended_department = None

    total_normal = sum(s["normal_count"] for s in individual)
    total_abnormal = sum(s["abnormal_count"] for s in individual)

    return {
        "total_reports": len(reports),
        "individual_summaries": individual,
        "combined_observations": observations if observations else
            ["All analyzed parameters fall within the simulated normal reference range."],
        "recommended_department": recommended_department,
        "contributing_reports": contributing.get(recommended_department, []) if recommended_department else [],
        "total_normal_parameters": total_normal,
        "total_abnormal_parameters": total_abnormal,
        "disclaimer": DISCLAIMER,
    }


def dashboard_stats(reports):
    """Aggregate stats for the health analysis dashboard / Chart.js."""
    total_normal = 0
    total_borderline = 0
    total_attention = 0
    timeline = []

    for report in reports:
        single = analyze_single_report(report)
        for p in single["parameters"]:
            if p["status"] == "Normal":
                total_normal += 1
            elif p["status"] in ("Low", "High"):
                total_borderline += 1
            else:
                total_attention += 1
        timeline.append({
            "date": report.get("upload_date").strftime("%Y-%m-%d") if report.get("upload_date") else "",
            "report_name": report.get("report_name"),
            "abnormal_count": single["abnormal_count"],
        })

    total_params = total_normal + total_borderline + total_attention
    health_score = round((total_normal / total_params) * 100) if total_params else 100

    return {
        "total_reports": len(reports),
        "reports_analyzed": len(reports),
        "normal_parameters": total_normal,
        "borderline_parameters": total_borderline,
        "attention_parameters": total_attention,
        "health_score": health_score,
        "timeline": sorted(timeline, key=lambda t: t["date"]),
    }
