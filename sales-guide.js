/* =========================================================
   Sales Guide — sales-guide-client.js
   (rename to sales-guide.js when deploying to site root —
    the Netlify function also uses sales-guide.js)
   ========================================================= */

const LS_API_KEY  = 'sb_api_key';
const LS_INT_KEY  = 'sb_int_key';
const LS_SESSIONS = 'sb_sales_guide_sessions';
const MAX_SESSIONS = 5;

// ── State ─────────────────────────────────────────────────
let currentMode        = null;
let currentRec         = null;
let currentAnswers     = {};
let generatedWidgets   = [];
let guideColor         = '#0d2d5e';

// Engagement type → project scope preset mapping
const SCOPE_PRESET_MAP = {
  network_upgrade:      'network',
  managed_services:     'onboarding',
  security_project:     'security',
  compliance:           'security',
  new_client_onboarding:'onboarding',
  project_plus_managed: 'network',
  mixed:                'azure',
  endpoint_refresh:     'endpoint',
  server_eol:           'server',
  voip_project:         'voip',
  backup_dr:            'backup'
};

// ── DOM handles ───────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Helpers ───────────────────────────────────────────────
function showSection(id) {
  ['mode-view','discovery-view','execution-view','working-view','results-view'].forEach(s => {
    const el = $(s); if (el) el.hidden = s !== id;
  });
}
function showError(id, msg) {
  const el = $(id); if (!el) return;
  el.textContent = msg; el.classList.remove('hidden');
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function clearError(id) { const el=$(id); if(el) el.classList.add('hidden'); }
function setWorking(title, sub) { $('workingTitle').textContent=title; $('workingSub').textContent=sub; }

// ── Color picker ─────────────────────────────────────────
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

$('guideColorPicker')?.addEventListener('input', () => {
  guideColor = $('guideColorPicker').value;
  $('guideColorHex').value = guideColor.toUpperCase();
  syncPresets(guideColor);
});
$('guideColorHex')?.addEventListener('input', () => {
  const v = $('guideColorHex').value.trim().startsWith('#') ? $('guideColorHex').value.trim() : '#' + $('guideColorHex').value.trim();
  if (isValidHex(v)) { guideColor = v; $('guideColorPicker').value = v; syncPresets(v); }
});
document.querySelectorAll('.guide-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    guideColor = btn.dataset.color;
    $('guideColorPicker').value = guideColor;
    $('guideColorHex').value    = guideColor.toUpperCase();
    syncPresets(guideColor);
  });
});
function syncPresets(color) {
  document.querySelectorAll('.guide-preset').forEach(b => b.classList.toggle('active', b.dataset.color === color));
}

// ── Mode selection ────────────────────────────────────────
['discovery','execution'].forEach(mode => {
  document.querySelectorAll(`.mode-card[data-mode="${mode}"]`).forEach(btn => {
    btn.addEventListener('click', () => activateMode(mode));
  });
});

function activateMode(mode) {
  currentMode = mode;
  showSection(mode === 'discovery' ? 'discovery-view' : 'execution-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('discBackBtn').addEventListener('click', () => { showSection('mode-view'); currentMode = null; });
$('execBackBtn').addEventListener('click', () => { showSection('mode-view'); currentMode = null; });

// ── Chips (multi-select, or single-select with data-single) ─
document.querySelectorAll('.chips-wrap').forEach(wrap => {
  const isSingle = wrap.dataset.single === 'true';
  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (isSingle) {
        wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
      } else {
        chip.classList.toggle('is-selected');
      }
    });
  });
});

function getChipValues(wrapId) {
  const selected = [...document.querySelectorAll(`#${wrapId} .chip.is-selected`)].map(c => c.dataset.val);
  const other    = document.getElementById(`other-${wrapId.replace('chips-','')}`);
  if (other?.value.trim()) selected.push(other.value.trim());
  return selected.join('; ') || '';
}

// Character counter for spec input
$('exec-spec')?.addEventListener('input', () => {
  $('specCount').textContent = $('exec-spec').value.length;
});

// ── Discovery generate ────────────────────────────────────
$('discGenerateBtn').addEventListener('click', async () => {
  clearError('discError');

  const answers = {
    challenge:  getChipValues('chips-challenge'),
    industry:   $('q-industry')?.value || '',
    staffCount: $('q-staff')?.value || '',
    company:    $('q-company')?.value.trim() || '',
    trigger:    getChipValues('chips-trigger'),
    outcome:    getChipValues('chips-outcome'),
    comparison: getChipValues('chips-comparison'),
    shape:      getChipValues('chips-shape'),
  };

  if (!answers.challenge) { showError('discError', 'Please select or describe the customer\'s primary challenge.'); return; }
  if (!answers.industry)  { showError('discError', 'Please select the customer\'s industry.'); return; }

  setWorking('Analyzing the opportunity…', 'Claude is reading the customer situation and building your tailored recommendation');
  showSection('working-view');

  try {
    const res  = await fetch('/api/sales-guide', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'discover', answers })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — make sure the sales-guide.js Netlify function is deployed to netlify/functions/.`);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Recommendation failed');
    currentRec     = data.recommendation;
    currentAnswers = answers;
    renderResults('discovery', answers.company || 'New Opportunity', data.recommendation);
  } catch (e) {
    showSection('discovery-view');
    showError('discError', e.message || 'Something went wrong. Please try again.');
  }
});

// ── Execution generate ────────────────────────────────────
$('execGenerateBtn').addEventListener('click', async () => {
  clearError('execError');
  const spec    = $('exec-spec')?.value.trim() || '';
  const context = $('exec-context')?.value.trim() || '';

  if (!spec) { showError('execError', 'Please paste the confirmed solution specification.'); return; }
  if (spec.length < 50) { showError('execError', 'The spec looks too brief — add more detail for a better result.'); return; }

  setWorking('Translating to buyer language…', 'Claude is reading the technical spec and building your proposal narrative');
  showSection('working-view');

  try {
    const res  = await fetch('/api/sales-guide', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'execute', spec, customerContext: context })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — make sure the sales-guide.js Netlify function is deployed to netlify/functions/.`);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Translation failed');
    currentRec = data.recommendation;
    renderResults('execution', context || 'Proposal Spec', data.recommendation);
  } catch (e) {
    showSection('execution-view');
    showError('execError', e.message || 'Something went wrong. Please try again.');
  }
});

// ── Render results ────────────────────────────────────────
// Return first sentence of a brief for compact display
function briefTeaser(text) {
  if (!text) return '';
  const first = text.split(/(?<=[.!?])\s/)[0].trim();
  return first.length > 10 ? first : text.slice(0, 120) + (text.length > 120 ? '…' : '');
}

function renderResults(mode, title, rec) {
  $('resultsMode').textContent  = mode === 'discovery' ? '🔍 Discovery Mode' : '⚡ Execution Mode';
  $('resultsTitle').textContent = title;
  $('coachingText').textContent = rec.coaching_insight || '';

  // Recommended approach — bullets
  const summaryEl = $('summaryText');
  const bullets = rec.solution_bullets || (rec.buyer_summary ? [rec.buyer_summary] : [rec.solution_summary || '']);
  if (Array.isArray(bullets) && bullets.length > 0) {
    summaryEl.innerHTML = `<ul class="approach-bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
  } else {
    summaryEl.textContent = rec.solution_summary || rec.buyer_summary || '';
  }

  // Hardware checklist (Discovery only)
  const hwSection = $('hardwareSection');
  if (mode === 'discovery' && rec.hardware_needed && rec.hardware_checklist?.length > 0) {
    const list = $('hardwareList');
    list.innerHTML = rec.hardware_checklist.map(hw => `
      <div class="hw-item">
        <div class="hw-component">🔧 ${esc(hw.component)}</div>
        ${hw.confirm   ? `<div class="hw-confirm">${esc(hw.confirm)}</div>` : ''}
        ${hw.never_forget ? `<div class="hw-forget">${esc(hw.never_forget)}</div>` : ''}
      </div>`).join('');
    hwSection.classList.remove('hidden');
  } else {
    hwSection.classList.add('hidden'); // No hardware = hide entirely
  }

  // Services
  const svcSection = $('servicesSection');
  if (mode === 'discovery' && rec.services_recommended?.length > 0) {
    const list = $('servicesList');
    list.innerHTML = rec.services_recommended.map(s => `
      <div class="svc-item${s.optional ? ' is-optional' : ''}">
        <span class="svc-billing bill-${s.billing || 'monthly'}">${s.billing || 'monthly'}</span>
        <div class="svc-body">
          <div class="svc-name">${esc(s.service)}${s.optional ? ' <span class="svc-optional-tag">— optional add-on</span>' : ''}</div>
          <div class="svc-reason">${esc(s.reason)}</div>
        </div>
      </div>`).join('');
    svcSection.classList.remove('hidden');
  } else {
    svcSection.classList.add('hidden');
  }

  // Widget briefs
  const briefs = rec.widget_briefs;
  const briefLabels = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · Investment' };
  if (briefs) {
    $('widgetBriefs').innerHTML = ['w1','w2','w3','w4','w5'].map(w => `
      <div class="brief-item">
        <div class="brief-w">${briefLabels[w]}</div>
        <div class="brief-text">${esc(briefTeaser(briefs[w] || ''))}</div>
      </div>`).join('');
  }

  $('widgetOutput').classList.add('hidden');
  showSection('results-view');

  // Auto-open Salesbuildr widget push if creds saved
  if (localStorage.getItem(LS_API_KEY) && localStorage.getItem(LS_INT_KEY)) {
    $('sbBody').hidden = false;
    $('sbArrow').classList.add('open');
    updatePushBtn();
  }

  // Initialise Phase 2 Create in Salesbuildr panel
  initCreateOppPanel();
}

// ── Generate widgets ──────────────────────────────────────
const WIDGET_IDS    = ['w1','w2','w3','w4','w5'];
const WIDGET_LABELS = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · The Investment' };

$('genWidgetsBtn').addEventListener('click', async () => {
  if (!currentRec?.widget_briefs) return;
  $('genWidgetsBtn').disabled = true;
  $('widgetsWorking').classList.remove('hidden');
  $('widgetsResult').classList.add('hidden');
  generatedWidgets = [];

  // Build enriched fields from the recommendation
  const briefs = currentRec.widget_briefs;
  const fields = {
    solution:  currentRec.solution_summary || currentRec.buyer_summary || '',
    business:  $('q-industry')?.value || $('exec-context')?.value || '',
    size:      $('q-staff')?.value || '',
    trigger:   briefs.w2 || '',
    outcomes:  briefs.w4 || '',
    urgency:   briefs.w2 || ''
  };

  for (let i = 0; i < WIDGET_IDS.length; i++) {
    const id = WIDGET_IDS[i];
    $('widgetsWorkingMsg').textContent = `Generating widget ${i+1} of 5 — ${WIDGET_LABELS[id]}…`;
    try {
      const colors = { primary: guideColor, accent: guideColor, light: lightenHex(guideColor, 0.91) };
      const res  = await fetch('/api/sales-widgets', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fields, widgetId: id, colors })
      });
      const data = await res.json();
      if (data.ok) generatedWidgets.push(data.widget);
    } catch (e) { console.error(`Widget ${id} failed:`, e); }
  }

  $('widgetsWorking').classList.add('hidden');

  if (generatedWidgets.length > 0) {
    const isCombined = document.querySelector('input[name="widgetMode"]:checked')?.value !== 'individual';
    const html = isCombined
      ? generatedWidgets.map(w => w.html).join('\n<div style="height:20px;"></div>\n')
      : generatedWidgets[0]?.html || '';  // show first in preview; push handles all
    $('previewFrame').srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#fff;}</style></head><body>${html}</body></html>`;
    $('htmlCode').value = html;
    $('widgetOutput').classList.remove('hidden');
    $('widgetOutput').scrollIntoView({ behavior:'smooth', block:'start' });
    $('widgetsResult').textContent = `✓ ${generatedWidgets.length} of 5 widgets generated`;
    $('widgetsResult').className = 'action-result ok';
  } else {
    $('widgetsResult').textContent = 'Widget generation failed — check your connection and try again.';
    $('widgetsResult').className = 'action-result error';
  }
  $('widgetsResult').classList.remove('hidden');
  $('genWidgetsBtn').disabled = false;
});

// Output tabs
document.querySelectorAll('.out-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.out-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    $('previewFrame').style.display = btn.dataset.pane==='preview' ? 'block':'none';
    $('htmlCode').style.display     = btn.dataset.pane==='code'    ? 'block':'none';
  });
});

// Copy widgets
$('copyWidgetsBtn').addEventListener('click', async () => {
  const html = $('htmlCode').value;
  try { await navigator.clipboard.writeText(html); }
  catch { const ta=document.createElement('textarea'); ta.value=html; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  const orig = $('copyWidgetsBtn').textContent;
  $('copyWidgetsBtn').textContent='✓ Copied!';
  setTimeout(()=>$('copyWidgetsBtn').textContent=orig, 2000);
});

// Open scope builder with pre-selected preset
$('openScopeBtn').addEventListener('click', () => {
  const preset = currentRec ? (SCOPE_PRESET_MAP[currentRec.engagement_type] || '') : '';
  window.open(`project-scope.html${preset ? '?preset='+preset+'&from=guide' : ''}`, '_blank');
});

// Open ROI builder with pre-filled context
$('openRoiBtn').addEventListener('click', () => {
  const params = new URLSearchParams();
  if (currentAnswers.industry)   params.set('industry',   currentAnswers.industry.split('/')[0].trim().toLowerCase());
  if (currentAnswers.staffCount) params.set('staff',      currentAnswers.staffCount);
  if (currentRec?.services_recommended) {
    const svcs = currentRec.services_recommended.filter(s => !s.optional).map(s => {
      const n = s.service.toLowerCase();
      if (n.includes('security') || n.includes('edr')) return 'security';
      if (n.includes('backup') || n.includes('recovery')) return 'backup';
      if (n.includes('helpdesk') || n.includes('noc') || n.includes('monitoring')) return 'helpdesk';
      if (n.includes('compliance')) return 'compliance';
      return null;
    }).filter(Boolean);
    if (svcs.length) params.set('services', [...new Set(svcs)].join(','));
  }
  params.set('from', 'guide');
  window.open(`roi-builder.html?${params.toString()}`, '_blank');
});

// Start over
$('startOverBtn').addEventListener('click', () => {
  currentRec = null; generatedWidgets = [];
  $('widgetOutput').classList.add('hidden');
  showSection('mode-view');
  window.scrollTo({ top:0, behavior:'smooth' });
});

// ── Salesbuildr push ──────────────────────────────────────
function initCredentials() {
  const a = localStorage.getItem(LS_API_KEY), i = localStorage.getItem(LS_INT_KEY);
  if (a) $('sbApiKey').value = a;
  if (i) $('sbIntKey').value = i;
  if (a && i) $('sbRemember').checked = true;
  updatePushBtn();
}
function updatePushBtn() {
  $('sbPushBtn').disabled = !($('sbApiKey').value.trim() && $('sbIntKey').value.trim());
}
$('sbToggle').addEventListener('click', () => {
  const open = !$('sbBody').hidden;
  $('sbBody').hidden = open;
  $('sbArrow').classList.toggle('open', !open);
});
$('sbApiKey').addEventListener('input', updatePushBtn);
$('sbIntKey').addEventListener('input', updatePushBtn);

$('sbPushBtn').addEventListener('click', async () => {
  const apiKey = $('sbApiKey').value.trim(), intKey = $('sbIntKey').value.trim();
  if (!apiKey || !intKey) return;
  if ($('sbRemember').checked) { localStorage.setItem(LS_API_KEY,apiKey); localStorage.setItem(LS_INT_KEY,intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  $('sbPushBtn').disabled=true; $('sbPushBtn').textContent='Saving…'; $('sbResult').classList.add('hidden');

  const title      = $('resultsTitle').textContent || 'Sales Guide Widgets';
  const prefix     = $('sbPrefix').value.trim();
  const isCombined = document.querySelector('input[name="widgetMode"]:checked')?.value !== 'individual';

  const widgets = isCombined
    ? [{ id:'guide', title, html: generatedWidgets.map(w=>w.html).join('\n<div style="height:20px;"></div>\n') }]
    : generatedWidgets.map(w => ({ id: w.id, title: w.title || title, html: w.html }));

  try {
    const res  = await fetch('/api/push-widgets',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({widgets, prefix, apiKey, integrationKey:intKey})});
    const data = await res.json();
    if (data.successCount>0) {
      $('sbResult').textContent='✓ Saved to your Salesbuildr widget library.';
      $('sbResult').className='sb-result ok';
      $('sbPushBtn').textContent='✓ Saved'; $('sbPushBtn').classList.add('is-done');
    } else throw new Error(data.results?.[0]?.error||data.error||'Unknown error');
  } catch(e) {
    $('sbResult').textContent=`✕ ${e.message}`;
    $('sbResult').className='sb-result error';
    $('sbPushBtn').disabled=false; $('sbPushBtn').textContent='Save to Salesbuildr →';
  }
  $('sbResult').classList.remove('hidden');
});

// ── Save & Resume ─────────────────────────────────────────
$('saveSessionBtn').addEventListener('click', () => {
  const company = $('q-company')?.value.trim() || 'Unnamed customer';
  const session = {
    id:        Date.now().toString(36),
    company,
    mode:      'discovery',
    timestamp: new Date().toISOString(),
    answers: {
      challenge:  getChipValues('chips-challenge'),
      industry:   $('q-industry')?.value || '',
      staffCount: $('q-staff')?.value || '',
      trigger:    getChipValues('chips-trigger'),
      outcome:    getChipValues('chips-outcome'),
      comparison: getChipValues('chips-comparison'),
      shape:      getChipValues('chips-shape'),
    }
  };

  const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
  sessions.unshift(session);
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));

  const orig = $('saveSessionBtn').textContent;
  $('saveSessionBtn').textContent = '✓ Saved — come back after the site visit';
  setTimeout(() => $('saveSessionBtn').textContent = orig, 3000);
});

function loadResumeBanner() {
  const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
  if (sessions.length === 0) return;
  const latest = sessions[0];
  const ago    = timeSince(new Date(latest.timestamp));
  $('resumeTitle').textContent   = `Saved: ${latest.company}`;
  $('resumeSubtitle').textContent = `Discovery session — saved ${ago}`;
  $('resumeBanner').classList.remove('hidden');

  $('resumeBtn').addEventListener('click', () => {
    activateMode('discovery');
    // Re-apply saved answers
    if (latest.answers) restoreDiscoveryAnswers(latest.answers);
    $('resumeBanner').classList.add('hidden');
  });
  $('dismissBtn').addEventListener('click', () => {
    $('resumeBanner').classList.add('hidden');
    const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
    sessions.shift();
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  });
}

function restoreDiscoveryAnswers(answers) {
  // Restore chip selections
  const chipMap = {
    challenge: 'chips-challenge', trigger: 'chips-trigger',
    outcome: 'chips-outcome', comparison: 'chips-comparison', shape: 'chips-shape'
  };
  Object.entries(chipMap).forEach(([key, wrapId]) => {
    if (!answers[key]) return;
    const values = answers[key].split('; ');
    document.querySelectorAll(`#${wrapId} .chip`).forEach(chip => {
      if (values.includes(chip.dataset.val)) chip.classList.add('is-selected');
    });
  });
  if (answers.industry)   $('q-industry').value = answers.industry;
  if (answers.staffCount) $('q-staff').value    = answers.staffCount;
}

function timeSince(date) {
  const secs = Math.floor((new Date() - date) / 1000);
  if (secs < 3600)  return `${Math.floor(secs/60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)} hr ago`;
  return `${Math.floor(secs/86400)} day${Math.floor(secs/86400)>1?'s':''} ago`;
}

// ── Utility ───────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function lightenHex(hex, amount) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(c=>Math.round(c+(255-c)*amount).toString(16).padStart(2,'0')).join('');
}

// ── Spec file upload (XLSX / DOCX) ────────────────────────
const specUploadZone  = $('specUploadZone');
const specFileInput   = $('specFile');
const specFileStatus  = $('specFileStatus');
const specUploadInner = $('specUploadInner');

specUploadZone.addEventListener('click', e => {
  if (!e.target.closest('label')) specFileInput.click();
});
specUploadZone.addEventListener('dragover', e => { e.preventDefault(); specUploadZone.classList.add('drag-over'); });
['dragleave','drop'].forEach(t => specUploadZone.addEventListener(t, e => { e.preventDefault(); specUploadZone.classList.remove('drag-over'); }));
specUploadZone.addEventListener('drop', e => {
  const f = e.dataTransfer.files[0];
  if (f) parseSpecFile(f);
});
specFileInput.addEventListener('change', () => {
  if (specFileInput.files[0]) parseSpecFile(specFileInput.files[0]);
  specFileInput.value = '';
});

async function parseSpecFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls','docx'].includes(ext)) {
    showSpecStatus(`Unsupported file type: .${ext} — use .xlsx or .docx`, true);
    return;
  }

  showSpecStatus('Extracting content…', false, true);

  try {
    let text = '';

    if (ext === 'xlsx' || ext === 'xls') {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(new Uint8Array(buf), { type:'array', cellText:true, cellDates:true });
      const parts = [];
      wb.SheetNames.forEach(name => {
        const ws   = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        const nonEmpty = rows.filter(r => r.some(c => String(c).trim() !== ''));
        if (nonEmpty.length === 0) return;
        parts.push(`--- ${name} ---`);
        nonEmpty.forEach(row => {
          const cells = row.map(c => String(c).trim()).filter(c => c !== '');
          if (cells.length > 0) parts.push(cells.join('  |  '));
        });
      });
      text = parts.join('\n');

    } else if (ext === 'docx') {
      const buf    = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      text = (result.value || '').trim();
    }

    text = text.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();

    if (text.length < 30) {
      showSpecStatus('File appears to be empty or could not be read.', true);
      return;
    }

    $('exec-spec').value = text;
    $('specCount').textContent = text.length;
    showSpecStatus(`✓ ${file.name} extracted — ${text.length.toLocaleString()} characters. Review below and edit if needed.`);

  } catch (e) {
    showSpecStatus(`Could not read the file: ${e.message}`, true);
  }
}

function showSpecStatus(msg, isError = false, isLoading = false) {
  specFileStatus.textContent  = msg;
  specFileStatus.className    = 'spec-file-status' + (isError ? ' error' : '');
  specFileStatus.classList.remove('hidden');
  if (!isError && !isLoading) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'spec-file-clear'; btn.textContent = '✕ Clear';
    btn.addEventListener('click', () => {
      $('exec-spec').value = ''; $('specCount').textContent = '0';
      specFileStatus.classList.add('hidden');
    });
    specFileStatus.appendChild(btn);
  }
}

// ── Init ──────────────────────────────────────────────────
initCredentials();
loadResumeBanner();

// ═════════════════════════════════════════════════════════
// PHASE 2 — Create in Salesbuildr
// ═════════════════════════════════════════════════════════

const ENGAGEMENT_LABELS = {
  managed_services:      'Managed Services',
  network_upgrade:       'Network Infrastructure Upgrade',
  security_project:      'Security Project',
  compliance:            'Compliance Project',
  new_client_onboarding: 'New Client Onboarding',
  project_plus_managed:  'Project + Managed Services',
  mixed:                 'IT Services',
  endpoint_refresh:      'Endpoint Refresh',
  server_eol:            'Server Infrastructure Refresh',
  voip_project:          'VoIP & Communications Upgrade',
  backup_dr:             'Backup & Disaster Recovery'
};

// Track selected company across wizard steps
let selectedOppCompany = null;

// ── Build plain-text Sales Brief from currentRec ──────────
function buildSalesBrief() {
  const rec = currentRec;
  if (!rec) return '';
  const company = currentAnswers?.company || '';
  const date    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const lines   = [];

  lines.push(`SALES GUIDE BRIEF${company ? ' — ' + company : ''}`);
  lines.push(`Generated: ${date}`);
  lines.push('');

  if (rec.coaching_insight) {
    lines.push('COACHING INSIGHT');
    lines.push(rec.coaching_insight);
    lines.push('');
  }

  const bullets = Array.isArray(rec.solution_bullets) ? rec.solution_bullets
    : (rec.solution_summary ? [rec.solution_summary] : []);
  if (bullets.length) {
    lines.push('RECOMMENDED APPROACH');
    bullets.forEach(b => lines.push(`• ${b}`));
    lines.push('');
  }

  const briefs = rec.widget_briefs || {};
  if (Object.keys(briefs).length) {
    lines.push('PROPOSAL NARRATIVE (W1–W5)');
    if (briefs.w1) lines.push(`Situation  (W1): ${briefs.w1}`);
    if (briefs.w2) lines.push(`Urgency    (W2): ${briefs.w2}`);
    if (briefs.w3) lines.push(`Trust      (W3): ${briefs.w3}`);
    if (briefs.w4) lines.push(`Outcome    (W4): ${briefs.w4}`);
    if (briefs.w5) lines.push(`Investment (W5): ${briefs.w5}`);
    lines.push('');
  }

  const services = rec.services_recommended || [];
  if (services.length) {
    lines.push('SERVICES RECOMMENDED');
    services.forEach(s => {
      const opt = s.optional ? ' (Optional)' : '';
      lines.push(`• ${s.service} — ${s.billing}${opt}`);
      if (s.reason) lines.push(`  ${s.reason}`);
    });
    lines.push('');
  }

  const hw = rec.hardware_checklist || [];
  if (rec.hardware_needed && hw.length) {
    lines.push('HARDWARE TO CONFIRM AT SITE SURVEY');
    hw.forEach(h => {
      lines.push(`• ${h.component}: ${h.confirm}`);
      if (h.never_forget) lines.push(`  ⚠ ${h.never_forget}`);
    });
    lines.push('');
  }

  if (rec.roi_angle) {
    lines.push('ROI ANGLE');
    lines.push(rec.roi_angle);
    lines.push('');
  }

  lines.push('---');
  lines.push('Generated by Salesbuildr Sales Guide');
  return lines.join('\n');
}

// ── Initialise the panel when results are shown ───────────
function initCreateOppPanel() {
  selectedOppCompany = null;

  // Pre-fill credentials from localStorage
  const a = localStorage.getItem(LS_API_KEY), i = localStorage.getItem(LS_INT_KEY);
  if (a) $('oppApiKey').value = a;
  if (i) $('oppIntKey').value = i;
  if (a && i) $('oppRemember').checked = true;

  // Pre-fill company name from Discovery answers
  const company  = currentAnswers?.company || '';
  if (company) $('oppCompanyName').value = company;

  // Pre-fill opportunity + quote titles
  const engType  = currentRec?.engagement_type || 'mixed';
  const engLabel = ENGAGEMENT_LABELS[engType] || 'IT Services';
  $('oppName').value       = company ? `${engLabel} — ${company}` : engLabel;
  $('oppQuoteTitle').value = company ? `${company} — ${engLabel} Proposal` : `${engLabel} Proposal`;

  // Pre-fill Sales Brief text
  $('oppBriefText').textContent = buildSalesBrief();

  // Reset step 2 visibility
  $('oppStep2').classList.add('hidden');
  $('oppCompanyResults').classList.add('hidden');
  $('oppCompanySelected').classList.add('hidden');
  $('oppBriefPreview').classList.add('hidden');
  $('oppBriefToggleLabel').textContent = '▶ Preview Sales Brief';
  $('oppCreateResult').classList.add('hidden');
  $('oppCreateBtn').textContent = 'Create in Salesbuildr →';
  $('oppCreateBtn').classList.remove('is-done');
  $('oppCreateBtn').disabled = false;
  $('oppQuoteFields').classList.remove('hidden');

  // Show the panel
  $('createOppWrap').classList.remove('hidden');
}

// ── Toggle panel open/close ───────────────────────────────
$('createOppToggle')?.addEventListener('click', () => {
  const body  = $('createOppBody');
  const arrow = $('createOppArrow');
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  arrow.classList.toggle('open', !isOpen);
});

// ── Toggle Sales Brief preview ────────────────────────────
$('oppBriefToggle')?.addEventListener('click', () => {
  const preview = $('oppBriefPreview');
  const isOpen  = !preview.classList.contains('hidden');
  preview.classList.toggle('hidden', isOpen);
  $('oppBriefToggleLabel').textContent = isOpen ? '▶ Preview Sales Brief' : '▼ Hide Sales Brief';
});

// ── Toggle quote fields ───────────────────────────────────
$('oppCreateQuote')?.addEventListener('change', () => {
  $('oppQuoteFields').classList.toggle('hidden', !$('oppCreateQuote').checked);
});

// ── Company search ────────────────────────────────────────
$('oppSearchBtn')?.addEventListener('click', doCompanySearch);
$('oppCompanyName')?.addEventListener('keydown', e => { if (e.key === 'Enter') doCompanySearch(); });

async function doCompanySearch() {
  const name   = $('oppCompanyName').value.trim();
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  if (!name)            { showOppError('Enter a company name to search.'); return; }
  if (!apiKey || !intKey) { showOppError('Enter your API credentials first.'); return; }

  $('oppSearchBtn').disabled    = true;
  $('oppSearchBtn').textContent = 'Searching…';
  $('oppCompanyResults').classList.add('hidden');
  $('oppCreateResult').classList.add('hidden');

  try {
    const res = await callCreateOpp('search-company', { name, apiKey, integrationKey: intKey });
    renderCompanyResults(res.companies || [], name);
  } catch (e) {
    showOppError('Search failed: ' + e.message);
  }

  $('oppSearchBtn').disabled    = false;
  $('oppSearchBtn').textContent = 'Search →';
}

function renderCompanyResults(companies, searchName) {
  const wrap = $('oppCompanyResults');

  if (companies.length === 0) {
    wrap.innerHTML = `
      <div class="no-results-hint">No match for "<strong>${esc(searchName)}</strong>" in Salesbuildr</div>
      <button class="opp-result-item opp-result-new" data-action="create" data-name="${esc(searchName)}">
        + Create "<strong>${esc(searchName)}</strong>" as a new company
      </button>`;
  } else {
    wrap.innerHTML = `
      <div class="opp-results-label">Select existing or create new:</div>
      ${companies.slice(0, 6).map(c => `
        <button class="opp-result-item" data-action="select" data-id="${esc(c.id)}" data-name="${esc(c.name)}">
          ${esc(c.name)}
          ${c.number ? `<span class="opp-result-num">#${esc(c.number)}</span>` : ''}
        </button>`).join('')}
      <button class="opp-result-item opp-result-new" data-action="create" data-name="${esc(searchName)}">
        + Create "<strong>${esc(searchName)}</strong>" as a new company
      </button>`;
  }

  wrap.classList.remove('hidden');

  wrap.querySelectorAll('.opp-result-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'select') {
        selectCompany({ id: btn.dataset.id, name: btn.dataset.name, existing: true });
      } else {
        selectCompany({ id: null, name: btn.dataset.name, existing: false });
      }
    });
  });
}

function selectCompany(company) {
  selectedOppCompany = company;
  $('oppCompanyResults').classList.add('hidden');

  const sel = $('oppCompanySelected');
  sel.innerHTML = company.existing
    ? `<div class="company-selected-tag">✓ ${esc(company.name)} <span class="existing-badge">existing</span>
         <button class="change-company-btn" id="changeCompanyBtn">Change</button></div>`
    : `<div class="company-selected-tag">+ Will create <strong>${esc(company.name)}</strong> as new company
         <button class="change-company-btn" id="changeCompanyBtn">Change</button></div>`;
  sel.classList.remove('hidden');

  // Update opportunity and quote titles to reflect chosen company
  const engType  = currentRec?.engagement_type || 'mixed';
  const engLabel = ENGAGEMENT_LABELS[engType] || 'IT Services';
  $('oppName').value       = `${engLabel} — ${company.name}`;
  $('oppQuoteTitle').value = `${company.name} — ${engLabel} Proposal`;

  // Show step 2
  $('oppStep2').classList.remove('hidden');
  $('oppStep2').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  $('changeCompanyBtn')?.addEventListener('click', () => {
    selectedOppCompany = null;
    sel.classList.add('hidden');
    $('oppStep2').classList.add('hidden');
    $('oppCompanyResults').classList.remove('hidden');
  });
}

// ── Main creation flow ────────────────────────────────────
$('oppCreateBtn')?.addEventListener('click', doCreateOpportunity);

async function doCreateOpportunity() {
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  if (!apiKey || !intKey)      { showOppError('Enter your API credentials first.'); return; }
  if (!selectedOppCompany)     { showOppError('Select a company first.'); return; }

  if ($('oppRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  $('oppCreateBtn').disabled    = true;
  $('oppCreateWorking').classList.remove('hidden');
  $('oppCreateResult').classList.add('hidden');

  const creds      = { apiKey, integrationKey: intKey };
  const oppName    = $('oppName').value.trim() || 'New Opportunity';
  const description = buildSalesBrief();

  try {
    // 1. Get or create company
    let companyId = selectedOppCompany.id;
    if (!companyId) {
      setOppWorking('Creating company in Salesbuildr…');
      const res = await callCreateOpp('create-company', { name: selectedOppCompany.name, ...creds });
      if (!res.ok) throw new Error(res.error || 'Failed to create company.');
      companyId = res.company?.id;
      if (!companyId) throw new Error('Company created but no ID returned.');
    }

    // 2. Upsert opportunity (unique external ID per session)
    setOppWorking('Creating opportunity…');
    const slug  = selectedOppCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20);
    const extId = `sg-${slug}-${Date.now().toString().slice(-6)}`;

    const oppRes = await callCreateOpp('upsert-opportunity', {
      companyId,
      name: oppName,
      description,
      extId,
      ...creds
    });
    if (!oppRes.ok) throw new Error(oppRes.error || 'Failed to create opportunity.');
    const opportunityId = oppRes.opportunity?.id;

    // 3. Create draft quote (optional)
    let quoteCreated = false;
    if ($('oppCreateQuote').checked && opportunityId) {
      setOppWorking('Creating draft quote…');
      const quoteTitle = $('oppQuoteTitle').value.trim() || oppName;
      const quoteRes   = await callCreateOpp('create-quote', { opportunityId, title: quoteTitle, ...creds });
      quoteCreated     = quoteRes.ok;
    }

    // Success
    $('oppCreateWorking').classList.add('hidden');
    const resultEl = $('oppCreateResult');
    resultEl.innerHTML = `
      <div class="opp-success">
        <div class="opp-success-icon">✓</div>
        <div class="opp-success-body">
          <strong>Created in Salesbuildr</strong>
          <div class="opp-success-detail">
            Opportunity: <em>${esc(oppName)}</em> — Sales Brief saved to Description
            ${quoteCreated ? ' · Draft quote created' : ''}
          </div>
          <div class="opp-success-hint">Open Salesbuildr and search <strong>${esc(selectedOppCompany.name)}</strong> to find the new opportunity.</div>
        </div>
      </div>`;
    resultEl.classList.remove('hidden');
    $('oppCreateBtn').textContent = '✓ Created';
    $('oppCreateBtn').classList.add('is-done');

  } catch (e) {
    $('oppCreateWorking').classList.add('hidden');
    showOppError(e.message);
    $('oppCreateBtn').disabled = false;
  }
}

// ── Helpers ───────────────────────────────────────────────
async function callCreateOpp(action, data) {
  const res = await fetch('/api/create-opportunity', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, ...data })
  });
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Server error — make sure create-opportunity.js is deployed to Netlify.');
  }
  return res.json();
}

function setOppWorking(msg) {
  $('oppWorkingMsg').textContent = msg;
  $('oppCreateWorking').classList.remove('hidden');
}

function showOppError(msg) {
  $('oppCreateWorking').classList.add('hidden');
  const el = $('oppCreateResult');
  el.innerHTML = `<div class="opp-error">✕ ${esc(msg)}</div>`;
  el.classList.remove('hidden');
}
