"""
Allergy / Medication contraindication cross-check.

Rule-based, keyword-driven matching between a patient's recorded
allergies and a medicine name - NOT a clinical drug-interaction database
and NOT a substitute for pharmacist/doctor review. Flags a possible
conflict for a human to check; it never blocks or changes a prescription
automatically.
"""

# allergy keyword -> (medicine keywords that may conflict, plain-language warning)
ALLERGY_MEDICINE_CONFLICTS = {
    "penicillin": (
        ["penicillin", "amoxicillin", "amoxyclav", "ampicillin", "augmentin"],
        "Penicillin-class antibiotic - contraindicated in a documented penicillin allergy.",
    ),
    "sulfa": (
        ["sulfamethoxazole", "sulfa", "cotrimoxazole", "bactrim"],
        "Sulfa-class drug - contraindicated in a documented sulfa allergy.",
    ),
    "aspirin": (
        ["aspirin", "disprin", "ecosprin"],
        "Contains aspirin - avoid if aspirin-sensitive.",
    ),
    "nsaid": (
        ["ibuprofen", "diclofenac", "naproxen", "nsaid", "brufen", "voveran"],
        "NSAID - avoid if the patient has an NSAID/aspirin sensitivity.",
    ),
    "latex": (
        [],  # latex allergy is a device/administration concern, not a medicine name match
        "Documented latex allergy - check administration equipment (gloves, vial stoppers), not just the medicine name.",
    ),
    "peanut": (
        [],
        "Documented peanut allergy - check inactive ingredients/excipients of any oral formulation.",
    ),
    "iodine": (
        ["iodine", "povidone-iodine"],
        "Contains iodine - avoid if iodine-sensitive; also relevant for contrast dye if imaging is planned.",
    ),
}


def check_conflicts(allergies, medicine_name):
    """allergies: list[str] (lowercase). medicine_name: str.
    Returns a list of plain-language warning strings (empty if none)."""
    if not allergies or not medicine_name:
        return []

    med_lower = medicine_name.lower()
    warnings = []
    for allergy in allergies:
        allergy = allergy.strip().lower()
        for known_allergy, (med_keywords, warning) in ALLERGY_MEDICINE_CONFLICTS.items():
            if known_allergy in allergy:
                if any(kw in med_lower for kw in med_keywords):
                    warnings.append(f"{medicine_name} may conflict with documented {allergy} allergy: {warning}")
                elif not med_keywords and known_allergy in allergy:
                    # allergy type has no medicine-name keyword match (e.g. latex/peanut) -
                    # still surface it as a general caution whenever ANY medicine is recorded
                    warnings.append(f"Patient has a documented {allergy} allergy - {warning}")
    return warnings


def check_all_adherence_records(patient_allergies, adherence_records):
    """Cross-check every recorded medicine against the patient's allergies.
    Returns list of {medicine_name, warnings} for records with a conflict."""
    results = []
    for record in adherence_records:
        warnings = check_conflicts(patient_allergies, record.get("medicine_name", ""))
        if warnings:
            results.append({"medicine_name": record.get("medicine_name", ""), "warnings": warnings})
    return results
