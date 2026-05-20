// ─────────────────────────────────────────────────────────────────
//  PDF.js worker
// ─────────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ─────────────────────────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────────────────────────
const LS_API_KEY  = 'sb_api_key';
const LS_INT_KEY  = 'sb_int_key';

let rawHtml      = '';   // unstyled HTML from converter
let accentColor  = '#0d2d5e';
const FONT = "'Segoe UI', Arial, sans-serif";

// ─────────────────────────────────────────────────────────────────
//  Color helpers
// ─────────────────────────────────────────────────────────────────
function lightenHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' + [r, g, b].map(c => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('');
}

function darkenHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return '#' + [r, g, b].map(c => Math.round(c * (1 - amount)).toString(16).padStart(2, '0')).join('');
}

function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

// ─────────────────────────────────────────────────────────────────
//  Dynamic STYLES based on accent color
// ─────────────────────────────────────────────────────────────────
function buildStyles(accent) {
  const headingColor   = accent;
  const subHeadColor   = darkenHex(lightenHex(accent, 0.15), 0);
  const lightBg        = lightenHex(accent, 0.93);
  const altRowBg       = lightenHex(accent, 0.95);
  const thBorderColor  = darkenHex(accent, 0.15);
  const blockquoteBg   = lightenHex(accent, 0.90);
  const linkColor      = lightenHex(accent, 0.25);

  return {
    WRAPPER:    `max-width: 860px; margin: 0 auto; padding: 32px; background-color: #ffffff; font-family: ${FONT};`,
    H1:         `font-family: ${FONT}; font-size: 20px; font-weight: 700; color: ${headingColor}; margin: 28px 0 12px 0; line-height: 1.3; padding: 0; border: none; background: none;`,
    H2:         `font-family: ${FONT}; font-size: 17px; font-weight: 700; color: ${headingColor}; margin: 22px 0 10px 0; line-height: 1.3; padding: 0; border: none; background: none;`,
    H3:         `font-family: ${FONT}; font-size: 15px; font-weight: 600; color: ${subHeadColor}; margin: 18px 0 8px 0; line-height: 1.3; padding: 0; border: none; background: none;`,
    H4:         `font-family: ${FONT}; font-size: 14px; font-weight: 600; color: ${subHeadColor}; margin: 14px 0 6px 0; line-height: 1.3; padding: 0;`,
    P:          `font-family: ${FONT}; font-size: 14px; color: #1a1a1a; line-height: 1.8; margin: 0 0 14px 0; padding: 0;`,
    UL:         `margin: 0 0 14px 0; padding: 0 0 0 24px;`,
    OL:         `margin: 0 0 14px 0; padding: 0 0 0 24px;`,
    LI:         `font-family: ${FONT}; font-size: 14px; color: #1a1a1a; line-height: 1.8; margin: 0 0 6px 0; padding: 0;`,
    TABLE:      `border-collapse: collapse; width: 100%; margin: 0 0 20px 0; font-family: ${FONT};`,
    TH:         `background-color: ${headingColor}; color: #ffffff; font-weight: 600; font-size: 13px; padding: 10px 14px; border: 1px solid ${thBorderColor}; text-align: left; vertical-align: top;`,
    TD:         `font-size: 13px; color: #1a1a1a; padding: 10px 14px; border: 1px solid #d0d0d0; vertical-align: top;`,
    TD_ALT:     `font-size: 13px; color: #1a1a1a; padding: 10px 14px; border: 1px solid #d0d0d0; vertical-align: top; background-color: ${altRowBg};`,
    BLOCKQUOTE: `margin: 0 0 14px 0; padding: 12px 16px; border-left: 4px solid ${accent}; background-color: ${blockquoteBg}; font-family: ${FONT}; font-size: 14px; color: #334e6e; line-height: 1.8;`,
    HR:         `border: none; border-top: 1px solid #d0e2f5; margin: 20px 0;`,
    A:          `color: ${accent}; text-decoration: none;`,
  };
}

// ─────────────────────────────────────────────────────────────────
//  DOM references
// ─────────────────────────────────────────────────────────────────
const uploadZone    = document.getElementById('upload-zone');
const fileInput     = document.getElementById('file-input');
const processingEl  = document.getElementById('processing');
const processingMsg = document.getElementById('processing-msg');
const resultsEl     = document.getElementById('results');
const fileNameEl    = document.getElementById('file-name-display');
const typeBadgeEl   = document.getElementById('file-type-badge');
const notesEl       = document.getElementById('conversion-notes');
const previewFrame  = document.getElementById('preview-frame');
const htmlOutput    = document.getElementById('html-output');
const copyBtn       = document.getElementById('copy-btn');
const resetBtn      = document.getElementById('reset-btn');
const reapplyBtn    = document.getElementById('reapply-btn');
const accentPicker  = document.getElementById('accent-picker');
const accentHex     = document.getElementById('accent-hex');
const accentPreview = document.getElementById('accent-preview');

// ─────────────────────────────────────────────────────────────────
//  Color picker
// ─────────────────────────────────────────────────────────────────
function setAccentColor(color, reapply = false) {
  if (!isValidHex(color)) return;
  accentColor = color.toLowerCase();
  accentPicker.value  = accentColor;
  accentHex.value     = accentColor.toUpperCase();
  accentPreview.style.background = accentColor;

  document.querySelectorAll('.color-preset').forEach(b => {
    b.classList.toggle('active', b.dataset.color === accentColor);
  });

  if (reapply && rawHtml) reapplyStyles();
}

document.querySelectorAll('.color-preset').forEach(btn => {
  btn.addEventListener('click', () => setAccentColor(btn.dataset.color, true));
});

accentPicker.addEventListener('input', () => setAccentColor(accentPicker.value));
accentHex.addEventListener('input', () => {
  const raw = accentHex.value.trim();
  const v   = raw.startsWith('#') ? raw : '#' + raw;
  if (isValidHex(v)) setAccentColor(v);
});
accentHex.addEventListener('keydown', e => {
  if (e.key === 'Enter') { reapplyStyles(); }
});
reapplyBtn.addEventListener('click', () => {
  setAccentColor(accentHex.value.trim().startsWith('#') ? accentHex.value.trim() : '#' + accentHex.value.trim());
  reapplyStyles();
});

function reapplyStyles() {
  if (!rawHtml) return;
  const styled = applyInlineStyles(rawHtml);
  htmlOutput.value = styled;
  previewFrame.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${styled}</body></html>`;
  // Flash the button
  reapplyBtn.textContent = '✓ Applied';
  setTimeout(() => { reapplyBtn.textContent = '↻ Re-apply styles'; }, 1500);
}

// ─────────────────────────────────────────────────────────────────
//  Drag & Drop + File Input
// ─────────────────────────────────────────────────────────────────
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
uploadZone.addEventListener('click', e => {
  if (e.target.tagName !== 'LABEL') fileInput.click();
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

// ─────────────────────────────────────────────────────────────────
//  Tab switching
// ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('tab-preview').classList.toggle('hidden', tab !== 'preview');
    document.getElementById('tab-code').classList.toggle('hidden', tab !== 'code');
  });
});

// ─────────────────────────────────────────────────────────────────
//  Copy to clipboard
// ─────────────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  const text = htmlOutput.value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    htmlOutput.select();
    document.execCommand('copy');
  }
  copyBtn.textContent = '✅ Copied!';
  copyBtn.classList.add('copied');
  setTimeout(() => {
    copyBtn.innerHTML = '📋 Copy HTML';
    copyBtn.classList.remove('copied');
  }, 2500);
});

// ─────────────────────────────────────────────────────────────────
//  Reset
// ─────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', resetApp);

function resetApp() {
  rawHtml = '';
  fileInput.value = '';
  uploadZone.classList.remove('hidden');
  processingEl.classList.add('hidden');
  resultsEl.classList.add('hidden');
  notesEl.innerHTML = '';
  htmlOutput.value = '';
  previewFrame.srcdoc = '';
  copyBtn.innerHTML = '📋 Copy HTML';
  copyBtn.classList.remove('copied');
  // Reset Salesbuildr section
  document.getElementById('sb-result').classList.add('hidden');
  document.getElementById('sb-push-btn').textContent = 'Save to Salesbuildr →';
  document.getElementById('sb-push-btn').classList.remove('is-done');
}

// ─────────────────────────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────────────────────────
async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const supported = ['pdf', 'doc', 'docx', 'xlsx', 'xls'];
  if (!supported.includes(ext)) {
    showNote('error', `Unsupported file type ".${ext}". Please upload a PDF, Word (.docx), or Excel (.xlsx) file.`);
    return;
  }

  showProcessing(`Converting ${file.name}…`);

  try {
    const arrayBuffer = await file.arrayBuffer();
    let html = '';
    const notes = [];

    if (ext === 'pdf') {
      html = await convertPdf(arrayBuffer, notes);
    } else if (ext === 'docx' || ext === 'doc') {
      html = await convertDocx(arrayBuffer, notes);
    } else if (ext === 'xlsx' || ext === 'xls') {
      html = await convertXlsx(arrayBuffer, notes);
    }

    rawHtml = html;  // store pre-styled HTML for color re-apply
    const styledHtml = applyInlineStyles(html);

    // Default widget title from filename (no extension)
    const titleInput = document.getElementById('sb-widget-title');
    if (!titleInput.value) {
      titleInput.value = file.name.replace(/\.[^.]+$/, '');
    }

    showResults(styledHtml, file.name, ext, notes);

  } catch (err) {
    console.error(err);
    showProcessingError(err.message || 'An unexpected error occurred during conversion.');
  }
}

// ─────────────────────────────────────────────────────────────────
//  DOCX → HTML  (mammoth.js)
// ─────────────────────────────────────────────────────────────────
async function convertDocx(arrayBuffer, notes) {
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Title']         => h1:fresh",
        "p[style-name='Heading 1']     => h1:fresh",
        "p[style-name='Heading 2']     => h2:fresh",
        "p[style-name='Heading 3']     => h3:fresh",
        "p[style-name='Heading 4']     => h4:fresh",
        "p[style-name='List Bullet']   => ul > li:fresh",
        "p[style-name='List Number']   => ol > li:fresh",
        "r[style-name='Strong']        => strong",
        "r[style-name='Emphasis']      => em",
      ]
    }
  );

  if (result.messages && result.messages.length) {
    const warnings = result.messages.filter(m => m.type === 'warning');
    if (warnings.length) {
      notes.push({ type: 'info', text: `${warnings.length} minor formatting element(s) could not be converted (e.g. custom styles, embedded objects). All text content has been preserved.` });
    }
  }

  notes.push({ type: 'info', text: '✔ Word document converted. Inline images are not included in the HTML output. All text, headings, lists, and tables have been preserved verbatim.' });

  return result.value;
}

// ─────────────────────────────────────────────────────────────────
//  PDF → HTML  (pdf.js)
// ─────────────────────────────────────────────────────────────────
async function convertPdf(arrayBuffer, notes) {
  const typedArray = new Uint8Array(arrayBuffer);
  const pdfDoc     = await pdfjsLib.getDocument(typedArray).promise;
  const parts      = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page        = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by line (similar y-position)
    const Y_SNAP = 4;
    const lineMap = new Map();

    for (const item of textContent.items) {
      if (!item.str || !item.str.trim()) continue;
      const y    = Math.round(item.transform[5] / Y_SNAP) * Y_SNAP;
      const x    = item.transform[4];
      const size = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 12;
      if (!lineMap.has(y)) lineMap.set(y, { items: [], maxSize: 0 });
      const line = lineMap.get(y);
      line.items.push({ x, text: item.str, size });
      if (size > line.maxSize) line.maxSize = size;
    }

    // Sort lines top-to-bottom (PDF y-axis is bottom=0)
    const lines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([y, data]) => ({
        y,
        text: data.items.sort((a, b) => a.x - b.x).map(i => i.text).join(' ').trim(),
        maxSize: data.maxSize
      }))
      .filter(l => l.text.length > 0);

    if (lines.length === 0) continue;

    // Estimate body font size (median)
    const sizes = lines.map(l => l.maxSize).sort((a, b) => a - b);
    const bodySize = sizes[Math.floor(sizes.length / 2)] || 12;

    // Convert lines to HTML
    let paragraphBuffer = [];
    let prevY = null;

    const flushParagraph = () => {
      if (paragraphBuffer.length === 0) return;
      parts.push(`<p>${escHtml(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    };

    for (const line of lines) {
      const isHeading1 = line.maxSize > bodySize * 1.35 || (line.text === line.text.toUpperCase() && line.text.length < 80 && line.maxSize >= bodySize * 1.15);
      const isHeading2 = !isHeading1 && (line.maxSize > bodySize * 1.15 || (line.text.match(/^(\d+\.|ARTICLE|SECTION|SCHEDULE|EXHIBIT|APPENDIX)/i) && line.text.length < 100));
      const isHeading3 = !isHeading1 && !isHeading2 && line.maxSize > bodySize * 1.05 && line.text.length < 100;

      const largeGap = prevY !== null && (prevY - line.y) > bodySize * 1.8;

      if (isHeading1 || isHeading2 || isHeading3) {
        flushParagraph();
        const tag = isHeading1 ? 'h1' : isHeading2 ? 'h2' : 'h3';
        parts.push(`<${tag}>${escHtml(line.text)}</${tag}>`);
      } else if (largeGap) {
        flushParagraph();
        paragraphBuffer.push(line.text);
      } else {
        paragraphBuffer.push(line.text);
      }

      prevY = line.y;
    }
    flushParagraph();

    // Page divider (except after last page)
    if (pageNum < pdfDoc.numPages) parts.push('<hr>');
  }

  notes.push({
    type: 'warning',
    text: '⚠ PDF conversion extracts text only — complex formatting, columns, and embedded images cannot be fully reconstructed. ' +
          'For verbatim legal agreements, <strong>Word (.docx) format gives significantly better results</strong>. ' +
          'Please review the output carefully before pasting into Salesbuildr.'
  });

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────
//  XLSX → HTML  (SheetJS)
// ─────────────────────────────────────────────────────────────────
async function convertXlsx(arrayBuffer, notes) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const htmlParts = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (data.length === 0) continue;

    htmlParts.push(`<h2>${escHtml(sheetName)}</h2>`);
    htmlParts.push('<table>');

    data.forEach((row, rowIdx) => {
      htmlParts.push('<tr>');
      row.forEach(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        if (rowIdx === 0) {
          htmlParts.push(`<th>${escHtml(val)}</th>`);
        } else {
          htmlParts.push(`<td>${escHtml(val)}</td>`);
        }
      });
      htmlParts.push('</tr>');
    });

    htmlParts.push('</table>');
  }

  const sheetCount = workbook.SheetNames.length;
  notes.push({ type: 'info', text: `✔ Excel file converted — ${sheetCount} sheet${sheetCount !== 1 ? 's' : ''} included as HTML table${sheetCount !== 1 ? 's' : ''}. Formulas are shown as their calculated values.` });

  return htmlParts.join('\n');
}

// ─────────────────────────────────────────────────────────────────
//  Apply inline styles to HTML string
// ─────────────────────────────────────────────────────────────────
function applyInlineStyles(htmlString) {
  const S      = buildStyles(accentColor);
  const parser = new DOMParser();
  const doc    = parser.parseFromString(`<div id="sb-root">${htmlString}</div>`, 'text/html');
  const root   = doc.getElementById('sb-root');

  // Remove class attributes throughout (TinyMCE may strip them anyway)
  root.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));

  function walk(node) {
    if (node.nodeType !== 1) return;

    const tag = node.tagName;
    let style = '';

    switch (tag) {
      case 'H1':         style = S.H1;   break;
      case 'H2':         style = S.H2;   break;
      case 'H3':         style = S.H3;   break;
      case 'H4':         style = S.H4;   break;
      case 'P':          style = S.P;    break;
      case 'UL':         style = S.UL;   break;
      case 'OL':         style = S.OL;   break;
      case 'LI':         style = S.LI;   break;
      case 'TABLE':      style = S.TABLE; break;
      case 'TH':         style = S.TH;   break;
      case 'BLOCKQUOTE': style = S.BLOCKQUOTE; break;
      case 'HR':         style = S.HR;   break;
      case 'A':          style = S.A;    break;
      case 'STRONG': case 'B': style = 'font-weight: 700;'; break;
      case 'EM': case 'I':     style = 'font-style: italic;'; break;
      case 'U':                style = 'text-decoration: underline;'; break;
      case 'TD': {
        const row      = node.parentElement;
        const tbody    = row && row.parentElement;
        const rowIndex = tbody ? Array.from(tbody.children).indexOf(row) : 0;
        style = rowIndex % 2 === 0 ? S.TD : S.TD_ALT;
        break;
      }
    }

    if (style) {
      const existing = node.getAttribute('style') || '';
      node.setAttribute('style', style + (existing ? ' ' + existing : ''));
    }

    for (const child of Array.from(node.children)) walk(child);
  }

  walk(root);

  // Wrap in outer container
  const wrapper = doc.createElement('div');
  wrapper.setAttribute('style', S.WRAPPER);
  wrapper.innerHTML = root.innerHTML;

  return wrapper.outerHTML;
}

// ─────────────────────────────────────────────────────────────────
//  Show results
// ─────────────────────────────────────────────────────────────────
function showResults(html, fileName, ext, notes) {
  fileNameEl.textContent = fileName;
  typeBadgeEl.textContent = ext.toUpperCase();
  typeBadgeEl.className = `type-badge type-${ext === 'doc' ? 'docx' : ext === 'xls' ? 'xlsx' : ext}`;

  notesEl.innerHTML = '';
  notes.forEach(n => {
    const div = document.createElement('div');
    div.className = `note note-${n.type}`;
    div.innerHTML = n.text;
    notesEl.appendChild(div);
  });

  previewFrame.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:#fff;}</style></head><body>${html}</body></html>`;
  htmlOutput.value = html;

  // Activate preview tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="preview"]').classList.add('active');
  document.getElementById('tab-preview').classList.remove('hidden');
  document.getElementById('tab-code').classList.add('hidden');

  uploadZone.classList.add('hidden');
  processingEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────
//  UI helpers
// ─────────────────────────────────────────────────────────────────
function showProcessing(msg) {
  uploadZone.classList.add('hidden');
  resultsEl.classList.add('hidden');
  processingEl.classList.remove('hidden');
  processingMsg.textContent = msg;
}

function showProcessingError(msg) {
  processingEl.classList.add('hidden');
  uploadZone.classList.remove('hidden');
  const div = document.createElement('div');
  div.className = 'note note-error';
  div.style.marginTop = '16px';
  div.innerHTML = `<strong>Conversion failed:</strong> ${escHtml(msg)}`;
  uploadZone.after(div);
  setTimeout(() => div.remove(), 8000);
}

function showNote(type, text) {
  const div = document.createElement('div');
  div.className = `note note-${type}`;
  div.style.marginTop = '16px';
  div.textContent = text;
  uploadZone.after(div);
  setTimeout(() => div.remove(), 8000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────────
//  Save to Salesbuildr
// ─────────────────────────────────────────────────────────────────
const sbToggle   = document.getElementById('sb-toggle');
const sbArrow    = document.getElementById('sb-arrow');
const sbBody     = document.getElementById('sb-body');
const sbApiKey   = document.getElementById('sb-api-key');
const sbIntKey   = document.getElementById('sb-int-key');
const sbRemember = document.getElementById('sb-remember');
const sbPushBtn  = document.getElementById('sb-push-btn');
const sbResult   = document.getElementById('sb-result');

sbToggle.addEventListener('click', () => {
  const open = !sbBody.classList.contains('hidden');
  sbBody.classList.toggle('hidden', open);
  sbArrow.classList.toggle('open', !open);
});

function updatePushBtn() {
  sbPushBtn.disabled = !(sbApiKey.value.trim() && sbIntKey.value.trim());
}

sbApiKey.addEventListener('input', updatePushBtn);
sbIntKey.addEventListener('input', updatePushBtn);

sbPushBtn.addEventListener('click', async () => {
  const apiKey = sbApiKey.value.trim();
  const intKey = sbIntKey.value.trim();
  if (!apiKey || !intKey) return;

  if (sbRemember.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  const title = (document.getElementById('sb-widget-title').value.trim()) || 'Converted Document';
  const html  = htmlOutput.value;
  if (!html) { sbResult.textContent = 'No HTML to push — convert a document first.'; sbResult.className = 'sb-result error'; sbResult.classList.remove('hidden'); return; }

  sbPushBtn.disabled    = true;
  sbPushBtn.textContent = 'Saving…';
  sbResult.classList.add('hidden');

  try {
    const res  = await fetch('/api/push-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        widgets: [{ id: 'doc-' + Date.now(), title, html }],
        prefix: '',
        apiKey,
        integrationKey: intKey
      })
    });

    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Server error — make sure the Netlify function is deployed.');
    }

    const data = await res.json();
    if (data.successCount > 0) {
      sbResult.textContent  = `✓ "${title}" saved to your Salesbuildr widget library.`;
      sbResult.className    = 'sb-result ok';
      sbPushBtn.textContent = '✓ Saved';
      sbPushBtn.classList.add('is-done');
    } else {
      throw new Error(data.results?.[0]?.error || data.error || 'Unknown error');
    }
  } catch (e) {
    sbResult.textContent = `✕ ${e.message}`;
    sbResult.className   = 'sb-result error';
    sbPushBtn.disabled    = false;
    sbPushBtn.textContent = 'Save to Salesbuildr →';
  }
  sbResult.classList.remove('hidden');
});

// ─────────────────────────────────────────────────────────────────
//  Init — restore saved credentials
// ─────────────────────────────────────────────────────────────────
(function init() {
  const a = localStorage.getItem(LS_API_KEY);
  const i = localStorage.getItem(LS_INT_KEY);
  if (a) sbApiKey.value = a;
  if (i) sbIntKey.value = i;
  if (a && i) { sbRemember.checked = true; updatePushBtn(); }
})();
