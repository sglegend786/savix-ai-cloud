from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from config import Config
from models import db, Hospital, Admin, UserRecord
import jwt
from functools import wraps
from datetime import datetime
import os
import pymongo

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

@app.before_request
def require_auth():
    allowed_endpoints = ['sso', 'sso_login', 'static', 'hospital_login', 'admin_login', 'hospital_register']
    if request.endpoint not in allowed_endpoints and not session.get('user_id'):
        return redirect("http://127.0.0.1:8080/index.html")

# Attempt to connect to MongoDB if needed by the utils
try:
    mongo_client = pymongo.MongoClient(app.config['MONGO_URI'], serverSelectionTimeoutMS=2000)
    mongo_db = mongo_client.get_database()
except:
    mongo_db = None

# Custom decorators for roles
def login_required_role(role):
    def wrapper(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session or session.get('role') != role:
                if role == 'user':
                    return redirect("http://127.0.0.1:8080/index.html")
                elif role == 'hospital':
                    return redirect(url_for('hospital_login'))
                elif role == 'admin':
                    return redirect(url_for('admin_login'))
            return f(*args, **kwargs)
        return decorated_function
    return wrapper

@app.route('/')
def index():
    # If already logged in, redirect to correct dashboard
    role = session.get('role')
    if role == 'user':
        return redirect(url_for('patient_dashboard'))
    elif role == 'hospital':
        return redirect(url_for('hospital_dashboard'))
    elif role == 'admin':
        return redirect(url_for('admin_dashboard'))
    
    return render_template('index.html')

# ----------------- SSO Authentication for Users -----------------
@app.route('/sso')
def sso():
    token = request.args.get('token')
    if not token:
        return redirect("http://127.0.0.1:8080/index.html")
    
    try:
        decoded = jwt.decode(token, 'schemesathi_secret_key_2026', algorithms=['HS256'])
        session['user_id'] = decoded.get('id')
        session['name'] = decoded.get('name')
        session['email'] = decoded.get('email')
        session['role'] = 'user'
        
        # Keep minimal user record
        user = UserRecord.query.get(session['user_id'])
        if not user:
            user = UserRecord(id=session['user_id'], name=session['name'], email=session['email'])
            db.session.add(user)
        else:
            user.last_login = datetime.utcnow()
        db.session.commit()
        
        return redirect(url_for('patient_dashboard'))
    except jwt.ExpiredSignatureError:
        return "SSO Error: Token has expired", 401
    except jwt.InvalidTokenError as e:
        return f"SSO Error: Invalid token - {str(e)}", 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# ----------------- Hospital Auth -----------------
@app.route('/hospital/login', methods=['GET', 'POST'])
def hospital_login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        hospital = Hospital.query.filter_by(email=email).first()
        if hospital and hospital.check_password(password):
            if not hospital.is_approved:
                flash("Your hospital account is pending admin approval.")
                return redirect(url_for('hospital_login'))
            session['user_id'] = hospital.id
            session['name'] = hospital.name
            session['role'] = 'hospital'
            return redirect(url_for('hospital_dashboard'))
        flash("Invalid email or password")
    return render_template('hospital_login.html')

@app.route('/hospital/register', methods=['GET', 'POST'])
def hospital_register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if Hospital.query.filter_by(email=email).first():
            flash("Email already registered")
            return redirect(url_for('hospital_register'))
            
        new_hosp = Hospital(name=name, email=email)
        new_hosp.set_password(password)
        db.session.add(new_hosp)
        db.session.commit()
        
        flash("Registration successful. Please wait for admin approval.")
        return redirect(url_for('hospital_login'))
    return render_template('hospital_register.html')

# ----------------- Admin Auth -----------------
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        admin = Admin.query.filter_by(email=email).first()
        if admin and admin.check_password(password):
            session['user_id'] = admin.id
            session['role'] = 'admin'
            return redirect(url_for('admin_dashboard'))
        flash("Invalid admin credentials")
    return render_template('admin_login.html')

# ----------------- Dashboards -----------------
@app.route('/patient/dashboard')
@login_required_role('user')
def patient_dashboard():
    return render_template('patient_dashboard.html', name=session.get('name'))

@app.route('/hospital/dashboard')
@login_required_role('hospital')
def hospital_dashboard():
    return render_template('hospital_dashboard.html', name=session.get('name'))

@app.route('/admin/dashboard')
@login_required_role('admin')
def admin_dashboard():
    hospitals = Hospital.query.all()
    return render_template('admin_dashboard.html', hospitals=hospitals)

@app.route('/admin/approve/<int:hosp_id>', methods=['POST'])
@login_required_role('admin')
def approve_hospital(hosp_id):
    h = Hospital.query.get_or_404(hosp_id)
    h.is_approved = True
    db.session.commit()
    flash(f"Approved {h.name}")
    return redirect(url_for('admin_dashboard'))

# Database initialization
with app.app_context():
    db.create_all()
    # Create default admin if not exists
    if not Admin.query.filter_by(email='admin@savix.ai').first():
        a = Admin(email='admin@savix.ai')
        a.set_password('admin123')
        db.session.add(a)
        db.session.commit()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=False)
