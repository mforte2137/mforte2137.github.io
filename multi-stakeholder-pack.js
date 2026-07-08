/* =====================================================
   multi-stakeholder-pack.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────
  const STAKEHOLDER_DEFS = [
    { key: 'ceo',   label: 'Business Owner',  fullLabel: 'CEO / Business Owner', kicker: 'For the Business Owner' },
    { key: 'cfo',   label: 'Finance',         fullLabel: 'CFO / Finance',        kicker: 'For Finance' },
    { key: 'itops', label: 'IT & Operations', fullLabel: 'IT & Operations',      kicker: 'For IT & Operations' }
  ];

  const SERVICE_GROUPS = [
    { group: 'Support & Management', services: [
      '24/7 Helpdesk & Support', 'Remote Monitoring & Management', 'Patch Management', 'Asset Management'
    ]},
    { group: 'Security', services: [
      'Endpoint Detection & Response (EDR)', 'Multi-Factor Authentication (MFA)',
      'Email Security & Anti-Phishing', 'Security Awareness Training', 'Backup & Disaster Recovery'
    ]},
    { group: 'Cloud & Productivity', services: [
      'Microsoft 365 Management', 'Cloud Infrastructure Management', 'Mobile Device Management'
    ]},
    { group: 'Network', services: [
      'Network Monitoring & Management', 'Firewall Management'
    ]},
    { group: 'Strategic', services: [
      'vCIO / Technology Advisory', 'Compliance Support'
    ]}
  ];

  // ── State ──────────────────────────────────────────
  let currentTheme      = '#0f1f3d';
  let currentClientType = 'prospect';
  let selectedServices  = new Set();
  let generatedVersions = {};      // { ceo: {headline, body}, cfo: {...}, itops: {...} }
  let widgetsHtml       = {};      // key -> rendered HTML
  let lastPayload       = null;

  // ── DOM refs ───────────────────────────────────────
  const $ = id => document.getElementById(id);

  const clientTypeToggle   = $('clientTypeToggle');
  const clientNameEl       = $('clientName');
  const mspNameEl          = $('mspName');
  const industryEl         = $('industry');
  const companySizeEl      = $('companySize');
  const serviceGroupsEl    = $('serviceGroups');
  const customEngagementEl = $('customEngagement');
  const customEngagementCount = $('customEngagementCount');
  const stakeholderCardsEl = $('stakeholderCards');
  const colourSwatchesEl   = $('colourSwatches');
  const customHexEl        = $('customHex');

  const formError    = $('formError');
  const generateBtn  = $('generateBtn');

  const emptyState   = $('emptyState');
  const loadingState = $('loadingState');
  const outputArea   = $('outputArea');
  const outputTitle  = $('outputTitle');
  const widgetPanels = $('widgetPanels');
  const regenerateAllBtn = $('regenerateAllBtn');

  const combineToggle = $('combineToggle');
  const pushBtn       = $('pushBtn');
  const copyAllBtn    = $('copyAllBtn');
  const credsInline   = $('credsInline');
  const pushApiKey    = $('pushApiKey');
  const pushTenantUrl = $('pushTenantUrl');
  const saveAndPushBtn = $('saveAndPushBtn');
  const pushStatus    = $('pushStatus');

  // ── Init ───────────────────────────────────────────
  function init() {
    buildServiceGroups();

    clientTypeToggle.querySelectorAll('.ct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clientTypeToggle.querySelectorAll('.ct-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClientType = btn.dataset.val;
      });
    });

    customEngagementEl.addEventListener('input', () => {
      customEngagementCount.textContent = customEngagementEl.value.length;
    });

    stakeholderCardsEl.querySelectorAll('.stakeholder-toggle').forEach(cb => {
      cb.addEventListener('change', () => {
        const card = cb.closest('.stakeholder-card');
        card.classList.toggle('active', cb.checked);
        card.querySelector('.stakeholder-context').hidden = !cb.checked;
      });
    });

    colourSwatchesEl.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        colourSwatchesEl.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        currentTheme = sw.dataset.hex;
        customHexEl.value = '';
        if (Object.keys(generatedVersions).length) refreshAllPreviews();
      });
    });

    customHexEl.addEventListener('input', () => {
      const val = customHexEl.value.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(val)) {
        currentTheme = '#' + val;
        colourSwatchesEl.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        if (Object.keys(generatedVersions).length) refreshAllPreviews();
      }
    });

    generateBtn.addEventListener('click', () => onGenerate());
    regenerateAllBtn.addEventListener('click', () => onGenerate());

    combineToggle.addEventListener('change', () => {
      pushBtn.textContent = combineToggle.checked ? 'Push Combined Pack' : 'Push to Salesbuildr';
      copyAllBtn.textContent = combineToggle.checked ? 'Copy HTML (Combined)' : 'Copy HTML';
    });

    pushBtn.addEventListener('click', onPushClick);
    saveAndPushBtn.addEventListener('click', onSaveAndPush);
    copyAllBtn.addEventListener('click', onCopyAll);

    // Pre-fill Salesbuildr creds
    const storedKey = localStorage.getItem('sb_api_key');
    const storedUrl = localStorage.getItem('sb_tenant_url');
    if (storedKey) pushApiKey.value = storedKey;
    if (storedUrl) pushTenantUrl.value = storedUrl;
  }

  // ── Service checkboxes ───────────────────────────────
  function buildServiceGroups() {
    SERVICE_GROUPS.forEach(g => {
      const wrap = document.createElement('div');
      const label = document.createElement('div');
      label.className = 'service-group-label';
      label.textContent = g.group;
      wrap.appendChild(label);

      const row = document.createElement('div');
      row.className = 'service-chip-row';
      g.services.forEach(svc => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'service-chip';
        chip.textContent = svc;
        chip.addEventListener('click', () => {
          chip.classList.toggle('active');
          if (chip.classList.contains('active')) selectedServices.add(svc);
          else selectedServices.delete(svc);
        });
        row.appendChild(chip);
      });
      wrap.appendChild(row);
      serviceGroupsEl.appendChild(wrap);
    });
  }

  function getActiveStakeholders() {
    return [...stakeholderCardsEl.querySelectorAll('.stakeholder-toggle')]
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.key);
  }

  // ── Build payload ────────────────────────────────────
  function buildPayload() {
    const activeStakeholders = getActiveStakeholders();
    const context = {};
    activeStakeholders.forEach(key => {
      const el = $(`ctx-${key}`);
      if (el && el.value.trim()) context[key] = el.value.trim();
    });

    return {
      clientType: currentClientType,
      clientName: clientNameEl.value.trim(),
      industry: industryEl.value,
      companySize: companySizeEl.value,
      mspName: mspNameEl.value.trim(),
      services: [...selectedServices],
      customEngagement: customEngagementEl.value.trim(),
      activeStakeholders,
      context
    };
  }

  function validate(payload) {
    if (!payload.clientName) return 'Enter a client name before generating.';
    if (!payload.industry) return 'Select an industry.';
    if (!payload.activeStakeholders.length) return 'Turn on at least one stakeholder.';
    return null;
  }

  // ── Generate ─────────────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();
    const err = validate(payload);
    if (err) { showError(err); return; }

    lastPayload = payload;

    emptyState.hidden = true;
    outputArea.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateAllBtn.disabled = true;

    try {
      const res = await fetch('/api/multi-stakeholder-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');

      generatedVersions = data.versions;
      renderAllWidgets(payload);

    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = false;
      showError('Something went wrong: ' + e.message);
    } finally {
      generateBtn.disabled = false;
      regenerateAllBtn.disabled = false;
    }
  }

  async function onRegenerateOne(key) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-key="${key}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    // Refresh context field for this stakeholder in case it changed
    const ctxEl = $(`ctx-${key}`);
    const payload = { ...lastPayload, regenKey: key };
    if (ctxEl) payload.context = { ...lastPayload.context, [key]: ctxEl.value.trim() };

    try {
      const res = await fetch('/api/multi-stakeholder-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Regeneration failed.');

      generatedVersions[key] = data.versions[key];
      const def = STAKEHOLDER_DEFS.find(d => d.key === key);
      widgetsHtml[key] = buildWidgetHtml(key, generatedVersions[key], lastPayload);
      const panel = document.getElementById('panel-' + key);
      if (panel) panel.replaceWith(buildWidgetPanel(def, generatedVersions[key]));

    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Regenerate'; }
    }
  }

  // ── Render widgets ───────────────────────────────────
  function renderAllWidgets(payload) {
    loadingState.hidden = true;
    outputArea.hidden = false;
    outputTitle.textContent = (payload.clientName || 'Client') + ' — Stakeholder Proposals';

    widgetPanels.innerHTML = '';
    STAKEHOLDER_DEFS.forEach(def => {
      if (!generatedVersions[def.key]) return;
      widgetsHtml[def.key] = buildWidgetHtml(def.key, generatedVersions[def.key], payload);
      widgetPanels.appendChild(buildWidgetPanel(def, generatedVersions[def.key]));
    });
  }

  function refreshAllPreviews() {
    STAKEHOLDER_DEFS.forEach(def => {
      if (!generatedVersions[def.key]) return;
      widgetsHtml[def.key] = buildWidgetHtml(def.key, generatedVersions[def.key], lastPayload);
      const preview = document.getElementById('preview-' + def.key);
      if (preview) {
        preview.innerHTML = widgetsHtml[def.key];
        makeEditable(preview, def.key);
      }
    });
  }

  function buildWidgetPanel(def, versionData) {
    const panel = document.createElement('div');
    panel.className = 'widget-panel';
    panel.id = 'panel-' + def.key;

    const header = document.createElement('div');
    header.className = 'widget-panel-header';
    header.innerHTML = `
      <span class="widget-panel-name">${escHtml(def.fullLabel)}</span>
      <div class="widget-panel-actions">
        <button class="widget-html-toggle" data-key="${def.key}">Show HTML</button>
        <button class="widget-copy" data-key="${def.key}">Copy HTML</button>
        <button class="widget-regen" data-key="${def.key}">Regenerate</button>
      </div>`;
    panel.appendChild(header);

    const previewWrap = document.createElement('div');
    previewWrap.className = 'widget-preview-wrap';
    const preview = document.createElement('div');
    preview.className = 'widget-preview';
    preview.id = 'preview-' + def.key;
    preview.innerHTML = widgetsHtml[def.key];
    previewWrap.appendChild(preview);
    panel.appendChild(previewWrap);

    const htmlEditor = document.createElement('textarea');
    htmlEditor.className = 'widget-html-editor';
    htmlEditor.id = 'html-' + def.key;
    htmlEditor.value = widgetsHtml[def.key];
    panel.appendChild(htmlEditor);

    // Wire up actions
    panel.querySelector('.widget-regen').addEventListener('click', () => onRegenerateOne(def.key));
    panel.querySelector('.widget-copy').addEventListener('click', (e) => {
      const html = getWidgetHtmlFromDom(def.key);
      navigator.clipboard.writeText(html).then(() => {
        const b = e.currentTarget;
        b.textContent = 'Copied ✓';
        setTimeout(() => b.textContent = 'Copy HTML', 2000);
      });
    });
    panel.querySelector('.widget-html-toggle').addEventListener('click', (e) => {
      const shown = htmlEditor.style.display === 'block';
      htmlEditor.style.display = shown ? 'none' : 'block';
      if (!shown) htmlEditor.value = getWidgetHtmlFromDom(def.key);
      e.currentTarget.textContent = shown ? 'Show HTML' : 'Hide HTML';
    });
    htmlEditor.addEventListener('input', () => {
      widgetsHtml[def.key] = htmlEditor.value;
      preview.innerHTML = htmlEditor.value;
      makeEditable(preview, def.key);
    });

    makeEditable(preview, def.key);
    return panel;
  }

  // ── Make preview sections editable in place ─────────
  function makeEditable(frame, key) {
    frame.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = 'Click to edit';
      el.addEventListener('input', () => {
        widgetsHtml[key] = getWidgetHtmlFromDom(key);
        const htmlEditor = $('html-' + key);
        if (htmlEditor) htmlEditor.value = widgetsHtml[key];
      });
    });
  }

  function getWidgetHtmlFromDom(key) {
    const preview = document.getElementById('preview-' + key);
    if (!preview) return widgetsHtml[key] || '';
    const clone = preview.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    return clone.innerHTML;
  }

  // ── Widget HTML builders (TinyMCE-safe: inline styles, h5/h6, tables) ──
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function gradientHeader(hex, kicker, headline, subline) {
    return `<div style="background:linear-gradient(135deg,#0f172a 0%,${esc(hex)} 100%);background-image:linear-gradient(135deg,#0f172a 0%,${esc(hex)} 100%),radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px);background-size:100% 100%,14px 14px;padding:16px 20px 14px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:6px;">${esc(kicker)}</div>
    <h5 data-editable-id="headline" style="margin:0;font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">${esc(headline)}</h5>
    ${subline ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;">${esc(subline)}</div>` : ''}
  </div>`;
  }

  function footerStrip(mspName) {
    return `<div style="background:#f4f7fb;border-top:1px solid #e3e7ee;padding:8px 16px;">
    <span style="font-size:11px;color:#9ca3af;">Prepared by ${esc(mspName || 'your MSP')}</span>
  </div>`;
  }

  function bodyParagraphs(body) {
    return (body || '').split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-size:13px;color:#586273;line-height:1.65;">${esc(l.trim())}</p>`
    ).join('');
  }

  function buildWidgetHtml(key, data, payload) {
    if (key === 'cfo') return buildCfoWidget(data, currentTheme, payload);
    if (key === 'itops') return buildItopsWidget(data, currentTheme, payload);
    return buildCeoWidget(data, currentTheme, payload);
  }

  function buildCeoWidget(data, hex, payload) {
    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${esc(hex)};overflow:hidden;">
  ${gradientHeader(hex, 'For the Business Owner', data.headline || 'Your IT. Your Risk. Your Partnership.')}
  <div style="padding:16px 20px;" data-editable-id="body">${bodyParagraphs(data.body)}</div>
  ${footerStrip(payload && payload.mspName)}
</div>`;
  }

  function buildItopsWidget(data, hex, payload) {
    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${esc(hex)};overflow:hidden;">
  ${gradientHeader(hex, 'For IT & Operations', data.headline || 'How We Work — What to Expect From Day One')}
  <div style="padding:16px 20px;" data-editable-id="body">${bodyParagraphs(data.body)}</div>
  ${footerStrip(payload && payload.mspName)}
</div>`;
  }

  function buildCfoWidget(data, hex, payload) {
    const table = data.comparisonTable || {};
    const headers = table.headers && table.headers.length === 4
      ? table.headers
      : ['', 'Managed IT', 'In-House IT', 'Break-Fix'];
    const rows = (table.rows || []).map((row, idx) => {
      const bg = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      const cells = row.map((cell, ci) => {
        const weight = ci === 0 ? 'font-weight:700;color:#0b1220;' : 'color:#586273;';
        return `<td style="${bg}padding:8px 8px;border-bottom:1px solid #e3e7ee;${ci < 3 ? 'border-right:1px solid #e3e7ee;' : ''}font-size:11px;${weight}vertical-align:top;">${esc(cell)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const headerCells = headers.map((h, i) =>
      `<th style="padding:8px 8px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;${i < 3 ? 'border-right:1px solid rgba(255,255,255,0.2);' : ''}">${esc(h)}</th>`
    ).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${esc(hex)};overflow:hidden;">
  ${gradientHeader(hex, 'For Finance', data.headline || 'The Real Cost of IT — and What You\'re Actually Comparing')}
  <div style="padding:16px 20px 4px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e7ee;border-collapse:collapse;">
      <tr style="background:${esc(hex)};">${headerCells}</tr>
      ${rows}
    </table>
  </div>
  <div style="padding:14px 20px 16px;" data-editable-id="body">${bodyParagraphs(data.body)}</div>
  ${footerStrip(payload && payload.mspName)}
</div>`;
  }

  // ── Delivery ─────────────────────────────────────────
  function widgetTitle(clientName, def) {
    return `${clientName} — Proposal — ${def.label}`;
  }

  function buildCombinedHtml(clientName) {
    const sections = STAKEHOLDER_DEFS
      .filter(def => generatedVersions[def.key])
      .map(def => {
        const html = getWidgetHtmlFromDom(def.key);
        return `<div style="margin-bottom:18px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 6px;padding-left:2px;">${esc(def.kicker)}</div>
    ${html}
  </div>`;
      }).join('\n');
    return `<div style="width:100%;">${sections}</div>`;
  }

  function onCopyAll() {
    if (!Object.keys(generatedVersions).length) return;
    const clientName = lastPayload?.clientName || 'Client';
    const html = combineToggle.checked
      ? buildCombinedHtml(clientName)
      : STAKEHOLDER_DEFS.filter(d => generatedVersions[d.key]).map(d => getWidgetHtmlFromDom(d.key)).join('\n\n');
    navigator.clipboard.writeText(html).then(() => {
      const orig = copyAllBtn.textContent;
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = orig.includes('Combined') ? 'Copy HTML (Combined)' : 'Copy HTML', 2000);
    });
  }

  function onPushClick() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    executePush(apiKey, tenantUrl);
  }

  function onSaveAndPush() {
    const apiKey = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { showPushStatus('Enter both API key and tenant URL.', 'err'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    executePush(apiKey, tenantUrl);
  }

  async function executePush(apiKey, tenantUrl) {
    const clientName = lastPayload?.clientName || 'Client';
    let body;

    if (combineToggle.checked) {
      body = {
        widgets: [{ title: 'Full Pack', html: buildCombinedHtml(clientName) }],
        prefix: `${clientName} — Proposal`,
        apiKey, tenantUrl
      };
    } else {
      const widgets = STAKEHOLDER_DEFS
        .filter(def => generatedVersions[def.key])
        .map(def => ({ title: def.label, html: getWidgetHtmlFromDom(def.key) }));
      body = { widgets, prefix: `${clientName} — Proposal`, apiKey, tenantUrl };
    }

    const origLabel = pushBtn.textContent;
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing…';

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`✓ Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error. Check your credentials.'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + e.message, 'err');
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = origLabel;
    }
  }

  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status ' + type;
    pushStatus.hidden = false;
  }

  // ── UI helpers ─────────────────────────────────────
  function showError(msg) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError() { formError.hidden = true; }
  function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  init();
})();
