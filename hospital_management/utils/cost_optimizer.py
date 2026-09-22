"""
Healthcare Cost Optimizer.

Rough, clearly-labelled cost ESTIMATES only (never a guarantee) built from
data already on the hospital record plus simple demo assumptions for
tests/medicines/travel. Reuses the existing hospital avg_cost field rather
than inventing a second cost model.
"""

TEST_COST_BY_PRIORITY = {"HIGH": 1200, "MEDIUM": 700, "LOW": 300}
MEDICINE_COST_ESTIMATE = 250
TRAVEL_COST_PER_KM = 12


def estimate_journey_cost(hospital, priority="MEDIUM"):
    """hospital: dict with avg_cost, distance_km (from utils.recommendation
    scoring or utils.rural_network results).
    Returns a labelled cost breakdown (INR), clearly an estimate.
    """
    consultation = hospital.get("avg_cost", 0) or 0
    tests = TEST_COST_BY_PRIORITY.get((priority or "MEDIUM").upper(), 700)
    medicines = MEDICINE_COST_ESTIMATE
    distance = hospital.get("distance_km", 0) or 0
    travel = round(distance * TRAVEL_COST_PER_KM * 2)  # round trip

    total = consultation + tests + medicines + travel

    return {
        "consultation": consultation,
        "tests": tests,
        "medicines": medicines,
        "travel": travel,
        "total": total,
    }


def cheapest_option(hospitals_with_cost):
    """hospitals_with_cost: list of dicts each already carrying an
    'estimated_cost' key (from estimate_journey_cost). Returns the cheapest
    or None.
    """
    if not hospitals_with_cost:
        return None
    return min(hospitals_with_cost, key=lambda h: h["estimated_cost"]["total"])
