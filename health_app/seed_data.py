"""
seed_data.py

Populates MongoDB with demo/academic data:
 - 4 hospitals (United Medicity is the flagship demo "best hospital")
 - 5 departments per hospital
 - Several doctors per hospital across departments
 - 2 demo patient accounts

Run with:  python seed_data.py
This WIPES existing data in the relevant collections before reseeding,
so it is safe to re-run during development.
"""

from datetime import datetime

from pymongo import MongoClient
from werkzeug.security import generate_password_hash

from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.MONGO_DB_NAME]

DEPARTMENTS = [
    "Bone & Orthopedics",
    "Cardiology",
    "Liver / Gastroenterology",
    "Neurology",
    "Pulmonology",
]


def reset_collections():
    for name in ["hospitals", "doctors", "departments", "users", "appointments",
                 "reports", "prescriptions", "reviews", "analysis_results",
                 "health_workers", "care_patients", "visits", "referrals",
                 "pharmacies", "medicines", "blood_banks", "blood_requests",
                 "emergency_alerts"]:
        db[name].delete_many({})
    print("Cleared existing demo collections.")


def seed_pharmacies_and_medicines():
    pharmacies = [
        {"pharmacy_name": "Rampur Village Pharmacy", "distance_km": 1.2, "contact": "9876500001"},
        {"pharmacy_name": "PHC Barabanki Medical Store", "distance_km": 4.5, "contact": "9876500002"},
        {"pharmacy_name": "United Medicity Pharmacy", "distance_km": 5.1, "contact": "9876500003"},
    ]
    result = db.pharmacies.insert_many(pharmacies)
    pids = [str(pid) for pid in result.inserted_ids]

    medicines = [
        {"pharmacy_id": pids[0], "name": "Paracetamol 500mg", "price": 20, "in_stock": True, "is_generic": False},
        {"pharmacy_id": pids[1], "name": "Paracetamol 500mg", "price": 15, "in_stock": True, "is_generic": False},
        {"pharmacy_id": pids[2], "name": "Paracetamol 500mg", "price": 25, "in_stock": True, "is_generic": False},
        {"pharmacy_id": pids[1], "name": "Paracet (Generic)", "price": 8, "in_stock": True, "is_generic": True, "generic_for": "Paracetamol 500mg"},
        {"pharmacy_id": pids[0], "name": "Amoxicillin 250mg", "price": 60, "in_stock": True, "is_generic": False},
        {"pharmacy_id": pids[2], "name": "Amoxicillin 250mg", "price": 55, "in_stock": False, "is_generic": False},
        {"pharmacy_id": pids[1], "name": "ORS Sachet", "price": 10, "in_stock": True, "is_generic": False},
    ]
    db.medicines.insert_many(medicines)
    print(f"Inserted {len(pharmacies)} pharmacies and {len(medicines)} medicine listings.")


def seed_blood_banks():
    banks = [
        {"bank_name": "District Blood Bank, Barabanki", "facility": "District Hospital",
         "distance_km": 6.0, "contact": "9876511111",
         "stock": {"O+": 12, "O-": 2, "A+": 8, "A-": 1, "B+": 10, "B-": 3, "AB+": 4, "AB-": 0},
         "last_updated": datetime.utcnow()},
        {"bank_name": "United Medicity Blood Bank", "facility": "United Medicity Hospital",
         "distance_km": 5.1, "contact": "9876522222",
         "stock": {"O+": 5, "O-": 0, "A+": 6, "A-": 2, "B+": 4, "B-": 1, "AB+": 2, "AB-": 1},
         "last_updated": datetime.utcnow()},
    ]
    result = db.blood_banks.insert_many(banks)
    print(f"Inserted {len(result.inserted_ids)} blood bank(s).")


def seed_hospitals():
    hospitals = [
        {
            "hospital_name": "United Medicity Hospital",
            "hospital_id_code": "HSP-001",
            "email": "admin@unitedmedicity.demo",
            "phone": "9000000001",
            "password_hash": generate_password_hash("hospital123"),
            "address": "MG Road",
            "city": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226001",
            "latitude": "26.8467",
            "longitude": "80.9462",
            "distance_km": 3.2,
            "hospital_type": "Multi-Specialty",
            "emergency": True,
            "available_247": True,
            "avg_cost": 800,
            "facilities": ["ICU", "Pharmacy", "Ambulance", "Lab", "Blood Bank", "Cafeteria"],
            "departments": DEPARTMENTS,
            "rating": 4.8,
            "image_url": "/static/images/hospital_default.jpg",
            "created_at": datetime.utcnow(),
            "role": "hospital",
        },
        {
            "hospital_name": "City Care Hospital",
            "hospital_id_code": "HSP-002",
            "email": "admin@citycare.demo",
            "phone": "9000000002",
            "password_hash": generate_password_hash("hospital123"),
            "address": "Park Street",
            "city": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226002",
            "latitude": "26.85",
            "longitude": "80.95",
            "distance_km": 5.1,
            "hospital_type": "Multi-Specialty",
            "emergency": True,
            "available_247": False,
            "avg_cost": 1200,
            "facilities": ["ICU", "Pharmacy", "Lab"],
            "departments": DEPARTMENTS,
            "rating": 4.5,
            "image_url": "/static/images/hospital_default.jpg",
            "created_at": datetime.utcnow(),
            "role": "hospital",
        },
        {
            "hospital_name": "Life Line Hospital",
            "hospital_id_code": "HSP-003",
            "email": "admin@lifeline.demo",
            "phone": "9000000003",
            "password_hash": generate_password_hash("hospital123"),
            "address": "Station Road",
            "city": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226003",
            "latitude": "26.83",
            "longitude": "80.93",
            "distance_km": 7.4,
            "hospital_type": "General",
            "emergency": True,
            "available_247": True,
            "avg_cost": 600,
            "facilities": ["Pharmacy", "Ambulance", "Lab"],
            "departments": DEPARTMENTS,
            "rating": 4.4,
            "image_url": "/static/images/hospital_default.jpg",
            "created_at": datetime.utcnow(),
            "role": "hospital",
        },
        {
            "hospital_name": "Hope Hospital",
            "hospital_id_code": "HSP-004",
            "email": "admin@hope.demo",
            "phone": "9000000004",
            "password_hash": generate_password_hash("hospital123"),
            "address": "Civil Lines",
            "city": "Lucknow",
            "state": "Uttar Pradesh",
            "pincode": "226004",
            "latitude": "26.87",
            "longitude": "80.91",
            "distance_km": 6.2,
            "hospital_type": "Specialty Clinic",
            "emergency": False,
            "available_247": False,
            "avg_cost": 900,
            "facilities": ["Pharmacy", "Lab"],
            "departments": DEPARTMENTS,
            "rating": 4.2,
            "image_url": "/static/images/hospital_default.jpg",
            "created_at": datetime.utcnow(),
            "role": "hospital",
        },
    ]
    result = db.hospitals.insert_many(hospitals)
    print(f"Inserted {len(result.inserted_ids)} hospitals.")
    return dict(zip([h["hospital_name"] for h in hospitals], [str(i) for i in result.inserted_ids]))


def seed_departments(hospital_ids):
    docs = []
    for hospital_name, hid in hospital_ids.items():
        for dept in DEPARTMENTS:
            docs.append({"hospital_id": hid, "name": dept, "created_at": datetime.utcnow()})
    result = db.departments.insert_many(docs)
    print(f"Inserted {len(result.inserted_ids)} department records.")


def seed_doctors(hospital_ids):
    united_id = hospital_ids["United Medicity Hospital"]
    citycare_id = hospital_ids["City Care Hospital"]
    lifeline_id = hospital_ids["Life Line Hospital"]
    hope_id = hospital_ids["Hope Hospital"]

    doctors = [
        # United Medicity - flagship demo doctor
        {
            "hospital_id": united_id, "name": "Dr. K.D. Tripathi",
            "specialization": "Orthopedic Specialist", "department": "Bone & Orthopedics",
            "experience_years": 18, "rating": 4.9, "consultation_fee": 700,
            "available_today": True, "contact_number": "9876500001",
            "description": "Joint Replacement, Spine Surgery, Arthroscopy, Sports Injury specialist with 15,000+ patients treated.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": united_id, "name": "Dr. Amit Verma",
            "specialization": "Cardiologist", "department": "Cardiology",
            "experience_years": 14, "rating": 4.7, "consultation_fee": 900,
            "available_today": True, "contact_number": "9876500002",
            "description": "Interventional cardiologist specializing in angioplasty and preventive cardiology.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": united_id, "name": "Dr. Neha Sharma",
            "specialization": "Neurologist", "department": "Neurology",
            "experience_years": 11, "rating": 4.6, "consultation_fee": 800,
            "available_today": False, "contact_number": "9876500003",
            "description": "Specializes in migraine, epilepsy, and stroke management.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": united_id, "name": "Dr. Ritu Malhotra",
            "specialization": "Gastroenterologist", "department": "Liver / Gastroenterology",
            "experience_years": 9, "rating": 4.5, "consultation_fee": 650,
            "available_today": True, "contact_number": "9876500004",
            "description": "Liver disease and digestive disorder specialist.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": united_id, "name": "Dr. Sameer Khan",
            "specialization": "Pulmonologist", "department": "Pulmonology",
            "experience_years": 12, "rating": 4.6, "consultation_fee": 700,
            "available_today": True, "contact_number": "9876500005",
            "description": "Asthma, COPD, and respiratory infection specialist.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        # City Care Hospital
        {
            "hospital_id": citycare_id, "name": "Dr. Rakesh Gupta",
            "specialization": "Orthopedic Surgeon", "department": "Bone & Orthopedics",
            "experience_years": 10, "rating": 4.3, "consultation_fee": 600,
            "available_today": True, "contact_number": "9876500006",
            "description": "General orthopedics and trauma care.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": citycare_id, "name": "Dr. Pooja Nair",
            "specialization": "Cardiologist", "department": "Cardiology",
            "experience_years": 8, "rating": 4.2, "consultation_fee": 750,
            "available_today": False, "contact_number": "9876500007",
            "description": "Non-invasive cardiology and echocardiography.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        # Life Line Hospital
        {
            "hospital_id": lifeline_id, "name": "Dr. Manoj Yadav",
            "specialization": "Neurologist", "department": "Neurology",
            "experience_years": 7, "rating": 4.1, "consultation_fee": 550,
            "available_today": True, "contact_number": "9876500008",
            "description": "General neurology and headache disorders.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        {
            "hospital_id": lifeline_id, "name": "Dr. Anjali Singh",
            "specialization": "Pulmonologist", "department": "Pulmonology",
            "experience_years": 6, "rating": 4.0, "consultation_fee": 500,
            "available_today": True, "contact_number": "9876500009",
            "description": "Respiratory care and allergy management.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
        # Hope Hospital
        {
            "hospital_id": hope_id, "name": "Dr. Suresh Chandra",
            "specialization": "Gastroenterologist", "department": "Liver / Gastroenterology",
            "experience_years": 15, "rating": 4.4, "consultation_fee": 720,
            "available_today": False, "contact_number": "9876500010",
            "description": "Hepatology and endoscopic procedures.",
            "image_url": "/static/images/doctor_default.jpg", "created_at": datetime.utcnow(),
        },
    ]
    result = db.doctors.insert_many(doctors)
    print(f"Inserted {len(result.inserted_ids)} doctors.")


def seed_users():
    users = [
        {
            "name": "Rahul Verma", "email": "patient@demo.com", "phone": "9123456780",
            "age": "34", "gender": "Male",
            "password_hash": generate_password_hash("patient123"),
            "created_at": datetime.utcnow(), "role": "user",
        },
        {
            "name": "Sneha Kapoor", "email": "sneha@demo.com", "phone": "9123456781",
            "age": "28", "gender": "Female",
            "password_hash": generate_password_hash("patient123"),
            "created_at": datetime.utcnow(), "role": "user",
        },
    ]
    result = db.users.insert_many(users)
    print(f"Inserted {len(result.inserted_ids)} demo patients.")


def seed_health_workers():
    workers = [
        {
            "name": "Meena Devi", "email": "asha@demo.com", "phone": "9123456790",
            "worker_type": "ASHA", "facility": "PHC Barabanki",
            "village_coverage": ["Rampur", "Sultanpur"],
            "password_hash": generate_password_hash("worker123"),
            "created_at": datetime.utcnow(), "role": "health_worker",
        },
    ]
    result = db.health_workers.insert_many(workers)
    print(f"Inserted {len(result.inserted_ids)} demo health worker(s).")


def seed_admins():
    admins = [{
        "name": "System Administrator",
        "email": "admin@savix.demo",
        "password_hash": generate_password_hash("admin123"),
        "created_at": datetime.utcnow(),
        "role": "admin",
    }]
    result = db.admins.insert_many(admins)
    print(f"Inserted {len(result.inserted_ids)} admin account(s).")


def main():
    """Fresh-start seeding: clears everything and creates ONLY non-account
    reference data (pharmacies, blood banks) that has no login credentials
    attached. No hospitals, doctors, departments, patients, health workers,
    or admin accounts are created - you register every account yourself
    through the app's own registration pages, starting from a truly empty
    system.

    To create the very first System Admin account (which has no public
    self-registration link by design), start the app and open
    /admin/register - that route only works while zero admin accounts
    exist, then locks itself.

    If you want the old bundle of realistic demo data (sample hospitals,
    doctors, departments, a demo patient, a demo health worker and a demo
    admin) for quick manual testing instead, run:
        python seed_data.py --with-demo-accounts
    """
    reset_collections()
    seed_pharmacies_and_medicines()
    seed_blood_banks()
    print("\nFresh start complete. No login accounts were created.")
    print("Register your own Hospital / Patient / Health Worker account from the homepage.")
    print("For the first System Admin account, open /admin/register in your browser.")


def main_with_demo_accounts():
    reset_collections()
    hospital_ids = seed_hospitals()
    seed_departments(hospital_ids)
    seed_doctors(hospital_ids)
    seed_users()
    seed_health_workers()
    seed_admins()
    seed_pharmacies_and_medicines()
    seed_blood_banks()

    print("\n===== DEMO LOGIN CREDENTIALS =====")
    print("Hospital Admin (United Medicity): admin@unitedmedicity.demo / hospital123")
    print("Hospital Admin (City Care):       admin@citycare.demo / hospital123")
    print("Hospital Admin (Life Line):       admin@lifeline.demo / hospital123")
    print("Hospital Admin (Hope):            admin@hope.demo / hospital123")
    print("Patient:                          patient@demo.com / patient123")
    print("Patient:                          sneha@demo.com / patient123")
    print("Health Worker (ASHA):             asha@demo.com / worker123")
    print("System Admin:                     admin@savix.demo / admin123")
    print("===================================\n")
    print("Seeding complete.")


if __name__ == "__main__":
    import sys
    if "--with-demo-accounts" in sys.argv:
        main_with_demo_accounts()
    else:
        main()
