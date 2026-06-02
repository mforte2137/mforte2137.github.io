/* ============================================================
   PRODUCT CLEANUP — JS
   Fetches products by stock status group (real data from SB),
   triages into four buckets, runs optional AI analysis for
   notes, and supports bulk unlisting via the Salesbuildr API.
   ============================================================ */

// ── DOM REFS ──────────────────────────────────────────────────
const tenantUrlInput   = document.getElementById('tenantUrl');
const apiKeyInput      = document.getElementById('apiKey');
const loadBtn          = document.getElementById('loadBtn');
const credsError       = document.getElementById('credsError');
const headerMeta       = document.getElementById('headerMeta');

const loadingState     = document.getElementById('loadingState');
const loadingLabel     = document.getElementById('loadingLabel');
const loadingSub       = document.getElementById('loadingSub');
const dashboard        = document.getElementById('dashboard');
const emptyState       = document.getElementById('emptyState');

const analyzeBtn       = document.getElementById('analyzeBtn');
const exportBtn        = document.getElementById('exportBtn');
const analysisSection  = document.getElementById('analysisSection');
const analysisProgress = document.getElementById('analysisProgress');
const analysisSummary  = document.getElementById('analysisSummary');

const bucketFilter     = document.getElementById('bucketFilter');
const tableSearch      = document.getElementById('tableSearch');
const tableTitle       = document.getElementById('tableTitle');
const tableCount       = document.getElementById('tableCount');
const productTableBody = document.getElementById('productTableBody');
const tablePagination  = document.getElementById('tablePagination');

const bulkBar          = document.getElementById('bulkBar');
const bulkCount        = document.getElementById('bulkCount');
const bulkUnlistBtn    = document.getElementById('bulkUnlistBtn');
const bulkClearBtn     = document.getElementById('bulkClearBtn');
const selectAllChk     = document.getElementById('selectAll');

const unlistModal      = document.getElementById('unlistModal');
const unlistModalBody  = document.getElementById('unlistModalBody');
const unlistConfirmBtn = document.getElementById('unlistConfirmBtn');
const unlistCancelBtn  = document.getElementById('unlistCancelBtn');
const progressModal    = document.getElementById('progressModal');
const unlistProgressBar   = document.getElementById('unlistProgressBar');
const unlistProgressLabel = document.getElementById('unlistProgressLabel');

// ── STATE ─────────────────────────────────────────────────────
let allProducts = [];      // all fetched products with .bucket already set
let aiNotes = {};          // id → { note, confidence } from AI analysis
let selectedIds = new Set();
let currentPage = 1;
const PAGE_SIZE = 50;
let activeBucketFilter = 'all';
let activeSearch = '';

// Stock groups → bucket mapping
// We fetch each group separately so every product gets a real stock-based bucket
const STOCK_GROUPS = [
  {
    bucket: 'green',
    filter: 'inStock|onlyDistributor|internal|lowStock',
    label:  'Ready to Sell',
  },
  {
    bucket: 'yellow',
    filter: 'backOrder|unavailable|custom',
    label:  'Needs Review',
  },
  {
    bucket: 'orange',
    filter: 'notFound',
    label:  'Likely Unlist / Unlist Candidate',
  },
];

// notFound products get split into orange (has MPN) or red (no MPN) client-side
const BUCKET_META = {
  green:  { label: 'Ready to Sell',    cls: 'bucket-badge--green'  },
  yellow: { label: 'Needs Review',     cls: 'bucket-badge--yellow' },
  orange: { label: 'Likely Unlist',    cls: 'bucket-badge--orange' },
  red:    { label: 'Unlist Candidate', cls: 'bucket-badge--red'    },
};

// Six months ago — used for not-quoted-since signal
function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  loadStoredCreds();
  loadBtn.addEventListener('click', handleLoad);
  analyzeBtn.addEventListener('click', handleAnalyze);
  exportBtn.addEventListener('click', handleExport);
  bucketFilter.addEventListener('change', () => {
    activeBucketFilter = bucketFilter.value;
    currentPage = 1;
    renderTable();
  });
  tableSearch.addEventListener('input', () => {
    activeSearch = tableSearch.value.trim().toLowerCase();
    currentPage = 1;
    renderTable();
  });
  bulkUnlistBtn.addEventListener('click', promptUnlist);
  bulkClearBtn.addEventListener('click', clearSelection);
  selectAllChk.addEventListener('change', handleSelectAll);
  unlistConfirmBtn.addEventListener('click', executeUnlist);
  unlistCancelBtn.addEventListener('click', () => { unlistModal.style.display = 'none'; });

  document.querySelectorAll('.bucket').forEach(el => {
    el.addEventListener('click', () => {
      const b = el.dataset.bucket;
      bucketFilter.value = b;
      activeBucketFilter = b;
      currentPage = 1;
      renderTable();
    });
  });
}

// ── CREDENTIALS ───────────────────────────────────────────────
function loadStoredCreds() {
  tenantUrlInput.value = localStorage.getItem('sb_tenant_url') || '';
  apiKeyInput.value    = localStorage.getItem('sb_api_key')    || '';
}
function saveCreds() {
  localStorage.setItem('sb_tenant_url', tenantUrlInput.value.trim());
  localStorage.setItem('sb_api_key',    apiKeyInput.value.trim());
}
function getCreds() {
  return {
    tenantUrl: tenantUrlInput.value.trim().replace(/\/$/, ''),
    apiKey:    apiKeyInput.value.trim(),
  };
}

// ── LOAD CATALOG ──────────────────────────────────────────────
async function handleLoad() {
  const { tenantUrl, apiKey } = getCreds();
  credsError.textContent = '';

  if (!tenantUrl || !apiKey) {
    credsError.textContent = 'Both Tenant URL and API Key are required.';
    return;
  }

  saveCreds();
  allProducts = [];
  selectedIds.clear();
  aiNotes = {};

  showLoading('Connecting to Salesbuildr…', 'Fetching product catalog by stock status');
  dashboard.style.display = 'none';
  emptyState.style.display = 'none';

  try {
    // Fetch each stock group separately so we get real per-product bucket assignment
    for (const group of STOCK_GROUPS) {
      updateLoadingLabel(
        `Fetching "${group.label}" products…`,
        `${allProducts.length} products loaded so far`
      );
      const products = await fetchProductGroup(tenantUrl, apiKey, group.filter);

      // Split notFound into orange (has MPN) vs red (no MPN)
      for (const p of products) {
        const hasMpn = p.mpn && p.mpn.trim() !== '';
        if (group.bucket === 'orange') {
          p.bucket = hasMpn ? 'orange' : 'red';
        } else {
          p.bucket = group.bucket;
        }
        p.stockGroup = group.filter; // keep for reference
      }

      allProducts.push(...products);
    }

    headerMeta.textContent = `${allProducts.length} products · ${new URL(tenantUrl).hostname}`;
    updateBucketCounts();
    showDashboard();
    renderTable();
  } catch (err) {
    showEmpty();
    credsError.textContent = `Error: ${err.message}`;
  }
}

async function fetchProductGroup(tenantUrl, apiKey, stockFilter) {
  const PAGE = 100;
  let from = 0;
  const results = [];

  while (true) {
    const resp = await fetch('/api/sb-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantUrl, apiKey, size: PAGE, from, stockFilter }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Proxy ${resp.status}: ${txt.slice(0, 120)}`);
    }

    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'Proxy error');

    results.push(...data.results);
    if (data.results.length < PAGE) break;
    from += PAGE;

    updateLoadingLabel(
      `Fetching products… (${allProducts.length + results.length} loaded)`,
      'Loading page by page'
    );
  }

  return results;
}

// ── BUCKET COUNTS ─────────────────────────────────────────────
function updateBucketCounts() {
  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const p of allProducts) {
    if (counts[p.bucket] !== undefined) counts[p.bucket]++;
  }
  document.getElementById('count-green').textContent  = counts.green;
  document.getElementById('count-yellow').textContent = counts.yellow;
  document.getElementById('count-orange').textContent = counts.orange;
  document.getElementById('count-red').textContent    = counts.red;
}

// ── AI ANALYSIS ───────────────────────────────────────────────
async function handleAnalyze() {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'ANALYZING…';
  analysisSection.style.display = 'block';
  analysisSummary.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">Sending products to AI for analysis…</p>';

  // Only send yellow, orange, red to AI — green is already confirmed sellable
  const candidates = allProducts.filter(p => p.bucket !== 'green');
  const total = candidates.length;
  let done = 0;

  const BATCH = 30;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    analysisProgress.textContent = `Analyzing ${done} of ${total}…`;
    try {
      const results = await analyzeProductBatch(batch);
      for (const r of results) {
        aiNotes[r.id] = { note: r.note, confidence: r.confidence };
        // AI can upgrade/downgrade bucket for yellow/orange/red
        const p = allProducts.find(x => x.id === r.id);
        if (p && r.bucket && BUCKET_META[r.bucket]) {
          p.bucket = r.bucket;
        }
      }
    } catch (e) {
      console.error('Batch error:', e);
    }
    done += batch.length;
  }

  analysisProgress.textContent = `Complete — ${total} products analyzed`;
  updateBucketCounts();
  renderTable();
  renderAnalysisSummary();

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = 'RE-ANALYZE';
}

async function analyzeProductBatch(products) {
  const productList = products.map(p => ({
    id: p.id,
    name: p.name,
    mpn: p.mpn && p.mpn.trim() !== '' ? p.mpn : null,
    manufacturer: p.manufacturer || null,
    category: p.categories?.[0]?.name || null,
    shortDescription: p.shortDescription || null,
    bucket: p.bucket,
  }));

  const prompt = `You are a product catalog analyst for an MSP (managed service provider) technology reseller.
These products have been pre-triaged by live distributor stock data. Write a one-sentence note for each explaining its situation and confirming or adjusting its cleanup bucket.

BUCKET MEANINGS:
- yellow: Real product, back-ordered or temporarily unavailable in distribution. Likely still valid.
- orange: Has a valid MPN but not found in any distributor feed. Possibly EOL, discontinued, or legacy.
- red: No MPN at all. Cannot be ordered from any distributor. Strong unlist candidate.

YOUR JOB:
- Write a plain-English note explaining why this product is in its bucket
- Adjust the bucket only if you have strong reason (e.g. orange item is clearly a current product the MSP buys direct; red item is a known accessory type)
- Note if something looks EOL, legacy, or like a product the MSP sources outside distribution (Amazon, direct from vendor, etc.)

RESPOND with a JSON array only. No markdown, no explanation outside the JSON.
Format: [{"id":"...","bucket":"yellow|orange|red","confidence":"high|medium|low","note":"one sentence explaining this product's situation"}]

Products to analyze:
${JSON.stringify(productList, null, 2)}`;

  const resp = await fetch('/api/analyze-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: productList, prompt }),
  });

  if (!resp.ok) throw new Error(`Function error ${resp.status}`);
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'Unknown error');

  try {
    const clean = data.result.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    console.error('Could not parse AI response:', data.result);
    return [];
  }
}

function renderAnalysisSummary() {
  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const p of allProducts) counts[p.bucket]++;

  const total = allProducts.length;
  const actionable = counts.orange + counts.red;
  const pct = total > 0 ? Math.round((actionable / total) * 100) : 0;

  analysisSummary.innerHTML = `
    <div class="analysis-card">
      <div class="analysis-card-title">Catalog Overview</div>
      <div class="analysis-card-body">
        <strong>${counts.green}</strong> products are ready to sell — in stock or available via distributor.<br>
        <strong>${counts.yellow}</strong> need review — back-ordered, temporarily unavailable, or custom sourced.<br>
        <strong>${counts.orange}</strong> are likely safe to unlist — not found in distribution but have a part number.<br>
        <strong>${counts.red}</strong> are unlist candidates — no MPN, not found anywhere.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Recommended Action</div>
      <div class="analysis-card-body">
        <strong>${actionable} products (${pct}%)</strong> are candidates for unlisting.<br><br>
        Start with the <strong>${counts.red} Unlist Candidates</strong> (no MPN) — safest to act on immediately.<br>
        Then review <strong>${counts.orange} Likely Unlist</strong> items with the MSP before acting.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Label Readiness</div>
      <div class="analysis-card-body">
        Your <strong>cleanup-unlist</strong> and <strong>cleanup-review</strong> labels are ready in Salesbuildr.
        When the SB API adds label-writing support, this tool will automatically tag each product.
        Until then, use the Export Plan CSV to guide manual labeling.
      </div>
    </div>
  `;
}

// ── TABLE RENDER ──────────────────────────────────────────────
function getFilteredProducts() {
  return allProducts.filter(p => {
    if (activeBucketFilter !== 'all' && p.bucket !== activeBucketFilter) return false;
    if (activeSearch) {
      const name = (p.name || '').toLowerCase();
      const mpn  = (p.mpn  || '').toLowerCase();
      if (!name.includes(activeSearch) && !mpn.includes(activeSearch)) return false;
    }
    return true;
  });
}

function renderTable() {
  const filtered = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tableCount.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
  productTableBody.innerHTML = '';
  for (const p of pageItems) productTableBody.appendChild(buildRow(p));

  renderPagination(totalPages);
  updateBulkBar();
}

function buildRow(p) {
  const note = aiNotes[p.id];
  const hasMpn = p.mpn && p.mpn.trim() !== '';
  const isSelected = selectedIds.has(p.id);

  const tr = document.createElement('tr');
  if (isSelected) tr.classList.add('selected');

  // Stock status badge — derived from bucket (which came from real stock data)
  let statusHtml = '';
  if (!p.listed) {
    statusHtml = '<span class="status-badge status-nodata">Unlisted</span>';
  } else if (p.bucket === 'green') {
    statusHtml = '<span class="status-badge status-instock">In Stock</span>';
  } else if (p.bucket === 'yellow') {
    statusHtml = '<span class="status-badge status-unavailable">Unavailable</span>';
  } else {
    statusHtml = '<span class="status-badge status-notfound">Not Found</span>';
  }

  const badgeCls   = `bucket-badge--${p.bucket}`;
  const badgeLabel = BUCKET_META[p.bucket]?.label || p.bucket;

  const category = p.categories?.[0]?.name || p.category?.name || '—';
  const vendor   = p.manufacturer || p.vendor || '—';

  const aiNote = note
    ? `<span class="ai-note">${escHtml(note.note)}</span>`
    : `<span class="ai-note-pending">—</span>`;

  tr.innerHTML = `
    <td><input type="checkbox" class="row-check" data-id="${p.id}"
      ${isSelected ? 'checked' : ''}
      ${!p.listed ? 'disabled' : ''} /></td>
    <td>${statusHtml}</td>
    <td><div class="product-name">${escHtml(p.name)}</div></td>
    <td>${hasMpn
      ? `<span class="product-mpn">${escHtml(p.mpn)}</span>`
      : `<span class="mpn-missing">missing</span>`}</td>
    <td>${escHtml(vendor)}</td>
    <td>${escHtml(category)}</td>
    <td><span class="bucket-badge ${badgeCls}">${badgeLabel}</span></td>
    <td>${aiNote}</td>
    <td style="text-align:center;">
      <span class="listed-dot listed-dot--${p.listed ? 'yes' : 'no'}"
        title="${p.listed ? 'Listed' : 'Unlisted'}"></span>
    </td>
  `;

  tr.querySelector('.row-check')?.addEventListener('change', e => {
    if (e.target.checked) selectedIds.add(p.id);
    else selectedIds.delete(p.id);
    tr.classList.toggle('selected', e.target.checked);
    updateBulkBar();
  });

  return tr;
}

function renderPagination(totalPages) {
  tablePagination.innerHTML = '';
  if (totalPages <= 1) return;

  const mkBtn = (label, page, disabled, active) => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.disabled = disabled;
    b.addEventListener('click', () => { currentPage = page; renderTable(); });
    return b;
  };

  tablePagination.appendChild(mkBtn('←', currentPage - 1, currentPage === 1, false));
  for (const p of pageRange(currentPage, totalPages)) {
    if (p === '…') {
      const sp = document.createElement('span');
      sp.textContent = '…';
      sp.style.cssText = 'padding:5px 4px;font-size:12px;color:var(--text-muted);';
      tablePagination.appendChild(sp);
    } else {
      tablePagination.appendChild(mkBtn(p, p, false, p === currentPage));
    }
  }
  tablePagination.appendChild(mkBtn('→', currentPage + 1, currentPage === totalPages, false));
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
  return [1, '…', current-1, current, current+1, '…', total];
}

// ── SELECTION ─────────────────────────────────────────────────
function updateBulkBar() {
  const count = selectedIds.size;
  bulkBar.style.display = count > 0 ? 'flex' : 'none';
  bulkCount.textContent = `${count} product${count !== 1 ? 's' : ''} selected`;
  selectAllChk.checked = false;
}

function handleSelectAll(e) {
  const filtered = getFilteredProducts();
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  for (const p of pageItems) {
    if (!p.listed) continue;
    if (e.target.checked) selectedIds.add(p.id);
    else selectedIds.delete(p.id);
  }
  renderTable();
}

function clearSelection() {
  selectedIds.clear();
  selectAllChk.checked = false;
  renderTable();
}

// ── UNLIST ────────────────────────────────────────────────────
function promptUnlist() {
  const count = selectedIds.size;
  if (count === 0) return;

  const names = allProducts
    .filter(p => selectedIds.has(p.id))
    .slice(0, 5)
    .map(p => `<li>${escHtml(p.name)}</li>`)
    .join('');
  const more = count > 5 ? `<li>…and ${count - 5} more</li>` : '';

  unlistModalBody.innerHTML = `
    <p>You are about to <strong>unlist ${count} product${count !== 1 ? 's' : ''}</strong>.
    This sets them to inactive in Salesbuildr and syncs back to your PSA.
    Items can be re-listed at any time if needed.</p>
    <ul style="margin:12px 0;padding-left:20px;font-size:12px;color:var(--text-mid);">
      ${names}${more}
    </ul>
    <p style="font-size:12px;color:var(--text-muted);">
      This action calls the Salesbuildr API once per product and cannot be undone in bulk.
    </p>`;

  unlistModal.style.display = 'flex';
}

async function executeUnlist() {
  unlistModal.style.display = 'none';
  progressModal.style.display = 'flex';

  const { tenantUrl, apiKey } = getCreds();
  const ids = [...selectedIds];
  let done = 0, errors = 0;

  unlistProgressBar.style.width = '0%';
  unlistProgressLabel.textContent = 'Starting…';

  const CONCURRENCY = 5;
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (id) => {
      try {
        const resp = await fetch('/api/sb-unlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantUrl, apiKey, productId: id }),
        });
        const result = await resp.json();
        if (resp.ok && result.ok) {
          const product = allProducts.find(p => p.id === id);
          if (product) product.listed = false;
        } else {
          errors++;
        }
      } catch { errors++; }
      done++;
      const pct = Math.round((done / ids.length) * 100);
      unlistProgressBar.style.width = pct + '%';
      unlistProgressLabel.textContent = `${done} of ${ids.length} processed…`;
    }));
  }

  selectedIds.clear();
  updateBucketCounts();
  renderTable();

  unlistProgressLabel.textContent = errors === 0
    ? `Done — ${done} products unlisted successfully.`
    : `Done — ${done - errors} succeeded, ${errors} failed.`;

  setTimeout(() => { progressModal.style.display = 'none'; }, 2500);
}

// ── EXPORT ────────────────────────────────────────────────────
function handleExport() {
  const rows = [
    ['ID', 'Name', 'MPN', 'Vendor', 'Category', 'Listed', 'Bucket', 'AI Note', 'Confidence'],
  ];

  for (const p of allProducts) {
    const note = aiNotes[p.id] || {};
    const category = p.categories?.[0]?.name || p.category?.name || '';
    const vendor   = p.manufacturer || p.vendor || '';
    rows.push([
      p.id, p.name, p.mpn || '', vendor, category,
      p.listed ? 'Yes' : 'No',
      p.bucket, note.note || '', note.confidence || '',
    ]);
  }

  const csv = rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `product-cleanup-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── UI HELPERS ────────────────────────────────────────────────
function showLoading(label, sub) {
  loadingLabel.textContent   = label;
  loadingSub.textContent     = sub;
  loadingState.style.display = 'flex';
  dashboard.style.display    = 'none';
  emptyState.style.display   = 'none';
}
function updateLoadingLabel(label, sub) {
  loadingLabel.textContent = label;
  if (sub) loadingSub.textContent = sub;
}
function showDashboard() {
  loadingState.style.display = 'none';
  dashboard.style.display    = 'block';
  emptyState.style.display   = 'none';
}
function showEmpty() {
  loadingState.style.display = 'none';
  dashboard.style.display    = 'none';
  emptyState.style.display   = 'flex';
}
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── START ─────────────────────────────────────────────────────
init();
