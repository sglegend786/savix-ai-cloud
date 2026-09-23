def check_eligibility(user, scheme):
    reasons = []
    failed_conditions = []
    eligible = True

    # Check Age
    if scheme.min_age and user.get('age', 0) < scheme.min_age:
        eligible = False
        failed_conditions.append(f"Minimum age required is {scheme.min_age} years.")
    else:
        reasons.append("Meets age requirements.")

    if scheme.max_age and user.get('age', 0) > scheme.max_age:
        eligible = False
        failed_conditions.append(f"Maximum age limit is {scheme.max_age} years.")

    # Check Special Categories
    if scheme.special_category:
        sc = scheme.special_category.lower()
        if 'ex-serviceman' in sc and not user.get('is_ex_serviceman'):
            eligible = False
            failed_conditions.append("Must be an Ex-Serviceman.")
        elif 'capf' in sc and not user.get('is_capf'):
            eligible = False
            failed_conditions.append("Must be a CAPF personnel.")
        elif 'government employee' in sc and not user.get('is_govt_employee'):
            eligible = False
            failed_conditions.append("Must be a Government employee.")
        elif '70+ senior citizen' in sc and user.get('age', 0) < 70:
            eligible = False
            failed_conditions.append("Must be 70 years or above.")

    # Requirements check (e.g., maternity)
    requirements = user.get('requirements', [])
    if 'maternity' in requirements and not scheme.maternity and scheme.category != 'GOVERNMENT_HEALTH':
        reasons.append("Does not explicitly cover maternity as requested, but may have other benefits.")

    return {
        "eligible": eligible,
        "reasons": reasons,
        "failedConditions": failed_conditions
    }

def calculate_premium(user, scheme):
    ptype = scheme.premium_type
    if not ptype:
        ptype = 'UNAVAILABLE'

    # Government schemes with 0 beneficiary premium
    if ptype == 'NO_BENEFICIARY_PREMIUM':
        return {
            "type": "OFFICIAL",
            "amount": 0,
            "display": "₹0 Beneficiary Premium"
        }
    elif ptype == 'OFFICIAL' and scheme.premium_amount:
        return {
            "type": "OFFICIAL",
            "amount": scheme.premium_amount,
            "display": f"₹{int(scheme.premium_amount)} / {scheme.premium_frequency or 'Year'}"
        }
    elif ptype == 'INDICATIVE':
        amount = scheme.premium_amount or 1500
        return {
            "type": "INDICATIVE",
            "amount": amount,
            "display": f"~₹{int(amount)} (Estimated)"
        }
    
    return {
        "type": "UNAVAILABLE",
        "amount": None,
        "display": "Premium depends on insurer and user profile. Check Official Calculator"
    }

def calculate_savix_score(user, scheme, eligibility_res):
    score = 50 # Base score

    if not eligibility_res['eligible']:
        return 0 # Ineligible schemes get 0 score
    
    score += 15 # Eligibility points

    # Coverage mapping
    req_coverage = user.get('coverageRequired', 0)
    if scheme.coverage_amount and req_coverage > 0:
        if scheme.coverage_amount >= req_coverage:
            score += 25
        elif scheme.coverage_amount >= req_coverage * 0.5:
            score += 15
        else:
            score += 5
    elif scheme.category in ['HEALTH_INSURANCE_CATEGORY', 'HEALTH_INSURER']:
        score += 20 # Flexible coverage assumed

    # Affordability / Premium
    prem = calculate_premium(user, scheme)
    budget = user.get('budget', 0)
    if prem['amount'] is not None and budget > 0:
        if prem['amount'] <= budget:
            score += 20
        else:
            score -= 10
    elif prem['type'] == 'UNAVAILABLE':
        score += 10 # Neutral if unknown

    # User Requirements
    reqs = user.get('requirements', [])
    if 'family' in reqs and scheme.coverage_type == 'Family Floater':
        score += 5
    if 'maternity' in reqs and scheme.maternity:
        score += 5
    if 'critical_illness' in reqs and scheme.critical_illness:
        score += 5
    if 'cancer' in reqs and scheme.cancer:
        score += 5
    if 'cashless' in reqs and scheme.cashless_available:
        score += 5

    # Government bias
    if scheme.category == 'GOVERNMENT_HEALTH':
        score += 10
    
    return min(100, max(0, int(score)))

def recommend_best_insurance(user_profile, all_schemes):
    results = []

    for scheme in all_schemes:
        eligibility = check_eligibility(user_profile, scheme)
        score = calculate_savix_score(user_profile, scheme, eligibility)
        premium_info = calculate_premium(user_profile, scheme)
        
        reasons_list = eligibility['reasons'][:]
        if score > 80:
            reasons_list.append("Highly matches your profile and coverage requirements.")
        if premium_info['type'] == 'UNAVAILABLE':
            reasons_list.append("Final premium depends on insurer underwriting.")

        results.append({
            "scheme": scheme.to_dict(),
            "eligibility": eligibility,
            "savix_score": score,
            "premium": premium_info,
            "recommendation_reasons": reasons_list
        })
    
    # Sort by score descending
    results.sort(key=lambda x: x['savix_score'], reverse=True)
    
    eligible = [r for r in results if r['eligibility']['eligible']]
    ineligible = [r for r in results if not r['eligibility']['eligible']]
    
    top_recommendations = eligible[:3] if len(eligible) >= 3 else eligible
    
    return {
        "recommendations": top_recommendations,
        "all_eligible": eligible,
        "ineligible": ineligible
    }
