// =======================
// Calendly event type map
// =======================
const EVENT_TYPE_URIS = {
  "Onboarding 1 – Quote + Tour": "https://api.calendly.com/event_types/1bdc4bfe-720d-4a59-be83-3833a8c42c38",
  "Focus – Product & Catalog": "https://api.calendly.com/event_types/2458066e-c26c-4eb6-8aa9-4ae97ffaab21",
  "Focus – Templates & Widgets": "https://api.calendly.com/event_types/c50c8b75-53d1-47b0-b59b-6dc7faed7527",
  "Final Q&A": "https://api.calendly.com/event_types/73b9de31-6fe5-4bd9-bbd4-7afa346ee847"
};
const scheduled = {}; 
// scheduled[r.name] = { start_time, scheduling_url }
// =======================
// Date helpers (Mon–Fri)
// =======================
function isBusinessDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
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

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// =======================
// Calendly availability
// =======================
async function fetchAvailability(eventTypeUri, startDateISO, windowDays = 5) {
  // Create local date at midnight
  const localStart = new Date(startDateISO + "T00:00:00");

  // Convert to true UTC start of that local day
  const startUTC = new Date(
    Date.UTC(
      localStart.getFullYear(),
      localStart.getMonth(),
      localStart.getDate(),
      0, 0, 0
    )
  );

  const endUTC = addDays(startUTC, windowDays);

  const url =
    `/api/calendly-availability?event_type=${encodeURIComponent(eventTypeUri)}` +
    `&start_time=${encodeURIComponent(startUTC.toISOString())}` +
    `&end_time=${encodeURIComponent(endUTC.toISOString())}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "Availability request failed");
  }

  return data;
}

// =======================
// Planner logic
// =======================
function buildPlan(goLiveDate) {
  const planStructure = [
    { step: 1, name: "Onboarding 1 – Quote + Tour", offset: 18, duration: 30 },
    { step: 2, name: "Focus – Product & Catalog", offset: 13, duration: 30 },
    { step: 3, name: "Focus – Templates & Widgets", offset: 8, duration: 30 },
    { step: 4, name: "Final Q&A", offset: 3, duration: 30 }
  ];

  return planStructure.map((step) => {
    const meetingDate = subtractBusinessDays(goLiveDate, step.offset);
    return {
      step: step.step,
      name: step.name,
      date: formatDate(meetingDate),
      offset: step.offset,
      duration: step.duration
    };
  });
}
function buildReportText(mspValue, goLiveValue, rows) {
  let text = `MSP: ${mspValue}\n`;
  text += `Go-Live: ${goLiveValue}\n\n`;

  const scheduledRows = rows.filter(r => scheduled[r.name]);

  if (scheduledRows.length === 0) {
    text += "No onboarding sessions scheduled yet.\n";
    text += "Tip: Click “Show availability”, then click a time slot.\n";
    return text;
  }

  scheduledRows.forEach(r => {
    const s = scheduled[r.name];
    const local = new Date(s.start_time).toLocaleString();
    text += `Step ${r.step} – ${r.name}\n`;
    text += `Scheduled: ${local}\n`;
    text += `Link: ${s.scheduling_url}\n\n`;
  });

  return text.trim();
}
// =======================
// UI rendering (cards)
// =======================
function renderPlanCards(containerEl, mspValue, goLiveValue, rows) {
  containerEl.innerHTML = "";

  // Go-Live header card
  const header = document.createElement("div");
  header.className = "step-card";
  header.innerHTML = `
    <div class="step-top">
      <div>
<div class="step-title">${mspValue}</div>
<div class="step-meta">Go-Live: ${goLiveValue}</div>
      </div>
      <span class="badge">Target</span>
    </div>
  `;
  containerEl.appendChild(header);

  rows.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "step-card";

    const availId = `avail_${idx}`;

    card.innerHTML = `
      <div class="step-top">
        <div>
          <div class="step-title">Step ${r.step}: ${r.name}</div>
          <div class="step-meta">${r.date} • ${r.duration} min • T-${r.offset} business days</div>
        </div>
        <span class="badge">Not booked</span>
      </div>

 <div class="step-actions">
  <button class="secondary" type="button" data-action="show-avail">
    Show availability
  </button>

${r.step === 1 ? `
  <a 
    href="https://docs.google.com/document/d/1azLuGUAr9wedx-2yQ4ZDvCYcxaAEuiw0hzYIF51bxHA/view?usp=sharing"
    target="_blank"
    class="homework-btn"
    rel="noopener noreferrer"
  >
    View Session 1 Homework
  </a>
` : ''}
</div>

      <div id="${availId}" class="avail-placeholder">
        Click “Show availability” to load your real Calendly slots for this step.
      </div>
    `;

    const btn = card.querySelector('[data-action="show-avail"]');
    const availBox = card.querySelector(`#${availId}`);

    btn.addEventListener("click", async () => {
      const eventTypeUri = EVENT_TYPE_URIS[r.name];
      if (!eventTypeUri) {
        availBox.textContent = "No event type mapping found for this step.";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Loading…";
      availBox.textContent = "Loading availability from Calendly…";

      try {
        const data = await fetchAvailability(eventTypeUri, r.date, 5);
        const slots = (data.collection || []).slice(0, 3);

        if (slots.length === 0) {
          availBox.textContent = "No available times found in the next 5 days. Try a different Go-Live date.";
        } else {
          const list = document.createElement("div");
          list.className = "avail-list";

 slots.forEach((s) => {
  const btnSlot = document.createElement("button");
  btnSlot.type = "button";
  btnSlot.className = "slot-btn";
  btnSlot.textContent = new Date(s.start_time).toLocaleString();

  btnSlot.addEventListener("click", () => {
    // Save scheduled selection
    scheduled[r.name] = {
      start_time: s.start_time,
      scheduling_url: s.scheduling_url
    };

    // Update badge to "Scheduled"
    const badge = card.querySelector(".badge");
    badge.textContent = "Scheduled";
    badge.classList.add("badge-scheduled");

    // Replace availability box with confirm + booking link
    availBox.innerHTML = `
      <div class="scheduled-row">
        <div><strong>Scheduled:</strong> ${new Date(s.start_time).toLocaleString()}</div>
        <a class="slot-link" href="${s.scheduling_url}" target="_blank" rel="noopener noreferrer">
          Open booking link
        </a>
      </div>
    `;

    // Update report immediately (ONLY scheduled items)
    reportOutput.value = buildReportText(mspValue, goLiveValue, rows);
    reportSection.style.display = "block";
  });

  list.appendChild(btnSlot);
});

          availBox.innerHTML = "";
          availBox.appendChild(list);
        }
      } catch (e) {
        availBox.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Show availability";
      }
    });

    containerEl.appendChild(card);
  });
}

// =======================
// Wire up UI
// =======================
document.addEventListener("DOMContentLoaded", () => {
const mspInput = document.getElementById("mspName");
const goLiveInput = document.getElementById("goLiveDate");
const generateBtn = document.getElementById("generateBtn");
const planCardsEl = document.getElementById("planCards");
  const reportSection = document.getElementById("reportSection");
const reportOutput = document.getElementById("reportOutput");
const copyReportBtn = document.getElementById("copyReportBtn");

  generateBtn.addEventListener("click", () => {
const mspValue = (mspInput.value || "").trim();
const goLiveValue = goLiveInput.value;

if (!mspValue) {
  alert("Please enter the MSP name.");
  return;
}
if (!goLiveValue) {
  alert("Please select a Go-Live date.");
  return;
}

const goLiveDate = new Date(goLiveValue);
const rows = buildPlan(goLiveDate);

renderPlanCards(planCardsEl, mspValue, goLiveValue, rows);
 // Build report text
reportOutput.value = buildReportText(mspValue, goLiveValue, rows);
reportSection.style.display = "block";  
  });
  copyReportBtn.addEventListener("click", () => {
  reportOutput.select();
  document.execCommand("copy");
  copyReportBtn.textContent = "Copied!";
  setTimeout(() => {
    copyReportBtn.textContent = "Copy Report";
  }, 1500);
});
});
