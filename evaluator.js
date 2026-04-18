/* =========================================================
   Proposal Evaluator — Buyer Decision Journey Report
   Behavior for evaluator.html

   End-to-end flow:
     1. User drops/picks a PDF
     2. We extract text in the browser using PDF.js
     3. We normalize whitespace
     4. We POST text + metadata to /api/analyze
     5. The serverless function calls Claude and returns
        a structured Buyer Decision Journey Report
     6. We render the report into the report-view template
   ========================================================= */

// ---------- PDF.js setup ----------------------------------
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ---------- DOM handles -----------------------------------
const uploadView    = document.getElementById('upload-view');
const parsingView   = document.getElementById('parsing-view');
const reportView    = document.getElementById('report-view');

const dropzone      = document.getElementById('dropzone');
const fileInput     = document.getElementById('file-input');
const browseBtn     = document.getElementById('browse-btn');
const parsingTitle  = document.getElementById('parsing-title');
const parsingDetail = document.getElementById('parsing-detail');
const restartBtn    = document.getElementById('restart-btn');

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

// ---------- View switching --------------------------------
function showView(name) {
  uploadView.hidden  = name !== 'upload';
  parsingView.hidden = name !== 'parsing';
  reportView.hidden  = name !== 'report';
}
function setWorking(title, detail) {
  parsingTitle.textContent = title;
  parsingDetail.textContent = detail;
}

function showError(message) {
  errorDetail.textContent = message;
  errorBanner.hidden = false;
}
function hideError() { errorBanner.hidden = true; }

// ---------- Event wiring ----------------------------------
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
  showView('upload');
});
errorDismiss.addEventListener('click', () => {
  hideError();
  showView('upload');
});

// ---------- PDF handling ----------------------------------
async function handleFile(file) {
  hideError();

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showError('Please upload a PDF file.');
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showError('That PDF is larger than 25 MB. Large files may be scans; try a text-based export.');
    return;
  }

  showView('parsing');
  setWorking('Reading the proposal…', 'Extracting text from ' + file.name);

  try {
    const text = await extractText(file, (pageNum, total) => {
      setWorking('Reading the proposal…', 'Reading page ' + pageNum + ' of ' + total + '…');
    });
    const pages = text.pageCount;
    const normalized = normalizeText(text.fullText);

    if (normalized.length < 200) {
      showError('Only ' + normalized.length + ' characters were extracted. This PDF may be image-only (a scan) and would need OCR before we can analyze it.');
      showView('upload');
      return;
    }

    setWorking('Analyzing against the framework…', 'Claude is reading it through your buyer\'s eyes. Usually 5–10 seconds.');

    const analysis = await runAnalysis({
      text: normalized,
      filename: file.name,
      pages
    });

    renderReport(analysis, {
      filename: file.name,
      pages
    });

    showView('report');

  } catch (err) {
    console.error(err);
    showError(err.message || 'Unknown error');
    showView('upload');
  }
}

// ---------- Text extraction -------------------------------
async function extractText(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    if (onProgress) onProgress(i, pageCount);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    let pageText = '';
    let lastY = null;
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

// Collapse the triple-spaces and other whitespace oddities
// that PDF.js introduces, so we send clean text to Claude.
function normalizeText(s) {
  return s
    .replace(/[ \t]+/g, ' ')     // collapse spaces/tabs
    .replace(/ *\n */g, '\n')    // trim spaces around newlines
    .replace(/\n{3,}/g, '\n\n')  // at most one blank line in a row
    .trim();
}

// ---------- API call --------------------------------------
async function runAnalysis({ text, filename, pages }) {
  let response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, filename, pages })
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
    const detail = data && data.error ? data.error : 'HTTP ' + response.status;
    const more = data && data.details ? ' (' + data.details.slice(0, 200) + ')' : '';
    throw new Error('Analysis failed: ' + detail + more);
  }

  if (!data.analysis) {
    throw new Error('The analyzer returned no analysis. Please try again.');
  }

  return data.analysis;
}

// ---------- Rendering -------------------------------------
function renderReport(a, meta) {
  // Meta
  rptFilename.textContent = meta.filename;
  rptPages.textContent = meta.pages;
  rptDate.textContent = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  // Verdict
  rptHeadline.textContent = a.verdict.headline;
  rptSubtitle.textContent = a.verdict.subtitle;

  // Widget sequence
  rptWidgets.innerHTML = '';
  a.widgetSequence.forEach(w => {
    const div = document.createElement('div');
    div.className = 'widget ' + w.status;
    const num = document.createElement('span');
    num.className = 'w-num';
    num.textContent = 'W' + w.num;
    div.appendChild(num);
    div.appendChild(document.createTextNode(w.detail));
    rptWidgets.appendChild(div);
  });
  rptSequenceNote.textContent = a.sequenceNote;

  // Fears
  rptFears.innerHTML = '';
  a.fears.forEach(f => {
    const li = document.createElement('li');
    const mark = document.createElement('span');
    mark.className = 'mark';
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

    const their = document.createElement('p');
    their.className = 'their';
    their.textContent = q.their;

    const arrow = document.createElement('p');
    arrow.className = 'arrow';
    arrow.textContent = 'Outside-in rewrite';

    const ours = document.createElement('p');
    ours.className = 'ours';
    ours.textContent = q.ours;

    block.appendChild(their);
    block.appendChild(arrow);
    block.appendChild(ours);
    rptQuotes.appendChild(block);
  });

  // Opening rewrite
  rptBefore.textContent = a.openingRewrite.before;
  rptAfter.textContent = a.openingRewrite.after;
}
