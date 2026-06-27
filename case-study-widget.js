/* =====================================================
   case-study-widget.js  —  Frontend logic
   ===================================================== */

// --- State ---
let currentThemeHex = '#0f1f3d';
let isAnonymised = true;
let generatedData = null;
let widgetHtml = '';

// --- DOM refs ---
const generateBtn    = document.getElementById('generateBtn');
const regenerateBtn  = document.getElementById('regenerateBtn');
const emptyState     = document.getElementById('emptyState');
const loadingState   = document.getElementById('loadingState');
const widgetPreview  = document.getElementById('widgetPreview');
const widgetFrame    = document.getElementById('widgetFrame');
const previewActions = document.getElementById('previewActions');
const copyBtn        = document.getElementById('copyBtn');
const pushBtn        = document.getElementById('pushBtn');
const anonymiseToggle = document.getElementById('anonymiseToggle');
const sbCredsPanel   = document.getElementById('sbCredsPanel');
const pushFeedback   = document.getElementById('pushFeedback');

// --- Colour theme ---
document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    currentThemeHex = swatch.dataset.hex;
    document.getElementById('customHex').value = currentThemeHex.replace('#', '');
    if (generatedData) applyThemeToFrame();
  });
});

const customHexInput = document.getElementById('customHex');
customHexInput.addEventListener('input', () => {
  const val = customHexInput.value.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(val)) {
    currentThemeHex = '#' + val;
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    if (generatedData) applyThemeToFrame();
  }
});

// --- Anonymise toggle ---
anonymiseToggle.addEventListener('click', () => {
  isAnonymised = !isAnonymised;
  anonymiseToggle.dataset.state = isAnonymised ? 'on' : 'off';
  anonymiseToggle.setAttribute('aria-checked', isAnonymised);

  if (generatedData) {
    showRegenNotice();
  }
});

function showRegenNotice() {
  // Remove existing notice if any
  document.querySelectorAll('.regen-notice').forEach(el => el.remove());

  const notice = document.createElement('div');
  notice.className = 'regen-notice';
  notice.textContent = 'Switching between anonymised and named requires regenerating the widget.';
  widgetPreview.insertBefore(notice, widgetFrame);
}

// --- Collect form data ---
function getFormData() {
  return {
    companyName:    document.getElementById('companyName').value.trim(),
    industry:       document.getElementById('industry').value,
    companySize:    document.getElementById('companySize').value.trim(),
    location:       document.getElementById('location').value.trim(),
    engagementType: document.getElementById('engagementType').value.trim(),
    challenge:      document.getElementById('challenge').value.trim(),
    solution:       document.getElementById('solution').value.trim(),
    outcome:        document.getElementById('outcome').value.trim(),
    clientQuote:    document.getElementById('clientQuote').value.trim(),
    anonymise:      isAnonymised,
  };
}

function validateForm(data) {
  const required = ['industry', 'companySize', 'challenge', 'solution', 'outcome', 'engagementType'];
  for (const field of required) {
    if (!data[field]) return `Please fill in the "${fieldLabel(field)}" field.`;
  }
  if (!data.anonymise && !data.companyName) {
    return 'Please enter a company name, or switch to Anonymise mode.';
  }
  return null;
}

function fieldLabel(key) {
  const labels = {
    industry: 'Industry',
    companySize: 'Company Size',
    challenge: 'The Challenge',
    solution: 'What You Did',
    outcome: 'The Outcome',
    engagementType: 'Engagement Type',
  };
  return labels[key] || key;
}

// --- Generate ---
async function generate() {
  const data = getFormData();
  const err = validateForm(data);
  if (err) { alert(err); return; }

  // Remove any regen notice
  document.querySelectorAll('.regen-notice').forEach(el => el.remove());

  // UI: loading
  emptyState.hidden = true;
  widgetPreview.hidden = true;
  previewActions.hidden = true;
  loadingState.hidden = false;
  generateBtn.disabled = true;
  regenerateBtn.disabled = true;

  try {
    const res = await fetch('/api/case-study-widget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!json.ok) {
      throw new Error(json.error || 'Generation failed.');
    }

    generatedData = json.caseStudy;
    renderWidget(generatedData);

  } catch (e) {
    loadingState.hidden = true;
    emptyState.hidden = false;
    alert('Error: ' + (e.message || 'Something went wrong. Please try again.'));
  } finally {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
  }
}

generateBtn.addEventListener('click', generate);
regenerateBtn.addEventListener('click', generate);

// --- Render the widget preview ---
function renderWidget(data) {
  loadingState.hidden = true;

  widgetHtml = buildWidgetHtml(data, currentThemeHex);
  widgetFrame.innerHTML = widgetHtml;
  makeEditable(widgetFrame, data);

  widgetPreview.hidden = false;
  previewActions.hidden = false;
  regenerateBtn.hidden = false;
}

// --- Apply new theme colour without regenerating ---
function applyThemeToFrame() {
  if (!generatedData) return;
  widgetHtml = buildWidgetHtml(generatedData, currentThemeHex);
  widgetFrame.innerHTML = widgetHtml;
  makeEditable(widgetFrame, generatedData);
}

// --- Build the TinyMCE-safe widget HTML ---
function buildWidgetHtml(data, hex) {
  const hasQuote = data.quote && data.quote.trim();

  const sectionLabel = (text) =>
    `<h6 style="margin:0 0 8px 0; padding-left:10px; border-left:3px solid ${hex}; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#4B5563;">${text}</h6>`;

  const bodyText = (content, id) =>
    `<p data-editable-id="${id}" style="margin:0; font-size:13px; color:#4B5563; line-height:1.65;">${content}</p>`;

  const quoteBlock = hasQuote ? `
    <div style="border-top:1px solid #E5E7EB; padding:20px 24px 24px; background:#FAFAF7;">
      <p data-editable-id="quote" style="margin:0 0 8px 0; font-size:14px; color:#0B0E14; font-style:italic; line-height:1.6;">&ldquo;${escapeHtml(data.quote)}&rdquo;</p>
      <p style="margin:0; font-size:11px; font-weight:700; color:${hex}; font-family:'JetBrains Mono',monospace; letter-spacing:0.06em;">— ${escapeHtml(data.client)}</p>
    </div>` : '';

  return `<div style="font-family:'Inter',sans-serif; background:#FFFFFF; border:1px solid #E5E7EB; width:100%; max-width:100%;">

  <div style="padding:20px 24px 16px; border-bottom:1px solid #E5E7EB; background:#FFFFFF;">
    <div style="margin-bottom:10px;">
      <span style="display:inline-block; background:${hex}; color:#FFFFFF; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 10px; border-radius:20px; margin-right:8px;">CASE STUDY</span>
      <span data-editable-id="engagement" style="display:inline-block; background:#F5F5F2; color:#4B5563; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:20px;">${escapeHtml(data.engagement)}</span>
    </div>
    <h5 data-editable-id="headline" style="margin:0 0 6px 0; font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:700; color:${hex}; line-height:1.2; letter-spacing:-0.02em;">${escapeHtml(data.headline)}</h5>
    <p style="margin:0; font-size:11px; color:#9CA3AF; font-family:'JetBrains Mono',monospace; letter-spacing:0.04em;">${escapeHtml(data.client)}</p>
  </div>

  <div style="padding:20px 24px;">
    <div style="margin-bottom:18px;">
      ${sectionLabel('The Challenge')}
      ${bodyText(escapeHtml(data.challenge), 'challenge')}
    </div>
    <div style="margin-bottom:18px;">
      ${sectionLabel('What We Did')}
      ${bodyText(escapeHtml(data.solution), 'solution')}
    </div>
    <div>
      ${sectionLabel('The Outcome')}
      ${bodyText(escapeHtml(data.outcome), 'outcome')}
    </div>
  </div>

  ${quoteBlock}
</div>`;
}

// --- Make sections editable ---
function makeEditable(frame, data) {
  const editableIds = ['headline', 'challenge', 'solution', 'outcome', 'quote', 'engagement'];

  editableIds.forEach(id => {
    const el = frame.querySelector(`[data-editable-id="${id}"]`);
    if (!el) return;

    el.setAttribute('contenteditable', 'true');
    el.title = 'Click to edit';

    el.addEventListener('input', () => {
      // Update generatedData so colour changes don't overwrite edits
      if (generatedData) generatedData[id === 'engagement' ? 'engagement' : id] = el.textContent;
      // Rebuild widgetHtml from the live DOM
      widgetHtml = getWidgetHtmlFromFrame(frame);
    });
  });
}

// Capture the current live widget HTML (with edits applied)
function getWidgetHtmlFromFrame(frame) {
  // Strip contenteditable attributes for clean export
  const clone = frame.cloneNode(true);
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('title');
  });
  return clone.innerHTML;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// --- Widget title ---
function getWidgetTitle() {
  const industry = document.getElementById('industry').value || 'Unknown';
  const engagement = document.getElementById('engagementType').value || 'Managed Services';
  return `Case Study — ${industry} — ${engagement}`;
}

// --- Copy HTML ---
copyBtn.addEventListener('click', () => {
  const html = getWidgetHtmlFromFrame(widgetFrame);
  navigator.clipboard.writeText(html).then(() => {
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => { copyBtn.textContent = 'Copy HTML'; }, 2000);
  }).catch(() => {
    alert('Could not copy to clipboard. Try again.');
  });
});

// --- Push to Salesbuildr ---
pushBtn.addEventListener('click', () => {
  const apiKey = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');

  if (!apiKey || !tenantUrl) {
    sbCredsPanel.hidden = false;
    sbCredsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  doPush(apiKey, tenantUrl);
});

document.getElementById('saveCredsBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('sbApiKey').value.trim();
  const tenantUrl = document.getElementById('sbTenantUrl').value.trim();

  if (!apiKey || !tenantUrl) {
    alert('Please enter both your API key and tenant URL.');
    return;
  }

  localStorage.setItem('sb_api_key', apiKey);
  localStorage.setItem('sb_tenant_url', tenantUrl);
  sbCredsPanel.hidden = true;

  doPush(apiKey, tenantUrl);
});

document.getElementById('cancelCredsBtn').addEventListener('click', () => {
  sbCredsPanel.hidden = true;
});

async function doPush(apiKey, tenantUrl) {
  pushFeedback.hidden = true;
  pushFeedback.className = 'push-feedback';
  pushBtn.disabled = true;
  pushBtn.textContent = 'Pushing…';

  const html = getWidgetHtmlFromFrame(widgetFrame);
  const title = getWidgetTitle();

  try {
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widgets: [{ type: 'html', content: html, title }],
        prefix: title,
        apiKey,
        tenantUrl,
      }),
    });

    const data = await res.json();

    if (data.ok || (data.successCount && data.successCount > 0)) {
      showFeedback('success', '✓ Widget pushed to Salesbuildr successfully.');
    } else {
      showFeedback('error', 'Push failed: ' + (data.error || 'Unknown error. Check your credentials.'));
    }
  } catch (e) {
    showFeedback('error', 'Push failed: ' + (e.message || 'Network error.'));
  } finally {
    pushBtn.disabled = false;
    pushBtn.textContent = 'Push to Salesbuildr';
  }
}

function showFeedback(type, msg) {
  pushFeedback.hidden = false;
  pushFeedback.className = 'push-feedback ' + type;
  pushFeedback.textContent = msg;
  pushFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- Pre-fill creds from localStorage if present ---
(function prefillCreds() {
  const apiKey = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');
  if (apiKey) document.getElementById('sbApiKey').value = apiKey;
  if (tenantUrl) document.getElementById('sbTenantUrl').value = tenantUrl;
})();
