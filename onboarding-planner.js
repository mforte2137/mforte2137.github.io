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
    { name: "Final Q&A", offset: 3 },
    { name: "Focus – Templates & Widgets", offset: 8 },
    { name: "Focus – Product & Catalog", offset: 13 },
    { name: "Onboarding 1 – Quote + Tour", offset: 18 }
  ];

  const rows = planStructure.map(step => {
    const meetingDate = subtractBusinessDays(goLiveDate, step.offset);
    return {
      name: step.name,
      date: formatDate(meetingDate),
      offset: step.offset
    };
  });

  return rows;
}

function renderPlan(goLiveValue, rows) {
  let text = `Go-Live: ${goLiveValue}\n\n`;
  rows.forEach(r => {
    text += `${r.name} → ${r.date}  (T-${r.offset} business days)\n`;
  });
  return text;
}

// --- Wire up UI ---
document.addEventListener("DOMContentLoaded", () => {
  const goLiveInput = document.getElementById("goLiveDate");
  const generateBtn = document.getElementById("generateBtn");
  const outputEl = document.getElementById("output");

  generateBtn.addEventListener("click", () => {
    const goLiveValue = goLiveInput.value;
    if (!goLiveValue) {
      alert("Please select a Go-Live date.");
      return;
    }

    const goLiveDate = new Date(goLiveValue);
    const rows = buildPlan(goLiveDate);
    outputEl.textContent = renderPlan(goLiveValue, rows);
  });
});
