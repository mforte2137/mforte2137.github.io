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

// ---- State ----
let currentSessionId = null;
let currentTheme     = '#0f1f3d';
let selectedCompany  = null;
let dataStatus        = 'draft'; // draft | data-pending | ready | generated
let generatedNarrative = null;
let lastFormSnapshot   = null;
let currentOutputFormat = 'email';
let _showingArchived = false;

// ---- DOM refs ----
const newReportBtn      = $('newReportBtn');
const sessionsBlock     = $('sessionsBlock');
const sessionCards      = $('sessionCards');
const showArchivedBtn   = $('showArchivedBtn');

const companyNameEl     = $('companyName');
const companySearchBtn  = $('companySearchBtn');
const companyResultsEl  = $('companyResults');
const companySelectedEl = $('companySelected');
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

  reportTypeEl.addEventListener('change', () => { renderDataSections(); autoSave(); });
  reportPeriodEl.addEventListener('change', autoSave);
  companyNameEl.addEventListener('input', autoSave);
  mspNameEl.addEventListener('input', () => {
    localStorage.setItem('vcio_msp_name', mspNameEl.value.trim());
    autoSave();
  });

  companySearchBtn.addEventListener('click', doCompanySearch);
  companyNameEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doCompanySearch(); } });

  document.querySelectorAll('.data-section input, .data-section textarea, .data-section select')
    .forEach(el => el.addEventListener('input', autoSave));

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
function renderDataSections() {
  const type = reportTypeEl.value;
  panelData.classList.toggle('hidden', !type);
  document.querySelectorAll('.data-section').forEach(sec => {
    const types = (sec.dataset.types || '').split(',');
    sec.classList.toggle('hidden', !types.includes(type));
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

function applyFormData(fd) {
  companyNameEl.value = fd.clientName || '';
  mspNameEl.value     = fd.mspName || '';
  reportTypeEl.value  = fd.reportType || '';
  reportPeriodEl.value = fd.period || '';
  renderDataSections();

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
  const rows = [
    ['CLIENT:', fd.clientName],
    ['PERIOD:', fd.period || ''],
    ['REPORT TYPE:', REPORT_TYPE_LABEL[fd.reportType] || fd.reportType],
    [''],
    ['SECTION', 'FIELD', 'VALUE'],
    ['HELPDESK & SUPPORT', 'Tickets opened', ''],
    ['HELPDESK & SUPPORT', 'Tickets resolved', ''],
    ['HELPDESK & SUPPORT', 'Avg response time', '(e.g. 14 minutes)'],
    ['HELPDESK & SUPPORT', 'Avg resolution time', '(e.g. 2.4 hours)'],
    ['HELPDESK & SUPPORT', 'SLA compliance', '(e.g. 98.2%)'],
    ['HELPDESK & SUPPORT', 'Highlight', ''],
    ['SECURITY', 'Threats blocked', ''],
    ['SECURITY', 'Security incidents', ''],
    ['SECURITY', 'Patches applied', ''],
    ['SECURITY', 'Devices patched', '(e.g. 94%)'],
    ['SECURITY', 'Training completion', '(e.g. 87%)'],
    ['SECURITY', 'Security highlight', ''],
    ['INFRASTRUCTURE', 'Uptime / availability', '(e.g. 99.97%)'],
    ['INFRASTRUCTURE', 'Alerts triggered', ''],
    ['INFRASTRUCTURE', 'Alerts resolved', ''],
    ['INFRASTRUCTURE', 'Infrastructure highlight', ''],
    ['PROJECTS & CHANGES', 'Projects completed', ''],
    ['PROJECTS & CHANGES', 'Projects in progress', ''],
    ['PROJECTS & CHANGES', 'Key changes', ''],
    ['UPCOMING', 'Renewals', ''],
    ['UPCOMING', 'Planned work', ''],
    ['RECOMMENDATIONS', 'Recommendations', ''],
    ['RECOMMENDATIONS', 'Priority', '(For your consideration / Recommended / Action required)'],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 22 }, { wch: 26 }, { wch: 40 }];
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
        return row ? String(row[2] || '').trim() : '';
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

  try {
    const res = await fetch('/api/vcio-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fd)
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
    sections += sectionBand('Helpdesk &amp; Support', statsRow([
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

  const stats = [
    statCell(d.helpdesk.ticketsResolved, 'Tickets Resolved'),
    statCell(d.security.threatsBlocked, 'Threats Blocked'),
    statCell(d.infrastructure.uptime, 'Uptime'),
  ].filter(c => c).slice(0, 3);

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

function startNewSession() {
  currentSessionId = null;
  selectedCompany = null;
  dataStatus = 'draft';
  generatedNarrative = null;
  lastFormSnapshot = null;
  currentTheme = '#0f1f3d';

  companyNameEl.value = '';
  companySelectedEl.classList.add('hidden');
  reportTypeEl.value = '';
  reportPeriodEl.value = '';
  renderDataSections();
  document.querySelectorAll('.data-section input, .data-section textarea').forEach(el => el.value = '');
  $('recommendationsPriority').value = 'For your consideration';
  updateDataPendingBadge();

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

  applyFormData(sess.formData || {});
  updateDataPendingBadge();
  colourPicker.value = currentTheme;
  customHex.value = currentTheme.replace('#', '');
  colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex.toLowerCase() === currentTheme.toLowerCase()));

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
