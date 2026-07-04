// ═══════════════════════════════════════════════════════════
// Business Review Builder — business-review.js
// ═══════════════════════════════════════════════════════════

/* ─────────────────────────────────────────────────────────
   1. CONSTANTS
   ───────────────────────────────────────────────────────── */

const REVIEW_PERIODS = ['Q1 2026','Q2 2026','Q3 2026','Q4 2026','H1 2026','H2 2026','Annual 2026','Custom'];
const REVIEW_TYPES = ['Quarterly Review','Annual Review','Strategic Review','Project Review'];
const INDUSTRIES = ['Healthcare','Legal','Financial Services','Manufacturing','Construction','Nonprofit','Professional Services','Real Estate','Retail','Education','Government / Public Sector','Technology'];

const THEMES = [
  { name: 'Navy',     hex: '#0f1f3d' },
  { name: 'Blue',     hex: '#2E74DC' },
  { name: 'Slate',    hex: '#475569' },
  { name: 'Emerald',  hex: '#065f46' },
  { name: 'Teal',     hex: '#0f766e' },
  { name: 'Crimson',  hex: '#991B1B' },
  { name: 'Amber',    hex: '#92400e' },
  { name: 'Charcoal', hex: '#1a1a1a' }
];

const SERVICE_LIBRARY = [
  'Security Awareness Training','Endpoint Detection & Response (EDR)','Multi-Factor Authentication Rollout',
  'Workstation Refresh Programme','Server Refresh / Modernisation','Cloud Backup & Disaster Recovery',
  'Microsoft 365 Migration','Email Security & Anti-Phishing','Network Assessment','Vulnerability Management',
  'Cyber Essentials / Compliance Certification','Password Manager Deployment','VoIP / Unified Communications',
  'Business Continuity Planning','Dark Web Monitoring','Firewall Upgrade'
];

const GAP_OPTIONS = [
  'Outdated hardware','Elevated risk level','Missing MFA','Expiring licences','No formal DR plan',
  'Low staff security awareness','Unpatched systems','No compliance certification','Ageing servers','Limited monitoring coverage'
];

// Section order matches presentation slide order (recommendedServices is widget-only, no slide)
const SECTIONS = [
  { key: 'periodInReview',      title: 'Period in Review',        desc: 'Support stats — tickets, response times, uptime, SLA.', always: false, widgetOnly: false },
  { key: 'securityPosture',     title: 'Security Posture Update', desc: 'Threats blocked, incidents, training, current risk level.', always: false, widgetOnly: false },
  { key: 'whatWeDelivered',     title: 'What We Delivered',       desc: 'Projects completed, key wins, problems solved.', always: false, widgetOnly: false },
  { key: 'technologyHealth',    title: 'Technology Health',       desc: 'Endpoints, end-of-life items, licensing, overall rating.', always: false, widgetOnly: false },
  { key: 'lookingAhead',        title: 'Looking Ahead',           desc: 'Priorities, planned projects, strategic focus.', always: false, widgetOnly: false },
  { key: 'investmentSummary',   title: 'Investment Summary',      desc: 'Current investment, value framing, next period.', always: false, widgetOnly: false },
  { key: 'recommendedServices', title: 'Recommended Services',    desc: 'Service gaps and recommendations — widget only, bridges to a QBR+ Proposal.', always: false, widgetOnly: true }
];

const SECTION_TITLES = Object.fromEntries(SECTIONS.map(s => [s.key, s.title]));

const FIELD_DEFS = {
  periodInReview: [
    { key: 'ticketsResolved', label: 'Tickets resolved', type: 'number', optional: true },
    { key: 'avgResponseTime', label: 'Average response time', type: 'text', placeholder: 'e.g. 14 minutes' },
    { key: 'avgResolutionTime', label: 'Average resolution time', type: 'text', placeholder: 'e.g. 2.4 hours' },
    { key: 'uptime', label: 'Uptime / availability', type: 'text', placeholder: 'e.g. 99.97%' },
    { key: 'slaCompliance', label: 'SLA compliance', type: 'text', placeholder: 'e.g. 98.2%' },
    { key: 'usersSupported', label: 'Users supported', type: 'number', optional: true },
    { key: 'devicesManaged', label: 'Devices managed', type: 'number', optional: true },
    { key: 'keyHighlight', label: 'Key highlight', type: 'textarea', placeholder: '1–2 sentences — the standout moment of the period', span2: true }
  ],
  securityPosture: [
    { key: 'threatsBlocked', label: 'Threats blocked / detected', type: 'number', optional: true },
    { key: 'securityIncidents', label: 'Security incidents', type: 'number', optional: true },
    { key: 'incidentsResolved', label: 'Incidents resolved', type: 'number', optional: true },
    { key: 'phishingSims', label: 'Phishing simulations run', type: 'number', optional: true },
    { key: 'staffTrained', label: 'Staff trained', type: 'text', placeholder: 'Number or %', optional: true },
    { key: 'riskLevel', label: 'Current risk level', type: 'dropdown', options: ['Low','Medium','Medium-High','High'] },
    { key: 'improvements', label: 'Security improvements made', type: 'textarea', span2: true },
    { key: 'outstandingRisks', label: 'Outstanding risks', type: 'textarea', span2: true, optional: true }
  ],
  whatWeDelivered: [
    { key: 'projectsCompleted', label: 'Projects completed', type: 'textarea', placeholder: 'One per line', span2: true },
    { key: 'keyWins', label: 'Key wins', type: 'textarea', span2: true },
    { key: 'problemsSolved', label: 'Problems solved', type: 'textarea', span2: true },
    { key: 'hoursOfProjectWork', label: 'Hours of project work', type: 'number', optional: true }
  ],
  technologyHealth: [
    { key: 'endpointsManaged', label: 'Endpoints managed', type: 'number', optional: true },
    { key: 'eolItems', label: 'End-of-life items identified', type: 'number', optional: true },
    { key: 'eolDetails', label: 'EOL details', type: 'textarea', span2: true, optional: true },
    { key: 'licensingStatus', label: 'Licensing status', type: 'dropdown', options: ['All current','Some expiring','Action needed'] },
    { key: 'expiringLicences', label: 'Expiring licences', type: 'textarea', span2: true, optional: true },
    { key: 'stackCurrency', label: 'Stack currency', type: 'dropdown', options: ['Fully current','Minor updates needed','Major refresh required'] },
    { key: 'overallHealthRating', label: 'Overall health rating', type: 'dropdown', options: ['Excellent','Good','Fair','Action Required'] }
  ],
  lookingAhead: [
    { key: 'priority1', label: 'Priority 1', type: 'text' },
    { key: 'priority2', label: 'Priority 2', type: 'text' },
    { key: 'priority3', label: 'Priority 3', type: 'text', optional: true },
    { key: 'plannedProjects', label: 'Planned projects', type: 'textarea', span2: true },
    { key: 'strategicFocus', label: 'Strategic focus', type: 'dropdown', options: ['Security','Compliance','Cloud','Modernisation','Cost Optimisation','Growth Enablement'] },
    { key: 'timeframe', label: 'Timeframe', type: 'dropdown', options: ['Next quarter','Next 6 months','Next 12 months','Next 24 months'] }
  ],
  investmentSummary: [
    { key: 'currentMonthlyInvestment', label: 'Current monthly investment', type: 'text', placeholder: 'e.g. $2,400/month', optional: true },
    { key: 'periodTotal', label: 'Period total', type: 'text', placeholder: 'e.g. $28,800', optional: true },
    { key: 'valueFraming', label: 'Value framing note', type: 'textarea', span2: true, optional: true },
    { key: 'proposedNextPeriod', label: 'Proposed next period', type: 'text', optional: true },
    { key: 'budgetNarrative', label: 'Budget narrative', type: 'dropdown', options: ['No change proposed','Minor adjustment','Investment increase recommended'] }
  ],
  recommendedServices: [
    { key: 'gapsIdentified', label: 'Gaps identified', type: 'chips', options: GAP_OPTIONS, span2: true },
    { key: 'servicesToHighlight', label: 'Services to highlight', type: 'chips', options: SERVICE_LIBRARY, span2: true },
    { key: 'customRecommendation', label: 'Custom recommendation', type: 'text', optional: true },
    { key: 'framing', label: 'Framing', type: 'dropdown', options: ['For your consideration','Recommended this quarter','Critical — action required'] }
  ]
};

const MAX_SESSIONS = 5;

/* ─────────────────────────────────────────────────────────
   2. STATE
   ───────────────────────────────────────────────────────── */

let state = {
  sessions: [],       // index entries from the picker
  current: null,      // full current session object
  saving: false
};

function blankSession() {
  const sections = {};
  SECTIONS.forEach(s => { sections[s.key] = { enabled: false, inputs: {} }; });
  return {
    id: 'rev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    clientName: '',
    reviewPeriod: REVIEW_PERIODS[0],
    reviewType: REVIEW_TYPES[0],
    mspName: '',
    industry: INDUSTRIES[0],
    logoBase64: null,
    colorTheme: THEMES[1].hex,
    sections,
    generated: null,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/* ─────────────────────────────────────────────────────────
   3. UTILITIES
   ───────────────────────────────────────────────────────── */

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2600);
}

function splitStat(str) {
  // "847 tickets resolved" -> { value: "847", label: "tickets resolved" }
  const s = String(str || '').trim();
  const m = s.match(/^(\$?[\d,]+(?:\.\d+)?%?)\s*(.*)$/);
  if (m && m[1]) return { value: m[1], label: m[2] || '' };
  return { value: '', label: s };
}

function getSlideChips(key, data) {
  if (!data) return [];
  switch (key) {
    case 'periodInReview':  return data.stats || [];
    case 'securityPosture': return data.highlights || [];
    case 'whatWeDelivered': return data.wins || [];
    case 'technologyHealth': return data.alerts || [];
    case 'lookingAhead':    return data.priorities || [];
    default: return [];
  }
}

function badgeClassForRisk(risk) {
  if (!risk) return null;
  const r = risk.toLowerCase();
  if (r.includes('high')) return 'br-badge-danger';
  if (r.includes('medium')) return 'br-badge-warn';
  return 'br-badge-good';
}
function badgeClassForRating(rating) {
  if (!rating) return null;
  const r = rating.toLowerCase();
  if (r === 'excellent' || r === 'good') return 'br-badge-good';
  if (r === 'fair') return 'br-badge-warn';
  return 'br-badge-danger';
}

/* ─────────────────────────────────────────────────────────
   4. SESSION PERSISTENCE (Netlify Blobs via /api/business-review-data)
   ───────────────────────────────────────────────────────── */

async function apiData(action, payload) {
  const res = await fetch('/api/business-review-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  let data;
  try { data = await res.json(); } catch { data = { ok: false, error: 'Invalid server response.' }; }
  if (!data.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function loadSessionIndex() {
  try {
    const data = await apiData('list', {});
    state.sessions = data.sessions || [];
  } catch (e) {
    state.sessions = [];
    showToast('Could not load saved reviews: ' + e.message);
  }
}

async function loadSession(id) {
  const data = await apiData('get', { id });
  return data.session;
}

const saveSessionDebounced = debounce(saveSessionNow, 900);

function scheduleSave() {
  if (!state.current) return;
  state.saving = true;
  saveSessionDebounced();
}

async function saveSessionNow() {
  if (!state.current) return;
  try {
    await apiData('save', { session: state.current });
    flashSaved();
  } catch (e) {
    showToast('Could not save: ' + e.message);
  } finally {
    state.saving = false;
  }
}

function flashSaved() {
  const el = $('#saveIndicator');
  el.classList.add('show');
  clearTimeout(flashSaved._t);
  flashSaved._t = setTimeout(() => el.classList.remove('show'), 1600);
}

async function archiveSession(id) {
  await apiData('archive', { id });
}

async function deleteSession(id) {
  await apiData('delete', { id });
}

/* ─────────────────────────────────────────────────────────
   5. LOGO UPLOAD + CLIENT-SIDE COMPRESSION
   ───────────────────────────────────────────────────────── */

function handleLogoFile(file) {
  if (!file) return;
  const MAX_BYTES = 200 * 1024;
  if (file.size <= MAX_BYTES) {
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
    return;
  }
  // Compress: downscale + re-encode as JPEG until under threshold
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = 500;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length * 0.75 > MAX_BYTES && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      setLogo(dataUrl);
    };
    img.onerror = () => showToast('Could not read that image file.');
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function setLogo(dataUrl) {
  state.current.logoBase64 = dataUrl;
  renderLogoPreview(dataUrl);
  scheduleSave();
}

function renderLogoPreview(dataUrl) {
  const img = $('#logoPreview');
  const removeBtn = $('#btnRemoveLogo');
  if (dataUrl) {
    img.src = dataUrl; img.hidden = false; removeBtn.hidden = false;
  } else {
    img.hidden = true; removeBtn.hidden = true;
  }
}

/* ─────────────────────────────────────────────────────────
   6. RENDER: SESSION PICKER
   ───────────────────────────────────────────────────────── */

function renderPicker() {
  const grid = $('#pickerGrid');
  grid.innerHTML = '';

  const active = state.sessions.filter(s => !s.archived);

  active.forEach(s => {
    const card = document.createElement('div');
    card.className = 'picker-card';
    card.innerHTML = `
      <div class="picker-card-name">${escapeHtml(s.clientName || 'Untitled review')}</div>
      <div class="picker-card-meta">${escapeHtml(s.reviewType || '')} · ${escapeHtml(s.reviewPeriod || '')}</div>
      <div class="picker-card-updated">Updated ${new Date(s.updatedAt).toLocaleDateString()}</div>
    `;
    card.addEventListener('click', () => openSession(s.id));
    grid.appendChild(card);
  });

  const newCard = document.createElement('div');
  newCard.className = 'picker-card picker-card-new';
  newCard.textContent = active.length >= MAX_SESSIONS ? 'Archive a review to start a new one' : '+ New Review';
  if (active.length < MAX_SESSIONS) newCard.addEventListener('click', startNewSession);
  grid.appendChild(newCard);

  if (active.length === 0) {
    // keep grid tidy; new-card tile still shown
  }
}

function showPicker() {
  $('#viewPicker').hidden = false;
  $('#viewBuilder').hidden = true;
  loadSessionIndex().then(renderPicker);
}

async function openSession(id) {
  try {
    const session = await loadSession(id);
    state.current = session;
    showBuilder();
  } catch (e) {
    showToast('Could not open that review: ' + e.message);
  }
}

function startNewSession() {
  state.current = blankSession();
  showBuilder();
}

/* ─────────────────────────────────────────────────────────
   7. RENDER: BUILDER FORM
   ───────────────────────────────────────────────────────── */

function fillSelect(el, options) {
  el.innerHTML = options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
}

function showBuilder() {
  $('#viewPicker').hidden = true;
  $('#viewBuilder').hidden = false;
  populateBuilderChrome();
  renderBuilderForm();
}

function populateBuilderChrome() {
  if (!$('#fReviewPeriod').dataset.filled) {
    fillSelect($('#fReviewPeriod'), REVIEW_PERIODS);
    fillSelect($('#fReviewType'), REVIEW_TYPES);
    fillSelect($('#fIndustry'), INDUSTRIES);
    $('#fReviewPeriod').dataset.filled = '1';
  }
}

function renderBuilderForm() {
  const s = state.current;
  document.documentElement.style.setProperty('--theme', s.colorTheme);

  $('#fClientName').value = s.clientName || '';
  $('#fReviewPeriod').value = s.reviewPeriod;
  $('#fReviewType').value = s.reviewType;
  $('#fMspName').value = s.mspName || '';
  $('#fIndustry').value = s.industry;
  renderLogoPreview(s.logoBase64);

  renderThemeRow();
  renderSectionCards();
  renderAllSectionForms();
  renderOutput();
}

function renderThemeRow() {
  const row = $('#themeRow');
  row.innerHTML = '';
  THEMES.forEach(t => {
    const sw = document.createElement('div');
    sw.className = 'theme-swatch' + (state.current.colorTheme.toLowerCase() === t.hex.toLowerCase() ? ' active' : '');
    sw.style.background = t.hex;
    sw.title = t.name;
    sw.addEventListener('click', () => setTheme(t.hex));
    row.appendChild(sw);
  });
  const customWrap = document.createElement('div');
  customWrap.className = 'theme-custom-wrap';
  const isPreset = THEMES.some(t => t.hex.toLowerCase() === state.current.colorTheme.toLowerCase());
  customWrap.innerHTML = `
    <input type="color" id="themeCustomPicker" value="${isPreset ? '#2e74dc' : state.current.colorTheme}">
    <input type="text" id="themeCustomHex" placeholder="#hex" value="${!isPreset ? escapeHtml(state.current.colorTheme) : ''}">
  `;
  row.appendChild(customWrap);
  $('#themeCustomPicker', row).addEventListener('input', e => setTheme(e.target.value));
  $('#themeCustomHex', row).addEventListener('change', e => {
    const v = e.target.value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) setTheme(v);
    else showToast('Enter a valid hex colour, e.g. #2E74DC');
  });
}

function setTheme(hex) {
  state.current.colorTheme = hex;
  document.documentElement.style.setProperty('--theme', hex);
  renderThemeRow();
  scheduleSave();
}

function renderSectionCards() {
  const wrap = $('#sectionCards');
  wrap.innerHTML = '';
  SECTIONS.forEach(sec => {
    const enabled = state.current.sections[sec.key].enabled;
    const card = document.createElement('div');
    card.className = 'section-card' + (enabled ? ' on' : '');
    card.innerHTML = `
      <div>
        <div class="section-card-title">${escapeHtml(sec.title)}</div>
        <div class="section-card-desc">${escapeHtml(sec.desc)}</div>
      </div>
      <label class="switch">
        <input type="checkbox" ${enabled ? 'checked' : ''} data-section="${sec.key}">
        <span class="switch-track"></span>
      </label>
    `;
    const checkbox = $('input', card);
    checkbox.addEventListener('change', () => toggleSection(sec.key, checkbox.checked));
    card.addEventListener('click', e => {
      if (e.target === checkbox) return;
      checkbox.checked = !checkbox.checked;
      toggleSection(sec.key, checkbox.checked);
    });
    wrap.appendChild(card);
  });
}

function toggleSection(key, on) {
  state.current.sections[key].enabled = on;
  renderSectionCards();
  renderAllSectionForms();
  scheduleSave();
}

function renderAllSectionForms() {
  const wrap = $('#sectionForms');
  wrap.innerHTML = '';
  SECTIONS.forEach(sec => {
    if (!state.current.sections[sec.key].enabled) return;
    wrap.appendChild(buildSectionFormPanel(sec));
  });
}

function buildSectionFormPanel(sec) {
  const panel = document.createElement('div');
  panel.className = 'panel section-form open';
  const fields = FIELD_DEFS[sec.key];
  const inputs = state.current.sections[sec.key].inputs;

  const fieldsHtml = fields.map(f => renderFieldHtml(sec.key, f, inputs[f.key])).join('');

  panel.innerHTML = `
    <div class="panel-kicker">${escapeHtml(sec.title)}</div>
    <div class="section-form-fields">${fieldsHtml}</div>
    ${sec.key === 'recommendedServices' ? `<div class="callout">These recommendations are based on gaps identified in your review. Add the actual service line items in Salesbuildr from your services catalog.</div>` : ''}
  `;

  wireFieldEvents(panel, sec.key);
  return panel;
}

function renderFieldHtml(sectionKey, f, value) {
  const spanClass = f.span2 ? ' span-2' : '';
  const optTag = f.optional ? ' <span class="field-optional-tag">(optional)</span>' : '';
  const id = `f_${sectionKey}_${f.key}`;

  if (f.type === 'textarea') {
    return `<label class="field${spanClass}"><span>${escapeHtml(f.label)}${optTag}</span>
      <textarea id="${id}" data-key="${f.key}" placeholder="${escapeHtml(f.placeholder || '')}">${escapeHtml(value || '')}</textarea></label>`;
  }
  if (f.type === 'dropdown') {
    const opts = f.options.map(o => `<option value="${escapeHtml(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
    return `<label class="field${spanClass}"><span>${escapeHtml(f.label)}${optTag}</span>
      <select id="${id}" data-key="${f.key}">${opts}</select></label>`;
  }
  if (f.type === 'chips') {
    const selected = Array.isArray(value) ? value : [];
    const chips = f.options.map(o => `<span class="chip${selected.includes(o) ? ' active' : ''}" data-val="${escapeHtml(o)}">${escapeHtml(o)}</span>`).join('');
    return `<div class="field${spanClass}"><span>${escapeHtml(f.label)}${optTag}</span>
      <div class="chip-group" id="${id}" data-key="${f.key}">${chips}</div></div>`;
  }
  // text / number
  return `<label class="field${spanClass}"><span>${escapeHtml(f.label)}${optTag}</span>
    <input type="${f.type === 'number' ? 'number' : 'text'}" id="${id}" data-key="${f.key}" placeholder="${escapeHtml(f.placeholder || '')}" value="${escapeHtml(value || '')}"></label>`;
}

function wireFieldEvents(panel, sectionKey) {
  $all('input[data-key], textarea[data-key], select[data-key]', panel).forEach(el => {
    const evt = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const key = el.dataset.key;
      state.current.sections[sectionKey].inputs[key] = el.value;
      scheduleSave();
    });
  });
  $all('.chip-group', panel).forEach(group => {
    const key = group.dataset.key;
    $all('.chip', group).forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const selected = $all('.chip.active', group).map(c => c.dataset.val);
        state.current.sections[sectionKey].inputs[key] = selected;
        scheduleSave();
      });
    });
  });
}

/* ─────────────────────────────────────────────────────────
   8. GENERATE
   ───────────────────────────────────────────────────────── */

function activeSectionKeys() {
  return SECTIONS.filter(s => state.current.sections[s.key].enabled).map(s => s.key);
}

async function generateReview(regenerateOnly) {
  const s = state.current;
  if (!s.clientName || !s.clientName.trim()) {
    showToast('Add a client name before generating.');
    return;
  }
  const keys = regenerateOnly || activeSectionKeys();
  if (!keys.length) {
    showToast('Toggle on at least one section first.');
    return;
  }

  setLoading(true, 'Building your business review…');
  try {
    const payload = {
      clientName: s.clientName,
      reviewPeriod: s.reviewPeriod,
      reviewType: s.reviewType,
      mspName: s.mspName,
      industry: s.industry,
      sections: {}
    };
    keys.forEach(k => { payload.sections[k] = s.sections[k].inputs; });

    const res = await fetch('/api/business-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: payload })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Generation failed.');

    s.generated = { ...(s.generated || {}), ...data.generated };
    scheduleSave();
    renderOutput();
    showToast(regenerateOnly ? 'Section regenerated.' : 'Business review generated.');
  } catch (e) {
    showToast('Could not generate: ' + e.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(on, text) {
  $('#loadingOverlay').hidden = !on;
  if (text) $('#loadingText').textContent = text;
}

/* ─────────────────────────────────────────────────────────
   9. RENDER: GENERATED OUTPUT
   ───────────────────────────────────────────────────────── */

function renderOutput() {
  const s = state.current;
  const has = s.generated && Object.keys(s.generated).length;
  $('#outputEmpty').hidden = !!has;
  $('#outputContent').hidden = !has;
  if (!has) return;

  const wrap = $('#generatedSections');
  wrap.innerHTML = '';

  SECTIONS.forEach(sec => {
    if (!s.sections[sec.key].enabled) return;
    const data = s.generated[sec.key];
    if (!data) return;
    wrap.appendChild(buildGeneratedSectionEl(sec, data));
  });
}

function buildGeneratedSectionEl(sec, data) {
  const el = document.createElement('div');
  el.className = 'generated-section';
  const chips = getSlideChips(sec.key, data);
  const statsHtml = chips.length ? `<div class="generated-stats-row">${
    chips.slice(0, 3).map(c => {
      const { value, label } = splitStat(c);
      return `<div class="generated-stat"><div class="generated-stat-val">${escapeHtml(value)}</div><div class="generated-stat-label">${escapeHtml(label)}</div></div>`;
    }).join('')
  }</div>` : '';

  el.innerHTML = `
    <div class="generated-section-head">
      <span class="generated-section-title">${escapeHtml(sec.title)}${sec.widgetOnly ? ' · widget only' : ''}</span>
    </div>
    <input type="text" class="headline-edit" value="${escapeHtml(data.headline || '')}" data-field="headline">
    ${statsHtml}
    <textarea class="narrative-edit" data-field="narrative">${escapeHtml(data.narrative || '')}</textarea>
    <div class="generated-actions">
      <button class="btn-secondary regen-btn">Regenerate</button>
      <button class="btn-secondary copy-btn">Copy widget HTML</button>
      <button class="btn-accent push-btn">Push widget</button>
    </div>
  `;

  $('.headline-edit', el).addEventListener('input', e => { data.headline = e.target.value; scheduleSave(); });
  $('.narrative-edit', el).addEventListener('input', e => { data.narrative = e.target.value; scheduleSave(); });
  $('.regen-btn', el).addEventListener('click', () => generateReview([sec.key]));
  $('.copy-btn', el).addEventListener('click', () => copyWidgetHtml(sec.key));
  $('.push-btn', el).addEventListener('click', () => pushWidgets([sec.key]));

  return el;
}

/* ─────────────────────────────────────────────────────────
   10. PRESENTATION — full-screen slideshow (pattern from salesdeck.html)
   ───────────────────────────────────────────────────────── */

const PRESENTATION_ORDER = ['periodInReview','securityPosture','whatWeDelivered','technologyHealth','lookingAhead','investmentSummary'];

function buildCoverSlideHtml(s) {
  const logo = s.logoBase64 ? `<div class="br-cover-logo"><img src="${s.logoBase64}" alt="logo"></div>` : '';
  return `
  <div class="br-slide br-cover" data-index="0">
    <div class="br-slide-body">
      ${logo}
      <div class="br-cover-kicker">${escapeHtml(s.reviewType)} · ${escapeHtml(s.reviewPeriod)}</div>
      <div class="br-cover-headline">${escapeHtml(s.clientName)}</div>
      <div class="br-cover-sub">${s.logoBase64 ? '' : escapeHtml(s.mspName || '')}</div>
      <div class="br-cover-date">${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>`;
}

function buildContentSlideHtml(sec, data, s, index, total) {
  const chips = getSlideChips(sec.key, data);
  const statsHtml = chips.length ? `<div class="br-stats-row">${
    chips.slice(0, 3).map(c => {
      const { value, label } = splitStat(c);
      return `<div class="br-stat"><div class="br-stat-value">${escapeHtml(value)}</div><div class="br-stat-label">${escapeHtml(label)}</div></div>`;
    }).join('')
  }</div>` : '';

  let badge = '';
  if (data.riskLevel) badge = `<span class="br-badge ${badgeClassForRisk(data.riskLevel)}">${escapeHtml(data.riskLevel)} risk</span>`;
  if (data.rating) badge = `<span class="br-badge ${badgeClassForRating(data.rating)}">${escapeHtml(data.rating)}</span>`;

  const headerBrand = s.logoBase64
    ? `<img src="${s.logoBase64}" alt="${escapeHtml(s.mspName || 'logo')}">`
    : `<span>${escapeHtml(s.mspName || '')}</span>`;

  return `
  <div class="br-slide" data-index="${index}">
    <div class="br-slide-header">
      <div class="br-client-name">${escapeHtml(s.clientName)}</div>
      <div class="br-msp-brand">${headerBrand}</div>
    </div>
    <div class="br-slide-body">
      <div class="br-section-kicker">
        <div class="br-section-title">${escapeHtml(data.headline || sec.title)}</div>
        ${badge}
      </div>
      ${statsHtml}
      <div class="br-narrative">${escapeHtml(data.narrative || '')}</div>
    </div>
    <div class="br-slide-footer">
      <span class="br-slide-company">${escapeHtml(s.mspName || 'Business Review')}</span>
      <span class="br-slide-counter">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
  </div>`;
}

function buildDeckSlides(s) {
  const slides = [];
  const activeContent = PRESENTATION_ORDER.filter(k => s.sections[k] && s.sections[k].enabled && s.generated && s.generated[k]);
  const total = activeContent.length + 1;
  slides.push(buildCoverSlideHtml(s));
  activeContent.forEach((key, i) => {
    const sec = SECTIONS.find(x => x.key === key);
    slides.push(buildContentSlideHtml(sec, s.generated[key], s, i + 1, total));
  });
  return slides;
}

let deckState = { cur: 0, total: 0 };

function openDeck() {
  const s = state.current;
  if (!s.generated) { showToast('Generate the review first.'); return; }
  document.documentElement.style.setProperty('--theme', s.colorTheme);
  const root = $('#brDeckRoot');
  root.style.setProperty('--theme', s.colorTheme);
  const deck = $('#brDeck');
  deck.innerHTML = buildDeckSlides(s).join('');
  deckState.total = $all('.br-slide', deck).length;
  deckState.cur = 0;
  root.hidden = false;
  goToSlide(0);
  if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
}

function closeDeck() {
  const root = $('#brDeckRoot');
  root.hidden = true;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function goToSlide(n) {
  const slides = $all('.br-slide', $('#brDeck'));
  if (!slides.length) return;
  slides[deckState.cur] && slides[deckState.cur].classList.remove('active');
  deckState.cur = Math.max(0, Math.min(n, slides.length - 1));
  slides[deckState.cur].classList.add('active');
  $('#brPrev').classList.toggle('hidden', deckState.cur === 0);
  $('#brNext').classList.toggle('hidden', deckState.cur === slides.length - 1);
  $('#brProgress').style.width = (slides.length > 1 ? (deckState.cur / (slides.length - 1)) * 100 : 0) + '%';
}

function initDeckControls() {
  $('#brPrev').addEventListener('click', () => goToSlide(deckState.cur - 1));
  $('#brNext').addEventListener('click', () => goToSlide(deckState.cur + 1));
  $('#brClose').addEventListener('click', closeDeck);
  $('#brDeck').addEventListener('click', () => goToSlide(deckState.cur + 1));
  document.addEventListener('keydown', e => {
    if ($('#brDeckRoot').hidden) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goToSlide(deckState.cur + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goToSlide(deckState.cur - 1); }
    if (e.key === 'Escape') closeDeck();
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !$('#brDeckRoot').hidden) closeDeck();
  });
}

function printReview() {
  const s = state.current;
  if (!s.generated) { showToast('Generate the review first.'); return; }
  document.documentElement.style.setProperty('--theme', s.colorTheme);
  const root = $('#brDeckRoot');
  root.style.setProperty('--theme', s.colorTheme);
  const deck = $('#brDeck');
  deck.innerHTML = buildDeckSlides(s).join('');
  $all('.br-slide', deck).forEach(sl => sl.classList.add('active')); // all visible for print
  root.hidden = false;
  setTimeout(() => {
    window.print();
  }, 60);
}

window.addEventListener('afterprint', () => {
  if (!document.fullscreenElement) closeDeck();
});

/* ─────────────────────────────────────────────────────────
   11. WIDGETS — TinyMCE/Salesbuildr-safe HTML
   ───────────────────────────────────────────────────────── */

function buildWidgetHtml(key, session) {
  const data = session.generated && session.generated[key];
  if (!data) return '';
  const theme = session.colorTheme || '#2E74DC';

  if (key === 'recommendedServices') {
    const recs = data.recommendations || [];
    const rows = recs.map(r => `
      <div style="padding:8px 0;border-bottom:1px solid #E5E7EB;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0b1220;">${escapeHtml(r.name || '')}</span>
        ${r.urgency ? `<span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${theme};margin-left:8px;">${escapeHtml(r.urgency)}</span>` : ''}
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#586273;margin-top:2px;">${escapeHtml(r.reason || '')}</div>
      </div>`).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;padding:16px 18px;">
      <h5 style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;color:#0b1220;font-size:15px;">${escapeHtml(data.headline || 'For Your Consideration')}</h5>
      <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
      ${rows}
    </div>`;
  }

  const chips = getSlideChips(key, data).slice(0, 3);
  let statsTable = '';
  if (chips.length) {
    const cells = chips.map(c => {
      const { value, label } = splitStat(c);
      return `<td width="${Math.floor(100 / chips.length)}%" style="padding:10px 8px;text-align:center;vertical-align:top;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:${theme};">${escapeHtml(value)}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#586273;margin-top:2px;">${escapeHtml(label)}</div>
      </td>`;
    }).join('');
    statsTable = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;"><tr>${cells}</tr></table>`;
  }

  let badge = '';
  if (data.riskLevel) badge = `<span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#b3760a;background:#FEF3C7;border-radius:20px;padding:3px 10px;margin-bottom:6px;">${escapeHtml(data.riskLevel)} risk</span>`;
  if (data.rating) badge = `<span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#15a05a;background:#DCFCE7;border-radius:20px;padding:3px 10px;margin-bottom:6px;">${escapeHtml(data.rating)}</span>`;

  return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;padding:16px 18px;">
    <h5 style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;color:#0b1220;font-size:15px;">${escapeHtml(data.headline || SECTION_TITLES[key])}</h5>
    ${badge}
    ${statsTable}
    <p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
  </div>`;
}

function widgetTitle(key, session) {
  const client = session.clientName || 'Client';
  return `${client} — Review — ${SECTION_TITLES[key]}`;
}

function copyWidgetHtml(key) {
  const html = buildWidgetHtml(key, state.current);
  if (!html) { showToast('Generate this section first.'); return; }
  navigator.clipboard.writeText(html).then(() => showToast('Copied ✓')).catch(() => showToast('Could not copy to clipboard.'));
}

function copyAllWidgets() {
  const keys = activeSectionKeys().filter(k => state.current.generated && state.current.generated[k]);
  if (!keys.length) { showToast('Generate the review first.'); return; }
  const html = keys.map(k => buildWidgetHtml(k, state.current)).join('\n<br>\n');
  navigator.clipboard.writeText(html).then(() => showToast('Copied ✓')).catch(() => showToast('Could not copy to clipboard.'));
}

/* ─────────────────────────────────────────────────────────
   12. PUSH TO SALESBUILDR
   ───────────────────────────────────────────────────────── */

function hasCredentials() {
  return !!(localStorage.getItem('sb_api_key') && localStorage.getItem('sb_tenant_url'));
}

function openCredModal(onSave) {
  const modal = $('#credModal');
  modal.hidden = false;
  $('#credApiKey').value = localStorage.getItem('sb_api_key') || '';
  $('#credTenantUrl').value = localStorage.getItem('sb_tenant_url') || '';
  const cleanup = () => { modal.hidden = true; saveBtn.removeEventListener('click', save); cancelBtn.removeEventListener('click', cancel); };
  const saveBtn = $('#credSave'), cancelBtn = $('#credCancel');
  function save() {
    const key = $('#credApiKey').value.trim();
    const url = $('#credTenantUrl').value.trim();
    if (!key || !url) { showToast('Both fields are required.'); return; }
    localStorage.setItem('sb_api_key', key);
    localStorage.setItem('sb_tenant_url', url);
    cleanup();
    onSave();
  }
  function cancel() { cleanup(); }
  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', cancel);
}

async function pushWidgets(keys) {
  const validKeys = keys.filter(k => state.current.generated && state.current.generated[k]);
  if (!validKeys.length) { showToast('Generate this section first.'); return; }

  if (!hasCredentials()) {
    openCredModal(() => pushWidgets(keys));
    return;
  }

  const widgets = validKeys.map(k => ({
    type: 'html',
    content: buildWidgetHtml(k, state.current),
    title: widgetTitle(k, state.current)
  }));

  setLoading(true, 'Pushing to Salesbuildr…');
  try {
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgets,
        prefix: `${state.current.clientName} — Review`,
        apiKey: localStorage.getItem('sb_api_key'),
        tenantUrl: localStorage.getItem('sb_tenant_url')
      })
    });
    const data = await res.json();
    if (!data.ok && !(data.successCount > 0)) throw new Error(data.error || 'Push failed.');
    showToast(`Pushed ${widgets.length} widget${widgets.length > 1 ? 's' : ''} to Salesbuildr ✓`);
  } catch (e) {
    showToast('Push failed: ' + e.message);
  } finally {
    setLoading(false);
  }
}

function pushPack() {
  const keys = activeSectionKeys().filter(k => state.current.generated && state.current.generated[k]);
  if (!keys.length) { showToast('Generate the review first.'); return; }
  pushWidgets(keys);
}

/* ─────────────────────────────────────────────────────────
   13. INIT
   ───────────────────────────────────────────────────────── */

function wireStaticEvents() {
  $('#btnNewReview').addEventListener('click', () => {
    if (state.sessions.filter(s => !s.archived).length >= MAX_SESSIONS) {
      showToast('Maximum of 5 active reviews. Archive one first.');
      return;
    }
    startNewSession();
  });
  $('#btnAllReviews').addEventListener('click', showPicker);

  $('#fClientName').addEventListener('input', e => { state.current.clientName = e.target.value; scheduleSave(); });
  $('#fReviewPeriod').addEventListener('change', e => { state.current.reviewPeriod = e.target.value; scheduleSave(); });
  $('#fReviewType').addEventListener('change', e => { state.current.reviewType = e.target.value; scheduleSave(); });
  $('#fMspName').addEventListener('input', e => { state.current.mspName = e.target.value; scheduleSave(); });
  $('#fIndustry').addEventListener('change', e => { state.current.industry = e.target.value; scheduleSave(); });

  $('#fLogo').addEventListener('change', e => handleLogoFile(e.target.files[0]));
  $('#btnRemoveLogo').addEventListener('click', () => { $('#fLogo').value = ''; setLogo(null); });

  $('#btnGenerate').addEventListener('click', () => generateReview());
  $('#btnRegenerateAll').addEventListener('click', () => generateReview());
  $('#btnPresent').addEventListener('click', openDeck);
  $('#btnPrint').addEventListener('click', printReview);
  $('#btnCopyAll').addEventListener('click', copyAllWidgets);
  $('#btnPushPack').addEventListener('click', pushPack);

  initDeckControls();
}

function init() {
  wireStaticEvents();
  showPicker();
}

document.addEventListener('DOMContentLoaded', init);
