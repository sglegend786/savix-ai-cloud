import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Flask secret key (used to sign session cookies)
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production-12345")

    # MongoDB configuration
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "health_management_system")

    # Upload configuration
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads", "reports")
    HOSPITAL_IMAGE_FOLDER = os.path.join(BASE_DIR, "uploads", "hospitals")
    DOCTOR_IMAGE_FOLDER = os.path.join(BASE_DIR, "uploads", "doctors")
    ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB max upload size

    # Session
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8  # 8 hours

    # Scoring weights for "Best Hospital" algorithm
    HOSPITAL_SCORE_WEIGHTS = {
        "rating": 0.30,
        "doctor_availability": 0.25,
        "cost": 0.20,
        "distance": 0.15,
        "emergency_247": 0.10,
    }


def allowed_file(filename):
    return "." in filename and \
        filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
