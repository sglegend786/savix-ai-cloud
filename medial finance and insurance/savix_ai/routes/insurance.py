from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from models import InsuranceScheme
from services.insurance_engine import recommend_best_insurance

insurance_bp = Blueprint('insurance', __name__)

@insurance_bp.route('/insurance', methods=['GET'])
@login_required
def insurance_advisor():
    return render_template('insurance/index.html')

@insurance_bp.route('/api/insurance/recommend', methods=['POST'])
def recommend_insurance():
    data = request.json or {}
    
    if data.get('age', 0) <= 0:
        return jsonify({'error': 'Age must be greater than 0'}), 400
        
    all_schemes = InsuranceScheme.query.all()
    
    result = recommend_best_insurance(data, all_schemes)
    
    return jsonify({
        'recommendations': result['recommendations'],
        'all_eligible': result['all_eligible'],
        'ineligible': result['ineligible'],
        'disclaimer': 'Information is for comparison/educational purposes. Final eligibility, premium and policy terms must be confirmed from the official provider.'
    })

@insurance_bp.route('/api/insurance', methods=['GET'])
def get_insurance():
    category = request.args.get('category')
    query = InsuranceScheme.query
    if category:
        query = query.filter_by(category=category)
    
    schemes = query.all()
    return jsonify([s.to_dict() for s in schemes])
