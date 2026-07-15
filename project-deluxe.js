/* =========================================================
   Project Scope Builder Deluxe — project-deluxe.js
   ========================================================= */

// ── Constants ─────────────────────────────────────────────
const LS_KEY          = 'pd_project_deluxe_v1';
const LS_PROJECTS     = 'pd_projects_v1';
const LS_TEMPLATES    = 'pd_scope_templates_v1';
const LS_BRAND_COLOR  = 'sb_brand_color_v1';   // shared with scope builder
const LS_API_KEY      = 'sb_api_key';
const LS_TENANT_URL   = 'sb_tenant_url';
const API_TEMPLATES   = '/api/scope-templates';
const API_AI          = '/api/deluxe-ai';
const IDB_NAME        = 'ProjectDeluxeDB';
const IDB_STORE       = 'attachments';
const PROJ_COLORS     = ['#3b82f6','#f97316','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#6366f1'];

let brandColor = localStorage.getItem(LS_BRAND_COLOR) || '#2563eb';
let rows = [];
let currentProjectId = null;

// ── Utility ───────────────────────────────────────────────
function esc(s) { return (s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function roundDisp(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function fmtBytes(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

function durationStr(hours, hpd) {
  const h = num(hours); const d = Math.max(1, num(hpd));
  if (h <= 0) return '';
  const raw = h / d; const r = Math.ceil(raw * 2) / 2;
  if (r % 1 === 0) return `${r} day${r === 1 ? '' : 's'}`;
  return `${Math.floor(r)}–${Math.floor(r)+1} days`;
}
function totalDurationStr(h, hpd) {
  if (num(h) <= 0) return '—';
  return durationStr(h, hpd);
}

// ── IndexedDB ─────────────────────────────────────────────
let idb = null;
function openIDB() {
  return new Promise((resolve, reject) => {
    if (idb) { resolve(idb); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => { e.target.result.createObjectStore(IDB_STORE, { keyPath: 'idbKey' }); };
    req.onsuccess = e => { idb = e.target.result; resolve(idb); };
    req.onerror   = () => reject(req.error);
  });
}
async function idbPut(record) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(record).onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
async function idbDelete(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key).onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Brand color ───────────────────────────────────────────
function saveBrandColor(color) {
  brandColor = color;
  localStorage.setItem(LS_BRAND_COLOR, color);
  updateColorBadges();
}
function updateColorBadges() {
  ['colorBadge','colorDot','notesColorDot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.background = brandColor;
  });
  const hex1 = document.getElementById('colorHexLabel');
  const hex2 = document.getElementById('notesColorHexLabel');
  if (hex1) hex1.textContent = brandColor;
  if (hex2) hex2.textContent = brandColor;
}
function initBrandColor() {
  const stored = localStorage.getItem(LS_BRAND_COLOR);
  if (stored) brandColor = stored;
  const swatches = document.querySelectorAll('.brand-swatch:not(.brand-swatch-custom)');
  let matched = false;
  swatches.forEach(sw => {
    const isActive = sw.dataset.color === brandColor;
    sw.classList.toggle('active', isActive);
    if (isActive) matched = true;
  });
  const custom = document.getElementById('brandCustomSwatch');
  if (!matched) {
    custom.classList.add('active');
    custom.style.background = brandColor;
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').value = brandColor;
  } else { custom.classList.remove('active'); }
  updateColorBadges();
}
function setupBrandColorListeners() {
  document.querySelectorAll('.brand-swatch:not(.brand-swatch-custom)').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.brand-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      saveBrandColor(sw.dataset.color);
      document.getElementById('brandHexRow').style.display = 'none';
      document.getElementById('brandCustomSwatch').style.background = 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)';
      autoRefresh();
    });
  });
  document.getElementById('brandCustomSwatch').addEventListener('click', () => {
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').focus();
  });
  document.getElementById('brandHexApply').addEventListener('click', applyCustomHex);
  document.getElementById('brandHexInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyCustomHex(); });
}
function applyCustomHex() {
  let val = document.getElementById('brandHexInput').value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) { showToast('Enter a valid 6-digit hex'); return; }
  document.querySelectorAll('.brand-swatch').forEach(s => s.classList.remove('active'));
  const custom = document.getElementById('brandCustomSwatch');
  custom.classList.add('active'); custom.style.background = val;
  saveBrandColor(val); autoRefresh(); showToast('Brand color updated');
}

// ── Passphrase / team ─────────────────────────────────────
function getPassphrase() { return (document.getElementById('tmplPassphrase')?.value || '').trim(); }
function isTeamMode()    { return getPassphrase().length > 0; }
function hashPassphrase(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}
function updatePassphraseUI() {
  const badge = document.getElementById('tmplPassphraseBadge');
  const label = document.getElementById('tmplModeLabel');
  if (!badge) return;
  if (isTeamMode()) {
    badge.textContent = '🔗 Team'; badge.className = 'lp-badge lp-badge-team';
    if (label) label.textContent = '(team — shared)';
  } else {
    badge.textContent = '💾 Local'; badge.className = 'lp-badge lp-badge-local';
    if (label) label.textContent = '(local)';
  }
}

// ── Template storage ──────────────────────────────────────
function localGetAll()       { try { return JSON.parse(localStorage.getItem(LS_TEMPLATES)) || []; } catch { return []; } }
function localSaveAll(tmpl)  { localStorage.setItem(LS_TEMPLATES, JSON.stringify(tmpl)); }
async function apiCall(payload) {
  const res = await fetch(API_TEMPLATES, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
async function teamGetIndex(hash)                  { return apiCall({ method:'getIndex', hash }); }
async function teamGetTemplate(hash, name)         { return apiCall({ method:'getTemplate', hash, name }); }
async function teamSaveTemplate(hash, name, entry) { return apiCall({ method:'saveTemplate', hash, name, entry }); }
async function teamDeleteTemplate(hash, name)      { return apiCall({ method:'deleteTemplate', hash, name }); }

async function renderTemplateSelect(preserveSelection = true) {
  const sel  = document.getElementById('templateSelect');
  const saved = preserveSelection ? sel.value : '';
  if (isTeamMode()) {
    sel.innerHTML = '<option value="">⏳ Loading…</option>';
    const hash  = hashPassphrase(getPassphrase());
    const names = await teamGetIndex(hash);
    sel.innerHTML = `<option value="">— ${names.length ? 'Team templates' : 'No team templates'} —</option>` +
      names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (saved && names.includes(saved)) sel.value = saved;
  } else {
    const all = localGetAll();
    sel.innerHTML = `<option value="">— ${all.length ? 'Local templates' : 'No local templates'} —</option>` +
      all.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
    if (saved && all.find(t => t.name === saved)) sel.value = saved;
  }
}

// ── State ─────────────────────────────────────────────────
function defaultRow() { return { task:'', role:'', hours:'', notes:'' }; }

function captureCurrentState() {
  return {
    projectTitle:          document.getElementById('projectTitle').value,
    customerName:          document.getElementById('customerName').value,
    hoursPerDay:           document.getElementById('hoursPerDay').value,
    overview:              document.getElementById('overview').value,
    exclusions:            document.getElementById('exclusions').value,
    showRole:              document.getElementById('showRole').checked,
    showHours:             document.getElementById('showHours').checked,
    showTotalHours:        document.getElementById('showTotalHours').checked,
    showNotes:             document.getElementById('showNotes').checked,
    projectNotes:          projectNotesEditor ? projectNotesEditor.root.innerHTML : '',
    internalNotes:         internalNotesEditor ? internalNotesEditor.root.innerHTML : '',
    internalLinks:         [...internalLinks],
    internalSectionOrder:  getSectionOrder(),
    internalFiles:         internalFiles.map(f => ({ id:f.id, name:f.name, type:f.type, size:f.size, addedAt:f.addedAt, idbKey:f.idbKey, caption:f.caption||'' })),
    rows:                  rows.map(r => ({ ...r }))
  };
}

function applyState(s) {
  document.getElementById('projectTitle').value   = s.projectTitle   ?? '';
  document.getElementById('customerName').value   = s.customerName   ?? '';
  document.getElementById('hoursPerDay').value    = s.hoursPerDay    ?? 8;
  document.getElementById('overview').value       = s.overview       ?? '';
  document.getElementById('exclusions').value     = s.exclusions     ?? '';
  document.getElementById('showRole').checked     = s.showRole       !== false;
  document.getElementById('showHours').checked    = s.showHours      === true;
  document.getElementById('showTotalHours').checked = s.showTotalHours !== false;
  document.getElementById('showNotes').checked    = s.showNotes      !== false;
  rows = (s.rows || []).map(r => ({ task:'', role:'', hours:'', notes:'', ...r }));

  // Project notes
  if (projectNotesEditor && s.projectNotes !== undefined) {
    projectNotesEditor.root.innerHTML = s.projectNotes || '';
  }
  // Internal notes text
  if (internalNotesEditor && s.internalNotes !== undefined) {
    internalNotesEditor.root.innerHTML = s.internalNotes || '';
  }
  // Links
  internalLinks = Array.isArray(s.internalLinks) ? [...s.internalLinks] : [];
  renderLinks();
  // Files metadata
  internalFiles = Array.isArray(s.internalFiles) ? [...s.internalFiles] : [];
  renderFiles();
  // Images metadata
  renderImages();
  // Section order
  if (Array.isArray(s.internalSectionOrder)) applySectionOrder(s.internalSectionOrder);

  render(); updateSummary(); saveState(); updateCenterHeader();
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(captureCurrentState()));
  autoSaveCurrentProject();
  updateCenterHeader();
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.rows)) return false;
    applyState(s);
    return true;
  } catch { return false; }
}

// ── Projects ──────────────────────────────────────────────
function getProjects()         { try { return JSON.parse(localStorage.getItem(LS_PROJECTS)) || []; } catch { return []; } }
function saveProjects(projects){ localStorage.setItem(LS_PROJECTS, JSON.stringify(projects)); }

function autoSaveCurrentProject() {
  if (!currentProjectId) return;
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === currentProjectId);
  if (idx < 0) return;
  projects[idx] = { ...projects[idx], ...captureCurrentState(), updatedAt: new Date().toISOString() };
  saveProjects(projects);
}

function renderProjects() {
  const list = document.getElementById('projectList');
  const projects = getProjects();
  list.innerHTML = '';
  if (!projects.length) {
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 2px;">No projects yet</div>';
    return;
  }
  const shown = projects.slice(0, 3);
  shown.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'lp-proj-item' + (p.id === currentProjectId ? ' active' : '');
    const color = PROJ_COLORS[i % PROJ_COLORS.length];
    const totalHrs = (p.rows||[]).reduce((s,r) => s + num(r.hours), 0);
    const ago = p.updatedAt ? relativeTime(p.updatedAt) : 'new';
    item.innerHTML = `
      <div class="lp-proj-dot" style="background:${color}"></div>
      <div class="lp-proj-info">
        <div class="lp-proj-name">${esc(p.projectTitle||'Untitled')}</div>
        <div class="lp-proj-meta">${esc(p.customerName||'')}${p.customerName?' · ':''}${totalHrs}h · ${ago}</div>
      </div>
      <span class="lp-proj-badge lp-proj-badge-local">local</span>
      <button class="lp-proj-delete" data-id="${esc(p.id)}" title="Delete"><i class="ti ti-x"></i></button>`;
    item.addEventListener('click', e => { if (e.target.closest('.lp-proj-delete')) return; switchToProject(p.id); });
    item.querySelector('.lp-proj-delete').addEventListener('click', e => { e.stopPropagation(); deleteProject(p.id); });
    list.appendChild(item);
  });
  if (projects.length > 3) {
    list.insertAdjacentHTML('beforeend', `<div style="font-family:var(--mono);font-size:10px;color:var(--text-3);padding:4px 8px;">+${projects.length - 3} more</div>`);
  }
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

function switchToProject(id) {
  autoSaveCurrentProject();
  const p = getProjects().find(proj => proj.id === id);
  if (!p) return;
  currentProjectId = id;
  applyState(p); renderProjects(); updateCenterHeader();
}

function deleteProject(id) {
  const projects = getProjects();
  const p = projects.find(proj => proj.id === id);
  if (!confirm(`Delete project "${p?.projectTitle||'this project'}"?`)) return;
  const updated = projects.filter(proj => proj.id !== id);
  saveProjects(updated);
  if (currentProjectId === id) {
    currentProjectId = null;
    localStorage.removeItem(LS_KEY);
    if (updated.length > 0) { switchToProject(updated[0].id); return; }
    newProject(true);
  }
  renderProjects(); showToast('Project deleted');
}

function saveCurrentAsProject(title) {
  const projects = getProjects();
  const state = captureCurrentState();
  if (currentProjectId) {
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) { projects[idx] = { ...projects[idx], ...state, updatedAt: new Date().toISOString() }; saveProjects(projects); renderProjects(); return; }
  }
  const newP = { id: genId(), ...state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  projects.push(newP); currentProjectId = newP.id;
  saveProjects(projects); renderProjects();
}

function newProject(skipConfirm = false) {
  if (!skipConfirm && rows.some(r => r.task || num(r.hours) > 0)) {
    if (!confirm('Start a new project? Unsaved changes will be lost.')) return;
  }
  autoSaveCurrentProject();
  currentProjectId = null;
  rows = [defaultRow()];
  ['projectTitle','customerName','overview','exclusions'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('hoursPerDay').value = '8';
  if (projectNotesEditor) projectNotesEditor.root.innerHTML = '';
  if (internalNotesEditor) internalNotesEditor.root.innerHTML = '';
  internalLinks = []; renderLinks();
  internalFiles = []; renderFiles(); renderImages();
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('notesOutputPanels').hidden = true;
  document.getElementById('copyBtn').disabled = true;
  document.getElementById('copyNotesBtn').disabled = true;
  document.getElementById('sbPushBtn').disabled = true;
  document.getElementById('sbNotesPushBtn').disabled = true;
  document.querySelectorAll('.preset-tile').forEach(t => t.classList.remove('active'));
  render(); updateSummary(); renderProjects(); updateCenterHeader();
  saveState(); showToast('New project started');
}

function updateCenterHeader() {
  const title    = document.getElementById('projectTitle').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  document.getElementById('centerTitle').textContent = title || 'Project Scope Deluxe';
  document.getElementById('centerSub').textContent   = title ? (customer || 'Local project') : 'Load a preset or describe your project to the AI';
}

// ── Task grid ─────────────────────────────────────────────
function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  const hpd = document.getElementById('hoursPerDay').value;
  rows.forEach((r, idx) => {
    const tr = document.createElement('tr'); tr.dataset.idx = idx;
    const tdDrag = document.createElement('td'); tdDrag.className = 'col-drag';
    tdDrag.innerHTML = '<div class="drag-handle" title="Drag to reorder">⠿</div>';
    const tdTask = document.createElement('td'); tdTask.className = 'col-task';
    const inTask = document.createElement('input'); inTask.type = 'text'; inTask.value = r.task||''; inTask.placeholder = 'Task description';
    inTask.addEventListener('input', e => { rows[idx].task = e.target.value; saveState(); autoRefresh(); });
    tdTask.appendChild(inTask);
    const tdRole = document.createElement('td'); tdRole.className = 'col-role';
    const inRole = document.createElement('input'); inRole.type = 'text'; inRole.value = r.role||''; inRole.placeholder = 'Role';
    inRole.addEventListener('input', e => { rows[idx].role = e.target.value; saveState(); autoRefresh(); });
    tdRole.appendChild(inRole);
    const tdHours = document.createElement('td'); tdHours.className = 'col-hours';
    const inHours = document.createElement('input'); inHours.type = 'number'; inHours.min = '0'; inHours.step = '0.5'; inHours.value = r.hours||''; inHours.placeholder = '0';
    inHours.addEventListener('input', e => { rows[idx].hours = e.target.value; updateSummary(); saveState(); autoRefresh(); });
    tdHours.appendChild(inHours);
    const tdDur = document.createElement('td'); tdDur.className = 'col-dur'; tdDur.textContent = durationStr(r.hours, hpd);
    const tdNotes = document.createElement('td'); tdNotes.className = 'col-notes';
    const txNotes = document.createElement('textarea'); txNotes.value = r.notes||''; txNotes.placeholder = 'Notes…';
    txNotes.addEventListener('input', e => { rows[idx].notes = e.target.value; saveState(); autoRefresh(); });
    tdNotes.appendChild(txNotes);
    const tdDel = document.createElement('td'); tdDel.className = 'col-del';
    const delBtn = document.createElement('button'); delBtn.className = 'del-row-btn'; delBtn.innerHTML = '<i class="ti ti-trash"></i>';
    delBtn.addEventListener('click', () => { rows.splice(idx,1); render(); updateSummary(); saveState(); autoRefresh(); });
    tdDel.appendChild(delBtn);
    tr.append(tdDrag, tdTask, tdRole, tdHours, tdDur, tdNotes, tdDel);
    tbody.appendChild(tr);
  });
  updateSummary(); initSortable();
}

function initSortable() {
  if (typeof Sortable === 'undefined') return;
  Sortable.create(document.getElementById('tbody'), {
    handle: '.drag-handle', animation: 150, ghostClass: 'row-ghost', dragClass: 'row-drag',
    onEnd: () => {
      const newRows = [];
      Array.from(document.getElementById('tbody').querySelectorAll('tr')).forEach(tr => {
        const idx = parseInt(tr.dataset.idx);
        if (!isNaN(idx)) newRows.push(rows[idx]);
      });
      rows = newRows; render(); saveState(); autoRefresh();
    }
  });
}

function updateSummary() {
  const hpd = document.getElementById('hoursPerDay').value;
  document.querySelectorAll('#tbody tr').forEach((tr, idx) => {
    const dur = tr.querySelector('.col-dur');
    if (dur) dur.textContent = durationStr(rows[idx]?.hours, hpd);
  });
  let total = 0, included = 0;
  rows.forEach(r => { const h = num(r.hours); if (h > 0) { total += h; included++; } });
  document.getElementById('totalHours').textContent    = roundDisp(total);
  document.getElementById('totalDuration').textContent = totalDurationStr(total, hpd);
  document.getElementById('includedCount').textContent = included;
}

// ── Widget generation — Scope ─────────────────────────────
function generateScopeWidget() {
  const title      = (document.getElementById('projectTitle').value||'').trim();
  const customer   = (document.getElementById('customerName').value||'').trim();
  const overview   = (document.getElementById('overview').value||'').trim();
  const exclusions = (document.getElementById('exclusions').value||'').trim();
  const hpd        = document.getElementById('hoursPerDay').value;
  const showRole       = document.getElementById('showRole').checked;
  const showHours      = document.getElementById('showHours').checked;
  const showTotalHours = document.getElementById('showTotalHours').checked;
  const showNotes      = document.getElementById('showNotes').checked;

  function hexToRgb(hex) { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; }
  const brandRgb = hexToRgb(brandColor);
  const rowTint  = `rgba(${brandRgb},0.06)`;
  const totalTint= `rgba(${brandRgb},0.10)`;

  const included = rows.map(r => ({ task:(r.task||'').trim(), role:(r.role||'').trim(), notes:(r.notes||'').trim(), hours:num(r.hours) })).filter(r => r.hours>0 && (r.task||r.role||r.notes));
  const total    = included.reduce((s,r) => s+r.hours, 0);
  const duration = totalDurationStr(total, hpd);
  const colCount = 1+(showRole?1:0)+(showHours?1:0)+(showNotes?1:0);
  const thStyle  = `text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#fff;font-size:13px;font-weight:600;`;

  const thCols = [`<th style="${thStyle}">Task</th>`];
  if (showRole)  thCols.push(`<th style="${thStyle}white-space:nowrap;">Role</th>`);
  if (showHours) thCols.push(`<th style="${thStyle}text-align:right;white-space:nowrap;">Hours</th>`);
  if (showNotes) thCols.push(`<th style="${thStyle}">Notes</th>`);

  const tbRows = included.map((r,i) => {
    const bg = i%2===1 ? `background:${rowTint};` : '';
    const cells = [`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}"><strong>${esc(r.task)}</strong></td>`];
    if (showRole)  cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;${bg}">${esc(r.role)}</td>`);
    if (showHours) cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;text-align:right;white-space:nowrap;${bg}">${esc(roundDisp(r.hours))}</td>`);
    if (showNotes) cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}">${esc(r.notes)}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  }).join('\n      ');

  const totalParts = [];
  if (showTotalHours) totalParts.push(`<strong style="color:${brandColor};">Total Effort:</strong> <strong>${esc(roundDisp(total))} hours</strong>`);
  if (showTotalHours && duration !== '—') totalParts.push(`<strong style="color:${brandColor};">Est. Duration:</strong> <strong>${esc(duration)}</strong>`);
  const totalsRow = totalParts.length ? `<tr><td colspan="${colCount}" style="padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;background:${totalTint};">${totalParts.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</td></tr>` : '';

  const exLines = exclusions.split('\n').map(l=>l.trim()).filter(Boolean);
  const exclusionsHtml = exLines.length ? `\n<h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">What's Not Included</h3>\n<ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:1.8;">\n  ${exLines.map(l=>`<li>${esc(l)}</li>`).join('\n  ')}\n</ul>` : '';

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:100%;color:#0f172a;">
${title ? `  <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${brandColor};">${esc(title)}</h2>` : ''}
${customer ? `  <p style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">${esc(customer)}</p>` : '<br>'}
${overview ? `  <h3 style="margin:0 0 6px;font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">Project Overview</h3>\n  <p style="margin:0 0 20px;font-size:13px;color:#334155;line-height:1.7;border-left:3px solid ${brandColor};padding-left:12px;">${esc(overview)}</p>` : ''}
  <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">Scope of Work</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>${thCols.join('')}</tr></thead>
    <tbody>
      ${tbRows || `<tr><td colspan="${colCount}" style="padding:10px;border:1px solid #e2e8f0;color:#94a3b8;">No tasks with hours &gt; 0.</td></tr>`}
      ${totalsRow}
    </tbody>
  </table>${exclusionsHtml}
</div>`.trim();
}

function autoRefresh() {
  const panels = document.getElementById('outputPanels');
  if (!panels || panels.hidden) return;
  const html = generateScopeWidget();
  document.getElementById('htmlOut').textContent = html;
}

// ── Widget generation — Notes ─────────────────────────────
function generateNotesWidgetHtml() {
  const title    = (document.getElementById('projectTitle').value||'').trim();
  const customer = (document.getElementById('customerName').value||'').trim();
  const notesHtml = projectNotesEditor ? projectNotesEditor.root.innerHTML : '';

  if (!notesHtml || notesHtml === '<p><br></p>') return '';

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:100%;color:#0f172a;">
${title ? `  <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${brandColor};">${esc(title)}</h2>` : ''}
${customer ? `  <p style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">${esc(customer)}</p>` : ''}
  <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">Additional Project Notes</h3>
  <div style="font-size:13px;color:#334155;line-height:1.75;border-left:3px solid ${brandColor};padding-left:16px;">
    ${notesHtml}
  </div>
</div>`.trim();
}

// ── Presets ───────────────────────────────────────────────
const PRESETS = {
  azure: { title:'Azure Cloud Migration', overview:'This project covers the full migration of your on-premises server infrastructure to Microsoft Azure, delivering improved reliability, scalability, and remote access — with minimal disruption to your team and day-to-day operations.', exclusions:'Application code changes or custom development\nThird-party vendor coordination beyond 2 hours per vendor\nEnd-user training (available as a separate engagement)\nHardware procurement and shipping costs\nMicrosoft licensing costs', tasks:[{task:'Project Kickoff & Planning',role:'Project Manager',hours:'8',notes:'Scope confirmation, schedule, communication plan'},{task:'Current Environment Assessment',role:'Senior Engineer',hours:'12',notes:'Inventory servers, workloads, dependencies, network'},{task:'Azure Network Design & VPN Architecture',role:'Senior Engineer',hours:'8',notes:'Address space, subnets, gateway sizing'},{task:'Create & Configure Azure Virtual Network & VPN Gateway',role:'Senior Engineer',hours:'8',notes:'Includes site-to-site VPN to office(s)'},{task:'Create & Configure Azure Server VMs',role:'Engineer',hours:'48',notes:'VM provisioning, OS config, patching'},{task:'Security & Baseline Configuration',role:'Senior Engineer',hours:'24',notes:'NSGs, firewall rules, access controls'},{task:'Data Migration Planning & Validation',role:'Engineer',hours:'24',notes:'Migration approach and test validation'},{task:'Migrate Data from On-Prem to Azure',role:'Engineer',hours:'48',notes:'File/data migration, integrity checks'},{task:'Configure Workstations & Printers for New Network',role:'Technician',hours:'24',notes:'DNS, drive mappings, printer updates'},{task:'User Acceptance & Environment Validation',role:'Senior Engineer',hours:'12',notes:'Confirmation Azure environment is fully working'},{task:'Decommission On-Prem VMs',role:'Engineer',hours:'12',notes:'Graceful shutdown, data verification'},{task:'Update Network & Process Documentation',role:'Engineer',hours:'8',notes:'Diagrams, runbooks, credentials handling'},{task:'Project Management (ongoing)',role:'Project Manager',hours:'48',notes:'Status updates, stakeholder coordination, reporting'}] },
  m365: { title:'Microsoft 365 Migration', overview:'This project covers the full migration from your current on-premises email and file infrastructure to Microsoft 365, including Exchange Online, SharePoint, Teams, and OneDrive.', exclusions:'Third-party application integrations not listed in scope\nCustom development or workflow automation\nEnd-user device setup beyond standard mail profile configuration\nMicrosoft 365 licensing costs', tasks:[{task:'Project Kickoff & Tenant Assessment',role:'Project Manager',hours:'8',notes:'Current environment review, license planning'},{task:'DNS & Domain Configuration',role:'Senior Engineer',hours:'4',notes:'MX, SPF, DKIM, DMARC records'},{task:'Exchange Online Setup & Mail Flow',role:'Senior Engineer',hours:'8',notes:'Connectors, hybrid config, mail routing'},{task:'Mailbox Migration — Batch 1',role:'Engineer',hours:'16',notes:'Priority users, pilot group'},{task:'Mailbox Migration — Remaining Users',role:'Engineer',hours:'24',notes:'Full organization migration, integrity checks'},{task:'SharePoint Online Setup & Structure',role:'Senior Engineer',hours:'12',notes:'Sites, libraries, permissions'},{task:'File Data Migration to SharePoint / OneDrive',role:'Engineer',hours:'16',notes:'On-prem file shares to cloud storage'},{task:'Microsoft Teams Setup & Policies',role:'Engineer',hours:'8',notes:'Teams, channels, meeting policies'},{task:'Security & Compliance Configuration',role:'Senior Engineer',hours:'12',notes:'MFA, Conditional Access, DLP policies'},{task:'Cutover Planning & Execution',role:'Senior Engineer',hours:'8',notes:'MX record cutover, final sync'},{task:'User Onboarding & Orientation',role:'Technician',hours:'12',notes:'Profile setup, Outlook config, basic guidance'},{task:'Post-Migration Validation & Support',role:'Engineer',hours:'16',notes:'30-day hypercare, issue resolution'},{task:'Project Management',role:'Project Manager',hours:'24',notes:'Scheduling, status reporting, stakeholder comms'}] },
  network: { title:'Network Infrastructure Upgrade', overview:'This project delivers a full replacement and modernisation of your existing network infrastructure, including next-generation firewall, managed switching, and wireless access points.', exclusions:'Structured cabling beyond agreed scope\nISP or WAN circuit changes\nThird-party equipment not supplied through this engagement', tasks:[{task:'Site Survey & Current Environment Assessment',role:'Senior Engineer',hours:'8',notes:'Cabling audit, device inventory, coverage mapping'},{task:'Network Design & Architecture',role:'Senior Engineer',hours:'8',notes:'IP addressing, VLANs, segmentation design'},{task:'Procurement & Equipment Staging',role:'Engineer',hours:'4',notes:'Order management, pre-configuration'},{task:'Firewall Installation & Configuration',role:'Senior Engineer',hours:'12',notes:'Rules, NAT, VPN, remote access policies'},{task:'Core Switch Deployment',role:'Engineer',hours:'8',notes:'Uplink config, VLAN tagging, redundancy'},{task:'Access Switch Deployment',role:'Engineer',hours:'12',notes:'Port config, PoE, patch panel connections'},{task:'Wireless Access Point Deployment',role:'Engineer',hours:'8',notes:'Controller config, SSID setup, coverage validation'},{task:'VLAN & Network Segmentation',role:'Senior Engineer',hours:'8',notes:'Traffic isolation, guest network, IoT separation'},{task:'Network Testing & Validation',role:'Senior Engineer',hours:'8',notes:'Throughput, failover, segmentation testing'},{task:'Network Documentation & Diagrams',role:'Engineer',hours:'6',notes:'Topology diagrams, VLAN tables, port mapping'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, vendor coordination, comms'}] },
  endpoint: { title:'Endpoint Refresh & Device Deployment', overview:'This project replaces aging workstations and laptops across your organization, ensuring all staff are on modern, supported hardware with minimal disruption.', exclusions:'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nPersonal files or non-business data', tasks:[{task:'Asset Audit & Device Inventory',role:'Technician',hours:'4',notes:'Catalogue all existing devices, specs, age and OS version'},{task:'New Device Specification & Procurement',role:'Project Manager',hours:'4',notes:'Hardware selection, ordering, delivery tracking'},{task:'Image & Build Preparation',role:'Senior Engineer',hours:'8',notes:'Standard image creation, software stack, policies'},{task:'Device Imaging & Pre-configuration',role:'Technician',hours:'16',notes:'OS imaging, domain join, software deployment per device'},{task:'Data Migration — User Files & Profile',role:'Technician',hours:'24',notes:'Documents, desktop, browser favourites, Outlook PST'},{task:'Intune / MDM Enrolment',role:'Engineer',hours:'8',notes:'Device enrolment, compliance policies, app deployment'},{task:'User Handover & Orientation',role:'Technician',hours:'8',notes:'New device walkthrough, key differences, helpdesk contact'},{task:'Old Device Wipe & Disposal',role:'Technician',hours:'8',notes:'Secure data wipe, WEEE disposal or trade-in coordination'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, user communications, progress tracking'}] },
  server: { title:'Server Refresh & Hardware Deployment', overview:'This project replaces your existing server hardware with new equipment, migrating all roles, services, and data with minimal downtime.', exclusions:'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nEnd-user device setup', tasks:[{task:'Current Environment Assessment',role:'Senior Engineer',hours:'8',notes:'Server roles, services, data volumes, dependencies'},{task:'Migration Planning & Risk Assessment',role:'Senior Engineer',hours:'6',notes:'Cutover approach, rollback plan, schedule'},{task:'New Server OS Installation & Patching',role:'Engineer',hours:'8',notes:'Base OS build, drivers, security baseline'},{task:'Active Directory, DNS & DHCP Migration',role:'Senior Engineer',hours:'12',notes:'Role migration, replication, cutover'},{task:'Application Server Migration',role:'Engineer',hours:'16',notes:'Line-of-business apps, databases, dependencies'},{task:'File Server Data Migration',role:'Engineer',hours:'16',notes:'Share migration, permissions, DFS replication'},{task:'Backup Configuration on New Hardware',role:'Engineer',hours:'6',notes:'BDR agent, policies, initial backup run'},{task:'User Acceptance Testing',role:'Senior Engineer',hours:'6',notes:'Sign-off testing with key users'},{task:'Old Server Decommission',role:'Engineer',hours:'6',notes:'Data wipe verification, hardware retirement'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, stakeholder updates, sign-off'}] },
  voip: { title:'VoIP & Business Communications Upgrade', overview:'This project replaces your existing phone system with a modern cloud-based VoIP or UCaaS solution, delivering reliable business communications and Microsoft Teams integration.', exclusions:'Ongoing SIP trunk or UCaaS subscription costs\nISP or internet circuit upgrades\nCustom auto-attendant scripting beyond agreed call flows', tasks:[{task:'Current System Audit & Requirements Gathering',role:'Senior Engineer',hours:'6',notes:'Existing numbers, call flows, voicemail, hunt groups'},{task:'Internet & Network Readiness Assessment',role:'Senior Engineer',hours:'4',notes:'Bandwidth, QoS capability, VLAN design for voice traffic'},{task:'Solution Design & Call Flow Planning',role:'Senior Engineer',hours:'8',notes:'Auto-attendant, hunt groups, voicemail, hold music'},{task:'Number Porting Coordination',role:'Project Manager',hours:'6',notes:'LOA submission, carrier liaison, porting schedule'},{task:'UCaaS / Teams Voice Tenant Configuration',role:'Senior Engineer',hours:'8',notes:'Licensing, dial plan, emergency locations'},{task:'VoIP Hardware Deployment',role:'Technician',hours:'12',notes:'Desk phone provisioning, headsets, ATA adapters'},{task:'Auto-Attendant & Call Flow Configuration',role:'Senior Engineer',hours:'8',notes:'IVR menus, business hours, after-hours routing'},{task:'Testing & Pre-Cutover Validation',role:'Senior Engineer',hours:'6',notes:'Inbound/outbound calls, hunt groups, failover'},{task:'Cutover Execution',role:'Senior Engineer',hours:'4',notes:'Number activation, final routing switch, live monitoring'},{task:'User Training & Handover',role:'Technician',hours:'8',notes:'Handset use, Teams calling, voicemail walkthrough'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, number porting liaison, stakeholder comms'}] },
  onboarding: { title:'New Client Onboarding', overview:'This project transitions your organization onto our managed services platform, establishing monitoring, security, backup, and support processes.', exclusions:'Hardware procurement or replacement\nSoftware licensing costs\nMajor remediation work identified during assessment', tasks:[{task:'Kickoff Meeting & Discovery',role:'Project Manager',hours:'4',notes:'Goals, contacts, priorities, schedule'},{task:'Environment Assessment & Asset Inventory',role:'Senior Engineer',hours:'8',notes:'Servers, workstations, network devices, software'},{task:'RMM Agent Deployment',role:'Engineer',hours:'8',notes:'Monitoring and management agent on all devices'},{task:'Security Baseline Configuration',role:'Senior Engineer',hours:'8',notes:'Password policies, admin accounts, baseline hardening'},{task:'Endpoint Protection Deployment',role:'Engineer',hours:'6',notes:'AV/EDR deployment and policy configuration'},{task:'Backup Solution Setup',role:'Engineer',hours:'8',notes:'BDR agent, policy config, initial backup run'},{task:'Email Security Configuration',role:'Engineer',hours:'6',notes:'SPF, DKIM, DMARC, anti-spam, anti-phishing'},{task:'MFA & Identity Setup',role:'Senior Engineer',hours:'6',notes:'MFA enforcement, admin account review'},{task:'Network & Environment Documentation',role:'Engineer',hours:'6',notes:'Topology, credentials vault, asset register'},{task:'30-Day Review & Optimisation',role:'Senior Engineer',hours:'4',notes:'Alert tuning, policy adjustments, initial report'}] },
  security: { title:'Cybersecurity & Compliance Assessment', overview:'This engagement delivers a comprehensive assessment of your organization\'s current cybersecurity posture, identifying vulnerabilities, gaps, and risks.', exclusions:'Remediation implementation (available as a follow-on engagement)\nPhysical security assessment\nSocial engineering or phishing simulation exercises', tasks:[{task:'Scoping & Kickoff',role:'Project Manager',hours:'4',notes:'Scope agreement, access requirements, schedule'},{task:'External Attack Surface Scan',role:'Senior Engineer',hours:'8',notes:'Internet-facing assets, open ports, exposed services'},{task:'Internal Vulnerability Assessment',role:'Senior Engineer',hours:'8',notes:'Network, server, and endpoint vulnerability scan'},{task:'Active Directory Security Review',role:'Senior Engineer',hours:'8',notes:'Privilege review, group policies, stale accounts'},{task:'Email Security Assessment',role:'Engineer',hours:'6',notes:'SPF/DKIM/DMARC, filtering, phishing exposure'},{task:'Firewall & Network Policy Review',role:'Engineer',hours:'6',notes:'Rule audit, segmentation, VPN config review'},{task:'Risk Scoring & Findings Analysis',role:'Senior Engineer',hours:'12',notes:'CVSS scoring, business impact mapping, prioritisation'},{task:'Executive Report Preparation',role:'Senior Engineer',hours:'8',notes:'Non-technical summary, risk heat map, key findings'},{task:'Remediation Roadmap Development',role:'Senior Engineer',hours:'8',notes:'Prioritised action plan with effort estimates'},{task:'Findings Presentation',role:'Project Manager',hours:'4',notes:'Walkthrough with key stakeholders, Q&A'}] },
  backup: { title:'Backup & Disaster Recovery Implementation', overview:'This project designs and deploys a comprehensive backup and disaster recovery solution covering your servers, endpoints, and cloud data — including documented recovery procedures and tested restore capability.', exclusions:'Off-site hardware colocation or data centre costs\nBackup software licensing costs\nApplication-level recovery for custom-built or bespoke systems', tasks:[{task:'Assessment & Solution Design',role:'Senior Engineer',hours:'6',notes:'RPO/RTO requirements, data volume, retention policy'},{task:'BDR Appliance Installation & Configuration',role:'Engineer',hours:'8',notes:'Physical or virtual appliance setup'},{task:'Server Backup Policy Configuration',role:'Engineer',hours:'8',notes:'Schedules, retention, exclusions, verification'},{task:'Workstation / Endpoint Backup Configuration',role:'Technician',hours:'8',notes:'Agent deployment, policy, selective backup'},{task:'Cloud Replication Setup',role:'Senior Engineer',hours:'6',notes:'Off-site cloud backup target, encryption, throttling'},{task:'Microsoft 365 Backup Configuration',role:'Engineer',hours:'4',notes:'Exchange, SharePoint, Teams, OneDrive'},{task:'Initial Backup Run & Validation',role:'Engineer',hours:'4',notes:'Full backup completion, integrity verification'},{task:'Bare Metal / VM Recovery Test',role:'Senior Engineer',hours:'6',notes:'Full system recovery test, RTO validation'},{task:'DR Plan Documentation',role:'Senior Engineer',hours:'8',notes:'Step-by-step recovery runbook, contact list'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, vendor coordination, reporting'}] },
  copilot: { title:'Microsoft Copilot Readiness & Deployment', overview:'This project prepares your Microsoft 365 environment for Copilot, deploys it to a pilot group, and drives adoption across your team.', exclusions:'Microsoft 365 Copilot licensing costs\nCustom Copilot Studio agent development\nThird-party AI tool integrations\nLegal or compliance review of AI acceptable-use policy', tasks:[{task:'Copilot Readiness Assessment',role:'Senior Engineer',hours:'8',notes:'Licensing eligibility, tenant configuration, security score, MFA status'},{task:'Data Governance Review',role:'Senior Engineer',hours:'12',notes:'Oversharing audit, orphaned sites, broad permissions, stale content'},{task:'Sensitivity Label Design & Implementation',role:'Senior Engineer',hours:'12',notes:'Label taxonomy, auto-labelling policies, default labels per site/library'},{task:'Microsoft Purview Configuration',role:'Senior Engineer',hours:'8',notes:'DLP policies, retention labels, audit logging baseline'},{task:'Copilot Licensing Activation & Admin Centre Setup',role:'Engineer',hours:'4',notes:'License assignment, Copilot admin settings, web access policy'},{task:'Pilot Group Selection & Onboarding',role:'Project Manager',hours:'4',notes:'5–15 users across key roles, briefing, feedback process setup'},{task:'Copilot in Teams — Configuration & Pilot',role:'Engineer',hours:'6',notes:'Meeting transcription, recap, call notes'},{task:'Prompt Engineering Training — Pilot Group',role:'Senior Engineer',hours:'6',notes:'How to write effective prompts, practical use cases per role'},{task:'Pilot Review & Feedback Analysis',role:'Project Manager',hours:'4',notes:'Usage data review, feedback collation, blockers and wins documented'},{task:'Broad Rollout & Department Training',role:'Technician',hours:'12',notes:'Role-specific training sessions'},{task:'Copilot Adoption & Usage Reporting Setup',role:'Engineer',hours:'4',notes:'Microsoft 365 Copilot dashboard, usage metrics, value reporting'},{task:'Project Management',role:'Project Manager',hours:'16',notes:'Scheduling, stakeholder communications, milestone tracking'}] }
};

function loadPreset(key) {
  const p = PRESETS[key]; if (!p) return;
  const hasContent = rows.some(r => r.task || num(r.hours) > 0);
  if (hasContent && !confirm(`Load "${p.title}" preset? Current tasks will be replaced.`)) return;
  rows = p.tasks.map(t => ({ ...t }));
  document.getElementById('projectTitle').value = p.title;
  document.getElementById('overview').value     = p.overview;
  document.getElementById('exclusions').value   = p.exclusions;
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled    = true;
  render(); saveState(); updateCenterHeader();
  showToast(`Loaded: ${p.title}`);
  saveCurrentAsProject(p.title); renderProjects();
  document.querySelectorAll('.preset-tile').forEach(t => t.classList.toggle('active', t.dataset.preset === key));
  document.getElementById('presetHint').textContent = p.title;
}

// ── Internal sections — drag to reorder ───────────────────
function getSectionOrder() {
  const container = document.getElementById('internalSections');
  return Array.from(container.querySelectorAll('.int-section')).map(el => el.dataset.section);
}
function applySectionOrder(order) {
  const container = document.getElementById('internalSections');
  order.forEach(key => {
    const el = document.getElementById(`intSection-${key}`);
    if (el) container.appendChild(el);
  });
}
function initInternalSortable() {
  if (typeof Sortable === 'undefined') return;
  Sortable.create(document.getElementById('internalSections'), {
    handle: '.int-section-drag', animation: 180, ghostClass: 'row-ghost',
    onEnd: () => saveState()
  });
}

// ── Internal links ────────────────────────────────────────
let internalLinks = [];
function renderLinks() {
  const list = document.getElementById('linksList');
  list.innerHTML = '';
  internalLinks.forEach((link, idx) => {
    const item = document.createElement('div'); item.className = 'link-item';
    item.innerHTML = `
      <span class="link-item-label" title="${esc(link.title)}">${esc(link.title||'Link')}</span>
      <a href="${esc(link.url)}" target="_blank" rel="noopener" title="${esc(link.url)}">${esc(link.url)}</a>
      <button class="link-del-btn" data-idx="${idx}" title="Remove"><i class="ti ti-x"></i></button>`;
    item.querySelector('.link-del-btn').addEventListener('click', () => {
      internalLinks.splice(idx, 1); renderLinks(); saveState();
    });
    list.appendChild(item);
  });
}
document.getElementById('addLinkBtn').addEventListener('click', () => {
  const title = document.getElementById('linkTitle').value.trim();
  const url   = document.getElementById('linkUrl').value.trim();
  if (!url) { showToast('Enter a URL'); return; }
  const fullUrl = url.startsWith('http') ? url : 'https://' + url;
  internalLinks.push({ id: genId(), title: title || fullUrl, url: fullUrl, addedAt: new Date().toISOString() });
  document.getElementById('linkTitle').value = '';
  document.getElementById('linkUrl').value   = '';
  renderLinks(); saveState(); showToast('Link added');
});
document.getElementById('linkUrl').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addLinkBtn').click();
});

// ── Internal images ───────────────────────────────────────
function renderImages() {
  const grid = document.getElementById('imageGrid');
  grid.innerHTML = '';
  internalFiles.filter(f => f.type.startsWith('image/')).forEach(f => {
    const thumb = document.createElement('div'); thumb.className = 'image-thumb';
    thumb.innerHTML = `
      <img src="" alt="${esc(f.name)}" data-idbkey="${esc(f.idbKey)}">
      <div class="image-thumb-overlay"><i class="ti ti-zoom-in"></i></div>
      ${f.caption ? `<div class="image-caption">${esc(f.caption)}</div>` : ''}
      <button class="image-del-btn" data-id="${esc(f.id)}" title="Delete"><i class="ti ti-x"></i></button>`;
    // Load image from IDB
    idbGet(f.idbKey).then(record => {
      if (record?.blob) {
        const url = URL.createObjectURL(record.blob);
        thumb.querySelector('img').src = url;
      }
    });
    thumb.querySelector('.image-thumb-overlay').addEventListener('click', () => openImageViewer(f));
    thumb.querySelector('img').addEventListener('click', () => openImageViewer(f));
    thumb.querySelector('.image-del-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete image "${f.name}"?`)) return;
      idbDelete(f.idbKey).catch(() => {});
      internalFiles = internalFiles.filter(x => x.id !== f.id);
      renderImages(); renderFiles(); saveState(); showToast('Image deleted');
    });
    grid.appendChild(thumb);
  });
}

async function openImageViewer(f) {
  const record = await idbGet(f.idbKey);
  if (!record?.blob) { showToast('Image not found in local storage'); return; }
  const url = URL.createObjectURL(record.blob);
  openViewer(f.name, `<img src="${url}" alt="${esc(f.name)}" style="max-width:100%;max-height:75vh;object-fit:contain;">`);
}

// ── Internal files ────────────────────────────────────────
function renderFiles() {
  const list = document.getElementById('filesList');
  list.innerHTML = '';
  internalFiles.filter(f => !f.type.startsWith('image/')).forEach(f => {
    const item = document.createElement('div'); item.className = 'file-item';
    item.innerHTML = `
      <i class="ti ${fileIcon(f.type)} file-item-icon"></i>
      <div class="file-item-info">
        <div class="file-item-name">${esc(f.name)}</div>
        <div class="file-item-meta">${esc(fmtBytes(f.size))} · ${new Date(f.addedAt).toLocaleDateString()}</div>
      </div>
      <button class="file-del-btn" data-id="${esc(f.id)}" title="Delete"><i class="ti ti-trash"></i></button>`;
    item.addEventListener('click', e => { if (e.target.closest('.file-del-btn')) return; openFileViewer(f); });
    item.querySelector('.file-del-btn').addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Delete "${f.name}"?`)) return;
      idbDelete(f.idbKey).catch(() => {});
      internalFiles = internalFiles.filter(x => x.id !== f.id);
      renderFiles(); saveState(); showToast('File deleted');
    });
    list.appendChild(item);
  });
}

function fileIcon(type) {
  if (type.includes('pdf'))  return 'ti-file-type-pdf';
  if (type.includes('word') || type.includes('document')) return 'ti-file-type-doc';
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return 'ti-file-type-xls';
  if (type.includes('text')) return 'ti-file-type-txt';
  return 'ti-file';
}

async function openFileViewer(f) {
  const record = await idbGet(f.idbKey);
  if (!record?.blob) { showToast('File not found in local storage'); return; }
  const blob = record.blob;

  if (f.type.startsWith('image/')) { openImageViewer(f); return; }

  if (f.type === 'application/pdf') {
    const url = URL.createObjectURL(blob);
    openViewer(f.name, `<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`);
    return;
  }

  if (f.type.includes('sheet') || f.type.includes('excel') || f.name.match(/\.xlsx?$/i)) {
    const ab = await blob.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const html = XLSX.utils.sheet_to_html(ws, { editable: false });
    openViewer(f.name, `<div class="xlsx-preview">${html}</div>`);
    return;
  }

  if (f.type.includes('word') || f.name.match(/\.docx?$/i)) {
    const ab = await blob.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer: ab });
    openViewer(f.name, `<div class="docx-preview">${result.value}</div>`);
    return;
  }

  if (f.type.startsWith('text/') || f.name.match(/\.txt$|\.csv$/i)) {
    const text = await blob.text();
    openViewer(f.name, `<pre style="font-family:var(--mono);font-size:12px;white-space:pre-wrap;padding:16px;background:var(--bg);width:100%;">${esc(text)}</pre>`);
    return;
  }

  // Fallback — offer download
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = f.name; a.click();
  URL.revokeObjectURL(url);
}

function openViewer(title, bodyHtml) {
  document.getElementById('viewerTitle').textContent = title;
  document.getElementById('viewerBody').innerHTML    = bodyHtml;
  document.getElementById('viewerOverlay').hidden    = false;
}

document.getElementById('viewerClose').addEventListener('click', () => {
  document.getElementById('viewerOverlay').hidden = true;
  document.getElementById('viewerBody').innerHTML = '';
});
document.getElementById('viewerOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('viewerOverlay')) {
    document.getElementById('viewerOverlay').hidden = true;
    document.getElementById('viewerBody').innerHTML = '';
  }
});

// ── File upload handlers ──────────────────────────────────
document.getElementById('imageUploadInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (!files.length) { showToast('No image files selected'); e.target.value = ''; return; }
  for (const file of files) {
    const idbKey = genId();
    await idbPut({ idbKey, blob: file, name: file.name, type: file.type });
    internalFiles.push({ id: genId(), name: file.name, type: file.type, size: file.size, addedAt: new Date().toISOString(), idbKey, caption: '' });
  }
  renderImages(); saveState();
  // Switch to Internal tab so user sees the result
  document.querySelector('.tab-btn[data-tab="internal"]').click();
  showToast(`${files.length} image${files.length > 1 ? 's' : ''} added`);
  e.target.value = '';
});

document.getElementById('fileUploadInput').addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  if (!files.length) { e.target.value = ''; return; }
  for (const file of files) {
    const idbKey = genId();
    await idbPut({ idbKey, blob: file, name: file.name, type: file.type });
    internalFiles.push({ id: genId(), name: file.name, type: file.type, size: file.size, addedAt: new Date().toISOString(), idbKey, caption: '' });
  }
  // Render both since mixed uploads are possible
  renderImages(); renderFiles(); saveState();
  // Switch to Internal tab so user sees the result
  document.querySelector('.tab-btn[data-tab="internal"]').click();
  showToast(`${files.length} file${files.length > 1 ? 's' : ''} added`);
  e.target.value = '';
});

// ── Tabs ──────────────────────────────────────────────────
let activeTab = 'scope';
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${activeTab}`));
    // Refresh Quill layout on tab switch
    if (activeTab === 'notes' && projectNotesEditor) projectNotesEditor.update();
    if (activeTab === 'internal' && internalNotesEditor) internalNotesEditor.update();
  });
});

// ── Collapsible internal sections ────────────────────────
document.querySelectorAll('.int-section-collapse').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const body = document.getElementById(targetId);
    if (!body) return;
    body.hidden = !body.hidden;
    btn.classList.toggle('collapsed', body.hidden);
  });
});

// ── Publish panels (mutually exclusive) ──────────────────
function openPublishPanel(which) {
  const map = { scope: ['scopePublishBody','scopePublishToggle','scopePublishChevron'], notes: ['notesPublishBody','notesPublishToggle','notesPublishChevron'] };
  Object.entries(map).forEach(([key, [bodyId, toggleId, chevId]]) => {
    const isThis = key === which;
    document.getElementById(bodyId).hidden = !isThis;
    document.getElementById(toggleId).classList.toggle('active', isThis);
    document.getElementById(chevId).classList.toggle('open', isThis);
  });
}
document.getElementById('scopePublishToggle').addEventListener('click', () => {
  const isOpen = !document.getElementById('scopePublishBody').hidden;
  if (isOpen) { document.getElementById('scopePublishBody').hidden = true; document.getElementById('scopePublishToggle').classList.remove('active'); document.getElementById('scopePublishChevron').classList.remove('open'); }
  else openPublishPanel('scope');
});
document.getElementById('notesPublishToggle').addEventListener('click', () => {
  const isOpen = !document.getElementById('notesPublishBody').hidden;
  if (isOpen) { document.getElementById('notesPublishBody').hidden = true; document.getElementById('notesPublishToggle').classList.remove('active'); document.getElementById('notesPublishChevron').classList.remove('open'); }
  else openPublishPanel('notes');
});

// ── Settings zone toggle ──────────────────────────────────
document.getElementById('settingsToggle').addEventListener('click', () => {
  const body    = document.getElementById('settingsBody');
  const chevron = document.getElementById('settingsChevron');
  body.hidden   = !body.hidden;
  chevron.classList.toggle('open', !body.hidden);
});

// ── Save toolbar ──────────────────────────────────────────
document.getElementById('teamToggleBtn').addEventListener('click', () => {
  const body = document.getElementById('teamBody');
  const btn  = document.getElementById('teamToggleBtn');
  body.hidden = !body.hidden;
  btn.classList.toggle('active', !body.hidden);
  if (!body.hidden) document.getElementById('tmplPassphrase').focus();
});
document.getElementById('loadTemplateBtn').addEventListener('click', async () => {
  const body = document.getElementById('templateSelectBody');
  const btn  = document.getElementById('loadTemplateBtn');
  body.hidden = !body.hidden;
  btn.classList.toggle('active', !body.hidden);
  if (!body.hidden) await renderTemplateSelect();
});
document.getElementById('exportBtn').addEventListener('click', () => {
  const state = captureCurrentState();
  const slug  = (state.projectTitle || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob  = new Blob([JSON.stringify({ version:2, exportedAt: new Date().toISOString(), ...state }, null, 2)], { type:'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = `${slug}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Exported');
});
document.getElementById('importInput').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const s = JSON.parse(ev.target.result);
      if (!Array.isArray(s.rows)) throw new Error('Not a valid scope file');
      if (rows.length && !confirm(`Import "${s.projectTitle||file.name}"? Current scope will be replaced.`)) return;
      applyState(s); showToast(`Imported: ${s.projectTitle||file.name}`);
      saveCurrentAsProject(s.projectTitle); renderProjects();
    } catch { showToast('⚠️ Could not read this file'); }
  };
  reader.readAsText(file); e.target.value = '';
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear this project and start fresh?')) return;
  currentProjectId = null; newProject(true); localStorage.removeItem(LS_KEY);
});
document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
  const def  = document.getElementById('projectTitle').value.trim() || 'My Template';
  const name = prompt('Name this template:', def); if (!name?.trim()) return;
  const trimmed = name.trim();
  const btn   = document.getElementById('saveTemplateBtn');
  const entry = { name: trimmed, savedAt: new Date().toISOString(), ...captureCurrentState() };
  btn.disabled = true;
  try {
    if (isTeamMode()) {
      const hash = hashPassphrase(getPassphrase());
      const existing = (await teamGetIndex(hash)).includes(trimmed);
      if (existing && !confirm(`Replace team template "${trimmed}"?`)) { btn.disabled = false; return; }
      await teamSaveTemplate(hash, trimmed, entry);
      showToast(`"${trimmed}" saved for the team`);
    } else {
      const all = localGetAll(); const idx = all.findIndex(t => t.name === trimmed);
      if (idx >= 0) { if (!confirm(`Replace local template "${trimmed}"?`)) { btn.disabled = false; return; } all[idx] = entry; } else { all.push(entry); }
      localSaveAll(all); showToast(`"${trimmed}" saved locally`);
    }
    await renderTemplateSelect(); document.getElementById('templateSelect').value = trimmed;
  } catch { showToast('⚠️ Save failed'); } finally { btn.disabled = false; }
});
document.getElementById('applyTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  const btn  = document.getElementById('applyTemplateBtn'); btn.disabled = true;
  try {
    let tmpl = isTeamMode() ? await teamGetTemplate(hashPassphrase(getPassphrase()), name) : localGetAll().find(t => t.name === name) || null;
    if (!tmpl) { showToast('Template not found'); return; }
    if (rows.length && !confirm(`Load "${name}"? Current scope will be replaced.`)) return;
    applyState(tmpl); showToast(`"${name}" loaded`);
    saveCurrentAsProject(tmpl.projectTitle); renderProjects();
    document.getElementById('templateSelectBody').hidden = true;
    document.getElementById('loadTemplateBtn').classList.remove('active');
  } catch { showToast('⚠️ Load failed'); } finally { btn.disabled = false; }
});
document.getElementById('deleteTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  if (!confirm(`Delete template "${name}"?`)) return;
  const btn = document.getElementById('deleteTemplateBtn'); btn.disabled = true;
  try {
    if (isTeamMode()) { await teamDeleteTemplate(hashPassphrase(getPassphrase()), name); }
    else { localSaveAll(localGetAll().filter(t => t.name !== name)); }
    await renderTemplateSelect(false); showToast(`"${name}" deleted`);
  } catch { showToast('⚠️ Delete failed'); } finally { btn.disabled = false; }
});
document.getElementById('tmplPassphrase').addEventListener('input', async () => { updatePassphraseUI(); await renderTemplateSelect(); });
document.getElementById('newProjectBtn').addEventListener('click', () => newProject());
document.getElementById('addRowBtn').addEventListener('click', () => { rows.push(defaultRow()); render(); saveState(); });
['projectTitle','customerName','overview','exclusions'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { saveState(); autoRefresh(); updateCenterHeader(); });
});
document.getElementById('hoursPerDay').addEventListener('input', () => { updateSummary(); saveState(); autoRefresh(); });
['showRole','showHours','showTotalHours','showNotes'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { saveState(); autoRefresh(); });
});

// ── Generate & copy scope widget ─────────────────────────
document.getElementById('generateBtn').addEventListener('click', () => {
  const html = generateScopeWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('outputPanels').hidden = false;
  document.getElementById('copyBtn').disabled    = false;
  document.getElementById('sbPushBtn').disabled  = false;
  showToast('Scope widget generated'); saveState();
});
document.getElementById('closeOutputBtn').addEventListener('click', () => { document.getElementById('outputPanels').hidden = true; });
document.getElementById('copyBtn').addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent; if (!html.trim()) return;
  try { await navigator.clipboard.writeText(html); showToast('Copied'); }
  catch { const ta = document.createElement('textarea'); ta.value = html; ta.style.cssText = 'position:fixed;left:-9999px;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('Copied (fallback)'); }
});

// ── Generate & copy notes widget ─────────────────────────
document.getElementById('generateNotesWidgetBtn').addEventListener('click', () => {
  const html = generateNotesWidgetHtml();
  if (!html) { showToast('Add some project notes first'); return; }
  document.getElementById('notesHtmlOut').textContent = html;
  document.getElementById('notesOutputPanels').hidden = false;
  document.getElementById('copyNotesBtn').disabled    = false;
  document.getElementById('sbNotesPushBtn').disabled  = false;
  showToast('Notes widget generated');
});
document.getElementById('closeNotesOutputBtn').addEventListener('click', () => { document.getElementById('notesOutputPanels').hidden = true; });
document.getElementById('copyNotesBtn').addEventListener('click', async () => {
  const html = document.getElementById('notesHtmlOut').textContent; if (!html.trim()) return;
  try { await navigator.clipboard.writeText(html); showToast('Copied'); }
  catch { const ta = document.createElement('textarea'); ta.value = html; ta.style.cssText = 'position:fixed;left:-9999px;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('Copied (fallback)'); }
});

// ── Salesbuildr push ──────────────────────────────────────
function initSbCredentials() {
  const savedApi    = localStorage.getItem(LS_API_KEY);
  const savedTenant = localStorage.getItem(LS_TENANT_URL);
  if (savedApi)    document.getElementById('sbApiKey').value    = savedApi;
  if (savedTenant) document.getElementById('sbTenantUrl').value = savedTenant;
  if (savedApi && savedTenant) document.getElementById('sbRemember').checked = true;
  // Open settings zone if no credentials
  if (!savedApi || !savedTenant) {
    document.getElementById('settingsBody').hidden = false;
    document.getElementById('settingsChevron').classList.add('open');
  }
}

async function pushWidget(html, prefix, title, resultId, pushBtnId) {
  const apiKey    = document.getElementById('sbApiKey').value.trim();
  const tenantUrl = document.getElementById('sbTenantUrl').value.trim();
  if (!apiKey || !tenantUrl) { showToast('Enter Salesbuildr credentials in Settings'); return; }
  if (document.getElementById('sbRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  }
  const btn    = document.getElementById(pushBtnId);
  const result = document.getElementById(resultId);
  btn.disabled = true; result.hidden = true;
  const oldText = btn.innerHTML;
  btn.innerHTML = '<i class="ti ti-loader"></i> Saving…';
  try {
    const res  = await fetch('/api/push-widgets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ widgets:[{ id:'widget', title, html }], prefix, apiKey, tenantUrl }) });
    const data = await res.json();
    if (data.successCount > 0) {
      result.textContent = `✓ Saved as "${prefix ? prefix+' – ' : ''}${title}"`;
      result.className = 'sb-result ok'; result.hidden = false;
      btn.innerHTML = '<i class="ti ti-check"></i> Saved';
      // Auto-collapse settings on success
      document.getElementById('settingsBody').hidden = true;
      document.getElementById('settingsChevron').classList.remove('open');
    } else { throw new Error((data.results?.[0]?.error)||data.error||'Unknown error'); }
  } catch (e) {
    result.textContent = `✕ ${e.message}`; result.className = 'sb-result error'; result.hidden = false;
    btn.innerHTML = oldText; btn.disabled = false;
  }
}

document.getElementById('sbPushBtn').addEventListener('click', () => {
  const html   = document.getElementById('htmlOut').textContent.trim();
  const title  = (document.getElementById('projectTitle').value||'Project Scope').trim();
  const prefix = document.getElementById('sbPrefix').value.trim();
  if (!html) { showToast('Generate the scope widget first'); return; }
  pushWidget(html, prefix, title, 'sbResult', 'sbPushBtn');
});
document.getElementById('sbNotesPushBtn').addEventListener('click', () => {
  const html   = document.getElementById('notesHtmlOut').textContent.trim();
  const title  = (document.getElementById('projectTitle').value||'Project Notes').trim() + ' — Notes';
  const prefix = document.getElementById('sbNotesPrefix').value.trim();
  if (!html) { showToast('Generate the notes widget first'); return; }
  pushWidget(html, prefix, title, 'sbResult', 'sbNotesPushBtn');
});

// ── Preset tiles ──────────────────────────────────────────
document.querySelectorAll('.preset-tile').forEach(tile => {
  tile.addEventListener('click', () => loadPreset(tile.dataset.preset));
});
document.getElementById('presetToggle').addEventListener('click', () => {
  const grid    = document.getElementById('presetGrid');
  const chevron = document.getElementById('presetChevron');
  grid.hidden   = !grid.hidden;
  chevron.classList.toggle('collapsed', grid.hidden);
});

// ── AI Assistant ──────────────────────────────────────────
let aiPendingMode = null;
let projectNotesEditor  = null;
let internalNotesEditor = null;

function addAiMessage(role, html) {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  div.innerHTML = role === 'assistant'
    ? `<div class="ai-msg-label">Assistant</div>${html}`
    : `<div class="ai-msg-label" style="text-align:right">You</div>${html}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}
function addAiTyping() {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div'); div.className = 'ai-typing'; div.id = 'aiTyping';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div); container.scrollTop = container.scrollHeight;
}
function removeAiTyping() { const el = document.getElementById('aiTyping'); if (el) el.remove(); }

async function sendAiMessage(userText, mode) {
  if (!userText.trim()) return;
  const btn = document.getElementById('aiSendBtn'); btn.disabled = true;
  addAiMessage('user', esc(userText).replace(/\n/g,'<br>'));
  addAiTyping();
  try {
    const payload = { mode: mode||'chat', message: userText };
    if (mode === 'review' || mode === 'adjust') {
      payload.currentScope = { ...captureCurrentState(), tasks: rows.map(r => ({ task:r.task, role:r.role, hours:r.hours, notes:r.notes })) };
    }
    const res  = await fetch(API_AI, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    removeAiTyping();
    if (!res.ok) throw new Error(data.error || 'AI error');

    if (mode === 'generate' && data.tasks) {
      const preview = data.tasks.slice(0,5).map(t => `<div class="ai-task-item"><strong>${esc(t.task)}</strong> — ${esc(t.role)}, ${t.hours}h</div>`).join('') +
        (data.tasks.length > 5 ? `<div class="ai-task-item" style="color:var(--accent);">+ ${data.tasks.length-5} more</div>` : '');
      const msgDiv = document.createElement('div'); msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>${esc(data.message||`Generated ${data.tasks.length} tasks`)}<div class="ai-task-list">${preview}</div><button class="ai-apply-btn" id="aiApplyGenBtn"><i class="ti ti-check"></i> Apply to scope</button>`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;
      document.getElementById('aiApplyGenBtn').addEventListener('click', () => {
        applyState({ projectTitle: data.projectTitle||document.getElementById('projectTitle').value, customerName: document.getElementById('customerName').value, hoursPerDay: document.getElementById('hoursPerDay').value, overview: data.overview||document.getElementById('overview').value, exclusions: data.exclusions||document.getElementById('exclusions').value, showRole:true, showHours:false, showTotalHours:true, showNotes:true, rows: data.tasks });
        saveCurrentAsProject(data.projectTitle); renderProjects();
        showToast('Scope applied ✓');
        addAiMessage('assistant', '✅ Scope applied. Review and adjust tasks as needed.');
      });
    } else if ((mode === 'review' || mode === 'adjust') && data.feedback) {
      const feedbackHtml = (data.feedback||[]).map(f => `<div class="ai-feedback-item ai-feedback-${f.type}">${esc(f.text)}</div>`).join('');
      const msgDiv = document.createElement('div'); msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>${esc(data.summary||'Here\'s my review:')}<div style="margin-top:8px">${feedbackHtml}</div>`;
      if (data.suggestedTasks?.length > 0) {
        msgDiv.innerHTML += `<button class="ai-apply-btn" id="aiApplySugBtn" style="margin-top:6px"><i class="ti ti-plus"></i> Add ${data.suggestedTasks.length} suggested tasks</button>`;
      }
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;
      if (data.suggestedTasks?.length > 0) {
        document.getElementById('aiApplySugBtn')?.addEventListener('click', () => {
          rows.push(...data.suggestedTasks.map(t => ({ task:t.task||'', role:t.role||'', hours:String(t.hours||''), notes:t.notes||'' })));
          render(); updateSummary(); saveState();
          showToast(`Added ${data.suggestedTasks.length} tasks`);
        });
      }
    } else {
      addAiMessage('assistant', esc(data.text||'').replace(/\n/g,'<br>'));
    }
  } catch (err) {
    removeAiTyping();
    addAiMessage('assistant', `<span style="color:var(--danger)">⚠️ ${esc(err.message||'Something went wrong')}</span>`);
  } finally {
    btn.disabled = false; aiPendingMode = null;
  }
}

document.getElementById('aiSendBtn').addEventListener('click', () => {
  const input = document.getElementById('aiInput');
  const text  = input.value.trim(); if (!text) return;
  const mode  = aiPendingMode || 'chat';
  input.value = '';
  sendAiMessage(text, mode);
});
document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('aiSendBtn').click(); }
});
document.querySelectorAll('.ai-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const action = chip.dataset.action;
    const input  = document.getElementById('aiInput');
    if (action === 'generate') {
      aiPendingMode = 'generate'; input.placeholder = 'Describe the project…'; input.focus();
      addAiMessage('assistant', 'Describe the project and I\'ll generate a full scope with tasks, roles, and hours.');
    } else if (action === 'review') {
      sendAiMessage('Please review my current scope', 'review');
    } else if (action === 'adjust') {
      aiPendingMode = 'adjust'; input.placeholder = 'e.g. "We only have 2 engineers and 4 weeks"'; input.focus();
      addAiMessage('assistant', 'Tell me your constraints — team size, deadline, or budget — and I\'ll flag anything that needs adjusting.');
    } else if (action === 'format') {
      // Trigger AI format for project notes
      document.getElementById('aiFormatBtn').click();
    }
  });
});

// ── AI Format — Project Notes before/after ────────────────
document.getElementById('aiFormatBtn').addEventListener('click', async () => {
  const rawHtml = projectNotesEditor ? projectNotesEditor.root.innerHTML : '';
  const plainText = projectNotesEditor ? projectNotesEditor.getText().trim() : '';
  if (!plainText) { showToast('Add some project notes first'); return; }

  const btn      = document.getElementById('aiFormatBtn');
  const editor   = document.getElementById('notesEditorPane');
  const compare  = document.getElementById('notesCompare');
  const loading  = document.getElementById('notesAiLoading');
  const afterPane = document.getElementById('notesAfterPane');
  const beforePane = document.getElementById('notesBeforePane');
  const applyBtn  = document.getElementById('notesApplyBtn');
  const discardBtn = document.getElementById('notesDiscardBtn');

  // Show compare layout
  editor.style.display = 'none';
  compare.hidden = false; compare.classList.add('active');
  beforePane.innerHTML = rawHtml;
  afterPane.innerHTML = '';
  afterPane.appendChild(loading);
  loading.style.display = 'flex';
  applyBtn.disabled = true;
  btn.disabled = true;

  try {
    const res  = await fetch(API_AI, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ mode: 'format', message: plainText })
    });
    const data = await res.json();
    loading.style.display = 'none';
    if (!res.ok || !data.ok) throw new Error(data.error||'AI formatting failed');
    const formattedHtml = data.html || data.text || '';
    afterPane.innerHTML = formattedHtml;
    applyBtn.disabled = false;

    applyBtn.onclick = () => {
      projectNotesEditor.root.innerHTML = formattedHtml;
      compare.hidden = true; compare.classList.remove('active');
      editor.style.display = '';
      btn.disabled = false;
      saveState(); showToast('AI formatting applied');
    };
  } catch (e) {
    loading.style.display = 'none';
    afterPane.innerHTML = `<p style="color:var(--danger);font-family:var(--mono);font-size:12px;">⚠️ ${esc(e.message)}</p>`;
    btn.disabled = false;
  }

  discardBtn.onclick = () => {
    compare.hidden = true; compare.classList.remove('active');
    editor.style.display = '';
    btn.disabled = false;
  };
});

// ── Init ──────────────────────────────────────────────────
(async function init() {
  // Init Quill editors
  projectNotesEditor = new Quill('#projectNotesEditor', {
    theme: 'snow',
    placeholder: 'Add project notes here — describe the solution, design decisions, site conditions, key requirements… The AI can reformat this into a professional customer-facing document.',
    modules: {
      toolbar: [
        [{ header: 2 }, { header: 3 }],
        ['bold','italic','underline'],
        [{ list:'ordered' }, { list:'bullet' }],
        ['link','blockquote'],
        ['clean']
      ]
    }
  });
  internalNotesEditor = new Quill('#internalNotesEditor', {
    theme: 'snow',
    placeholder: 'Internal notes — visible only here, never shared with customers.',
    modules: {
      toolbar: [
        ['bold','italic','underline'],
        [{ list:'ordered' }, { list:'bullet' }],
        ['clean']
      ]
    }
  });

  // Save state on Quill changes
  projectNotesEditor.on('text-change', () => saveState());
  internalNotesEditor.on('text-change', () => saveState());

  // Load saved state
  const urlPreset = new URLSearchParams(window.location.search).get('preset');
  if (!urlPreset) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const s = JSON.parse(raw); if (!(s.projectTitle||'').trim() && !(s.rows||[]).some(r => num(r.hours)>0)) localStorage.removeItem(LS_KEY); }
    } catch { localStorage.removeItem(LS_KEY); }
  }

  if (urlPreset && PRESETS[urlPreset]) {
    rows = PRESETS[urlPreset].tasks.map(t => ({ ...t }));
    document.getElementById('projectTitle').value = PRESETS[urlPreset].title;
    document.getElementById('overview').value     = PRESETS[urlPreset].overview;
    document.getElementById('exclusions').value   = PRESETS[urlPreset].exclusions;
  } else {
    const hasSaved = loadState();
    if (!hasSaved) rows = [defaultRow()];
  }
  if (!rows.length) rows = [defaultRow()];

  render();
  updatePassphraseUI();
  updateCenterHeader();
  renderProjects();
  initBrandColor();
  setupBrandColorListeners();
  initSbCredentials();
  initInternalSortable();
  await renderTemplateSelect();

  document.getElementById('outputPanels').hidden      = true;
  document.getElementById('notesOutputPanels').hidden = true;
  document.getElementById('copyBtn').disabled         = true;
  document.getElementById('copyNotesBtn').disabled    = true;
  document.getElementById('sbPushBtn').disabled       = true;
  document.getElementById('sbNotesPushBtn').disabled  = true;
})();
