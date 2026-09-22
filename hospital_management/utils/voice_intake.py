"""
Multilingual Voice AI - structured-information extraction layer.

The actual speech-to-text happens in the browser via the real Web Speech
API (static/js/voice_intake.js) - no external API key required, and it
genuinely works in Speech-API-capable browsers (e.g. Chrome) for English
and Hindi. This module takes the transcribed text (whichever language)
and extracts structured symptom/duration information using a small
bilingual keyword map, then hands off to the existing triage engine -
architecture is extensible to more regional languages by extending the
keyword map below.
"""

import re

# English term -> canonical symptom key (matches utils/triage.py's set)
SYMPTOM_KEYWORDS = {
    "fever": "fever", "bukhar": "fever",
    "cough": "cough", "khansi": "cough",
    "breathing difficulty": "breathing difficulty", "saans lene mein dikkat": "breathing difficulty",
    "shortness of breath": "breathing difficulty", "saans": "breathing difficulty",
    "chest pain": "chest pain", "seene mein dard": "chest pain",
    "headache": "headache", "sar dard": "headache", "sir dard": "headache",
    "vomiting": "vomiting", "ulti": "vomiting",
    "diarrhea": "diarrhea", "diarrhoea": "diarrhea", "dast": "diarrhea",
    "weakness": "weakness", "kamzori": "weakness",
}

DURATION_PATTERN = re.compile(
    r"(\d+)\s*(din|days?|hafta|weeks?|ghante|hours?)", re.IGNORECASE)


def extract_structured_intake(text):
    """text: raw transcribed speech (English or Hindi, romanized or native
    script both handled loosely via substring matching).
    Returns {symptoms: [...], duration: str|None, raw_text: str}
    """
    text_lower = (text or "").lower()
    found_symptoms = []
    for phrase, canonical in SYMPTOM_KEYWORDS.items():
        if phrase in text_lower and canonical not in found_symptoms:
            found_symptoms.append(canonical)

    duration = None
    match = DURATION_PATTERN.search(text_lower)
    if match:
        duration = f"{match.group(1)} {match.group(2)}"

    return {"symptoms": found_symptoms, "duration": duration, "raw_text": text}
