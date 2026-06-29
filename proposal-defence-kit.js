/* proposal-defence-kit.js */

/* ─── State ─── */
const state = {
  activeModules: { competitor: false, pricing: false, objections: false },
  themeColor: '#0f1f3d',
  generatedData: null,
  prospectName: '',
  pushPendingAction: null // 'individual' | 'pack'
};

/* ─── DOM helpers ─── */
const $ = id => document.getElementById(id);
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

/* ─── Color theme ─── */
document.querySelectorAll('.swatch').forEach(swatch => {
  on(swatch, 'click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    state.themeColor = swatch.dataset.hex;
  });
});

const customColor = $('custom-color');
on(customColor, 'input', () => {
  state.themeColor = customColor.value;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
});

/* ─── Module Toggles ─── */
['competitor', 'pricing', 'objections'].forEach(mod => {
  const row = document.querySelector(`[data-module="${mod}"]`);
  const toggle = $(`toggle-${mod}`);
  const inputs = $(`inputs-${mod}`);
  const card = $(`module-card-${mod}`);

  const activate = () => {
    const now = !state.activeModules[mod];
    state.activeModules[mod] = now;
    toggle.setAttribute('aria-checked', String(now));
    if (now) {
      inputs.removeAttribute('hidden');
      card.classList.add('module-active');
    } else {
      inputs.setAttribute('hidden', '');
      card.classList.remove('module-active');
    }
    updateGenerateHint();
  };

  on(row, 'click', activate);
  on(toggle, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); activate(); } });
});

function updateGenerateHint() {
  const active = Object.values(state.activeModules).filter(Boolean).length;
  const hint = $('module-count-hint');
  if (active === 0) {
    hint.textContent = 'Activate at least one module above';
  } else {
    hint.textContent = `${active} module${active > 1 ? 's' : ''} active`;
  }
}

/* ─── Chips — included services ─── */
document.querySelectorAll('#included-chips .chip').forEach(chip => {
  on(chip, 'click', () => chip.classList.toggle('selected'));
});

/* ─── Chips — objections ─── */
document.querySelectorAll('.objection-chip').forEach(chip => {
  on(chip, 'click', () => chip.classList.toggle('selected'));
});

/* ─── Gather inputs ─── */
function getPayload() {
  const prospect = $('prospect-name').value.trim();
  const industry = $('industry').value;
  const offering = $('offering').value.trim();
  const situation = $('situation').value;

  const payload = {
    prospect,
    industry,
    offering,
    situation,
    themeColor: state.themeColor,
    modules: {}
  };

  if (state.activeModules.competitor) {
    payload.modules.competitor = {
      active: true,
      competitorName: $('comp-name').value.trim(),
      prospectTold: $('comp-offered').value.trim(),
      differentiators: $('comp-differentiators').value.trim(),
      ourPrice: $('comp-your-price').value.trim(),
      theirPrice: $('comp-their-price').value.trim()
    };
  } else {
    payload.modules.competitor = { active: false };
  }

  if (state.activeModules.pricing) {
    const includedChips = [...document.querySelectorAll('#included-chips .chip.selected')].map(c => c.dataset.value);
    payload.modules.pricing = {
      active: true,
      monthlyPrice: $('price-monthly').value.trim(),
      users: parseInt($('price-users').value) || 0,
      included: includedChips,
      inHouseCost: $('price-inhouse').value.trim(),
      riskFocus: $('price-risk').value
    };
  } else {
    payload.modules.pricing = { active: false };
  }

  if (state.activeModules.objections) {
    const selectedObjections = [...document.querySelectorAll('.objection-chip.selected')].map(c => c.dataset.value);
    const customObj = $('obj-custom').value.trim();
    if (customObj) selectedObjections.push(customObj);
    payload.modules.objections = {
      active: true,
      objections: selectedObjections,
      context: $('obj-context').value.trim()
    };
  } else {
    payload.modules.objections = { active: false };
  }

  return payload;
}

/* ─── Validation ─── */
function validate(payload) {
  if (!payload.prospect) return 'Please enter a prospect name.';
  if (!payload.industry) return 'Please select an industry.';
  if (!payload.offering) return 'Please describe what you are proposing.';
  if (!payload.situation) return 'Please select the situation.';
  const anyActive = Object.values(state.activeModules).some(Boolean);
  if (!anyActive) return 'Please activate at least one module.';
  if (state.activeModules.competitor && !payload.modules.competitor.differentiators) {
    return 'Please enter what makes your offering stronger (Module 1).';
  }
  if (state.activeModules.pricing && !payload.modules.pricing.monthlyPrice) {
    return 'Please enter the monthly price (Module 2).';
  }
  if (state.activeModules.objections && payload.modules.objections.objections.length === 0) {
    return 'Please select at least one objection (Module 3).';
  }
  return null;
}

/* ─── Generate ─── */
on($('btn-generate'), 'click', generate);
on($('btn-regenerate'), 'click', generate);

async function generate() {
  const payload = getPayload();
  const err = validate(payload);
  if (err) { alert(err); return; }

  state.prospectName = payload.prospect;

  // Show loading
  $('empty-state').setAttribute('hidden', '');
  $('results-area').setAttribute('hidden', '');
  $('loading-state').removeAttribute('hidden');

  const loadingMessages = [
    'Building your defence kit…',
    'Crafting talking points…',
    'Polishing the widgets…'
  ];
  let msgIdx = 0;
  const msgInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % loadingMessages.length;
    $('loading-text').textContent = loadingMessages[msgIdx];
  }, 2000);

  try {
    const res = await fetch('/api/proposal-defence-kit', {
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
    state.lastPayload = payload;
    renderResults(data.result, payload);

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

    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.module = key;

    const widgetTitle = `${payload.prospect} — Defence — ${widgetName}`;

    card.innerHTML = `
      <div class="widget-card-header">
        <span class="widget-card-title">${label} — <em style="font-style:normal;color:var(--text-3)">${widgetTitle}</em></span>
        <div class="widget-card-actions">
          <button class="btn-secondary btn-sm btn-regen-module" data-module="${key}">↺ Regenerate</button>
          <button class="btn-secondary btn-sm btn-copy-widget" data-module="${key}">Copy HTML</button>
          <button class="btn-accent btn-sm btn-push-widget" data-module="${key}" data-title="${widgetTitle}">Push Widget</button>
        </div>
      </div>
      <div class="widget-card-body">
        <div class="widget-preview" id="preview-${key}">${result[key].widget.html}</div>
      </div>
    `;

    container.appendChild(card);
  });

  // Wire per-widget buttons
  container.querySelectorAll('.btn-copy-widget').forEach(btn => {
    on(btn, 'click', () => {
      const mod = btn.dataset.module;
      const html = state.generatedData[mod].widget.html;
      copyToClipboard(html, btn, 'Copy HTML');
    });
  });

  container.querySelectorAll('.btn-push-widget').forEach(btn => {
    on(btn, 'click', () => {
      const mod = btn.dataset.module;
      const html = state.generatedData[mod].widget.html;
      const title = btn.dataset.title;
      initPush([{ type: 'html', content: html, title }]);
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

  const card = document.querySelector(`.widget-card[data-module="${mod}"]`);
  const preview = $(`preview-${mod}`);
  if (preview) {
    preview.innerHTML = '<span style="color:var(--text-3);font-size:12px;">Regenerating…</span>';
  }

  try {
    const singlePayload = { ...payload, modules: {} };
    ['competitor', 'pricing', 'objections'].forEach(k => {
      singlePayload.modules[k] = k === mod ? payload.modules[k] : { active: false };
    });

    const res = await fetch('/api/proposal-defence-kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(singlePayload)
    });
    const data = await res.json();
    if (data.ok && data.result[mod]) {
      state.generatedData[mod] = data.result[mod];
      if (preview) preview.innerHTML = data.result[mod].widget.html;
    } else {
      if (preview) preview.innerHTML = '<span style="color:var(--danger);">Regeneration failed. Please try again.</span>';
    }
  } catch {
    if (preview) preview.innerHTML = '<span style="color:var(--danger);">Network error.</span>';
  }
}

/* ─── Copy HTML — all active widgets ─── */
on($('btn-copy-html'), 'click', () => {
  if (!state.generatedData) return;
  const parts = [];
  ['competitor', 'pricing', 'objections'].forEach(k => {
    if (state.activeModules[k] && state.generatedData[k]) {
      parts.push(state.generatedData[k].widget.html);
    }
  });
  copyToClipboard(parts.join('\n\n'), $('btn-copy-html'), 'Copy HTML');
});

/* ─── Push Widgets — individual ─── */
on($('btn-push-individual'), 'click', () => {
  if (!state.generatedData) return;
  const widgets = [];
  const prospectName = state.lastPayload.prospect;
  const nameMap = { competitor: 'Why Choose Us', pricing: 'Understanding Your Investment', objections: 'Common Questions Answered' };

  ['competitor', 'pricing', 'objections'].forEach(k => {
    if (state.activeModules[k] && state.generatedData[k]) {
      widgets.push({
        type: 'html',
        content: state.generatedData[k].widget.html,
        title: `${prospectName} — Defence — ${nameMap[k]}`
      });
    }
  });
  initPush(widgets);
});

/* ─── Push Widgets — as pack ─── */
on($('btn-push-pack'), 'click', () => {
  if (!state.generatedData) return;
  const parts = [];
  ['competitor', 'pricing', 'objections'].forEach(k => {
    if (state.activeModules[k] && state.generatedData[k]) {
      parts.push(state.generatedData[k].widget.html);
    }
  });
  const combined = parts.join('\n\n');
  initPush([{
    type: 'html',
    content: combined,
    title: `${state.lastPayload.prospect} — Proposal Defence Kit`
  }]);
});

/* ─── Push flow ─── */
function initPush(widgets) {
  const apiKey = localStorage.getItem('sb_api_key');
  const tenantUrl = localStorage.getItem('sb_tenant_url');

  if (!apiKey || !tenantUrl) {
    state.pushPendingWidgets = widgets;
    $('creds-overlay').removeAttribute('hidden');
    $('sb-tenant').value = tenantUrl || '';
    $('sb-api-key').value = '';
    return;
  }
  doPush(widgets, apiKey, tenantUrl);
}

async function doPush(widgets, apiKey, tenantUrl) {
  try {
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets, apiKey, tenantUrl })
    });
    const data = await res.json();
    if (data.ok || (data.successCount && data.successCount > 0)) {
      alert(`✓ Pushed ${widgets.length} widget${widgets.length > 1 ? 's' : ''} to Salesbuildr successfully.`);
    } else {
      alert('Push failed: ' + (data.error || 'Unknown error'));
    }
  } catch {
    alert('Network error during push. Please try again.');
  }
}

/* ─── Credentials modal ─── */
on($('creds-save'), 'click', () => {
  const tenant = $('sb-tenant').value.trim();
  const key = $('sb-api-key').value.trim();
  if (!tenant || !key) { alert('Please enter both Tenant URL and API Key.'); return; }
  localStorage.setItem('sb_tenant_url', tenant);
  localStorage.setItem('sb_api_key', key);
  $('creds-overlay').setAttribute('hidden', '');
  if (state.pushPendingWidgets) {
    doPush(state.pushPendingWidgets, key, tenant);
    state.pushPendingWidgets = null;
  }
});

on($('creds-cancel'), 'click', () => $('creds-overlay').setAttribute('hidden', ''));
on($('creds-close'), 'click', () => $('creds-overlay').setAttribute('hidden', ''));

/* ─── Talking points modal ─── */
on($('btn-view-talking-points'), 'click', openTalkingPoints);

function openTalkingPoints() {
  if (!state.generatedData) return;

  const prospect = state.lastPayload?.prospect || '';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  $('talktrack-title').textContent = 'Talking Points';
  $('talktrack-subtitle').textContent = `${prospect} — ${dateStr}`;

  const body = $('talktrack-body');
  body.innerHTML = '';

  const moduleConfig = [
    {
      key: 'competitor',
      title: 'Competitor Comparison',
      fields: [
        { label: 'Opener', prop: 'opener' },
        { label: 'When they say "they\'re cheaper"', prop: 'responses', isArray: true },
        { label: 'Risk Question to Plant', prop: 'riskQuestion' },
        { label: 'Closing Ask', prop: 'closingAsk' }
      ]
    },
    {
      key: 'pricing',
      title: 'Pricing Justification',
      fields: [
        { label: 'Opener', prop: 'opener' },
        { label: 'Per-User Reframe', prop: 'reframe' },
        { label: 'Cost-of-Not-Having-It Question', prop: 'riskQuestion' },
        { label: 'Insurance Analogy', prop: 'insuranceAnalogy' },
        { label: 'Closing Ask', prop: 'closingAsk' }
      ]
    },
    {
      key: 'objections',
      title: 'Objection & FAQ',
      fields: [
        { label: 'Responses', prop: 'responses', isObjArray: true },
        { label: 'Transition Line', prop: 'transitionLine' }
      ]
    }
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
    header.innerHTML = `
      <span class="talk-section-title">${title}</span>
      <button class="btn-secondary btn-sm btn-copy-section" data-module="${key}">Copy Section</button>
    `;
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
        val.forEach(v => {
          const r = document.createElement('div');
          r.className = 'talk-response-item';
          r.textContent = v;
          content.appendChild(r);
        });
        item.appendChild(content);
        plainSection += `${label.toUpperCase()}:\n${val.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}\n`;
      } else if (isObjArray && Array.isArray(val)) {
        const content = document.createElement('div');
        content.className = 'talk-item-content talk-responses';
        val.forEach(v => {
          const r = document.createElement('div');
          r.className = 'talk-response-item';
          if (typeof v === 'object') {
            r.innerHTML = `<strong style="font-size:12px;color:var(--text-2)">${v.objection || ''}</strong><br>${v.response || ''}`;
          } else {
            r.textContent = v;
          }
          content.appendChild(r);
        });
        item.appendChild(content);
        if (typeof val[0] === 'object') {
          plainSection += `${label.toUpperCase()}:\n${val.map(v => `  "${v.objection}"\n  → ${v.response}`).join('\n\n')}\n`;
        }
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

    // Wire section copy
    section.querySelector('.btn-copy-section').addEventListener('click', () => {
      copyToClipboard(plainSection, section.querySelector('.btn-copy-section'), 'Copy Section');
    });
  });

  // Store plain text for copy all
  state.talkTrackPlainText = plainTextParts.join('\n');

  $('talktrack-overlay').removeAttribute('hidden');
}

on($('talktrack-close'), 'click', () => $('talktrack-overlay').setAttribute('hidden', ''));
on($('btn-copy-all-talk'), 'click', () => {
  copyToClipboard(state.talkTrackPlainText || '', $('btn-copy-all-talk'), 'Copy All');
});

// Close modals on overlay click
on($('talktrack-overlay'), 'click', e => { if (e.target === $('talktrack-overlay')) $('talktrack-overlay').setAttribute('hidden', ''); });
on($('creds-overlay'), 'click', e => { if (e.target === $('creds-overlay')) $('creds-overlay').setAttribute('hidden', ''); });

// ESC closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('talktrack-overlay').setAttribute('hidden', '');
    $('creds-overlay').setAttribute('hidden', '');
  }
});

/* ─── Utility: Copy to clipboard ─── */
function copyToClipboard(text, btn, resetLabel) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => btn.textContent = resetLabel || orig, 2000);
  }).catch(() => {
    alert('Copy failed — please copy manually.');
  });
}

/* ─── Init hint ─── */
updateGenerateHint();
