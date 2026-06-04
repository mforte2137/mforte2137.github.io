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
const headerMeta       = { textContent: '' }; // legacy compat

const loadingState     = document.getElementById('loadingState');
const loadingLabel     = document.getElementById('loadingLabel');
const loadingSub       = document.getElementById('loadingSub');

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
let dupMpnGroups = []; // duplicate MPN groups from API filters

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

// ── AUTO-SAVE ─────────────────────────────────────────────────
const STORAGE_KEY = 'sb_cleanup_session';

function autoSave() {
  if (allProducts.length === 0) return;
  const hostname = (() => { try { return new URL(localStorage.getItem('sb_tenant_url')).hostname; } catch { return ''; } })();
  const session = {
    version: 2,
    savedAt: new Date().toISOString(),
    mode: currentMode,
    tenantUrl: localStorage.getItem('sb_tenant_url'),
    hostname,
    activeStepId,
    aiNotes,
    sessionStats,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch(e) {}
}

function getSavedSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function clearSavedSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── SCREEN MANAGEMENT ─────────────────────────────────────────
let currentMode = null;
let activeStepId = null;
let sessionStats = { unlisted: 0, dupsResolved: 0, mfrFixed: 0, startCount: 0 };

function showScreen(id) {
  ['screenWelcome','screenConnect','screenApp'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  loadStoredCreds();

  // Check for saved session
  const saved = getSavedSession();
  if (saved && saved.version === 2 && saved.tenantUrl) {
    const meta = document.getElementById('continueMeta');
    const date = new Date(saved.savedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    if (meta) meta.textContent = `Last saved ${date} · ${saved.hostname || saved.tenantUrl}`;
    const cont = document.getElementById('modeContinue');
    if (cont) cont.style.display = 'flex';
  } else if (saved) {
    // Stale session from old version — clear it
    clearSavedSession();
  }

  // Continue saved session
  document.getElementById('continueBtn')?.addEventListener('click', () => {
    const s = getSavedSession();
    if (!s) { showScreen('screenWelcome'); return; }
    currentMode = s.mode || 'onboarding';
    if (s.aiNotes) aiNotes = s.aiNotes;
    if (s.sessionStats) sessionStats = { ...sessionStats, ...s.sessionStats };
    localStorage.setItem('sb_cleanup_mode', currentMode);
    showConnectScreen(true);
  });

  // Dismiss saved session tile
  document.getElementById('clearSessionBtn')?.addEventListener('click', () => {
    clearSavedSession();
    const cont = document.getElementById('modeContinue');
    if (cont) cont.style.display = 'none';
  });

  // Mode card clicks
  document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignore clicks on buttons inside the continue tile
      if (e.target.tagName === 'BUTTON') return;
      if (!card.dataset.mode || card.id === 'modeContinue') return;
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentMode = card.dataset.mode;
      localStorage.setItem('sb_cleanup_mode', currentMode);
      setTimeout(() => showConnectScreen(), 200);
    });
  });

  // Welcome screen import
  document.getElementById('welcomeImportFile')?.addEventListener('change', handleFileImport);

  // Connect screen
  document.getElementById('backToWelcomeBtn').addEventListener('click', () => showScreen('screenWelcome'));
  document.getElementById('loadBtn').addEventListener('click', handleLoad);

  // Header buttons
  document.getElementById('saveProgressBtn')?.addEventListener('click', handleFileExport);
  document.getElementById('importFile')?.addEventListener('change', handleFileImport);
  document.getElementById('switchAccountBtn')?.addEventListener('click', () => showConnectScreen());

  // Table controls
  document.getElementById('bucketFilter').addEventListener('change', () => {
    activeBucketFilter = document.getElementById('bucketFilter').value;
    currentPage = 1;
    renderTable();
  });
  document.getElementById('tableSearch').addEventListener('input', () => {
    activeSearch = document.getElementById('tableSearch').value.trim().toLowerCase();
    currentPage = 1;
    renderTable();
  });

  // Bulk actions
  document.getElementById('bulkUnlistBtn').addEventListener('click', promptUnlist);
  document.getElementById('bulkClearBtn').addEventListener('click', clearSelection);
  document.getElementById('selectAll').addEventListener('change', handleSelectAll);

  // Modals
  document.getElementById('unlistConfirmBtn').addEventListener('click', executeUnlist);
  document.getElementById('unlistCancelBtn').addEventListener('click', () => {
    document.getElementById('unlistModal').style.display = 'none';
  });
  document.getElementById('dupModalCloseBtn').addEventListener('click', () => {
    document.getElementById('dupModal').style.display = 'none';
  });
  document.getElementById('mfrModalCloseBtn').addEventListener('click', () => {
    document.getElementById('mfrModal').style.display = 'none';
  });

  // Export CSV
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('tableFinishBtn')?.addEventListener('click', showCompletionScreen);

  // NQS
  document.getElementById('nqsLoadBtn').addEventListener('click', handleNqsLoad);
  document.getElementById('nqsFilterBtn').addEventListener('click', handleNqsFilter);
  document.getElementById('nqsMonths').addEventListener('change', () => {
    nqsProductIds.clear();
    nqsActive = false;
    document.getElementById('nqsCount').textContent = '—';
    document.getElementById('nqsDesc').textContent = '';
    document.getElementById('nqsResult').style.display = 'none';
    document.getElementById('nqsFilterBtn').disabled = true;
  });

  // Back to steps
  document.getElementById('backToStepsBtn').addEventListener('click', () => {
    document.getElementById('wizardTable').style.display = 'none';
    document.getElementById('wizardBody').style.display = 'block';
    document.getElementById('wizardFooter').style.display = 'flex';
    nqsActive = false;
    if (activeStepId) showStep(activeStepId);
  });

  // Footer nav
  document.getElementById('footerBackBtn')?.addEventListener('click', handleFooterBack);
  document.getElementById('footerNextBtn')?.addEventListener('click', handleFooterNext);

  showScreen('screenWelcome');
}

function showConnectScreen(resuming = false) {
  const badge = document.getElementById('connectModeBadge');
  const modeLabel = currentMode === 'maintenance' ? '🔧 Ongoing maintenance' : '🚀 First-time cleanup';
  if (badge) badge.textContent = resuming ? `📋 Resuming · ${modeLabel}` : modeLabel;

  // If resuming and we have saved credentials, auto-connect
  if (resuming && localStorage.getItem('sb_tenant_url') && localStorage.getItem('sb_api_key')) {
    showScreen('screenApp');
    handleLoad();
    return;
  }

  showScreen('screenConnect');
}

// ── FILE EXPORT / IMPORT ──────────────────────────────────────
function handleFileExport() {
  const hostname = (() => { try { return new URL(localStorage.getItem('sb_tenant_url')).hostname; } catch { return 'session'; } })();
  const session = {
    version: 2,
    savedAt: new Date().toISOString(),
    mode: currentMode,
    tenantUrl: localStorage.getItem('sb_tenant_url'),
    hostname,
    activeStepId,
    aiNotes,
    sessionStats,
  };
  // Save to localStorage too so Continue tile works on return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)); } catch(e) {}

  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `catalog-cleanup-${hostname}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleFileImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const session = JSON.parse(ev.target.result);
      if (session.aiNotes) aiNotes = session.aiNotes;
      if (session.sessionStats) sessionStats = session.sessionStats;
      if (session.mode) {
        currentMode = session.mode;
        localStorage.setItem('sb_cleanup_mode', currentMode);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      alert(`Session from ${new Date(session.savedAt).toLocaleDateString()} imported. Connect to continue.`);
      showConnectScreen(true);
    } catch {
      alert('Could not read session file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}





// ── CREDENTIALS ───────────────────────────────────────────────
function loadStoredCreds() {
  const tu = document.getElementById('tenantUrl');
  const ak = document.getElementById('apiKey');
  if (tu) tu.value = localStorage.getItem('sb_tenant_url') || '';
  if (ak) ak.value = localStorage.getItem('sb_api_key')    || '';
}
function saveCreds() {
  const tu = document.getElementById('tenantUrl');
  const ak = document.getElementById('apiKey');
  if (tu) localStorage.setItem('sb_tenant_url', tu.value.trim());
  if (ak) localStorage.setItem('sb_api_key',    ak.value.trim());
}
function getCreds() {
  const tu = document.getElementById('tenantUrl');
  const ak = document.getElementById('apiKey');
  return {
    tenantUrl: (tu?.value || localStorage.getItem('sb_tenant_url') || '').trim().replace(/\/$/, ''),
    apiKey:    (ak?.value || localStorage.getItem('sb_api_key')    || '').trim(),
  };
}

// ── LOAD CATALOG ──────────────────────────────────────────────
async function handleLoad() {
  const { tenantUrl, apiKey } = getCreds();
  const credsErrorEl = document.getElementById('credsError');
  if (credsErrorEl) credsErrorEl.textContent = '';
  if (!tenantUrl || !apiKey) {
    if (credsErrorEl) credsErrorEl.textContent = 'Both Tenant URL and API Key are required.';
    return;
  }

  saveCreds();
  allProducts = [];
  selectedIds.clear();
  aiNotes = {};
  dupMpnGroups = [];
  sessionStats = { unlisted: 0, dupsResolved: 0, mfrFixed: 0, startCount: 0 };

  showLoading('Connecting to Salesbuildr…', 'Fetching product catalog by stock status');
  showScreen('screenApp');
  document.getElementById('wizard').style.display = 'none';

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

    headerMeta.textContent = '';
    document.getElementById('headerTenant').textContent =
      `${allProducts.length} products · ${new URL(tenantUrl).hostname}`;
    sessionStats.startCount = allProducts.length;

    // Tag manufacturer mismatches — products where manufacturer = MSP name (PSA import default)
    if (mspName) {
      for (const p of allProducts) {
        p.mfrMismatch = p.manufacturer && p.manufacturer.trim().toLowerCase() === mspName.trim().toLowerCase();
      }
    }

    updateBucketCounts();

    // Fetch duplicate MPN data — dedicated call with no stock filter
    // so we see duplicates across ALL stock groups
    try {
      const dupResp = await fetch('/api/sb-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantUrl, apiKey, size: 1, from: 0 }),
      });
      const dupData = await dupResp.json();
      if (dupData.ok && dupData.filters) {
        const partNumberFilter = dupData.filters.find(f => f.key === 'part-number');
        if (partNumberFilter && Array.isArray(partNumberFilter.values)) {
          dupMpnGroups = partNumberFilter.values.filter(v =>
            v.amount > 1 && v.value && v.value.trim() !== ''
          );
        }
      }
    } catch (e) {
      console.warn('Could not fetch duplicate MPN data:', e);
    }

    if (dupMpnGroups.length > 0) {
      // Update step strip dup count — handled by buildWizard
    }

    showDashboard();
    renderTable();
  } catch (err) {
    showEmpty();
    const credsErrorEl = document.getElementById('credsError');
    if (credsErrorEl) credsErrorEl.textContent = `Error: ${err.message}`;
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

  // Update step panel counts
  const countMap = {
    'step-red-count':    counts.red,
    'step-dups-count':   dupMpnGroups.length,
    'step-mfr-count':    counts.mismatch,
    'step-orange-count': counts.orange,
  };
  for (const [id, val] of Object.entries(countMap)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // Refresh step strip
  if (document.getElementById('wizard')?.style.display !== 'none') {
    const steps = getSteps();
    buildStepStrip(steps);
    if (activeStepId) {
      const pill = document.querySelector(`[data-step="${activeStepId}"]`);
      if (pill) pill.classList.add('active');
    }
  }

  return counts;
}

// ── AI ANALYSIS ───────────────────────────────────────────────
// Only analyze orange — red is self-evident (no MPN), green is confirmed good,
// yellow is real products temporarily out of stock (stock data tells the story).
// Run 3 batches in parallel for speed.
async function handleAnalyze() {
  const analyzeBtn = document.getElementById('stepOrangeAnalyzeBtn');
  if (analyzeBtn) { analyzeBtn.disabled = true; analyzeBtn.textContent = 'ANALYZING…'; }

  const progressWrap  = document.getElementById('stepOrangeProgress');
  const progressFill  = document.getElementById('analysisProgressFill');
  const progressDetail = document.getElementById('analysisProgressDetail');
  const progressLabel = document.getElementById('analysisProgress');
  if (progressWrap) progressWrap.style.display = 'block';
  if (progressFill) progressFill.style.width = '0%';

  const candidates = allProducts.filter(p => p.bucket === 'orange');
  const total = candidates.length;
  let done = 0;
  let errors = 0;

  const updateProgress = () => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = `${pct}% complete`;
    if (progressDetail) progressDetail.textContent =
      `${done} of ${total} products analyzed${errors > 0 ? ` · ${errors} failed` : ''} · running in parallel batches`;
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
  if (progressFill) progressFill.style.width = '100%';
  if (progressLabel) progressLabel.textContent = `Complete`;
  if (progressDetail) progressDetail.textContent =
    `${total} products analyzed${errors > 0 ? ` · ${errors} batches failed — re-analyze to retry` : ' · all batches succeeded'}`;

  updateBucketCounts();
  renderTable();
  updateTableFinishBtn();
  // Refresh the step strip
  buildWizard(activeStepId);

  if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.textContent = 'RE-ANALYZE'; }
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

// ── DUPLICATE MPNs ────────────────────────────────────────────
async function handleDupView() {
  const modal = document.getElementById('dupModal');
  const body  = document.getElementById('dupModalBody');
  modal.style.display = 'flex';
  body.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">Loading duplicate products…</p>';

  if (dupMpnGroups.length === 0) {
    body.innerHTML = '<p style="color:var(--text-muted);font-size:12px;">No duplicate MPNs found.</p>';
    return;
  }

  const sorted = [...dupMpnGroups].sort((a, b) => b.amount - a.amount);
  const { tenantUrl, apiKey } = getCreds();

  // For each group, fetch ALL products with that MPN from the API
  // so we're not limited to what's in the current stock-filtered view
  const groupProducts = {};
  for (const group of sorted) {
    try {
      const resp = await fetch('/api/sb-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantUrl, apiKey,
          size: 50, from: 0,
          mpnQuery: group.value,
        }),
      });
      const data = await resp.json();
      if (data.ok) {
        // Filter to exact MPN match and listed only
        const listed = (data.results || []).filter(p =>
          p.mpn && p.mpn.trim().toLowerCase() === group.value.trim().toLowerCase()
          && p.listed !== false
        );
        // Only keep groups that still have 2+ listed products
        if (listed.length >= 2) groupProducts[group.value] = listed;
      }
    } catch (e) {
      groupProducts[group.value] = [];
    }
  }

  // If nothing left to clean up
  const activeGroups = sorted.filter(g => groupProducts[g.value]?.length >= 2);

  // Update step strip count
  const stepDupsCount = document.getElementById('step-dups-count');
  if (stepDupsCount) stepDupsCount.textContent = activeGroups.length;
  // Update step guidance desc if available
  const stepDupsDesc = document.getElementById('step-dups-desc');
  if (stepDupsDesc) stepDupsDesc.textContent = activeGroups.length > 0
    ? `${activeGroups.length} part numbers still have multiple listed products`
    : 'No listed duplicates — catalog looks clean';

  if (activeGroups.length === 0) {
    body.innerHTML = '<p style="color:var(--text-mid);font-size:13px;">No duplicate MPNs with multiple listed products found — catalog looks clean!</p>';
    return;
  }

  // Global unlist button
  const globalBar = document.createElement('div');
  globalBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:12px 16px;background:var(--bg-alt);border:1px solid var(--border);';
  globalBar.innerHTML = `<p style="font-size:12px;color:var(--text-mid);margin:0;">
    ${activeGroups.length} part numbers still have multiple listed products. Check duplicates to remove, keep the preferred version unchecked.
  </p>`;
  const globalUnlistBtn = document.createElement('button');
  globalUnlistBtn.className = 'btn btn-danger';
  globalUnlistBtn.textContent = 'UNLIST ALL CHECKED';
  globalUnlistBtn.disabled = true;
  globalUnlistBtn.style.whiteSpace = 'nowrap';
  globalUnlistBtn.style.marginLeft = '16px';
  globalBar.appendChild(globalUnlistBtn);
  body.innerHTML = '';
  body.appendChild(globalBar);

  const allCheckboxes = [];

  for (const group of activeGroups) {
    const products = groupProducts[group.value] || [];
    const groupEl = document.createElement('div');
    groupEl.className = 'dup-mpn-group';

    const headerEl = document.createElement('div');
    headerEl.className = 'dup-mpn-header';
    headerEl.innerHTML = `
      <div class="dup-mpn-value">${escHtml(group.value)}</div>
      <span class="dup-mpn-count">${products.length} product${products.length !== 1 ? 's' : ''}</span>
    `;
    groupEl.appendChild(headerEl);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'dup-mpn-body';

    if (products.length === 0) {
      bodyEl.innerHTML = `<div class="dup-mpn-product" style="color:var(--text-muted);">
        No listed products found for this MPN.
      </div>`;
    } else {
      for (const p of products) {
        const row = document.createElement('div');
        row.className = 'dup-mpn-product';
        row.style.cssText = 'display:flex;align-items:center;gap:10px;';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.dataset.id = p.id;
        allCheckboxes.push(chk);

        chk.addEventListener('change', () => {
          const checkedCount = allCheckboxes.filter(c => c.checked).length;
          globalUnlistBtn.disabled = checkedCount === 0;
          globalUnlistBtn.textContent = checkedCount > 0
            ? `UNLIST ${checkedCount} CHECKED`
            : 'UNLIST ALL CHECKED';
        });

        const label = document.createElement('span');
        label.style.flex = '1';
        label.innerHTML = `<strong>${escHtml(p.name)}</strong>
          <span style="color:var(--text-muted);margin-left:8px;">${escHtml(p.manufacturer || '—')}</span>
          <span style="color:var(--text-muted);margin-left:8px;font-family:var(--font-mono);font-size:10px;">${escHtml(p.categories?.[0]?.name || '—')}</span>`;

        row.appendChild(chk);
        row.appendChild(label);
        bodyEl.appendChild(row);
      }
    }

    groupEl.appendChild(bodyEl);
    body.appendChild(groupEl);
  }

  globalUnlistBtn.addEventListener('click', async () => {
    const toUnlist = allCheckboxes.filter(c => c.checked);
    if (toUnlist.length === 0) return;

    globalUnlistBtn.disabled = true;
    globalUnlistBtn.textContent = 'UNLISTING…';

    let done = 0, errors = 0;

    for (const chk of toUnlist) {
      try {
        const resp = await fetch('/api/sb-unlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantUrl, apiKey, productId: chk.dataset.id }),
        });
        const result = await resp.json();
        if (resp.ok && result.ok) {
          allProducts = allProducts.filter(p => p.id !== chk.dataset.id);
          done++;
          const row = chk.closest('.dup-mpn-product');
          if (row) row.style.opacity = '0.35';
          chk.disabled = true;
        } else { errors++; }
      } catch { errors++; }
    }

    updateBucketCounts();
    renderTable();
    sessionStats.dupsResolved += done;
    autoSave();
    checkCompletion();

    globalUnlistBtn.textContent = errors === 0
      ? `✓ ${done} UNLISTED`
      : `${done} ok · ${errors} failed`;
    globalUnlistBtn.style.background = errors === 0 ? 'var(--green)' : 'var(--red)';
    globalUnlistBtn.style.borderColor = errors === 0 ? 'var(--green)' : 'var(--red)';
  });
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
      Review each group, adjust the name if needed, then click UPDATE ALL to fix them in Salesbuildr.
      The manufacturer must exist as a company in SB — if not found, add it there first.
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
        <button class="btn btn-primary mfr-update-btn"
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
      const mfrNameToUse = input.value.trim();
      if (!mfrNameToUse) return;

      btn.disabled = true;
      btn.textContent = 'LOOKING UP…';

      // Look up company ID first
      let companyId = null;
      try {
        const compResp = await fetch('/api/sb-company-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantUrl, apiKey, query: mfrNameToUse }),
        });
        const compData = await compResp.json();
        if (compData.ok && compData.companyId) {
          companyId = compData.companyId;
        }
      } catch (e) {
        console.error('Company lookup failed:', e);
      }

      if (!companyId) {
        // Persistent blocked state — amber border, stays until they retry
        groupEl.classList.add('mfr-group--blocked');
        // Remove old blocked note if exists
        const oldNote = groupEl.querySelector('.mfr-blocked-note');
        if (oldNote) oldNote.remove();
        const note = document.createElement('div');
        note.className = 'mfr-blocked-note';
        note.innerHTML = `⚠ "${mfrNameToUse}" not found in Salesbuildr. Go to <strong>Companies → Create New Company</strong>, set the name to <strong>${escHtml(mfrNameToUse)}</strong> and type to <strong>Manufacturer</strong>, then click Update All again.`;
        groupEl.appendChild(note);
        btn.disabled = false;
        btn.textContent = 'UPDATE ALL';
        btn.style.background = '';
        btn.style.borderColor = '';
        return;
      }

      btn.textContent = 'UPDATING…';

      const ids = products.map(p => p.id);
      let done = 0, errors = 0;

      document.getElementById('progressModalTitle').textContent = `UPDATING — ${mfrNameToUse}`;
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
              body: JSON.stringify({
                tenantUrl, apiKey,
                productId: id,
                fields: { vendor: companyId },
                skipLookup: true,
              }),
            });
            const result = await resp.json();
            if (resp.ok && result.ok) {
              const p = allProducts.find(x => x.id === id);
              if (p) { p.manufacturer = mfrNameToUse; p.mfrMismatch = false; }
            } else { errors++; }
          } catch { errors++; }
          done++;
          document.getElementById('unlistProgressBar').style.width =
            Math.round((done / ids.length) * 100) + '%';
          document.getElementById('unlistProgressLabel').textContent =
            `${done} of ${ids.length} updated…`;
        }));
      }

      document.getElementById('unlistProgressLabel').textContent = errors === 0
        ? `Done — ${done} products updated to "${mfrNameToUse}".`
        : `${done - errors} succeeded, ${errors} failed.`;

      if (errors === 0) {
        setTimeout(() => { document.getElementById('progressModal').style.display = 'none'; }, 3000);
      } else {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.textContent = 'CLOSE';
        closeBtn.style.marginTop = '12px';
        closeBtn.addEventListener('click', () => {
          document.getElementById('progressModal').style.display = 'none';
        });
        document.getElementById('progressModal').querySelector('.modal-body').appendChild(closeBtn);
      }

      updateBucketCounts();
      renderTable();
      sessionStats.mfrFixed += (done - errors);
      autoSave();
      checkCompletion();

      btn.textContent = errors === 0 ? '✓ UPDATED' : `${errors} FAILED`;
      btn.style.background = errors === 0 ? 'var(--green)' : 'var(--red)';
      btn.style.borderColor = errors === 0 ? 'var(--green)' : 'var(--red)';
      groupEl.style.opacity = errors === 0 ? '0.5' : '1';
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
    document.getElementById('nqsResult').style.display = 'flex';
    document.getElementById('step-nqs-count').textContent = count;
    filterBtn.disabled = count === 0;

  } catch (err) {
    document.getElementById('nqsDesc').textContent = `Error: ${err.message}`;
  }

  loadBtn.disabled = false;
  loadBtn.textContent = 'LOAD';
}

function handleNqsFilter() {
  nqsActive = true;
  activeBucketFilter = 'actionable';
  document.getElementById('bucketFilter').value = 'actionable';
  showTableView('NOT RECENTLY QUOTED');
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
    <div style="background:var(--green-bg);border-left:4px solid var(--green);padding:12px 16px;margin-bottom:16px;">
      <p style="font-size:13px;color:var(--green);font-weight:700;margin-bottom:4px;">✓ You are not deleting these products.</p>
      <p style="font-size:12px;color:var(--text-mid);line-height:1.5;">Unlisting marks them as inactive in Salesbuildr and syncs to your PSA. They remain in the system and can be re-listed at any time in seconds.</p>
    </div>
    <p style="font-size:13px;color:var(--text-mid);margin-bottom:12px;">You are about to <strong>unlist ${count} product${count !== 1 ? 's' : ''}</strong>:</p>
    <ul style="margin:0 0 12px;padding-left:20px;font-size:12px;color:var(--text-mid);">
      ${names}${more}
    </ul>`;

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
  updateTableFinishBtn();
  sessionStats.unlisted += (done - errors);
  autoSave();
  checkCompletion();

  unlistProgressLabel.textContent = errors === 0
    ? `Done — ${done} products unlisted successfully.`
    : `Done — ${done - errors} succeeded, ${errors} failed.`;

  setTimeout(() => { progressModal.style.display = 'none'; }, 3000);
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
  loadingLabel.textContent = label;
  loadingSub.textContent = sub;
  loadingState.style.display = 'flex';
  const wiz = document.getElementById('wizard');
  if (wiz) wiz.style.display = 'none';
}
function updateLoadingLabel(label, sub) {
  loadingLabel.textContent = label;
  if (sub) loadingSub.textContent = sub;
}
function showDashboard() {
  loadingState.style.display = 'none';
  showScreen('screenApp');
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('wizard').style.display = 'flex';
  document.getElementById('wizardBody').style.display = 'block';
  document.getElementById('wizardTable').style.display = 'none';
  document.getElementById('headerActions').style.display = 'flex';

  // Pass saved step directly into buildWizard so there's no race condition
  const saved = getSavedSession();
  buildWizard(saved?.activeStepId || null);
}

function buildWizard(resumeStepId = null) {
  const steps = getSteps();
  buildStepStrip(steps);
  const wf = document.getElementById('wizardFooter');
  if (wf) wf.style.display = 'none';

  const counts = getCounts();
  const countMap = {
    red: counts.red, dups: dupMpnGroups.length,
    mfr: counts.mismatch, orange: counts.orange, nqs: null,
  };

  // Mark empty steps as done immediately
  steps.forEach(s => { if (countMap[s.id] === 0) markStepDone(s.id); });

  // Resume to saved step if valid, otherwise first step with items
  let target = null;
  if (resumeStepId) target = steps.find(s => s.id === resumeStepId);
  if (!target) target = steps.find(s => countMap[s.id] === null || countMap[s.id] > 0);
  if (!target && steps.length) target = steps[0];
  if (target) showStep(target.id);
}

function getSteps() {
  const counts = getCounts();
  const steps = [
    {
      id: 'red',
      label: 'Unlist Candidates',
      count: counts.red,
      show: true,
    },
    {
      id: 'dups',
      label: 'Duplicate MPNs',
      count: null, // shown as — until modal verifies real count
      show: dupMpnGroups.length > 0,
    },
    {
      id: 'mfr',
      label: 'Manufacturer Mismatch',
      count: counts.mismatch,
      show: counts.mismatch > 0,
    },
    {
      id: 'orange',
      label: 'Likely Unlist',
      count: counts.orange,
      show: true,
    },
  ];

  // Only show NQS for maintenance mode
  if (currentMode === 'maintenance') {
    steps.push({
      id: 'nqs',
      label: 'Not Recently Quoted',
      count: nqsProductIds.size || null,
      show: true,
    });
  }

  return steps.filter(s => s.show);
}

function getCounts() {
  const counts = { green: 0, yellow: 0, orange: 0, red: 0, mismatch: 0 };
  for (const p of allProducts) {
    if (counts[p.bucket] !== undefined) counts[p.bucket]++;
    if (p.mfrMismatch) counts.mismatch++;
  }
  return counts;
}

function buildStepStrip(steps) {
  const strip = document.getElementById('stepStrip');
  strip.innerHTML = '';
  steps.forEach((step, i) => {
    const pill = document.createElement('div');
    pill.className = 'step-pill';
    pill.dataset.step = step.id;
    pill.innerHTML = `
      <span class="step-pill-num">${i + 1}</span>
      <span class="step-pill-label">${step.label}</span>
      ${step.count !== null ? `<span class="step-pill-count">${step.count}</span>` : ''}
    `;
    pill.addEventListener('click', () => showStep(step.id));
    strip.appendChild(pill);
  });
}

function showStep(stepId) {
  activeStepId = stepId;
  autoSave();
  const steps = getSteps();

  document.querySelectorAll('.step-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.step === stepId);
  });

  document.querySelectorAll('.step-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`step-${stepId}`);
  if (!panel) return;
  panel.style.display = 'block';

  const stepIndex = steps.findIndex(s => s.id === stepId);
  panel.querySelectorAll('.step-num-val').forEach(el => el.textContent = stepIndex + 1);

  const counts = getCounts();
  const countMap = {
    red: counts.red, dups: dupMpnGroups.length,
    mfr: counts.mismatch, orange: counts.orange,
    nqs: nqsProductIds.size || null,
  };
  const countEl = document.getElementById(`step-${stepId}-count`);
  if (countEl && countMap[stepId] !== null) countEl.textContent = countMap[stepId];

  wireStepButtons(stepId);
  updateFooter(steps, stepIndex);

  document.getElementById('wizardTable').style.display = 'none';
  document.getElementById('wizardBody').style.display = 'block';
  // Make sure step panels are visible, completion hidden
  const sc = document.getElementById('stepsContainer');
  if (sc) sc.style.display = 'block';
  const cc = document.getElementById('completionContent');
  if (cc) cc.style.display = 'none';
}

function updateFooter(steps, stepIndex) {
  // Hide the fixed footer bar — we put nav inside the step panel instead
  const footer = document.getElementById('wizardFooter');
  if (footer) footer.style.display = 'none';

  const panel = document.getElementById(`step-${steps[stepIndex].id}`);
  if (!panel) return;

  // Remove any existing inline nav
  const existing = panel.querySelector('.step-inline-nav');
  if (existing) existing.remove();

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // On last step (Likely Unlist), only show FINISH after AI has run
  const isOrangeStep = steps[stepIndex].id === 'orange';
  const analysisRun = Object.keys(aiNotes).length > 0;
  const showFinish = isLast && (!isOrangeStep || analysisRun);
  const nextLabel = showFinish ? 'FINISH ✓' : isOrangeStep ? 'SKIP & FINISH →' : 'NEXT →';

  const nav = document.createElement('div');
  nav.className = 'step-inline-nav';
  nav.innerHTML = `
    <button class="btn btn-secondary step-nav-back">${isFirst ? '← BACK TO START' : '← BACK'}</button>
    <span class="step-nav-indicator">Step ${stepIndex + 1} of ${steps.length}</span>
    <button class="btn btn-primary step-nav-next">${nextLabel}</button>
  `;

  nav.querySelector('.step-nav-back').addEventListener('click', handleFooterBack);
  nav.querySelector('.step-nav-next').addEventListener('click', handleFooterNext);

  panel.querySelector('.step-panel-body').appendChild(nav);
}

function handleFooterBack() {
  const steps = getSteps();
  const idx = steps.findIndex(s => s.id === activeStepId);
  if (idx <= 0) {
    showScreen('screenConnect');
    document.getElementById('wizardFooter').style.display = 'none';
  } else {
    showStep(steps[idx - 1].id);
  }
}

function handleFooterNext() {
  const steps = getSteps();
  const idx = steps.findIndex(s => s.id === activeStepId);
  if (idx >= steps.length - 1) {
    showCompletionScreen();
  } else {
    showStep(steps[idx + 1].id);
  }
}
function wireStepButtons(stepId) {
  const counts = getCounts();
  const countMap = { red: counts.red, dups: dupMpnGroups.length, mfr: counts.mismatch, orange: counts.orange };
  const count = countMap[stepId];
  const actionsEl = document.querySelector(`#step-${stepId} .step-actions-primary`);

  // If step is empty, show clean done state
  if (count === 0 && actionsEl) {
    actionsEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg-alt);border-left:4px solid var(--green);">
        <span style="font-size:18px;">✓</span>
        <span style="font-size:13px;color:var(--text-mid);">Nothing to do here — this step is already clean.</span>
      </div>`;
    return;
  }

  if (stepId === 'red') {
    const btn = document.getElementById('stepRedFilterBtn');
    if (btn) btn.onclick = () => {
      activeBucketFilter = 'red';
      document.getElementById('bucketFilter').value = 'red';
      showTableView('UNLIST CANDIDATES');
    };
  }

  if (stepId === 'dups') {
    const btn = document.getElementById('stepDupsBtn');
    if (btn) btn.onclick = handleDupView;
  }

  if (stepId === 'mfr') {
    const btn = document.getElementById('stepMfrBtn');
    if (btn) btn.onclick = handleFixManufacturers;
  }

  if (stepId === 'orange') {
    const analyzeBtn = document.getElementById('stepOrangeAnalyzeBtn');
    if (analyzeBtn) {
      const hasNotes = Object.keys(aiNotes).length > 0;
      if (hasNotes) {
        analyzeBtn.textContent = 'REVIEW PRODUCTS';
        analyzeBtn.onclick = () => {
          activeBucketFilter = 'orange';
          document.getElementById('bucketFilter').value = 'orange';
          showTableView('LIKELY UNLIST');
        };
      } else {
        analyzeBtn.textContent = 'ANALYZE & REVIEW';
        analyzeBtn.onclick = async () => {
          await handleAnalyze();
          activeBucketFilter = 'orange';
          document.getElementById('bucketFilter').value = 'orange';
          showTableView('LIKELY UNLIST');
        };
      }
    }
  }
}

function showTableView(title) {
  document.getElementById('wizardBody').style.display = 'none';
  document.getElementById('wizardTable').style.display = 'block';
  document.getElementById('tableTitle').textContent = title;
  updateTableFinishBtn();
  renderTable();
  window.scrollTo(0, 0);
}

function updateTableFinishBtn() {
  const steps = getSteps();
  const isLastStep = steps.length > 0 && activeStepId === steps[steps.length - 1].id;
  const analysisRun = Object.keys(aiNotes).length > 0;
  const finishBtn = document.getElementById('tableFinishBtn');
  if (finishBtn) finishBtn.style.display = (isLastStep && analysisRun) ? 'inline-block' : 'none';
}

function checkCompletion() {
  const counts = getCounts();
  // Mark individual steps as done when count hits 0
  if (counts.red === 0) markStepDone('red');
  if (counts.mismatch === 0) markStepDone('mfr');
  // Dup step done only after modal has verified (step-dups-count updated)
  const dupsCountEl = document.getElementById('step-dups-count');
  if (dupsCountEl && dupsCountEl.textContent === '0') markStepDone('dups');
  autoSave();
}

function markStepDone(stepId) {
  const pill = document.querySelector(`[data-step="${stepId}"]`);
  if (pill && !pill.classList.contains('done')) {
    pill.classList.add('done');
    const numEl = pill.querySelector('.step-pill-num');
    if (numEl) numEl.textContent = '✓';
  }
}

function showCompletionScreen() {
  clearSavedSession();
  const counts = getCounts();
  const greenCount  = counts.green;
  const yellowCount = counts.yellow;
  const orangeCount = counts.orange;
  const redCount    = counts.red;

  const tile = (icon, num, label, desc, color='var(--green)', stepId=null) => {
    const clickable = stepId && num > 0;
    return `
    <div class="completion-tile ${clickable ? 'completion-tile--clickable' : ''}"
      ${clickable ? `data-step="${stepId}" role="button" tabindex="0"` : ''}>
      <div class="completion-tile-icon">${icon}</div>
      <div class="completion-tile-num" style="color:${color};">${num}</div>
      <div class="completion-tile-label">${label}</div>
      <div class="completion-tile-desc">${desc}</div>
      ${clickable ? '<div class="completion-tile-cta">Click to continue →</div>' : ''}
    </div>`;
  };

  const mismatchRemaining = counts.mismatch;
  const actionTiles = [
    sessionStats.unlisted > 0
      ? tile('🗑', sessionStats.unlisted, 'Products Unlisted',
          'Removed from active catalog. Not deleted — can be re-listed any time.', 'var(--green)')
      : tile('✓', 0, 'Unlist Candidates', 'No products needed unlisting.', 'var(--text-muted)'),
    sessionStats.dupsResolved > 0
      ? tile('🔗', sessionStats.dupsResolved, 'Duplicates Resolved',
          'Kept one listing per part number, unlisted the rest.', 'var(--green)')
      : tile('✓', 0, 'Duplicate MPNs', 'No duplicates found.', 'var(--text-muted)'),
    sessionStats.mfrFixed > 0 && mismatchRemaining > 0
      ? tile('🏷', sessionStats.mfrFixed, 'Manufacturers Fixed (partial)',
          `${mismatchRemaining} still need fixing. Click to go back and finish.`, 'var(--orange)', 'mfr')
      : sessionStats.mfrFixed > 0
        ? tile('🏷', sessionStats.mfrFixed, 'Manufacturers Fixed',
            'All updated to the correct manufacturer.', 'var(--green)')
        : tile('✓', 0, 'Manufacturers', 'No manufacturer mismatches found.', 'var(--text-muted)'),
  ].join('');

  const catalogTiles = [
    tile('🟢', greenCount, 'Ready to Sell',
      'In stock and connected to distributors. Ready to go on quotes right now.', '#2d6a4f'),
    tile('🟡', yellowCount, 'Temporarily Unavailable',
      'Real products that are back-ordered or temporarily out of stock. We left these alone — they will come back.', '#7d5a00'),
    orangeCount > 0 ? tile('🟠', orangeCount, 'Still to Review',
      'Not found in any distributor. Click to go back and review these.', 'var(--orange)', 'orange') : '',
    redCount > 0 ? tile('🔴', redCount, 'Still Needs Attention',
      'No valid part number. Click to go back and unlist these.', 'var(--red)', 'red') : '',
  ].join('');

  // Hide step panels, show completion in separate div
  const stepsContainer = document.getElementById('stepsContainer');
  if (stepsContainer) stepsContainer.style.display = 'none';

  let completionDiv = document.getElementById('completionContent');
  if (!completionDiv) {
    completionDiv = document.createElement('div');
    completionDiv.id = 'completionContent';
    document.getElementById('wizardBody').appendChild(completionDiv);
  }
  completionDiv.style.display = 'block';
  completionDiv.innerHTML = `
    <div class="completion-wrap">
      <div class="completion-header">
        <div class="completion-check">✓</div>
        <h2 class="completion-title">Great work. Your catalog is cleaner.</h2>
        <p class="completion-sub">Here is a summary of this session.</p>
        <button class="btn btn-secondary" id="completionBackBtn" style="margin-top:16px;">← Jump back in and do more</button>
      </div>

      <div class="completion-section-label">WHAT YOU DID THIS SESSION</div>
      <div class="completion-tiles">${actionTiles}</div>

      <div class="completion-section-label">YOUR CATALOG NOW — click any tile to continue working</div>
      <div class="completion-tiles">${catalogTiles}</div>

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:40px;">
        <button class="btn btn-secondary" onclick="location.reload()">START OVER</button>
        <button class="btn btn-primary" onclick="handleExport()">EXPORT REPORT</button>
      </div>
    </div>
  `;

  // Wire clicks via event delegation on the completionDiv (tiles are injected via innerHTML)
  function resumeFromCompletion(stepId) {
    const cd = document.getElementById('completionContent');
    if (cd) cd.style.display = 'none';
    const sc = document.getElementById('stepsContainer');
    if (sc) sc.style.display = 'block';
    buildWizard(stepId || null);
  }

  completionDiv.addEventListener('click', (e) => {
    const tile = e.target.closest('.completion-tile--clickable');
    if (tile) {
      resumeFromCompletion(tile.dataset.step);
      return;
    }
    if (e.target.id === 'completionBackBtn') {
      resumeFromCompletion(null);
    }
  });

  document.getElementById('wizardBody').style.display = 'block';
  document.getElementById('wizardTable').style.display = 'none';
  window.scrollTo(0, 0);
}


function showEmpty() {
  loadingState.style.display = 'none';
  showScreen('screenConnect');
}
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── START ─────────────────────────────────────────────────────
init();
