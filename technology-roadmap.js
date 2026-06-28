/* =============================================
   Technology Roadmap Builder — Frontend JS
   ============================================= */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────
  const SESSION_KEY   = 'roadmap_sessions';
  const ARCHIVE_KEY   = 'roadmap_sessions_archived';
  const SESSION_LIMIT = 5;
  const ARCHIVE_DAYS  = 30;
  const WIDGET_IDS    = [1, 2, 3, 4];

  const SERVICE_LIBRARY = [
    { group: 'Security', services: [
      'Endpoint Detection & Response (EDR)',
      'Security Awareness Training',
      'Multi-Factor Authentication (MFA)',
      'Email Security & Anti-Phishing',
      'Dark Web Monitoring',
      'Penetration Testing',
      'Cyber Insurance Review',
      'Zero Trust Network Access'
    ]},
    { group: 'Infrastructure', services: [
      'Cloud Migration',
      'Server Refresh / Replacement',
      'Network Upgrade',
      'Wireless Infrastructure',
      'SD-WAN / SASE',
      'Disaster Recovery Planning',
      'UPS / Power Protection'
    ]},
    { group: 'Productivity', services: [
      'Microsoft 365 Deployment / Migration',
      'Google Workspace Migration',
      'VoIP / UCaaS',
      'Document Management',
      'Collaboration Tools'
    ]},
    { group: 'Management & Support', services: [
      'Managed Detection & Response (MDR)',
      '24/7 Helpdesk',
      'Patch Management',
      'Remote Monitoring & Management',
      'IT Asset Management',
      'Virtual CIO (vCIO) Services'
    ]},
    { group: 'Compliance', services: [
      'HIPAA Compliance Programme',
      'Cyber Essentials Certification',
      'ISO 27001 Preparation',
      'SOC 2 Readiness',
      'GDPR Compliance Review'
    ]}
  ];

  // ── State ──────────────────────────────────
  let currentTheme     = '#0f1f3d';
  let currentClientType = 'prospect';
  let widgets          = {};
  let currentSessionId = null;
  let lastPayload      = null;
  // Per-phase: { services: Set, customServices: [] }
  let phaseState       = { 1: { services: new Set(), custom: [] }, 2: { services: new Set(), custom: [] }, 3: { services: new Set(), custom: [] } };

  // ── DOM refs ───────────────────────────────
  const $ = id => document.getElementById(id);

  const sessionsBlock    = $('sessionsBlock');
  const sessionCards     = $('sessionCards');
  const showArchivedBtn  = $('showArchivedBtn');
  const newRoadmapBtn    = $('newRoadmapBtn');

  const clientNameEl    = $('clientName');
  const industryEl      = $('industry');
  const companySizeEl   = $('companySize');
  const locationCountEl = $('locationCount');
  const clientTypeToggle = $('clientTypeToggle');

  const stackCompliance  = $('stackCompliance');
  const complianceCertGroup = $('complianceCertGroup');

  const colourSwatches  = $('colourSwatches');
  const customHex       = $('customHex');
  const hexPreview      = $('hexPreview');

  const generateBtn     = $('generateBtn');
  const formError       = $('formError');
  const loadingOverlay  = $('loadingOverlay');
  const loadingMsg      = $('loadingMsg');
  const outputArea      = $('outputArea');
  const deliveryTitle   = $('deliveryTitle');
  const autoSaveLabel   = $('autoSaveLabel');

  const pushPackBtn       = $('pushPackBtn');
  const pushIndividualBtn = $('pushIndividualBtn');
  const copyAllBtn        = $('copyAllBtn');
  const pushStatus        = $('pushStatus');
  const credsInline       = $('credsInline');
  const pushApiKey        = $('pushApiKey');
  const pushTenantUrl     = $('pushTenantUrl');
  const saveAndPushBtn    = $('saveAndPushBtn');

  // ── Init ───────────────────────────────────
  function init() {
    // Collapsible sections
    document.querySelectorAll('.collapsible-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const body   = $(target);
        const isOpen = !body.classList.contains('collapsed');
        body.classList.toggle('collapsed', isOpen);
        btn.classList.toggle('collapsed', isOpen);
      });
    });

    // Client type toggle
    clientTypeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clientTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentClientType = btn.dataset.val;
        autoSave();
      });
    });

    // Compliance cert reveal
    stackCompliance.addEventListener('change', () => {
      complianceCertGroup.hidden = stackCompliance.value !== 'Certified';
      autoSave();
    });

    // Goals chips
    $('goalsChips').querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        if (chip.dataset.val === 'custom') {
          chip.classList.toggle('active');
          $('customGoalWrap').hidden = !chip.classList.contains('active');
        } else {
          chip.classList.toggle('active');
        }
        autoSave();
      });
    });

    // Constraint chips
    $('constraintChips').querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        autoSave();
      });
    });

    // Colour swatches
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => selectSwatch(s));
    });
    customHex.addEventListener('input', onCustomHex);

    // Service pickers for each phase
    [1, 2, 3].forEach(p => buildServicePicker(p));

    // Form auto-save on change
    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('change', autoSave);
      el.addEventListener('input', autoSave);
    });

    // Widget editors
    WIDGET_IDS.forEach(i => {
      const ed = $(`widget${i}Editor`);
      if (ed) {
        ed.addEventListener('input', function () {
          widgets[i] = this.value;
          renderPreview(i);
          autoSave();
        });
      }
      const regenBtn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
      const copyBtn  = document.querySelector(`.widget-copy[data-widget="${i}"]`);
      const htmlBtn  = document.querySelector(`.show-html-btn[data-widget="${i}"]`);
      if (regenBtn) regenBtn.addEventListener('click', () => onRegenWidget(i));
      if (copyBtn)  copyBtn.addEventListener('click',  () => onCopyWidget(i));
      if (htmlBtn)  htmlBtn.addEventListener('click',  () => onToggleHtml(i));
    });

    // Generate
    generateBtn.addEventListener('click', onGenerate);

    // Push / copy
    pushPackBtn.addEventListener('click',       () => onPush('pack'));
    pushIndividualBtn.addEventListener('click', () => onPush('individual'));
    copyAllBtn.addEventListener('click',        onCopyAll);
    saveAndPushBtn.addEventListener('click',    onSaveAndPush);

    // Session management
    newRoadmapBtn.addEventListener('click', startNewSession);
    showArchivedBtn.addEventListener('click', onShowArchived);

    // Load most recent session or show session picker
    renderSessionCards();
    const sessions = getSessions();
    if (sessions.length) {
      sessionsBlock.hidden = false;
      // auto-resume most recent
      resumeSession(sessions[0]);
    }
  }

  // ── Service picker ──────────────────────────
  function buildServicePicker(phase) {
    const listEl     = $(`list${phase}`);
    const selectedEl = $(`selected${phase}`);
    const searchEl   = document.querySelector(`.service-search[data-phase="${phase}"]`);
    const addBtn     = document.querySelector(`.custom-service-add[data-phase="${phase}"]`);
    const customIn   = $(`customService${phase}`);

    // Build grouped list
    SERVICE_LIBRARY.forEach(group => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'service-group-label';
      groupLabel.textContent = group.group;
      listEl.appendChild(groupLabel);

      group.services.forEach(svc => {
        const row = document.createElement('label');
        row.className = 'service-item';
        row.dataset.name = svc.toLowerCase();
        row.dataset.group = group.group;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = svc;
        const span = document.createElement('span');
        span.textContent = svc;
        row.appendChild(cb);
        row.appendChild(span);

        cb.addEventListener('change', () => {
          if (cb.checked) {
            phaseState[phase].services.add(svc);
          } else {
            phaseState[phase].services.delete(svc);
          }
          renderSelectedTags(phase);
          autoSave();
        });

        listEl.appendChild(row);
      });
    });

    // Search filter
    searchEl.addEventListener('input', () => {
      const q = searchEl.value.toLowerCase().trim();
      listEl.querySelectorAll('.service-item').forEach(row => {
        const match = !q || row.dataset.name.includes(q);
        row.classList.toggle('hidden-item', !match);
      });
      // Hide group labels when all their items are hidden
      listEl.querySelectorAll('.service-group-label').forEach(label => {
        const group = label.textContent;
        const anyVisible = [...listEl.querySelectorAll(`.service-item[data-group="${group}"]`)]
          .some(r => !r.classList.contains('hidden-item'));
        label.style.display = anyVisible ? '' : 'none';
      });
    });

    // Custom service add
    function addCustom() {
      const val = customIn.value.trim();
      if (!val) return;
      if (!phaseState[phase].custom.includes(val)) {
        phaseState[phase].custom.push(val);
        phaseState[phase].services.add(val);
      }
      customIn.value = '';
      renderSelectedTags(phase);
      autoSave();
    }
    addBtn.addEventListener('click', addCustom);
    customIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } });
  }

  function renderSelectedTags(phase) {
    const el = $(`selected${phase}`);
    el.innerHTML = '';
    phaseState[phase].services.forEach(svc => {
      const tag = document.createElement('span');
      tag.className = 'service-tag';
      tag.innerHTML = `${escHtml(svc)} <button class="service-tag-remove" title="Remove">×</button>`;
      tag.querySelector('.service-tag-remove').addEventListener('click', () => {
        phaseState[phase].services.delete(svc);
        // Also uncheck in list if it's a preset
        const cb = $(`list${phase}`)?.querySelector(`input[value="${CSS.escape(svc)}"]`);
        if (cb) cb.checked = false;
        // Remove from custom if custom
        phaseState[phase].custom = phaseState[phase].custom.filter(c => c !== svc);
        renderSelectedTags(phase);
        autoSave();
      });
      el.appendChild(tag);
    });
  }

  // ── Colour ──────────────────────────────────
  function selectSwatch(el) {
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    currentTheme = el.dataset.hex;
    customHex.value = '';
    hexPreview.style.background = 'transparent';
    refreshPreviews();
    autoSave();
  }
  function onCustomHex() {
    const val = customHex.value.trim();
    if (/^[0-9A-Fa-f]{6}$/.test(val)) {
      currentTheme = '#' + val;
      hexPreview.style.background = currentTheme;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      refreshPreviews();
      autoSave();
    }
  }
  function refreshPreviews() {
    WIDGET_IDS.forEach(i => { if (widgets[i]) renderPreview(i); });
  }

  // ── Build payload ───────────────────────────
  function buildPayload() {
    return {
      clientName:    clientNameEl.value.trim(),
      clientType:    currentClientType,
      industry:      industryEl.value,
      companySize:   companySizeEl.value,
      locationCount: locationCountEl.value,
      stack: {
        endpoints:    $('stackEndpoints').value,
        email:        $('stackEmail').value,
        security:     $('stackSecurity').value,
        backup:       $('stackBackup').value,
        connectivity: $('stackConnectivity').value,
        server:       $('stackServer').value,
        remote:       $('stackRemote').value,
        identity:     $('stackIdentity').value,
        compliance:   $('stackCompliance').value,
        complianceCert: $('complianceCert').value.trim(),
        itSupport:    $('stackITSupport').value,
        notes:        $('stackNotes').value.trim()
      },
      goals: getSelectedChips('goalsChips', 'customGoal'),
      phases: [1, 2, 3].map(p => ({
        number:    p,
        label:     document.querySelector(`.phase-label-input[data-phase="${p}"]`)?.value.trim() || '',
        timeframe: document.querySelector(`.phase-timeframe[data-phase="${p}"]`)?.value || '',
        priority:  document.querySelector(`.phase-priority[data-phase="${p}"]`)?.value || '',
        services:  [...phaseState[p].services]
      })),
      budget:      $('budgetRange').value,
      constraints: getSelectedChips('constraintChips', null),
      notes:       $('additionalNotes').value.trim()
    };
  }

  function getSelectedChips(containerId, customInputId) {
    const selected = [];
    $(`${containerId}`).querySelectorAll('.chip.active:not(.chip-custom)').forEach(c => {
      selected.push(c.dataset.val);
    });
    if (customInputId) {
      const custom = $(customInputId)?.value.trim();
      if (custom) selected.push(custom);
    }
    return selected;
  }

  // ── Validate ────────────────────────────────
  function validate(payload) {
    if (!payload.clientName) return 'Enter a client name before generating.';
    if (!payload.industry)   return 'Select an industry.';
    const hasServices = payload.phases.some(p => p.services.length > 0);
    if (!hasServices)        return 'Add at least one service to a roadmap phase.';
    if (!payload.goals.length) return 'Select at least one business goal.';
    return null;
  }

  // ── Generate ────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();
    const err = validate(payload);
    if (err) { showError(err); return; }

    lastPayload = payload;
    setLoading(true, 'Building your technology roadmap…');
    generateBtn.disabled = true;

    try {
      const res  = await fetch('/api/technology-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');
      populateWidgets(data, payload);
    } catch (err) {
      showError('Something went wrong: ' + err.message);
    } finally {
      setLoading(false);
      generateBtn.disabled = false;
    }
  }

  function populateWidgets(data, payload) {
    const clientName = payload.clientName;

    // Widget 1 — Where You Are Today
    widgets[1] = buildTodayWidget(data.whereYouAreToday, clientName);
    // Widget 2 — Roadmap table (centrepiece)
    widgets[2] = buildRoadmapWidget(data.roadmap, clientName);
    // Widget 3 — Business Outcomes
    widgets[3] = buildOutcomesWidget(data.businessOutcomes, clientName);
    // Widget 4 — Investment Summary
    widgets[4] = buildInvestmentWidget(data.investmentSummary, clientName);

    WIDGET_IDS.forEach(i => {
      $(`widget${i}Editor`).value = widgets[i];
      renderPreview(i);
    });

    deliveryTitle.textContent = clientName + ' — Technology Roadmap';
    outputArea.hidden = false;
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    autoSave('generated');
  }

  // ── Widget HTML builders ─────────────────────
  // All inline styles only. No Flexbox. h5/h6 only. Tables for columns. Max 3 cols.

  function esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function buildTodayWidget(d, clientName) {
    const theme = currentTheme;
    const body  = (d.body || '').split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${esc(l)}</p>`
    ).join('');

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'Your Current Technology Environment')}</h5>
  </div>
  <div style="padding:16px 20px 6px;">${body}</div>
</div>`;
  }

  function buildRoadmapWidget(d, clientName) {
    const theme     = currentTheme;
    const headline  = d.headline || 'Your Technology Roadmap';
    const phases    = d.phases || [];

    // Phase rows — one row per phase to keep narrow widths safe
    // Columns: Phase label | Timeframe | Focus Areas | Outcome
    // 4 columns is acceptable when content per cell is very short
    const rows = phases.map((ph, idx) => {
      const services = (ph.services || []).slice(0, 4).join(', ');
      const isFirst  = idx === 0;
      const rowBg    = isFirst ? '' : (idx % 2 === 0 ? 'background:#FAFAF7;' : '');
      return `<tr>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:18%;">
      <div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;color:#FFFFFF;background:${esc(theme)};padding:3px 8px;display:inline-block;border-radius:3px;margin-bottom:4px;">${esc(ph.label || `Phase ${idx + 1}`)}</div>
      ${ph.priority ? `<div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9CA3AF;">${esc(ph.priority)}</div>` : ''}
    </td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:18%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#0B0E14;font-weight:600;">${esc(ph.timeframe || '')}</td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:34%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#4B5563;">${esc(services)}</td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;vertical-align:top;width:30%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#0B0E14;font-style:italic;">${esc(ph.outcome || '')}</td>
  </tr>`;
    }).join('');

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(headline)}</h5>
  </div>
  <div style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-bottom:none;border-radius:4px;overflow:hidden;">
      <tr style="background:${esc(theme)};">
        <th style="padding:10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:18%;">PHASE</th>
        <th style="padding:10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:18%;">TIMEFRAME</th>
        <th style="padding:10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:34%;">FOCUS AREAS</th>
        <th style="padding:10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;width:30%;">BUSINESS OUTCOME</th>
      </tr>
      ${rows}
    </table>
  </div>
</div>`;
  }

  function buildOutcomesWidget(d, clientName) {
    const theme    = currentTheme;
    const outcomes = (d.outcomes || []);
    const rows     = outcomes.map(o =>
      `<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #E5E7EB;">
    <div style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;color:#0B0E14;margin-bottom:4px;">${esc(o.goal)}</div>
    <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#4B5563;line-height:1.55;">${esc(o.result)}</div>
  </div>`
    ).join('');

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'What This Means for Your Business')}</h5>
  </div>
  <div style="padding:16px 20px;">${rows}</div>
</div>`;
  }

  function buildInvestmentWidget(d, clientName) {
    const theme = currentTheme;
    const body  = (d.body || '').split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 12px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${esc(l)}</p>`
    ).join('');

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'Phased Investment Overview')}</h5>
  </div>
  <div style="padding:16px 20px 4px;">${body}</div>
</div>`;
  }

  // ── Render preview ───────────────────────────
  function renderPreview(i) {
    const el = $(`preview${i}`);
    if (el && widgets[i]) el.innerHTML = widgets[i];
  }

  // ── Widget actions ───────────────────────────
  async function onRegenWidget(i) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    btn.disabled = true; btn.textContent = '…';

    try {
      const res  = await fetch('/api/technology-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenWidget: i })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      const clientName = lastPayload.clientName;
      if      (i === 1) widgets[1] = buildTodayWidget(data.whereYouAreToday, clientName);
      else if (i === 2) widgets[2] = buildRoadmapWidget(data.roadmap, clientName);
      else if (i === 3) widgets[3] = buildOutcomesWidget(data.businessOutcomes, clientName);
      else if (i === 4) widgets[4] = buildInvestmentWidget(data.investmentSummary, clientName);

      $(`widget${i}Editor`).value = widgets[i];
      renderPreview(i);
      autoSave();
    } catch (err) {
      alert('Regeneration failed: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = '↺ Regenerate';
    }
  }

  function onCopyWidget(i) {
    const btn = document.querySelector(`.widget-copy[data-widget="${i}"]`);
    navigator.clipboard.writeText(widgets[i] || '').then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }

  function onToggleHtml(i) {
    const ed  = $(`widget${i}Editor`);
    const btn = document.querySelector(`.show-html-btn[data-widget="${i}"]`);
    const shown = ed.style.display === 'block';
    ed.style.display = shown ? 'none' : 'block';
    btn.textContent  = shown ? 'Show HTML' : 'Hide HTML';
  }

  function onCopyAll() {
    const all = WIDGET_IDS.map(i => widgets[i] || '').join('\n\n');
    navigator.clipboard.writeText(all).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy All HTML', 2000);
    });
  }

  // ── Push ────────────────────────────────────
  async function onPush(type) {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    await executePush(type, apiKey, tenantUrl);
  }

  async function onSaveAndPush() {
    const apiKey    = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { showPushStatus('Enter API key and tenant URL.', 'err'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    await executePush('individual', apiKey, tenantUrl);
  }

  async function executePush(type, apiKey, tenantUrl) {
    const clientName = lastPayload?.clientName || deliveryTitle.textContent.replace(' — Technology Roadmap', '');
    const labels     = ['Where You Are Today', 'Technology Roadmap', 'Business Outcomes', 'Investment Summary'];

    const allWidgets = WIDGET_IDS.map((id, idx) => ({
      type: 'html',
      content: widgets[id] || '',
      title: `${clientName} — Roadmap — ${labels[idx]}`
    }));

    const body = type === 'pack'
      ? { widgets: [{ type: 'html', content: WIDGET_IDS.map(i => widgets[i] || '').join('\n\n'), title: `${clientName} — Technology Roadmap Pack` }], prefix: `${clientName} — Roadmap`, apiKey, tenantUrl }
      : { widgets: allWidgets, prefix: `${clientName} — Roadmap`, apiKey, tenantUrl };

    const packLabel       = pushPackBtn.textContent;
    const individualLabel = pushIndividualBtn.textContent;
    pushPackBtn.disabled       = true; pushPackBtn.textContent       = 'Pushing…';
    pushIndividualBtn.disabled = true; pushIndividualBtn.textContent = 'Pushing…';

    try {
      const res  = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
        autoSave('pushed');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error'), 'err');
      }
    } catch (err) {
      showPushStatus('Push failed: ' + err.message, 'err');
    } finally {
      pushPackBtn.disabled       = false; pushPackBtn.textContent       = packLabel;
      pushIndividualBtn.disabled = false; pushIndividualBtn.textContent = individualLabel;
    }
  }

  // ── Session management ───────────────────────
  function buildSessionSnapshot(status) {
    const payload = buildPayload();
    return {
      id:          currentSessionId,
      clientName:  payload.clientName || 'Untitled',
      savedAt:     Date.now(),
      status:      status || 'draft',
      theme:       currentTheme,
      clientType:  currentClientType,
      formData:    payload,
      phaseState:  {
        1: { services: [...phaseState[1].services], custom: [...phaseState[1].custom] },
        2: { services: [...phaseState[2].services], custom: [...phaseState[2].custom] },
        3: { services: [...phaseState[3].services], custom: [...phaseState[3].custom] }
      },
      widgets:     JSON.parse(JSON.stringify(widgets)),
      lastPayload: lastPayload
    };
  }

  function autoSave(status) {
    if (!currentSessionId) {
      currentSessionId = 'roadmap_session_' + Date.now();
    }
    let sessions = getSessions();
    const idx    = sessions.findIndex(s => s.id === currentSessionId);
    const snap   = buildSessionSnapshot(status || (sessions[idx]?.status || 'draft'));
    if (idx >= 0) sessions[idx] = snap;
    else sessions.unshift(snap);
    sessions = sessions.slice(0, 20);
    saveSessions(sessions);
    renderSessionCards();
    flashSaved();
  }

  function flashSaved() {
    autoSaveLabel.hidden = false;
    autoSaveLabel.classList.add('visible');
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => autoSaveLabel.classList.remove('visible'), 1800);
  }

  function startNewSession() {
    currentSessionId = 'roadmap_session_' + Date.now();
    currentTheme     = '#0f1f3d';
    currentClientType = 'prospect';
    widgets          = {};
    lastPayload      = null;
    phaseState       = { 1: { services: new Set(), custom: [] }, 2: { services: new Set(), custom: [] }, 3: { services: new Set(), custom: [] } };

    // Reset form fields
    clientNameEl.value = '';
    industryEl.value   = '';
    companySizeEl.value = '';
    locationCountEl.value = '';
    document.querySelectorAll('select').forEach(s => s.value = '');
    document.querySelectorAll('input[type="text"], textarea').forEach(el => {
      if (el.id !== 'customHex') el.value = '';
    });
    document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    $('customGoalWrap').hidden = true;
    complianceCertGroup.hidden = true;
    [1,2,3].forEach(p => {
      renderSelectedTags(p);
      const listEl = $(`list${p}`);
      listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.querySelector(`.phase-label-input[data-phase="${p}"]`).value = '';
      document.querySelector(`.phase-timeframe[data-phase="${p}"]`).value = '';
      document.querySelector(`.phase-priority[data-phase="${p}"]`).value = '';
    });

    // Reset toggle
    clientTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'prospect'));

    // Reset swatch
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === '#0f1f3d'));

    // Reset output
    outputArea.hidden  = true;
    WIDGET_IDS.forEach(i => {
      $(`widget${i}Editor`).value = '';
      $(`preview${i}`).innerHTML = '';
    });
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resumeSession(sess) {
    currentSessionId  = sess.id;
    currentTheme      = sess.theme || '#0f1f3d';
    currentClientType = sess.clientType || 'prospect';
    widgets           = sess.widgets || {};
    lastPayload       = sess.lastPayload || null;

    // Restore phase state
    if (sess.phaseState) {
      [1,2,3].forEach(p => {
        const ps = sess.phaseState[p] || {};
        phaseState[p].services = new Set(ps.services || []);
        phaseState[p].custom   = ps.custom || [];
      });
    }

    // Restore form fields
    const fd = sess.formData || {};
    if (clientNameEl)    clientNameEl.value    = fd.clientName || '';
    if (industryEl)      industryEl.value      = fd.industry   || '';
    if (companySizeEl)   companySizeEl.value   = fd.companySize || '';
    if (locationCountEl) locationCountEl.value = fd.locationCount || '';

    const stack = fd.stack || {};
    ['Endpoints','Email','Security','Backup','Connectivity','Server','Remote','Identity','Compliance','ITSupport'].forEach(k => {
      const el = $(`stack${k}`);
      if (el) el.value = stack[k.charAt(0).toLowerCase() + k.slice(1)] || '';
    });
    if ($('complianceCert'))    $('complianceCert').value    = stack.complianceCert || '';
    if ($('stackNotes'))        $('stackNotes').value        = stack.notes || '';
    if ($('budgetRange'))       $('budgetRange').value       = fd.budget || '';
    if ($('additionalNotes'))   $('additionalNotes').value   = fd.notes || '';

    complianceCertGroup.hidden = (stack.compliance !== 'Certified');

    // Goals
    const goals = fd.goals || [];
    $('goalsChips').querySelectorAll('.chip:not(.chip-custom)').forEach(c => {
      c.classList.toggle('active', goals.includes(c.dataset.val));
    });
    // Constraints
    const constraints = fd.constraints || [];
    $('constraintChips').querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', constraints.includes(c.dataset.val));
    });

    // Restore client type toggle
    clientTypeToggle.querySelectorAll('.toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.val === currentClientType);
    });

    // Restore swatch
    let swatchMatched = false;
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      const match = s.dataset.hex === currentTheme;
      s.classList.toggle('active', match);
      if (match) swatchMatched = true;
    });
    if (!swatchMatched && currentTheme) {
      customHex.value = currentTheme.replace('#', '');
      hexPreview.style.background = currentTheme;
    }

    // Restore service pickers
    [1,2,3].forEach(p => {
      const listEl = $(`list${p}`);
      listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = phaseState[p].services.has(cb.value);
      });
      renderSelectedTags(p);

      const label    = (fd.phases || [])[p - 1]?.label || '';
      const timeframe = (fd.phases || [])[p - 1]?.timeframe || '';
      const priority  = (fd.phases || [])[p - 1]?.priority || '';
      const li = document.querySelector(`.phase-label-input[data-phase="${p}"]`);
      const tf = document.querySelector(`.phase-timeframe[data-phase="${p}"]`);
      const pr = document.querySelector(`.phase-priority[data-phase="${p}"]`);
      if (li) li.value = label;
      if (tf) tf.value = timeframe;
      if (pr) pr.value = priority;
    });

    // Restore widgets
    if (Object.keys(widgets).length) {
      WIDGET_IDS.forEach(i => {
        if (!widgets[i]) return;
        $(`widget${i}Editor`).value = widgets[i];
        renderPreview(i);
      });
      deliveryTitle.textContent = (fd.clientName || '') + ' — Technology Roadmap';
      outputArea.hidden = false;
    }
  }

  function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');  } catch { return []; } }
  function saveSessions(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

  let _showingArchived = false;
  function onShowArchived() {
    _showingArchived = !_showingArchived;
    renderSessionCards(_showingArchived);
  }

  function renderSessionCards(showArchived) {
    const sessions  = getSessions();
    const archived  = showArchived ? getArchived() : [];
    const all       = showArchived ? [...sessions, ...archived] : sessions.slice(0, SESSION_LIMIT);

    if (!all.length && !sessions.length) { sessionsBlock.hidden = true; return; }
    sessionsBlock.hidden = false;
    sessionCards.innerHTML = '';

    all.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const age = fmtAge(sess.savedAt);
      const statusClass = { draft: 'status-draft', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-draft';
      card.innerHTML = `
        <div class="session-card-info">
          <div class="session-card-company">${escHtml(sess.clientName || 'Untitled')}</div>
          <div class="session-card-meta">${age}</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${(sess.status || 'draft').toUpperCase()}</span>
          <button class="session-discard" data-id="${escHtml(sess.id)}" title="Discard">×</button>
        </div>`;
      card.querySelector('.session-card-info').addEventListener('click', () => resumeSession(sess));
      card.querySelector('.session-discard').addEventListener('click', e => {
        e.stopPropagation();
        discardSession(sess.id, showArchived);
      });
      sessionCards.appendChild(card);
    });

    const hasMore = !showArchived && sessions.length > SESSION_LIMIT;
    if (hasMore) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:11px;color:var(--text-3);text-align:center;padding:6px;';
      more.textContent = `+ ${sessions.length - SESSION_LIMIT} more`;
      sessionCards.appendChild(more);
    }

    showArchivedBtn.textContent = showArchived ? 'Hide archived' : 'Show archived';
  }

  function discardSession(id, isArchived) {
    if (isArchived) {
      saveArchived(getArchived().filter(s => s.id !== id));
    } else {
      saveSessions(getSessions().filter(s => s.id !== id));
    }
    renderSessionCards(isArchived);
  }

  // ── UI helpers ───────────────────────────────
  function showError(msg)  { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError()     { formError.hidden = true; }
  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className   = 'push-status ' + type;
    pushStatus.hidden      = false;
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }
  function setLoading(on, msg) {
    loadingOverlay.hidden = !on;
    if (msg) loadingMsg.textContent = msg;
  }
  function fmtAge(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 2)  return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
  function escHtml(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  init();
})();
