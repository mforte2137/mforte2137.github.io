// ─────────────────────────────────────────────────────────────────
//  PDF.js worker
// ─────────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ─────────────────────────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────────────────────────
const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

let rawHtml     = '';   // full unstyled HTML (for single-widget flow)
let widgetList  = [];   // array of { title, rawHtml, isCover, isDecorativeCover, include }
let accentColor = '#0d2d5e';
const FONT      = "'Segoe UI', Arial, sans-serif";

// ─────────────────────────────────────────────────────────────────
//  Color helpers
// ─────────────────────────────────────────────────────────────────
function lightenHex(hex, amount) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(c=>Math.round(c+(255-c)*amount).toString(16).padStart(2,'0')).join('');
}
function darkenHex(hex, amount) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(c=>Math.round(c*(1-amount)).toString(16).padStart(2,'0')).join('');
}
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

// ─────────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────────
function buildStyles(accent) {
  const subHeadColor = darkenHex(lightenHex(accent, 0.15), 0);
  const altRowBg     = lightenHex(accent, 0.95);
  const thBorderColor= darkenHex(accent, 0.15);
  const blockquoteBg = lightenHex(accent, 0.90);
  return {
    WRAPPER:    `max-width:860px;margin:0 auto;padding:32px;background-color:#ffffff;font-family:${FONT};`,
    H1:         `font-family:${FONT};font-size:20px;font-weight:700;color:${accent};margin:28px 0 12px 0;line-height:1.3;padding:0;border:none;background:none;`,
    H2:         `font-family:${FONT};font-size:17px;font-weight:700;color:${accent};margin:22px 0 10px 0;line-height:1.3;padding:0;border:none;background:none;`,
    H3:         `font-family:${FONT};font-size:15px;font-weight:600;color:${subHeadColor};margin:18px 0 8px 0;line-height:1.3;padding:0;border:none;background:none;`,
    H4:         `font-family:${FONT};font-size:14px;font-weight:600;color:${subHeadColor};margin:14px 0 6px 0;line-height:1.3;padding:0;`,
    P:          `font-family:${FONT};font-size:14px;color:#1a1a1a;line-height:1.8;margin:0 0 14px 0;padding:0;`,
    UL:         `margin:0 0 14px 0;padding:0 0 0 24px;`,
    OL:         `margin:0 0 14px 0;padding:0 0 0 24px;`,
    LI:         `font-family:${FONT};font-size:14px;color:#1a1a1a;line-height:1.8;margin:0 0 6px 0;padding:0;`,
    TABLE:      `border-collapse:collapse;width:100%;margin:0 0 20px 0;font-family:${FONT};`,
    TH:         `background-color:${accent};color:#ffffff;font-weight:600;font-size:13px;padding:10px 14px;border:1px solid ${thBorderColor};text-align:left;vertical-align:top;`,
    TD:         `font-size:13px;color:#1a1a1a;padding:10px 14px;border:1px solid #d0d0d0;vertical-align:top;`,
    TD_ALT:     `font-size:13px;color:#1a1a1a;padding:10px 14px;border:1px solid #d0d0d0;vertical-align:top;background-color:${altRowBg};`,
    BLOCKQUOTE: `margin:0 0 14px 0;padding:12px 16px;border-left:4px solid ${accent};background-color:${blockquoteBg};font-family:${FONT};font-size:14px;color:#334e6e;line-height:1.8;`,
    HR:         `border:none;border-top:1px solid #d0e2f5;margin:20px 0;`,
    A:          `color:${accent};text-decoration:none;`,
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
const previewEdit   = document.getElementById('preview-edit');
const editedBadge   = document.getElementById('preview-edit-badge');
const copyBtn       = document.getElementById('copy-btn');
const resetBtn      = document.getElementById('reset-btn');
const reapplyBtn    = document.getElementById('reapply-btn');

let hasEdits = false;

previewEdit.addEventListener('input', () => {
  if (!hasEdits) {
    hasEdits = true;
    editedBadge.classList.remove('hidden');
  }
});
const accentPicker  = document.getElementById('accent-picker');
const accentHex     = document.getElementById('accent-hex');
const accentPreview = document.getElementById('accent-preview');

// ─────────────────────────────────────────────────────────────────
//  Color picker
// ─────────────────────────────────────────────────────────────────
function setAccentColor(color, reapply = false) {
  if (!isValidHex(color)) return;
  accentColor = color.toLowerCase();
  accentPicker.value = accentColor;
  accentHex.value    = accentColor.toUpperCase();
  accentPreview.style.background = accentColor;
  document.querySelectorAll('.color-preset').forEach(b =>
    b.classList.toggle('active', b.dataset.color === accentColor)
  );
  if (reapply && (rawHtml || widgetList.length)) reapplyStyles();
}

document.querySelectorAll('.color-preset').forEach(btn =>
  btn.addEventListener('click', () => setAccentColor(btn.dataset.color, true))
);
accentPicker.addEventListener('input', () => setAccentColor(accentPicker.value));
accentHex.addEventListener('input', () => {
  const raw = accentHex.value.trim();
  const v   = raw.startsWith('#') ? raw : '#' + raw;
  if (isValidHex(v)) setAccentColor(v);
});
accentHex.addEventListener('keydown', e => { if (e.key === 'Enter') reapplyStyles(); });
reapplyBtn.addEventListener('click', () => {
  const raw = accentHex.value.trim();
  setAccentColor(raw.startsWith('#') ? raw : '#' + raw);
  reapplyStyles();
});

function reapplyStyles() {
  if (hasEdits) {
    if (!confirm('Re-applying styles will reset any edits you\'ve made in the preview. Continue?')) return;
  }
  hasEdits = false;
  editedBadge.classList.add('hidden');
  updateCombinedOutput();
  reapplyBtn.textContent = '✓ Applied';
  setTimeout(() => { reapplyBtn.textContent = '↻ Re-apply styles'; }, 1500);
}

// ─────────────────────────────────────────────────────────────────
//  Drag & Drop + File Input
// ─────────────────────────────────────────────────────────────────
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});
uploadZone.addEventListener('click', e => { if (e.target.tagName !== 'LABEL') fileInput.click(); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
//  Copy to clipboard
// ─────────────────────────────────────────────────────────────────
copyBtn.addEventListener('click', async () => {
  const text = previewEdit.innerHTML;
  try { await navigator.clipboard.writeText(text); }
  catch { 
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  copyBtn.textContent = '✅ Copied!';
  copyBtn.classList.add('copied');
  setTimeout(() => { copyBtn.innerHTML = '📋 Copy HTML'; copyBtn.classList.remove('copied'); }, 2500);
});

// ─────────────────────────────────────────────────────────────────
//  Reset
// ─────────────────────────────────────────────────────────────────
resetBtn.addEventListener('click', resetApp);

function resetApp() {
  rawHtml    = '';
  widgetList = [];
  fileInput.value = '';
  uploadZone.classList.remove('hidden');
  processingEl.classList.add('hidden');
  resultsEl.classList.add('hidden');
  document.getElementById('widget-list-section').classList.add('hidden');
  document.getElementById('widget-list').innerHTML = '';
  notesEl.innerHTML = '';
  previewEdit.innerHTML = '';
  hasEdits = false;
  editedBadge.classList.add('hidden');
  copyBtn.innerHTML = '📋 Copy HTML';
  copyBtn.classList.remove('copied');
  document.getElementById('sb-result').classList.add('hidden');
  sbPushIndividual.textContent = 'Save to Salesbuildr →';
  sbPushIndividual.classList.remove('is-done');
  sbPushIndividual.disabled = true;
  sbPushPack.classList.add('hidden');
  sbPushPack.textContent = 'Save as 1 Widget →';
  sbPushPack.classList.remove('is-done');
  sbPushPack.disabled = true;
  document.getElementById('sb-widget-title-row').classList.remove('hidden');
  document.getElementById('sb-widget-title').value = '';
}

// ─────────────────────────────────────────────────────────────────
//  Widget splitting
// ─────────────────────────────────────────────────────────────────
function splitIntoWidgets(html, ext, fileName) {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  if (ext === 'pdf') return splitOnHr(html, baseName);
  return splitOnH2(html, baseName);   // docx, xlsx both use h2
}

function splitOnH2(html, baseName) {
  const h2Regex   = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const positions = [];
  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    positions.push({
      index: match.index,
      title: match[1].replace(/<[^>]+>/g, '').trim() || `Section ${positions.length + 1}`
    });
  }

  // No headings — single widget
  if (positions.length === 0) {
    return [{ title: baseName, rawHtml: html, isCover: false, isDecorativeCover: false, include: true }];
  }

  const widgets = [];

  // Content before first h2
  const pre = html.slice(0, positions[0].index).trim();
  if (pre) {
    const textLen = pre.replace(/<[^>]+>/g, '').trim().length;
    if (textLen > 0) {
      const isDecorativeCover = textLen < 250;
      widgets.push({
        title: 'Cover Page',
        rawHtml: pre,
        isCover: true,
        isDecorativeCover,
        include: !isDecorativeCover
      });
    }
  }

  // Each h2 section
  positions.forEach((pos, i) => {
    const end         = i < positions.length - 1 ? positions[i+1].index : html.length;
    const sectionHtml = html.slice(pos.index, end).trim();
    if (!sectionHtml.replace(/<[^>]+>/g, '').trim()) return;
    widgets.push({ title: pos.title, rawHtml: sectionHtml, isCover: false, isDecorativeCover: false, include: true });
  });

  return widgets;
}

function splitOnHr(html, baseName) {
  const parts   = html.split(/<hr\s*\/?>/i);
  const widgets = [];

  parts.forEach((part, i) => {
    const text = part.replace(/<[^>]+>/g, '').trim();
    if (!text) return;
    const headingMatch = part.match(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/i);
    const headingTitle = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const isDecorativeCover = i === 0 && text.length < 250;
    widgets.push({
      title: isDecorativeCover ? 'Cover Page' : (headingTitle || `Page ${i + 1}`),
      rawHtml: part.trim(),
      isCover: i === 0,
      isDecorativeCover,
      include: !isDecorativeCover
    });
  });

  return widgets;
}

// ─────────────────────────────────────────────────────────────────
//  Widget list UI
// ─────────────────────────────────────────────────────────────────
function renderWidgetList(widgets) {
  const section = document.getElementById('widget-list-section');
  const list    = document.getElementById('widget-list');
  const label   = document.getElementById('widget-count-label');

  // Single widget — no list needed
  if (widgets.length <= 1) {
    section.classList.add('hidden');
    document.getElementById('sb-widget-title-row').classList.remove('hidden');
    // Pre-fill title from the single widget
    if (widgets.length === 1) {
      document.getElementById('sb-widget-title').value = widgets[0].title;
    }
    return;
  }

  // Multiple widgets — show list, hide single title field
  document.getElementById('sb-widget-title-row').classList.add('hidden');
  list.innerHTML = '';

  widgets.forEach((w, i) => {
    const size      = new Blob([w.rawHtml]).size;
    const sizeLabel = size > 1024 ? `${(size/1024).toFixed(1)} KB` : `${size} B`;
    const row       = document.createElement('div');
    row.className   = `widget-item${!w.include ? ' widget-item-skipped' : ''}`;

    row.innerHTML = `
      <label class="widget-check-label" title="${w.isDecorativeCover ? 'Decorative cover detected — excluded by default' : ''}">
        <input type="checkbox" class="widget-checkbox" id="widget-check-${i}" ${w.include ? 'checked' : ''}>
      </label>
      <span class="widget-num">${i + 1}</span>
      <div class="widget-item-body">
        <input type="text" class="widget-title-input" id="widget-title-${i}" value="${escHtml(w.title)}" placeholder="Widget title">
        ${w.isDecorativeCover ? '<span class="widget-badge badge-skip">Decorative cover — excluded</span>' : ''}
        ${w.isCover && !w.isDecorativeCover ? '<span class="widget-badge badge-cover">Cover</span>' : ''}
      </div>
      <span class="widget-size">${sizeLabel}</span>
    `;

    row.querySelector('.widget-checkbox').addEventListener('change', () => {
      row.classList.toggle('widget-item-skipped', !row.querySelector('.widget-checkbox').checked);
      updateCombinedOutput();
      updatePushBtn();
    });
    row.querySelector('.widget-title-input').addEventListener('input', e => {
      widgetList[i].title = e.target.value;
    });

    list.appendChild(row);
  });

  const total    = widgets.length;
  const included = widgets.filter(w => w.include).length;
  label.textContent = `${total} section${total !== 1 ? 's' : ''} detected — ${included} selected`;

  document.getElementById('select-all-btn').onclick = () => {
    document.querySelectorAll('.widget-checkbox').forEach(cb => { cb.checked = true; cb.closest('.widget-item').classList.remove('widget-item-skipped'); });
    updateCombinedOutput(); updatePushBtn();
  };
  document.getElementById('deselect-all-btn').onclick = () => {
    document.querySelectorAll('.widget-checkbox').forEach(cb => { cb.checked = false; cb.closest('.widget-item').classList.add('widget-item-skipped'); });
    updateCombinedOutput(); updatePushBtn();
  };

  section.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────
//  Build combined styled HTML from checked widgets
// ─────────────────────────────────────────────────────────────────
function updateCombinedOutput() {
  let combined;

  if (widgetList.length <= 1) {
    combined = rawHtml ? applyInlineStyles(rawHtml) : '';
  } else {
    combined = widgetList
      .filter((w, i) => {
        const cb = document.getElementById(`widget-check-${i}`);
        return cb ? cb.checked : w.include;
      })
      .map(w => applyInlineStyles(w.rawHtml))
      .join('\n');
  }

  previewEdit.innerHTML = combined;
  hasEdits = false;
  editedBadge.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────────
//  Legal document detection
// ─────────────────────────────────────────────────────────────────
const LEGAL_KEYWORDS = [
  'agreement','terms','conditions','contract','sla','policy',
  'schedule','liability','clause','warranty','indemnity','gdpr',
  'privacy','compliance','obligation','confidential','intellectual property',
  'governing law','jurisdiction','termination','renewal','addendum','annex'
];

function detectLegalDocument(fileName, html) {
  const haystack = (fileName + ' ' + html.replace(/<[^>]+>/g, ' ')).toLowerCase();
  return LEGAL_KEYWORDS.some(kw => haystack.includes(kw));
}

function addLegalNote(notes, ext) {
  if (ext === 'pdf') {
    notes.push({
      type: 'warning',
      text: '⚖ <strong>Legal or contractual content detected.</strong> PDF conversion uses text extraction which may affect line breaks, indentation, and table formatting. <strong>Please compare the preview carefully against your original document</strong> before pushing to Salesbuildr — do not push if any wording or clause structure appears incorrect.'
    });
  } else {
    notes.push({
      type: 'info',
      text: '⚖ <strong>Legal or contractual content detected.</strong> Text and formatting have been preserved verbatim from your Word document. Please review the preview — particularly tables, numbered clauses, and indented sections — before pushing to Salesbuildr.'
    });
  }
}

// ─────────────────────────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────────────────────────
async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','doc','docx','xlsx','xls'].includes(ext)) {
    showNote('error', `Unsupported file type ".${ext}". Please upload a PDF, Word (.docx), or Excel (.xlsx) file.`);
    return;
  }

  showProcessing(`Converting ${file.name}…`);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const notes = [];
    let html    = '';

    if (ext === 'pdf')                       html = await convertPdf(arrayBuffer, notes);
    else if (ext === 'docx' || ext === 'doc') html = await convertDocx(arrayBuffer, notes);
    else if (ext === 'xlsx' || ext === 'xls') html = await convertXlsx(arrayBuffer, notes);

    rawHtml    = html;
    widgetList = splitIntoWidgets(html, ext, file.name);

    if (detectLegalDocument(file.name, html)) addLegalNote(notes, ext);

    showResults(file.name, ext, notes);

  } catch (err) {
    console.error(err);
    showProcessingError(err.message || 'An unexpected error occurred during conversion.');
  }
}

// ─────────────────────────────────────────────────────────────────
//  DOCX → HTML  (mammoth.js)
// ─────────────────────────────────────────────────────────────────
async function convertDocx(arrayBuffer, notes) {
  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: [
      "p[style-name='Title']       => h1:fresh",
      "p[style-name='Heading 1']   => h1:fresh",
      "p[style-name='Heading 2']   => h2:fresh",
      "p[style-name='Heading 3']   => h3:fresh",
      "p[style-name='Heading 4']   => h4:fresh",
      "p[style-name='List Bullet'] => ul > li:fresh",
      "p[style-name='List Number'] => ol > li:fresh",
      "r[style-name='Strong']      => strong",
      "r[style-name='Emphasis']    => em",
    ]
  });
  if (result.messages?.filter(m => m.type === 'warning').length) {
    notes.push({ type: 'info', text: `${result.messages.filter(m=>m.type==='warning').length} minor formatting element(s) could not be converted. All text content has been preserved.` });
  }
  notes.push({ type: 'info', text: '✔ Word document converted. Inline images are not included. All text, headings, lists, and tables have been preserved.' });
  return result.value;
}

// ─────────────────────────────────────────────────────────────────
//  PDF → HTML  (pdf.js) — two-pass with header/footer detection
// ─────────────────────────────────────────────────────────────────
async function convertPdf(arrayBuffer, notes) {
  const typedArray = new Uint8Array(arrayBuffer);
  const pdfDoc     = await pdfjsLib.getDocument(typedArray).promise;
  const Y_SNAP     = 4;
  const ZONE       = 0.08;  // top/bottom 8% of page = header/footer zone

  // ── Pass 1: collect all pages' text with y-position metadata ──
  const pageData = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page       = await pdfDoc.getPage(pageNum);
    const pageHeight = page.view[3]; // native PDF height in points
    const textContent= await page.getTextContent();
    const lineMap    = new Map();

    for (const item of textContent.items) {
      if (!item.str?.trim()) continue;
      const yRaw = item.transform[5];
      const y    = Math.round(yRaw / Y_SNAP) * Y_SNAP;
      const x    = item.transform[4];
      const size = Math.abs(item.transform[3]) || Math.abs(item.transform[0]) || 12;
      if (!lineMap.has(y)) lineMap.set(y, { items: [], maxSize: 0, yRaw });
      const line = lineMap.get(y);
      line.items.push({ x, text: item.str, size });
      if (size > line.maxSize) line.maxSize = size;
    }

    const lines = [...lineMap.entries()]
      .sort((a,b) => b[0]-a[0])
      .map(([y, data]) => ({
        y,
        yRaw:   data.yRaw,
        yNorm:  data.yRaw / pageHeight,
        text:   data.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ').trim(),
        maxSize: data.maxSize
      }))
      .filter(l => l.text.length > 0);

    pageData.push({ pageNum, lines, pageHeight });
  }

  // ── Detect repeating header/footer text ──
  const zoneFreq = new Map();
  for (const { lines } of pageData) {
    const seen = new Set();
    for (const line of lines) {
      const inZone = line.yNorm > (1 - ZONE) || line.yNorm < ZONE;
      if (inZone && !seen.has(line.text)) {
        seen.add(line.text);
        zoneFreq.set(line.text, (zoneFreq.get(line.text) || 0) + 1);
      }
    }
  }
  const minPages  = Math.max(2, Math.floor(pdfDoc.numPages * 0.3));
  const skipTexts = new Set(
    [...zoneFreq.entries()].filter(([,n]) => n >= minPages).map(([t]) => t)
  );

  // ── Pass 2: convert to HTML, skipping header/footer lines ──
  const parts = [];
  for (const { pageNum, lines } of pageData) {
    if (!lines.length) continue;

    const sizes    = lines.map(l=>l.maxSize).sort((a,b)=>a-b);
    const bodySize = sizes[Math.floor(sizes.length/2)] || 12;
    let paragraphBuffer = [], prevY = null;

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      parts.push(`<p>${escHtml(paragraphBuffer.join(' '))}</p>`);
      paragraphBuffer = [];
    };

    for (const line of lines) {
      if (skipTexts.has(line.text)) continue;  // skip header/footer

      const isH1 = line.maxSize > bodySize*1.35 || (line.text===line.text.toUpperCase() && line.text.length<80 && line.maxSize>=bodySize*1.15);
      const isH2 = !isH1 && (line.maxSize > bodySize*1.15 || (line.text.match(/^(\d+\.|ARTICLE|SECTION|SCHEDULE|EXHIBIT|APPENDIX)/i) && line.text.length<100));
      const isH3 = !isH1 && !isH2 && line.maxSize > bodySize*1.05 && line.text.length<100;
      const gap  = prevY !== null && (prevY - line.y) > bodySize*1.8;

      if (isH1||isH2||isH3) {
        flushParagraph();
        parts.push(`<${isH1?'h1':isH2?'h2':'h3'}>${escHtml(line.text)}</${isH1?'h1':isH2?'h2':'h3'}>`);
      } else if (gap) {
        flushParagraph();
        paragraphBuffer.push(line.text);
      } else {
        paragraphBuffer.push(line.text);
      }
      prevY = line.y;
    }
    flushParagraph();
    if (pageNum < pdfDoc.numPages) parts.push('<hr>');
  }

  if (skipTexts.size > 0) {
    notes.push({ type: 'info', text: `✔ ${skipTexts.size} repeated header/footer line${skipTexts.size!==1?'s':''} detected and removed from the output.` });
  }
  notes.push({ type: 'warning', text: '⚠ PDF conversion extracts text only — complex formatting, columns, and embedded images cannot be fully reconstructed. For legal agreements, <strong>Word (.docx) gives significantly better results</strong>. Please review carefully before pasting into Salesbuildr.' });
  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────
//  XLSX → HTML  (SheetJS)
// ─────────────────────────────────────────────────────────────────
async function convertXlsx(arrayBuffer, notes) {
  const workbook  = XLSX.read(arrayBuffer, { type: 'array' });
  const htmlParts = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!data.length) continue;
    htmlParts.push(`<h2>${escHtml(sheetName)}</h2><table>`);
    data.forEach((row, rowIdx) => {
      htmlParts.push('<tr>');
      row.forEach(cell => {
        const val = cell == null ? '' : String(cell);
        htmlParts.push(rowIdx === 0 ? `<th>${escHtml(val)}</th>` : `<td>${escHtml(val)}</td>`);
      });
      htmlParts.push('</tr>');
    });
    htmlParts.push('</table>');
  }

  const n = workbook.SheetNames.length;
  notes.push({ type: 'info', text: `✔ Excel file converted — ${n} sheet${n!==1?'s':''} included as HTML table${n!==1?'s':''}. Formulas are shown as their calculated values.` });
  return htmlParts.join('\n');
}

// ─────────────────────────────────────────────────────────────────
//  Apply inline styles
// ─────────────────────────────────────────────────────────────────
function applyInlineStyles(htmlString) {
  const S      = buildStyles(accentColor);
  const parser = new DOMParser();
  const doc    = parser.parseFromString(`<div id="sb-root">${htmlString}</div>`, 'text/html');
  const root   = doc.getElementById('sb-root');
  root.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));

  function walk(node) {
    if (node.nodeType !== 1) return;
    let style = '';
    switch (node.tagName) {
      case 'H1': style = S.H1; break; case 'H2': style = S.H2; break;
      case 'H3': style = S.H3; break; case 'H4': style = S.H4; break;
      case 'P':  style = S.P;  break; case 'UL': style = S.UL; break;
      case 'OL': style = S.OL; break; case 'LI': style = S.LI; break;
      case 'TABLE': style = S.TABLE; break; case 'TH': style = S.TH; break;
      case 'BLOCKQUOTE': style = S.BLOCKQUOTE; break;
      case 'HR': style = S.HR; break; case 'A':  style = S.A;  break;
      case 'STRONG': case 'B': style = 'font-weight:700;'; break;
      case 'EM': case 'I':     style = 'font-style:italic;'; break;
      case 'U':                style = 'text-decoration:underline;'; break;
      case 'TD': {
        const rowIndex = node.parentElement && node.parentElement.parentElement
          ? Array.from(node.parentElement.parentElement.children).indexOf(node.parentElement) : 0;
        style = rowIndex % 2 === 0 ? S.TD : S.TD_ALT;
        break;
      }
    }
    if (style) {
      const existing = node.getAttribute('style') || '';
      node.setAttribute('style', style + (existing ? ' '+existing : ''));
    }
    Array.from(node.children).forEach(walk);
  }

  walk(root);
  const wrapper = doc.createElement('div');
  wrapper.setAttribute('style', S.WRAPPER);
  wrapper.innerHTML = root.innerHTML;
  return wrapper.outerHTML;
}

// ─────────────────────────────────────────────────────────────────
//  Show results
// ─────────────────────────────────────────────────────────────────
function showResults(fileName, ext, notes) {
  fileNameEl.textContent = fileName;
  typeBadgeEl.textContent = ext.toUpperCase();
  typeBadgeEl.className = `type-badge type-${ext==='doc'?'docx':ext==='xls'?'xlsx':ext}`;

  notesEl.innerHTML = '';
  notes.forEach(n => {
    const div = document.createElement('div');
    div.className = `note note-${n.type}`;
    div.innerHTML = n.text;
    notesEl.appendChild(div);
  });

  // Render widget list (may hide single-title field if multi-widget)
  renderWidgetList(widgetList);

  // Build initial combined output
  updateCombinedOutput();

  uploadZone.classList.add('hidden');
  processingEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');

  updatePushBtn();
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
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────────────
//  Save to Salesbuildr
// ─────────────────────────────────────────────────────────────────
const sbToggle   = document.getElementById('sb-toggle');
const sbArrow    = document.getElementById('sb-arrow');
const sbBody     = document.getElementById('sb-body');
const sbApiKey   = document.getElementById('sb-api-key');
const sbTenantUrl= document.getElementById('sb-tenant-url');
const sbRemember = document.getElementById('sb-remember');
const sbPushIndividual = document.getElementById('sb-push-individual');
const sbPushPack       = document.getElementById('sb-push-pack');
const sbResult   = document.getElementById('sb-result');

sbToggle.addEventListener('click', () => {
  const open = !sbBody.classList.contains('hidden');
  sbBody.classList.toggle('hidden', open);
  sbArrow.classList.toggle('open', !open);
});

function updatePushBtn() {
  const hasCredentials = sbApiKey.value.trim() && sbTenantUrl.value.trim();
  const isMulti = widgetList.length > 1;
  const checkedCount = isMulti
    ? document.querySelectorAll('.widget-checkbox:checked').length
    : 1;

  sbPushIndividual.disabled = !hasCredentials || checkedCount === 0;
  sbPushPack.disabled       = !hasCredentials || checkedCount === 0;

  if (isMulti && checkedCount > 0) {
    sbPushIndividual.textContent = `Save ${checkedCount} Widget${checkedCount!==1?'s':''} →`;
    sbPushPack.classList.remove('hidden');
  } else {
    sbPushIndividual.textContent = 'Save to Salesbuildr →';
    sbPushPack.classList.add('hidden');
  }
}

sbApiKey.addEventListener('input', updatePushBtn);
sbTenantUrl.addEventListener('input', updatePushBtn);

async function executePush(type) {
  const apiKey    = sbApiKey.value.trim();
  const tenantUrl = sbTenantUrl.value.trim();
  if (!apiKey || !tenantUrl) return;

  if (sbRemember.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_TENANT_URL);
  }

  // Build checked widgets array — read from live edited preview
  let checkedWidgets;
  if (widgetList.length > 1) {
    const checked = widgetList
      .map((w, i) => ({ w, i, cb: document.getElementById(`widget-check-${i}`) }))
      .filter(({ cb }) => cb?.checked);

    // Try to split the live preview by top-level wrapper divs (one per styled widget)
    const parsedDoc = new DOMParser().parseFromString(previewEdit.innerHTML, 'text/html');
    const wrappers  = Array.from(parsedDoc.body.children).filter(el => el.tagName === 'DIV');

    if (wrappers.length === checked.length) {
      checkedWidgets = checked.map(({ w, i }, j) => {
        const titleEl = document.getElementById(`widget-title-${i}`);
        return { id: `doc-${Date.now()}-${i}`, title: titleEl?.value.trim() || w.title || `Widget ${i+1}`, html: wrappers[j].outerHTML };
      });
    } else {
      // Fallback — re-style from raw (edits not preserved for individual push)
      checkedWidgets = checked.map(({ w, i }) => {
        const titleEl = document.getElementById(`widget-title-${i}`);
        return { id: `doc-${Date.now()}-${i}`, title: titleEl?.value.trim() || w.title || `Widget ${i+1}`, html: applyInlineStyles(w.rawHtml) };
      });
    }
  } else {
    const title = document.getElementById('sb-widget-title')?.value.trim()
      || fileNameEl.textContent.replace(/\.[^.]+$/,'')
      || 'Converted Document';
    const html = previewEdit.innerHTML;
    if (!html.trim()) {
      sbResult.textContent = 'No content to push — convert a document first.';
      sbResult.className   = 'sb-result error';
      sbResult.classList.remove('hidden');
      return;
    }
    checkedWidgets = [{ id: 'doc-' + Date.now(), title, html }];
  }

  if (!checkedWidgets.length) {
    sbResult.textContent = 'No widgets selected — check at least one section above.';
    sbResult.className   = 'sb-result error';
    sbResult.classList.remove('hidden');
    return;
  }

  // For pack mode, use the full live preview content as one widget
  const widgets = type === 'pack'
    ? [{ id: 'doc-pack-' + Date.now(), title: fileNameEl.textContent.replace(/\.[^.]+$/,'') || 'Converted Document', html: previewEdit.innerHTML }]
    : checkedWidgets;

  const activeBtn    = type === 'pack' ? sbPushPack : sbPushIndividual;
  const inactiveBtn  = type === 'pack' ? sbPushIndividual : sbPushPack;
  const origLabel    = activeBtn.textContent;

  sbPushIndividual.disabled = true;
  sbPushPack.disabled       = true;
  activeBtn.textContent = type === 'pack' ? 'Saving…' : `Saving ${widgets.length} widget${widgets.length!==1?'s':''}…`;
  sbResult.classList.add('hidden');

  try {
    const res  = await fetch('/api/push-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ widgets, prefix: '', apiKey, tenantUrl })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Server error — make sure the Netlify function is deployed.');
    }
    const data = await res.json();
    if (data.successCount > 0) {
      sbResult.textContent = `✓ ${data.successCount} widget${data.successCount!==1?'s':''} saved to your Salesbuildr widget library.`;
      sbResult.className   = 'sb-result ok';
      activeBtn.textContent = '✓ Saved';
      activeBtn.classList.add('is-done');
    } else {
      throw new Error(data.results?.[0]?.error || data.error || 'Unknown error');
    }
  } catch (e) {
    sbResult.textContent = `✕ ${e.message}`;
    sbResult.className   = 'sb-result error';
    activeBtn.textContent = origLabel;
    updatePushBtn();
  }
  sbResult.classList.remove('hidden');
}

sbPushIndividual.addEventListener('click', () => executePush('individual'));
sbPushPack.addEventListener('click',       () => executePush('pack'));

// ─────────────────────────────────────────────────────────────────
//  Init — restore saved credentials
// ─────────────────────────────────────────────────────────────────
(function init() {
  const a = localStorage.getItem(LS_API_KEY);
  const t = localStorage.getItem(LS_TENANT_URL);
  if (a) sbApiKey.value    = a;
  if (t) sbTenantUrl.value = t;
  if (a && t) { sbRemember.checked = true; updatePushBtn(); }
})();
