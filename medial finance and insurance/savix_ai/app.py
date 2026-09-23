import os
from flask import Flask, render_template
from flask_login import current_user
from flask_cors import CORS

from config import Config
from extensions import db, login_manager, oauth, csrf, limiter
from models import User


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for the REST API
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)

    if app.config["GOOGLE_OAUTH_ENABLED"]:
        oauth.init_app(app)
        oauth.register(
            name="google",
            client_id=app.config["GOOGLE_CLIENT_ID"],
            client_secret=app.config["GOOGLE_CLIENT_SECRET"],
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Register blueprints
    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.transactions import transactions_bp
    from routes.analytics import analytics_bp
    from routes.budget import budget_bp
    from routes.investments import investments_bp
    from routes.profile import profile_bp
    from routes.insights import insights_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(investments_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(insights_bp)

    # Phase 2+: new blueprints
    from routes.health import health_bp
    from routes.goals import goals_bp
    from routes.debt import debt_bp
    from routes.api import api_bp
    from routes.insurance import insurance_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(debt_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(insurance_bp)

    import jwt
    from flask import request, redirect, url_for, flash
    from flask_login import login_user

    @app.route('/sso')
    def sso_login():
        token = request.args.get('token')
        if not token:
            flash("No SSO token provided.")
            return redirect(url_for('auth.login'))
        
        try:
            # Shared secret with SchemeSathi Backend
            payload = jwt.decode(token, "schemesathi_secret_key_2026", algorithms=["HS256"])
            email = payload.get('email')
            name = payload.get('name', 'User')

            if not email:
                flash("Invalid token payload.")
                return redirect(url_for('auth.login'))

            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(
                    email=email,
                    name=name,
                    password_hash="sso_managed"
                )
                db.session.add(user)
                db.session.commit()

            login_user(user)
            return redirect(url_for('dashboard.index'))
            
        except Exception as e:
            print(f"================ SSO ERROR ===============")
            print(e)
            print(f"==========================================")
            import traceback
            traceback.print_exc()
            flash(f"SSO Error: {str(e)}")
            return redirect(url_for('auth.login'))

    # CSRF exempt for API endpoints that use JSON (not forms)
    csrf.exempt(transactions_bp)   # /transactions/predict uses JSON POST
    csrf.exempt(analytics_bp)      # pure GET APIs
    csrf.exempt(investments_bp)    # /api/investments/calculate uses JSON POST
    csrf.exempt(health_bp)         # GET API
    csrf.exempt(debt_bp)           # /api/debt/emi-calculator
    csrf.exempt(api_bp)            # REST API (uses JWT)
    csrf.exempt(insurance_bp)      # /api/insurance/recommend uses JSON POST


    @app.context_processor
    def inject_globals():
        return {"current_user": current_user}

    @app.errorhandler(404)
    def not_found(e):
        return render_template("404.html"), 404

    @app.errorhandler(500)
    def server_error(e):
        return render_template("500.html"), 500

    @app.errorhandler(429)
    def ratelimit_error(e):
        return render_template("429.html"), 429

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
