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
let currentMode        = null;  // 'discovery' | 'execution'
let currentRec         = null;  // last recommendation from API
let generatedWidgets   = [];
let currentSession     = null;  // active save/resume session

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
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Recommendation failed');
    currentRec = data.recommendation;
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
function renderResults(mode, title, rec) {
  $('resultsMode').textContent  = mode === 'discovery' ? '🔍 Discovery Mode' : '⚡ Execution Mode';
  $('resultsTitle').textContent = title;
  $('coachingText').textContent = rec.coaching_insight || '';
  $('summaryText').textContent  = rec.solution_summary || rec.buyer_summary || '';

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
    hwSection.classList.add('hidden');
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
        <div class="brief-text">${esc(briefs[w] || '')}</div>
      </div>`).join('');
  }

  $('widgetOutput').classList.add('hidden');
  showSection('results-view');

  // Auto-open Salesbuildr if creds saved
  if (localStorage.getItem(LS_API_KEY) && localStorage.getItem(LS_INT_KEY)) {
    $('sbBody').hidden = false;
    $('sbArrow').classList.add('open');
    updatePushBtn();
  }
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
      const res  = await fetch('/api/sales-widgets', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fields, widgetId: id, colors: { primary:'#0d2d5e', accent:'#1a6fc4', light:'#f0f6ff' } })
      });
      const data = await res.json();
      if (data.ok) generatedWidgets.push(data.widget);
    } catch (e) { console.error(`Widget ${id} failed:`, e); }
  }

  $('widgetsWorking').classList.add('hidden');

  if (generatedWidgets.length > 0) {
    const html = generatedWidgets.map(w => w.html).join('\n<div style="height:20px;"></div>\n');
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

// Open scope builder
$('openScopeBtn').addEventListener('click', () => window.open('project-scope.html','_blank'));

// Open ROI builder
$('openRoiBtn').addEventListener('click', () => window.open('roi-builder.html','_blank'));

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

  const title  = $('resultsTitle').textContent || 'Sales Guide Widgets';
  const prefix = $('sbPrefix').value.trim();
  const html   = $('htmlCode').value;

  try {
    const res  = await fetch('/api/push-widgets',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({widgets:[{id:'guide',title,html}],prefix,apiKey,integrationKey:intKey})});
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

// ── Init ──────────────────────────────────────────────────
initCredentials();
loadResumeBanner();
