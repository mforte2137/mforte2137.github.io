/* ── DOM REFS ── */
const sbTenantUrl       = document.getElementById('sbTenantUrl');
const sbApiKey          = document.getElementById('sbApiKey');
const sbRemember        = document.getElementById('sbRemember');
const fetchBtn          = document.getElementById('fetchBtn');
const fetchStatus       = document.getElementById('fetchStatus');
const statsSection      = document.getElementById('statsSection');
const statTotal         = document.getElementById('statTotal');
const statDelete        = document.getElementById('statDelete');
const statReview        = document.getElementById('statReview');
const statOk            = document.getElementById('statOk');
const emptyState        = document.getElementById('emptyState');
const resultsArea       = document.getElementById('resultsArea');
const listDelete        = document.getElementById('listDelete');
const listReview        = document.getElementById('listReview');
const listOk            = document.getElementById('listOk');
const countDelete       = document.getElementById('countDelete');
const countReview       = document.getElementById('countReview');
const countOk           = document.getElementById('countOk');
const selectAllDelete   = document.getElementById('selectAllDelete');
const selectAllReview   = document.getElementById('selectAllReview');
const toggleOkBtn       = document.getElementById('toggleOkBtn');
const queueSection      = document.getElementById('queueSection');
const queueList         = document.getElementById('queueList');
const queueEmpty        = document.getElementById('queueEmpty');
const queueConfirm      = document.getElementById('queueConfirm');
const stageBtn          = document.getElementById('stageBtn');
const deleteConfirmInput= document.getElementById('deleteConfirmInput');
const executeDeleteBtn  = document.getElementById('executeDeleteBtn');
const deleteCount       = document.getElementById('deleteCount');
const deletePlural      = document.getElementById('deletePlural');
const deleteStatus      = document.getElementById('deleteStatus');
const cardTemplate      = document.getElementById('widgetCardTemplate');

/* ── CONSTANTS ── */
const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

/* ── STATE ── */
let allWidgets   = [];  // raw from API
let analysed     = { safe: [], review: [], ok: [] };  // after analysis
let stagedIds    = new Set();  // widget IDs staged for deletion

/* ── INIT ── */
function initSbCredentials() {
  const savedApi    = localStorage.getItem(LS_API_KEY);
  const savedTenant = localStorage.getItem(LS_TENANT_URL);
  if (savedApi)    sbApiKey.value    = savedApi;
  if (savedTenant) sbTenantUrl.value = savedTenant;
  if (savedApi && savedTenant) sbRemember.checked = true;
  updateFetchBtn();
}

function updateFetchBtn() {
  fetchBtn.disabled = !(sbApiKey.value.trim() && sbTenantUrl.value.trim());
}

/* ── FETCH & ANALYSE ── */
async function fetchAndAnalyse() {
  const apiKey    = sbApiKey.value.trim();
  const tenantUrl = sbTenantUrl.value.trim();
  if (!apiKey || !tenantUrl) return;

  if (sbRemember.checked) {
    localStorage.setItem(LS_API_KEY,    apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_TENANT_URL);
  }

  setFetchStatus('Fetching widget library…', '');
  fetchBtn.disabled = true;
  emptyState.style.display    = 'none';
  resultsArea.style.display   = 'none';
  statsSection.style.display  = 'none';
  queueSection.style.display  = 'none';

  // 1. Fetch widgets from Salesbuildr
  let widgets;
  try {
    const res = await fetch('/api/widget-cleaner-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list', apiKey, tenantUrl })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed to fetch widgets');
    widgets = data.widgets;
  } catch (err) {
    setFetchStatus('Error: ' + err.message, 'error');
    fetchBtn.disabled = false;
    emptyState.style.display = 'flex';
    return;
  }

  allWidgets = widgets;

  if (!widgets.length) {
    setFetchStatus('No widgets found in this account.', '');
    fetchBtn.disabled = false;
    emptyState.style.display = 'flex';
    return;
  }

  setFetchStatus(`Fetched ${widgets.length} widget${widgets.length !== 1 ? 's' : ''}. Analysing with AI…`, '');

  // 2. Send to Claude for analysis
  let groups;
  try {
    const res = await fetch('/api/analyse-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Analysis failed');
    groups = data.groups;
  } catch (err) {
    setFetchStatus('Analysis error: ' + err.message, 'error');
    fetchBtn.disabled = false;
    return;
  }

  // 3. Render
  analysed = groups;
  renderResults();
  fetchBtn.disabled = false;
  setFetchStatus(`Analysis complete — ${widgets.length} widgets reviewed.`, 'success');
}

/* ── RENDER RESULTS ── */
function renderResults() {
  listDelete.innerHTML = '';
  listReview.innerHTML = '';
  listOk.innerHTML     = '';
  stagedIds.clear();

  // Render each group
  analysed.safe.forEach(w   => renderCard(w, listDelete, true));
  analysed.review.forEach(w => renderCard(w, listReview, false));
  analysed.ok.forEach(w     => renderCard(w, listOk, false));

  // Counts
  countDelete.textContent = analysed.safe.length;
  countReview.textContent = analysed.review.length;
  countOk.textContent     = analysed.ok.length;

  // Stats panel
  statTotal.textContent  = allWidgets.length;
  statDelete.textContent = analysed.safe.length;
  statReview.textContent = analysed.review.length;
  statOk.textContent     = analysed.ok.length;
  statsSection.style.display = 'block';

  // Show/hide groups
  document.getElementById('groupDelete').style.display = analysed.safe.length   ? 'block' : 'none';
  document.getElementById('groupReview').style.display = analysed.review.length ? 'block' : 'none';
  document.getElementById('groupOk').style.display     = analysed.ok.length     ? 'block' : 'none';

  resultsArea.style.display = 'block';

  // Pre-check "safe to delete" items → auto-populate queue state
  syncQueueFromCheckboxes();
  updateStageBtn();
  queueSection.style.display = 'block';
}

function renderCard(widget, container, defaultChecked) {
  const clone = cardTemplate.content.cloneNode(true);
  const card  = clone.querySelector('.widget-card');
  card.dataset.id = widget.id;

  const checkbox = clone.querySelector('.widget-checkbox');
  checkbox.checked = defaultChecked;
  checkbox.dataset.id = widget.id;
  checkbox.addEventListener('change', () => {
    syncQueueFromCheckboxes();
    updateStageBtn();
  });

  clone.querySelector('.widget-name').textContent  = widget.name;
  clone.querySelector('.widget-type-badge').textContent = widgetTypeLabel(widget.widget);
  clone.querySelector('.widget-reason').textContent = widget.reason || '';
  clone.querySelector('.widget-json').textContent   = JSON.stringify(widget.widget, null, 2);

  const expandBtn  = clone.querySelector('.expand-btn');
  const detailPane = clone.querySelector('.widget-detail');
  expandBtn.addEventListener('click', () => {
    const open = expandBtn.getAttribute('aria-expanded') === 'true';
    expandBtn.setAttribute('aria-expanded', String(!open));
    expandBtn.textContent      = open ? 'Details' : 'Hide';
    detailPane.style.display   = open ? 'none' : 'block';
  });

  container.appendChild(clone);
}

function widgetTypeLabel(widgetObj) {
  if (!widgetObj) return 'unknown';
  if (widgetObj.type) return widgetObj.type;
  // Infer from keys
  if (widgetObj.items !== undefined)   return 'items';
  if (widgetObj.html  !== undefined)   return 'html-content';
  if (widgetObj.content !== undefined) return 'content';
  if (widgetObj.mediaUrl !== undefined) return 'single-media';
  if (widgetObj.imageUrl !== undefined) return 'image';
  if (widgetObj.fields !== undefined)  return 'form';
  return 'widget';
}

/* ── SELECT ALL ── */
selectAllDelete.addEventListener('change', () => {
  listDelete.querySelectorAll('.widget-checkbox').forEach(cb => {
    cb.checked = selectAllDelete.checked;
  });
  syncQueueFromCheckboxes();
  updateStageBtn();
});
selectAllReview.addEventListener('change', () => {
  listReview.querySelectorAll('.widget-checkbox').forEach(cb => {
    cb.checked = selectAllReview.checked;
  });
  syncQueueFromCheckboxes();
  updateStageBtn();
});

/* ── TOGGLE OK ── */
toggleOkBtn.addEventListener('click', () => {
  const open = listOk.style.display !== 'none';
  listOk.style.display  = open ? 'none' : 'flex';
  toggleOkBtn.textContent = open ? 'Show' : 'Hide';
});

/* ── QUEUE LOGIC ── */
function syncQueueFromCheckboxes() {
  // Collect all checked IDs across delete + review lists
  const checked = new Set();
  document.querySelectorAll('#listDelete .widget-checkbox:checked, #listReview .widget-checkbox:checked').forEach(cb => {
    checked.add(cb.dataset.id);
  });
  stagedIds = checked;
  renderQueue();
}

function renderQueue() {
  queueList.innerHTML = '';

  if (stagedIds.size === 0) {
    queueEmpty.style.display   = 'block';
    queueConfirm.style.display = 'none';
    return;
  }

  queueEmpty.style.display = 'none';

  stagedIds.forEach(id => {
    const widget = allWidgets.find(w => w.id === id);
    if (!widget) return;
    const item = document.createElement('div');
    item.className = 'queue-item';

    const name = document.createElement('span');
    name.className   = 'queue-item-name';
    name.textContent = widget.name;
    name.title       = widget.name;

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'queue-remove';
    removeBtn.textContent = '×';
    removeBtn.title       = 'Remove from queue';
    removeBtn.addEventListener('click', () => {
      stagedIds.delete(id);
      // Uncheck the source checkbox
      const cb = document.querySelector(`.widget-checkbox[data-id="${id}"]`);
      if (cb) cb.checked = false;
      renderQueue();
    });

    item.appendChild(name);
    item.appendChild(removeBtn);
    queueList.appendChild(item);
  });

  // Update count display
  deleteCount.textContent  = stagedIds.size;
  deletePlural.textContent = stagedIds.size === 1 ? '' : 's';
  queueConfirm.style.display = 'block';
  deleteConfirmInput.value   = '';
  executeDeleteBtn.disabled  = true;
}

function updateStageBtn() {
  // stageBtn not used in this flow (queue updates live), keep hidden
  stageBtn.style.display = 'none';
}

/* ── DELETE CONFIRM INPUT ── */
deleteConfirmInput.addEventListener('input', () => {
  executeDeleteBtn.disabled = deleteConfirmInput.value.trim() !== 'DELETE' || stagedIds.size === 0;
});

/* ── EXECUTE DELETE ── */
executeDeleteBtn.addEventListener('click', async () => {
  if (deleteConfirmInput.value.trim() !== 'DELETE') return;
  const ids      = [...stagedIds];
  const apiKey   = sbApiKey.value.trim();
  const tenantUrl= sbTenantUrl.value.trim();
  if (!apiKey || !tenantUrl) return;

  executeDeleteBtn.disabled = true;
  deleteConfirmInput.value  = '';
  let deleted = 0, failed = 0;

  for (const id of ids) {
    const widget = allWidgets.find(w => w.id === id);
    setDeleteStatus(`Deleting ${deleted + failed + 1} of ${ids.length}: ${widget ? widget.name : id}…`, '');
    try {
      const res  = await fetch('/api/widget-cleaner-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', apiKey, tenantUrl, widgetId: id })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Delete failed');
      deleted++;
      // Remove card from UI
      const card = document.querySelector(`.widget-card[data-id="${id}"]`);
      if (card) card.remove();
    } catch (err) {
      failed++;
      console.error('Delete failed for', id, err.message);
    }
  }

  // Remove deleted from allWidgets + analysed
  ids.forEach(id => {
    allWidgets = allWidgets.filter(w => w.id !== id);
    analysed.safe   = analysed.safe.filter(w => w.id !== id);
    analysed.review = analysed.review.filter(w => w.id !== id);
    analysed.ok     = analysed.ok.filter(w => w.id !== id);
  });

  stagedIds.clear();
  renderQueue();

  // Update counts
  countDelete.textContent = analysed.safe.length;
  countReview.textContent = analysed.review.length;
  countOk.textContent     = analysed.ok.length;
  statTotal.textContent   = allWidgets.length;
  statDelete.textContent  = analysed.safe.length;
  statReview.textContent  = analysed.review.length;
  statOk.textContent      = analysed.ok.length;

  const msg = failed
    ? `Deleted ${deleted}, failed ${failed}. Check console for details.`
    : `Successfully deleted ${deleted} widget${deleted !== 1 ? 's' : ''}.`;
  setDeleteStatus(msg, failed ? 'error' : 'success');
});

/* ── HELPERS ── */
function setFetchStatus(msg, cls) {
  fetchStatus.textContent = msg;
  fetchStatus.className   = 'status-line' + (cls ? ' ' + cls : '');
}
function setDeleteStatus(msg, cls) {
  deleteStatus.textContent = msg;
  deleteStatus.className   = 'status-line' + (cls ? ' ' + cls : '');
}

/* ── EVENT LISTENERS ── */
sbApiKey.addEventListener('input',    updateFetchBtn);
sbTenantUrl.addEventListener('input', updateFetchBtn);
fetchBtn.addEventListener('click',    fetchAndAnalyse);

/* ── BOOT ── */
initSbCredentials();
