/*
 * SAVIX-AI / HealthCare+ -- Offline-first support for the Health Worker
 * interface.
 *
 * - Detects connectivity using navigator.onLine AND a real backend
 *   reachability check (GET /api/health), since a device can report
 *   "online" while the backend is unreachable.
 * - Stores offline records (visit registrations and referrals) in
 *   IndexedDB as a pending sync queue. Each record has:
 *     localId, recordType, patientId, timestamp, data, syncStatus,
 *     retryCount, lastSyncAttempt, errorMessage
 *   syncStatus is one of PENDING / SYNCING / SYNCED / FAILED.
 * - Intercepts submission of forms marked `.offline-capable-form` -- if
 *   the backend is unreachable, the record is saved locally instead of
 *   posted, using the same shape POST /api/offline/sync expects.
 * - Automatically flushes the queue when connectivity returns, using
 *   each record's unique localId so a retried sync never duplicates data.
 * - Keeps a short synced-records log (for the Offline Queue page) and
 *   never shows technical terms ("IndexedDB", "navigator.onLine", "sync
 *   engine") to the health worker -- only plain language.
 */

(function () {
  "use strict";

  const DB_NAME = "savix_offline_db";
  const DB_VERSION = 2;
  const PENDING_STORE = "pending_records";
  const SYNCED_STORE = "synced_records";
  const SYNCED_LOG_LIMIT = 50;
  const HEALTH_CHECK_URL = "/api/health";
  const SYNC_URL = "/api/offline/sync";
  const HEALTH_CHECK_INTERVAL_MS = 15000;
  const MAX_AUTO_RETRIES = 5;

  let dbPromise = null;
  let backendReachable = true; // optimistic until proven otherwise
  let syncing = false;

  // -----------------------------------------------------------------------
  // IndexedDB helpers
  // -----------------------------------------------------------------------

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          db.createObjectStore(PENDING_STORE, { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains(SYNCED_STORE)) {
          db.createObjectStore(SYNCED_STORE, { keyPath: "localId" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function putRecord(store, record) {
    const db = await openDb();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(record);
    return txDone(tx);
  }

  async function getAll(store) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteRecord(store, localId) {
    const db = await openDb();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(localId);
    return txDone(tx);
  }

  async function savePendingRecord(record) {
    return putRecord(PENDING_STORE, record);
  }

  async function getPendingRecords() {
    return getAll(PENDING_STORE);
  }

  async function moveToSynced(record) {
    record.syncStatus = "SYNCED";
    record.lastSyncAttempt = new Date().toISOString();
    record.errorMessage = null;
    await putRecord(SYNCED_STORE, record);
    await deleteRecord(PENDING_STORE, record.localId);

    // Cap the synced log so IndexedDB doesn't grow unbounded.
    const synced = await getAll(SYNCED_STORE);
    if (synced.length > SYNCED_LOG_LIMIT) {
      synced.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const toRemove = synced.slice(0, synced.length - SYNCED_LOG_LIMIT);
      for (const r of toRemove) await deleteRecord(SYNCED_STORE, r.localId);
    }
  }

  async function markFailed(record, errorMessage) {
    record.syncStatus = "FAILED";
    record.retryCount = (record.retryCount || 0) + 1;
    record.lastSyncAttempt = new Date().toISOString();
    record.errorMessage = errorMessage || "Could not reach the server.";
    await putRecord(PENDING_STORE, record);
  }

  async function pendingCount() {
    const records = await getPendingRecords();
    return records.filter((r) => r.syncStatus !== "SYNCING").length;
  }

  // -----------------------------------------------------------------------
  // Local (offline) triage -- mirrors utils/triage.py so a health worker
  // still gets a priority level with no Internet connection. This is
  // decision support only, never a diagnosis.
  // -----------------------------------------------------------------------

  const HIGH_RISK_SYMPTOMS = ["breathing difficulty", "chest pain", "unconscious", "severe bleeding", "seizure", "not responding"];
  const MODERATE_SYMPTOMS = ["fever", "vomiting", "diarrhea", "weakness", "headache", "cough"];
  const SYMPTOM_DEPT = {
    "chest pain": "Cardiology", "breathing difficulty": "Pulmonology", "cough": "Pulmonology",
    "headache": "Neurology", "seizure": "Neurology", "vomiting": "Liver / Gastroenterology",
    "diarrhea": "Liver / Gastroenterology", "fever": "General Medicine", "weakness": "General Medicine",
  };

  function localTriage(vitals, symptoms) {
    symptoms = (symptoms || []).map((s) => s.toLowerCase().trim());
    const reasons = [];
    let priority = "LOW";
    let highRisk = false;

    const spo2 = parseFloat(vitals.spo2);
    const temp = parseFloat(vitals.temperature);
    const hr = parseFloat(vitals.heart_rate);
    const bpSys = parseFloat(vitals.bp_systolic);

    if (!isNaN(spo2) && spo2 < 90) { highRisk = true; reasons.push("Oxygen level is critically low."); }
    else if (!isNaN(spo2) && spo2 < 94) { priority = "MEDIUM"; reasons.push("Oxygen level is below normal."); }

    if (!isNaN(temp) && temp >= 103) { highRisk = true; reasons.push("Very high temperature."); }
    else if (!isNaN(temp) && temp >= 100.4) { priority = "MEDIUM"; reasons.push("Fever detected."); }

    if (!isNaN(hr) && (hr > 130 || hr < 45)) { highRisk = true; reasons.push("Heart rate is far outside the normal range."); }
    if (!isNaN(bpSys) && (bpSys >= 180 || bpSys < 90)) { highRisk = true; reasons.push("Blood pressure needs urgent attention."); }

    const matchedHigh = symptoms.filter((s) => HIGH_RISK_SYMPTOMS.includes(s));
    const matchedModerate = symptoms.filter((s) => MODERATE_SYMPTOMS.includes(s));
    if (matchedHigh.length) { highRisk = true; reasons.push("Reported symptom(s) considered serious: " + matchedHigh.join(", ") + "."); }
    else if (matchedModerate.length >= 2) { priority = priority === "LOW" ? "MEDIUM" : priority; reasons.push("Multiple symptoms reported: " + matchedModerate.join(", ") + "."); }

    if (symptoms.includes("fever") && symptoms.includes("breathing difficulty")) {
      highRisk = true; reasons.push("Fever combined with breathing difficulty.");
    }
    if (highRisk) priority = "HIGH";

    let dept = "General Medicine";
    for (const s of symptoms) { if (SYMPTOM_DEPT[s]) { dept = SYMPTOM_DEPT[s]; if (HIGH_RISK_SYMPTOMS.includes(s)) break; } }

    const referralRequired = priority === "HIGH" || priority === "MEDIUM";
    const message = priority === "HIGH"
      ? "HIGH PRIORITY -- Suggested action: refer to a higher healthcare facility as soon as possible."
      : priority === "MEDIUM"
        ? "MEDIUM PRIORITY -- Suggested action: monitor closely and consider a referral."
        : "LOW PRIORITY -- Suggested action: routine care and monitoring.";

    if (!reasons.length) reasons.push("No significant warning signs detected in the vitals or symptoms entered.");

    return { priority, referral_required: referralRequired, high_risk: highRisk, suggested_department: dept, reasons, message };
  }

  // -----------------------------------------------------------------------
  // Connectivity detection
  // -----------------------------------------------------------------------

  async function checkBackend() {
    if (!navigator.onLine) return false;
    try {
      const res = await fetch(HEALTH_CHECK_URL, { method: "GET", cache: "no-store" });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async function updateConnectivityUi(isOnline) {
    const badge = document.getElementById("connStatusBadge");
    const count = await pendingCount();
    if (badge) {
      if (!isOnline) {
        badge.textContent = "🔴 OFFLINE MODE";
        badge.className = "badge bg-danger";
      } else if (count === 0) {
        badge.textContent = "🟢 ONLINE — All data synced";
        badge.className = "badge bg-success";
      } else {
        badge.textContent = `🟢 ONLINE — ${count} record${count === 1 ? "" : "s"} waiting to sync`;
        badge.className = "badge bg-warning text-dark";
      }
    }
    const banner = document.getElementById("offlineBanner");
    if (banner) banner.classList.toggle("d-none", isOnline);
    const hints = document.querySelectorAll("#offlineHint, #offlineHintReferral");
    hints.forEach((h) => { h.style.display = isOnline ? "none" : "block"; });
  }

  async function updatePendingBadge() {
    const count = await pendingCount();
    const badge = document.getElementById("pendingSyncBadge");
    if (badge) {
      if (count > 0) {
        badge.textContent = `${count} record${count === 1 ? "" : "s"} waiting to sync`;
        badge.classList.remove("d-none");
      } else {
        badge.classList.add("d-none");
      }
    }
    const dashEl = document.getElementById("dashOfflinePending");
    if (dashEl) dashEl.textContent = count;
  }

  async function refreshConnectivity() {
    const wasReachable = backendReachable;
    backendReachable = await checkBackend();
    await updateConnectivityUi(backendReachable);
    await updatePendingBadge();

    if (!wasReachable && backendReachable) {
      // Connection just came back -- synchronize automatically.
      syncPendingRecords();
    }
  }

  // -----------------------------------------------------------------------
  // Sync engine
  // -----------------------------------------------------------------------

  async function syncPendingRecords(isManualRetry) {
    if (syncing) return;
    let records = await getPendingRecords();
    if (!isManualRetry) {
      // Automatic sync skips records that have already failed many times;
      // those wait for an explicit Retry from the Offline Queue page.
      records = records.filter((r) => (r.retryCount || 0) < MAX_AUTO_RETRIES);
    }
    if (!records.length) return;

    syncing = true;
    const syncBanner = document.getElementById("syncBanner");
    const syncBannerText = document.getElementById("syncBannerText");
    if (syncBanner) syncBanner.classList.remove("d-none");
    if (syncBannerText) syncBannerText.textContent = `🟢 Connection restored. Synchronizing ${records.length} record(s)...`;

    for (const r of records) { r.syncStatus = "SYNCING"; await putRecord(PENDING_STORE, r); }

    let syncedCount = 0, failedCount = 0;
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const responseData = await res.json();
      const byId = {};
      (responseData.results || []).forEach((r) => { byId[r.localId] = r; });

      for (const rec of records) {
        const result = byId[rec.localId];
        if (result && result.success) {
          await moveToSynced(rec);
          syncedCount++;
        } else {
          await markFailed(rec, result ? result.error : "Server did not confirm this record.");
          failedCount++;
        }
      }

      if (syncBannerText) {
        syncBannerText.textContent = `✅ Synchronization complete. Synced ${syncedCount}, failed ${failedCount}. Pending Sync: ${await pendingCount()}`;
      }
    } catch (e) {
      for (const rec of records) await markFailed(rec, "Could not reach the server to synchronize yet.");
      if (syncBannerText) syncBannerText.textContent = "Could not reach the server to synchronize yet. Will retry automatically.";
    } finally {
      syncing = false;
      await updatePendingBadge();
      await updateConnectivityUi(backendReachable);
      if (typeof window.renderOfflineQueuePage === "function") window.renderOfflineQueuePage();
      setTimeout(() => { if (syncBanner) syncBanner.classList.add("d-none"); }, 6000);
    }
  }

  // -----------------------------------------------------------------------
  // Offline-capable form interception (visits AND referrals)
  // -----------------------------------------------------------------------

  function buildVisitRecord(form) {
    const fd = new FormData(form);
    const symptoms = fd.getAll("symptoms").map((s) => s.toLowerCase());
    const vitals = {
      heart_rate: fd.get("heart_rate") || "",
      spo2: fd.get("spo2") || "",
      temperature: fd.get("temperature") || "",
      bp_systolic: fd.get("bp_systolic") || "",
      bp_diastolic: fd.get("bp_diastolic") || "",
    };
    const patient = {
      name: fd.get("patient_name") || "",
      age: fd.get("age") || "",
      gender: fd.get("gender") || "",
      village: fd.get("village") || "",
      phone: fd.get("phone") || "",
      medical_history: fd.get("medical_history") || "",
    };
    const followUpDate = fd.get("follow_up_date") || "";
    const localId = "HW-VISIT-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const triage = localTriage(vitals, symptoms);

    return {
      localId,
      recordType: "visit",
      patientId: null,
      timestamp: new Date().toISOString(),
      data: {
        patient, vitals,
        symptoms: { selected: symptoms, notes: fd.get("symptom_notes") || "" },
        followUp: followUpDate ? { date: followUpDate, status: "Pending" } : {},
      },
      triageLocal: triage,
      syncStatus: "PENDING",
      retryCount: 0,
      lastSyncAttempt: null,
      errorMessage: null,
    };
  }

  function buildReferralRecord(form) {
    const fd = new FormData(form);
    const localId = "HW-REF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    return {
      localId,
      recordType: "referral",
      patientId: form.dataset.patientId || null,
      timestamp: new Date().toISOString(),
      data: {
        patientName: form.dataset.patientName || fd.get("patientName") || "",
        toFacility: fd.get("toFacility") || "",
        specialist: fd.get("specialist") || "",
        reason: fd.get("reason") || "",
        priority: fd.get("priority") || "Medium",
        appointmentDate: fd.get("appointmentDate") || "",
        expectedArrivalDate: fd.get("expectedArrivalDate") || "",
        followUpDate: fd.get("followUpDate") || "",
        notes: fd.get("notes") || "",
        visitId: form.dataset.visitId || "",
      },
      syncStatus: "PENDING",
      retryCount: 0,
      lastSyncAttempt: null,
      errorMessage: null,
    };
  }

  function showLocalResult(container, record) {
    if (record.recordType === "referral") {
      container.innerHTML = `
        <div class="app-card mt-3">
          <div class="app-card-title">Referral Saved On This Device</div>
          <p class="small text-success mb-0"><i class="bi bi-cloud-check"></i> Referral to ${record.data.toFacility || "the destination facility"} for ${record.data.patientName || "the patient"} will be sent to the server automatically once the internet connection returns.</p>
        </div>`;
      return;
    }
    const triage = record.triageLocal;
    const badgeClass = triage.priority === "HIGH" ? "badge-priority-high" : triage.priority === "MEDIUM" ? "badge-priority-medium" : "badge-priority-low";
    container.innerHTML = `
      <div class="app-card mt-3">
        <div class="app-card-title">Triage Result (saved on this device) <span class="badge ${badgeClass}">${triage.priority} PRIORITY</span></div>
        <p class="small text-muted"><i class="bi bi-info-circle"></i> This is decision support only, not a diagnosis.</p>
        <p class="fw-semibold">${triage.message}</p>
        <p><strong>Suggested department:</strong> ${triage.suggested_department}</p>
        <ul class="small">${triage.reasons.map((r) => `<li>${r}</li>`).join("")}</ul>
        <p class="small text-success mb-0"><i class="bi bi-cloud-check"></i> Saved for ${record.data.patient.name || "the patient"}. It will be sent to the server automatically once the internet connection returns.</p>
      </div>`;
  }

  function attachOfflineFormHandlers() {
    document.querySelectorAll("form.offline-capable-form").forEach((form) => {
      form.addEventListener("submit", async (evt) => {
        if (backendReachable) return; // let it submit normally to the Flask backend

        evt.preventDefault();
        const recordType = form.dataset.recordType || "visit";
        const record = recordType === "referral" ? buildReferralRecord(form) : buildVisitRecord(form);
        await savePendingRecord(record);
        await updatePendingBadge();
        await updateConnectivityUi(backendReachable);

        form.reset();
        let resultBox = document.getElementById("offlineLocalResult");
        if (!resultBox) {
          resultBox = document.createElement("div");
          resultBox.id = "offlineLocalResult";
          form.insertAdjacentElement("afterend", resultBox);
        }
        showLocalResult(resultBox, record);
      });
    });
  }

  // -----------------------------------------------------------------------
  // Offline Queue page rendering (Pending / Synced / Failed + Retry)
  // -----------------------------------------------------------------------

  function describeRecord(r) {
    if (r.recordType === "referral") {
      return `Referral for ${r.data.patientName || "patient"} to ${r.data.toFacility || "facility"}`;
    }
    return `Visit for ${r.data.patient ? r.data.patient.name : "patient"}`;
  }

  async function renderOfflineQueuePage() {
    const pendingEl = document.getElementById("offlineQueuePending");
    const failedEl = document.getElementById("offlineQueueFailed");
    const syncedEl = document.getElementById("offlineQueueSynced");
    if (!pendingEl && !failedEl && !syncedEl) return;

    const pending = await getPendingRecords();
    const synced = await getAll(SYNCED_STORE);
    synced.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const waiting = pending.filter((r) => r.syncStatus === "PENDING" || r.syncStatus === "SYNCING");
    const failed = pending.filter((r) => r.syncStatus === "FAILED");

    const rowHtml = (r, showRetry) => `
      <div class="border-bottom py-2 d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-semibold small">${describeRecord(r)}</div>
          <div class="text-muted" style="font-size:.75rem;">${new Date(r.timestamp).toLocaleString()}
            ${r.errorMessage ? " — " + r.errorMessage : ""}
            ${r.retryCount ? ` — retried ${r.retryCount}x` : ""}
          </div>
        </div>
        ${showRetry ? `<button class="btn btn-sm btn-outline-danger retry-btn" data-local-id="${r.localId}">Retry</button>` : `<span class="badge bg-secondary">${r.syncStatus}</span>`}
      </div>`;

    if (pendingEl) pendingEl.innerHTML = waiting.length ? waiting.map((r) => rowHtml(r, false)).join("") : '<p class="text-muted small mb-0">Nothing waiting.</p>';
    if (failedEl) failedEl.innerHTML = failed.length ? failed.map((r) => rowHtml(r, true)).join("") : '<p class="text-muted small mb-0">No failed records.</p>';
    if (syncedEl) syncedEl.innerHTML = synced.length ? synced.slice(0, SYNCED_LOG_LIMIT).map((r) => rowHtml(r, false)).join("") : '<p class="text-muted small mb-0">Nothing synced yet.</p>';

    document.querySelectorAll(".retry-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const localId = btn.dataset.localId;
        const all = await getPendingRecords();
        const record = all.find((r) => r.localId === localId);
        if (record) {
          record.syncStatus = "PENDING";
          await putRecord(PENDING_STORE, record);
          await refreshConnectivity();
          await syncPendingRecords(true);
        }
      });
    });
  }
  window.renderOfflineQueuePage = renderOfflineQueuePage;

  // -----------------------------------------------------------------------
  // Public API for templates (e.g. dashboard tile)
  // -----------------------------------------------------------------------

  window.SavixOffline = {
    pendingCount,
    syncNow: () => syncPendingRecords(true),
  };

  // -----------------------------------------------------------------------
  // Init
  // -----------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    attachOfflineFormHandlers();
    refreshConnectivity();
    renderOfflineQueuePage();
    setInterval(refreshConnectivity, HEALTH_CHECK_INTERVAL_MS);

    window.addEventListener("online", refreshConnectivity);
    window.addEventListener("offline", async () => { backendReachable = false; await updateConnectivityUi(false); });

    const retrySyncAllBtn = document.getElementById("retrySyncAllBtn");
    if (retrySyncAllBtn) retrySyncAllBtn.addEventListener("click", () => syncPendingRecords(true));

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/static/sw.js").catch(() => { /* non-fatal */ });
    }
  });
})();
