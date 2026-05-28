/* ═══════════════════════════════════════════════════════
   MSP Project Progress — progress.js
   Vanilla JS · LocalStorage · AI via Netlify function
   Model: claude-haiku-4-5-20251001
═══════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ────────────────────────────────────────────
let projects = [];
let activeProjectId = null;
let editingBlockerId = null;
let editingScopeId = null;
let editingTaskIdx = null;
let pendingDeleteId = null;
let pendingDeleteTaskIdx = null;

const STORAGE_KEY = 'msp_progress_projects';
const FUNCTION_URL = '/.netlify/functions/progress-claude';

// ─── PERSISTENCE ──────────────────────────────────────
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); }
function load() {
  try { projects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { projects = []; }
}
function getProject(id) { return projects.find(p => p.id === id); }
function getActiveProject() { return getProject(activeProjectId); }

// ─── VIEWS ────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
}

// ─── SAMPLE REPORT DATA ───────────────────────────────
const SAMPLE_PROJECT = {
  title: 'Network Infrastructure Upgrade',
  customerName: 'MM Forte',
  mspName: 'Your MSP Team',
  tasks: [
    { task: 'Site Survey & Current Environment Assessment', role: 'Senior Engineer', completed: true },
    { task: 'Network Design & Architecture', role: 'Senior Engineer', completed: true },
    { task: 'Procurement & Equipment Staging', role: 'PM', completed: true },
    { task: 'Firewall Installation & Configuration', role: 'Senior Engineer', completed: true },
    { task: 'Core Switch Deployment', role: 'Engineer', completed: true },
    { task: 'Access Switch Deployment', role: 'Engineer', completed: true },
    { task: 'Structured Cabling Installation', role: 'Engineer', completed: true },
    { task: 'Comms Room Ventilation Remediation', role: 'Engineer', completed: true },
    { task: 'Wireless Access Point Deployment', role: 'Engineer', completed: false },
    { task: 'VLAN & Network Segmentation', role: 'Senior Engineer', completed: false },
    { task: 'WAN / Internet Failover Configuration', role: 'Senior Engineer', completed: false },
    { task: 'Site-to-Site VPN', role: 'Senior Engineer', completed: false },
    { task: 'Network Testing & Validation', role: 'Senior Engineer', completed: false },
    { task: 'Workstation & Printer Reconnection', role: 'Engineer', completed: false },
    { task: 'Network Documentation & Diagrams', role: 'Engineer', completed: false },
    { task: 'Project Management', role: 'PM', completed: false }
  ],
  blockers: [
    { description: 'Discovered a patch panel with many poor terminations. Re-termination underway.', severity: 'medium', status: 'mitigating' }
  ],
  scopeChanges: [
    {
      description: 'Warehouse manager desk relocation to opposite wall required two additional network drops and a new network printer connection.',
      type: 'out-of-scope',
      impact: 'medium',
      status: 'approved'
    },
    {
      description: 'Comms room found to have no adequate ventilation on site visit — equipment could not be safely installed without remediation. Cooling unit sourced and fitted before hardware installation proceeded.',
      type: 'creep',
      impact: 'high',
      status: 'absorbed'
    },
    {
      description: 'Customer has requested guest Wi-Fi access in the boardroom and reception area. This was not included in the original scope and will require two additional access points and a separate SSID configuration.',
      type: 'out-of-scope',
      impact: 'low',
      status: 'pending'
    }
  ]
};

const SAMPLE_REPORT = {
  healthStatus: 'healthy',
  currentPhaseNarrative: 'All physical infrastructure is now installed and operational — your new firewall, core switches, structured cabling, and wireless access points are in place. We are currently focused on configuring your network logic including security zones, traffic separation, and internet failover. Device reconnection and final testing follow in the next phase.',
  phases: [
    { label: 'Planning & Preparation', status: 'done' },
    { label: 'Hardware Installation', status: 'done' },
    { label: 'Network Configuration', status: 'active' },
    { label: 'Testing & Validation', status: 'upcoming' },
    { label: 'Handover & Documentation', status: 'upcoming' }
  ],
  executiveSummary: 'The Network Infrastructure Upgrade for MM Forte is progressing well at 50% completion. All major hardware has been installed — your firewall, switches, cabling, and wireless access points are in place and operational. During installation we discovered the comms room lacked adequate ventilation; we resolved this immediately by sourcing and fitting a cooling unit so equipment could be safely installed without delaying the project. We are now configuring the network and addressing a patch panel re-termination. One open item requires your attention — see Scope Changes below.',
  decisionsNeeded: [
    'Guest Wi-Fi in boardroom and reception — please confirm whether you would like to proceed. We can provide a quote for the two additional access points and configuration work.'
  ],
  timelineConfidence: 'high',
  outlookNarrative: 'We remain on track for completion within the agreed window. The ventilation and patch panel issues have been contained and do not affect the critical path. The pending guest Wi-Fi request will be scheduled separately if approved and will not delay the main project.',
  scopeNarrative: '3 scope changes have been identified during this project. The warehouse desk network drops have been approved and completed. The comms room ventilation issue was discovered on site and absorbed into the project to keep things moving. Guest Wi-Fi in the boardroom and reception is pending your decision.'
};

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const grid = document.getElementById('projects-grid');
  const empty = document.getElementById('empty-state');
  grid.innerHTML = '';

  if (projects.length === 0) { empty.style.display = 'flex'; return; }
  empty.style.display = 'none';

  projects.forEach(p => {
    const total = p.tasks.length;
    const done = p.tasks.filter(t => t.completed).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const activeBlockers = (p.blockers || []).filter(b => b.status !== 'resolved');
    const highBlockers = activeBlockers.filter(b => b.severity === 'high');
    const pendingScope = (p.scopeChanges || []).filter(s => s.status === 'pending');

    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-title">${esc(p.title)}</div>
          <div class="card-customer">${esc(p.customerName || 'No customer set')}</div>
        </div>
        <button class="card-menu-btn" data-pid="${p.id}">⋯</button>
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
        ${pendingScope.length ? `<span class="card-tag has-scope">${pendingScope.length} scope change${pendingScope.length > 1 ? 's' : ''}</span>` : ''}
        ${activeBlockers.length === 0 && pendingScope.length === 0 ? '<span class="card-tag healthy">✓ On track</span>' : ''}
        <span class="card-tag">${total} tasks</span>
      </div>`;

    card.addEventListener('click', e => {
      if (e.target.closest('.card-menu-btn') || e.target.closest('.card-dropdown')) return;
      openProject(p.id);
    });
    grid.appendChild(card);

    card.querySelector('.card-menu-btn').addEventListener('click', e => {
      e.stopPropagation();
      closeAllDropdowns();
      const dd = document.createElement('div');
      dd.className = 'card-dropdown';
      dd.innerHTML = `<button data-action="open">Open Project</button><button data-action="delete" class="danger">Delete Project</button>`;
      dd.querySelector('[data-action="open"]').addEventListener('click', () => openProject(p.id));
      dd.querySelector('[data-action="delete"]').addEventListener('click', () => confirmDelete(p.id));
      card.appendChild(dd);
    });
  });
}

function closeAllDropdowns() { document.querySelectorAll('.card-dropdown').forEach(d => d.remove()); }
document.addEventListener('click', closeAllDropdowns);

// ─── SAMPLE REPORT ────────────────────────────────────
function showSampleReport() {
  const wrap = document.getElementById('sample-report-wrap');
  const body = document.getElementById('sample-report-body');
  wrap.style.display = 'block';
  body.innerHTML = buildReportHTML(SAMPLE_PROJECT, SAMPLE_REPORT);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideSampleReport() {
  document.getElementById('sample-report-wrap').style.display = 'none';
}

function buildReportHTML(p, report) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const circ = 251.3;
  const offset = circ - (pct / 100) * circ;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const healthMap = { healthy: 'HEALTHY', 'at-risk': 'AT RISK', critical: 'CRITICAL' };
  const healthClass = report.healthStatus || 'healthy';

  // Phase pills
  const phasePills = (report.phases || []).map(ph =>
    `<span class="phase-pill ${ph.status}">${esc(ph.label)}</span>`).join('');

  // Blockers
  const dotColors = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' };
  const blockersHtml = (p.blockers || []).filter(b => b.status !== 'resolved').length === 0
    ? '<p class="no-risks-text">✓ No active blockers or risks</p>'
    : (p.blockers || []).filter(b => b.status !== 'resolved').map(b => `
      <div class="rpt-blocker-row">
        <div class="rpt-blocker-dot" style="background:${dotColors[b.severity] || 'var(--amber)'}"></div>
        <div>
          <div class="rpt-blocker-text">${esc(b.description)}</div>
          <div class="rpt-blocker-badges">
            <span class="blocker-sev-badge ${b.severity}">${b.severity}</span>
            <span class="blocker-status-badge">${b.status}</span>
          </div>
        </div>
      </div>`).join('');

  // Scope changes
  const scopeItems = (p.scopeChanges || []);
  const scopeHtml = scopeItems.length === 0
    ? '<p class="no-scope-text">No scope changes on this project.</p>'
    : `<div class="scope-changes-grid">${scopeItems.map(s => `
      <div class="scope-change-item impact-${s.impact}">
        <div class="scope-item-desc">${esc(s.description)}</div>
        <div class="scope-item-badges">
          <span class="scope-item-badge type-${s.type === 'out-of-scope' ? 'oos' : 'creep'}">${s.type === 'out-of-scope' ? 'Out of Scope' : 'Project Creep'}</span>
          <span class="scope-item-badge status-${s.status}">${s.status}</span>
          <span class="blocker-sev-badge ${s.impact}">${s.impact} impact</span>
        </div>
      </div>`).join('')}</div>
      ${report.scopeNarrative ? `<p style="margin-top:0.75rem;font-size:13px;color:var(--text-muted)">${esc(report.scopeNarrative)}</p>` : ''}`;

  // Decisions
  const decisions = report.decisionsNeeded || [];
  const decisionsHtml = decisions.length === 0
    ? '<p style="font-size:13px;color:var(--text-muted)">No decisions required at this time.</p>'
    : decisions.map((d, i) => `<div class="decision-row"><div class="decision-num">${i + 1}</div><div class="decision-text">${esc(d)}</div></div>`).join('');

  const conf = report.timelineConfidence || 'medium';
  const confLabels = { high: '↑ High Confidence', medium: '→ Medium Confidence', low: '↓ Low Confidence' };

  return `
    <div class="report-page" style="max-width:100%;box-shadow:none;border:1px solid var(--border)">
      <div class="report-masthead">
        <div class="report-masthead-left">
          <div class="report-logo">◆ MSP Project Progress</div>
          <h1 class="report-project-title">${esc(p.title)}</h1>
          <p class="report-customer">${p.customerName ? 'Prepared for ' + esc(p.customerName) : ''}</p>
        </div>
        <div class="report-masthead-right">
          <div class="health-badge ${healthClass}">
            <span class="health-icon">●</span>
            <div><div class="health-label">Project Health</div><div class="health-value">${healthMap[healthClass]}</div></div>
          </div>
          <div class="report-date">${dateStr}</div>
        </div>
      </div>
      <div class="report-grid">
        <div class="report-block block-phase">
          <div class="block-label">① Current Phase</div>
          <div class="phase-narrative">${esc(report.currentPhaseNarrative)}</div>
          <div class="phase-bar">${phasePills}</div>
        </div>
        <div class="report-block block-progress">
          <div class="block-label">② Overall Progress</div>
          <div class="report-progress-wrap">
            <svg class="report-ring" width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e8e6e0" stroke-width="8"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" stroke-width="8"
                stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                transform="rotate(-90 50 50)"/>
            </svg>
            <div class="report-progress-label"><span style="font-size:22px;font-weight:700">${pct}%</span><small>complete</small></div>
          </div>
          <div class="report-task-summary">${done} of ${total} tasks complete</div>
        </div>
        <div class="report-block block-risks">
          <div class="block-label">③ Risks &amp; Blockers</div>
          ${blockersHtml}
        </div>
        <div class="report-block block-decisions">
          <div class="block-label">④ Decisions &amp; Actions Needed</div>
          ${decisionsHtml}
        </div>
        <div class="report-block block-scope-changes">
          <div class="block-label">⑤ Scope Changes</div>
          ${scopeHtml}
        </div>
        <div class="report-block block-summary">
          <div class="block-label">⑥ Executive Summary</div>
          <div class="exec-summary">${esc(report.executiveSummary)}</div>
        </div>
        <div class="report-block block-timeline">
          <div class="block-label">⑦ Outlook</div>
          <div class="timeline-conf ${conf}">${confLabels[conf]}</div>
          <div class="outlook-narrative">${esc(report.outlookNarrative)}</div>
        </div>
      </div>
      <div class="report-footer">
        <span>Prepared by ${esc(p.mspName || 'your MSP team')}</span>
        <span>${dateStr}</span>
      </div>
    </div>`;
}

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
  if (!p.scopeChanges) p.scopeChanges = [];
  renderTasks(p);
  renderBlockers(p);
  renderScopeChanges(p);
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
    row.draggable = true;
    row.dataset.idx = i;
    const est = parseFloat(task.hours) || 0;
    const act = task.actualHours !== undefined && task.actualHours !== null ? task.actualHours : null;
    const variance = act !== null && est > 0 ? act - est : null;
    const varClass = variance === null ? 'pending' : variance > 0 ? 'over' : variance < 0 ? 'under' : 'exact';
    const varLabel = variance === null
      ? (task.completed ? 'Tap ✎ to log hours' : '')
      : variance > 0 ? `+${variance.toFixed(1)}h over` : variance < 0 ? `${variance.toFixed(1)}h under` : 'On estimate';

    row.innerHTML = `
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-idx="${i}"></div>
      <div class="task-info">
        <div class="task-name">${esc(task.task)}</div>
        <div class="task-role">${esc(task.role || '')}</div>
        ${task.notes ? `<div class="task-notes-text">${esc(task.notes)}</div>` : ''}
        ${task.completionNote ? `<div class="task-completion-note">✓ ${esc(task.completionNote)}</div>` : ''}
        ${task.completed ? `<div class="task-hours-row">
          <span class="hours-chip">Est: ${est}h</span>
          ${act !== null ? `<span class="hours-chip ${varClass}">Act: ${act}h</span>` : ''}
          ${varLabel ? `<span class="var-pill ${varClass}">${varLabel}</span>` : ''}
        </div>` : (est ? `<div class="task-hours-row"><span class="hours-chip">Est: ${est}h</span></div>` : '')}
      </div>
      <div class="task-actions">
        <button class="task-action-btn" data-note="${i}" title="Add completion note">✎</button>
        <button class="task-action-btn" data-edit="${i}" title="Edit task">⊙</button>
        <button class="task-action-btn del" data-del="${i}" title="Delete task">✕</button>
      </div>`;

    row.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(i));
    row.querySelector('[data-note]').addEventListener('click', () => toggleTaskNote(row, i));
    row.querySelector('[data-edit]').addEventListener('click', () => openTaskModal(i));
    row.querySelector('[data-del]').addEventListener('click', () => confirmDeleteTask(i));

    // ── Drag & drop ──────────────────────────────────
    row.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i);
      row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      list.querySelectorAll('.task-row').forEach(r => r.classList.remove('drag-over'));
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.task-row').forEach(r => r.classList.remove('drag-over'));
      row.classList.add('drag-over');
    });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const toIdx = parseInt(row.dataset.idx);
      if (fromIdx === toIdx) return;
      const p2 = getActiveProject();
      const moved = p2.tasks.splice(fromIdx, 1)[0];
      p2.tasks.splice(toIdx, 0, moved);
      p2.updatedAt = new Date().toISOString();
      save();
      renderTasks(p2);
    });

    list.appendChild(row);
  });
}

function toggleTask(idx) {
  const p = getActiveProject();
  p.tasks[idx].completed = !p.tasks[idx].completed;
  // Reset actual hours if unchecking
  if (!p.tasks[idx].completed) p.tasks[idx].actualHours = null;
  p.updatedAt = new Date().toISOString();
  save();
  renderTasks(p);
  updateProgressRing(p);
  renderDashboard();
  // If just completed, prompt for actual hours
  if (p.tasks[idx].completed) showActualHoursPrompt(idx);
}

function showActualHoursPrompt(idx) {
  const p = getActiveProject();
  const list = document.getElementById('tasks-list');
  const rows = list.querySelectorAll('.task-row');
  const row = rows[idx];
  if (!row) return;
  const estimated = parseFloat(p.tasks[idx].hours) || 0;
  // Find or create the hours row
  let hoursRow = row.querySelector('.task-hours-row');
  if (!hoursRow) {
    hoursRow = document.createElement('div');
    hoursRow.className = 'task-hours-row';
    row.querySelector('.task-info').appendChild(hoursRow);
  }
  hoursRow.innerHTML = `
    <span class="hours-chip">Est: ${estimated}h</span>
    <input class="actual-hours-input" type="number" min="0" step="0.5"
      value="${estimated}" placeholder="Actual hrs" title="Actual hours spent" />
    <button class="hours-save-btn">Save</button>
  `;
  const input = hoursRow.querySelector('.actual-hours-input');
  const btn = hoursRow.querySelector('.hours-save-btn');
  input.select();
  btn.addEventListener('click', () => {
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) return;
    p.tasks[idx].actualHours = val;
    p.updatedAt = new Date().toISOString();
    save();
    renderTasks(p);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

function toggleTaskNote(row, idx) {
  const p = getActiveProject();
  const existing = row.querySelector('.task-note-input');
  if (existing) { existing.remove(); return; }
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:6px';
  const ta = document.createElement('textarea');
  ta.className = 'task-note-input'; ta.rows = 2;
  ta.placeholder = 'Add a completion note…';
  ta.value = p.tasks[idx].completionNote || '';
  wrap.appendChild(ta);
  // If completed, also show hours edit
  if (p.tasks[idx].completed) {
    const est = parseFloat(p.tasks[idx].hours) || 0;
    const hoursWrap = document.createElement('div');
    hoursWrap.className = 'task-hours-row';
    hoursWrap.innerHTML = `
      <span style="font-size:12px;color:var(--text-muted)">Actual hours:</span>
      <input class="actual-hours-input" type="number" min="0" step="0.5"
        value="${p.tasks[idx].actualHours ?? est}" placeholder="hrs" style="width:70px" />
      <button class="hours-save-btn">Save</button>`;
    const inp = hoursWrap.querySelector('.actual-hours-input');
    const btn = hoursWrap.querySelector('.hours-save-btn');
    btn.addEventListener('click', () => {
      const val = parseFloat(inp.value);
      p.tasks[idx].actualHours = isNaN(val) ? null : val;
      p.tasks[idx].completionNote = ta.value.trim();
      p.updatedAt = new Date().toISOString();
      save(); renderTasks(p);
    });
    wrap.appendChild(hoursWrap);
  }
  ta.addEventListener('blur', () => {
    if (!p.tasks[idx].completed) {
      p.tasks[idx].completionNote = ta.value.trim();
      p.updatedAt = new Date().toISOString();
      save(); renderTasks(p);
    }
  });
  row.querySelector('.task-info').appendChild(wrap);
  ta.focus();
}

function updateProgressRing(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const offset = 226.2 - (pct / 100) * 226.2;
  document.getElementById('progress-arc').style.strokeDashoffset = offset;
  document.getElementById('progress-pct').textContent = pct + '%';
}

function renderBlockers(p) {
  const list = document.getElementById('blockers-list');
  const noEl = document.getElementById('no-blockers');
  const active = (p.blockers || []).filter(b => b.status !== 'resolved');
  list.innerHTML = '';
  if (active.length === 0) { noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
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
        <button class="blocker-btn" title="Edit">✎</button>
        <button class="blocker-btn" title="Remove" style="color:var(--red)">✕</button>
      </div>`;
    card.querySelectorAll('.blocker-btn')[0].addEventListener('click', () => openBlockerModal(i));
    card.querySelectorAll('.blocker-btn')[1].addEventListener('click', () => { p.blockers.splice(i,1); save(); renderBlockers(p); renderDashboard(); });
    list.appendChild(card);
  });
}

function renderScopeChanges(p) {
  const list = document.getElementById('scope-list');
  const noEl = document.getElementById('no-scope');
  const items = p.scopeChanges || [];
  list.innerHTML = '';
  if (items.length === 0) { noEl.style.display = 'block'; return; }
  noEl.style.display = 'none';
  items.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = `blocker-card scope-${s.status}`;
    card.innerHTML = `
      <div class="blocker-dot" style="background:${s.impact === 'high' ? 'var(--red)' : s.impact === 'medium' ? 'var(--amber)' : 'var(--green)'}"></div>
      <div class="blocker-body">
        <div class="blocker-desc">${esc(s.description)}</div>
        <div class="blocker-meta">
          <span class="scope-type-badge">${s.type === 'out-of-scope' ? 'Out of Scope' : 'Project Creep'}</span>
          <span class="blocker-sev-badge ${s.impact}">${s.impact} impact</span>
          <span class="blocker-status-badge">${s.status}</span>
        </div>
      </div>
      <div class="blocker-actions">
        <button class="blocker-btn" title="Edit">✎</button>
        <button class="blocker-btn" title="Remove" style="color:var(--red)">✕</button>
      </div>`;
    card.querySelectorAll('.blocker-btn')[0].addEventListener('click', () => openScopeModal(i));
    card.querySelectorAll('.blocker-btn')[1].addEventListener('click', () => { p.scopeChanges.splice(i,1); save(); renderScopeChanges(p); renderDashboard(); });
    list.appendChild(card);
  });
}

// ─── TASK MODAL ───────────────────────────────────────
function openTaskModal(editIdx) {
  editingTaskIdx = editIdx !== undefined ? editIdx : null;
  const p = getActiveProject();
  document.getElementById('task-modal-title').textContent = editingTaskIdx !== null ? 'Edit Task' : 'Add Task';
  if (editingTaskIdx !== null) {
    const t = p.tasks[editingTaskIdx];
    document.getElementById('task-name-input').value = t.task;
    document.getElementById('task-role-input').value = t.role || '';
    document.getElementById('task-notes-input').value = t.notes || '';
  } else {
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-role-input').value = '';
    document.getElementById('task-notes-input').value = '';
  }
  document.getElementById('modal-task').classList.add('open');
  document.getElementById('task-name-input').focus();
}

function saveTask() {
  const p = getActiveProject();
  const name = document.getElementById('task-name-input').value.trim();
  if (!name) return;
  const taskObj = {
    task: name,
    role: document.getElementById('task-role-input').value.trim(),
    notes: document.getElementById('task-notes-input').value.trim(),
    completed: editingTaskIdx !== null ? p.tasks[editingTaskIdx].completed : false,
    completionNote: editingTaskIdx !== null ? p.tasks[editingTaskIdx].completionNote : ''
  };
  if (editingTaskIdx !== null) {
    p.tasks[editingTaskIdx] = taskObj;
  } else {
    p.tasks.push(taskObj);
  }
  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-task').classList.remove('open');
  renderTasks(p);
  updateProgressRing(p);
  renderDashboard();
}

function confirmDeleteTask(idx) {
  pendingDeleteTaskIdx = idx;
  const p = getActiveProject();
  document.getElementById('delete-task-name').textContent = p.tasks[idx].task;
  document.getElementById('modal-delete-task').classList.add('open');
}

function executeDeleteTask() {
  const p = getActiveProject();
  p.tasks.splice(pendingDeleteTaskIdx, 1);
  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-delete-task').classList.remove('open');
  renderTasks(p);
  updateProgressRing(p);
  renderDashboard();
}

// ─── BLOCKER MODAL ────────────────────────────────────
function openBlockerModal(editIdx) {
  editingBlockerId = editIdx !== undefined ? editIdx : null;
  const p = getActiveProject();
  document.getElementById('blocker-modal-title').textContent = editingBlockerId !== null ? 'Edit Blocker' : 'Add Blocker';
  let sev = 'medium', status = 'active', desc = '';
  if (editingBlockerId !== null) {
    const b = p.blockers[editingBlockerId];
    sev = b.severity; status = b.status; desc = b.description;
  }
  document.getElementById('blocker-desc').value = desc;
  document.querySelectorAll('#severity-toggle .sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.sev === sev));
  document.querySelectorAll('#status-toggle .sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.status === status));
  document.getElementById('modal-blocker').classList.add('open');
}

function saveBlocker() {
  const p = getActiveProject();
  const desc = document.getElementById('blocker-desc').value.trim();
  if (!desc) return;
  const sev = document.querySelector('#severity-toggle .sev-btn.active')?.dataset.sev || 'medium';
  const status = document.querySelector('#status-toggle .sev-btn.active')?.dataset.status || 'active';
  const blocker = { description: desc, severity: sev, status, createdAt: new Date().toISOString() };
  if (!p.blockers) p.blockers = [];
  if (editingBlockerId !== null) p.blockers[editingBlockerId] = blocker;
  else p.blockers.push(blocker);
  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-blocker').classList.remove('open');
  renderBlockers(p);
  renderDashboard();
}

// ─── SCOPE MODAL ──────────────────────────────────────
function openScopeModal(editIdx) {
  editingScopeId = editIdx !== undefined ? editIdx : null;
  const p = getActiveProject();
  document.getElementById('scope-modal-title').textContent = editingScopeId !== null ? 'Edit Scope Change' : 'Add Scope Change';
  let type = 'out-of-scope', impact = 'low', status = 'pending', desc = '';
  if (editingScopeId !== null) {
    const s = p.scopeChanges[editingScopeId];
    type = s.type; impact = s.impact; status = s.status; desc = s.description;
  }
  document.getElementById('scope-desc').value = desc;
  document.querySelectorAll('#scope-type-toggle .sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
  document.querySelectorAll('#scope-impact-toggle .sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.impact === impact));
  document.querySelectorAll('#scope-status-toggle .sev-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.scopestatus === status));
  document.getElementById('modal-scope').classList.add('open');
}

function saveScope() {
  const p = getActiveProject();
  const desc = document.getElementById('scope-desc').value.trim();
  if (!desc) return;
  const type = document.querySelector('#scope-type-toggle .sev-btn.active')?.dataset.type || 'out-of-scope';
  const impact = document.querySelector('#scope-impact-toggle .sev-btn.active')?.dataset.impact || 'low';
  const status = document.querySelector('#scope-status-toggle .sev-btn.active')?.dataset.scopestatus || 'pending';
  const item = { description: desc, type, impact, status, createdAt: new Date().toISOString() };
  if (!p.scopeChanges) p.scopeChanges = [];
  if (editingScopeId !== null) p.scopeChanges[editingScopeId] = item;
  else p.scopeChanges.push(item);
  p.updatedAt = new Date().toISOString();
  save();
  document.getElementById('modal-scope').classList.remove('open');
  renderScopeChanges(p);
  renderDashboard();
}

// ─── META MODAL ───────────────────────────────────────
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
  document.getElementById('delete-project-name').textContent = getProject(id).title;
  document.getElementById('modal-delete').classList.add('open');
}

function executeDelete() {
  projects = projects.filter(p => p.id !== pendingDeleteId);
  save();
  document.getElementById('modal-delete').classList.remove('open');
  renderDashboard();
}

// ─── IMPORT ───────────────────────────────────────────
let pendingImportData = null;

function openImportModal() {
  pendingImportData = null;
  document.getElementById('file-input').value = '';
  document.getElementById('import-meta-fields').style.display = 'none';
  document.getElementById('import-error').style.display = 'none';
  document.getElementById('btn-import-confirm').disabled = true;
  document.getElementById('import-title').value = '';
  document.getElementById('import-customer').value = '';
  document.getElementById('import-msp').value = '';
  document.getElementById('modal-import').classList.add('open');
}

function handleFileSelect(file) {
  if (!file || file.type !== 'application/json') { showImportError('Please select a valid .json file.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.rows || !Array.isArray(data.rows)) throw new Error('Invalid format');
      pendingImportData = data;
      document.getElementById('import-title').value = data.projectTitle || '';
      document.getElementById('import-customer').value = data.customerName || '';
      const fields = document.getElementById('import-meta-fields');
      fields.style.display = 'flex'; fields.style.flexDirection = 'column'; fields.style.gap = '1rem';
      document.getElementById('btn-import-confirm').disabled = false;
      document.getElementById('import-error').style.display = 'none';
    } catch { showImportError('Could not parse this file. Make sure it is a valid project export.'); }
  };
  reader.readAsText(file);
}

function showImportError(msg) {
  const el = document.getElementById('import-error');
  el.textContent = msg; el.style.display = 'block';
}

function confirmImport() {
  if (!pendingImportData) return;
  const project = {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title: document.getElementById('import-title').value.trim() || pendingImportData.projectTitle || 'Untitled',
    customerName: document.getElementById('import-customer').value.trim(),
    mspName: document.getElementById('import-msp').value.trim(),
    overview: pendingImportData.overview || '',
    exclusions: pendingImportData.exclusions || '',
    tasks: pendingImportData.rows.map(r => ({ task: r.task, role: r.role || '', hours: r.hours || '', notes: r.notes || '', completed: false, completionNote: '' })),
    blockers: [],
    scopeChanges: [],
    internalNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.unshift(project);
  save();
  document.getElementById('modal-import').classList.remove('open');
  pendingImportData = null;
  renderDashboard();
  openProject(project.id);
}

// ─── AI REPORT GENERATION ─────────────────────────────
async function generateReport() {
  const p = getActiveProject();
  if (!p) return;
  p.internalNotes = document.getElementById('project-notes').value;
  save();

  showView('report');
  document.getElementById('generating-state').style.display = 'flex';
  document.getElementById('report-wrap').style.display = 'none';

  // Clear any old retry button
  const gs = document.getElementById('generating-state');
  const oldBtn = gs.querySelector('.btn-primary');
  if (oldBtn) oldBtn.remove();

  const msgEl = document.getElementById('gen-message');
  const msgs = ['Analysing project data…', 'Reviewing task completion…', 'Evaluating risks and blockers…', 'Reviewing scope changes…', 'Composing executive narrative…', 'Finalising report…'];
  let msgIdx = 0;
  msgEl.textContent = msgs[0];
  const msgInterval = setInterval(() => { msgIdx = (msgIdx + 1) % msgs.length; msgEl.textContent = msgs[msgIdx]; }, 1800);

  // Show tabs bar
  document.getElementById('report-tabs-bar').style.display = 'block';
  // Activate client tab
  document.getElementById('tab-client').classList.add('active');
  document.getElementById('tab-internal').classList.remove('active');
  document.getElementById('report-wrap').style.display = '';
  document.getElementById('internal-wrap').style.display = 'none';

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
    const report = parseReportJSON(data.text);
    clearInterval(msgInterval);
    renderReport(p, report);
  } catch (err) {
    clearInterval(msgInterval);
    msgEl.textContent = '⚠ ' + (err.message || 'Something went wrong. Please try again.');
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn-primary'; retryBtn.textContent = 'Retry'; retryBtn.style.marginTop = '1rem';
    retryBtn.addEventListener('click', generateReport);
    gs.appendChild(retryBtn);
  }
}

function buildReportPrompt(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const completedTasks = p.tasks.filter(t => t.completed).map(t => t.task);
  const pendingTasks = p.tasks.filter(t => !t.completed).map(t => t.task);
  const activeBlockers = (p.blockers || []).filter(b => b.status !== 'resolved');
  const scopeItems = p.scopeChanges || [];
  const pendingScope = scopeItems.filter(s => s.status === 'pending');

  return `You are an expert MSP project communication specialist. Generate an executive project status report in JSON format.

PROJECT DATA:
- Project: ${p.title}
- Customer: ${p.customerName || 'Not specified'}
- MSP: ${p.mspName || 'Your MSP'}
- Progress: ${done} of ${total} tasks complete (${pct}%)
- Overview: ${p.overview || 'Network infrastructure project.'}

COMPLETED TASKS (${completedTasks.length}):
${completedTasks.length ? completedTasks.map(t => '✓ ' + t).join('\n') : 'None yet'}

PENDING TASKS (${pendingTasks.length}):
${pendingTasks.length ? pendingTasks.slice(0, 8).map(t => '• ' + t).join('\n') : 'All complete!'}

ACTIVE BLOCKERS (${activeBlockers.length}):
${activeBlockers.length ? activeBlockers.map(b => `[${b.severity.toUpperCase()}] ${b.description} (${b.status})`).join('\n') : 'None'}

SCOPE CHANGES (${scopeItems.length} total, ${pendingScope.length} pending):
${scopeItems.length ? scopeItems.map(s => `[${s.type.toUpperCase()}] [${s.impact} impact] [${s.status}] ${s.description}`).join('\n') : 'None'}

Respond ONLY with a valid JSON object — no preamble, no markdown, no backticks:
{
  "healthStatus": "healthy" | "at-risk" | "critical",
  "currentPhaseNarrative": "2-3 sentence plain-English explanation of where the project is right now. Customer-facing, no jargon.",
  "phases": [
    { "label": "Phase name", "status": "done" | "active" | "upcoming" }
  ],
  "executiveSummary": "3-4 sentence paragraph. Confident, clear, customer-focused. Mention scope changes if any are pending. No bullet points.",
  "decisionsNeeded": ["Specific action or decision needed from the customer (if any)"],
  "timelineConfidence": "high" | "medium" | "low",
  "outlookNarrative": "1-2 sentences on timeline confidence and outlook.",
  "scopeNarrative": "1-2 sentences summarising the scope change situation in plain English for the customer. Only include if there are scope changes, otherwise empty string."
}

Rules:
- phases: derive 3-5 logical phases from the task list. Mark completed-task phases as "done", current as "active", future as "upcoming".
- decisionsNeeded: only include if blockers or pending scope items require a customer decision. Empty array if not.
- healthStatus: healthy if pct>50 and no high blockers and no high-impact pending scope; at-risk if high blockers or high-impact pending scope; critical if severely blocked.
- timelineConfidence: lower if there are pending scope changes with high impact or active high blockers.
- Write for a non-technical business owner. Be specific about what was done. Never use acronyms without explaining them.`;
}

function parseReportJSON(raw) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    return { healthStatus: 'healthy', currentPhaseNarrative: 'The project is progressing. Please check the task list for current status.', phases: [{ label: 'In Progress', status: 'active' }], executiveSummary: raw.slice(0, 500), decisionsNeeded: [], timelineConfidence: 'medium', outlookNarrative: 'The project is on track.', scopeNarrative: '' };
  }
}

function renderReport(p, report) {
  document.getElementById('report-wrap').innerHTML = buildReportHTML(p, report);
  document.getElementById('generating-state').style.display = 'none';
  document.getElementById('report-tabs-bar').style.display = 'block';
  document.getElementById('report-wrap').style.display = 'flex';
  document.getElementById('internal-wrap').style.display = 'none';
  // Pre-render internal report in background
  generateInternalReport();
  document.getElementById('internal-wrap').style.display = 'none';
}

// ─── INTERNAL TEAM SUMMARY ───────────────────────────
function generateInternalReport() {
  const p = getActiveProject();
  if (!p) return;

  const total = p.tasks.length;
  const done = p.tasks.filter(t => t.completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Hours calculations
  const totalEst = p.tasks.reduce((s, t) => s + (parseFloat(t.hours) || 0), 0);
  const completedWithHours = p.tasks.filter(t => t.completed && t.actualHours !== null && t.actualHours !== undefined);
  const totalActual = completedWithHours.reduce((s, t) => s + t.actualHours, 0);
  const totalVariance = completedWithHours.length ? totalActual - completedWithHours.reduce((s,t) => s + (parseFloat(t.hours)||0), 0) : null;

  // Group by role
  const roles = {};
  p.tasks.forEach(t => {
    const role = t.role || 'Unassigned';
    if (!roles[role]) roles[role] = { est: 0, actual: 0, tasks: [], hasActual: false };
    roles[role].est += parseFloat(t.hours) || 0;
    roles[role].tasks.push(t);
    if (t.completed && t.actualHours !== null && t.actualHours !== undefined) {
      roles[role].actual += t.actualHours;
      roles[role].hasActual = true;
    }
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Summary bar
  const varClass = totalVariance === null ? '' : totalVariance > 0 ? 'over' : totalVariance < 0 ? 'under' : 'exact';
  const varDisplay = totalVariance === null ? '—'
    : totalVariance > 0 ? `+${totalVariance.toFixed(1)}h` : `${totalVariance.toFixed(1)}h`;

  // Task table rows
  const taskRows = p.tasks.map(t => {
    const est = parseFloat(t.hours) || 0;
    const act = (t.completed && t.actualHours !== null && t.actualHours !== undefined) ? t.actualHours : null;
    const v = act !== null ? act - est : null;
    const vc = v === null ? 'pending' : v > 0 ? 'over' : v < 0 ? 'under' : 'exact';
    const vLabel = v === null ? (t.completed ? 'Not logged' : 'Pending') : v > 0 ? `+${v.toFixed(1)}h` : v < 0 ? `${v.toFixed(1)}h` : '±0';
    return `<tr>
      <td>${esc(t.task)}</td>
      <td>${esc(t.role || '—')}</td>
      <td class="num">${est > 0 ? est + 'h' : '—'}</td>
      <td class="num">${act !== null ? act + 'h' : '—'}</td>
      <td class="num"><span class="var-pill ${vc}">${vLabel}</span></td>
      <td><span style="font-size:11px;color:${t.completed ? 'var(--green)' : 'var(--text-faint)'}">${t.completed ? '✓ Done' : 'Pending'}</span></td>
    </tr>`;
  }).join('');

  // Role summary cards
  const roleCards = Object.entries(roles).map(([role, data]) => {
    const v = data.hasActual ? data.actual - data.tasks.filter(t=>t.completed && t.actualHours!=null).reduce((s,t)=>s+(parseFloat(t.hours)||0),0) : null;
    const vc = v === null ? '' : v > 0 ? 'over' : v < 0 ? 'under' : 'exact';
    const vLabel = v === null ? '' : v > 0 ? `+${v.toFixed(1)}h over` : v < 0 ? `${Math.abs(v).toFixed(1)}h under` : 'On estimate';
    return `<div class="role-card">
      <div class="role-card-name">${esc(role)}</div>
      <div class="role-card-hours">${data.est}h <span style="font-size:14px;color:var(--text-muted)">est</span></div>
      <div class="role-card-detail">${data.hasActual ? data.actual + 'h actual logged' : 'No actuals logged yet'}</div>
      ${v !== null ? `<div class="role-card-var"><span class="var-pill ${vc}">${vLabel}</span></div>` : ''}
    </div>`;
  }).join('');

  // AI insight — only call if we have enough data
  const hasMeaningfulData = completedWithHours.length >= 3;

  const html = `
    <div class="internal-masthead">
      <div>
        <div class="report-logo" style="color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:0.08em;margin-bottom:0.5rem">◆ MSP Project Progress</div>
        <div class="internal-masthead-title">${esc(p.title)}</div>
        <div class="internal-masthead-sub">${p.customerName ? 'Customer: ' + esc(p.customerName) : ''} ${p.customerName && p.mspName ? '·' : ''} ${p.mspName ? esc(p.mspName) : ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <div class="internal-badge">Internal Use Only</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.3)">${dateStr}</div>
      </div>
    </div>

    <div class="internal-summary-bar">
      <div class="summary-stat">
        <div class="summary-stat-label">Tasks Complete</div>
        <div class="summary-stat-value">${done}/${total}</div>
        <div class="summary-stat-sub">${pct}% of project</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-label">Estimated Hours</div>
        <div class="summary-stat-value">${totalEst}h</div>
        <div class="summary-stat-sub">Total quoted</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-label">Actual Hours</div>
        <div class="summary-stat-value">${totalActual > 0 ? totalActual.toFixed(1) + 'h' : '—'}</div>
        <div class="summary-stat-sub">${completedWithHours.length} tasks logged</div>
      </div>
      <div class="summary-stat">
        <div class="summary-stat-label">Variance</div>
        <div class="summary-stat-value ${varClass}">${varDisplay}</div>
        <div class="summary-stat-sub">${totalVariance === null ? 'Log actuals to track' : totalVariance > 0 ? 'Over estimate' : totalVariance < 0 ? 'Under estimate' : 'On target'}</div>
      </div>
    </div>

    <div class="internal-section">
      <div class="internal-section-title">By Role</div>
      <div class="role-summary-grid">${roleCards}</div>
    </div>

    <div class="internal-section">
      <div class="internal-section-title">Task Hours Detail</div>
      <table class="hours-table">
        <thead>
          <tr>
            <th>Task</th><th>Role</th>
            <th class="num">Estimated</th><th class="num">Actual</th>
            <th class="num">Variance</th><th>Status</th>
          </tr>
        </thead>
        <tbody>${taskRows}</tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2"><strong>Project Total</strong></td>
            <td class="num"><strong>${totalEst}h</strong></td>
            <td class="num"><strong>${totalActual > 0 ? totalActual.toFixed(1) + 'h' : '—'}</strong></td>
            <td class="num"><strong>${varDisplay !== '—' ? `<span class="var-pill ${varClass}">${varDisplay}</span>` : '—'}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="internal-section" id="internal-ai-section">
      ${hasMeaningfulData
        ? '<div class="internal-section-title">AI Insight</div><div class="ai-insight" id="internal-ai-text"><div class="gen-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Generating insight…</div>'
        : '<div class="internal-section-title">AI Insight</div><div class="ai-insight" style="color:var(--text-muted)">Complete and log hours for at least 3 tasks to generate an AI insight on project performance.</div>'
      }
    </div>

    <div class="internal-footer">
      <span>Internal Team Summary — not for distribution</span>
      <span>${dateStr}</span>
    </div>`;

  document.getElementById('internal-report').innerHTML = html;

  // Fetch AI insight if we have enough data
  if (hasMeaningfulData) fetchInternalInsight(p, totalEst, totalActual, totalVariance, roles);
}

async function fetchInternalInsight(p, totalEst, totalActual, totalVariance, roles) {
  const overTasks = p.tasks.filter(t => t.completed && t.actualHours !== null && t.actualHours !== undefined && t.actualHours > (parseFloat(t.hours)||0));
  const underTasks = p.tasks.filter(t => t.completed && t.actualHours !== null && t.actualHours !== undefined && t.actualHours < (parseFloat(t.hours)||0));
  const roleLines = Object.entries(roles).map(([r, d]) => `${r}: est ${d.est}h, actual ${d.hasActual ? d.actual + 'h' : 'not logged'}`).join('; ');

  const prompt = `You are an MSP project manager reviewing internal project hours data. Write 2-3 sentences maximum as a plain-English insight for the team — no bullet points, no headers. Focus on the most notable variance pattern, which role or task type is running over or under, and one specific actionable recommendation for future quoting. Be direct and specific, not generic.

Project: ${p.title}
Total estimated: ${totalEst}h | Total actual: ${totalActual.toFixed(1)}h | Variance: ${totalVariance !== null ? (totalVariance > 0 ? '+' : '') + totalVariance.toFixed(1) + 'h' : 'unknown'}
By role: ${roleLines}
Most over-budget tasks: ${overTasks.slice(0,3).map(t => t.task + ' (est ' + t.hours + 'h, act ' + t.actualHours + 'h)').join(', ') || 'none'}
Most under-budget tasks: ${underTasks.slice(0,3).map(t => t.task + ' (est ' + t.hours + 'h, act ' + t.actualHours + 'h)').join(', ') || 'none'}

Write only the insight paragraph, nothing else.`;

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    const el = document.getElementById('internal-ai-text');
    if (el) el.textContent = data.text || 'No insight available.';
  } catch {
    const el = document.getElementById('internal-ai-text');
    if (el) el.textContent = 'Could not generate insight — check your connection.';
  }
}

// ─── UTILITIES ────────────────────────────────────────
function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ─── TOGGLE BUTTON GROUPS ─────────────────────────────
function wireToggleGroup(selector, attr) {
  document.querySelectorAll(selector + ' .sev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(selector + ' .sev-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── EVENT WIRING ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  load();
  renderDashboard();
  showView('dashboard');

  // Dashboard
  document.getElementById('btn-import-new').addEventListener('click', openImportModal);
  document.getElementById('btn-import-empty')?.addEventListener('click', openImportModal);
  document.getElementById('btn-sample-report').addEventListener('click', showSampleReport);
  document.getElementById('btn-close-sample').addEventListener('click', hideSampleReport);

  // Import modal
  document.getElementById('modal-import-close').addEventListener('click', () => closeModal('modal-import'));
  document.getElementById('btn-import-cancel').addEventListener('click', () => closeModal('modal-import'));
  document.getElementById('btn-import-confirm').addEventListener('click', confirmImport);
  document.getElementById('file-input').addEventListener('change', e => handleFileSelect(e.target.files[0]));
  const dz = document.getElementById('file-drop-zone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); handleFileSelect(e.dataTransfer.files[0]); });

  // Tracker
  document.getElementById('btn-back-dashboard').addEventListener('click', () => { renderDashboard(); showView('dashboard'); });
  document.getElementById('btn-generate-report').addEventListener('click', generateReport);
  document.getElementById('btn-edit-meta').addEventListener('click', openMetaModal);
  document.getElementById('btn-add-blocker').addEventListener('click', () => openBlockerModal());
  document.getElementById('btn-add-scope').addEventListener('click', () => openScopeModal());
  document.getElementById('btn-add-task').addEventListener('click', () => openTaskModal());
  document.getElementById('project-notes').addEventListener('blur', () => {
    const p = getActiveProject(); if (!p) return;
    p.internalNotes = document.getElementById('project-notes').value; save();
  });

  // Task modal
  document.getElementById('modal-task-close').addEventListener('click', () => closeModal('modal-task'));
  document.getElementById('btn-task-cancel').addEventListener('click', () => closeModal('modal-task'));
  document.getElementById('btn-task-save').addEventListener('click', saveTask);
  document.getElementById('modal-delete-task-close').addEventListener('click', () => closeModal('modal-delete-task'));
  document.getElementById('btn-delete-task-cancel').addEventListener('click', () => closeModal('modal-delete-task'));
  document.getElementById('btn-delete-task-confirm').addEventListener('click', executeDeleteTask);

  // Blocker modal
  document.getElementById('modal-blocker-close').addEventListener('click', () => closeModal('modal-blocker'));
  document.getElementById('btn-blocker-cancel').addEventListener('click', () => closeModal('modal-blocker'));
  document.getElementById('btn-blocker-save').addEventListener('click', saveBlocker);
  wireToggleGroup('#severity-toggle', 'sev');
  wireToggleGroup('#status-toggle', 'status');

  // Scope modal
  document.getElementById('modal-scope-close').addEventListener('click', () => closeModal('modal-scope'));
  document.getElementById('btn-scope-cancel').addEventListener('click', () => closeModal('modal-scope'));
  document.getElementById('btn-scope-save').addEventListener('click', saveScope);
  wireToggleGroup('#scope-type-toggle', 'type');
  wireToggleGroup('#scope-impact-toggle', 'impact');
  wireToggleGroup('#scope-status-toggle', 'scopestatus');

  // Meta modal
  document.getElementById('modal-meta-close').addEventListener('click', () => closeModal('modal-meta'));
  document.getElementById('btn-meta-cancel').addEventListener('click', () => closeModal('modal-meta'));
  document.getElementById('btn-meta-save').addEventListener('click', saveMetaModal);

  // Delete modal
  document.getElementById('modal-delete-close').addEventListener('click', () => closeModal('modal-delete'));
  document.getElementById('btn-delete-cancel').addEventListener('click', () => closeModal('modal-delete'));
  document.getElementById('btn-delete-confirm').addEventListener('click', executeDelete);

  // Report
  document.getElementById('btn-back-tracker').addEventListener('click', () => showView('tracker'));

  // Report tabs
  document.getElementById('tab-client').addEventListener('click', () => {
    document.getElementById('tab-client').classList.add('active');
    document.getElementById('tab-internal').classList.remove('active');
    document.getElementById('report-wrap').style.display = 'flex';
    document.getElementById('internal-wrap').style.display = 'none';
  });
  document.getElementById('tab-internal').addEventListener('click', () => {
    document.getElementById('tab-internal').classList.add('active');
    document.getElementById('tab-client').classList.remove('active');
    document.getElementById('report-wrap').style.display = 'none';
    document.getElementById('internal-wrap').style.display = 'flex';
  });
  document.getElementById('btn-regenerate').addEventListener('click', generateReport);
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
});
