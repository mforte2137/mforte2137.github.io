/* ================================================================
   Salesbuildr — Special Bid Converter  v2
   converter.js

   File parsing runs entirely in the browser (SheetJS).
   Two new Netlify function calls:
     /api/bid-analyze  — Claude Haiku analyses file structure
     /api/bid-push     — Pushes products to Salesbuildr API
   Both degrade gracefully if unavailable.
   ================================================================ */

'use strict';

const LS_API_KEY = 'sb_api_key';
const LS_INT_KEY = 'sb_int_key';

// ── Salesbuildr Special Bid field definitions ─────────────
// Order matches the template column order exactly.
const FIELDS = [
  { key: 'MPN',          label: 'MPN',          required: true  },
  { key: 'Name',         label: 'Name',         required: true  },
  { key: 'Description',  label: 'Description',  required: false },
  { key: 'Sales Price',  label: 'Sales Price',  required: false },
  { key: 'Markup',       label: 'Markup',       required: false },
  { key: 'Margin',       label: 'Margin',       required: false },
  { key: 'Cost',         label: 'Cost',         required: true  },
  { key: 'MSRP',         label: 'MSRP',         required: false },
  { key: 'Category',     label: 'Category',     required: false },
  { key: 'Unit',         label: 'Unit',         required: false },
  { key: 'Term',         label: 'Term',         required: false },
  { key: 'Manufacturer', label: 'Manufacturer', required: false },
  { key: 'Distributor',  label: 'Distributor',  required: false },
  { key: 'Quantity',     label: 'Quantity',     required: false },
];

// ── Synonym library ───────────────────────────────────────
const SYNONYMS = {
  MPN: [
    'mpn','part number','part no','part #','pn','sku','item #','item number',
    'vendor part code','vendor part','product no','product number','product id',
    'vendor code','part code','bundle id/part code','bundle id','material',
    'im material','article no','article number','catalog number','catalogue number',
    'model number','model','order code','vendor pn','mfr part','mfr part number',
    'manuf part','supplier part','reference','ref','stock code','item code','product code',
  ],
  Name: [
    'name','product name','item name','title','product title','short name','product','short description',
  ],
  Description: [
    'description','product description','item description','long description','desc',
    'details','product details','full description','extended description',
  ],
  'Sales Price': [
    'sales price','sell price','selling price','sale price','customer price',
    'end customer price','resell price',
  ],
  Markup:  ['markup','mark up','mark-up','uplift'],
  Margin:  ['margin','gp%','gross margin','gp','profit margin','margin %'],
  Cost: [
    'cost','unit price','reseller unit buy','net price','buy price','dealer price',
    'your price','per unit','per unit au$','unit cost','reseller price','partner price',
    'partner cost','trade price','net','unit net','reseller net','distributor price',
    'purchase price','wholesale price','wholesale','buy in','buy-in','special price',
    'special bid price','bid price',
  ],
  MSRP: [
    'msrp','rrp','list price','retail price','recommended retail','srp',
    'suggested retail','rsp','recommended price','manufacturer price','public price',
    'rp','standard price','street price',
  ],
  Category: [
    'category','product type','type','product category','group','product group',
    'family','product family','class','product class','pl','product line',
  ],
  Unit: ['unit','uom','unit of measure','unit type','unit of measurement'],
  Term: [
    'term','contract term','subscription term','period','duration',
    'license term','service term','coverage term',
  ],
  Manufacturer: [
    'manufacturer','vendor','brand','mfr','make','mfg','oem','mfr name',
    'manufacturer name','brand name','vendor name',
  ],
  Distributor: [
    'distributor','source','channel','disti','dist','sold by','fulfilled by',
    'wholesaler','supplier name',
  ],
  Quantity: [
    'quantity','qty','min','minimum','min per order','min qty','ordered qty',
    'order qty','amount','units','count','no of units','min order','minimum order',
    'available qty','remaining qty','stock','soh',
  ],
};

// ── Runtime state ─────────────────────────────────────────
let workbook       = null;
let rawRows        = [];
let detectedHdrRow = 0;
let columnHeaders  = [];
let convertedData  = [];
let aiAnalysis     = null;    // result from bid-analyze
let excludePattern = null;    // { column, rule } for section header rows
let aiMappings     = {};      // fieldKey → vendorColumn from Claude

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const dropZone       = document.getElementById('dropZone');
  const fileInput      = document.getElementById('fileInput');
  const sheetSelect    = document.getElementById('sheetSelect');
  const headerRowInput = document.getElementById('headerRowInput');

  // Drag & drop
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  });
  dropZone.addEventListener('click', e => { if (!e.target.closest('label')) fileInput.click(); });
  fileInput.addEventListener('change', e => { const f = e.target.files[0]; if (f) processFile(f); });
  sheetSelect.addEventListener('change', e => reloadSheet(e.target.value));
  headerRowInput.addEventListener('change', () => {
    const row = Math.max(1, parseInt(headerRowInput.value) || 1) - 1;
    detectedHdrRow = row;
    headerRowInput.value = row + 1;
    columnHeaders = extractHeaders(rawRows, detectedHdrRow);
    updateHeaderHint();
    buildMappingUI();
  });
  document.querySelectorAll('input[name="pricingMode"]').forEach(r => r.addEventListener('change', updatePricingHint));
  document.getElementById('pricingPct').addEventListener('input', updatePricingHint);
  document.getElementById('applyBtn').addEventListener('click', runConversion);
  document.getElementById('downloadBtn').addEventListener('click', triggerDownload);
  document.getElementById('copyBtn').addEventListener('click', triggerCopy);
  document.getElementById('startOverBtn').addEventListener('click', resetAll);

  // Salesbuildr connect
  initSalesbuildrConnect();
});

// ── File Processing ───────────────────────────────────────
function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls','csv'].includes(ext)) { showError('Please upload an .xlsx, .xls, or .csv file.'); return; }

  const banner = document.getElementById('fileInfo');
  banner.innerHTML = `<div class="file-info"><span class="fi-icon">📄</span><span class="fi-name">${esc(file.name)}</span><span class="fi-size">${fmtBytes(file.size)}</span></div>`;
  banner.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = e => {
    try {
      workbook = XLSX.read(new Uint8Array(e.target.result), { type:'array', cellDates:true, cellText:false });
      setupSheetPicker();
    } catch { showError('Could not read the file. Please check it is a valid Excel or CSV file.'); }
  };
  reader.readAsArrayBuffer(file);
}

function setupSheetPicker() {
  const sheets = workbook.SheetNames;
  const sel    = document.getElementById('sheetSelect');
  sel.innerHTML = '';
  sheets.forEach(name => { const o = document.createElement('option'); o.value = o.textContent = name; sel.appendChild(o); });

  let bestSheet = sheets[0];
  if (sheets.length > 1) {
    let best = 0;
    sheets.forEach(name => { const c = countNonEmptyRows(workbook.Sheets[name]); if (c > best) { best = c; bestSheet = name; } });
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
  rawRows  = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
  rawRows  = rawRows.filter(r => r.some(c => String(c).trim() !== ''));

  // Reset AI state for new sheet
  aiAnalysis    = null;
  aiMappings    = {};
  excludePattern= null;

  detectedHdrRow = detectHeaderRow(rawRows);
  columnHeaders  = extractHeaders(rawRows, detectedHdrRow);
  document.getElementById('headerRowInput').value = detectedHdrRow + 1;
  updateHeaderHint();
  buildMappingUI();

  // Kick off Claude analysis (non-blocking)
  runAiAnalysis(sheetName);
}

// ── Claude AI Analysis ────────────────────────────────────
async function runAiAnalysis(sheetName) {
  const panel = document.getElementById('aiPanel');
  const status = document.getElementById('aiStatus');
  const spinner = document.getElementById('aiSpinner');
  const notes  = document.getElementById('aiNotes');

  panel.classList.remove('hidden');
  status.textContent = 'Analysing file structure with AI…';
  spinner.style.display = 'block';
  notes.classList.add('hidden');

  try {
    const sample = rawRows.slice(0, 25).map(row =>
      row.map(c => (c === null || c === undefined) ? '' : String(c).trim().slice(0, 60))
    );

    const res  = await fetch('/api/bid-analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows: sample, sheetName })
    });
    const data = await res.json();

    if (!data.ok || !data.analysis) throw new Error(data.error || 'No analysis returned');

    aiAnalysis = data.analysis;

    // Apply header row suggestion if different from auto-detected
    if (typeof aiAnalysis.headerRowIndex === 'number' && aiAnalysis.headerRowIndex !== detectedHdrRow) {
      detectedHdrRow = aiAnalysis.headerRowIndex;
      columnHeaders  = extractHeaders(rawRows, detectedHdrRow);
      document.getElementById('headerRowInput').value = detectedHdrRow + 1;
      updateHeaderHint();
    }

    // Store section header exclusion pattern
    if (aiAnalysis.sectionHeaderColumn >= 0 && aiAnalysis.sectionHeaderExamples?.length) {
      excludePattern = {
        column:   aiAnalysis.sectionHeaderColumn,
        examples: aiAnalysis.sectionHeaderExamples,
        rule:     aiAnalysis.sectionHeaderRule || ''
      };
      const notice = document.getElementById('excludeNotice');
      document.getElementById('excludeText').textContent =
        `${aiAnalysis.sectionHeaderExamples.length} type(s) of section header rows detected and will be excluded from import. ${aiAnalysis.sectionHeaderRule || ''}`;
      notice.classList.remove('hidden');
    }

    // Build AI mapping lookup: salesbuildrField → vendorColumn
    aiMappings = {};
    (aiAnalysis.columnMappings || []).forEach(m => {
      if (m.salesbuildrField && m.confidence !== 'low') {
        aiMappings[m.salesbuildrField] = m.vendorColumn;
      }
    });

    // Rebuild mapping UI with AI suggestions applied
    buildMappingUI();

    // Show notes — parse basic markdown and newlines
    status.textContent = '✓ AI analysis complete';
    spinner.style.display = 'none';
    if (aiAnalysis.notes) {
      notes.innerHTML = formatAiNotes(aiAnalysis.notes);
      notes.classList.remove('hidden');
    }

  } catch (err) {
    // Silent fallback — tool works without AI
    status.textContent = '(AI analysis unavailable — using built-in matching)';
    spinner.style.display = 'none';
  }
}

// ── Section header detection ──────────────────────────────
function isSectionHeaderRow(row) {
  if (!excludePattern) return false;
  const { column, examples } = excludePattern;
  const cellVal = String(row[column] ?? '').trim();
  if (!cellVal) return false;
  // Check if this cell matches any known section header example
  const lower = cellVal.toLowerCase();
  if (examples.some(e => lower === e.toLowerCase())) return true;
  // Heuristic: the MPN-column value has spaces and no digits (it's a label, not a part code)
  if (column <= 2 && cellVal.includes(' ') && !/\d/.test(cellVal)) return true;
  return false;
}

// ── Pricing Hint ──────────────────────────────────────────
function updatePricingHint() {
  const mode = document.querySelector('input[name="pricingMode"]:checked').value;
  const pct  = parseFloat(document.getElementById('pricingPct').value);
  const hint = document.getElementById('pricingHint');
  if (isNaN(pct) || pct <= 0) {
    hint.textContent = mode === 'markup' ? 'e.g. 25 → Sales Price = Cost × 1.25 · Leave blank to skip' : 'e.g. 25 → Sales Price = Cost ÷ 0.75 · Leave blank to skip';
    return;
  }
  const exCost = 100;
  let sell, equiv;
  if (mode === 'markup') {
    sell = exCost * (1 + pct / 100);
    equiv = `= ${(pct / (100 + pct) * 100).toFixed(1)}% margin`;
  } else {
    if (pct >= 100) { hint.textContent = 'Margin must be less than 100%'; return; }
    sell = exCost / (1 - pct / 100);
    equiv = `= ${(pct / (100 - pct) * 100).toFixed(1)}% markup`;
  }
  hint.textContent = `${pct}% ${mode} on $${exCost} cost → $${sell.toFixed(2)} sell price  (${equiv})`;
}

// ── Header Detection ──────────────────────────────────────
function detectHeaderRow(rows) {
  let best = { score: -1, idx: 0 };
  const limit = Math.min(25, rows.length);
  for (let i = 0; i < limit; i++) {
    const cells = rows[i].map(c => String(c).trim()).filter(c => c !== '');
    if (cells.length < 2) continue;
    const strCells = cells.filter(c => isNaN(Number(c)));
    const strRatio = strCells.length / cells.length;
    const synBonus = strCells.reduce((acc, cell) => {
      const lower = cell.toLowerCase();
      const hit = Object.values(SYNONYMS).some(syns => syns.some(s => lower === s || lower === s.replace(/[^a-z0-9]/g,' ').trim()));
      return acc + (hit ? 6 : 0);
    }, 0);
    const widthBonus = Math.min(cells.length, 15) * 0.4;
    const score = strRatio * 12 + synBonus + widthBonus;
    if (score > best.score) best = { score, idx: i };
  }
  return best.idx;
}

function extractHeaders(rows, rowIdx) {
  if (!rows[rowIdx]) return [];
  return rows[rowIdx].map(h => String(h).trim()).filter(h => h !== '');
}

function updateHeaderHint() {
  const hint = document.getElementById('headerHint');
  const preview = columnHeaders.slice(0, 3);
  const more = columnHeaders.length > 3 ? '…' : '';
  hint.textContent = preview.length ? `(found: "${preview.join('", "')}"${more})` : '(no headers found — try adjusting the row number)';
}

// ── Fuzzy Column Matching ─────────────────────────────────
function scoreHeaderMatch(header, fieldKey) {
  const syns  = SYNONYMS[fieldKey] || [];
  const lower = header.toLowerCase().trim();
  for (const s of syns) { if (lower === s) return 100; }
  const norm = lower.replace(/[^a-z0-9\s]/g, '').trim();
  for (const s of syns) { if (norm === s.replace(/[^a-z0-9\s]/g, '').trim()) return 90; }
  for (const s of syns) { if (s.length >= 5 && lower.includes(s)) return 55; }
  const lToks = lower.split(/[\s\/\-_()+.]+/).filter(Boolean);
  let maxOverlap = 0;
  for (const s of syns) {
    const sToks = s.split(/[\s\/\-_()+.]+/).filter(Boolean);
    const common = lToks.filter(t => sToks.includes(t)).length;
    if (common > 0) { const ratio = common / Math.max(lToks.length, sToks.length); maxOverlap = Math.max(maxOverlap, 30 * ratio); }
  }
  return maxOverlap;
}

function buildAutoMapping(headers) {
  const mapping = Object.fromEntries(
    FIELDS.map(f => {
      let best = { header: '', score: 0 };
      headers.forEach(h => { const s = scoreHeaderMatch(h, f.key); if (s > best.score) best = { header: h, score: s }; });
      return [f.key, best.score >= 30 ? best.header : ''];
    })
  );
  if (mapping['Name'] && mapping['Name'] === mapping['MPN']) mapping['Name'] = '';
  if (!mapping['Name'] && mapping['Description']) mapping['Name'] = mapping['Description'];
  return mapping;
}

// ── Mapping UI ────────────────────────────────────────────
function buildMappingUI() {
  const autoMapping = buildAutoMapping(columnHeaders);
  const tbody = document.getElementById('mappingBody');
  tbody.innerHTML = '';
  const opts = ['(not mapped)', ...columnHeaders];

  FIELDS.forEach(field => {
    const tr = document.createElement('tr');

    // Determine value: AI mapping takes priority over auto-match
    const aiVal   = aiMappings[field.key] || '';
    const autoVal = autoMapping[field.key] || '';
    const val     = (aiVal && columnHeaders.includes(aiVal)) ? aiVal : autoVal;
    const isAi    = aiVal && columnHeaders.includes(aiVal);

    if (val)  tr.classList.add('mapped');
    if (isAi) tr.classList.add('ai-mapped');

    const sel = document.createElement('select');
    sel.className = 'col-select';
    sel.dataset.field = field.key;
    opts.forEach(h => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = h;
      if (h === val) opt.selected = true;
      sel.appendChild(opt);
    });

    const fixedWrap = document.createElement('div');
    fixedWrap.className = 'fixed-wrap' + (val ? ' hidden' : '');
    const fixedInp = document.createElement('input');
    fixedInp.type = 'text';
    fixedInp.className = 'fixed-input';
    fixedInp.dataset.field = field.key;
    fixedInp.placeholder = 'or type a fixed value for all rows…';
    fixedWrap.appendChild(fixedInp);

    const aiNote = isAi ? `<div class="ai-map-note"><span class="ai-badge">AI</span> ${aiAnalysis?.columnMappings?.find(m => m.salesbuildrField === field.key)?.note || 'AI suggestion'}</div>` : '';
    const sample = val ? getSampleValue(val) : '—';
    tr.innerHTML = `
      <td class="field-name">${field.label}</td>
      <td><span class="badge ${field.required ? 'required' : 'optional'}">${field.required ? 'Required' : 'Optional'}</span></td>
      <td class="sel-cell">${aiNote}</td>
      <td class="sample-val" id="sv-${field.key}">${esc(sample)}</td>`;

    const selCell = tr.querySelector('.sel-cell');
    selCell.insertBefore(sel, selCell.firstChild);
    selCell.appendChild(fixedWrap);
    tbody.appendChild(tr);

    sel.addEventListener('change', () => {
      const picked   = sel.value;
      const isMapped = picked !== '(not mapped)';
      const sv = document.getElementById(`sv-${field.key}`);
      fixedWrap.classList.toggle('hidden', isMapped);
      if (isMapped) fixedInp.value = '';
      sv.textContent = isMapped ? getSampleValue(picked) : (fixedInp.value.trim() || '—');
      tr.classList.toggle('mapped', isMapped || fixedInp.value.trim() !== '');
    });
    fixedInp.addEventListener('input', () => {
      const sv = document.getElementById(`sv-${field.key}`);
      const v = fixedInp.value.trim();
      sv.textContent = v || '—';
      tr.classList.toggle('mapped', v !== '');
    });
  });
}

function getSampleValue(header) {
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

// ── Conversion ────────────────────────────────────────────
function runConversion() {
  const colMapping = {};
  document.querySelectorAll('.col-select').forEach(sel => {
    if (sel.value && sel.value !== '(not mapped)') colMapping[sel.dataset.field] = sel.value;
  });
  const fixedVals = {};
  document.querySelectorAll('.fixed-input').forEach(inp => {
    const v = inp.value.trim();
    if (v) fixedVals[inp.dataset.field] = v;
  });

  const missing = FIELDS.filter(f => f.required && !colMapping[f.key] && !fixedVals[f.key]).map(f => f.label);
  if (missing.length) { showError(`Please map these required fields (or type a fixed value): ${missing.join(', ')}`); return; }

  const pricingMode   = document.querySelector('input[name="pricingMode"]:checked').value;
  const pricingPctRaw = parseFloat(document.getElementById('pricingPct').value);
  const pricingActive = !isNaN(pricingPctRaw) && pricingPctRaw > 0 && !(pricingMode === 'margin' && pricingPctRaw >= 100);
  const pricingPct    = pricingActive ? pricingPctRaw / 100 : null;

  const hRow   = rawRows[detectedHdrRow] || [];
  const colIdx = {};
  Object.entries(colMapping).forEach(([field, colName]) => {
    const i = hRow.findIndex(h => String(h).trim() === colName);
    if (i >= 0) colIdx[field] = i;
  });

  convertedData = [];
  for (let i = detectedHdrRow + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row.some(c => String(c).trim() !== '')) continue;
    // Skip section header rows (AI-detected or heuristic)
    if (isSectionHeaderRow(row)) continue;
    // Skip rows with no MPN value
    if (colIdx.MPN !== undefined && String(row[colIdx.MPN] ?? '').trim() === '') continue;

    const out = {};
    FIELDS.forEach(f => {
      let val;
      if (fixedVals[f.key]) { val = fixedVals[f.key]; }
      else if (colIdx[f.key] !== undefined) { val = row[colIdx[f.key]]; }
      else { val = ''; }
      if (val === null || val === undefined) val = '';
      if (val instanceof Date) { val = val.toISOString().split('T')[0]; }
      else if (typeof val === 'number') { val = parseFloat(val.toFixed(4)); }
      else {
        val = String(val).trim();
        if (['Cost','MSRP','Sales Price','Markup','Margin'].includes(f.key)) {
          val = val.replace(/[$€£,]/g,'').replace(/\bAU\b/g,'').replace(/%/g,'').trim();
        }
      }
      out[f.key] = val;
    });

    // Pricing calculation
    if (pricingPct !== null) {
      const hasSalesPrice = colIdx['Sales Price'] !== undefined || fixedVals['Sales Price'];
      const hasMarkup     = colIdx['Markup']      !== undefined || fixedVals['Markup'];
      const hasMargin     = colIdx['Margin']       !== undefined || fixedVals['Margin'];
      const cost = parseFloat(out['Cost']);
      if (!isNaN(cost) && cost > 0) {
        let sellPrice, markupDec, marginDec;
        if (pricingMode === 'markup') {
          sellPrice = cost * (1 + pricingPct); markupDec = pricingPct; marginDec = pricingPct / (1 + pricingPct);
        } else {
          sellPrice = cost / (1 - pricingPct); marginDec = pricingPct; markupDec = pricingPct / (1 - pricingPct);
        }
        if (!hasSalesPrice) out['Sales Price'] = parseFloat(sellPrice.toFixed(2));
        if (!hasMarkup)     out['Markup']      = parseFloat((markupDec * 100).toFixed(2)); // store as % not decimal
        if (!hasMargin)     out['Margin']       = parseFloat((marginDec * 100).toFixed(2));
      }
    }

    convertedData.push(out);
  }

  if (convertedData.length === 0) { showError('No product rows found. Try adjusting the header row or checking the sheet selected.'); return; }

  renderPreview();
  document.getElementById('step-export').classList.remove('hidden');
  document.getElementById('step-export').scrollIntoView({ behavior:'smooth', block:'start' });

  // Auto-open connect panel and load categories if credentials are already saved
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  if (savedApi && savedInt) {
    document.getElementById('sbBody').hidden = false;
    document.getElementById('sbArrow').classList.add('open');
    fetchCategories();
  }
}

// ── Preview ───────────────────────────────────────────────
function renderPreview() {
  const sample = convertedData.slice(0, 5);
  const keys   = FIELDS.map(f => f.key);
  document.getElementById('statsLine').textContent =
    `✓ ${convertedData.length} row${convertedData.length !== 1 ? 's' : ''} ready to import`;
  const wrap  = document.createElement('div'); wrap.className = 'preview-scroll';
  const tbl   = document.createElement('table'); tbl.className = 'preview-tbl';
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
  tbl.appendChild(thead);
  const tbody = document.createElement('tbody');
  sample.forEach(row => {
    const tr = document.createElement('tr');
    keys.forEach(k => { const td = document.createElement('td'); td.textContent = row[k] ?? ''; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody); wrap.appendChild(tbl);
  const container = document.getElementById('previewTable');
  container.innerHTML = ''; container.appendChild(wrap);
}

// ── CSV Build & Export ────────────────────────────────────
function buildCSV() {
  const keys = FIELDS.map(f => f.key);
  const lines = [keys.join(',')];
  convertedData.forEach(row => {
    const cells = keys.map(k => {
      let v = String(row[k] ?? '');
      if (v.includes(',') || v.includes('"') || v.includes('\n')) v = '"' + v.replace(/"/g,'""') + '"';
      return v;
    });
    lines.push(cells.join(','));
  });
  return lines.join('\n');
}

function triggerDownload() {
  const csv  = buildCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href:url, download:'salesbuildr-special-bid.csv' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function triggerCopy() {
  const csv = buildCSV();
  const btn = document.getElementById('copyBtn');
  const onSuccess = () => {
    const orig = btn.innerHTML; btn.innerHTML = '✓ Copied!'; btn.classList.add('success');
    setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('success'); }, 2200);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(csv).then(onSuccess).catch(() => fallbackCopy(csv, onSuccess));
  } else { fallbackCopy(csv, onSuccess); }
}

function fallbackCopy(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), { value:text, readOnly:true, style:'position:fixed;top:-9999px;opacity:0' });
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta); cb();
}

// ── Salesbuildr Connect & Push ────────────────────────────
function initSalesbuildrConnect() {
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  const apiInput = document.getElementById('sbApiKey');
  const intInput = document.getElementById('sbIntKey');
  if (savedApi) apiInput.value = savedApi;
  if (savedInt) intInput.value = savedInt;
  if (savedApi && savedInt) document.getElementById('sbRemember').checked = true;

  document.getElementById('sbToggle').addEventListener('click', () => {
    const body  = document.getElementById('sbBody');
    const arrow = document.getElementById('sbArrow');
    const isOpen = !body.hidden;
    body.hidden = isOpen;
    arrow.classList.toggle('open', !isOpen);
    if (!isOpen && apiInput.value.trim() && intInput.value.trim()) {
      fetchCategories();
    }
  });

  document.getElementById('fetchCatsBtn').addEventListener('click', fetchCategories);
  document.getElementById('sbApiKey').addEventListener('input', updatePushBtn);
  document.getElementById('sbIntKey').addEventListener('input', updatePushBtn);
  document.getElementById('categorySelect').addEventListener('change', updatePushBtn);
  document.getElementById('pushBtn').addEventListener('click', pushToSalesbuildr);
}

function updatePushBtn() {
  const apiKey = document.getElementById('sbApiKey').value.trim();
  const intKey = document.getElementById('sbIntKey').value.trim();
  const catId  = document.getElementById('categorySelect').value;
  const btn    = document.getElementById('pushBtn');
  btn.disabled = !(apiKey && intKey && catId && convertedData.length > 0);
}

async function fetchCategories() {
  const apiKey = document.getElementById('sbApiKey').value.trim();
  const intKey = document.getElementById('sbIntKey').value.trim();
  if (!apiKey || !intKey) return;

  const status = document.getElementById('categoryStatus');
  const sel    = document.getElementById('categorySelect');
  const section= document.getElementById('categorySection');

  section.classList.remove('hidden');
  status.textContent = 'Loading categories…';
  status.className   = 'category-status loading';
  status.classList.remove('hidden');

  try {
    const res  = await fetch('/api/bid-push', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action:'categories', apiKey, integrationKey:intKey })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Could not fetch categories');

    sel.innerHTML = '<option value="">— Select a category —</option>';
    (data.categories || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });

    status.classList.add('hidden');
    updatePushBtn();

  } catch (err) {
    status.textContent = `Could not load categories: ${err.message}`;
    status.className   = 'category-status error';
    status.classList.remove('hidden');
  }
}

async function pushToSalesbuildr() {
  const apiKey  = document.getElementById('sbApiKey').value.trim();
  const intKey  = document.getElementById('sbIntKey').value.trim();
  const catId   = document.getElementById('categorySelect').value;
  const enrich  = document.getElementById('enrichToggle').checked;
  const btn     = document.getElementById('pushBtn');
  const progress= document.getElementById('pushProgress');
  const bar     = document.getElementById('progressBar');
  const pText   = document.getElementById('progressText');
  const result  = document.getElementById('pushResult');

  if (!apiKey || !intKey || !catId) return;

  if (document.getElementById('sbRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  btn.disabled    = true;
  btn.textContent = 'Pushing…';
  result.hidden   = true;
  progress.classList.remove('hidden');

  const BATCH = 100;
  const batches = [];
  for (let i = 0; i < convertedData.length; i += BATCH) batches.push(convertedData.slice(i, i + BATCH));

  let totalPushed = 0, totalErrors = 0;

  for (let b = 0; b < batches.length; b++) {
    const pct = Math.round(((b) / batches.length) * 100);
    bar.style.width    = pct + '%';
    pText.textContent  = `Pushing batch ${b + 1} of ${batches.length} (${totalPushed} products sent so far)…`;

    try {
      const res  = await fetch('/api/bid-push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action:'push', rows:batches[b], categoryId:catId, apiKey, integrationKey:intKey, enrich })
      });
      const data = await res.json();
      if (data.ok) {
        totalPushed += data.pushed || batches[b].length;
      } else {
        totalErrors += batches[b].length;
        console.error(`Batch ${b + 1} failed:`, data.error);
      }
    } catch (err) {
      totalErrors += batches[b].length;
      console.error(`Batch ${b + 1} error:`, err);
    }
  }

  bar.style.width   = '100%';
  pText.textContent = 'Done.';

  if (totalErrors === 0) {
    result.textContent = `✓ ${totalPushed} product${totalPushed !== 1 ? 's' : ''} pushed to Salesbuildr successfully. Check your product library.`;
    result.className   = 'push-result ok';
    btn.textContent    = '✓ Pushed to Salesbuildr';
    btn.classList.add('is-done');
  } else if (totalPushed > 0) {
    result.textContent = `${totalPushed} products pushed · ${totalErrors} failed. Check your product library and console for details.`;
    result.className   = 'push-result ok';
    btn.disabled       = false;
    btn.textContent    = 'Push to Salesbuildr →';
  } else {
    result.textContent = `Push failed — ${totalErrors} products could not be created. Check your credentials and try again.`;
    result.className   = 'push-result error';
    btn.disabled       = false;
    btn.textContent    = 'Push to Salesbuildr →';
  }
  result.hidden = false;
}

// ── Reset ─────────────────────────────────────────────────
function resetAll() {
  workbook = null; rawRows = []; convertedData = []; columnHeaders = [];
  aiAnalysis = null; aiMappings = {}; excludePattern = null;
  document.getElementById('fileInput').value        = '';
  document.getElementById('fileInfo').innerHTML     = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('aiPanel').classList.add('hidden');
  document.getElementById('step-mapping').classList.add('hidden');
  document.getElementById('step-export').classList.add('hidden');
  document.getElementById('sheetSelectorWrap').classList.add('hidden');
  document.getElementById('excludeNotice').classList.add('hidden');
  document.getElementById('mappingBody').innerHTML  = '';
  document.getElementById('previewTable').innerHTML = '';
  document.getElementById('statsLine').textContent  = '';
  document.getElementById('pricingPct').value        = '';
  document.getElementById('pushResult').hidden       = true;
  document.getElementById('pushProgress').classList.add('hidden');
  document.getElementById('pushBtn').textContent = 'Push to Salesbuildr →';
  document.getElementById('pushBtn').classList.remove('is-done');
  document.getElementById('pushBtn').disabled = true;
  document.getElementById('progressBar').style.width = '0%';
  updatePricingHint();
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ── Utilities ─────────────────────────────────────────────
function formatAiNotes(text) {
  // Escape HTML first to prevent XSS
  let s = String(text)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // Convert **bold** markdown
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert literal \n sequences and real newlines to <br>
  s = s.replace(/\\n/g, '\n').replace(/\n/g, '<br>');
  return s;
}

function showError(msg) {
  document.querySelectorAll('.error-msg').forEach(el => el.remove());
  const div = Object.assign(document.createElement('div'), { className:'error-msg', textContent:msg });
  document.querySelector('.container').prepend(div);
  setTimeout(() => div.remove(), 7000);
}
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
function countNonEmptyRows(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, { header:1, defval:'' });
  return rows.filter(r => r.some(c => String(c).trim() !== '')).length;
}
