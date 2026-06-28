/* =============================================
   Renewal Pack — Frontend JS
   Quote-URL-first flow
   ============================================= */

(function () {
  'use strict';

  // ── State ──────────────────────────────────
  let currentMode    = 'standard';
  let currentTheme   = '#0f1f3d';
  let fetchedQuote   = null;   // raw quote data from SB
  let lastPayload    = null;   // last AI generation payload
  let pendingPushType = null;
  let widgets = { 1: '', 2: '', 3: '', 4: '', 5: '' };

  // ── DOM refs ───────────────────────────────
  const quoteInput      = document.getElementById('quoteInput');
  const sbApiKey        = document.getElementById('sbApiKey');
  const sbTenantUrl     = document.getElementById('sbTenantUrl');
  const credsFields     = document.getElementById('credsFields');
  const credsSavedLabel = document.getElementById('credsSavedLabel');
  const toggleCredsBtn  = document.getElementById('toggleCredsBtn');
  const fetchBtn        = document.getElementById('fetchBtn');
  const fetchStatus     = document.getElementById('fetchStatus');

  const step2Block   = document.getElementById('step2Block');
  const step3Block   = document.getElementById('step3Block');
  const step4Block   = document.getElementById('step4Block');
  const step5Block   = document.getElementById('step5Block');
  const generateBlock = document.getElementById('generateBlock');

  const quoteMeta    = document.getElementById('quoteMeta');
  const itemsList    = document.getElementById('itemsList');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const selectNoneBtn = document.getElementById('selectNoneBtn');

  const modeStandard    = document.getElementById('modeStandard');
  const modeAtRisk      = document.getElementById('modeAtRisk');
  const atRiskBadge     = document.getElementById('atRiskBadge');
  const atRiskContext   = document.getElementById('atRiskContext');

  const generateBtn  = document.getElementById('generateBtn');
  const formError    = document.getElementById('formError');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingMsg   = document.getElementById('loadingMsg');
  const emptyState   = document.getElementById('emptyState');
  const outputArea   = document.getElementById('outputArea');

  const deliveryTitle    = document.getElementById('deliveryTitle');
  const copyAllBtn       = document.getElementById('copyAllBtn');
  const pushPackBtn      = document.getElementById('pushPackBtn');
  const pushIndividualBtn = document.getElementById('pushIndividualBtn');
  const pushStatus       = document.getElementById('pushStatus');
  const credsInline      = document.getElementById('credsInline');
  const pushApiKey       = document.getElementById('pushApiKey');
  const pushTenantUrl    = document.getElementById('pushTenantUrl');
  const saveAndPushBtn   = document.getElementById('saveAndPushBtn');

  const colourSwatches   = document.getElementById('colourSwatches');
  const customHex        = document.getElementById('customHex');
  const hexPreview       = document.getElementById('hexPreview');
  const widget5Label     = document.getElementById('widget5Label');

  // ── Init ───────────────────────────────────
  function init() {
    // Load saved credentials
    const savedKey = localStorage.getItem('sb_api_key');
    const savedUrl = localStorage.getItem('sb_tenant_url');

    if (savedKey && savedUrl) {
      sbApiKey.value    = savedKey;
      sbTenantUrl.value = savedUrl;
      credsFields.hidden    = true;
      credsSavedLabel.hidden = false;
      toggleCredsBtn.textContent = 'Change credentials';
    } else {
      credsFields.hidden    = false;
      credsSavedLabel.hidden = true;
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

    copyAllBtn.addEventListener('click', onCopyAll);
    pushPackBtn.addEventListener('click', () => onPush('pack'));
    pushIndividualBtn.addEventListener('click', () => onPush('individual'));
    saveAndPushBtn.addEventListener('click', onSaveAndPush);

    colourSwatches.querySelectorAll('.swatch').forEach(s =>
      s.addEventListener('click', () => selectSwatch(s))
    );
    customHex.addEventListener('input', onCustomHex);

    for (let i = 1; i <= 5; i++) {
      document.querySelector(`.widget-regen[data-widget="${i}"]`)
        .addEventListener('click', () => onRegenWidget(i));
      document.querySelector(`.widget-copy[data-widget="${i}"]`)
        .addEventListener('click', () => onCopyWidget(i));
      document.getElementById(`widget${i}Editor`)
        .addEventListener('input', function () {
          widgets[i] = this.value;
          renderPreview(i);
        });
    }
  }

  // ── Extract quote ID from URL or raw ID ────
  function extractQuoteId(input) {
    const s = input.trim();
    // URL: take last non-empty path segment
    if (s.startsWith('http')) {
      const parts = s.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
    // Raw ID — return as-is if it looks valid
    return s.length > 4 ? s : null;
  }

  // ── Fetch quote ────────────────────────────
  async function onFetch() {
    const input = quoteInput.value.trim();
    if (!input) { showFetchStatus('Paste a quote URL or ID first.', 'err'); return; }

    const quoteId = extractQuoteId(input);
    if (!quoteId) { showFetchStatus('Could not read a quote ID from that input.', 'err'); return; }

    // Save & use credentials
    const apiKey    = sbApiKey.value.trim()    || localStorage.getItem('sb_api_key');
    const tenantUrl = sbTenantUrl.value.trim() || localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      showFetchStatus('Enter your Salesbuildr API key and tenant URL first.', 'err');
      credsFields.hidden = false;
      return;
    }
    localStorage.setItem('sb_api_key',    apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsSavedLabel.hidden = false;
    credsFields.hidden     = true;
    toggleCredsBtn.textContent = 'Change credentials';

    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching…';
    setOutputLoading(true, 'Fetching quote from Salesbuildr…');
    hideFetchStatus();

    try {
      const res  = await fetch('/api/renewal-pack-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, apiKey, tenantUrl })
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || 'Could not fetch quote.');

      fetchedQuote = data.quote;
      renderQuoteMeta(fetchedQuote);
      renderItemsList(fetchedQuote.items || []);

      // Show remaining steps
      step2Block.hidden    = false;
      step3Block.hidden    = false;
      step4Block.hidden    = false;
      step5Block.hidden    = false;
      generateBlock.hidden = false;

      setOutputLoading(false);
      showFetchStatus(`Loaded: ${fetchedQuote.title || quoteId}`, 'ok');

    } catch (err) {
      setOutputLoading(false);
      showFetchStatus(err.message, 'err');
    } finally {
      fetchBtn.disabled    = false;
      fetchBtn.textContent = 'Fetch Quote';
    }
  }

  // ── Render quote meta panel ─────────────────
  function renderQuoteMeta(quote) {
    const company  = quote.company?.name  || '—';
    const title    = quote.title          || '—';
    const start    = fmtDate(quote.contractStartDate);
    const end      = fmtDate(quote.contractEndDate);
    const monthly  = quote.paymentDetails?.monthlyRecurringRevenue
                  ?? quote.paymentDetails?.recurringTotal
                  ?? null;

    quoteMeta.innerHTML = `
      <strong>${company}</strong><br>
      ${title}<br>
      ${start && end ? `Contract: ${start} → ${end}<br>` : ''}
      ${monthly != null ? `Monthly value: ${fmtCurrency(monthly)}` : ''}
    `.trim();
  }

  // ── Render items checklist ──────────────────
  function renderItemsList(items) {
    itemsList.innerHTML = '';
    if (!items.length) {
      itemsList.innerHTML = '<div style="font-size:12px;color:var(--text-3);padding:8px;">No line items found on this quote.</div>';
      return;
    }

    items.forEach((item, idx) => {
      const type    = classifyItem(item);
      const checked = type === 'service'; // pre-check services only

      const row = document.createElement('label');
      row.className = 'item-row';
      row.innerHTML = `
        <input type="checkbox" data-idx="${idx}" ${checked ? 'checked' : ''} />
        <span class="item-name">${escHtml(item.name || 'Unnamed item')}</span>
        <span class="item-type item-type-${type}">${type}</span>
      `;
      itemsList.appendChild(row);
    });
  }

  // Classify a quote item as service / labor / product / other
  // Salesbuildr doesn't expose a type field directly on quote items,
  // so we use heuristics on the item data. Adjust if you have more info.
  function classifyItem(item) {
    const name = (item.name || '').toLowerCase();
    const cat  = (item.category?.name || item.categoryName || '').toLowerCase();

    // Labor signals
    if (/\blabou?r\b|engineer|technician|onsite|on-site|hour|day rate|professional service/i.test(name + ' ' + cat)) return 'labor';
    // Product signals
    if (/\bswitch|router|firewall|laptop|desktop|server|printer|cable|hardware|device|disk|ssd|ram|ups\b/i.test(name + ' ' + cat)) return 'product';
    // Service signals (recurring / managed)
    if (/\bmanaged|monitoring|backup|365|antivirus|edr|endpoint|helpdesk|support|security|patch|hosted|voip|cloud|connectivity|broadband|license|licence|subscription|siem|mdr|soc\b/i.test(name + ' ' + cat)) return 'service';

    return 'other';
  }

  function setAllItems(checked) {
    itemsList.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
  }

  // ── Mode ────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;
    modeStandard.classList.toggle('active', mode === 'standard');
    modeAtRisk.classList.toggle('active',   mode === 'at-risk');
    atRiskBadge.hidden   = mode !== 'at-risk';
    atRiskContext.hidden = mode !== 'at-risk';
    widget5Label.textContent = mode === 'at-risk'
      ? 'Widget 5 — Our Commitment Going Forward'
      : "Widget 5 — What's Next";
  }

  // ── Colour ──────────────────────────────────
  function selectSwatch(el) {
    colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    currentTheme   = el.dataset.hex;
    customHex.value = '';
    hexPreview.style.background = 'transparent';
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

  // ── Build payload ────────────────────────────
  function buildPayload() {
    if (!fetchedQuote) return null;

    // Collect checked items
    const checkedItems = [];
    itemsList.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      const idx  = parseInt(cb.dataset.idx);
      const item = fetchedQuote.items[idx];
      if (item) checkedItems.push(item.name || 'Unnamed item');
    });

    return {
      mode:             currentMode,
      client:           fetchedQuote.company?.name || '',
      quoteTitle:       fetchedQuote.title || '',
      contractStart:    fetchedQuote.contractStartDate || '',
      contractEnd:      fetchedQuote.contractEndDate   || '',
      monthlyValue:     fetchedQuote.paymentDetails?.monthlyRecurringRevenue
                     ?? fetchedQuote.paymentDetails?.recurringTotal
                     ?? 0,
      services:         checkedItems,
      stats: {
        tickets:      parseInt(document.getElementById('tickets').value) || null,
        responseTime: document.getElementById('responseTime').value.trim(),
        uptime:       document.getElementById('uptime').value.trim()
      },
      highlights:        document.getElementById('highlights').value.trim(),
      concern:           document.getElementById('concern').value.trim(),
      changesSinceSigning: document.getElementById('changesSinceSigning').value.trim(),
      proposedResponse:  document.getElementById('proposedResponse').value.trim(),
      upgrade:           document.getElementById('upgrade').value.trim(),
      personalised:      document.getElementById('personalised').checked,
      mergeTagsAvailable: ['{{company.name}}', '{{contact.firstName}}', '{{servicingBranch.name}}']
    };
  }

  // ── Generate ─────────────────────────────────
  async function onGenerate() {
    hideError();
    const payload = buildPayload();

    if (!payload) { showError('Please fetch a quote first.'); return; }
    if (!payload.services.length) { showError('Select at least one service to include.'); return; }
    if (currentMode === 'at-risk' && !payload.concern) {
      showError("Please describe the client's concern(s) for At-Risk mode.");
      return;
    }

    lastPayload = payload;
    setOutputLoading(true, 'Analysing services and building your renewal pack…');
    generateBtn.disabled = true;

    try {
      const res  = await fetch('/api/renewal-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Generation failed.');
      populateWidgets(data, payload.client);
    } catch (err) {
      showError('Something went wrong: ' + err.message);
    } finally {
      setOutputLoading(false);
      generateBtn.disabled = false;
    }
  }

  function populateWidgets(data, clientName) {
    const map = {
      1: data.valueDelivered,
      2: data.partnership,
      3: data.continuity,
      4: data.whatsIncluded,
      5: data.whatsNext
    };
    for (let i = 1; i <= 5; i++) {
      const w   = map[i];
      const html = buildWidgetHtml(w.headline, w.body);
      widgets[i] = html;
      document.getElementById(`widget${i}Editor`).value = html;
      renderPreview(i);
    }
    deliveryTitle.textContent = clientName + ' — Renewal Pack';
    emptyState.hidden  = true;
    outputArea.hidden  = false;
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Widget HTML (TinyMCE/Salesbuildr safe) ───
  function buildWidgetHtml(headline, body) {
    const theme = currentTheme;
    const paras = body.split('\n').filter(l => l.trim()).map(l =>
      `<p style="margin:0 0 10px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:#4B5563;line-height:1.6;">${escHtml(l)}</p>`
    ).join('');
    return `<div style="width:100%;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;overflow:hidden;font-family:Inter,Arial,sans-serif;">
  <div style="width:100%;background:${escHtml(theme)};padding:16px 20px;">
    <h5 style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">${escHtml(headline)}</h5>
  </div>
  <div style="padding:16px 20px 6px;">
    ${paras}
  </div>
</div>`;
  }

  function renderPreview(i) {
    document.getElementById(`widget${i}Preview`).innerHTML = widgets[i];
  }

  function refreshPreviews() {
    for (let i = 1; i <= 5; i++) {
      if (!widgets[i]) continue;
      // Re-parse headline + body from stored HTML and rebuild with new theme
      const hMatch = widgets[i].match(/<h5[^>]*>([^<]*)<\/h5>/i);
      const bMatch = widgets[i].match(/<div style="padding:[^"]*">([\s\S]*?)<\/div>\s*<\/div>\s*$/i);
      if (!hMatch || !bMatch) continue;
      const headline = hMatch[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
      const body     = bMatch[1].replace(/<p[^>]*>/gi,'').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'').trim();
      widgets[i] = buildWidgetHtml(headline, body);
      document.getElementById(`widget${i}Editor`).value = widgets[i];
      renderPreview(i);
    }
  }

  // ── Regen single widget ──────────────────────
  async function onRegenWidget(i) {
    if (!lastPayload) return;
    const btn = document.querySelector(`.widget-regen[data-widget="${i}"]`);
    btn.disabled = true; btn.textContent = '…';
    try {
      const res  = await fetch('/api/renewal-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastPayload, regenWidget: i })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const map = { 1: data.valueDelivered, 2: data.partnership, 3: data.continuity, 4: data.whatsIncluded, 5: data.whatsNext };
      const html = buildWidgetHtml(map[i].headline, map[i].body);
      widgets[i] = html;
      document.getElementById(`widget${i}Editor`).value = html;
      renderPreview(i);
    } catch (e) { console.error('Regen error:', e); }
    finally { btn.disabled = false; btn.textContent = 'Regenerate'; }
  }

  // ── Copy widget ──────────────────────────────
  function onCopyWidget(i) {
    navigator.clipboard.writeText(widgets[i]).then(() => {
      const btn = document.querySelector(`.widget-copy[data-widget="${i}"]`);
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = 'Copy', 2000);
    });
  }

  // ── Copy all ────────────────────────────────
  function onCopyAll() {
    navigator.clipboard.writeText(Object.values(widgets).join('\n\n')).then(() => {
      copyAllBtn.textContent = 'Copied ✓';
      setTimeout(() => copyAllBtn.textContent = 'Copy HTML (Full Pack)', 2000);
    });
  }

  // ── Push ─────────────────────────────────────
  function onPush(type) {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      pendingPushType    = type;
      return;
    }
    executePush(type, apiKey, tenantUrl);
  }

  function onSaveAndPush() {
    const key = pushApiKey.value.trim();
    const url = pushTenantUrl.value.trim();
    if (!key || !url) return;
    localStorage.setItem('sb_api_key', key);
    localStorage.setItem('sb_tenant_url', url);
    sbApiKey.value    = key;
    sbTenantUrl.value = url;
    credsInline.hidden = true;
    executePush(pendingPushType || 'pack', key, url);
  }

  async function executePush(type, apiKey, tenantUrl) {
    const clientName = lastPayload?.client || 'Client';
    const prefix     = `${clientName} — Renewal`;

    const labels = [
      'Value Delivered',
      'IT Partnership',
      'Why Continuity Matters',
      "What's Included",
      currentMode === 'at-risk' ? 'Our Commitment Going Forward' : "What's Next"
    ];

    let widgetsToSend;
    if (type === 'pack') {
      widgetsToSend = [{
        title: 'Pack',
        html:  Object.values(widgets).join('\n\n')
      }];
    } else {
      widgetsToSend = [1,2,3,4,5].map(i => ({
        title: labels[i - 1],
        html:  widgets[i]
      }));
    }

    pushStatus.hidden = true;
    pushPackBtn.disabled        = true;
    pushIndividualBtn.disabled  = true;

    try {
      const res  = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: widgetsToSend,
          prefix,
          apiKey,
          tenantUrl,
          cleanup: false
        })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`Pushed ${data.successCount} widget${data.successCount !== 1 ? 's' : ''} to Salesbuildr library.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || data.results?.find(r => !r.ok)?.error || 'Unknown error'), 'err');
      }
    } catch (err) {
      showPushStatus('Push failed: ' + err.message, 'err');
    } finally {
      pushPackBtn.disabled       = false;
      pushIndividualBtn.disabled = false;
    }
  }

  // ── Helpers ──────────────────────────────────
  function showFetchStatus(msg, type) {
    fetchStatus.textContent = msg;
    fetchStatus.className   = 'fetch-status ' + type;
    fetchStatus.hidden      = false;
  }
  function hideFetchStatus() { fetchStatus.hidden = true; }

  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className   = 'push-status ' + type;
    pushStatus.hidden      = false;
    setTimeout(() => { pushStatus.hidden = true; }, 6000);
  }

  function setOutputLoading(on, msg) {
    loadingOverlay.hidden = !on;
    if (msg) loadingMsg.textContent = msg;
  }
  function showError(msg) { formError.textContent = msg; formError.hidden = false; }
  function hideError()    { formError.hidden = true; }

  function fmtDate(str) {
    if (!str) return '';
    try {
      const d = new Date(str);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return str; }
  }
  function fmtCurrency(n) {
    return '£' + Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  init();
})();
