/* =====================================================
   vcio-report.js — Frontend logic
   ===================================================== */
(function () {

const $ = (id) => document.getElementById(id);

// ---- Constants ----
const SESSION_KEY = 'vcio_sessions';
const ARCHIVE_KEY = 'vcio_archived';
const SESSION_LIMIT = 5;

const SECTION_TYPES = {
  helpdesk:        ['monthly', 'quarterly'],
  security:        ['monthly', 'quarterly', 'snapshot'],
  infrastructure:  ['monthly', 'quarterly', 'snapshot'],
  projects:        ['quarterly'],
  upcoming:        ['quarterly', 'snapshot'],
  recommendations: ['monthly', 'quarterly', 'snapshot']
};

const REPORT_TYPE_LABEL = {
  monthly:   'Monthly Operational Report',
  quarterly: 'Quarterly Executive Summary',
  snapshot:  'IT Health Snapshot'
};

// Excel template sample values — single source of truth for both the
// download (populates every VALUE cell with a hint) and the import
// (recognizes an unedited hint and treats it as blank, so a placeholder
// left untouched never gets imported as literal report data).
const EXCEL_HINTS = {
  'HELPDESK & SUPPORT|Tickets opened':          '(e.g. 47)',
  'HELPDESK & SUPPORT|Tickets resolved':        '(e.g. 51)',
  'HELPDESK & SUPPORT|Avg response time':       '(e.g. 14 minutes)',
  'HELPDESK & SUPPORT|Avg resolution time':     '(e.g. 2.4 hours)',
  'HELPDESK & SUPPORT|SLA compliance':          '(e.g. 98.2%)',
  'HELPDESK & SUPPORT|Highlight':                '(e.g. Resolved a critical server issue within 90 minutes on a Saturday evening)',
  'SECURITY|Threats blocked':                    '(e.g. 312)',
  'SECURITY|Security incidents':                 '(e.g. 0)',
  'SECURITY|Patches applied':                    '(e.g. 284)',
  'SECURITY|Devices patched':                    '(e.g. 94%)',
  'SECURITY|Training completion':                '(e.g. 87%)',
  'SECURITY|Security highlight':                 '(e.g. Launched a new phishing-simulation training campaign)',
  'INFRASTRUCTURE|Uptime / availability':        '(e.g. 99.97%)',
  'INFRASTRUCTURE|Alerts triggered':             '(e.g. 14)',
  'INFRASTRUCTURE|Alerts resolved':              '(e.g. 14)',
  'INFRASTRUCTURE|Infrastructure highlight':     '(e.g. Migrated file server storage to new SAN)',
  'PROJECTS & CHANGES|Projects completed':       '(e.g. Migrated mailboxes to Microsoft 365)',
  'PROJECTS & CHANGES|Projects in progress':     '(e.g. Firewall replacement — phase 2 of 3)',
  'PROJECTS & CHANGES|Key changes':              '(e.g. Upgraded core switch firmware to latest stable release)',
  'UPCOMING|Renewals':                           '(e.g. Meraki firewall renewal — due August 2026)',
  'UPCOMING|Planned work':                       '(e.g. Replace aging UPS units in server room)',
  'RECOMMENDATIONS|Recommendations':             '(e.g. Begin planning cloud migration for the SQL server ahead of its 2027 end-of-life)',
  'RECOMMENDATIONS|Priority':                    '(For your consideration / Recommended / Action required)',
};

// ---- State ----
let currentSessionId = null;
let currentTheme     = '#0f1f3d';
let selectedCompany  = null;
let dataStatus        = 'draft'; // draft | data-pending | ready | generated
let generatedNarrative = null;
let lastFormSnapshot   = null;
let currentOutputFormat = 'email';
let _showingArchived = false;
let previousReportSession = null; // the matched prior session, if any (Tier 1 + source for Tiers 2/3)
let previousReportData    = null; // shortcut to previousReportSession.formData.data

// Fields eligible for stat-delta comparison (Tier 2) — id must match the input's
// element id, path locates the value inside formData.data.
const DELTA_FIELDS = [
  { id: 'ticketsOpened',     path: ['helpdesk', 'ticketsOpened'] },
  { id: 'ticketsResolved',   path: ['helpdesk', 'ticketsResolved'] },
  { id: 'slaCompliance',     path: ['helpdesk', 'slaCompliance'],      percent: true },
  { id: 'threatsBlocked',    path: ['security', 'threatsBlocked'] },
  { id: 'securityIncidents', path: ['security', 'incidents'] },
  { id: 'patchesApplied',    path: ['security', 'patchesApplied'] },
  { id: 'devicesPatched',    path: ['security', 'devicesPatched'],     percent: true },
  { id: 'uptime',            path: ['infrastructure', 'uptime'],       percent: true },
  { id: 'alertsTriggered',   path: ['infrastructure', 'alertsTriggered'] },
  { id: 'alertsResolved',    path: ['infrastructure', 'alertsResolved'] },
];

// ---- DOM refs ----
const newReportBtn      = $('newReportBtn');
const sessionsBlock     = $('sessionsBlock');
const sessionCards      = $('sessionCards');
const showArchivedBtn   = $('showArchivedBtn');

const companyNameEl     = $('companyName');
const companySearchBtn  = $('companySearchBtn');
const companyResultsEl  = $('companyResults');
const companySelectedEl = $('companySelected');
const historyPanel      = $('historyPanel');
const historyPanelSummary = $('historyPanelSummary');
const viewHistoryBtn    = $('viewHistoryBtn');
const historyModal      = $('historyModal');
const historyModalTitle = $('historyModalTitle');
const historyModalContent = $('historyModalContent');
const historyModalClose = $('historyModalClose');
const clientHistoryBtn         = $('clientHistoryBtn');
const clientHistoryListModal   = $('clientHistoryListModal');
const clientHistoryListClose   = $('clientHistoryListClose');
const clientHistorySearchInput = $('clientHistorySearchInput');
const clientHistoryResults     = $('clientHistoryResults');
const mspNameEl         = $('mspName');
const reportTypeEl      = $('reportType');
const reportPeriodEl    = $('reportPeriod');

const panelData         = $('panelData');
const downloadExcelBtn  = $('downloadExcelBtn');
const importExcelBtn    = $('importExcelBtn');
const importExcelFile   = $('importExcelFile');
const dataPendingBadge  = $('dataPendingBadge');

const generateBtn       = $('generateBtn');
const regenerateBtn     = $('regenerateBtn');

const loadingState      = $('loadingState');
const loadingMsg        = $('loadingMsg');
const panelOutput        = $('panelOutput');

const outputTabs        = $('outputTabs');
const viewEmail         = $('viewEmail');
const viewPdf           = $('viewPdf');
const viewWidget        = $('viewWidget');
const emailPreview      = $('emailPreview');
const pdfPreview        = $('pdfPreview');
const widgetPreview     = $('widgetPreview');

const colourSwatches    = $('colourSwatches');
const colourPicker      = $('colourPicker');
const customHex         = $('customHex');

const copyEmailBtn      = $('copyEmailBtn');
const downloadPdfBtn    = $('downloadPdfBtn');
const copyWidgetBtn     = $('copyWidgetBtn');
const pushWidgetBtn     = $('pushWidgetBtn');
const sbCredsPanel      = $('sbCredsPanel');
const pushFeedback      = $('pushFeedback');

// =====================================================
// Init
// =====================================================
function init() {
  populatePeriods();
  renderDataSections();
  renderSessionCards();
  mspNameEl.value = localStorage.getItem('vcio_msp_name') || '';
  wireEvents();
}

function wireEvents() {
  newReportBtn.addEventListener('click', startNewSession);
  showArchivedBtn.addEventListener('click', onShowArchived);

  reportTypeEl.addEventListener('change', () => { renderDataSections(); checkClientHistory(); autoSave(); });
  reportPeriodEl.addEventListener('change', autoSave);
  companyNameEl.addEventListener('input', () => { autoSave(); checkClientHistory(); });
  mspNameEl.addEventListener('input', () => {
    localStorage.setItem('vcio_msp_name', mspNameEl.value.trim());
    autoSave();
  });

  companySearchBtn.addEventListener('click', doCompanySearch);
  companyNameEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doCompanySearch(); } });

  viewHistoryBtn.addEventListener('click', openHistoryModal);
  historyModalClose.addEventListener('click', () => historyModal.classList.add('hidden'));
  historyModal.addEventListener('click', (e) => { if (e.target === historyModal) historyModal.classList.add('hidden'); });

  clientHistoryBtn.addEventListener('click', openClientHistoryBrowser);
  clientHistoryListClose.addEventListener('click', () => clientHistoryListModal.classList.add('hidden'));
  clientHistoryListModal.addEventListener('click', (e) => { if (e.target === clientHistoryListModal) clientHistoryListModal.classList.add('hidden'); });
  clientHistorySearchInput.addEventListener('input', () => renderClientHistoryResults(clientHistorySearchInput.value));

  document.querySelectorAll('.data-section input, .data-section textarea, .data-section select')
    .forEach(el => el.addEventListener('input', () => { autoSave(); renderDeltaBadges(); }));

  downloadExcelBtn.addEventListener('click', downloadExcelTemplate);
  importExcelBtn.addEventListener('click', () => { importExcelFile.value = ''; importExcelFile.click(); });
  importExcelFile.addEventListener('change', onImportExcel);

  generateBtn.addEventListener('click', generateReport);
  regenerateBtn.addEventListener('click', generateReport);

  outputTabs.querySelectorAll('.output-tab').forEach(tab => {
    tab.addEventListener('click', () => switchOutputFormat(tab.dataset.format));
  });

  colourSwatches.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      currentTheme = sw.dataset.hex;
      colourPicker.value = currentTheme;
      customHex.value = currentTheme.replace('#', '');
      refreshActiveOutput();
    });
  });
  colourPicker.addEventListener('input', () => {
    currentTheme = colourPicker.value;
    customHex.value = currentTheme.replace('#', '').toUpperCase();
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    refreshActiveOutput();
  });
  customHex.addEventListener('input', () => {
    const val = customHex.value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      currentTheme = '#' + val;
      colourPicker.value = currentTheme;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      refreshActiveOutput();
    }
  });

  copyEmailBtn.addEventListener('click', () => copyHtml(emailPreview.innerHTML, copyEmailBtn));
  copyWidgetBtn.addEventListener('click', () => copyHtml(widgetPreview.innerHTML, copyWidgetBtn));
  downloadPdfBtn.addEventListener('click', () => window.print());
  pushWidgetBtn.addEventListener('click', onPushClick);
  $('saveCredsBtn').addEventListener('click', onSaveCredsAndPush);
  $('cancelCredsBtn').addEventListener('click', () => { sbCredsPanel.hidden = true; });
}

// =====================================================
// Period dropdown
// =====================================================
function populatePeriods() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const opts = [];
  for (let i = 0; i < 15; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
  }
  const year = now.getFullYear();
  ['Q1','Q2','Q3','Q4'].forEach(q => opts.push(`${q} ${year}`));
  ['Q1','Q2','Q3','Q4'].forEach(q => opts.push(`${q} ${year - 1}`));
  opts.push(`H1 ${year}`, `H2 ${year}`, `Custom`);

  reportPeriodEl.innerHTML = '<option value="">Select period…</option>' +
    opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
}

// =====================================================
// Data section visibility by report type
// =====================================================
let sectionStash = {}; // { sectionName: { fieldId: value, ... } } — holds values for the currently-hidden sections

function captureSectionValues(sec) {
  const values = {};
  sec.querySelectorAll('input, textarea, select').forEach(el => { if (el.id) values[el.id] = el.value; });
  return values;
}
function restoreSectionValues(sec, values) {
  if (!values) return;
  sec.querySelectorAll('input, textarea, select').forEach(el => { if (el.id && values[el.id] !== undefined) el.value = values[el.id]; });
}
function clearSectionValues(sec) {
  sec.querySelectorAll('input, textarea').forEach(el => { el.value = ''; });
  sec.querySelectorAll('select').forEach(el => { el.selectedIndex = 0; });
}

function renderDataSections(opts) {
  const skipStash = !!(opts && opts.skipStash);
  const type = reportTypeEl.value;
  panelData.classList.toggle('hidden', !type);
  document.querySelectorAll('.data-section').forEach(sec => {
    const name = sec.dataset.section;
    const types = (sec.dataset.types || '').split(',');
    const applicable = types.includes(type);
    const wasHidden = sec.classList.contains('hidden');
    sec.classList.toggle('hidden', !applicable);
    if (skipStash) return; // caller (session resume) manages sectionStash directly

    if (!applicable && !wasHidden) {
      // Section just became inapplicable for this report type — stash its values
      // (so switching back later restores them) and clear the DOM so stale data
      // can never leak into the AI payload or any output builder for this type.
      sectionStash[name] = captureSectionValues(sec);
      clearSectionValues(sec);
    } else if (applicable && wasHidden) {
      // Section just became applicable again — restore whatever was stashed
      // the last time this report type (or another type sharing the section) was active.
      restoreSectionValues(sec, sectionStash[name]);
    }
  });
}

// =====================================================
// Company search (pattern from sales-guide.js)
// =====================================================
async function doCompanySearch() {
  const name = companyNameEl.value.trim();
  const apiKey = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');
  if (!name) { alert('Enter a company name to search.'); return; }
  if (!apiKey || !tenantUrl) { return; } // no creds — manual entry is fine, silently skip

  companySearchBtn.disabled = true;
  companySearchBtn.textContent = 'Searching…';
  companyResultsEl.classList.add('hidden');

  try {
    const res = await fetch('/api/create-opportunity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search-company', name, apiKey, tenantUrl })
    });
    const json = await res.json();
    renderCompanyResults(json.companies || [], name);
  } catch (e) {
    // Fails silently — manual entry always available
  }

  companySearchBtn.disabled = false;
  companySearchBtn.textContent = 'Search →';
}

function renderCompanyResults(companies, searchName) {
  const wrap = companyResultsEl;
  if (companies.length === 0) {
    wrap.innerHTML = `<div class="no-results-hint">No match for "<strong>${esc(searchName)}</strong>" — type the name manually.</div>`;
  } else {
    wrap.innerHTML = companies.slice(0, 6).map(c => `
      <button class="company-result-item" data-id="${esc(c.id)}" data-name="${esc(c.name)}">
        ${esc(c.name)}
      </button>`).join('');
  }
  wrap.classList.remove('hidden');
  wrap.querySelectorAll('.company-result-item').forEach(btn => {
    btn.addEventListener('click', () => selectCompany({ id: btn.dataset.id, name: btn.dataset.name }));
  });
}

function selectCompany(company) {
  selectedCompany = company;
  companyResultsEl.classList.add('hidden');
  companyNameEl.value = company.name;
  companySelectedEl.innerHTML = `<span class="company-selected-tag">✓ ${esc(company.name)}
    <button class="change-company-btn" id="changeCompanyBtn">Change</button></span>`;
  companySelectedEl.classList.remove('hidden');
  $('changeCompanyBtn').addEventListener('click', () => {
    selectedCompany = null;
    companySelectedEl.classList.add('hidden');
  });
  autoSave();
  checkClientHistory();
}

// =====================================================
// "Look back" tiers — Tier 1 (quick link), Tier 2 (stat deltas)
// =====================================================
function checkClientHistory() {
  const name = companyNameEl.value.trim();
  const prev = findPreviousReport(name, reportTypeEl.value);
  previousReportSession = prev;
  previousReportData = prev ? (prev.formData && prev.formData.data) : null;

  if (prev) {
    const typeLabel = REPORT_TYPE_LABEL[prev.reportType] || prev.reportType;
    historyPanelSummary.textContent = prev._matchedSameType
      ? `${typeLabel} — ${prev.period}`
      : `${typeLabel} — ${prev.period} (no prior ${REPORT_TYPE_LABEL[reportTypeEl.value] || 'report of this type'} yet — showing most recent)`;
    historyPanel.classList.remove('hidden');
  } else {
    historyPanel.classList.add('hidden');
  }
  renderDeltaBadges();
}

function openReportModal(sess) {
  if (!sess) return;
  const typeLabel = REPORT_TYPE_LABEL[sess.reportType] || sess.reportType;
  historyModalTitle.textContent = `${sess.clientName} — ${typeLabel} — ${sess.period}`;
  historyModalContent.innerHTML = buildEmailHtml(sess.formData, sess.generatedNarrative || {}, sess.theme || '#0f1f3d');
  historyModal.classList.remove('hidden');
}

function openHistoryModal() {
  openReportModal(previousReportSession);
}

// =====================================================
// Client History browser — standalone, independent of the report-building
// flow. Lists every generated report for a client (all types, all periods),
// so a rep can review past reports or reference an old recommendation
// without needing to start a new draft first.
// =====================================================
function findAllReportsForClient(clientName) {
  if (!clientName || !clientName.trim()) return [];
  const target = clientName.trim().toLowerCase();
  const all = [...getSessions(), ...getArchived()];
  return all
    .filter(s => s.clientName && s.clientName.trim().toLowerCase() === target && s.generatedNarrative)
    .sort((a, b) => b.lastEdited - a.lastEdited);
}

function openClientHistoryBrowser() {
  clientHistorySearchInput.value = companyNameEl.value.trim(); // convenience: prefill with whatever's in Step 1, if anything
  renderClientHistoryResults(clientHistorySearchInput.value);
  clientHistoryListModal.classList.remove('hidden');
  clientHistorySearchInput.focus();
}

function renderClientHistoryResults(name) {
  if (!name || !name.trim()) {
    clientHistoryResults.innerHTML = '<p class="history-empty-hint">Type a client name to see their past reports.</p>';
    return;
  }
  const list = findAllReportsForClient(name);
  if (!list.length) {
    clientHistoryResults.innerHTML = `<p class="history-empty-hint">No generated reports found for "${esc(name.trim())}".</p>`;
    return;
  }
  clientHistoryResults.innerHTML = list.map((s, i) => `
    <div class="history-list-row">
      <div class="history-list-main">
        <strong>${esc(REPORT_TYPE_LABEL[s.reportType] || s.reportType)}</strong> — ${esc(s.period)}
        <div class="history-list-meta">Generated ${fmtAge(s.lastEdited)}</div>
      </div>
      <button class="btn-secondary history-view-btn" data-idx="${i}">View</button>
    </div>`).join('');
  clientHistoryResults.querySelectorAll('.history-view-btn').forEach(btn => {
    btn.addEventListener('click', () => openReportModal(list[parseInt(btn.dataset.idx, 10)]));
  });
}

function parseNumeric(v) {
  if (v === null || v === undefined || v === '') return null;
  const m = String(v).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function renderDeltaBadges() {
  DELTA_FIELDS.forEach(f => {
    const slot = $('delta_' + f.id);
    if (!slot) return;
    if (!previousReportData) { slot.innerHTML = ''; return; }

    const prevRaw = f.path.reduce((o, k) => (o ? o[k] : undefined), previousReportData);
    const prevNum = parseNumeric(prevRaw);
    if (prevNum === null) { slot.innerHTML = ''; return; }

    const curEl = $(f.id);
    const curNum = curEl ? parseNumeric(curEl.value) : null;

    if (curNum === null) {
      // Nothing typed yet this period — just show what it was last time, for reference.
      slot.innerHTML = `<span class="delta-context">last: ${esc(String(prevRaw))}</span>`;
      return;
    }

    const diff = curNum - prevNum;
    const dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '▬';
    const diffMagnitude = Number.isInteger(diff) ? Math.abs(diff) : Math.abs(diff).toFixed(1);
    const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
    const suffix = f.percent ? 'pp' : '';
    slot.innerHTML = `<span class="delta-badge delta-${dir}" title="Last period: ${esc(String(prevRaw))}">${arrow} ${sign}${diffMagnitude}${suffix}</span>`;
  });
}

// =====================================================
// Collect / apply form data
// =====================================================
function getFormData() {
  return {
    clientName: companyNameEl.value.trim(),
    mspName:    mspNameEl.value.trim(),
    reportType: reportTypeEl.value,
    period:     reportPeriodEl.value,
    data: {
      helpdesk: {
        ticketsOpened:     numOrNull($('ticketsOpened').value),
        ticketsResolved:   numOrNull($('ticketsResolved').value),
        avgResponseTime:   $('avgResponseTime').value.trim() || null,
        avgResolutionTime: $('avgResolutionTime').value.trim() || null,
        slaCompliance:     $('slaCompliance').value.trim() || null,
        highlight:         $('helpdeskHighlight').value.trim() || null,
      },
      security: {
        threatsBlocked:     numOrNull($('threatsBlocked').value),
        incidents:          numOrNull($('securityIncidents').value),
        patchesApplied:     numOrNull($('patchesApplied').value),
        devicesPatched:     $('devicesPatched').value.trim() || null,
        trainingCompletion: $('trainingCompletion').value.trim() || null,
        highlight:          $('securityHighlight').value.trim() || null,
      },
      infrastructure: {
        uptime:          $('uptime').value.trim() || null,
        alertsTriggered: numOrNull($('alertsTriggered').value),
        alertsResolved:  numOrNull($('alertsResolved').value),
        highlight:       $('infraHighlight').value.trim() || null,
      },
      projects: {
        completed:   $('projectsCompleted').value.trim() || null,
        inProgress:  $('projectsInProgress').value.trim() || null,
        keyChanges:  $('keyChanges').value.trim() || null,
      },
      upcoming: {
        renewals:     $('upcomingRenewals').value.trim() || null,
        plannedWork:  $('plannedWork').value.trim() || null,
      },
      recommendations: {
        text:     $('recommendationsText').value.trim() || null,
        priority: $('recommendationsPriority').value,
      }
    }
  };
}

function applyFormData(fd, skipStash) {
  companyNameEl.value = fd.clientName || '';
  mspNameEl.value     = fd.mspName || '';
  reportTypeEl.value  = fd.reportType || '';
  reportPeriodEl.value = fd.period || '';
  renderDataSections(skipStash ? { skipStash: true } : undefined);

  const d = fd.data || {};
  const hd = d.helpdesk || {};
  $('ticketsOpened').value      = hd.ticketsOpened ?? '';
  $('ticketsResolved').value    = hd.ticketsResolved ?? '';
  $('avgResponseTime').value    = hd.avgResponseTime || '';
  $('avgResolutionTime').value  = hd.avgResolutionTime || '';
  $('slaCompliance').value      = hd.slaCompliance || '';
  $('helpdeskHighlight').value  = hd.highlight || '';

  const sec = d.security || {};
  $('threatsBlocked').value      = sec.threatsBlocked ?? '';
  $('securityIncidents').value   = sec.incidents ?? '';
  $('patchesApplied').value      = sec.patchesApplied ?? '';
  $('devicesPatched').value      = sec.devicesPatched || '';
  $('trainingCompletion').value  = sec.trainingCompletion || '';
  $('securityHighlight').value   = sec.highlight || '';

  const infra = d.infrastructure || {};
  $('uptime').value           = infra.uptime || '';
  $('alertsTriggered').value  = infra.alertsTriggered ?? '';
  $('alertsResolved').value   = infra.alertsResolved ?? '';
  $('infraHighlight').value   = infra.highlight || '';

  const proj = d.projects || {};
  $('projectsCompleted').value  = proj.completed || '';
  $('projectsInProgress').value = proj.inProgress || '';
  $('keyChanges').value         = proj.keyChanges || '';

  const up = d.upcoming || {};
  $('upcomingRenewals').value = up.renewals || '';
  $('plannedWork').value      = up.plannedWork || '';

  const rec = d.recommendations || {};
  $('recommendationsText').value     = rec.text || '';
  $('recommendationsPriority').value = rec.priority || 'For your consideration';
}

function numOrNull(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : null; }

// =====================================================
// Excel template — export / import (SheetJS pattern from security.js)
// =====================================================
function downloadExcelTemplate() {
  const fd = getFormData();
  if (!fd.clientName || !fd.reportType) {
    alert('Select a client and report type before downloading the template.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const H = (section, field) => EXCEL_HINTS[`${section}|${field}`] || '';
  const rows = [
    ['CLIENT:', fd.clientName],
    ['PERIOD:', fd.period || ''],
    ['REPORT TYPE:', REPORT_TYPE_LABEL[fd.reportType] || fd.reportType],
    [''],
    ['Every VALUE cell below shows a sample in the format "(e.g. ...)" — replace it with real data. Leave a cell exactly as-is (or blank) if that item does not apply this period.'],
    [''],
    ['SECTION', 'FIELD', 'VALUE'],
    ['HELPDESK & SUPPORT', 'Tickets opened', H('HELPDESK & SUPPORT', 'Tickets opened')],
    ['HELPDESK & SUPPORT', 'Tickets resolved', H('HELPDESK & SUPPORT', 'Tickets resolved')],
    ['HELPDESK & SUPPORT', 'Avg response time', H('HELPDESK & SUPPORT', 'Avg response time')],
    ['HELPDESK & SUPPORT', 'Avg resolution time', H('HELPDESK & SUPPORT', 'Avg resolution time')],
    ['HELPDESK & SUPPORT', 'SLA compliance', H('HELPDESK & SUPPORT', 'SLA compliance')],
    ['HELPDESK & SUPPORT', 'Highlight', H('HELPDESK & SUPPORT', 'Highlight')],
    ['SECURITY', 'Threats blocked', H('SECURITY', 'Threats blocked')],
    ['SECURITY', 'Security incidents', H('SECURITY', 'Security incidents')],
    ['SECURITY', 'Patches applied', H('SECURITY', 'Patches applied')],
    ['SECURITY', 'Devices patched', H('SECURITY', 'Devices patched')],
    ['SECURITY', 'Training completion', H('SECURITY', 'Training completion')],
    ['SECURITY', 'Security highlight', H('SECURITY', 'Security highlight')],
    ['INFRASTRUCTURE', 'Uptime / availability', H('INFRASTRUCTURE', 'Uptime / availability')],
    ['INFRASTRUCTURE', 'Alerts triggered', H('INFRASTRUCTURE', 'Alerts triggered')],
    ['INFRASTRUCTURE', 'Alerts resolved', H('INFRASTRUCTURE', 'Alerts resolved')],
    ['INFRASTRUCTURE', 'Infrastructure highlight', H('INFRASTRUCTURE', 'Infrastructure highlight')],
    ['PROJECTS & CHANGES', 'Projects completed', H('PROJECTS & CHANGES', 'Projects completed')],
    ['PROJECTS & CHANGES', 'Projects in progress', H('PROJECTS & CHANGES', 'Projects in progress')],
    ['PROJECTS & CHANGES', 'Key changes', H('PROJECTS & CHANGES', 'Key changes')],
    ['UPCOMING', 'Renewals', H('UPCOMING', 'Renewals')],
    ['UPCOMING', 'Planned work', H('UPCOMING', 'Planned work')],
    ['RECOMMENDATIONS', 'Recommendations', H('RECOMMENDATIONS', 'Recommendations')],
    ['RECOMMENDATIONS', 'Priority', H('RECOMMENDATIONS', 'Priority')],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, sheet, 'Report Data');

  const safeName = fd.clientName.replace(/[^a-z0-9 _\-]/gi, '').trim().replace(/\s+/g, '-');
  const periodSlug = (fd.period || '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  XLSX.writeFile(wb, `${safeName}-${periodSlug || 'report'}.xlsx`);

  dataStatus = 'data-pending';
  updateDataPendingBadge();
  autoSave();
}

function onImportExcel() {
  const file = importExcelFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames.includes('Report Data') ? 'Report Data' : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

      const valueFor = (section, field) => {
        const row = rows.find(r => String(r[0] || '').trim() === section && String(r[1] || '').trim() === field);
        const raw = row ? String(row[2] || '').trim() : '';
        const hint = EXCEL_HINTS[`${section}|${field}`];
        // If the tech left the sample value untouched, treat it as blank
        // rather than importing the placeholder text as real report data.
        if (hint && raw === hint) return '';
        return raw;
      };

      $('ticketsOpened').value     = valueFor('HELPDESK & SUPPORT', 'Tickets opened');
      $('ticketsResolved').value   = valueFor('HELPDESK & SUPPORT', 'Tickets resolved');
      $('avgResponseTime').value   = valueFor('HELPDESK & SUPPORT', 'Avg response time');
      $('avgResolutionTime').value = valueFor('HELPDESK & SUPPORT', 'Avg resolution time');
      $('slaCompliance').value     = valueFor('HELPDESK & SUPPORT', 'SLA compliance');
      $('helpdeskHighlight').value = valueFor('HELPDESK & SUPPORT', 'Highlight');

      $('threatsBlocked').value     = valueFor('SECURITY', 'Threats blocked');
      $('securityIncidents').value  = valueFor('SECURITY', 'Security incidents');
      $('patchesApplied').value     = valueFor('SECURITY', 'Patches applied');
      $('devicesPatched').value     = valueFor('SECURITY', 'Devices patched');
      $('trainingCompletion').value = valueFor('SECURITY', 'Training completion');
      $('securityHighlight').value  = valueFor('SECURITY', 'Security highlight');

      $('uptime').value          = valueFor('INFRASTRUCTURE', 'Uptime / availability');
      $('alertsTriggered').value = valueFor('INFRASTRUCTURE', 'Alerts triggered');
      $('alertsResolved').value  = valueFor('INFRASTRUCTURE', 'Alerts resolved');
      $('infraHighlight').value  = valueFor('INFRASTRUCTURE', 'Infrastructure highlight');

      $('projectsCompleted').value  = valueFor('PROJECTS & CHANGES', 'Projects completed');
      $('projectsInProgress').value = valueFor('PROJECTS & CHANGES', 'Projects in progress');
      $('keyChanges').value         = valueFor('PROJECTS & CHANGES', 'Key changes');

      $('upcomingRenewals').value = valueFor('UPCOMING', 'Renewals');
      $('plannedWork').value      = valueFor('UPCOMING', 'Planned work');

      $('recommendationsText').value = valueFor('RECOMMENDATIONS', 'Recommendations');
      const prio = valueFor('RECOMMENDATIONS', 'Priority');
      if (prio) $('recommendationsPriority').value = prio;

      dataStatus = 'ready';
      updateDataPendingBadge();
      autoSave();
      renderDeltaBadges();
      showToast('✓ Data imported — ready to generate.');
    } catch (err) {
      alert('Could not read spreadsheet — is it the correct file?');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function updateDataPendingBadge() {
  dataPendingBadge.classList.toggle('hidden', dataStatus !== 'data-pending');
}

function showToast(msg) {
  // Lightweight inline toast — reuse pushFeedback-style element pattern
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#0b1220;color:#fff;padding:10px 18px;border-radius:4px;font-size:13px;z-index:999;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// =====================================================
// Generate — call Netlify function for AI narrative
// =====================================================
async function generateReport() {
  const fd = getFormData();
  if (!fd.clientName)  { alert('Enter or select a client name.'); return; }
  if (!fd.reportType)  { alert('Select a report type.'); return; }
  if (!fd.period)      { alert('Select a report period.'); return; }

  lastFormSnapshot = fd;

  panelOutput.classList.add('hidden');
  loadingState.classList.remove('hidden');
  loadingMsg.textContent = 'Building your client report…';
  generateBtn.disabled = true;
  regenerateBtn.disabled = true;

  // Tier 3 — if a previous report exists for this client, hand its data to the
  // AI so the narrative can reference trends and follow up on prior recommendations.
  const payload = { ...fd };
  if (previousReportSession && previousReportSession.formData) {
    payload.previousPeriod = {
      period: previousReportSession.period,
      data: previousReportSession.formData.data,
    };
  }

  try {
    const res = await fetch('/api/vcio-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Generation failed.');

    generatedNarrative = json.narrative;
    dataStatus = 'generated';
    updateDataPendingBadge();

    loadingState.classList.add('hidden');
    panelOutput.classList.remove('hidden');
    regenerateBtn.classList.remove('hidden');
    switchOutputFormat(currentOutputFormat);
    panelOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
    autoSave();
  } catch (e) {
    loadingState.classList.add('hidden');
    alert('Error generating report: ' + (e.message || 'Something went wrong. Please try again.'));
  } finally {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
  }
}

// =====================================================
// Output format switching + rendering
// =====================================================
function switchOutputFormat(format) {
  currentOutputFormat = format;
  outputTabs.querySelectorAll('.output-tab').forEach(t => t.classList.toggle('active', t.dataset.format === format));
  viewEmail.classList.toggle('hidden', format !== 'email');
  viewPdf.classList.toggle('hidden', format !== 'pdf');
  viewWidget.classList.toggle('hidden', format !== 'widget');
  refreshActiveOutput();
}

function refreshActiveOutput() {
  if (!generatedNarrative || !lastFormSnapshot) return;
  if (currentOutputFormat === 'email')  emailPreview.innerHTML  = buildEmailHtml(lastFormSnapshot, generatedNarrative, currentTheme);
  if (currentOutputFormat === 'pdf')    pdfPreview.innerHTML    = buildPdfHtml(lastFormSnapshot, generatedNarrative, currentTheme);
  if (currentOutputFormat === 'widget') widgetPreview.innerHTML = buildWidgetHtml(lastFormSnapshot, generatedNarrative, currentTheme);
}

// ---- Stat helper: only render stats that have values ----
function statCell(value, label) {
  if (value === null || value === undefined || value === '') return '';
  return { value, label };
}

// =====================================================
// FORMAT 1 — Outlook-safe HTML Email (600px table layout)
// =====================================================
function buildEmailHtml(fd, nar, hex) {
  const d = fd.data;
  const typeLabel = REPORT_TYPE_LABEL[fd.reportType] || '';

  const statsRow = (cells) => {
    const valid = cells.filter(c => c);
    if (!valid.length) return '';
    const width = Math.floor(100 / valid.length);
    return `
    <!-- OUTLOOK: table+cellpadding, not CSS padding, for stat row -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        ${valid.map((c, i) => `
        <td width="${width}%" align="center" valign="top" style="padding:12px 8px;${i < valid.length - 1 ? 'border-right:1px solid #e3e7ee;' : ''}">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:${hex};line-height:1;">${esc(String(c.value))}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;margin-top:4px;">${esc(c.label)}</div>
        </td>`).join('')}
      </tr>
    </table>`;
  };

  const narrativeP = (text) => text
    ? `<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">${esc(text)}</p>`
    : '';

  const sectionBand = (title, statsHtml, narrative) => `
  <tr>
    <td style="padding:20px 24px;" bgcolor="#ffffff" style="background-color:#ffffff;">
      <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${hex};text-transform:uppercase;letter-spacing:1px;">${esc(title)}</p>
      ${statsHtml}
      ${narrativeP(narrative)}
    </td>
  </tr>
  <tr><td style="border-bottom:1px solid #e3e7ee;line-height:1px;font-size:1px;">&nbsp;</td></tr>`;

  let sections = '';

  if (SECTION_TYPES.helpdesk.includes(fd.reportType)) {
    sections += sectionBand('Helpdesk & Support', statsRow([
      statCell(d.helpdesk.ticketsOpened, 'Opened'),
      statCell(d.helpdesk.ticketsResolved, 'Resolved'),
      statCell(d.helpdesk.avgResponseTime, 'Response'),
      statCell(d.helpdesk.slaCompliance, 'SLA'),
    ]), nar.helpdeskNarrative);
  }
  if (SECTION_TYPES.security.includes(fd.reportType)) {
    sections += sectionBand('Security', statsRow([
      statCell(d.security.threatsBlocked, 'Threats Blocked'),
      statCell(d.security.incidents, 'Incidents'),
      statCell(d.security.devicesPatched, 'Patched'),
    ]), nar.securityNarrative);
  }
  if (SECTION_TYPES.infrastructure.includes(fd.reportType)) {
    sections += sectionBand('Infrastructure', statsRow([
      statCell(d.infrastructure.uptime, 'Uptime'),
      statCell(d.infrastructure.alertsTriggered, 'Alerts'),
      statCell(d.infrastructure.alertsResolved, 'Resolved'),
    ]), nar.infrastructureNarrative);
  }
  const textLineBand = (title, lines) => {
    const valid = lines.filter(l => l.text);
    if (!valid.length) return '';
    return `
  <tr>
    <td style="padding:20px 24px;" bgcolor="#ffffff" style="background-color:#ffffff;">
      <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${hex};text-transform:uppercase;letter-spacing:1px;">${esc(title)}</p>
      ${valid.map(l => `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;"><strong>${esc(l.label)}:</strong> ${esc(l.text)}</p>`).join('')}
    </td>
  </tr>
  <tr><td style="border-bottom:1px solid #e3e7ee;line-height:1px;font-size:1px;">&nbsp;</td></tr>`;
  };

  if (SECTION_TYPES.projects.includes(fd.reportType)) {
    sections += textLineBand('Projects & Changes', [
      { label: 'Completed', text: d.projects.completed },
      { label: 'In progress', text: d.projects.inProgress },
      { label: 'Key changes', text: d.projects.keyChanges },
    ]);
  }
  if (SECTION_TYPES.upcoming.includes(fd.reportType)) {
    sections += textLineBand('Upcoming & Renewals', [
      { label: 'Renewals', text: d.upcoming.renewals },
      { label: 'Planned work', text: d.upcoming.plannedWork },
    ]);
  }
  if (SECTION_TYPES.recommendations.includes(fd.reportType) && (nar.recommendationsNarrative || d.recommendations.text)) {
    const prioColor = d.recommendations.priority === 'Action required' ? '#d8402e'
                     : d.recommendations.priority === 'Recommended' ? '#b3760a' : '#586273';
    sections += `
  <tr>
    <td style="padding:20px 24px;" bgcolor="#f4f7fb" style="background-color:#f4f7fb;">
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:${hex};text-transform:uppercase;letter-spacing:1px;">Recommendations</p>
      <p style="margin:0 0 10px;">
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;color:#ffffff;background-color:${prioColor};padding:3px 10px;">${esc(d.recommendations.priority || '')}</span>
      </p>
      ${narrativeP(nar.recommendationsNarrative || d.recommendations.text)}
    </td>
  </tr>`;
  }

  return `
<!-- OUTLOOK: 600px fixed-width table, all inline styles, Arial/Georgia/Verdana only, no border-radius -->
<table width="600" cellpadding="0" cellspacing="0" border="0" align="center" role="presentation" style="width:600px;max-width:600px;">
  <tr>
    <td bgcolor="${hex}" style="background-color:${hex};padding:28px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">${esc(fd.mspName || 'Your MSP')}</p>
      <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;">${esc(typeLabel)}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#f4f7fb" style="background-color:#f4f7fb;padding:14px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#0b1220;">${esc(fd.clientName)}</p>
      <p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#586273;">${esc(fd.period)}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:18px 24px 4px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">${esc(nar.openingNote || '')}</p>
    </td>
  </tr>
  ${sections}
  <tr>
    <td style="padding:18px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">${esc(nar.closingNote || '')}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#1a1a1a" style="background-color:#1a1a1a;padding:18px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#ffffff;">${esc(fd.mspName || 'Your MSP')} — this report was prepared for ${esc(fd.clientName)}.</p>
    </td>
  </tr>
</table>`;
}

// =====================================================
// FORMAT 2 — PDF (full-width, print-optimised)
// =====================================================
function buildPdfHtml(fd, nar, hex) {
  const d = fd.data;
  const typeLabel = REPORT_TYPE_LABEL[fd.reportType] || '';

  const statRow = (cells) => {
    const valid = cells.filter(c => c);
    if (!valid.length) return '';
    return `<div style="display:flex;gap:24px;margin:12px 0;flex-wrap:wrap;">
      ${valid.map(c => `<div><div style="font-size:26px;font-weight:700;color:${hex};">${esc(String(c.value))}</div><div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.06em;">${esc(c.label)}</div></div>`).join('')}
    </div>`;
  };

  const section = (title, statsHtml, narrative) => `
    <div class="pdf-section" style="margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #e3e7ee;">
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${hex};border-left:3px solid ${hex};padding-left:10px;margin:0 0 8px;">${esc(title)}</h3>
      ${statsHtml}
      ${narrative ? `<p style="font-size:13px;line-height:1.65;color:#333;margin:8px 0 0;">${esc(narrative)}</p>` : ''}
    </div>`;

  let sections = '';
  if (SECTION_TYPES.helpdesk.includes(fd.reportType)) {
    sections += section('Helpdesk & Support', statRow([
      statCell(d.helpdesk.ticketsOpened, 'Opened'), statCell(d.helpdesk.ticketsResolved, 'Resolved'),
      statCell(d.helpdesk.avgResponseTime, 'Response'), statCell(d.helpdesk.slaCompliance, 'SLA'),
    ]), nar.helpdeskNarrative);
  }
  if (SECTION_TYPES.security.includes(fd.reportType)) {
    sections += section('Security', statRow([
      statCell(d.security.threatsBlocked, 'Threats Blocked'), statCell(d.security.incidents, 'Incidents'),
      statCell(d.security.devicesPatched, 'Patched'),
    ]), nar.securityNarrative);
  }
  if (SECTION_TYPES.infrastructure.includes(fd.reportType)) {
    sections += section('Infrastructure', statRow([
      statCell(d.infrastructure.uptime, 'Uptime'), statCell(d.infrastructure.alertsTriggered, 'Alerts'),
      statCell(d.infrastructure.alertsResolved, 'Resolved'),
    ]), nar.infrastructureNarrative);
  }
  if (SECTION_TYPES.projects.includes(fd.reportType) && (d.projects.completed || d.projects.inProgress || d.projects.keyChanges)) {
    sections += `<div class="pdf-section" style="margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #e3e7ee;">
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${hex};border-left:3px solid ${hex};padding-left:10px;margin:0 0 8px;">Projects &amp; Changes</h3>
      ${d.projects.completed ? `<p style="font-size:13px;margin:6px 0;"><strong>Completed:</strong> ${esc(d.projects.completed)}</p>` : ''}
      ${d.projects.inProgress ? `<p style="font-size:13px;margin:6px 0;"><strong>In progress:</strong> ${esc(d.projects.inProgress)}</p>` : ''}
      ${d.projects.keyChanges ? `<p style="font-size:13px;margin:6px 0;"><strong>Key changes:</strong> ${esc(d.projects.keyChanges)}</p>` : ''}
    </div>`;
  }
  if (SECTION_TYPES.upcoming.includes(fd.reportType) && (d.upcoming.renewals || d.upcoming.plannedWork)) {
    sections += `<div class="pdf-section" style="margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #e3e7ee;">
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${hex};border-left:3px solid ${hex};padding-left:10px;margin:0 0 8px;">Upcoming &amp; Renewals</h3>
      ${d.upcoming.renewals ? `<p style="font-size:13px;margin:6px 0;"><strong>Renewals:</strong> ${esc(d.upcoming.renewals)}</p>` : ''}
      ${d.upcoming.plannedWork ? `<p style="font-size:13px;margin:6px 0;"><strong>Planned work:</strong> ${esc(d.upcoming.plannedWork)}</p>` : ''}
    </div>`;
  }
  if (nar.recommendationsNarrative || d.recommendations.text) {
    sections += `<div class="pdf-section" style="margin-bottom:0;">
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${hex};border-left:3px solid ${hex};padding-left:10px;margin:0 0 8px;">Recommendations</h3>
      <p style="font-size:13px;line-height:1.65;color:#333;margin:0;">${esc(nar.recommendationsNarrative || d.recommendations.text)}</p>
    </div>`;
  }

  return `<div class="pdf-print-root" style="font-family:Arial,Helvetica,sans-serif;color:#0b1220;max-width:800px;">
    <div style="border-bottom:3px solid ${hex};padding-bottom:16px;margin-bottom:22px;">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9CA3AF;margin:0 0 4px;">${esc(fd.mspName || 'Your MSP')}</p>
      <h1 style="font-size:22px;margin:0 0 4px;color:${hex};">${esc(typeLabel)}</h1>
      <p style="font-size:14px;margin:0;color:#586273;">${esc(fd.clientName)} — ${esc(fd.period)}</p>
    </div>
    <p style="font-size:13px;line-height:1.65;margin:0 0 22px;">${esc(nar.openingNote || '')}</p>
    ${sections}
    <p style="font-size:13px;line-height:1.65;margin:22px 0 0;color:#586273;">${esc(nar.closingNote || '')}</p>
  </div>`;
}

// =====================================================
// FORMAT 3 — Salesbuildr Widget (condensed, TinyMCE-safe)
// =====================================================
function buildWidgetHtml(fd, nar, hex) {
  const d = fd.data;
  const typeLabel = REPORT_TYPE_LABEL[fd.reportType] || '';

  const statCandidates = [];
  if (SECTION_TYPES.helpdesk.includes(fd.reportType)) statCandidates.push(statCell(d.helpdesk.ticketsResolved, 'Tickets Resolved'));
  statCandidates.push(statCell(d.security.threatsBlocked, 'Threats Blocked'));
  statCandidates.push(statCell(d.infrastructure.uptime, 'Uptime'));
  const stats = statCandidates.filter(c => c).slice(0, 3);

  const statRow = stats.length ? `
    <table width="100%" style="border-collapse:collapse;border-bottom:1px solid #e3e7ee;">
      <tr>
        ${stats.map((c, i) => `
        <td style="padding:12px 14px;${i < stats.length - 1 ? 'border-right:1px solid #e3e7ee;' : ''}text-align:center;">
          <div style="font-size:20px;font-weight:700;color:${hex};line-height:1;">${esc(String(c.value))}</div>
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-top:3px;">${esc(c.label)}</div>
        </td>`).join('')}
      </tr>
    </table>` : '';

  const recText = nar.recommendationsNarrative || d.recommendations.text || '';

  return `<div style="background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};overflow:hidden;width:100%;">
  <div style="background:linear-gradient(135deg,${hex} 0%,${hex} 100%);padding:14px 16px 12px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:4px;">${esc(typeLabel)}</div>
    <div style="font-size:15px;font-weight:700;color:#ffffff;">${esc(fd.clientName)}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px;">${esc(fd.period)}</div>
  </div>
  ${statRow}
  <div style="padding:12px 16px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${hex};margin-bottom:6px;">Recommendations</div>
    <div style="font-size:12px;color:#586273;line-height:1.6;">${esc(recText)}</div>
  </div>
  <div style="background:#f4f7fb;border-top:1px solid #e3e7ee;padding:8px 16px;">
    <span style="font-size:11px;color:#9ca3af;">Prepared by ${esc(fd.mspName || 'your MSP')}</span>
  </div>
</div>`;
}

// =====================================================
// Copy / Push actions
// =====================================================
function copyHtml(html, btn) {
  navigator.clipboard.writeText(html).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  }).catch(() => alert('Could not copy to clipboard. Try again.'));
}

function onPushClick() {
  const apiKey = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');
  if (!apiKey || !tenantUrl) {
    sbCredsPanel.classList.remove('hidden');
    sbCredsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  doPush(apiKey, tenantUrl);
}

function onSaveCredsAndPush() {
  const apiKey = $('sbApiKey').value.trim();
  const tenantUrl = $('sbTenantUrl').value.trim();
  if (!apiKey || !tenantUrl) { alert('Please enter both your API key and tenant URL.'); return; }
  localStorage.setItem('sb_api_key', apiKey);
  localStorage.setItem('sb_tenant_url', tenantUrl);
  sbCredsPanel.classList.add('hidden');
  doPush(apiKey, tenantUrl);
}

async function doPush(apiKey, tenantUrl) {
  pushFeedback.classList.add('hidden');
  pushFeedback.className = 'push-feedback hidden';
  pushWidgetBtn.disabled = true;
  pushWidgetBtn.textContent = 'Pushing…';

  const html = widgetPreview.innerHTML;
  const title = `${lastFormSnapshot.clientName} — ${REPORT_TYPE_LABEL[lastFormSnapshot.reportType]} — ${lastFormSnapshot.period}`;

  try {
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: [{ type: 'html', content: html, title }], prefix: title, apiKey, tenantUrl })
    });
    const data = await res.json();
    if (data.ok || (data.successCount && data.successCount > 0)) {
      showPushFeedback('success', '✓ Widget pushed to Salesbuildr successfully.');
    } else {
      showPushFeedback('error', 'Push failed: ' + (data.error || 'Unknown error. Check your credentials.'));
    }
  } catch (e) {
    showPushFeedback('error', 'Push failed: ' + (e.message || 'Network error.'));
  } finally {
    pushWidgetBtn.disabled = false;
    pushWidgetBtn.textContent = 'Push to Salesbuildr';
  }
}

function showPushFeedback(type, msg) {
  pushFeedback.classList.remove('hidden');
  pushFeedback.className = 'push-feedback ' + type;
  pushFeedback.textContent = msg;
}

// =====================================================
// Sessions — localStorage save/resume (pattern from technology-roadmap.js)
// =====================================================
function buildSessionSnapshot() {
  const fd = getFormData();
  return {
    id: currentSessionId,
    clientName: fd.clientName || 'Untitled',
    reportType: fd.reportType,
    period: fd.period,
    status: dataStatus,
    lastEdited: Date.now(),
    theme: currentTheme,
    selectedCompany,
    formData: fd,
    generatedNarrative,
    sectionStash,
  };
}

function autoSave() {
  if (!currentSessionId) currentSessionId = 'vcio_session_' + Date.now();
  let sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === currentSessionId);
  const snap = buildSessionSnapshot();
  if (idx >= 0) sessions[idx] = snap; else sessions.unshift(snap);
  sessions = sessions.slice(0, 20);
  saveSessions(sessions);
  renderSessionCards();
}

function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; } }
function saveSessions(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { console.warn('Session save failed', e); } }
function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

// =====================================================
// Client history lookup — shared by all three "look back" tiers
// =====================================================
function findPreviousReport(clientName, reportType) {
  if (!clientName || !clientName.trim()) return null;
  const target = clientName.trim().toLowerCase();
  const all = [...getSessions(), ...getArchived()];
  const candidates = all.filter(s =>
    s.id !== currentSessionId &&
    s.clientName && s.clientName.trim().toLowerCase() === target &&
    s.generatedNarrative // only reports that were actually generated — a blank draft isn't "what they saw last time"
  );
  if (!candidates.length) return null;
  // lastEdited is the best proxy we have for generation order, since period is
  // a free-text label ("Jun 2026", "Q2 2026") and can't be reliably sorted chronologically.
  candidates.sort((a, b) => b.lastEdited - a.lastEdited);

  // Prefer the most recent report of the SAME type — that's the meaningful
  // comparison when building a Quarterly summary, for instance, a prior
  // Monthly report isn't "last time" in any useful sense.
  const sameType = candidates.find(s => s.reportType === reportType);
  if (sameType) return { ...sameType, _matchedSameType: true };

  // No same-type history yet — fall back to the most recent of any type,
  // but the caller must label this clearly since it's a different report kind.
  return { ...candidates[0], _matchedSameType: false };
}

function startNewSession() {
  currentSessionId = null;
  selectedCompany = null;
  dataStatus = 'draft';
  generatedNarrative = null;
  lastFormSnapshot = null;
  currentTheme = '#0f1f3d';
  previousReportSession = null;
  previousReportData = null;

  companyNameEl.value = '';
  companySelectedEl.classList.add('hidden');
  historyPanel.classList.add('hidden');

  // Clear every field BEFORE resetting sectionStash and touching report type.
  // renderDataSections() below captures whatever is currently in the DOM when
  // a section goes inapplicable — if that ran first, it would re-capture the
  // previous session's leftover values into this "fresh" stash.
  document.querySelectorAll('.data-section input, .data-section textarea').forEach(el => el.value = '');
  document.querySelectorAll('.data-section select').forEach(el => el.selectedIndex = 0);
  sectionStash = {};

  reportTypeEl.value = '';
  reportPeriodEl.value = '';
  renderDataSections();
  $('recommendationsPriority').value = 'For your consideration';
  updateDataPendingBadge();
  renderDeltaBadges();

  panelOutput.classList.add('hidden');
  regenerateBtn.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resumeSession(sess) {
  currentSessionId = sess.id;
  selectedCompany = sess.selectedCompany || null;
  dataStatus = sess.status || 'draft';
  generatedNarrative = sess.generatedNarrative || null;
  currentTheme = sess.theme || '#0f1f3d';
  sectionStash = sess.sectionStash ? JSON.parse(JSON.stringify(sess.sectionStash)) : {};

  applyFormData(sess.formData || {}, true);
  updateDataPendingBadge();
  colourPicker.value = currentTheme;
  customHex.value = currentTheme.replace('#', '');
  colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex.toLowerCase() === currentTheme.toLowerCase()));
  checkClientHistory(); // refresh "last report" panel + deltas for the resumed client, excluding this session itself

  if (generatedNarrative) {
    lastFormSnapshot = sess.formData;
    panelOutput.classList.remove('hidden');
    regenerateBtn.classList.remove('hidden');
    switchOutputFormat('email');
  } else {
    panelOutput.classList.add('hidden');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onShowArchived() {
  _showingArchived = !_showingArchived;
  renderSessionCards(_showingArchived);
}

function renderSessionCards(showArchived) {
  const sessions = getSessions();
  const archived = showArchived ? getArchived() : [];
  const toShow = showArchived ? archived : sessions.slice(0, SESSION_LIMIT);

  if (!sessions.length && !archived.length) { sessionsBlock.classList.add('hidden'); return; }
  sessionsBlock.classList.remove('hidden');
  sessionCards.innerHTML = '';

  toShow.forEach(sess => {
    const card = document.createElement('div');
    card.className = 'session-card';
    const statusBadge = {
      draft: '<span class="badge badge-neutral">DRAFT</span>',
      'data-pending': '<span class="badge badge-warn">DATA PENDING</span>',
      ready: '<span class="badge badge-info">READY</span>',
      generated: '<span class="badge badge-good">GENERATED</span>',
    }[sess.status] || '<span class="badge badge-neutral">DRAFT</span>';
    const typeLabel = REPORT_TYPE_LABEL[sess.reportType] || '';
    card.innerHTML = `
      <div class="session-card-client">${esc(sess.clientName || 'Untitled')}</div>
      <div class="session-card-completion">${esc(typeLabel)}${sess.period ? ' · ' + esc(sess.period) : ''}</div>
      <div class="session-card-meta">
        ${statusBadge}
        <span class="session-card-age">${fmtAge(sess.lastEdited)}</span>
        <button class="session-discard" data-id="${esc(sess.id)}" title="Archive">×</button>
      </div>`;
    card.addEventListener('click', (e) => { if (e.target.classList.contains('session-discard')) return; resumeSession(sess); });
    card.querySelector('.session-discard').addEventListener('click', (e) => {
      e.stopPropagation();
      archiveSession(sess.id, showArchived);
    });
    sessionCards.appendChild(card);
  });

  if (!showArchived && sessions.length > SESSION_LIMIT) {
    const more = document.createElement('div');
    more.style.cssText = 'font-size:11px;color:var(--text-3);align-self:center;';
    more.textContent = `+ ${sessions.length - SESSION_LIMIT} more (archive to make room)`;
    sessionCards.appendChild(more);
  }
  showArchivedBtn.textContent = showArchived ? 'Hide archived' : 'Show archived';
}

function archiveSession(id, isArchived) {
  if (isArchived) {
    saveArchived(getArchived().filter(s => s.id !== id));
  } else {
    const sessions = getSessions();
    const sess = sessions.find(s => s.id === id);
    saveSessions(sessions.filter(s => s.id !== id));
    if (sess) { const arch = getArchived(); arch.unshift(sess); saveArchived(arch); }
  }
  renderSessionCards(isArchived);
}

// =====================================================
// Helpers
// =====================================================
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function fmtAge(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

init();

})();
