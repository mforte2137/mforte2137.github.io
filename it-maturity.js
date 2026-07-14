/* =====================================================
   it-maturity.js
   IT Maturity Assessment Widget — frontend logic
   ===================================================== */

(function () {
  'use strict';

  const SESSION_KEY   = 'maturity_sessions';
  const ARCHIVE_KEY   = 'maturity_archived';
  const SESSION_LIMIT = 5;

  const LEVEL_LABELS = { 1: 'Reactive', 2: 'Managed', 3: 'Optimised', 4: 'Strategic' };

  const THEME_PRESETS = [
    '#2e74dc', '#7c3aed', '#059669', '#dc2626',
    '#ea580c', '#0891b2', '#c026d3', '#334155'
  ];

  const DIMENSIONS = [
    {
      key: 'security',
      label: 'Security',
      what: 'Endpoint protection, email security, identity controls, staff awareness, incident response.',
      helper: {
        1: 'Basic antivirus only, no MFA, no formal incident response, staff not trained',
        2: 'EDR in place, MFA on key accounts, basic email filtering, occasional training',
        3: 'Full security stack, MFA everywhere, regular training and testing, documented IR plan',
        4: 'MDR/SOC coverage, continuous monitoring, security-led decisions, measurable risk reduction'
      }
    },
    {
      key: 'continuity',
      label: 'Business Continuity',
      what: 'Backup quality, disaster recovery planning, business continuity testing.',
      helper: {
        1: 'Backups exist but untested, no DR plan, recovery time unknown',
        2: 'Regular backups, some testing, basic DR documentation',
        3: 'Tested backup and DR, defined RTOs/RPOs, documented BC plan',
        4: 'Automated failover, regular DR testing, BC integrated into business planning'
      }
    },
    {
      key: 'productivity',
      label: 'Productivity & Cloud',
      what: 'Microsoft 365 or equivalent, device management, collaboration, remote working capability.',
      helper: {
        1: 'Legacy tools, limited collaboration, inconsistent device management',
        2: 'Microsoft 365 in place, basic MDM, some remote working capability',
        3: 'M365 well-configured, Intune/MDM active, collaboration tools adopted, regular updates',
        4: 'Full cloud adoption, AI-enabled productivity tools, optimised licensing, measurable productivity gains'
      }
    },
    {
      key: 'compliance',
      label: 'Compliance & Risk',
      what: 'HIPAA, GDPR, Cyber Essentials, SOC 2, cyber insurance readiness.',
      helper: {
        1: 'No formal compliance posture, unknown insurance gaps, undocumented risk',
        2: 'Basic awareness of requirements, some controls in place, insurance held but posture uncertain',
        3: 'Relevant framework addressed, controls documented, cyber insurance aligned to posture',
        4: 'Continuous compliance monitoring, audit-ready, compliance as competitive advantage'
      }
    },
    {
      key: 'strategicAlignment',
      label: 'Strategic Alignment',
      what: 'vCIO engagement, IT roadmap, technology contributing to business goals.',
      helper: {
        1: 'IT is a cost centre, no strategic planning, technology decisions reactive',
        2: 'Basic IT planning, some vendor management, IT discussed at management level occasionally',
        3: 'Regular technology reviews, IT roadmap in place, technology decisions linked to business goals',
        4: 'IT is a competitive advantage, vCIO-level advisory, technology driving measurable business outcomes'
      }
    }
  ];

  // ── State ──────────────────────────────────────────
  let currentSessionId = null;
  let autoSaveReady    = false;
  let currentTheme     = '#2e74dc';

  const state = {
    clientName: '',
    industry: '',
    companySize: '',
    ratings: {},
    targets: {},
    targetOverridden: {},
    narrative: '',
    generated: false
  };

  DIMENSIONS.forEach(d => { state.ratings[d.key] = 1; });

  // ── DOM refs ───────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const sessionsBlock   = $('sessionsBlock');
  const sessionCards    = $('sessionCards');
  const autoSaveLabel   = $('autoSaveLabel');
  const showArchivedBtn = $('showArchivedBtn');
  const newSessionBtn   = $('newSessionBtn');

  const clientNameEl  = $('clientName');
  const industryEl    = $('industry');
  const companySizeEl = $('companySize');
  const dimensionsHost = $('dimensionsHost');

  const errorBox     = $('errorBox');
  const generateBtn  = $('generateBtn');
  const loadingState = $('loadingState');

  const outputArea  = $('outputArea');
  const emptyState  = $('emptyState');
  const colourSwatches    = $('colourSwatches');
  const nativeColorPicker = $('nativeColorPicker');
  const hexInput          = $('hexInput');
  const overrideGrid = $('overrideGrid');
  const widgetCanvas = $('widgetCanvas');

  const regenBtn = $('regenBtn');
  const copyBtn  = $('copyBtn');
  const pushBtn  = $('pushBtn');
  const pushStatus = $('pushStatus');

  const credsModal     = $('credsModal');
  const credApiKey     = $('credApiKey');
  const credTenantUrl  = $('credTenantUrl');
  const credsCancelBtn = $('credsCancelBtn');
  const credsSaveBtn   = $('credsSaveBtn');

  let showingArchived = false;

  // ── Init ───────────────────────────────────────────
  function init() {
    renderDimensions();
    renderSwatches();

    clientNameEl.addEventListener('input', () => { state.clientName = clientNameEl.value; autoSave(); });
    industryEl.addEventListener('change', () => { state.industry = industryEl.value; autoSave(); });
    companySizeEl.addEventListener('change', () => { state.companySize = companySizeEl.value; autoSave(); });

    generateBtn.addEventListener('click', onGenerate);
    regenBtn.addEventListener('click', onRegenerateNarrative);
    copyBtn.addEventListener('click', onCopyHtml);
    pushBtn.addEventListener('click', onPushClick);
    showArchivedBtn.addEventListener('click', onShowArchived);
    newSessionBtn.addEventListener('click', startNewSession);

    nativeColorPicker.addEventListener('input', () => setTheme(nativeColorPicker.value));
    hexInput.addEventListener('input', onHexInputChange);

    credsCancelBtn.addEventListener('click', () => { credsModal.hidden = true; });
    credsSaveBtn.addEventListener('click', onCredsSave);

    const sessions = getSessions();
    renderSessionCards();
    if (sessions.length) {
      resumeSession(sessions[0]);
    } else {
      startNewSession();
    }
    autoSaveReady = true;
  }

  // ── Dimension rows ──────────────────────────────────
  function renderDimensions() {
    dimensionsHost.innerHTML = '';
    DIMENSIONS.forEach((d, idx) => {
      const row = document.createElement('div');
      row.className = 'dimension';
      row.innerHTML = `
        <div class="dimension-head">
          <span class="dimension-name">${idx + 1}. ${esc(d.label)}</span>
          <select class="dimension-select" id="dim-${d.key}">
            <option value="1">1 — Reactive</option>
            <option value="2">2 — Managed</option>
            <option value="3">3 — Optimised</option>
            <option value="4">4 — Strategic</option>
          </select>
        </div>
        <div class="dimension-what">${esc(d.what)}</div>
        <div class="helper-text" id="helper-${d.key}"></div>
      `;
      dimensionsHost.appendChild(row);

      const sel = row.querySelector(`#dim-${d.key}`);
      sel.value = String(state.ratings[d.key]);
      updateHelperText(d.key);
      sel.addEventListener('change', () => {
        state.ratings[d.key] = parseInt(sel.value, 10);
        updateHelperText(d.key);
        if (state.generated) {
          // Never let target fall below current — clamp, then re-render bars live
          if (state.targets[d.key] < state.ratings[d.key]) {
            state.targets[d.key] = state.ratings[d.key];
            syncOverrideSelect(d.key);
          }
          renderPreview();
        }
        autoSave();
      });
    });
  }

  function updateHelperText(key) {
    const dim = DIMENSIONS.find(d => d.key === key);
    const level = state.ratings[key];
    $(`helper-${key}`).textContent = dim.helper[level];
  }

  // ── Generate ─────────────────────────────────────────
  async function onGenerate() {
    hideError();
    state.clientName  = clientNameEl.value.trim();
    state.industry    = industryEl.value;
    state.companySize = companySizeEl.value;

    if (!state.clientName) return showError('Client name is required.');
    if (!state.industry) return showError('Industry is required.');
    if (!state.companySize) return showError('Company size is required.');

    outputArea.hidden = true;
    emptyState.hidden = true;
    loadingState.hidden = false;
    $('previewAnchor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    generateBtn.disabled = true;

    try {
      const res = await fetch('/api/it-maturity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: state.clientName,
          industry: state.industry,
          companySize: state.companySize,
          ratings: state.ratings
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');

      state.targets = data.targets;
      state.targetOverridden = {};
      DIMENSIONS.forEach(d => { state.targetOverridden[d.key] = false; });
      state.narrative = data.narrative;
      state.generated = true;

      renderOverrideGrid();
      renderPreview();

      emptyState.hidden = true;
      outputArea.hidden = false;
      autoSave('generated');
    } catch (e) {
      showError(e.message);
      emptyState.hidden = false;
    } finally {
      loadingState.hidden = true;
      generateBtn.disabled = false;
    }
  }

  async function onRegenerateNarrative() {
    if (!state.generated) return;
    regenBtn.disabled = true;
    regenBtn.textContent = '…';
    try {
      const res = await fetch('/api/it-maturity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: state.clientName,
          industry: state.industry,
          companySize: state.companySize,
          ratings: state.ratings
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Regeneration failed.');

      state.narrative = data.narrative;
      // Keep any MSP-overridden targets; adopt fresh AI targets only where not overridden
      DIMENSIONS.forEach(d => {
        if (!state.targetOverridden[d.key]) state.targets[d.key] = data.targets[d.key];
      });
      renderOverrideGrid();
      renderPreview();
      autoSave();
    } catch (e) {
      showError(e.message);
    } finally {
      regenBtn.disabled = false;
      regenBtn.textContent = '↺ Regenerate Narrative';
    }
  }

  function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
  function hideError() { errorBox.hidden = true; }

  // ── Target overrides ─────────────────────────────────
  function renderOverrideGrid() {
    overrideGrid.innerHTML = '';
    DIMENSIONS.forEach(d => {
      const field = document.createElement('div');
      field.className = 'override-field';
      field.innerHTML = `
        <label>${esc(d.label)}</label>
        <select id="override-${d.key}">
          <option value="1">1 — Reactive</option>
          <option value="2">2 — Managed</option>
          <option value="3">3 — Optimised</option>
          <option value="4">4 — Strategic</option>
        </select>
      `;
      overrideGrid.appendChild(field);
      const sel = field.querySelector('select');
      sel.value = String(state.targets[d.key]);
      sel.addEventListener('change', () => {
        state.targets[d.key] = parseInt(sel.value, 10);
        state.targetOverridden[d.key] = true;
        // Target should never sit below current
        if (state.targets[d.key] < state.ratings[d.key]) {
          state.targets[d.key] = state.ratings[d.key];
          sel.value = String(state.targets[d.key]);
        }
        renderPreview();
        autoSave();
      });
    });
  }

  function syncOverrideSelect(key) {
    const sel = $(`override-${key}`);
    if (sel) sel.value = String(state.targets[key]);
  }

  // ── Colour theme ─────────────────────────────────────
  function renderSwatches() {
    colourSwatches.innerHTML = '';
    THEME_PRESETS.forEach(hex => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = hex;
      b.dataset.hex = hex;
      if (hex === currentTheme) b.classList.add('active');
      b.addEventListener('click', () => setTheme(hex));
      colourSwatches.appendChild(b);
    });
  }

  function setTheme(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    currentTheme = hex;
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === hex));
    nativeColorPicker.value = hex;
    hexInput.value = hex;
    if (state.generated) renderPreview();
    autoSave();
  }

  function onHexInputChange() {
    const val = hexInput.value.trim();
    const normalised = val.startsWith('#') ? val : '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(normalised)) setTheme(normalised);
  }

  // ── Bar segment math (client-side, real-time) ────────
  function severityColor(gap) {
    if (gap <= 0) return '#15a05a';
    if (gap === 1) return currentTheme;
    if (gap === 2) return '#b3760a';
    return '#d8402e';
  }

  function computeSegments(current, target) {
    const gap = target - current;
    const color = severityColor(gap);
    const filledPct    = (current / 4) * 100;
    const targetPct    = gap > 0 ? (gap / 4) * 100 : 0;
    const remainderPct = 100 - filledPct - targetPct;
    return { filledPct, targetPct, remainderPct, color, gap };
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function pillBadge(text, color, outline) {
    return outline
      ? `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;border:1.5px solid ${color};color:${color};background:#ffffff;white-space:nowrap;">${esc(text)}</span>`
      : `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:${hexToRgba(color, 0.14)};color:${color};white-space:nowrap;">${esc(text)}</span>`;
  }

  // Small text-based "you are here / target" scale — one cell, so it never
  // trips the "max 3 columns" TinyMCE stacking rule, and it's what actually
  // tells the reader what the bar length *means* on the 4-point ladder.
  function buildRungLine(current, target, color) {
    const parts = [1, 2, 3, 4].map(l => {
      const label = LEVEL_LABELS[l];
      if (l === current) return `<span style="font-size:9.5px;font-weight:700;color:${color};">&#9679; ${esc(label)}</span>`;
      if (l === target && target !== current) return `<span style="font-size:9.5px;font-weight:700;color:${color};">&#9650; ${esc(label)}</span>`;
      return `<span style="font-size:9.5px;color:#c2c8d1;">${esc(label)}</span>`;
    });
    return parts.join('<span style="font-size:9.5px;color:#dde1e8;"> &middot; </span>');
  }

  function buildBarRow(label, current, target) {
    const seg = computeSegments(current, target);
    const { color, gap, filledPct, targetPct, remainderPct } = seg;
    const toTargetPct = filledPct + targetPct;

    // Header: dimension name + current-level badge (severity colour) +
    // either an outlined target badge, or an on-track tag if gap <= 0.
    const currentBadge = pillBadge(LEVEL_LABELS[current], color, false);
    const targetBadgeOrTag = gap > 0
      ? `<span style="font-size:11px;color:#9ca3af;margin:0 5px;">&rarr;</span>${pillBadge(LEVEL_LABELS[target], color, true)}`
      : `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#dcfce7;color:#15a05a;margin-left:6px;white-space:nowrap;">&#10003; On target</span>`;

    // Ruler row — a small down-caret sitting exactly at the target boundary,
    // directly above the bar, so the goal position is marked, not implied.
    const rulerRow = gap > 0 ? `
  <tr>
    <td width="${toTargetPct}%" style="text-align:right;padding:0 3px 2px 0;">
      <span style="font-size:9px;font-weight:700;color:${color};white-space:nowrap;">&#9660; Target</span>
    </td>
    <td width="${remainderPct}%"></td>
  </tr>` : '';

    // Bar — current fill is solid severity colour; the path-to-target segment
    // is the same colour at low opacity AND closed off with a solid border in
    // that colour, so the target boundary is a visible line, not a guess.
    const cells = [];
    if (filledPct > 0) {
      cells.push(`<td width="${filledPct}%" style="background:${color};height:14px;"></td>`);
    }
    if (targetPct > 0) {
      cells.push(`<td width="${targetPct}%" style="background:${hexToRgba(color, 0.38)};height:14px;border-left:2px solid #fff;border-right:3px solid ${color};"></td>`);
    }
    if (remainderPct > 0) {
      const needsDivider = targetPct === 0 && filledPct > 0;
      cells.push(`<td width="${remainderPct}%" style="background:#e5e7eb;height:14px;${needsDivider ? 'border-left:2px solid #fff;' : ''}"></td>`);
    }

    const rungLine = buildRungLine(current, target, color);

    return `
<table width="100%" style="border-collapse:collapse;margin-bottom:18px;">
  <tr>
    <td style="padding:0 0 5px 0;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0b1220;">${esc(label)}</span>
      <span style="float:right;">${currentBadge}${targetBadgeOrTag}</span>
    </td>
  </tr>${rulerRow}
  <tr>
    <td style="padding:0;">
      <table width="100%" style="border-collapse:collapse;border-radius:6px;overflow:hidden;height:14px;">
        <tr>${cells.join('')}</tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:5px 0 0;">${rungLine}</td>
  </tr>
</table>`;
  }

  // ── Overall maturity score (headline circle) ─────────
  function computeOverallScore() {
    const currents = DIMENSIONS.map(d => state.ratings[d.key]);
    const targets  = DIMENSIONS.map(d => state.targets[d.key] != null ? state.targets[d.key] : state.ratings[d.key]);
    const avgCurrent = currents.reduce((a, b) => a + b, 0) / currents.length;
    const avgTarget  = targets.reduce((a, b) => a + b, 0) / targets.length;
    const scoreOf10  = Math.max(0, Math.min(10, (avgCurrent / 4) * 10));
    const targetOf10 = Math.max(0, Math.min(10, (avgTarget / 4) * 10));
    const gapRounded = Math.round(avgTarget - avgCurrent);
    const color = severityColor(gapRounded);
    return {
      scoreDisplay: scoreOf10.toFixed(1),
      targetDisplay: targetOf10.toFixed(1),
      color
    };
  }

  function buildScoreBand() {
    const { scoreDisplay, targetDisplay, color } = computeOverallScore();
    return `
<table width="100%" style="border-collapse:collapse;background:#f4f7fb;margin-bottom:16px;">
  <tr>
    <td style="padding:16px 18px;vertical-align:middle;width:64%;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#586273;margin-bottom:4px;">Your Maturity Score</div>
      <div style="font-size:12px;color:#9ca3af;line-height:1.5;">Average across all five dimensions &middot; target ${targetDisplay} / 10</div>
    </td>
    <td style="padding:14px 18px;text-align:center;width:36%;">
      <div style="width:92px;height:92px;border-radius:50%;border:6px solid ${color};background:#ffffff;margin:0 auto;">
        <table style="width:100%;height:100%;border-collapse:collapse;">
          <tr>
            <td style="text-align:center;vertical-align:middle;">
              <div style="font-size:24px;font-weight:800;color:#0b1220;line-height:1;">${esc(scoreDisplay)}</div>
              <div style="font-size:9px;color:#9ca3af;margin-top:2px;">out of 10</div>
            </td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
</table>`;
  }

  // ── Full widget HTML ─────────────────────────────────
  function buildWidgetHtml() {
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const bars = DIMENSIONS.map(d => buildBarRow(d.label, state.ratings[d.key], state.targets[d.key])).join('');

    return `<div style="background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;width:100%;font-family:'Source Sans Pro',Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#1a3a6e 0%,${currentTheme} 100%);padding:16px 18px 14px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:4px;">IT Maturity Assessment</div>
    <div style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">${esc(state.clientName)}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px;">${esc(state.industry)} &middot; ${dateStr}</div>
  </div>
  <div style="padding:16px 18px 0;">
    ${buildScoreBand()}
  </div>
  <div style="padding:0 18px 4px;">
    ${bars}
  </div>
  <div style="padding:6px 18px 18px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${currentTheme};margin-bottom:6px;">Assessment Summary</div>
    <p data-editable-id="narrative" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(state.narrative)}</p>
  </div>
</div>`;
  }

  function renderPreview() {
    widgetCanvas.innerHTML = buildWidgetHtml();
    makeEditable(widgetCanvas);
  }

  function makeEditable(canvas) {
    const el = canvas.querySelector('[data-editable-id="narrative"]');
    if (!el) return;
    el.setAttribute('contenteditable', 'true');
    el.title = 'Click to edit';
    el.addEventListener('input', () => {
      state.narrative = el.textContent;
      autoSave();
    });
  }

  function getCleanHtml() {
    const clone = widgetCanvas.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    return clone.innerHTML;
  }

  // ── Copy / Push ──────────────────────────────────────
  function onCopyHtml() {
    navigator.clipboard.writeText(getCleanHtml()).then(() => {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy HTML'; }, 2000);
    });
  }

  function onPushClick() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credApiKey.value = apiKey || '';
      credTenantUrl.value = tenantUrl || '';
      credsModal.hidden = false;
      return;
    }
    pushWidget(apiKey, tenantUrl);
  }

  function onCredsSave() {
    const apiKey = credApiKey.value.trim();
    const tenantUrl = credTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) return;
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsModal.hidden = true;
    pushWidget(apiKey, tenantUrl);
  }

  async function pushWidget(apiKey, tenantUrl) {
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing…';
    const title = state.clientName
      ? `${state.clientName} — IT Maturity Assessment`
      : `IT Maturity Assessment — ${state.industry || ''}`;
    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: [{ type: 'html', content: getCleanHtml(), html: getCleanHtml(), title, id: 1 }],
          prefix: title,
          apiKey,
          tenantUrl
        })
      });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus('ok', 'Pushed to Salesbuildr ✓');
        autoSave('pushed');
      } else {
        throw new Error((data.results && data.results[0] && data.results[0].error) || data.error || 'Push failed.');
      }
    } catch (e) {
      showPushStatus('err', 'Push failed: ' + e.message);
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push to Salesbuildr';
    }
  }

  function showPushStatus(type, msg) {
    pushStatus.className = 'push-status ' + type;
    pushStatus.textContent = msg;
    pushStatus.hidden = false;
    pushStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }

  // ── Sessions ─────────────────────────────────────────
  function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)  || '[]'); } catch { return []; } }
  function saveSessions(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { console.warn('Session save failed:', e); } }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

  function onShowArchived() {
    showingArchived = !showingArchived;
    renderSessionCards(showingArchived);
  }

  function buildSessionSnapshot(status) {
    const safeStatus = ['draft', 'generated', 'pushed'].includes(status) ? status : 'draft';
    return {
      id: currentSessionId,
      clientName: state.clientName || 'Unnamed client',
      industry: state.industry,
      companySize: state.companySize,
      savedAt: Date.now(),
      status: safeStatus,
      theme: currentTheme,
      ratings: { ...state.ratings },
      targets: { ...state.targets },
      targetOverridden: { ...state.targetOverridden },
      narrative: state.narrative,
      generated: state.generated
    };
  }

  function autoSave(status) {
    if (!autoSaveReady) return;
    if (!currentSessionId) currentSessionId = 'maturity_session_' + Date.now();
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
          <div class="session-card-company">${esc(sess.clientName)} <span style="color:var(--text-3);font-weight:400;">&middot; ${esc(sess.industry || '')}</span></div>
          <div class="session-card-meta">${fmtAge(sess.savedAt)}</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${(sess.status || 'draft').toUpperCase()}</span>
          <button class="session-discard" data-id="${esc(sess.id)}" title="Archive">×</button>
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
    state.clientName = sess.clientName === 'Unnamed client' ? '' : (sess.clientName || '');
    state.industry = sess.industry || '';
    state.companySize = sess.companySize || '';
    state.ratings = sess.ratings || {};
    DIMENSIONS.forEach(d => { if (!state.ratings[d.key]) state.ratings[d.key] = 1; });
    state.targets = sess.targets || {};
    state.targetOverridden = sess.targetOverridden || {};
    state.narrative = sess.narrative || '';
    state.generated = !!sess.generated;

    clientNameEl.value = state.clientName;
    industryEl.value = state.industry;
    companySizeEl.value = state.companySize;

    DIMENSIONS.forEach(d => {
      const sel = $(`dim-${d.key}`);
      if (sel) sel.value = String(state.ratings[d.key]);
      updateHelperText(d.key);
    });

    renderSwatches();
    nativeColorPicker.value = currentTheme;
    hexInput.value = currentTheme;

    if (state.generated) {
      renderOverrideGrid();
      renderPreview();
      emptyState.hidden = true;
      outputArea.hidden = false;
    } else {
      outputArea.hidden = true;
      emptyState.hidden = false;
    }
    renderSessionCards();
  }

  function startNewSession() {
    currentSessionId = 'maturity_session_' + Date.now();
    autoSaveReady = true;
    currentTheme = '#2e74dc';

    state.clientName = '';
    state.industry = '';
    state.companySize = '';
    state.ratings = {};
    DIMENSIONS.forEach(d => { state.ratings[d.key] = 1; });
    state.targets = {};
    state.targetOverridden = {};
    state.narrative = '';
    state.generated = false;

    clientNameEl.value = '';
    industryEl.value = '';
    companySizeEl.value = '';

    DIMENSIONS.forEach(d => {
      const sel = $(`dim-${d.key}`);
      if (sel) sel.value = '1';
      updateHelperText(d.key);
    });

    renderSwatches();
    nativeColorPicker.value = currentTheme;
    hexInput.value = currentTheme;

    outputArea.hidden = true;
    emptyState.hidden = false;
    loadingState.hidden = true;
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

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init();
})();
