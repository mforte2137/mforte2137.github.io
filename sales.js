/* =========================================================
   Salesbuildr Widget Creator — sales.js
   ========================================================= */

// ── Service quick-start data ──────────────────────────────
const SERVICES = [
  {
    id:          'managed-it',
    name:        'Managed IT Services',
    subtitle:    'Full MSP engagement',
    icon:        '🖥️',
    description: 'Fully managed IT services — proactive monitoring, helpdesk support, patch management, endpoint protection, and regular technology reviews. We act as the customer\'s complete IT department, handling everything from day-to-day issues to longer-term technology planning and vendor management.'
  },
  {
    id:          'm365',
    name:        'Microsoft 365',
    subtitle:    'Cloud productivity migration',
    icon:        '☁️',
    description: 'Microsoft 365 migration — moving from on-premises email and file servers to Microsoft 365, including Exchange Online, SharePoint, Teams, and OneDrive. Includes full environment assessment, mailbox and data migration with minimal disruption, security and compliance configuration, and staff onboarding.'
  },
  {
    id:          'cybersecurity',
    name:        'Cybersecurity Stack',
    subtitle:    'Protection & compliance',
    icon:        '🛡️',
    description: 'Cybersecurity solution — layered protection including next-generation endpoint detection and response (EDR), email security and anti-phishing, multi-factor authentication, security awareness training, and dark web monitoring. Designed to meet cyber insurance requirements and protect against modern ransomware and phishing threats.'
  },
  {
    id:          'email-security',
    name:        'Email Security',
    subtitle:    'Anti-spam & phishing protection',
    icon:        '✉️',
    description: 'Standalone email security solution — advanced anti-spam, anti-phishing, and malware filtering layered in front of Microsoft 365 or Google Workspace. Includes impersonation and business email compromise (BEC) protection, sandboxed attachment analysis, link rewriting, and quarantine management. Often sold separately from a full cybersecurity stack where the customer already has basic endpoint protection but their inbox remains the primary attack vector.'
  },
  {
    id:          'network',
    name:        'Network Infrastructure',
    subtitle:    'Upgrade & modernisation',
    icon:        '🔌',
    description: 'Network infrastructure upgrade — replacement and modernisation of the existing network including next-generation firewall, managed switches, structured cabling, and wireless access points. Includes a site survey to document the current environment before any work begins, with all installation carried out after hours to minimise disruption.'
  },
  {
    id:          'azure',
    name:        'Microsoft Azure / Intune',
    subtitle:    'Entra ID, Intune & cloud infra',
    icon:        '🔷',
    description: 'Microsoft Azure, Entra ID, and Intune deployment — configuring and managing Microsoft\'s cloud identity and device management platform. Includes Entra ID (Azure AD) tenant configuration, conditional access policies, Intune mobile device and application management (MDM/MAM), and Azure infrastructure provisioning. Provides centralised control over who can access what, from which devices, with enforced compliance policies — independent of physical location.'
  },
  {
    id:          'cloud',
    name:        'Cloud Migration',
    subtitle:    'Azure / AWS / hosted',
    icon:        '⚡',
    description: 'Cloud server migration — moving on-premises servers and workloads to a hosted cloud environment. Includes assessment of current infrastructure, migration planning, data transfer with minimal downtime, security configuration, and post-migration support. Reduces hardware overhead while improving reliability, scalability, and remote access.'
  },
  {
    id:          'sdwan',
    name:        'SD-WAN',
    subtitle:    'Multi-site network modernisation',
    icon:        '🌐',
    description: 'SD-WAN (Software-Defined Wide Area Network) — replacing expensive MPLS circuits and legacy WAN infrastructure with a cloud-managed, policy-driven network that intelligently routes traffic across broadband, 4G/5G, and existing leased lines. Includes centralised management across all sites, application-aware traffic prioritisation, built-in failover, and direct cloud breakout for Microsoft 365 and SaaS applications. Typically delivers significant cost savings over MPLS while improving performance and resilience for multi-site businesses.'
  },
  {
    id:          'backup',
    name:        'Backup & Recovery',
    subtitle:    'Business continuity',
    icon:        '💾',
    description: 'Backup and disaster recovery solution — implementation of a comprehensive BDR platform covering servers, endpoints, and cloud data. Includes automated daily backups, secure off-site replication, regular tested recoveries, and a documented disaster recovery plan to meet compliance and cyber insurance requirements.'
  },
  {
    id:          'compliance',
    name:        'Compliance Readiness',
    subtitle:    'HIPAA · NIST · SOC 2',
    icon:        '📋',
    description: 'Compliance readiness assessment and implementation — gap analysis against the relevant framework (HIPAA / NIST / SOC 2 / Cyber Essentials), followed by a prioritised remediation roadmap and implementation of required controls. Includes policy development, staff training, and evidence collection to prepare the organisation for audit.'
  },
  {
    id:          'onboarding',
    name:        'New Client Onboarding',
    subtitle:    'Transition to managed services',
    icon:        '🤝',
    description: 'New client onboarding — transitioning an existing business onto our managed services platform. Includes full environment discovery and documentation, deployment of monitoring and management tooling, security baseline configuration, and a technology alignment review to identify immediate risks and longer-term improvement opportunities.'
  },
  {
    id:          'haas',
    name:        'Hardware as a Service',
    subtitle:    'Device refresh & lifecycle',
    icon:        '🖨️',
    description: 'Hardware as a Service (HaaS) — replacing ageing desktops, laptops, servers, and peripherals under a predictable monthly subscription rather than large upfront capital spend. Includes hardware procurement, configuration and deployment, warranty and repair coverage, and end-of-life asset disposal. Devices are refreshed on a fixed cycle so the customer always runs current, supported equipment without budget shocks.'
  },
  {
    id:          'procurement',
    name:        'IT Procurement',
    subtitle:    'Device lifecycle & vendor mgmt',
    icon:        '🛒',
    description: 'IT procurement and device lifecycle management — handling one-off and ongoing hardware and software purchasing on behalf of the customer. Includes vendor sourcing, competitive pricing, warranty registration, asset tracking, and coordinated end-of-life disposal. Distinct from HaaS in that it covers ad-hoc purchases, mixed-fleet environments, and software licensing renewals rather than a fixed subscription refresh cycle. Removes the burden of managing multiple vendor relationships and ensures procurement decisions align with the wider IT strategy.'
  },
  {
    id:          'faas',
    name:        'Firewall as a Service',
    subtitle:    'Cloud-delivered network security',
    icon:        '🔥',
    description: 'Firewall as a Service (FWaaS) — replacing on-premises firewall appliances with a cloud-delivered, fully managed network security platform. Includes next-generation threat prevention, DNS filtering, application-aware policy controls, and centralised management across all sites and remote users. No hardware to maintain, with automatic updates ensuring protection against emerging threats without scheduled maintenance windows.'
  },
  {
    id:          'voip',
    name:        'VoIP / UCaaS',
    subtitle:    'Cloud phone & unified comms',
    icon:        '📞',
    description: 'VoIP and Unified Communications as a Service (UCaaS) — replacing legacy on-premises phone systems with a cloud-hosted platform that combines voice calling, video conferencing, instant messaging, and presence in a single application. Includes number porting, handset or softphone deployment, call routing and hunt group configuration, voicemail-to-email, and ongoing management. Staff can make and receive calls from any device, from any location, on a predictable per-user monthly cost.'
  },
  {
    id:          'custom',
    name:        'Custom Project',
    subtitle:    "I'll describe it myself",
    icon:        '✏️',
    custom:      true
  }
];

// ── Trigger chips (single select) ─────────────────────────
const TRIGGERS = [
  'Existing IT provider is underperforming',
  'Recent security incident or phishing attempt',
  'Hardware reaching end of life',
  'Business growth — new staff or new location',
  'Compliance audit or requirement coming up',
  'Moving to new premises',
  'No IT support currently in place',
  'Cyber insurance renewal coming up',
  'New leadership reviewing IT spend'
];

// ── Outcome chips (multi-select) ──────────────────────────
const OUTCOMES = [
  'Reliable systems with minimal downtime',
  'Protected against ransomware & cyber threats',
  'Staff able to work securely from anywhere',
  'Compliance with industry regulations',
  'Predictable IT costs with no surprise bills',
  'Fast, responsive support when things go wrong',
  'Infrastructure that scales with growth',
  'Less IT burden on internal staff',
  'Meeting cyber insurance requirements'
];

// ── Urgency hint prompts ───────────────────────────────────
const URGENCY_HINTS = [
  'cyber insurance renewal',
  'contract / lease ending',
  'recent local incident',
  'hardware failing',
  'new leadership',
  'compliance deadline',
  'staff headcount growing'
];

// ── Constants ─────────────────────────────────────────────
const WIDGET_IDS    = ['w1','w2','w3','w4','w5'];
const WIDGET_LABELS = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · The Investment' };
const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

let selectedColors      = { primary:'#0d2d5e', accent:'#1a6fc4', light:'#f0f6ff' };
let generatedWidgets    = [];
let selectedTriggers    = new Set();
let selectedOutcomes    = new Set();
let selectedUrgency     = new Set();
let selectedServiceName = ''; // name of the selected service tile

// ── DOM handles ───────────────────────────────────────────
const formView          = document.getElementById('form-view');
const workingView       = document.getElementById('working-view');
const outputView        = document.getElementById('output-view');
const form              = document.getElementById('widget-form');
const submitBtn         = document.getElementById('submit-btn');
const workingTitle      = document.getElementById('working-title');
const workingSub        = document.getElementById('working-sub');
const progressBar       = document.getElementById('progress-bar');
const progressLabel     = document.getElementById('progress-label');
const outputTitle       = document.getElementById('output-title');
const restartBtn        = document.getElementById('restart-btn');
const restartBtn2       = document.getElementById('restart-btn-2');
const errorBanner       = document.getElementById('error-banner');
const errorDetail       = document.getElementById('error-detail');
const errorDismiss      = document.getElementById('error-dismiss');
const combinedSection   = document.getElementById('combined-section');
const combinedCopyBtn   = document.getElementById('combined-copy-btn');
const combinedPreview   = document.getElementById('combined-preview');
const combinedCode      = document.getElementById('combined-code');
const combinedTabs      = document.getElementById('combined-tabs');
const individualSection = document.getElementById('individual-section');
const individualToggle  = document.getElementById('individual-toggle');
const individualWidgets = document.getElementById('individual-widgets');
const sbToggle          = document.getElementById('sb-toggle');
const sbArrow           = document.getElementById('sb-arrow');
const sbBody            = document.getElementById('sb-connect-body');
const sbApiKey          = document.getElementById('sbApiKey');
const sbTenantUrl       = document.getElementById('sbTenantUrl');
const sbRemember        = document.getElementById('sb-remember');
const sbReplace         = document.getElementById('sb-replace');
const sbPrefix          = document.getElementById('sb-prefix');
const sbPushBtn         = document.getElementById('sb-push-btn');
const sbResult          = document.getElementById('sb-result');
const solutionField     = document.getElementById('f-solution');
const solutionCount     = document.getElementById('solution-count');
const triggerField      = document.getElementById('f-trigger');
const outcomesField     = document.getElementById('f-outcomes');
const urgencyField      = document.getElementById('f-urgency');

// New feature refs
const whyToggle         = document.getElementById('why-toggle');
const whyBody           = document.getElementById('why-body');
const whyArrow          = document.getElementById('why-arrow');
const objToggle         = document.getElementById('obj-toggle');
const objArrow          = document.getElementById('obj-arrow');
const objBody           = document.getElementById('obj-body');
const objGenerateBtn    = document.getElementById('obj-generate-btn');
const objResultWrap     = document.getElementById('obj-result-wrap');
const objResult         = document.getElementById('obj-result');
const objCopyBtn        = document.getElementById('obj-copy-btn');
const objWorking        = document.getElementById('obj-working');

// ── Service tile builder ──────────────────────────────────
function initServiceTiles() {
  const grid = document.getElementById('service-grid');
  SERVICES.forEach(svc => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'service-tile' + (svc.custom ? ' service-tile-custom' : '');
    btn.dataset.id = svc.id;

    btn.innerHTML = `
      <div class="service-tile-icon">${svc.icon}</div>
      <div class="service-tile-name">${svc.name}</div>
      <div class="service-tile-sub">${svc.subtitle}</div>
      <div class="service-tile-check">✓</div>
    `;

    btn.addEventListener('click', () => {
      grid.querySelectorAll('.service-tile').forEach(t => t.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selectedServiceName = svc.custom ? '' : svc.name;

      if (svc.custom) {
        solutionField.value = '';
        solutionCount.textContent = '0';
        solutionField.focus();
      } else {
        solutionField.value = svc.description;
        solutionCount.textContent = svc.description.length;
        solutionField.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    grid.appendChild(btn);
  });
}

// ── Trigger chips (multi-select) ─────────────────────────
function initTriggerChips() {
  const row = document.getElementById('trigger-chips');
  TRIGGERS.forEach(trigger => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'chip';
    btn.textContent = trigger;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-selected')) {
        btn.classList.remove('is-selected');
        selectedTriggers.delete(trigger);
      } else {
        btn.classList.add('is-selected');
        selectedTriggers.add(trigger);
      }
      triggerField.value = Array.from(selectedTriggers).join('; ');
    });
    row.appendChild(btn);
  });
}

// ── Outcome chips (multi-select) ─────────────────────────
function initOutcomeChips() {
  const row = document.getElementById('outcome-chips');
  OUTCOMES.forEach(outcome => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'chip';
    btn.textContent = outcome;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-selected')) {
        btn.classList.remove('is-selected');
        selectedOutcomes.delete(outcome);
      } else {
        btn.classList.add('is-selected');
        selectedOutcomes.add(outcome);
      }
      outcomesField.value = Array.from(selectedOutcomes).join('; ');
    });
    row.appendChild(btn);
  });
}

// ── Urgency chips (multi-select) ──────────────────────────
function initUrgencyHints() {
  const row = document.getElementById('urgency-chips');
  URGENCY_HINTS.forEach(hint => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'chip';
    btn.textContent = hint;
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-selected')) {
        btn.classList.remove('is-selected');
        selectedUrgency.delete(hint);
      } else {
        btn.classList.add('is-selected');
        selectedUrgency.add(hint);
      }
      urgencyField.value = Array.from(selectedUrgency).join('; ');
    });
    row.appendChild(btn);
  });
}

// ── Colour theme selector ─────────────────────────────────
function lightenColor(hex, amount) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(c=>Math.round(c+(255-c)*amount).toString(16).padStart(2,'0')).join('');
}
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

const themeGrid     = document.getElementById('theme-grid');
const customInputs  = document.getElementById('custom-inputs');
const primaryPicker = document.getElementById('custom-primary-picker');
const primaryHex    = document.getElementById('custom-primary-hex');
const accentPicker  = document.getElementById('custom-accent-picker');
const accentHex     = document.getElementById('custom-accent-hex');
const customPreview = document.getElementById('custom-preview');

themeGrid.querySelectorAll('.theme-tile').forEach(tile => {
  tile.addEventListener('click', () => {
    themeGrid.querySelectorAll('.theme-tile').forEach(t => t.classList.remove('is-selected'));
    tile.classList.add('is-selected');
    if (tile.dataset.theme === 'custom') {
      customInputs.hidden = false; updateCustomColors();
    } else {
      customInputs.hidden = true;
      selectedColors = { primary:tile.dataset.primary, accent:tile.dataset.accent, light:tile.dataset.light };
    }
  });
});
function syncPicker(picker, hexField) {
  picker.addEventListener('input', () => { hexField.value=picker.value.toUpperCase(); updateCustomColors(); });
  hexField.addEventListener('input', () => {
    const val = hexField.value.trim().startsWith('#') ? hexField.value.trim() : '#'+hexField.value.trim();
    if (isValidHex(val)) { picker.value=val; hexField.classList.remove('is-error'); updateCustomColors(); }
    else hexField.classList.add('is-error');
  });
}
syncPicker(primaryPicker, primaryHex);
syncPicker(accentPicker, accentHex);
function updateCustomColors() {
  const p=primaryPicker.value, a=accentPicker.value;
  selectedColors={primary:p,accent:a,light:lightenColor(a,0.91)};
  customPreview.style.background=`linear-gradient(135deg,${p} 60%,${a} 60%)`;
  const sp=customPreview.querySelector('span'); if(sp){sp.style.color='#ffffff';sp.textContent='';}
}

// ── Character counter ─────────────────────────────────────
solutionField.addEventListener('input', () => { solutionCount.textContent = solutionField.value.length; });

// ── View helpers ──────────────────────────────────────────
function showView(name) {
  formView.hidden    = name!=='form';
  workingView.hidden = name!=='working';
  outputView.hidden  = name!=='output';
}
function showError(msg)  { errorDetail.textContent=msg; errorBanner.hidden=false; }
function hideError()     { errorBanner.hidden=true; }

// ── Restart ───────────────────────────────────────────────
function restart() {
  hideError();
  form.reset();
  solutionCount.textContent   = '0';
  generatedWidgets            = [];
  selectedServiceName         = '';
  selectedTriggers            = new Set();
  selectedOutcomes            = new Set();
  selectedUrgency             = new Set();
  individualWidgets.innerHTML = '';
  outputTitle.textContent     = '';
  combinedSection.hidden      = true;
  individualSection.hidden    = true;
  individualWidgets.hidden    = true;
  individualToggle.textContent = 'Show 5 individual widgets ▼';
  sbResult.hidden             = true;
  sbPushBtn.textContent       = 'Save 5 Widgets →';
  sbPushBtn.classList.remove('is-done');
  sbReplace.checked           = false;
  sbBody.hidden               = true;
  sbArrow.classList.remove('is-open');
  // Reset objection panel
  objBody.hidden              = true;
  objArrow.classList.remove('is-open');
  objResultWrap.hidden        = true;
  objResult.textContent       = '';
  objGenerateBtn.disabled     = false;
  objGenerateBtn.textContent  = 'Generate Objection Coaching →';
  // Reset service tiles
  document.querySelectorAll('.service-tile').forEach(t => t.classList.remove('is-selected'));
  // Reset chips
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-selected'));
  setProgress(0);
  showView('form');
}
restartBtn.addEventListener('click',  restart);
restartBtn2.addEventListener('click', restart);
errorDismiss.addEventListener('click', () => { hideError(); showView('form'); });

// ── Combined widget tabs ──────────────────────────────────
combinedTabs.querySelectorAll('.widget-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    combinedTabs.querySelectorAll('.widget-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const pane = btn.dataset.pane;
    combinedPreview.style.display = pane==='preview' ? 'block' : 'none';
    combinedCode.style.display    = pane==='code'    ? 'block' : 'none';
  });
});

combinedCopyBtn.addEventListener('click', async () => {
  const text = combinedCode.value;
  try { await navigator.clipboard.writeText(text); }
  catch { const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  combinedCopyBtn.textContent='✅ Copied!'; combinedCopyBtn.classList.add('is-copied');
  setTimeout(()=>{ combinedCopyBtn.textContent='📋 Copy Widget'; combinedCopyBtn.classList.remove('is-copied'); }, 2500);
});

// ── Individual accordion ──────────────────────────────────
individualToggle.addEventListener('click', () => {
  const open = !individualWidgets.hidden;
  individualWidgets.hidden = open;
  individualToggle.textContent = open ? 'Show 5 individual widgets ▼' : 'Hide individual widgets ▲';
});

// ── Connect Salesbuildr ───────────────────────────────────
function initConnectSection() {
function initSbCredentials() {
  const savedApi    = localStorage.getItem(LS_API_KEY);
  const savedTenant = localStorage.getItem(LS_TENANT_URL);
  if (savedApi)    document.getElementById('sbApiKey').value    = savedApi;
  if (savedTenant) document.getElementById('sbTenantUrl').value = savedTenant;
  if (savedApi && savedTenant) document.getElementById('sbRemember').checked = true;
  updateSbBtn();
}
function updateSbBtn() {
  document.getElementById('sbPushBtn').disabled = !(
    document.getElementById('sbApiKey').value.trim() &&
    document.getElementById('sbTenantUrl').value.trim()
  );
}
sbToggle.addEventListener('click', () => { const open=!sbBody.hidden; sbBody.hidden=open; sbArrow.classList.toggle('is-open',!open); });
sbApiKey.addEventListener('input', updateSbBtn);
sbTenantUrl.addEventListener('input', updateSbBtn);

// ── Progress ──────────────────────────────────────────────
function setProgress(done) {
  progressBar.style.width   = Math.round((done/WIDGET_IDS.length)*100)+'%';
  progressLabel.textContent = `${done} of ${WIDGET_IDS.length}`;
}

// ── Form validation ───────────────────────────────────────
function validateForm() {
  let valid = true;
  document.querySelectorAll('.field-error-msg').forEach(el=>el.remove());
  document.querySelectorAll('.is-error').forEach(el=>el.classList.remove('is-error'));
  if (!solutionField.value.trim()) { markError(solutionField,'Please describe what you are proposing — or pick a service above.'); valid=false; }
  const biz=document.getElementById('f-business');
  if (!biz.value.trim()) { markError(biz,"Please describe the customer's business."); valid=false; }
  return valid;
}
function markError(field, msg) {
  field.classList.add('is-error');
  const p=document.createElement('p'); p.className='field-error-msg'; p.textContent=msg;
  field.parentElement.appendChild(p); field.focus();
}

// ── Form submit ───────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault(); hideError();
  if (!validateForm()) return;

  const bizSelect = document.getElementById('f-business');
  const bizOther  = document.getElementById('f-business-other');
  const bizVal    = bizSelect.value === 'Other / General business'
                    ? (bizOther.value.trim() || 'Other / General business')
                    : bizSelect.value.trim();

  const fields = {
    solution: solutionField.value.trim(),
    business: bizVal,
    size:     document.getElementById('f-size').value.trim(),
    trigger:  triggerField.value.trim(),
    outcomes: outcomesField.value.trim(),
    urgency:  urgencyField.value.trim()
  };

  // Use service tile name if one was selected; otherwise trim the custom description
  const rawTitle  = fields.solution.split(/[.!?\n]/)[0].trim();
  const titleText = selectedServiceName || (rawTitle.length > 40 ? rawTitle.slice(0, 38) + '…' : rawTitle);
  outputTitle.textContent = titleText;

  submitBtn.disabled          = true;
  generatedWidgets            = [];
  individualWidgets.innerHTML = '';
  combinedSection.hidden      = true;
  individualSection.hidden    = true;
  setProgress(0);
  workingTitle.textContent = 'Writing your widgets…';
  workingSub.textContent   = 'Using Sonnet AI — usually 60–90 seconds total. Hang tight.';
  showView('working');

  for (let i=0; i<WIDGET_IDS.length; i++) {
    const id = WIDGET_IDS[i];
    workingTitle.textContent = `Generating widget ${i+1} of 5…`;
    workingSub.textContent   = WIDGET_LABELS[id];
    try {
      const widget = await fetchWidget(fields, id);
      generatedWidgets.push(widget);
      appendIndividualCard(widget);
    } catch (err) {
      appendErrorCard(id, err.message);
    }
    setProgress(i+1);
  }

  submitBtn.disabled = false;
  if (generatedWidgets.length > 0) {
    showCombinedWidget(generatedWidgets);
    combinedSection.hidden   = false;
    individualSection.hidden = false;
    initConnectSection();
    showView('output');  // switch only when everything is ready
  } else {
    showView('output'); // show even if all failed, so error cards are visible
  }
});

// ── API call ──────────────────────────────────────────────
async function fetchWidget(fields, widgetId, direction) {
  let res;
  const body = { fields, widgetId, colors: selectedColors };
  if (direction) body.direction = direction;
  try { res = await fetch('/api/sales-widgets',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); }
  catch(e) { throw new Error('Could not reach the widget generator.'); }
  let data; try { data=await res.json(); } catch(e) { throw new Error('Unexpected response. Status '+res.status); }
  if (!res.ok||!data.ok) throw new Error(data.error||'HTTP '+res.status);
  return data.widget;
}

// ── Combined widget ───────────────────────────────────────
function buildCombinedHtml(widgets) {
  return widgets.map(w=>w.html).join('\n<div style="height:20px;"></div>\n');
}
function showCombinedWidget(widgets) {
  const html = buildCombinedHtml(widgets);
  combinedCode.value     = html;
  combinedPreview.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${html}</body></html>`;
  combinedTabs.querySelectorAll('.widget-tab').forEach(b=>b.classList.remove('is-active'));
  combinedTabs.querySelector('[data-pane="preview"]').classList.add('is-active');
  combinedPreview.style.display='block'; combinedCode.style.display='none';
}

// ── Push to Salesbuildr ───────────────────────────────────
// Keep button label in sync with send-mode radio
document.querySelectorAll('input[name="sb-mode"]').forEach(radio => {
  radio.addEventListener('change', updatePushBtnLabel);
});
function updatePushBtnLabel() {
  const mode = document.querySelector('input[name="sb-mode"]:checked')?.value || 'individual';
  sbPushBtn.textContent = mode === 'combined' ? 'Save 1 Combined Widget →' : 'Save 5 Widgets →';
}

sbPushBtn.addEventListener('click', async () => {
  const apiKey    = document.getElementById('sbApiKey').value.trim();
  const tenantUrl = document.getElementById('sbTenantUrl').value.trim();
  if (!apiKey || !tenantUrl) return;
  if (sbRemember.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_TENANT_URL);
  }

  const mode = document.querySelector('input[name="sb-mode"]:checked')?.value || 'individual';
  sbPushBtn.disabled=true;
  sbPushBtn.textContent = mode === 'combined' ? 'Saving…' : 'Saving…';
  sbResult.hidden=true;

  const prefix  = sbPrefix.value.trim();
  const cleanup = sbReplace.checked;

  let payload;
  if (mode === 'combined') {
    const combinedHtml = buildCombinedHtml(generatedWidgets);
    const combinedTitle = (document.getElementById('output-title').textContent || 'Buyer Journey') + ' — Complete';
    payload = {
      widgets:   [{ id: 'combined', title: combinedTitle, html: combinedHtml }],
      prefix,
      apiKey,
      tenantUrl,
      cleanup
    };
  } else {
    payload = {
      widgets:   generatedWidgets,
      prefix,
      apiKey,
      tenantUrl,
      cleanup
    };
  }

  let res;
  try {
    res = await fetch('/api/push-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
  } catch(e) {
    showSbResult(false,'Could not reach the server.');
    sbPushBtn.disabled=false; updatePushBtnLabel(); return;
  }

  let data; try { data=await res.json(); } catch { data={}; }

  if (data.successCount > 0) {
    const deletedMsg = data.deleted > 0 ? ` (${data.deleted} previous widget${data.deleted>1?'s':''} replaced)` : '';
    const partialMsg = data.successCount < data.total ? ` — ${data.total - data.successCount} failed` : '';
    const savedLabel = mode === 'combined'
      ? `1 combined widget saved to Salesbuildr${deletedMsg}. Contains all 5 buyer-journey sections.`
      : `${data.successCount} of 5 widgets saved to Salesbuildr${deletedMsg}${partialMsg}. Each starts a new page in the PDF.`;
    showSbResult(true, savedLabel);
    sbPushBtn.textContent = mode === 'combined' ? '✓ Combined Widget Saved' : '✓ Saved to Salesbuildr';
    sbPushBtn.classList.add('is-done');
  } else {
    const err = (data.results&&data.results[0]&&data.results[0].error)||data.error||'Unknown error';
    showSbResult(false,`Save failed: ${err}`);
    sbPushBtn.disabled=false; updatePushBtnLabel();
  }
});
function showSbResult(ok,msg){ sbResult.textContent=msg; sbResult.className='sb-result'+(ok?'':' is-error'); sbResult.hidden=false; }

// ── Individual cards ──────────────────────────────────────
function appendIndividualCard(widget) {
  const card=document.createElement('div'); card.className='widget-card';
  const header=document.createElement('div'); header.className='widget-card-header';
  const label=document.createElement('div'); label.className='widget-card-label';
  const num=document.createElement('span'); num.className='widget-num'; num.textContent=WIDGET_LABELS[widget.id]||widget.id;
  const title=document.createElement('span'); title.className='widget-card-title'; title.textContent=widget.title;
  label.appendChild(num); label.appendChild(title);
  const copyBtn=document.createElement('button'); copyBtn.type='button'; copyBtn.className='widget-copy-btn'; copyBtn.textContent='Copy HTML';
  copyBtn.addEventListener('click',()=>copyHtml(widget.html,copyBtn));
  header.appendChild(label); header.appendChild(copyBtn);
  const tabs=document.createElement('div'); tabs.className='widget-tabs';
  const pt=document.createElement('button'); pt.type='button'; pt.className='widget-tab is-active'; pt.textContent='Preview';
  const ct=document.createElement('button'); ct.type='button'; ct.className='widget-tab'; ct.textContent='HTML Code';
  tabs.appendChild(pt); tabs.appendChild(ct);
  const iframe=document.createElement('iframe'); iframe.className='widget-preview'; iframe.setAttribute('sandbox','allow-same-origin');
  iframe.srcdoc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${widget.html}</body></html>`;
  const textarea=document.createElement('textarea'); textarea.className='widget-code'; textarea.readOnly=true; textarea.spellcheck=false; textarea.value=widget.html;
  pt.addEventListener('click',()=>{ pt.classList.add('is-active'); ct.classList.remove('is-active'); iframe.style.display='block'; textarea.style.display='none'; });
  ct.addEventListener('click',()=>{ ct.classList.add('is-active'); pt.classList.remove('is-active'); iframe.style.display='none'; textarea.style.display='block'; });
  card.appendChild(header); card.appendChild(tabs); card.appendChild(iframe); card.appendChild(textarea);
  addRegenRow(card, widget);
  individualWidgets.appendChild(card);
}
function appendErrorCard(widgetId,message) {
  const card=document.createElement('div'); card.className='widget-card'; card.style.borderColor='var(--accent)';
  const header=document.createElement('div'); header.className='widget-card-header';
  const num=document.createElement('span'); num.className='widget-num'; num.textContent=WIDGET_LABELS[widgetId]||widgetId;
  const msg=document.createElement('span'); msg.className='widget-card-title'; msg.style.color='var(--accent)'; msg.textContent='Generation failed';
  const retry=document.createElement('button'); retry.type='button'; retry.className='widget-copy-btn'; retry.textContent='Retry';
  retry.addEventListener('click',async()=>{ card.remove(); try{ const w=await fetchWidget(getCurrentFields(),widgetId); generatedWidgets.push(w); appendIndividualCard(w); showCombinedWidget(generatedWidgets); }catch(e){ appendErrorCard(widgetId,e.message); } });
  header.appendChild(num); header.appendChild(msg); header.appendChild(retry);
  const detail=document.createElement('div'); detail.style.cssText='padding:12px 18px;font-family:"Inter","Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--accent);'; detail.textContent=message;
  card.appendChild(header); card.appendChild(detail); individualWidgets.appendChild(card);
}
function getCurrentFields() {
  const bizSelect = document.getElementById('f-business');
  const bizOther  = document.getElementById('f-business-other');
  const bizVal    = bizSelect.value === 'Other / General business'
                    ? (bizOther.value.trim() || 'Other / General business')
                    : bizSelect.value.trim();
  return { solution:solutionField.value.trim(), business:bizVal, size:document.getElementById('f-size').value.trim(), trigger:triggerField.value.trim(), outcomes:outcomesField.value.trim(), urgency:urgencyField.value.trim() };
}
async function copyHtml(html,btn) {
  try{ await navigator.clipboard.writeText(html); }catch{ const ta=document.createElement('textarea'); ta.value=html; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  btn.textContent='Copied!'; btn.classList.add('is-copied');
  setTimeout(()=>{ btn.textContent='Copy HTML'; btn.classList.remove('is-copied'); },2500);
}

// ── Why This Works sidebar toggle ────────────────────────
whyToggle.addEventListener('click', () => {
  const open = !whyBody.hidden;
  whyBody.hidden = open;
  whyArrow.classList.toggle('is-closed', open);
  whyToggle.setAttribute('aria-expanded', String(!open));
});

// ── Regen direction presets ───────────────────────────────
const REGEN_PRESETS = [
  { value: '',                              label: 'Choose a direction…' },
  { value: 'Make it more urgent',           label: 'More urgent' },
  { value: 'Make it shorter and punchier',  label: 'Shorter & punchier' },
  { value: 'The customer is price-sensitive — emphasise ROI and cost of inaction', label: 'Price-sensitive customer' },
  { value: 'The customer had a bad experience with a previous MSP — address trust', label: 'Bad previous MSP experience' },
  { value: 'Make the language more formal and corporate',  label: 'More formal tone' },
  { value: 'Make the language more conversational',        label: 'More conversational tone' },
  { value: 'Emphasise compliance and risk reduction',      label: 'Compliance / risk focus' },
  { value: 'Focus more on business continuity and uptime', label: 'Business continuity focus' },
  { value: 'custom',                        label: 'Write my own direction…' },
];

// Injects the regen row into a widget card
function addRegenRow(card, widget) {
  const row = document.createElement('div');
  row.className = 'regen-row';

  // Preset select
  const sel = document.createElement('select');
  sel.className = 'regen-select';
  REGEN_PRESETS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.value; opt.textContent = p.label;
    sel.appendChild(opt);
  });

  // Free-text direction
  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'regen-input'; inp.maxLength = 200;
  inp.placeholder = 'Describe what to change…';
  inp.style.display = 'none';

  sel.addEventListener('change', () => {
    if (sel.value === 'custom') {
      inp.style.display = 'block'; inp.focus();
    } else if (sel.value) {
      inp.style.display = 'block'; inp.value = sel.value;
    } else {
      inp.style.display = 'none'; inp.value = '';
    }
  });

  // Regen button
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'regen-btn'; btn.textContent = '↺ Regenerate';

  btn.addEventListener('click', async () => {
    const direction = inp.value.trim() || sel.value;
    if (!direction || direction === 'custom') { inp.focus(); return; }

    btn.disabled = true; btn.textContent = 'Regenerating…'; btn.classList.add('is-working');

    const fields = getCurrentFields();
    try {
      const updated = await fetchWidget(fields, widget.id, direction);
      // Update stored widget
      const idx = generatedWidgets.findIndex(w => w.id === widget.id);
      if (idx > -1) generatedWidgets[idx] = updated;
      Object.assign(widget, updated);

      // Refresh iframe and textarea inside this card
      const iframe  = card.querySelector('iframe');
      const textarea = card.querySelector('textarea');
      if (iframe)  iframe.srcdoc  = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${updated.html}</body></html>`;
      if (textarea) textarea.value = updated.html;

      // Refresh combined widget if it exists
      if (generatedWidgets.length > 0) showCombinedWidget(generatedWidgets);

      btn.textContent = '✓ Updated'; btn.classList.remove('is-working');
      setTimeout(() => { btn.disabled = false; btn.textContent = '↺ Regenerate'; }, 2000);
    } catch(err) {
      btn.disabled = false; btn.textContent = '↺ Try Again'; btn.classList.remove('is-working');
    }
  });

  row.appendChild(sel);
  row.appendChild(inp);
  row.appendChild(btn);
  card.appendChild(row);
}

// ── Objection Anticipator ─────────────────────────────────
objToggle.addEventListener('click', () => {
  const open = !objBody.hidden;
  objBody.hidden = open;
  objArrow.classList.toggle('is-open', !open);
});

objGenerateBtn.addEventListener('click', async () => {
  const fields = getCurrentFields();
  objGenerateBtn.disabled = true;
  objWorking.hidden = false;
  objResultWrap.hidden = true;

  try {
    const res = await fetch('/api/objections', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'HTTP ' + res.status);
    const text = data.text || '';
    if (!text) throw new Error('No content returned');

    objResult.textContent = text;
    objResultWrap.hidden = false;
  } catch(err) {
    objResult.textContent = 'Could not generate objection coaching. Please try again.';
    objResultWrap.hidden = false;
  }

  objWorking.hidden = true;
  objGenerateBtn.disabled = false;
  objGenerateBtn.textContent = '↺ Regenerate';
});

objCopyBtn.addEventListener('click', async () => {
  const text = objResult.textContent;
  try { await navigator.clipboard.writeText(text); }
  catch { const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  objCopyBtn.textContent = '✓ Copied!'; objCopyBtn.classList.add('is-copied');
  setTimeout(() => { objCopyBtn.textContent = '📋 Copy for Internal Notes'; objCopyBtn.classList.remove('is-copied'); }, 2500);
});

// ── Business type — reveal free-text when "Other" selected ──
(function () {
  const select = document.getElementById('f-business');
  const other  = document.getElementById('f-business-other');
  if (!select || !other) return;
  select.addEventListener('change', () => {
    const isOther = select.value === 'Other / General business';
    other.style.display = isOther ? 'block' : 'none';
    other.required = isOther;
    if (!isOther) other.value = '';
  });
})();

// ── Init ──────────────────────────────────────────────────
initServiceTiles();
initTriggerChips();
initOutcomeChips();
initUrgencyHints();
