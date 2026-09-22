"""
Smart Pharmacy: medicine search across registered pharmacies, with a
real price comparison and generic/alternative suggestions.
"""

from bson.objectid import ObjectId
from flask import Blueprint, render_template, request, current_app

from utils.decorators import login_required

pharmacy_bp = Blueprint("pharmacy", __name__, url_prefix="/pharmacy")


def get_db():
    return current_app.db


@pharmacy_bp.route("/")
@login_required(role=("health_worker", "user", "hospital"))
def search():
    db = get_db()
    query = request.args.get("medicine", "").strip()

    results = []
    alternatives = []
    if query:
        medicine_docs = list(db.medicines.find({"name": {"$regex": query, "$options": "i"}}))
        pharmacy_ids = {m["pharmacy_id"] for m in medicine_docs}
        pharmacies = {str(p["_id"]): p for p in db.pharmacies.find(
            {"_id": {"$in": [ObjectId(pid) for pid in pharmacy_ids]}})} if pharmacy_ids else {}

        for m in medicine_docs:
            pharmacy = pharmacies.get(m["pharmacy_id"])
            if not pharmacy:
                continue
            results.append({
                "medicine_name": m["name"],
                "pharmacy_name": pharmacy["pharmacy_name"],
                "price": m["price"],
                "in_stock": m.get("in_stock", True),
                "is_generic": m.get("is_generic", False),
                "distance_km": pharmacy.get("distance_km"),
                "contact": pharmacy.get("contact"),
            })
        results.sort(key=lambda r: r["price"])

        if results:
            base_name = results[0]["medicine_name"]
            generics = list(db.medicines.find({
                "generic_for": {"$regex": f"^{base_name}$", "$options": "i"}
            }))
            for g in generics:
                pharmacy = db.pharmacies.find_one({"_id": ObjectId(g["pharmacy_id"])})
                if pharmacy:
                    alternatives.append({
                        "medicine_name": g["name"], "pharmacy_name": pharmacy["pharmacy_name"],
                        "price": g["price"],
                    })

    return render_template("pharmacy_search.html", query=query, results=results, alternatives=alternatives)
