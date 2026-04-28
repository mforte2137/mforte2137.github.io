/* =========================================================
   Salesbuildr Widget Creator — sales.js
   Handles the form, sequential API calls to
   /api/sales-widgets, and widget card rendering.

   Flow:
     1. MSP fills in guided form fields
     2. Submit → validate → switch to working view
     3. 5 sequential POSTs to /api/sales-widgets (w1→w5)
     4. Each widget card appended as it arrives
     5. Switch to output view when all done (or as they arrive)
   ========================================================= */

const WIDGET_IDS = ['w1', 'w2', 'w3', 'w4', 'w5'];
const WIDGET_LABELS = {
  w1: 'W1 · Their Situation',
  w2: 'W2 · Why Now',
  w3: 'W3 · Why Trust Us',
  w4: 'W4 · What They Get',
  w5: 'W5 · The Investment'
};

// ── DOM handles ───────────────────────────────────────────
const formView      = document.getElementById('form-view');
const workingView   = document.getElementById('working-view');
const outputView    = document.getElementById('output-view');
const form          = document.getElementById('widget-form');
const submitBtn     = document.getElementById('submit-btn');
const workingTitle  = document.getElementById('working-title');
const workingSub    = document.getElementById('working-sub');
const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const widgetOutputs = document.getElementById('widget-outputs');
const outputTitle   = document.getElementById('output-title');
const restartBtn    = document.getElementById('restart-btn');
const restartBtn2   = document.getElementById('restart-btn-2');
const errorBanner   = document.getElementById('error-banner');
const errorDetail   = document.getElementById('error-detail');
const errorDismiss  = document.getElementById('error-dismiss');

// ── Character counter for solution textarea ───────────────
const solutionField = document.getElementById('f-solution');
const solutionCount = document.getElementById('solution-count');
solutionField.addEventListener('input', () => {
  solutionCount.textContent = solutionField.value.length;
});

// ── View switching ────────────────────────────────────────
function showView(name) {
  formView.hidden    = name !== 'form';
  workingView.hidden = name !== 'working';
  outputView.hidden  = name !== 'output';
}

// ── Error handling ────────────────────────────────────────
function showError(msg) {
  errorDetail.textContent = msg;
  errorBanner.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function hideError() { errorBanner.hidden = true; }

errorDismiss.addEventListener('click', () => {
  hideError();
  showView('form');
});

// ── Restart ───────────────────────────────────────────────
function restart() {
  hideError();
  form.reset();
  solutionCount.textContent = '0';
  widgetOutputs.innerHTML   = '';
  outputTitle.textContent   = '';
  setProgress(0);
  showView('form');
}
restartBtn.addEventListener('click',  restart);
restartBtn2.addEventListener('click', restart);

// ── Form validation ───────────────────────────────────────
function validateForm() {
  let valid = true;

  // Clear previous errors
  document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
  document.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));

  const solution = solutionField.value.trim();
  if (!solution) {
    markError(solutionField, 'Please describe what you are proposing.');
    valid = false;
  }

  const business = document.getElementById('f-business').value.trim();
  if (!business) {
    markError(document.getElementById('f-business'), 'Please describe the customer\'s business.');
    valid = false;
  }

  return valid;
}

function markError(field, message) {
  field.classList.add('is-error');
  const msg = document.createElement('p');
  msg.className   = 'field-error-msg';
  msg.textContent = message;
  field.parentElement.appendChild(msg);
  field.focus();
}

// ── Progress indicator ────────────────────────────────────
function setProgress(completed) {
  const pct = Math.round((completed / WIDGET_IDS.length) * 100);
  progressBar.style.width     = pct + '%';
  progressLabel.textContent   = `${completed} of ${WIDGET_IDS.length}`;
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

  // Build the output page title from the solution field (first sentence / 60 chars)
  const titleText = fields.solution.split(/[.!?\n]/)[0].trim();
  outputTitle.textContent = titleText.length > 60
    ? titleText.slice(0, 57) + '…'
    : titleText;

  submitBtn.disabled = true;
  widgetOutputs.innerHTML = '';
  setProgress(0);
  showView('working');

  // Add skeleton placeholder cards so the user sees what's coming
  WIDGET_IDS.forEach(id => appendSkeletonCard(id));

  let completedCount = 0;

  for (let i = 0; i < WIDGET_IDS.length; i++) {
    const id = WIDGET_IDS[i];

    workingTitle.textContent = `Generating widget ${i + 1} of 5…`;
    workingSub.textContent   = WIDGET_LABELS[id];

    try {
      const widget = await fetchWidget(fields, id);
      replaceSkeletonCard(id, widget);
    } catch (err) {
      replaceSkeletonWithError(id, err.message);
    }

    completedCount++;
    setProgress(completedCount);

    // Switch to output view as soon as first widget arrives
    if (completedCount === 1) {
      showView('output');
    }
  }

  workingTitle.textContent = 'All 5 widgets ready.';
  submitBtn.disabled = false;
});

// ── API call: one widget ──────────────────────────────────
async function fetchWidget(fields, widgetId) {
  let response;
  try {
    response = await fetch('/api/sales-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields, widgetId })
    });
  } catch (e) {
    throw new Error('Could not reach the widget generator. Check your connection.');
  }

  let data;
  try { data = await response.json(); }
  catch (e) { throw new Error('Unexpected response. Status ' + response.status); }

  if (!response.ok || !data.ok) {
    const detail = data && data.error ? data.error : 'HTTP ' + response.status;
    throw new Error(detail);
  }
  return data.widget;
}

// ── Skeleton card (placeholder while generating) ──────────
function appendSkeletonCard(widgetId) {
  const card = document.createElement('div');
  card.className   = 'widget-card widget-card-skeleton';
  card.id          = 'skeleton-' + widgetId;

  const header = document.createElement('div');
  header.className = 'widget-card-header';

  const label = document.createElement('div');
  label.className = 'widget-card-label';

  const num = document.createElement('span');
  num.className   = 'widget-num';
  num.textContent = WIDGET_LABELS[widgetId];

  const title = document.createElement('span');
  title.className   = 'widget-card-title';
  title.style.color = 'var(--mute)';
  title.textContent = 'Generating…';

  label.appendChild(num);
  label.appendChild(title);
  header.appendChild(label);
  card.appendChild(header);

  // Skeleton shimmer lines
  const body = document.createElement('div');
  body.className = 'widget-card-body is-open';
  body.style.padding = '20px 24px';
  [80, 60, 90, 50].forEach(w => {
    const line = document.createElement('div');
    line.className = 'skeleton-line';
    line.style.width = w + '%';
    body.appendChild(line);
  });
  card.appendChild(body);

  widgetOutputs.appendChild(card);
}

// ── Replace skeleton with real widget card ────────────────
function replaceSkeletonCard(widgetId, widget) {
  const skeleton = document.getElementById('skeleton-' + widgetId);
  const card     = buildWidgetCard(widgetId, widget);
  if (skeleton) {
    skeleton.replaceWith(card);
  } else {
    widgetOutputs.appendChild(card);
  }
  // Auto-open the first widget
  if (widgetId === 'w1') {
    card.querySelector('.widget-card-body').classList.add('is-open');
    card.querySelector('.widget-toggle').textContent = 'Collapse ▲';
  }
}

// ── Replace skeleton with error card ─────────────────────
function replaceSkeletonWithError(widgetId, message) {
  const skeleton = document.getElementById('skeleton-' + widgetId);
  const card     = buildErrorCard(widgetId, message);
  if (skeleton) {
    skeleton.replaceWith(card);
  } else {
    widgetOutputs.appendChild(card);
  }
}

// ── Build a real widget card ──────────────────────────────
function buildWidgetCard(widgetId, widget) {
  const card = document.createElement('div');
  card.className = 'widget-card';

  // Header (clickable to expand/collapse)
  const header = document.createElement('div');
  header.className = 'widget-card-header';

  const labelGroup = document.createElement('div');
  labelGroup.className = 'widget-card-label';

  const num = document.createElement('span');
  num.className   = 'widget-num';
  num.textContent = WIDGET_LABELS[widgetId];

  const title = document.createElement('span');
  title.className   = 'widget-card-title';
  title.textContent = widget.title;

  labelGroup.appendChild(num);
  labelGroup.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'widget-card-actions';

  const toggle = document.createElement('span');
  toggle.className   = 'widget-toggle';
  toggle.textContent = 'Expand ▼';

  const copyBtn = document.createElement('button');
  copyBtn.type      = 'button';
  copyBtn.className = 'widget-copy-btn';
  copyBtn.textContent = 'Copy HTML';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    copyWidgetHtml(widget.html, copyBtn);
  });

  actions.appendChild(toggle);
  actions.appendChild(copyBtn);
  header.appendChild(labelGroup);
  header.appendChild(actions);

  // Collapsible body
  const body = document.createElement('div');
  body.className = 'widget-card-body';

  // Tab strip
  const tabs = document.createElement('div');
  tabs.className = 'widget-tabs';

  const previewTab = document.createElement('button');
  previewTab.type      = 'button';
  previewTab.className = 'widget-tab is-active';
  previewTab.textContent = 'Preview';

  const codeTab = document.createElement('button');
  codeTab.type      = 'button';
  codeTab.className = 'widget-tab';
  codeTab.textContent = 'HTML Code';

  tabs.appendChild(previewTab);
  tabs.appendChild(codeTab);

  // Preview iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'widget-preview';
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{margin:0;padding:0;background:#fff;}</style>
    </head><body>${widget.html}</body></html>`;

  // Code textarea
  const textarea = document.createElement('textarea');
  textarea.className  = 'widget-code';
  textarea.readOnly   = true;
  textarea.spellcheck = false;
  textarea.value      = widget.html;

  // Tab switching
  previewTab.addEventListener('click', () => {
    previewTab.classList.add('is-active');
    codeTab.classList.remove('is-active');
    iframe.style.display   = 'block';
    textarea.style.display = 'none';
  });
  codeTab.addEventListener('click', () => {
    codeTab.classList.add('is-active');
    previewTab.classList.remove('is-active');
    iframe.style.display   = 'none';
    textarea.style.display = 'block';
  });

  body.appendChild(tabs);
  body.appendChild(iframe);
  body.appendChild(textarea);

  // Header click = expand/collapse
  header.addEventListener('click', () => {
    const isOpen = body.classList.toggle('is-open');
    toggle.textContent = isOpen ? 'Collapse ▲' : 'Expand ▼';
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

// ── Build an error card with retry ───────────────────────
function buildErrorCard(widgetId, message) {
  const card = document.createElement('div');
  card.className = 'widget-card';
  card.style.borderColor = 'var(--accent)';

  const header = document.createElement('div');
  header.className = 'widget-card-header';
  header.style.cursor = 'default';

  const labelGroup = document.createElement('div');
  labelGroup.className = 'widget-card-label';

  const num = document.createElement('span');
  num.className   = 'widget-num';
  num.textContent = WIDGET_LABELS[widgetId];

  const title = document.createElement('span');
  title.className   = 'widget-card-title';
  title.style.color = 'var(--accent)';
  title.textContent = 'Generation failed';

  labelGroup.appendChild(num);
  labelGroup.appendChild(title);

  const retryBtn = document.createElement('button');
  retryBtn.type      = 'button';
  retryBtn.className = 'widget-copy-btn';
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', async () => {
    const fields = getCurrentFields();
    card.remove();
    appendSkeletonCard(widgetId);
    try {
      const widget = await fetchWidget(fields, widgetId);
      replaceSkeletonCard(widgetId, widget);
    } catch (err) {
      replaceSkeletonWithError(widgetId, err.message);
    }
  });

  header.appendChild(labelGroup);
  header.appendChild(retryBtn);

  const detail = document.createElement('div');
  detail.style.cssText = 'padding:12px 20px;font-family:"Inter","Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--accent);';
  detail.textContent = message;

  card.appendChild(header);
  card.appendChild(detail);
  return card;
}

// ── Read current form values (used by retry) ──────────────
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

// ── Copy HTML to clipboard ────────────────────────────────
async function copyWidgetHtml(html, btn) {
  try {
    await navigator.clipboard.writeText(html);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = html;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  btn.textContent = 'Copied!';
  btn.classList.add('is-copied');
  setTimeout(() => {
    btn.textContent = 'Copy HTML';
    btn.classList.remove('is-copied');
  }, 2500);
}
