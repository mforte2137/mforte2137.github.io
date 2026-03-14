const CALENDLY_LINK = "https://calendly.com/mike-salesbuildr/onboarding-1-quote-tour";

const recommendBtn = document.getElementById("recommendBtn");
const recommendationEl = document.getElementById("recommendation");
const sessionPlanEl = document.getElementById("sessionPlan");
const reportOutput = document.getElementById("reportOutput");
const copyReportBtn = document.getElementById("copyReport");
const exportPlanBtn = document.getElementById("exportPlan");
const importPlanFile = document.getElementById("importPlanFile");
const agendaPanel = document.getElementById("agendaPanel");
const copyAgendaBtn = document.getElementById("copyAgenda");

let currentPlanData = null;

recommendBtn.addEventListener("click", generatePlan);
copyReportBtn.addEventListener("click", copyReport);
exportPlanBtn.addEventListener("click", exportPlan);
importPlanFile.addEventListener("change", importPlan);
copyAgendaBtn.addEventListener("click", copyAgenda);

function generatePlan() {
  const mspName = document.getElementById("mspName").value.trim();
  const goLiveDate = document.getElementById("goLiveDate").value;
  const plannerUsage = document.getElementById("plannerUsage").value;
  const q1 = document.getElementById("q1").value;
  const q2 = document.getElementById("q2").value;
  const q3 = document.getElementById("q3").value;
  const q5 = document.getElementById("q5").value;
  const priorities = getSelectedPriorities();

  if (!mspName) {
    alert("Please enter the MSP name.");
    return;
  }

  if (!goLiveDate) {
    alert("Please select a Go-Live date.");
    return;
  }

  if (!q1 || !q2 || !q3 || !q5) {
    alert("Please answer all assessment questions.");
    return;
  }

  if (priorities.length === 0) {
    alert("Please select at least one priority area.");
    return;
  }

  const scores = scoreAssessment(q1, q2, q3, priorities, q5);
  const recommendedTypeKey = getWinningType(scores);
  const recommendedTypeName = typeNames[recommendedTypeKey];

  const whyBullets = buildWhyBullets(recommendedTypeKey, q1, q2, q3, priorities, q5);
  const planMeta = getPlanMeta(recommendedTypeKey);
  let sessions = buildSessions(recommendedTypeKey, priorities, q5);
  sessions = assignPlannedDates(sessions, goLiveDate, recommendedTypeKey);

  currentPlanData = {
    mspName,
    goLiveDate,
    plannerUsage,
    answers: {
      q1,
      q2,
      q3,
      q5
    },
    priorities,
    recommendedTypeKey,
    recommendedTypeName,
    whyBullets,
    planMeta,
    sessions
  };

  renderAll(currentPlanData);
}

function renderAll(planData) {
  renderRecommendation(planData.recommendedTypeName, planData.whyBullets, planData.planMeta);
  renderSessions(planData.sessions);
  renderAgenda(planData);
  renderReport(
    planData.mspName,
    planData.goLiveDate,
    planData.plannerUsage,
    planData.recommendedTypeName,
    planData.whyBullets,
    planData.planMeta,
    planData.sessions,
    planData.priorities
  );
}

function getSelectedPriorities() {
  const checked = document.querySelectorAll('input[name="priority"]:checked');
  return Array.from(checked).map(item => item.value);
}

function setSelectedPriorities(priorities) {
  const checkboxes = document.querySelectorAll('input[name="priority"]');
  checkboxes.forEach(box => {
    box.checked = priorities.includes(box.value);
  });
}

function scoreAssessment(q1, q2, q3, priorities, q5) {
  const scores = {
    expert: 0,
    explorer: 0,
    guided: 0,
    rollout: 0,
    momentum: 0
  };

  if (q1 === "several") scores.expert += 2;
  if (q1 === "one") scores.explorer += 1;
  if (q1 === "new") scores.guided += 2;

  if (q2 === "experiment") scores.explorer += 2;
  if (q2 === "structured") scores.guided += 2;
  if (q2 === "mix") scores.expert += 1;

  if (q3 === "few") scores.expert += 1;
  if (q3 === "small") scores.explorer += 1;
  if (q3 === "departments") scores.guided += 2;

  if (priorities.includes("sales")) scores.rollout += 2;
  if (priorities.includes("speed")) scores.explorer += 1;
  if (priorities.includes("sync")) scores.expert += 1;
  if (priorities.includes("appearance")) scores.guided += 1;
  if (priorities.includes("pricing")) scores.guided += 1;
  if (priorities.includes("experience")) scores.guided += 1;

  if (q5 === "yes") scores.rollout += 1;

  if (q1 === "new" && q3 === "small" && q2 === "structured") {
    scores.momentum += 2;
  }

  return scores;
}

function getWinningType(scores) {
  const orderedTypes = ["expert", "explorer", "guided", "rollout", "momentum"];
  let winner = orderedTypes[0];

  orderedTypes.forEach(type => {
    if (scores[type] > scores[winner]) {
      winner = type;
    }
  });

  return winner;
}

const typeNames = {
  expert: "Targeted Expert",
  explorer: "Fast-Track Explorer",
  guided: "Guided Team",
  rollout: "Admin → Sales Rollout",
  momentum: "Momentum Risk"
};

function buildWhyBullets(type, q1, q2, q3, priorities, q5) {
  const reasonPool = [];

  if (q1 === "several") {
    reasonPool.push({
      types: ["expert"],
      text: "You’ve used several quoting tools before and likely don’t need a basics-heavy onboarding."
    });
  }

  if (q1 === "one") {
    reasonPool.push({
      types: ["explorer", "expert"],
      text: "You already have some quoting tool experience, so we can move more quickly."
    });
  }

  if (q1 === "new") {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "A more guided onboarding will help build confidence with the quoting workflow."
    });
  }

  if (q2 === "experiment") {
    reasonPool.push({
      types: ["explorer"],
      text: "You prefer to learn by doing, which fits a faster, hands-on onboarding style."
    });
  }

  if (q2 === "structured") {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "You prefer a structured walkthrough, which usually works best with more focused sessions."
    });
  }

  if (q2 === "mix") {
    reasonPool.push({
      types: ["expert"],
      text: "You’re comfortable with a blended approach, which allows for a flexible onboarding pace."
    });
  }

  if (q3 === "few") {
    reasonPool.push({
      types: ["expert"],
      text: "A smaller onboarding group makes it easier to focus on targeted priorities quickly."
    });
  }

  if (q3 === "small") {
    reasonPool.push({
      types: ["explorer"],
      text: "A small team can usually move quickly while still keeping alignment across users."
    });
  }

  if (q3 === "departments") {
    reasonPool.push({
      types: ["guided", "rollout"],
      text: "Multiple departments are involved, so a more structured rollout will help keep everyone aligned."
    });
  }

  if (priorities.includes("speed")) {
    reasonPool.push({
      types: ["explorer"],
      text: "Faster quoting is a priority, so the plan should focus early on practical quote-building workflows."
    });
  }

  if (priorities.includes("appearance")) {
    reasonPool.push({
      types: ["guided"],
      text: "Quote presentation is important, so templates and customer experience should be covered early."
    });
  }

  if (priorities.includes("sync")) {
    reasonPool.push({
      types: ["expert", "rollout"],
      text: "Integration quality is important, so operational workflow and sync behavior should be part of the plan."
    });
  }

  if (priorities.includes("pricing")) {
    reasonPool.push({
      types: ["expert", "guided", "momentum"],
      text: "Pricing consistency matters, so catalog structure and quoting rules should be part of onboarding."
    });
  }

  if (priorities.includes("sales")) {
    reasonPool.push({
      types: ["rollout"],
      text: "Sales team enablement is a priority, so onboarding may need both setup and rep training."
    });
  }

  if (priorities.includes("experience")) {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "Customer quote experience matters, so template design and decision flow should be prioritized."
    });
  }

  if (q5 === "yes") {
    reasonPool.push({
      types: ["rollout"],
      text: "Storefront is in scope, which adds an additional workflow beyond standard quoting."
    });
  }

  if (q5 === "maybe") {
    reasonPool.push({
      types: ["rollout"],
      text: "Storefront may become relevant, so we should leave room for that in the onboarding roadmap."
    });
  }

  if (type === "momentum") {
    reasonPool.push({
      types: ["momentum"],
      text: "A lighter, more focused onboarding structure will make progress easier to maintain."
    });
  }

  const filtered = reasonPool
    .filter(item => item.types.includes(type))
    .map(item => item.text);

  const unique = [...new Set(filtered)];

  return unique.slice(0, 3);
}

function getPlanMeta(type) {
  const meta = {
    expert: {
      sessions: "2–3",
      pace: "2–3 weeks",
      meaning: "Less time on basics and more focus on known pain points and specific goals.",
      focusAreas: [
        "Catalog & Quoting Workflow",
        "Integrations & Workflow",
        "Templates & Quote Experience"
      ]
    },
    explorer: {
      sessions: "2–3",
      pace: "2–3 weeks",
      meaning: "A faster pace with practical, hands-on focus and less time spent on theory.",
      focusAreas: [
        "Catalog & Quoting Workflow",
        "Templates & Quote Experience"
      ]
    },
    guided: {
      sessions: "4",
      pace: "3–4 weeks",
      meaning: "A more structured rollout with clear separation of topics across meetings.",
      focusAreas: [
        "Catalog & Pricing",
        "Templates & Quote Experience",
        "Integrations & Workflow"
      ]
    },
    rollout: {
      sessions: "4–5",
      pace: "4–5 weeks",
      meaning: "A two-phase onboarding approach: setup first, then sales-user enablement.",
      focusAreas: [
        "Catalog & Configuration",
        "Templates & Quote Experience",
        "Sales Team Training",
        "Optional Storefront"
      ]
    },
    momentum: {
      sessions: "2–3",
      pace: "3–5 weeks",
      meaning: "Smaller steps with quick wins and clearer next actions to help maintain momentum.",
      focusAreas: [
        "Quote Fundamentals",
        "Templates & Essentials"
      ]
    }
  };

  return meta[type];
}

function buildSessions(type, priorities, storefrontAnswer) {
  const sessions = [];

  sessions.push({
    title: "Session 1 – Kickoff + First Quote + Roadmap",
    topics: [
      "Kickoff",
      "First quote demo",
      "Customer quote experience",
      "Roadmap planning"
    ],
    isScheduled: false
  });

  if (type === "explorer") {
    sessions.push({
      title: "Session 2 – Catalog & Quoting Workflow",
      topics: buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Margin strategy"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 3 – Templates & Quote Presentation",
      topics: buildTopicList([
        "Templates",
        "Widgets",
        "Cover pages",
        "Branding",
        "Customer quote experience"
      ], priorities),
      isScheduled: false
    });
  }

  if (type === "expert") {
    sessions.push({
      title: "Session 2 – Integrations & Catalog Strategy",
      topics: buildTopicList([
        "PSA sync",
        "Distributor feeds",
        "Source of truth",
        "Marketplace imports",
        "Catalog structure"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 3 – Templates & Workflow",
      topics: buildTopicList([
        "Templates",
        "Widgets",
        "Approval rules",
        "Quote workflow",
        "Email defaults"
      ], priorities),
      isScheduled: false
    });
  }

  if (type === "guided") {
    sessions.push({
      title: "Session 2 – Catalog & Pricing",
      topics: buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Pricing consistency"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 3 – Templates & Email Experience",
      topics: buildTopicList([
        "Templates",
        "Widgets",
        "Email defaults",
        "Email templates",
        "Notifications"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 4 – Integrations & Workflow",
      topics: buildTopicList([
        "PSA sync",
        "Opportunity stages",
        "Approval rules",
        "Users & permissions",
        "Operational workflow"
      ], priorities),
      isScheduled: false
    });
  }

  if (type === "rollout") {
    sessions.push({
      title: "Session 2 – Catalog & Configuration",
      topics: buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Dynamic pricing",
        "Distributor feeds",
        "PSA sync"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 3 – Templates & Quote Experience",
      topics: buildTopicList([
        "Templates",
        "Widgets",
        "Branding",
        "Customer quote experience",
        "Notifications"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 4 – Integrations & Workflow",
      topics: buildTopicList([
        "PSA sync behavior",
        "Opportunity stages",
        "Users & permissions",
        "Approval workflow"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 5 – Sales Team Training",
      topics: [
        "How to create a quote",
        "How to send a quote",
        "How to follow the customer experience",
        "Basic quoting workflow for reps"
      ],
      isScheduled: false
    });

    if (storefrontAnswer === "yes" || storefrontAnswer === "maybe") {
      sessions.push({
        title: "Optional Add-On – Storefront Module",
        topics: [
          "Storefront overview",
          "Catalog readiness for storefront",
          "Self-serve order flow",
          "Approved order sync back to Salesbuildr"
        ],
        isScheduled: false
      });
    }
  }

  if (type === "momentum") {
    sessions.push({
      title: "Session 2 – Quick Quote Workflow",
      topics: buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "First real quote workflow"
      ], priorities),
      isScheduled: false
    });

    sessions.push({
      title: "Session 3 – Templates & Essentials",
      topics: buildTopicList([
        "Templates",
        "Email defaults",
        "Customer quote experience",
        "Simple best practices"
      ], priorities),
      isScheduled: false
    });
  }

  return sessions;
}

function buildTopicList(defaultTopics, priorities) {
  const topics = [...defaultTopics];

  if (priorities.includes("sync") && !topics.includes("PSA sync")) {
    topics.push("PSA sync");
  }

  if (priorities.includes("appearance") && !topics.includes("Templates")) {
    topics.push("Templates");
  }

  if (priorities.includes("experience") && !topics.includes("Customer quote experience")) {
    topics.push("Customer quote experience");
  }

  return topics.slice(0, 5);
}

function assignPlannedDates(sessions, goLiveDate, type) {
  const goLive = new Date(goLiveDate + "T12:00:00");
  const spacing = getSessionSpacing(type);
  const kickoffBuffer = getKickoffBuffer(type);

  const sessionDates = new Array(sessions.length);
  let daysBackFromGoLive = 0;

  for (let i = sessions.length - 1; i >= 1; i--) {
    sessionDates[i] = formatDate(subtractBusinessDays(goLive, daysBackFromGoLive));
    daysBackFromGoLive += spacing;
  }

  sessionDates[0] = formatDate(subtractBusinessDays(goLive, daysBackFromGoLive + kickoffBuffer));

  return sessions.map((session, index) => ({
    ...session,
    plannedDate: sessionDates[index]
  }));
}

function getSessionSpacing(type) {
  const map = {
    expert: 5,
    explorer: 4,
    guided: 6,
    rollout: 6,
    momentum: 7
  };

  return map[type] || 5;
}

function getKickoffBuffer(type) {
  const map = {
    expert: 4,
    explorer: 3,
    guided: 5,
    rollout: 5,
    momentum: 6
  };

  return map[type] || 4;
}

function subtractBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() - 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      remaining--;
    }
  }

  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function renderRecommendation(typeName, whyBullets, planMeta) {
  recommendationEl.innerHTML = `
    <div class="recommendation-type">${typeName}</div>

    <div class="info-section">
      <h3>Why this was recommended</h3>
      <ul>
        ${whyBullets.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>

    <div class="info-section">
      <h3>What this means</h3>
      <ul>
        <li>Recommended sessions: <strong>${planMeta.sessions}</strong></li>
        <li>Estimated pace: <strong>${planMeta.pace}</strong></li>
        <li>${planMeta.meaning}</li>
      </ul>
    </div>

    <div class="info-section">
      <h3>Focus areas</h3>
      <ul>
        ${planMeta.focusAreas.map(item => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderSessions(sessions) {
  sessionPlanEl.innerHTML = "";

  sessions.forEach((session, index) => {
    const topicsText = session.topics.join(" • ");
    const sessionTitleForCopy = `Salesbuildr Onboarding – ${session.title.replace(/^Session \d+ – /, "").replace(/^Optional Add-On – /, "")}`;
    const statusClass = session.isScheduled ? "status-scheduled" : "status-not-scheduled";
    const statusText = session.isScheduled ? "Scheduled" : "Not Scheduled";
    const toggleText = session.isScheduled ? "Mark Unscheduled" : "Mark Scheduled";

    sessionPlanEl.innerHTML += `
      <div class="session-card">
        <div class="session-header">
          <div class="session-title">${session.title}</div>
          <div class="session-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="session-date">Planned Date: ${session.plannedDate || "TBD"}</div>
        <div class="session-topics">${topicsText}</div>
        <div class="session-actions">
          <a class="session-link-btn" href="${CALENDLY_LINK}" target="_blank" rel="noopener noreferrer">Schedule Session</a>
          <button class="session-copy-btn" type="button" data-copy-title="${escapeHtml(sessionTitleForCopy)}">Copy Session Title</button>
          <button class="session-status-btn" type="button" data-session-index="${index}">${toggleText}</button>
        </div>
      </div>
    `;
  });

  bindSessionCopyButtons();
  bindSessionStatusButtons();
}

function bindSessionCopyButtons() {
  const buttons = document.querySelectorAll(".session-copy-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const text = button.getAttribute("data-copy-title");
      navigator.clipboard.writeText(text).then(() => {
        const original = button.textContent;
        button.textContent = "Copied!";
        setTimeout(() => {
          button.textContent = original;
        }, 1200);
      }).catch(() => {
        alert("Could not copy the session title.");
      });
    });
  });
}

function bindSessionStatusButtons() {
  const buttons = document.querySelectorAll(".session-status-btn");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-session-index"));

      if (!currentPlanData || !currentPlanData.sessions[index]) return;

      currentPlanData.sessions[index].isScheduled = !currentPlanData.sessions[index].isScheduled;
      renderAll(currentPlanData);
    });
  });
}

function getAgendaSession(planData) {
  if (!planData || !planData.sessions || planData.sessions.length === 0) {
    return null;
  }

  const startIndex = planData.plannerUsage === "session1" ? 1 : 0;

  for (let i = startIndex; i < planData.sessions.length; i++) {
    if (!planData.sessions[i].isScheduled) {
      return planData.sessions[i];
    }
  }

  return planData.sessions[startIndex] || planData.sessions[planData.sessions.length - 1];
}

function renderAgenda(planData) {
  const nextSession = getAgendaSession(planData);

  if (!nextSession) {
    agendaPanel.innerHTML = `<div class="muted">No session data available.</div>`;
    return;
  }

  agendaPanel.innerHTML = `
    <div class="agenda-title">Next Meeting Agenda</div>
    <div class="agenda-line"><strong>MSP:</strong> ${planData.mspName}</div>
    <div class="agenda-line"><strong>Onboarding Type:</strong> ${planData.recommendedTypeName}</div>
    <div class="agenda-line"><strong>Planner Usage:</strong> ${planData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only"}</div>
    <div class="agenda-line"><strong>Go-Live:</strong> ${planData.goLiveDate}</div>
    <div class="agenda-line"><strong>Next Session:</strong> ${nextSession.title}</div>
    <div class="agenda-line"><strong>Planned Date:</strong> ${nextSession.plannedDate || "TBD"}</div>
    <div class="agenda-line"><strong>Focus Topics:</strong> ${nextSession.topics.join(" • ")}</div>
  `;
}

function renderReport(mspName, goLiveDate, plannerUsage, typeName, whyBullets, planMeta, sessions, priorities) {
  const priorityLabels = priorities.map(getPriorityLabel);
  const usageLabel = plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only";

  let report = `MSP: ${mspName}
Go-Live Date: ${goLiveDate}
Planner Usage: ${usageLabel}

Recommended Onboarding Type: ${typeName}

Why this was recommended:
`;

  whyBullets.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
What this means:
- Recommended sessions: ${planMeta.sessions}
- Estimated pace: ${planMeta.pace}
- ${planMeta.meaning}

Priority Areas:
`;

  priorityLabels.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
Session Plan:
`;

  sessions.forEach(session => {
    report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}]
`;
    session.topics.forEach(topic => {
      report += `  • ${topic}
`;
    });
  });

  const nextSession = getAgendaSession({ plannerUsage, sessions });

  if (nextSession) {
    report += `
Next Meeting Agenda:
- ${nextSession.title}
- Planned Date: ${nextSession.plannedDate || "TBD"}
`;
    nextSession.topics.forEach(topic => {
      report += `  • ${topic}
`;
    });
  }

  reportOutput.value = report;
}

function getPriorityLabel(value) {
  const labels = {
    appearance: "Better looking quotes",
    speed: "Faster quoting",
    sync: "Better PSA sync",
    pricing: "Standardized pricing",
    sales: "Sales team efficiency",
    experience: "Better customer quote experience"
  };

  return labels[value] || value;
}

function copyReport() {
  reportOutput.select();
  document.execCommand("copy");
}

function copyAgenda() {
  if (!currentPlanData) {
    alert("Please generate or import a plan first.");
    return;
  }

  const nextSession = getAgendaSession(currentPlanData);

  if (!nextSession) {
    alert("No agenda available to copy.");
    return;
  }

  const text = `MSP: ${currentPlanData.mspName}
Onboarding Type: ${currentPlanData.recommendedTypeName}
Planner Usage: ${currentPlanData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only"}
Go-Live: ${currentPlanData.goLiveDate}

Next Session: ${nextSession.title}
Planned Date: ${nextSession.plannedDate || "TBD"}

Focus Topics:
- ${nextSession.topics.join("\n- ")}`;

  navigator.clipboard.writeText(text).then(() => {
    const original = copyAgendaBtn.textContent;
    copyAgendaBtn.textContent = "Copied!";
    setTimeout(() => {
      copyAgendaBtn.textContent = original;
    }, 1200);
  }).catch(() => {
    alert("Could not copy the agenda.");
  });
}

function exportPlan() {
  if (!currentPlanData) {
    alert("Please generate or import a plan first.");
    return;
  }

  const safeName = currentPlanData.mspName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename = `${safeName || "msp"}-onboarding-plan.json`;

  const dataStr = JSON.stringify(currentPlanData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function importPlan(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);

      populateForm(imported);
      currentPlanData = imported;
      renderAll(imported);
    } catch (err) {
      alert("Could not import plan file. Please check that it is a valid JSON export.");
    }
  };

  reader.readAsText(file);
}

function populateForm(planData) {
  document.getElementById("mspName").value = planData.mspName || "";
  document.getElementById("goLiveDate").value = planData.goLiveDate || "";
  document.getElementById("plannerUsage").value = planData.plannerUsage || "planning";
  document.getElementById("q1").value = planData.answers?.q1 || "";
  document.getElementById("q2").value = planData.answers?.q2 || "";
  document.getElementById("q3").value = planData.answers?.q3 || "";
  document.getElementById("q5").value = planData.answers?.q5 || "";

  setSelectedPriorities(planData.priorities || []);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
