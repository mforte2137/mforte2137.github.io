const AGENT_LINKS = {
  mike: "https://calendly.com/mike-salesbuildr/onboarding-1-quote-tour",
  bram: "https://calendly.com/salesbuildr-bram",
  kristel: "https://calendly.com/kristel-salesbuildr",
  demi: "https://calendly.com/demi-salesbuildr"
};

const AGENT_LABELS = {
  mike: "Mike",
  bram: "Bram",
  kristel: "Kristel",
  demi: "Demi"
};

const typeNames = {
  expert: "Targeted Expert",
  explorer: "Fast-Track Explorer",
  guided: "Guided Team",
  rollout: "Admin → Sales Rollout",
  momentum: "Momentum Risk"
};

const recommendBtn = document.getElementById("recommendBtn");
const recommendationEl = document.getElementById("recommendation");
const sessionPlanEl = document.getElementById("sessionPlan");
const addonPlanEl = document.getElementById("addonPlan");
const reportOutput = document.getElementById("reportOutput");
const copyReportBtn = document.getElementById("copyReport");
const exportPlanBtn = document.getElementById("exportPlan");
const importPlanFile = document.getElementById("importPlanFile");
const agendaPanel = document.getElementById("agendaPanel");
const copyAgendaBtn = document.getElementById("copyAgenda");
const agentModeToggle = document.getElementById("agentModeToggle");

let currentPlanData = null;
let agentMode = false;

recommendBtn.addEventListener("click", generatePlan);
copyReportBtn.addEventListener("click", copyReport);
exportPlanBtn.addEventListener("click", exportPlan);
importPlanFile.addEventListener("change", importPlan);

// 👇 ADD THIS
const copyNextStepsBtn = document.getElementById("copyNextSteps");

if (copyNextStepsBtn) {
  copyNextStepsBtn.addEventListener("click", copyNextSteps);
}

if (agentModeToggle) {
  agentModeToggle.addEventListener("change", (e) => {
    agentMode = e.target.checked;
    if (currentPlanData) {
      renderAll(currentPlanData);
    }
  });
}

function generatePlan() {
  const mspName = document.getElementById("mspName").value.trim();
  const goLiveDate = document.getElementById("goLiveDate").value;
  const plannerUsage = document.getElementById("plannerUsage").value;
  const q1 = document.getElementById("q1").value;
  const q2 = document.getElementById("q2").value;
  const q3 = document.getElementById("q3").value;
  const salesTrainingNeeded = document.getElementById("salesTrainingNeeded").value;
  const storefrontNeeded = document.getElementById("storefrontNeeded").value;
  const priorities = getSelectedPriorities();

  if (!mspName) {
    alert("Please enter the MSP name.");
    return;
  }

  if (!goLiveDate) {
    alert("Please select a Go-Live date.");
    return;
  }

  if (!q1 || !q2 || !q3 || !salesTrainingNeeded || !storefrontNeeded) {
    alert("Please answer all assessment questions.");
    return;
  }

  if (priorities.length === 0) {
    alert("Please select at least one priority area.");
    return;
  }

  const scores = scoreAssessment(q1, q2, q3, priorities);
  const recommendedTypeKey = getWinningType(scores);
  const recommendedTypeName = typeNames[recommendedTypeKey];
  const whyBullets = buildWhyBullets(recommendedTypeKey, q1, q2, q3, priorities);
  const planMeta = getPlanMeta(recommendedTypeKey);

  const coreSessions = buildCoreSessions(recommendedTypeKey, priorities);
  const addonSessions = buildAddonSessions(salesTrainingNeeded, storefrontNeeded);

  const combinedSessions = assignPlannedDates(
    [...coreSessions, ...addonSessions],
    goLiveDate,
    recommendedTypeKey
  );

  const finalCoreSessions = combinedSessions.slice(0, coreSessions.length);
  const finalAddonSessions = combinedSessions.slice(coreSessions.length);

  currentPlanData = {
    mspName,
    goLiveDate,
    plannerUsage,
    answers: {
      q1,
      q2,
      q3,
      salesTrainingNeeded,
      storefrontNeeded
    },
    priorities,
    recommendedTypeKey,
    recommendedTypeName,
    whyBullets,
    planMeta,
    coreSessions: finalCoreSessions,
    addonSessions: finalAddonSessions,
    notes: [],
    adhocSessions: []
  };

  renderAll(currentPlanData);
}

function renderAll(planData) {
  renderRecommendation(planData.recommendedTypeName, planData.whyBullets, planData.planMeta);
  renderSessions(planData.coreSessions, sessionPlanEl, false);
  renderSessions(planData.addonSessions, addonPlanEl, true);
  renderReport(planData);
  renderNextSteps(planData);

  notes = planData.notes || [];
  renderNotes();

  adhocSessions = planData.adhocSessions || [];
  renderAdhocSessions();

  bindSessionCopyButtons();
  bindSessionStatusButtons();
  bindAgentDropdowns();
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

function scoreAssessment(q1, q2, q3, priorities) {
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
  if (q3 === "departments") {
    scores.guided += 2;
    scores.rollout += 1;
  }

  if (priorities.includes("sales")) scores.rollout += 1;
  if (priorities.includes("speed")) scores.explorer += 1;
  if (priorities.includes("sync")) scores.expert += 1;
  if (priorities.includes("appearance")) scores.guided += 1;
  if (priorities.includes("pricing")) scores.guided += 1;
  if (priorities.includes("experience")) scores.guided += 1;

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

function buildWhyBullets(type, q1, q2, q3, priorities) {
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
      text: "Sales team enablement is a priority, which may require a broader rollout approach."
    });
  }

  if (priorities.includes("experience")) {
    reasonPool.push({
      types: ["guided", "momentum"],
      text: "Customer quote experience matters, so template design and decision flow should be prioritized."
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
      meaning: "A more structured rollout that often suits broader teams and more operational setup.",
      focusAreas: [
        "Catalog & Configuration",
        "Templates & Quote Experience",
        "Integrations & Workflow"
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

function buildCoreSessions(type, priorities) {
  const sessions = [];

  sessions.push(makeSession(
    "Session 1 – Kickoff + First Quote + Roadmap",
    [
      "Kickoff",
      "First quote demo",
      "Customer quote experience",
      "Roadmap planning"
    ]
  ));

  if (type === "explorer") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Quoting Workflow",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Margin strategy"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Cover pages",
        "Branding",
        "Customer quote experience"
      ], priorities)
    ));
  }

  if (type === "expert") {
    sessions.push(makeSession(
      "Session 2 – Integrations & Catalog Strategy",
      buildTopicList([
        "PSA sync",
        "Distributor feeds",
        "Source of truth",
        "Marketplace imports",
        "Catalog structure"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
         "Cover Pages",
    "Widgets",
    "Templates",
    "Designing Winning Proposals"
      ], priorities)
    ));
  }

  if (type === "guided") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Pricing",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Bundles",
        "Dynamic pricing",
        "Pricing consistency"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Templates",
        "Widgets",
        "Email defaults",
        "Email templates",
        "Notifications"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 4 – Refining Your Workflow",
      buildTopicList([
        "PSA sync",
        "Opportunity stages",
        "Approval rules",
        "Users & permissions",
        "Operational workflow"
      ], priorities)
    ));
  }

  if (type === "rollout") {
    sessions.push(makeSession(
      "Session 2 – Catalog & Configuration",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "Dynamic pricing",
        "Distributor feeds",
        "PSA sync"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
        "Cover Pages",
    "Widgets",
    "Templates",
    "Designing Winning Proposals"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 4 – Refining Your Workflow",
      buildTopicList([
        "PSA sync behavior",
        "Opportunity stages",
        "Users & permissions",
        "Approval workflow"
      ], priorities)
    ));
  }

  if (type === "momentum") {
    sessions.push(makeSession(
      "Session 2 – Quick Quote Workflow",
      buildTopicList([
        "Products & categories",
        "Marketplace imports",
        "First real quote workflow"
      ], priorities)
    ));

    sessions.push(makeSession(
      "Session 3 – Templates, Widgets & Cover Pages",
      buildTopicList([
         "Cover Pages",
    "Widgets",
    "Templates",
    "Designing Winning Proposals"
      ], priorities)
    ));
  }

  return sessions;
}

function buildAddonSessions(salesTrainingNeeded, storefrontNeeded) {
  const sessions = [];

  if (salesTrainingNeeded === "yes") {
    sessions.push(makeSession(
      "Add-On – Sales Team Training",
      [
        "How to create a quote from templates",
        "How to add products and services",
        "How to send quotes",
        "Sales-only quoting workflow"
      ],
      true
    ));
  }

  if (storefrontNeeded === "yes") {
    sessions.push(makeSession(
      "Add-On – Storefront Module",
      [
        "Storefront overview",
        "Catalog readiness for storefront",
        "Self-serve order flow",
        "Approved order sync back to Salesbuildr"
      ],
      true
    ));
  }

  return sessions;
}

function makeSession(title, topics, isAddon = false) {
  return {
    title,
    topics,
    isScheduled: false,
    isAddon,
    assignedAgent: "mike",
    plannedDate: ""
  };
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
  if (!sessions.length) return sessions;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const goLive = new Date(goLiveDate + "T12:00:00");

  const START_OFFSET = 5;
  const END_BUFFER = 3;

  const startDate = addBusinessDays(today, START_OFFSET);
  const endDate = subtractBusinessDays(goLive, END_BUFFER);

  const coreSessions = sessions.filter(session => !session.isAddon);
  const addonSessions = sessions.filter(session => session.isAddon);

  let scheduledCoreDates = [];
  let scheduledAddonDates = [];

  if (coreSessions.length > 0) {
    scheduledCoreDates = spreadDatesBetween(startDate, endDate, coreSessions.length);
  }

  if (addonSessions.length > 0) {
    const addonStart = coreSessions.length > 0
      ? addBusinessDays(parseIsoDate(scheduledCoreDates[scheduledCoreDates.length - 1]), 2)
      : startDate;

    scheduledAddonDates = spreadDatesBetween(addonStart, endDate, addonSessions.length);
  }

  const updatedCore = coreSessions.map((session, index) => ({
    ...session,
    plannedDate: scheduledCoreDates[index] || formatDate(startDate)
  }));

  const updatedAddon = addonSessions.map((session, index) => ({
    ...session,
    plannedDate: scheduledAddonDates[index] || formatDate(endDate)
  }));

  return [...updatedCore, ...updatedAddon];
}

function spreadDatesBetween(startDate, endDate, count) {
  if (count <= 0) return [];

  if (count === 1) {
    return [formatDate(startDate)];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalBusinessDays = countBusinessDaysBetween(start, end);

  if (totalBusinessDays <= 0) {
    const fallback = [];
    let current = new Date(start);
    for (let i = 0; i < count; i++) {
      fallback.push(formatDate(current));
      current = addBusinessDays(current, 1);
    }
    return fallback;
  }

  const gap = Math.max(1, Math.floor(totalBusinessDays / (count - 1)));
  const dates = [];
  let current = new Date(start);

  for (let i = 0; i < count; i++) {
    dates.push(formatDate(current));
    current = addBusinessDays(current, gap);
    if (current > end) {
      current = new Date(end);
    }
  }

  return dates;
}

function countBusinessDaysBetween(startDate, endDate) {
  const current = new Date(startDate);
  let count = 0;

  while (current < endDate) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
}

function parseIsoDate(iso) {
  return new Date(iso + "T12:00:00");
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

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added++;
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
        <li>Recommended core sessions: <strong>${planMeta.sessions}</strong></li>
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

function renderSessions(sessions, containerEl, isAddonSection) {
  containerEl.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    containerEl.innerHTML = `<div class="muted">${isAddonSection ? "No add-on sessions selected." : "No sessions generated."}</div>`;
    return;
  }

  sessions.forEach((session, index) => {
    const topicsText = session.topics.join(" • ");
    const sessionTitleForCopy = `Salesbuildr Onboarding – ${session.title.replace(/^Session \d+ – /, "").replace(/^Add-On – /, "")}`;
const isScheduled = Boolean(session.isScheduled);
const statusClass = isScheduled ? "status-scheduled" : "status-not-scheduled";
const statusText = isScheduled ? "Scheduled" : "Not Scheduled";
const toggleText = isScheduled ? "Mark Unscheduled" : "Mark Scheduled";
    const cardClass = session.isAddon ? "session-card addon-card" : "session-card";
    const sessionKey = getSessionKey(isAddonSection, index);

    containerEl.innerHTML += `
      <div class="${cardClass}">
        <div class="session-header">
          <div class="session-title">${session.title}</div>
          <div class="session-status-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="session-date">Planned Date: ${session.plannedDate || "TBD"}</div>
        <div class="session-topics">${topicsText}</div>

        <div class="agent-row">
          <label for="agent-${sessionKey}">Assigned Agent</label>
          <select class="agent-select" id="agent-${sessionKey}" data-session-key="${sessionKey}">
            ${buildAgentOptions(session.assignedAgent)}
          </select>
        </div>

        <div class="session-actions">
          <a class="session-link-btn" href="${AGENT_LINKS[session.assignedAgent]}" target="_blank" rel="noopener noreferrer">Schedule Session</a>
          <button class="session-copy-btn" type="button" data-copy-title="${escapeHtml(sessionTitleForCopy)}">Copy Session Title</button>
          <button class="session-status-btn" type="button" data-session-key="${sessionKey}">${toggleText}</button>
          ${agentMode ? `<button class="session-script-btn" type="button" onclick="openScript('${escapeHtmlAttribute(session.title)}')">View Script</button>` : ""}
        </div>
      </div>
    `;
  });
}

function getSessionKey(isAddonSection, index) {
  return `${isAddonSection ? "addon" : "core"}-${index}`;
}

function buildAgentOptions(selectedAgent) {
  return Object.keys(AGENT_LABELS)
    .map(agent => `<option value="${agent}" ${agent === selectedAgent ? "selected" : ""}>${AGENT_LABELS[agent]}</option>`)
    .join("");
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
      const sessionKey = button.getAttribute("data-session-key");
      toggleSessionStatus(sessionKey);
    });
  });
}

function toggleSessionStatus(sessionKey) {
  console.log("toggle clicked", sessionKey);
  
  if (!currentPlanData) return;

  const [group, indexStr] = sessionKey.split("-");
  const index = Number(indexStr);

  if (group === "core" && currentPlanData.coreSessions[index]) {
    currentPlanData.coreSessions = currentPlanData.coreSessions.map((session, i) => {
      if (i === index) {
        return {
          ...session,
          isScheduled: !Boolean(session.isScheduled)
        };
      }
      return session;
    });
  }

  if (group === "addon" && currentPlanData.addonSessions[index]) {
    currentPlanData.addonSessions = currentPlanData.addonSessions.map((session, i) => {
      if (i === index) {
        return {
          ...session,
          isScheduled: !Boolean(session.isScheduled)
        };
      }
      return session;
    });
  }

  if (group === "adhoc" && currentPlanData.adhocSessions[index]) {
  currentPlanData.adhocSessions = currentPlanData.adhocSessions.map((session, i) => {
    if (i === index) {
      return {
        ...session,
        isScheduled: !Boolean(session.isScheduled)
      };
    }
    return session;
  });
}
  
  renderAll(currentPlanData);
}

function bindAgentDropdowns() {
  const dropdowns = document.querySelectorAll(".agent-select");

  dropdowns.forEach(dropdown => {
    dropdown.addEventListener("change", () => {
      const sessionKey = dropdown.getAttribute("data-session-key");
      const target = getSessionByKey(sessionKey);
      if (!target) return;

      target.assignedAgent = dropdown.value;
      renderAll(currentPlanData);
    });
  });
}

function getSessionByKey(sessionKey) {
  if (!currentPlanData) return null;

  const [group, indexStr] = sessionKey.split("-");
  const index = Number(indexStr);

  if (group === "core") return currentPlanData.coreSessions[index] || null;
  if (group === "addon") return currentPlanData.addonSessions[index] || null;
  if (group === "adhoc") return currentPlanData.adhocSessions[index] || null;

  return null;
}

function getAgendaSession(planData) {
  if (!planData) return null;

  const combined = [...planData.coreSessions, ...planData.addonSessions];
  if (combined.length === 0) return null;

  const startIndex = planData.plannerUsage === "session1" ? 1 : 0;

  for (let i = startIndex; i < combined.length; i++) {
    if (!combined[i].isScheduled) {
      return combined[i];
    }
  }

  return combined[startIndex] || combined[combined.length - 1];
}

function getNextStepsData(planData) {
  if (!planData) return null;

  // 1. Next Planned Session (first not scheduled)
  const allSessions = [
    ...(planData.coreSessions || []),
    ...(planData.addonSessions || []),
    ...(planData.adhocSessions || [])
  ];

  const nextSession = allSessions.find(s => !s.isScheduled) || null;

  // 2. Open Notes
  const openNotes = (planData.notes || []).filter(n => n.status === "Open");

  // 3. Ad-hoc sessions needing attention
  const adhocPending = (planData.adhocSessions || []).filter(s => !s.isScheduled);

  return {
    nextSession,
    openNotes,
    adhocPending
  };
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
    <div class="agenda-line"><strong>Assigned Agent:</strong> ${AGENT_LABELS[nextSession.assignedAgent]}</div>
    <div class="agenda-line"><strong>Planned Date:</strong> ${nextSession.plannedDate || "TBD"}</div>
    <div class="agenda-line"><strong>Focus Topics:</strong> ${nextSession.topics.join(" • ")}</div>
  `;
}

function renderNextSteps(planData) {
  const panel = document.getElementById("nextStepsPanel");
  if (!panel) return;

  const data = getNextStepsData(planData);

  if (!data) {
    panel.innerHTML = `<div class="muted">Generate a plan or import a saved plan to view the next steps.</div>`;
    return;
  }

  const { nextSession, openNotes, adhocPending } = data;

  let html = "";

  html += `
    <div class="agenda-line"><strong>Next Planned Session:</strong></div>
  `;

  if (nextSession) {
    html += `
      <div class="agenda-line">${nextSession.title}</div>
      <div class="agenda-line"><strong>Planned Date:</strong> ${nextSession.plannedDate || "TBD"}</div>
      <div class="agenda-line"><strong>Assigned Agent:</strong> ${AGENT_LABELS[nextSession.assignedAgent]}</div>
    `;
  } else {
    html += `
      <div class="agenda-line">All planned sessions are scheduled.</div>
    `;
  }

  html += `
    <div class="agenda-line" style="margin-top:12px;"><strong>Open Follow-Ups (${openNotes.length}):</strong></div>
  `;

  if (openNotes.length > 0) {
    openNotes.slice(0, 3).forEach(note => {
      html += `<div class="agenda-line">- ${note.text}</div>`;
    });

    if (openNotes.length > 3) {
      html += `<div class="agenda-line">+ ${openNotes.length - 3} more</div>`;
    }
  } else {
    html += `<div class="agenda-line">- None</div>`;
  }

  html += `
    <div class="agenda-line" style="margin-top:12px;"><strong>Ad-Hoc Sessions Requiring Attention:</strong></div>
  `;

  if (adhocPending.length > 0) {
    adhocPending.forEach(session => {
      html += `<div class="agenda-line">- ${session.title} [Not Scheduled]</div>`;
    });
  } else {
    html += `<div class="agenda-line">- None</div>`;
  }

  panel.innerHTML = html;
}

function renderReport(planData) {
  const priorityLabels = planData.priorities.map(getPriorityLabel);
  const usageLabel = planData.plannerUsage === "session1" ? "We are in Session 1 now" : "Planning / kickoff only";

  let report = `MSP: ${planData.mspName}
Go-Live Date: ${planData.goLiveDate}
Planner Usage: ${usageLabel}

Recommended Onboarding Type: ${planData.recommendedTypeName}

Why this was recommended:
`;

  planData.whyBullets.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
What this means:
- Recommended core sessions: ${planData.planMeta.sessions}
- Estimated pace: ${planData.planMeta.pace}
- ${planData.planMeta.meaning}

Priority Areas:
`;

  priorityLabels.forEach(item => {
    report += `- ${item}
`;
  });

  report += `
Core Sessions:
`;

  planData.coreSessions.forEach(session => {
    report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
    session.topics.forEach(topic => {
      report += `  • ${topic}
`;
    });
  });

  report += `
Add-On Sessions:
`;

  if (planData.addonSessions.length === 0) {
    report += `- None
`;
  } else {
    planData.addonSessions.forEach(session => {
      report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
      session.topics.forEach(topic => {
        report += `  • ${topic}
`;
      });
    });
  }

  report += `
Ad-Hoc Sessions:
`;

if (!planData.adhocSessions || planData.adhocSessions.length === 0) {
  report += `- None
`;
} else {
  planData.adhocSessions.forEach(session => {
    report += `- ${session.title} (${session.plannedDate || "TBD"}) [${session.isScheduled ? "Scheduled" : "Not Scheduled"}] [Agent: ${AGENT_LABELS[session.assignedAgent]}]
`;
  });
}
  
  const nextSession = getAgendaSession(planData);

  if (nextSession) {
    report += `
Next Meeting Agenda:
- ${nextSession.title}
- Assigned Agent: ${AGENT_LABELS[nextSession.assignedAgent]}
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

function copyNextSteps() {
  if (!currentPlanData) {
    alert("Please generate or import a plan first.");
    return;
  }

  const data = getNextStepsData(currentPlanData);
  if (!data) {
    alert("No next steps available to copy.");
    return;
  }

  const { nextSession, openNotes, adhocPending } = data;

  let text = `Next Planned Session:\n`;

  if (nextSession) {
    text += `- ${nextSession.title}\n`;
    text += `- Planned Date: ${nextSession.plannedDate || "TBD"}\n`;
    text += `- Assigned Agent: ${AGENT_LABELS[nextSession.assignedAgent]}\n`;
  } else {
    text += `- All planned sessions are scheduled.\n`;
  }

  text += `\nOpen Follow-Ups:\n`;
  if (openNotes.length > 0) {
    openNotes.forEach(note => {
      text += `- ${note.text}\n`;
    });
  } else {
    text += `- None\n`;
  }

  text += `\nAd-Hoc Sessions Requiring Attention:\n`;
  if (adhocPending.length > 0) {
    adhocPending.forEach(session => {
      text += `- ${session.title} [Not Scheduled]\n`;
    });
  } else {
    text += `- None\n`;
  }

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyNextSteps");
    if (!btn) return;

    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = original;
    }, 1200);
  }).catch(() => {
    alert("Could not copy the next steps.");
  });
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
Assigned Agent: ${AGENT_LABELS[nextSession.assignedAgent]}
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
      currentPlanData = {
        ...imported,
        coreSessions: imported.coreSessions || [],
        addonSessions: imported.addonSessions || [],
        notes: imported.notes || []
      };
      renderAll(currentPlanData);
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
  document.getElementById("salesTrainingNeeded").value = planData.answers?.salesTrainingNeeded || "";
  document.getElementById("storefrontNeeded").value = planData.answers?.storefrontNeeded || "";
  setSelectedPriorities(planData.priorities || []);

  if (agentModeToggle) {
    agentMode = agentModeToggle.checked;
  }
}

function openScript(sessionTitle) {
  const modal = document.getElementById("scriptModal");
  const body = document.getElementById("scriptBody");
  const content = document.querySelector(".script-content");

  if (!modal || !body || !content) return;

  body.innerHTML = getScriptContent(sessionTitle);
  modal.style.display = "flex";

  body.scrollTop = 0;
  modal.scrollTop = 0;
  content.scrollTop = 0;
}

function closeScript() {
  const modal = document.getElementById("scriptModal");
  if (modal) {
    modal.style.display = "none";
  }
}

document.getElementById("addNoteBtn").addEventListener("click", () => {
  const form = document.getElementById("noteForm");
  if (!form) return;

  form.style.display = form.style.display === "none" ? "block" : "none";
});

document.getElementById("addAdhocBtn").addEventListener("click", () => {
  const form = document.getElementById("adhocForm");
  if (!form) return;

  form.style.display = form.style.display === "none" ? "block" : "none";
});


/* ===== ADD THIS BLOCK START ===== */

let notes = [];

document.getElementById("saveNoteBtn").addEventListener("click", () => {
  const type = document.getElementById("noteType").value;
  const session = document.getElementById("noteSession").value;
  const text = document.getElementById("noteText").value;

  if (!text.trim()) return;

  const note = {
    type,
    session,
    text,
    status: "Open"
  };

 if (!currentPlanData.notes) {
  currentPlanData.notes = [];
}

currentPlanData.notes.push(note);
notes = currentPlanData.notes;

  renderNotes();

  // reset form
  document.getElementById("noteText").value = "";
  document.getElementById("noteForm").style.display = "none";
});

function renderNotes() {
  const container = document.getElementById("notesSection");
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `<div class="muted">No notes yet.</div>`;
    return;
  }

  container.innerHTML = notes.map((note, index) => `
  <div class="note-item" style="margin-bottom:12px;">
  <strong>${note.type}</strong>
  ${note.session ? `— ${note.session}` : ""}
  <br>
  ${note.text}
  <br>
  <em>Status: ${note.status}</em>
  <br>
  <button type="button" onclick="toggleNoteStatus(${index})">
    ${note.status === "Open" ? "Mark Done" : "Mark Open"}
  </button>

  ${note.type === "Ad-hoc session idea" ? `
    <button type="button" onclick="createAdhocFromNote(${index})">
      Create Session
    </button>
  ` : ""}
</div>
  `).join("");
}

function toggleNoteStatus(index) {
  if (!notes[index]) return;

  notes[index].status = notes[index].status === "Open" ? "Done" : "Open";

  currentPlanData.notes = notes;

  renderNotes();
  renderNextSteps(currentPlanData); // 👈 ADD THIS LINE
}

// 👇 PASTE RIGHT HERE

function createAdhocFromNote(index) {
  if (!notes[index] || !currentPlanData) return;

  const note = notes[index];

  // Prevent duplicate session creation from the same note
  const alreadyExists = (currentPlanData.adhocSessions || []).some(
    session => session.title === note.text
  );

  if (alreadyExists) {
    alert("An ad-hoc session with this title already exists.");
    return;
  }

  const session = {
    title: note.text,
    plannedDate: "TBD",
    assignedAgent: "mike",
    isScheduled: false,
    isAddon: false,
    isAdhoc: true,
    topics: []
  };

  if (!currentPlanData.adhocSessions) {
    currentPlanData.adhocSessions = [];
  }

  currentPlanData.adhocSessions.push(session);

  // Mark the note as done once a session is created
  notes[index].status = "Done";
  currentPlanData.notes = notes;

  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);

  // Scroll the Ad-Hoc section into view so the user sees the result
  const adhocCard = document.getElementById("adhocSection");
  if (adhocCard) {
    adhocCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 👇 ADD THIS NEW FUNCTION RIGHT BELOW

function deleteAdhocSession(index) {
  if (!currentPlanData || !currentPlanData.adhocSessions) return;

  const confirmDelete = confirm("Delete this ad-hoc session?");
  if (!confirmDelete) return;

  currentPlanData.adhocSessions.splice(index, 1);
  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);
}

let adhocSessions = [];

document.getElementById("saveAdhocBtn").addEventListener("click", () => {
  const title = document.getElementById("adhocTitle").value;
  const date = document.getElementById("adhocDate").value;
  const agent = document.getElementById("adhocAgent").value;

  if (!title.trim()) return;

  const session = {
    title,
    plannedDate: date || "TBD",
    assignedAgent: agent,
    isScheduled: false,
    isAddon: false,
    isAdhoc: true,
    topics: []
  };

  if (!currentPlanData.adhocSessions) {
    currentPlanData.adhocSessions = [];
  }

  currentPlanData.adhocSessions.push(session);
  adhocSessions = currentPlanData.adhocSessions;

  renderAll(currentPlanData);

  // reset form
  document.getElementById("adhocTitle").value = "";
  document.getElementById("adhocDate").value = "";
  document.getElementById("adhocForm").style.display = "none";
});

function renderAdhocSessions() {
  const container = document.getElementById("adhocSection");
  if (!container) return;

  if (!adhocSessions || adhocSessions.length === 0) {
    container.innerHTML = `<div class="muted">No ad-hoc sessions added.</div>`;
    return;
  }

  container.innerHTML = adhocSessions.map((session, index) => {
    const isScheduled = Boolean(session.isScheduled);
    const statusClass = isScheduled ? "status-scheduled" : "status-not-scheduled";
    const statusText = isScheduled ? "Scheduled" : "Not Scheduled";
    const toggleText = isScheduled ? "Mark Unscheduled" : "Mark Scheduled";

    const sessionKey = `adhoc-${index}`;

    return `
      <div class="session-card">
        <div class="session-header">
          <div class="session-title">${session.title}</div>
          <div class="session-status-badge ${statusClass}">${statusText}</div>
        </div>

        <div class="session-date">Planned Date: ${session.plannedDate}</div>
        <div class="session-topics">Ad-hoc session</div>

        <div class="agent-row">
          <label>Assigned Agent</label>
          <select class="agent-select" data-session-key="${sessionKey}">
            ${buildAgentOptions(session.assignedAgent)}
          </select>
        </div>

<div class="session-actions">
  <a class="session-link-btn" href="${AGENT_LINKS[session.assignedAgent]}" target="_blank" rel="noopener noreferrer">
    Schedule Session
  </a>

  <button class="session-copy-btn" type="button" data-copy-title="${escapeHtml(`Salesbuildr Onboarding – ${session.title}`)}">
    Copy Session Title
  </button>

  <button class="session-status-btn" type="button" data-session-key="${sessionKey}">
    ${toggleText}
  </button>

  <button type="button" onclick="deleteAdhocSession(${index})" style="margin-left:8px;">
    Delete
  </button>
</div>
      </div>
    `;
  }).join("");
}

/* ===== ADD THIS BLOCK END ===== */

function getScriptKeyFromTitle(title) {
  if (title.includes("Kickoff")) return "session1";
  if (title.includes("Catalog")) return "session2_catalog";
  if (title.includes("Templates")) return "session3_templates";
  if (title.includes("Workflow")) return "session4_workflow";
  if (title.includes("Sales Team Training")) return "addon_sales";
  if (title.includes("Storefront")) return "addon_storefront";
  return null;
}

function getScriptContent(title) {
  const scriptKey = getScriptKeyFromTitle(title);
  const script = SESSION_SCRIPTS[scriptKey];

  if (!script) {
    return "<p>No script available yet.</p>";
  }

  let html = `
    <h2>${title}</h2>

    <h3>Objective</h3>
    <p>${script.objective.replace(/\n/g, "<br>")}</p>

    <h3>Session Flow</h3>
  `;

  script.flow.forEach(step => {
    html += `
      <div style="margin-bottom:10px;">
        <strong>${step.title}</strong><br>
        ${step.content.replace(/\n/g, "<br>")}
      </div>
    `;
  });

  html += `
    <h3>Key Points</h3>
    <ul>
      ${script.keyPoints.map(p => `<li>${p}</li>`).join("")}
    </ul>

    <h3>Avoid</h3>
    <ul>
      ${script.avoid.map(a => `<li>${a}</li>`).join("")}
    </ul>

    <h3>Homework</h3>
    <p>${script.homework.replace(/\n/g, "<br>")}</p>
  `;

  return html;
}

window.openScript = openScript;
window.closeScript = closeScript;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "\\'");
}
