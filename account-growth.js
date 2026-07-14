/* =====================================================
   account-growth.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────
  const SESSION_KEY   = 'account_growth_sessions';
  const ARCHIVE_KEY   = 'account_growth_sessions_archived';
  const SESSION_LIMIT = 5;

  const COVERAGE_CHIPS = [
    'Helpdesk & Support',
    'Remote Monitoring & Management',
    'Patch Management',
    'Backup & Disaster Recovery',
    'Microsoft 365 Management',
    'Network Monitoring & Management',
    'Basic Security (antivirus only)',
    'Endpoint Detection & Response (EDR)',
    'Email Security & Anti-Phishing',
    'Multi-Factor Authentication (MFA)',
    'Security Awareness Training',
    'vCIO / Strategic Advisory'
  ];

  // ── State ──────────────────────────────────────────
  let currentTheme     = '#2e74dc';
  let currentCoverage  = new Set();
  let recommendedAdd   = new Set();
  let includeExecSummary = false;
  let generatedData    = null;      // { growthWidget, executiveSummary }
  let widgets          = {};        // { 1: html, 2: html }
  let currentSessionId = null;
  let lastPayload       = null;
  let autoSaveReady     = false;

  // ── DOM refs ───────────────────────────────────────
  const $ = id => document.getElementById(id);

  const sessionsBlock   = $('sessionsBlock');
  const sessionCards    = $('sessionCards');
  const showArchivedBtn = $('showArchivedBtn');
  const newSessionBtn   = $('newSessionBtn');

  const clientNameEl    = $('clientName');
  const industryEl      = $('industry');
  const currentChipsEl  = $('currentCoverageChips');
  const recChipsEl      = $('recommendedChips');
  const triggerSelectEl = $('triggerSelect');
  const triggerDetailEl = $('triggerDetail');

  const execToggle    = $('execSummaryToggle');
  const widget2Block   = $('widget2Block');

  const colourSwatches = $('colourSwatches');
  const hexTriggerBtn   = $('hexTriggerBtn');
  const hexPreview      = $('hexPreview');
  const hexTriggerValue = $('hexTriggerValue');

  const hexModalOverlay = $('hexModalOverlay');
  const hexModalClose   = $('hexModalClose');
  const hexModalApply   = $('hexModalApply');
  const hexModalInput   = $('hexModalInput');
  const hexModalPreview = $('hexModalPreview');
  const hueBar          = $('hueBar');
  const hueDot          = $('hueDot');
  const svBox           = $('svBox');
  const svDot           = $('svDot');
  const eyedropperBtn   = $('eyedropperBtn');
  const rInput = $('rInput'), gInput = $('gInput'), bInput = $('bInput');
  const valueRowRgb = $('valueRowRgb'), valueRowHex = $('valueRowHex');
  const modeToggleBtn = $('modeToggleBtn'), modeToggleBtnHex = $('modeToggleBtnHex');

  const generateBtn = $('generateBtn');
  const clearBtn     = $('clearBtn');
  const formError    = $('formError');
  const autoSaveLabel = $('autoSaveLabel');

  const emptyState   = $('emptyState');
  const loadingState = $('loadingState');
  const loadingMsg   = $('loadingMsg');
  const outputArea   = $('outputArea');
  const deliveryTitle = $('deliveryTitle');
  const previewCol    = $('previewCol');

  const preview1 = $('preview1');
  const preview2 = $('preview2');

  const copyAllBtn  = $('copyAllBtn');
  const pushPackBtn = $('pushPackBtn');
  const credsInline = $('credsInline');
  const pushApiKey    = $('pushApiKey');
  const pushTenantUrl = $('pushTenantUrl');
  const pushStatus    = $('pushStatus');

  // ── Init ───────────────────────────────────────────
  function init() {
    renderChipList(currentChipsEl, COVERAGE_CHIPS, currentCoverage, onCurrentChipClick);
    renderChipList(recChipsEl, COVERAGE_CHIPS, recommendedAdd, onRecChipClick);
    refreshRecChipsDisabled();

    colourSwatches.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', () => selectSwatch(s)));
    hexTriggerBtn.addEventListener('click', openHexModal);
    hexModalClose.addEventListener('click', closeHexModal);
    hexModalOverlay.addEventListener('click', e => { if (e.target === hexModalOverlay) closeHexModal(); });
    hexModalApply.addEventListener('click', applyHexModal);
    hexModalInput.addEventListener('input', onHexInputChange);
    [rInput, gInput, bInput].forEach(el => el.addEventListener('input', onRgbInputChange));
    modeToggleBtn.addEventListener('click', toggleValueMode);
    modeToggleBtnHex.addEventListener('click', toggleValueMode);
    initHueBarDrag();
    initSvBoxDrag();
    initEyedropper();

    [clientNameEl, industryEl, triggerSelectEl, triggerDetailEl].forEach(el => {
      el.addEventListener('input', () => autoSave());
      el.addEventListener('change', () => autoSave());
    });

    execToggle.addEventListener('click', onToggleExecSummary);

    generateBtn.addEventListener('click', onGenerate);
    clearBtn.addEventListener('click', startNewSession);
    newSessionBtn.addEventListener('click', startNewSession);
    showArchivedBtn.addEventListener('click', onShowArchived);

    ['1', '2'].forEach(i => {
      $(`regenBtn${i}`).addEventListener('click', () => onRegenWidget(Number(i)));
      $(`copyBtn${i}`).addEventListener('click', () => onCopyWidget(Number(i)));
      $(`pushBtn${i}`).addEventListener('click', () => onPushSingle(Number(i)));
    });

    copyAllBtn.addEventListener('click', onCopyAll);
    pushPackBtn.addEventListener('click', () => onPush('pack'));
    $('saveAndPushBtn').addEventListener('click', onSaveAndPush);
    $('cancelCredsBtn').addEventListener('click', () => { credsInline.hidden = true; });

    renderSessionCards();
    const sessions = getSessions();
    if (sessions.length) {
      sessionsBlock.hidden = false;
      resumeSession(sessions[0]);
    }
    autoSaveReady = true;
  }

  // ── Chip rendering / delta logic ────────────────────
  function renderChipList(container, list, activeSet, onClick) {
    container.innerHTML = '';
    list.forEach(val => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.val = val;
      chip.textContent = val;
      chip.addEventListener('click', () => onClick(chip));
      container.appendChild(chip);
    });
  }

  function onCurrentChipClick(chip) {
    const val = chip.dataset.val;
    if (currentCoverage.has(val)) {
      currentCoverage.delete(val);
      chip.classList.remove('active');
    } else {
      currentCoverage.add(val);
      chip.classList.add('active');
      // Can't recommend something the client already has — clear it from the addition side
      if (recommendedAdd.has(val)) recommendedAdd.delete(val);
    }
    refreshRecChipsDisabled();
    autoSave();
  }

  function onRecChipClick(chip) {
    const val = chip.dataset.val;
    if (chip.classList.contains('chip-disabled')) return; // already in current coverage
    if (recommendedAdd.has(val)) {
      recommendedAdd.delete(val);
      chip.classList.remove('active', 'chip-new');
    } else {
      recommendedAdd.add(val);
      chip.classList.add('active', 'chip-new');
    }
    autoSave();
  }

  // Grey out / disable any Recommended Addition chip already present in Current Coverage
  function refreshRecChipsDisabled() {
    recChipsEl.querySelectorAll('.chip').forEach(chip => {
      const val = chip.dataset.val;
      const inCurrent = currentCoverage.has(val);
      chip.classList.toggle('chip-disabled', inCurrent);
      chip.classList.toggle('active', !inCurrent && recommendedAdd.has(val));
      chip.classList.toggle('chip-new', !inCurrent && recommendedAdd.has(val));
      chip.disabled = false; // keep clickable target but click handler no-ops when disabled class present
    });
    currentChipsEl.querySelectorAll('.chip').forEach(chip => {
      chip.classList.toggle('active', currentCoverage.has(chip.dataset.val));
    });
  }

  // ── Executive Summary toggle ────────────────────────
  function onToggleExecSummary() {
    includeExecSummary = !includeExecSummary;
    execToggle.dataset.state = includeExecSummary ? 'on' : 'off';
    execToggle.setAttribute('aria-checked', String(includeExecSummary));
    // Show/hide immediately — no regeneration. Both widgets are always generated.
    if (widgets[2]) {
      widget2Block.hidden = !includeExecSummary;
    }
    autoSave();
  }

  // ── Colour theme ─────────────────────────────────────
  function selectSwatch(el) {
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    setTheme(el.dataset.hex);
  }

  function setTheme(hex) {
    currentTheme = hex;
    hexPreview.style.background = hex;
    hexTriggerValue.textContent = hex;
    refreshPreviews();
    autoSave();
  }

  // ── Custom colour picker modal (SV box + hue bar + RGB/HEX + eyedropper) ──
  let pickerHsv = { h: 217, s: 79, v: 86 }; // updated whenever the modal opens or values change
  let valueMode = 'rgb'; // 'rgb' | 'hex'

  function openHexModal() {
    pickerHsv = hexToHsv(currentTheme);
    renderPicker();
    hexModalOverlay.hidden = false;
  }

  function closeHexModal() { hexModalOverlay.hidden = true; }

  function applyHexModal() {
    const { r, g, b } = hsvToRgb(pickerHsv.h, pickerHsv.s, pickerHsv.v);
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    setTheme(rgbToHex(r, g, b));
    closeHexModal();
  }

  // Redraw every part of the picker from pickerHsv
  function renderPicker() {
    const { h, s, v } = pickerHsv;
    const { r, g, b } = hsvToRgb(h, s, v);
    const hex = rgbToHex(r, g, b);

    svBox.style.backgroundColor = `hsl(${h}, 100%, 50%)`;
    svDot.style.left = s + '%';
    svDot.style.top = (100 - v) + '%';
    hueDot.style.left = (h / 360 * 100) + '%';

    hexModalPreview.style.background = hex;
    rInput.value = r; gInput.value = g; bInput.value = b;
    hexModalInput.value = hex;
  }

  function initSvBoxDrag() {
    let dragging = false;
    function setFromPoint(clientX, clientY) {
      const rect = svBox.getBoundingClientRect();
      let fx = (clientX - rect.left) / rect.width;
      let fy = (clientY - rect.top) / rect.height;
      fx = Math.min(1, Math.max(0, fx));
      fy = Math.min(1, Math.max(0, fy));
      pickerHsv.s = fx * 100;
      pickerHsv.v = (1 - fy) * 100;
      renderPicker();
    }
    svBox.addEventListener('pointerdown', e => {
      dragging = true;
      svBox.setPointerCapture(e.pointerId);
      setFromPoint(e.clientX, e.clientY);
    });
    svBox.addEventListener('pointermove', e => { if (dragging) setFromPoint(e.clientX, e.clientY); });
    svBox.addEventListener('pointerup', () => { dragging = false; });
    svBox.addEventListener('pointercancel', () => { dragging = false; });
  }

  function initHueBarDrag() {
    let dragging = false;
    function setFromClientX(clientX) {
      const rect = hueBar.getBoundingClientRect();
      let frac = (clientX - rect.left) / rect.width;
      frac = Math.min(1, Math.max(0, frac));
      pickerHsv.h = frac * 360;
      renderPicker();
    }
    hueBar.addEventListener('pointerdown', e => {
      dragging = true;
      hueBar.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
    });
    hueBar.addEventListener('pointermove', e => { if (dragging) setFromClientX(e.clientX); });
    hueBar.addEventListener('pointerup', () => { dragging = false; });
    hueBar.addEventListener('pointercancel', () => { dragging = false; });
  }

  function onRgbInputChange() {
    const r = clamp255(rInput.value);
    const g = clamp255(gInput.value);
    const b = clamp255(bInput.value);
    pickerHsv = rgbToHsv(r, g, b);
    // Update everything except the RGB fields themselves, so the rep's cursor isn't disturbed mid-type
    const hex = rgbToHex(r, g, b);
    svBox.style.backgroundColor = `hsl(${pickerHsv.h}, 100%, 50%)`;
    svDot.style.left = pickerHsv.s + '%';
    svDot.style.top = (100 - pickerHsv.v) + '%';
    hueDot.style.left = (pickerHsv.h / 360 * 100) + '%';
    hexModalPreview.style.background = hex;
    hexModalInput.value = hex;
  }

  function onHexInputChange() {
    const val = hexModalInput.value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      pickerHsv = hexToHsv('#' + val);
      const { r, g, b } = hsvToRgb(pickerHsv.h, pickerHsv.s, pickerHsv.v);
      svBox.style.backgroundColor = `hsl(${pickerHsv.h}, 100%, 50%)`;
      svDot.style.left = pickerHsv.s + '%';
      svDot.style.top = (100 - pickerHsv.v) + '%';
      hueDot.style.left = (pickerHsv.h / 360 * 100) + '%';
      hexModalPreview.style.background = '#' + val;
      rInput.value = r; gInput.value = g; bInput.value = b;
    }
  }

  function toggleValueMode() {
    valueMode = valueMode === 'rgb' ? 'hex' : 'rgb';
    valueRowRgb.hidden = valueMode !== 'rgb';
    valueRowHex.hidden = valueMode !== 'hex';
  }

  function initEyedropper() {
    if (!('EyeDropper' in window)) { eyedropperBtn.hidden = true; return; }
    eyedropperBtn.addEventListener('click', async () => {
      try {
        const dropper = new window.EyeDropper();
        const result = await dropper.open();
        pickerHsv = hexToHsv(result.sRGBHex);
        renderPicker();
      } catch (e) {
        // Cancelled — no-op
      }
    });
  }

  function clamp255(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return 0;
    return Math.min(255, Math.max(0, n));
  }

  // ── Colour conversions: HEX <-> RGB <-> HSV ──────────
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substr(0, 2), 16),
      g: parseInt(h.substr(2, 2), 16),
      b: parseInt(h.substr(4, 2), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = x => Math.round(x).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h, s, v };
  }

  function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r1, g1, b1;
    if (h < 60)       { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else              { r1 = c; g1 = 0; b1 = x; }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  function hexToHsv(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsv(r, g, b);
  }

  function refreshPreviews() {
    if (generatedData && generatedData.growthWidget) {
      widgets[1] = buildGrowthWidgetHtml(generatedData.growthWidget, currentTheme, lastPayload?.currentCoverage, lastPayload?.recommendedAddition);
      preview1.innerHTML = widgets[1];
      makeEditable(preview1, 'growth');
    }
    if (generatedData && generatedData.executiveSummary) {
      widgets[2] = buildExecSummaryHtml(generatedData.executiveSummary, currentTheme);
      preview2.innerHTML = widgets[2];
      makeEditable(preview2, 'exec');
    }
  }

  // ── Build payload ───────────────────────────────────
  function buildPayload() {
    return {
      clientName: clientNameEl.value.trim(),
      industry: industryEl.value,
      currentCoverage: [...currentCoverage],
      recommendedAddition: [...recommendedAdd],
      trigger: triggerSelectEl.value,
      triggerDetail: triggerDetailEl.value.trim(),
      includeExecutiveSummary: includeExecSummary
    };
  }

  function validate(payload) {
    if (!payload.industry) return 'Please select an industry.';
    if (!payload.currentCoverage.length) return 'Select at least one item under Current Coverage.';
    if (!payload.recommendedAddition.length) return "Select at least one new item under Recommended Addition — it can't overlap with Current Coverage.";
    if (!payload.trigger) return 'Please select a trigger.';
    return null;
  }

  // ── Generate ─────────────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();
    const err = validate(payload);
    if (err) { showError(err); return; }

    lastPayload = payload;

    // Show loading state at the target location, then scroll it into view
    emptyState.hidden = true;
    outputArea.hidden = true;
    loadingState.hidden = false;
    loadingMsg.textContent = 'Writing your account growth recommendation…';
    previewCol.scrollIntoView({ behavior: 'smooth', block: 'start' });

    generateBtn.disabled = true;

    try {
      const res = await fetch('/api/account-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');
      generatedData = { growthWidget: data.growthWidget, executiveSummary: data.executiveSummary };
      populateWidgets(payload);
    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = false;
      showError('Something went wrong: ' + e.message);
    } finally {
      generateBtn.disabled = false;
    }
  }

  function populateWidgets(payload) {
    widgets[1] = buildGrowthWidgetHtml(generatedData.growthWidget, currentTheme, payload.currentCoverage, payload.recommendedAddition);
    widgets[2] = buildExecSummaryHtml(generatedData.executiveSummary, currentTheme);

    preview1.innerHTML = widgets[1];
    makeEditable(preview1, 'growth');
    preview2.innerHTML = widgets[2];
    makeEditable(preview2, 'exec');

    widget2Block.hidden = !includeExecSummary;

    deliveryTitle.textContent = payload.clientName
      ? `${payload.clientName} — Account Growth`
      : `Account Growth Recommendation — ${payload.industry}`;

    loadingState.hidden = true;
    emptyState.hidden = true;
    outputArea.hidden = false;

    autoSave('generated');
  }

  // ── Widget HTML builders ────────────────────────────
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function gradientHeader(hex, kicker, title, subtitle) {
    return `<div style="background:linear-gradient(135deg, ${esc(darken(hex))} 0%, ${esc(hex)} 100%); background-image:linear-gradient(135deg, ${esc(darken(hex))} 0%, ${esc(hex)} 100%), radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px); background-size:auto, 14px 14px; padding:16px 20px 14px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:5px;">${esc(kicker)}</div>
      <div data-editable-id="headline" style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">${esc(title)}</div>
      ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;">${esc(subtitle)}</div>` : ''}
    </div>`;
  }

  function darken(hex) {
    const h = hex.replace('#', '');
    const r = Math.max(0, parseInt(h.substr(0,2),16) - 40);
    const g = Math.max(0, parseInt(h.substr(2,2),16) - 40);
    const b = Math.max(0, parseInt(h.substr(4,2),16) - 40);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  }

  function sectionLabel(text, hex) {
    return `<div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${esc(hex)};margin-bottom:6px;">${esc(text)}</div>`;
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Widget 1 visual — two cards (current vs recommended) joined by an arrow.
  // Table-based, inline-styled, no icon fonts — safe for TinyMCE/Salesbuildr.
  function buildJourneyCards(hex, currentList, recommendedList) {
    const left = (currentList || []).slice(0, 4).map(esc).join('<br>') || 'No current coverage selected';
    const right = (recommendedList || []).slice(0, 4).map(esc).join('<br>') || 'No additions selected';
    const accentBg = hexToRgba(hex, 0.08);

    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
  <tr>
    <td width="45%" style="vertical-align:top;padding:0 8px 0 0;">
      <div style="background:#f4f7fb;border:1px solid #e3e7ee;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;">Today</div>
        <div style="font-size:12px;color:#586273;line-height:1.7;">${left}</div>
      </div>
    </td>
    <td width="10%" style="text-align:center;vertical-align:middle;">
      <span style="font-size:20px;line-height:1;color:${esc(hex)};">&#8594;</span>
    </td>
    <td width="45%" style="vertical-align:top;padding:0 0 0 8px;">
      <div style="background:${accentBg};border:1px solid ${esc(hex)};border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${esc(hex)};margin-bottom:6px;">Recommended</div>
        <div style="font-size:12px;color:${esc(hex)};line-height:1.7;font-weight:600;">${right}</div>
      </div>
    </td>
  </tr>
</table>`;
  }

  // Widget 2 visual — a simple two-segment bar, "Today" vs "Recommended", no bullet detail.
  function buildJourneyBar(hex) {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
  <tr>
    <td width="42%" style="height:8px;font-size:0;line-height:0;background:#9ca3af;border-radius:6px 0 0 6px;">&nbsp;</td>
    <td width="43%" style="height:8px;font-size:0;line-height:0;background:${esc(hex)};">&nbsp;</td>
    <td width="15%" style="height:8px;font-size:0;line-height:0;background:#e3e7ee;border-radius:0 6px 6px 0;">&nbsp;</td>
  </tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
  <tr>
    <td width="42%" style="text-align:left;font-size:11px;color:#586273;">
      <strong style="color:#0b1220;">Today</strong><br>Foundational coverage
    </td>
    <td width="58%" style="text-align:right;font-size:11px;color:${esc(hex)};">
      <strong>Recommended</strong><br>Full-layer protection
    </td>
  </tr>
</table>`;
  }

  function buildGrowthWidgetHtml(d, hex, currentList, recommendedList) {
    const clientLine = d.clientName ? esc(d.clientName) : '';
    return `<div style="background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${esc(hex)};overflow:hidden;width:100%;font-family:Arial,Helvetica,sans-serif;">
  ${gradientHeader(hex, 'Account Growth Recommendation', d.headline || 'Your Next Step', clientLine)}
  <div style="padding:16px 20px;">
    ${buildJourneyCards(hex, currentList, recommendedList)}
    <div style="margin-bottom:16px;">
      ${sectionLabel('Where You Are Today', hex)}
      <p data-editable-id="currentState" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(d.currentState)}</p>
    </div>
    <div style="margin-bottom:16px;">
      ${sectionLabel('Why Now', hex)}
      <p data-editable-id="triggerContext" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(d.triggerContext)}</p>
    </div>
    <div style="margin-bottom:16px;">
      ${sectionLabel('The Recommendation', hex)}
      <p data-editable-id="recommendation" style="margin:0;font-size:13px;color:#0b1220;line-height:1.6;">${esc(d.recommendation)}</p>
    </div>
    <div>
      ${sectionLabel('What This Means for Your Business', hex)}
      <p data-editable-id="businessOutcome" style="margin:0;font-size:13px;color:#0b1220;line-height:1.6;font-weight:600;">${esc(d.businessOutcome)}</p>
    </div>
  </div>
  <div style="background:#f4f7fb;border-top:1px solid #e3e7ee;padding:8px 20px;">
    <span style="font-size:11px;color:#9ca3af;">Prepared for your review</span>
  </div>
</div>`;
  }

  function buildExecSummaryHtml(d, hex) {
    const clientLine = d.clientName ? esc(d.clientName) : '';
    return `<div style="background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${esc(hex)};overflow:hidden;width:100%;font-family:Arial,Helvetica,sans-serif;">
  ${gradientHeader(hex, 'IT Advisory Summary', d.headline || 'Executive Summary', clientLine)}
  <div style="padding:18px 20px;">
    ${buildJourneyBar(hex)}
    <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #e3e7ee;">
      ${sectionLabel('What We Manage Today', hex)}
      <p data-editable-id="snapshot" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(d.snapshot)}</p>
    </div>
    <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #e3e7ee;">
      ${sectionLabel('What We Recommend', hex)}
      <p data-editable-id="recommendation" style="margin:0;font-size:13px;color:#0b1220;line-height:1.6;font-weight:600;">${esc(d.recommendation)}</p>
    </div>
    <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #e3e7ee;">
      ${sectionLabel('Risk if Delayed', hex)}
      <p data-editable-id="riskIfDelayed" style="margin:0;font-size:13px;color:#b3760a;line-height:1.6;">${esc(d.riskIfDelayed)}</p>
    </div>
    <div>
      ${sectionLabel('Next Step', hex)}
      <p data-editable-id="nextStep" style="margin:0;font-size:13px;color:#0b1220;line-height:1.6;">${esc(d.nextStep)}</p>
    </div>
  </div>
</div>`;
  }

  // ── Contenteditable-in-place ─────────────────────────
  function makeEditable(frame, kind) {
    frame.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = 'Click to edit';
      el.addEventListener('input', () => {
        const id = el.dataset.editableId;
        if (kind === 'growth' && generatedData.growthWidget) generatedData.growthWidget[id] = el.textContent;
        if (kind === 'exec' && generatedData.executiveSummary) generatedData.executiveSummary[id] = el.textContent;
        widgets[kind === 'growth' ? 1 : 2] = getCleanHtml(frame);
        autoSave();
      });
    });
  }

  function getCleanHtml(frame) {
    const clone = frame.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    return clone.innerHTML;
  }

  // ── Regen / Copy / Push per widget ───────────────────
  async function onRegenWidget(i) {
    if (!lastPayload) return;
    const btn = $(`regenBtn${i}`);
    btn.disabled = true; btn.textContent = '…';
    try {
      const res = await fetch('/api/account-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenWidget: i === 1 ? 'growth' : 'exec' })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Regeneration failed.');
      if (i === 1) generatedData.growthWidget = data.growthWidget;
      if (i === 2) generatedData.executiveSummary = data.executiveSummary;
      refreshPreviews();
      autoSave();
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '↺ Regen';
    }
  }

  function onCopyWidget(i) {
    const btn = $(`copyBtn${i}`);
    navigator.clipboard.writeText(widgets[i] || '').then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }

  function getWidgetTitle(which) {
    const name = lastPayload?.clientName;
    if (which === 'growth') return name ? `${name} — Account Growth` : `Account Growth Recommendation — ${lastPayload?.industry || ''}`;
    return name ? `${name} — Executive Summary` : `Executive Summary — ${lastPayload?.industry || ''}`;
  }

  async function onPushSingle(i) {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) { credsInline.hidden = false; credsInline.scrollIntoView({ behavior: 'smooth' }); return; }
    const which = i === 1 ? 'growth' : 'exec';
    await executePush([{ title: getWidgetTitle(which), html: widgets[i] }], apiKey, tenantUrl, $(`pushBtn${i}`));
  }

  async function onPush(type) {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) { credsInline.hidden = false; credsInline.scrollIntoView({ behavior: 'smooth' }); return; }
    const list = [{ title: getWidgetTitle('growth'), html: widgets[1] }];
    if (includeExecSummary && widgets[2]) list.push({ title: getWidgetTitle('exec'), html: widgets[2] });
    if (type === 'pack') {
      const combined = list.map(w => w.html).join('\n\n');
      await executePush([{ title: getWidgetTitle('growth') + ' — Pack', html: combined }], apiKey, tenantUrl, pushPackBtn);
    } else {
      await executePush(list, apiKey, tenantUrl, pushPackBtn);
    }
  }

  async function onSaveAndPush() {
    const apiKey = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { showPushStatus('Enter API key and tenant URL.', 'err'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    const list = [{ title: getWidgetTitle('growth'), html: widgets[1] }];
    if (includeExecSummary && widgets[2]) list.push({ title: getWidgetTitle('exec'), html: widgets[2] });
    await executePush(list, apiKey, tenantUrl, pushPackBtn);
  }

  async function executePush(widgetList, apiKey, tenantUrl, triggerBtn) {
    const prevLabel = triggerBtn ? triggerBtn.textContent : null;
    if (triggerBtn) { triggerBtn.disabled = true; triggerBtn.textContent = 'Pushing…'; }

    const prefix = lastPayload?.clientName ? `${lastPayload.clientName} — Account Growth` : 'Account Growth Recommendation';

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: widgetList.map(w => ({ type: 'html', content: w.html, title: w.title })),
          prefix,
          apiKey,
          tenantUrl
        })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`✓ Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
        autoSave('pushed');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error. Check your credentials.'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + (e.message || 'Network error.'), 'err');
    } finally {
      if (triggerBtn) { triggerBtn.disabled = false; triggerBtn.textContent = prevLabel; }
    }
  }

  function onCopyAll() {
    const parts = [widgets[1] || ''];
    if (includeExecSummary && widgets[2]) parts.push(widgets[2]);
    navigator.clipboard.writeText(parts.join('\n\n')).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy All HTML', 2000);
    });
  }

  // ── UI helpers ───────────────────────────────────────
  function showError(msg) { formError.textContent = msg; formError.hidden = false; }
  function hideError() { formError.hidden = true; }
  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status ' + type;
    pushStatus.hidden = false;
    pushStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }

  // ── Sessions ─────────────────────────────────────────
  function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)  || '[]'); } catch { return []; } }
  function saveSessions(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { console.warn('Session save failed:', e); } }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

  let showingArchived = false;
  function onShowArchived() { showingArchived = !showingArchived; renderSessionCards(showingArchived); }

  function buildSessionSnapshot(status) {
    const payload = buildPayload();
    const safeStatus = ['draft', 'generated', 'pushed'].includes(status) ? status : 'draft';
    return {
      id: currentSessionId,
      clientName: payload.clientName || 'Unnamed client',
      industry: payload.industry,
      trigger: payload.trigger,
      savedAt: Date.now(),
      status: safeStatus,
      theme: currentTheme,
      includeExecSummary,
      formData: payload,
      widgets: JSON.parse(JSON.stringify(widgets)),
      generatedData: generatedData ? JSON.parse(JSON.stringify(generatedData)) : null,
      lastPayload
    };
  }

  function autoSave(status) {
    if (!autoSaveReady) return;
    if (!currentSessionId) currentSessionId = 'growth_session_' + Date.now();
    let sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    const storedStatus = sessions[idx]?.status;
    const snap = buildSessionSnapshot(status || storedStatus || 'draft');
    if (idx >= 0) sessions[idx] = snap; else sessions.unshift(snap);
    sessions = sessions.slice(0, 20);
    saveSessions(sessions);
    renderSessionCards();
    flashSaved();
  }

  function flashSaved() {
    autoSaveLabel.classList.add('visible');
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => autoSaveLabel.classList.remove('visible'), 1800);
  }

  function renderSessionCards(showArchived) {
    const sessions = getSessions();
    const archived = showArchived ? getArchived() : [];
    const toShow = showArchived ? [...sessions, ...archived] : sessions.slice(0, SESSION_LIMIT);
    if (!toShow.length && !sessions.length) { sessionsBlock.hidden = true; return; }
    sessionsBlock.hidden = false;
    sessionCards.innerHTML = '';
    toShow.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const statusClass = { draft: 'status-draft', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-draft';
      card.innerHTML = `
        <div class="session-card-info">
          <div class="session-card-company">${escHtml(sess.clientName)} <span style="color:var(--text-3);font-weight:400;">· ${escHtml(sess.industry || '')}</span></div>
          <div class="session-card-meta">${fmtAge(sess.savedAt)}</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${(sess.status || 'draft').toUpperCase()}</span>
          <button class="session-discard" data-id="${escHtml(sess.id)}" title="Archive">×</button>
        </div>`;
      card.addEventListener('click', () => resumeSession(sess));
      card.querySelector('.session-discard').addEventListener('click', e => { e.stopPropagation(); discardSession(sess.id, showArchived); });
      sessionCards.appendChild(card);
    });
    const hasMore = !showArchived && sessions.length > SESSION_LIMIT;
    if (hasMore) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:11px;color:var(--text-3);text-align:center;padding:4px;';
      more.textContent = `+ ${sessions.length - SESSION_LIMIT} more`;
      sessionCards.appendChild(more);
    }
    showArchivedBtn.textContent = showArchived ? 'Hide archived' : 'Show archived';
  }

  function discardSession(id, isArchived) {
    if (isArchived) {
      saveArchived(getArchived().filter(s => s.id !== id));
    } else {
      const sessions = getSessions();
      const target = sessions.find(s => s.id === id);
      saveSessions(sessions.filter(s => s.id !== id));
      if (target) saveArchived([target, ...getArchived()]);
    }
    renderSessionCards(isArchived);
  }

  function resumeSession(sess) {
    currentSessionId = sess.id;
    currentTheme = sess.theme || '#2e74dc';
    includeExecSummary = !!sess.includeExecSummary;
    widgets = sess.widgets || {};
    generatedData = sess.generatedData || null;
    lastPayload = sess.lastPayload || null;

    const fd = sess.formData || {};
    clientNameEl.value = fd.clientName || '';
    industryEl.value = fd.industry || '';
    triggerSelectEl.value = fd.trigger || '';
    triggerDetailEl.value = fd.triggerDetail || '';

    currentCoverage = new Set(fd.currentCoverage || []);
    recommendedAdd  = new Set(fd.recommendedAddition || []);
    refreshRecChipsDisabled();

    execToggle.dataset.state = includeExecSummary ? 'on' : 'off';
    execToggle.setAttribute('aria-checked', String(includeExecSummary));

    let matched = false;
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      const m = s.dataset.hex === currentTheme;
      s.classList.toggle('active', m);
      if (m) matched = true;
    });
    hexPreview.style.background = currentTheme;
    hexTriggerValue.textContent = currentTheme;

    if (generatedData) {
      populateWidgetsFromSession(fd);
    } else {
      outputArea.hidden = true;
      emptyState.hidden = false;
    }
    renderSessionCards();
  }

  function populateWidgetsFromSession(fd) {
    widgets[1] = buildGrowthWidgetHtml(generatedData.growthWidget, currentTheme, fd.currentCoverage, fd.recommendedAddition);
    widgets[2] = buildExecSummaryHtml(generatedData.executiveSummary, currentTheme);
    preview1.innerHTML = widgets[1];
    makeEditable(preview1, 'growth');
    preview2.innerHTML = widgets[2];
    makeEditable(preview2, 'exec');
    widget2Block.hidden = !includeExecSummary;
    deliveryTitle.textContent = fd.clientName ? `${fd.clientName} — Account Growth` : `Account Growth Recommendation — ${fd.industry || ''}`;
    emptyState.hidden = true;
    outputArea.hidden = false;
  }

  function startNewSession() {
    currentSessionId = 'growth_session_' + Date.now();
    autoSaveReady = true;
    currentTheme = '#2e74dc';
    currentCoverage = new Set();
    recommendedAdd = new Set();
    includeExecSummary = false;
    generatedData = null;
    widgets = {};
    lastPayload = null;

    clientNameEl.value = '';
    industryEl.value = '';
    triggerSelectEl.value = '';
    triggerDetailEl.value = '';
    refreshRecChipsDisabled();

    execToggle.dataset.state = 'off';
    execToggle.setAttribute('aria-checked', 'false');

    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === '#2e74dc'));
    hexPreview.style.background = '#2e74dc';
    hexTriggerValue.textContent = '#2e74dc';

    outputArea.hidden = true;
    emptyState.hidden = false;
    loadingState.hidden = true;
    widget2Block.hidden = true;
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    autoSave('draft');
  }

  function fmtAge(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 2) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
  function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  init();
})();
