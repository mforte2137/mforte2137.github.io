/* =====================================================
   service-tier-builder.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ── Reference data ─────────────────────────────────
  const SERVICE_LIBRARY = [
    { category: 'Helpdesk & Support', services: [
      '24/7 Helpdesk & Support', 'Business Hours Helpdesk (8am–6pm)', 'Dedicated Account Manager',
      'On-site Support (scheduled)', 'On-site Support (emergency)', 'Remote Support (unlimited)', 'Remote Support (limited hours)'
    ]},
    { category: 'Monitoring & Management', services: [
      'Remote Monitoring & Management (RMM)', 'Patch Management — OS & Applications', 'Asset Inventory & Lifecycle Management',
      'Server Management', 'Network Monitoring & Management', 'Performance Monitoring & Alerting'
    ]},
    { category: 'Security', services: [
      'Endpoint Detection & Response (EDR)', 'Multi-Factor Authentication (MFA) Management', 'Email Security & Anti-Phishing',
      'DNS Filtering', 'Security Awareness Training', 'Dark Web Monitoring', 'Firewall Management',
      'Privileged Access Management (PAM)', 'Vulnerability Scanning', 'Managed Detection & Response (MDR)',
      'SIEM / Log Management', 'Penetration Testing (annual)'
    ]},
    { category: 'Backup & Continuity', services: [
      'Cloud Backup — Workstations', 'Cloud Backup — Servers', 'Offsite / Immutable Backup',
      'Disaster Recovery Planning', 'Business Continuity Testing'
    ]},
    { category: 'Cloud & Productivity', services: [
      'Microsoft 365 Management', 'Azure / Cloud Infrastructure Management', 'Mobile Device Management (MDM/Intune)',
      'Identity & Access Management', 'SharePoint / Teams Administration'
    ]},
    { category: 'Strategic & Compliance', services: [
      'vCIO / Technology Advisory (quarterly)', 'vCIO / Technology Advisory (monthly)', 'IT Roadmap Planning',
      'Quarterly Business Reviews', 'Compliance Support (specify framework)', 'Cyber Insurance Readiness Support', 'Annual Risk Assessment'
    ]}
  ];

  const TIER_PRESETS = {
    metal:   ['Bronze', 'Silver', 'Gold'],
    quality: ['Good', 'Better', 'Best'],
    level:   ['Essential', 'Professional', 'Premium'],
    scale:   ['Starter', 'Growth', 'Business'],
    simple:  ['Basic', 'Standard', 'Advanced'],
    custom:  ['', '', '']
  };

  // ── State ──────────────────────────────────────────
  const state = {
    tierCount: 3,
    tierPreset: 'level',
    tierNames: TIER_PRESETS.level.slice(),
    themeHex: '#2E74DC',
    headerTagline: 'Choose the level of protection that fits your business',
    generatedTiers: null,   // [{name, tagline, recommended, services:[{name, included, description}]}]
    widgetHtml: ''
  };

  // ── DOM refs ───────────────────────────────────────
  const tierPresetEl       = $('tierPreset');
  const tierCountToggle    = $('tierCountToggle');
  const tierNameInputsRow  = $('tierNameInputsRow');
  const headerTaglineEl    = $('headerTagline');
  const serviceLibraryEl   = $('serviceLibrary');
  const customInputs       = document.querySelectorAll('.custom-service-input');
  const generateBtn        = $('generateBtn');
  const clearBtn           = $('clearBtn');
  const formError          = $('formError');

  const emptyState      = $('emptyState');
  const loadingState     = $('loadingState');
  const widgetFrameWrap  = $('widgetFrameWrap');
  const widgetFrame      = $('widgetFrame');
  const colourSwatches   = $('colourSwatches');
  const customHexEl      = $('customHex');
  const regenerateBtn    = $('regenerateBtn');
  const copyBtn          = $('copyBtn');
  const pushBtn          = $('pushBtn');
  const sbCredsPanel     = $('sbCredsPanel');
  const pushFeedback     = $('pushFeedback');

  // ── Init ───────────────────────────────────────────
  function init() {
    renderServiceLibrary();
    renderTierNameInputs();
    bindConfigEvents();
    bindPreviewEvents();
  }

  // ── Service library rendering ──────────────────────
  function renderServiceLibrary() {
    serviceLibraryEl.innerHTML = '';
    SERVICE_LIBRARY.forEach((group, gi) => {
      const wrap = document.createElement('div');
      wrap.className = 'service-group';
      const title = document.createElement('p');
      title.className = 'service-group-title';
      title.textContent = group.category;
      wrap.appendChild(title);

      group.services.forEach((name, si) => {
        const label = document.createElement('label');
        label.className = 'service-check';
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(name)}" id="svc-${gi}-${si}"> <span>${escapeHtml(name)}</span>`;
        wrap.appendChild(label);
      });
      serviceLibraryEl.appendChild(wrap);
    });
  }

  // ── Tier name inputs ────────────────────────────────
  function renderTierNameInputs() {
    tierNameInputsRow.innerHTML = '';
    for (let i = 0; i < state.tierCount; i++) {
      const col = document.createElement('div');
      col.className = 'config-col';
      col.innerHTML = `
        <label class="field-label">Tier ${i + 1} name</label>
        <input type="text" class="field-input tier-name-input" data-idx="${i}" value="${escapeHtml(state.tierNames[i] || '')}" />
      `;
      tierNameInputsRow.appendChild(col);
    }
    tierNameInputsRow.querySelectorAll('.tier-name-input').forEach(inp => {
      inp.addEventListener('input', () => {
        state.tierNames[Number(inp.dataset.idx)] = inp.value;
      });
    });
  }

  // ── Config events ───────────────────────────────────
  function bindConfigEvents() {
    tierPresetEl.addEventListener('change', () => {
      state.tierPreset = tierPresetEl.value;
      const preset = TIER_PRESETS[state.tierPreset];
      state.tierNames = preset.slice(0, state.tierCount);
      renderTierNameInputs();
    });

    tierCountToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tierCountToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tierCount = Number(btn.dataset.val);
        const preset = TIER_PRESETS[state.tierPreset];
        // Keep any custom names already typed where possible, else fall back to preset
        const newNames = [];
        for (let i = 0; i < state.tierCount; i++) {
          newNames.push(state.tierNames[i] || preset[i] || '');
        }
        state.tierNames = newNames;
        renderTierNameInputs();
      });
    });

    headerTaglineEl.addEventListener('input', () => {
      state.headerTagline = headerTaglineEl.value;
    });

    generateBtn.addEventListener('click', generate);
    clearBtn.addEventListener('click', clearAll);
  }

  // ── Collect form data ───────────────────────────────
  function getCheckedServices() {
    const checked = Array.from(serviceLibraryEl.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    const custom = Array.from(customInputs).map(inp => inp.value.trim()).filter(Boolean);
    return checked.concat(custom);
  }

  function validate(services) {
    if (!state.tierNames.slice(0, state.tierCount).every(n => n && n.trim())) {
      return 'Please name every tier before generating.';
    }
    if (services.length === 0) {
      return 'Select at least one service, or add a custom one.';
    }
    return null;
  }

  // ── Generate ─────────────────────────────────────────
  async function generate() {
    hideError();
    const services = getCheckedServices();
    const err = validate(services);
    if (err) { showError(err); return; }

    document.querySelectorAll('.regen-notice').forEach(el => el.remove());

    emptyState.hidden = true;
    widgetFrameWrap.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    widgetFrameWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const res = await fetch('/api/service-tier-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierCount: state.tierCount,
          tierNames: state.tierNames.slice(0, state.tierCount),
          services
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');

      state.generatedTiers = data.tiers;
      renderWidget();

      regenerateBtn.hidden = false;
      copyBtn.hidden = false;
      pushBtn.hidden = false;
    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = false;
      showError('Error: ' + (e.message || 'Something went wrong. Please try again.'));
    } finally {
      generateBtn.disabled = false;
      regenerateBtn.disabled = false;
    }
  }

  function onRegenerate() { generate(); }

  // ── Build widget HTML ────────────────────────────────
  function esc(s) { return escapeHtml(s); }

  function buildWidgetHtml() {
    const tiers = state.generatedTiers;
    const hex = state.themeHex;
    const n = tiers.length;
    const featColPct = n === 2 ? 34 : 28;
    const dataColPct = ((100 - featColPct) / n).toFixed(1);

    // Header — gradient bar
    const headerBar = `
  <div style="width:100%;background:linear-gradient(135deg, ${hex} 0%, ${shade(hex, -18)} 100%);padding:18px 22px;">
    <h5 data-editable-id="header-tagline" style="margin:0;font-family:'Source Sans Pro',Arial,sans-serif;font-size:16px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(state.headerTagline)}</h5>
  </div>`;

    // Tier headers
    const headerCells = tiers.map((t, i) => {
      const isRec = !!t.recommended;
      const bg = isRec ? hex : '#F5F5F2';
      const nameColor = isRec ? '#FFFFFF' : '#0B1220';
      const taglineColor = isRec ? 'rgba(255,255,255,0.85)' : '#586273';
      const badge = isRec
        ? `<div style="display:inline-block;background:rgba(255,255,255,0.22);color:#FFFFFF;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-bottom:6px;">★ Recommended</div><br/>`
        : `<button type="button" class="recommend-btn" data-tier="${i}" style="background:none;border:none;padding:0;margin-bottom:6px;font-family:'Source Sans Pro',Arial,sans-serif;font-size:10px;color:#9CA3AF;cursor:pointer;text-decoration:underline;">☆ Make recommended</button><br/>`;
      return `<th style="width:${dataColPct}%;background:${bg};padding:16px 14px;text-align:center;vertical-align:top;border-left:1px solid #E5E7EB;">
        ${badge}
        <div data-editable-id="tier-${i}-name" style="font-family:'Montserrat',Arial,sans-serif;font-size:14px;font-weight:700;color:${nameColor};letter-spacing:0.02em;text-transform:uppercase;margin-bottom:4px;">${esc(t.name)}</div>
        <div data-editable-id="tier-${i}-tagline" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:400;color:${taglineColor};line-height:1.4;">${esc(t.tagline || '')}</div>
      </th>`;
    }).join('');

    // Category + service rows
    let bodyRows = '';
    SERVICE_LIBRARY.forEach(group => {
      const rowsForGroup = group.services.filter(name => tiers[0].services.some(s => s.name === name));
      if (rowsForGroup.length === 0) return;
      bodyRows += categoryHeaderRow(group.category, n);
      rowsForGroup.forEach(name => { bodyRows += serviceRow(name, tiers, hex, dataColPct); });
    });
    // Custom services (anything not found in the library at all)
    const libraryNames = new Set(SERVICE_LIBRARY.flatMap(g => g.services));
    const customNames = tiers[0].services.map(s => s.name).filter(name => !libraryNames.has(name));
    if (customNames.length) {
      bodyRows += categoryHeaderRow('Custom', n);
      customNames.forEach(name => { bodyRows += serviceRow(name, tiers, hex, dataColPct); });
    }

    // Footer strip
    const footerCells = tiers.map(t => {
      if (t.recommended) {
        return `<td style="background:${hex};color:#FFFFFF;padding:10px 14px;text-align:center;font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:600;border-left:1px solid rgba(255,255,255,0.15);">Most businesses your size choose this option</td>`;
      }
      return `<td style="background:#F5F5F2;padding:10px 14px;border-left:1px solid #E5E7EB;">&nbsp;</td>`;
    }).join('');

    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#FFFFFF;border:1px solid #E5E7EB;width:100%;max-width:100%;overflow:hidden;">
${headerBar}
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="width:${featColPct}%;background:#FFFFFF;padding:16px 14px;"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:10px 14px;">&nbsp;</td>
        ${footerCells}
      </tr>
    </tfoot>
  </table>
</div>`;
  }

  function categoryHeaderRow(label, n) {
    return `<tr><td colspan="${n + 1}" style="background:#FAFAF7;padding:8px 14px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;">${esc(label)}</td></tr>`;
  }

  function serviceRow(name, tiers, hex, dataColPct) {
    const cells = tiers.map((t, i) => {
      const svc = t.services.find(s => s.name === name) || { included: false, description: '' };
      const icon = svc.included
        ? `<span class="cell-toggle" data-tier="${i}" data-service="${escAttr(name)}" style="display:inline-block;color:${hex};font-weight:700;font-size:13px;cursor:pointer;margin-right:6px;">&#10003;</span>`
        : `<span class="cell-toggle" data-tier="${i}" data-service="${escAttr(name)}" style="display:inline-block;color:#D1D5DB;font-weight:700;font-size:13px;cursor:pointer;margin-right:6px;">&#8212;</span>`;
      const desc = svc.included
        ? `<span data-editable-id="svc-${i}-${slug(name)}" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;color:#4B5563;">${esc(svc.description || '')}</span>`
        : '';
      return `<td style="padding:10px 14px;border-top:1px solid #F0F0EE;vertical-align:top;border-left:1px solid #E5E7EB;">${icon}${desc}</td>`;
    }).join('');
    return `<tr>
      <td style="padding:10px 14px;border-top:1px solid #F0F0EE;font-family:'Source Sans Pro',Arial,sans-serif;font-size:13px;color:#0B1220;font-weight:600;vertical-align:top;">${esc(name)}</td>
      ${cells}
    </tr>`;
  }

  // ── Render / re-render ───────────────────────────────
  function renderWidget() {
    loadingState.hidden = true;
    state.widgetHtml = buildWidgetHtml();
    widgetFrame.innerHTML = state.widgetHtml;
    wireWidgetInteractions();
    widgetFrameWrap.hidden = false;
  }

  function rerenderWidget() {
    state.widgetHtml = buildWidgetHtml();
    widgetFrame.innerHTML = state.widgetHtml;
    wireWidgetInteractions();
  }

  function wireWidgetInteractions() {
    // Text edits — update in-memory state, do not force a full rebuild (preserves cursor)
    widgetFrame.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = 'Click to edit';
      el.addEventListener('input', () => {
        const id = el.getAttribute('data-editable-id');
        if (id === 'header-tagline') { state.headerTagline = el.textContent; return; }
        let m = id.match(/^tier-(\d+)-name$/);
        if (m) { state.generatedTiers[Number(m[1])].name = el.textContent; return; }
        m = id.match(/^tier-(\d+)-tagline$/);
        if (m) { state.generatedTiers[Number(m[1])].tagline = el.textContent; return; }
        m = id.match(/^svc-(\d+)-(.+)$/);
        if (m) {
          const tierIdx = Number(m[1]);
          const svcSlug = m[2];
          const svc = state.generatedTiers[tierIdx].services.find(s => slug(s.name) === svcSlug);
          if (svc) svc.description = el.textContent;
        }
        state.widgetHtml = getWidgetHtmlFromFrame();
      });
    });

    // Cell toggle (included / excluded) — structural change, full rebuild
    widgetFrame.querySelectorAll('.cell-toggle').forEach(el => {
      el.addEventListener('click', () => {
        const tierIdx = Number(el.dataset.tier);
        const name = el.dataset.service;
        const svc = state.generatedTiers[tierIdx].services.find(s => s.name === name);
        if (svc) svc.included = !svc.included;
        rerenderWidget();
      });
    });

    // Recommended tier change — structural change, full rebuild, instant, no AI call
    widgetFrame.querySelectorAll('.recommend-btn').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.tier);
        state.generatedTiers.forEach((t, i) => { t.recommended = (i === idx); });
        rerenderWidget();
      });
    });
  }

  function getWidgetHtmlFromFrame() {
    const clone = widgetFrame.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    clone.querySelectorAll('.recommend-btn').forEach(el => el.remove());
    return clone.innerHTML;
  }

  // ── Colour theme — real-time, no regeneration ────────
  function bindPreviewEvents() {
    colourSwatches.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        state.themeHex = sw.dataset.hex;
        customHexEl.value = '';
        if (state.generatedTiers) rerenderWidget();
      });
    });

    customHexEl.addEventListener('input', () => {
      const val = customHexEl.value.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(val)) {
        state.themeHex = '#' + val;
        colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        if (state.generatedTiers) rerenderWidget();
      }
    });

    regenerateBtn.addEventListener('click', onRegenerate);
    copyBtn.addEventListener('click', onCopy);
    pushBtn.addEventListener('click', onPushClick);

    $('saveCredsBtn').addEventListener('click', onSaveCredsAndPush);
    $('cancelCredsBtn').addEventListener('click', () => { sbCredsPanel.hidden = true; });

    (function prefillCreds() {
      const apiKey = localStorage.getItem('sb_api_key');
      const tenantUrl = localStorage.getItem('sb_tenant_url');
      if (apiKey) $('sbApiKey').value = apiKey;
      if (tenantUrl) $('sbTenantUrl').value = tenantUrl;
    })();
  }

  function onCopy() {
    const html = getWidgetHtmlFromFrame();
    navigator.clipboard.writeText(html).then(() => {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy HTML'; }, 2000);
    }).catch(() => alert('Could not copy to clipboard. Try again.'));
  }

  function getWidgetTitle() {
    const primary = state.generatedTiers?.find(t => t.recommended) ? '' : '';
    return 'Service Tiers — ' + state.tierNames.slice(0, state.tierCount).join(' / ');
  }

  function onPushClick() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      sbCredsPanel.hidden = false;
      sbCredsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    doPush(apiKey, tenantUrl);
  }

  function onSaveCredsAndPush() {
    const apiKey = $('sbApiKey').value.trim();
    const tenantUrl = $('sbTenantUrl').value.trim();
    if (!apiKey || !tenantUrl) { alert('Please enter both your API key and tenant URL.'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    sbCredsPanel.hidden = true;
    doPush(apiKey, tenantUrl);
  }

  async function doPush(apiKey, tenantUrl) {
    pushFeedback.hidden = true;
    pushFeedback.className = 'push-feedback';
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing…';

    const html = getWidgetHtmlFromFrame();
    const title = getWidgetTitle();

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: [{ type: 'html', content: html, title }],
          prefix: title,
          apiKey,
          tenantUrl
        })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showFeedback('success', '✓ Widget pushed to Salesbuildr successfully.');
      } else {
        showFeedback('error', 'Push failed: ' + (data.error || 'Unknown error. Check your credentials.'));
      }
    } catch (e) {
      showFeedback('error', 'Push failed: ' + (e.message || 'Network error.'));
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push to Salesbuildr';
    }
  }

  function showFeedback(type, msg) {
    pushFeedback.hidden = false;
    pushFeedback.className = 'push-feedback ' + type;
    pushFeedback.textContent = msg;
    pushFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Clear / start over ────────────────────────────────
  function clearAll() {
    serviceLibraryEl.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    customInputs.forEach(inp => { inp.value = ''; });
    tierPresetEl.value = 'level';
    state.tierPreset = 'level';
    state.tierCount = 3;
    tierCountToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === '3'));
    state.tierNames = TIER_PRESETS.level.slice();
    renderTierNameInputs();
    state.headerTagline = 'Choose the level of protection that fits your business';
    headerTaglineEl.value = state.headerTagline;

    state.generatedTiers = null;
    state.widgetHtml = '';
    widgetFrame.innerHTML = '';
    widgetFrameWrap.hidden = true;
    emptyState.hidden = false;
    regenerateBtn.hidden = true;
    copyBtn.hidden = true;
    pushBtn.hidden = true;
    pushFeedback.hidden = true;
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Helpers ────────────────────────────────────────────
  function showError(msg) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError()    { formError.hidden = true; }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(str) { return escapeHtml(str).replace(/'/g, '&#39;'); }
  function slug(str) { return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

  function shade(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    let r = (num >> 16) + amt;
    let g = (num >> 8 & 0x00FF) + amt;
    let b = (num & 0x0000FF) + amt;
    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  init();
})();
