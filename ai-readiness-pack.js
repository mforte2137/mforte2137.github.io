/* =====================================================
   ai-readiness-pack.js — Frontend logic
   Single-sitting tool — no cross-device session persistence
   ===================================================== */
(function () {
  'use strict';

  const LS_API_KEY    = 'sb_api_key';
  const LS_TENANT_URL = 'sb_tenant_url';

  // Widget hex palette (per AI Readiness Pack spec)
  const HEX = {
    accent: '#2e74dc', accentDark: '#1e5bb8', gradientStart: '#1a3a6e',
    text: '#0b1220', text2: '#586273', muted: '#9ca3af',
    bg: '#fbfcfe', panel: '#ffffff', row: '#f4f7fb', border: '#e3e7ee',
    successBg: '#dcfce7', successText: '#15a05a',
    warnBg: '#fef3c7', warnText: '#b3760a'
  };

  const SECTIONS = [
    { key: 'whyMatters', label: 'Why AI Readiness Matters Before Copilot', widgetName: 'Why It Matters', hint: 'Creates urgency — positions readiness as essential, not optional.', defaultOn: true },
    { key: 'whatCovers', label: 'What Our AI Readiness Service Covers', widgetName: "What's Included", hint: 'The three pillars: Identity & Access, Data Governance, Security Baseline.', defaultOn: true },
    { key: 'whatYouGet', label: 'What You Get at the End', widgetName: 'What You Get', hint: 'Deliverables — report, remediation plan, go/no-go, roadmap.', defaultOn: true },
    { key: 'withoutIt', label: 'What Happens Without It', widgetName: 'What Happens Without It', hint: 'The cost of skipping — calm and factual, not a threat.', defaultOn: true },
    { key: 'nextStep', label: 'Your Next Step', widgetName: 'Next Steps', hint: 'Clear call to action for starting the engagement.', defaultOn: false },
  ];
  const TIER_KEY = 'tierMatrix';

  // ── State ──────────────────────────────────────────
  let currentThemeHex = '#0f1f3d';
  let activeSections  = new Set(SECTIONS.filter(s => s.defaultOn).map(s => s.key));
  let includeTierMatrix = false;
  let widgets   = {};   // key -> html string
  let lastPayload = null;

  const $ = id => document.getElementById(id);

  const generateBtn      = $('generateBtn');
  const regenerateAllBtn = $('regenerateAllBtn');
  const formError        = $('formError');
  const emptyState       = $('emptyState');
  const loadingState     = $('loadingState');
  const outputArea       = $('outputArea');
  const widgetList       = $('widgetList');
  const deliveryTitle    = $('deliveryTitle');
  const copyAllBtn       = $('copyAllBtn');
  const pushIndividualBtn= $('pushIndividualBtn');
  const pushPackBtn      = $('pushPackBtn');
  const credsInline      = $('credsInline');
  const pushApiKey       = $('pushApiKey');
  const pushTenantUrl    = $('pushTenantUrl');
  const saveAndPushBtn   = $('saveAndPushBtn');
  const pushStatus       = $('pushStatus');
  const includeTierMatrixEl = $('includeTierMatrix');

  // ── Init ───────────────────────────────────────────
  function init() {
    renderSectionToggles();
    bindColourSwatches();
    bindEvents();
    prefillCreds();
  }

  // ── Section toggle cards ─────────────────────────────
  function renderSectionToggles() {
    const grid = $('sectionToggleGrid');
    grid.innerHTML = '';
    SECTIONS.forEach(sec => {
      const card = document.createElement('label');
      card.className = 'section-toggle-card' + (activeSections.has(sec.key) ? ' active' : '');
      card.dataset.key = sec.key;
      card.innerHTML = `
        <input type="checkbox" ${activeSections.has(sec.key) ? 'checked' : ''} />
        <span class="section-toggle-check"></span>
        <span class="section-toggle-text">
          <strong>${escHtml(sec.label)}</strong>
          <small>${escHtml(sec.hint)}</small>
        </span>`;
      card.addEventListener('click', (e) => {
        e.preventDefault();
        if (activeSections.has(sec.key)) activeSections.delete(sec.key);
        else activeSections.add(sec.key);
        card.classList.toggle('active');
        card.querySelector('input').checked = activeSections.has(sec.key);
      });
      grid.appendChild(card);
    });
  }

  includeTierMatrixEl.addEventListener('change', () => {
    includeTierMatrix = includeTierMatrixEl.checked;
  });

  // ── Colour theme ─────────────────────────────────────
  function bindColourSwatches() {
    document.querySelectorAll('.swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        currentThemeHex = swatch.dataset.hex;
        $('customHex').value = currentThemeHex.replace('#', '');
        $('hexPreview').style.background = currentThemeHex;
        if (Object.keys(widgets).length) rebuildAllFromTheme();
      });
    });

    $('customHex').addEventListener('input', () => {
      const val = $('customHex').value.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(val)) {
        currentThemeHex = '#' + val;
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        $('hexPreview').style.background = currentThemeHex;
        if (Object.keys(widgets).length) rebuildAllFromTheme();
      }
    });
  }

  // ── Events ───────────────────────────────────────────
  function bindEvents() {
    generateBtn.addEventListener('click', generate);
    regenerateAllBtn.addEventListener('click', generate);
    copyAllBtn.addEventListener('click', onCopyAll);
    pushIndividualBtn.addEventListener('click', () => onPush('individual'));
    pushPackBtn.addEventListener('click', () => onPush('pack'));
    saveAndPushBtn.addEventListener('click', onSaveAndPush);
  }

  // ── Form ─────────────────────────────────────────────
  function getFormData() {
    return {
      clientName: $('clientName').value.trim(),
      industry:   $('industry').value,
      companySize:$('companySize').value,
      copilotSku: $('copilotSku').value,
      mspName:    $('mspName').value.trim(),
    };
  }

  function validateForm(data) {
    if (!data.clientName)  return 'Please enter the client name.';
    if (!data.industry)    return 'Please select an industry.';
    if (!data.companySize) return 'Please select a company size.';
    if (!data.copilotSku)  return 'Please select the Copilot SKU being considered.';
    if (!data.mspName)     return 'Please enter your MSP name.';
    if (activeSections.size === 0) return 'Please activate at least one section.';
    return null;
  }

  function showError(msg) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError() { formError.hidden = true; }

  // ── Generate ─────────────────────────────────────────
  async function generate() {
    const data = getFormData();
    const err = validateForm(data);
    if (err) { showError(err); return; }
    hideError();

    emptyState.hidden = true;
    outputArea.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateAllBtn.disabled = true;

    const payload = {
      clientName: data.clientName,
      industry: data.industry,
      companySize: data.companySize,
      copilotSku: data.copilotSku,
      mspName: data.mspName,
      activeSections: [...activeSections],
      includeTierMatrix
    };
    lastPayload = payload;

    try {
      const res = await fetch('/api/ai-readiness-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Generation failed.');

      widgets = {};
      SECTIONS.forEach(sec => {
        if (activeSections.has(sec.key) && json.data[sec.key]) {
          widgets[sec.key] = buildSectionWidget(sec.key, json.data[sec.key], currentThemeHex, data);
        }
      });
      if (includeTierMatrix && json.data[TIER_KEY]) {
        widgets[TIER_KEY] = buildTierMatrixWidget(json.data[TIER_KEY], currentThemeHex, data);
      }

      renderWidgetList(data);
      deliveryTitle.textContent = `${data.clientName} — AI Readiness Proposal`;
      loadingState.hidden = true;
      outputArea.hidden = false;

    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = Object.keys(widgets).length > 0;
      outputArea.hidden = Object.keys(widgets).length === 0;
      showError('Error: ' + (e.message || 'Something went wrong. Please try again.'));
    } finally {
      generateBtn.disabled = false;
      regenerateAllBtn.disabled = false;
    }
  }

  // ── Regenerate single section ────────────────────────
  async function regenSection(key) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-key="${key}"]`);
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    try {
      const res = await fetch('/api/ai-readiness-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenSection: key })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Regeneration failed.');

      const data = getFormData();
      if (key === TIER_KEY) {
        widgets[key] = buildTierMatrixWidget(json.data[key], currentThemeHex, data);
      } else {
        widgets[key] = buildSectionWidget(key, json.data[key], currentThemeHex, data);
      }
      updateWidgetCard(key);
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '↺ Regenerate'; }
    }
  }

  function rebuildAllFromTheme() {
    // Re-render existing widgets under the new theme colour without calling the AI again.
    // Requires the last raw AI data — simplest safe approach is a full regenerate call is NOT needed;
    // instead we keep the widgets as-is since colour is baked into HTML at build time.
    // To support live recolour we rebuild from the DOM text content is unreliable, so we just
    // note that changing colour after generation requires Regenerate All.
    document.querySelectorAll('.regen-notice').forEach(n => n.remove());
    const notice = document.createElement('div');
    notice.className = 'regen-notice';
    notice.style.cssText = 'background:#fef3c7;color:#b3760a;padding:8px 12px;border-radius:6px;font-size:12px;margin-bottom:12px;';
    notice.textContent = 'Colour theme changed — click "Regenerate All" to apply it to your widgets.';
    widgetList.parentNode.insertBefore(notice, widgetList);
  }

  // ── Widget HTML builders ──────────────────────────────
  function sectionLabel(text, hex) {
    return `<div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${hex};margin-bottom:6px;">${escHtml(text)}</div>`;
  }

  // Darken a hex colour by mixing it toward black, so the gradient anchor
  // always relates to the chosen theme colour instead of a fixed navy.
  function darken(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.round(r * (1 - amount)), dg = Math.round(g * (1 - amount)), db = Math.round(b * (1 - amount));
    return '#' + [dr, dg, db].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function widgetShell(kicker, title, subtitle, bodyHtml, hex) {
    const gradientStart = darken(hex, 0.55);
    return `<div style="background:${HEX.panel};border:1px solid ${HEX.border};border-top:3px solid ${hex};overflow:hidden;font-family:Arial,Helvetica,sans-serif;width:100%;">
  <div style="background:linear-gradient(135deg, ${gradientStart} 0%, ${hex} 100%);background-image:linear-gradient(135deg, ${gradientStart} 0%, ${hex} 100%), radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);background-size:auto, 14px 14px;padding:16px 18px 14px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:4px;">${escHtml(kicker)}</div>
    <h5 style="margin:0;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${escHtml(title)}</h5>
    ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;">${escHtml(subtitle)}</div>` : ''}
  </div>
  <div style="padding:16px 18px;">
    ${bodyHtml}
  </div>
</div>`;
  }

  function buildSectionWidget(key, d, hex, form) {
    if (key === 'whyMatters') {
      return widgetShell(
        'AI Readiness — Why It Matters',
        d.headline || 'Before Your Team Uses AI, Your Environment Needs to Be Ready',
        form.clientName,
        `<p style="margin:0;font-size:13px;color:${HEX.text2};line-height:1.65;">${escHtml(d.body || '')}</p>`,
        hex
      );
    }

    if (key === 'whatCovers') {
      const pillars = (d.pillars || []).slice(0, 3);
      const cells = pillars.map(p => `
        <td width="${Math.floor(100 / Math.max(pillars.length,1))}%" style="padding:12px 10px;border-right:1px solid ${HEX.border};vertical-align:top;">
          ${sectionLabel(p.name || '', hex)}
          <p style="margin:0;font-size:12px;color:${HEX.text2};line-height:1.55;">${escHtml(p.description || '')}</p>
        </td>`).join('');
      return widgetShell(
        'AI Readiness Service',
        d.headline || 'What Our AI Readiness Service Includes',
        form.clientName,
        `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${HEX.border};"><tr>${cells}</tr></table>`,
        hex
      );
    }

    if (key === 'whatYouGet') {
      const pills = (d.deliverables || []).map(item =>
        `<span style="display:inline-block;background:${HEX.successBg};color:${HEX.successText};font-size:10px;font-weight:700;padding:4px 11px;border-radius:20px;margin:0 6px 6px 0;">✓ ${escHtml(item)}</span>`
      ).join('');
      const handoff = d.handoff
        ? `<div style="margin-top:12px;padding:10px 12px;background:${HEX.row};border-left:3px solid ${hex};border-radius:4px;">
             <p style="margin:0;font-size:12px;color:${HEX.text};font-style:italic;line-height:1.55;">${escHtml(d.handoff)}</p>
           </div>` : '';
      return widgetShell(
        'AI Readiness — Deliverables',
        d.headline || 'What You Receive at the End',
        form.clientName,
        `<div>${pills}</div>${handoff}`,
        hex
      );
    }

    if (key === 'withoutIt') {
      const rows = (d.risks || []).map(r =>
        `<div style="padding:8px 0;border-bottom:1px solid ${HEX.border};display:flex;gap:8px;align-items:flex-start;">
           <span style="flex:none;display:inline-block;width:16px;height:16px;border-radius:50%;background:${HEX.warnBg};color:${HEX.warnText};font-size:10px;font-weight:700;text-align:center;line-height:16px;">!</span>
           <span style="font-size:12px;color:${HEX.text2};line-height:1.55;">${escHtml(r)}</span>
         </div>`).join('');
      return widgetShell(
        'AI Readiness — The Risk of Waiting',
        d.headline || "What We've Seen Happen Without a Readiness Check",
        form.clientName,
        `<div>${rows}</div>`,
        hex
      );
    }

    if (key === 'nextStep') {
      return widgetShell(
        'AI Readiness — Getting Started',
        d.headline || 'Getting Started',
        form.clientName,
        `<p style="margin:0;font-size:13px;color:${HEX.text2};line-height:1.65;">${escHtml(d.body || '')}</p>
         <div style="margin-top:14px;">
           <span style="display:inline-block;background:${hex};color:#fff;font-size:11px;font-weight:700;padding:8px 18px;border-radius:4px;">Ready when you are →</span>
         </div>`,
        hex
      );
    }

    return '';
  }

  function buildTierMatrixWidget(d, hex, form) {
    const tiers = (d.tiers || []).slice(0, 3);
    const colWidth = Math.floor(100 / Math.max(tiers.length, 1));
    const headerCells = tiers.map(t => `
      <td width="${colWidth}%" style="padding:10px 8px;text-align:center;border-right:1px solid ${HEX.border};background:${t.recommended ? hex : HEX.row};">
        ${t.recommended ? `<div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fff;margin-bottom:2px;">Recommended</div>` : ''}
        <div style="font-size:13px;font-weight:700;color:${t.recommended ? '#fff' : HEX.text};">${escHtml(t.name || '')}</div>
        ${t.price ? `<div style="font-size:11px;color:${t.recommended ? 'rgba(255,255,255,0.8)' : HEX.text2};margin-top:2px;">${escHtml(t.price)}</div>` : ''}
      </td>`).join('');

    const maxFeatures = Math.max(0, ...tiers.map(t => (t.features || []).length));
    let featureRows = '';
    for (let i = 0; i < maxFeatures; i++) {
      featureRows += `<tr>${tiers.map(t => `
        <td style="padding:8px;border-right:1px solid ${HEX.border};border-top:1px solid ${HEX.border};text-align:center;font-size:11.5px;color:${HEX.text2};">${escHtml((t.features || [])[i] || '')}</td>`).join('')}</tr>`;
    }

    return widgetShell(
      'AI Readiness — Service Tiers',
      d.headline || 'Choose Your Readiness Package',
      form.clientName,
      `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${HEX.border};">
         <tr>${headerCells}</tr>
         ${featureRows}
       </table>`,
      hex
    );
  }

  // ── Render widget list ────────────────────────────────
  function widgetMeta(key) {
    if (key === TIER_KEY) return { widgetName: 'Service Tiers' };
    return SECTIONS.find(s => s.key === key) || { widgetName: key };
  }

  function renderWidgetList(form) {
    widgetList.innerHTML = '';
    const order = [...SECTIONS.map(s => s.key), TIER_KEY];
    order.forEach(key => {
      if (!widgets[key]) return;
      const meta = widgetMeta(key);
      const widgetTitle = `${form.clientName} — AI Readiness — ${meta.widgetName}`;

      const card = document.createElement('div');
      card.className = 'widget-card';
      card.dataset.key = key;
      card.innerHTML = `
        <div class="widget-card-toolbar">
          <span class="wname">${escHtml(widgetTitle)}</span>
          <div class="wactions">
            <button class="btn-secondary btn-sm widget-regen" data-key="${key}">↺ Regenerate</button>
            <button class="btn-secondary btn-sm widget-copy" data-key="${key}">Copy HTML</button>
            <button class="btn-accent btn-sm widget-push" data-key="${key}" data-title="${escHtml(widgetTitle)}">Push Widget</button>
          </div>
        </div>
        <div class="widget-card-body">
          <div class="widget-preview" data-key="${key}" contenteditable="true">${widgets[key]}</div>
        </div>`;
      widgetList.appendChild(card);

      const preview = card.querySelector('.widget-preview');
      preview.addEventListener('input', () => {
        widgets[key] = preview.innerHTML;
      });
    });

    // Bind per-card actions
    widgetList.querySelectorAll('.widget-regen').forEach(btn =>
      btn.addEventListener('click', () => regenSection(btn.dataset.key)));
    widgetList.querySelectorAll('.widget-copy').forEach(btn =>
      btn.addEventListener('click', () => onCopyWidget(btn.dataset.key)));
    widgetList.querySelectorAll('.widget-push').forEach(btn =>
      btn.addEventListener('click', () => onPushSingle(btn.dataset.key, btn.dataset.title)));
  }

  function updateWidgetCard(key) {
    const card = widgetList.querySelector(`.widget-card[data-key="${key}"]`);
    if (!card) return;
    card.querySelector('.widget-preview').innerHTML = widgets[key];
  }

  function onCopyWidget(key) {
    const card = widgetList.querySelector(`.widget-card[data-key="${key}"]`);
    const btn = card.querySelector('.widget-copy');
    navigator.clipboard.writeText(widgets[key] || '').then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }

  function onCopyAll() {
    const all = Object.values(widgets).join('\n\n');
    navigator.clipboard.writeText(all).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy All HTML', 2000);
    });
  }

  // ── Push to Salesbuildr ───────────────────────────────
  function onPush(type) {
    const apiKey = localStorage.getItem(LS_API_KEY);
    const tenantUrl = localStorage.getItem(LS_TENANT_URL);
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.dataset.pendingType = type;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    executePush(type, apiKey, tenantUrl);
  }

  function onPushSingle(key, title) {
    const apiKey = localStorage.getItem(LS_API_KEY);
    const tenantUrl = localStorage.getItem(LS_TENANT_URL);
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.dataset.pendingType = 'single';
      credsInline.dataset.pendingKey = key;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    pushSingleWidget(key, title, apiKey, tenantUrl);
  }

  function onSaveAndPush() {
    const apiKey = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { showPushStatus('Enter both your API key and tenant URL.', 'err'); return; }
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
    credsInline.hidden = true;

    const type = credsInline.dataset.pendingType || 'individual';
    if (type === 'single') {
      const key = credsInline.dataset.pendingKey;
      const card = widgetList.querySelector(`.widget-card[data-key="${key}"]`);
      const title = card ? card.querySelector('.widget-push').dataset.title : `AI Readiness — ${key}`;
      pushSingleWidget(key, title, apiKey, tenantUrl);
    } else {
      executePush(type, apiKey, tenantUrl);
    }
  }

  async function executePush(type, apiKey, tenantUrl) {
    const form = getFormData();
    const prefix = `${form.clientName} — AI Readiness`;
    const order = [...SECTIONS.map(s => s.key), TIER_KEY].filter(k => widgets[k]);

    const body = type === 'pack'
      ? { widgets: [{ type: 'html', content: order.map(k => widgets[k]).join('\n\n'), title: `${prefix} — Full Pack` }], prefix, apiKey, tenantUrl }
      : { widgets: order.map(k => ({ type: 'html', content: widgets[k], title: `${prefix} — ${widgetMeta(k).widgetName}` })), prefix, apiKey, tenantUrl };

    const pLbl = pushPackBtn.textContent, iLbl = pushIndividualBtn.textContent;
    pushPackBtn.disabled = pushIndividualBtn.disabled = true;
    pushPackBtn.textContent = pushIndividualBtn.textContent = 'Pushing…';

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus(`✓ Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error. Check your credentials.'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + e.message, 'err');
    } finally {
      pushPackBtn.disabled = pushIndividualBtn.disabled = false;
      pushPackBtn.textContent = pLbl; pushIndividualBtn.textContent = iLbl;
    }
  }

  async function pushSingleWidget(key, title, apiKey, tenantUrl) {
    const btn = widgetList.querySelector(`.widget-push[data-key="${key}"]`);
    if (btn) { btn.disabled = true; btn.textContent = 'Pushing…'; }
    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: [{ type: 'html', content: widgets[key], title }], prefix: title, apiKey, tenantUrl })
      });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus(`✓ "${title}" pushed to Salesbuildr.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error.'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + e.message, 'err');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Push Widget'; }
    }
  }

  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status ' + type;
    pushStatus.hidden = false;
    pushStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }

  function prefillCreds() {
    const apiKey = localStorage.getItem(LS_API_KEY);
    const tenantUrl = localStorage.getItem(LS_TENANT_URL);
    if (apiKey) pushApiKey.value = apiKey;
    if (tenantUrl) pushTenantUrl.value = tenantUrl;
  }

  // ── Helpers ────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  init();
})();
