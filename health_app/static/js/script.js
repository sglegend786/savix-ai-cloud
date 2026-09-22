document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  // Report selection counter (used on My Reports page)
  const checkboxes = document.querySelectorAll(".checkbox-report");
  const counter = document.getElementById("selectedCount");
  const analyzeBtn = document.getElementById("analyzeSelectedBtn");

  function updateCount() {
    if (!counter) return;
    const checked = document.querySelectorAll(".checkbox-report:checked").length;
    counter.textContent = checked;
    if (analyzeBtn) {
      analyzeBtn.disabled = checked === 0;
    }
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateCount));
  updateCount();

  const selectAllBtn = document.getElementById("selectAllReports");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", function () {
      const allChecked = document.querySelectorAll(".checkbox-report:checked").length === checkboxes.length;
      checkboxes.forEach(cb => cb.checked = !allChecked);
      updateCount();
    });
  }
});
