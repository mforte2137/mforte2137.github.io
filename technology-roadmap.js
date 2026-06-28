/* =============================================
   Technology Roadmap Builder — Frontend JS
   ============================================= */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────
  const SESSION_KEY   = 'roadmap_sessions';
  const ARCHIVE_KEY   = 'roadmap_sessions_archived';
  const SESSION_LIMIT = 5;
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
      'HIPAA Compliance Program',
      'Cyber Essentials Certification',
      'ISO 27001 Preparation',
      'SOC 2 Readiness',
      'GDPR Compliance Review'
    ]}
  ];

  // ── State ──────────────────────────────────
  let currentTheme      = '#0f1f3d';
  let currentClientType = 'prospect';
  let phaseMode         = 'ai'; // 'ai' | 'manual'
  let widgets           = {};
  let currentSessionId  = null;
  let lastPayload       = null;
  let phaseState        = {
    1: { services: new Set(), custom: [] },
    2: { services: new Set(), custom: [] },
    3: { services: new Set(), custom: [] }
  };

  // ── DOM refs ───────────────────────────────
  const $ = id => document.getElementById(id);

  const sessionsBlock    = $('sessionsBlock');
  const sessionCards     = $('sessionCards');
  const showArchivedBtn  = $('showArchivedBtn');
  const newRoadmapBtn    = $('newRoadmapBtn');

  const clientNameEl     = $('clientName');
  const industryEl       = $('industry');
  const companySizeEl    = $('companySize');
  const locationCountEl  = $('locationCount');
  const clientTypeToggle = $('clientTypeToggle');

  const stackCompliance     = $('stackCompliance');
  const complianceCertGroup = $('complianceCertGroup');

  const phaseModeToggle   = $('phaseModeToggle');
  const phaseAiNote       = $('phaseAiNote');
  const manualPhaseBlocks = $('manualPhaseBlocks');

  const colourSwatches = $('colourSwatches');
  const customHex      = $('customHex');
  const hexPreview     = $('hexPreview');

  const generateBtn    = $('generateBtn');
  const formError      = $('formError');
  const loadingOverlay = $('loadingOverlay');
  const loadingMsg     = $('loadingMsg');
  const emptyState     = $('emptyState');
  const outputArea     = $('outputArea');
  const deliveryTitle  = $('deliveryTitle');
  const autoSaveLabel  = $('autoSaveLabel');

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
    // Collapsibles
    document.querySelectorAll('.collapsible-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const body = $(btn.dataset.target);
        const open = !body.classList.contains('collapsed');
        body.classList.toggle('collapsed', open);
        btn.classList.toggle('collapsed', open);
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

    // Phase mode toggle
    phaseModeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        phaseModeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        phaseMode = btn.dataset.val;
        manualPhaseBlocks.hidden = (phaseMode === 'ai');
        phaseAiNote.hidden       = (phaseMode !== 'ai');
        autoSave();
      });
    });

    // Compliance cert reveal
    stackCompliance.addEventListener('change', () => {
      complianceCertGroup.hidden = stackCompliance.value !== 'Certified';
      autoSave();
    });

    // Multi-select stack chips
    ['stackSecurityChips', 'stackConnectivityChips', 'stackRemoteChips'].forEach(groupId => {
      $(groupId).querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          chip.classList.toggle('active');
          autoSave();
        });
      });
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
      chip.addEventListener('click', () => { chip.classList.toggle('active'); autoSave(); });
    });

    // Color swatches
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', () => selectSwatch(s)));
    customHex.addEventListener('input', onCustomHex);

    // Service pickers
    [1, 2, 3].forEach(p => buildServicePicker(p));

    // Auto-save on any input change
    document.querySelectorAll('input:not([type="checkbox"]), select, textarea').forEach(el => {
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

    generateBtn.addEventListener('click', onGenerate);
    pushPackBtn.addEventListener('click',       () => onPush('pack'));
    pushIndividualBtn.addEventListener('click', () => onPush('individual'));
    copyAllBtn.addEventListener('click',        onCopyAll);
    saveAndPushBtn.addEventListener('click',    onSaveAndPush);
    newRoadmapBtn.addEventListener('click',     startNewSession);
    showArchivedBtn.addEventListener('click',   onShowArchived);

    // Load sessions
    renderSessionCards();
    const sessions = getSessions();
    if (sessions.length) {
      sessionsBlock.hidden = false;
      resumeSession(sessions[0]);
    }
  }

  // ── Service picker ──────────────────────────
  function buildServicePicker(phase) {
    const listEl    = $(`list${phase}`);
    const searchEl  = document.querySelector(`.service-search[data-phase="${phase}"]`);
    const addBtn    = document.querySelector(`.custom-service-add[data-phase="${phase}"]`);
    const customIn  = $(`customService${phase}`);

    SERVICE_LIBRARY.forEach(group => {
      const label = document.createElement('div');
      label.className = 'service-group-label';
      label.textContent = group.group;
      listEl.appendChild(label);

      group.services.forEach(svc => {
        const row = document.createElement('label');
        row.className = 'service-item';
        row.dataset.name  = svc.toLowerCase();
        row.dataset.group = group.group;
        const cb   = document.createElement('input');
        cb.type    = 'checkbox';
        cb.value   = svc;
        const span = document.createElement('span');
        span.textContent = svc;
        row.appendChild(cb);
        row.appendChild(span);
        cb.addEventListener('change', () => {
          if (cb.checked) phaseState[phase].services.add(svc);
          else            phaseState[phase].services.delete(svc);
          renderSelectedTags(phase);
          autoSave();
        });
        listEl.appendChild(row);
      });
    });

    searchEl.addEventListener('input', () => {
      const q = searchEl.value.toLowerCase().trim();
      listEl.querySelectorAll('.service-item').forEach(row => {
        row.classList.toggle('hidden-item', !(!q || row.dataset.name.includes(q)));
      });
      listEl.querySelectorAll('.service-group-label').forEach(lbl => {
        const grp = lbl.textContent;
        const any = [...listEl.querySelectorAll(`.service-item[data-group="${grp}"]`)]
          .some(r => !r.classList.contains('hidden-item'));
        lbl.style.display = any ? '' : 'none';
      });
    });

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
        phaseState[phase].custom = phaseState[phase].custom.filter(c => c !== svc);
        const cb = $(`list${phase}`)?.querySelector(`input[value="${svc.replace(/"/g, '\\"')}"]`);
        if (cb) cb.checked = false;
        renderSelectedTags(phase);
        autoSave();
      });
      el.appendChild(tag);
    });
  }

  // ── Color ────────────────────────────────────
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
  function refreshPreviews() { WIDGET_IDS.forEach(i => { if (widgets[i]) renderPreview(i); }); }

  // ── Multi-select chip helpers ────────────────
  function getStackChips(groupId) {
    return [...$(groupId).querySelectorAll('.chip.active')].map(c => c.dataset.val);
  }

  // ── Build payload ────────────────────────────
  function buildPayload() {
    return {
      clientName:    clientNameEl.value.trim(),
      clientType:    currentClientType,
      industry:      industryEl.value,
      companySize:   companySizeEl.value,
      locationCount: locationCountEl.value,
      phaseMode,
      stack: {
        endpoints:    $('stackEndpoints').value,
        email:        $('stackEmail').value,
        security:     getStackChips('stackSecurityChips'),
        backup:       $('stackBackup').value,
        connectivity: getStackChips('stackConnectivityChips'),
        server:       $('stackServer').value,
        remote:       getStackChips('stackRemoteChips'),
        identity:     $('stackIdentity').value,
        compliance:   $('stackCompliance').value,
        complianceCert: $('complianceCert').value.trim(),
        itSupport:    $('stackITSupport').value,
        notes:        $('stackNotes').value.trim()
      },
      goals:       getSelectedChips('goalsChips', 'customGoal'),
      phases:      phaseMode === 'manual' ? getManualPhases() : [],
      budget:      $('budgetRange').value,
      constraints: getSelectedChips('constraintChips', null),
      notes:       $('additionalNotes').value.trim()
    };
  }

  function getManualPhases() {
    return [1, 2, 3].map(p => ({
      number:    p,
      label:     document.querySelector(`.phase-label-input[data-phase="${p}"]`)?.value.trim() || '',
      timeframe: document.querySelector(`.phase-timeframe[data-phase="${p}"]`)?.value || '',
      priority:  document.querySelector(`.phase-priority[data-phase="${p}"]`)?.value || '',
      services:  [...phaseState[p].services]
    }));
  }

  function getSelectedChips(containerId, customInputId) {
    const selected = [];
    $(containerId).querySelectorAll('.chip.active:not(.chip-custom)').forEach(c => selected.push(c.dataset.val));
    if (customInputId) {
      const v = $(customInputId)?.value.trim();
      if (v) selected.push(v);
    }
    return selected;
  }

  // ── Validate ─────────────────────────────────
  function validate(payload) {
    if (!payload.clientName) return 'Enter a client name before generating.';
    if (!payload.industry)   return 'Select an industry.';
    if (!payload.goals.length) return 'Select at least one business goal.';
    if (payload.phaseMode === 'manual') {
      const hasServices = payload.phases.some(p => p.services.length > 0);
      if (!hasServices) return 'Add at least one service to a roadmap phase, or switch to "AI builds phases."';
    }
    return null;
  }

  // ── Generate ──────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();
    const err = validate(payload);
    if (err) { showError(err); return; }

    lastPayload = payload;
    setLoading(true, phaseMode === 'ai'
      ? 'AI is building your roadmap phases and widgets…'
      : 'Building your roadmap widgets…');
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
    } catch (e) {
      showError('Something went wrong: ' + e.message);
    } finally {
      setLoading(false);
      generateBtn.disabled = false;
    }
  }

  function populateWidgets(data, payload) {
    const name = payload.clientName;
    widgets[1] = buildTodayWidget(data.whereYouAreToday);
    widgets[2] = buildRoadmapWidget(data.roadmap);
    widgets[3] = buildOutcomesWidget(data.businessOutcomes);
    widgets[4] = buildInvestmentWidget(data.investmentSummary);

    WIDGET_IDS.forEach(i => {
      $(`widget${i}Editor`).value = widgets[i];
      renderPreview(i);
    });

    deliveryTitle.textContent = name + ' — Technology Roadmap';
    emptyState.hidden  = true;
    outputArea.hidden  = false;
    autoSave('generated');
  }

  // ── Widget HTML builders (inline styles, no Flexbox, h5/h6 only) ──
  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function buildTodayWidget(d) {
    const paras = (d.body || '').split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${esc(l)}</p>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(currentTheme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'Your Current Technology Environment')}</h5>
  </div>
  <div style="padding:16px 20px 6px;">${paras}</div>
</div>`;
  }

  function buildRoadmapWidget(d) {
    const phases = d.phases || [];
    const rows = phases.map((ph, idx) => {
      const services = (ph.services || []).slice(0, 4).join(', ');
      const rowBg = idx % 2 !== 0 ? 'background:#FAFAF7;' : '';
      return `<tr>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:18%;">
      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;background:${esc(currentTheme)};padding:2px 7px;display:inline-block;border-radius:3px;margin-bottom:3px;">${esc(ph.label || `Phase ${idx+1}`)}</div>
      ${ph.priority ? `<div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9CA3AF;">${esc(ph.priority)}</div>` : ''}
    </td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:18%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#0B0E14;font-weight:600;">${esc(ph.timeframe || '')}</td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;border-right:1px solid #E5E7EB;vertical-align:top;width:34%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#4B5563;">${esc(services)}</td>
    <td style="${rowBg}padding:12px 10px;border-bottom:1px solid #E5E7EB;vertical-align:top;width:30%;font-family:Inter,Arial,sans-serif;font-size:13px;color:#0B0E14;font-style:italic;">${esc(ph.outcome || '')}</td>
  </tr>`;
    }).join('');

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(currentTheme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'Your Technology Roadmap')}</h5>
  </div>
  <div style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-bottom:none;border-radius:4px;overflow:hidden;">
      <tr style="background:${esc(currentTheme)};">
        <th style="padding:9px 10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:18%;">PHASE</th>
        <th style="padding:9px 10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:18%;">TIMEFRAME</th>
        <th style="padding:9px 10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;border-right:1px solid rgba(255,255,255,0.2);width:34%;">FOCUS AREAS</th>
        <th style="padding:9px 10px;text-align:left;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;width:30%;">BUSINESS OUTCOME</th>
      </tr>
      ${rows}
    </table>
  </div>
</div>`;
  }

  function buildOutcomesWidget(d) {
    const rows = (d.outcomes || []).map(o =>
      `<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #E5E7EB;">
    <div style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;color:#0B0E14;margin-bottom:4px;">${esc(o.goal)}</div>
    <div style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#4B5563;line-height:1.55;">${esc(o.result)}</div>
  </div>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(currentTheme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'What This Means for Your Business')}</h5>
  </div>
  <div style="padding:16px 20px;">${rows}</div>
</div>`;
  }

  function buildInvestmentWidget(d) {
    const paras = (d.body || '').split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 12px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${esc(l)}</p>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;">
  <div style="width:100%;background:${esc(currentTheme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${esc(d.headline || 'Phased Investment Overview')}</h5>
  </div>
  <div style="padding:16px 20px 4px;">${paras}</div>
</div>`;
  }

  function renderPreview(i) {
    const el = $(`preview${i}`);
    if (el && widgets[i]) el.innerHTML = widgets[i];
  }

  // ── Widget actions ────────────────────────────
  async function onRegenWidget(i) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    btn.disabled = true; btn.textContent = '…';
    try {
      const res  = await fetch('/api/technology-roadmap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenWidget: i })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      if (i === 1) widgets[1] = buildTodayWidget(data.whereYouAreToday);
      if (i === 2) widgets[2] = buildRoadmapWidget(data.roadmap);
      if (i === 3) widgets[3] = buildOutcomesWidget(data.businessOutcomes);
      if (i === 4) widgets[4] = buildInvestmentWidget(data.investmentSummary);
      $(`widget${i}Editor`).value = widgets[i];
      renderPreview(i);
      autoSave();
    } catch (e) {
      alert('Regeneration failed: ' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = '↺ Regen';
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

  // ── Push ──────────────────────────────────────
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
    const name   = lastPayload?.clientName || '';
    const labels = ['Where You Are Today', 'Technology Roadmap', 'Business Outcomes', 'Investment Summary'];
    const allWidgets = WIDGET_IDS.map((id, idx) => ({
      type: 'html', content: widgets[id] || '',
      title: `${name} — Roadmap — ${labels[idx]}`
    }));
    const body = type === 'pack'
      ? { widgets: [{ type: 'html', content: WIDGET_IDS.map(i => widgets[i] || '').join('\n\n'), title: `${name} — Technology Roadmap Pack` }], prefix: `${name} — Roadmap`, apiKey, tenantUrl }
      : { widgets: allWidgets, prefix: `${name} — Roadmap`, apiKey, tenantUrl };

    const pLbl = pushPackBtn.textContent, iLbl = pushIndividualBtn.textContent;
    pushPackBtn.disabled = pushIndividualBtn.disabled = true;
    pushPackBtn.textContent = pushIndividualBtn.textContent = 'Pushing…';

    try {
      const res  = await fetch('/api/push-widgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.ok || data.successCount > 0) {
        showPushStatus(`Pushed successfully${data.successCount ? ` (${data.successCount} widget${data.successCount > 1 ? 's' : ''})` : ''}.`, 'ok');
        autoSave('pushed');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error'), 'err');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + e.message, 'err');
    } finally {
      pushPackBtn.disabled = pushIndividualBtn.disabled = false;
      pushPackBtn.textContent = pLbl; pushIndividualBtn.textContent = iLbl;
    }
  }

  // ── Session management (renewal-pack.js pattern) ──
  function buildSessionSnapshot(status) {
    const payload = buildPayload();
    return {
      id:         currentSessionId,
      clientName: payload.clientName || 'Untitled',
      savedAt:    Date.now(),
      status:     status || 'draft',
      theme:      currentTheme,
      clientType: currentClientType,
      phaseMode,
      formData:   payload,
      phaseState: {
        1: { services: [...phaseState[1].services], custom: [...phaseState[1].custom] },
        2: { services: [...phaseState[2].services], custom: [...phaseState[2].custom] },
        3: { services: [...phaseState[3].services], custom: [...phaseState[3].custom] }
      },
      widgets:     JSON.parse(JSON.stringify(widgets)),
      lastPayload
    };
  }

  function autoSave(status) {
    if (!currentSessionId) currentSessionId = 'roadmap_session_' + Date.now();
    let sessions = getSessions();
    const idx    = sessions.findIndex(s => s.id === currentSessionId);
    const snap   = buildSessionSnapshot(status || sessions[idx]?.status || 'draft');
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

  function startNewSession() {
    currentSessionId  = 'roadmap_session_' + Date.now();
    currentTheme      = '#0f1f3d';
    currentClientType = 'prospect';
    phaseMode         = 'ai';
    widgets           = {};
    lastPayload       = null;
    phaseState        = { 1: { services: new Set(), custom: [] }, 2: { services: new Set(), custom: [] }, 3: { services: new Set(), custom: [] } };

    // Reset form
    clientNameEl.value = '';
    document.querySelectorAll('select').forEach(s => { if (s.id !== 'budgetRange') s.value = ''; });
    document.querySelectorAll('textarea, input[type="text"]').forEach(el => { if (el.id !== 'customHex') el.value = ''; });
    document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active'));
    $('customGoalWrap').hidden = true;
    complianceCertGroup.hidden = true;

    // Reset phase mode to AI
    phaseModeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'ai'));
    manualPhaseBlocks.hidden = true;
    phaseAiNote.hidden       = false;

    // Reset service pickers
    [1,2,3].forEach(p => {
      renderSelectedTags(p);
      $(`list${p}`)?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.querySelector(`.phase-label-input[data-phase="${p}"]`).value = '';
      document.querySelector(`.phase-timeframe[data-phase="${p}"]`).value  = '';
      document.querySelector(`.phase-priority[data-phase="${p}"]`).value   = '';
    });

    // Reset client type
    clientTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === 'prospect'));

    // Reset swatch
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === '#0f1f3d'));

    // Reset output
    outputArea.hidden = true;
    emptyState.hidden = false;
    WIDGET_IDS.forEach(i => { $(`widget${i}Editor`).value = ''; $(`preview${i}`).innerHTML = ''; });
    hideError();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resumeSession(sess) {
    currentSessionId  = sess.id;
    currentTheme      = sess.theme || '#0f1f3d';
    currentClientType = sess.clientType || 'prospect';
    phaseMode         = sess.phaseMode || 'ai';
    widgets           = sess.widgets || {};
    lastPayload       = sess.lastPayload || null;

    if (sess.phaseState) {
      [1,2,3].forEach(p => {
        const ps = sess.phaseState[p] || {};
        phaseState[p].services = new Set(ps.services || []);
        phaseState[p].custom   = ps.custom || [];
      });
    }

    const fd = sess.formData || {};
    if (clientNameEl)    clientNameEl.value    = fd.clientName    || '';
    if (industryEl)      industryEl.value      = fd.industry      || '';
    if (companySizeEl)   companySizeEl.value   = fd.companySize   || '';
    if (locationCountEl) locationCountEl.value = fd.locationCount || '';

    const stack = fd.stack || {};
    const singles = { stackEndpoints: 'endpoints', stackEmail: 'email', stackBackup: 'backup', stackServer: 'server', stackIdentity: 'identity', stackCompliance: 'compliance', stackITSupport: 'itSupport' };
    Object.entries(singles).forEach(([elId, key]) => { const el = $(elId); if (el) el.value = stack[key] || ''; });
    if ($('complianceCert'))  $('complianceCert').value  = stack.complianceCert || '';
    if ($('stackNotes'))      $('stackNotes').value      = stack.notes || '';
    if ($('budgetRange'))     $('budgetRange').value     = fd.budget || '';
    if ($('additionalNotes')) $('additionalNotes').value = fd.notes  || '';

    complianceCertGroup.hidden = (stack.compliance !== 'Certified');

    // Restore multi-select stack chips
    const chipRestores = { stackSecurityChips: stack.security || [], stackConnectivityChips: stack.connectivity || [], stackRemoteChips: stack.remote || [] };
    Object.entries(chipRestores).forEach(([gId, vals]) => {
      $(gId).querySelectorAll('.chip').forEach(c => c.classList.toggle('active', vals.includes(c.dataset.val)));
    });

    // Goals + constraints
    const goals = fd.goals || [];
    $('goalsChips').querySelectorAll('.chip:not(.chip-custom)').forEach(c => c.classList.toggle('active', goals.includes(c.dataset.val)));
    const constr = fd.constraints || [];
    $('constraintChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('active', constr.includes(c.dataset.val)));

    // Client type + phase mode
    clientTypeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === currentClientType));
    phaseModeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === phaseMode));
    manualPhaseBlocks.hidden = (phaseMode === 'ai');
    phaseAiNote.hidden       = (phaseMode !== 'ai');

    // Swatch
    let matched = false;
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      const m = s.dataset.hex === currentTheme;
      s.classList.toggle('active', m);
      if (m) matched = true;
    });
    if (!matched && currentTheme) { customHex.value = currentTheme.replace('#',''); hexPreview.style.background = currentTheme; }

    // Service pickers
    [1,2,3].forEach(p => {
      $(`list${p}`)?.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = phaseState[p].services.has(cb.value); });
      renderSelectedTags(p);
      const ph = (fd.phases || [])[p-1] || {};
      const li = document.querySelector(`.phase-label-input[data-phase="${p}"]`);
      const tf = document.querySelector(`.phase-timeframe[data-phase="${p}"]`);
      const pr = document.querySelector(`.phase-priority[data-phase="${p}"]`);
      if (li) li.value = ph.label    || '';
      if (tf) tf.value = ph.timeframe || '';
      if (pr) pr.value = ph.priority  || '';
    });

    // Widgets
    if (Object.keys(widgets).length) {
      WIDGET_IDS.forEach(i => { if (widgets[i]) { $(`widget${i}Editor`).value = widgets[i]; renderPreview(i); } });
      deliveryTitle.textContent = (fd.clientName || '') + ' — Technology Roadmap';
      emptyState.hidden = true;
      outputArea.hidden = false;
    }
  }

  function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)  || '[]'); } catch { return []; } }
  function saveSessions(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a) { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

  let _showingArchived = false;
  function onShowArchived() { _showingArchived = !_showingArchived; renderSessionCards(_showingArchived); }

  function renderSessionCards(showArchived) {
    const sessions = getSessions();
    const archived = showArchived ? getArchived() : [];
    const toShow   = showArchived ? [...sessions, ...archived] : sessions.slice(0, SESSION_LIMIT);
    if (!toShow.length && !sessions.length) { sessionsBlock.hidden = true; return; }
    sessionsBlock.hidden = false;
    sessionCards.innerHTML = '';
    toShow.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const statusClass = { draft: 'status-draft', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-draft';
      card.innerHTML = `
        <div class="session-card-info">
          <div class="session-card-company">${escHtml(sess.clientName || 'Untitled')}</div>
          <div class="session-card-meta">${fmtAge(sess.savedAt)}</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${(sess.status||'draft').toUpperCase()}</span>
          <button class="session-discard" data-id="${escHtml(sess.id)}" title="Discard">×</button>
        </div>`;
      card.querySelector('.session-card-info').addEventListener('click', () => resumeSession(sess));
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
    if (isArchived) saveArchived(getArchived().filter(s => s.id !== id));
    else            saveSessions(getSessions().filter(s => s.id !== id));
    renderSessionCards(isArchived);
  }

  // ── UI helpers ────────────────────────────────
  function showError(msg)  { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
  function hideError()     { formError.hidden = true; }
  function showPushStatus(msg, type) {
    pushStatus.textContent = msg; pushStatus.className = 'push-status ' + type; pushStatus.hidden = false;
    if (type === 'err') setTimeout(() => { pushStatus.hidden = true; }, 8000);
  }
  function setLoading(on, msg) { loadingOverlay.hidden = !on; if (msg) loadingMsg.textContent = msg; }
  function fmtAge(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 2)  return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  init();
})();
