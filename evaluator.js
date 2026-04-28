/* =========================================================
   Proposal Evaluator — Buyer Decision Journey Report
   evaluator.js — full file including Salesbuildr widget
   generator (Section 05 of the report).

   Flow:
     1. User drops/picks a PDF or .docx
     2. Text extracted in browser (PDF.js / mammoth)
     3. POST to /api/analyze → Claude Haiku → report JSON
     4. Report rendered into DOM
     5. User clicks "Generate My 5 Widgets"
     6. 5 sequential POSTs to /api/generate-widgets,
        one per widget (w1→w5). Each returns one HTML
        block. Widget card appended as each arrives.
   ========================================================= */

// ── PDF.js setup ─────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── Module-level state ───────────────────────────────────
// Retained after analysis so the widget generator can use
// them without re-uploading the document.
let lastAnalysis    = null;
let lastTextExcerpt = '';

// ── DOM handles ──────────────────────────────────────────
const uploadView    = document.getElementById('upload-view');
const parsingView   = document.getElementById('parsing-view');
const reportView    = document.getElementById('report-view');
const dropzone      = document.getElementById('dropzone');
const fileInput     = document.getElementById('file-input');
const browseBtn     = document.getElementById('browse-btn');
const parsingTitle  = document.getElementById('parsing-title');
const parsingDetail = document.getElementById('parsing-detail');
const restartBtn    = document.getElementById('restart-btn');
const downloadBtn   = document.getElementById('download-btn');
const errorBanner   = document.getElementById('error-banner');
const errorDetail   = document.getElementById('error-detail');
const errorDismiss  = document.getElementById('error-dismiss');

// Report fields
const rptFilename     = document.getElementById('rpt-filename');
const rptPages        = document.getElementById('rpt-pages');
const rptDate         = document.getElementById('rpt-date');
const rptHeadline     = document.getElementById('rpt-headline');
const rptSubtitle     = document.getElementById('rpt-subtitle');
const rptWidgets      = document.getElementById('rpt-widgets');
const rptSequenceNote = document.getElementById('rpt-sequence-note');
const rptFears        = document.getElementById('rpt-fears');
const rptQuotes       = document.getElementById('rpt-quotes');
const rptBefore       = document.getElementById('rpt-before');
const rptAfter        = document.getElementById('rpt-after');

// Widget generator elements
const widgetSection    = document.getElementById('widget-section');
const widgetCta        = document.getElementById('widget-cta');
const widgetWorking    = document.getElementById('widget-working');
const widgetWorkingMsg = document.getElementById('widget-working-msg');
const widgetOutputs    = document.getElementById('widget-outputs');
const generateBtn      = document.getElementById('generate-btn');

// ── View switching ────────────────────────────────────────
function showView(name) {
  uploadView.hidden  = name !== 'upload';
  parsingView.hidden = name !== 'parsing';
  reportView.hidden  = name !== 'report';
}
function setWorking(title, detail) {
  parsingTitle.textContent  = title;
  parsingDetail.textContent = detail;
}
function showError(message) {
  errorDetail.textContent = message;
  errorBanner.hidden = false;
}
function hideError() { errorBanner.hidden = true; }

// ── Event wiring ──────────────────────────────────────────
dropzone.addEventListener('click', (e) => {
  if (e.target === browseBtn) return;
  fileInput.click();
});
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
  fileInput.value = '';
});
['dragenter', 'dragover'].forEach(type => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.add('is-dragover');
  });
});
['dragleave', 'drop'].forEach(type => {
  dropzone.addEventListener(type, (e) => {
    e.preventDefault();
    dropzone.classList.remove('is-dragover');
  });
});
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
restartBtn.addEventListener('click', () => {
  hideError();
  resetWidgetSection();
  showView('upload');
});
errorDismiss.addEventListener('click', () => {
  hideError();
  showView('upload');
});
downloadBtn.addEventListener('click', () => window.print());
generateBtn.addEventListener('click', generateWidgets);

// ── File handling ─────────────────────────────────────────
async function handleFile(file) {
  hideError();
  const lower  = file.name.toLowerCase();
  const isPdf  = lower.endsWith('.pdf');
  const isDocx = lower.endsWith('.docx');
  if (!isPdf && !isDocx) {
    showError('Please upload a PDF or Word (.docx) file.');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showError('That file is larger than 25 MB. Large files may be scans; try a text-based export.');
    return;
  }

  showView('parsing');
  setWorking('Reading the proposal…', 'Extracting text from ' + file.name);

  try {
    let fullText, pages;

    if (isPdf) {
      const result = await extractTextFromPdf(file, (pageNum, total) => {
        setWorking('Reading the proposal…', 'Reading page ' + pageNum + ' of ' + total + '…');
      });
      fullText = result.fullText;
      pages    = result.pageCount;
    } else {
      setWorking('Reading the proposal…', 'Extracting text from Word document…');
      fullText = await extractTextFromDocx(file);
      const wordCount = (fullText.match(/\S+/g) || []).length;
      pages = Math.max(1, Math.round(wordCount / 350));
    }

    const normalized = normalizeText(fullText);
    if (normalized.length < 200) {
      const hint = isPdf
        ? 'This PDF may be image-only (a scan) and would need OCR before we can analyze it.'
        : 'This Word doc came back nearly empty. If the content is in embedded images or text boxes, try exporting as PDF first.';
      showError('Only ' + normalized.length + ' characters were extracted. ' + hint);
      showView('upload');
      return;
    }

    // Store excerpt for widget generation (no need to re-upload)
    lastTextExcerpt = normalized.slice(0, 1500);

    setWorking('Analyzing against the framework…', 'Claude is reading it through your buyer\'s eyes. Usually 5–10 seconds.');

    const analysis = await runAnalysis({ text: normalized, filename: file.name, pages });

    // Store analysis for widget generation
    lastAnalysis = analysis;

    renderReport(analysis, { filename: file.name, pages });
    showView('report');

    // Reveal the widget generator section
    widgetSection.hidden = false;

  } catch (err) {
    console.error(err);
    showError(err.message || 'Unknown error');
    showView('upload');
  }
}

// ── Text extraction: PDF ──────────────────────────────────
async function extractTextFromPdf(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount   = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    if (onProgress) onProgress(i, pageCount);
    const page        = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = '';
    let lastY    = null;

    for (const item of textContent.items) {
      if (!item.str) continue;
      const y = item.transform ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        pageText += '\n';
      }
      pageText += item.str + ' ';
      lastY = y;
    }
    fullText += '\n\n--- Page ' + i + ' ---\n' + pageText.trim();
  }
  return { fullText: fullText.trim(), pageCount };
}

// ── Text extraction: DOCX ─────────────────────────────────
async function extractTextFromDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result      = await mammoth.extractRawText({ arrayBuffer });
  return (result && result.value ? result.value : '').trim();
}

function normalizeText(s) {
  return s
    .replace(/[ \t]+/g,  ' ')
    .replace(/ *\n */g,  '\n')
    .replace(/\n{3,}/g,  '\n\n')
    .trim();
}

// ── API: analyze ──────────────────────────────────────────
async function runAnalysis({ text, filename, pages }) {
  let response;
  try {
    response = await fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, filename, pages })
    });
  } catch (e) {
    throw new Error('Could not reach the analyzer. Check your connection and try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('The analyzer returned an unexpected response. Status ' + response.status);
  }

  if (!response.ok || !data.ok) {
    const detail = data && data.error   ? data.error                     : 'HTTP ' + response.status;
    const more   = data && data.details ? ' (' + data.details.slice(0, 200) + ')' : '';
    throw new Error('Analysis failed: ' + detail + more);
  }
  if (!data.analysis) {
    throw new Error('The analyzer returned no analysis. Please try again.');
  }
  return data.analysis;
}

// ── Report rendering ──────────────────────────────────────
function renderReport(a, meta) {
  rptFilename.textContent = meta.filename;
  rptPages.textContent    = meta.pages;
  rptDate.textContent     = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  rptHeadline.textContent = a.verdict.headline;
  rptSubtitle.textContent = a.verdict.subtitle;

  // Widget sequence (W1-W5 status)
  rptWidgets.innerHTML = '';
  a.widgetSequence.forEach(w => {
    const div = document.createElement('div');
    div.className = 'widget ' + w.status;
    const num = document.createElement('span');
    num.className   = 'w-num';
    num.textContent = 'W' + w.num;
    div.appendChild(num);
    div.appendChild(document.createTextNode(w.detail));
    rptWidgets.appendChild(div);
  });
  rptSequenceNote.textContent = a.sequenceNote;

  // 2am fears
  rptFears.innerHTML = '';
  a.fears.forEach(f => {
    const li      = document.createElement('li');
    const mark    = document.createElement('span');
    mark.className   = 'mark';
    mark.textContent = '—';
    const fearDiv = document.createElement('div');
    fearDiv.className = 'fear';
    fearDiv.appendChild(document.createTextNode(f.fear));
    const small = document.createElement('small');
    small.textContent = f.proposalGap;
    fearDiv.appendChild(small);
    li.appendChild(mark);
    li.appendChild(fearDiv);
    rptFears.appendChild(li);
  });

  // Inside-out quotes
  rptQuotes.innerHTML = '';
  a.insideOutQuotes.forEach(q => {
    const block = document.createElement('div');
    block.className = 'quote-block';
    const their  = document.createElement('p');
    their.className   = 'their';
    their.textContent = q.their;
    const arrow  = document.createElement('p');
    arrow.className   = 'arrow';
    arrow.textContent = 'Outside-in rewrite';
    const ours   = document.createElement('p');
    ours.className   = 'ours';
    ours.textContent = q.ours;
    block.appendChild(their);
    block.appendChild(arrow);
    block.appendChild(ours);
    rptQuotes.appendChild(block);
  });

  rptBefore.textContent = a.openingRewrite.before;
  rptAfter.textContent  = a.openingRewrite.after;
}

// ══════════════════════════════════════════════════════════
//  SALESBUILDR WIDGET GENERATOR
// ══════════════════════════════════════════════════════════

const WIDGET_IDS    = ['w1', 'w2', 'w3', 'w4', 'w5'];
const WIDGET_LABELS = {
  w1: 'W1 · Their Situation',
  w2: 'W2 · Why Care Now',
  w3: 'W3 · Why Trust Us',
  w4: 'W4 · What They Get',
  w5: 'W5 · Is It Worth It'
};

// Entry point — called when "Generate My 5 Widgets" is clicked
async function generateWidgets() {
  if (!lastAnalysis) return;

  generateBtn.disabled = true;
  widgetCta.hidden     = true;
  widgetOutputs.innerHTML = '';
  widgetWorking.hidden = false;

  for (let i = 0; i < WIDGET_IDS.length; i++) {
    const id = WIDGET_IDS[i];
    widgetWorkingMsg.textContent = `Generating widget ${i + 1} of 5 — ${WIDGET_LABELS[id]}…`;

    try {
      const widget = await fetchWidget(id);
      appendWidgetCard(widget);
    } catch (err) {
      // Surface per-widget errors without aborting the rest
      appendWidgetError(id, err.message);
    }
  }

  widgetWorking.hidden = true;
}

// One API call for one widget
async function fetchWidget(widgetId) {
  let response;
  try {
    response = await fetch('/api/generate-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        analysis:    lastAnalysis,
        textExcerpt: lastTextExcerpt,
        widgetId
      })
    });
  } catch (e) {
    throw new Error('Could not reach the widget generator. Check your connection.');
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Unexpected response from widget generator. Status ' + response.status);
  }

  if (!response.ok || !data.ok) {
    const detail = data && data.error ? data.error : 'HTTP ' + response.status;
    throw new Error('Widget generation failed: ' + detail);
  }
  return data.widget;
}

// Build and append a widget card to the output area
function appendWidgetCard(widget) {
  const card = document.createElement('div');
  card.className = 'widget-card';

  // ── Header row ──
  const header = document.createElement('div');
  header.className = 'widget-card-header';

  const labelGroup = document.createElement('div');
  labelGroup.className = 'widget-card-label';

  const badge = document.createElement('span');
  badge.className   = 'widget-badge';
  badge.textContent = WIDGET_LABELS[widget.id] || widget.id.toUpperCase();

  const title = document.createElement('span');
  title.className   = 'widget-card-title';
  title.textContent = widget.title;

  labelGroup.appendChild(badge);
  labelGroup.appendChild(title);

  const copyBtn = document.createElement('button');
  copyBtn.type      = 'button';
  copyBtn.className = 'widget-copy-btn';
  copyBtn.textContent = 'Copy HTML';
  copyBtn.addEventListener('click', () => copyWidgetHtml(widget.html, copyBtn));

  header.appendChild(labelGroup);
  header.appendChild(copyBtn);

  // ── Tab strip ──
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

  // ── Preview iframe ──
  const iframe = document.createElement('iframe');
  iframe.className = 'widget-preview';
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{margin:0;padding:0;background:#fff;}</style>
    </head><body>${widget.html}</body></html>`;

  // ── Code textarea ──
  const textarea = document.createElement('textarea');
  textarea.className = 'widget-code';
  textarea.readOnly   = true;
  textarea.spellcheck = false;
  textarea.value      = widget.html;

  // Tab switching logic
  previewTab.addEventListener('click', () => {
    previewTab.classList.add('is-active');
    codeTab.classList.remove('is-active');
    iframe.style.display    = 'block';
    textarea.style.display  = 'none';
  });
  codeTab.addEventListener('click', () => {
    codeTab.classList.add('is-active');
    previewTab.classList.remove('is-active');
    iframe.style.display    = 'none';
    textarea.style.display  = 'block';
  });

  card.appendChild(header);
  card.appendChild(tabs);
  card.appendChild(iframe);
  card.appendChild(textarea);
  widgetOutputs.appendChild(card);

  // Smooth scroll to new card
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Error card — shown if one widget fails without stopping others
function appendWidgetError(widgetId, message) {
  const card = document.createElement('div');
  card.className = 'widget-card';
  card.style.borderColor = 'var(--accent)';

  const header = document.createElement('div');
  header.className = 'widget-card-header';

  const badge = document.createElement('span');
  badge.className   = 'widget-badge';
  badge.textContent = WIDGET_LABELS[widgetId] || widgetId.toUpperCase();

  const msg = document.createElement('span');
  msg.className = 'widget-card-title';
  msg.style.color = 'var(--accent)';
  msg.textContent = 'Generation failed — try again below';

  const retryBtn = document.createElement('button');
  retryBtn.type      = 'button';
  retryBtn.className = 'widget-copy-btn';
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', async () => {
    card.remove();
    try {
      const widget = await fetchWidget(widgetId);
      appendWidgetCard(widget);
    } catch (err) {
      appendWidgetError(widgetId, err.message);
    }
  });

  header.appendChild(badge);
  header.appendChild(msg);
  header.appendChild(retryBtn);

  const detail = document.createElement('div');
  detail.style.cssText = 'padding:14px 20px;font-family:"Inter","Helvetica Neue",Arial,sans-serif;font-size:13px;color:var(--accent);';
  detail.textContent = message;

  card.appendChild(header);
  card.appendChild(detail);
  widgetOutputs.appendChild(card);
}

// Copy widget HTML to clipboard with visual feedback
async function copyWidgetHtml(html, btn) {
  try {
    await navigator.clipboard.writeText(html);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = html;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
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

// Reset widget section when "Analyze another" is clicked
function resetWidgetSection() {
  lastAnalysis        = null;
  lastTextExcerpt     = '';
  widgetSection.hidden    = true;
  widgetCta.hidden        = false;
  widgetWorking.hidden    = true;
  widgetOutputs.innerHTML = '';
  generateBtn.disabled    = false;
}
