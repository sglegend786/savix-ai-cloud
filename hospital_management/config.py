import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-sso-key-123'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///hospital.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MongoDB config for the legacy health tools
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/hospital_db')
