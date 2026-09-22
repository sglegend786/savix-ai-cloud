/*
 * Multilingual Voice AI (English/Hindi) intake widget.
 *
 * Uses the browser's native Web Speech API (SpeechRecognition) - a real,
 * already-built-in capability, not a mock. No external API key needed.
 * Falls back gracefully (hides the button) in browsers that don't support
 * it. Transcribed text is sent to /api/voice-intake for bilingual
 * keyword-based structured extraction (symptoms + duration), which then
 * auto-checks matching symptom checkboxes for the health worker to review
 * and confirm - it never submits anything automatically.
 */

(function () {
  "use strict";

  function initVoiceWidget() {
    const btn = document.getElementById("voiceIntakeBtn");
    const langSelect = document.getElementById("voiceIntakeLang");
    const statusEl = document.getElementById("voiceIntakeStatus");
    const notesField = document.querySelector('textarea[name="symptom_notes"]');
    if (!btn || !notesField) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btn.style.display = "none";
      if (statusEl) statusEl.textContent = "Voice input is not supported in this browser.";
      return;
    }

    let recognizing = false;

    btn.addEventListener("click", () => {
      if (recognizing) return;
      const recognition = new SpeechRecognition();
      recognition.lang = langSelect ? langSelect.value : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognizing = true;
      btn.classList.add("btn-danger");
      btn.innerHTML = '<i class="bi bi-mic-fill"></i> Listening...';
      if (statusEl) statusEl.textContent = "";

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        notesField.value = (notesField.value ? notesField.value + " " : "") + transcript;

        try {
          const res = await fetch("/api/voice-intake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: transcript }),
          });
          const data = await res.json();
          if (data.success && data.structured.symptoms.length) {
            data.structured.symptoms.forEach((s) => {
              const cb = document.querySelector(`input[name="symptoms"][value="${s}"]`);
              if (cb) cb.checked = true;
            });
            if (statusEl) {
              statusEl.textContent = `Detected: ${data.structured.symptoms.join(", ")}` +
                (data.structured.duration ? ` (duration: ${data.structured.duration})` : "") +
                " — please review the checked symptoms.";
            }
          } else if (statusEl) {
            statusEl.textContent = "Heard: \"" + transcript + "\" — no matching symptoms auto-detected, please check manually.";
          }
        } catch (e) {
          if (statusEl) statusEl.textContent = "Could not reach the server to process voice input right now.";
        }
      };

      recognition.onerror = () => {
        if (statusEl) statusEl.textContent = "Could not capture voice input. Please try again or type manually.";
      };

      recognition.onend = () => {
        recognizing = false;
        btn.classList.remove("btn-danger");
        btn.innerHTML = '<i class="bi bi-mic"></i> Voice Input';
      };

      recognition.start();
    });
  }

  document.addEventListener("DOMContentLoaded", initVoiceWidget);
})();
