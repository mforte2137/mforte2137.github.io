/* ═══════════════════════════════════════════════════════
   MSP Project Progress — progress.js
   Vanilla JS, no framework. LocalStorage persistence.
   AI reports via Anthropic API (claude-haiku-4-5-20251001)
═══════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ────────────────────────────────────────────
let projects = [];          // all projects
let activeProjectId = null; // currently open project
let editingBlockerId = null;// blocker being edited
let pendingDeleteId = null; // project pending deletion
const STORAGE_KEY = 'msp_progress_projects';
const FUNCTION_URL = '/.netlify/functions/progress-claude';

// ─── PERSISTENCE ──────────────────────────────────────
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    projects = raw ? JSON.parse(raw) : [];
  } catch { projects = []; }
}

function getProject(id) {
  return projects.find(p => p.id === id);
}

function getActiveProject() {
  return getProject(activeProjectId);
}

// ─── VIEWS ────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const grid = document.getElementById('projects-grid');
  const empty = document.getElementById('empty-state');
  grid.innerHTML = '';

  if (projects.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  projects.forEach(p => {
    const total = p.tasks.length;
    const done = p.tasks.filter(t => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const activeBlockers = p.blockers.filter(b => b.status !== 'resolved');
    const highBlockers = activeBlockers.filter(b => b.severity === 'high');

    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-title">${esc(p.title)}</div>
          <div class="card-customer">${esc(p.customerName || 'No customer set')}</div>
        </div>
        <button class="card-menu-btn" data-pid="${p.id}" title="Options">⋯</button>
      </div>
      <div class="card-progress-bar-wrap">
        <div class="card-progress-bar-track">
          <div class="card-progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="card-progress-info">
          <span>${done} of ${total} tasks complete</span>
          <span class="card-pct">${pct}%</span>
        </div>
      </div>
      <div class="card-meta">
        ${highBlockers.length ? `<span class="card-tag has-blockers">⚠ ${highBlockers.length} high risk</span>` : ''}
        ${activeBlockers.length && !highBlockers.length ? `<span class="card-tag has-blockers">${activeBlockers.length} blocker${activeBlockers.length > 1 ? 's' : ''}</span>` : ''}
        ${activeBlockers.length === 0 ? '<span class="card-tag healthy">✓ No blockers</span>' : ''}
        <span class="card-tag">${total} tasks</span>
      </div>
    `;

    // Click card body to open (not menu btn)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-menu-btn') || e.target.closest('.card-dropdown')) return;
      openProject(p.id);
    });

    grid.appendChild(card);

    // Menu button
    const menuBtn = card.querySelector('.card-menu-btn');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      const dropdown = document.createElement('div');
      dropdown.className = 'card-dropdown';
      dropdown.innerHTML = `
        <button data-action="open">Open Project</button>
        <button data-action="delete" class="danger">Delete Project</button>
      `;
      dropdown.querySelector('[data-action="open"]').addEventListener('click', () => openProject(p.id));
      dropdown.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDelete(p.id));
      card.appendChild(dropdown);
    });
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.card-dropdown').forEach(d => d.remove());
}

document.addEventListener('click', closeAllDropdowns);

// ─── OPEN PROJECT ─────────────────────────────────────
function openProject(id) {
  activeProjectId = id;
  renderTracker();
  showView('tracker');
}

// ─── TRACKER ──────────────────────────────────────────
function renderTracker() {
  const p = getActiveProject();
  if (!p) return;

  document.getElementById('tracker-project-title').textContent = p.title;
  document.getElementById('tracker-customer-name').textContent = p.customerName || '';
  document.getElementById('project-notes').value = p.internalNotes || '';

  renderTasks(p);
  renderBlockers(p);
  updateProgressRing(p);
}

function renderTasks(p) {
  const list = document.getElementById('tasks-list');
  const count = document.getElementById('task-count');
  const done = p.tasks.filter(t => t.completed).length;
  count.textContent = `${done} of ${p.tasks.length}`;

  list.innerHTML = '';
  p.tasks.forEach((task, i) => {
    const row = document.createElement('div');
    row.className = 'task-row' + (task.completed ? ' completed' : '');
    row.innerHTML = `
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-idx="${i}"></div>
      <div class="task-info">
        <div class="task-name">${esc(task.task)}</div>
        <div class="task-role">${esc(task.role || '')}</div>
        ${task.notes ? `<div class="task-notes-text">${esc(task.notes)}</div>` : ''}
        ${task.completionNote ? `<div class="task-notes-text" style="color:var(--green)">✓ ${esc(task.completionNote)}</div>` : ''}
      </div>
      <button class="task-note-btn" data-idx="${i}" title="Add completion note">✎</button>
    `;

    row.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(i));
    row.querySelector('.task-note-btn').addEventListener('click', () => toggleTaskNote(row, i));
    list.appendChild(row);
  });
}

function toggleTask(idx) {
  const p = getActiveProject();
  p.tasks[idx].completed = !p.tasks[idx].completed;
  p.updatedAt = new Date().toISOString();
  save();
  renderTasks(p);
  updateProgressRing(p);
  renderDashboard(); // keep dashboard in sync
}

function toggleTaskNote(row, idx) {
  const p = getActiveProject();
  const existing = row.querySelector('.task-note-input');
  if (existing) { existing.remove(); return; }

  const ta = document.createElement('textarea');
  ta.className = 'task-note-input';
  ta.rows = 2;
  ta.placeholder = 'Add a completion note…';
  ta.value = p.tasks[idx].completionNote || '';
  ta.addEventListener('blur', () => {
    p.tasks[idx].completionNote = ta.value.trim();
    p.updatedAt = new Date().toISOString();
    save();
    renderTasks(p);
  });
  row.querySelector('.task-info').appendChild(ta);
  ta.focus();
}

function updateProgressRing(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const circ = 226.2;
  const offset = circ - (pct / 100) * circ;

  document.getElementById('progress-arc').style.strokeDashoffset = offset;
  document.getElementById('progress-pct').textContent = pct + '%';
}

function renderBlockers(p) {
  const list = document.getElementById('blockers-list');
  const noBlockers = document.getElementById('no-blockers');
  const active = p.blockers.filter(b => b.status !== 'resolved');

  list.innerHTML = '';
  if (active.length === 0) {
    noBlockers.style.display = 'block';
    return;
  }
  noBlockers.style.display = 'none';

  p.blockers.forEach((b, i) => {
    const card = document.createElement('div');
    card.className = `blocker-card sev-${b.severity}`;
    card.innerHTML = `
      <div class="blocker-dot"></div>
      <div class="blocker-body">
        <div class="blocker-desc">${esc(b.description)}</div>
        <div class="blocker-meta">
          <span class="blocker-sev-badge ${b.severity}">${b.severity}</span>
          <span class="blocker-status-badge">${b.status}</span>
        </div>
      </div>
      <div class="blocker-actions">
        <button class="blocker-btn" data-edit="${i}" title="Edit">✎</button>
        <button class="blocker-btn" data-del="${i}" title="Remove" style="color:var(--red)">✕</button>
      </div>
    `;
    card.querySelector('[data-edit]').addEventListener('click', () => openBlockerModal(i));
    card.querySelector('[data-del]').addEventListener('click', () => deleteBlocker(i));
    list.appendChild(card);
  });
}

function deleteBlocker(idx) {
  const p = getActiveProject();
  p.blockers.splice(idx, 1);
  p.updatedAt = new Date().toISOString();
  save();
  renderBlockers(p);
}

// ─── IMPORT ───────────────────────────────────────────
function openImportModal() {
  resetImportModal();
  document.getElementById('modal-import').classList.add('open');
}

function resetImportModal() {
  document.getElementById('file-input').value = '';
  document.getElementById('import-meta-fields').style.display = 'none';
  document.getElementById('import-error').style.display = 'none';
  document.getElementById('btn-import-confirm').disabled = true;
  document.getElementById('import-title').value = '';
  document.getElementById('import-customer').value = '';
  document.getElementById('import-msp').value = '';
  document._pendingImportData = null;
}

function closeImportModal() {
  document.getElementById('modal-import').classList.remove('open');
}

let pendingImportData = null;

function handleFileSelect(file) {
  if (!file || file.type !== 'application/json') {
    showImportError('Please select a valid .json file.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid format');
      pendingImportData = data;
      document.getElementById('import-title').value = data.projectTitle || '';
      document.getElementById('import-customer').value = data.customerName || '';
      document.getElementById('import-meta-fields').style.display = 'flex';
      document.getElementById('import-meta-fields').style.flexDirection = 'column';
      document.getElementById('import-meta-fields').style.gap = '1rem';
      document.getElementById('btn-import-confirm').disabled = false;
      document.getElementById('import-error').style.display = 'none';
    } catch {
      showImportError('Could not parse this file. Make sure it is a valid project export.');
    }
  };
  reader.readAsText(file);
}

function showImportError(msg) {
  const el = document.getElementById('import-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function confirmImport() {
  if (!pendingImportData) return;
  const title = document.getElementById('import-title').value.trim() || pendingImportData.projectTitle || 'Untitled Project';
  const customerName = document.getElementById('import-customer').value.trim();
  const mspName = document.getElementById('import-msp').value.trim();

  const project = {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title,
    customerName,
    mspName,
    overview: pendingImportData.overview || '',
    exclusions: pendingImportData.exclusions || '',
    tasks: pendingImportData.rows.map(r => ({
      task: r.task,
      role: r.role || '',
      hours: r.hours || '',
      notes: r.notes || '',
      completed: false,
      completionNote: ''
    })),
    blockers: [],
    internalNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.unshift(project);
  save();
  closeImportModal();
  pendingImportData = null;
  renderDashboard();
  openProject(project.id);
}

// ─── BLOCKER MODAL ────────────────────────────────────
function openBlockerModal(editIdx) {
  editingBlockerId = editIdx !== undefined ? editIdx : null;
  const p = getActiveProject();
  const title = document.getElementById('blocker-modal-title');

  let sev = 'medium', status = 'active', desc = '';

  if (editingBlockerId !== null) {
    const b = p.blockers[editingBlockerId];
    sev = b.severity; status = b.status; desc = b.description;
    title.textContent = 'Edit Blocker';
  } else {
    title.textContent = 'Add Blocker';
  }

  document.getElementById('blocker-desc').value = desc;

  document.querySelectorAll('#severity-toggle .sev-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sev === sev);
  });
  document.querySelectorAll('#status-toggle .sev-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === status);
  });

  document.getElementById('modal-blocker').classList.add('open');
}

function saveBlocker() {
  const p = getActiveProject();
  const desc = document.getElementById('blocker-desc').value.trim();
  if (!desc) return;

  const sev = document.querySelector('#severity-toggle .sev-btn.active')?.dataset.sev || 'medium';
  const status = document.querySelector('#status-toggle .sev-btn.active')?.dataset.status || 'active';

  const blocker = { description: desc, severity: sev, status, createdAt: new Date().toISOString() };

  if (editingBlockerId !== null) {
    p.blockers[editingBlockerId] = blocker;
  } else {
    p.blockers.push(blocker);
  }

  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-blocker').classList.remove('open');
  renderBlockers(p);
}

// ─── EDIT META MODAL ──────────────────────────────────
function openMetaModal() {
  const p = getActiveProject();
  document.getElementById('meta-title').value = p.title;
  document.getElementById('meta-customer').value = p.customerName || '';
  document.getElementById('meta-msp').value = p.mspName || '';
  document.getElementById('meta-overview').value = p.overview || '';
  document.getElementById('modal-meta').classList.add('open');
}

function saveMetaModal() {
  const p = getActiveProject();
  p.title = document.getElementById('meta-title').value.trim() || p.title;
  p.customerName = document.getElementById('meta-customer').value.trim();
  p.mspName = document.getElementById('meta-msp').value.trim();
  p.overview = document.getElementById('meta-overview').value.trim();
  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-meta').classList.remove('open');
  renderTracker();
}

// ─── DELETE PROJECT ───────────────────────────────────
function confirmDelete(id) {
  pendingDeleteId = id;
  const p = getProject(id);
  document.getElementById('delete-project-name').textContent = p.title;
  document.getElementById('modal-delete').classList.add('open');
}

function executeDelete() {
  projects = projects.filter(p => p.id !== pendingDeleteId);
  save();
  pendingDeleteId = null;
  document.getElementById('modal-delete').classList.remove('open');
  renderDashboard();
}

// ─── AI REPORT GENERATION ─────────────────────────────
async function generateReport() {
  const p = getActiveProject();
  if (!p) return;

  // Save current notes
  p.internalNotes = document.getElementById('project-notes').value;
  save();

  showView('report');
  document.getElementById('generating-state').style.display = 'flex';
  document.getElementById('report-wrap').style.display = 'none';

  const messages = [cycleGenMessage()];
  const msgEl = document.getElementById('gen-message');
  const genMessages = [
    'Analysing project data…',
    'Reviewing task completion…',
    'Evaluating risks and blockers…',
    'Composing executive narrative…',
    'Finalising report…'
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % genMessages.length;
    msgEl.textContent = genMessages[msgIdx];
  }, 1800);

  try {
    const prompt = buildReportPrompt(p);
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'API error — please try again.');
    }

    const data = await response.json();
    const rawText = data.text;
    const report = parseReportJSON(rawText);

    clearInterval(msgInterval);
    renderReport(p, report);

  } catch (err) {
    clearInterval(msgInterval);
    document.getElementById('gen-message').textContent = '⚠ ' + (err.message || 'Something went wrong. Please try again.');
    // Add retry button
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn-primary';
    retryBtn.textContent = 'Retry';
    retryBtn.style.marginTop = '1rem';
    retryBtn.addEventListener('click', generateReport);
    const gs = document.getElementById('generating-state');
    if (!gs.querySelector('.btn-primary')) gs.appendChild(retryBtn);
  }
}

function cycleGenMessage() { return ''; }

function buildReportPrompt(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const completedTasks = p.tasks.filter(t => t.completed).map(t => t.task);
  const pendingTasks = p.tasks.filter(t => !t.completed).map(t => t.task);
  const activeBlockers = p.blockers.filter(b => b.status !== 'resolved');

  return `You are an expert MSP project communication specialist. Generate an executive project status report in JSON format.

PROJECT DATA:
- Project: ${p.title}
- Customer: ${p.customerName || 'Not specified'}
- MSP: ${p.mspName || 'Your MSP'}
- Progress: ${done} of ${total} tasks complete (${pct}%)
- Overview: ${p.overview || 'Network infrastructure upgrade project.'}

COMPLETED TASKS (${completedTasks.length}):
${completedTasks.length ? completedTasks.map(t => '✓ ' + t).join('\n') : 'None yet'}

PENDING TASKS (${pendingTasks.length}):
${pendingTasks.length ? pendingTasks.slice(0, 8).map(t => '• ' + t).join('\n') : 'All complete!'}

ACTIVE BLOCKERS (${activeBlockers.length}):
${activeBlockers.length ? activeBlockers.map(b => `[${b.severity.toUpperCase()}] ${b.description} (${b.status})`).join('\n') : 'None'}

Respond ONLY with a valid JSON object — no preamble, no markdown, no backticks:
{
  "healthStatus": "healthy" | "at-risk" | "critical",
  "currentPhaseNarrative": "2-3 sentence plain-English explanation of where the project is right now. Customer-facing, no jargon.",
  "phases": [
    { "label": "Phase name", "status": "done" | "active" | "upcoming" }
  ],
  "executiveSummary": "3-4 sentence paragraph. Confident, clear, customer-focused. What has been achieved, what is happening now, what comes next. No bullet points.",
  "decisionsNeeded": [
    "Specific action the customer needs to take or decision needed (if any)"
  ],
  "timelineConfidence": "high" | "medium" | "low",
  "outlookNarrative": "1-2 sentences on timeline confidence and outlook.",
  "reportTitle": "Short subtitle for the report e.g. 'Week 2 Progress Update'"
}

Rules:
- phases array: derive 3-5 logical phases from the task list (e.g. Planning, Installation, Configuration, Testing, Handover). Mark ones with all tasks done as "done", the current active phase as "active", future ones as "upcoming".
- decisionsNeeded: only include if there are genuine blockers requiring customer action. Empty array if not needed.
- healthStatus: healthy if pct>50 and no high blockers; at-risk if high blockers or timeline concerns; critical if severely blocked.
- Write for a non-technical business owner. Avoid acronyms. Be specific about what was actually done.`;
}

function parseReportJSON(raw) {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    // Attempt to extract JSON from mixed text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    // Fallback
    return {
      healthStatus: 'healthy',
      currentPhaseNarrative: 'The project is progressing well. Please check the task list for current status.',
      phases: [{ label: 'In Progress', status: 'active' }],
      executiveSummary: raw.slice(0, 500),
      decisionsNeeded: [],
      timelineConfidence: 'medium',
      outlookNarrative: 'The project is on track.',
      reportTitle: 'Progress Update'
    };
  }
}

function renderReport(p, report) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Masthead
  document.getElementById('rpt-project-title').textContent = p.title;
  document.getElementById('rpt-customer-name').textContent = p.customerName ? `Prepared for ${p.customerName}` : '';
  document.getElementById('rpt-date').textContent = dateStr;
  document.getElementById('rpt-footer-date').textContent = dateStr;

  // Health badge
  const badge = document.getElementById('rpt-health-badge');
  badge.className = 'health-badge ' + (report.healthStatus || 'healthy');
  const healthMap = { healthy: 'HEALTHY', 'at-risk': 'AT RISK', critical: 'CRITICAL' };
  document.getElementById('rpt-health-value').textContent = healthMap[report.healthStatus] || 'HEALTHY';

  // Progress ring
  const circ = 251.3;
  const offset = circ - (pct / 100) * circ;
  document.getElementById('rpt-arc').style.strokeDashoffset = offset;
  document.getElementById('rpt-pct-big').textContent = pct + '%';
  document.getElementById('rpt-task-summary').textContent = `${done} of ${total} tasks complete`;

  // Phase narrative
  document.getElementById('rpt-phase-narrative').textContent = report.currentPhaseNarrative || '';

  // Phase bar
  const phaseBar = document.getElementById('rpt-phase-bar');
  phaseBar.innerHTML = '';
  (report.phases || []).forEach(ph => {
    const pill = document.createElement('span');
    pill.className = 'phase-pill ' + (ph.status || '');
    pill.textContent = ph.label;
    phaseBar.appendChild(pill);
  });

  // Blockers
  const rptBlockers = document.getElementById('rpt-blockers-list');
  const activeBlockers = p.blockers.filter(b => b.status !== 'resolved');
  if (activeBlockers.length === 0) {
    rptBlockers.innerHTML = '<p class="no-risks-text">✓ No active blockers or risks</p>';
  } else {
    rptBlockers.innerHTML = '';
    activeBlockers.forEach(b => {
      const row = document.createElement('div');
      row.className = 'rpt-blocker-row';
      const dotColors = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };
      row.innerHTML = `
        <div class="rpt-blocker-dot" style="background:${dotColors[b.severity] || 'var(--amber)'}"></div>
        <div>
          <div class="rpt-blocker-text">${esc(b.description)}</div>
          <div class="rpt-blocker-badges">
            <span class="blocker-sev-badge ${b.severity}">${b.severity}</span>
            <span class="blocker-status-badge">${b.status}</span>
          </div>
        </div>
      `;
      rptBlockers.appendChild(row);
    });
  }

  // Executive summary
  document.getElementById('rpt-exec-summary').textContent = report.executiveSummary || '';

  // Decisions
  const rptDecisions = document.getElementById('rpt-decisions-list');
  const decisions = report.decisionsNeeded || [];
  if (decisions.length === 0) {
    rptDecisions.innerHTML = '<p style="font-size:13px;color:var(--text-muted)">No decisions required at this time.</p>';
  } else {
    rptDecisions.innerHTML = '';
    decisions.forEach((d, i) => {
      const row = document.createElement('div');
      row.className = 'decision-row';
      row.innerHTML = `<div class="decision-num">${i + 1}</div><div class="decision-text">${esc(d)}</div>`;
      rptDecisions.appendChild(row);
    });
  }

  // Timeline confidence
  const conf = report.timelineConfidence || 'medium';
  const confLabels = { high: '↑ High Confidence', medium: '→ Medium Confidence', low: '↓ Low Confidence' };
  const confEl = document.getElementById('rpt-timeline-conf');
  confEl.className = 'timeline-conf ' + conf;
  confEl.textContent = confLabels[conf] || 'Medium Confidence';
  document.getElementById('rpt-outlook-narrative').textContent = report.outlookNarrative || '';

  // Show report
  document.getElementById('generating-state').style.display = 'none';
  document.getElementById('report-wrap').style.display = 'flex';
}

// ─── UTILITIES ────────────────────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── EVENT WIRING ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  load();
  renderDashboard();
  showView('dashboard');

  // Dashboard
  document.getElementById('btn-import-new').addEventListener('click', openImportModal);
  document.getElementById('btn-import-empty').addEventListener('click', openImportModal);

  // Import modal
  document.getElementById('modal-import-close').addEventListener('click', closeImportModal);
  document.getElementById('btn-import-cancel').addEventListener('click', closeImportModal);
  document.getElementById('btn-import-confirm').addEventListener('click', confirmImport);

  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

  const dropZone = document.getElementById('file-drop-zone');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files[0]);
  });

  // Tracker
  document.getElementById('btn-back-dashboard').addEventListener('click', () => {
    renderDashboard();
    showView('dashboard');
  });
  document.getElementById('btn-generate-report').addEventListener('click', generateReport);
  document.getElementById('btn-edit-meta').addEventListener('click', openMetaModal);
  document.getElementById('btn-add-blocker').addEventListener('click', () => openBlockerModal());

  // Notes autosave
  document.getElementById('project-notes').addEventListener('blur', () => {
    const p = getActiveProject();
    if (!p) return;
    p.internalNotes = document.getElementById('project-notes').value;
    save();
  });

  // Meta modal
  document.getElementById('modal-meta-close').addEventListener('click', () => document.getElementById('modal-meta').classList.remove('open'));
  document.getElementById('btn-meta-cancel').addEventListener('click', () => document.getElementById('modal-meta').classList.remove('open'));
  document.getElementById('btn-meta-save').addEventListener('click', saveMetaModal);

  // Blocker modal
  document.getElementById('modal-blocker-close').addEventListener('click', () => document.getElementById('modal-blocker').classList.remove('open'));
  document.getElementById('btn-blocker-cancel').addEventListener('click', () => document.getElementById('modal-blocker').classList.remove('open'));
  document.getElementById('btn-blocker-save').addEventListener('click', saveBlocker);

  document.querySelectorAll('#severity-toggle .sev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#severity-toggle .sev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('#status-toggle .sev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#status-toggle .sev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Delete modal
  document.getElementById('modal-delete-close').addEventListener('click', () => document.getElementById('modal-delete').classList.remove('open'));
  document.getElementById('btn-delete-cancel').addEventListener('click', () => document.getElementById('modal-delete').classList.remove('open'));
  document.getElementById('btn-delete-confirm').addEventListener('click', executeDelete);

  // Report
  document.getElementById('btn-back-tracker').addEventListener('click', () => showView('tracker'));
  document.getElementById('btn-regenerate').addEventListener('click', generateReport);
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});
