/* =========================================================
   Sales Guide — sales-guide-client.js
   (rename to sales-guide.js when deploying to site root —
    the Netlify function also uses sales-guide.js)
   ========================================================= */

const LS_API_KEY       = 'sb_api_key';
const LS_INT_KEY       = 'sb_int_key';
// (Phase 2 field cache keys removed — no longer creating opportunities)
const LS_SESSIONS = 'sb_sales_guide_sessions';
const MAX_SESSIONS = 5;

// ── State ─────────────────────────────────────────────────
let currentMode        = null;
let currentRec         = null;
let currentAnswers     = {};
let generatedWidgets   = [];
let guideColor         = '#0d2d5e';

// Engagement type → project scope preset mapping
const SCOPE_PRESET_MAP = {
  network_upgrade:      'network',
  managed_services:     'onboarding',
  security_project:     'security',
  compliance:           'security',
  new_client_onboarding:'onboarding',
  project_plus_managed: 'network',
  mixed:                'azure',
  endpoint_refresh:     'endpoint',
  server_eol:           'server',
  voip_project:         'voip',
  backup_dr:            'backup',
  copilot_ai:           'copilot'
};

// ── DOM handles ───────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Recommendation normaliser ─────────────────────────────
// Haiku occasionally returns array fields as objects, nulls,
// or strings containing XML parameter tags / markdown markers.
// This guarantees every array field is clean before rendering.
function normaliseRec(rec) {
  if (!rec) return rec;

  // Strip ALL XML/HTML tags Haiku might wrap content in,
  // plus leading markdown list markers.
  function cleanStr(s) {
    return String(s)
      .replace(/<[^>]+>/g, '')   // strip any XML/HTML tag generically
      .replace(/^[\*\-•]\s+/, '')
      .trim();
  }

  // Strip trailing boolean leak from hardware_needed field
  function stripTrailingBool(s) {
    return s.replace(/\s*(false|true)\s*$/i, '').trim();
  }

  // Extract solution bullets from whatever format Haiku returns.
  // Handles: XML-wrapped strings, newline-separated strings, plain arrays.
  function extractBullets(v) {
    const flat = Array.isArray(v) ? v.join('\n') : String(v || '');

    // Try <solution_bullet> XML tags first
    const xmlMatches = flat.match(/<solution_bullet>([\s\S]*?)<\/solution_bullet>/gi);
    if (xmlMatches && xmlMatches.length > 0) {
      return xmlMatches.map(m => stripTrailingBool(cleanStr(m)))
                       .filter(s => s && s !== 'false' && s !== 'true' && s.length > 4);
    }

    // Try splitting on newlines (Haiku sometimes returns \n-separated bullets)
    const lines = flat.split(/\n+/).map(l => stripTrailingBool(cleanStr(l)))
                      .filter(s => s && s !== 'false' && s !== 'true' && s.length > 10);
    if (lines.length > 1) return lines;

    // Fall back to array items directly
    const arr = Array.isArray(v) ? v : (flat.trim() ? [flat] : []);
    return arr.map(item => stripTrailingBool(cleanStr(String(item))))
              .filter(s => s && s !== 'false' && s !== 'true' && s.length > 4);
  }

  // Convert any value to a clean array of non-empty strings
  function toArray(v) {
    let arr;
    if (Array.isArray(v))             arr = v;
    else if (v && typeof v === 'object') arr = Object.values(v);
    else if (typeof v === 'string' && v.trim()) arr = [v];
    else                              arr = [];
    // Clean each string item; filter out empties
    return arr.map(item => typeof item === 'string' ? cleanStr(item) : item)
              .filter(item => item !== '' && item != null);
  }

  // Deep-clean helper — cleans all string values inside an object
  function cleanObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = typeof v === 'string' ? cleanStr(v) : v;
    }
    return out;
  }

  rec.solution_bullets     = extractBullets(rec.solution_bullets);
  rec.hardware_checklist   = toArray(rec.hardware_checklist).map(cleanObj);
  rec.services_recommended = toArray(rec.services_recommended).map(cleanObj)
    .filter(s => s.service && s.service.length > 0); // drop items with empty service name

  // Clean string fields too
  if (typeof rec.coaching_insight === 'string') rec.coaching_insight = cleanStr(rec.coaching_insight);
  if (typeof rec.roi_angle        === 'string') rec.roi_angle        = cleanStr(rec.roi_angle);

  // Reconstruct widget_briefs from flat top-level fields (Haiku-friendly schema)
  // Falls back to nested widget_briefs object if flat fields are absent (Sonnet compat)
  rec.widget_briefs = {
    w1: cleanStr(rec.w1_situation  || rec.widget_briefs?.w1 || ''),
    w2: cleanStr(rec.w2_urgency    || rec.widget_briefs?.w2 || ''),
    w3: cleanStr(rec.w3_trust      || rec.widget_briefs?.w3 || ''),
    w4: cleanStr(rec.w4_outcome    || rec.widget_briefs?.w4 || ''),
    w5: cleanStr(rec.w5_investment || rec.widget_briefs?.w5 || ''),
  };

  // Debug — remove once briefs are confirmed working
  console.log('[Sales Guide] normalised widget_briefs:', JSON.stringify(rec.widget_briefs, null, 2));
  console.log('[Sales Guide] raw rec keys:', Object.keys(rec));

  return rec;
}

// ── Helpers ───────────────────────────────────────────────
function showSection(id) {
  ['mode-view','discovery-view','execution-view','quickquote-view','working-view','results-view'].forEach(s => {
    const el = $(s); if (el) el.hidden = s !== id;
  });
}
function showError(id, msg) {
  const el = $(id); if (!el) return;
  el.textContent = msg; el.classList.remove('hidden');
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}
function clearError(id) { const el=$(id); if(el) el.classList.add('hidden'); }
function setWorking(title, sub) { $('workingTitle').textContent=title; $('workingSub').textContent=sub; }

// ── Color picker ─────────────────────────────────────────
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

$('guideColorPicker')?.addEventListener('input', () => {
  guideColor = $('guideColorPicker').value;
  $('guideColorHex').value = guideColor.toUpperCase();
  syncPresets(guideColor);
});
$('guideColorHex')?.addEventListener('input', () => {
  const v = $('guideColorHex').value.trim().startsWith('#') ? $('guideColorHex').value.trim() : '#' + $('guideColorHex').value.trim();
  if (isValidHex(v)) { guideColor = v; $('guideColorPicker').value = v; syncPresets(v); }
});
document.querySelectorAll('.guide-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    guideColor = btn.dataset.color;
    $('guideColorPicker').value = guideColor;
    $('guideColorHex').value    = guideColor.toUpperCase();
    syncPresets(guideColor);
  });
});
function syncPresets(color) {
  document.querySelectorAll('.guide-preset').forEach(b => b.classList.toggle('active', b.dataset.color === color));
}

// ── Mode selection ────────────────────────────────────────
['discovery','execution','quickquote'].forEach(mode => {
  document.querySelectorAll(`.mode-card[data-mode="${mode}"]`).forEach(btn => {
    btn.addEventListener('click', () => activateMode(mode));
  });
});

function activateMode(mode) {
  currentMode = mode;
  showSection(mode === 'discovery' ? 'discovery-view' : mode === 'execution' ? 'execution-view' : 'quickquote-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('discBackBtn')?.addEventListener('click', () => { showSection('mode-view'); currentMode = null; });
$('execBackBtn')?.addEventListener('click', () => { showSection('mode-view'); currentMode = null; });
$('qqBackBtn')?.addEventListener('click', () => { showSection('mode-view'); currentMode = null; });

// ── Chips (multi-select, or single-select with data-single) ─
document.querySelectorAll('.chips-wrap').forEach(wrap => {
  const isSingle = wrap.dataset.single === 'true';
  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (isSingle) {
        wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');
      } else {
        chip.classList.toggle('is-selected');
      }
    });
  });
});

function getChipValues(wrapId) {
  const selected = [...document.querySelectorAll(`#${wrapId} .chip.is-selected`)].map(c => c.dataset.val);
  const other    = document.getElementById(`other-${wrapId.replace('chips-','')}`);
  if (other?.value.trim()) selected.push(other.value.trim());
  return selected.join('; ') || '';
}

// Character counter for spec input
$('exec-spec')?.addEventListener('input', () => {
  $('specCount').textContent = $('exec-spec').value.length;
});

// ── Discovery generate ────────────────────────────────────
$('discGenerateBtn')?.addEventListener('click', async () => {
  clearError('discError');

  const answers = {
    challenge:  getChipValues('chips-challenge'),
    industry:   $('q-industry')?.value || '',
    staffCount: $('q-staff')?.value || '',
    company:    $('q-company')?.value.trim() || '',
    trigger:    getChipValues('chips-trigger'),
    outcome:    getChipValues('chips-outcome'),
    comparison: getChipValues('chips-comparison'),
    shape:      getChipValues('chips-shape'),
  };

  if (!answers.challenge) { showError('discError', 'Please select or describe the customer\'s primary challenge.'); return; }
  if (!answers.industry)  { showError('discError', 'Please select the customer\'s industry.'); return; }

  setWorking('Analyzing the opportunity…', 'Claude is reading the customer situation and building your tailored recommendation');
  showSection('working-view');

  try {
    const res  = await fetch('/api/sales-guide', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'discover', answers })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — make sure the sales-guide.js Netlify function is deployed to netlify/functions/.`);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Recommendation failed');
    console.log('[Sales Guide] stop_reason:', data.stop_reason);
    currentRec     = normaliseRec(data.recommendation);
    currentAnswers = answers;
    renderResults('discovery', answers.company || 'New Opportunity', currentRec);
  } catch (e) {
    showSection('discovery-view');
    showError('discError', e.message || 'Something went wrong. Please try again.');
  }
});

// ── Execution generate ────────────────────────────────────
$('execGenerateBtn')?.addEventListener('click', async () => {
  clearError('execError');
  const spec    = $('exec-spec')?.value.trim() || '';
  const context = $('exec-context')?.value.trim() || '';

  if (!spec) { showError('execError', 'Please paste the confirmed solution specification.'); return; }
  if (spec.length < 50) { showError('execError', 'The spec looks too brief — add more detail for a better result.'); return; }

  setWorking('Translating to buyer language…', 'Claude is reading the technical spec and building your proposal narrative');
  showSection('working-view');

  try {
    const res  = await fetch('/api/sales-guide', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'execute', spec, customerContext: context })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Server error (${res.status}) — make sure the sales-guide.js Netlify function is deployed to netlify/functions/.`);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Translation failed');
    currentRec = normaliseRec(data.recommendation);
    renderResults('execution', context || 'Proposal Spec', currentRec);
  } catch (e) {
    showSection('execution-view');
    showError('execError', e.message || 'Something went wrong. Please try again.');
  }
});

// ── Render results ────────────────────────────────────────
// Return first sentence of a brief for compact display
function briefTeaser(text) {
  if (!text) return '';
  const first = text.split(/(?<=[.!?])\s/)[0].trim();
  return first.length > 10 ? first : text.slice(0, 120) + (text.length > 120 ? '…' : '');
}

// ═══════════════════════════════════════════════════════════
// EXECUTION MODE — PHASE B: Catalog matching + quote lines
// ═══════════════════════════════════════════════════════════

let execMatchedProducts = [];  // [{id, name, price, unit, qty, specItem}]

async function execMatchCatalog(lineItems) {
  const apiKey = $('oppApiKey')?.value.trim() || localStorage.getItem(LS_API_KEY) || '';
  const intKey = $('oppIntKey')?.value.trim() || localStorage.getItem(LS_INT_KEY) || '';

  const wrap = $('execQuoteLinesWrap');
  if (!wrap) return;

  if (!apiKey || !intKey) {
    // No creds yet — show the panel with a prompt to enter credentials
    wrap.classList.remove('hidden');
    $('execQuoteLinesSub').textContent = 'Enter your API credentials in the Connect panel below to match items against your catalog';
    return;
  }

  wrap.classList.remove('hidden');
  $('execMatchWorking').classList.remove('hidden');
  $('execQuoteLinesSub').textContent = 'Matching spec items against your catalog…';
  execMatchedProducts = [];

  try {
    const res  = await callCreateOpp('match-spec-items', { items: lineItems, apiKey, integrationKey: intKey });
    $('execMatchWorking').classList.add('hidden');

    if (!res.ok) throw new Error(res.error || 'Matching failed');

    const matched   = res.matched   || [];
    const unmatched = res.unmatched || [];

    renderExecMatchedItems(matched);
    await renderExecUnmatchedItems(unmatched);

    const total = matched.length + unmatched.length;
    $('execQuoteLinesSub').textContent = `${matched.length} of ${total} items matched in your catalog${unmatched.length > 0 ? ' — ' + unmatched.length + ' not found (suggestions below)' : ' — all items found'}`;

  } catch (e) {
    $('execMatchWorking').classList.add('hidden');
    $('execQuoteLinesSub').textContent = 'Catalog match failed — check your API credentials in the Connect panel';
    console.error('[Exec Phase B]', e);
  }
}

function renderExecMatchedItems(matched) {
  const list = $('execMatchedList');
  if (!list) return;

  list.innerHTML = matched.map(({ specItem, catalogProduct, qty }) => {
    const uLabel = unitLabel(catalogProduct.unit);
    const price  = catalogProduct.price || 0;
    const line   = price * qty;
    const typeColor = specItem.type === 'service' ? 'matched'
      : specItem.type === 'labor'   ? 'optional'
      : 'extra';
    return `
      <label class="opp-svc-item is-matched">
        <input type="checkbox" class="opp-svc-check exec-svc-check"
          data-id="${esc(catalogProduct.id)}"
          data-name="${esc(catalogProduct.name)}"
          data-price="${price}"
          data-unit="${esc(uLabel)}" checked>
        <div class="opp-svc-info">
          <span class="opp-svc-name">${esc(catalogProduct.name)}</span>
          <div class="opp-svc-meta">
            ${price > 0 ? `<span class="opp-svc-price">$${price.toFixed(2)}${uLabel} each</span>` : ''}
            <span class="opp-svc-badge ${typeColor}">${esc(specItem.type)}</span>
            ${catalogProduct.vendor ? `<span class="opp-svc-badge extra">${esc(catalogProduct.vendor)}</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--mute);margin-top:2px;">From spec: ${esc(specItem.name)}</div>
        </div>
        <div class="opp-svc-qty-wrap">
          <label>Qty</label>
          <input type="number" class="opp-svc-qty" value="${qty}" min="1" max="999">
        </div>
        <span class="opp-svc-line-total">${price > 0 ? '$' + line.toFixed(2) + uLabel : 'Price on request'}</span>
      </label>`;
  }).join('');

  // Wire up listeners and update total
  list.querySelectorAll('.exec-svc-check, .opp-svc-qty').forEach(el => {
    el.addEventListener('change', updateExecTotal);
    el.addEventListener('input',  updateExecTotal);
  });
  updateExecTotal();

  // Store matched products for quote creation
  execMatchedProducts = matched.map(({ catalogProduct, qty }) => ({
    id: catalogProduct.id, name: catalogProduct.name,
    price: catalogProduct.price, qty, unit: catalogProduct.unit
  }));
}

async function renderExecUnmatchedItems(unmatched) {
  const wrap = $('execUnmatchedWrap');
  if (!wrap || unmatched.length === 0) {
    wrap?.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  wrap.innerHTML = `<div class="qq-suggestions">
    <div class="section-header">
      <span class="section-icon">🌐</span>
      <div>
        <div class="section-title">Not in your catalog — suggestions from the web</div>
        <div class="section-sub">These spec items weren't found — Claude is searching for alternatives with MPNs</div>
      </div>
    </div>
    <div id="execSuggestionsBody"><div class="qq-suggest-loading"><div class="spinner-sm"></div> Searching the web…</div></div>
  </div>`;

  // Fire web search for all unmatched items combined
  const requestStr = unmatched.map(u => u.specItem.name + (u.specItem.mpn ? ' MPN:' + u.specItem.mpn : '')).join(', ');
  try {
    const res = await fetch('/api/sales-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggest-products', request: requestStr })
    });
    const data = await res.json();
    const body = document.getElementById('execSuggestionsBody');
    if (!body) return;

    if (data.ok && data.suggestions?.length > 0) {
      body.innerHTML = data.suggestions.map((s, i) => `
        <div class="qq-suggest-item" id="exec-suggest-${i}">
          <div class="qq-suggest-header">
            <span class="qq-suggest-name">${esc(s.name)}</span>
            ${typeof s.approx_price === 'number' ? `<span class="qq-suggest-price">~$${s.approx_price.toFixed(2)}</span>` : ''}
          </div>
          <div class="qq-suggest-desc">${esc(s.description)}</div>
          <div class="qq-suggest-meta">
            <span class="qq-suggest-mfr">${esc(s.manufacturer || '')}</span>
            ${s.mpn ? `<button class="qq-mpn-btn" onclick="qqCopyMpn(this,'${esc(s.mpn)}')">
              <span class="qq-mpn-label">MPN</span>
              <span class="qq-mpn-value">${esc(s.mpn)}</span>
              <span class="qq-mpn-copy">Copy</span>
            </button>` : ''}
            <button class="qq-add-btn" onclick="execAddToCatalog(this,${i})"
              data-name="${esc(s.name)}"
              data-mpn="${esc(s.mpn||'')}"
              data-vendor="${esc(s.manufacturer||'')}"
              data-desc="${esc(s.description||'')}"
              data-price="${typeof s.approx_price === 'number' ? s.approx_price : 0}">
              + Add to my catalog
            </button>
            <span class="qq-add-result" id="exec-add-result-${i}"></span>
          </div>
        </div>`).join('');
    } else {
      body.innerHTML = '<div class="qq-suggest-none">No web suggestions found — add these items manually in Salesbuildr.</div>';
    }
  } catch (e) {
    const body = document.getElementById('execSuggestionsBody');
    if (body) body.innerHTML = '<div class="qq-suggest-none">Web search unavailable — add items manually.</div>';
  }
}

function updateExecTotal() {
  let monthly = 0, oneTime = 0, count = 0;
  execMatchedProducts = [];
  $('execMatchedList')?.querySelectorAll('.opp-svc-item').forEach(row => {
    const check   = row.querySelector('.exec-svc-check');
    const qty     = parseInt(row.querySelector('.opp-svc-qty')?.value) || 1;
    const price   = parseFloat(check?.dataset.price) || 0;
    const uSuffix = check?.dataset.unit || '';
    const line    = price * qty;
    const lineEl  = row.querySelector('.opp-svc-line-total');
    if (lineEl) lineEl.textContent = price > 0 ? `$${line.toFixed(2)}${uSuffix}` : 'Price on request';
    row.style.opacity = check?.checked ? '1' : '0.5';
    if (check?.checked) {
      count++;
      if (uSuffix === '/mo') monthly += line;
      else if (uSuffix === '/yr') monthly += line / 12;
      else oneTime += line;
      execMatchedProducts.push({ id: check.dataset.id, name: check.dataset.name, qty, price });
    }
  });
  const totalEl = $('execQuoteTotal');
  if (count > 0 && totalEl) {
    const parts = [];
    if (monthly > 0) parts.push(`<strong>$${monthly.toFixed(2)}/mo</strong> recurring`);
    if (oneTime > 0) parts.push(`<strong>$${oneTime.toFixed(2)}</strong> one-time`);
    totalEl.innerHTML = `<span>${count} item${count !== 1 ? 's' : ''} selected</span><span>${parts.join(' &nbsp;·&nbsp; ')}</span>`;
    totalEl.classList.remove('hidden');
  } else if (totalEl) {
    totalEl.classList.add('hidden');
  }
}

async function execAddToCatalog(btn, idx) {
  const apiKey = $('oppApiKey')?.value.trim() || localStorage.getItem(LS_API_KEY) || '';
  const intKey = $('oppIntKey')?.value.trim() || localStorage.getItem(LS_INT_KEY) || '';
  if (!apiKey || !intKey) {
    const el = document.getElementById('exec-add-result-' + idx);
    if (el) { el.textContent = 'Enter API credentials in the Connect panel first'; el.style.color = '#dc2626'; }
    return;
  }
  btn.disabled = true; btn.textContent = 'Adding…';
  const resultEl = document.getElementById('exec-add-result-' + idx);
  const approxPrice = parseFloat(btn.dataset.price) || 0;
  try {
    const res = await callCreateOpp('create-product', {
      name: btn.dataset.name, mpn: btn.dataset.mpn || undefined,
      shortDescription: btn.dataset.desc || undefined,
      price: approxPrice || undefined, apiKey, integrationKey: intKey
    });
    if (!res.ok) throw new Error(res.error || 'Failed');
    btn.textContent = '✓ Added'; btn.style.background = 'var(--good)'; btn.style.color = '#fff';
    if (resultEl) { resultEl.textContent = 'Added — open in Salesbuildr and hit Fetch info for real pricing'; resultEl.style.color = 'var(--good)'; }
    qqInjectAddedProduct({ id: res.product.id, name: res.product.name || btn.dataset.name, price: approxPrice, unit: '', vendor: '', sku: btn.dataset.mpn || '', approx: true });
    // Also add to execMatchedProducts for quote creation
    execMatchedProducts.push({ id: res.product.id, name: res.product.name || btn.dataset.name, qty: 1, price: approxPrice });
    updateExecTotal();
  } catch (e) {
    btn.disabled = false; btn.textContent = '+ Add to my catalog';
    if (resultEl) { resultEl.textContent = e.message; resultEl.style.color = '#dc2626'; }
  }
}

// ── Render categorised line items (Execution mode Phase A) ──
const LINE_ITEM_TYPE_CONFIG = {
  hardware: { label: 'Hardware',         icon: '🔧', color: 'var(--accent)',  hint: 'Physical products — will be matched against your catalog' },
  service:  { label: 'Managed Services', icon: '⚡', color: 'var(--good)',   hint: 'Recurring services — will be matched against your catalog' },
  labor:    { label: 'Professional Services / Labor', icon: '👷', color: '#7c3aed', hint: 'Installation and project labor — will be matched against your catalog' },
  software: { label: 'Software & Licenses', icon: '💿', color: '#0891b2',  hint: 'Software licenses and subscriptions' },
  unknown:  { label: 'Needs Review',    icon: '❓', color: 'var(--warn)',   hint: 'Claude could not determine the type — review manually' },
};

function renderLineItems(items) {
  const container = $('lineItemsList');
  if (!container) return;

  // Group by type
  const groups = {};
  for (const item of items) {
    const t = item.type || 'unknown';
    if (!groups[t]) groups[t] = [];
    groups[t].push(item);
  }

  const typeOrder = ['service', 'labor', 'software', 'hardware', 'unknown'];
  let html = '';

  for (const type of typeOrder) {
    if (!groups[type]) continue;
    const cfg = LINE_ITEM_TYPE_CONFIG[type];
    html += `<div class="li-group">
      <div class="li-group-header">
        <span class="li-group-icon">${cfg.icon}</span>
        <span class="li-group-label">${cfg.label}</span>
        <span class="li-group-count">${groups[type].length} item${groups[type].length !== 1 ? 's' : ''}</span>
        <span class="li-group-hint">${cfg.hint}</span>
      </div>
      ${groups[type].map(item => `
        <div class="li-item">
          <div class="li-item-name">${esc(item.name)}</div>
          <div class="li-item-meta">
            ${item.mpn ? `<span class="li-mpn">MPN: ${esc(item.mpn)}</span>` : ''}
            ${item.manufacturer ? `<span class="li-mfr">${esc(item.manufacturer)}</span>` : ''}
            <span class="li-qty">Qty: ${item.quantity || 1}</span>
            <span class="li-unit li-unit-${item.unit || 'one-time'}">${esc(item.unit || 'one-time')}</span>
          </div>
          ${item.description ? `<div class="li-desc">${esc(item.description)}</div>` : ''}
        </div>`).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

function renderResults(mode, title, rec) {
  $('resultsMode').textContent  = mode === 'discovery' ? '🔍 Discovery Mode' : '⚡ Execution Mode';
  $('resultsTitle').textContent = title;
  $('coachingText').textContent = rec.coaching_insight || '';

  // Spec gaps — show only in execution mode when gaps exist
  const gapsSection = $('specGapsSection');
  const gaps = rec.spec_gaps || [];
  if (mode === 'execution' && gaps.length > 0 && gapsSection) {
    $('specGapsList').innerHTML = gaps.map(g => `<li>${esc(g)}</li>`).join('');
    gapsSection.classList.remove('hidden');
  } else if (gapsSection) {
    gapsSection.classList.add('hidden');
  }

  // Line items — show categorised spec items in execution mode
  const lineItemsSection = $('lineItemsSection');
  if (mode === 'execution' && lineItemsSection) {
    const items = rec.line_items || [];
    if (items.length > 0) {
      renderLineItems(items);
      lineItemsSection.classList.remove('hidden');
      // Phase B — kick off catalog matching
      execMatchCatalog(items);
    } else {
      lineItemsSection.classList.add('hidden');
    }
  } else if (lineItemsSection) {
    lineItemsSection.classList.add('hidden');
  }

  // Recommended approach — bullets
  const summaryEl = $('summaryText');
  const bullets = rec.solution_bullets || (rec.buyer_summary ? [rec.buyer_summary] : [rec.solution_summary || '']);
  if (Array.isArray(bullets) && bullets.length > 0) {
    summaryEl.innerHTML = `<ul class="approach-bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
  } else {
    summaryEl.textContent = rec.solution_summary || rec.buyer_summary || '';
  }

  // Hardware checklist (Discovery only)
  const hwSection = $('hardwareSection');
  if (mode === 'discovery' && rec.hardware_needed && rec.hardware_checklist?.length > 0) {
    const list = $('hardwareList');
    list.innerHTML = rec.hardware_checklist.map(hw => `
      <div class="hw-item">
        <div class="hw-component">🔧 ${esc(hw.component)}</div>
        ${hw.confirm   ? `<div class="hw-confirm">${esc(hw.confirm)}</div>` : ''}
        ${hw.never_forget ? `<div class="hw-forget">${esc(hw.never_forget)}</div>` : ''}
      </div>`).join('');
    hwSection.classList.remove('hidden');
  } else {
    hwSection.classList.add('hidden'); // No hardware = hide entirely
  }

  // Services — use curated engagement framework, not Claude-generated names
  const svcSection = $('servicesSection');
  const curatedServices = ENGAGEMENT_SERVICES[rec.engagement_type] || ENGAGEMENT_SERVICES.mixed;
  if (mode === 'discovery') {
    const list = $('servicesList');
    list.innerHTML = curatedServices.map(s => `
      <div class="svc-item${s.optional ? ' is-optional' : ''}">
        <span class="svc-billing bill-${s.billing || 'monthly'}">${(s.billing || 'monthly').replace('-', '&#8209;')}</span>
        <div class="svc-body">
          <div class="svc-name">${esc(s.service)}${s.optional ? ' <span class="svc-optional-tag">— optional add-on</span>' : ''}</div>
        </div>
      </div>`).join('');
    svcSection.classList.remove('hidden');
  } else {
    svcSection.classList.add('hidden');
  }

  // Widget briefs
  const briefs = rec.widget_briefs;
  const briefLabels = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · Investment' };
  if (briefs) {
    $('widgetBriefs').innerHTML = ['w1','w2','w3','w4','w5'].map(w => `
      <div class="brief-item">
        <div class="brief-w">${briefLabels[w]}</div>
        <div class="brief-text">${esc(briefTeaser(briefs[w] || ''))}</div>
      </div>`).join('');
  }

  $('widgetOutput').classList.add('hidden');
  showSection('results-view');

  // Auto-open Salesbuildr widget push if creds saved
  if (localStorage.getItem(LS_API_KEY) && localStorage.getItem(LS_INT_KEY)) {
    $('sbBody').hidden = false;
    $('sbArrow').classList.add('open');
    updatePushBtn();
  }

  // Warm up the create-opportunity function in the background
  // so it's ready when the rep reaches the Connect panel
  fetch('/api/create-opportunity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ping' })
  }).catch(() => {});

  // Initialise Phase 2 Create in Salesbuildr panel
  initCreateOppPanel();
}

// ── Generate widgets ──────────────────────────────────────
const WIDGET_IDS    = ['w1','w2','w3','w4','w5'];
const WIDGET_LABELS = { w1:'W1 · Their Situation', w2:'W2 · Why Now', w3:'W3 · Why Trust Us', w4:'W4 · What They Get', w5:'W5 · The Investment' };

$('genWidgetsBtn')?.addEventListener('click', async () => {
  if (!currentRec?.widget_briefs) return;
  $('genWidgetsBtn').disabled = true;
  $('widgetsWorking').classList.remove('hidden');
  $('widgetsResult').classList.add('hidden');
  generatedWidgets = [];

  // Build enriched fields from the recommendation
  const briefs = currentRec.widget_briefs;
  const fields = {
    solution:  currentRec.solution_summary || currentRec.buyer_summary || '',
    business:  $('q-industry')?.value || $('exec-context')?.value || '',
    size:      $('q-staff')?.value || '',
    trigger:   briefs.w2 || '',
    outcomes:  briefs.w4 || '',
    urgency:   briefs.w2 || ''
  };

  for (let i = 0; i < WIDGET_IDS.length; i++) {
    const id = WIDGET_IDS[i];
    $('widgetsWorkingMsg').textContent = `Generating widget ${i+1} of 5 — ${WIDGET_LABELS[id]}…`;
    try {
      const colors = { primary: guideColor, accent: guideColor, light: lightenHex(guideColor, 0.91) };
      const res  = await fetch('/api/sales-widgets', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ fields, widgetId: id, colors })
      });
      const data = await res.json();
      if (data.ok) generatedWidgets.push(data.widget);
    } catch (e) { console.error(`Widget ${id} failed:`, e); }
  }

  $('widgetsWorking').classList.add('hidden');

  if (generatedWidgets.length > 0) {
    const isCombined = document.querySelector('input[name="widgetMode"]:checked')?.value !== 'individual';
    const html = isCombined
      ? generatedWidgets.map(w => w.html).join('\n<div style="height:20px;"></div>\n')
      : generatedWidgets[0]?.html || '';  // show first in preview; push handles all
    $('previewFrame').srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#fff;}</style></head><body>${html}</body></html>`;
    $('htmlCode').value = html;
    $('widgetOutput').classList.remove('hidden');
    $('widgetOutput').scrollIntoView({ behavior:'smooth', block:'start' });
    $('widgetsResult').textContent = `✓ ${generatedWidgets.length} of 5 widgets generated`;
    $('widgetsResult').className = 'action-result ok';
  } else {
    $('widgetsResult').textContent = 'Widget generation failed — check your connection and try again.';
    $('widgetsResult').className = 'action-result error';
  }
  $('widgetsResult').classList.remove('hidden');
  $('genWidgetsBtn').disabled = false;
});

// Output tabs
document.querySelectorAll('.out-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.out-tab').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    $('previewFrame').style.display = btn.dataset.pane==='preview' ? 'block':'none';
    $('htmlCode').style.display     = btn.dataset.pane==='code'    ? 'block':'none';
  });
});

// Copy widgets
$('copyWidgetsBtn')?.addEventListener('click', async () => {
  const html = $('htmlCode').value;
  try { await navigator.clipboard.writeText(html); }
  catch { const ta=document.createElement('textarea'); ta.value=html; ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
  const orig = $('copyWidgetsBtn').textContent;
  $('copyWidgetsBtn').textContent='✓ Copied!';
  setTimeout(()=>$('copyWidgetsBtn').textContent=orig, 2000);
});

// Open scope builder with pre-selected preset
$('openScopeBtn')?.addEventListener('click', () => {
  const preset = currentRec ? (SCOPE_PRESET_MAP[currentRec.engagement_type] || '') : '';
  window.open(`project-scope.html${preset ? '?preset='+preset+'&from=guide' : ''}`, '_blank');
});

// Open ROI builder with pre-filled context
$('openRoiBtn')?.addEventListener('click', () => {
  const params = new URLSearchParams();
  if (currentAnswers.industry)   params.set('industry',   currentAnswers.industry.split('/')[0].trim().toLowerCase());
  if (currentAnswers.staffCount) params.set('staff',      currentAnswers.staffCount);
  if (currentRec?.services_recommended) {
    const svcs = currentRec.services_recommended.filter(s => !s.optional).map(s => {
      const n = s.service.toLowerCase();
      if (n.includes('security') || n.includes('edr')) return 'security';
      if (n.includes('backup') || n.includes('recovery')) return 'backup';
      if (n.includes('helpdesk') || n.includes('noc') || n.includes('monitoring')) return 'helpdesk';
      if (n.includes('compliance')) return 'compliance';
      return null;
    }).filter(Boolean);
    if (svcs.length) params.set('services', [...new Set(svcs)].join(','));
  }
  params.set('from', 'guide');
  window.open(`roi-builder.html?${params.toString()}`, '_blank');
});

// Start over
$('startOverBtn')?.addEventListener('click', () => {
  currentRec = null; generatedWidgets = [];
  $('widgetOutput').classList.add('hidden');
  $('execQuoteLinesWrap')?.classList.add('hidden');
  execMatchedProducts = [];
  showSection('mode-view');
  window.scrollTo({ top:0, behavior:'smooth' });
});

// ── Salesbuildr push ──────────────────────────────────────
function initCredentials() {
  const a = localStorage.getItem(LS_API_KEY), i = localStorage.getItem(LS_INT_KEY);
  if (a) $('sbApiKey').value = a;
  if (i) $('sbIntKey').value = i;
  if (a && i) $('sbRemember').checked = true;
  updatePushBtn();
}
function updatePushBtn() {
  $('sbPushBtn').disabled = !($('sbApiKey').value.trim() && $('sbIntKey').value.trim());
}
$('sbToggle')?.addEventListener('click', () => {
  const open = !$('sbBody').hidden;
  $('sbBody').hidden = open;
  $('sbArrow').classList.toggle('open', !open);
});
$('sbApiKey')?.addEventListener('input', updatePushBtn);
$('sbIntKey')?.addEventListener('input', updatePushBtn);

$('sbPushBtn')?.addEventListener('click', async () => {
  const apiKey = $('sbApiKey').value.trim(), intKey = $('sbIntKey').value.trim();
  if (!apiKey || !intKey) return;
  if ($('sbRemember').checked) { localStorage.setItem(LS_API_KEY,apiKey); localStorage.setItem(LS_INT_KEY,intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  $('sbPushBtn').disabled=true; $('sbPushBtn').textContent='Saving…'; $('sbResult').classList.add('hidden');

  const title      = $('resultsTitle').textContent || 'Sales Guide Widgets';
  const prefix     = $('sbPrefix').value.trim();
  const isCombined = document.querySelector('input[name="widgetMode"]:checked')?.value !== 'individual';

  const widgets = isCombined
    ? [{ id:'guide', title, html: generatedWidgets.map(w=>w.html).join('\n<div style="height:20px;"></div>\n') }]
    : generatedWidgets.map(w => ({ id: w.id, title: w.title || title, html: w.html }));

  try {
    const res  = await fetch('/api/push-widgets',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({widgets, prefix, apiKey, integrationKey:intKey})});
    const data = await res.json();
    if (data.successCount>0) {
      $('sbResult').textContent='✓ Saved to your Salesbuildr widget library.';
      $('sbResult').className='sb-result ok';
      $('sbPushBtn').textContent='✓ Saved'; $('sbPushBtn').classList.add('is-done');
    } else throw new Error(data.results?.[0]?.error||data.error||'Unknown error');
  } catch(e) {
    $('sbResult').textContent=`✕ ${e.message}`;
    $('sbResult').className='sb-result error';
    $('sbPushBtn').disabled=false; $('sbPushBtn').textContent='Save to Salesbuildr →';
  }
  $('sbResult').classList.remove('hidden');
});

// ── Save & Resume ─────────────────────────────────────────
$('saveSessionBtn')?.addEventListener('click', () => {
  const company = $('q-company')?.value.trim() || 'Unnamed customer';
  const session = {
    id:        Date.now().toString(36),
    company,
    mode:      'discovery',
    timestamp: new Date().toISOString(),
    answers: {
      challenge:  getChipValues('chips-challenge'),
      industry:   $('q-industry')?.value || '',
      staffCount: $('q-staff')?.value || '',
      trigger:    getChipValues('chips-trigger'),
      outcome:    getChipValues('chips-outcome'),
      comparison: getChipValues('chips-comparison'),
      shape:      getChipValues('chips-shape'),
    }
  };

  const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
  sessions.unshift(session);
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));

  const orig = $('saveSessionBtn').textContent;
  $('saveSessionBtn').textContent = '✓ Saved — come back after the site visit';
  setTimeout(() => $('saveSessionBtn').textContent = orig, 3000);
});

function loadResumeBanner() {
  const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
  if (sessions.length === 0) return;
  const latest = sessions[0];
  const ago    = timeSince(new Date(latest.timestamp));
  $('resumeTitle').textContent   = `Saved: ${latest.company}`;
  $('resumeSubtitle').textContent = `Discovery session — saved ${ago}`;
  $('resumeBanner').classList.remove('hidden');

  $('resumeBtn')?.addEventListener('click', () => {
    activateMode('discovery');
    // Re-apply saved answers
    if (latest.answers) restoreDiscoveryAnswers(latest.answers);
    $('resumeBanner').classList.add('hidden');
  });
  $('dismissBtn')?.addEventListener('click', () => {
    $('resumeBanner').classList.add('hidden');
    const sessions = JSON.parse(localStorage.getItem(LS_SESSIONS) || '[]');
    sessions.shift();
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  });
}

function restoreDiscoveryAnswers(answers) {
  // Restore chip selections
  const chipMap = {
    challenge: 'chips-challenge', trigger: 'chips-trigger',
    outcome: 'chips-outcome', comparison: 'chips-comparison', shape: 'chips-shape'
  };
  Object.entries(chipMap).forEach(([key, wrapId]) => {
    if (!answers[key]) return;
    const values = answers[key].split('; ');
    document.querySelectorAll(`#${wrapId} .chip`).forEach(chip => {
      if (values.includes(chip.dataset.val)) chip.classList.add('is-selected');
    });
  });
  if (answers.industry)   $('q-industry').value = answers.industry;
  if (answers.staffCount) $('q-staff').value    = answers.staffCount;
}

function timeSince(date) {
  const secs = Math.floor((new Date() - date) / 1000);
  if (secs < 3600)  return `${Math.floor(secs/60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)} hr ago`;
  return `${Math.floor(secs/86400)} day${Math.floor(secs/86400)>1?'s':''} ago`;
}

// ── Utility ───────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function lightenHex(hex, amount) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(c=>Math.round(c+(255-c)*amount).toString(16).padStart(2,'0')).join('');
}

// ── Spec file upload (XLSX / DOCX) ────────────────────────
const specUploadZone  = $('specUploadZone');
const specFileInput   = $('specFile');
const specFileStatus  = $('specFileStatus');
const specUploadInner = $('specUploadInner');

specUploadZone?.addEventListener('click', e => {
  if (!e.target.closest('label')) specFileInput.click();
});
specUploadZone?.addEventListener('dragover', e => { e.preventDefault(); specUploadZone.classList.add('drag-over'); });
['dragleave','drop'].forEach(t => specUploadZone.addEventListener(t, e => { e.preventDefault(); specUploadZone.classList.remove('drag-over'); }));
specUploadZone.addEventListener('drop', e => {
  const f = e.dataTransfer.files[0];
  if (f) parseSpecFile(f);
});
specFileInput?.addEventListener('change', () => {
  if (specFileInput.files[0]) parseSpecFile(specFileInput.files[0]);
  specFileInput.value = '';
});

async function parseSpecFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls','docx','csv'].includes(ext)) {
    showSpecStatus(`Unsupported file type: .${ext} — use .xlsx or .docx`, true);
    return;
  }

  showSpecStatus('Extracting content…', false, true);

  try {
    let text = '';

    if (ext === 'csv') {
      // CSV — read as plain text, format as pipe-separated rows for Claude
      const rawText = await file.text();
      const lines = rawText.split(/\r?\n/).filter(l => l.trim());
      if (lines.length === 0) { showSpecStatus('CSV appears to be empty.', true); return; }
      // Keep header + data rows, join cells with | for readability
      text = lines.map(line => {
        // Handle quoted CSV fields
        const cols = [];
        let cur = '', inQuote = false;
        for (const ch of line) {
          if (ch === '"') { inQuote = !inQuote; }
          else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
          else { cur += ch; }
        }
        cols.push(cur.trim());
        return cols.join('  |  ');
      }).join('\n');

    } else if (ext === 'xlsx' || ext === 'xls') {
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(new Uint8Array(buf), { type:'array', cellText:true, cellDates:true });
      const parts = [];
      wb.SheetNames.forEach(name => {
        const ws   = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        const nonEmpty = rows.filter(r => r.some(c => String(c).trim() !== ''));
        if (nonEmpty.length === 0) return;
        parts.push(`--- ${name} ---`);
        nonEmpty.forEach(row => {
          const cells = row.map(c => String(c).trim()).filter(c => c !== '');
          if (cells.length > 0) parts.push(cells.join('  |  '));
        });
      });
      text = parts.join('\n');

    } else if (ext === 'docx') {
      const buf    = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      text = (result.value || '').trim();
    }

    text = text.replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();

    if (text.length < 30) {
      showSpecStatus('File appears to be empty or could not be read.', true);
      return;
    }

    $('exec-spec').value = text;
    $('specCount').textContent = text.length;
    showSpecStatus(`✓ ${file.name} extracted — ${text.length.toLocaleString()} characters. Review below and edit if needed.`);

  } catch (e) {
    showSpecStatus(`Could not read the file: ${e.message}`, true);
  }
}

function showSpecStatus(msg, isError = false, isLoading = false) {
  specFileStatus.textContent  = msg;
  specFileStatus.className    = 'spec-file-status' + (isError ? ' error' : '');
  specFileStatus.classList.remove('hidden');
  if (!isError && !isLoading) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'spec-file-clear'; btn.textContent = '✕ Clear';
    btn.addEventListener('click', () => {
      $('exec-spec').value = ''; $('specCount').textContent = '0';
      specFileStatus.classList.add('hidden');
    });
    specFileStatus.appendChild(btn);
  }
}



// ═════════════════════════════════════════════════════════
// QUICK QUOTE — Mode 3
// Rep describes the product request in plain language.
// We fetch the full catalog, score by keyword match,
// show the top results, generate a cover note, then
// let the rep create a quote against an existing opportunity.
// ═════════════════════════════════════════════════════════

let qqSelectedCompany     = null;
let qqSelectedOpportunity = null;
let qqMatchedProducts     = [];   // [{id, name, price, unit, qty}]

// ── Character counter ─────────────────────────────────────
$('qq-request')?.addEventListener('input', () => {
  $('qqCount').textContent = $('qq-request').value.length;
});

// ── Restore saved credentials when mode opens ─────────────
document.querySelectorAll('.mode-card[data-mode="quickquote"]').forEach(btn => {
  btn.addEventListener('click', () => {
    setTimeout(() => {
      const a = localStorage.getItem(LS_API_KEY), i = localStorage.getItem(LS_INT_KEY);
      if (a) $('qqApiKey').value = a;
      if (i) $('qqIntKey').value = i;
      if (a && i) $('qqRemember').checked = true;
    }, 50);
  });
});

// ── Extract keywords from plain-language request ──────────
// Splits the request into meaningful words, filters stop words
// and very short tokens, returns unique lowercased keywords.
function extractKeywords(request) {
  const stopWords = new Set([
    'i','a','an','the','and','or','for','with','have','please','also',
    'some','would','just','can','us','our','their','my','this','that',
    'like','good','great','any','brand','need','want','get',
    // Number words — quantity hints, not product terms
    'one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','fifteen','twenty','thirty'
  ]);
  // Collapse "512 gb" → "512gb", "27 inch" → "27inch", "16 gb" → "16gb" before splitting
  // so spaced specs match the same way as joined ones
  const collapsed = request.toLowerCase()
    .replace(/(\d+)\s*(gb|tb|mb|ghz|mhz|inch|in)/g, '$1$2')
    .replace(/(\d+)\s*"/g, '$1inch');
  const normalized = collapsed.replace(/[^a-z0-9 ]/g, ' ');
  return [...new Set(
    normalized.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  )];
}

// ── Search catalog ────────────────────────────────────────
$('qqSearchBtn')?.addEventListener('click', doQQCatalogSearch);

async function doQQCatalogSearch() {
  clearError('qqError');
  const request = $('qq-request')?.value.trim() || '';
  const apiKey  = $('qqApiKey')?.value.trim() || '';
  const intKey  = $('qqIntKey')?.value.trim() || '';

  if (!request)           { showError('qqError', 'Describe what the customer needs first.'); return; }
  if (!apiKey || !intKey) { showError('qqError', 'Enter your API credentials to search your catalog.'); return; }

  if ($('qqRemember')?.checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  $('qqSearchBtn').disabled    = true;
  $('qqSearchBtn').textContent = 'Searching catalog…';
  $('qqResultsWrap').classList.add('hidden');


  console.log('[Quick Quote] request:', request);

  try {
    // Search catalog — Claude Haiku matches products semantically
    const catRes = await callCreateOpp('search-products', {
      query: request,
      apiKey,
      integrationKey: intKey
    });
    console.log('[Quick Quote] catalog response:', catRes);
    console.log('[Quick Quote] catalog size:', catRes.catalogSize, '— matched:', catRes.matched);
    if (catRes.products?.length) {
      console.log('[Quick Quote] matched:', catRes.products.map(p => p.name.slice(0,40)));
    }

    const products = catRes.products || [];

    // 2. Generate cover note in parallel (non-blocking)
    const coverPromise = fetch('/api/sales-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'quick-quote', request })
    }).then(r => r.json()).catch(e => {
      console.warn('[Quick Quote] cover note failed:', e);
      return { ok: false };
    });

    // 3. Render product list immediately
    renderQQProducts(products, request);
    $('qqResultsWrap').classList.remove('hidden');
    $('qqResultsWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 4. Zero matches — web search + cover note
    if (products.length === 0) {
      const noMatchHint = $('qqProductList');
      if (noMatchHint) noMatchHint.innerHTML = '';
      $('qqMatchSub').textContent = 'No matches in your catalog — searching the web…';
      renderQQSuggestions(null, true);
      // Run web search and cover note in parallel
      const suggestPromise = fetch('/api/sales-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-products', request })
      }).then(r => r.json()).catch(() => ({ ok: false }));

      const [suggestData, coverData] = await Promise.all([suggestPromise, coverPromise]);
      renderQQSuggestions(suggestData.ok ? suggestData : null, false);

      // Show cover note even for zero catalog matches
      if (coverData.ok && coverData.cover_note) {
        $('qqCoverText').textContent = coverData.cover_note;
      } else {
        $('qqCoverText').textContent = '(Cover note unavailable.)';
      }
      return;
    }

    // 5. Some matches found — check if anything is missing from the request
    const matchedNames = products.map(p => p.name);
    const missingCheck = fetch('/api/sales-guide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'find-missing', request, matchedNames })
    }).then(r => r.json()).catch(() => ({ ok: false }));

    // 6. Fill cover note in parallel
    $('qqCoverText').textContent = 'Writing cover note…';
    const [coverData, missingData] = await Promise.all([coverPromise, missingCheck]);

    if (coverData.ok && coverData.cover_note) {
      $('qqCoverText').textContent = coverData.cover_note;
    } else {
      $('qqCoverText').textContent = '(Cover note unavailable.)';
    }

    // 7. If items are missing, fire web search for them
    if (missingData.ok && !missingData.all_covered && missingData.missing_items?.length > 0) {
      renderQQSuggestions(null, true);
      try {
        const missingRequest = missingData.missing_items.join(', ');
        const suggestRes = await fetch('/api/sales-guide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'suggest-products', request: missingRequest })
        });
        const suggestData = await suggestRes.json();
        renderQQSuggestions(suggestData.ok ? suggestData : null, false);
      } catch (e) {
        renderQQSuggestions(null, false);
      }
    }

  } catch (e) {
    console.error('[Quick Quote] error:', e);
    showError('qqError', e.message || 'Search failed — check your credentials and try again.');
    $('qqResultsWrap').classList.add('hidden');
  }

  $('qqSearchBtn').disabled    = false;
  $('qqSearchBtn').textContent = 'Search My Catalog →';
}

// ── Render matched products ───────────────────────────────
// Availability badge — shown when we can determine a product is not currently available.
// We're conservative: only warn when we have clear evidence of unavailability.
// Until we know the exact field names the API returns, we surface _rawAvail in console
// and show a neutral "Check availability" badge on items where listed===false.
function qqAvailBadge(p) {
  // listed:false means the rep has hidden this product — flag it clearly.
  // This is the only availability signal the Salesbuildr API returns on products.
  if (p.listed === false) {
    return '<span class="opp-svc-badge" style="background:rgba(220,38,38,.1);color:#dc2626;">Not listed — verify before quoting</span>';
  }
  return '';
}

// ── Render web-search suggestions (zero catalog match fallback) ──
function renderQQSuggestions(data, isLoading) {
  const wrap = $('qqSuggestionsWrap');
  const body = $('qqSuggestionsBody');
  if (!wrap || !body) { console.error('[QQ] qqSuggestionsWrap or qqSuggestionsBody not found'); return; }

  wrap.classList.remove('hidden');

  if (isLoading) {
    body.innerHTML = '<div class="qq-suggest-loading"><div class="spinner-sm"></div> Searching the web for matching products…</div>';
    return;
  }

  const suggestions = data?.suggestions || [];
  if (suggestions.length === 0) {
    body.innerHTML = '<div class="qq-suggest-none">No matching products found online. Try rephrasing your request or contact your distributor directly.</div>';
    return;
  }

  body.innerHTML = suggestions.map((s, i) => `
    <div class="qq-suggest-item" id="qq-suggest-${i}">
      <div class="qq-suggest-header">
        <span class="qq-suggest-name">${esc(s.name)}</span>
        ${s.approx_price ? `<span class="qq-suggest-price">${esc(s.approx_price)}</span>` : ''}
      </div>
      <div class="qq-suggest-desc">${esc(s.description)}</div>
      <div class="qq-suggest-meta">
        <span class="qq-suggest-mfr">${esc(s.manufacturer)}</span>
        ${s.mpn ? `
          <button class="qq-mpn-btn" onclick="qqCopyMpn(this, '${esc(s.mpn)}')">
            <span class="qq-mpn-label">MPN</span>
            <span class="qq-mpn-value">${esc(s.mpn)}</span>
            <span class="qq-mpn-copy">Copy</span>
          </button>` : ''}
        <button class="qq-add-btn" onclick="qqAddToCatalog(this, ${i})"
          data-name="${esc(s.name)}"
          data-mpn="${esc(s.mpn || '')}"
          data-vendor="${esc(s.manufacturer || '')}"
          data-desc="${esc(s.description || '')}"
          data-price="${typeof s.approx_price === 'number' ? s.approx_price : 0}">
          + Add to my catalog
        </button>
        <span class="qq-add-result" id="qq-add-result-${i}"></span>
      </div>
    </div>`).join('');

}

function qqCopyMpn(btn, mpn) {
  navigator.clipboard?.writeText(mpn).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = mpn; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
  const copySpan = btn.querySelector('.qq-mpn-copy');
  if (copySpan) { copySpan.textContent = 'Copied!'; setTimeout(() => copySpan.textContent = 'Copy', 2000); }
}

async function qqAddToCatalog(btn, idx) {
  const apiKey = $('qqApiKey')?.value.trim() || '';
  const intKey = $('qqIntKey')?.value.trim() || '';
  if (!apiKey || !intKey) {
    const resultEl = document.getElementById('qq-add-result-' + idx);
    if (resultEl) { resultEl.textContent = 'Enter API credentials first'; resultEl.style.color = '#dc2626'; }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Adding…';
  const resultEl = document.getElementById('qq-add-result-' + idx);

  try {
    const approxPrice = parseFloat(btn.dataset.price) || 0;
    const res = await callCreateOpp('create-product', {
      name:             btn.dataset.name,
      mpn:              btn.dataset.mpn    || undefined,
      vendor:           btn.dataset.vendor || undefined,
      shortDescription: btn.dataset.desc   || undefined,
      price:            approxPrice || undefined,
      apiKey,
      integrationKey:   intKey
    });
    if (!res.ok) throw new Error(res.error || 'Failed to create product');

    const newProduct = res.product;
    btn.textContent = '✓ Added';
    btn.style.background = 'var(--good)';
    btn.style.borderColor = 'var(--good)';
    btn.style.color = '#fff';

    if (resultEl) {
      resultEl.textContent = '';
      const msg = document.createElement('span');
      msg.innerHTML = 'Added &amp; included in quote below &nbsp;·&nbsp; <em>Open in Salesbuildr → hit Fetch info for real pricing</em>';
      msg.style.color = 'var(--good)';
      resultEl.appendChild(msg);
    }

    // Add to matched products so it's included in the quote
    qqInjectAddedProduct({
      id:     newProduct.id,
      name:   newProduct.name || btn.dataset.name,
      price:  approxPrice,
      unit:   '',
      vendor: newProduct.vendor || btn.dataset.vendor || '',
      sku:    newProduct.mpn   || btn.dataset.mpn    || '',
      approx: true,
    });

    // Show pricing notice in the app — only in UI, nothing goes to SB
    qqShowPricingNotice(approxPrice);

  } catch (e) {
    btn.disabled = false;
    btn.textContent = '+ Add to my catalog';
    if (resultEl) { resultEl.textContent = e.message; resultEl.style.color = '#dc2626'; }
  }
}

// Show a non-intrusive pricing notice when a web product is added
function qqShowPricingNotice(approxPrice) {
  // Remove any existing notice first
  document.getElementById('qqPricingNotice')?.remove();

  const notice = document.createElement('div');
  notice.id = 'qqPricingNotice';
  notice.style.cssText = 'margin-top:8px;padding:8px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;gap:8px;';
  notice.innerHTML = '⚠ ' +
    (approxPrice > 0
      ? 'Approximate cost $' + approxPrice.toFixed(2) + ' used — Salesbuildr will apply your category markup to set the sell price. Open the product and hit <strong>Fetch info</strong> to get real distributor pricing if available.'
      : 'No cost set — open the product in Salesbuildr to set pricing before sending this quote.');

  const list = $('qqProductList');
  if (list) list.parentElement.insertBefore(notice, list.nextSibling);
}

// Inject a newly-created product into the matched products list
function qqInjectAddedProduct(product) {
  const list = $('qqProductList');
  if (!list) return;

  const uLabel = unitLabel(product.unit || '');
  const row = document.createElement('label');
  row.className = 'opp-svc-item is-matched qq-just-added';
  row.innerHTML =
    '<input type="checkbox" class="opp-svc-check"' +
    ' data-id="' + esc(product.id) + '"' +
    ' data-name="' + esc(product.name) + '"' +
    ' data-price="' + (product.price || 0) + '"' +
    ' data-unit="' + esc(uLabel) + '" checked>' +
    '<div class="opp-svc-info">' +
      '<span class="opp-svc-name">' + esc(product.name) + '</span>' +
      '<div class="opp-svc-meta">' +
        (product.price > 0 ? '<span class="opp-svc-price">' + (product.approx ? '~$' : '$') + product.price.toFixed(2) + uLabel + ' each' + (product.approx ? ' (approx.)' : '') + '</span>' : '<span class="opp-svc-price">Price on request</span>') +
        (product.vendor ? '<span class="opp-svc-badge extra">' + esc(product.vendor) + '</span>' : '') +
        (product.sku    ? '<span class="opp-svc-badge extra">' + esc(product.sku) + '</span>' : '') +
        '<span class="opp-svc-badge matched">Just added</span>' +
      '</div>' +
    '</div>' +
    '<div class="opp-svc-qty-wrap"><label>Qty</label>' +
      '<input type="number" class="opp-svc-qty" value="1" min="1" max="999">' +
    '</div>' +
    '<span class="opp-svc-line-total">' + (product.price > 0 ? '$' + product.price.toFixed(2) + uLabel : 'Price on request') + '</span>';

  // Wire up the new row's listeners
  row.querySelectorAll('.opp-svc-check, .opp-svc-qty').forEach(el => {
    el.addEventListener('change', updateQQTotal);
    el.addEventListener('input',  updateQQTotal);
  });

  list.appendChild(row);

  // Show the product list and connect section if they were hidden (zero-match state)
  $('qqResultsWrap')?.classList.remove('hidden');
  $('qqConnectSection')?.classList.remove('hidden');

  // Update totals and scroll into view
  updateQQTotal();
  row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // Update subtitle
  const sub = $('qqMatchSub');
  if (sub) {
    const count = list.querySelectorAll('.opp-svc-item').length;
    sub.textContent = count + ' product' + (count !== 1 ? 's' : '') + ' — tick what you want to quote';
  }
}

function renderQQProducts(products, request) {
  qqMatchedProducts = [];
  qqSelectedCompany = null;
  qqSelectedOpportunity = null;

  // Reset connect flow
  $('qqCompanyResults').classList.add('hidden');
  $('qqCompanySelected').classList.add('hidden');
  $('qqOppStep').classList.add('hidden');
  $('qqQuoteStep').classList.add('hidden');
  $('qqCreateResult').classList.add('hidden');
  $('qqUnmatched').classList.add('hidden');
  $('qqSuggestionsWrap')?.classList.add('hidden');
  document.getElementById('qqPricingNotice')?.remove();
  const qqSB = $('qqSuggestionsBody'); if (qqSB) qqSB.innerHTML = '';

  const list = $('qqProductList');

  if (products.length === 0) {
    list.innerHTML = ''; // cleared — suggestions panel takes over for zero matches
    $('qqMatchSub').textContent = 'No matches found';
    $('qqProductTotal').classList.add('hidden');
    return;
  }

  $('qqMatchSub').textContent = `${products.length} product${products.length !== 1 ? 's' : ''} found — tick what you want to quote`;

  // Select-all / clear-all convenience controls
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;';
  controls.innerHTML =
    '<button type="button" class="btn-save" id="qqSelectAll" style="font-size:12px;padding:5px 12px;">✓ Select all</button>' +
    '<button type="button" class="btn-save" id="qqClearAll"  style="font-size:12px;padding:5px 12px;">✕ Clear all</button>';
  list.parentElement.insertBefore(controls, list);
  document.getElementById('qqSelectAll')?.addEventListener('click', () => {
    list.querySelectorAll('.opp-svc-check').forEach(c => c.checked = true);
    updateQQTotal();
  });
  document.getElementById('qqClearAll')?.addEventListener('click', () => {
    list.querySelectorAll('.opp-svc-check').forEach(c => c.checked = false);
    updateQQTotal();
  });

  list.innerHTML = products.map(p => {
    const uLabel = unitLabel(p.unit);
    const lineTot = (p.price || 0) * 1;
    return `
      <label class="opp-svc-item is-matched">
        <input type="checkbox" class="opp-svc-check"
          data-id="${esc(p.id)}" data-name="${esc(p.name)}"
          data-price="${p.price || 0}" data-unit="${esc(uLabel)}">
        <div class="opp-svc-info">
          <span class="opp-svc-name">${esc(p.name)}</span>
          <div class="opp-svc-meta">
            ${p.price > 0 ? `<span class="opp-svc-price">$${p.price.toFixed(2)}${uLabel} each</span>` : '<span class="opp-svc-price">Price on request</span>'}
            ${p.vendor ? `<span class="opp-svc-badge extra">${esc(p.vendor)}</span>` : ''}
            ${p.sku    ? `<span class="opp-svc-badge extra">${esc(p.sku)}</span>`    : ''}
            ${qqAvailBadge(p)}
          </div>
        </div>
        <div class="opp-svc-qty-wrap">
          <label>Qty</label>
          <input type="number" class="opp-svc-qty" value="1" min="1" max="999">
        </div>
        <span class="opp-svc-line-total">$${lineTot.toFixed(2)}${uLabel}</span>
      </label>`;
  }).join('');

  list.querySelectorAll('.opp-svc-check, .opp-svc-qty').forEach(el => {
    el.addEventListener('change', updateQQTotal);
    el.addEventListener('input',  updateQQTotal);
  });
  updateQQTotal();
}

function updateQQTotal() {
  let total = 0, count = 0;
  qqMatchedProducts = [];
  $('qqProductList').querySelectorAll('.opp-svc-item').forEach(row => {
    const check   = row.querySelector('.opp-svc-check');
    const qty     = parseInt(row.querySelector('.opp-svc-qty')?.value) || 1;
    const price   = parseFloat(check?.dataset.price) || 0;
    const uSuffix = check?.dataset.unit || '';
    const line    = price * qty;
    const lineEl  = row.querySelector('.opp-svc-line-total');
    if (lineEl) lineEl.textContent = price > 0 ? `$${line.toFixed(2)}${uSuffix}` : 'Price on request';
    row.style.opacity = check?.checked ? '1' : '0.5';
    if (check?.checked) {
      count++;
      total += line;
      qqMatchedProducts.push({ id: check.dataset.id, name: check.dataset.name, qty, price });
    }
  });

  const totalEl = $('qqProductTotal');
  if (count > 0) {
    totalEl.innerHTML = `<span>${count} item${count !== 1 ? 's' : ''} selected</span><span><strong>$${total.toFixed(2)}</strong> total</span>`;
    totalEl.classList.remove('hidden');
  } else {
    totalEl.classList.add('hidden');
  }
}

// ── Company search ────────────────────────────────────────
$('qqCompanySearchBtn')?.addEventListener('click', doQQCompanySearch);
$('qqCompanyName')?.addEventListener('keydown', e => { if (e.key === 'Enter') doQQCompanySearch(); });

async function doQQCompanySearch() {
  const name   = $('qqCompanyName')?.value.trim() || '';
  const apiKey = $('qqApiKey')?.value.trim() || '';
  const intKey = $('qqIntKey')?.value.trim() || '';
  if (!name) return;

  $('qqCompanySearchBtn').disabled    = true;
  $('qqCompanySearchBtn').textContent = 'Searching…';
  $('qqCompanyResults').classList.add('hidden');

  try {
    const res = await callCreateOpp('search-company', { name, apiKey, integrationKey: intKey });
    renderQQCompanyResults(res.companies || [], name);
  } catch (e) {
    showError('qqError', 'Company search failed: ' + e.message);
  }

  $('qqCompanySearchBtn').disabled    = false;
  $('qqCompanySearchBtn').textContent = 'Search →';
}

function renderQQCompanyResults(companies, searchName) {
  const wrap = $('qqCompanyResults');
  if (companies.length === 0) {
    wrap.innerHTML = `<div class="no-results-hint">No match for "<strong>${esc(searchName)}</strong>"</div>`;
  } else {
    wrap.innerHTML = `<div class="opp-results-label">Select company:</div>
      ${companies.slice(0, 6).map(c => `
        <button class="opp-result-item" data-id="${esc(c.id)}" data-name="${esc(c.name)}">
          ${esc(c.name)}${c.number ? ` <span class="opp-result-num">#${esc(c.number)}</span>` : ''}
        </button>`).join('')}`;
  }
  wrap.classList.remove('hidden');
  wrap.querySelectorAll('.opp-result-item').forEach(btn => {
    btn.addEventListener('click', () => qqSelectCompany({ id: btn.dataset.id, name: btn.dataset.name }));
  });
}

function qqSelectCompany(company) {
  qqSelectedCompany = company;
  $('qqCompanyResults').classList.add('hidden');
  const sel = $('qqCompanySelected');
  sel.innerHTML = `<div class="company-selected-tag">✓ ${esc(company.name)}
    <button class="change-company-btn" id="qqChangeCompanyBtn">Change</button></div>`;
  sel.classList.remove('hidden');
  $('qqOppStep').classList.remove('hidden');
  loadQQOpportunities(company.id);
  document.getElementById('qqChangeCompanyBtn')?.addEventListener('click', () => {
    qqSelectedCompany = null; qqSelectedOpportunity = null;
    sel.classList.add('hidden');
    $('qqOppStep').classList.add('hidden');
    $('qqQuoteStep').classList.add('hidden');
    $('qqCompanyResults').classList.remove('hidden');
  });
}

async function loadQQOpportunities(companyId) {
  const apiKey = $('qqApiKey')?.value.trim() || '';
  const intKey = $('qqIntKey')?.value.trim() || '';
  const list   = $('qqOppList');
  list.innerHTML = '<div class="opp-contact-loading">Loading opportunities…</div>';
  list.classList.remove('hidden');
  $('qqQuoteStep').classList.add('hidden');

  try {
    const res  = await callCreateOpp('search-opportunity', { companyId, apiKey, integrationKey: intKey });
    const opps = res.opportunities || [];
    if (opps.length === 0) {
      list.innerHTML = '<div class="opp-contact-none">No opportunities found — create one in Salesbuildr or Autotask first.</div>';
      return;
    }
    list.innerHTML = `<div class="opp-results-label">Select opportunity:</div>
      ${opps.slice(0, 10).map(o => {
        const date = o.expectedCloseDate ? ` · Close ${o.expectedCloseDate.slice(0,10)}` : '';
        return `<button class="opp-result-item" data-id="${esc(o.id)}" data-name="${esc(o.name)}">
          ${esc(o.name)}<span class="opp-result-num">${date}</span>
        </button>`;
      }).join('')}`;
    list.querySelectorAll('.opp-result-item').forEach(btn => {
      btn.addEventListener('click', () => qqSelectOpportunity({ id: btn.dataset.id, name: btn.dataset.name }));
    });
  } catch (e) {
    list.innerHTML = `<div class="opp-contact-none">Could not load opportunities — ${esc(e.message)}</div>`;
  }
}

function qqSelectOpportunity(opp) {
  qqSelectedOpportunity = opp;
  $('qqOppList').classList.add('hidden');
  const sel = $('qqOppSelected');
  sel.innerHTML = `<div class="company-selected-tag">✓ ${esc(opp.name)}
    <button class="change-company-btn" id="qqChangeOppBtn">Change</button></div>`;
  sel.classList.remove('hidden');
  $('qqQuoteTitle').value = `${opp.name} — Quick Quote`;
  $('qqQuoteStep').classList.remove('hidden');
  $('qqQuoteStep').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('qqChangeOppBtn')?.addEventListener('click', () => {
    qqSelectedOpportunity = null;
    sel.classList.add('hidden');
    $('qqQuoteStep').classList.add('hidden');
    $('qqOppList').classList.remove('hidden');
  });
}

// ── Create quote ──────────────────────────────────────────
$('qqCreateQuoteBtn')?.addEventListener('click', doQQCreateQuote);

async function doQQCreateQuote() {
  if (!qqSelectedOpportunity) { showError('qqError', 'Select an opportunity first.'); return; }
  const apiKey   = $('qqApiKey')?.value.trim() || '';
  const intKey   = $('qqIntKey')?.value.trim() || '';
  const title    = $('qqQuoteTitle')?.value.trim() || qqSelectedOpportunity.name;
  const selected = qqMatchedProducts.filter(p => p.id);

  if (selected.length === 0) { showError('qqError', 'Select at least one product before creating the quote.'); return; }

  $('qqCreateQuoteBtn').disabled    = true;
  $('qqCreateWorking').classList.remove('hidden');
  $('qqCreateResult').classList.add('hidden');
  $('qqCreateWorkingMsg').textContent = `Creating quote with ${selected.length} product${selected.length !== 1 ? 's' : ''}…`;

  try {
    const res = await callCreateOpp('create-quote', {
      opportunityId: qqSelectedOpportunity.id,
      title,
      products: selected.map(p => ({ id: p.id, quantity: p.qty })),
      quickQuote: true,  // triggers Quick Quote template
      apiKey,
      integrationKey: intKey
    });
    $('qqCreateWorking').classList.add('hidden');
    if (res.ok) {
      $('qqCreateResult').innerHTML = `<div class="opp-success">
        <div class="opp-success-icon">✓</div>
        <div class="opp-success-body">
          <strong>Quote created</strong>
          <div class="opp-success-detail">Draft quote added to <em>${esc(qqSelectedOpportunity.name)}</em> with ${selected.length} product${selected.length !== 1 ? 's' : ''}</div>
          <div class="opp-success-hint">Open Salesbuildr to review and send the quote.</div>
        </div>
      </div>`;
      $('qqCreateQuoteBtn').textContent = '✓ Quote Created';
      $('qqCreateQuoteBtn').classList.add('is-done');
    } else {
      throw new Error(res.error || 'Quote creation failed');
    }
  } catch (e) {
    $('qqCreateWorking').classList.add('hidden');
    $('qqCreateResult').innerHTML = `<div class="opp-error">✕ ${esc(e.message)}</div>`;
    $('qqCreateQuoteBtn').disabled = false;
  }
  $('qqCreateResult').classList.remove('hidden');
}

// ── Copy cover letter button ─────────────────────────────
$('qqCopyCoverBtn')?.addEventListener('click', () => {
  const text = $('qqCoverText')?.textContent || '';
  if (!text || text === 'Writing cover note…') return;
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
  const btn = $('qqCopyCoverBtn');
  const orig = btn.textContent;
  btn.textContent = '✓ Copied!';
  setTimeout(() => btn.textContent = orig, 2000);
});

// ── Init ──────────────────────────────────────────────────
initCredentials();
loadResumeBanner();


// ═════════════════════════════════════════════════════════
// PHASE 2 — Connect to Salesbuildr
// Links the Sales Guide recommendation to an existing
// opportunity and creates a draft quote against it.
// ═════════════════════════════════════════════════════════

const ENGAGEMENT_LABELS = {
  managed_services:      'Managed Services',
  network_upgrade:       'Network Infrastructure Upgrade',
  security_project:      'Security Project',
  compliance:            'Compliance Project',
  new_client_onboarding: 'New Client Onboarding',
  project_plus_managed:  'Project + Managed Services',
  mixed:                 'IT Services',
  endpoint_refresh:      'Endpoint Refresh',
  server_eol:            'Server Infrastructure Refresh',
  voip_project:          'VoIP & Communications Upgrade',
  backup_dr:             'Backup & Disaster Recovery',
  copilot_ai:            'Microsoft Copilot & AI Readiness'
};

let selectedOppCompany     = null;
let selectedOppOpportunity = null;

// ── Build plain-text Sales Brief ─────────────────────────
function buildSalesBrief() {
  const rec  = currentRec;
  if (!rec) return '';
  const company = currentAnswers?.company || '';
  const date    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const lines   = [];

  lines.push(`SALES GUIDE BRIEF${company ? ' — ' + company : ''}`);
  lines.push(`Generated: ${date}`);
  lines.push('');

  if (rec.coaching_insight) {
    lines.push('COACHING INSIGHT');
    lines.push(rec.coaching_insight);
    lines.push('');
  }

  const bullets = Array.isArray(rec.solution_bullets) ? rec.solution_bullets
    : (rec.solution_summary ? [rec.solution_summary] : []);
  if (bullets.length) {
    lines.push('RECOMMENDED APPROACH');
    bullets.forEach(b => lines.push(`• ${b}`));
    lines.push('');
  }

  const briefs = rec.widget_briefs || {};
  if (Object.keys(briefs).length) {
    lines.push('PROPOSAL NARRATIVE (W1–W5)');
    if (briefs.w1) lines.push(`Situation  (W1): ${briefs.w1}`);
    if (briefs.w2) lines.push(`Urgency    (W2): ${briefs.w2}`);
    if (briefs.w3) lines.push(`Trust      (W3): ${briefs.w3}`);
    if (briefs.w4) lines.push(`Outcome    (W4): ${briefs.w4}`);
    if (briefs.w5) lines.push(`Investment (W5): ${briefs.w5}`);
    lines.push('');
  }

  const services = rec.services_recommended || [];
  if (services.length) {
    lines.push('SERVICES RECOMMENDED');
    services.forEach(s => {
      const opt = s.optional ? ' (Optional)' : '';
      lines.push(`• ${s.service} — ${s.billing}${opt}`);
      if (s.reason) lines.push(`  ${s.reason}`);
    });
    lines.push('');
  }

  const hw = rec.hardware_checklist || [];
  if (rec.hardware_needed && hw.length) {
    lines.push('HARDWARE TO CONFIRM AT SITE SURVEY');
    hw.forEach(h => {
      lines.push(`• ${h.component}: ${h.confirm}`);
      if (h.never_forget) lines.push(`  ⚠ ${h.never_forget}`);
    });
    lines.push('');
  }

  if (rec.roi_angle) {
    lines.push('ROI ANGLE');
    lines.push(rec.roi_angle);
    lines.push('');
  }

  lines.push('---');
  lines.push('Generated by Salesbuildr Sales Guide');
  return lines.join('\n');
}

// ── Init panel when results are shown ────────────────────
function initCreateOppPanel() {
  selectedOppCompany     = null;
  selectedOppOpportunity = null;

  const a = localStorage.getItem(LS_API_KEY), i = localStorage.getItem(LS_INT_KEY);
  if (a) $('oppApiKey').value = a;
  if (i) $('oppIntKey').value = i;
  if (a && i) $('oppRemember').checked = true;

  const company = currentAnswers?.company || '';
  if (company) $('oppCompanyName').value = company;

  const engType  = currentRec?.engagement_type || 'mixed';
  const engLabel = ENGAGEMENT_LABELS[engType] || 'IT Services';
  $('oppQuoteTitle').value = company ? `${company} — ${engLabel} Proposal` : `${engLabel} Proposal`;
  $('oppBriefText').textContent = buildSalesBrief();

  // Reset all steps
  $('oppStep2').classList.add('hidden');
  $('oppServiceStep').classList.add('hidden');
  $('oppStep3').classList.add('hidden');
  $('oppCompanyResults').classList.add('hidden');
  $('oppCompanySelected').classList.add('hidden');
  $('oppOppList').classList.add('hidden');
  $('oppOppSelected').classList.add('hidden');
  $('oppServiceList').innerHTML = '';
  $('oppServiceTotal').classList.add('hidden');
  $('oppBriefPreview').classList.add('hidden');
  $('oppBriefToggleLabel').textContent = '▶ Preview Sales Brief';
  $('oppCreateResult').classList.add('hidden');
  $('oppCreateBtn').textContent = 'Connect to Salesbuildr →';
  $('oppCreateBtn').classList.remove('is-done');
  $('oppCreateBtn').disabled = false;
  $('oppQuoteFields').classList.remove('hidden');

  // Show widget notice if widgets have already been generated
  const hasWidgets = generatedWidgets && generatedWidgets.length > 0;
  $('oppWidgetNotice').classList.toggle('hidden', !hasWidgets);

  $('createOppWrap').classList.remove('hidden');

  // Update step number and template note based on current mode
  const stepNum = document.getElementById('oppQuoteStepNum');
  const templateNote = document.getElementById('oppTemplateNote');
  if (currentMode === 'execution') {
    if (stepNum) stepNum.textContent = '3';
    if (templateNote) templateNote.innerHTML = 'Uses the <strong>Guided Sales Template</strong> with cover page — includes the full proposal narrative.';
  } else {
    if (stepNum) stepNum.textContent = '4';
    if (templateNote) templateNote.innerHTML = 'Uses your account default template — set your <strong>Guided Sales Template</strong> as default and it applies automatically.';
  }
}

// ── Toggle panel ──────────────────────────────────────────
$('createOppToggle')?.addEventListener('click', () => {
  const body  = $('createOppBody');
  const arrow = $('createOppArrow');
  const isOpen = !body.classList.contains('hidden');
  body.classList.toggle('hidden', isOpen);
  arrow.classList.toggle('open', !isOpen);
});

// ── Sales Brief preview ───────────────────────────────────
$('oppBriefToggle')?.addEventListener('click', () => {
  const preview = $('oppBriefPreview');
  const isOpen  = !preview.classList.contains('hidden');
  preview.classList.toggle('hidden', isOpen);
  $('oppBriefToggleLabel').textContent = isOpen ? '▶ Preview Sales Brief' : '▼ Hide Sales Brief';
});

// ── Quote fields toggle ───────────────────────────────────
$('oppCreateQuote')?.addEventListener('change', () => {
  $('oppQuoteFields').classList.toggle('hidden', !$('oppCreateQuote').checked);
});

// ── Company search ────────────────────────────────────────
$('oppSearchBtn')?.addEventListener('click', doCompanySearch);
$('oppCompanyName')?.addEventListener('keydown', e => { if (e.key === 'Enter') doCompanySearch(); });

async function doCompanySearch() {
  const name   = $('oppCompanyName').value.trim();
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  if (!name)              { showOppError('Enter a company name to search.'); return; }
  if (!apiKey || !intKey) { showOppError('Enter your API credentials first.'); return; }

  $('oppSearchBtn').disabled    = true;
  $('oppSearchBtn').textContent = 'Searching…';
  $('oppCompanyResults').classList.add('hidden');
  $('oppCreateResult').classList.add('hidden');

  try {
    const res = await callCreateOpp('search-company', { name, apiKey, integrationKey: intKey });
    renderCompanyResults(res.companies || [], name);
  } catch (e) { showOppError('Search failed: ' + e.message); }

  $('oppSearchBtn').disabled    = false;
  $('oppSearchBtn').textContent = 'Search →';
}

function renderCompanyResults(companies, searchName) {
  const wrap = $('oppCompanyResults');
  if (companies.length === 0) {
    wrap.innerHTML = `<div class="no-results-hint">No match for "<strong>${esc(searchName)}</strong>" in Salesbuildr</div>`;
  } else {
    wrap.innerHTML = `
      <div class="opp-results-label">Select company:</div>
      ${companies.slice(0, 6).map(c => `
        <button class="opp-result-item" data-id="${esc(c.id)}" data-name="${esc(c.name)}">
          ${esc(c.name)}
          ${c.number ? `<span class="opp-result-num">#${esc(c.number)}</span>` : ''}
        </button>`).join('')}`;
  }
  wrap.classList.remove('hidden');
  wrap.querySelectorAll('.opp-result-item').forEach(btn => {
    btn.addEventListener('click', () => selectCompany({ id: btn.dataset.id, name: btn.dataset.name }));
  });
}

function selectCompany(company) {
  selectedOppCompany     = company;
  selectedOppOpportunity = null;
  $('oppCompanyResults').classList.add('hidden');

  const sel = $('oppCompanySelected');
  sel.innerHTML = `<div class="company-selected-tag">✓ ${esc(company.name)}
    <button class="change-company-btn" id="changeCompanyBtn">Change</button></div>`;
  sel.classList.remove('hidden');

  // Load opportunities for this company
  $('oppStep2').classList.remove('hidden');
  loadOpportunitiesForCompany(company.id);

  $('changeCompanyBtn')?.addEventListener('click', () => {
    selectedOppCompany = null; selectedOppOpportunity = null;
    sel.classList.add('hidden');
    $('oppStep2').classList.add('hidden');
    $('oppStep3').classList.add('hidden');
    $('oppCompanyResults').classList.remove('hidden');
  });
}

// ── Opportunity list for selected company ─────────────────
async function loadOpportunitiesForCompany(companyId) {
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  const list   = $('oppOppList');

  list.innerHTML = '<div class="opp-contact-loading">Loading opportunities…</div>';
  list.classList.remove('hidden');
  $('oppStep3').classList.add('hidden');

  try {
    const res  = await callCreateOpp('search-opportunity', { companyId, apiKey, integrationKey: intKey });
    renderOpportunityList(res.opportunities || []);
  } catch (e) {
    list.innerHTML = `<div class="opp-contact-none">Could not load opportunities — ${esc(e.message)}</div>`;
  }
}

function renderOpportunityList(opps) {
  const list = $('oppOppList');
  if (opps.length === 0) {
    list.innerHTML = `<div class="opp-contact-none">No opportunities found for this company. Create one in Salesbuildr or Autotask first, then come back.</div>`;
    return;
  }
  list.innerHTML = `
    <div class="opp-results-label">Select opportunity:</div>
    ${opps.slice(0, 10).map(o => {
      const date = o.expectedCloseDate ? ` · Close ${o.expectedCloseDate.slice(0,10)}` : '';
      return `<button class="opp-result-item" data-id="${esc(o.id)}" data-extid="${esc(o.externalIdentifier || '')}" data-name="${esc(o.name)}">
        ${esc(o.name)}<span class="opp-result-num">${date}</span>
      </button>`;
    }).join('')}`;

  list.querySelectorAll('.opp-result-item').forEach(btn => {
    btn.addEventListener('click', () => selectOpportunity({
      id:    btn.dataset.id,
      extId: btn.dataset.extid,
      name:  btn.dataset.name
    }));
  });
}

async function selectOpportunity(opp) {
  // Show selected state immediately
  const sel = $('oppOppSelected');
  sel.innerHTML = `<div class="company-selected-tag">
    <div class="spinner-sm" style="width:14px;height:14px;"></div>
    Loading ${esc(opp.name)}…</div>`;
  $('oppOppList').classList.add('hidden');
  sel.classList.remove('hidden');

  // Fetch full opportunity to get all existing field IDs
  try {
    const apiKey = $('oppApiKey').value.trim();
    const intKey = $('oppIntKey').value.trim();
    const res    = await callCreateOpp('get-opportunity', { opportunityId: opp.id, apiKey, integrationKey: intKey });
    if (res.ok && res.opportunity) {
      const full = res.opportunity;
      opp.contactId       = full.contactId       || null;
      opp.ownerId         = full.ownerId         || null;
      opp.pipelineStageId = full.pipelineStageId || null;
      opp.categoryId      = full.categoryId      || null;
    }
  } catch { /* use what we have */ }

  selectedOppOpportunity = opp;

  sel.innerHTML = `<div class="company-selected-tag">✓ ${esc(opp.name)}
    <button class="change-company-btn" id="changeOppBtn">Change</button></div>`;

  if (opp.name && !$('oppQuoteTitle').value) {
    $('oppQuoteTitle').value = `${opp.name} — Proposal`;
  }

  // Execution mode — skip guided catalog, go straight to quote step
  // Discovery mode — load guided catalog for service selection
  if (currentMode === 'execution') {
    $('oppServiceStep').classList.add('hidden');
    $('oppStep3').classList.remove('hidden');
    $('oppStep3').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    $('oppServiceStep').classList.remove('hidden');
    $('oppServiceStep').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    loadGuidedCatalog();
  }

  $('changeOppBtn')?.addEventListener('click', () => {
    selectedOppOpportunity = null;
    sel.classList.add('hidden');
    $('oppServiceStep').classList.add('hidden');
    $('oppStep3').classList.add('hidden');
    $('oppOppList').classList.remove('hidden');
  });
}

// ── Guided catalog fetch & service matching ───────────────
async function loadGuidedCatalog() {
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  const list   = $('oppServiceList');

  list.innerHTML = '<div class="opp-contact-loading">Loading your catalog…</div>';
  $('oppStep3').classList.add('hidden');
  $('oppServiceTotal').classList.add('hidden');

  try {
    const res     = await callCreateOpp('fetch-guided-catalog', { apiKey, integrationKey: intKey });
    const catalog = res.catalog || [];
    if (res._debug) console.log('[Sales Guide] catalog debug:', JSON.stringify(res._debug, null, 2));
    renderServiceSelection(catalog);
  } catch (e) {
    list.innerHTML = `<div class="opp-contact-none">Could not load catalog — ${esc(e.message)}</div>`;
    $('oppStep3').classList.remove('hidden');
  }
}

// Maps engagement type → the catalog label that's relevant for that engagement
// ── Curated service framework per engagement type ─────────
// Industry-standard MSP services for each engagement.
// These replace Claude-generated names which can vary and be inaccurate.
// Reps map these categories to their specific catalog items.
const ENGAGEMENT_SERVICES = {
  network_upgrade: [
    { service: 'Network Monitoring & Management', billing: 'monthly', optional: false },
    { service: 'Managed Firewall Service', billing: 'monthly', optional: false },
    { service: 'Network Maintenance & Patching', billing: 'monthly', optional: true },
  ],
  endpoint_refresh: [
    { service: 'Managed Endpoint Protection (EDR)', billing: 'monthly', optional: false },
    { service: 'Patch Management & Device Updates', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Helpdesk & End-User Support', billing: 'monthly', optional: true },
  ],
  server_eol: [
    { service: 'Server Monitoring & Administration', billing: 'monthly', optional: false },
    { service: 'Server Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'IT Helpdesk & Support', billing: 'monthly', optional: true },
  ],
  security_project: [
    { service: 'Endpoint Detection & Response (EDR)', billing: 'monthly', optional: false },
    { service: 'Email Security & Anti-Phishing', billing: 'monthly', optional: false },
    { service: 'DNS Filtering & Web Protection', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Compliance Management & Reporting', billing: 'monthly', optional: true },
  ],
  compliance: [
    { service: 'Compliance Management & Reporting', billing: 'monthly', optional: false },
    { service: 'Endpoint Detection & Response (EDR)', billing: 'monthly', optional: false },
    { service: 'Email Security & Anti-Phishing', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Security Awareness Training', billing: 'annual', optional: true },
  ],
  voip_project: [
    { service: 'Hosted VoIP / UCaaS (Teams Voice or PBX)', billing: 'monthly', optional: false },
    { service: 'VoIP System Monitoring & Support', billing: 'monthly', optional: false },
    { service: 'Number Porting & Migration', billing: 'one-time', optional: false },
  ],
  backup_dr: [
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Backup Monitoring & Recovery Testing', billing: 'monthly', optional: false },
    { service: 'DR Planning & Documentation', billing: 'one-time', optional: true },
  ],
  copilot_ai: [
    { service: 'Microsoft 365 Copilot Licensing', billing: 'monthly', optional: false },
    { service: 'AI Governance & Data Management', billing: 'monthly', optional: false },
    { service: 'Copilot Adoption & Training Programme', billing: 'monthly', optional: true },
  ],
  managed_services: [
    { service: 'Managed IT Support & Helpdesk', billing: 'monthly', optional: false },
    { service: 'Endpoint Security & EDR', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Email Security & Anti-Phishing', billing: 'monthly', optional: true },
  ],
  new_client_onboarding: [
    { service: 'Managed IT Support & Helpdesk', billing: 'monthly', optional: false },
    { service: 'Endpoint Security & EDR', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
    { service: 'Email Security & Anti-Phishing', billing: 'monthly', optional: true },
  ],
  project_plus_managed: [
    { service: 'Managed IT Support & Helpdesk', billing: 'monthly', optional: false },
    { service: 'Endpoint Security & EDR', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
  ],
  mixed: [
    { service: 'Managed IT Support & Helpdesk', billing: 'monthly', optional: false },
    { service: 'Endpoint Security & EDR', billing: 'monthly', optional: false },
    { service: 'Backup & Disaster Recovery', billing: 'monthly', optional: false },
  ],
};

const ENGAGEMENT_LABEL_MAP = {
  network_upgrade:       'guided-network',
  endpoint_refresh:      'guided-endpoint',
  server_eol:            'guided-server',
  voip_project:          'guided-voip',
  backup_dr:             'guided-security',
  security_project:      'guided-security',
  compliance:            'guided-security',
  copilot_ai:            'guided-copilot',
  managed_services:      'guided-onboarding',
  new_client_onboarding: 'guided-onboarding',
  project_plus_managed:  'guided-onboarding',
  mixed:                 null
};

// Returns the engagement-specific label for the current recommendation
function currentEngagementLabel() {
  const type = currentRec?.engagement_type || 'mixed';
  return ENGAGEMENT_LABEL_MAP[type] ?? null;
}

// True if a catalog item is relevant to the current engagement.
// Items with ONLY the generic 'guided' label (no engagement-specific guided-xxx)
// are always relevant — this covers PSA-synced services whose engagement labels
// aren't returned by the API. Items with engagement-specific labels are filtered.
function itemIsRelevant(item, engLabel) {
  if (!engLabel) return true;
  const labels    = item.labels || [];
  const engLabels = labels.filter(l => l !== 'guided' && l.startsWith('guided-'));
  if (engLabels.length === 0) return true;       // no engagement label → always relevant
  return engLabels.includes(engLabel);            // has labels → must match current engagement
}

// True if item should default to qty 1 — PS project fees, assessments,
// bundles, and service-type items with non-monthly billing.
// Hardware products (headsets, laptops, switches) are excluded even if
// they have one-time billing — those belong in extras, not pre-selected.
function isProjectFee(item) {
  const n = item.name.toLowerCase();
  const u = (item.unit || '').toLowerCase();
  const t = (item.type || '').toLowerCase();

  if (t === 'bundle') return true;
  if (n.startsWith('professional services') || n.includes('assessment')) return true;

  // For products (hardware etc.), only treat as a project fee if the name
  // indicates it's a service engagement — not a physical device
  if (t === 'product') {
    const isServiceProduct = n.includes('implementation') || n.includes('governance')
      || n.includes('migration') || n.includes('deployment')
      || n.includes('configuration') || n.includes('readiness');
    if (!isServiceProduct) return false;
  }

  return u === 'quarter' || u === 'quarterly'
    || u === 'year'    || u === 'annual'
    || u === 'once'    || u === 'one-time' || u === 'onetime';
}

function matchScore(a, b) {
  if (!a || !b) return 0;
  a = String(a).toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  b = String(b).toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const wordsA = a.split(/\s+/).filter(w => w.length > 2);
  const wordsB = b.split(/\s+/).filter(w => w.length > 2);
  if (!wordsA.length || !wordsB.length) return 0;
  const shared = wordsA.filter(w => wordsB.includes(w)).length;
  return shared / Math.max(wordsA.length, wordsB.length);
}

function renderServiceSelection(catalog) {
  const list         = $('oppServiceList');
  const recs         = currentRec?.services_recommended || [];
  const defaultQty   = parseInt(currentAnswers?.staffCount) || 1;
  const engLabel     = currentEngagementLabel();

  // Filter catalog to engagement-relevant items BEFORE matching.
  // If no engagement label (managed_services, mixed etc.) use full catalog.
  const relevantCatalog = engLabel
    ? catalog.filter(item => itemIsRelevant(item, engLabel))
    : catalog;

  console.log(`[Sales Guide] engagement: ${currentRec?.engagement_type}, label: ${engLabel}, relevant items: ${relevantCatalog.length} of ${catalog.length}`);

  const usedCatalogIds = new Set();

  const matched   = [];
  const unmatched = [];

  // Step 1: Auto pre-select bundles and PS fees from the relevant catalog.
  // These are curated for the engagement type — no name matching needed.
  relevantCatalog.forEach(item => {
    const t = (item.type || '').toLowerCase();
    if (t === 'bundle' || isProjectFee(item)) {
      usedCatalogIds.add(item.id);
      matched.push({ rec: { service: item.name, optional: false }, item, preSelected: true });
    }
  });

  // Step 2: Name-based matching for remaining individual services.
  // Only match against items with NO engagement-specific label in the API
  // (i.e., truly universal services). Skip bundles and PS fees (already handled).
  const universalServices = relevantCatalog.filter(item => {
    if (usedCatalogIds.has(item.id)) return false;
    const t = (item.type || '').toLowerCase();
    if (t === 'bundle' || isProjectFee(item)) return false; // already handled
    const engLabels = (item.labels || []).filter(l => l !== 'guided' && l.startsWith('guided-'));
    return engLabels.length === 0; // only truly universal items (no engagement-specific label)
  });

  recs.forEach(rec => {
    if (!rec.service) return;
    let best = null, bestScore = 0;
    universalServices.forEach(item => {
      if (usedCatalogIds.has(item.id)) return;
      const score = matchScore(rec.service, item.name);
      if (score > bestScore) { bestScore = score; best = item; }
    });
    if (best && bestScore >= 0.4) {
      usedCatalogIds.add(best.id);
      matched.push({ rec, item: best, preSelected: !rec.optional });
    } else {
      unmatched.push(rec);
    }
  });

  // Extras — remaining relevant items (unchecked, rep adds as needed)
  const extras = relevantCatalog.filter(item => !usedCatalogIds.has(item.id));

  let html = '';

  if (matched.length > 0) {
    html += `<div class="opp-svc-section-label">Recommended &amp; matched</div>`;
    matched.forEach(({ rec, item, preSelected }) => {
      const qty   = isProjectFee(item) ? 1 : defaultQty;
      const badge = rec.optional ? 'optional' : 'matched';
      const label = rec.optional ? 'Optional' : 'Recommended';
      html += svcRow(item, qty, preSelected, badge, label);
    });
  }

  if (extras.length > 0) {
    html += `<div class="opp-svc-section-label" style="margin-top:10px;">Also in your catalog</div>`;
    extras.forEach(item => {
      const qty = isProjectFee(item) ? 1 : defaultQty;
      html += svcRow(item, qty, false, 'extra', '');
    });
  }

  if (unmatched.length > 0) {
    const names = unmatched.map(r => r.service).join(', ');
    html += `<div class="opp-svc-unmatched" style="margin-top:10px;">
      ✦ Also recommended but not in your guided catalog — add manually if needed: <strong>${esc(names)}</strong>
    </div>`;
  }

  if (!html) {
    html = '<div class="opp-contact-none">No guided catalog items found. Tag products with "guided" in Salesbuildr.</div>';
  }

  list.innerHTML = html;

  // Wire up checkboxes and qty inputs → update running total
  list.querySelectorAll('.opp-svc-check, .opp-svc-qty').forEach(el => {
    el.addEventListener('change', updateServiceTotal);
    el.addEventListener('input',  updateServiceTotal);
  });
  updateServiceTotal();

  $('oppStep3').classList.remove('hidden');
  $('oppStep3').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function unitLabel(unit) {
  const u = (unit || '').toLowerCase();
  if (u === 'month' || u === 'monthly')      return '/mo';
  if (u === 'quarter' || u === 'quarterly')  return '/qtr';
  if (u === 'year'    || u === 'annual')     return '/yr';
  return '';  // one-time / hardware — no recurring suffix
}

function svcRow(item, defaultQty, preSelected, badgeClass, badgeLabel) {
  const price   = typeof item.price === 'number' ? item.price : 0;
  const uLabel  = unitLabel(item.unit);
  const lineTotal = price * defaultQty;
  const lineSuffix = uLabel || '';
  return `
    <label class="opp-svc-item${badgeClass === 'matched' ? ' is-matched' : badgeClass === 'extra' ? ' is-extra' : ''}">
      <input type="checkbox" class="opp-svc-check" data-id="${esc(item.id)}" data-price="${price}" data-unit="${esc(uLabel)}" ${preSelected ? 'checked' : ''}>
      <div class="opp-svc-info">
        <span class="opp-svc-name">${esc(item.name)}</span>
        <div class="opp-svc-meta">
          ${price > 0 ? `<span class="opp-svc-price">$${price.toFixed(2)}${uLabel} each</span>` : ''}
          ${badgeLabel ? `<span class="opp-svc-badge ${badgeClass}">${badgeLabel}</span>` : ''}
        </div>
      </div>
      <div class="opp-svc-qty-wrap">
        <label>Qty</label>
        <input type="number" class="opp-svc-qty" value="${defaultQty}" min="1" max="999">
      </div>
      <span class="opp-svc-line-total">$${lineTotal.toFixed(2)}${lineSuffix}</span>
    </label>`;
}

function updateServiceTotal() {
  let monthly = 0, oneTime = 0, count = 0;
  $('oppServiceList').querySelectorAll('.opp-svc-item').forEach(row => {
    const check   = row.querySelector('.opp-svc-check');
    const qty     = parseInt(row.querySelector('.opp-svc-qty')?.value) || 1;
    const price   = parseFloat(check?.dataset.price) || 0;
    const lineEl  = row.querySelector('.opp-svc-line-total');
    const uSuffix = check?.dataset.unit || '';
    const line    = price * qty;
    if (lineEl) lineEl.textContent = `$${line.toFixed(2)}${uSuffix}`;
    if (check?.checked) {
      count++;
      if (uSuffix === '/mo' || uSuffix === '/month') monthly += line;
      else if (uSuffix === '/yr' || uSuffix === '/year') monthly += line / 12;
      else if (uSuffix === '/qtr') monthly += line / 3;
      else oneTime += line; // blank unit = one-time
    }
    row.style.opacity = check?.checked ? '1' : '0.5';
  });
  const totalEl = $('oppServiceTotal');
  if (count > 0) {
    const parts = [];
    if (monthly > 0) parts.push(`<strong>$${monthly.toFixed(2)}/mo</strong> recurring`);
    if (oneTime > 0) parts.push(`<strong>$${oneTime.toFixed(2)}</strong> one-time`);
    totalEl.innerHTML = `<span>${count} item${count !== 1 ? 's' : ''} selected</span><span>${parts.join(' &nbsp;·&nbsp; ')}</span>`;
    totalEl.classList.remove('hidden');
  } else {
    totalEl.classList.add('hidden');
  }
}

function getSelectedServices() {
  const selected = [];
  $('oppServiceList')?.querySelectorAll('.opp-svc-item').forEach(row => {
    const check = row.querySelector('.opp-svc-check');
    if (check?.checked) {
      const qty = parseInt(row.querySelector('.opp-svc-qty')?.value) || 1;
      selected.push({ id: check.dataset.id, quantity: qty });
    }
  });
  return selected;
}

// ── Main connect flow ─────────────────────────────────────
$('oppCreateBtn')?.addEventListener('click', doConnectOpportunity);

async function doConnectOpportunity() {
  const apiKey = $('oppApiKey').value.trim();
  const intKey = $('oppIntKey').value.trim();
  if (!apiKey || !intKey)         { showOppError('Enter your API credentials first.'); return; }
  if (!selectedOppOpportunity)    { showOppError('Select an opportunity first.'); return; }

  if ($('oppRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_INT_KEY, intKey);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_INT_KEY);
  }

  $('oppCreateBtn').disabled    = true;
  $('oppCreateWorking').classList.remove('hidden');
  $('oppCreateResult').classList.add('hidden');

  const creds       = { apiKey, integrationKey: intKey };
  const description = buildSalesBrief();
  const opp         = selectedOppOpportunity;

  try {
    // 1. Update opportunity description with Sales Brief
    setOppWorking('Adding Sales Brief to opportunity…');
    const oppRes = await callCreateOpp('upsert-opportunity', {
      name:           opp.name,
      description,
      extId:          opp.extId,
      companyId:      selectedOppCompany.id,
      contactId:      opp.contactId       || undefined,
      ownerId:        opp.ownerId         || undefined,
      pipelineStageId:opp.pipelineStageId || undefined,
      categoryId:     opp.categoryId      || undefined,
      ...creds
    });
    if (!oppRes.ok) throw new Error(oppRes.error || 'Failed to update opportunity.');

    // 2. Create draft quote with services (optional)
    let quoteCreated = false;
    let serviceCount = 0;
    if ($('oppCreateQuote').checked) {
      const selectedServices = getSelectedServices();
      serviceCount = selectedServices.length;
      setOppWorking(serviceCount > 0 ? `Creating quote with ${serviceCount} service${serviceCount !== 1 ? 's' : ''}…` : 'Creating draft quote…');
      const quoteTitle   = $('oppQuoteTitle').value.trim() || opp.name;
      const quotePayload = { opportunityId: opp.id, title: quoteTitle, ...creds };
      if (currentMode === 'execution') {
        quotePayload.executionQuote = true;
        // Use exec matched products instead of guided catalog selection
        if (execMatchedProducts.length > 0) {
          quotePayload.products = execMatchedProducts.map(p => ({ id: p.id, quantity: p.qty || 1 }));
          serviceCount = execMatchedProducts.length;
        }
      } else {
        if (selectedServices.length > 0) quotePayload.products = selectedServices;
      }
      const quoteRes     = await callCreateOpp('create-quote', quotePayload);
      quoteCreated       = quoteRes.ok;
    }

    // Success
    $('oppCreateWorking').classList.add('hidden');
    const resultEl = $('oppCreateResult');
    resultEl.innerHTML = `
      <div class="opp-success">
        <div class="opp-success-icon">✓</div>
        <div class="opp-success-body">
          <strong>Connected to Salesbuildr</strong>
          <div class="opp-success-detail">
            Sales Brief added to <em>${esc(opp.name)}</em>${quoteCreated ? ` · Draft quote created${serviceCount > 0 ? ` with ${serviceCount} service${serviceCount !== 1 ? 's' : ''}` : ''}` : ''}
          </div>
          <div class="opp-success-hint">Open Salesbuildr to find your opportunity with the Sales Brief in the Description.</div>
        </div>
      </div>`;
    resultEl.classList.remove('hidden');
    $('oppCreateBtn').textContent = '✓ Connected';
    $('oppCreateBtn').classList.add('is-done');

  } catch (e) {
    $('oppCreateWorking').classList.add('hidden');
    showOppError(e.message);
    $('oppCreateBtn').disabled = false;
  }
}

// ── Helpers ───────────────────────────────────────────────
async function callCreateOpp(action, data) {
  const res = await fetch('/api/create-opportunity', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, ...data })
  });
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Server error — make sure create-opportunity.js is deployed to Netlify.');
  }
  return res.json();
}

function setOppWorking(msg) {
  $('oppWorkingMsg').textContent = msg;
  $('oppCreateWorking').classList.remove('hidden');
}

function showOppError(msg) {
  $('oppCreateWorking').classList.add('hidden');
  const el = $('oppCreateResult');
  el.innerHTML = `<div class="opp-error">✕ ${esc(msg)}</div>`;
  el.classList.remove('hidden');
}
