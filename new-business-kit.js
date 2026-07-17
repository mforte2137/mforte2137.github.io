/* =====================================================
   new-business-kit.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────
  const SESSION_KEY   = 'nbk_sessions';
  const ARCHIVE_KEY   = 'nbk_archived';
  const MSP_NAME_KEY  = 'nbk_msp_name';
  const SESSION_LIMIT = 5;

  const TRIGGER_LABELS = {
    referral: 'Referral from mutual contact',
    event: 'Met at an event',
    news: 'Saw something about their business',
    proactive: 'Proactive industry outreach',
    renewal: 'Contract renewal likely approaching',
    incident: 'Recent sector cybersecurity incident',
    inbound: 'Inbound — they reached out first',
    reactivation: 'Reactivation — worked together before',
    general: 'General outreach'
  };

  const PATH_LABELS = { cold: 'Cold Prospect', warm: 'Warm Prospect', quoting: 'Ready to Quote' };

  // Known hub tools the Quoting path can recommend, and their URLs
  const TOOL_URLS = {
    'IT Maturity Assessment Widget': 'https://widgetcreator.netlify.app/it-maturity-assessment.html',
    'Industry Proposal Pack': 'https://widgetcreator.netlify.app/industry-proposal-pack.html',
    'Cyber Insurance Readiness Widget': 'https://widgetcreator.netlify.app/cyber-insurance-readiness.html',
    'Service Tier Widget Builder': 'https://widgetcreator.netlify.app/service-tier-widget-builder.html',
    'Multi-Stakeholder Pack': 'https://widgetcreator.netlify.app/multi-stakeholder-pack.html',
    'Case Study Widget': 'https://widgetcreator.netlify.app/case-study-widget.html',
    'Cover Page Creator': 'https://widgetcreator.netlify.app/cover-page-creator.html',
    'Compliance Sales Pack': 'https://widgetcreator.netlify.app/compliance-sales-pack.html'
  };

  // ── State ──────────────────────────────────────────
  let currentStep        = 1;
  let selectedPath        = null;
  let includeFirstImpression = false;
  let currentTheme        = '#0f1f3d';
  let currentSessionId    = null;
  let generatedOutputs    = null;
  let lastPayload         = null;
  let sessionStatus       = 'in_progress';
  let sentAt              = null;
  let autoSaveReady       = false;
  let showingArchived     = false;

  // ── DOM refs ───────────────────────────────────────
  const $ = id => document.getElementById(id);

  const mspNameEl = $('mspName');

  const sessionsBlock    = $('sessionsBlock');
  const sessionsEmptyRow = $('sessionsEmptyRow');
  const sessionCards     = $('sessionCards');
  const archivedPanel    = $('archivedPanel');
  const archivedCards    = $('archivedCards');
  const showArchivedBtn  = $('showArchivedBtn');
  const newSessionBtn    = $('newSessionBtn');
  const newSessionBtnEmpty = $('newSessionBtnEmpty');
  const importBtn        = $('importBtn');
  const importBtnEmpty   = $('importBtnEmpty');
  const importFile       = $('importFile');
  const limitMsg         = $('limitMsg');

  const autoSaveLabel = $('autoSaveLabel');

  const companyEl = $('company'), industryEl = $('industry'), sizeEl = $('size'),
        contactEl = $('contact'), roleEl = $('role'),
        triggerEl = $('trigger'), triggerDetailEl = $('triggerDetail');

  const warmExtra = $('warmExtra');
  const includeFirstImpressionEl = $('includeFirstImpression');

  const summaryCard  = $('summaryCard');
  const themeField   = $('themeField');
  const colourSwatches = $('colourSwatches');
  const colourPicker = $('colourPicker');
  const customHex    = $('customHex');

  const formError    = $('formError');
  const loadingState = $('loadingState');
  const loadingMsg   = $('loadingMsg');

  const outputArea   = $('outputArea');
  const outputTitle  = $('outputTitle');
  const markSentBtn  = $('markSentBtn');
  const moveToWarmBtn = $('moveToWarmBtn');
  const regenerateBtn = $('regenerateBtn');
  const startOverBtn = $('startOverBtn');
  const sentBadge    = $('sentBadge');

  const coldOutputs  = $('coldOutputs');
  const emailSubject = $('emailSubject');
  const emailBody    = $('emailBody');
  const copyEmailBtn = $('copyEmailBtn');
  const leaveBehindFrame = $('leaveBehindFrame');
  const printLeaveBehindBtn = $('printLeaveBehindBtn');

  const warmOutputs   = $('warmOutputs');
  const followUpSubject = $('followUpSubject');
  const followUpFrame = $('followUpFrame');
  const copyFollowUpBtn = $('copyFollowUpBtn');
  const firstImpressionPanel = $('firstImpressionPanel');
  const widgetFrame  = $('widgetFrame');
  const copyWidgetBtn = $('copyWidgetBtn');
  const pushWidgetBtn = $('pushWidgetBtn');

  const quotingOutputs = $('quotingOutputs');
  const proposalPlanHead = $('proposalPlanHead');
  const proposalPlanList = $('proposalPlanList');

  const credsInline = $('credsInline');
  const pushApiKey   = $('pushApiKey');
  const pushTenantUrl = $('pushTenantUrl');
  const saveAndPushBtn = $('saveAndPushBtn');
  const cancelCredsBtn = $('cancelCredsBtn');
  const pushStatus   = $('pushStatus');

  const toast = $('toast');

  // ── Init ───────────────────────────────────────────
  function init() {
    mspNameEl.value = localStorage.getItem(MSP_NAME_KEY) || '';
    mspNameEl.addEventListener('input', () => {
      localStorage.setItem(MSP_NAME_KEY, mspNameEl.value.trim());
      autoSave();
    });

    [companyEl, industryEl, sizeEl, contactEl, roleEl, triggerEl, triggerDetailEl].forEach(el => {
      el.addEventListener('input', () => autoSave());
      el.addEventListener('change', () => autoSave());
    });

    $('toStep2').addEventListener('click', () => goToStep(2));
    $('backTo1').addEventListener('click', () => goToStep(1));
    $('toStep3').addEventListener('click', () => goToStep(3));
    $('backTo2').addEventListener('click', () => goToStep(2));
    $('toStep4').addEventListener('click', () => goToStep(4));
    $('backTo3').addEventListener('click', () => goToStep(3));

    document.querySelectorAll('.path-card').forEach(card => {
      card.addEventListener('click', () => selectPath(card.dataset.path));
    });

    includeFirstImpressionEl.addEventListener('change', () => {
      includeFirstImpression = includeFirstImpressionEl.checked;
      autoSave();
    });

    colourSwatches.querySelectorAll('.swatch').forEach(s => s.addEventListener('click', () => selectSwatch(s)));
    colourPicker.addEventListener('input', () => {
      currentTheme = colourPicker.value;
      customHex.value = currentTheme.replace('#', '').toUpperCase();
      deselectSwatches();
      if (generatedOutputs) reapplyTheme();
      autoSave();
    });
    customHex.addEventListener('input', () => {
      const val = customHex.value.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(val)) {
        currentTheme = '#' + val;
        colourPicker.value = currentTheme;
        deselectSwatches();
        if (generatedOutputs) reapplyTheme();
        autoSave();
      }
    });

    $('generateBtn').addEventListener('click', generate);
    regenerateBtn.addEventListener('click', generate);
    startOverBtn.addEventListener('click', () => { if (confirm('Start a new prospect? This session stays saved in your session cards.')) startNewSession(); });
    newSessionBtn.addEventListener('click', onNewProspectClick);
    newSessionBtnEmpty.addEventListener('click', onNewProspectClick);
    showArchivedBtn.addEventListener('click', toggleArchived);

    markSentBtn.addEventListener('click', onMarkSent);
    moveToWarmBtn.addEventListener('click', onMoveToWarm);

    copyEmailBtn.addEventListener('click', () => copyToClipboard(
      (emailSubject.textContent ? 'Subject: ' + emailSubject.textContent + '\n\n' : '') + emailBody.textContent, copyEmailBtn));
    printLeaveBehindBtn.addEventListener('click', () => window.print());
    copyFollowUpBtn.addEventListener('click', () => copyToClipboard(followUpFrame.innerHTML, copyFollowUpBtn));
    copyWidgetBtn.addEventListener('click', () => copyToClipboard(widgetFrame.innerHTML, copyWidgetBtn));
    pushWidgetBtn.addEventListener('click', onPushWidgetClick);

    cancelCredsBtn.addEventListener('click', () => { credsInline.hidden = true; });
    saveAndPushBtn.addEventListener('click', onSaveAndPush);

    importBtn.addEventListener('click', () => importFile.click());
    importBtnEmpty.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', onImportFile);

    if (pushApiKey) pushApiKey.value = localStorage.getItem('sb_api_key') || '';
    if (pushTenantUrl) pushTenantUrl.value = localStorage.getItem('sb_tenant_url') || '';

    renderSessionCards();
    const sessions = getSessions();
    if (sessions.length) {
      resumeSession(sessions[0]);
    } else {
      currentSessionId = 'nbk_' + Date.now();
    }
    autoSaveReady = true;
    updateStepProgress();
  }

  // ── Step navigation ────────────────────────────────
  function goToStep(n) {
    if (n > currentStep) {
      const err = validateStep(currentStep);
      if (err) { showError(err); return; }
    }
    hideError();
    currentStep = n;
    document.querySelectorAll('[data-step-panel]').forEach(p => { p.hidden = Number(p.dataset.stepPanel) !== n; });
    if (n === 4) buildSummaryCard();
    updateStepProgress();
    autoSave();
  }

  function updateStepProgress() {
    document.querySelectorAll('.step-node').forEach(node => {
      const s = Number(node.dataset.step);
      node.classList.toggle('active', s === currentStep);
      node.classList.toggle('done', s < currentStep);
    });
  }

  function validateStep(step) {
    if (step === 1) {
      if (!industryEl.value) return 'Select an industry to continue.';
      if (!sizeEl.value) return 'Select a company size to continue.';
    }
    if (step === 2) {
      if (!triggerEl.value) return "Select a trigger — it's the key personalisation signal.";
    }
    if (step === 3) {
      if (!selectedPath) return 'Choose where you are in the relationship.';
    }
    return null;
  }

  function selectPath(path) {
    selectedPath = path;
    document.querySelectorAll('.path-card').forEach(c => c.classList.toggle('active', c.dataset.path === path));
    warmExtra.hidden = path !== 'warm';
    $('toStep3') && ($('toStep3'));
    $('toStep4').disabled = false;
    autoSave();
  }

  // ── Colour theme ───────────────────────────────────
  function selectSwatch(swatch) {
    deselectSwatches();
    swatch.classList.add('active');
    currentTheme = swatch.dataset.hex;
    colourPicker.value = currentTheme;
    customHex.value = currentTheme.replace('#', '').toUpperCase();
    if (generatedOutputs) reapplyTheme();
    autoSave();
  }
  function deselectSwatches() { colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active')); }

  // ── Summary card (Step 4) ──────────────────────────
  function buildSummaryCard() {
    themeField.hidden = selectedPath === 'cold';
    const company = companyEl.value.trim() || 'Unnamed prospect';
    const industry = industryEl.value || '—';
    const size = sizeEl.value || '—';
    const trigger = TRIGGER_LABELS[triggerEl.value] || '—';

    let outs = [];
    if (selectedPath === 'cold') {
      outs = ['Plain text cold outreach email', 'Industry risk snapshot (PDF leave-behind)'];
    } else if (selectedPath === 'warm') {
      outs = ['Outlook-ready HTML follow-up email'];
      if (includeFirstImpression) outs.push('First Impression widget for Salesbuildr');
    } else if (selectedPath === 'quoting') {
      outs = ['Personalised proposal plan — 3–5 recommended hub tools in sequence'];
    }

    summaryCard.innerHTML = `
      <div class="sc-path">Path: ${PATH_LABELS[selectedPath] || ''}</div>
      <div class="sc-title">${escHtml(company)} · ${escHtml(industry)} · ${escHtml(size)}</div>
      <div class="sc-meta">Trigger: ${escHtml(trigger)}</div>
      <div>You'll get:</div>
      <ul>${outs.map(o => `<li>${escHtml(o)}</li>`).join('')}</ul>
    `;
  }

  // ── Build payload ──────────────────────────────────
  function buildPayload() {
    return {
      path: selectedPath,
      company: companyEl.value.trim(),
      industry: industryEl.value,
      size: sizeEl.value,
      contact: contactEl.value.trim(),
      role: roleEl.value || 'Unknown',
      trigger: triggerEl.value,
      triggerDetail: triggerDetailEl.value.trim(),
      mspName: mspNameEl.value.trim() || 'Your MSP',
      includeFirstImpression
    };
  }

  // ── Generate ───────────────────────────────────────
  async function generate() {
    hideError();
    const stepErr = validateStep(3) || validateStep(2) || validateStep(1);
    if (stepErr) { showError(stepErr); return; }

    const payload = buildPayload();
    lastPayload = payload;

    document.getElementById('step4').hidden = true;
    outputArea.hidden = true;
    loadingState.hidden = false;
    loadingMsg.textContent = 'Building your outreach kit…';
    $('generateBtn').disabled = true;

    try {
      const res = await fetch('/api/new-business-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');
      generatedOutputs = data;
      sessionStatus = 'generated';
      sentAt = null;
      renderOutputs();
      autoSave('generated');
      outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      document.getElementById('step4').hidden = false;
      showError('Something went wrong: ' + e.message);
    } finally {
      loadingState.hidden = true;
      $('generateBtn').disabled = false;
    }
  }

  // ── Render outputs ─────────────────────────────────
  function renderOutputs() {
    coldOutputs.hidden = selectedPath !== 'cold';
    warmOutputs.hidden = selectedPath !== 'warm';
    quotingOutputs.hidden = selectedPath !== 'quoting';
    moveToWarmBtn.hidden = !(selectedPath === 'cold' && sessionStatus === 'sent');
    outputTitle.textContent = `Outputs — ${PATH_LABELS[selectedPath] || ''}`;
    updateSentBadge();

    if (selectedPath === 'cold') renderColdOutputs(generatedOutputs);
    if (selectedPath === 'warm') renderWarmOutputs(generatedOutputs);
    if (selectedPath === 'quoting') renderQuotingOutputs(generatedOutputs);

    outputArea.hidden = false;
  }

  function reapplyTheme() {
    if (selectedPath === 'cold') renderColdOutputs(generatedOutputs);
    if (selectedPath === 'warm') renderWarmOutputs(generatedOutputs);
    autoSave();
  }

  // -- Cold --
  function renderColdOutputs(data) {
    const email = data.email || {};
    emailSubject.textContent = email.subject || '';
    emailBody.textContent = email.body || '';
    leaveBehindFrame.innerHTML = buildLeaveBehindHtml(data.leaveBehind || {}, currentTheme, buildPayload());
  }

  function buildLeaveBehindHtml(lb, hex, fd) {
    const risks = (lb.risks || []).map(r => `<li style="margin-bottom:8px;">${escHtml(r)}</li>`).join('');
    const questions = (lb.questions || []).map(q => `<li style="margin-bottom:8px;">${escHtml(q)}</li>`).join('');
    return `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1220;padding:36px;max-width:800px;margin:0 auto;">
  <div style="border-bottom:3px solid ${hex};padding-bottom:14px;margin-bottom:20px;">
    <div style="font-size:12px;color:#586273;text-transform:uppercase;letter-spacing:0.08em;">${escHtml(fd.mspName)}</div>
    <div style="font-size:22px;font-weight:bold;color:${hex};margin-top:4px;">IT Risk Snapshot for ${escHtml(fd.industry)} Businesses</div>
  </div>

  <h3 style="font-size:15px;color:${hex};margin-bottom:8px;">Top 3 IT Risks Right Now</h3>
  <ul style="font-size:13px;line-height:1.6;padding-left:20px;margin-top:0;">${risks}</ul>

  <h3 style="font-size:15px;color:${hex};margin-bottom:8px;margin-top:22px;">What "Good IT" Looks Like</h3>
  <p style="font-size:13px;line-height:1.6;">${escHtml(lb.benchmark || '')}</p>

  <h3 style="font-size:15px;color:${hex};margin-bottom:8px;margin-top:22px;">3 Questions Every Owner Should Be Able to Answer</h3>
  <ol style="font-size:13px;line-height:1.6;padding-left:20px;margin-top:0;">${questions}</ol>

  <div style="margin-top:30px;padding-top:14px;border-top:1px solid #e3e7ee;font-size:12px;color:#586273;">
    ${escHtml(fd.mspName)} — We specialise in ${escHtml(fd.industry)} IT.
  </div>
</div>`;
  }

  // -- Warm --
  function renderWarmOutputs(data) {
    const fu = data.followUpEmail || {};
    followUpSubject.textContent = fu.subject || '';
    followUpFrame.innerHTML = buildFollowUpEmailHtml(fu, currentTheme, buildPayload());

    const hasWidget = includeFirstImpression && data.firstImpressionWidget;
    firstImpressionPanel.hidden = !hasWidget;
    if (hasWidget) widgetFrame.innerHTML = buildFirstImpressionWidgetHtml(data.firstImpressionWidget, currentTheme, buildPayload());
  }

  function buildFollowUpEmailHtml(fu, hex, fd) {
    const bullets = (fu.summaryBullets || []).map(b =>
      `<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">• ${escHtml(b)}</p>`
    ).join('');
    return `<table width="600" cellpadding="0" cellspacing="0" border="0" align="center" role="presentation" style="width:600px;max-width:600px;">
  <tr>
    <td bgcolor="${hex}" style="background-color:${hex};padding:24px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;">${escHtml(fd.mspName)}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:22px 24px 6px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">${escHtml(fu.opening || '')}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:14px 24px;">
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:${hex};text-transform:uppercase;letter-spacing:1px;">Here's what I understood about your situation</p>
      ${bullets}
    </td>
  </tr>
  <tr>
    <td bgcolor="#f4f7fb" style="background-color:#f4f7fb;padding:16px 24px;">
      <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;color:${hex};text-transform:uppercase;letter-spacing:1px;">Recommendation</p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;">${escHtml(fu.recommendation || '')}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#333333;"><strong>Next step:</strong> ${escHtml(fu.nextStep || '')}</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#1a1a1a" style="background-color:#1a1a1a;padding:16px 24px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#ffffff;">${escHtml(fd.mspName)}</p>
    </td>
  </tr>
</table>`;
  }

  function buildFirstImpressionWidgetHtml(w, hex, fd) {
    return `<div style="background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};overflow:hidden;width:100%;">
  <div style="background:linear-gradient(135deg,${hex} 0%,${hex} 100%);padding:16px 20px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:4px;">First Impression</div>
    <h5 style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">${escHtml(fd.mspName)} for ${escHtml(fd.industry)} Businesses</h5>
  </div>
  <div style="padding:16px 20px;">
    <h6 style="margin:0 0 6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${hex};">Why we work with ${escHtml(fd.industry)} businesses</h6>
    <p style="margin:0 0 14px 0;font-size:13px;color:#4B5563;line-height:1.6;">${escHtml(w.whyIndustry || '')}</p>
    <h6 style="margin:0 0 6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${hex};">What to expect — first 30/60/90 days</h6>
    <p style="margin:0 0 14px 0;font-size:13px;color:#4B5563;line-height:1.6;">${escHtml(w.engagementExpectations || '')}</p>
    <h6 style="margin:0 0 6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${hex};">Why us</h6>
    <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.6;">${escHtml(w.credibilityStatement || '')}</p>
  </div>
</div>`;
  }

  // -- Quoting --
  function renderQuotingOutputs(data) {
    const fd = buildPayload();
    proposalPlanHead.innerHTML = `
      <div class="pp-title">Recommended proposal structure for:</div>
      <div class="pp-meta">${escHtml(fd.industry)} · ${escHtml(fd.size)} staff${fd.company ? ' · ' + escHtml(fd.company) : ''}</div>
    `;
    const plan = data.proposalPlan || [];
    proposalPlanList.innerHTML = plan.map((item, i) => {
      const url = TOOL_URLS[item.tool] || null;
      return `<li class="pp-item">
        <div class="pp-item-head"><span><span class="pp-item-num">${i + 1}</span><span class="pp-item-tool">${escHtml(item.tool)}</span></span></div>
        <div class="pp-item-why">${escHtml(item.why || '')}</div>
        ${url ? `<a class="pp-item-link" href="${url}" target="_blank" rel="noopener">Open ${escHtml(item.tool)} →</a>` : ''}
      </li>`;
    }).join('');
  }

  // ── Copy / Push ────────────────────────────────────
  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }).catch(() => alert('Could not copy to clipboard.'));
  }

  function onPushWidgetClick() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    doPush(apiKey, tenantUrl);
  }

  function onSaveAndPush() {
    const apiKey = pushApiKey.value.trim();
    const tenantUrl = pushTenantUrl.value.trim();
    if (!apiKey || !tenantUrl) { alert('Please enter both your API key and tenant URL.'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    doPush(apiKey, tenantUrl);
  }

  async function doPush(apiKey, tenantUrl) {
    pushStatus.hidden = true;
    pushWidgetBtn.disabled = true;
    pushWidgetBtn.textContent = 'Pushing…';

    const html = widgetFrame.innerHTML;
    const fd = buildPayload();
    const title = `First Impression — ${fd.industry}${fd.company ? ' — ' + fd.company : ''}`;

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: [{ type: 'html', content: html, title }], prefix: title, apiKey, tenantUrl })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus('✓ Widget pushed to Salesbuildr successfully.', 'success');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error. Check your credentials.'), 'error');
      }
    } catch (e) {
      showPushStatus('Push failed: ' + (e.message || 'Network error.'), 'error');
    } finally {
      pushWidgetBtn.disabled = false;
      pushWidgetBtn.textContent = 'Push to Salesbuildr';
    }
  }

  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status ' + type;
    pushStatus.hidden = false;
    pushStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Sent / Promote ─────────────────────────────────
  function onMarkSent() {
    sessionStatus = 'sent';
    sentAt = Date.now();
    updateSentBadge();
    moveToWarmBtn.hidden = selectedPath !== 'cold';
    autoSave('sent');
    showToast('Marked as sent.');
  }

  function updateSentBadge() {
    if (sessionStatus === 'sent' && sentAt) {
      sentBadge.hidden = false;
      sentBadge.textContent = '✅ Sent ' + fmtDate(sentAt);
    } else {
      sentBadge.hidden = true;
    }
  }

  function onMoveToWarm() {
    // Carry prospect details into a fresh Warm session
    currentSessionId = 'nbk_' + Date.now();
    selectedPath = 'warm';
    sessionStatus = 'in_progress';
    sentAt = null;
    generatedOutputs = null;
    lastPayload = null;
    triggerDetailEl.value = triggerDetailEl.value || '';
    document.querySelectorAll('.path-card').forEach(c => c.classList.toggle('active', c.dataset.path === 'warm'));
    warmExtra.hidden = false;
    outputArea.hidden = true;
    document.getElementById('step4').hidden = false;
    goToStep(4);
    autoSave('in_progress');
    showToast('Moved to Warm — review Step 4 and generate the follow-up email.');
  }

  // ── Sessions ───────────────────────────────────────
  function getSessions()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)  || '[]'); } catch { return []; } }
  function saveSessions(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { console.warn('Session save failed:', e); } }
  function getArchived()   { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a) { try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); } catch (e) { console.warn(e); } }

  function buildSessionSnapshot() {
    const fd = buildPayload();
    return {
      id: currentSessionId,
      createdAt: (getSessions().find(s => s.id === currentSessionId) || {}).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: sessionStatus,
      company: fd.company,
      industry: fd.industry,
      size: fd.size,
      contact: fd.contact,
      role: fd.role,
      trigger: fd.trigger,
      triggerDetail: fd.triggerDetail,
      path: selectedPath,
      includeFirstImpression,
      currentStep,
      sentAt,
      outputs: generatedOutputs,
      lastPayload,
      themeColor: currentTheme
    };
  }

  function autoSave(status) {
    if (!autoSaveReady) return;
    if (status) sessionStatus = status;
    if (!currentSessionId) currentSessionId = 'nbk_' + Date.now();
    let sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    const snap = buildSessionSnapshot();
    if (idx >= 0) sessions[idx] = snap; else sessions.unshift(snap);
    sessions = sessions.slice(0, SESSION_LIMIT);
    saveSessions(sessions);
    renderSessionCards();
    flashSaved();
  }

  function flashSaved() {
    autoSaveLabel.classList.add('visible');
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(() => autoSaveLabel.classList.remove('visible'), 1400);
  }

  function onNewProspectClick() {
    const sessions = getSessions();
    const hasCurrent = sessions.some(s => s.id === currentSessionId);
    if (sessions.length >= SESSION_LIMIT && !hasCurrent) {
      limitMsg.hidden = false;
      limitMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    startNewSession();
  }

  function startNewSession() {
    limitMsg.hidden = true;
    currentSessionId = 'nbk_' + Date.now();
    autoSaveReady = false;

    companyEl.value = ''; industryEl.value = ''; sizeEl.value = '';
    contactEl.value = ''; roleEl.value = '';
    triggerEl.value = ''; triggerDetailEl.value = '';
    selectedPath = null;
    includeFirstImpression = false;
    includeFirstImpressionEl.checked = false;
    warmExtra.hidden = true;
    document.querySelectorAll('.path-card').forEach(c => c.classList.remove('active'));
    $('toStep4').disabled = true;
    currentTheme = '#0f1f3d';
    colourPicker.value = currentTheme;
    customHex.value = '0F1F3D';
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.hex === '#0f1f3d'));

    generatedOutputs = null;
    lastPayload = null;
    sessionStatus = 'in_progress';
    sentAt = null;

    outputArea.hidden = true;
    document.getElementById('step4').hidden = false;
    hideError();
    autoSaveReady = true;
    goToStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    autoSave('in_progress');
  }

  function resumeSession(sess) {
    currentSessionId = sess.id;
    companyEl.value = sess.company || '';
    industryEl.value = sess.industry || '';
    sizeEl.value = sess.size || '';
    contactEl.value = sess.contact || '';
    roleEl.value = sess.role || '';
    triggerEl.value = sess.trigger || '';
    triggerDetailEl.value = sess.triggerDetail || '';

    selectedPath = sess.path || null;
    includeFirstImpression = !!sess.includeFirstImpression;
    includeFirstImpressionEl.checked = includeFirstImpression;
    warmExtra.hidden = selectedPath !== 'warm';
    document.querySelectorAll('.path-card').forEach(c => c.classList.toggle('active', c.dataset.path === selectedPath));
    $('toStep4').disabled = !selectedPath;

    currentTheme = sess.themeColor || '#0f1f3d';
    colourPicker.value = currentTheme;
    customHex.value = currentTheme.replace('#', '').toUpperCase();
    let matched = false;
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      const m = s.dataset.hex === currentTheme;
      s.classList.toggle('active', m);
      if (m) matched = true;
    });

    generatedOutputs = sess.outputs || null;
    lastPayload = sess.lastPayload || null;
    sessionStatus = sess.status || 'in_progress';
    sentAt = sess.sentAt || null;

    if (generatedOutputs) {
      document.getElementById('step4').hidden = true;
      renderOutputs();
    } else {
      outputArea.hidden = true;
      document.getElementById('step4').hidden = false;
    }

    currentStep = sess.currentStep || (generatedOutputs ? 4 : 1);
    document.querySelectorAll('[data-step-panel]').forEach(p => { p.hidden = Number(p.dataset.stepPanel) !== currentStep; });
    if (currentStep === 4) buildSummaryCard();
    updateStepProgress();

    renderSessionCards();
  }

  function toggleArchived() {
    showingArchived = !showingArchived;
    archivedPanel.hidden = !showingArchived;
    showArchivedBtn.textContent = showingArchived ? 'Hide archived' : 'Show archived';
    if (showingArchived) renderArchivedCards();
  }

  function renderSessionCards() {
    const sessions = getSessions();
    sessionsBlock.hidden = sessions.length === 0;
    sessionsEmptyRow.hidden = sessions.length !== 0;
    sessionCards.innerHTML = '';
    sessions.forEach(sess => sessionCards.appendChild(buildSessionCardEl(sess, false)));
  }

  function renderArchivedCards() {
    const archived = getArchived();
    archivedCards.innerHTML = archived.length
      ? ''
      : '<p class="hint">No archived prospects.</p>';
    archived.forEach(sess => archivedCards.appendChild(buildSessionCardEl(sess, true)));
  }

  function buildSessionCardEl(sess, isArchived) {
    const card = document.createElement('div');
    card.className = 'session-card' + (sess.id === currentSessionId ? ' current' : '');
    const pathBadgeClass = { cold: 'badge-cold', warm: 'badge-warm', quoting: 'badge-quoting' }[sess.path] || 'badge-progress';
    const pathLabel = { cold: '🔵 Cold', warm: '🟡 Warm', quoting: '🟢 Quoting' }[sess.path] || 'No path yet';
    const stageBadgeClass = sess.status === 'sent' ? 'badge-sent' : (sess.status === 'generated' ? 'badge-generated' : 'badge-progress');
    const stageLabel = sess.status === 'sent' ? 'Sent' : (sess.status === 'generated' ? 'Generated' : `Step ${sess.currentStep || 1} of 4`);

    card.innerHTML = `
      <div class="sc-company">${escHtml(sess.company || 'Unnamed prospect')}</div>
      <div class="sc-industry">${escHtml(sess.industry || '')}${sess.size ? ' · ' + escHtml(sess.size) : ''}</div>
      <div class="sc-badges">
        <span class="badge ${pathBadgeClass}">${pathLabel}</span>
        <span class="badge ${stageBadgeClass}">${stageLabel}</span>
      </div>
      <div class="sc-date">${fmtAge(sess.updatedAt)}</div>
      <div class="sc-actions">
        ${isArchived ? '<button data-act="restore">Restore</button><button data-act="delete">Delete</button>'
                     : '<button data-act="archive">Archive</button><button data-act="duplicate">Duplicate</button><button data-act="export">Export</button>'}
      </div>
    `;
    card.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') resumeSession(sess); });
    card.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === 'archive') archiveSession(sess.id);
        if (act === 'duplicate') duplicateSession(sess);
        if (act === 'export') exportSession(sess);
        if (act === 'restore') restoreSession(sess.id);
        if (act === 'delete') deleteArchivedSession(sess.id);
      });
    });
    return card;
  }

  function archiveSession(id) {
    const sessions = getSessions();
    const target = sessions.find(s => s.id === id);
    saveSessions(sessions.filter(s => s.id !== id));
    if (target) saveArchived([{ ...target, archivedAt: new Date().toISOString() }, ...getArchived()]);
    if (id === currentSessionId) {
      const remaining = getSessions();
      if (remaining.length) resumeSession(remaining[0]); else startNewSession();
    }
    renderSessionCards();
    showToast('Prospect archived.');
  }

  function duplicateSession(sess) {
    const sessions = getSessions();
    if (sessions.length >= SESSION_LIMIT) { limitMsg.hidden = false; return; }
    const copy = { ...sess, id: 'nbk_' + Date.now(), company: (sess.company || 'Unnamed prospect') + ' (copy)', status: 'in_progress', sentAt: null, outputs: null, lastPayload: null, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    sessions.unshift(copy);
    saveSessions(sessions.slice(0, SESSION_LIMIT));
    renderSessionCards();
    showToast('Session duplicated.');
  }

  function exportSession(sess) {
    const blob = new Blob([JSON.stringify(sess, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (sess.company || 'prospect').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${safeName}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Session exported — import on any device to continue.');
  }

  function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let imported;
      try { imported = JSON.parse(reader.result); } catch { alert('That file is not a valid session export.'); return; }
      if (!imported || typeof imported !== 'object' || !('path' in imported === false && false)) { /* basic shape check below */ }
      if (!('company' in imported) && !('industry' in imported)) { alert('That file does not look like a New Business Kit session.'); return; }

      let sessions = getSessions();
      const dup = sessions.find(s => (s.company || '').trim().toLowerCase() === (imported.company || '').trim().toLowerCase() && (imported.company || '').trim());
      if (dup) {
        if (!confirm(`A session for ${imported.company} already exists. Replace it? (Cancel keeps both)`)) {
          imported.id = 'nbk_' + Date.now();
          sessions.unshift(imported);
        } else {
          const idx = sessions.findIndex(s => s.id === dup.id);
          imported.id = dup.id;
          sessions[idx] = imported;
        }
      } else {
        imported.id = imported.id && !sessions.find(s => s.id === imported.id) ? imported.id : 'nbk_' + Date.now();
        if (sessions.length >= SESSION_LIMIT) { limitMsg.hidden = false; return; }
        sessions.unshift(imported);
      }
      saveSessions(sessions.slice(0, SESSION_LIMIT));
      renderSessionCards();
      showToast(`Session imported — ${imported.company || 'Unnamed prospect'} added to your active prospects.`);
      importFile.value = '';
    };
    reader.readAsText(file);
  }

  function restoreSession(id) {
    const sessions = getSessions();
    if (sessions.length >= SESSION_LIMIT) { alert('Archive an active prospect first — you have 5 active already.'); return; }
    const archived = getArchived();
    const target = archived.find(s => s.id === id);
    if (!target) return;
    saveArchived(archived.filter(s => s.id !== id));
    sessions.unshift(target);
    saveSessions(sessions);
    renderSessionCards();
    renderArchivedCards();
    showToast('Prospect restored to active list.');
  }

  function deleteArchivedSession(id) {
    if (!confirm('This cannot be undone. Delete this archived prospect permanently?')) return;
    saveArchived(getArchived().filter(s => s.id !== id));
    renderArchivedCards();
  }

  // ── UI helpers ─────────────────────────────────────
  function showError(msg) { formError.textContent = msg; formError.hidden = false; formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  function hideError() { formError.hidden = true; }

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add('visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.hidden = true, 300); }, 2600);
  }

  function fmtAge(iso) {
    const ts = new Date(iso).getTime();
    if (isNaN(ts)) return '';
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h === 1 ? '1 hour ago' : h + 'h ago';
    const d = Math.floor(h / 24);
    if (d === 1) return 'Yesterday';
    if (d < 7) return d + ' days ago';
    return new Date(ts).toLocaleDateString();
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  init();
})();
