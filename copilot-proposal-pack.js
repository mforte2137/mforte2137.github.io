/* =====================================================
   copilot-proposal-pack.js — Frontend logic
   Single-sitting tool — no cross-device session persistence
   ===================================================== */
(function () {
  'use strict';

  const LS_API_KEY    = 'sb_api_key';
  const LS_TENANT_URL = 'sb_tenant_url';

  // Widget hex palette (shared Salesbuildr AI Tools palette)
  const HEX = {
    accent: '#2e74dc', accentDark: '#1e5bb8',
    text: '#0b1220', text2: '#586273', muted: '#9ca3af',
    bg: '#fbfcfe', panel: '#ffffff', row: '#f4f7fb', border: '#e3e7ee',
    successBg: '#dcfce7', successText: '#15a05a',
    warnBg: '#fef3c7', warnText: '#b3760a'
  };

  const SECTIONS = [
    { key: 'plainEnglish', label: 'What Copilot Does in Plain English', widgetName: 'What It Does', hint: 'App-by-app, industry-specific — no marketing language.', defaultOn: true },
    { key: 'yourTeam', label: 'What This Means for Your Team', widgetName: 'Your Team', hint: 'Concrete day-in-the-life scenarios for this industry.', defaultOn: true },
    { key: 'dataPrivacy', label: 'Your Data Stays Yours', widgetName: 'Your Data', hint: 'Addresses the #1 objection — calm, factual privacy facts.', defaultOn: true },
    { key: 'gettingStarted', label: 'Getting Started', widgetName: 'Getting Started', hint: 'Realistic rollout timeline — no hype.', defaultOn: true },
    { key: 'investment', label: 'Your Investment', widgetName: 'Your Investment', hint: 'Time-value framing from independent research — no pricing.', defaultOn: false },
    { key: 'readinessComplete', label: 'Your Environment Is Ready', widgetName: 'Ready for Copilot', hint: 'Closes the loop from a completed AI Readiness Assessment.', defaultOn: false, requiresReadiness: 'completed' },
  ];

  const TIER_KEY = 'tierMatrix';
  // Canonical tier columns — fixed, matched against the copilotSku dropdown value
  // so "recommended" always tracks what the rep actually selected.
  const TIER_NAMES = [
    'M365 Copilot Business',
    'M365 Business Standard + Copilot Business',
    'M365 Business Premium + Copilot Business'
  ];
  const TIER_DISPLAY_NAMES = ['Copilot Business', 'Business Standard + Copilot', 'Business Premium + Copilot'];

  // Fixed, generic data-privacy facts — not AI-generated, not client-specific.
  const DATA_PRIVACY_FACTS = [
    "Copilot only reads what you already have access to — it doesn't change permissions",
    'Microsoft does not train its AI models on your business data',
    'Your data is not shared with other Microsoft customers or used to improve Copilot for others',
    'Copilot works within your existing Microsoft 365 security and compliance boundaries',
    "Sensitivity labels and DLP policies you already have in place are respected — Copilot won't surface what shouldn't be surfaced"
  ];
  const READINESS_CONFIRMED_NOTE = 'Your AI Readiness Assessment has confirmed your environment is configured to these standards.';

  function cloneArr(a) { return JSON.parse(JSON.stringify(a)); }

  // ── State ──────────────────────────────────────────
  let currentThemeHex = '#0f1f3d';
  let activeSections  = new Set(SECTIONS.filter(s => s.defaultOn).map(s => s.key));
  let includeTierMatrix = false;
  let widgets  = {};   // key -> clean exportable html string
  let rawData  = {};   // key -> raw editable data object
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
  const readinessStatusEl   = $('readinessStatus');
  const recommendedCallout  = $('recommendedCallout');

  // ── Init ───────────────────────────────────────────
  function init() {
    renderSectionToggles();
    bindColourSwatches();
    bindEvents();
    prefillCreds();
    applyReadinessGating();
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
        if (card.classList.contains('disabled')) { e.preventDefault(); return; }
        e.preventDefault();
        if (activeSections.has(sec.key)) activeSections.delete(sec.key);
        else activeSections.add(sec.key);
        card.classList.toggle('active');
        card.querySelector('input').checked = activeSections.has(sec.key);
      });
      grid.appendChild(card);
    });
  }

  // Section 6 ("Your Environment Is Ready") only makes sense when readiness is complete.
  function applyReadinessGating() {
    const status = readinessStatusEl.value;
    recommendedCallout.hidden = status !== 'recommended';

    SECTIONS.forEach(sec => {
      if (!sec.requiresReadiness) return;
      const card = document.querySelector(`.section-toggle-card[data-key="${sec.key}"]`);
      if (!card) return;
      const eligible = status === sec.requiresReadiness;
      card.classList.toggle('disabled', !eligible);
      if (!eligible && activeSections.has(sec.key)) {
        activeSections.delete(sec.key);
        card.classList.remove('active');
        const cb = card.querySelector('input');
        if (cb) cb.checked = false;
      }
    });
  }

  readinessStatusEl.addEventListener('change', applyReadinessGating);

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
        rebuildAllFromTheme();
      });
    });

    $('customHex').addEventListener('input', () => {
      const val = $('customHex').value.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(val)) {
        currentThemeHex = '#' + val;
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        $('hexPreview').style.background = currentThemeHex;
        rebuildAllFromTheme();
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
      readinessStatus: $('readinessStatus').value,
      mspName:    $('mspName').value.trim(),
    };
  }

  function validateForm(data) {
    if (!data.clientName)  return 'Please enter the client name.';
    if (!data.industry)    return 'Please select an industry.';
    if (!data.companySize) return 'Please select a company size.';
    if (!data.copilotSku)  return 'Please select the Copilot SKU being proposed.';
    if (!data.readinessStatus) return 'Please select the readiness status.';
    if (!data.mspName)     return 'Please enter your MSP name.';
    if (activeSections.size === 0 && !includeTierMatrix) return 'Please activate at least one section.';
    return null;
  }

  function showError(msg) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError() { formError.hidden = true; }

  function mapSkuToTierIndex(sku) { return TIER_NAMES.indexOf(sku); }

  // ── Generate ─────────────────────────────────────────
  async function generate() {
    const data = getFormData();
    const err = validateForm(data);
    if (err) { showError(err); return; }
    hideError();

    emptyState.hidden = true;
    outputArea.hidden = true;
    loadingState.hidden = false;
    loadingState.scrollIntoView({ behavior: 'smooth', block: 'start' });
    generateBtn.disabled = true;
    regenerateAllBtn.disabled = true;

    const payload = {
      clientName: data.clientName,
      industry: data.industry,
      companySize: data.companySize,
      copilotSku: data.copilotSku,
      readinessStatus: data.readinessStatus,
      mspName: data.mspName,
      activeSections: [...activeSections],
      includeTierMatrix
    };
    lastPayload = payload;

    try {
      const res = await fetch('/api/copilot-proposal-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Generation failed.');

      widgets = {};
      rawData = {};

      SECTIONS.forEach(sec => {
        if (!activeSections.has(sec.key) || !json.data[sec.key]) return;
        if (sec.key === 'dataPrivacy') {
          rawData.dataPrivacy = {
            headline: json.data.dataPrivacy.headline || 'Your Data Stays Yours',
            facts: cloneArr(DATA_PRIVACY_FACTS),
            complianceNote: json.data.dataPrivacy.complianceNote || '',
            readinessNote: data.readinessStatus === 'completed' ? READINESS_CONFIRMED_NOTE : ''
          };
        } else {
          rawData[sec.key] = json.data[sec.key];
        }
        widgets[sec.key] = buildSectionWidget(sec.key, rawData[sec.key], currentThemeHex, data);
      });

      if (includeTierMatrix && json.data[TIER_KEY]) {
        rawData[TIER_KEY] = {
          headline: json.data[TIER_KEY].headline || 'Comparing Your Copilot Options',
          tiers: TIER_DISPLAY_NAMES.map((name, i) => ({ name, features: (json.data[TIER_KEY].tiers && json.data[TIER_KEY].tiers[i] && json.data[TIER_KEY].tiers[i].features) || [] }))
        };
        widgets[TIER_KEY] = buildTierMatrixWidget(rawData[TIER_KEY], currentThemeHex, data);
      }

      renderWidgetList(data);
      deliveryTitle.textContent = `${data.clientName} — Copilot Proposal`;
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
      const res = await fetch('/api/copilot-proposal-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenSection: key })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Regeneration failed.');

      const data = getFormData();

      if (key === 'dataPrivacy') {
        rawData.dataPrivacy = {
          headline: rawData.dataPrivacy ? rawData.dataPrivacy.headline : (json.data.dataPrivacy.headline || 'Your Data Stays Yours'),
          facts: cloneArr(DATA_PRIVACY_FACTS),
          complianceNote: json.data.dataPrivacy.complianceNote || '',
          readinessNote: data.readinessStatus === 'completed' ? READINESS_CONFIRMED_NOTE : ''
        };
        widgets.dataPrivacy = buildSectionWidget('dataPrivacy', rawData.dataPrivacy, currentThemeHex, data);
      } else if (key === TIER_KEY) {
        rawData[TIER_KEY] = {
          headline: json.data[TIER_KEY].headline || 'Comparing Your Copilot Options',
          tiers: TIER_DISPLAY_NAMES.map((name, i) => ({ name, features: (json.data[TIER_KEY].tiers && json.data[TIER_KEY].tiers[i] && json.data[TIER_KEY].tiers[i].features) || [] }))
        };
        widgets[TIER_KEY] = buildTierMatrixWidget(rawData[TIER_KEY], currentThemeHex, data);
      } else {
        rawData[key] = json.data[key];
        widgets[key] = buildSectionWidget(key, rawData[key], currentThemeHex, data);
      }
      updateWidgetCard(key);
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '↺ Regenerate'; }
    }
  }

  function rebuildAllFromTheme() {
    if (Object.keys(rawData).length === 0) return; // nothing generated yet
    const form = getFormData();
    Object.keys(rawData).forEach(key => {
      widgets[key] = (key === TIER_KEY)
        ? buildTierMatrixWidget(rawData[key], currentThemeHex, form)
        : buildSectionWidget(key, rawData[key], currentThemeHex, form);
      updateWidgetCard(key);
    });
  }

  // Set a value on rawData by a dot-path like "appHighlights.0.description"
  function setByPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = /^\d+$/.test(parts[i]) ? parseInt(parts[i], 10) : parts[i];
      if (cur[seg] === undefined) return;
      cur = cur[seg];
    }
    const lastSeg = /^\d+$/.test(parts[parts.length - 1]) ? parseInt(parts[parts.length - 1], 10) : parts[parts.length - 1];
    cur[lastSeg] = value;
  }

  function makeEditable(previewEl, key) {
    previewEl.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = 'Click to edit';
      el.addEventListener('input', () => {
        if (rawData[key]) setByPath(rawData[key], el.dataset.editableId, el.textContent);
        widgets[key] = getCleanHtml(previewEl);
      });
    });
  }

  function getCleanHtml(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(n => {
      n.removeAttribute('contenteditable');
      n.removeAttribute('title');
    });
    return clone.innerHTML;
  }

  // ── Widget HTML builders ──────────────────────────────
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
    <h5 data-editable-id="headline" style="margin:0;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${escHtml(title)}</h5>
    ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;">${escHtml(subtitle)}</div>` : ''}
  </div>
  <div style="padding:16px 18px;">
    ${bodyHtml}
  </div>
</div>`;
  }

  function buildSectionWidget(key, d, hex, form) {
    if (key === 'plainEnglish') {
      const items = (d.appHighlights || []).map((a, i) => `
        <div style="padding:8px 0;border-bottom:1px solid ${HEX.border};">
          <div data-editable-id="appHighlights.${i}.app" style="font-size:11.5px;font-weight:700;color:${hex};margin-bottom:2px;">${escHtml(a.app || '')}</div>
          <div data-editable-id="appHighlights.${i}.description" style="font-size:12px;color:${HEX.text2};line-height:1.55;">${escHtml(a.description || '')}</div>
        </div>`).join('');
      return widgetShell(
        'Copilot — What It Does',
        d.headline || 'What Microsoft 365 Copilot Does for You',
        form.clientName,
        `<p data-editable-id="body" style="margin:0 0 12px;font-size:13px;color:${HEX.text2};line-height:1.65;">${escHtml(d.body || '')}</p><div>${items}</div>`,
        hex
      );
    }

    if (key === 'yourTeam') {
      const items = (d.scenarios || []).map((s, i) =>
        `<div style="margin-bottom:10px;padding:10px 12px;background:${HEX.row};border-left:3px solid ${hex};border-radius:4px;">
           <span data-editable-id="scenarios.${i}" style="font-size:12px;color:${HEX.text};font-style:italic;line-height:1.55;">${escHtml(s)}</span>
         </div>`).join('');
      return widgetShell(
        'Copilot — Your Team',
        d.headline || 'What This Looks Like for Your Team',
        form.clientName,
        `<div>${items}</div>`,
        hex
      );
    }

    if (key === 'dataPrivacy') {
      const facts = (d.facts || []).map((f, i) =>
        `<div style="padding:6px 0;display:flex;gap:8px;align-items:flex-start;">
           <span style="flex:none;color:${HEX.successText};font-weight:700;">&#10003;</span>
           <span data-editable-id="facts.${i}" style="font-size:12px;color:${HEX.text2};line-height:1.55;">${escHtml(f)}</span>
         </div>`).join('');
      const compliance = d.complianceNote
        ? `<div style="margin-top:10px;padding:10px 12px;background:${HEX.row};border-left:3px solid ${hex};border-radius:4px;">
             <span data-editable-id="complianceNote" style="font-size:12px;color:${HEX.text};font-style:italic;line-height:1.55;">${escHtml(d.complianceNote)}</span>
           </div>` : '';
      const readiness = d.readinessNote
        ? `<div style="margin-top:8px;"><span data-editable-id="readinessNote" style="font-size:11.5px;color:${HEX.successText};font-weight:700;">✓ ${escHtml(d.readinessNote)}</span></div>` : '';
      return widgetShell(
        'Copilot — Your Data',
        d.headline || 'Your Data Stays Yours',
        form.clientName,
        `<div>${facts}</div>${compliance}${readiness}`,
        hex
      );
    }

    if (key === 'gettingStarted') {
      const steps = (d.steps || []).map((s, i) =>
        `<div style="padding:8px 0;border-bottom:1px solid ${HEX.border};display:flex;gap:8px;align-items:flex-start;">
           <span style="flex:none;display:inline-block;width:16px;height:16px;border-radius:50%;background:${hex};color:#fff;font-size:9px;font-weight:700;text-align:center;line-height:16px;">${i + 1}</span>
           <span data-editable-id="steps.${i}" style="font-size:12px;color:${HEX.text2};line-height:1.55;">${escHtml(s)}</span>
         </div>`).join('');
      return widgetShell(
        'Copilot — Getting Started',
        d.headline || 'Getting Started Is Simpler Than You Think',
        form.clientName,
        `<div>${steps}</div>`,
        hex
      );
    }

    if (key === 'investment') {
      return widgetShell(
        'Copilot — Your Investment',
        d.headline || 'Understanding the Value',
        form.clientName,
        `<p data-editable-id="body" style="margin:0;font-size:13px;color:${HEX.text2};line-height:1.65;">${escHtml(d.body || '')}</p>`,
        hex
      );
    }

    if (key === 'readinessComplete') {
      return widgetShell(
        'Copilot — Ready for Copilot',
        d.headline || 'Your Environment Is Ready for Copilot',
        form.clientName,
        `<p data-editable-id="body" style="margin:0;font-size:13px;color:${HEX.text2};line-height:1.65;">${escHtml(d.body || '')}</p>`,
        hex
      );
    }

    return '';
  }

  function buildTierMatrixWidget(d, hex, form) {
    const recIdx = mapSkuToTierIndex(form.copilotSku);
    const tiers = d.tiers || [];
    const colWidth = Math.floor(100 / Math.max(tiers.length, 1));

    const headerCells = tiers.map((t, i) => `
      <td width="${colWidth}%" style="padding:10px 8px;text-align:center;border-right:1px solid ${HEX.border};background:${i === recIdx ? hex : HEX.row};">
        ${i === recIdx ? `<div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fff;margin-bottom:2px;">Recommended</div>` : ''}
        <div data-editable-id="tiers.${i}.name" style="font-size:12.5px;font-weight:700;color:${i === recIdx ? '#fff' : HEX.text};">${escHtml(t.name || '')}</div>
      </td>`).join('');

    const maxFeatures = Math.max(0, ...tiers.map(t => (t.features || []).length));
    let featureRows = '';
    for (let i = 0; i < maxFeatures; i++) {
      featureRows += `<tr>${tiers.map((t, ti) => {
        const feature = (t.features || [])[i];
        return `<td data-editable-id="tiers.${ti}.features.${i}" style="padding:8px;border-right:1px solid ${HEX.border};border-top:1px solid ${HEX.border};font-size:11px;color:${HEX.text2};text-align:center;">${feature ? `<span style="color:${HEX.successText};">&#10003;</span> ${escHtml(feature)}` : ''}</td>`;
      }).join('')}</tr>`;
    }

    const table = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${HEX.border};">
      <tr>${headerCells}</tr>
      ${featureRows}
    </table>`;

    return widgetShell(
      'Copilot — Compare Your Options',
      d.headline || 'Comparing Your Copilot Options',
      form.clientName,
      table,
      hex
    );
  }

  // ── Render widget list ────────────────────────────────
  function widgetMeta(key) {
    if (key === TIER_KEY) return { widgetName: 'Compare Options' };
    return SECTIONS.find(s => s.key === key) || { widgetName: key };
  }

  function renderWidgetList(form) {
    widgetList.innerHTML = '';
    const order = [...SECTIONS.map(s => s.key), TIER_KEY];
    order.forEach(key => {
      if (!widgets[key]) return;
      const meta = widgetMeta(key);
      const widgetTitle = `${form.clientName} — Copilot — ${meta.widgetName}`;

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
          <div class="widget-preview" data-key="${key}">${widgets[key]}</div>
        </div>`;
      widgetList.appendChild(card);

      makeEditable(card.querySelector('.widget-preview'), key);
    });

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
    const preview = card.querySelector('.widget-preview');
    preview.innerHTML = widgets[key];
    makeEditable(preview, key);
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
      const title = card ? card.querySelector('.widget-push').dataset.title : `Copilot — ${key}`;
      pushSingleWidget(key, title, apiKey, tenantUrl);
    } else {
      executePush(type, apiKey, tenantUrl);
    }
  }

  async function executePush(type, apiKey, tenantUrl) {
    const form = getFormData();
    const prefix = `${form.clientName} — Copilot`;
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
