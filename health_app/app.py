import os
from datetime import timedelta

from flask import Flask, render_template, session, redirect, url_for
from pymongo import MongoClient
from bson.objectid import ObjectId

from config import Config

# ---------------------------------------------------------------------------
# App / DB initialisation
# ---------------------------------------------------------------------------

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.permanent_session_lifetime = timedelta(seconds=Config.PERMANENT_SESSION_LIFETIME)

    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.HOSPITAL_IMAGE_FOLDER, exist_ok=True)
    os.makedirs(Config.DOCTOR_IMAGE_FOLDER, exist_ok=True)

    client = MongoClient(Config.MONGO_URI, connect=False)
    db = client[Config.MONGO_DB_NAME]
    app.db = db  # attach db to app so blueprints can use current_app.db

    # -----------------------------------------------------------------
    # Register blueprints
    # -----------------------------------------------------------------
    from routes.auth import auth_bp
    from routes.hospital import hospital_bp
    from routes.doctor import doctor_bp
    from routes.user import user_bp
    from routes.appointment import appointment_bp
    from routes.reports import reports_bp
    from routes.health_worker import health_worker_bp
    from routes.referral import referral_bp
    from routes.api import api_bp
    from routes.pharmacy import pharmacy_bp
    from routes.blood import blood_bp
    from routes.emergency import emergency_bp
    from routes.wearable import wearable_bp
    from routes.hospital_resources import hospital_resources_bp
    from routes.media import media_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(hospital_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(appointment_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(health_worker_bp)
    app.register_blueprint(referral_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(pharmacy_bp)
    app.register_blueprint(blood_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(wearable_bp)
    app.register_blueprint(hospital_resources_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(admin_bp)

    # -----------------------------------------------------------------
    # Public landing page
    # -----------------------------------------------------------------
    @app.route("/")
    def index():
        if session.get("role") == "hospital":
            return redirect(url_for("hospital.dashboard"))
        if session.get("role") == "user":
            return redirect(url_for("user.dashboard"))
        if session.get("role") == "health_worker":
            return redirect(url_for("health_worker.dashboard"))
        if session.get("role") == "admin":
            return redirect(url_for("admin.dashboard"))
        return render_template("index.html")

    # -----------------------------------------------------------------
    # Language switching (i18n)
    # -----------------------------------------------------------------
    @app.route("/set-language/<lang>")
    def set_language(lang):
        from utils.i18n import SUPPORTED_LANGUAGES
        from flask import request as flask_request
        if lang in SUPPORTED_LANGUAGES:
            session["lang"] = lang
            session.permanent = True
            # Persist across login sessions for logged-in users
            role = session.get("role")
            try:
                if role == "user" and session.get("user_id"):
                    db.users.update_one({"_id": ObjectId(session["user_id"])},
                                         {"$set": {"preferred_language": lang}})
                elif role == "hospital" and session.get("hospital_id"):
                    db.hospitals.update_one({"_id": ObjectId(session["hospital_id"])},
                                             {"$set": {"preferred_language": lang}})
                elif role == "health_worker" and session.get("worker_id"):
                    db.health_workers.update_one({"_id": ObjectId(session["worker_id"])},
                                                  {"$set": {"preferred_language": lang}})
            except Exception:
                pass  # language switching must never break navigation
        return redirect(flask_request.referrer or url_for("index"))

    # -----------------------------------------------------------------
    # Template helpers
    # -----------------------------------------------------------------
    @app.context_processor
    def inject_session():
        from utils.i18n import translate, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE
        lang = session.get("lang", DEFAULT_LANGUAGE)

        def t(key, **kwargs):
            return translate(key, lang=lang, **kwargs)

        return dict(
            current_role=session.get("role"),
            current_name=session.get("name"),
            t=t,
            current_lang=lang,
            supported_languages=SUPPORTED_LANGUAGES,
        )

    @app.errorhandler(404)
    def not_found(e):
        return render_template("base.html", content_404=True), 404

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
