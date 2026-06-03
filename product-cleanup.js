/* ============================================================
   PRODUCT CLEANUP — JS
   v3 — Real stock-based triage, parallel AI analysis (orange only),
   no unlisted products shown, actionable guidance panel.
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
let allProducts = [];      // listed products only, with .bucket set from real stock data
let aiNotes = {};          // id → { note, confidence }
let nqsProductIds = new Set(); // ids of products not quoted in selected period
let selectedIds = new Set();
let currentPage = 1;
const PAGE_SIZE = 50;
let activeBucketFilter = 'actionable'; // default: hide green
let activeSearch = '';
let nqsActive = false; // whether NQS filter is applied
let mspName = null;    // MSP's own company name — auto-detected via company API

const STOCK_GROUPS = [
  { bucket: 'green',  filter: 'inStock|onlyDistributor|internal|lowStock', label: 'Ready to Sell' },
  { bucket: 'yellow', filter: 'backOrder|unavailable|custom',              label: 'Needs Review'  },
  { bucket: 'orange', filter: 'notFound',                                  label: 'Not Found'     },
];

const BUCKET_META = {
  green:  { label: 'Ready to Sell',    cls: 'bucket-badge--green'  },
  yellow: { label: 'Needs Review',     cls: 'bucket-badge--yellow' },
  orange: { label: 'Likely Unlist',    cls: 'bucket-badge--orange' },
  red:    { label: 'Unlist Candidate', cls: 'bucket-badge--red'    },
};

// ── INIT ──────────────────────────────────────────────────────
function init() {
  loadStoredCreds();
  loadBtn.addEventListener('click', handleLoad);
  analyzeBtn.addEventListener('click', handleAnalyze);
  exportBtn.addEventListener('click', handleExport);
  bucketFilter.addEventListener('change', () => {
    activeBucketFilter = bucketFilter.value;
    currentPage = 1;
    document.getElementById('fixMfrBtn').style.display =
      activeBucketFilter === 'mismatch' ? 'inline-block' : 'none';
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

  document.getElementById('fixMfrBtn').addEventListener('click', handleFixManufacturers);
  document.getElementById('mfrModalCloseBtn').addEventListener('click', () => {
    document.getElementById('mfrModal').style.display = 'none';
  });

  // NQS card
  document.getElementById('nqsLoadBtn').addEventListener('click', handleNqsLoad);
  document.getElementById('nqsFilterBtn').addEventListener('click', handleNqsFilter);
  document.getElementById('nqsMonths').addEventListener('change', () => {
    // Reset if period changes
    nqsProductIds.clear();
    nqsActive = false;
    document.getElementById('nqsCount').textContent = '—';
    document.getElementById('nqsDesc').textContent = "Haven't appeared on a quote";
    document.getElementById('nqsFilterBtn').disabled = true;
    renderTable();
  });

  document.querySelectorAll('.bucket').forEach(el => {
    el.addEventListener('click', () => {
      const b = el.dataset.bucket;
      if (b === 'mismatch') {
        bucketFilter.value = 'mismatch';
        activeBucketFilter = 'mismatch';
        document.getElementById('fixMfrBtn').style.display = 'inline-block';
      } else {
        bucketFilter.value = b;
        activeBucketFilter = b;
        document.getElementById('fixMfrBtn').style.display = 'none';
      }
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
  analysisSection.style.display = 'none';

  showLoading('Connecting to Salesbuildr…', 'Fetching product catalog by stock status');
  dashboard.style.display  = 'none';
  emptyState.style.display = 'none';

  try {
    // Fetch MSP company name first — used to detect manufacturer mismatches
    try {
      const compResp = await fetch('/api/sb-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantUrl, apiKey }),
      });
      const compData = await compResp.json();
      if (compData.ok && compData.mspName) {
        mspName = compData.mspName;
      }
    } catch (e) {
      console.warn('Could not fetch MSP company name:', e);
    }

    for (const group of STOCK_GROUPS) {
      updateLoadingLabel(
        `Fetching ${group.label} products…`,
        `${allProducts.length} products loaded so far`
      );
      const products = await fetchProductGroup(tenantUrl, apiKey, group.filter);

      for (const p of products) {
        // Skip already-unlisted products entirely — nothing to act on
        if (!p.listed) continue;

        const hasMpn = p.mpn && p.mpn.trim() !== '';
        p.bucket = (group.bucket === 'orange')
          ? (hasMpn ? 'orange' : 'red')
          : group.bucket;
      }

      // Only push listed products
      allProducts.push(...products.filter(p => p.listed));
    }

    headerMeta.textContent = `${allProducts.length} products · ${new URL(tenantUrl).hostname}`;

    // Tag manufacturer mismatches — products where manufacturer = MSP name (PSA import default)
    if (mspName) {
      for (const p of allProducts) {
        p.mfrMismatch = p.manufacturer && p.manufacturer.trim().toLowerCase() === mspName.trim().toLowerCase();
      }
    }

    updateBucketCounts();
    document.getElementById('nqsCard').style.display = 'flex';
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
  const counts = { green: 0, yellow: 0, orange: 0, red: 0, mismatch: 0 };
  for (const p of allProducts) {
    if (counts[p.bucket] !== undefined) counts[p.bucket]++;
    if (p.mfrMismatch) counts.mismatch++;
  }

  // Hidden counts (used by summary line)
  document.getElementById('count-green').textContent  = counts.green;
  document.getElementById('count-yellow').textContent = counts.yellow;
  document.getElementById('count-orange').textContent = counts.orange;
  document.getElementById('count-red').textContent    = counts.red;

  // Summary line
  const summary = document.getElementById('bucketsSummary');
  if (summary) {
    document.getElementById('summary-green').textContent  = counts.green;
    document.getElementById('summary-yellow').textContent = counts.yellow;
    summary.style.display = 'block';
  }

  // Mismatch card
  const mismatchCard = document.getElementById('mismatch-card');
  if (mismatchCard) {
    document.getElementById('count-mismatch').textContent = counts.mismatch;
    mismatchCard.style.display = counts.mismatch > 0 ? 'flex' : 'none';
    if (mspName) {
      document.getElementById('mismatch-desc').textContent =
        `Manufacturer set to "${mspName}" — PSA import default, needs correction`;
    }
  }

  return counts;
}

// ── AI ANALYSIS ───────────────────────────────────────────────
// Only analyze orange — red is self-evident (no MPN), green is confirmed good,
// yellow is real products temporarily out of stock (stock data tells the story).
// Run 3 batches in parallel for speed.
async function handleAnalyze() {
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'ANALYZING…';
  analysisSection.style.display = 'block';
  analysisSummary.innerHTML = '';

  const progressWrap   = document.getElementById('analysisProgressWrap');
  const progressFill   = document.getElementById('analysisProgressFill');
  const progressDetail = document.getElementById('analysisProgressDetail');
  progressWrap.style.display = 'block';
  progressFill.style.width = '0%';

  const candidates = allProducts.filter(p => p.bucket === 'orange');
  const total = candidates.length;
  let done = 0;
  let errors = 0;

  const updateProgress = () => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = pct + '%';
    analysisProgress.textContent = `${pct}% complete`;
    progressDetail.textContent = `${done} of ${total} products analyzed${errors > 0 ? ` · ${errors} failed` : ''} · running in parallel batches`;
  };

  updateProgress();

  const BATCH = 25;
  const PARALLEL = 3;

  const batches = [];
  for (let i = 0; i < candidates.length; i += BATCH) {
    batches.push(candidates.slice(i, i + BATCH));
  }

  for (let i = 0; i < batches.length; i += PARALLEL) {
    const group = batches.slice(i, i + PARALLEL);

    await Promise.all(group.map(async (batch) => {
      try {
        const results = await analyzeProductBatch(batch);
        for (const r of results) {
          aiNotes[r.id] = { note: r.note, confidence: r.confidence };
          const p = allProducts.find(x => x.id === r.id);
          if (p && r.bucket && BUCKET_META[r.bucket]) p.bucket = r.bucket;
        }
      } catch (e) {
        console.error('Batch error:', e);
        errors++;
      }
      done += batch.length;
      updateProgress();
    }));
  }

  // Final state
  progressFill.style.width = '100%';
  analysisProgress.textContent = `Complete`;
  progressDetail.textContent = `${total} products analyzed${errors > 0 ? ` · ${errors} batches failed — re-analyze to retry` : ' · all batches succeeded'}`;

  updateBucketCounts();
  renderTable();
  renderGuidancePanel();

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = 'RE-ANALYZE';
}

async function analyzeProductBatch(products) {
  const months = parseInt(document.getElementById('nqsMonths').value, 10);

  const productList = products.map(p => ({
    id: p.id,
    name: p.name,
    mpn: p.mpn && p.mpn.trim() !== '' ? p.mpn : null,
    manufacturer: p.manufacturer || null,
    category: p.categories?.[0]?.name || null,
    shortDescription: p.shortDescription || null,
    bucket: p.bucket,
    notQuotedMonths: nqsProductIds.has(p.id) ? months : null,
  }));

  const nqsLoaded = nqsProductIds.size > 0;

  const prompt = `You are a product catalog analyst for an MSP (managed service provider) technology reseller.
These products are NOT FOUND in any distributor feed but have a valid MPN. Analyze each and write a one-sentence note.

SIGNALS AVAILABLE:
- bucket: always "orange" (not found in distribution, has MPN)
- notQuotedMonths: if set, this product has NOT appeared on any quote in that many months. If null, quote history is unknown.

FOCUS ON:
- Is this product EOL / discontinued / legacy (e.g. old server gen, obsolete part)?
- Is it a product the MSP might source direct or from Amazon (cables, accessories, consumables)?
- Is the MPN format suspicious (internal code, warranty SKU, config string rather than a real part number)?
- Is it a current product that just happens to be temporarily out of distribution?
${nqsLoaded ? '- If notQuotedMonths is set, factor that into your recommendation — a product not quoted in 12+ months AND not in distribution is a very strong unlist candidate.' : ''}

Respond ONLY with a valid JSON array. No markdown, no explanation.
Format: [{"id":"...","bucket":"yellow|orange|red","confidence":"high|medium|low","note":"one plain-English sentence"}]

- Keep orange if genuinely EOL/legacy/not orderable
- Move to yellow if it looks like a product the MSP sources outside distribution
- A product with notQuotedMonths set AND no distribution presence should lean toward orange with a decisive note

Products:
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

// ── MANUFACTURER FIX ──────────────────────────────────────────
async function handleFixManufacturers() {
  const mismatchProducts = allProducts.filter(p => p.mfrMismatch);
  if (mismatchProducts.length === 0) return;

  const modal = document.getElementById('mfrModal');
  const body  = document.getElementById('mfrModalBody');
  modal.style.display = 'flex';
  body.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">Analyzing product names with AI — grouping by manufacturer…</p>';

  const BATCH = 50;
  const allSuggestions = [];

  for (let i = 0; i < mismatchProducts.length; i += BATCH) {
    const batch = mismatchProducts.slice(i, i + BATCH).map(p => ({
      id: p.id,
      name: p.name,
      mpn: p.mpn || null,
      shortDescription: p.shortDescription || null,
    }));

    try {
      const resp = await fetch('/api/group-manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: batch }),
      });
      const data = await resp.json();
      if (data.ok) {
        const clean = data.result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        allSuggestions.push(...parsed);
      }
    } catch (e) {
      console.error('Manufacturer grouping error:', e);
    }
  }

  const groups = {};
  for (const s of allSuggestions) {
    const mfr = s.manufacturer || 'Unknown';
    if (!groups[mfr]) groups[mfr] = [];
    const product = allProducts.find(p => p.id === s.id);
    if (product) groups[mfr].push(product);
  }

  const sorted = Object.entries(groups).sort(([aName, aProds], [bName, bProds]) => {
    if (aName === 'Unknown') return 1;
    if (bName === 'Unknown') return -1;
    return bProds.length - aProds.length;
  });

  renderMfrGroups(body, sorted);
}

function renderMfrGroups(container, groups) {
  const { tenantUrl, apiKey } = getCreds();

  if (groups.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No groups found.</p>';
    return;
  }

  container.innerHTML = `
    <p style="font-size:12px;color:var(--text-mid);margin-bottom:16px;">
      AI has grouped ${groups.reduce((n, [,p]) => n + p.length, 0)} products by manufacturer.
      Review each group, adjust the name if needed, then click UPDATE to fix them.
    </p>
  `;

  for (const [mfrName, products] of groups) {
    const isUnknown = mfrName === 'Unknown';
    const groupEl = document.createElement('div');
    groupEl.className = 'mfr-group' + (isUnknown ? ' mfr-unknown' : '');
    const inputId = `mfr-input-${mfrName.replace(/[^a-zA-Z0-9]/g, '-')}`;

    groupEl.innerHTML = `
      <div class="mfr-group-header">
        <div class="mfr-group-name">${escHtml(mfrName)}</div>
        <span class="mfr-group-count">${products.length} product${products.length !== 1 ? 's' : ''}</span>
        <input class="mfr-group-input" id="${inputId}" type="text"
          value="${escHtml(isUnknown ? '' : mfrName)}"
          placeholder="${isUnknown ? 'Skip or enter manufacturer' : mfrName}" />
        <button class="btn btn-primary mfr-update-btn" data-group="${escHtml(mfrName)}"
          ${isUnknown ? 'disabled' : ''}>UPDATE ALL</button>
      </div>
      <div class="mfr-group-body">
        ${products.slice(0, 20).map(p =>
          `<div class="mfr-group-product" title="${escHtml(p.name)}">${escHtml(p.name)}</div>`
        ).join('')}
        ${products.length > 20
          ? `<div class="mfr-group-product" style="color:var(--text-muted);">…and ${products.length - 20} more</div>`
          : ''}
      </div>
    `;

    const btn   = groupEl.querySelector('.mfr-update-btn');
    const input = groupEl.querySelector(`#${inputId}`);

    input.addEventListener('input', () => { btn.disabled = input.value.trim() === ''; });

    btn.addEventListener('click', async () => {
      const newMfr = input.value.trim();
      if (!newMfr) return;

      btn.disabled = true;
      btn.textContent = 'UPDATING…';

      const ids = products.map(p => p.id);
      let done = 0, errors = 0, lastError = '';

      document.getElementById('progressModalTitle').textContent = `UPDATING — ${newMfr}`;
      document.getElementById('unlistProgressBar').style.width = '0%';
      document.getElementById('unlistProgressLabel').textContent = 'Starting…';
      document.getElementById('progressModal').style.display = 'flex';

      const CONCURRENCY = 5;
      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const batch = ids.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async (id) => {
          try {
            const resp = await fetch('/api/sb-update-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantUrl, apiKey, productId: id, fields: { vendor: newMfr } }),
            });
            const result = await resp.json();
            if (resp.ok && result.ok) {
              const p = allProducts.find(x => x.id === id);
              if (p) { p.manufacturer = newMfr; p.mfrMismatch = false; }
            } else {
              errors++;
              lastError = result.error || 'Unknown error';
            }
          } catch { errors++; }
          done++;
          document.getElementById('unlistProgressBar').style.width =
            Math.round((done / ids.length) * 100) + '%';
          document.getElementById('unlistProgressLabel').textContent =
            `${done} of ${ids.length} updated…`;
        }));
      }

      document.getElementById('unlistProgressLabel').textContent = errors === 0
        ? `Done — ${done} products updated to "${newMfr}".`
        : `${done - errors} succeeded, ${errors} failed. ${lastError}`;

      setTimeout(() => { document.getElementById('progressModal').style.display = 'none'; }, 2000);

      updateBucketCounts();
      renderTable();

      btn.textContent = '✓ UPDATED';
      btn.style.background = 'var(--green)';
      btn.style.borderColor = 'var(--green)';
      groupEl.style.opacity = '0.5';
    });

    container.appendChild(groupEl);
  }
}

// ── NOT QUOTED SINCE ──────────────────────────────────────────
async function handleNqsLoad() {
  const { tenantUrl, apiKey } = getCreds();
  const months = parseInt(document.getElementById('nqsMonths').value, 10);
  const loadBtn = document.getElementById('nqsLoadBtn');
  const filterBtn = document.getElementById('nqsFilterBtn');

  loadBtn.disabled = true;
  loadBtn.textContent = 'LOADING…';
  nqsProductIds.clear();
  nqsActive = false;

  // Calculate the cutoff date
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  try {
    // Fetch all products not quoted since cutoff — no stock filter, all types excluded per usual
    const PAGE = 100;
    let from = 0;
    let fetched = 0;

    while (true) {
      const resp = await fetch('/api/sb-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantUrl, apiKey,
          size: PAGE, from,
          notQuotedSince: cutoffStr,
        }),
      });

      if (!resp.ok) throw new Error(`Proxy ${resp.status}`);
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error);

      for (const p of data.results) {
        // Only count products we already have in our catalog (listed products)
        if (allProducts.find(x => x.id === p.id)) {
          nqsProductIds.add(p.id);
        }
      }

      fetched += data.results.length;
      if (data.results.length < PAGE) break;
      from += PAGE;
    }

    const count = nqsProductIds.size;
    document.getElementById('nqsCount').textContent = count;
    document.getElementById('nqsDesc').textContent =
      `Not quoted in the last ${months} months — ${count} products`;
    filterBtn.disabled = count === 0;

  } catch (err) {
    document.getElementById('nqsDesc').textContent = `Error: ${err.message}`;
  }

  loadBtn.disabled = false;
  loadBtn.textContent = 'LOAD';
}

function handleNqsFilter() {
  nqsActive = !nqsActive;
  const btn = document.getElementById('nqsFilterBtn');
  const card = document.getElementById('nqsCard');
  btn.textContent = nqsActive ? 'CLEAR FILTER' : 'VIEW THESE';
  btn.className = nqsActive ? 'btn btn-danger' : 'btn btn-primary';
  card.style.outline = nqsActive ? '2px solid #4a6fa5' : 'none';
  currentPage = 1;
  renderTable();
}


// Replaces the generic summary with actionable next steps
function renderGuidancePanel() {
  const counts = { green: 0, yellow: 0, orange: 0, red: 0 };
  for (const p of allProducts) counts[p.bucket]++;

  const total = allProducts.length;
  const actionable = counts.orange + counts.red;

  analysisSummary.innerHTML = `
    <div class="analysis-card">
      <div class="analysis-card-title">Step 1 — Quick Wins</div>
      <div class="analysis-card-body">
        Filter to <strong>Unlist Candidate</strong> (${counts.red} products).
        These have no MPN and cannot be ordered from any distributor.
        Select all and unlist — this is the safest bulk action and requires no customer approval.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Step 2 — Review with Customer</div>
      <div class="analysis-card-body">
        Filter to <strong>Likely Unlist</strong> (${counts.orange} products).
        These have MPNs but aren't in any distributor feed — likely EOL or legacy.
        Review the AI notes with the MSP. Most can be unlisted; a few may be products
        they still source direct.
      </div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Step 3 — Leave for Now</div>
      <div class="analysis-card-body">
        The <strong>${counts.yellow} Needs Review</strong> products are real items
        temporarily back-ordered or unavailable. No action needed — monitor and
        revisit if they remain unavailable after 90 days.
        <br><br>
        <strong>${counts.green} products</strong> are in stock and ready to sell.
      </div>
    </div>
  `;
}

// ── TABLE RENDER ──────────────────────────────────────────────
function getFilteredProducts() {
  return allProducts.filter(p => {
    if (nqsActive && !nqsProductIds.has(p.id)) return false;

    if (activeBucketFilter === 'actionable') {
      if (p.bucket === 'green' || p.bucket === 'yellow') return false;
    } else if (activeBucketFilter === 'mismatch') {
      if (!p.mfrMismatch) return false;
    } else if (activeBucketFilter !== 'all') {
      if (p.bucket !== activeBucketFilter) return false;
    }
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

  let statusHtml = '';
  if (p.bucket === 'green') {
    statusHtml = '<span class="status-badge status-instock">In Stock</span>';
  } else if (p.bucket === 'yellow') {
    statusHtml = '<span class="status-badge status-unavailable">Unavailable</span>';
  } else {
    statusHtml = '<span class="status-badge status-notfound">Not Found</span>';
  }

  const badgeCls   = `bucket-badge--${p.bucket}`;
  const badgeLabel = BUCKET_META[p.bucket]?.label || p.bucket;
  const category   = p.categories?.[0]?.name || '—';
  const vendor     = p.manufacturer || '—';

  const aiNote = note
    ? `<span class="ai-note">${escHtml(note.note)}</span>`
    : `<span class="ai-note-pending">—</span>`;

  const nqsBadge = nqsProductIds.has(p.id)
    ? `<span class="nqs-badge">NOT QUOTED</span>`
    : '';
  const mismatchBadge = p.mfrMismatch
    ? `<span class="mismatch-badge">MFR MISMATCH</span>`
    : '';

  tr.innerHTML = `
    <td><input type="checkbox" class="row-check" data-id="${p.id}" ${isSelected ? 'checked' : ''} /></td>
    <td>${statusHtml}</td>
    <td><div class="product-name">${escHtml(p.name)}${nqsBadge}${mismatchBadge}</div></td>
    <td>${hasMpn ? `<span class="product-mpn">${escHtml(p.mpn)}</span>` : `<span class="mpn-missing">missing</span>`}</td>
    <td>${escHtml(vendor)}</td>
    <td>${escHtml(category)}</td>
    <td><span class="bucket-badge ${badgeCls}">${badgeLabel}</span></td>
    <td>${aiNote}</td>
    <td style="text-align:center;">
      <span class="listed-dot listed-dot--yes" title="Listed"></span>
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
          // Remove from allProducts entirely — unlisted products don't show
          allProducts = allProducts.filter(p => p.id !== id);
          selectedIds.delete(id);
        } else {
          errors++;
        }
      } catch { errors++; }
      done++;
      unlistProgressBar.style.width = Math.round((done / ids.length) * 100) + '%';
      unlistProgressLabel.textContent = `${done} of ${ids.length} processed…`;
    }));
  }

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
    ['ID', 'Name', 'MPN', 'Manufacturer', 'Category', 'Bucket', 'AI Note', 'Confidence'],
  ];
  for (const p of allProducts) {
    const note = aiNotes[p.id] || {};
    rows.push([
      p.id, p.name, p.mpn || '',
      p.manufacturer || '',
      p.categories?.[0]?.name || '',
      p.bucket,
      note.note || '',
      note.confidence || '',
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
