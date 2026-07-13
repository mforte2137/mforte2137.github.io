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
  const CATEGORY_ORDER_SEQUENCE = SERVICE_LIBRARY.map(g => g.category).concat(['Custom']);

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
    generatedTiers: null,   // [{name, tagline, recommended, services:[{id, value}]}]
    serviceNames: {},       // id -> current display name (renameable)
    categoryOrder: {},      // category label -> [id, id, ...] in display order (drag-reorderable within category)
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

  const outputCol        = $('outputCol');
  const previewToolbar   = $('previewToolbar');
  const emptyState       = $('emptyState');
  const loadingState     = $('loadingState');
  const widgetFrameWrap  = $('widgetFrameWrap');
  const widgetFrame      = $('widgetFrame');
  const colourSwatches   = $('colourSwatches');
  const customColorPickerEl = $('customColorPicker');
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

      const header = document.createElement('div');
      header.className = 'service-group-header';
      header.innerHTML = `<p class="service-group-title">${escapeHtml(group.category)}</p><button type="button" class="select-all-btn" data-group="${gi}">Select all</button>`;
      wrap.appendChild(header);

      group.services.forEach((name, si) => {
        const label = document.createElement('label');
        label.className = 'service-check';
        label.innerHTML = `<input type="checkbox" value="${escapeHtml(name)}" id="svc-${gi}-${si}"> <span>${escapeHtml(name)}</span>`;
        wrap.appendChild(label);
      });
      serviceLibraryEl.appendChild(wrap);
    });

    serviceLibraryEl.querySelectorAll('.select-all-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const gi = Number(btn.dataset.group);
        const group = serviceLibraryEl.querySelectorAll('.service-group')[gi];
        const boxes = group.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(boxes).every(cb => cb.checked);
        boxes.forEach(cb => { cb.checked = !allChecked; });
        btn.textContent = allChecked ? 'Select all' : 'Clear all';
      });
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
    previewToolbar.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    // Two-column layout: Generate lives at the bottom of the left sidebar,
    // so on click we scroll the RIGHT column into view — otherwise the
    // widget builds out of sight below the fold.
    outputCol.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

      state.generatedTiers = normalizeTiersResponse(data.tiers, services);
      initCategoryOrder();
      renderWidget();

      previewToolbar.hidden = false;
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

  // Assign a stable id to every requested service (by original checkbox/library
  // order) and normalize each tier's services into that same order — defensive
  // against the AI returning services in a different order than requested.
  function normalizeTiersResponse(rawTiers, requestedServiceNames) {
    const idsByName = {};
    const usedIds = new Set();
    requestedServiceNames.forEach(name => {
      const base = slug(name) || 'svc';
      let id = base, n = 2;
      while (usedIds.has(id)) { id = base + '-' + n; n++; }
      usedIds.add(id);
      idsByName[name] = id;
    });

    state.serviceNames = {};
    requestedServiceNames.forEach(name => { state.serviceNames[idsByName[name]] = name; });

    return rawTiers.map(t => {
      const svcByName = {};
      (t.services || []).forEach(s => { svcByName[s.name] = s; });
      return {
        name: t.name,
        tagline: t.tagline,
        recommended: !!t.recommended,
        services: requestedServiceNames.map(name => ({
          id: idsByName[name],
          value: (svcByName[name] && svcByName[name].value) || 'no'
        }))
      };
    });
  }

  // Build category -> [id, ...] display order from the library + custom names.
  // Drag-to-reorder mutates these arrays directly; they persist until the next
  // Generate/Regenerate (which rebuilds them fresh, same as Matrix Creator's
  // own AI-replace behaviour resetting manual edits).
  function initCategoryOrder() {
    state.categoryOrder = {};
    const allIds = state.generatedTiers[0].services.map(s => s.id);
    const libraryNames = new Set(SERVICE_LIBRARY.flatMap(g => g.services));

    SERVICE_LIBRARY.forEach(group => {
      const ids = allIds.filter(id => group.services.includes(state.serviceNames[id]));
      if (ids.length) state.categoryOrder[group.category] = ids;
    });

    const customIds = allIds.filter(id => !libraryNames.has(state.serviceNames[id]));
    if (customIds.length) state.categoryOrder['Custom'] = customIds;
  }

  // ── Build widget HTML ────────────────────────────────
  // Matrix-style: symbol-only cells (✓ / ✗ / ◐), single-line feature column,
  // compact padding, drag-to-reorder within a category, add/delete rows.
  function esc(s) { return escapeHtml(s); }

  const CELL_COLORS = {
    yes:     { bg: '#10b981', fg: '#ffffff', glyph: '&#10003;' },
    no:      { bg: '#fee2e2', fg: '#ef4444', glyph: '&#10005;' },
    partial: { bg: '#fef3c7', fg: '#d97706', glyph: '&#9680;' }
  };

  // Solid-fill SVG instead of the ✨ emoji — emoji glyphs are baked-in multicolor
  // and ignore CSS color entirely, which is why the AI-rewrite button read as
  // washed-out light orange on the lavender chip. Dark navy fill fixes contrast.
  const SPARKLE_SVG = '<svg width="11" height="11" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill="#1E1B4B"/></svg>';

  function buildWidgetHtml() {
    const tiers = state.generatedTiers;
    const hex = state.themeHex;
    const n = tiers.length;

    const headerBar = `
  <div style="width:100%;background:linear-gradient(135deg, ${hex} 0%, ${shade(hex, -18)} 100%);padding:12px 18px;">
    <h5 data-editable-id="header-tagline" style="margin:0;font-family:'Source Sans Pro',Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(state.headerTagline)}</h5>
  </div>`;

    const headerCells = tiers.map((t, i) => {
      const isRec = !!t.recommended;
      const bg = isRec ? hex : '#F5F5F2';
      const nameColor = isRec ? '#FFFFFF' : '#0B1220';
      const taglineColor = isRec ? 'rgba(255,255,255,0.85)' : '#586273';
      const badge = isRec
        ? `<div style="display:inline-block;background:rgba(255,255,255,0.22);color:#FFFFFF;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 9px;border-radius:20px;margin-bottom:4px;">★ Recommended</div><br/>`
        : `<button type="button" class="recommend-btn" data-tier="${i}" style="background:none;border:none;padding:0;margin-bottom:4px;font-family:'Source Sans Pro',Arial,sans-serif;font-size:10px;color:#9CA3AF;cursor:pointer;text-decoration:underline;">☆ Make recommended</button><br/>`;
      return `<th style="background:${bg};padding:10px 10px 6px;text-align:center;vertical-align:top;border-left:1px solid #E5E7EB;">
        ${badge}
        <div data-editable-id="tier-${i}-name" style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:700;color:${nameColor};letter-spacing:0.02em;text-transform:uppercase;white-space:nowrap;">${esc(t.name)}</div>
        <div data-editable-id="tier-${i}-tagline" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:10px;font-weight:400;color:${taglineColor};line-height:1.3;margin-top:2px;">${esc(t.tagline || '')}</div>
        <div style="width:0;height:0;margin:5px auto 0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:5px solid ${isRec ? hex : '#D1D5DB'};"></div>
      </th>`;
    }).join('');

    let bodyRows = '';
    CATEGORY_ORDER_SEQUENCE.forEach(category => {
      const ids = state.categoryOrder[category];
      if (!ids || !ids.length) return;
      bodyRows += categoryHeaderRow(category, n);
      ids.forEach(id => { bodyRows += serviceRow(id, category, tiers); });
    });

    const footerCells = tiers.map(t => {
      if (t.recommended) {
        return `<td style="background:${hex};color:#FFFFFF;padding:7px 10px;text-align:center;font-family:'Source Sans Pro',Arial,sans-serif;font-size:10px;font-weight:600;border-left:1px solid rgba(255,255,255,0.15);">Most businesses your size choose this option</td>`;
      }
      return `<td style="background:#F5F5F2;padding:7px 10px;border-left:1px solid #E5E7EB;">&nbsp;</td>`;
    }).join('');

    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#FFFFFF;border:1px solid #E5E7EB;width:100%;max-width:100%;overflow:hidden;">
${headerBar}
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="width:1%;white-space:nowrap;background:#FFFFFF;padding:10px 12px;"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
      <tr>
        <td colspan="${n + 1}" style="padding:8px 12px;text-align:left;border-top:1px solid #E5E7EB;">
          <button type="button" class="add-row-btn" style="background:none;border:none;padding:0;font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;color:#9CA3AF;cursor:pointer;">+ Add custom row</button>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:7px 12px;">&nbsp;</td>
        ${footerCells}
      </tr>
    </tfoot>
  </table>
</div>`;
  }

  function categoryHeaderRow(label, n) {
    return `<tr><td colspan="${n + 1}" style="background:#FAFAF7;padding:5px 12px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9CA3AF;border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB;">${esc(label)}</td></tr>`;
  }

  // Each cell is either a symbol (yes/no/partial, click to cycle) or, once the
  // MSP switches it to custom text ("T"), an editable short value — e.g.
  // "8×5" / "24×7" — with an AI "rewrite as benefit" option alongside it.
  function serviceRow(id, category, tiers) {
    const name = state.serviceNames[id] || '';
    const cells = tiers.map((t, i) => {
      const svc = t.services.find(s => s.id === id) || { value: 'no' };
      const isSymbol = svc.value === 'yes' || svc.value === 'no' || svc.value === 'partial';

      if (isSymbol) {
        const c = CELL_COLORS[svc.value];
        return `<td style="padding:6px 10px;border-top:1px solid #F0F0EE;text-align:center;vertical-align:middle;border-left:1px solid #E5E7EB;">
          <span class="cell-icon" data-tier="${i}" data-id="${escAttr(id)}" title="Click to change" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${c.bg};color:${c.fg};font-weight:700;font-size:12px;line-height:1;cursor:pointer;">${c.glyph}</span>
          <button type="button" class="cell-text-btn" data-tier="${i}" data-id="${escAttr(id)}" title="Enter custom text instead" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;margin-left:6px;padding:0 4px;background:#F3F4F6;border:1px solid #D1D5DB;border-radius:4px;font-family:'Source Sans Pro',Arial,sans-serif;font-size:11px;font-weight:700;color:#4B5563;cursor:pointer;vertical-align:middle;line-height:1;">T</button>
        </td>`;
      }
      return `<td style="padding:6px 10px;border-top:1px solid #F0F0EE;text-align:center;vertical-align:middle;border-left:1px solid #E5E7EB;">
        <span data-editable-id="cell-${i}-${id}" style="font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;font-weight:600;color:#0B1220;">${esc(svc.value || '')}</span>
        <button type="button" class="cell-rewrite-btn" data-tier="${i}" data-id="${escAttr(id)}" title="Rewrite as a client benefit (AI)" style="display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:18px;margin-left:5px;padding:0 5px;background:#EDE9FE;border:1px solid #C4B5FD;border-radius:4px;cursor:pointer;vertical-align:middle;line-height:1;">${SPARKLE_SVG}</button>
        <button type="button" class="cell-icon-btn" data-tier="${i}" data-id="${escAttr(id)}" title="Switch back to symbol" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;margin-left:5px;padding:0 4px;background:#F3F4F6;border:1px solid #D1D5DB;border-radius:4px;font-family:'Source Sans Pro',Arial,sans-serif;font-size:12px;color:#4B5563;cursor:pointer;vertical-align:middle;line-height:1;">&#8635;</button>
      </td>`;
    }).join('');

    return `<tr data-draggable-row data-id="${escAttr(id)}" data-category="${escAttr(category)}" draggable="true">
      <td style="padding:6px 12px;border-top:1px solid #F0F0EE;font-family:'Source Sans Pro',Arial,sans-serif;font-size:12.5px;color:#0B1220;font-weight:600;white-space:nowrap;vertical-align:middle;">
        <span class="row-drag-handle" title="Drag to reorder within this category" style="display:inline-flex;align-items:center;justify-content:center;cursor:grab;color:#9CA3AF;margin-right:8px;font-size:14px;">&#10241;</span><span data-editable-id="rowname-${id}">${esc(name)}</span><button type="button" class="row-delete-btn" data-id="${escAttr(id)}" data-category="${escAttr(category)}" title="Delete row" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;margin-left:8px;padding:0 4px;background:#FEF2F2;border:1px solid #FECACA;border-radius:4px;color:#DC2626;cursor:pointer;font-size:11px;font-weight:700;vertical-align:middle;line-height:1;">&#10005;</button>
      </td>
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

  const CELL_CYCLE = ['yes', 'no', 'partial'];
  let dragSrcId = null;
  let dragSrcCategory = null;

  function wireWidgetInteractions() {
    // Text edits — update in-memory state, do not force a full rebuild (preserves cursor)
    widgetFrame.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = el.title || 'Click to edit';
      el.addEventListener('input', () => {
        const id = el.getAttribute('data-editable-id');
        if (id === 'header-tagline') { state.headerTagline = el.textContent; return; }
        let m = id.match(/^tier-(\d+)-name$/);
        if (m) { state.generatedTiers[Number(m[1])].name = el.textContent; return; }
        m = id.match(/^tier-(\d+)-tagline$/);
        if (m) { state.generatedTiers[Number(m[1])].tagline = el.textContent; return; }
        m = id.match(/^rowname-(.+)$/);
        if (m) { state.serviceNames[m[1]] = el.textContent; state.widgetHtml = getWidgetHtmlFromFrame(); return; }
        m = id.match(/^cell-(\d+)-(.+)$/);
        if (m) {
          const tierIdx = Number(m[1]);
          const svcId = m[2];
          const svc = state.generatedTiers[tierIdx].services.find(s => s.id === svcId);
          if (svc) svc.value = el.textContent;
        }
        state.widgetHtml = getWidgetHtmlFromFrame();
      });
    });

    // Cell icon click — cycles yes → no → partial → yes. Structural change, full rebuild.
    widgetFrame.querySelectorAll('.cell-icon').forEach(el => {
      el.addEventListener('click', () => {
        const tierIdx = Number(el.dataset.tier);
        const id = el.dataset.id;
        const svc = state.generatedTiers[tierIdx].services.find(s => s.id === id);
        if (svc) {
          const idx = CELL_CYCLE.indexOf(svc.value);
          svc.value = CELL_CYCLE[(idx + 1) % CELL_CYCLE.length];
        }
        rerenderWidget();
      });
    });

    // "T" — switch a cell to free custom text (e.g. "8×5"), full rebuild then focus it
    widgetFrame.querySelectorAll('.cell-text-btn').forEach(el => {
      el.addEventListener('click', () => {
        const tierIdx = Number(el.dataset.tier);
        const id = el.dataset.id;
        const svc = state.generatedTiers[tierIdx].services.find(s => s.id === id);
        if (svc) svc.value = '';
        rerenderWidget();
        const target = widgetFrame.querySelector(`[data-editable-id="cell-${tierIdx}-${id}"]`);
        if (target) target.focus();
      });
    });

    // Revert a custom-text cell back to symbol mode (defaults to "yes")
    widgetFrame.querySelectorAll('.cell-icon-btn').forEach(el => {
      el.addEventListener('click', () => {
        const tierIdx = Number(el.dataset.tier);
        const id = el.dataset.id;
        const svc = state.generatedTiers[tierIdx].services.find(s => s.id === id);
        if (svc) svc.value = 'yes';
        rerenderWidget();
      });
    });

    // AI: rewrite a custom-text cell as a client benefit
    widgetFrame.querySelectorAll('.cell-rewrite-btn').forEach(el => {
      el.addEventListener('click', () => onRewriteCell(el));
    });

    // Recommended tier change — structural change, full rebuild, instant, no AI call
    widgetFrame.querySelectorAll('.recommend-btn').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.tier);
        state.generatedTiers.forEach((t, i) => { t.recommended = (i === idx); });
        rerenderWidget();
      });
    });

    // Delete row
    widgetFrame.querySelectorAll('.row-delete-btn').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const category = el.dataset.category;
        if (state.categoryOrder[category]) {
          state.categoryOrder[category] = state.categoryOrder[category].filter(x => x !== id);
          if (!state.categoryOrder[category].length) delete state.categoryOrder[category];
        }
        state.generatedTiers.forEach(t => { t.services = t.services.filter(s => s.id !== id); });
        delete state.serviceNames[id];
        rerenderWidget();
      });
    });

    // Add custom row
    const addBtn = widgetFrame.querySelector('.add-row-btn');
    if (addBtn) addBtn.addEventListener('click', addCustomRow);

    // Drag-to-reorder — restricted to rows within the same category
    widgetFrame.querySelectorAll('tr[data-draggable-row]').forEach(row => {
      row.addEventListener('dragstart', () => {
        dragSrcId = row.dataset.id;
        dragSrcCategory = row.dataset.category;
      });
      row.addEventListener('dragover', e => {
        if (row.dataset.category !== dragSrcCategory) return;
        e.preventDefault();
      });
      row.addEventListener('drop', e => {
        e.preventDefault();
        if (row.dataset.category !== dragSrcCategory) return;
        const targetId = row.dataset.id;
        if (targetId === dragSrcId) return;
        const arr = state.categoryOrder[dragSrcCategory];
        if (!arr) return;
        const from = arr.indexOf(dragSrcId);
        const to = arr.indexOf(targetId);
        if (from === -1 || to === -1) return;
        arr.splice(from, 1);
        arr.splice(to, 0, dragSrcId);
        rerenderWidget();
      });
    });
  }

  function addCustomRow() {
    const id = 'custom-' + Date.now();
    state.serviceNames[id] = 'New service';
    state.generatedTiers.forEach(t => { t.services.push({ id, value: 'no' }); });
    if (!state.categoryOrder['Custom']) state.categoryOrder['Custom'] = [];
    state.categoryOrder['Custom'].push(id);
    rerenderWidget();
    const el = widgetFrame.querySelector(`[data-editable-id="rowname-${id}"]`);
    if (el) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  async function onRewriteCell(btn) {
    const tierIdx = Number(btn.dataset.tier);
    const id = btn.dataset.id;
    const tier = state.generatedTiers[tierIdx];
    const svc = tier.services.find(s => s.id === id);
    if (!svc) return;

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '…';
    try {
      const res = await fetch('/api/service-tier-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewriteCell',
          featureName: state.serviceNames[id],
          tierName: tier.name,
          currentText: svc.value
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Rewrite failed.');
      svc.value = data.text;
      rerenderWidget();
    } catch (e) {
      alert('Rewrite failed: ' + (e.message || 'Please try again.'));
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  function getWidgetHtmlFromFrame() {
    const clone = widgetFrame.cloneNode(true);
    // Remove controls that only exist for in-tool editing — never part of the exported widget
    clone.querySelectorAll('.recommend-btn, .cell-text-btn, .cell-icon-btn, .cell-rewrite-btn, .row-delete-btn, .row-drag-handle, .add-row-btn').forEach(el => el.remove());
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    clone.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    clone.querySelectorAll('[data-tier], [data-id], [data-category], [data-editable-id], [draggable]').forEach(el => {
      el.removeAttribute('data-tier');
      el.removeAttribute('data-id');
      el.removeAttribute('data-category');
      el.removeAttribute('data-editable-id');
      el.removeAttribute('draggable');
    });
    // The trailing "+ Add custom row" row has nothing left in it — drop the empty row
    clone.querySelectorAll('tr').forEach(tr => {
      if (!tr.textContent.trim() && !tr.querySelector('span,div')) tr.remove();
    });
    return clone.innerHTML;
  }

  // ── Colour theme — real-time, no regeneration ────────
  function bindPreviewEvents() {
    colourSwatches.querySelectorAll('.swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        state.themeHex = sw.dataset.hex;
        customColorPickerEl.value = sw.dataset.hex;
        if (state.generatedTiers) rerenderWidget();
      });
    });

    customColorPickerEl.addEventListener('input', () => {
      state.themeHex = customColorPickerEl.value.toUpperCase();
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      if (state.generatedTiers) rerenderWidget();
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
    serviceLibraryEl.querySelectorAll('.select-all-btn').forEach(btn => { btn.textContent = 'Select all'; });
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
    state.serviceNames = {};
    state.categoryOrder = {};
    state.widgetHtml = '';
    widgetFrame.innerHTML = '';
    widgetFrameWrap.hidden = true;
    previewToolbar.hidden = true;
    emptyState.hidden = false;
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
