/* ============================================================
   MATRIX CREATOR — matrix-creator.js
   MSP Comparison Matrix Builder
   ============================================================ */

/* ── Template Data ──────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 'tpl-m365-biz',
    category: 'Microsoft 365',
    title: 'M365 Business Tiers',
    desc: 'Basic vs Standard vs Premium for SMB clients',
    cols: 3,
    rows: 8,
    cols_data: [
      { label: 'Business Basic', sublabel: '$6/user/mo', color: '#2563eb' },
      { label: 'Business Standard', sublabel: '$12.50/user/mo', color: '#0891b2' },
      { label: 'Business Premium', sublabel: '$22/user/mo', color: '#7c3aed' }
    ],
    features: [
      { label: 'Office Web Apps', cells: ['yes','yes','yes'] },
      { label: 'Desktop Office Apps', cells: ['no','yes','yes'] },
      { label: 'Exchange Email (50GB)', cells: ['yes','yes','yes'] },
      { label: 'Teams & SharePoint', cells: ['yes','yes','yes'] },
      { label: 'Intune Device Mgmt', cells: ['no','no','yes'] },
      { label: 'Azure AD P1', cells: ['no','no','yes'] },
      { label: 'Defender for Business', cells: ['no','no','yes'] },
      { label: 'MFA & Conditional Access', cells: ['partial','partial','yes'] }
    ]
  },
  {
    id: 'tpl-m365-ent',
    category: 'Microsoft 365',
    title: 'M365 Enterprise',
    desc: 'E3 vs E5 with compliance & security features',
    cols: 2,
    rows: 7,
    cols_data: [
      { label: 'Microsoft 365 E3', sublabel: '$36/user/mo', color: '#1d4ed8' },
      { label: 'Microsoft 365 E5', sublabel: '$57/user/mo', color: '#7c3aed' }
    ],
    features: [
      { label: 'Full Desktop Apps', cells: ['yes','yes'] },
      { label: 'Azure AD P1/P2', cells: ['P1','P2'] },
      { label: 'Advanced Compliance', cells: ['partial','yes'] },
      { label: 'Defender for Endpoint P2', cells: ['no','yes'] },
      { label: 'Power BI Pro', cells: ['no','yes'] },
      { label: 'Phone System (VoIP)', cells: ['no','yes'] },
      { label: 'Advanced eDiscovery', cells: ['no','yes'] }
    ]
  },
  {
    id: 'tpl-managed-tiers',
    category: 'Managed Services',
    title: 'Managed IT Tiers',
    desc: 'Silver / Gold / Platinum — Good/Better/Best',
    cols: 3,
    rows: 10,
    cols_data: [
      { label: 'Silver', sublabel: 'Essentials', color: '#64748b' },
      { label: 'Gold', sublabel: 'Advanced', color: '#d97706' },
      { label: 'Platinum', sublabel: 'Complete', color: '#7c3aed' }
    ],
    features: [
      { label: 'Remote Monitoring (RMM)', cells: ['yes','yes','yes'] },
      { label: 'Help Desk Support', cells: ['8×5','8×5','24×7'] },
      { label: 'Patch Management', cells: ['yes','yes','yes'] },
      { label: 'Endpoint Security (EDR)', cells: ['partial','yes','yes'] },
      { label: 'Backup & Recovery', cells: ['partial','yes','yes'] },
      { label: 'vCISO / Security Review', cells: ['no','partial','yes'] },
      { label: 'Quarterly Business Review', cells: ['no','yes','yes'] },
      { label: 'M365 Management', cells: ['partial','yes','yes'] },
      { label: 'Vendor Management', cells: ['no','partial','yes'] },
      { label: 'Dedicated Account Manager', cells: ['no','no','yes'] }
    ]
  },
  {
    id: 'tpl-security',
    category: 'Security',
    title: 'Managed Security (MDR)',
    desc: 'Essential / Advanced / Complete cyber protection',
    cols: 3,
    rows: 8,
    cols_data: [
      { label: 'Essential', sublabel: 'EDR Only', color: '#059669' },
      { label: 'Advanced', sublabel: 'MDR', color: '#0891b2' },
      { label: 'Complete', sublabel: 'Full SOC', color: '#dc2626' }
    ],
    features: [
      { label: 'Endpoint Protection (EDR)', cells: ['yes','yes','yes'] },
      { label: '24/7 Threat Monitoring', cells: ['no','yes','yes'] },
      { label: 'Incident Response', cells: ['no','partial','yes'] },
      { label: 'Email Security (DMARC/ATP)', cells: ['partial','yes','yes'] },
      { label: 'DNS Filtering', cells: ['yes','yes','yes'] },
      { label: 'Dark Web Monitoring', cells: ['no','yes','yes'] },
      { label: 'Security Awareness Training', cells: ['no','partial','yes'] },
      { label: 'Compliance Reporting', cells: ['no','no','yes'] }
    ]
  },
  {
    id: 'tpl-backup',
    category: 'Backup & DR',
    title: 'Backup & Disaster Recovery',
    desc: 'Starter / Business / Enterprise continuity tiers',
    cols: 3,
    rows: 7,
    cols_data: [
      { label: 'Starter', sublabel: 'Basic Backup', color: '#0891b2' },
      { label: 'Business', sublabel: 'BDR', color: '#2563eb' },
      { label: 'Enterprise', sublabel: 'Full DR', color: '#7c3aed' }
    ],
    features: [
      { label: 'Endpoint Backup', cells: ['yes','yes','yes'] },
      { label: 'Server / VM Backup', cells: ['no','yes','yes'] },
      { label: 'M365 Backup', cells: ['no','yes','yes'] },
      { label: 'Backup Frequency', cells: ['Daily','Hourly','15-min'] },
      { label: 'Offsite / Cloud Replication', cells: ['no','yes','yes'] },
      { label: 'Instant Virtualization', cells: ['no','partial','yes'] },
      { label: 'Tested Recovery (Quarterly)', cells: ['no','no','yes'] }
    ]
  },
  {
    id: 'tpl-copilot',
    category: 'Microsoft 365',
    title: 'Microsoft Copilot Add-ons',
    desc: 'M365 Copilot vs Copilot Studio vs GitHub Copilot',
    cols: 3,
    rows: 6,
    cols_data: [
      { label: 'M365 Copilot', sublabel: '$30/user/mo', color: '#2563eb' },
      { label: 'Copilot Studio', sublabel: '$200/tenant/mo', color: '#7c3aed' },
      { label: 'GitHub Copilot', sublabel: '$19/user/mo', color: '#1f2937' }
    ],
    features: [
      { label: 'AI in Word/Excel/PPT', cells: ['yes','no','no'] },
      { label: 'AI in Teams & Outlook', cells: ['yes','partial','no'] },
      { label: 'Custom AI Agents/Bots', cells: ['no','yes','no'] },
      { label: 'Code Completion (IDE)', cells: ['no','no','yes'] },
      { label: 'Business Process Automation', cells: ['partial','yes','no'] },
      { label: 'Requires M365 E3/E5', cells: ['yes','yes','no'] }
    ]
  },
  {
    id: 'tpl-endpoint',
    category: 'Managed Services',
    title: 'Endpoint Management',
    desc: 'RMM + Intune + Patch — Basic vs Managed',
    cols: 3,
    rows: 7,
    cols_data: [
      { label: 'Basic RMM', sublabel: 'Monitoring', color: '#64748b' },
      { label: 'Managed Endpoints', sublabel: 'Proactive', color: '#059669' },
      { label: 'Full UEM', sublabel: 'Intune + Zero Trust', color: '#2563eb' }
    ],
    features: [
      { label: 'Monitoring & Alerting', cells: ['yes','yes','yes'] },
      { label: 'Automated Patch Management', cells: ['partial','yes','yes'] },
      { label: 'Remote Support Tools', cells: ['yes','yes','yes'] },
      { label: 'Intune / MDM Enrollment', cells: ['no','partial','yes'] },
      { label: 'Conditional Access Policy', cells: ['no','no','yes'] },
      { label: 'Asset Inventory & Reporting', cells: ['partial','yes','yes'] },
      { label: 'Scripting & Automation', cells: ['no','yes','yes'] }
    ]
  },
  {
    id: 'tpl-voip',
    category: 'Telecom',
    title: 'VoIP / Teams Voice',
    desc: 'Business phone system tiers',
    cols: 3,
    rows: 6,
    cols_data: [
      { label: 'Basic VoIP', sublabel: 'Hosted PBX', color: '#0891b2' },
      { label: 'Teams Voice', sublabel: 'Calling Plans', color: '#2563eb' },
      { label: 'Enterprise UCaaS', sublabel: 'Full Suite', color: '#7c3aed' }
    ],
    features: [
      { label: 'Local / Toll-Free Numbers', cells: ['yes','yes','yes'] },
      { label: 'Mobile App Included', cells: ['partial','yes','yes'] },
      { label: 'Auto-Attendant / IVR', cells: ['partial','yes','yes'] },
      { label: 'Call Recording', cells: ['no','partial','yes'] },
      { label: 'Teams Integration', cells: ['no','yes','yes'] },
      { label: 'Call Center / Queue Mgmt', cells: ['no','no','yes'] }
    ]
  },
  {
    id: 'tpl-cloud-hosting',
    category: 'Cloud',
    title: 'Cloud Hosting / Azure',
    desc: 'Shared vs Managed IaaS vs Dedicated',
    cols: 3,
    rows: 7,
    cols_data: [
      { label: 'Shared Cloud', sublabel: 'Entry', color: '#64748b' },
      { label: 'Managed Azure', sublabel: 'IaaS', color: '#0078d4' },
      { label: 'Dedicated / Private', sublabel: 'Enterprise', color: '#7c3aed' }
    ],
    features: [
      { label: 'Managed Infrastructure', cells: ['no','yes','yes'] },
      { label: 'Guaranteed SLA Uptime', cells: ['99.5%','99.9%','99.99%'] },
      { label: 'Auto-Scaling', cells: ['no','yes','yes'] },
      { label: 'Dedicated Firewall', cells: ['no','partial','yes'] },
      { label: 'Backup Included', cells: ['no','yes','yes'] },
      { label: 'Private Network (VNet)', cells: ['no','partial','yes'] },
      { label: 'Compliance (HIPAA/SOC2)', cells: ['no','partial','yes'] }
    ]
  },
  {
    id: 'tpl-noc',
    category: 'Managed Services',
    title: 'NOC & Help Desk',
    desc: 'Reactive / Proactive / Fully Managed support',
    cols: 3,
    rows: 7,
    cols_data: [
      { label: 'Reactive', sublabel: 'Break-Fix', color: '#dc2626' },
      { label: 'Proactive', sublabel: 'Monitored', color: '#d97706' },
      { label: 'Fully Managed', sublabel: 'Outsourced NOC', color: '#059669' }
    ],
    features: [
      { label: 'Hours of Coverage', cells: ['8×5','8×5','24×7×365'] },
      { label: 'Monitoring & Alerts', cells: ['no','yes','yes'] },
      { label: 'Ticket SLA Guarantee', cells: ['no','partial','yes'] },
      { label: 'Proactive Remediation', cells: ['no','partial','yes'] },
      { label: 'User Onboarding / Off', cells: ['billed','billed','yes'] },
      { label: 'Monthly Reporting', cells: ['no','yes','yes'] },
      { label: 'Dedicated Team', cells: ['no','no','yes'] }
    ]
  },
  {
    id: 'tpl-custom',
    category: 'Custom',
    title: 'Build Your Own',
    desc: 'Start from scratch or use AI to generate',
    cols: 3,
    rows: 5,
    cols_data: [
      { label: 'Tier 1', sublabel: '', color: '#2563eb' },
      { label: 'Tier 2', sublabel: '', color: '#10b981' },
      { label: 'Tier 3', sublabel: '', color: '#8b5cf6' }
    ],
    features: [
      { label: 'Feature 1', cells: ['yes','yes','yes'] },
      { label: 'Feature 2', cells: ['no','yes','yes'] },
      { label: 'Feature 3', cells: ['no','partial','yes'] },
      { label: 'Feature 4', cells: ['text','text','text'] },
      { label: 'Feature 5', cells: ['no','no','yes'] }
    ]
  }
];

const CATEGORIES = ['All', 'Microsoft 365', 'Managed Services', 'Security', 'Backup & DR', 'Cloud', 'Telecom', 'Custom'];

const COLOR_SCHEMES = [
  { id: 'scheme-slate-pro', name: 'Slate Pro', swatches: ['#2563eb','#0ea5e9','#10b981','#8b5cf6'] },
  { id: 'scheme-orange-fire', name: 'MSP Orange', swatches: ['#ea580c','#16a34a','#7c3aed','#1d4ed8'] },
  { id: 'scheme-purple-pro', name: 'Purple Pro', swatches: ['#7c3aed','#2563eb','#0891b2','#059669'] },
  { id: 'scheme-teal-corp', name: 'Teal Corp', swatches: ['#0d9488','#2563eb','#7c3aed','#dc2626'] },
  { id: 'scheme-msp-classic', name: 'MSP Classic', swatches: ['#1e40af','#065f46','#7e22ce','#c2410c'] },
  { id: 'scheme-midnight', name: 'Midnight', swatches: ['#334155','#475569','#64748b','#94a3b8'] },
  { id: 'scheme-light-corp', name: 'Light Corp', swatches: ['#2563eb','#059669','#7c3aed','#d97706'] }
];

const CELL_ICONS = {
  yes: '<span class="cell-check check-yes">✓</span>',
  no: '<span class="cell-check check-no">✕</span>',
  partial: '<span class="cell-check check-partial">◐</span>',
};

/* ── App State ──────────────────────────────────────────────── */
const state = {
  view: 'gallery',
  activeTemplate: null,
  activeCategory: 'All',
  activeScheme: 'scheme-slate-pro',
  selectedCell: null,
  aiLoading: false,
  exportTab: 'html'
};

/* ── DOM Refs ────────────────────────────────────────────────── */
let dom = {};

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  renderSchemeOptions();
  renderGallery();
  bindNav();
  bindExportTabs();
  bindModal();
  bindAiActions();
  setScheme('scheme-slate-pro');
});

function cacheDom() {
  dom = {
    body: document.body,
    viewGallery: document.getElementById('view-gallery'),
    viewEditor: document.getElementById('view-editor'),
    templateGrid: document.getElementById('template-grid'),
    filterChips: document.getElementById('filter-chips'),
    schemeGrid: document.getElementById('scheme-grid'),
    colColorList: document.getElementById('col-color-list'),
    matrixWrapper: document.getElementById('matrix-wrapper'),
    editorTitle: document.getElementById('editor-title'),
    exportCode: document.getElementById('export-code'),
    exportPanel: document.getElementById('export-panel'),
    toastContainer: document.getElementById('toast-container'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    aiPrompt: document.getElementById('ai-prompt'),
    aiLoading: document.getElementById('ai-loading'),
    btnBackGallery: document.getElementById('btn-back-gallery'),
    btnCopyHtml: document.getElementById('btn-copy-html'),
    btnSendSalesbuildr: document.getElementById('btn-send-salesbuildr'),
    btnAddRow: document.getElementById('btn-add-row-toolbar'),
    btnAddCol: document.getElementById('btn-add-col-toolbar'),
    btnAiGenerate: document.getElementById('btn-ai-generate'),
    btnAiSuggestRows: document.getElementById('btn-ai-suggest-rows'),
    btnAiBenefit: document.getElementById('btn-ai-benefit'),
    btnAiCompetitive: document.getElementById('btn-ai-competitive'),
  };
}

/* ── Gallery ─────────────────────────────────────────────────── */
function renderGallery() {
  renderFilters();
  renderTemplateCards();
}

function renderFilters() {
  dom.filterChips.innerHTML = CATEGORIES.map(cat =>
    `<div class="filter-chip ${cat === state.activeCategory ? 'active' : ''}" 
         onclick="filterCategory('${cat}')">${cat}</div>`
  ).join('');
}

function filterCategory(cat) {
  state.activeCategory = cat;
  renderFilters();
  renderTemplateCards();
}

function renderTemplateCards() {
  const filtered = state.activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === state.activeCategory);

  dom.templateGrid.innerHTML = filtered.map((tpl, i) => {
    const isCustom = tpl.id === 'tpl-custom';
    const previewHtml = isCustom
      ? `<div class="custom-card-icon">+</div>`
      : buildMiniMatrix(tpl);

    return `
      <div class="template-card ${isCustom ? 'custom-card' : ''}"
           style="animation-delay:${i * 0.025}s"
           onclick="openTemplate('${tpl.id}')">
        <div class="template-card-preview">${previewHtml}</div>
        <div class="template-card-body">
          <div class="template-card-badge">${tpl.category}</div>
          <div class="template-card-title">${tpl.title}</div>
          <div class="template-card-desc">${tpl.desc}</div>
          <div class="template-card-meta">
            <span>⊞ ${tpl.cols} tiers</span>
            <span>☰ ${tpl.rows} features</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function buildMiniMatrix(tpl) {
  const colColors = tpl.cols_data.map(c => c.color);
  const heads = colColors.map(c =>
    `<div class="mini-col-head" style="background:${c}"></div>`
  ).join('');

  const rows = tpl.features.slice(0, 4).map(f => {
    const cells = f.cells.map((v, ci) => {
      const cls = v === 'yes' ? 'check' : v === 'no' ? '' : 'circle';
      return `<div class="mini-cell ${cls}" style="background:${v==='yes'?colColors[ci]:''}"></div>`;
    }).join('');
    return `<div class="mini-row"><div class="mini-label"></div>${cells}</div>`;
  }).join('');

  return `<div class="mini-matrix">
    <div class="mini-matrix-header"><div class="mini-label"></div>${heads}</div>
    <div class="mini-matrix-body">${rows}</div>
  </div>`;
}

/* ── Open Template / Editor ──────────────────────────────────── */
function openTemplate(id) {
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl) return;

  // Deep clone so edits don't mutate original
  state.activeTemplate = JSON.parse(JSON.stringify(tpl));
  state.view = 'editor';

  showView('editor');
  dom.editorTitle.value = tpl.title;

  renderColColorPickers();
  renderMatrix();
  updateExportCode();
}

function showView(v) {
  dom.viewGallery.classList.toggle('active', v === 'gallery');
  dom.viewEditor.classList.toggle('active', v === 'editor');
  // Show/hide back button and new button
  const backBtn = document.getElementById('btn-back-gallery');
  const newBtn = document.getElementById('btn-new-template');
  if (backBtn) backBtn.style.display = v === 'editor' ? 'inline-flex' : 'none';
  if (newBtn) newBtn.style.display = v === 'gallery' ? 'inline-flex' : 'none';
}

/* ── Matrix Render ───────────────────────────────────────────── */
function renderMatrix() {
  const tpl = state.activeTemplate;
  if (!tpl) return;

  // Ensure col colors are set
  tpl.cols_data.forEach((col, i) => {
    if (!col.color) col.color = ['#2563eb','#10b981','#8b5cf6','#f59e0b','#ef4444'][i % 5];
  });

  const colWidth = Math.max(120, Math.floor(780 / (tpl.cols_data.length + 1)));

  let html = `
  <div class="matrix-title-display" contenteditable="true" 
       oninput="onTitleEdit(this.innerText)"
       spellcheck="false">${tpl.title}</div>
  <div class="matrix-subtitle-display" contenteditable="true"
       spellcheck="false">${tpl.desc || 'Edit subtitle...'}</div>

  <div class="matrix-table-wrap">
    <table class="matrix-table">
      <colgroup>
        <col style="width:180px">
        ${tpl.cols_data.map(() => `<col style="width:${colWidth}px">`).join('')}
        <col style="width:40px">
      </colgroup>
      <thead>
        <tr class="header-row">
          <th class="feat-header-cell">
            <div class="feat-header-label">FEATURE</div>
          </th>
          ${tpl.cols_data.map((col, ci) => `
            <th style="background:${col.color}; border-top-color:${col.color}" 
                class="col-header-cell"
                data-col="${ci}">
              <div class="col-header-inner">
                <span class="col-header-label" 
                      contenteditable="true" 
                      spellcheck="false"
                      oninput="onColLabelEdit(${ci}, 'label', this.innerText)"
                      onblur="onColLabelEdit(${ci}, 'label', this.innerText)">${col.label}</span>
                <span class="col-header-sublabel"
                      contenteditable="true"
                      spellcheck="false"
                      oninput="onColLabelEdit(${ci}, 'sublabel', this.innerText)"
                      onblur="onColLabelEdit(${ci}, 'sublabel', this.innerText)">${col.sublabel || ''}</span>
              </div>
            </th>`).join('')}
          <th class="add-col-header-cell">
            <button class="add-col-btn-inline" onclick="addColumn()" title="Add column">+</button>
          </th>
        </tr>
        <tr class="chevron-spacer">
          <td></td>
          ${tpl.cols_data.map(() => `<td style="background:var(--bg-surface)"></td>`).join('')}
          <td></td>
        </tr>
      </thead>
      <tbody>
        ${tpl.features.map((feat, ri) => `
          <tr data-row="${ri}">
            <td class="feat-label-cell">
              <span class="feat-label-text"
                    contenteditable="true"
                    spellcheck="false"
                    oninput="onFeatLabelEdit(${ri}, this.innerText)"
                    onblur="onFeatLabelEdit(${ri}, this.innerText)">${feat.label}</span>
            </td>
            ${feat.cells.map((cellVal, ci) => `
              <td class="matrix-cell"
                  data-row="${ri}" data-col="${ci}"
                  onclick="selectCell(${ri},${ci})"
                  ondblclick="cycleCell(${ri},${ci})">
                ${renderCellContent(cellVal, tpl.cols_data[ci].color)}
              </td>`).join('')}
            <td style="background:transparent;border:none;padding:4px 0 4px 6px;">
              <button class="row-delete-btn" onclick="deleteRow(${ri})" title="Delete row">×</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    <button class="add-row-btn" onclick="addRow()">+ Add Feature Row</button>
  </div>`;

  dom.matrixWrapper.innerHTML = html;
  updateExportCode();
}

function renderCellContent(val, colColor) {
  if (val === 'yes') return CELL_ICONS.yes;
  if (val === 'no') return CELL_ICONS.no;
  if (val === 'partial') return CELL_ICONS.partial;
  // Text value
  return `<span class="cell-text-val">${val}</span>`;
}

/* ── Cell interaction ────────────────────────────────────────── */
function selectCell(ri, ci) {
  // Clear previous
  document.querySelectorAll('.matrix-cell.selected-cell').forEach(el => el.classList.remove('selected-cell'));
  const el = document.querySelector(`[data-row="${ri}"][data-col="${ci}"]`);
  if (el) el.classList.add('selected-cell');
  state.selectedCell = { ri, ci };
}

function cycleCell(ri, ci) {
  const tpl = state.activeTemplate;
  const cycles = ['yes', 'no', 'partial'];
  const cur = tpl.features[ri].cells[ci];
  const idx = cycles.indexOf(cur);
  tpl.features[ri].cells[ci] = idx === -1 ? 'yes' : cycles[(idx + 1) % cycles.length];
  renderMatrix();
  selectCell(ri, ci);
}

function setCellValue(val) {
  if (!state.selectedCell) return;
  const { ri, ci } = state.selectedCell;
  state.activeTemplate.features[ri].cells[ci] = val;
  renderMatrix();
  selectCell(ri, ci);
}

/* ── Edit Handlers ───────────────────────────────────────────── */
function onTitleEdit(val) {
  state.activeTemplate.title = val;
  dom.editorTitle.value = val;
  updateExportCode();
}

function onColLabelEdit(ci, field, val) {
  state.activeTemplate.cols_data[ci][field] = val;
  renderColColorPickers();
  updateExportCode();
}

function onFeatLabelEdit(ri, val) {
  state.activeTemplate.features[ri].label = val;
  updateExportCode();
}

/* ── Struct controls ─────────────────────────────────────────── */
function addRow() {
  const tpl = state.activeTemplate;
  const emptyCells = tpl.cols_data.map(() => 'no');
  tpl.features.push({ label: 'New Feature', cells: emptyCells });
  renderMatrix();
}

function deleteRow(ri) {
  state.activeTemplate.features.splice(ri, 1);
  renderMatrix();
}

function addColumn() {
  const tpl = state.activeTemplate;
  const colors = ['#2563eb','#10b981','#8b5cf6','#f59e0b','#ef4444','#0891b2'];
  const newColor = colors[tpl.cols_data.length % colors.length];
  tpl.cols_data.push({ label: `Tier ${tpl.cols_data.length + 1}`, sublabel: '', color: newColor });
  tpl.features.forEach(f => f.cells.push('no'));
  renderMatrix();
  renderColColorPickers();
}

function deleteColumn(ci) {
  const tpl = state.activeTemplate;
  if (tpl.cols_data.length <= 1) { showToast('Need at least 1 column', 'error'); return; }
  tpl.cols_data.splice(ci, 1);
  tpl.features.forEach(f => f.cells.splice(ci, 1));
  renderMatrix();
  renderColColorPickers();
}

/* ── Col Color Pickers ───────────────────────────────────────── */
function renderColColorPickers() {
  const tpl = state.activeTemplate;
  if (!tpl) return;
  dom.colColorList.innerHTML = tpl.cols_data.map((col, ci) => `
    <div class="col-color-row">
      <span class="col-color-label">${col.label || 'Col '+(ci+1)}</span>
      <input type="color" class="col-color-input" value="${col.color}"
             title="Pick color"
             oninput="onColColorChange(${ci}, this.value)"
             onchange="onColColorChange(${ci}, this.value)">
      <button class="btn btn-ghost btn-sm" onclick="deleteColumn(${ci})" title="Remove column" style="padding:2px 5px;color:#ef4444">×</button>
    </div>`
  ).join('');
}

function onColColorChange(ci, color) {
  state.activeTemplate.cols_data[ci].color = color;
  renderMatrix();
}

/* ── Color Scheme ────────────────────────────────────────────── */
function renderSchemeOptions() {
  dom.schemeGrid.innerHTML = COLOR_SCHEMES.map(s => `
    <div class="scheme-option ${s.id === state.activeScheme ? 'active' : ''}"
         onclick="setScheme('${s.id}')">
      <div class="scheme-swatches">
        ${s.swatches.map(c => `<div class="scheme-swatch" style="background:${c}"></div>`).join('')}
      </div>
      <div class="scheme-name">${s.name}</div>
    </div>`
  ).join('');
}

function setScheme(id) {
  state.activeScheme = id;
  // Remove all scheme classes
  const classes = COLOR_SCHEMES.map(s => s.id);
  dom.body.classList.remove(...classes);
  dom.body.classList.add(id);
  renderSchemeOptions();
  if (state.activeTemplate) renderMatrix();
}

/* ── Export / Copy HTML ──────────────────────────────────────── */
function generateHtml() {
  const tpl = state.activeTemplate;
  if (!tpl) return '';

  const title = dom.editorTitle.value || tpl.title;
  const colCount = tpl.cols_data.length;
  const featColW = 180;
  const dataColW = Math.max(130, Math.floor(780 / colCount));

  // Build inline-styled HTML for TinyMCE / Salesbuildr
  let html = `<!-- Matrix Creator — ${title} -->
<table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${featColW + (dataColW * colCount)}px;border-collapse:collapse;border-radius:12px;overflow:hidden;font-family:'DM Sans',Arial,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
  <thead>
    <tr>
      <th style="background:#1c2840;padding:18px 16px;text-align:left;width:${featColW}px;border-right:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4a5a7a;">FEATURE</span>
      </th>
      ${tpl.cols_data.map(col => `
      <th style="background:${col.color};padding:18px 12px;text-align:center;width:${dataColW}px;">
        <span style="display:block;font-size:14px;font-weight:800;color:#fff;letter-spacing:0.05em;text-transform:uppercase;">${col.label}</span>
        ${col.sublabel ? `<span style="display:block;font-size:11px;color:rgba(255,255,255,0.75);margin-top:2px;">${col.sublabel}</span>` : ''}
      </th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${tpl.features.map((feat, ri) => `
    <tr style="background:${ri % 2 === 0 ? '#151e2d' : '#1a2535'};">
      <td style="padding:13px 16px;border-right:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.06);">
        <span style="font-size:13px;font-weight:600;color:#f0f4ff;">${feat.label}</span>
      </td>
      ${feat.cells.map(cellVal => `
      <td style="padding:12px 8px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
        ${cellHtmlInline(cellVal)}
      </td>`).join('')}
    </tr>`).join('')}
  </tbody>
</table>`;

  return html;
}

function cellHtmlInline(val) {
  if (val === 'yes') return `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;font-size:13px;">✓</span>`;
  if (val === 'no') return `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:rgba(239,68,68,0.08);color:rgba(239,68,68,0.5);font-size:10px;">✕</span>`;
  if (val === 'partial') return `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:rgba(245,158,11,0.15);color:#f59e0b;font-size:16px;">◐</span>`;
  return `<span style="font-size:12px;font-weight:500;color:#8b9dc3;">${val}</span>`;
}

function updateExportCode() {
  if (!dom.exportCode) return;
  const code = generateHtml();
  dom.exportCode.textContent = code;
}

function copyHtml() {
  const code = generateHtml();
  navigator.clipboard.writeText(code).then(() => {
    showToast('✓ HTML copied to clipboard', 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('✓ HTML copied', 'success');
  });
}

/* ── Export Tabs ─────────────────────────────────────────────── */
function bindExportTabs() {
  document.querySelectorAll('.export-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.export-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.exportTab = tab.dataset.tab;
      if (state.exportTab === 'html') updateExportCode();
    });
  });
}

/* ── Salesbuildr Send ────────────────────────────────────────── */
function sendToSalesbuildr() {
  const html = generateHtml();
  const title = state.activeTemplate ? state.activeTemplate.title : 'Matrix';

  // Use existing Salesbuildr widget module pattern
  if (typeof window.SalesbuildrAPI !== 'undefined') {
    window.SalesbuildrAPI.insertWidget({ type: 'html', content: html, title })
      .then(() => showToast('✓ Sent to Salesbuildr', 'success'))
      .catch(err => showToast('Salesbuildr error: ' + err.message, 'error'));
    return;
  }

  // Stub / fallback — opens modal explaining setup
  openSalesbuildrModal(html, title);
}

function openSalesbuildrModal(html, title) {
  const modal = document.getElementById('modal-backdrop');
  document.getElementById('modal-title').textContent = 'Send to Salesbuildr';
  document.getElementById('modal-body').innerHTML = `
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">
      The Salesbuildr Public API connection is not configured for this instance.
      You can copy the HTML and paste it directly into a TinyMCE widget in Salesbuildr.
    </p>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn btn-primary" onclick="copyHtml();closeModal()">Copy HTML & Close</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>`;
  document.getElementById('modal-footer').innerHTML = '';
  modal.classList.add('open');
}

/* ── Navigation ──────────────────────────────────────────────── */
function bindNav() {
  document.getElementById('btn-back-gallery').addEventListener('click', () => {
    state.view = 'gallery';
    showView('gallery');
  });

  document.getElementById('btn-new-template').addEventListener('click', () => {
    openTemplate('tpl-custom');
  });

  document.getElementById('btn-copy-html').addEventListener('click', copyHtml);
  document.getElementById('btn-send-salesbuildr').addEventListener('click', sendToSalesbuildr);

  document.getElementById('btn-add-row-toolbar').addEventListener('click', addRow);
  document.getElementById('btn-add-col-toolbar').addEventListener('click', addColumn);

  // Cell style buttons
  document.querySelectorAll('.cell-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      if (state.selectedCell) {
        setCellValue(val);
      } else {
        showToast('Click a cell first to select it, then set its value', 'info');
      }
    });
  });

  // Editor title input
  document.getElementById('editor-title').addEventListener('input', e => {
    if (state.activeTemplate) state.activeTemplate.title = e.target.value;
    const el = dom.matrixWrapper.querySelector('.matrix-title-display');
    if (el) el.innerText = e.target.value;
    updateExportCode();
  });
}

/* ── Modal ──────────────────────────────────────────────────── */
function bindModal() {
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

/* ── AI Features ─────────────────────────────────────────────── */
function bindAiActions() {
  document.getElementById('btn-ai-generate').addEventListener('click', aiGenerateMatrix);
  document.getElementById('btn-ai-suggest-rows').addEventListener('click', aiSuggestRows);
  document.getElementById('btn-ai-benefit').addEventListener('click', aiRewriteBenefit);
  document.getElementById('btn-ai-competitive').addEventListener('click', aiCompetitiveFill);
}

function setAiLoading(on) {
  state.aiLoading = on;
  dom.aiLoading.style.display = on ? 'flex' : 'none';
  [dom.btnAiGenerate, dom.btnAiSuggestRows, dom.btnAiBenefit, dom.btnAiCompetitive].forEach(btn => {
    btn.disabled = on;
    btn.style.opacity = on ? '0.5' : '1';
  });
}

async function callClaude(systemPrompt, userMsg) {
  const res = await fetch('/.netlify/functions/matrix-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemPrompt, userMsg })
  });
  if (!res.ok) throw new Error('API error ' + res.status);
  const data = await res.json();
  return data.text || '';
}

/* AI 1: Generate matrix from description */
async function aiGenerateMatrix() {
  const prompt = dom.aiPrompt.value.trim();
  if (!prompt) { showToast('Enter a description first', 'info'); return; }

  setAiLoading(true);
  try {
    const system = `You are an MSP quoting expert. Generate a comparison matrix as JSON only. 
No markdown, no backticks, no explanation. Return exactly this structure:
{"title":"...", "desc":"...", "cols_data":[{"label":"...","sublabel":"...","color":"..."}], 
"features":[{"label":"...","cells":["yes"|"no"|"partial"|"text value",...]}]}
Use 2-4 columns, 5-10 features. Colors: hex codes appropriate for corporate SaaS. 
Cells: use "yes", "no", "partial", or short text like "24/7" or "10GB".`;

    const raw = await callClaude(system, `Generate a MSP service comparison matrix for: ${prompt}`);
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    parsed.id = 'tpl-ai-' + Date.now();
    parsed.category = 'AI Generated';
    parsed.cols = parsed.cols_data.length;
    parsed.rows = parsed.features.length;

    state.activeTemplate = parsed;
    dom.editorTitle.value = parsed.title;
    renderColColorPickers();
    renderMatrix();
    showToast('✓ Matrix generated by AI', 'success');
    dom.aiPrompt.value = '';
  } catch (err) {
    console.error(err);
    showToast('AI error — check console', 'error');
  } finally {
    setAiLoading(false);
  }
}

/* AI 2: Suggest additional feature rows */
async function aiSuggestRows() {
  const tpl = state.activeTemplate;
  if (!tpl) { showToast('Open a template first', 'info'); return; }

  setAiLoading(true);
  try {
    const existing = tpl.features.map(f => f.label).join(', ');
    const cols = tpl.cols_data.map(c => c.label).join(', ');
    const system = `You are an MSP services expert. Suggest additional comparison rows for a matrix.
Return JSON only, no explanation: {"suggestions":[{"label":"...","cells":["yes"|"no"|"partial"|"short text",...]}]}
Return 3-5 suggestions. Match number of cells to column count.`;

    const raw = await callClaude(system,
      `Matrix title: "${tpl.title}"\nColumns: ${cols}\nExisting features: ${existing}\nSuggest new feature rows.`);
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Show in modal for user to select
    showSuggestionModal(parsed.suggestions);
  } catch (err) {
    console.error(err);
    showToast('AI error — check console', 'error');
  } finally {
    setAiLoading(false);
  }
}

function showSuggestionModal(suggestions) {
  const modal = document.getElementById('modal-backdrop');
  document.getElementById('modal-title').textContent = '✦ AI Suggested Rows';
  document.getElementById('modal-body').innerHTML = `
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">
      Select the rows you'd like to add to your matrix:
    </p>
    ${suggestions.map((s, i) => `
      <label style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;background:var(--bg-card)">
        <input type="checkbox" id="sug-${i}" checked style="accent-color:var(--col-1)">
        <span style="font-size:13px;color:var(--text-primary);">${s.label}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${s.cells.join(' / ')}</span>
      </label>`).join('')}`;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="addSuggestedRows(${JSON.stringify(suggestions).replace(/"/g, '&quot;')})">Add Selected</button>`;
  modal.classList.add('open');
}

function addSuggestedRows(suggestions) {
  suggestions.forEach((s, i) => {
    const cb = document.getElementById('sug-' + i);
    if (cb && cb.checked) {
      // Ensure correct cell count
      while (s.cells.length < state.activeTemplate.cols_data.length) s.cells.push('no');
      s.cells = s.cells.slice(0, state.activeTemplate.cols_data.length);
      state.activeTemplate.features.push(s);
    }
  });
  renderMatrix();
  closeModal();
  showToast('✓ Rows added', 'success');
}

/* AI 3: Rewrite selected cell as client-facing benefit */
async function aiRewriteBenefit() {
  if (!state.selectedCell) { showToast('Click a cell to select it first', 'info'); return; }
  const { ri, ci } = state.selectedCell;
  const tpl = state.activeTemplate;
  const feat = tpl.features[ri].label;
  const col = tpl.cols_data[ci].label;
  const cur = tpl.features[ri].cells[ci];

  if (['yes','no','partial'].includes(cur)) {
    showToast('Select a text cell (not yes/no) to rewrite', 'info');
    return;
  }

  setAiLoading(true);
  try {
    const system = `You are an MSP marketing expert. Rewrite a feature description as a short, compelling client benefit.
Return only the rewritten text, no quotes, no explanation. Max 5 words.`;
    const text = await callClaude(system,
      `Feature: "${feat}"\nTier: "${col}"\nCurrent value: "${cur}"\nRewrite as a client benefit.`);

    tpl.features[ri].cells[ci] = text.trim().replace(/^["']|["']$/g, '');
    renderMatrix();
    selectCell(ri, ci);
    showToast('✓ Rewritten by AI', 'success');
  } catch (err) {
    console.error(err);
    showToast('AI error', 'error');
  } finally {
    setAiLoading(false);
  }
}

/* AI 4: Competitive fill — fill matrix from two product names */
async function aiCompetitiveFill() {
  const prompt = dom.aiPrompt.value.trim();
  if (!prompt) {
    dom.aiPrompt.placeholder = 'e.g. "Compare Datto BCDR vs Veeam vs Acronis"';
    showToast('Enter product names to compare in the prompt box above', 'info');
    return;
  }

  setAiLoading(true);
  try {
    const tpl = state.activeTemplate;
    const cols = tpl ? tpl.cols_data.map(c => c.label).join(', ') : '';
    const system = `You are a technology product expert specializing in MSP/IT vendor comparisons.
Fill in a comparison matrix based on real product capabilities. Return JSON only:
{"cols_data":[{"label":"...","sublabel":"pricing/version","color":"hex"}], 
"features":[{"label":"...","cells":["yes"|"no"|"partial"|"short text",...]}]}
8-12 features. Match products to column colors appropriately.`;

    const raw = await callClaude(system,
      `${prompt}. ${cols ? `Current columns: ${cols}.` : ''} Fill a competitive comparison matrix.`);
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (tpl) {
      tpl.cols_data = parsed.cols_data;
      tpl.features = parsed.features;
    } else {
      state.activeTemplate = { ...parsed, id: 'tpl-comp-' + Date.now(), title: prompt, category: 'Competitive' };
      dom.editorTitle.value = state.activeTemplate.title;
    }

    renderColColorPickers();
    renderMatrix();
    showToast('✓ Competitive matrix filled', 'success');
    dom.aiPrompt.value = '';
  } catch (err) {
    console.error(err);
    showToast('AI error — check console', 'error');
  } finally {
    setAiLoading(false);
  }
}

/* ── Toast ──────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ── Expose globals needed by inline HTML handlers ───────────── */
window.filterCategory = filterCategory;
window.openTemplate = openTemplate;
window.selectCell = selectCell;
window.cycleCell = cycleCell;
window.setCellValue = setCellValue;
window.onTitleEdit = onTitleEdit;
window.onColLabelEdit = onColLabelEdit;
window.onFeatLabelEdit = onFeatLabelEdit;
window.addRow = addRow;
window.deleteRow = deleteRow;
window.addColumn = addColumn;
window.deleteColumn = deleteColumn;
window.onColColorChange = onColColorChange;
window.copyHtml = copyHtml;
window.sendToSalesbuildr = sendToSalesbuildr;
window.closeModal = closeModal;
window.addSuggestedRows = addSuggestedRows;
window.setScheme = setScheme;
