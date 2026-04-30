/* =========================================================
   Preflight — MSP Quote Quality Check
   preflight.js

   Flow:
   1. MSP enters credentials + Quote ID → Run Preflight
   2. Structural check (instant, no AI) — punch list appears
   3. Optional: drop quote PDF → content review runs (Claude)
   4. Re-check button re-runs structural check after fixes
   ========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const LS_API_KEY = 'sb_api_key';
const LS_INT_KEY = 'sb_int_key';

// ── DOM handles ───────────────────────────────────────────
const setupView     = document.getElementById('setup-view');
const workingView   = document.getElementById('working-view');
const resultsView   = document.getElementById('results-view');
const workingTitle  = document.getElementById('working-title');
const workingSub    = document.getElementById('working-sub');
const connectToggle = document.getElementById('connect-toggle');
const connectArrow  = document.getElementById('connect-arrow');
const connectBody   = document.getElementById('connect-body');
const apiKeyInput   = document.getElementById('api-key');
const intKeyInput   = document.getElementById('int-key');
const rememberKeys  = document.getElementById('remember-keys');
const quoteIdInput  = document.getElementById('quote-id');
const runBtn        = document.getElementById('run-btn');
const recheckBtn    = document.getElementById('recheck-btn');
const restartBtn    = document.getElementById('restart-btn');
const errorBanner   = document.getElementById('error-banner');
const errorDetail   = document.getElementById('error-detail');
const errorDismiss  = document.getElementById('error-dismiss');
const pdfDropzone   = document.getElementById('pdf-dropzone');
const pdfInput      = document.getElementById('pdf-input');

// Stored for re-check and content review
let lastQuoteId = '';

// ── View helpers ──────────────────────────────────────────
function showView(name) {
  setupView.hidden   = name !== 'setup';
  workingView.hidden = name !== 'working';
  resultsView.hidden = name !== 'results';
}
function showError(msg)  { errorDetail.textContent = msg; errorBanner.hidden = false; }
function hideError()     { errorBanner.hidden = true; }

// ── Connect section ───────────────────────────────────────
function initCredentials() {
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  if (savedApi) apiKeyInput.value = savedApi;
  if (savedInt) intKeyInput.value = savedInt;
  if (savedApi && savedInt) { rememberKeys.checked = true; connectBody.hidden = false; connectArrow.classList.add('is-open'); }
}

connectToggle.addEventListener('click', () => {
  const open = !connectBody.hidden;
  connectBody.hidden = open;
  connectArrow.classList.toggle('is-open', !open);
});

// ── Quote ID: accept full URL or bare ID ──────────────────
function parseQuoteId(input) {
  const trimmed = input.trim();
  // Match ID from URL: /quote/XXXXXXXXXXX
  const match = trimmed.match(/\/quote\/([A-Za-z0-9]+)/);
  if (match) return match[1];
  // Bare ID — alphanumeric, typically 20 chars
  if (/^[A-Za-z0-9]+$/.test(trimmed)) return trimmed;
  return null;
}

// ── Run / Re-check ────────────────────────────────────────
runBtn.addEventListener('click',     () => runCheck());
recheckBtn.addEventListener('click', () => runCheck(lastQuoteId));
quoteIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn.click(); });

async function runCheck(overrideId) {
  hideError();

  const apiKey = apiKeyInput.value.trim();
  const intKey = intKeyInput.value.trim();

  if (!apiKey || !intKey) {
    // Expand connect section if credentials missing
    connectBody.hidden = false;
    connectArrow.classList.add('is-open');
    apiKeyInput.focus();
    showError('Please enter your Salesbuildr API credentials first.');
    return;
  }

  const rawId  = overrideId || quoteIdInput.value.trim();
  const quoteId = parseQuoteId(rawId);
  if (!quoteId) {
    showError('Please enter a valid quote ID or Salesbuildr quote URL.');
    quoteIdInput.focus();
    return;
  }

  lastQuoteId = quoteId;

  // Save credentials if Remember checked
  if (rememberKeys.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  runBtn.disabled = true;
  workingTitle.textContent = 'Running Preflight…';
  workingSub.textContent   = 'Fetching quote from Salesbuildr — this is instant';
  showView('working');

  try {
    const res = await fetch('/api/preflight-check', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'structural', quoteId, apiKey, integrationKey: intKey })
    });

    let data;
    try { data = await res.json(); }
    catch (e) { throw new Error('Unexpected response from server.'); }

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    renderStructuralResults(data);
    showView('results');

  } catch (err) {
    showError(err.message || 'Unknown error');
    showView('setup');
  } finally {
    runBtn.disabled = false;
  }
}

// ── Render structural results ─────────────────────────────
function renderStructuralResults(data) {
  const { review, quote } = data;

  // Title and sub
  document.getElementById('results-title').textContent =
    quote.title || quote.id || lastQuoteId;
  document.getElementById('results-sub').textContent =
    [quote.company, quote.status ? `Status: ${quote.status}` : '', `${review.itemCount} line item${review.itemCount !== 1 ? 's' : ''}`]
      .filter(Boolean).join('  ·  ');

  // Verdict banner
  const banner = document.getElementById('verdict-banner');
  const verdictLabels = { 'not-ready': '✗  Not ready to send', warnings: '!  Ready with warnings', ready: '✓  Ready to send' };
  const verdictClasses = { 'not-ready': 'is-critical', warnings: 'is-warning', ready: 'is-ready' };
  banner.className = `verdict-banner ${verdictClasses[review.verdict]}`;
  banner.innerHTML = `
    <span class="verdict-label">${verdictLabels[review.verdict]}</span>
    <span class="verdict-counts">
      ${review.critical.length > 0 ? `<span class="count-critical">${review.critical.length} critical</span>` : ''}
      ${review.warnings.length > 0 ? `<span class="count-warning">${review.warnings.length} warning${review.warnings.length !== 1 ? 's' : ''}</span>` : ''}
      <span class="count-passed">${review.passed.length} passed</span>
    </span>`;

  // Critical items
  const critSec  = document.getElementById('critical-section');
  const critList = document.getElementById('critical-list');
  if (review.critical.length > 0) {
    critSec.hidden = false;
    document.getElementById('critical-count').textContent = review.critical.length;
    critList.innerHTML = review.critical.map(c => `
      <div class="result-item">
        <div class="result-item-name">${escHtml(c.item)}</div>
        <div class="result-item-issue">${escHtml(c.issue)}</div>
        <div class="result-item-fix">→ ${escHtml(c.fix)}</div>
      </div>`).join('');
  } else {
    critSec.hidden = true;
  }

  // Warning items
  const warnSec  = document.getElementById('warnings-section');
  const warnList = document.getElementById('warnings-list');
  if (review.warnings.length > 0) {
    warnSec.hidden = false;
    document.getElementById('warnings-count').textContent = review.warnings.length;
    warnList.innerHTML = review.warnings.map(w => `
      <div class="result-item">
        <div class="result-item-name">${escHtml(w.item)}</div>
        <div class="result-item-issue">${escHtml(w.issue)}</div>
        <div class="result-item-fix">→ ${escHtml(w.fix)}</div>
      </div>`).join('');
  } else {
    warnSec.hidden = true;
  }

  // Passed items (collapsed by default)
  const passedSec  = document.getElementById('passed-section');
  const passedList = document.getElementById('passed-list');
  if (review.passed.length > 0) {
    passedSec.hidden = false;
    document.getElementById('passed-count').textContent = review.passed.length;
    passedList.innerHTML = review.passed.map(p => `<div class="result-item-passed">${escHtml(p)}</div>`).join('');
  } else {
    passedSec.hidden = true;
  }

  // Reset content review area
  document.getElementById('content-results').hidden = true;
  document.getElementById('content-working').hidden = true;
}

// ── Collapsible sections ──────────────────────────────────
document.getElementById('warnings-toggle').addEventListener('click', () => toggleSection('warnings-list', 'warnings-toggle'));
document.getElementById('passed-toggle').addEventListener('click',   () => toggleSection('passed-list', 'passed-toggle'));

function toggleSection(listId, headerId) {
  const list    = document.getElementById(listId);
  const chevron = document.querySelector(`#${headerId} .section-chevron`);
  const isOpen  = !list.classList.contains('section-body-collapsed');
  list.classList.toggle('section-body-collapsed', isOpen);
  if (chevron) chevron.classList.toggle('is-open', !isOpen);
}

// ── Restart ───────────────────────────────────────────────
restartBtn.addEventListener('click', () => {
  hideError();
  lastQuoteId = '';
  quoteIdInput.value = '';
  showView('setup');
});
errorDismiss.addEventListener('click', () => { hideError(); showView('setup'); });

// ── PDF dropzone ──────────────────────────────────────────
pdfDropzone.addEventListener('click', (e) => {
  if (e.target.tagName !== 'LABEL') pdfInput.click();
});
pdfDropzone.addEventListener('dragover', e => { e.preventDefault(); pdfDropzone.classList.add('is-dragover'); });
['dragleave','drop'].forEach(t => pdfDropzone.addEventListener(t, e => { e.preventDefault(); pdfDropzone.classList.remove('is-dragover'); }));
pdfDropzone.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith('.pdf')) {
    showPdfSelected(file.name);
    handlePdf(file);
  } else {
    showError('Please drop a PDF file.');
  }
});
pdfInput.addEventListener('change', () => {
  if (pdfInput.files[0]) {
    showPdfSelected(pdfInput.files[0].name);
    handlePdf(pdfInput.files[0]);
  }
  pdfInput.value = '';
});

function showPdfSelected(filename) {
  pdfDropzone.innerHTML = `
    <div class="pdf-dz-inner">
      <div class="pdf-dz-icon">✅</div>
      <div class="pdf-dz-title">${escHtml(filename)}</div>
      <div class="pdf-dz-sub">Extracting text and running content review…</div>
    </div>`;
  pdfDropzone.style.borderStyle  = 'solid';
  pdfDropzone.style.borderColor  = 'var(--good)';
  pdfDropzone.style.background   = 'var(--good-soft)';
  pdfDropzone.style.cursor       = 'default';
}

// ── Handle PDF upload → content review ───────────────────
async function handlePdf(file) {
  hideError();
  const contentWorking = document.getElementById('content-working');
  const contentResults = document.getElementById('content-results');
  contentWorking.hidden = false;
  contentResults.hidden = true;

  try {
    // Extract text from PDF (client-side, same as evaluator)
    const arrayBuffer = await file.arrayBuffer();
    const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText      = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page        = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      let   pageText    = '';
      let   lastY       = null;
      for (const item of textContent.items) {
        if (!item.str) continue;
        const y = item.transform ? item.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) pageText += '\n';
        pageText += item.str + ' ';
        lastY = y;
      }
      fullText += '\n\n' + pageText.trim();
    }

    const normalized = fullText.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();

    if (normalized.length < 200) {
      throw new Error('Not enough text could be extracted from this PDF. It may be image-only or scanned.');
    }

    // Send to content review
    const apiKey = apiKeyInput.value.trim();
    const intKey = intKeyInput.value.trim();

    const res = await fetch('/api/preflight-check', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'content', quoteId: lastQuoteId, apiKey, integrationKey: intKey, quoteText: normalized })
    });

    let data;
    try { data = await res.json(); }
    catch (e) { throw new Error('Unexpected response from content review.'); }

    if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

    renderContentResults(data.review);
    contentResults.hidden = false;

  } catch (err) {
    showError(err.message || 'Content review failed.');
    // Reset dropzone so they can try again
    pdfDropzone.innerHTML = `
      <div class="pdf-dz-inner">
        <div class="pdf-dz-icon">📄</div>
        <div class="pdf-dz-title">Drop your quote PDF here</div>
        <div class="pdf-dz-sub">or <label for="pdf-input" class="pdf-browse">browse your files</label></div>
      </div>`;
    pdfDropzone.style.borderStyle = 'dashed';
    pdfDropzone.style.borderColor = '';
    pdfDropzone.style.background  = '';
    pdfDropzone.style.cursor      = 'pointer';
  } finally {
    contentWorking.hidden = true;
  }
}

// ── Render content review results ─────────────────────────
function renderContentResults(review) {
  // Overall summary
  document.getElementById('cr-summary').textContent = review.overall || '';

  // Alignment
  renderContentSection('cr-alignment', 'cr-alignment-count', 'cr-alignment-list',
    review.alignment || [],
    item => `<div class="result-item">
      <div class="result-item-name">${escHtml(item.issue)}</div>
      <div class="result-item-issue">${escHtml(item.detail)}</div>
      <div class="result-item-fix">→ ${escHtml(item.fix)}</div>
    </div>`
  );

  // Jargon
  renderContentSection('cr-jargon', 'cr-jargon-count', 'cr-jargon-list',
    review.jargon || [],
    item => `<div class="result-item">
      <div class="result-item-name">${escHtml(item.term)}</div>
      <div class="result-item-issue">${escHtml(item.context)}</div>
      <div class="result-item-fix">→ ${escHtml(item.suggestion)}</div>
    </div>`
  );

  // Language issues
  const langLabels = { 'inside-out': 'Inside-out language', 'wishy-washy': 'Weak phrasing', placeholder: 'Placeholder text', other: 'Language issue' };
  renderContentSection('cr-language', 'cr-language-count', 'cr-language-list',
    review.language || [],
    item => `<div class="result-item">
      <div class="result-item-name">${escHtml(langLabels[item.type] || item.type)}</div>
      <div class="result-item-issue">"${escHtml(item.excerpt)}"</div>
      <div class="result-item-fix">→ ${escHtml(item.fix)}</div>
    </div>`
  );

  // Rewrites
  const rewriteSec  = document.getElementById('cr-rewrites');
  const rewriteList = document.getElementById('cr-rewrites-list');
  const rewrites    = review.rewrites || [];
  if (rewrites.length > 0) {
    rewriteSec.hidden = false;
    document.getElementById('cr-rewrites-count').textContent = rewrites.length;
    rewriteList.innerHTML = rewrites.map(r => `
      <div class="rewrite-item">
        <div class="rewrite-section-name">${escHtml(r.section)}</div>
        <div class="rewrite-block">
          <div class="rewrite-tag before">Original</div>
          <div class="rewrite-text-before">${escHtml(r.original)}</div>
        </div>
        <div class="rewrite-block">
          <div class="rewrite-tag after">Suggested</div>
          <div class="rewrite-text-after" id="rewrite-${rewrites.indexOf(r)}">${escHtml(r.suggested)}</div>
        </div>
        <div class="rewrite-reason">${escHtml(r.reason)}</div>
        <button type="button" class="copy-rewrite-btn" data-text="${escAttr(r.suggested)}">Copy rewrite</button>
      </div>`).join('');

    // Wire up copy buttons
    rewriteList.querySelectorAll('.copy-rewrite-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.text;
        try { await navigator.clipboard.writeText(text); }
        catch { const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        setTimeout(() => { btn.textContent = 'Copy rewrite'; btn.classList.remove('is-copied'); }, 2500);
      });
    });
  } else {
    rewriteSec.hidden = true;
  }
}

function renderContentSection(sectionId, countId, listId, items, renderFn) {
  const section = document.getElementById(sectionId);
  const list    = document.getElementById(listId);
  if (items.length > 0) {
    section.hidden = false;
    document.getElementById(countId).textContent = items.length;
    list.innerHTML = items.map(renderFn).join('');
  } else {
    section.hidden = true;
  }
}

// ── Utilities ─────────────────────────────────────────────
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Init ──────────────────────────────────────────────────
initCredentials();
