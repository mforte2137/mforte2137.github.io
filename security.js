/* ============================================================
   SECURITY PROPOSAL BUILDER — security.js
   ============================================================ */

// ── DOM REFERENCES ──────────────────────────────────────────
const stepBtns       = document.querySelectorAll('.step-btn');
const stepPanels     = document.querySelectorAll('.step-panel');
const stepIndicator  = document.getElementById('stepIndicator');

// Step 1
const step1Next      = document.getElementById('step1Next');
const frameworkCards = document.querySelectorAll('.framework-card:not(.coming-soon)');

// Step 2
const step2Back      = document.getElementById('step2Back');
const step2Next      = document.getElementById('step2Next');
const clientName     = document.getElementById('clientName');
const clientIndustry = document.getElementById('clientIndustry');
const engagementType = document.getElementById('engagementType');
const igOptions      = document.querySelectorAll('.ig-option');
const userCount      = document.getElementById('userCount');
const regChecks      = document.querySelectorAll('.reg-check input');

// Step 3
const step3Back      = document.getElementById('step3Back');
const step3Next      = document.getElementById('step3Next');
const assessmentRows = document.getElementById('assessmentRows');
const completionPct  = document.getElementById('completionPct');

// Step 4
const step4Back      = document.getElementById('step4Back');
const step4Next      = document.getElementById('step4Next');
const primaryColor   = document.getElementById('primaryColor');
const primaryHex     = document.getElementById('primaryHex');
const secondaryColor = document.getElementById('secondaryColor');
const secondaryHex   = document.getElementById('secondaryHex');
const presetBtns     = document.querySelectorAll('.preset-btn');
const mspName        = document.getElementById('mspName');
const previewHeader  = document.getElementById('previewHeader');
const previewAccent  = document.getElementById('previewAccent');
const previewSub     = document.getElementById('previewSub');

// Step 5
const step5Back          = document.getElementById('step5Back');
const copyAllBtn         = document.getElementById('copyAllBtn');
const widgetsLoading     = document.getElementById('widgetsLoading');
const widgetsContainer   = document.getElementById('widgetsContainer');
const widgetStepActions  = document.getElementById('widgetStepActions');
const loadingStep        = document.getElementById('loadingStep');
const sbTenantUrl        = document.getElementById('sbTenantUrl');
const sbApiKey           = document.getElementById('sbApiKey');
const saveSbCreds        = document.getElementById('saveSbCreds');
const sbStatus           = document.getElementById('sbStatus');
const toast              = document.getElementById('toast');

// ── STATE ───────────────────────────────────────────────────
let state = {
  currentStep: 1,
  framework:   'cis',
  client: {
    name:       '',
    industry:   '',
    engagement: 'assessment',
    ig:         1,
    userCount:  '',
    regulations: []
  },
  assessment:  [],   // { id, current, ideal, notes }
  theme: {
    primary:   '#1a3a5c',
    secondary: '#e8840a'
  },
  widgets:     {}   // { execSummary, currentState, gapAnalysis, idealState, riskLandscape, roadmap }
};

// ── CIS CONTROLS DATA ───────────────────────────────────────
const CIS_CONTROLS = [
  { id: 1,  name: 'Inventory & Control of Enterprise Assets',   desc: 'Actively manage all enterprise assets to accurately map the attack surface.',                           ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 2,  name: 'Inventory & Control of Software Assets',     desc: 'Actively manage all software to prevent unauthorized software from being installed.',                  ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 3,  name: 'Data Protection',                            desc: 'Develop processes to identify, classify, securely handle, retain, and dispose of data.',               ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 4,  name: 'Secure Configuration of Enterprise Assets',  desc: 'Establish and maintain secure configurations for all enterprise assets and software.',                  ig: 1, defaultIG1: 'partial',       defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 5,  name: 'Account Management',                         desc: 'Use processes to assign and manage authorization to credentials for all accounts.',                     ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 6,  name: 'Access Control Management',                  desc: 'Use processes to create, assign, manage, and revoke access credentials and privileges.',               ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 7,  name: 'Continuous Vulnerability Management',        desc: 'Develop a plan to continuously assess and track vulnerabilities and remediate appropriately.',          ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 8,  name: 'Audit Log Management',                       desc: 'Collect, alert, review, and retain audit logs to detect, understand, or recover from an attack.',      ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 9,  name: 'Email & Web Browser Protections',           desc: 'Improve protections and detections of threats through email and web vectors.',                          ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 10, name: 'Malware Defenses',                           desc: 'Prevent or control the installation, spread, and execution of malicious applications.',                ig: 1, defaultIG1: 'implemented',   defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 11, name: 'Data Recovery',                              desc: 'Establish and maintain data recovery practices to restore assets to pre-incident state.',               ig: 1, defaultIG1: 'partial',       defaultIG2: 'implemented', defaultIG3: 'implemented' },
  { id: 12, name: 'Network Infrastructure Management',          desc: 'Establish and maintain the integrity of the network infrastructure.',                                   ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 13, name: 'Network Monitoring & Defense',               desc: 'Operate processes to defend against threats to network infrastructure and services.',                   ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 14, name: 'Security Awareness & Skills Training',       desc: 'Establish and maintain a security awareness program to influence behavior among the workforce.',        ig: 1, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 15, name: 'Service Provider Management',                desc: 'Develop a process to evaluate service providers who hold sensitive data or are critical to operations.',ig: 2, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
  { id: 16, name: 'Application Software Security',              desc: 'Manage the security lifecycle of in-house developed, hosted, or acquired software.',                    ig: 2, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
  { id: 17, name: 'Incident Response Management',               desc: 'Establish a program to prepare, detect, contain, and recover from incidents.',                          ig: 2, defaultIG1: 'none',          defaultIG2: 'partial',     defaultIG3: 'implemented' },
  { id: 18, name: 'Penetration Testing',                        desc: 'Test the effectiveness and resiliency of enterprise assets through simulated attack scenarios.',         ig: 3, defaultIG1: 'none',          defaultIG2: 'none',        defaultIG3: 'partial'     },
];

// Score map
const SCORE = { 'none': 0, 'partial': 1, 'implemented': 2 };
const SCORE_LABEL = { 'none': 'Not Started', 'partial': 'Partial', 'implemented': 'Implemented' };

// ── NAVIGATION ──────────────────────────────────────────────
function goToStep(n) {
  state.currentStep = n;
  stepPanels.forEach(p => p.classList.remove('active'));
  stepBtns.forEach(b => {
    const s = parseInt(b.dataset.step);
    b.classList.remove('active', 'completed');
    if (s === n) b.classList.add('active');
    if (s < n)   b.classList.add('completed');
  });
  document.getElementById(`step${n}`).classList.add('active');
  stepIndicator.textContent = `STEP ${n} OF 5`;
  window.scrollTo(0, 0);
}

// ── STEP 1 ───────────────────────────────────────────────────
frameworkCards.forEach(card => {
  card.addEventListener('click', () => {
    frameworkCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.framework = card.dataset.framework;
  });
});

step1Next.addEventListener('click', () => goToStep(2));

// ── STEP 2 ───────────────────────────────────────────────────
igOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    igOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    state.client.ig = parseInt(opt.dataset.ig);
  });
});

userCount.addEventListener('input', () => {
  const n = parseInt(userCount.value);
  if (!isNaN(n)) {
    let ig = n <= 100 ? 1 : n <= 500 ? 2 : 3;
    igOptions.forEach(o => {
      o.classList.remove('selected');
      if (parseInt(o.dataset.ig) === ig) o.classList.add('selected');
    });
    state.client.ig = ig;
  }
});

step2Back.addEventListener('click', () => goToStep(1));
step2Next.addEventListener('click', () => {
  state.client.name       = clientName.value.trim();
  state.client.industry   = clientIndustry.value;
  state.client.engagement = engagementType.value;
  state.client.userCount  = userCount.value;
  state.client.regulations = Array.from(regChecks).filter(c => c.checked).map(c => c.value);

  if (!state.client.name) {
    showToast('Please enter a client name.');
    return;
  }
  buildAssessment();
  goToStep(3);
});

// ── STEP 3 ───────────────────────────────────────────────────
function buildAssessment() {
  const ig = state.client.ig;
  const defaultKey = `defaultIG${ig}`;

  // preserve any existing notes/values
  const existing = {};
  state.assessment.forEach(a => { existing[a.id] = a; });

  state.assessment = CIS_CONTROLS.map(ctrl => ({
    id:      ctrl.id,
    current: existing[ctrl.id]?.current ?? ctrl[defaultKey],
    ideal:   existing[ctrl.id]?.ideal   ?? getIdealDefault(ctrl, ig),
    notes:   existing[ctrl.id]?.notes   ?? ''
  }));

  renderAssessmentRows();
}

function getIdealDefault(ctrl, ig) {
  // Ideal state is always Implemented — that is the target regardless of IG tier.
  // The MSP can manually lower individual controls if there is a specific reason.
  return 'implemented';
}

function renderAssessmentRows() {
  assessmentRows.innerHTML = '';
  CIS_CONTROLS.forEach((ctrl, idx) => {
    const a = state.assessment[idx];
    const igNum = ctrl.ig;
    const igColor = igNum === 1 ? '#2d7a4f' : igNum === 2 ? '#c9830a' : '#c9303a';

    const row = document.createElement('div');
    row.className = 'assessment-row';
    row.innerHTML = `
      <div class="row-num">${ctrl.id}</div>
      <div>
        <div class="row-control-name">${ctrl.name}</div>
        <div class="row-control-desc">${ctrl.desc}</div>
      </div>
      <div>
        <span class="row-ig" style="background:${igColor}">IG${igNum}</span>
      </div>
      <div>
        <select class="state-select val-${a.current}" data-idx="${idx}" data-type="current">
          <option value="none"          ${a.current === 'none'          ? 'selected' : ''}>Not Started</option>
          <option value="partial"       ${a.current === 'partial'       ? 'selected' : ''}>Partial</option>
          <option value="implemented"   ${a.current === 'implemented'   ? 'selected' : ''}>Implemented</option>
        </select>
      </div>
      <div>
        <select class="state-select val-${a.ideal}" data-idx="${idx}" data-type="ideal">
          <option value="none"          ${a.ideal === 'none'          ? 'selected' : ''}>Not Started</option>
          <option value="partial"       ${a.ideal === 'partial'       ? 'selected' : ''}>Partial</option>
          <option value="implemented"   ${a.ideal === 'implemented'   ? 'selected' : ''}>Implemented</option>
        </select>
      </div>
      <div>
        <textarea class="notes-input" data-idx="${idx}" placeholder="Optional notes...">${a.notes}</textarea>
      </div>
    `;
    assessmentRows.appendChild(row);
  });

  // Events
  assessmentRows.querySelectorAll('.state-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx = parseInt(sel.dataset.idx);
      const type = sel.dataset.type;
      state.assessment[idx][type] = sel.value;
      sel.className = `state-select val-${sel.value}`;
      updateCompletion();
    });
  });
  assessmentRows.querySelectorAll('.notes-input').forEach(ta => {
    ta.addEventListener('input', () => {
      state.assessment[parseInt(ta.dataset.idx)].notes = ta.value;
    });
  });

  updateCompletion();
}

function updateCompletion() {
  const filled = state.assessment.filter(a => a.current !== '').length;
  completionPct.textContent = Math.round((filled / state.assessment.length) * 100) + '%';
}

step3Back.addEventListener('click', () => goToStep(2));
step3Next.addEventListener('click', () => goToStep(4));

// ── STEP 4 ───────────────────────────────────────────────────
function applyTheme(primary, secondary) {
  state.theme.primary   = primary;
  state.theme.secondary = secondary;
  document.documentElement.style.setProperty('--accent-a', primary);
  document.documentElement.style.setProperty('--accent-b', secondary);
  primaryColor.value   = primary;
  primaryHex.value     = primary;
  secondaryColor.value = secondary;
  secondaryHex.value   = secondary;
  previewHeader.style.background    = primary;
  previewAccent.style.background    = secondary;
  document.querySelectorAll('.preview-pill.impl').forEach(el => el.style.background = primary);
  document.querySelectorAll('.preview-pill.gap').forEach(el => el.style.background = '#c9303a');
  // update step nav active border
  document.querySelectorAll('.step-btn.active').forEach(b => b.style.borderBottomColor = primary);
}

primaryColor.addEventListener('input', () => { primaryHex.value = primaryColor.value; applyTheme(primaryColor.value, state.theme.secondary); });
primaryHex.addEventListener('input',   () => { if (/^#[0-9a-f]{6}$/i.test(primaryHex.value)) { primaryColor.value = primaryHex.value; applyTheme(primaryHex.value, state.theme.secondary); } });
secondaryColor.addEventListener('input', () => { secondaryHex.value = secondaryColor.value; applyTheme(state.theme.primary, secondaryColor.value); });
secondaryHex.addEventListener('input',   () => { if (/^#[0-9a-f]{6}$/i.test(secondaryHex.value)) { secondaryColor.value = secondaryHex.value; applyTheme(state.theme.primary, secondaryHex.value); } });

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.primary, btn.dataset.secondary));
});

mspName.addEventListener('input', () => {
});

step4Back.addEventListener('click', () => goToStep(3));
step4Next.addEventListener('click', () => {
  goToStep(5);
  generateWidgets();
});

// ── STEP 5 — WIDGET GENERATION ──────────────────────────────
async function generateWidgets() {
  widgetsLoading.style.display    = 'block';
  widgetsContainer.style.display  = 'none';
  widgetStepActions.style.display = 'none';

  // Build gap data
  const gaps = computeGaps();

  // 1. Generate non-AI widgets first (instant)
  loadingStep.textContent = 'Building current state table...';
  state.widgets.currentState  = buildCurrentStateWidget();
  state.widgets.gapAnalysis   = buildGapAnalysisWidget(gaps);
  state.widgets.idealState    = buildIdealStateWidget();
  state.widgets.riskLandscape = buildRiskLandscapeWidget(gaps);

  // 2. AI widgets
  loadingStep.textContent = 'Generating executive summary with AI...';
  try {
    const aiResult = await callAI(gaps);
    state.widgets.execSummary = aiResult.execSummary;
    state.widgets.roadmap     = aiResult.roadmap;
  } catch (e) {
    state.widgets.execSummary = buildFallbackExecSummary(gaps);
    state.widgets.roadmap     = buildFallbackRoadmap(gaps);
  }

  // Render all
  loadingStep.textContent = 'Rendering widgets...';
  renderWidgets();

  widgetsLoading.style.display    = 'none';
  widgetsContainer.style.display  = 'flex';
  widgetStepActions.style.display = 'flex';
}

function computeGaps() {
  return state.assessment.map((a, idx) => {
    const ctrl  = CIS_CONTROLS[idx];
    const cScore = SCORE[a.current];
    const iScore = SCORE[a.ideal];
    const gap    = iScore - cScore;
    let risk = 'Low';
    if (gap === 2) risk = 'Critical';
    else if (gap === 1 && iScore === 2) risk = 'High';
    else if (gap === 1) risk = 'Medium';
    return {
      id:           ctrl.id,
      name:         ctrl.name,
      ig:           ctrl.ig,
      current:      a.current,
      ideal:        a.ideal,
      notes:        a.notes,
      gap:          gap,
      risk:         gap === 0 ? 'None' : risk,
      currentLabel: SCORE_LABEL[a.current],
      idealLabel:   SCORE_LABEL[a.ideal]
    };
  });
}

// ── WIDGET BUILDERS ─────────────────────────────────────────
const P  = () => state.theme.primary;
const S  = () => state.theme.secondary;
const cn = () => state.client.name || 'Your Client';
const dt = () => new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

function wrapWidget(title, content) {
  // {{company.name}} and {{siteTitle}} are Salesbuildr template variables —
  // they resolve to the client company name and MSP site title at render time.
  // {{date quote.createdAt}} resolves to the proposal creation date.
  // {{company.accountManager.fullName}} resolves to the assigned account manager.
  return `<div style="font-family:Arial,Helvetica,sans-serif;width:100%;max-width:100%;color:#1a1a18;">
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="background:${P()};color:#ffffff;padding:14px 18px;">
        <div style="font-size:14px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;">${title}</div>
        <div style="font-size:11px;opacity:0.7;margin-top:3px;letter-spacing:0.06em;">{{company.name}} &nbsp;·&nbsp; CIS Controls v8 &nbsp;·&nbsp; {{date quote.createdAt}}</div>
      </td>
    </tr>
  </table>
  ${content}
  <table style="width:100%;border-collapse:collapse;margin-top:0;">
    <tr><td colspan="2" style="background:${S()};height:4px;padding:0;"></td></tr>
    <tr>
      <td style="padding:8px 18px;background:#f5f2eb;font-size:10px;color:#8a8680;letter-spacing:0.08em;">
        PREPARED BY {{siteTitle}} &nbsp;·&nbsp; {{company.accountManager.fullName}} &nbsp;·&nbsp; {{company.accountManager.email}} &nbsp;·&nbsp; CONFIDENTIAL
      </td>
      <td style="padding:8px 18px;background:#f5f2eb;text-align:right;">
        {{image company.accountManager.signature.imageUrl height=30}}
      </td>
    </tr>
  </table>
</div>`;
}

function buildCurrentStateWidget() {
  let rows = '';
  state.assessment.forEach((a, idx) => {
    const ctrl = CIS_CONTROLS[idx];
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    const statusColor = a.current === 'implemented' ? '#2d7a4f' : a.current === 'partial' ? '#c9830a' : '#999';
    const igColor = ctrl.ig === 1 ? '#2d7a4f' : ctrl.ig === 2 ? '#c9830a' : '#c9303a';
    const notesCell = a.notes
      ? `<td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:11px;color:#5a5750;font-style:italic;">${a.notes}</td>`
      : '<td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;"></td>';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;white-space:nowrap;color:#8a8680;">${ctrl.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;width:99%;">${ctrl.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${igColor};color:white;padding:2px 8px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">IG${ctrl.ig}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${statusColor};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${SCORE_LABEL[a.current].toUpperCase()}</span>
      </td>
      ${notesCell}
    </tr>`;
  });

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:auto;">
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;white-space:nowrap;">#</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;width:99%;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">IG</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Status</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;white-space:nowrap;">Notes</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('CURRENT SECURITY POSTURE', content);
}

function buildGapAnalysisWidget(gaps) {
  const activeGaps = gaps.filter(g => g.gap > 0);
  let rows = '';
  activeGaps.forEach((g, idx) => {
    const riskBg = g.risk === 'Critical' ? '#c9303a' : g.risk === 'High' ? '#c9830a' : g.risk === 'Medium' ? '#c9a30a' : '#666';
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;width:99%;">${g.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:#999;color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.currentLabel.toUpperCase()}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${P()};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.idealLabel.toUpperCase()}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${riskBg};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${g.risk.toUpperCase()}</span>
      </td>
    </tr>`;
  });

  if (activeGaps.length === 0) {
    rows = `<tr><td colspan="4" style="padding:20px;text-align:center;font-size:13px;color:#2d7a4f;font-weight:bold;">No gaps identified — all controls meet target state.</td></tr>`;
  }

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:auto;">
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;width:99%;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Current</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Target</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Risk</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('GAP ANALYSIS', content);
}

function buildIdealStateWidget() {
  let rows = '';
  state.assessment.forEach((a, idx) => {
    const ctrl = CIS_CONTROLS[idx];
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#faf8f4';
    const statusColor = a.ideal === 'implemented' ? '#2d7a4f' : a.ideal === 'partial' ? '#c9830a' : '#999';
    rows += `<tr style="background:${bgColor};">
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;white-space:nowrap;color:#8a8680;">${ctrl.id}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;font-size:12px;width:99%;">${ctrl.name}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e8e4dc;text-align:center;white-space:nowrap;">
        <span style="background:${statusColor};color:white;padding:3px 10px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${SCORE_LABEL[a.ideal].toUpperCase()}</span>
      </td>
    </tr>`;
  });

  const content = `
  <table style="width:100%;border-collapse:collapse;table-layout:auto;">
    <tr style="background:#2d2d2d;">
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;white-space:nowrap;">#</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:left;width:99%;">Control Domain</th>
      <th style="padding:8px 10px;color:#f5f2eb;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;white-space:nowrap;">Target State</th>
    </tr>
    ${rows}
  </table>`;
  return wrapWidget('IDEAL SECURITY ENVIRONMENT', content);
}

function buildRiskLandscapeWidget(gaps) {
  // Heat map: domains as rows, risk level as colored cell
  const categories = [
    { label: 'Asset & Data Management', ids: [1, 2, 3] },
    { label: 'Configuration & Access',  ids: [4, 5, 6] },
    { label: 'Vulnerability & Logging', ids: [7, 8] },
    { label: 'Threat Defense',          ids: [9, 10, 11] },
    { label: 'Network Security',        ids: [12, 13] },
    { label: 'People & Process',        ids: [14, 15, 17] },
    { label: 'Advanced Controls',       ids: [16, 18] },
  ];

  function getRisk(ids) {
    const scores = ids.map(id => {
      const g = gaps.find(x => x.id === id);
      return g ? SCORE[g.current] : 0;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 1.7) return { label: 'STRONG', color: '#2d7a4f', width: '90%' };
    if (avg >= 1.0) return { label: 'MODERATE', color: '#c9830a', width: '55%' };
    if (avg >= 0.4) return { label: 'WEAK', color: '#c9303a', width: '30%' };
    return { label: 'NOT ADDRESSED', color: '#8a8680', width: '10%' };
  }

  let heatRows = '';
  categories.forEach(cat => {
    const r = getRisk(cat.ids);
    heatRows += `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;font-size:12px;font-weight:bold;width:40%;">${cat.label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;width:45%;">
        <div style="background:#e8e4dc;height:18px;width:100%;position:relative;">
          <div style="background:${r.color};height:18px;width:${r.width};"></div>
        </div>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #e8e4dc;text-align:center;width:15%;">
        <span style="background:${r.color};color:white;padding:3px 8px;font-size:10px;font-weight:bold;white-space:nowrap;display:inline-block;">${r.label}</span>
      </td>
    </tr>`;
  });

  // Summary counts
  const critical = gaps.filter(g => g.risk === 'Critical').length;
  const high     = gaps.filter(g => g.risk === 'High').length;
  const medium   = gaps.filter(g => g.risk === 'Medium').length;
  const none     = gaps.filter(g => g.risk === 'None').length;

  const content = `
  <table style="width:100%;border-collapse:collapse;margin-bottom:1px;">
    <tr>
      <td style="padding:10px 18px;background:#f5f2eb;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="text-align:center;padding:12px;">
              <div style="font-size:28px;font-weight:bold;color:#c9303a;">${critical}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">Critical</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#c9830a;">${high}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">High</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#c9a30a;">${medium}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">Medium</div>
            </td>
            <td style="text-align:center;padding:12px;border-left:1px solid #e8e4dc;">
              <div style="font-size:28px;font-weight:bold;color:#2d7a4f;">${none}</div>
              <div style="font-size:10px;color:#8a8680;letter-spacing:0.1em;text-transform:uppercase;">No Gap</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <table style="width:100%;border-collapse:collapse;">
    <tr style="background:#2d2d2d;">
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:left;">Security Domain</th>
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:left;">Coverage</th>
      <th style="padding:9px 14px;color:#f5f2eb;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;text-align:center;">Status</th>
    </tr>
    ${heatRows}
  </table>`;
  return wrapWidget('RISK LANDSCAPE', content);
}

function buildFallbackExecSummary(gaps) {
  const critical = gaps.filter(g => g.risk === 'Critical').length;
  const high = gaps.filter(g => g.risk === 'High').length;
  const implemented = gaps.filter(g => g.gap === 0).length;
  const client = cn();
  const ig = state.client.ig;
  const igLabel = ig === 1 ? 'essential cyber hygiene (IG1)' : ig === 2 ? 'foundational security (IG2)' : 'advanced security (IG3)';

  const content = `
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:20px 24px;font-size:13px;line-height:1.7;color:#1a1a18;">
        <p style="margin:0 0 6px 0;font-size:12px;color:#8a8680;letter-spacing:0.08em;">Dear {{contact.firstName}},</p>
        <p style="margin:0 0 14px 0;">This assessment evaluates <strong>{{company.name}}</strong>'s current cybersecurity posture against the CIS Controls v8 framework, targeting ${igLabel} as the baseline standard for an organization of this profile.</p>
        <p style="margin:0 0 14px 0;">Of the 18 CIS Control domains assessed, <strong>${implemented} controls</strong> are currently meeting or exceeding the target state. The assessment identified <strong>${critical} critical gap${critical !== 1 ? 's' : ''}</strong> and <strong>${high} high-priority gap${high !== 1 ? 's' : ''}</strong> requiring near-term remediation.</p>
        <p style="margin:0;">The recommended security program outlined in this proposal is designed to close identified gaps in a structured, prioritized manner — reducing risk exposure while aligning with industry best practices and applicable regulatory requirements.</p>
      </td>
    </tr>
  </table>`;
  return wrapWidget('EXECUTIVE SUMMARY', content);
}

function buildFallbackRoadmap(gaps) {
  const critical = gaps.filter(g => g.risk === 'Critical');
  const high     = gaps.filter(g => g.risk === 'High');
  const medium   = gaps.filter(g => g.risk === 'Medium');

  function phaseRows(items, label, color) {
    if (!items.length) return '';
    return items.slice(0, 4).map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf8f4'};">
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;font-size:12px;">${g.name}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e8e4dc;text-align:center;">
        <span style="background:${color};color:white;padding:3px 8px;font-size:10px;font-weight:bold;">${label}</span>
      </td>
    </tr>`).join('');
  }

  const content = `
  <table style="width:100%;border-collapse:collapse;">
    ${critical.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 1 — IMMEDIATE (0–90 DAYS)</td></tr>${phaseRows(critical,'CRITICAL','#c9303a')}` : ''}
    ${high.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 2 — SHORT TERM (90–180 DAYS)</td></tr>${phaseRows(high,'HIGH','#c9830a')}` : ''}
    ${medium.length ? `<tr style="background:${P()};"><td colspan="2" style="padding:11px 14px;color:#ffffff;font-size:11px;letter-spacing:0.12em;font-weight:bold;">PHASE 3 — ONGOING (180+ DAYS)</td></tr>${phaseRows(medium,'MEDIUM','#c9a30a')}` : ''}
  </table>`;
  return wrapWidget('RECOMMENDED ROADMAP', content);
}

// ── AI CALL ─────────────────────────────────────────────────
async function callAI(gaps) {
  const criticalGaps = gaps.filter(g => g.risk === 'Critical').map(g => g.name);
  const highGaps     = gaps.filter(g => g.risk === 'High').map(g => g.name);
  const implemented  = gaps.filter(g => g.gap === 0).map(g => g.name);
  const ig           = state.client.ig;
  const regs         = state.client.regulations.join(', ') || 'none specified';

  const prompt = `You are a cybersecurity consultant writing content for a formal MSP security proposal.

MSP PRIMARY COLOR: ${P()}

CLIENT: ${cn()}
INDUSTRY: ${state.client.industry || 'not specified'}
ORGANIZATION SIZE: IG${ig} (${ig === 1 ? '1-100 users' : ig === 2 ? '100-500 users' : '500+ users'})
FRAMEWORK: CIS Controls v8
APPLICABLE REGULATIONS: ${regs}
CRITICAL GAPS: ${criticalGaps.join(', ') || 'none'}
HIGH PRIORITY GAPS: ${highGaps.join(', ') || 'none'}
CONTROLS MEETING TARGET: ${implemented.join(', ') || 'none yet'}

IMPORTANT: In the execSummary content, use these Salesbuildr template variables literally (do not substitute values — write them exactly as shown):
- {{contact.firstName}} — for the salutation (e.g. "Dear {{contact.firstName}},")
- {{company.name}} — wherever you reference the client company name
- {{quote.title}} — if referencing the proposal title

Generate TWO sections and return them as JSON ONLY (no markdown, no preamble):

{
  "execSummary": "<HTML content only — NO outer wrapper, NO table header. Start with a <table> containing 1 <tr><td> with the body content. Use inline styles only. Font: Arial. Write 3 concise executive-facing paragraphs (total ~120 words). Reference the client name, specific critical gaps, and business risk. Professional, direct tone — no fluff.>",
  "roadmap": "<HTML content only — NO outer wrapper, NO table header. A 3-phase roadmap table with phases as dark header rows and 2-4 action items per phase as body rows. Phase 1 = 0-90 days (critical gaps), Phase 2 = 90-180 days (high gaps + quick wins), Phase 3 = 180+ days (maturity). Each row: action item name + brief 1-sentence rationale. Use inline styles only. Font: Arial. Colors: Phase headers use the MSP primary color (provided as a hex value in the context — use it literally as the background, white #ffffff text). Alternating row bg #ffffff/#faf8f4.>"
}`;

  loadingStep.textContent = 'Waiting for AI response...';
  const res = await fetch('/api/security-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);

  let parsed;
  try {
    const clean = data.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('JSON parse failed');
  }

  const p = () => state.theme.primary;
  const sec = () => state.theme.secondary;
  const wrap = (title, inner) => wrapWidget(title, inner);

  return {
    execSummary: wrap('EXECUTIVE SUMMARY', parsed.execSummary),
    roadmap:     wrap('RECOMMENDED ROADMAP', parsed.roadmap)
  };
}

// ── RENDER WIDGETS ───────────────────────────────────────────
function renderWidgets() {
  const map = {
    execSummary:   'prevExecSummary',
    currentState:  'prevCurrentState',
    riskLandscape: 'prevRiskLandscape',
    gapAnalysis:   'prevGapAnalysis',
    idealState:    'prevIdealState',
    roadmap:       'prevRoadmap'
  };
  Object.entries(map).forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el && state.widgets[key]) {
      el.innerHTML = state.widgets[key];
    }
  });
}

// ── HELPERS ──────────────────────────────────────────────────
function copyHtml(html) {
  if (!html) return;
  navigator.clipboard.writeText(html).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// Build the ordered widget array for push-widgets API
function buildWidgetArray() {
  const WIDGET_ORDER = [
    { key: 'execSummary',   title: 'Executive Summary' },
    { key: 'currentState',  title: 'Current Security Posture' },
    { key: 'riskLandscape', title: 'Risk Landscape' },
    { key: 'gapAnalysis',   title: 'Gap Analysis' },
    { key: 'idealState',    title: 'Ideal Security Environment' },
    { key: 'roadmap',       title: 'Recommended Roadmap' },
  ];
  return WIDGET_ORDER
    .filter(w => state.widgets[w.key])
    .map(w => ({ id: w.key, title: w.title, html: state.widgets[w.key] }));
}

async function pushWidgets(widgetArray, prefix, cleanup = false) {
  const tenantUrl = sbTenantUrl.value.trim().replace(/\/$/, '');
  const apiKey    = sbApiKey.value.trim();
  if (!tenantUrl || !apiKey) {
    showToast('Enter Salesbuildr credentials first.');
    return null;
  }
  const res = await fetch('/api/push-widgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ widgets: widgetArray, prefix, apiKey, tenantUrl, cleanup })
  });
  return res.json();
}

// ── COPY & PUSH ──────────────────────────────────────────────
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.widget;
    copyHtml(state.widgets[key]);
    showToast('HTML copied to clipboard.');
  });
});

document.querySelectorAll('.btn-push').forEach(btn => {
  btn.addEventListener('click', async () => {
    const key   = btn.dataset.widget;
    const title = btn.closest('.widget-card').querySelector('.widget-label').textContent.trim();
    const html  = state.widgets[key];
    if (!html) return;

    btn.textContent = 'PUSHING...';
    btn.disabled    = true;
    try {
      const data = await pushWidgets(
        [{ id: key, title, html }],
        cn(),   // prefix = client name
        false   // no cleanup for single push
      );
      if (data && data.ok) {
        showToast(`"${title}" pushed to Salesbuildr.`);
        btn.textContent = '✓ PUSHED';
      } else {
        const errMsg = data?.results?.[0]?.error || data?.error || 'Unknown error';
        showToast(`Push failed: ${errMsg}`);
        btn.textContent = 'PUSH TO SALESBUILDR';
      }
    } catch {
      showToast('Network error — push failed.');
      btn.textContent = 'PUSH TO SALESBUILDR';
    }
    btn.disabled = false;
  });
});

copyAllBtn.addEventListener('click', () => {
  const all = Object.values(state.widgets).filter(Boolean).join('\n\n');
  copyHtml(all);
  showToast('All widgets copied to clipboard.');
});

// Push All button (in salesbuildr bar)
const pushAllBtn = document.getElementById('pushAllBtn');
if (pushAllBtn) {
  pushAllBtn.addEventListener('click', async () => {
    const widgets = buildWidgetArray();
    if (!widgets.length) { showToast('No widgets to push yet.'); return; }

    pushAllBtn.textContent = 'PUSHING ALL...';
    pushAllBtn.disabled    = true;
    try {
      const data = await pushWidgets(widgets, cn(), true); // cleanup=true replaces previous set
      if (data && data.successCount > 0) {
        showToast(`${data.successCount}/${data.total} widgets pushed to Salesbuildr.`);
        // Mark all individual push buttons as pushed
        document.querySelectorAll('.btn-push').forEach(b => b.textContent = '✓ PUSHED');
        pushAllBtn.textContent = '✓ ALL PUSHED';
      } else {
        showToast(`Push failed: ${data?.error || 'Check credentials.'}`);
        pushAllBtn.textContent = 'PUSH ALL TO SALESBUILDR';
      }
    } catch {
      showToast('Network error — push failed.');
      pushAllBtn.textContent = 'PUSH ALL TO SALESBUILDR';
    }
    pushAllBtn.disabled = false;
  });
}

// ── SALESBUILDR CREDS ────────────────────────────────────────
saveSbCreds.addEventListener('click', () => {
  localStorage.setItem('sb_tenant_url', sbTenantUrl.value.trim());
  localStorage.setItem('sb_api_key',    sbApiKey.value.trim());
  sbStatus.textContent = 'CREDENTIALS SAVED';
  setTimeout(() => sbStatus.textContent = '', 2000);
});

step5Back.addEventListener('click', () => goToStep(3));

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── INIT ─────────────────────────────────────────────────────
function init() {
  // Load Salesbuildr creds
  const savedUrl = localStorage.getItem('sb_tenant_url');
  const savedKey = localStorage.getItem('sb_api_key');
  if (savedUrl) sbTenantUrl.value = savedUrl;
  if (savedKey) sbApiKey.value    = savedKey;

  // Apply default theme
  applyTheme(state.theme.primary, state.theme.secondary);

  // Build initial assessment defaults (IG1)
  buildAssessment();

  goToStep(1);
}

init();
