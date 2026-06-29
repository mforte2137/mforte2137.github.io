/* proposal-defence-kit.js */

/* ─── Session persistence ─── */
const SESSION_KEY   = 'defence_sessions';
const ARCHIVE_KEY   = 'defence_sessions_archived';
const SESSION_LIMIT = 5;

let currentSessionId = null;
let autoSaveReady    = false; // prevents saves firing during restore

/* ─── State ─── */
const state = {
  activeModules: { competitor: false, pricing: false, objections: false },
  themeColor: '#0f1f3d',
  generatedData: null,
  lastPayload: null,
  pushPendingWidgets: null
};

/* ─── DOM helpers ─── */
const $ = id => document.getElementById(id);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

/* ─── Session storage helpers ─── */
function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)  || '[]'); } catch { return []; } }
function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

function saveSessions(sessions) {
  try {
    const json = JSON.stringify(sessions);
    if (json.length > 2_500_000) {
      // Strip widget HTML from older sessions to save space
      const trimmed = sessions.map((s, i) => i === 0 ? s : { ...s, generatedData: null });
      localStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(SESSION_KEY, json);
    }
  } catch (e) { console.warn('Session save failed:', e); }
}

function fmtAge(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 2)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── Auto-save ─── */
function autoSave(status) {
  if (!autoSaveReady) return;
  const sessions = getSessions();
  const formData = captureFormData();
  const prospect = formData.prospect || 'Untitled';
  const now = Date.now();

  const sessionData = {
    id: currentSessionId || (currentSessionId = now.toString(36)),
    prospect,
    savedAt: now,
    status: status || (state.generatedData ? 'generated' : 'draft'),
    formData,
    activeModules: { ...state.activeModules },
    themeColor: state.themeColor,
    generatedData: state.generatedData,
    customIncluded: getCustomIncludedChips()
  };

  const idx = sessions.findIndex(s => s.id === currentSessionId);
  if (idx >= 0) sessions[idx] = sessionData;
  else sessions.unshift(sessionData);

  saveSessions(sessions);
  renderSessionCards();
}

/* ─── Capture form data ─── */
function captureFormData() {
  return {
    prospect:    $('prospect-name')?.value.trim() || '',
    industry:    $('industry')?.value || '',
    offering:    $('offering')?.value.trim() || '',
    situation:   $('situation')?.value || '',
    competitor: {
      name:            $('comp-name')?.value.trim() || '',
      offered:         $('comp-offered')?.value.trim() || '',
      differentiators: $('comp-differentiators')?.value.trim() || '',
      ourPrice:        $('comp-your-price')?.value.trim() || '',
      theirPrice:      $('comp-their-price')?.value.trim() || ''
    },
    pricing: {
      monthly:   $('price-monthly')?.value.trim() || '',
      users:     $('price-users')?.value || '',
      inHouse:   $('price-inhouse')?.value.trim() || '',
      risk:      $('price-risk')?.value || '',
      included:  [...document.querySelectorAll('#included-chips .chip.selected')].map(c => c.dataset.value)
    },
    objections: {
      selected: [...document.querySelectorAll('.objection-chip.selected')].map(c => c.dataset.value),
      custom:   $('obj-custom')?.value.trim() || '',
      context:  $('obj-context')?.value.trim() || ''
    }
  };
}

function getCustomIncludedChips() {
  return [...document.querySelectorAll('#included-chips .chip-custom-added')].map(c => c.dataset.value);
}

/* ─── Restore session ─── */
function resumeSession(sess) {
  autoSaveReady = false;

  currentSessionId = sess.id;
  state.themeColor = sess.themeColor || '#0f1f3d';
  state.activeModules = { ...(sess.activeModules || { competitor: false, pricing: false, objections: false }) };
  state.generatedData = sess.generatedData || null;
  state.lastPayload   = null;

  const fd = sess.formData || {};

  // Common fields
  if ($('prospect-name')) $('prospect-name').value = fd.prospect || '';
  if ($('industry'))      $('industry').value      = fd.industry || '';
  if ($('offering'))      $('offering').value      = fd.offering || '';
  if ($('situation'))     $('situation').value     = fd.situation || '';

  // Competitor fields
  const c = fd.competitor || {};
  if ($('comp-name'))           $('comp-name').value           = c.name || '';
  if ($('comp-offered'))        $('comp-offered').value        = c.offered || '';
  if ($('comp-differentiators'))$('comp-differentiators').value= c.differentiators || '';
  if ($('comp-your-price'))     $('comp-your-price').value     = c.ourPrice || '';
  if ($('comp-their-price'))    $('comp-their-price').value    = c.theirPrice || '';

  // Pricing fields
  const p = fd.pricing || {};
  if ($('price-monthly')) $('price-monthly').value = p.monthly || '';
  if ($('price-users'))   $('price-users').value   = p.users || '';
  if ($('price-inhouse')) $('price-inhouse').value = p.inHouse || '';
  if ($('price-risk'))    $('price-risk').value    = p.risk || '';

  // Restore included preset chips
  document.querySelectorAll('#included-chips .chip:not(.chip-custom-added)').forEach(chip => {
    chip.classList.toggle('selected', (p.included || []).includes(chip.dataset.value));
  });

  // Restore custom included chips (remove old ones first)
  document.querySelectorAll('#included-chips .chip-custom-added').forEach(c => c.remove());
  (sess.customIncluded || []).forEach(val => addCustomIncludedChip(val, true));

  // Objection chips
  const obj = fd.objections || {};
  document.querySelectorAll('.objection-chip').forEach(chip => {
    chip.classList.toggle('selected', (obj.selected || []).includes(chip.dataset.value));
  });
  if ($('obj-custom'))  $('obj-custom').value  = obj.custom || '';
  if ($('obj-context')) $('obj-context').value = obj.context || '';

  // Module toggles
  ['competitor', 'pricing', 'objections'].forEach(mod => {
    const active = state.activeModules[mod] || false;
    const toggle = $(`toggle-${mod}`);
    const inputs = $(`inputs-${mod}`);
    const card   = $(`module-card-${mod}`);
    if (toggle) toggle.setAttribute('aria-checked', String(active));
    if (inputs) { if (active) inputs.removeAttribute('hidden'); else inputs.setAttribute('hidden', ''); }
    if (card)   { if (active) card.classList.add('module-active'); else card.classList.remove('module-active'); }
  });

  // Color swatch
  let matched = false;
  document.querySelectorAll('.swatch').forEach(s => {
    const m = s.dataset.hex === state.themeColor;
    s.classList.toggle('active', m);
    if (m) matched = true;
  });
  if (!matched && $('custom-color')) $('custom-color').value = state.themeColor;

  // If there were generated widgets, restore them
  if (state.generatedData && sess.formData) {
    const payload = buildPayloadFromFormData(fd);
    state.lastPayload = payload;
    renderResults(state.generatedData, payload);
  } else {
    $('results-area').setAttribute('hidden', '');
    $('empty-state').removeAttribute('hidden');
  }

  updateGenerateHint();
  renderSessionCards();

  autoSaveReady = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildPayloadFromFormData(fd) {
  return {
    prospect:   fd.prospect || '',
    industry:   fd.industry || '',
    offering:   fd.offering || '',
    situation:  fd.situation || '',
    themeColor: state.themeColor,
    modules: {
      competitor: state.activeModules.competitor ? {
        active: true,
        competitorName:   fd.competitor?.name || '',
        prospectTold:     fd.competitor?.offered || '',
        differentiators:  fd.competitor?.differentiators || '',
        ourPrice:         fd.competitor?.ourPrice || '',
        theirPrice:       fd.competitor?.theirPrice || ''
      } : { active: false },
      pricing: state.activeModules.pricing ? {
        active: true,
        monthlyPrice: fd.pricing?.monthly || '',
        users:        parseInt(fd.pricing?.users) || 0,
        included:     fd.pricing?.included || [],
        inHouseCost:  fd.pricing?.inHouse || '',
        riskFocus:    fd.pricing?.risk || ''
      } : { active: false },
      objections: state.activeModules.objections ? {
        active: true,
        objections: [...(fd.objections?.selected || []), ...(fd.objections?.custom ? [fd.objections.custom] : [])],
        context:    fd.objections?.context || ''
      } : { active: false }
    }
  };
}

/* ─── New Defence ─── */
function newSession() {
  autoSave(); // save current before clearing
  currentSessionId = null;
  state.activeModules = { competitor: false, pricing: false, objections: false };
  state.generatedData = null;
  state.lastPayload   = null;
  state.themeColor    = '#0f1f3d';

  // Reset form
  ['prospect-name','offering','comp-name','comp-offered','comp-differentiators',
   'comp-your-price','comp-their-price','price-monthly','price-users','price-inhouse',
   'obj-custom','obj-context'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('industry'))   $('industry').value   = '';
  if ($('situation'))  $('situation').value  = '';
  if ($('price-risk')) $('price-risk').value = '';

  // Reset chips
  document.querySelectorAll('#included-chips .chip:not(.chip-custom-added)').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('#included-chips .chip-custom-added').forEach(c => c.remove());
  document.querySelectorAll('.objection-chip').forEach(c => c.classList.remove('selected'));

  // Reset modules
  ['competitor', 'pricing', 'objections'].forEach(mod => {
    state.activeModules[mod] = false;
    const toggle = $(`toggle-${mod}`);
    const inputs = $(`inputs-${mod}`);
    const card   = $(`module-card-${mod}`);
    if (toggle) toggle.setAttribute('aria-checked', 'false');
    if (inputs) inputs.setAttribute('hidden', '');
    if (card)   card.classList.remove('module-active');
  });

  // Reset swatch to navy
  document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === '#0f1f3d'));
  if ($('custom-color')) $('custom-color').value = '#0f1f3d';

  // Reset output
  $('results-area').setAttribute('hidden', '');
  $('empty-state').removeAttribute('hidden');

  updateGenerateHint();
  renderSessionCards();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─── Render session cards ─── */
let _showingArchived = false;

function renderSessionCards(showArchived) {
  if (showArchived !== undefined) _showingArchived = showArchived;
  const sessions = getSessions();
  const archived = _showingArchived ? getArchived() : [];
  const toShow   = _showingArchived ? [...sessions, ...archived] : sessions.slice(0, SESSION_LIMIT);

  const block = $('sessions-block');
  const cards = $('session-cards');
  const archBtn = $('btn-show-archived');

  if (!toShow.length && !sessions.length) { if (block) block.setAttribute('hidden', ''); return; }
  if (block) block.removeAttribute('hidden');
  if (!cards) return;

  cards.innerHTML = '';
  toShow.forEach(sess => {
    const card = document.createElement('div');
    card.className = 'session-card';
    const statusClass = { draft: 'status-draft', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-draft';
    card.innerHTML = `
      <div class="session-card-info">
        <div class="session-card-company">${escHtml(sess.prospect || 'Untitled')}</div>
        <div class="session-card-meta">${fmtAge(sess.savedAt)}</div>
      </div>
      <div class="session-card-actions">
        <span class="session-status ${statusClass}">${(sess.status || 'draft').toUpperCase()}</span>
        <button class="session-discard" data-id="${escHtml(sess.id)}" title="Discard">×</button>
      </div>`;
    card.addEventListener('click', e => { if (!e.target.classList.contains('session-discard')) resumeSession(sess); });
    card.querySelector('.session-discard').addEventListener('click', e => {
      e.stopPropagation();
      discardSession(sess.id, _showingArchived);
    });
    cards.appendChild(card);
  });

  if (!_showingArchived && sessions.length > SESSION_LIMIT) {
    const more = document.createElement('div');
    more.style.cssText = 'font-size:11px;color:var(--text-3);text-align:center;padding:4px;';
    more.textContent = `+ ${sessions.length - SESSION_LIMIT} more`;
    cards.appendChild(more);
  }

  if (archBtn) archBtn.textContent = _showingArchived ? 'Hide archived' : 'Show archived';
}

function discardSession(id, isArchived) {
  if (isArchived) saveArchived(getArchived().filter(s => s.id !== id));
  else saveSessions(getSessions().filter(s => s.id !== id));
  renderSessionCards();
}

/* ─── Wire session UI ─── */
on($('btn-new-defence'),  'click', newSession);
on($('btn-show-archived'),'click', () => renderSessionCards(!_showingArchived));

/* ─── Color theme ─── */
document.querySelectorAll('.swatch').forEach(swatch => {
  on(swatch, 'click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    state.themeColor = swatch.dataset.hex;
    autoSave();
  });
});
on($('custom-color'), 'input', () => {
  state.themeColor = $('custom-color').value;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  autoSave();
});

/* ─── Module Toggles ─── */
['competitor', 'pricing', 'objections'].forEach(mod => {
  const row    = document.querySelector(`[data-module="${mod}"]`);
  const toggle = $(`toggle-${mod}`);
  const inputs = $(`inputs-${mod}`);
  const card   = $(`module-card-${mod}`);

  const activate = () => {
    const now = !state.activeModules[mod];
    state.activeModules[mod] = now;
    toggle.setAttribute('aria-checked', String(now));
    if (now) { inputs.removeAttribute('hidden'); card.classList.add('module-active'); }
    else     { inputs.setAttribute('hidden', ''); card.classList.remove('module-active'); }
    updateGenerateHint();
    autoSave();
  };

  on(row, 'click', activate);
  on(toggle, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); activate(); } });
});

function updateGenerateHint() {
  const active = Object.values(state.activeModules).filter(Boolean).length;
  const hint = $('module-count-hint');
  if (!hint) return;
  hint.textContent = active === 0 ? 'Activate at least one module above' : `${active} module${active > 1 ? 's' : ''} active`;
}

/* ─── Auto-save on field changes ─── */
function wireAutoSave() {
  const fields = ['prospect-name','industry','offering','situation',
    'comp-name','comp-offered','comp-differentiators','comp-your-price','comp-their-price',
    'price-monthly','price-users','price-inhouse','price-risk',
    'obj-custom','obj-context'];
  fields.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', () => autoSave());
    if (el) el.addEventListener('change', () => autoSave());
  });
}

/* ─── Chips — included services ─── */
document.querySelectorAll('#included-chips .chip').forEach(chip => {
  on(chip, 'click', () => { chip.classList.toggle('selected'); autoSave(); });
});

/* ─── Custom included services ─── */
function addCustomIncludedChip(value, silent) {
  const val = value.trim();
  if (!val) return;
  const existing = [...document.querySelectorAll('#included-chips .chip')];
  if (existing.some(c => c.dataset.value.toLowerCase() === val.toLowerCase())) {
    if ($('custom-included-input')) $('custom-included-input').value = '';
    return;
  }
  const chip = document.createElement('button');
  chip.className = 'chip chip-custom-added selected';
  chip.dataset.value = val;
  chip.innerHTML = `${escHtml(val)} <span class="chip-remove" title="Remove">×</span>`;
  chip.addEventListener('click', e => {
    if (e.target.classList.contains('chip-remove')) { chip.remove(); autoSave(); }
    else { chip.classList.toggle('selected'); autoSave(); }
  });
  $('included-chips').appendChild(chip);
  if ($('custom-included-input')) $('custom-included-input').value = '';
  if (!silent) { if ($('custom-included-input')) $('custom-included-input').focus(); autoSave(); }
}

on($('custom-included-add'), 'click', () => addCustomIncludedChip($('custom-included-input').value));
on($('custom-included-input'), 'keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addCustomIncludedChip($('custom-included-input').value); }
});

/* ─── Chips — objections ─── */
document.querySelectorAll('.objection-chip').forEach(chip => {
  on(chip, 'click', () => { chip.classList.toggle('selected'); autoSave(); });
});

/* ─── Gather payload ─── */
function getPayload() {
  const prospect  = $('prospect-name').value.trim();
  const industry  = $('industry').value;
  const offering  = $('offering').value.trim();
  const situation = $('situation').value;

  const payload = { prospect, industry, offering, situation, themeColor: state.themeColor, modules: {} };

  if (state.activeModules.competitor) {
    payload.modules.competitor = {
      active: true,
      competitorName:  $('comp-name').value.trim(),
      prospectTold:    $('comp-offered').value.trim(),
      differentiators: $('comp-differentiators').value.trim(),
      ourPrice:        $('comp-your-price').value.trim(),
      theirPrice:      $('comp-their-price').value.trim()
    };
  } else { payload.modules.competitor = { active: false }; }

  if (state.activeModules.pricing) {
    const includedChips = [...document.querySelectorAll('#included-chips .chip.selected')].map(c => c.dataset.value);
    payload.modules.pricing = {
      active: true,
      monthlyPrice: $('price-monthly').value.trim(),
      users:        parseInt($('price-users').value) || 0,
      included:     includedChips,
      inHouseCost:  $('price-inhouse').value.trim(),
      riskFocus:    $('price-risk').value
    };
  } else { payload.modules.pricing = { active: false }; }

  if (state.activeModules.objections) {
    const selected = [...document.querySelectorAll('.objection-chip.selected')].map(c => c.dataset.value);
    const custom   = $('obj-custom').value.trim();
    if (custom) selected.push(custom);
    payload.modules.objections = { active: true, objections: selected, context: $('obj-context').value.trim() };
  } else { payload.modules.objections = { active: false }; }

  return payload;
}

/* ─── Validation ─── */
function validate(payload) {
  if (!payload.prospect)  return 'Please enter a prospect name.';
  if (!payload.industry)  return 'Please select an industry.';
  if (!payload.offering)  return 'Please describe what you are proposing.';
  if (!payload.situation) return 'Please select the situation.';
  if (!Object.values(state.activeModules).some(Boolean)) return 'Please activate at least one module.';
  if (state.activeModules.competitor && !payload.modules.competitor.differentiators)
    return 'Please enter what makes your offering stronger (Module 1).';
  if (state.activeModules.pricing && !payload.modules.pricing.monthlyPrice)
    return 'Please enter the monthly price (Module 2).';
  if (state.activeModules.objections && payload.modules.objections.objections.length === 0)
    return 'Please select at least one objection (Module 3).';
  return null;
}

/* ─── Generate ─── */
on($('btn-generate'), 'click', generate);
on($('btn-regenerate'), 'click', generate);

async function generate() {
  const payload = getPayload();
  const err = validate(payload);
  if (err) { alert(err); return; }

  $('empty-state').setAttribute('hidden', '');
  $('results-area').setAttribute('hidden', '');
  $('loading-state').removeAttribute('hidden');

  const msgs = ['Building your defence kit…', 'Crafting talking points…', 'Polishing the widgets…'];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % msgs.length;
    if ($('loading-text')) $('loading-text').textContent = msgs[msgIdx];
  }, 2000);

  try {
    const res  = await fetch('/api/proposal-defence-kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    clearInterval(msgInterval);

    if (!data.ok) {
      $('loading-state').setAttribute('hidden', '');
      $('empty-state').removeAttribute('hidden');
      alert('Error: ' + (data.error || 'Something went wrong. Please try again.'));
      return;
    }

    state.generatedData = data.result;
    state.lastPayload   = payload;
    renderResults(data.result, payload);
    autoSave('generated');

  } catch (e) {
    clearInterval(msgInterval);
    $('loading-state').setAttribute('hidden', '');
    $('empty-state').removeAttribute('hidden');
    alert('Network error. Please check your connection and try again.');
  }
}

/* ─── Render Results ─── */
function renderResults(result, payload) {
  $('loading-state').setAttribute('hidden', '');
  $('empty-state').setAttribute('hidden', '');
  $('results-area').removeAttribute('hidden');
  $('results-prospect-label').textContent = payload.prospect;

  const container = $('widget-cards');
  container.innerHTML = '';

  const moduleConfig = [
    { key: 'competitor', label: 'Competitor Comparison', widgetName: 'Why Choose Us' },
    { key: 'pricing',    label: 'Pricing Justification', widgetName: 'Understanding Your Investment' },
    { key: 'objections', label: 'Objection & FAQ',       widgetName: 'Common Questions Answered' }
  ];

  moduleConfig.forEach(({ key, label, widgetName }) => {
    if (!state.activeModules[key] || !result[key]) return;
    const widgetTitle = `${payload.prospect} — Defence — ${widgetName}`;
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.module = key;
    card.innerHTML = `
      <div class="widget-card-header">
        <span class="widget-card-title">${label} — <em style="font-style:normal;color:var(--text-3)">${widgetTitle}</em></span>
        <div class="widget-card-actions">
          <button class="btn-secondary btn-sm btn-regen-module" data-module="${key}">↺ Regenerate</button>
          <button class="btn-secondary btn-sm btn-copy-widget" data-module="${key}">Copy HTML</button>
          <button class="btn-accent btn-sm btn-push-widget" data-module="${key}" data-title="${escHtml(widgetTitle)}">Push Widget</button>
        </div>
      </div>
      <div class="widget-card-body">
        <div class="widget-preview" id="preview-${key}">${result[key].widget.html}</div>
      </div>`;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-copy-widget').forEach(btn => {
    on(btn, 'click', () => copyToClipboard(state.generatedData[btn.dataset.module].widget.html, btn, 'Copy HTML'));
  });
  container.querySelectorAll('.btn-push-widget').forEach(btn => {
    on(btn, 'click', () => {
      const mod = btn.dataset.module;
      const nameMap = { competitor: 'Why Choose Us', pricing: 'Understanding Your Investment', objections: 'Common Questions Answered' };
      initPush(
        [{ html: state.generatedData[mod].widget.html, title: nameMap[mod] }],
        state.lastPayload.prospect + ' — Defence'
      );
    });
  });
  container.querySelectorAll('.btn-regen-module').forEach(btn => {
    on(btn, 'click', () => regenModule(btn.dataset.module));
  });
}

/* ─── Regen single module ─── */
async function regenModule(mod) {
  const payload = state.lastPayload;
  if (!payload) return;
  const preview = $(`preview-${mod}`);
  if (preview) preview.innerHTML = '<span style="color:var(--text-3);font-size:12px;">Regenerating…</span>';

  try {
    const singlePayload = { ...payload, modules: {} };
    ['competitor', 'pricing', 'objections'].forEach(k => {
      singlePayload.modules[k] = k === mod ? payload.modules[k] : { active: false };
    });
    const res  = await fetch('/api/proposal-defence-kit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(singlePayload)
    });
    const data = await res.json();
    if (data.ok && data.result[mod]) {
      state.generatedData[mod] = data.result[mod];
      if (preview) preview.innerHTML = data.result[mod].widget.html;
      autoSave('generated');
    } else {
      if (preview) preview.innerHTML = '<span style="color:var(--danger);">Regeneration failed. Please try again.</span>';
    }
  } catch {
    if (preview) preview.innerHTML = '<span style="color:var(--danger);">Network error.</span>';
  }
}

/* ─── Copy HTML — all ─── */
on($('btn-copy-html'), 'click', () => {
  if (!state.generatedData) return;
  const parts = ['competitor','pricing','objections']
    .filter(k => state.activeModules[k] && state.generatedData[k])
    .map(k => state.generatedData[k].widget.html);
  copyToClipboard(parts.join('\n\n'), $('btn-copy-html'), 'Copy HTML');
});

/* ─── Push individual ─── */
on($('btn-push-individual'), 'click', () => {
  if (!state.generatedData) return;
  const nameMap = { competitor: 'Why Choose Us', pricing: 'Understanding Your Investment', objections: 'Common Questions Answered' };
  const widgets = ['competitor','pricing','objections']
    .filter(k => state.activeModules[k] && state.generatedData[k])
    .map(k => ({ html: state.generatedData[k].widget.html, title: nameMap[k] }));
  initPush(widgets, state.lastPayload.prospect + ' — Defence');
});

/* ─── Push as pack ─── */
on($('btn-push-pack'), 'click', () => {
  if (!state.generatedData) return;
  const parts = ['competitor','pricing','objections']
    .filter(k => state.activeModules[k] && state.generatedData[k])
    .map(k => state.generatedData[k].widget.html);
  initPush([{ html: parts.join('\n\n'), title: 'Proposal Defence Kit' }], state.lastPayload.prospect);
});

/* ─── Push flow ─── */
function initPush(widgets, prefix) {
  const apiKey    = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');
  if (!apiKey || !tenantUrl) {
    state.pushPendingWidgets = { widgets, prefix };
    $('creds-overlay').removeAttribute('hidden');
    if ($('sb-tenant')) $('sb-tenant').value = tenantUrl || '';
    if ($('sb-api-key')) $('sb-api-key').value = '';
    return;
  }
  doPush(widgets, prefix, apiKey, tenantUrl);
}

async function doPush(widgets, prefix, apiKey, tenantUrl) {
  try {
    const res  = await fetch('/api/push-widgets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets, prefix: prefix || '', apiKey, tenantUrl })
    });
    const data = await res.json();
    if (data.ok || (data.successCount && data.successCount > 0)) {
      alert(`✓ Pushed ${widgets.length} widget${widgets.length > 1 ? 's' : ''} to Salesbuildr successfully.`);
      autoSave('pushed');
    } else {
      alert('Push failed: ' + (data.error || 'Unknown error'));
    }
  } catch { alert('Network error during push. Please try again.'); }
}

/* ─── Credentials modal ─── */
on($('creds-save'), 'click', () => {
  const tenant = $('sb-tenant').value.trim();
  const key    = $('sb-api-key').value.trim();
  if (!tenant || !key) { alert('Please enter both Tenant URL and API Key.'); return; }
  localStorage.setItem('sb_tenant_url', tenant);
  localStorage.setItem('sb_api_key', key);
  $('creds-overlay').setAttribute('hidden', '');
  if (state.pushPendingWidgets) {
    doPush(state.pushPendingWidgets.widgets, state.pushPendingWidgets.prefix, key, tenant);
    state.pushPendingWidgets = null;
  }
});
on($('creds-cancel'), 'click', () => $('creds-overlay').setAttribute('hidden', ''));
on($('creds-close'),  'click', () => $('creds-overlay').setAttribute('hidden', ''));

/* ─── Talking points modal ─── */
on($('btn-view-talking-points'), 'click', openTalkingPoints);

function openTalkingPoints() {
  if (!state.generatedData) return;
  const prospect = state.lastPayload?.prospect || '';
  const dateStr  = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  $('talktrack-title').textContent    = 'Talking Points';
  $('talktrack-subtitle').textContent = `${prospect} — ${dateStr}`;

  const body = $('talktrack-body');
  body.innerHTML = '';

  const moduleConfig = [
    { key: 'competitor', title: 'Competitor Comparison', fields: [
        { label: 'Opener', prop: 'opener' },
        { label: 'When they say "they\'re cheaper"', prop: 'responses', isArray: true },
        { label: 'Risk Question to Plant', prop: 'riskQuestion' },
        { label: 'Closing Ask', prop: 'closingAsk' }
    ]},
    { key: 'pricing', title: 'Pricing Justification', fields: [
        { label: 'Opener', prop: 'opener' },
        { label: 'Per-User Reframe', prop: 'reframe' },
        { label: 'Cost-of-Not-Having-It Question', prop: 'riskQuestion' },
        { label: 'Insurance Analogy', prop: 'insuranceAnalogy' },
        { label: 'Closing Ask', prop: 'closingAsk' }
    ]},
    { key: 'objections', title: 'Objection & FAQ', fields: [
        { label: 'Responses', prop: 'responses', isObjArray: true },
        { label: 'Transition Line', prop: 'transitionLine' }
    ]}
  ];

  let plainTextParts = [`PROPOSAL DEFENCE KIT — ${prospect}\nGenerated: ${dateStr}\n`];

  moduleConfig.forEach(({ key, title, fields }) => {
    if (!state.activeModules[key] || !state.generatedData[key]) return;
    const track = state.generatedData[key].talkTrack;
    if (!track) return;

    const section = document.createElement('div');
    section.className = 'talk-section';
    const header = document.createElement('div');
    header.className = 'talk-section-header';
    header.innerHTML = `<span class="talk-section-title">${title}</span>
      <button class="btn-secondary btn-sm btn-copy-section">Copy Section</button>`;
    section.appendChild(header);

    let plainSection = `\n--- ${title.toUpperCase()} ---\n`;

    fields.forEach(({ label, prop, isArray, isObjArray }) => {
      const val = track[prop];
      if (!val) return;
      const item = document.createElement('div');
      item.className = 'talk-item';
      const labelEl = document.createElement('div');
      labelEl.className = 'talk-item-label';
      labelEl.textContent = label;
      item.appendChild(labelEl);

      if (isArray && Array.isArray(val)) {
        const content = document.createElement('div');
        content.className = 'talk-item-content talk-responses';
        val.forEach(v => { const r = document.createElement('div'); r.className = 'talk-response-item'; r.textContent = v; content.appendChild(r); });
        item.appendChild(content);
        plainSection += `${label.toUpperCase()}:\n${val.map((v,i) => `  ${i+1}. ${v}`).join('\n')}\n`;
      } else if (isObjArray && Array.isArray(val)) {
        const content = document.createElement('div');
        content.className = 'talk-item-content talk-responses';
        val.forEach(v => {
          const r = document.createElement('div');
          r.className = 'talk-response-item';
          if (typeof v === 'object') r.innerHTML = `<strong style="font-size:12px;color:var(--text-2)">${escHtml(v.objection||'')}</strong><br>${escHtml(v.response||'')}`;
          else r.textContent = v;
          content.appendChild(r);
        });
        item.appendChild(content);
        if (typeof val[0] === 'object') plainSection += `${label.toUpperCase()}:\n${val.map(v=>`  "${v.objection}"\n  → ${v.response}`).join('\n\n')}\n`;
      } else {
        const content = document.createElement('div');
        content.className = 'talk-item-content';
        content.textContent = val;
        item.appendChild(content);
        plainSection += `${label.toUpperCase()}: ${val}\n`;
      }
      section.appendChild(item);
    });

    body.appendChild(section);
    plainTextParts.push(plainSection);
    section.querySelector('.btn-copy-section').addEventListener('click', function() {
      copyToClipboard(plainSection, this, 'Copy Section');
    });
  });

  state.talkTrackPlainText = plainTextParts.join('\n');
  $('talktrack-overlay').removeAttribute('hidden');
}

on($('talktrack-close'),    'click', () => $('talktrack-overlay').setAttribute('hidden', ''));
on($('btn-copy-all-talk'),  'click', () => copyToClipboard(state.talkTrackPlainText || '', $('btn-copy-all-talk'), 'Copy All'));
on($('talktrack-overlay'),  'click', e => { if (e.target === $('talktrack-overlay')) $('talktrack-overlay').setAttribute('hidden', ''); });
on($('creds-overlay'),      'click', e => { if (e.target === $('creds-overlay')) $('creds-overlay').setAttribute('hidden', ''); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('talktrack-overlay').setAttribute('hidden', '');
    $('creds-overlay').setAttribute('hidden', '');
  }
});

/* ─── Clipboard ─── */
function copyToClipboard(text, btn, resetLabel) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => btn.textContent = resetLabel || orig, 2000);
  }).catch(() => alert('Copy failed — please copy manually.'));
}

/* ─── Init ─── */
wireAutoSave();
renderSessionCards();
updateGenerateHint();

// Restore most recent session if one exists
const existing = getSessions();
if (existing.length) {
  resumeSession(existing[0]);
} else {
  autoSaveReady = true;
}
