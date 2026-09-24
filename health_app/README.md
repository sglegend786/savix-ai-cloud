# SAVIX-AI — Rural Integrated Healthcare Platform

## 1. Project Overview

SAVIX-AI is a Flask + MongoDB healthcare platform that started as an
AI-assisted hospital/doctor recommendation and report-analysis app for
patients, and has been extended into an integrated **rural healthcare
coordination platform**: a frontline Health Worker (ASHA/ANM/PHC) can
register a village patient, run AI-assisted triage, refer them up the
healthcare chain with zero data loss (including fully offline), and the
system tracks that patient's journey — with early-warning, cost,
pharmacy, blood, and emergency support — all the way to follow-up.

Existing patient/doctor/hospital-facing features (hospital & doctor
recommendation, appointment booking, video consultation, digital
prescriptions, AI report analysis) are preserved and unmodified in their
core logic; the rural healthcare layer was added alongside them, reusing
the same Flask app, MongoDB database, authentication system, and design
language.

## 2. SIH Problem Statement

**ID 26133** — Accessibility and quality of public healthcare services,
particularly in rural and underserved areas.

## 3. Architecture

- **Backend:** Flask (blueprint-per-module), session-based auth, PyMongo
- **Database:** MongoDB (single database, multiple collections — see §9)
- **Frontend:** Server-rendered Jinja templates + Bootstrap 5, vanilla JS
  (no heavy frontend framework, deliberately light for low-end devices)
- **Offline:** IndexedDB (client) + a Service Worker for the static app
  shell + a REST sync endpoint (server)
- **Roles:** `user` (patient), `health_worker`, `hospital` — each with
  its own login/session and role-scoped routes (`utils/decorators.py`
  enforces this server-side, not just hidden buttons)

```
Village -> Health Worker -> Offline/AI Triage -> Smart Referral -> PHC
        -> District Hospital -> Specialist -> Treatment
        -> Pharmacy / Blood / Reports -> Follow-up -> Health Timeline
        -> Early Warning
```

## 4. Features

### Original (preserved)
Patient registration/profile, hospital & doctor management, hospital/doctor
recommendation & comparison, appointment booking, live consultation,
digital prescriptions, medical reports + AI report analysis.

### Rural Healthcare Layer (new)
| Area | What it does |
|---|---|
| Health Worker Dashboard | Registration, vitals, symptoms, triage, referrals, follow-ups, high-risk, offline queue, emergency — all in one role-scoped dashboard |
| Zero-Loss Referral Tracking | 9-state journey (`REFERRED` through `COMPLETED`/`CANCELLED`), full field set, visual timeline, rule-based alerts (overdue, missed appointment, no-arrival, missed follow-up, high-priority-pending) |
| Referral Dropout Risk | Explainable LOW/MEDIUM/HIGH score from alerts + priority + age + prior missed follow-ups |
| Rural to Tertiary Network | Referral-destination recommendation reusing the existing hospital scoring engine, with plain-language reasons |
| Deterioration Early Warning | Longitudinal trend across a patient's visits (SpO2, temperature, BP, repeated high triage, missed follow-ups) -> NORMAL/WATCH/HIGH RISK |
| Offline-First | IndexedDB queue (visits + referrals), Service Worker app shell, automatic sync with retry + idempotent duplicate prevention, Offline Queue page (Pending/Failed+Retry/Synced) |
| AI Health Intelligence | Combines visit/referral/follow-up history into short explainable observations |
| Health Timeline | Chronological view of registration, visits, referrals, status changes, emergencies |
| Smart Pharmacy | Real medicine search across seeded pharmacies with price comparison + generic-alternative flag |
| Smart Blood Finder | Blood bank search by group/urgency, request lifecycle REQUESTED->RESERVED->DISPATCHED->RECEIVED (dispatch decrements real stock) |
| Emergency / Pre-hospital | Health-worker-triggered SOS, state machine, nearest-hospital lookup (reuses referral recommendation), simulated notification |
| Wearable Monitoring | Simulated device readings fed into the real triage engine, clearly marked DEMO/SIMULATED |
| Live Queue / Token System | Confirming an appointment auto-assigns a sequential token (per hospital, per date); hospital can Call Next/Mark Completed; patients see live position & estimated wait |
| Health Timeline PDF Export | Downloadable PDF of a patient's full timeline (registration, visits, referrals, medication, emergencies), generated with reportlab |
| Smart Hospital Location | OpenStreetMap + Leaflet map on hospital pages, Google Maps directions deep-link, "Hospitals Near Me" via browser geolocation with haversine distance, graceful fallback when permission is denied or coordinates are missing |
| Department Management | Full CRUD for hospital admins (name, description, specialist type, timings, contact, status), activate/deactivate, duplicate prevention, public department page listing its doctors |
| Multilingual (EN/HI) | Centralised JSON i18n (translations/en.json, hi.json) with proper Devanagari, language switcher on app + public pages, persists in session and on the user record across logins, missing-key fallback |
| Image Management | Hospital profile/logo/gallery + doctor photographs: upload, preview, replace, delete; Pillow content validation blocks renamed executables; unique filenames; old files cleaned up on replace |
| Image Moderation & Verification | Admin role approves/rejects/deletes images; rejected images revert to the default placeholder. Admin-only Verified badges for hospitals and doctors — never automatic |
| Search & Filters | Hospitals by name/city/department/emergency, sorted by nearest/name/rating; doctors by name/specialization/department/hospital, sorted by name/rating/availability |
| Allergy / Medication Cross-Check | Rule-based keyword matching between recorded allergies and medicine names (penicillin, sulfa, aspirin/NSAID, latex, peanut, iodine); flags conflicts, never blocks or changes a prescription |
| Multilingual Voice AI | Real browser Speech-to-Text (English/Hindi) -> bilingual keyword extraction -> auto-checks matching symptoms |
| Cost Optimizer | Consultation + tests + medicines + travel estimate per recommended hospital, cheapest flagged |
| Personal Health Score | Explainable 0-100 score with +/- reasons |
| Medication Adherence | Tracks adherence; flags a "treatment-review" alert if adherence is good but triage priority isn't improving |
| AI Patient Journey Orchestrator | Derives current step / next step / pending action from existing data — no separate collection |
| Hospital Digital Twin | Beds/ICU/OT/doctors/OPD/emergency/ambulance CRUD dashboard, editable by the hospital |
| Predictive Hospital Resource Engine | Explainable near-term bed-demand estimate from pending referrals + current occupancy |
| ABDM/ABHA-ready architecture | Optional ABHA ID field, consent capture (`consents` collection), audit logging (`audit_logs`) — **not a live integration** |

## 5. AI Modules (all decision-support, none diagnostic)

- `utils/triage.py` — rule-based single-visit triage
- `utils/early_warning.py` — longitudinal trend monitoring
- `utils/care_records.py` (`estimate_dropout_risk`) — referral dropout risk
- `utils/rural_network.py` — referral-destination recommendation
- `utils/health_intelligence.py` — combined patient insights
- `utils/health_score.py` — personal health score
- `utils/cost_optimizer.py` — journey cost estimate
- `utils/medication.py` — treatment-review alerting
- `utils/journey.py` — patient journey orchestrator
- `utils/voice_intake.py` — bilingual structured intake extraction

Every one of these is **rule-based and explainable by design** (per the
brief: "design the architecture so a future ML model can replace the
initial rule-based engine"), and every AI-surfaced screen carries some
form of the disclaimer: *"SAVIX-AI provides AI-assisted information and
decision support. It does not replace a qualified healthcare
professional."* None of them prescribe medication or claim a diagnosis.

## 6. Offline Architecture

- **Detection:** `navigator.onLine` **and** a real `GET /api/health`
  reachability check (a device can be "online" but unable to reach the
  backend)
- **Storage:** IndexedDB, two stores — `pending_records` (PENDING /
  SYNCING / FAILED) and `synced_records` (capped history)
- **Record shape:** `{ localId, recordType, patientId, timestamp, data,
  syncStatus, retryCount, lastSyncAttempt, errorMessage }`
- **What works offline:** patient registration, vitals, symptoms, local
  rule-based triage (mirrors the server engine), follow-up date, and
  **referral creation from a visit** (`hw_referral_create.html`)
- **What doesn't (documented limitation):** the standalone "New
  Referral" form, since it needs a live patient dropdown from the server
- **Sync:** automatic on reconnect, batched to `POST /api/offline/sync`,
  idempotent on `localId` (verified: resubmitting the same `localId`
  never creates a duplicate visit or referral), auto-retry backs off
  after 5 failed attempts per record and waits for a manual Retry
- **UI:** connectivity badge shows OFFLINE MODE / ONLINE — All data
  synced / ONLINE — N records waiting to sync; Offline Queue page shows
  Pending / Failed (with Retry) / Recently Synced
- **Service Worker:** caches only the static app shell (CSS/JS) — never
  patient data or API responses, by design (see Security notes)

## 7. Referral Workflow

```
REFERRED -> APPOINTMENT_SCHEDULED -> TRAVEL_PENDING -> PATIENT_ARRIVED
-> DOCTOR_CONSULTED -> TREATMENT_STARTED -> FOLLOW_UP_PENDING -> COMPLETED
(or CANCELLED at any point)
```
Each referral stores referral ID, patient ID, referring worker/facility,
destination facility/specialist, reason, symptoms, priority, appointment
date, expected/actual arrival, consultation/treatment status, follow-up
date, notes, and full timestamps. Alerts and dropout risk are computed
live, not stored as stale flags.

## 8. Health Worker Workflow

```
Patient Registration -> Vitals -> Symptoms -> AI-Assisted Triage
-> Referral (if required) -> Follow-up -> High-Risk Monitoring
```
Dashboard surfaces: total/today's patients, high-risk count, pending
referrals, missed follow-ups, referral alerts, offline records waiting
(live from IndexedDB), and emergency alerts.

## 9. Database Structure (MongoDB, single DB)

Existing (unmodified): `hospitals`, `doctors`, `departments`, `users`,
`appointments`, `reports`, `prescriptions`, `reviews`, `analysis_results`

Rural healthcare layer (new): `health_workers`, `care_patients`,
`visits`, `referrals`, `pharmacies`, `medicines`, `blood_banks`,
`blood_requests`, `emergency_alerts`, `wearable_readings`,
`medication_adherence`, `hospital_resources`, `consents`, `audit_logs`,
`admins`, `hospital_images`

Extended existing collections (no data deleted): `hospitals` gains `latitude`,
`longitude`, `image_filename`, `logo_filename`, `image_status`, `verified`,
`preferred_language`; `doctors` gains `qualification`, `image_filename`,
`image_status`, `verified`; `departments` gains `description`,
`specialist_type`, `timings`, `contact`, `status`.

No duplicate collections were created for anything that already existed
(e.g. hospital scoring reuses the existing `hospitals`/`doctors` data
rather than a second facility model).

## 10. Installation

```bash
git clone <this repo>
cd project
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

## 11. Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `SECRET_KEY` | Flask session signing | dev fallback in `config.py` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | Database name | see `config.py` |

Set these in a `.env` file or your shell before running.

## 12. MongoDB Setup

Any MongoDB 5+ instance (local, Docker, or Atlas) works — just point
`MONGO_URI` at it. No special indexes are required to run the demo;
for production, add indexes on `care_patients.phone`,
`referrals.healthWorkerId`, `referrals.toFacility`, and `visits.patient_id`.

## 13. How to Run

```bash
python seed_data.py     # optional — populates demo data (see below)
python app.py            # https://savix-health-app-api.onrender.com
```

## 14. Login Accounts — Fresh Start By Default

As of this update, `python seed_data.py` no longer creates any demo
login accounts. It only seeds non-account reference data (pharmacies,
blood banks). Every Hospital, Patient, and Health Worker account is
created by registering through the app itself, starting from a
genuinely empty system.

**First System Admin account:** the admin role has no public
self-registration link by design (security). Instead, open
`/admin/register` in your browser — this one-time setup page only
works while zero admin accounts exist anywhere in the database, then
locks itself permanently. A link to it also appears automatically on
the admin login page for as long as no admin account exists yet.

If you want the old bundle of realistic demo data (sample hospitals,
doctors, departments, and one demo account per role) for quick manual
testing instead, run:
```
python seed_data.py --with-demo-accounts
```
That prints the same demo credentials this README used to list by
default.

## 14b. Demo Credentials (only with --with-demo-accounts)

| Role | Email | Password |
|---|---|---|
| Hospital Admin (United Medicity) | admin@unitedmedicity.demo | hospital123 |
| Hospital Admin (City Care) | admin@citycare.demo | hospital123 |
| Hospital Admin (Life Line) | admin@lifeline.demo | hospital123 |
| Hospital Admin (Hope) | admin@hope.demo | hospital123 |
| Patient | patient@demo.com | patient123 |
| Patient | sneha@demo.com | patient123 |
| Health Worker (ASHA) | asha@demo.com | worker123 |
| System Admin | admin@savix.demo | admin123 |

`seed_data.py` also creates 3 demo pharmacies (7 medicine listings incl.
one generic) and 2 demo blood banks with live stock.

## 15. Offline Testing Instructions

1. Log in as the Health Worker.
2. Open the dashboard, then **New Patient Visit**.
3. In DevTools -> Network, set throttling to **Offline** (or turn off
   the device's Wi-Fi/data).
4. Register a patient, enter vitals/symptoms, submit — you'll see a
   local triage result and "saved on this device" message; the
   connectivity badge shows OFFLINE MODE.
5. Go to **Offline Queue** — the record appears under Pending.
6. Restore connectivity — within ~15s (or immediately on the next
   `online` event) the record syncs automatically; the badge updates to
   ONLINE — All data synced, and the record moves to Recently Synced.
7. Confirm in MongoDB: `db.visits.find({localId: "..."})` returns exactly
   one document even if you retry the sync.
8. Repeat from a visit's **Refer From Visit** page while offline to test
   offline referral creation the same way.
9. To test failure/retry: block `/api/offline/sync` specifically (e.g. a
   browser extension or DevTools request-blocking) while online — the
   record moves to Failed with an error message and a **Retry** button.

## 16. API Documentation

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Backend reachability check |
| POST | `/api/referrals` | Create a referral (JSON) |
| GET | `/api/referrals` | List referrals (scoped to caller) |
| GET | `/api/referrals/<id>` | Referral detail |
| PUT | `/api/referrals/<id>/status` | Update referral status |
| GET | `/api/patient/<id>/referrals` | A patient's referral history |
| POST | `/api/offline/sync` | Idempotent batch sync of offline records |
| POST | `/api/voice-intake` | Bilingual structured extraction from transcribed speech |
| GET | `/hospital/queue` | Live queue/token dashboard for the logged-in hospital |
| POST | `/hospital/queue/call-next` | Call the next waiting token |
| GET | `/worker/patients/<id>/timeline/pdf` | Download a patient's health timeline as a PDF |
| GET | `/set-language/<lang>` | Switch UI language (en/hi) and persist it |
| GET | `/media/hospitals/<filename>` | Serve an uploaded hospital image |
| GET | `/media/doctors/<filename>` | Serve an uploaded doctor photograph |
| POST | `/hospital/image/upload` | Upload/replace a hospital profile, logo, or gallery image |
| POST | `/hospital/departments/edit/<id>` | Edit a department (own hospital only) |
| POST | `/hospital/departments/toggle/<id>` | Activate/deactivate a department |
| POST | `/hospital/doctors/image/<id>` | Upload/replace a doctor photograph |
| POST | `/admin/images/<entity>/<id>/<action>` | Approve / reject / delete an uploaded image |
| POST | `/admin/verify/<entity>/<id>` | Toggle a hospital's or doctor's Verified badge |

All API routes require an authenticated session (`api_login_required`)
and return JSON errors (401/403) rather than redirecting.

## 17. Security Notes

- Role-based access enforced **server-side** on every route
  (`utils/decorators.py`), not just hidden UI
- Passwords hashed with Werkzeug's `generate_password_hash`
- File upload validation (extension/MIME/size) preserved from the
  original report-upload feature
- Service Worker caches **only** static assets — never patient data or
  API responses
- Offline patient data lives only in the browser's IndexedDB until
  synced, never in `localStorage`
- Audit logging (`audit_logs`) for referral creation/status changes and
  emergency SOS triggers
- One patient's data is never exposed to another patient; hospital/
  health-worker views are scoped to their own referrals/patients

## 18. AI Limitations

- All AI/decision-support modules are **rule-based**, not machine-learned
  — explainable by construction, but not clinically validated
- Voice intake duration extraction only catches **numeric** durations
  ("3 days"), not spelled-out words in either language — architecture is
  extensible, this is a known gap
- Cost, resource-prediction, and dropout-risk figures are estimates for
  planning purposes only, never guarantees
- Wearable readings are 100% simulated — no real device integration
- Referral-destination recommendation only "sees" hospitals that have a
  doctor record in the matching department in this database

## 19. Future Integrations

- Real wearable/IoT device ingestion (architecture is ready — swap the
  `/wearable/<id>/simulate` mock generator for a real device webhook)
- Real SMS/telecom integration for emergency contact/hospital
  notification (currently simulated)
- ML models to replace the rule-based risk/trend/score engines without
  changing their call signatures
- Regional-language expansion beyond English/Hindi (drop in another
  `translations/<lang>.json` and add it to `SUPPORTED_LANGUAGES`)
- Hinglish chatbot: the project currently has no chatbot module, so
  Hinglish conversational support would need one built first; the
  bilingual keyword layer in `utils/voice_intake.py` is a starting point

## 19b. UI Theme

The hospital-facing experience uses a distinct teal accent
(`--hosp-teal`) instead of the default blue, via a `data-role`
attribute on `<body>` — purely a CSS variable swap, no template
duplication. Cards lift on hover, the sidebar highlights the active
section, stat tiles animate in on load, and high-priority/emergency
badges pulse gently so they don't get missed in a busy queue. This is
additive polish only; no existing page structure or route changed.

## 20. ABDM/ABHA Integration Status

**Integration-ready architecture only — not a live connection.** The
platform stores an optional ABHA ID per patient, captures explicit
consent (`consents` collection) before that record is used for referral
coordination, and logs key actions to `audit_logs` for interoperability
and traceability. Live ABDM/ABHA connectivity requires authorized API
access and credentials from the National Health Authority, which this
demo does not have — connecting a real ABDM sandbox/production API would
mean swapping the local `consents`/`abha_id` fields for calls into the
ABDM Gateway without changing the surrounding referral/patient logic.
