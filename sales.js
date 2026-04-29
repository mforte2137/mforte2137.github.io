/* =========================================================
   Salesbuildr Widget Creator — sales.js
   ========================================================= */

const WIDGET_IDS    = ['w1', 'w2', 'w3', 'w4', 'w5'];
const WIDGET_LABELS = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · The Investment' };
const LS_API_KEY    = 'sb_api_key';
const LS_INT_KEY    = 'sb_int_key';

let selectedColors   = { primary: '#0d2d5e', accent: '#1a6fc4', light: '#f0f6ff' };
let generatedWidgets = [];

// ── DOM ───────────────────────────────────────────────────
const formView      = document.getElementById('form-view');
const workingView   = document.getElementById('working-view');
const outputView    = document.getElementById('output-view');
const form          = document.getElementById('widget-form');
const submitBtn     = document.getElementById('submit-btn');
const workingTitle  = document.getElementById('working-title');
const workingSub    = document.getElementById('working-sub');
const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const outputTitle   = document.getElementById('output-title');
const restartBtn    = document.getElementById('restart-btn');
const restartBtn2   = document.getElementById('restart-btn-2');
const errorBanner   = document.getElementById('error-banner');
const errorDetail   = document.getElementById('error-detail');
const errorDismiss  = document.getElementById('error-dismiss');

const combinedSection   = document.getElementById('combined-section');
const combinedCopyBtn   = document.getElementById('combined-copy-btn');
const combinedPreview   = document.getElementById('combined-preview');
const combinedCode      = document.getElementById('combined-code');
const combinedTabs      = document.getElementById('combined-tabs');
const individualSection = document.getElementById('individual-section');
const individualToggle  = document.getElementById('individual-toggle');
const individualWidgets = document.getElementById('individual-widgets');

// Connect Salesbuildr
const sbToggle   = document.getElementById('sb-toggle');
const sbArrow    = document.getElementById('sb-arrow');
const sbBody     = document.getElementById('sb-connect-body');
const sbApiKey   = document.getElementById('sb-api-key');
const sbIntKey   = document.getElementById('sb-int-key');
const sbRemember = document.getElementById('sb-remember');
const sbPrefix   = document.getElementById('sb-prefix');
const sbPushBtn  = document.getElementById('sb-push-btn');
const sbResult   = document.getElementById('sb-result');

// ── Colour theme selector ─────────────────────────────────
function lightenColor(hex, amount) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return '#' + [r,g,b].map(c => Math.round(c+(255-c)*amount).toString(16).padStart(2,'0')).join('');
}
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

const themeGrid    = document.getElementById('theme-grid');
const customInputs = document.getElementById('custom-inputs');
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
      selectedColors = { primary: tile.dataset.primary, accent: tile.dataset.accent, light: tile.dataset.light };
    }
  });
});
function syncPicker(picker, hexField) {
  picker.addEventListener('input', () => { hexField.value = picker.value.toUpperCase(); updateCustomColors(); });
  hexField.addEventListener('input', () => {
    const val = hexField.value.trim().startsWith('#') ? hexField.value.trim() : '#' + hexField.value.trim();
    if (isValidHex(val)) { picker.value = val; hexField.classList.remove('is-error'); updateCustomColors(); }
    else hexField.classList.add('is-error');
  });
}
syncPicker(primaryPicker, primaryHex);
syncPicker(accentPicker, accentHex);
function updateCustomColors() {
  const p = primaryPicker.value, a = accentPicker.value;
  selectedColors = { primary: p, accent: a, light: lightenColor(a, 0.91) };
  customPreview.style.background = `linear-gradient(135deg, ${p} 60%, ${a} 60%)`;
  const sp = customPreview.querySelector('span'); if (sp) { sp.style.color='#ffffff'; sp.textContent=''; }
}

// ── Connect Salesbuildr section ───────────────────────────
function initConnectSection() {
  // Load saved keys from localStorage
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  if (savedApi) { sbApiKey.value = savedApi; }
  if (savedInt) { sbIntKey.value = savedInt; }
  if (savedApi && savedInt) { sbRemember.checked = true; }
  updatePushButton();
}

function updatePushButton() {
  sbPushBtn.disabled = !(sbApiKey.value.trim() && sbIntKey.value.trim());
}

sbToggle.addEventListener('click', () => {
  const isOpen = !sbBody.hidden;
  sbBody.hidden = isOpen;
  sbArrow.classList.toggle('is-open', !isOpen);
});

sbApiKey.addEventListener('input', updatePushButton);
sbIntKey.addEventListener('input', updatePushButton);

// ── Character counter ─────────────────────────────────────
const solutionField = document.getElementById('f-solution');
const solutionCount = document.getElementById('solution-count');
solutionField.addEventListener('input', () => { solutionCount.textContent = solutionField.value.length; });

// ── View helpers ──────────────────────────────────────────
function showView(name) {
  formView.hidden    = name !== 'form';
  workingView.hidden = name !== 'working';
  outputView.hidden  = name !== 'output';
}
function showError(msg)  { errorDetail.textContent = msg; errorBanner.hidden = false; }
function hideError()     { errorBanner.hidden = true; }

// ── Restart ───────────────────────────────────────────────
function restart() {
  hideError();
  form.reset();
  solutionCount.textContent   = '0';
  generatedWidgets            = [];
  individualWidgets.innerHTML = '';
  outputTitle.textContent     = '';
  combinedSection.hidden      = true;
  individualSection.hidden    = true;
  individualWidgets.hidden    = true;
  individualToggle.textContent = 'Show 5 individual widgets ▼';
  sbResult.hidden             = true;
  sbPushBtn.textContent       = 'Save to Salesbuildr →';
  sbPushBtn.classList.remove('is-done');
  sbPushBtn.disabled          = !(sbApiKey.value.trim() && sbIntKey.value.trim());
  setProgress(0);
  showView('form');
}
restartBtn.addEventListener('click',  restart);
restartBtn2.addEventListener('click', restart);
errorDismiss.addEventListener('click', () => { hideError(); showView('form'); });

// ── Individual widget toggle ──────────────────────────────
individualToggle.addEventListener('click', () => {
  const open = !individualWidgets.hidden;
  individualWidgets.hidden = open;
  individualToggle.textContent = open ? 'Show 5 individual widgets ▼' : 'Hide individual widgets ▲';
});

// ── Combined widget tabs ──────────────────────────────────
combinedTabs.querySelectorAll('.widget-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    combinedTabs.querySelectorAll('.widget-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const pane = btn.dataset.pane;
    combinedPreview.style.display = pane === 'preview' ? 'block' : 'none';
    combinedCode.style.display    = pane === 'code'    ? 'block' : 'none';
  });
});

// ── Progress ──────────────────────────────────────────────
function setProgress(done) {
  const pct = Math.round((done / WIDGET_IDS.length) * 100);
  progressBar.style.width   = pct + '%';
  progressLabel.textContent = `${done} of ${WIDGET_IDS.length}`;
}

// ── Validation ────────────────────────────────────────────
function validateForm() {
  let valid = true;
  document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
  document.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
  if (!solutionField.value.trim()) { markError(solutionField, 'Please describe what you are proposing.'); valid = false; }
  const biz = document.getElementById('f-business');
  if (!biz.value.trim()) { markError(biz, 'Please describe the customer\'s business.'); valid = false; }
  return valid;
}
function markError(field, msg) {
  field.classList.add('is-error');
  const p = document.createElement('p'); p.className = 'field-error-msg'; p.textContent = msg;
  field.parentElement.appendChild(p); field.focus();
}

// ── Form submit ───────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  if (!validateForm()) return;

  const fields = {
    solution: document.getElementById('f-solution').value.trim(),
    business: document.getElementById('f-business').value.trim(),
    size:     document.getElementById('f-size').value.trim(),
    trigger:  document.getElementById('f-trigger').value.trim(),
    outcomes: document.getElementById('f-outcomes').value.trim(),
    urgency:  document.getElementById('f-urgency').value.trim()
  };

  const titleText = fields.solution.split(/[.!?\n]/)[0].trim();
  outputTitle.textContent = titleText.length > 60 ? titleText.slice(0,57)+'…' : titleText;

  submitBtn.disabled          = true;
  generatedWidgets            = [];
  individualWidgets.innerHTML = '';
  combinedSection.hidden      = true;
  individualSection.hidden    = true;
  setProgress(0);
  showView('working');

  for (let i = 0; i < WIDGET_IDS.length; i++) {
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
    setProgress(i + 1);

    // Switch to output view on first widget
    if (i === 0) showView('output');
  }

  workingTitle.textContent = 'All 5 widgets ready.';
  submitBtn.disabled = false;

  // Build and show combined widget
  if (generatedWidgets.length > 0) {
    showCombinedWidget(generatedWidgets);
    combinedSection.hidden  = false;
    individualSection.hidden = false;
    initConnectSection();
  }
});

// ── API call ──────────────────────────────────────────────
async function fetchWidget(fields, widgetId) {
  let res;
  try {
    res = await fetch('/api/sales-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, widgetId, colors: selectedColors })
    });
  } catch (e) { throw new Error('Could not reach the widget generator.'); }
  let data;
  try { data = await res.json(); } catch (e) { throw new Error('Unexpected response. Status ' + res.status); }
  if (!res.ok || !data.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data.widget;
}

// ── Combined widget ───────────────────────────────────────
function buildCombinedHtml(widgets) {
  return widgets.map(w => w.html).join('\n<div style="height:20px;"></div>\n');
}

function showCombinedWidget(widgets) {
  const html = buildCombinedHtml(widgets);
  combinedCode.value    = html;
  combinedPreview.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${html}</body></html>`;
  // Reset to preview tab
  combinedTabs.querySelectorAll('.widget-tab').forEach(b => b.classList.remove('is-active'));
  combinedTabs.querySelector('[data-pane="preview"]').classList.add('is-active');
  combinedPreview.style.display = 'block';
  combinedCode.style.display    = 'none';
}

combinedCopyBtn.addEventListener('click', async () => {
  const text = combinedCode.value;
  try { await navigator.clipboard.writeText(text); }
  catch { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  combinedCopyBtn.textContent = '✅ Copied!';
  combinedCopyBtn.classList.add('is-copied');
  setTimeout(() => { combinedCopyBtn.textContent = '📋 Copy Widget'; combinedCopyBtn.classList.remove('is-copied'); }, 2500);
});

// ── Push combined widget to Salesbuildr ───────────────────
sbPushBtn.addEventListener('click', async () => {
  const apiKey = sbApiKey.value.trim();
  const intKey = sbIntKey.value.trim();
  if (!apiKey || !intKey) return;

  // Save to localStorage if Remember checked
  if (sbRemember.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  sbPushBtn.disabled    = true;
  sbPushBtn.textContent = 'Saving…';
  sbResult.hidden       = true;

  // Push as a single combined widget
  const combinedWidget = {
    id:    'combined',
    title: outputTitle.textContent || 'Buyer Journey Widgets',
    html:  buildCombinedHtml(generatedWidgets)
  };

  const prefix = sbPrefix.value.trim();

  let res;
  try {
    res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: [combinedWidget], prefix, apiKey, integrationKey: intKey })
    });
  } catch (e) {
    showSbResult(false, 'Could not reach the server. Check your connection.');
    sbPushBtn.disabled    = false;
    sbPushBtn.textContent = 'Save to Salesbuildr →';
    return;
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (data.successCount > 0) {
    showSbResult(true, 'Widget saved to your Salesbuildr template library. Look for it in your widget panel — ready to drag into any quote.');
    sbPushBtn.textContent = '✓ Saved to Salesbuildr';
    sbPushBtn.classList.add('is-done');
  } else {
    const err = (data.results && data.results[0] && data.results[0].error) || data.error || 'Unknown error';
    showSbResult(false, `Save failed: ${err}`);
    sbPushBtn.disabled    = false;
    sbPushBtn.textContent = 'Save to Salesbuildr →';
  }
});

function showSbResult(ok, msg) {
  sbResult.textContent = msg;
  sbResult.className   = 'sb-result' + (ok ? '' : ' is-error');
  sbResult.hidden      = false;
}

// ── Individual widget cards ───────────────────────────────
function appendIndividualCard(widget) {
  const card = document.createElement('div');
  card.className = 'widget-card';

  const header = document.createElement('div');
  header.className = 'widget-card-header';
  const label = document.createElement('div'); label.className = 'widget-card-label';
  const num = document.createElement('span'); num.className = 'widget-num'; num.textContent = WIDGET_LABELS[widget.id] || widget.id;
  const title = document.createElement('span'); title.className = 'widget-card-title'; title.textContent = widget.title;
  label.appendChild(num); label.appendChild(title);

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button'; copyBtn.className = 'widget-copy-btn'; copyBtn.textContent = 'Copy HTML';
  copyBtn.addEventListener('click', () => copyHtml(widget.html, copyBtn));

  header.appendChild(label); header.appendChild(copyBtn);

  const tabs = document.createElement('div'); tabs.className = 'widget-tabs';
  const pt = document.createElement('button'); pt.type='button'; pt.className='widget-tab is-active'; pt.textContent='Preview';
  const ct = document.createElement('button'); ct.type='button'; ct.className='widget-tab'; ct.textContent='HTML Code';
  tabs.appendChild(pt); tabs.appendChild(ct);

  const iframe = document.createElement('iframe');
  iframe.className = 'widget-preview';
  iframe.setAttribute('sandbox','allow-same-origin');
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${widget.html}</body></html>`;

  const textarea = document.createElement('textarea');
  textarea.className = 'widget-code'; textarea.readOnly = true; textarea.spellcheck = false; textarea.value = widget.html;

  pt.addEventListener('click', () => { pt.classList.add('is-active'); ct.classList.remove('is-active'); iframe.style.display='block'; textarea.style.display='none'; });
  ct.addEventListener('click', () => { ct.classList.add('is-active'); pt.classList.remove('is-active'); iframe.style.display='none'; textarea.style.display='block'; });

  card.appendChild(header); card.appendChild(tabs); card.appendChild(iframe); card.appendChild(textarea);
  individualWidgets.appendChild(card);
}

function appendErrorCard(widgetId, message) {
  const card = document.createElement('div'); card.className='widget-card'; card.style.borderColor='var(--accent)';
  const header = document.createElement('div'); header.className='widget-card-header';
  const num = document.createElement('span'); num.className='widget-num'; num.textContent=WIDGET_LABELS[widgetId]||widgetId;
  const msg = document.createElement('span'); msg.className='widget-card-title'; msg.style.color='var(--accent)'; msg.textContent='Generation failed';
  const retryBtn = document.createElement('button'); retryBtn.type='button'; retryBtn.className='widget-copy-btn'; retryBtn.textContent='Retry';
  retryBtn.addEventListener('click', async () => {
    card.remove();
    const fields = getCurrentFields();
    try { const w = await fetchWidget(fields, widgetId); generatedWidgets.push(w); appendIndividualCard(w); showCombinedWidget(generatedWidgets); }
    catch (err) { appendErrorCard(widgetId, err.message); }
  });
  header.appendChild(num); header.appendChild(msg); header.appendChild(retryBtn);
  const detail = document.createElement('div'); detail.style.cssText='padding:12px 18px;font-family:"Inter","Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--accent);'; detail.textContent=message;
  card.appendChild(header); card.appendChild(detail);
  individualWidgets.appendChild(card);
}

function getCurrentFields() {
  return {
    solution: document.getElementById('f-solution').value.trim(),
    business: document.getElementById('f-business').value.trim(),
    size:     document.getElementById('f-size').value.trim(),
    trigger:  document.getElementById('f-trigger').value.trim(),
    outcomes: document.getElementById('f-outcomes').value.trim(),
    urgency:  document.getElementById('f-urgency').value.trim()
  };
}

async function copyHtml(html, btn) {
  try { await navigator.clipboard.writeText(html); }
  catch { const ta=document.createElement('textarea'); ta.value=html; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  btn.textContent='Copied!'; btn.classList.add('is-copied');
  setTimeout(() => { btn.textContent='Copy HTML'; btn.classList.remove('is-copied'); }, 2500);
}
