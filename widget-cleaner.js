/* ── DOM REFS ── */
const sbTenantUrl     = document.getElementById('sbTenantUrl');
const sbApiKey        = document.getElementById('sbApiKey');
const sbRemember      = document.getElementById('sbRemember');
const fetchBtn        = document.getElementById('fetchBtn');
const fetchStatus     = document.getElementById('fetchStatus');
const statsSection    = document.getElementById('statsSection');
const statTotal       = document.getElementById('statTotal');
const statDelete      = document.getElementById('statDelete');
const statReview      = document.getElementById('statReview');
const statOk          = document.getElementById('statOk');
const emptyState      = document.getElementById('emptyState');
const resultsArea     = document.getElementById('resultsArea');
const listDelete      = document.getElementById('listDelete');
const listReview      = document.getElementById('listReview');
const listOk          = document.getElementById('listOk');
const countDelete     = document.getElementById('countDelete');
const countReview     = document.getElementById('countReview');
const countOk         = document.getElementById('countOk');
const selectAllDelete = document.getElementById('selectAllDelete');
const selectAllReview = document.getElementById('selectAllReview');
const toggleOkBtn     = document.getElementById('toggleOkBtn');
const queueSection    = document.getElementById('queueSection');
const queueList       = document.getElementById('queueList');
const queueEmpty      = document.getElementById('queueEmpty');
const queueActions    = document.getElementById('queueActions');
const copyListBtn     = document.getElementById('copyListBtn');
const copyStatus      = document.getElementById('copyStatus');
const stageBtn        = document.getElementById('stageBtn');
const cardTemplate    = document.getElementById('widgetCardTemplate');

/* ── CONSTANTS ── */
const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

/* ── STATE ── */
let allWidgets = [];
let analysed   = { safe: [], review: [], ok: [] };
let stagedIds  = new Set();

/* ── CREDENTIALS ── */
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

  setFetchStatus('Connecting to Salesbuildr...', '');
  fetchBtn.disabled = true;
  emptyState.style.display   = 'none';
  resultsArea.style.display  = 'none';
  statsSection.style.display = 'none';
  queueSection.style.display = 'none';

  let widgets;
  try {
    const res  = await fetch('/api/widget-cleaner-api', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'list', apiKey, tenantUrl })
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

  setFetchStatus('Fetched ' + widgets.length + ' widgets. Analysing...', '');
  const stopPulse = startStatusPulse('Analysing ' + widgets.length + ' widgets with AI', fetchStatus);

  const summary = widgets.map(function(w) {
    return {
      id:   w.id,
      name: (w.name || '').slice(0, 80),
      type: inferWidgetType(w.widget),
      keys: w.widget ? Object.keys(w.widget).slice(0, 10) : []
    };
  });

  let groups;
  try {
    const res  = await fetch('/api/analyse-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ summary: summary })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Analysis failed');
    groups = data.groups;
  } catch (err) {
    stopPulse();
    setFetchStatus('Analysis error: ' + err.message, 'error');
    fetchBtn.disabled = false;
    return;
  }

  stopPulse();

  const reasonMap = {};
  (groups.safe   || []).forEach(function(item) {
    reasonMap[item.id] = { group: 'safe', reason: item.reason || '' };
  });
  (groups.review || []).forEach(function(item) {
    reasonMap[item.id] = {
      group:   'review',
      reason:  item.reason  || '',
      groupId: item.groupId || null,
      keepId:  item.keepId  || null
    };
  });
  (groups.ok || []).forEach(function(item) {
    reasonMap[item.id] = { group: 'ok', reason: '' };
  });

  analysed = { safe: [], review: [], ok: [] };
  widgets.forEach(function(w) {
    const entry = reasonMap[w.id] || { group: 'ok', reason: '' };
    analysed[entry.group].push(Object.assign({}, w, entry));
  });

  renderResults();
  fetchBtn.disabled = false;
  setFetchStatus('Analysis complete — ' + widgets.length + ' widgets reviewed.', 'success');
}

/* ── RENDER RESULTS ── */
function renderResults() {
  listDelete.innerHTML = '';
  listReview.innerHTML = '';
  listOk.innerHTML     = '';
  stagedIds.clear();

  analysed.safe.forEach(function(w) { renderCard(w, listDelete, true, false); });
  renderReviewGroups(analysed.review, listReview);
  analysed.ok.forEach(function(w) { renderCard(w, listOk, false, true); });

  countDelete.textContent = analysed.safe.length;
  countReview.textContent = analysed.review.length;
  countOk.textContent     = analysed.ok.length;

  statTotal.textContent  = allWidgets.length;
  statDelete.textContent = analysed.safe.length;
  statReview.textContent = analysed.review.length;
  statOk.textContent     = analysed.ok.length;
  statsSection.style.display = 'block';

  document.getElementById('groupDelete').style.display = analysed.safe.length   ? 'block' : 'none';
  document.getElementById('groupReview').style.display = analysed.review.length ? 'block' : 'none';
  document.getElementById('groupOk').style.display     = analysed.ok.length     ? 'block' : 'none';

  resultsArea.style.display  = 'block';
  queueSection.style.display = 'block';
  syncQueueFromCheckboxes();
}

/* ── RENDER REVIEW GROUPS ── */
function renderReviewGroups(reviewWidgets, container) {
  const grouped   = {};
  const ungrouped = [];

  reviewWidgets.forEach(function(w) {
    if (w.groupId) {
      if (!grouped[w.groupId]) grouped[w.groupId] = [];
      grouped[w.groupId].push(w);
    } else {
      ungrouped.push(w);
    }
  });

  Object.values(grouped).forEach(function(members) {
    if (members.length === 1) {
      renderCard(members[0], container, false, false);
      return;
    }

    const cluster = document.createElement('div');
    cluster.className = 'review-cluster';

    const clusterLabel = document.createElement('div');
    clusterLabel.className   = 'cluster-label';
    clusterLabel.textContent = 'Similar group  \u00b7  ' + members.length + ' widgets';
    cluster.appendChild(clusterLabel);

    const grid = document.createElement('div');
    grid.className = 'cluster-grid cluster-grid--' + Math.min(members.length, 2);

    members.forEach(function(w) {
      const cardWrap = document.createElement('div');
      cardWrap.className = w.keepId === w.id ? 'cluster-card cluster-card--keep' : 'cluster-card';
      renderCardInto(w, cardWrap, false, false);
      grid.appendChild(cardWrap);
    });

    cluster.appendChild(grid);
    container.appendChild(cluster);
  });

  ungrouped.forEach(function(w) { renderCard(w, container, false, false); });
}

/* ── RENDER CARD ── */
function renderCard(widget, container, defaultChecked, hideCheckbox) {
  const wrap = document.createElement('div');
  renderCardInto(widget, wrap, defaultChecked, hideCheckbox);
  container.appendChild(wrap);
}

function renderCardInto(widget, wrap, defaultChecked, hideCheckbox) {
  const clone = cardTemplate.content.cloneNode(true);
  const card  = clone.querySelector('.widget-card');
  card.dataset.id = widget.id;

  const checkbox = clone.querySelector('.widget-checkbox');
  if (hideCheckbox) {
    checkbox.closest('.widget-check-label').style.pointerEvents = 'none';
    checkbox.style.display = 'none';
  } else {
    checkbox.checked    = defaultChecked;
    checkbox.dataset.id = widget.id;
    checkbox.addEventListener('change', function() { syncQueueFromCheckboxes(); });
  }

  clone.querySelector('.widget-name').textContent       = widget.name;
  clone.querySelector('.widget-type-badge').textContent = inferWidgetType(widget.widget);

  const reasonEl = clone.querySelector('.widget-reason');
  if (widget.keepId === widget.id) {
    reasonEl.textContent = 'Keep this one';
    reasonEl.className   = 'widget-reason widget-reason--keep';
  } else {
    reasonEl.textContent = widget.reason || '';
  }

  const htmlContent = getWidgetHtml(widget.widget);
  const jsonText    = JSON.stringify(widget.widget, null, 2);

  const expandBtn  = clone.querySelector('.expand-btn');
  const detailPane = clone.querySelector('.widget-detail');
  const jsonEl     = clone.querySelector('.widget-json');
  jsonEl.textContent = jsonText;

  if (htmlContent) {
    const toggleBar  = document.createElement('div');
    toggleBar.className = 'detail-toggle-bar';

    const previewBtn = document.createElement('button');
    previewBtn.className   = 'detail-tab detail-tab--active';
    previewBtn.textContent = 'Preview';

    const codeBtn = document.createElement('button');
    codeBtn.className   = 'detail-tab';
    codeBtn.textContent = 'JSON';

    toggleBar.appendChild(previewBtn);
    toggleBar.appendChild(codeBtn);
    detailPane.insertBefore(toggleBar, detailPane.firstChild);

    const iframe = document.createElement('iframe');
    iframe.className = 'widget-preview-frame';
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.setAttribute('scrolling', 'yes');
    detailPane.insertBefore(iframe, jsonEl);

    iframe.style.display = 'block';
    jsonEl.style.display = 'none';

    previewBtn.addEventListener('click', function() {
      previewBtn.classList.add('detail-tab--active');
      codeBtn.classList.remove('detail-tab--active');
      iframe.style.display = 'block';
      jsonEl.style.display = 'none';
    });

    codeBtn.addEventListener('click', function() {
      codeBtn.classList.add('detail-tab--active');
      previewBtn.classList.remove('detail-tab--active');
      iframe.style.display = 'none';
      jsonEl.style.display = 'block';
    });

    var iframeLoaded = false;
    expandBtn.addEventListener('click', function() {
      const open = expandBtn.getAttribute('aria-expanded') === 'true';
      expandBtn.setAttribute('aria-expanded', String(!open));
      expandBtn.textContent    = open ? 'Details' : 'Hide';
      detailPane.style.display = open ? 'none' : 'block';
      if (!open && !iframeLoaded) {
        writeIframe(iframe, htmlContent);
        iframeLoaded = true;
      }
    });
  } else {
    expandBtn.addEventListener('click', function() {
      const open = expandBtn.getAttribute('aria-expanded') === 'true';
      expandBtn.setAttribute('aria-expanded', String(!open));
      expandBtn.textContent    = open ? 'Details' : 'Hide';
      detailPane.style.display = open ? 'none' : 'block';
    });
  }

  wrap.appendChild(clone);
}

/* ── HTML PREVIEW HELPERS ── */
function getWidgetHtml(widgetObj) {
  if (!widgetObj) return null;
  const html = widgetObj.contentTemplate || widgetObj.html || widgetObj.content || null;
  if (!html || typeof html !== 'string') return null;
  if (!/<[a-z][\s\S]*>/i.test(html)) return null;
  return html;
}

function renderMergeTags(html) {
  return html.replace(/\{\{([^}]+)\}\}/g, function(_, token) {
    var label = token.trim();
    return '<span style="display:inline-block;background:#e8edf5;color:#2d4a8a;border:1px solid #b8c8e8;border-radius:3px;padding:0 4px;font-size:11px;font-family:monospace;white-space:nowrap;">{{' + label + '}}</span>';
  });
}

function writeIframe(iframe, rawHtml) {
  const processed = renderMergeTags(rawHtml);
  const isFullDoc = /^\s*(<!DOCTYPE|<html)/i.test(rawHtml);
  const doc = isFullDoc ? processed : '<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;}body{margin:0;padding:0;background:#fff;}</style></head><body>' + processed + '</body></html>';
  iframe.srcdoc = doc;
  iframe.onload = function() {
    try {
      const h = iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.scrollHeight;
      if (h) iframe.style.height = Math.min(h + 20, 600) + 'px';
    } catch(e) {}
  };
}

/* ── SELECT ALL ── */
selectAllDelete.addEventListener('change', function() {
  listDelete.querySelectorAll('.widget-checkbox').forEach(function(cb) {
    cb.checked = selectAllDelete.checked;
  });
  syncQueueFromCheckboxes();
});

selectAllReview.addEventListener('change', function() {
  listReview.querySelectorAll('.widget-checkbox').forEach(function(cb) {
    cb.checked = selectAllReview.checked;
  });
  syncQueueFromCheckboxes();
});

/* ── TOGGLE OK ── */
toggleOkBtn.addEventListener('click', function() {
  const open = listOk.style.display !== 'none';
  listOk.style.display    = open ? 'none' : 'flex';
  toggleOkBtn.textContent = open ? 'Show' : 'Hide';
});

/* ── CLEAN-UP LIST ── */
function syncQueueFromCheckboxes() {
  const checked = new Set();
  document.querySelectorAll('#listDelete .widget-checkbox:checked, #listReview .widget-checkbox:checked')
    .forEach(function(cb) { checked.add(cb.dataset.id); });
  stagedIds = checked;
  renderQueue();
}

function renderQueue() {
  queueList.innerHTML = '';

  if (stagedIds.size === 0) {
    queueEmpty.style.display   = 'block';
    queueActions.style.display = 'none';
    return;
  }

  queueEmpty.style.display   = 'none';
  queueActions.style.display = 'block';
  copyStatus.textContent     = '';

  stagedIds.forEach(function(id) {
    const widget = allWidgets.find(function(w) { return w.id === id; });
    if (!widget) return;

    const item      = document.createElement('div');
    item.className  = 'queue-item';

    const name      = document.createElement('span');
    name.className  = 'queue-item-name';
    name.textContent = widget.name;
    name.title      = widget.name;

    const removeBtn       = document.createElement('button');
    removeBtn.className   = 'queue-remove';
    removeBtn.textContent = '\u00d7';
    removeBtn.title       = 'Remove from list';
    removeBtn.addEventListener('click', function() {
      stagedIds.delete(id);
      const cb = document.querySelector('.widget-checkbox[data-id="' + id + '"]');
      if (cb) cb.checked = false;
      renderQueue();
    });

    item.appendChild(name);
    item.appendChild(removeBtn);
    queueList.appendChild(item);
  });
}

/* ── COPY TO CLIPBOARD ── */
copyListBtn.addEventListener('click', function() {
  const lines = ['Widget Clean-up List', '='.repeat(40), ''];

  // Group by category
  const safeItems   = [];
  const reviewItems = [];

  stagedIds.forEach(function(id) {
    const widget = allWidgets.find(function(w) { return w.id === id; });
    if (!widget) return;
    const inSafe = analysed.safe.find(function(w) { return w.id === id; });
    if (inSafe) {
      safeItems.push({ name: widget.name, reason: inSafe.reason });
    } else {
      const inReview = analysed.review.find(function(w) { return w.id === id; });
      reviewItems.push({ name: widget.name, reason: inReview ? inReview.reason : '' });
    }
  });

  if (safeItems.length) {
    lines.push('SAFE TO DELETE (' + safeItems.length + ')');
    lines.push('-'.repeat(30));
    safeItems.forEach(function(item) {
      lines.push('  \u2022 ' + item.name + (item.reason ? '  —  ' + item.reason : ''));
    });
    lines.push('');
  }

  if (reviewItems.length) {
    lines.push('NEEDS REVIEW (' + reviewItems.length + ')');
    lines.push('-'.repeat(30));
    reviewItems.forEach(function(item) {
      lines.push('  \u2022 ' + item.name + (item.reason ? '  —  ' + item.reason : ''));
    });
    lines.push('');
  }

  lines.push('To delete: go to Salesbuildr \u2192 Settings \u2192 Widget Templates');

  navigator.clipboard.writeText(lines.join('\n')).then(function() {
    copyStatus.textContent = 'Copied to clipboard.';
    copyStatus.className   = 'status-line success';
  }).catch(function() {
    copyStatus.textContent = 'Copy failed — try selecting and copying manually.';
    copyStatus.className   = 'status-line error';
  });
});

/* ── HELPERS ── */
function setFetchStatus(msg, cls) {
  fetchStatus.textContent = msg;
  fetchStatus.className   = 'status-line' + (cls ? ' ' + cls : '');
}

function startStatusPulse(baseText, el) {
  const frames = ['.', '..', '...'];
  var i = 0;
  el.textContent = baseText + frames[0];
  el.className   = 'status-line';
  const id = setInterval(function() {
    i = (i + 1) % frames.length;
    el.textContent = baseText + frames[i];
  }, 500);
  return function() { clearInterval(id); };
}

function inferWidgetType(widgetObj) {
  if (!widgetObj)                        return 'unknown';
  if (widgetObj.type)                    return widgetObj.type;
  if (widgetObj.items    !== undefined)  return 'items';
  if (widgetObj.html     !== undefined)  return 'html-content';
  if (widgetObj.content  !== undefined)  return 'content';
  if (widgetObj.mediaUrl !== undefined)  return 'single-media';
  if (widgetObj.imageUrl !== undefined)  return 'image';
  if (widgetObj.fields   !== undefined)  return 'form';
  return 'widget';
}

/* ── EVENT LISTENERS ── */
sbApiKey.addEventListener('input',    updateFetchBtn);
sbTenantUrl.addEventListener('input', updateFetchBtn);
fetchBtn.addEventListener('click',    fetchAndAnalyse);

/* ── BOOT ── */
initSbCredentials();
