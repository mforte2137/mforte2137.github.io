/* ============================================================
   PRODUCT CLEANUP — JS
   Fetches all products, triages into buckets, runs AI analysis,
   and supports bulk unlisting via the Salesbuildr public API.
   ============================================================ */

// ── DOM REFS ──────────────────────────────────────────────────
const tenantUrlInput  = document.getElementById('tenantUrl');
const apiKeyInput     = document.getElementById('apiKey');
const loadBtn         = document.getElementById('loadBtn');
const credsError      = document.getElementById('credsError');
const headerMeta      = document.getElementById('headerMeta');

const loadingState    = document.getElementById('loadingState');
const loadingLabel    = document.getElementById('loadingLabel');
const loadingSub      = document.getElementById('loadingSub');
const dashboard       = document.getElementById('dashboard');
const emptyState      = document.getElementById('emptyState');

const analyzeBtn      = document.getElementById('analyzeBtn');
const exportBtn       = document.getElementById('exportBtn');
const analysisSection = document.getElementById('analysisSection');
const analysisProgress = document.getElementById('analysisProgress');
const analysisSummary = document.getElementById('analysisSummary');

const bucketFilter    = document.getElementById('bucketFilter');
const tableSearch     = document.getElementById('tableSearch');
const tableTitle      = document.getElementById('tableTitle');
const tableCount      = document.getElementById('tableCount');
const productTableBody = document.getElementById('productTableBody');
const tablePagination = document.getElementById('tablePagination');

const bulkBar         = document.getElementById('bulkBar');
const bulkCount       = document.getElementById('bulkCount');
const bulkUnlistBtn   = document.getElementById('bulkUnlistBtn');
const bulkClearBtn    = document.getElementById('bulkClearBtn');
const selectAllChk    = document.getElementById('selectAll');

const unlistModal     = document.getElementById('unlistModal');
const unlistModalBody = document.getElementById('unlistModalBody');
const unlistConfirmBtn = document.getElementById('unlistConfirmBtn');
const unlistCancelBtn = document.getElementById('unlistCancelBtn');
const progressModal   = document.getElementById('progressModal');
const unlistProgressBar = document.getElementById('unlistProgressBar');
const unlistProgressLabel = document.getElementById('unlistProgressLabel');

// ── STATE ─────────────────────────────────────────────────────
let allProducts = [];       // raw from API
let analysisMap = {};       // id → { bucket, note, confidence }
let selectedIds = new Set();
let currentPage = 1;
const PAGE_SIZE = 50;
let activeBucketFilter = 'all';
let activeSearch = '';

// Bucket definitions used for triage
const BUCKET_META = {
  green:  { label: 'Ready to Sell',     cls: 'bucket-badge--green' },
  yellow: { label: 'Needs Review',      cls: 'bucket-badge--yellow' },
  orange: { label: 'Likely Unlist',     cls: 'bucket-badge--orange' },
  red:    { label: 'Unlist Candidate',  cls: 'bucket-badge--red' },
};

// ── INIT ──────────────────────────────────────────────────────
function init() {
  loadStoredCreds();
  loadBtn.addEventListener('click', handleLoad);
  analyzeBtn.addEventListener('click', handleAnalyze);
  exportBtn.addEventListener('click', handleExport);
  bucketFilter.addEventListener('change', () => { activeBucketFilter = bucketFilter.value; currentPage = 1; renderTable(); });
  tableSearch.addEventListener('input', () => { activeSearch = tableSearch.value.trim().toLowerCase(); currentPage = 1; renderTable(); });
  bulkUnlistBtn.addEventListener('click', promptUnlist);
  bulkClearBtn.addEventListener('click', clearSelection);
  selectAllChk.addEventListener('change', handleSelectAll);
  unlistConfirmBtn.addEventListener('click', executeUnlist);
  unlistCancelBtn.addEventListener('click', () => { unlistModal.style.display = 'none'; });

  // Bucket click = filter
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
  analysisMap = {};

  showLoading('Connecting to Salesbuildr…', 'Fetching first page of products');
  dashboard.style.display = 'none';
  emptyState.style.display = 'none';

  try {
    allProducts = await fetchAllProducts(tenantUrl, apiKey);
    headerMeta.textContent = `${allProducts.length} products · ${new URL(tenantUrl).hostname}`;

    // Pre-triage without AI (instant bucket assignment by stock status)
    preTriageProducts();
    updateBucketCounts();

    showDashboard();
    renderTable();
  } catch (err) {
    showEmpty();
    credsError.textContent = `Error: ${err.message}`;
  }
}

async function fetchAllProducts(tenantUrl, apiKey) {
  const PAGE = 100;
  let from = 0;
  let total = null;
  const results = [];

  while (true) {
    updateLoadingLabel(
      `Fetching products… (${results.length}${total ? ' of ' + total : ''})`,
      'Loading page by page — routing via proxy'
    );

    // All Salesbuildr calls go through the Netlify proxy to avoid CORS
    const resp = await fetch('/api/sb-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantUrl, apiKey, size: PAGE, from }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Proxy ${resp.status}: ${txt.slice(0, 120)}`);
    }

    const data = await resp.json();
    if (!data.ok) throw new Error(data.error || 'Proxy returned an error');

    // Keep only hardware/one-time products — exclude services and labor
    // which are always managed in the PSA and never need cleanup
    const products = data.results.filter(p => {
      const t = (p.productType || '').toLowerCase();
      return t !== 'service' && t !== 'labor';
    });

    results.push(...products);
    total = data.total || results.length;
    if (data.results.length < PAGE) break;
    from += PAGE;
  }

  return results;
}

// ── PRE-TRIAGE (no AI, instant) ───────────────────────────────
// Uses stock/availability fields returned by the API to bucket without AI.
// The `filters` array on the search response contains facets; however
// individual product objects don't directly carry a stock status string.
// We infer from what we have: mpn presence + listed status.
// AI analysis will refine later.

function preTriageProducts() {
  // We do a lightweight rule-based pass first so the UI is immediately useful.
  // AI analysis (the button) enriches these assessments later.
  for (const p of allProducts) {
    if (!analysisMap[p.id]) {
      analysisMap[p.id] = {
        bucket: inferBucket(p),
        note: null,
        confidence: null,
      };
    }
  }
}

function inferBucket(p) {
  const hasMpn = p.mpn && p.mpn.trim() !== '';
  // SB returns inventory info in the filters facet, not per product.
  // But productType, listed, mpn give us strong signals:
  // - If listed=false already → red (user already unlisted it)
  // - If no MPN at all → red
  // - If has MPN, listed → yellow (may or may not be in stock; AI will refine)
  // We can't know stock status from the GET /product response alone
  // without a separate inventory call — so we keep it simple here.
  // The "green" bucket gets filled in properly after the analyze step.
  if (!p.listed)  return 'red';
  if (!hasMpn)    return 'red';
  // Has MPN and is listed — could be green or yellow; default yellow until AI runs
  return 'yellow';
}

// ── BUCKET COUNTS ─────────────────────────────────────────────
function updateBucketCounts() {
  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const id in analysisMap) {
    const b = analysisMap[id].bucket;
    if (counts[b] !== undefined) counts[b]++;
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

  // Grab only the products that need attention (yellow, orange, red)
  const candidates = allProducts.filter(p => {
    const b = analysisMap[p.id]?.bucket;
    return b === 'yellow' || b === 'orange' || b === 'red';
  });

  const total = candidates.length;
  let done = 0;

  // Process in batches of 30 — Haiku handles this well within timeout
  const BATCH = 30;
  const batches = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    batches.push(candidates.slice(i, i + BATCH));
  }

  const allResults = [];

  for (const batch of batches) {
    analysisProgress.textContent = `Analyzing ${done} of ${total}…`;
    try {
      const results = await analyzeProductBatch(batch);
      allResults.push(...results);
      for (const r of results) {
        if (analysisMap[r.id]) {
          analysisMap[r.id].bucket = r.bucket;
          analysisMap[r.id].note   = r.note;
          analysisMap[r.id].confidence = r.confidence;
        }
      }
    } catch (e) {
      console.error('Batch analysis error:', e);
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
    mpn: p.mpn || null,
    vendor: p.vendor || null,
    category: p.category?.name || null,
    shortDescription: p.shortDescription || null,
    listed: p.listed,
  }));

  const prompt = `You are a product catalog analyst for an MSP (managed service provider) technology reseller. 
Your job is to classify products that are problematic — either "not found" in distribution or "unavailable" — into cleanup buckets to help the MSP decide what to do.

BUCKETS:
- green: Can be sold. Has a valid MPN, likely in stock in a distributor feed, or is a standard stocked item.
- yellow: Needs human review. Has a valid MPN but may be temporarily out of stock, older model, or hard to classify. Could also be something MSPs buy outside distribution (e.g. cables, consumables, accessories, AV gear, specialty items).
- orange: Likely safe to unlist. MPN doesn't match anything in major distribution (TD Synnex, Ingram Micro, D&H). Probably EOL or a legacy product. Low risk to unlist.
- red: Almost certainly unlist. No MPN, no vendor, vague name, or clearly a ghost/placeholder entry. Very safe to unlist.

RULES:
1. Products with no MPN at all are usually red.
2. Products with recognizable current-generation vendor part numbers (HP, Dell, Lenovo, Microsoft, Cisco, etc.) that look active are yellow at minimum.
3. Very old product names or part numbers with legacy naming conventions lean orange.
4. Generic descriptions with no vendor info are red.
5. Cables, consumables, accessories, peripherals — flag yellow because MSPs often buy these outside distribution.
6. Services, warranties, and labor items are out of scope but if they appear, mark yellow.

Respond ONLY with a JSON array. No preamble, no markdown fences.
Each element: {"id":"...","bucket":"green|yellow|orange|red","confidence":"high|medium|low","note":"one short sentence explaining why"}

Products to analyze:
${JSON.stringify(productList, null, 2)}`;

  const resp = await fetch('/api/analyze-products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: productList, prompt }),
  });

  if (!resp.ok) throw new Error(`Function error: ${resp.status}`);
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
  const buckets = { green: [], yellow: [], orange: [], red: [] };
  for (const [id, info] of Object.entries(analysisMap)) {
    if (buckets[info.bucket]) buckets[info.bucket].push(id);
  }

  const total = allProducts.length;
  const unlisted = buckets.orange.length + buckets.red.length;
  const pct = total > 0 ? Math.round((unlisted / total) * 100) : 0;

  analysisSummary.innerHTML = `
    <div class="analysis-card">
      <div class="analysis-card-title">Overview</div>
      <div class="analysis-card-body">
        ${total} total products analyzed.<br>
        <strong>${buckets.green.length}</strong> are ready to sell — no action needed.<br>
        <strong>${buckets.yellow.length}</strong> need human review before acting.<br>
        <strong>${unlisted}</strong> (${pct}%) are candidates for unlisting.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Recommended Action</div>
      <div class="analysis-card-body">
        Start with the <strong>${buckets.red.length} Unlist Candidates</strong> — these have no MPN and no clear path to ordering. Very safe to unlist.<br><br>
        Then review <strong>${buckets.orange.length} Likely Unlist</strong> items with your customer before acting.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">About Labels</div>
      <div class="analysis-card-body">
        When Salesbuildr adds label-writing to the API, this tool will automatically tag products with their cleanup bucket label — making the plan visible inside SB too.
      </div>
    </div>
  `;
}

// ── TABLE RENDER ──────────────────────────────────────────────
function getFilteredProducts() {
  return allProducts.filter(p => {
    const info = analysisMap[p.id];
    const bucket = info?.bucket;

    if (activeBucketFilter === 'unanalyzed' && info?.note) return false;
    if (activeBucketFilter !== 'all' && activeBucketFilter !== 'unanalyzed' && bucket !== activeBucketFilter) return false;

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
  for (const p of pageItems) {
    productTableBody.appendChild(buildRow(p));
  }

  renderPagination(totalPages);
  updateBulkBar();
}

function buildRow(p) {
  const info = analysisMap[p.id] || {};
  const hasMpn = p.mpn && p.mpn.trim() !== '';
  const isSelected = selectedIds.has(p.id);

  const tr = document.createElement('tr');
  if (isSelected) tr.classList.add('selected');

  // Derive a display status from what we know
  let statusHtml = '';
  if (!p.listed) {
    statusHtml = '<span class="status-badge status-nodata">Unlisted</span>';
  } else if (!hasMpn) {
    statusHtml = '<span class="status-badge status-notfound">No MPN</span>';
  } else {
    statusHtml = '<span class="status-badge status-unavailable">Listed</span>';
  }

  const bucket = info.bucket || null;
  const badgeCls = bucket ? `bucket-badge--${bucket}` : 'bucket-badge--none';
  const badgeLabel = bucket ? (BUCKET_META[bucket]?.label || bucket) : 'Not analyzed';

  const aiNote = info.note
    ? `<span class="ai-note">${escHtml(info.note)}</span>`
    : `<span class="ai-note-pending">—</span>`;

  tr.innerHTML = `
    <td><input type="checkbox" class="row-check" data-id="${p.id}" ${isSelected ? 'checked' : ''} ${p.listed === false ? 'disabled' : ''}/></td>
    <td>${statusHtml}</td>
    <td><div class="product-name">${escHtml(p.name)}</div></td>
    <td>${hasMpn ? `<span class="product-mpn">${escHtml(p.mpn)}</span>` : `<span class="mpn-missing">missing</span>`}</td>
    <td>${escHtml(p.vendor || '—')}</td>
    <td>${escHtml(p.category?.name || '—')}</td>
    <td><span class="bucket-badge ${badgeCls}">${badgeLabel}</span></td>
    <td>${aiNote}</td>
    <td style="text-align:center;"><span class="listed-dot listed-dot--${p.listed ? 'yes' : 'no'}" title="${p.listed ? 'Listed' : 'Unlisted'}"></span></td>
  `;

  tr.querySelector('.row-check')?.addEventListener('change', (e) => {
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

  const range = pageRange(currentPage, totalPages);
  for (const p of range) {
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
    if (p.listed === false) continue; // can't unlist what's already unlisted
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
    This sets them to inactive in Salesbuildr and syncs the change back to your PSA. 
    Items can be re-listed at any time.</p>
    <ul style="margin:12px 0;padding-left:20px;font-size:12px;color:var(--text-mid);">
      ${names}${more}
    </ul>
    <p style="font-size:12px;color:var(--text-muted);">This action will call the Salesbuildr API once per product. It cannot be undone in bulk.</p>
  `;

  unlistModal.style.display = 'flex';
}

async function executeUnlist() {
  unlistModal.style.display = 'none';
  progressModal.style.display = 'flex';

  const { tenantUrl, apiKey } = getCreds();
  const ids = [...selectedIds];
  let done = 0;
  let errors = 0;

  unlistProgressBar.style.width = '0%';
  unlistProgressLabel.textContent = 'Starting…';

  // Process in batches of 5 concurrent requests
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
          // Update local state
          const product = allProducts.find(p => p.id === id);
          if (product) product.listed = false;
          if (analysisMap[id]) analysisMap[id].bucket = 'red';
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
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
    : `Done — ${done - errors} succeeded, ${errors} failed. Check the console for details.`;

  setTimeout(() => {
    progressModal.style.display = 'none';
  }, 2500);
}

// ── EXPORT ────────────────────────────────────────────────────
function handleExport() {
  const rows = [
    ['ID', 'Name', 'MPN', 'Vendor', 'Category', 'Listed', 'Bucket', 'AI Note', 'Confidence'],
  ];

  for (const p of allProducts) {
    const info = analysisMap[p.id] || {};
    rows.push([
      p.id,
      p.name,
      p.mpn || '',
      p.vendor || '',
      p.category?.name || '',
      p.listed ? 'Yes' : 'No',
      info.bucket || '',
      info.note || '',
      info.confidence || '',
    ]);
  }

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
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
  loadingLabel.textContent = label;
  loadingSub.textContent   = sub;
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── START ─────────────────────────────────────────────────────
init();
