# -*- coding: utf-8 -*-
import sys
import os
from datetime import date
from flask import Flask
from config import Config
from extensions import db
from models import InsuranceScheme

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

schemes = [
    # 1. GOVERNMENT / SOCIAL SECURITY
    {
        'name': 'Ayushman Bharat - PM-JAY',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_HEALTH',
        'description': 'Free health coverage up to Rs 5 lakh per family per year for secondary and tertiary care hospitalization.',
        'premium_type': 'NO_BENEFICIARY_PREMIUM',
        'coverage_amount': 500000,
        'coverage_type': 'Family Floater',
        'cashless_available': True,
        'official_url': 'https://pmjay.gov.in',
        'source_url': 'https://pmjay.gov.in',
    },
    {
        'name': 'PM-JAY - 70+ Senior Citizens',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_HEALTH',
        'min_age': 70,
        'special_category': '70+ Senior Citizen',
        'premium_type': 'NO_BENEFICIARY_PREMIUM',
        'coverage_amount': 500000,
        'official_url': 'https://pmjay.gov.in',
    },
    {
        'name': 'Central Government Health Scheme (CGHS)',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_HEALTH',
        'special_category': 'Government employee',
        'premium_type': 'OFFICIAL',
        'official_url': 'https://cghs.mohfw.gov.in/',
    },
    {
        'name': 'ECHS - Ex-Servicemen Health Scheme',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_HEALTH',
        'special_category': 'Ex-serviceman',
        'premium_type': 'NO_BENEFICIARY_PREMIUM',
        'official_url': 'https://echs.gov.in/',
    },
    {
        'name': 'Ayushman CAPF',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_HEALTH',
        'special_category': 'CAPF',
        'premium_type': 'NO_BENEFICIARY_PREMIUM',
        'official_url': 'https://pmjay.gov.in/ayushman-capf',
    },
    {
        'name': 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
        'provider': 'Government of India',
        'category': 'ACCIDENT_INSURANCE',
        'min_age': 18,
        'max_age': 70,
        'premium_type': 'OFFICIAL',
        'premium_amount': 20,
        'premium_frequency': 'Yearly',
        'coverage_amount': 200000,
        'accident_cover': True,
        'official_url': 'https://jansuraksha.gov.in/',
    },
    {
        'name': 'Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)',
        'provider': 'Government of India',
        'category': 'LIFE_INSURANCE',
        'min_age': 18,
        'max_age': 50,
        'premium_type': 'OFFICIAL',
        'premium_amount': 436,
        'premium_frequency': 'Yearly',
        'coverage_amount': 200000,
        'official_url': 'https://jansuraksha.gov.in/',
    },
    {
        'name': 'Aam Aadmi Bima Yojana (AABY)',
        'provider': 'Government of India',
        'category': 'GOVERNMENT_SOCIAL_SECURITY',
        'premium_type': 'INDICATIVE',
        'coverage_amount': 30000,
        'official_url': 'https://licindia.in/',
    },

    # 2. STANDARD / SPECIALIZED HEALTH INSURANCE CATEGORIES
    { 'name': 'Arogya Sanjeevani Policy', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Saral Suraksha Bima', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'accident_cover': True },
    { 'name': 'Individual Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Family Floater Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'coverage_type': 'Family Floater' },
    { 'name': 'Senior Citizen Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'min_age': 60 },
    { 'name': 'Critical Illness Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'critical_illness': True },
    { 'name': 'Cancer Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'cancer': True },
    { 'name': 'Maternity Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'maternity': True },
    { 'name': 'Top-up Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Super Top-up Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Hospital Cash Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'hospital_cash': True },
    { 'name': 'Personal Accident Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE', 'accident_cover': True },
    { 'name': 'Group Health Insurance', 'category': 'HEALTH_INSURANCE_CATEGORY', 'premium_type': 'UNAVAILABLE' },

    # 3. LIFE INSURANCE PROVIDERS / PRODUCT CATEGORIES
    { 'name': 'LIC Life Insurance Plans', 'provider': 'LIC', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'SBI Life Insurance Plans', 'provider': 'SBI Life', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'HDFC Life Insurance Plans', 'provider': 'HDFC Life', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'ICICI Prudential Life Insurance Plans', 'provider': 'ICICI Prudential', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Max Life Insurance Plans', 'provider': 'Max Life', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Tata AIA Life Insurance Plans', 'provider': 'Tata AIA', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Bajaj Allianz Life Insurance Plans', 'provider': 'Bajaj Allianz', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Aditya Birla Sun Life Insurance Plans', 'provider': 'Aditya Birla', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Kotak Mahindra Life Insurance Plans', 'provider': 'Kotak Mahindra', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'PNB MetLife Insurance Plans', 'provider': 'PNB MetLife', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Canara HSBC Life Insurance Plans', 'provider': 'Canara HSBC', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'IndiaFirst Life Insurance Plans', 'provider': 'IndiaFirst', 'category': 'LIFE_INSURER', 'premium_type': 'UNAVAILABLE' },

    # 4. HEALTH INSURANCE PROVIDERS
    { 'name': 'SBI General Health Insurance', 'provider': 'SBI General', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'HDFC ERGO Health Insurance', 'provider': 'HDFC ERGO', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'ICICI Lombard Health Insurance', 'provider': 'ICICI Lombard', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Tata AIG Health Insurance', 'provider': 'Tata AIG', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Bajaj Allianz Health Insurance', 'provider': 'Bajaj Allianz', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Aditya Birla Health Insurance', 'provider': 'Aditya Birla', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Care Health Insurance', 'provider': 'Care Health', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Niva Bupa Health Insurance', 'provider': 'Niva Bupa', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Star Health Insurance', 'provider': 'Star Health', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'ManipalCigna Health Insurance', 'provider': 'ManipalCigna', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'ACKO Health Insurance', 'provider': 'ACKO', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Go Digit Health Insurance', 'provider': 'Go Digit', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Royal Sundaram Health Insurance', 'provider': 'Royal Sundaram', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'New India Assurance Health Insurance', 'provider': 'New India Assurance', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'National Insurance Health Insurance', 'provider': 'National Insurance', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'Oriental Insurance Health Insurance', 'provider': 'Oriental Insurance', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
    { 'name': 'United India Insurance Health Insurance', 'provider': 'United India Insurance', 'category': 'HEALTH_INSURER', 'premium_type': 'UNAVAILABLE' },
]

def seed_db():
    with app.app_context():
        # Only create schemes that don't exist
        for s in schemes:
            existing = InsuranceScheme.query.filter_by(name=s['name']).first()
            if not existing:
                print(f"Adding: {s['name']}")
                new_scheme = InsuranceScheme(
                    name=s['name'],
                    provider=s.get('provider', 'Various'),
                    category=s.get('category'),
                    description=s.get('description', 'Information is for educational purposes. Exact details depend on policy.'),
                    official_url=s.get('official_url'),
                    min_age=s.get('min_age'),
                    max_age=s.get('max_age'),
                    special_category=s.get('special_category'),
                    premium_type=s.get('premium_type'),
                    premium_amount=s.get('premium_amount'),
                    premium_frequency=s.get('premium_frequency'),
                    coverage_amount=s.get('coverage_amount'),
                    coverage_type=s.get('coverage_type', 'Depends on policy'),
                    accident_cover=s.get('accident_cover', False),
                    critical_illness=s.get('critical_illness', False),
                    cancer=s.get('cancer', False),
                    maternity=s.get('maternity', False),
                    hospital_cash=s.get('hospital_cash', False),
                    cashless_available=s.get('cashless_available', False),
                    last_verified=date.today()
                )
                db.session.add(new_scheme)
            else:
                print(f"Updating: {s['name']}")
                existing.provider = s.get('provider', existing.provider)
                existing.category = s.get('category', existing.category)
                existing.premium_type = s.get('premium_type', existing.premium_type)
        db.session.commit()
        print("Done seeding insurance schemes.")

if __name__ == '__main__':
    seed_db()
