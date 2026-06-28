/* =============================================
   Renewal Pack v2 — Frontend JS
   ============================================= */
(function () {
  'use strict';

  // ── Constants ──────────────────────────────
  const SESSION_KEY    = 'renewal_sessions';
  const ARCHIVE_KEY    = 'renewal_sessions_archived';
  const SESSION_LIMIT  = 5;
  const ARCHIVE_DAYS   = 30;
  const CORE_WIDGETS   = [0, 1, 2, 3, 4, 5]; // 0 = cover letter

  // ── State ──────────────────────────────────
  let currentMode     = 'standard';
  let currentTheme    = '#0f1f3d';
  let fetchedQuote    = null;
  let lastPayload     = null;
  let pendingPushType = null;
  let widgets         = {}; // keyed by widget id: 0,1,2,3,4,5, then 'upsell_ServiceName'
  let upsellWidgetIds = []; // ordered list of upsell widget ids in current session
  let currentSessionId = null;

  // ── DOM refs ───────────────────────────────
  const $ = id => document.getElementById(id);

  const quoteInput      = $('quoteInput');
  const sbApiKey        = $('sbApiKey');
  const sbTenantUrl     = $('sbTenantUrl');
  const credsFields     = $('credsFields');
  const credsSavedLabel = $('credsSavedLabel');
  const toggleCredsBtn  = $('toggleCredsBtn');
  const fetchBtn        = $('fetchBtn');
  const fetchStatus     = $('fetchStatus');

  const sessionsBlock   = $('sessionsBlock');
  const sessionCards    = $('sessionCards');
  const showArchivedBtn = $('showArchivedBtn');

  const step2Block    = $('step2Block');
  const step3Block    = $('step3Block');
  const step4Block    = $('step4Block');
  const step5Block    = $('step5Block');
  const generateBlock = $('generateBlock');

  const quoteMeta     = $('quoteMeta');
  const itemsList     = $('itemsList');
  const selectAllBtn  = $('selectAllBtn');
  const selectNoneBtn = $('selectNoneBtn');

  const modeStandard  = $('modeStandard');
  const modeAtRisk    = $('modeAtRisk');
  const atRiskBadge   = $('atRiskBadge');
  const atRiskContext = $('atRiskContext');

  const generateBtn    = $('generateBtn');
  const formError      = $('formError');
  const loadingOverlay = $('loadingOverlay');
  const loadingMsg     = $('loadingMsg');
  const emptyState     = $('emptyState');
  const outputArea     = $('outputArea');

  const deliveryTitle     = $('deliveryTitle');
  const saveSessionBtn    = $('saveSessionBtn');
  const copyAllBtn        = $('copyAllBtn');
  const pushPackBtn       = $('pushPackBtn');
  const pushIndividualBtn = $('pushIndividualBtn');
  const pushStatus        = $('pushStatus');
  const credsInline       = $('credsInline');
  const pushApiKey        = $('pushApiKey');
  const pushTenantUrl     = $('pushTenantUrl');
  const saveAndPushBtn    = $('saveAndPushBtn');
  const upsellCardsEl     = $('upsellCards');
  const widget5Label      = $('widget5Label');

  const colourSwatches    = $('colourSwatches');
  const customHex         = $('customHex');
  const hexPreview        = $('hexPreview');

  // ── Init ───────────────────────────────────
  function init() {
    const savedKey = localStorage.getItem('sb_api_key');
    const savedUrl = localStorage.getItem('sb_tenant_url');
    if (savedKey && savedUrl) {
      sbApiKey.value = savedKey; sbTenantUrl.value = savedUrl;
      credsFields.hidden = true; credsSavedLabel.hidden = false;
      toggleCredsBtn.textContent = 'Change credentials';
    } else {
      credsFields.hidden = false; credsSavedLabel.hidden = true;
    }

    toggleCredsBtn.addEventListener('click', () => {
      credsFields.hidden = !credsFields.hidden;
      toggleCredsBtn.textContent = credsFields.hidden ? 'Change credentials' : 'Hide';
    });

    fetchBtn.addEventListener('click', onFetch);
    quoteInput.addEventListener('keydown', e => { if (e.key === 'Enter') onFetch(); });

    selectAllBtn.addEventListener('click',  () => setAllItems(true));
    selectNoneBtn.addEventListener('click', () => setAllItems(false));

    modeStandard.addEventListener('click', () => setMode('standard'));
    modeAtRisk.addEventListener('click',   () => setMode('at-risk'));

    generateBtn.addEventListener('click', onGenerate);

    saveSessionBtn.addEventListener('click', onSaveSession);
    copyAllBtn.addEventListener('click', onCopyAll);
    pushPackBtn.addEventListener('click', () => onPush('pack'));
    pushIndividualBtn.addEventListener('click', () => onPush('individual'));
    saveAndPushBtn.addEventListener('click', onSaveAndPush);
    showArchivedBtn.addEventListener('click', onShowArchived);

    colourSwatches.querySelectorAll('.swatch').forEach(s =>
      s.addEventListener('click', () => selectSwatch(s))
    );
    customHex.addEventListener('input', onCustomHex);

    // Core widget buttons
    CORE_WIDGETS.forEach(i => {
      const regenBtn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
      const copyBtn  = document.querySelector(`.widget-copy[data-widget="${i}"]`);
      const htmlBtn  = document.querySelector(`.show-html-btn[data-widget="${i}"]`);
      if (regenBtn) regenBtn.addEventListener('click', () => onRegenWidget(i));
      if (copyBtn)  copyBtn.addEventListener('click',  () => onCopyWidget(i));
      if (htmlBtn)  htmlBtn.addEventListener('click',  () => onToggleHtml(i));

      const editor = $(`widget${i}Editor`);
      if (editor) editor.addEventListener('input', function () {
        widgets[i] = this.value;
        renderPreview(i);
      });
    });

    renderSessionCards();
  }

  // ── Extract quote ID ───────────────────────
  function extractQuoteId(input) {
    const s = input.trim();
    if (s.startsWith('http')) {
      const parts = s.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
    return s.length > 4 ? s : null;
  }

  // ── Fetch quote ────────────────────────────
  async function onFetch() {
    const input = quoteInput.value.trim();
    if (!input) { showFetchStatus('Paste a quote URL or ID first.', 'err'); return; }
    const quoteId = extractQuoteId(input);
    if (!quoteId) { showFetchStatus('Could not read a quote ID from that input.', 'err'); return; }

    const apiKey    = sbApiKey.value.trim()    || localStorage.getItem('sb_api_key');
    const tenantUrl = sbTenantUrl.value.trim() || localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) { showFetchStatus('Enter your API key and tenant URL first.', 'err'); credsFields.hidden = false; return; }

    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsSavedLabel.hidden = false; credsFields.hidden = true;
    toggleCredsBtn.textContent = 'Change credentials';

    fetchBtn.disabled = true; fetchBtn.textContent = 'Fetching…';
    setOutputLoading(true, 'Fetching quote from Salesbuildr…');
    hideFetchStatus();

    try {
      const res  = await fetch('/api/renewal-pack-fetch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, apiKey, tenantUrl })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Could not fetch quote.');

      fetchedQuote = data.quote;
      currentSessionId = 'session_' + quoteId;
      renderQuoteMeta(fetchedQuote);
      renderItemsList(fetchedQuote.items || []);

      step2Block.hidden = false; step3Block.hidden = false;
      step4Block.hidden = false; step5Block.hidden = false;
      generateBlock.hidden = false;

      setOutputLoading(false);
      showFetchStatus('Loaded: ' + (fetchedQuote.title || quoteId), 'ok');
      autoSaveSession('fetched');

    } catch (err) {
      setOutputLoading(false);
      showFetchStatus(err.message, 'err');
    } finally {
      fetchBtn.disabled = false; fetchBtn.textContent = 'Fetch Quote';
    }
  }

  // ── Quote meta ─────────────────────────────
  function calcMonthlyValue(quote) {
    const fromPayment = quote.paymentDetails?.monthlyRecurringRevenue
                     ?? quote.paymentDetails?.recurringTotal ?? null;
    if (fromPayment != null) return fromPayment;
    return (quote.items || []).reduce((sum, item) => {
      return sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1));
    }, 0);
  }

  function renderQuoteMeta(quote) {
    const company = quote.company?.name || '—';
    const title   = quote.title || '—';
    const start   = fmtDate(quote.contractStartDate);
    const end     = fmtDate(quote.contractEndDate);
    const monthly = calcMonthlyValue(quote);
    quoteMeta.innerHTML = `
      <strong>${company}</strong><br>${title}
      ${start && end ? `<br>Contract: ${start} → ${end}` : ''}
      ${monthly > 0 ? `<br>Monthly value: ${fmtCurrency(monthly)}` : ''}`.trim();
  }

  // ── Items checklist ────────────────────────
  function classifyItem(item) {
    const cat = (item.category?.name || '').toLowerCase();
    if (/labou?r|professional service|engineer|technician/i.test(cat)) return 'labor';
    if (/\bproduct\b|hardware|equipment/i.test(cat)) return 'product';
    if (/service|managed|monitoring|support|subscription|recurring/i.test(cat)) return 'service';
    if (item.term === 'month' || item.term === 'year') return 'service';
    return 'other';
  }

  function renderItemsList(items) {
    itemsList.innerHTML = '';
    if (!items.length) {
      itemsList.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:8px;">No line items found on this quote.</div>';
      return;
    }
    items.forEach((item, idx) => {
      const type    = classifyItem(item);
      const checked = type === 'service';
      const row = document.createElement('label');
      row.className = 'item-row';
      row.innerHTML = `
        <input type="checkbox" data-idx="${idx}" ${checked ? 'checked' : ''} />
        <span class="item-name">${escHtml(item.name || 'Unnamed item')}</span>
        <span class="item-type item-type-${type}">${type}</span>`;
      itemsList.appendChild(row);
    });
  }

  function setAllItems(checked) {
    itemsList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
  }

  // ── Mode ────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;
    modeStandard.classList.toggle('active', mode === 'standard');
    modeAtRisk.classList.toggle('active',   mode === 'at-risk');
    const isAtRisk = mode === 'at-risk';
    atRiskBadge.hidden   = !isAtRisk;
    atRiskContext.hidden = !isAtRisk;
    widget5Label.textContent = isAtRisk ? 'Widget 5 — Our Commitment Going Forward' : "Widget 5 — What's Next";
  }

  // ── Colour ──────────────────────────────────
  function selectSwatch(el) {
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    currentTheme = el.dataset.hex;
    customHex.value = ''; hexPreview.style.background = 'transparent';
    refreshPreviews();
  }
  function onCustomHex() {
    const val = customHex.value.trim();
    if (/^[0-9A-Fa-f]{6}$/.test(val)) {
      currentTheme = '#' + val;
      hexPreview.style.background = currentTheme;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      refreshPreviews();
    }
  }

  // ── Collect picker values ──────────────────
  function collectPicker(containerId, customId) {
    const selected = [];
    document.querySelectorAll(`#${containerId} input:checked`).forEach(cb => selected.push(cb.value));
    const custom = $(customId)?.value.trim();
    if (custom) selected.push(custom);
    return selected;
  }

  function collectUpsells() {
    const selected = [];
    document.querySelectorAll('.upsell-cb:checked').forEach(cb => selected.push(cb.value));
    const custom = $('upsellCustom')?.value.trim();
    if (custom) selected.push(custom);
    return selected;
  }

  // ── Build payload ───────────────────────────
  function buildPayload() {
    if (!fetchedQuote) return null;
    const checkedItems = [];
    itemsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      const idx  = parseInt(cb.dataset.idx);
      const item = fetchedQuote.items[idx];
      if (item) checkedItems.push(item.name || 'Unnamed item');
    });

    const concerns   = collectPicker('concernPicker',  'concernCustom');
    const changes    = collectPicker('changesPicker',  'changesCustom');
    const responses  = collectPicker('responsePicker', 'responseCustom');
    const upsells    = collectUpsells();

    return {
      mode:             currentMode,
      client:           fetchedQuote.company?.name || '',
      quoteTitle:       fetchedQuote.title || '',
      contractStart:    fetchedQuote.contractStartDate || '',
      contractEnd:      fetchedQuote.contractEndDate   || '',
      monthlyValue:     calcMonthlyValue(fetchedQuote),
      services:         checkedItems,
      stats: {
        tickets:      parseInt($('tickets').value) || null,
        responseTime: $('responseTime').value.trim(),
        uptime:       $('uptime').value.trim()
      },
      highlights:        $('highlights').value.trim(),
      concern:           concerns.join('; '),
      changesSinceSigning: changes.join('; '),
      proposedResponse:  responses.join('; '),
      upsells,
      personalised:      $('personalised').checked,
      mergeTagsAvailable: ['{{company.name}}', '{{contact.firstName}}', '{{servicingBranch.name}}']
    };
  }

  // ── Generate ────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();
    if (!payload)                { showError('Please fetch a quote first.'); return; }
    if (!payload.services.length){ showError('Select at least one service to include.'); return; }
    if (currentMode === 'at-risk' && !payload.concern) {
      showError("Select at least one client concern for At-Risk mode."); return;
    }

    lastPayload = payload;
    setOutputLoading(true, 'Analysing services and building your renewal pack…');
    generateBtn.disabled = true;

    try {
      const res  = await fetch('/api/renewal-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');
      populateWidgets(data, payload);
    } catch (err) {
      showError('Something went wrong: ' + err.message);
    } finally {
      setOutputLoading(false);
      generateBtn.disabled = false;
    }
  }

  function populateWidgets(data, payload) {
    upsellWidgetIds = [];

    // Widget 0 — cover letter
    if (data.coverLetter) {
      const cl   = data.coverLetter;
      const html = buildCoverLetterHtml(cl.headline, cl.intro, cl.stats || [], cl.closing, currentTheme);
      widgets[0] = html;
      $('widget0Editor').value = html;
      renderPreview(0);
      $('widget0Card').hidden = false;
    }

    // Widgets 1–5
    const map = { 1: data.valueDelivered, 2: data.partnership, 3: data.continuity, 4: data.whatsIncluded, 5: data.whatsNext };
    for (let i = 1; i <= 5; i++) {
      const w = map[i];
      const html = buildWidgetHtml(w.headline, w.body);
      widgets[i] = html;
      $(`widget${i}Editor`).value = html;
      renderPreview(i);
    }

    // Upsell cards
    upsellCardsEl.innerHTML = '';
    if (data.upsells && data.upsells.length) {
      data.upsells.forEach(u => {
        // Strip anything that isn't alphanumeric or underscore — keeps IDs/selectors valid
        const uid  = 'upsell_' + u.service.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
        const html = buildUpsellHtml(u.service, u.headline, u.body);
        widgets[uid] = html;
        upsellWidgetIds.push(uid);
        upsellCardsEl.appendChild(makeUpsellCard(uid, u.service, html));
      });
    }

    deliveryTitle.textContent = payload.client + ' — Renewal Pack';
    emptyState.hidden = true;
    outputArea.hidden = false;
    autoSaveSession('generated');
  }

  // ── Widget HTML builders ───────────────────
  function buildWidgetHtml(headline, body, isCover) {
    const theme = currentTheme;
    // Cover letter: stats bar inline if present (handled by body containing |STATS| marker)
    const paras = body.split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${escHtml(l)}</p>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
  <div style="width:100%;background:${escHtml(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${escHtml(headline)}</h5>
  </div>
  <div style="padding:16px 20px 6px;">${paras}</div>
</div>`;
  }

  function buildCoverLetterHtml(headline, intro, stats, closing, theme) {
    // Inline stats bar — 3 cells max, safe for TinyMCE using table
    let statsBar = '';
    if (stats && stats.length) {
      const cells = stats.slice(0, 3).map(s =>
        `<td style="width:${Math.floor(100/stats.length)}%;text-align:center;padding:12px 8px;border-right:1px solid #E5E7EB;">
          <div style="font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700;color:${escHtml(theme)};">${escHtml(s.value)}</div>
          <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9CA3AF;margin-top:4px;">${escHtml(s.label)}</div>
        </td>`
      ).join('');
      // Remove border from last cell
      statsBar = `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:4px;margin-bottom:16px;">
  <tr>${cells}</tr>
</table>`;
    }

    const introPara  = `<p style="margin:0 0 12px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${escHtml(intro)}</p>`;
    const closingPara = `<p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${escHtml(closing)}</p>`;

    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
  <div style="width:100%;background:${escHtml(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${escHtml(headline)}</h5>
  </div>
  <div style="padding:16px 20px;">
    ${introPara}
    ${statsBar}
    ${closingPara}
  </div>
</div>`;
  }

  function buildUpsellHtml(service, headline, body) {
    const theme = currentTheme;
    const paras = body.split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${escHtml(l)}</p>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid ${escHtml(theme)};border-radius:6px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
  <div style="width:100%;background:${escHtml(theme)};padding:12px 20px;">
    <div style="font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Recommended Addition</div>
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${escHtml(headline)}</h5>
  </div>
  <div style="padding:16px 20px 6px;">${paras}</div>
</div>`;
  }

  // ── Make upsell card DOM element ───────────
  function makeUpsellCard(uid, service, html) {
    const card = document.createElement('div');
    card.className = 'widget-card upsell-card';
    card.id = 'card_' + uid;
    card.innerHTML = `
      <div class="widget-header">
        <div class="widget-label">Recommended — ${escHtml(service)}</div>
        <div class="widget-actions">
          <button class="btn-secondary widget-regen-upsell" data-uid="${escHtml(uid)}" data-service="${escHtml(service)}">Regenerate</button>
          <button class="btn-secondary widget-copy-upsell" data-uid="${escHtml(uid)}">Copy HTML</button>
          <button class="btn-text show-html-upsell" data-uid="${escHtml(uid)}">Show HTML</button>
        </div>
      </div>
      <div class="widget-preview" id="preview_${escHtml(uid)}"></div>
      <textarea class="widget-editor" id="editor_${escHtml(uid)}" rows="7" hidden></textarea>`;

    card.querySelector('.widget-regen-upsell').addEventListener('click', () => onRegenUpsell(uid, service));
    card.querySelector('.widget-copy-upsell').addEventListener('click',  () => onCopyUpsell(uid));
    card.querySelector('.show-html-upsell').addEventListener('click',    () => onToggleHtmlUpsell(uid));
    card.querySelector(`#editor_${uid}`).addEventListener('input', function () {
      widgets[uid] = this.value;
      document.getElementById('preview_' + uid).innerHTML = this.value;
    });

    card.querySelector('#preview_' + uid).innerHTML = html;
    card.querySelector('#editor_'  + uid).value     = html;
    return card;
  }

  // ── Render / refresh previews ──────────────
  function renderPreview(i) {
    const el = $(`widget${i}Preview`);
    if (el) el.innerHTML = widgets[i] || '';
  }

  function refreshPreviews() {
    // Rebuild all core widgets with new theme
    CORE_WIDGETS.forEach(i => {
      if (!widgets[i]) return;
      const hMatch = widgets[i].match(/<h5[^>]*>([^<]*)<\/h5>/i);
      const bMatch = widgets[i].match(/<div style="padding:[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*$/i);
      if (!hMatch || !bMatch) return;
      const headline = unescHtml(hMatch[1]);
      const body     = bMatch[1].replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'').trim();
      widgets[i] = buildWidgetHtml(headline, body);
      const ed = $(`widget${i}Editor`);
      if (ed) ed.value = widgets[i];
      renderPreview(i);
    });
    // Rebuild upsell widgets
    upsellWidgetIds.forEach(uid => {
      if (!widgets[uid]) return;
      const hMatch = widgets[uid].match(/<h5[^>]*>([^<]*)<\/h5>/i);
      const bMatch = widgets[uid].match(/border-left:[^;]+;[^>]*>([\s\S]*?)<\/div>\s*$|<div style="padding:[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*$/i);
      if (!hMatch) return;
      const headline = unescHtml(hMatch[1]);
      const bodyRaw  = (bMatch ? (bMatch[1] || bMatch[2] || '') : '').replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'').trim();
      const service  = uid.replace('upsell_', '').replace(/_/g, ' ');
      widgets[uid] = buildUpsellHtml(service, headline, bodyRaw);
      const ed = document.getElementById('editor_' + uid);
      const pr = document.getElementById('preview_' + uid);
      if (ed) ed.value = widgets[uid];
      if (pr) pr.innerHTML = widgets[uid];
    });
  }

  // ── Show/hide HTML editor ──────────────────
  function onToggleHtml(i) {
    const editor = $(`widget${i}Editor`);
    const btn    = document.querySelector(`.show-html-btn[data-widget="${i}"]`);
    if (!editor || !btn) return;
    const showing = !editor.hidden;
    editor.hidden  = showing;
    btn.textContent = showing ? 'Show HTML' : 'Hide HTML';
  }
  function onToggleHtmlUpsell(uid) {
    const editor = document.getElementById('editor_' + uid);
    const btn    = document.querySelector(`.show-html-upsell[data-uid="${uid}"]`);
    if (!editor || !btn) return;
    const showing = !editor.hidden;
    editor.hidden  = showing;
    btn.textContent = showing ? 'Show HTML' : 'Hide HTML';
  }

  // ── Regenerate ─────────────────────────────
  async function onRegenWidget(i) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    btn.disabled = true; btn.textContent = '…';
    try {
      const res  = await fetch('/api/renewal-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenWidget: i })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const map = { 0: data.coverLetter, 1: data.valueDelivered, 2: data.partnership, 3: data.continuity, 4: data.whatsIncluded, 5: data.whatsNext };
      if (!map[i]) return;
      const html = i === 0
        ? buildCoverWithData(data.coverLetter)
        : buildWidgetHtml(map[i].headline, map[i].body);
      widgets[i] = html;
      $(`widget${i}Editor`).value = html;
      renderPreview(i);
    } catch(e) { console.error('Regen error:', e); }
    finally { btn.disabled = false; btn.textContent = 'Regenerate'; }
  }

  async function onRegenUpsell(uid, service) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen-upsell[data-uid="${uid}"]`);
    btn.disabled = true; btn.textContent = '…';
    try {
      const res  = await fetch('/api/renewal-pack', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenUpsell: service })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      if (data.upsells && data.upsells.length) {
        const u    = data.upsells[0];
        const html = buildUpsellHtml(u.service, u.headline, u.body);
        widgets[uid] = html;
        document.getElementById('editor_' + uid).value   = html;
        document.getElementById('preview_' + uid).innerHTML = html;
      }
    } catch(e) { console.error('Regen upsell error:', e); }
    finally { btn.disabled = false; btn.textContent = 'Regenerate'; }
  }

  // ── Copy ───────────────────────────────────
  function onCopyWidget(i) {
    navigator.clipboard.writeText(widgets[i] || '').then(() => {
      const btn = document.querySelector(`.widget-copy[data-widget="${i}"]`);
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }
  function onCopyUpsell(uid) {
    navigator.clipboard.writeText(widgets[uid] || '').then(() => {
      const btn = document.querySelector(`.widget-copy-upsell[data-uid="${uid}"]`);
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy HTML', 2000);
    });
  }
  function onCopyAll() {
    const all = [...CORE_WIDGETS.map(i => widgets[i] || ''), ...upsellWidgetIds.map(uid => widgets[uid] || '')].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(all).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy HTML (Full Pack)', 2000);
    });
  }

  // ── Push ───────────────────────────────────
  function onPush(type) {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) { credsInline.hidden = false; pendingPushType = type; return; }
    executePush(type, apiKey, tenantUrl);
  }
  function onSaveAndPush() {
    const key = pushApiKey.value.trim(); const url = pushTenantUrl.value.trim();
    if (!key || !url) return;
    localStorage.setItem('sb_api_key', key); localStorage.setItem('sb_tenant_url', url);
    credsInline.hidden = true;
    executePush(pendingPushType || 'pack', key, url);
  }

  async function executePush(type, apiKey, tenantUrl) {
    const clientName = lastPayload?.client || 'Client';
    const prefix     = clientName + ' — Renewal';

    const coreLabels = ['Cover Letter', 'Value Delivered', 'IT Partnership', 'Why Continuity Matters', "What's Included",
      currentMode === 'at-risk' ? 'Our Commitment Going Forward' : "What's Next"];

    let widgetsToSend;
    if (type === 'pack') {
      const allHtml = [...CORE_WIDGETS.map(i => widgets[i] || ''), ...upsellWidgetIds.map(u => widgets[u] || '')].filter(Boolean).join('\n\n');
      widgetsToSend = [{ title: 'Pack', html: allHtml }];
    } else {
      widgetsToSend = CORE_WIDGETS
        .filter(i => widgets[i])
        .map(i => ({ title: coreLabels[i], html: widgets[i] }));
      upsellWidgetIds.forEach(uid => {
        if (widgets[uid]) {
          const service = uid.replace('upsell_', '').replace(/_/g, ' ');
          widgetsToSend.push({ title: 'Recommended — ' + service, html: widgets[uid] });
        }
      });
    }

    pushStatus.hidden = true;
    pushPackBtn.disabled = true; pushIndividualBtn.disabled = true;

    try {
      const res  = await fetch('/api/push-widgets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: widgetsToSend, prefix, apiKey, tenantUrl, cleanup: false })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`Pushed ${data.successCount} widget${data.successCount !== 1 ? 's' : ''} to Salesbuildr library.`, 'ok');
        autoArchiveSession();
      } else {
        showPushStatus('Push failed: ' + (data.error || data.results?.find(r => !r.ok)?.error || 'Unknown error'), 'err');
      }
    } catch (err) {
      showPushStatus('Push failed: ' + err.message, 'err');
    } finally {
      pushPackBtn.disabled = false; pushIndividualBtn.disabled = false;
    }
  }

  // ── Session management ─────────────────────
  function buildSessionSnapshot(status) {
    return {
      id:        currentSessionId,
      quoteId:   fetchedQuote?.id || '',
      company:   fetchedQuote?.company?.name || 'Unknown',
      title:     fetchedQuote?.title || '',
      status,
      savedAt:   Date.now(),
      mode:      currentMode,
      theme:     currentTheme,
      quoteData: fetchedQuote,
      payload:   lastPayload,
      widgets,
      upsellWidgetIds
    };
  }

  function getSessions()  { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); } catch { return []; } }
  function saveSessions(s){ localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function getArchived()  { try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch { return []; } }
  function saveArchived(a){ localStorage.setItem(ARCHIVE_KEY, JSON.stringify(a)); }

  function autoSaveSession(status) {
    if (!currentSessionId) return;
    let sessions = getSessions();
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    const snap = buildSessionSnapshot(status);
    if (idx >= 0) sessions[idx] = snap;
    else sessions.unshift(snap);
    // Keep max 20 in storage, show 5 in UI
    sessions = sessions.slice(0, 20);
    saveSessions(sessions);
    renderSessionCards();
  }

  function onSaveSession() {
    if (!fetchedQuote) return;
    const status = Object.keys(widgets).length > 0 ? 'generated' : 'fetched';
    autoSaveSession(status);
    saveSessionBtn.textContent = 'Saved ✓';
    setTimeout(() => saveSessionBtn.textContent = 'Save Session', 2000);
  }

  function autoArchiveSession() {
    if (!currentSessionId) return;
    let sessions = getSessions();
    const idx    = sessions.findIndex(s => s.id === currentSessionId);
    if (idx < 0) return;
    const snap   = { ...sessions[idx], status: 'pushed', archivedAt: Date.now() };
    sessions.splice(idx, 1);
    saveSessions(sessions);
    let archived = getArchived();
    archived.unshift(snap);
    // Prune archived older than ARCHIVE_DAYS
    const cutoff = Date.now() - ARCHIVE_DAYS * 86400000;
    archived = archived.filter(s => (s.archivedAt || 0) > cutoff);
    saveArchived(archived);
    renderSessionCards();
  }

  function renderSessionCards(showArchived) {
    let sessions = getSessions();
    const archived = showArchived ? getArchived() : [];
    const all = [...sessions, ...archived];

    if (!all.length) { sessionsBlock.hidden = true; return; }
    sessionsBlock.hidden = false;
    sessionCards.innerHTML = '';

    // Show up to SESSION_LIMIT active + all archived if requested
    const toShow = showArchived ? all : sessions.slice(0, SESSION_LIMIT);
    const hasMore = !showArchived && sessions.length > SESSION_LIMIT;

    toShow.forEach(sess => {
      const card = document.createElement('div');
      card.className = 'session-card';
      const age = fmtAge(sess.savedAt);
      const statusClass = { fetched: 'status-fetched', generated: 'status-generated', pushed: 'status-pushed' }[sess.status] || 'status-fetched';
      card.innerHTML = `
        <div class="session-card-info">
          <div class="session-card-company">${escHtml(sess.company)}</div>
          <div class="session-card-meta">${escHtml(sess.title || sess.quoteId)} · ${age}</div>
        </div>
        <div class="session-card-actions">
          <span class="session-card-status ${statusClass}">${sess.status.toUpperCase()}</span>
          <button class="session-discard" data-id="${escHtml(sess.id)}" title="Discard">×</button>
        </div>`;
      card.querySelector('.session-card-info').addEventListener('click', () => resumeSession(sess));
      card.querySelector('.session-discard').addEventListener('click', e => { e.stopPropagation(); discardSession(sess.id, showArchived); });
      sessionCards.appendChild(card);
    });

    if (hasMore) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:11px;color:var(--text-3);text-align:center;padding:6px;';
      more.textContent = `+ ${sessions.length - SESSION_LIMIT} more — scroll up to see all`;
      sessionCards.appendChild(more);
    }

    showArchivedBtn.textContent = showArchived ? 'Hide archived' : 'Show archived';
  }

  function onShowArchived() {
    const showing = showArchivedBtn.textContent === 'Hide archived';
    renderSessionCards(!showing);
  }

  function discardSession(id, isArchived) {
    if (isArchived) {
      let archived = getArchived().filter(s => s.id !== id);
      saveArchived(archived);
    } else {
      let sessions = getSessions().filter(s => s.id !== id);
      saveSessions(sessions);
    }
    renderSessionCards(isArchived);
  }

  function resumeSession(sess) {
    // Restore state
    currentSessionId = sess.id;
    currentMode      = sess.mode || 'standard';
    currentTheme     = sess.theme || '#0f1f3d';
    fetchedQuote     = sess.quoteData;
    lastPayload      = sess.payload;
    widgets          = sess.widgets || {};
    upsellWidgetIds  = sess.upsellWidgetIds || [];

    // Restore form
    if (fetchedQuote) {
      quoteInput.value = fetchedQuote.link || fetchedQuote.id || '';
      renderQuoteMeta(fetchedQuote);
      renderItemsList(fetchedQuote.items || []);
      step2Block.hidden = false; step3Block.hidden = false;
      step4Block.hidden = false; step5Block.hidden = false;
      generateBlock.hidden = false;
    }

    setMode(currentMode);

    // Restore colour swatch
    colourSwatches.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.hex === currentTheme);
    });

    // Restore widget outputs
    if (Object.keys(widgets).length) {
      CORE_WIDGETS.forEach(i => {
        if (!widgets[i]) return;
        const ed = $(`widget${i}Editor`);
        if (ed) ed.value = widgets[i];
        renderPreview(i);
        if (i === 0) $('widget0Card').hidden = false;
      });

      upsellCardsEl.innerHTML = '';
      upsellWidgetIds.forEach(uid => {
        if (!widgets[uid]) return;
        const service = uid.replace('upsell_', '').replace(/_/g, ' ');
        const card = makeUpsellCard(uid, service, widgets[uid]);
        upsellCardsEl.appendChild(card);
      });

      deliveryTitle.textContent = (fetchedQuote?.company?.name || '') + ' — Renewal Pack';
      emptyState.hidden = true;
      outputArea.hidden = false;
    }

    showFetchStatus('Session resumed: ' + (fetchedQuote?.company?.name || ''), 'ok');
  }

  // ── UI helpers ─────────────────────────────
  function buildCoverWithData(d) {
    if (!d) return '';
    // Always use buildCoverLetterHtml — coverLetter never has a plain 'body' field
    return buildCoverLetterHtml(d.headline, d.intro || '', d.stats || [], d.closing || '', currentTheme);
  }

  function showFetchStatus(msg, type) { fetchStatus.textContent = msg; fetchStatus.className = 'fetch-status ' + type; fetchStatus.hidden = false; }
  function hideFetchStatus() { fetchStatus.hidden = true; }
  function showPushStatus(msg, type) { pushStatus.textContent = msg; pushStatus.className = 'push-status ' + type; pushStatus.hidden = false; setTimeout(() => { pushStatus.hidden = true; }, 6000); }
  function setOutputLoading(on, msg) { loadingOverlay.hidden = !on; if (msg) loadingMsg.textContent = msg; }
  function showError(msg) { formError.textContent = msg; formError.hidden = false; }
  function hideError()    { formError.hidden = true; }

  function fmtDate(str) {
    if (!str) return '';
    try { const d = new Date(str); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return str; }
  }
  function fmtCurrency(n) { return '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  function fmtAge(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 2)   return 'just now';
    if (mins < 60)  return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }
  function escHtml(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function unescHtml(str) { return String(str).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"'); }

  init();
})();
