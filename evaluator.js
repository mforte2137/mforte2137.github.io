/* =========================================================
   Proposal Evaluator — Buyer Decision Journey Report
   Behavior for evaluator.html

   Current stage (Step 5): upload UI + PDF text extraction.
   We can read a user-uploaded PDF entirely in the browser,
   pull out its text, and show a preview. No API call yet.

   Step 6 will wire this up to POST the extracted text to
   /api/analyze, receive a structured JSON report from
   Claude, and render the Buyer Decision Journey Report.
   ========================================================= */

// ---------- PDF.js setup ----------------------------------
// PDF.js runs in a background worker for performance. The
// main script (loaded via <script> in evaluator.html) exposes
// pdfjsLib globally; we just have to point it at the matching
// worker URL on the same CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ---------- DOM handles -----------------------------------
const uploadView   = document.getElementById('upload-view');
const parsingView  = document.getElementById('parsing-view');
const parsedView   = document.getElementById('parsed-view');
const dropzone     = document.getElementById('dropzone');
const fileInput    = document.getElementById('file-input');
const browseBtn    = document.getElementById('browse-btn');
const resetBtn     = document.getElementById('reset-btn');
const parsingDetail= document.getElementById('parsing-detail');
const parsedName   = document.getElementById('parsed-filename');
const parsedPages  = document.getElementById('parsed-pages');
const parsedChars  = document.getElementById('parsed-chars');
const extractedBox = document.getElementById('extracted-text');
const errorBanner  = document.getElementById('error-banner');
const errorDetail  = document.getElementById('error-detail');
const errorDismiss = document.getElementById('error-dismiss');

// ---------- View switching --------------------------------
function showView(name) {
  uploadView.hidden  = name !== 'upload';
  parsingView.hidden = name !== 'parsing';
  parsedView.hidden  = name !== 'parsed';
}

function showError(message) {
  errorDetail.textContent = message;
  errorBanner.hidden = false;
}
function hideError() {
  errorBanner.hidden = true;
}

// ---------- Event wiring ----------------------------------

// Clicking anywhere in the dropzone opens the file picker,
// except when clicking the inline "browse your files" button
// (which opens it too — we just stop double-firing).
dropzone.addEventListener('click', (e) => {
  if (e.target === browseBtn) return;
  fileInput.click();
});
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

// File picker selection.
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
  fileInput.value = ''; // allow picking the same file again later
});

// Drag-and-drop.
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

// Reset from parsed view back to upload view.
resetBtn.addEventListener('click', () => {
  extractedBox.textContent = '';
  showView('upload');
  hideError();
});

// Dismiss error banner.
errorDismiss.addEventListener('click', () => {
  hideError();
  showView('upload');
});

// ---------- PDF handling ----------------------------------

async function handleFile(file) {
  hideError();

  // Basic validation.
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showError('Please upload a PDF file. Got: ' + file.type);
    return;
  }
  if (file.size > 25 * 1024 * 1024) {
    showError('That PDF is larger than 25 MB. Large files may be scans; try exporting a text-based version.');
    return;
  }

  showView('parsing');
  parsingDetail.textContent = 'Reading ' + file.name + '…';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
      parsingDetail.textContent = 'Reading page ' + i + ' of ' + numPages + '…';
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Stitch text items together. PDF.js gives us individual
      // strings per positioned element; we join with spaces and
      // insert line breaks heuristically when Y-position changes
      // substantially (makes the preview more readable).
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

      fullText += '\n\n───── Page ' + i + ' ─────\n' + pageText.trim();
    }

    // Show results.
    parsedName.textContent = file.name;
    parsedPages.textContent = numPages;
    parsedChars.textContent = fullText.length.toLocaleString();
    extractedBox.textContent = fullText.trim();

    showView('parsed');

    // Stash for Step 6 so we can POST it to /api/analyze.
    window.__proposalText = fullText.trim();
    window.__proposalFilename = file.name;
    window.__proposalPages = numPages;

  } catch (err) {
    console.error(err);
    showError('Could not read the PDF. ' + (err.message || 'Unknown error') +
      '. If this is a scanned document, it may need OCR before we can read it.');
    showView('upload');
  }
}
