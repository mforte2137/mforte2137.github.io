/* ================================================================
   Salesbuildr — Special Bid Converter
   converter.js

   Runs entirely in the browser. No data leaves this page.
   Requires: SheetJS (xlsx.full.min.js) loaded before this file.
   ================================================================ */

'use strict';

// ── Salesbuildr Special Bid field definitions ─────────────────────
const FIELDS = [
  { key: 'MPN',          label: 'MPN',          required: true  },
  { key: 'Name',         label: 'Name',         required: true  },
  { key: 'Description',  label: 'Description',  required: false },
  { key: 'Cost',         label: 'Cost',         required: true  },
  { key: 'MSRP',         label: 'MSRP',         required: false },
  { key: 'Sales Price',  label: 'Sales Price',  required: false },
  { key: 'Markup',       label: 'Markup',       required: false },
  { key: 'Margin',       label: 'Margin',       required: false },
  { key: 'Quantity',     label: 'Quantity',     required: false },
  { key: 'Category',     label: 'Category',     required: false },
  { key: 'Unit',         label: 'Unit',         required: false },
  { key: 'Term',         label: 'Term',         required: false },
  { key: 'Manufacturer', label: 'Manufacturer', required: false },
  { key: 'Distributor',  label: 'Distributor',  required: false },
];

// ── Known vendor column-name synonyms for each Salesbuildr field ──
//    Add more here as you encounter new vendor formats.
const SYNONYMS = {
  MPN: [
    'mpn', 'part number', 'part no', 'part #', 'pn', 'sku', 'item #',
    'item number', 'vendor part code', 'vendor part', 'product no',
    'product number', 'product id', 'vendor code', 'part code',
    'bundle id/part code', 'bundle id', 'material', 'im material',
    'article no', 'article number', 'catalog number', 'catalogue number',
    'model number', 'model', 'order code', 'vendor pn', 'mfr part',
    'mfr part number', 'manuf part', 'supplier part', 'reference',
    'ref', 'stock code', 'item code', 'product code',
  ],
  Name: [
    'name', 'product name', 'item name', 'title', 'product title',
    'short name', 'product', 'short description',
  ],
  Description: [
    'description', 'product description', 'item description',
    'long description', 'desc', 'details', 'product details',
    'full description', 'extended description',
  ],
  'Sales Price': [
    'sales price', 'sell price', 'selling price', 'price', 'sale price',
    'sp', 'customer price', 'end customer price',
  ],
  Markup:  ['markup', 'mark up', 'mark-up', 'uplift'],
  Margin:  ['margin', 'gp%', 'gross margin', 'gp', 'profit margin', 'margin %'],
  Cost: [
    'cost', 'unit price', 'reseller unit buy', 'net price', 'buy price',
    'dealer price', 'your price', 'per unit', 'per unit au$', 'unit cost',
    'reseller price', 'partner price', 'partner cost', 'trade price',
    'net', 'unit net', 'reseller net', 'distributor price',
    'purchase price', 'wholesale price', 'wholesale', 'buy in', 'buy-in',
    'special price', 'special bid price', 'bid price',
  ],
  MSRP: [
    'msrp', 'rrp', 'list price', 'retail price', 'recommended retail',
    'srp', 'suggested retail', 'rsp', 'recommended price',
    'manufacturer price', 'public price', 'rp', 'standard price',
    'street price',
  ],
  Category: [
    'category', 'product type', 'type', 'product category', 'group',
    'product group', 'family', 'product family', 'class', 'product class',
    'pl', 'product line',
  ],
  Unit: ['unit', 'uom', 'unit of measure', 'unit type', 'unit of measurement'],
  Term: [
    'term', 'contract term', 'subscription term', 'period', 'duration',
    'license term', 'service term', 'coverage term',
  ],
  Manufacturer: [
    'manufacturer', 'vendor', 'brand', 'mfr', 'make', 'mfg', 'oem',
    'company', 'mfr name', 'manufacturer name', 'brand name', 'vendor name',
    // Note: "vendor ref" intentionally omitted — that's typically a quote/order
    // reference number from the vendor, not the manufacturer name.
  ],
  Distributor: [
    'distributor', 'source', 'channel', 'disti', 'dist',
    'sold by', 'fulfilled by', 'wholesaler', 'supplier name',
  ],
  Quantity: [
    'quantity', 'qty', 'min', 'minimum', 'min per order', 'min qty',
    'ordered qty', 'order qty', 'amount', 'units', 'count',
    'no of units', 'min order', 'minimum order', 'available qty',
    'remaining qty', 'stock', 'soh',
  ],
};

// ── Runtime state ─────────────────────────────────────────────────
let workbook        = null;
let rawRows         = [];   // Array<Array> — all rows from selected sheet
let detectedHdrRow  = 0;    // 0-indexed row that has headers
let columnHeaders   = [];   // Cleaned header strings from detectedHdrRow
let convertedData   = [];   // Final mapped rows, ready to export

// ── Initialise ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dropZone      = document.getElementById('dropZone');
  const fileInput     = document.getElementById('fileInput');
  const sheetSelect   = document.getElementById('sheetSelect');
  const headerRowInput= document.getElementById('headerRowInput');

  // Drag & drop
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  });

  // Click to pick (avoid double-trigger with the inner label)
  dropZone.addEventListener('click', e => {
    if (!e.target.closest('label')) fileInput.click();
  });

  fileInput.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) processFile(f);
  });

  sheetSelect.addEventListener('change', e => reloadSheet(e.target.value));

  // Allow user to manually correct header row
  headerRowInput.addEventListener('change', () => {
    const row = Math.max(1, parseInt(headerRowInput.value) || 1) - 1;
    detectedHdrRow = row;
    headerRowInput.value = row + 1;
    columnHeaders = extractHeaders(rawRows, detectedHdrRow);
    updateHeaderHint();
    buildMappingUI();
  });

  document.getElementById('applyBtn').addEventListener('click', runConversion);
  document.getElementById('downloadBtn').addEventListener('click', triggerDownload);
  document.getElementById('copyBtn').addEventListener('click', triggerCopy);
  document.getElementById('startOverBtn').addEventListener('click', resetAll);
});

// ── File Processing ───────────────────────────────────────────────
function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    showError('Please upload an .xlsx, .xls, or .csv file.');
    return;
  }

  // Show file banner
  const banner = document.getElementById('fileInfo');
  banner.innerHTML = `
    <div class="file-info">
      <span class="fi-icon">📄</span>
      <span class="fi-name">${esc(file.name)}</span>
      <span class="fi-size">${fmtBytes(file.size)}</span>
    </div>`;
  banner.classList.remove('hidden');

  // Read with FileReader → SheetJS
  const reader = new FileReader();
  reader.onload = e => {
    try {
      workbook = XLSX.read(new Uint8Array(e.target.result), {
        type: 'array',
        cellDates: true,    // return JS Date objects for date cells
        cellText: false,
      });
      setupSheetPicker();
    } catch {
      showError('Could not read the file. Please check it is a valid Excel or CSV file.');
    }
  };
  reader.readAsArrayBuffer(file);
}

function setupSheetPicker() {
  const sheets = workbook.SheetNames;
  const sel = document.getElementById('sheetSelect');
  sel.innerHTML = '';
  sheets.forEach(name => {
    const opt = document.createElement('option');
    opt.value = opt.textContent = name;
    sel.appendChild(opt);
  });

  // Auto-pick the sheet with the most non-empty rows
  let bestSheet = sheets[0];
  if (sheets.length > 1) {
    let bestCount = 0;
    sheets.forEach(name => {
      const count = countNonEmptyRows(workbook.Sheets[name]);
      if (count > bestCount) { bestCount = count; bestSheet = name; }
    });
    sel.value = bestSheet;
    document.getElementById('sheetSelectorWrap').classList.remove('hidden');
  } else {
    document.getElementById('sheetSelectorWrap').classList.add('hidden');
  }

  reloadSheet(bestSheet);
  document.getElementById('step-mapping').classList.remove('hidden');
}

function reloadSheet(sheetName) {
  const ws = workbook.Sheets[sheetName];
  // Get every row as an array; defval='' so empty cells aren't undefined
  rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Drop rows that are completely blank
  rawRows = rawRows.filter(r => r.some(c => String(c).trim() !== ''));

  detectedHdrRow = detectHeaderRow(rawRows);
  columnHeaders  = extractHeaders(rawRows, detectedHdrRow);

  document.getElementById('headerRowInput').value = detectedHdrRow + 1;
  updateHeaderHint();
  buildMappingUI();
}

// ── Header Detection ──────────────────────────────────────────────
//   Scans first 25 non-empty rows and scores each for being a header.
//   Scoring: proportion of string cells + synonym recognition bonus.
function detectHeaderRow(rows) {
  let best = { score: -1, idx: 0 };
  const limit = Math.min(25, rows.length);

  for (let i = 0; i < limit; i++) {
    const cells = rows[i].map(c => String(c).trim()).filter(c => c !== '');
    if (cells.length < 2) continue;

    // Strings vs numbers ratio
    const strCells  = cells.filter(c => isNaN(Number(c)));
    const strRatio  = strCells.length / cells.length;

    // Synonym bonus — how many cells match a known Salesbuildr field name?
    const synBonus  = strCells.reduce((acc, cell) => {
      const lower = cell.toLowerCase();
      const hit = Object.values(SYNONYMS).some(syns =>
        syns.some(s => lower === s || lower === s.replace(/[^a-z0-9]/g,' ').trim())
      );
      return acc + (hit ? 6 : 0);
    }, 0);

    // Wider rows are more likely headers (up to a cap)
    const widthBonus = Math.min(cells.length, 15) * 0.4;

    const score = strRatio * 12 + synBonus + widthBonus;
    if (score > best.score) best = { score, idx: i };
  }
  return best.idx;
}

function extractHeaders(rows, rowIdx) {
  if (!rows[rowIdx]) return [];
  return rows[rowIdx]
    .map(h => String(h).trim())
    .filter(h => h !== '');
}

function updateHeaderHint() {
  const hint = document.getElementById('headerHint');
  const preview = columnHeaders.slice(0, 3);
  const more = columnHeaders.length > 3 ? '…' : '';
  hint.textContent = preview.length
    ? `(found: "${preview.join('", "')}"${more})`
    : '(no headers found — try adjusting the row number)';
}

// ── Fuzzy Column Matching ─────────────────────────────────────────
function scoreHeaderMatch(header, fieldKey) {
  const syns  = SYNONYMS[fieldKey] || [];
  const lower = header.toLowerCase().trim();

  // Exact match
  for (const s of syns) {
    if (lower === s) return 100;
  }
  // Normalised exact (strip punctuation)
  const norm = lower.replace(/[^a-z0-9\s]/g, '').trim();
  for (const s of syns) {
    if (norm === s.replace(/[^a-z0-9\s]/g, '').trim()) return 90;
  }
  // Contains: the header contains the synonym as a substring.
  // Only run this check for synonyms >= 5 chars. This prevents:
  //   • Short tokens like "pl", "sp", "gp" matching inside unrelated words.
  //   • "unit" (4 chars) firing on "Unit Price" → wrong Unit-of-Measure match.
  // We do NOT check synonym.includes(header) — that direction causes too many
  // false positives (e.g. "pl" found inside "uplift" → wrong Markup match).
  for (const s of syns) {
    if (s.length >= 5 && lower.includes(s)) return 55;
  }
  // Token overlap (handles multi-word column names with partial word matches)
  const lToks = lower.split(/[\s\/\-_()+.]+/).filter(Boolean);
  let maxOverlap = 0;
  for (const s of syns) {
    const sToks = s.split(/[\s\/\-_()+.]+/).filter(Boolean);
    const common = lToks.filter(t => sToks.includes(t)).length;
    if (common > 0) {
      const ratio = common / Math.max(lToks.length, sToks.length);
      maxOverlap = Math.max(maxOverlap, 30 * ratio);
    }
  }
  return maxOverlap;
}

function buildAutoMapping(headers) {
  // For each field, pick the header with the highest score (≥ 30 to qualify)
  return Object.fromEntries(
    FIELDS.map(f => {
      let best = { header: '', score: 0 };
      headers.forEach(h => {
        const s = scoreHeaderMatch(h, f.key);
        if (s > best.score) best = { header: h, score: s };
      });
      return [f.key, best.score >= 30 ? best.header : ''];
    })
  );
}

// ── Mapping UI ────────────────────────────────────────────────────
function buildMappingUI() {
  const mapping = buildAutoMapping(columnHeaders);
  const tbody   = document.getElementById('mappingBody');
  tbody.innerHTML = '';

  const opts = ['(not mapped)', ...columnHeaders];

  FIELDS.forEach(field => {
    const tr = document.createElement('tr');
    const val = mapping[field.key] || '';
    if (val) tr.classList.add('mapped');

    // Select element
    const sel = document.createElement('select');
    sel.className   = 'col-select';
    sel.dataset.field = field.key;
    opts.forEach(h => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = h;
      if (h === val) opt.selected = true;
      sel.appendChild(opt);
    });

    const sample = val ? getSampleValue(val) : '—';

    tr.innerHTML = `
      <td class="field-name">${field.label}</td>
      <td><span class="badge ${field.required ? 'required' : 'optional'}">
          ${field.required ? 'Required' : 'Optional'}</span></td>
      <td class="sel-cell"></td>
      <td class="sample-val" id="sv-${field.key}">${esc(sample)}</td>`;

    tr.querySelector('.sel-cell').appendChild(sel);
    tbody.appendChild(tr);

    sel.addEventListener('change', () => {
      const sv = document.getElementById(`sv-${field.key}`);
      const picked = sel.value;
      sv.textContent = (picked && picked !== '(not mapped)') ? getSampleValue(picked) : '—';
      tr.classList.toggle('mapped', picked !== '(not mapped)');
    });
  });
}

function getSampleValue(header) {
  // Find the column index in the header row, then look for a non-empty value
  const hRow = rawRows[detectedHdrRow] || [];
  const idx  = hRow.findIndex(h => String(h).trim() === header);
  if (idx < 0) return '—';

  for (let i = detectedHdrRow + 1; i < Math.min(detectedHdrRow + 10, rawRows.length); i++) {
    const v = rawRows[i][idx];
    const s = String(v ?? '').trim();
    if (s !== '') return s.substring(0, 60);
  }
  return '—';
}

// ── Conversion ────────────────────────────────────────────────────
function runConversion() {
  // Collect user mapping from selects
  const mapping = {};
  document.querySelectorAll('.col-select').forEach(sel => {
    const val = sel.value;
    if (val && val !== '(not mapped)') mapping[sel.dataset.field] = val;
  });

  // Validate required fields
  const missing = FIELDS.filter(f => f.required && !mapping[f.key]).map(f => f.label);
  if (missing.length) {
    showError(`Please map these required fields: ${missing.join(', ')}`);
    return;
  }

  // Build column index map: fieldKey → column index in raw row
  const hRow  = rawRows[detectedHdrRow] || [];
  const colIdx = {};
  Object.entries(mapping).forEach(([field, colName]) => {
    const i = hRow.findIndex(h => String(h).trim() === colName);
    if (i >= 0) colIdx[field] = i;
  });

  // Process data rows
  convertedData = [];
  for (let i = detectedHdrRow + 1; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Skip entirely empty rows
    if (!row.some(c => String(c).trim() !== '')) continue;

    // Skip rows with no MPN value — these are often section headers in vendor files
    if (colIdx.MPN !== undefined) {
      if (String(row[colIdx.MPN] ?? '').trim() === '') continue;
    }

    const out = {};
    FIELDS.forEach(f => {
      let val = colIdx[f.key] !== undefined ? row[colIdx[f.key]] : '';

      // Normalise value
      if (val === null || val === undefined) val = '';

      if (val instanceof Date) {
        // Format dates as YYYY-MM-DD
        val = val.toISOString().split('T')[0];
      } else if (typeof val === 'number') {
        // Round floats to 4 decimal places; Excel sometimes gives tiny fp errors
        val = parseFloat(val.toFixed(4));
      } else {
        val = String(val).trim();
        // Strip currency symbols and thousands separators from price fields
        if (['Cost','MSRP','Sales Price','Markup','Margin'].includes(f.key)) {
          val = val.replace(/[$€£AU,\s]/g, '');
        }
      }

      out[f.key] = val;
    });

    convertedData.push(out);
  }

  if (convertedData.length === 0) {
    showError('No product rows were found. Try adjusting the header row number, or check the sheet selected.');
    return;
  }

  renderPreview();
  document.getElementById('step-export').classList.remove('hidden');
  document.getElementById('step-export').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Preview ───────────────────────────────────────────────────────
function renderPreview() {
  const sample = convertedData.slice(0, 5);
  const keys   = FIELDS.map(f => f.key);

  document.getElementById('statsLine').textContent =
    `✓ ${convertedData.length} row${convertedData.length !== 1 ? 's' : ''} ready to import`;

  // Build table
  const wrap = document.createElement('div');
  wrap.className = 'preview-scroll';

  const tbl = document.createElement('table');
  tbl.className = 'preview-tbl';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  sample.forEach(row => {
    const tr = document.createElement('tr');
    keys.forEach(k => {
      const td = document.createElement('td');
      td.textContent = row[k] ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  wrap.appendChild(tbl);

  const container = document.getElementById('previewTable');
  container.innerHTML = '';
  container.appendChild(wrap);
}

// ── CSV Builder ───────────────────────────────────────────────────
function buildCSV() {
  const keys  = FIELDS.map(f => f.key);
  const lines = [keys.join(',')];  // header row

  convertedData.forEach(row => {
    const cells = keys.map(k => {
      let v = String(row[k] ?? '');
      // Quote fields that contain commas, quotes, or newlines
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    });
    lines.push(cells.join(','));
  });

  return lines.join('\n');
}

// ── Export: Download ──────────────────────────────────────────────
function triggerDownload() {
  const csv  = buildCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: 'salesbuildr-special-bid.csv',
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export: Copy to Clipboard ─────────────────────────────────────
function triggerCopy() {
  const csv = buildCSV();
  const btn = document.getElementById('copyBtn');

  const onSuccess = () => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    btn.classList.add('success');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('success');
    }, 2200);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(csv).then(onSuccess).catch(() => fallbackCopy(csv, onSuccess));
  } else {
    fallbackCopy(csv, onSuccess);
  }
}

function fallbackCopy(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text,
    readOnly: true,
    style: 'position:fixed;top:-9999px;opacity:0',
  });
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
  cb();
}

// ── Reset ─────────────────────────────────────────────────────────
function resetAll() {
  workbook = null; rawRows = []; convertedData = []; columnHeaders = [];

  document.getElementById('fileInput').value        = '';
  document.getElementById('fileInfo').innerHTML     = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('step-mapping').classList.add('hidden');
  document.getElementById('step-export').classList.add('hidden');
  document.getElementById('sheetSelectorWrap').classList.add('hidden');
  document.getElementById('mappingBody').innerHTML  = '';
  document.getElementById('previewTable').innerHTML = '';
  document.getElementById('statsLine').textContent  = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Utility Helpers ───────────────────────────────────────────────
function showError(msg) {
  document.querySelectorAll('.error-msg').forEach(el => el.remove());
  const div = Object.assign(document.createElement('div'), {
    className: 'error-msg',
    textContent: msg,
  });
  document.querySelector('.container').prepend(div);
  setTimeout(() => div.remove(), 7000);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function countNonEmptyRows(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  return rows.filter(r => r.some(c => String(c).trim() !== '')).length;
}
