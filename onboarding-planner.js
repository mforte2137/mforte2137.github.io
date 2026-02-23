// --- Date helpers (Mon–Fri only) ---
function isBusinessDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sun, 6 = Sat
}

function subtractBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    if (isBusinessDay(result)) remaining--;
  }

  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// --- Planner logic ---
function buildPlan(goLiveDate) {
  // Backward offsets (business days before Go-Live)
  // These offsets are intentionally spread across ~3–4 weeks.
const planStructure = [
  { step: 1, name: "Onboarding 1 – Quote + Tour", offset: 18, duration: 30 },
  { step: 2, name: "Focus – Product & Catalog", offset: 13, duration: 30 },
  { step: 3, name: "Focus – Templates & Widgets", offset: 8, duration: 30 },
  { step: 4, name: "Final Q&A", offset: 3, duration: 30 }
];

  const rows = planStructure.map(step => {
    const meetingDate = subtractBusinessDays(goLiveDate, step.offset);
  return {
  step: step.step,
  name: step.name,
  date: formatDate(meetingDate),
  offset: step.offset,
  duration: step.duration
};
  });

  return rows;
}

function renderPlan(goLiveValue, rows) {
  let text = `Go-Live: ${goLiveValue}\n\n`;
  rows.forEach(r => {
   text += `Step ${r.step}: ${r.name} → ${r.date}  (${r.duration} min, T-${r.offset} business days)\n`;
  });
  return text;
}
function renderPlanCards(containerEl, goLiveValue, rows) {
  containerEl.innerHTML = "";

  // Optional: show Go-Live as a small header card
  const header = document.createElement("div");
  header.className = "step-card";
  header.innerHTML = `
    <div class="step-top">
      <div>
        <div class="step-title">Go-Live</div>
        <div class="step-meta">${goLiveValue}</div>
      </div>
      <span class="badge">Target</span>
    </div>
  `;
  containerEl.appendChild(header);

  rows.forEach(r => {
    const card = document.createElement("div");
    card.className = "step-card";
    card.innerHTML = `
      <div class="step-top">
        <div>
          <div class="step-title">Step ${r.step}: ${r.name}</div>
          <div class="step-meta">${r.date} • ${r.duration} min • T-${r.offset} business days</div>
        </div>
        <span class="badge">Not booked</span>
      </div>

      <div class="avail-placeholder">
        Availability will appear here next.
      </div>
    `;
    containerEl.appendChild(card);
  });
}
// --- Wire up UI ---
document.addEventListener("DOMContentLoaded", () => {
  const goLiveInput = document.getElementById("goLiveDate");
  const generateBtn = document.getElementById("generateBtn");
  const planCardsEl = document.getElementById("planCards");

  generateBtn.addEventListener("click", () => {
    const goLiveValue = goLiveInput.value;
    if (!goLiveValue) {
      alert("Please select a Go-Live date.");
      return;
    }

    const goLiveDate = new Date(goLiveValue);
    const rows = buildPlan(goLiveDate);
    renderPlanCards(planCardsEl, goLiveValue, rows);
  });
});
