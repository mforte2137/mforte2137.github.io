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
    { key: 'periodTotal', label: 'Period total', type: 'text', placeholder: 'Auto-calculated from monthly — edit to override', optional: true },
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

function isStatLike(str) {
  return !!splitStat(str).value;
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

function periodMonthsFor(reviewPeriod) {
  if (!reviewPeriod) return null;
  if (/^Q/i.test(reviewPeriod)) return 3;
  if (/^H/i.test(reviewPeriod)) return 6;
  if (/^Annual/i.test(reviewPeriod)) return 12;
  return null; // Custom or unrecognized — don't auto-calculate
}

function parseCurrencyNumber(str) {
  if (!str) return null;
  const m = String(str).replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function formatCurrencyNumber(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function recalcInvestmentTotal() {
  const sec = state.current.sections.investmentSummary;
  if (!sec || !sec.enabled) return;
  const totalInput = document.getElementById('f_investmentSummary_periodTotal');
  if (!totalInput || totalInput.dataset.autoCalc === 'false') return;
  const months = periodMonthsFor(state.current.reviewPeriod);
  const monthly = parseCurrencyNumber(sec.inputs.currentMonthlyInvestment);
  if (months && monthly !== null) {
    const total = formatCurrencyNumber(monthly * months);
    totalInput.value = total;
    totalInput.dataset.autoCalc = 'true';
    sec.inputs.periodTotal = total;
    sec.inputs._totalAutoCalc = true;
    scheduleSave();
  }
}

function narrativeToBullets(narrative) {
  if (!narrative) return [];
  const sentences = narrative.match(/[^.!?]+[.!?]+(\s|$)/g) || [narrative];
  const trimmed = sentences.map(s => s.trim()).filter(Boolean);
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length > 4) {
    const head = trimmed.slice(0, 3);
    const tail = trimmed.slice(3).join(' ');
    return [...head, tail];
  }
  return trimmed;
}

/* ─────────────────────────────────────────────────────────
   4. SESSION PERSISTENCE — browser localStorage only.
   Nothing is sent to or stored on a server, so different MSPs
   using this tool never see each other's reviews — each
   browser only ever sees what was created in it. To move a
   review to another computer or hand it to a colleague, use
   Export Session (.json) / Import Session (.json), or
   Download Presentation (.html) for the finished deck.
   ───────────────────────────────────────────────────────── */

const LS_INDEX_KEY = 'businessReview.sessionIndex';
const lsSessionKey = id => `businessReview.session.${id}`;

function lsReadIndex() {
  try { return JSON.parse(localStorage.getItem(LS_INDEX_KEY)) || []; }
  catch { return []; }
}
function lsWriteIndex(index) {
  localStorage.setItem(LS_INDEX_KEY, JSON.stringify(index));
}
function lsReadSession(id) {
  try { return JSON.parse(localStorage.getItem(lsSessionKey(id))); }
  catch { return null; }
}
function lsWriteSession(session) {
  localStorage.setItem(lsSessionKey(session.id), JSON.stringify(session));
}
function lsDeleteSession(id) {
  localStorage.removeItem(lsSessionKey(id));
}

async function loadSessionIndex() {
  state.sessions = lsReadIndex();
}

async function loadSession(id) {
  const session = lsReadSession(id);
  if (!session) throw new Error("That review isn't in this browser's storage. If it was created on a different computer, ask for its exported .json file and use Import Session.");
  return session;
}

const saveSessionDebounced = debounce(saveSessionNow, 400);

function scheduleSave() {
  if (!state.current) return;
  state.saving = true;
  saveSessionDebounced();
}

async function saveSessionNow() {
  if (!state.current) return;
  try {
    state.current.updatedAt = new Date().toISOString();
    lsWriteSession(state.current);

    const index = lsReadIndex();
    const existingIdx = index.findIndex(s => s.id === state.current.id);
    const indexEntry = {
      id: state.current.id,
      clientName: state.current.clientName || 'Untitled review',
      reviewPeriod: state.current.reviewPeriod || '',
      reviewType: state.current.reviewType || '',
      archived: !!state.current.archived,
      updatedAt: state.current.updatedAt
    };
    if (existingIdx >= 0) index[existingIdx] = indexEntry;
    else index.push(indexEntry);
    lsWriteIndex(index);
    state.sessions = index;

    flashSaved();
  } catch (e) {
    if (e && e.name === 'QuotaExceededError') {
      showToast("This browser's storage is full. Archive or delete an older review, or remove the logo, then try again.");
    } else {
      showToast('Could not save: ' + e.message);
    }
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
  const session = lsReadSession(id);
  if (!session) return;
  session.archived = true;
  session.updatedAt = new Date().toISOString();
  lsWriteSession(session);
  const index = lsReadIndex().map(s => s.id === id ? { ...s, archived: true, updatedAt: session.updatedAt } : s);
  lsWriteIndex(index);
}

async function deleteSession(id) {
  lsDeleteSession(id);
  const index = lsReadIndex().filter(s => s.id !== id);
  lsWriteIndex(index);
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
      <div class="picker-card-actions">
        <button type="button" class="picker-card-action" data-action="archive">Archive</button>
        <button type="button" class="picker-card-action" data-action="delete">Delete</button>
      </div>
    `;
    card.addEventListener('click', () => openSession(s.id));
    $('[data-action="archive"]', card).addEventListener('click', async e => {
      e.stopPropagation();
      await archiveSession(s.id);
      showToast('Review archived.');
      loadSessionIndex().then(renderPicker);
    });
    $('[data-action="delete"]', card).addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(`Delete the review for ${s.clientName || 'this client'}? This can't be undone.`)) return;
      await deleteSession(s.id);
      showToast('Review deleted.');
      loadSessionIndex().then(renderPicker);
    });
    grid.appendChild(card);
  });

  const newCard = document.createElement('div');
  newCard.className = 'picker-card picker-card-new';
  newCard.textContent = active.length >= MAX_SESSIONS ? 'Archive a review to start a new one' : '+ New Review';
  if (active.length < MAX_SESSIONS) newCard.addEventListener('click', startNewSession);
  grid.appendChild(newCard);
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

  if (sec.key === 'investmentSummary') {
    const totalInput = $('#f_investmentSummary_periodTotal', panel);
    if (totalInput) {
      const autoFlag = inputs._totalAutoCalc !== false;
      totalInput.dataset.autoCalc = autoFlag ? 'true' : 'false';
    }
  }

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
      if (sectionKey === 'investmentSummary' && key === 'periodTotal') {
        el.dataset.autoCalc = 'false';
        state.current.sections.investmentSummary.inputs._totalAutoCalc = false;
      }
      if (sectionKey === 'investmentSummary' && key === 'currentMonthlyInvestment') {
        recalcInvestmentTotal();
      }
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
    if (!regenerateOnly) scrollOutputIntoView();
    showToast(regenerateOnly ? 'Section regenerated.' : 'Business review generated.');
  } catch (e) {
    showToast('Could not generate: ' + e.message);
  } finally {
    setLoading(false);
  }
}

function scrollOutputIntoView() {
  const container = document.querySelector('.builder-output');
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'smooth' });
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

    <div class="widget-preview-label">Widget preview</div>
    <div class="widget-preview-surface"></div>
    <textarea class="widget-html-source" readonly hidden></textarea>

    <div class="generated-actions">
      <button class="btn-secondary regen-btn">Regenerate</button>
      <button class="btn-secondary html-toggle-btn">Show HTML</button>
      <button class="btn-secondary copy-btn">Copy widget HTML</button>
      <button class="btn-accent push-btn">Push widget</button>
    </div>
  `;

  const previewSurface = $('.widget-preview-surface', el);
  const htmlSource = $('.widget-html-source', el);

  function refreshPreview() {
    const html = buildWidgetHtml(sec.key, state.current);
    // Direct innerHTML injection, same as the Technology Roadmap tool —
    // the widget HTML is fully inline-styled already, so it renders
    // correctly sitting right in the page without needing an iframe.
    previewSurface.innerHTML = html || '<div class="widget-preview-empty">Nothing generated yet.</div>';
    htmlSource.value = html;
  }

  $('.headline-edit', el).addEventListener('input', e => { data.headline = e.target.value; scheduleSave(); refreshPreview(); });
  $('.narrative-edit', el).addEventListener('input', e => { data.narrative = e.target.value; scheduleSave(); refreshPreview(); });
  $('.regen-btn', el).addEventListener('click', () => generateReview([sec.key]));
  $('.html-toggle-btn', el).addEventListener('click', e => {
    const willShow = htmlSource.hidden;
    htmlSource.hidden = !willShow;
    e.target.textContent = willShow ? 'Hide HTML' : 'Show HTML';
  });
  $('.copy-btn', el).addEventListener('click', () => copyWidgetHtml(sec.key));
  $('.push-btn', el).addEventListener('click', () => pushWidgets([sec.key]));

  refreshPreview();

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

  const bullets = narrativeToBullets(data.narrative);
  const narrativeHtml = bullets.length > 1
    ? `<ul class="br-narrative-list">${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
    : `<p class="br-narrative">${escapeHtml(data.narrative || '')}</p>`;

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
      ${narrativeHtml}
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

   Shared building blocks used by every section's widget, so
   the modern look confirmed on Security Posture stays
   consistent everywhere rather than drifting per section.
   All colour fills use bgcolor + inline style redundantly —
   TinyMCE/PDF export has been seen stripping inline
   "background" alone on spans, bgcolor on a table cell
   survives more reliably.
   ───────────────────────────────────────────────────────── */

function widgetHeaderBand(theme, kicker, headline, badgeHtml) {
  return `<table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td bgcolor="${theme}" style="background:${theme};padding:16px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.04em;color:#ffffff;">${escapeHtml(kicker)}</td>
        ${badgeHtml ? `<td align="right">${badgeHtml}</td>` : ''}
      </tr></table>
      <h5 style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:16px;">${escapeHtml(headline)}</h5>
    </td>
  </tr></table>`;
}

function widgetPillBadge(text, bg, fg) {
  return `<table cellpadding="0" cellspacing="0"><tr><td bgcolor="${bg}" style="background:${bg};border-radius:20px;padding:3px 10px;">
    <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${fg};">${escapeHtml(text)}</span>
  </td></tr></table>`;
}

function widgetStatsRow(items, theme) {
  if (!items.length) return '';
  const cells = items.map(s => {
    const { value, label } = splitStat(s);
    return `<td width="${Math.floor(100 / items.length)}%" bgcolor="#FFFFFF" style="text-align:center;padding:8px 4px;vertical-align:top;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:${theme};">${escapeHtml(value)}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#586273;margin-top:2px;">${escapeHtml(label)}</div>
    </td>`;
  }).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>${cells}</tr></table>`;
}

// One full-width row per item (icon cell + text cell) rather than several
// items squeezed side by side in one row — long phrases get the whole
// row's width instead of a cramped fraction of it.
function widgetListRows(items, opts) {
  opts = opts || {};
  const bg = opts.bg || '#DCFCE7';
  const fg = opts.fg || '#15a05a';
  const mark = opts.mark || '&#10003;';
  return items.map(item => `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;"><tr>
      <td width="24" valign="top" style="padding:2px 0;">
        <table cellpadding="0" cellspacing="0"><tr><td bgcolor="${bg}" style="background:${bg};width:18px;height:18px;border-radius:50%;text-align:center;line-height:18px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:${fg};">${mark}</span>
        </td></tr></table>
      </td>
      <td valign="top" style="padding:2px 0 2px 8px;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;">${escapeHtml(item)}</span>
      </td>
    </tr></table>`).join('');
}

function widgetCalloutBox(innerHtml, bg, fg) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
    <td bgcolor="${bg}" style="background:${bg};border-radius:8px;padding:10px 14px;">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${fg};">${innerHtml}</span>
    </td>
  </tr></table>`;
}

function widgetBody(innerHtml) {
  return `<div style="padding:16px 18px;background:#FFFFFF;">${innerHtml}</div>`;
}

function widgetCardWrap(innerHtml) {
  return `<div style="width:100%;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">${innerHtml}</div>`;
}

const RISK_PALETTE = {
  low: { bg: '#DCFCE7', fg: '#15a05a' },
  medium: { bg: '#FEF3C7', fg: '#b3760a' },
  'medium-high': { bg: '#FEF3C7', fg: '#b3760a' },
  high: { bg: '#FEE2E2', fg: '#d8402e' }
};
const RATING_PALETTE = {
  excellent: { bg: '#DCFCE7', fg: '#15a05a' },
  good: { bg: '#DCFCE7', fg: '#15a05a' },
  fair: { bg: '#FEF3C7', fg: '#b3760a' },
  'action required': { bg: '#FEE2E2', fg: '#d8402e' }
};
const URGENCY_PALETTE = {
  'critical — action required': { bg: '#FEE2E2', fg: '#d8402e' },
  critical: { bg: '#FEE2E2', fg: '#d8402e' },
  high: { bg: '#FEE2E2', fg: '#d8402e' },
  'recommended this quarter': { bg: '#FEF3C7', fg: '#b3760a' },
  recommended: { bg: '#FEF3C7', fg: '#b3760a' },
  medium: { bg: '#FEF3C7', fg: '#b3760a' },
  'for your consideration': { bg: '#DCFCE7', fg: '#15a05a' },
  low: { bg: '#DCFCE7', fg: '#15a05a' }
};

function buildWidgetHtml(key, session) {
  const data = session.generated && session.generated[key];
  if (!data) return '';
  const theme = session.colorTheme || '#2E74DC';
  const rawInputs = (session.sections && session.sections[key] && session.sections[key].inputs) || {};

  if (key === 'periodInReview') {
    const all = getSlideChips(key, data);
    const statItems = all.filter(isStatLike).slice(0, 3);
    const listItems = all.filter(s => !isStatLike(s));
    const header = widgetHeaderBand(theme, 'Period in review', data.headline || SECTION_TITLES.periodInReview, null);
    const body = widgetBody(`
      ${widgetStatsRow(statItems, theme)}
      ${listItems.length ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#0b1220;margin-bottom:4px;">Highlights</div>${widgetListRows(listItems)}` : ''}
      <p style="margin:${listItems.length ? '10px' : '8px'} 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'securityPosture') {
    const all = getSlideChips(key, data);
    const statItems = all.filter(isStatLike).slice(0, 3);
    const listItems = all.filter(h => !isStatLike(h));
    const riskColor = RISK_PALETTE[(data.riskLevel || '').toLowerCase()] || RISK_PALETTE.medium;
    const badge = widgetPillBadge(`${data.riskLevel || 'Unknown'} risk`, riskColor.bg, riskColor.fg);
    const header = widgetHeaderBand(theme, 'Security posture update', data.headline || SECTION_TITLES.securityPosture, badge);

    const outstandingRisks = rawInputs.outstandingRisks;
    const callout = outstandingRisks
      ? widgetCalloutBox(`<strong>Outstanding:</strong> ${escapeHtml(outstandingRisks)}`, '#FEF3C7', '#854f0b')
      : '';

    const body = widgetBody(`
      ${widgetStatsRow(statItems, theme)}
      ${listItems.length ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#0b1220;margin-bottom:4px;">This quarter</div>${widgetListRows(listItems)}` : ''}
      <p style="margin:${listItems.length ? '10px' : '8px'} 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
      ${callout}
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'whatWeDelivered') {
    const all = getSlideChips(key, data);
    const statItems = all.filter(isStatLike).slice(0, 3);
    const listItems = all.filter(w => !isStatLike(w));
    const header = widgetHeaderBand(theme, 'What we delivered', data.headline || SECTION_TITLES.whatWeDelivered, null);
    const body = widgetBody(`
      ${widgetStatsRow(statItems, theme)}
      ${listItems.length ? widgetListRows(listItems) : ''}
      <p style="margin:${listItems.length ? '10px' : '0'} 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'technologyHealth') {
    const all = getSlideChips(key, data);
    const statItems = all.filter(isStatLike).slice(0, 3);
    const listItems = all.filter(a => !isStatLike(a));
    const ratingColor = RATING_PALETTE[(data.rating || '').toLowerCase()] || RATING_PALETTE.fair;
    const badge = data.rating ? widgetPillBadge(data.rating, ratingColor.bg, ratingColor.fg) : null;
    const header = widgetHeaderBand(theme, 'Technology health', data.headline || SECTION_TITLES.technologyHealth, badge);
    const body = widgetBody(`
      ${widgetStatsRow(statItems, theme)}
      ${listItems.length ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#0b1220;margin-bottom:4px;">Flagged this quarter</div>${widgetListRows(listItems, { bg: '#FEF3C7', fg: '#b3760a', mark: '!' })}` : ''}
      <p style="margin:${listItems.length ? '10px' : '8px'} 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'lookingAhead') {
    const priorities = getSlideChips(key, data);
    const header = widgetHeaderBand(theme, 'Looking ahead', data.headline || SECTION_TITLES.lookingAhead, null);
    const numberedRows = priorities.map((p, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;"><tr>
        <td width="24" valign="top" style="padding:2px 0;">
          <table cellpadding="0" cellspacing="0"><tr><td bgcolor="${theme}" style="background:${theme};width:18px;height:18px;border-radius:50%;text-align:center;line-height:18px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;color:#ffffff;">${i + 1}</span>
          </td></tr></table>
        </td>
        <td valign="top" style="padding:2px 0 2px 8px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;">${escapeHtml(p)}</span>
        </td>
      </tr></table>`).join('');
    const body = widgetBody(`
      ${numberedRows}
      <p style="margin:${priorities.length ? '10px' : '0'} 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'investmentSummary') {
    const header = widgetHeaderBand(theme, 'Investment summary', data.headline || SECTION_TITLES.investmentSummary, null);
    let comparison = '';
    if (rawInputs.currentMonthlyInvestment || rawInputs.proposedNextPeriod) {
      comparison = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
        <td width="50%" bgcolor="#FFFFFF" style="text-align:center;padding:8px 4px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.04em;">Current</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#586273;">${escapeHtml(rawInputs.currentMonthlyInvestment || '—')}</div>
        </td>
        <td width="50%" bgcolor="#FFFFFF" style="text-align:center;padding:8px 4px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.04em;">Proposed</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${theme};">${escapeHtml(rawInputs.proposedNextPeriod || '—')}</div>
        </td>
      </tr></table>`;
    }
    const body = widgetBody(`
      ${comparison}
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
    `);
    return widgetCardWrap(header + body);
  }

  if (key === 'recommendedServices') {
    const recs = data.recommendations || [];
    const rows = recs.map(r => {
      const uc = URGENCY_PALETTE[(r.urgency || '').toLowerCase()] || URGENCY_PALETTE.recommended;
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:1px solid #E5E7EB;padding-top:10px;"><tr>
        <td valign="top">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#0b1220;">${escapeHtml(r.name || '')}</span>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#586273;margin-top:4px;">${escapeHtml(r.reason || '')}</div>
        </td>
        ${r.urgency ? `<td width="1" valign="top" align="right">${widgetPillBadge(r.urgency, uc.bg, uc.fg)}</td>` : ''}
      </tr></table>`;
    }).join('');
    const header = widgetHeaderBand(theme, 'Recommended services', data.headline || 'For your consideration', null);
    const body = widgetBody(`
      <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>
      ${rows}
    `);
    return widgetCardWrap(header + body);
  }

  // Fallback — shouldn't be reached since every section key above is
  // handled explicitly, but keeps the function safe if a new section key
  // is ever added without a matching branch.
  return widgetCardWrap(widgetHeaderBand(theme, SECTION_TITLES[key] || key, data.headline || '', null) +
    widgetBody(`<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#0b1220;line-height:1.6;">${escapeHtml(data.narrative || '')}</p>`));
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
   14. PORTABILITY — standalone presentation file + session JSON
   ───────────────────────────────────────────────────────── */

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeFileName(name) {
  return (name || 'business-review').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '');
}

// Standalone deck CSS is intentionally duplicated from business-review.css
// rather than shared, so the exported file has zero dependency on this app,
// the backend, or an internet connection at presentation time.
function buildStandaloneDeckCss(theme) {
  return `
:root { --theme: ${theme}; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
body { font-family: 'Source Sans Pro', system-ui, -apple-system, sans-serif; }
.br-deck { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
.br-slide { display: none; position: relative; overflow: hidden; background: #fff; width: min(100vw, 177.78vh); height: min(100vh, 56.25vw); flex-shrink: 0; color: #0b1220; padding: 4.5% 6%; flex-direction: column; }
.br-slide.active { display: flex; }
.br-slide-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 2%; border-bottom: 1px solid rgba(11,18,32,0.1); margin-bottom: 4%; }
.br-client-name { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: clamp(14px, 1.6vw, 20px); }
.br-msp-brand { display: flex; align-items: center; gap: 8px; }
.br-msp-brand img { height: clamp(22px, 2.6vw, 34px); max-width: 160px; object-fit: contain; }
.br-msp-brand span { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: clamp(11px, 1.1vw, 14px); color: #586273; }
.br-slide-body { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }
.br-cover { align-items: center; justify-content: center; text-align: center; }
.br-cover-kicker { font-size: clamp(11px, 1vw, 13px); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--theme); margin-bottom: 1em; }
.br-cover-headline { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: clamp(2.2rem, 5.4vw, 4.6rem); line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 0.4em; }
.br-cover-sub { font-size: clamp(13px, 1.4vw, 17px); color: #586273; margin-bottom: 1.4em; }
.br-cover-logo img { max-height: 60px; max-width: 220px; object-fit: contain; margin-bottom: 1.2em; }
.br-cover-date { font-size: clamp(11px, 1vw, 13px); color: #9CA3AF; }
.br-section-kicker { display: flex; align-items: center; gap: 10px; margin-bottom: 0.6em; }
.br-section-title { font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: clamp(1.3rem, 2.6vw, 2.3rem); letter-spacing: -0.01em; color: var(--theme); }
.br-badge { font-size: clamp(9px, 0.85vw, 11px); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; }
.br-badge-good { background: #DCFCE7; color: #15a05a; }
.br-badge-warn { background: #FEF3C7; color: #b3760a; }
.br-badge-danger { background: #FEE2E2; color: #d8402e; }
.br-stats-row { display: flex; gap: 3%; margin: 1.2em 0; }
.br-stat { flex: 1; text-align: center; }
.br-stat-value { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: clamp(1.8rem, 3.6vw, 3.2rem); color: var(--theme); line-height: 1; }
.br-stat-label { font-size: clamp(11px, 1vw, 13px); color: #586273; margin-top: 0.4em; }
.br-narrative, .br-narrative-list { font-size: clamp(16px, 1.9vw, 23px); color: #0b1220; line-height: 1.6; max-width: 94%; }
.br-narrative-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6em; }
.br-narrative-list li { position: relative; padding-left: 1.3em; }
.br-narrative-list li::before { content: ''; position: absolute; left: 0; top: 0.5em; width: 9px; height: 9px; border-radius: 50%; background: var(--theme); }
.br-slide-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 2%; margin-top: auto; border-top: 1px solid rgba(11,18,32,0.08); }
.br-slide-company { font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: clamp(10px, 0.9vw, 12px); color: #586273; }
.br-slide-counter { font-size: clamp(9px, 0.8vw, 11px); color: #9CA3AF; letter-spacing: 0.1em; }
.br-nav { position: fixed; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1100; color: #fff; font-size: 16px; transition: background 0.2s; }
.br-nav:hover { background: rgba(255,255,255,0.22); }
.br-nav.hidden { opacity: 0; pointer-events: none; }
.br-nav-prev { left: 16px; }
.br-nav-next { right: 16px; }
.br-progress { position: fixed; top: 0; left: 0; height: 3px; background: var(--theme); z-index: 1200; transition: width 0.35s cubic-bezier(0.4,0,0.2,1); }
#fsBtn { position: fixed; top: 16px; right: 16px; z-index: 1200; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 20px; cursor: pointer; }
#fsBtn:hover { background: rgba(255,255,255,0.22); }
#hintBar { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.55); font-size: 11px; letter-spacing: 0.02em; z-index: 1100; }
@media print {
  html, body { background: #fff !important; overflow: visible !important; height: auto !important; }
  .br-nav, .br-progress, #fsBtn, #hintBar { display: none !important; }
  .br-deck { width: auto; height: auto; display: block; }
  .br-slide { display: flex !important; width: 100%; height: 100vh; page-break-after: always; }
  .br-slide:last-child { page-break-after: auto; }
  @page { size: landscape; margin: 0; }
}`;
}

function buildStandaloneHtml(session) {
  const slides = buildDeckSlides(session);
  const css = buildStandaloneDeckCss(session.colorTheme || '#2E74DC');
  const title = `${session.clientName || 'Business Review'} — ${session.reviewPeriod || ''}`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Source+Sans+Pro:wght@400;600;700&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<button id="fsBtn" type="button">⛶ Present full-screen</button>
<div class="br-progress" id="progress"></div>
<button class="br-nav br-nav-prev hidden" id="prevBtn" aria-label="Previous slide">&#8592;</button>
<button class="br-nav br-nav-next" id="nextBtn" aria-label="Next slide">&#8594;</button>
<div class="br-deck" id="deck">
${slides.join('\n')}
</div>
<div id="hintBar">← → to navigate · click to advance · F for full-screen · Ctrl/Cmd+P to save as PDF</div>
<script>
(function () {
  var slides = document.querySelectorAll('.br-slide');
  var cur = 0;
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var progress = document.getElementById('progress');
  var fsBtn = document.getElementById('fsBtn');
  var deck = document.getElementById('deck');

  function goTo(n) {
    if (!slides.length) return;
    slides[cur].classList.remove('active');
    cur = Math.max(0, Math.min(n, slides.length - 1));
    slides[cur].classList.add('active');
    prevBtn.classList.toggle('hidden', cur === 0);
    nextBtn.classList.toggle('hidden', cur === slides.length - 1);
    progress.style.width = (slides.length > 1 ? (cur / (slides.length - 1)) * 100 : 0) + '%';
  }

  prevBtn.addEventListener('click', function (e) { e.stopPropagation(); goTo(cur - 1); });
  nextBtn.addEventListener('click', function (e) { e.stopPropagation(); goTo(cur + 1); });
  deck.addEventListener('click', function () { goTo(cur + 1); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); goTo(cur + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(cur - 1); }
    if (e.key === 'f' || e.key === 'F') { enterFullscreen(); }
  });

  function enterFullscreen() {
    var el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    fsBtn.style.display = 'none';
  }
  fsBtn.addEventListener('click', enterFullscreen);
  document.addEventListener('fullscreenchange', function () {
    fsBtn.style.display = document.fullscreenElement ? 'none' : 'block';
  });

  goTo(0);
})();
</script>
</body>
</html>`;
}

function downloadStandalonePresentation() {
  const s = state.current;
  if (!s || !s.generated) { showToast('Generate the review first.'); return; }
  const html = buildStandaloneHtml(s);
  downloadFile(`${safeFileName(s.clientName)}-presentation.html`, html, 'text/html');
  showToast('Presentation downloaded ✓');
}

function exportSessionJson() {
  const s = state.current;
  if (!s) return;
  downloadFile(`${safeFileName(s.clientName)}-session.json`, JSON.stringify(s, null, 2), 'application/json');
  showToast('Session exported ✓');
}

function importSessionJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let imported;
    try { imported = JSON.parse(e.target.result); }
    catch { showToast('That file is not valid JSON.'); return; }
    if (!imported || typeof imported !== 'object' || !imported.sections) {
      showToast('That file does not look like a Business Review session.');
      return;
    }
    if (!imported.id) imported.id = 'rev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    state.current = imported;
    showBuilder();
    showToast('Session imported. Edit, present, or save it to your list.');
  };
  reader.onerror = () => showToast('Could not read that file.');
  reader.readAsText(file);
}

/* ─────────────────────────────────────────────────────────
   15. INIT
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
  $('#fReviewPeriod').addEventListener('change', e => {
    state.current.reviewPeriod = e.target.value;
    recalcInvestmentTotal();
    scheduleSave();
  });
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

  $('#btnToggleForm').addEventListener('click', () => {
    const grid = document.querySelector('.builder-grid');
    const collapsed = grid.classList.toggle('form-collapsed');
    $('#btnToggleForm').textContent = collapsed ? 'Show inputs' : 'Hide inputs';
  });

  $('#btnDownloadStandalone').addEventListener('click', downloadStandalonePresentation);
  $('#btnExportJson').addEventListener('click', exportSessionJson);
  $('#btnImportJsonTrigger').addEventListener('click', () => $('#fImportJson').click());
  $('#fImportJson').addEventListener('change', e => importSessionJson(e.target.files[0]));

  initDeckControls();
}

function init() {
  wireStaticEvents();
  showPicker();
}

document.addEventListener('DOMContentLoaded', init);
