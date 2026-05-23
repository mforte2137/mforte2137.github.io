/* =========================================================
   SOW Generator — sow-generator.js
   Architecture mirrors project-scope.js exactly.
   New: SOW sections, milestone editor, SOW HTML generation,
        Convert from Scope mode, SOW-specific AI prompts.
   ========================================================= */

// ── Constants ─────────────────────────────────────────────
const LS_KEY         = 'sb_sow_v1';
const LS_PROJECTS    = 'sb_sow_projects_v1';
const LS_BRAND_COLOR = 'sb_brand_color_v1';   // Shared with Scope Builder intentionally
const LS_TEMPLATES   = 'sb_sow_templates_v1';
const LS_API_KEY     = 'sb_api_key';           // Shared with Scope Builder
const LS_INT_KEY     = 'sb_int_key';           // Shared with Scope Builder
const API_TEMPLATES  = '/api/sow-templates';
const API_AI         = '/api/sow-ai';
const PROJ_COLORS    = ['#3b82f6','#f97316','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#6366f1'];

let brandColor = localStorage.getItem(LS_BRAND_COLOR) || '#2563eb';

// ── Milestones state ──────────────────────────────────────
let milestones = ['Kickoff', 'Discovery & Design', 'Delivery', 'Go Live'];
let currentProjectId = null;

// ── Utilities ─────────────────────────────────────────────
function esc(str) {
  return (str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Brand color ───────────────────────────────────────────
function saveBrandColor(color) {
  brandColor = color;
  localStorage.setItem(LS_BRAND_COLOR, color);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
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
  const customSwatch = document.getElementById('brandCustomSwatch');
  if (!matched) {
    customSwatch.classList.add('active');
    customSwatch.style.background = brandColor;
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').value = brandColor;
  } else {
    customSwatch.classList.remove('active');
  }
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
  document.getElementById('brandHexInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyCustomHex();
  });
}

function applyCustomHex() {
  let val = document.getElementById('brandHexInput').value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) { showToast('Enter a valid 6-digit hex e.g. #2563eb'); return; }
  document.querySelectorAll('.brand-swatch').forEach(s => s.classList.remove('active'));
  const customSwatch = document.getElementById('brandCustomSwatch');
  customSwatch.classList.add('active');
  customSwatch.style.background = val;
  saveBrandColor(val);
  autoRefresh();
  showToast('Brand color updated');
}

// ── Passphrase / team mode ────────────────────────────────
function getPassphrase() { return (document.getElementById('tmplPassphrase')?.value || '').trim(); }
function hashPassphrase(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}
function isTeamMode() { return getPassphrase().length > 0; }

function updatePassphraseUI() {
  const badge = document.getElementById('tmplPassphraseBadge');
  const label = document.getElementById('tmplModeLabel');
  if (!badge) return;
  if (isTeamMode()) {
    badge.textContent = '🔗 Team';
    badge.className   = 'lp-badge lp-badge-team';
    if (label) label.textContent = '(shared)';
  } else {
    badge.textContent = '💾 Local';
    badge.className   = 'lp-badge lp-badge-local';
    if (label) label.textContent = '(local)';
  }
}

function promptForPassphrase(action = 'use shared templates') {
  const input  = document.getElementById('tmplPassphrase');
  const phrase = prompt(`No team passphrase set.\n\nEnter a passphrase to ${action} with your team, or leave blank for local storage.`);
  if (phrase === null) return false;
  if (phrase.trim().length > 0) { input.value = phrase.trim(); updatePassphraseUI(); return true; }
  return false;
}

// ── Local template storage ────────────────────────────────
function localGetAll()       { try { return JSON.parse(localStorage.getItem(LS_TEMPLATES)) || []; } catch { return []; } }
function localSaveAll(arr)   { localStorage.setItem(LS_TEMPLATES, JSON.stringify(arr)); }

// ── Team template storage (Netlify Blobs via sow-templates function) ──
async function teamGetIndex(hash) {
  const r = await fetch(API_TEMPLATES, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ method:'getIndex', hash }) });
  return r.ok ? r.json() : [];
}
async function teamGetTemplate(hash, name) {
  const r = await fetch(API_TEMPLATES, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ method:'getTemplate', hash, name }) });
  return r.ok ? r.json() : null;
}
async function teamSaveTemplate(hash, name, entry) {
  return fetch(API_TEMPLATES, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ method:'saveTemplate', hash, name, entry }) });
}
async function teamDeleteTemplate(hash, name) {
  return fetch(API_TEMPLATES, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ method:'deleteTemplate', hash, name }) });
}

async function renderTemplateSelect(restoreVal = true) {
  const sel = document.getElementById('templateSelect');
  const saved = restoreVal ? sel.value : '';
  sel.innerHTML = '<option value="">— No saved templates yet —</option>';
  if (isTeamMode()) {
    const names = await teamGetIndex(hashPassphrase(getPassphrase()));
    names.forEach(n => { const o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o); });
  } else {
    const all = localGetAll();
    all.forEach(t => { const o = document.createElement('option'); o.value = t.name; o.textContent = t.name; sel.appendChild(o); });
  }
  if (saved && [...sel.options].find(o => o.value === saved)) sel.value = saved;
}

// ── Projects ──────────────────────────────────────────────
function getProjects() { try { return JSON.parse(localStorage.getItem(LS_PROJECTS)) || []; } catch { return []; } }
function saveProjects(projects) { localStorage.setItem(LS_PROJECTS, JSON.stringify(projects)); }

function captureCurrentState() {
  return {
    projectTitle:  document.getElementById('projectTitle').value,
    paymentTerms:  document.getElementById('paymentTerms').value,
    paymentCustom: document.getElementById('paymentCustom').value,
    engagement:    document.getElementById('engagement').value,
    deliverables:  document.getElementById('deliverables').value,
    howWeWork:     document.getElementById('howWeWork').value,
    changeDropdown:document.getElementById('changeDropdown').value,
    changeText:    document.getElementById('changeText').value,
    commitment:    document.getElementById('commitment').value,
    nextSteps:     document.getElementById('nextSteps').value,
    milestones:    [...milestones]
  };
}

function applyState(s) {
  document.getElementById('projectTitle').value   = s.projectTitle  ?? '';
  document.getElementById('paymentTerms').value   = s.paymentTerms  ?? 'on-completion';
  document.getElementById('paymentCustom').value  = s.paymentCustom ?? '';
  document.getElementById('engagement').value     = s.engagement    ?? '';
  document.getElementById('deliverables').value   = s.deliverables  ?? '';
  document.getElementById('howWeWork').value       = s.howWeWork     ?? '';
  document.getElementById('changeDropdown').value = s.changeDropdown ?? 'discuss';
  document.getElementById('changeText').value     = s.changeText    ?? '';
  document.getElementById('commitment').value     = s.commitment    ?? '';
  document.getElementById('nextSteps').value      = s.nextSteps     ?? '';
  milestones = Array.isArray(s.milestones) ? [...s.milestones] : ['Kickoff', 'Discovery & Design', 'Delivery', 'Go Live'];
  renderMilestones();
  updatePaymentCustomVisibility();
  updateChangePreview();
  updateCenterHeader();
  saveState();
}

function autoSaveCurrentProject() {
  if (!currentProjectId) return;
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === currentProjectId);
  if (idx < 0) return;
  projects[idx] = { ...projects[idx], ...captureCurrentState(), updatedAt: new Date().toISOString() };
  saveProjects(projects);
}

function saveCurrentAsProject(title) {
  const projects = getProjects();
  const state = captureCurrentState();
  const isShared = isTeamMode();
  if (currentProjectId) {
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...state, updatedAt: new Date().toISOString(), shared: isShared };
      saveProjects(projects); renderProjects(); return;
    }
  }
  const newProj = { id: genId(), ...state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), shared: isShared };
  projects.push(newProj);
  currentProjectId = newProj.id;
  saveProjects(projects);
  renderProjects();
}

function renderProjects() {
  const list = document.getElementById('projectList');
  const projects = getProjects();
  list.innerHTML = '';
  if (projects.length === 0) {
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 2px;">No projects yet</div>';
    return;
  }
  projects.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'lp-proj-item' + (p.id === currentProjectId ? ' active' : '');
    const color = PROJ_COLORS[i % PROJ_COLORS.length];
    const isShared = !!p.shared;
    const ago = p.updatedAt ? relativeTime(p.updatedAt) : 'new';
    item.innerHTML = `
      <div class="lp-proj-dot" style="background:${color}"></div>
      <div class="lp-proj-info">
        <div class="lp-proj-name">${esc(p.projectTitle || 'Untitled SOW')}</div>
        <div class="lp-proj-meta">${ago}</div>
      </div>
      <span class="lp-proj-badge ${isShared ? 'lp-proj-badge-shared' : 'lp-proj-badge-local'}">${isShared ? 'shared' : 'local'}</span>
      <span class="lp-proj-delete" title="Delete project" data-id="${esc(p.id)}"><i class="ti ti-x"></i></span>
    `;
    item.addEventListener('click', e => {
      if (e.target.closest('.lp-proj-delete')) return;
      switchToProject(p.id);
    });
    item.querySelector('.lp-proj-delete').addEventListener('click', e => {
      e.stopPropagation();
      deleteProject(p.id);
    });
    list.appendChild(item);
  });
}

function switchToProject(id) {
  autoSaveCurrentProject();
  const p = getProjects().find(proj => proj.id === id);
  if (!p) return;
  currentProjectId = id;
  applyState(p);
  renderProjects();
  updateCenterHeader();
}

function deleteProject(id) {
  const projects = getProjects();
  const p = projects.find(proj => proj.id === id);
  if (!confirm(`Delete project "${p?.projectTitle || 'this project'}"?`)) return;
  const updated = projects.filter(proj => proj.id !== id);
  saveProjects(updated);
  if (currentProjectId === id) {
    currentProjectId = null;
    if (updated.length > 0) { switchToProject(updated[0].id); return; }
    newProject();
  } else {
    renderProjects();
  }
  showToast('Project deleted');
}

function newProject() {
  autoSaveCurrentProject();
  currentProjectId = null;
  document.getElementById('projectTitle').value   = '';
  document.getElementById('paymentTerms').value   = 'on-completion';
  document.getElementById('paymentCustom').value  = '';
  document.getElementById('engagement').value     = '';
  document.getElementById('deliverables').value   = '';
  document.getElementById('howWeWork').value       = '';
  document.getElementById('changeDropdown').value = 'discuss';
  document.getElementById('changeText').value     = '';
  document.getElementById('commitment').value     = '';
  document.getElementById('nextSteps').value      = '';
  milestones = ['Kickoff', 'Discovery & Design', 'Delivery', 'Go Live'];
  renderMilestones();
  updatePaymentCustomVisibility();
  updateChangePreview();
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled    = true;
  renderProjects();
  updateCenterHeader();
  showToast('New project started');
}

// ── Persistence ───────────────────────────────────────────
function saveState() {
  const state = captureCurrentState();
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  autoSaveCurrentProject();
  updateCenterHeader();
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s) return false;
    applyState(s);
    return true;
  } catch { return false; }
}

// ── Center header ─────────────────────────────────────────
function updateCenterHeader() {
  const title = document.getElementById('projectTitle').value.trim();
  document.getElementById('centerTitle').textContent = title || 'SOW Generator';
  let sub = title ? '' : 'Start by loading a preset or describing your engagement to the AI';
  if (title) sub = isTeamMode() ? '🔗 Shared with team' : '💾 Local project';
  document.getElementById('centerSub').textContent = sub;
}

// ── Milestone editor ──────────────────────────────────────
function renderMilestones() {
  const wrap = document.getElementById('milestonesWrap');
  wrap.innerHTML = '';
  milestones.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'milestone-row';
    row.innerHTML = `
      ${idx > 0 ? '<span class="milestone-arrow" style="color:var(--muted);font-size:13px;">›</span>' : ''}
      <div class="milestone-num">${idx + 1}</div>
      <input class="milestone-input" type="text" value="${esc(m)}" placeholder="Milestone ${idx + 1}" data-idx="${idx}">
      <button class="milestone-del" title="Remove" data-idx="${idx}"><i class="ti ti-x"></i></button>
    `;
    row.querySelector('.milestone-input').addEventListener('input', e => {
      milestones[idx] = e.target.value;
      saveState();
    });
    row.querySelector('.milestone-del').addEventListener('click', () => {
      if (milestones.length <= 1) { showToast('Need at least one milestone'); return; }
      milestones.splice(idx, 1);
      renderMilestones();
      saveState();
    });
    wrap.appendChild(row);
  });
}

document.getElementById('addMilestoneBtn').addEventListener('click', () => {
  if (milestones.length >= 6) { showToast('Maximum 6 milestones'); return; }
  milestones.push('');
  renderMilestones();
  // Focus the new input
  const inputs = document.querySelectorAll('.milestone-input');
  if (inputs.length) inputs[inputs.length - 1].focus();
});

// ── Payment terms custom field ────────────────────────────
function updatePaymentCustomVisibility() {
  const val = document.getElementById('paymentTerms').value;
  document.getElementById('paymentCustomField').style.display = val === 'custom' ? 'flex' : 'none';
}
document.getElementById('paymentTerms').addEventListener('change', () => {
  updatePaymentCustomVisibility();
  saveState();
});

// ── Change management preview ─────────────────────────────
const CHANGE_TEXT_MAP = {
  'discuss':     'We will discuss and agree any changes to this scope of work before proceeding. Any agreed changes will be documented in writing.',
  'ten-percent': 'Changes within 10% of the agreed scope are included at no additional cost. Any changes beyond that will be agreed in writing before work proceeds.',
};

function updateChangePreview() {
  const dropdown = document.getElementById('changeDropdown');
  const textArea = document.getElementById('changeText');
  const preview  = document.getElementById('changePreview');
  if (dropdown.value === 'custom') {
    textArea.style.display = 'block';
    preview.textContent = '';
  } else {
    textArea.style.display = 'none';
    preview.textContent = CHANGE_TEXT_MAP[dropdown.value] || '';
  }
}

document.getElementById('changeDropdown').addEventListener('change', () => {
  updateChangePreview();
  saveState();
});

document.getElementById('changeText').addEventListener('input', saveState);

function getChangeText() {
  const val = document.getElementById('changeDropdown').value;
  if (val === 'custom') return document.getElementById('changeText').value.trim();
  return CHANGE_TEXT_MAP[val] || '';
}

// ── SOW HTML generation ────────────────────────────────────
function generateWidget() {
  const title        = (document.getElementById('projectTitle').value || '').trim();
  const paymentTerms = document.getElementById('paymentTerms').value;
  const paymentCustom= (document.getElementById('paymentCustom').value || '').trim();
  const engagement   = (document.getElementById('engagement').value   || '').trim();
  const deliverables = (document.getElementById('deliverables').value || '').trim();
  const howWeWork    = (document.getElementById('howWeWork').value     || '').trim();
  const changeText   = getChangeText();
  const commitment   = (document.getElementById('commitment').value   || '').trim();
  const nextSteps    = (document.getElementById('nextSteps').value    || '').trim();

  // Salesbuildr variables — resolved at proposal render time
  const SB_COMPANY  = '{{company.name}}';
  const SB_REF      = '{{quote.number}}';
  const SB_DATE     = '{{date quote.sentAt}}';

  const brandRgb   = hexToRgb(brandColor);
  const brandTint  = `rgba(${brandRgb},0.07)`;
  const brandTint2 = `rgba(${brandRgb},0.12)`;

  // Payment label
  const paymentLabels = {
    'on-completion': 'Due on completion',
    '50-50':         '50% due on engagement start, 50% due on completion',
    'monthly':       'Invoiced monthly',
    'custom':        paymentCustom || 'As agreed'
  };
  const paymentLabel = paymentLabels[paymentTerms] || paymentTerms;

  // Deliverables as bullet list
  const delivLines = deliverables.split('\n').map(l => l.trim()).filter(Boolean);
  const deliverablesHtml = delivLines.length > 0
    ? `<ul style="margin:10px 0 0;padding-left:0;list-style:none;">${
        delivLines.map(l => `<li style="padding:6px 0 6px 20px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;line-height:1.65;position:relative;"><span style="position:absolute;left:0;color:${brandColor};font-weight:700;">›</span>${esc(l)}</li>`).join('')
      }</ul>`
    : '<p style="font-size:13px;color:#94a3b8;font-style:italic;">To be completed.</p>';

  // Timeline milestones strip
  const validMilestones = milestones.filter(m => m.trim());
  const timelineHtml = validMilestones.length > 0
    ? `<div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;margin-top:12px;">
        ${validMilestones.map((m, i) => `
          <div style="display:flex;align-items:center;gap:0;">
            <div style="background:${brandColor};color:#fff;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;white-space:nowrap;">${esc(m)}</div>
            ${i < validMilestones.length - 1 ? `<div style="width:28px;height:2px;background:${brandColor};opacity:0.35;flex-shrink:0;"></div>` : ''}
          </div>
        `).join('')}
      </div>`
    : '';

  // Section helper
  function section(heading, content) {
    return `
<div style="margin-bottom:20px;">
  <h3 style="margin:0 0 10px;font-size:12px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.07em;">${heading}</h3>
  ${content}
</div>`;
  }

  // Build the document
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:100%;color:#0f172a;">

  <!-- Header — company.name, quote.number and quote.sentAt resolved by Salesbuildr at render time -->
  <div style="background:${brandColor};border-radius:8px 8px 0 0;padding:24px 28px 20px;">
    <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;">Statement of Work</div>
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.2;">${esc(title || 'Project Engagement')}</h2>
    <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px;">${SB_COMPANY}</div>
    <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap;">
      <div style="font-size:11px;color:rgba(255,255,255,0.7);"><span style="font-weight:600;color:rgba(255,255,255,0.9);">Reference</span>&nbsp;&nbsp;${SB_REF}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.7);"><span style="font-weight:600;color:rgba(255,255,255,0.9);">Prepared</span>&nbsp;&nbsp;${SB_DATE}</div>
    </div>
  </div>

  <!-- Body -->
  <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:28px;background:#ffffff;">

    ${engagement ? section('The Engagement',
      `<p style="margin:0;font-size:14px;color:#1e293b;line-height:1.75;border-left:3px solid ${brandColor};padding-left:14px;">${esc(engagement)}</p>`
    ) : ''}

    ${delivLines.length > 0 ? section('What We Will Deliver', deliverablesHtml) : ''}

    ${howWeWork ? section('How We Work Together',
      `<p style="margin:0;font-size:13px;color:#334155;line-height:1.75;">${esc(howWeWork)}</p>`
    ) : ''}

    ${validMilestones.length > 0 ? section('Timeline', timelineHtml) : ''}

    <!-- Investment -->
    <div style="margin-bottom:20px;">
      <h3 style="margin:0 0 10px;font-size:12px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.07em;">Investment</h3>
      <div style="background:${brandTint};border:1px solid rgba(${brandRgb},0.2);border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;color:#334155;line-height:1.6;">Full investment details are included in the pricing section of this proposal.</p>
        <div style="font-size:12px;color:${brandColor};font-weight:600;">${esc(paymentLabel)}</div>
      </div>
    </div>

    ${changeText ? section('What Happens If Things Change',
      `<p style="margin:0;font-size:13px;color:#334155;line-height:1.75;">${esc(changeText)}</p>`
    ) : ''}

    ${commitment ? section('Our Commitment',
      `<p style="margin:0;font-size:13px;color:#334155;line-height:1.75;">${esc(commitment)}</p>`
    ) : ''}

    ${nextSteps ? `
    <!-- Next Steps CTA -->
    <div style="background:${brandTint2};border:2px solid ${brandColor};border-radius:8px;padding:20px 24px;text-align:center;margin-top:8px;">
      <div style="font-size:11px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Ready to Proceed?</div>
      <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.65;">${esc(nextSteps)}</p>
    </div>` : ''}

  </div>

</div>`.trim();
}

function autoRefresh() {
  const panels = document.getElementById('outputPanels');
  if (!panels || panels.hidden) return;
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML = html;
}

// ── Salesbuildr credentials ───────────────────────────────
function initSbCredentials() {
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  if (savedApi) document.getElementById('sbApiKey').value = savedApi;
  if (savedInt) document.getElementById('sbIntKey').value = savedInt;
  if (savedApi && savedInt) document.getElementById('sbRemember').checked = true;
  updateSbBtn();
}
function updateSbBtn() {
  document.getElementById('sbPushBtn').disabled = !(
    document.getElementById('sbApiKey').value.trim() &&
    document.getElementById('sbIntKey').value.trim()
  );
}

// ── Presets ───────────────────────────────────────────────
const PRESETS = {
  azure: {
    title: 'Azure Cloud Migration',
    engagement: 'This project moves your on-premises server infrastructure to Microsoft Azure, giving your team cloud-based reliability, scalability, and remote access. We handle everything from design through to go-live — with your environment fully tested and documented before we hand over the keys.',
    deliverables: 'A fully migrated Azure environment, tested and ready for your team to use\nAll servers, applications, and data transferred with zero data loss\nSite-to-site VPN connectivity so your office and cloud environment work as one\nA documented environment your team and any future IT partner can follow\n30-day post-project support window included',
    howWeWork: "We'll assign a named project lead who will be your single point of contact throughout. You'll receive a brief weekly update — no jargon, just progress and what's coming next. To keep things moving, we'll need a named contact on your side who can make decisions and is available for a short call each week.",
    milestones: ['Kickoff & Planning', 'Network & VM Build', 'Migration & Testing', 'Go Live'],
    commitment: "You'll have a named point of contact for the duration of this project. We'll respond to project-related queries within one business day and provide a 30-day support window after go-live.",
    nextSteps: 'To proceed, simply reply to this proposal or contact your account manager. We\'ll schedule a kickoff call to confirm the start date and introductions.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  m365: {
    title: 'Microsoft 365 Migration',
    engagement: 'This project moves your email, files, and collaboration tools to Microsoft 365 — including Exchange Online, SharePoint, Teams, and OneDrive. We take a staged approach that keeps your team working without disruption while we migrate everything in the background.',
    deliverables: 'All mailboxes migrated to Exchange Online with no email loss\nFiles and shared drives moved to SharePoint and OneDrive\nMicrosoft Teams set up and configured for your team\nSecurity and multi-factor authentication in place from day one\nPost-migration support to catch and resolve any issues quickly',
    howWeWork: "We'll run migrations in batches, starting with a small pilot group before rolling out to everyone. Your team will only need to log back in — we handle the technical side. We'll need access to your current mail server and a contact who can coordinate with individual staff members during their cutover.",
    milestones: ['Kickoff & Assessment', 'Pilot Migration', 'Full Rollout', 'Hypercare'],
    commitment: 'A named engineer will own this project from start to finish. We include a 30-day post-migration hypercare period — any issues that come up after cutover are resolved as part of this engagement.',
    nextSteps: 'Reply to this proposal or contact your account manager to confirm your preferred start date. We\'ll schedule a brief kickoff call to review your current environment.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  network: {
    title: 'Network Infrastructure Upgrade',
    engagement: "This project replaces your existing network with modern, business-grade infrastructure — new firewall, managed switches, and wireless access points installed after hours to avoid disrupting your team. The result is a faster, more secure network that's designed to grow with your business.",
    deliverables: 'New next-generation firewall installed and configured with your security policies\nManaged switches deployed with proper traffic segmentation\nWireless access points providing reliable coverage across your site\nAll workstations and printers reconnected and tested\nFull network documentation including diagrams and device inventory',
    howWeWork: "Installation work happens outside business hours so your team isn't affected. We'll confirm the installation window with you at least a week in advance and keep you updated throughout. We'll need site access and a contact number for the night of installation.",
    milestones: ['Survey & Design', 'Procurement', 'Installation', 'Testing & Sign-off'],
    commitment: "We guarantee zero disruption to business hours. If anything doesn't work correctly at sign-off, we resolve it before we leave site.",
    nextSteps: 'Approve this proposal to confirm your installation date. We\'ll arrange a site survey within the week.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  endpoint: {
    title: 'Endpoint Refresh & Device Deployment',
    engagement: "This project replaces your aging workstations and laptops with modern, supported hardware ahead of the Windows 10 end-of-life deadline. Every device will be pre-configured, data migrated, and handed to each user ready to work — with minimal disruption to their day.",
    deliverables: 'All devices pre-imaged with your standard software build\nUser data, email profiles, and application settings migrated to each new device\nBitLocker encryption and security policies applied to every device\nOld devices securely wiped and responsibly disposed of\nUpdated asset register reflecting the new hardware',
    howWeWork: "We'll work through devices in waves — typically by department or floor — so we're not disrupting everyone at once. Each user gets a brief handover walkthrough on their new device. We'll need a complete device list and access to users' current machines ahead of the refresh.",
    milestones: ['Inventory & Imaging', 'Wave 1 Deployment', 'Remaining Waves', 'Sign-off'],
    commitment: 'Every device is fully tested before handover. If a user has an issue in the first 30 days, we resolve it at no additional cost.',
    nextSteps: 'Confirm this proposal to reserve your deployment dates. We\'ll send a device inventory form within 24 hours.',
    changeDropdown: 'ten-percent',
    paymentTerms: '50-50'
  },
  server: {
    title: 'Server Refresh & Hardware Deployment',
    engagement: "This project replaces your server hardware with new, warrantied equipment — migrating all roles, services, and data with minimal downtime. Your team will notice nothing except that things run faster.",
    deliverables: 'New server hardware installed, configured, and integrated into your environment\nAll server roles, services, and applications migrated and verified\nBackup solution configured and initial backup completed on new hardware\nFull environment documentation updated for the new infrastructure\nOld hardware decommissioned and securely disposed of',
    howWeWork: "The migration itself happens out of hours to avoid disruption. We'll spend the days before staging and testing, so the actual cutover window is as short as possible. We'll need a maintenance window date confirmed in advance and your sign-off before we decommission any old hardware.",
    milestones: ['Assessment & Planning', 'Hardware Staging', 'Migration Night', 'Validation & Sign-off'],
    commitment: "We don't sign off until everything is working. If any issue arises within 30 days of the migration, we'll resolve it as part of this engagement.",
    nextSteps: 'Reply to confirm your preferred maintenance window. We\'ll schedule a pre-migration walkthrough call once confirmed.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  voip: {
    title: 'VoIP & Business Communications Upgrade',
    engagement: "This project replaces your existing phone system with a modern cloud-based communications platform — giving your team reliable calls from anywhere, Microsoft Teams integration, and professional features like auto-attendants and voicemail to email. Number porting and full cutover are included.",
    deliverables: 'Your existing phone numbers ported to the new system with no interruption to incoming calls\nAuto-attendant and call routing configured to your requirements\nAll handsets provisioned and users trained\nMicrosoft Teams voice integration so staff can call from their laptops and mobiles\nPost-cutover support to resolve any call quality or routing issues',
    howWeWork: "Number porting has a fixed timeline — we'll manage this with your carrier and keep you informed at each stage. The cutover itself happens out of hours. We'll need a list of your current numbers, call flows, and the names of staff who need direct lines.",
    milestones: ['Audit & Design', 'Number Porting', 'Configuration', 'Cutover & Training'],
    commitment: 'We monitor the system closely in the 48 hours after cutover. Any call quality or routing issues in the first 30 days are resolved at no additional cost.',
    nextSteps: 'Approve this proposal to begin the number porting process — this is the longest lead time item and we\'ll kick it off immediately.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  onboarding: {
    title: 'New Client Onboarding',
    engagement: "This project onboards your organisation onto our managed services platform — deploying monitoring, security, backup, and support systems across your environment. From day one, your team will have a proactive, responsive IT partner who knows your systems inside and out.",
    deliverables: 'All devices enrolled in our remote monitoring and management platform\nEndpoint protection deployed and active on every device\nBackup solution configured and verified across your servers and endpoints\nMulti-factor authentication enforced and security baseline in place\nFull environment documentation completed and stored securely',
    howWeWork: "We'll schedule a kickoff call to meet your team and understand your priorities. The technical work is largely invisible to your staff — we deploy agents remotely where possible. We'll need admin access to your environment and a point of contact for each site.",
    milestones: ['Kickoff & Discovery', 'Platform Deployment', 'Security & Backup', '30-Day Review'],
    commitment: 'Once onboarded, you are covered by our full managed services SLA. Your team will have a direct line to our helpdesk and a named account manager.',
    nextSteps: 'Approve this proposal to schedule your kickoff call. We aim to complete onboarding within the agreed timeframe from kickoff.',
    changeDropdown: 'discuss',
    paymentTerms: 'monthly'
  },
  security: {
    title: 'Cybersecurity Assessment',
    engagement: "This engagement delivers a thorough assessment of your current cybersecurity posture — identifying the vulnerabilities, gaps, and risks that matter most to your business. You'll receive a clear findings report and a prioritised roadmap, written for decision-makers as well as your technical team.",
    deliverables: 'External attack surface assessment identifying internet-facing vulnerabilities\nInternal vulnerability scan of your network, servers, and endpoints\nActive Directory and email security review\nExecutive findings report — clear, non-technical, actionable\nPrioritised remediation roadmap with effort and impact estimates',
    howWeWork: "The assessment is largely non-intrusive and happens in the background. We'll need read-only access to key systems and a half-day with your IT team at the start. The findings presentation is a working session — bring your decision-makers.",
    milestones: ['Scoping & Access', 'Assessment', 'Analysis', 'Findings Presentation'],
    commitment: 'All findings are presented in person and followed up in writing. The report is yours to keep and share. Our team is available for questions after the presentation.',
    nextSteps: 'Approve this proposal to schedule your assessment window. We\'ll send a brief pre-assessment questionnaire within 24 hours.',
    changeDropdown: 'discuss',
    paymentTerms: 'on-completion'
  },
  backup: {
    title: 'Backup & Disaster Recovery Implementation',
    engagement: "This project designs and deploys a comprehensive backup and disaster recovery solution — covering your servers, endpoints, and cloud data with tested, documented recovery procedures. You'll have the confidence that comes from knowing your data is protected and your business can recover quickly from any incident.",
    deliverables: 'Backup solution deployed and protecting all agreed systems and data\nOff-site cloud replication configured for your critical data\nMicrosoft 365 data (email, SharePoint, Teams) backed up separately\nDocumented recovery runbook tested and signed off\nAdmin training so your team understands what\'s protected and how to recover',
    howWeWork: "We'll start with a requirements conversation to understand your RPO and RTO goals before recommending a solution. We'll need maintenance windows to run the initial backup and recovery tests — these are scheduled in advance at times that suit you.",
    milestones: ['Design & Procurement', 'Deployment', 'Recovery Testing', 'Handover'],
    commitment: 'We don\'t sign off until a recovery test has been completed and documented. The solution will meet the RPO and RTO requirements agreed at the start of this engagement.',
    nextSteps: 'Approve this proposal to schedule your requirements session. We\'ll have a solution design ready within five business days.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  },
  copilot: {
    title: 'Microsoft Copilot Readiness & Deployment',
    engagement: "This project prepares your Microsoft 365 environment for Copilot and deploys it to your team in a way that's safe, governed, and actually used. Before Copilot can be activated, your data needs to be properly governed — we handle the preparation that most deployments skip, then train your team to get genuine value from it.",
    deliverables: 'Microsoft 365 data governance review and sensitivity labelling in place before Copilot is activated\nCopilot deployed to a pilot group with monitored usage and feedback\nRole-specific training so your team knows how Copilot helps their actual job\nBroadened rollout with department-level adoption sessions\nAI acceptable use policy template for your team to adopt',
    howWeWork: "We'll involve your team at the pilot stage — real users giving real feedback before the wider rollout. We'll need access to your Microsoft 365 admin centre and a willing group of 5–15 pilot users. Updates go directly to your nominated IT lead.",
    milestones: ['Readiness & Governance', 'Pilot Deployment', 'Pilot Review', 'Broad Rollout'],
    commitment: "We won't activate Copilot until your data governance is ready. If pilot users identify issues that need resolving before broad rollout, we address them within this engagement.",
    nextSteps: 'Approve this proposal to schedule your readiness assessment. We\'ll provide a Microsoft 365 readiness questionnaire within 24 hours.',
    changeDropdown: 'discuss',
    paymentTerms: '50-50'
  }
};

// ── Template wiring ───────────────────────────────────────
document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
  if (!isTeamMode()) promptForPassphrase('save templates');
  const def  = document.getElementById('projectTitle').value.trim() || 'My Template';
  const name = prompt('Name this template:', def);
  if (!name?.trim()) return;
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
      const all = localGetAll();
      const existing = all.findIndex(t => t.name === trimmed);
      if (existing >= 0) { if (!confirm(`Replace local template "${trimmed}"?`)) { btn.disabled = false; return; } all[existing] = entry; } else { all.push(entry); }
      localSaveAll(all); showToast(`"${trimmed}" saved locally`);
    }
    await renderTemplateSelect(); document.getElementById('templateSelect').value = trimmed;
  } catch { showToast('⚠️ Save failed — try again'); } finally { btn.disabled = false; }
});

document.getElementById('loadTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  const btn  = document.getElementById('loadTemplateBtn'); btn.disabled = true;
  try {
    let tmpl;
    if (isTeamMode()) { tmpl = await teamGetTemplate(hashPassphrase(getPassphrase()), name); }
    else { tmpl = localGetAll().find(t => t.name === name) || null; }
    if (!tmpl) { showToast('Template not found'); return; }
    if (!confirm(`Load "${name}"? Current SOW will be replaced.`)) return;
    applyState(tmpl); showToast(`"${name}" loaded`);
    saveCurrentAsProject(tmpl.projectTitle); renderProjects();
  } catch { showToast('⚠️ Load failed — try again'); } finally { btn.disabled = false; }
});

document.getElementById('deleteTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  const isTeam = isTeamMode();
  if (!confirm(isTeam ? `Delete team template "${name}"? This removes it for everyone.` : `Delete local template "${name}"?`)) return;
  const btn = document.getElementById('deleteTemplateBtn'); btn.disabled = true;
  try {
    if (isTeam) { await teamDeleteTemplate(hashPassphrase(getPassphrase()), name); }
    else { localSaveAll(localGetAll().filter(t => t.name !== name)); }
    await renderTemplateSelect(false); showToast(`"${name}" deleted`);
  } catch { showToast('⚠️ Delete failed — try again'); } finally { btn.disabled = false; }
});

// ── Salesbuildr ───────────────────────────────────────────
const sbToggleBtn = document.getElementById('sbToggle');
const sbArrow     = document.getElementById('sbArrow');
const sbBody      = document.getElementById('sbBody');
const sbPushBtn   = document.getElementById('sbPushBtn');
const sbResult    = document.getElementById('sbResult');

sbToggleBtn.addEventListener('click', () => {
  const open = !sbBody.hidden; sbBody.hidden = open;
  sbArrow.classList.toggle('open', !open);
});
document.getElementById('sbApiKey').addEventListener('input', updateSbBtn);
document.getElementById('sbIntKey').addEventListener('input', updateSbBtn);

sbPushBtn.addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent.trim();
  if (!html) { showToast('Generate the document first'); document.getElementById('generateBtn').click(); return; }
  const apiKey = document.getElementById('sbApiKey').value.trim();
  const intKey = document.getElementById('sbIntKey').value.trim();
  if (!apiKey || !intKey) return;
  if (document.getElementById('sbRemember').checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }
  sbPushBtn.disabled = true; sbPushBtn.textContent = 'Saving…'; sbResult.hidden = true;
  const title  = (document.getElementById('projectTitle').value || 'Statement of Work').trim();
  const prefix = document.getElementById('sbPrefix').value.trim();
  try {
    const res  = await fetch('/api/push-widgets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ widgets:[{ id:'sow-document', title, html }], prefix, apiKey, integrationKey:intKey }) });
    const data = await res.json();
    if (data.successCount > 0) {
      sbResult.textContent = `✓ Saved as "${prefix ? prefix + ' – ' : ''}${title}" in Salesbuildr.`;
      sbResult.className = 'sb-result ok'; sbResult.hidden = false; sbPushBtn.textContent = '✓ Saved';
    } else { throw new Error((data.results?.[0]?.error) || data.error || 'Unknown error'); }
  } catch (e) {
    sbResult.textContent = `✕ ${e.message}`; sbResult.className = 'sb-result error'; sbResult.hidden = false;
    sbPushBtn.disabled = false; sbPushBtn.textContent = 'Push →';
  }
});

// ── AI Assistant ──────────────────────────────────────────
let aiPendingMode = null;

function addAiMessage(role, html, extraClass = '') {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}${extraClass ? ' ' + extraClass : ''}`;
  div.innerHTML = role === 'assistant'
    ? `<div class="ai-msg-label">Assistant</div>${html}`
    : `<div class="ai-msg-label" style="text-align:right">You</div>${html}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addAiTyping() {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-typing'; div.id = 'aiTyping';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function removeAiTyping() {
  const el = document.getElementById('aiTyping'); if (el) el.remove();
}

async function sendAiMessage(userText, mode) {
  if (!userText.trim()) return;
  const btn = document.getElementById('aiSendBtn');
  btn.disabled = true;
  addAiMessage('user', esc(userText).replace(/\n/g, '<br>'));
  addAiTyping();

  try {
    const payload = { mode: mode || 'chat', message: userText };
    if (mode === 'review' || mode === 'improve') {
      payload.currentSow = captureCurrentState();
    }

    const res  = await fetch(API_AI, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    removeAiTyping();
    if (!res.ok) throw new Error(data.error || 'AI error');

    if (mode === 'generate' && data.sections) {
      // Show preview of sections returned
      const preview = Object.entries(data.sections).slice(0, 4).map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        const snippet = typeof v === 'string' ? v.slice(0, 80) + (v.length > 80 ? '…' : '') : (Array.isArray(v) ? v.join(' › ') : '');
        return `<div class="ai-task-item"><strong>${esc(label)}</strong> — ${esc(snippet)}</div>`;
      }).join('');

      const msgDiv = document.createElement('div');
      msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
        ${esc(data.message || 'Here\'s your SOW — review and edit any section, then generate.')}
        <div class="ai-task-list">${preview}</div>
        <button class="ai-apply-btn" id="aiApplyGenBtn"><i class="ti ti-check" style="font-size:13px;"></i> Apply to editor</button>`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      document.getElementById('aiApplyGenBtn').addEventListener('click', () => {
        applyState({ ...captureCurrentState(), ...data.sections });
        showToast('SOW applied — review and edit each section');
        addAiMessage('assistant', '✅ Applied to editor. Review each section and generate when ready.');
      });

    } else if (mode === 'review' && data.feedback) {
      const feedbackHtml = (data.feedback || []).map(f => {
        const cls = f.type === 'warning' ? 'ai-feedback-warning' : f.type === 'ok' ? 'ai-feedback-ok' : 'ai-feedback-suggestion';
        const icon = f.type === 'warning' ? '⚠️' : f.type === 'ok' ? '✓' : '💡';
        return `<div class="ai-feedback-item ${cls}">${icon} ${esc(f.text)}</div>`;
      }).join('');
      addAiMessage('assistant', `${esc(data.summary || '')}<div style="margin-top:8px">${feedbackHtml}</div>`);

    } else if (mode === 'improve' && data.improved) {
      const field = data.field;
      const fieldLabels = {
        engagement: 'Engagement', deliverables: 'Deliverables', howWeWork: 'How We Work Together',
        commitment: 'Our Commitment', nextSteps: 'Next Steps'
      };
      const label = fieldLabels[field] || field;
      const msgDiv = document.createElement('div');
      msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
        Here's an improved version of <strong>${esc(label)}</strong>:
        <div style="margin:8px 0;padding:10px;background:var(--bg);border-radius:7px;border:1px solid var(--line);font-size:12px;line-height:1.6;color:var(--text);">${esc(data.improved)}</div>
        <button class="ai-apply-btn" id="aiApplyImproveBtn"><i class="ti ti-check" style="font-size:13px;"></i> Replace in editor</button>`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      document.getElementById('aiApplyImproveBtn').addEventListener('click', () => {
        if (field && document.getElementById(field)) {
          document.getElementById(field).value = data.improved;
          if (field === 'deliverables') {
            // No extra handling needed — textarea
          }
          saveState(); autoRefresh();
          showToast(`${label} updated`);
          addAiMessage('assistant', `✅ ${label} updated.`);
        }
      });

    } else {
      // Chat / plain text
      addAiMessage('assistant', esc(data.text || '').replace(/\n/g, '<br>'));
    }

  } catch (err) {
    removeAiTyping();
    const errDiv = document.createElement('div');
    errDiv.className = 'ai-msg-error';
    errDiv.textContent = '⚠️ ' + (err.message || 'Something went wrong. Please try again.');
    document.getElementById('aiMessages').appendChild(errDiv);
  } finally {
    btn.disabled = false;
    aiPendingMode = null;
  }
}

// Convert from Scope: reads sb_projects_v1 and shows a picker
function showScopePicker() {
  let scopeProjects = [];
  try { scopeProjects = JSON.parse(localStorage.getItem('sb_projects_v1')) || []; } catch {}

  if (scopeProjects.length === 0) {
    addAiMessage('assistant', 'No Scope Builder projects found in this browser. Open the <a href="project-scope.html" style="color:var(--accent)">Scope Builder</a> first to create one, then come back to convert it.');
    return;
  }

  const pickerHtml = scopeProjects.map((p, i) => {
    const color = PROJ_COLORS[i % PROJ_COLORS.length];
    const tasks = (p.rows || []).filter(r => Number(r.hours) > 0).length;
    return `<div class="scope-picker-item" data-idx="${i}">
      <div class="scope-picker-dot" style="background:${color}"></div>
      <div class="scope-picker-info">
        <div class="scope-picker-name">${esc(p.projectTitle || 'Untitled project')}</div>
        <div class="scope-picker-meta">${esc(p.customerName || 'No customer')} · ${tasks} tasks</div>
      </div>
    </div>`;
  }).join('');

  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-msg ai-msg-assistant';
  msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
    Choose a Scope Builder project to convert into a SOW:
    <div class="scope-picker">${pickerHtml}</div>`;
  document.getElementById('aiMessages').appendChild(msgDiv);
  document.getElementById('aiMessages').scrollTop = 99999;

  msgDiv.querySelectorAll('.scope-picker-item').forEach(item => {
    item.addEventListener('click', async () => {
      const idx = parseInt(item.dataset.idx, 10);
      const scopeProject = scopeProjects[idx];
      addAiMessage('user', `Convert "${esc(scopeProject.projectTitle || 'this project')}" to a SOW`);
      addAiTyping();
      const btn = document.getElementById('aiSendBtn');
      btn.disabled = true;

      try {
        const res = await fetch(API_AI, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'convert', scopeProject })
        });
        const data = await res.json();
        removeAiTyping();
        if (!res.ok) throw new Error(data.error || 'AI error');

        if (data.sections) {
          const msgDiv2 = document.createElement('div');
          msgDiv2.className = 'ai-msg ai-msg-assistant';
          msgDiv2.innerHTML = `<div class="ai-msg-label">Assistant</div>
            ${esc(data.message || 'SOW generated from your scope. Review each section before generating.')}
            <button class="ai-apply-btn" id="aiApplyConvertBtn" style="margin-top:10px;"><i class="ti ti-check" style="font-size:13px;"></i> Apply to editor</button>`;
          document.getElementById('aiMessages').appendChild(msgDiv2);
          document.getElementById('aiMessages').scrollTop = 99999;

          document.getElementById('aiApplyConvertBtn').addEventListener('click', () => {
            // Merge scope metadata with AI-generated sections
            const newState = {
              ...captureCurrentState(),
              projectTitle: scopeProject.projectTitle || '',
              customerName: scopeProject.customerName || '',
              ...data.sections
            };
            applyState(newState);
            saveCurrentAsProject(newState.projectTitle);
            renderProjects();
            showToast('SOW applied from Scope Builder project');
            addAiMessage('assistant', '✅ Applied. Review each section and adjust where needed, then generate.');
          });
        }

      } catch (err) {
        removeAiTyping();
        const errDiv = document.createElement('div');
        errDiv.className = 'ai-msg-error';
        errDiv.textContent = '⚠️ ' + (err.message || 'Conversion failed. Please try again.');
        document.getElementById('aiMessages').appendChild(errDiv);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// AI send
document.getElementById('aiSendBtn').addEventListener('click', () => {
  const input = document.getElementById('aiInput');
  const text  = input.value.trim();
  if (!text) return;
  const mode = aiPendingMode || 'chat';
  input.value = '';
  input.placeholder = 'Describe your engagement or ask me to review…';
  aiPendingMode = null;
  sendAiMessage(text, mode);
});

document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('aiSendBtn').click(); }
});

// AI chips
document.querySelectorAll('.ai-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const action = chip.dataset.action;
    const input  = document.getElementById('aiInput');
    if (action === 'generate') {
      aiPendingMode = 'generate';
      input.placeholder = 'Describe the engagement e.g. "Azure migration for a 60-person accounting firm, mix of on-prem servers and M365"';
      input.focus();
      addAiMessage('assistant', 'Describe the engagement and I\'ll write all sections of the SOW in plain business English. Include any details about the customer, scale, or key outcomes.');
    } else if (action === 'review') {
      aiPendingMode = 'review';
      addAiMessage('assistant', 'I\'ll review your current SOW for tone, clarity, and completeness. Add any specific concerns or just send to begin.');
      input.placeholder = 'Any specific concerns? Or press send to review…';
      input.value = 'Please review my current SOW';
      input.focus();
    } else if (action === 'improve') {
      aiPendingMode = 'improve';
      input.placeholder = 'Which section to improve? e.g. "improve the engagement paragraph" or "rewrite our commitment"';
      input.focus();
      addAiMessage('assistant', 'Tell me which section to improve — Engagement, Deliverables, How We Work Together, Our Commitment, or Next Steps — and I\'ll rewrite it in cleaner, more confident business language.');
    } else if (action === 'convert') {
      showScopePicker();
    }
  });
});

// ── Event listeners ───────────────────────────────────────
['projectTitle','engagement','deliverables','howWeWork','commitment','nextSteps','paymentCustom'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => { saveState(); autoRefresh(); updateCenterHeader(); });
});

// Preset loader
document.getElementById('loadPresetBtn').addEventListener('click', () => {
  const key = document.getElementById('presetSelect').value;
  if (!key) { showToast('Select a preset first'); return; }
  const p = PRESETS[key];
  if (!p) return;
  if (!confirm(`Load "${p.title}" preset? Current SOW will be replaced.`)) return;
  applyState({
    projectTitle:   p.title,
    customerName:   '',
    sowNumber:      document.getElementById('sowNumber').value, // keep current
    paymentTerms:   p.paymentTerms || 'on-completion',
    paymentCustom:  '',
    engagement:     p.engagement,
    deliverables:   p.deliverables,
    howWeWork:       p.howWeWork,
    changeDropdown: p.changeDropdown || 'discuss',
    changeText:     '',
    commitment:     p.commitment,
    nextSteps:      p.nextSteps,
    milestones:     p.milestones
  });
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled    = true;
  saveState(); showToast(`Loaded: ${p.title}`);
  saveCurrentAsProject(p.title); renderProjects();
});

// New project
document.getElementById('newProjectBtn').addEventListener('click', newProject);

// Clear
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear this project and start fresh?')) return;
  newProject();
});

// Generate
document.getElementById('generateBtn').addEventListener('click', () => {
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML   = html;
  document.getElementById('outputPanels').hidden = false;
  document.getElementById('copyBtn').disabled    = false;
  showToast('SOW generated'); saveState();
});

// Close output
document.getElementById('closeOutputBtn').addEventListener('click', () => {
  document.getElementById('outputPanels').hidden = true;
});

// Copy
document.getElementById('copyBtn').addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent;
  if (!html.trim()) return;
  try {
    await navigator.clipboard.writeText(html);
    showToast('Copied to clipboard');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = html; ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Copied (fallback)');
  }
});

// Export JSON
document.getElementById('exportBtn').addEventListener('click', () => {
  const state = captureCurrentState();
  const slug  = (state.projectTitle || 'sow').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const json  = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download  = `${slug}-sow.json`; a.click(); URL.revokeObjectURL(a.href);
});

// Import JSON
document.getElementById('importInput').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!confirm(`Import "${data.projectTitle || file.name}"? Current SOW will be replaced.`)) return;
      applyState(data); showToast(`Imported: ${data.projectTitle || file.name}`);
      saveCurrentAsProject(data.projectTitle); renderProjects();
    } catch { alert('Could not read this file — make sure it is a valid SOW JSON export.'); }
  };
  reader.readAsText(file); e.target.value = '';
});

// Passphrase
document.getElementById('tmplPassphrase').addEventListener('input', async () => {
  updatePassphraseUI();
  await renderTemplateSelect();
  updateCenterHeader();
});

// ── Init ──────────────────────────────────────────────────
(async function init() {
  const hasSaved = loadState();
  if (!hasSaved) {
    milestones = ['Kickoff', 'Discovery & Design', 'Delivery', 'Go Live'];
    renderMilestones();
    updateChangePreview();
  }
  updatePassphraseUI();
  updateCenterHeader();
  renderProjects();
  initBrandColor();
  setupBrandColorListeners();
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('copyBtn').disabled    = true;
  await renderTemplateSelect();
  initSbCredentials();
})();
