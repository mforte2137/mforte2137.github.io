/* =====================================================
   product-explainer.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── State ──────────────────────────────────
  // Style + theme are intentionally module-level (not reset by
  // "Generate another") so the MSP doesn't have to re-pick them
  // for every line item in a batch quoting session.
  let selectedStyle   = 'layered';   // 'layered' | 'numbered' | 'grid'
  let currentThemeHex = '#0f1f3d';
  let currentData     = null;        // last AI response payload
  let currentHtml     = '';          // last rendered widget HTML
  let currentTitle    = '';          // last widget title
  let lastRequest     = null;        // { name, category, context, style } for regenerate

  const sessionWidgets = [];         // [{ title, html }] — "Generated this session"

  // ── DOM refs ───────────────────────────────
  const $ = id => document.getElementById(id);

  const productNameEl    = $('productName');
  const categoryEl       = $('category');
  const categorySuggest  = $('categorySuggestNote');
  const customContextEl  = $('customContext');
  const contextCharCount = $('contextCharCount');

  const stylePicker  = $('stylePicker');
  const colourSwatches = $('colourSwatches');
  const customHexEl  = $('customHex');
  const hexPreviewEl = $('hexPreview');

  const generateBtn   = $('generateBtn');
  const formError      = $('formError');

  const emptyState    = $('emptyState');
  const loadingState  = $('loadingState');
  const widgetOutput  = $('widgetOutput');
  const widgetTitleEl = $('widgetTitle');
  const widgetPreview = $('widgetPreview');
  const widgetEditor  = $('widgetEditor');
  const imageSlugNote = $('imageSlugNote');

  const showHtmlBtn      = $('showHtmlBtn');
  const regenerateBtn    = $('regenerateBtn');
  const copyBtn           = $('copyBtn');
  const pushBtn            = $('pushBtn');
  const generateAnotherBtn = $('generateAnotherBtn');

  const credsInline    = $('credsInline');
  const sbApiKeyEl     = $('sbApiKey');
  const sbTenantUrlEl  = $('sbTenantUrl');
  const cancelCredsBtn = $('cancelCredsBtn');
  const saveAndPushBtn = $('saveAndPushBtn');
  const pushFeedback   = $('pushFeedback');

  const sessionListBlock = $('sessionListBlock');
  const sessionList        = $('sessionList');

  // ── Category auto-suggest (client-side keyword map) ──
  const CATEGORY_KEYWORDS = [
    { category: 'Hardware',         words: ['meraki', 'dell', 'laptop', 'switch', 'server', 'firewall', 'ups', 'phone', 'yealink', 'router', 'access point', 'nas'] },
    { category: 'Software',         words: ['microsoft 365', 'm365', 'office', 'antivirus', 'rmm', 'veeam', 'acronis', 'windows', 'license', 'licence'] },
    { category: 'Security Service', words: ['edr', 'phishing', 'dark web', 'soc', 'sentinelone', 'huntress', 'mfa', 'security awareness', 'penetration test', 'siem'] },
    { category: 'Cloud Service',    words: ['azure', 'hosted backup', 'daas', 'hosted voip', 'aws', 'cloud migration', 'datto'] },
    { category: 'Support Service',  words: ['helpdesk', 'managed it', 'on-site', 'vcio', 'support plan', 'managed services'] },
    { category: 'Connectivity',     words: ['fibre', 'fiber', 'sd-wan', 'sdwan', '4g failover', 'vpn', 'broadband', 'leased line'] },
    { category: 'Compliance',       words: ['cyber essentials', 'hipaa', 'iso 27001', 'gdpr', 'soc 2', 'compliance'] }
  ];

  function suggestCategory(name) {
    const lower = name.toLowerCase();
    for (const entry of CATEGORY_KEYWORDS) {
      if (entry.words.some(w => lower.includes(w))) return entry.category;
    }
    return null;
  }

  productNameEl.addEventListener('input', () => {
    const suggestion = suggestCategory(productNameEl.value);
    if (suggestion && !categoryEl.value) {
      categoryEl.value = suggestion;
      categorySuggest.textContent = `Auto-selected "${suggestion}" based on the product name — change it if that's not right.`;
      categorySuggest.hidden = false;
    } else if (suggestion && categoryEl.dataset.autoset === '1' && categoryEl.value !== suggestion) {
      categoryEl.value = suggestion;
    }
    if (suggestion) categoryEl.dataset.autoset = '1';
  });

  categoryEl.addEventListener('change', () => {
    categoryEl.dataset.autoset = '0';
    categorySuggest.hidden = true;
  });

  // ── Custom context char counter ──────────────
  customContextEl.addEventListener('input', () => {
    contextCharCount.textContent = customContextEl.value.length;
  });

  // ── Style picker ─────────────────────────────
  stylePicker.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      stylePicker.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedStyle = card.dataset.style;
    });
  });
  // Default selection
  stylePicker.querySelector('[data-style="layered"]').classList.add('active');

  // ── Colour theme ─────────────────────────────
  colourSwatches.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentThemeHex = swatch.dataset.hex;
      customHexEl.value = '';
      hexPreviewEl.style.background = 'transparent';
      if (currentData) applyThemeToPreview();
    });
  });

  customHexEl.addEventListener('input', () => {
    const val = customHexEl.value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      currentThemeHex = '#' + val;
      hexPreviewEl.style.background = currentThemeHex;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      if (currentData) applyThemeToPreview();
    }
  });

  function applyThemeToPreview() {
    currentHtml = renderWidgetHtml(selectedStyle, currentData, currentThemeHex);
    widgetPreview.innerHTML = currentHtml;
    widgetEditor.value = currentHtml;
  }

  // ── Colour helpers ───────────────────────────
  function shadeHex(hex, percent) {
    // percent negative = darker, positive = lighter
    const num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) + Math.round(255 * percent);
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
    let b = (num & 0x0000FF) + Math.round(255 * percent);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── PHASE 2 (dormant) — product image infrastructure ──
  // Not called anywhere yet. Enable once images exist in the GitHub
  // repo's /images/ folder. See project notes for the fuzzy-fallback
  // plan (exact slug -> brand+model -> brand only) and the manual
  // override field already present (hidden) in product-explainer.html.
  //
  // const IMAGE_REPO_BASE = 'https://raw.githubusercontent.com/[owner]/[repo]/main/images/';
  //
  // function toSlug(name) {
  //   return name.toLowerCase()
  //     .replace(/[^a-z0-9]+/g, '-')
  //     .replace(/^-|-$/g, '');
  // }
  //
  // async function imageExists(slug) {
  //   const url = `${IMAGE_REPO_BASE}${slug}.png`;
  //   try {
  //     const res = await fetch(url, { method: 'HEAD' });
  //     return res.ok;
  //   } catch {
  //     return false;
  //   }
  // }
  //
  // IMPORTANT: this check must run client-side BEFORE the widget HTML is
  // built (not after), so the header/image-strip decision is baked into
  // the first render rather than patched in afterwards. When Phase 2 is
  // enabled, call imageExists(toSlug(name)) right after the AI response
  // comes back and pass the result into renderWidgetHtml() so it can
  // include the <img> strip for Style 1 / Style 3.

  // ── Widget HTML builders (inline styles, no Flexbox, h5/h6 only) ──

  function dotTexture() {
    // Inline dot texture overlay, layered behind the gradient via
    // multiple background-image values — confirmed working in TinyMCE.
    return 'background-image:radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px);background-size:14px 14px;';
  }

  function gradientHeaderStyle(hex) {
    const dark = shadeHex(hex, -0.35);
    return `background-color:${hex};background-image:radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, ${dark} 0%, ${hex} 100%);background-size:14px 14px, 100% 100%;padding:16px 18px 14px;`;
  }

  function kickerHtml(text) {
    return `<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:5px;">${esc(text)}</div>`;
  }

  function headlineHtml(text) {
    return `<h5 style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;line-height:1.28;letter-spacing:-0.01em;">${esc(text)}</h5>`;
  }

  function introHtml(text) {
    return `<div style="padding:14px 18px;border-bottom:1px solid #e3e7ee;"><p style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(text)}</p></div>`;
  }

  // Style 1 — Layered Rows
  function buildLayeredHtml(data, hex) {
    const items = data.items || [];
    const rows = items.map((it, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;${tint}">
    <tr>
      <td style="padding:10px 14px;width:40px;vertical-align:top;">
        <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:#eaf1fc;font-size:16px;">${esc(it.icon || '•')}</span>
      </td>
      <td style="padding:10px 14px 10px 0;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(it.label || '')}</div>
        <div style="font-size:12px;color:#586273;line-height:1.5;">${esc(it.description || '')}</div>
      </td>
    </tr>
  </table>`;
    }).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${introHtml(data.intro || '')}
  ${rows}
</div>`;
  }

  // Style 2 — Numbered Blocks
  function buildNumberedHtml(data, hex) {
    const items = data.items || [];
    const rows = items.map((it, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;border-bottom:1px solid #e3e7ee;${tint}">
    <tr>
      <td style="width:36px;background:${esc(hex)};color:#ffffff;text-align:center;font-size:14px;font-weight:700;vertical-align:middle;padding:10px 0;">${idx + 1}</td>
      <td style="padding:10px 14px;vertical-align:top;">
        <div style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(it.label || '')}</div>
        <div style="font-size:12px;color:#586273;line-height:1.5;">${esc(it.description || '')}</div>
      </td>
      <td style="width:80px;text-align:center;vertical-align:middle;padding:10px 6px;">
        <span style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(it.badge || 'Included')}</span>
      </td>
    </tr>
  </table>`;
    }).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${introHtml(data.intro || '')}
  ${rows}
</div>`;
  }

  // Style 3 — Benefit Grid
  function buildGridHtml(data, hex) {
    const benefits = (data.benefits || []).slice(0, 4);
    while (benefits.length < 4) benefits.push({ icon: '•', title: '', description: '' });

    const cell = (b, borderRight, borderBottom) => {
      const border = `${borderRight ? 'border-right:1px solid #e3e7ee;' : ''}${borderBottom ? 'border-bottom:1px solid #e3e7ee;' : ''}`;
      return `<td style="padding:12px 14px;vertical-align:top;width:50%;${border}">
      <div style="font-size:16px;margin-bottom:4px;">${esc(b.icon || '•')}</div>
      <div style="font-size:12.5px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(b.title || '')}</div>
      <div style="font-size:11.5px;color:#586273;line-height:1.5;">${esc(b.description || '')}</div>
    </td>`;
    };

    const grid = `<table width="100%" style="border-collapse:collapse;">
    <tr>${cell(benefits[0], true, true)}${cell(benefits[1], false, true)}</tr>
    <tr>${cell(benefits[2], true, false)}${cell(benefits[3], false, false)}</tr>
  </table>`;

    const footer = `<table width="100%" style="border-collapse:collapse;background:#f4f7fb;border-top:1px solid #e3e7ee;">
    <tr>
      <td style="padding:10px 14px;font-size:11.5px;color:#9ca3af;">${esc(data.footerText || 'Managed & supported by your IT team')}</td>
      <td style="padding:10px 14px;text-align:right;">
        <span style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(data.footerBadge || '✓ Fully managed')}</span>
      </td>
    </tr>
  </table>`;

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${introHtml(data.intro || '')}
  ${grid}
  ${footer}
</div>`;
  }

  function renderWidgetHtml(style, data, hex) {
    if (!data) return '';
    if (style === 'numbered') return buildNumberedHtml(data, hex);
    if (style === 'grid')     return buildGridHtml(data, hex);
    return buildLayeredHtml(data, hex);
  }

  // ── Form validation ──────────────────────────
  function validate() {
    if (!productNameEl.value.trim()) return 'Enter a product or service name.';
    if (!categoryEl.value) return 'Select a category.';
    return null;
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
    formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function hideError() { formError.hidden = true; }

  // ── Generate ──────────────────────────────────
  async function generate() {
    hideError();
    const err = validate();
    if (err) { showError(err); return; }

    const requestPayload = {
      name:     productNameEl.value.trim(),
      category: categoryEl.value,
      context:  customContextEl.value.trim(),
      style:    selectedStyle
    };
    lastRequest = requestPayload;

    emptyState.hidden = true;
    widgetOutput.hidden = true;
    loadingState.hidden = false;
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    try {
      const res = await fetch('/api/product-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Generation failed.');

      currentData  = json.data;
      currentTitle = `${requestPayload.name} — Explainer`;
      renderOutput();

    } catch (e) {
      loadingState.hidden = true;
      emptyState.hidden = false;
      showError('Error: ' + (e.message || 'Something went wrong. Please try again.'));
    } finally {
      generateBtn.disabled = false;
      regenerateBtn.disabled = false;
    }
  }

  function renderOutput() {
    loadingState.hidden = true;
    currentHtml = renderWidgetHtml(selectedStyle, currentData, currentThemeHex);
    widgetPreview.innerHTML = currentHtml;
    widgetEditor.value = currentHtml;
    widgetTitleEl.textContent = currentTitle;

    // Phase 2 image note is dormant — no image check runs yet.
    imageSlugNote.hidden = true;

    widgetOutput.hidden = false;
    pushFeedback.hidden = true;
    credsInline.hidden = true;

    addToSessionList(currentTitle, currentHtml);
  }

  generateBtn.addEventListener('click', generate);
  regenerateBtn.addEventListener('click', async () => {
    if (!lastRequest) return generate();
    hideError();
    regenerateBtn.disabled = true;
    regenerateBtn.textContent = '…';
    try {
      const res = await fetch('/api/product-explainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastRequest)
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Regeneration failed.');
      currentData = json.data;
      renderOutput();
    } catch (e) {
      showError('Regeneration failed: ' + e.message);
    } finally {
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = '↺ Regenerate';
    }
  });

  // ── Show / hide HTML ─────────────────────────
  showHtmlBtn.addEventListener('click', () => {
    const shown = widgetEditor.style.display === 'block';
    widgetEditor.style.display = shown ? 'none' : 'block';
    showHtmlBtn.textContent = shown ? 'Show HTML' : 'Hide HTML';
  });
  widgetEditor.addEventListener('input', () => {
    currentHtml = widgetEditor.value;
    widgetPreview.innerHTML = currentHtml;
  });

  // ── Copy HTML ─────────────────────────────────
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentHtml).then(() => {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy HTML'; }, 2000);
    }).catch(() => alert('Could not copy to clipboard. Try again.'));
  });

  // ── Push to Salesbuildr ───────────────────────
  pushBtn.addEventListener('click', () => {
    const apiKey    = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (!apiKey || !tenantUrl) {
      credsInline.hidden = false;
      credsInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    doPush(apiKey, tenantUrl);
  });

  cancelCredsBtn.addEventListener('click', () => { credsInline.hidden = true; });

  saveAndPushBtn.addEventListener('click', () => {
    const apiKey    = sbApiKeyEl.value.trim();
    const tenantUrl = sbTenantUrlEl.value.trim();
    if (!apiKey || !tenantUrl) { alert('Please enter both your API key and tenant URL.'); return; }
    localStorage.setItem('sb_api_key', apiKey);
    localStorage.setItem('sb_tenant_url', tenantUrl);
    credsInline.hidden = true;
    doPush(apiKey, tenantUrl);
  });

  async function doPush(apiKey, tenantUrl) {
    pushFeedback.hidden = true;
    pushFeedback.className = 'push-feedback';
    pushBtn.disabled = true;
    pushBtn.textContent = 'Pushing…';

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: [{ id: 'product-explainer', title: currentTitle, html: currentHtml }],
          prefix: currentTitle,
          apiKey,
          tenantUrl
        })
      });
      const data = await res.json();
      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushFeedback('success', '✓ Widget pushed to Salesbuildr successfully.');
      } else {
        showPushFeedback('error', 'Push failed: ' + (data.error || 'Unknown error. Check your credentials.'));
      }
    } catch (e) {
      showPushFeedback('error', 'Push failed: ' + (e.message || 'Network error.'));
    } finally {
      pushBtn.disabled = false;
      pushBtn.textContent = 'Push to Salesbuildr';
    }
  }

  function showPushFeedback(type, msg) {
    pushFeedback.hidden = false;
    pushFeedback.className = 'push-feedback ' + type;
    pushFeedback.textContent = msg;
    pushFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Generate another (batch flow) ────────────
  // Resets product name / context / preview for the next line item,
  // but deliberately keeps selectedStyle and currentThemeHex so the
  // MSP doesn't have to re-pick them for every product in a quote.
  generateAnotherBtn.addEventListener('click', () => {
    productNameEl.value = '';
    customContextEl.value = '';
    contextCharCount.textContent = '0';
    categoryEl.value = '';
    categoryEl.dataset.autoset = '0';
    categorySuggest.hidden = true;

    currentData  = null;
    currentHtml  = '';
    currentTitle = '';
    lastRequest  = null;

    widgetOutput.hidden = true;
    emptyState.hidden = false;
    hideError();
    widgetEditor.style.display = 'none';
    showHtmlBtn.textContent = 'Show HTML';

    productNameEl.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Generated this session list ───────────────
  function addToSessionList(title, html) {
    sessionWidgets.unshift({ title, html });
    renderSessionList();
  }

  function renderSessionList() {
    if (!sessionWidgets.length) { sessionListBlock.hidden = true; return; }
    sessionListBlock.hidden = false;
    sessionList.innerHTML = '';
    sessionWidgets.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'session-item';
      row.innerHTML = `
        <span class="session-item-name">${esc(item.title)}</span>
        <span class="session-item-actions">
          <button type="button" class="session-copy-btn" data-idx="${idx}">Copy HTML</button>
        </span>`;
      row.querySelector('.session-copy-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(item.html).then(() => {
          e.target.textContent = 'Copied ✓';
          setTimeout(() => { e.target.textContent = 'Copy HTML'; }, 2000);
        });
      });
      sessionList.appendChild(row);
    });
  }

  // ── Pre-fill Salesbuildr creds from localStorage ──
  (function prefillCreds() {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');
    if (apiKey) sbApiKeyEl.value = apiKey;
    if (tenantUrl) sbTenantUrlEl.value = tenantUrl;
  })();

})();
