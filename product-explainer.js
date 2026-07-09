/* =====================================================
   product-explainer.js — Frontend logic
   ===================================================== */
(function () {
  'use strict';

  // ── State ──────────────────────────────────
  // Style + theme are intentionally module-level (not reset by
  // Clear) so the MSP doesn't have to re-pick them for every line
  // item in a batch quoting session.
  let selectedStyle   = 'layered';   // 'layered' | 'numbered' | 'grid'
  let currentThemeHex = '#0f1f3d';
  let currentData     = null;        // unified AI response: { category, headline, intro, points[4], footerText, footerBadge }
  let currentHtml     = '';          // last rendered widget HTML (synced from live edits)
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

  const stylePicker    = $('stylePicker');
  const colourSwatches = $('colourSwatches');
  const customHexEl    = $('customHex');
  const hexPreviewEl   = $('hexPreview');

  const clearBtn    = $('clearBtn');
  const generateBtn = $('generateBtn');
  const formError   = $('formError');

  const emptyState    = $('emptyState');
  const loadingState  = $('loadingState');
  const widgetOutput  = $('widgetOutput');
  const widgetTitleEl = $('widgetTitle');
  const widgetPreview = $('widgetPreview');
  const imageSlugNote = $('imageSlugNote');

  const regenerateBtn = $('regenerateBtn');
  const copyBtn       = $('copyBtn');
  const pushBtn       = $('pushBtn');

  const credsInline    = $('credsInline');
  const sbApiKeyEl     = $('sbApiKey');
  const sbTenantUrlEl  = $('sbTenantUrl');
  const cancelCredsBtn = $('cancelCredsBtn');
  const saveAndPushBtn = $('saveAndPushBtn');
  const pushFeedback   = $('pushFeedback');

  const sessionListBlock = $('sessionListBlock');
  const sessionList       = $('sessionList');

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

  // ── Style picker — instant re-render, like the colour swatches ──
  stylePicker.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      stylePicker.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedStyle = card.dataset.style;
      if (currentData) renderPreview();
    });
  });
  // Default selection
  stylePicker.querySelector('[data-style="layered"]').classList.add('active');

  // ── Colour theme — instant re-render ─────────
  colourSwatches.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentThemeHex = swatch.dataset.hex;
      customHexEl.value = '';
      hexPreviewEl.style.background = 'transparent';
      if (currentData) renderPreview();
    });
  });

  customHexEl.addEventListener('input', () => {
    const val = customHexEl.value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(val)) {
      currentThemeHex = '#' + val;
      hexPreviewEl.style.background = currentThemeHex;
      colourSwatches.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      if (currentData) renderPreview();
    }
  });

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

  // ── Product image (Phase 2 — live testing) ──
  // Auto-matches an exact slug derived from the product name against the
  // GitHub image library. Real image filenames in the library so far
  // (e.g. "laptop-lat-5450.png") don't follow the same naming pattern as
  // AI-facing product names (e.g. "Dell Latitude 5450"), so exact-match
  // will mostly miss until a naming convention / fuzzy fallback is agreed
  // — the manual override field covers that gap in the meantime.
  const IMAGE_REPO_BASE = 'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/store/';

  function toSlug(name) {
    return String(name || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function imageExists(slug) {
    if (!slug) return false;
    try {
      const res = await fetch(`${IMAGE_REPO_BASE}${slug}.png`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Runs BEFORE the widget HTML is built (not after) so the image
  // decision is baked into the first render rather than patched in.
  async function resolveImage(name, overrideRaw) {
    const override = (overrideRaw || '').trim();
    const slug = override ? toSlug(override) : toSlug(name);
    const found = await imageExists(slug);
    return { slug, found, url: found ? `${IMAGE_REPO_BASE}${slug}.png` : null };
  }

  function updateImageNote(imageInfo) {
    if (!imageInfo) { imageSlugNote.hidden = true; return; }
    imageSlugNote.hidden = false;
    imageSlugNote.textContent = imageInfo.found
      ? `📷 Using image: ${imageInfo.slug}.png`
      : `📷 No image found for "${imageInfo.slug}.png" — using graphic style.`;
  }

  // Image strip markup — inserted between the gradient header and the
  // intro. object-fit:contain on a white background (not the originally
  // spec'd cover/140px) because the real product photos are angled hero
  // shots with headroom; cover cropped straight through the laptop.
  function imageStripHtml(imageInfo) {
    if (!imageInfo || !imageInfo.found || !imageInfo.url) return '';
    return `<div style="background:#ffffff;padding:14px 18px;text-align:center;border-bottom:1px solid #e3e7ee;"><img src="${imageInfo.url}" alt="" style="max-width:100%;max-height:170px;object-fit:contain;display:inline-block;"></div>`;
  }

  const imageOverrideToggle = $('imageOverrideToggle');
  const imageOverrideSlugEl = $('imageOverrideSlug');

  imageOverrideToggle.addEventListener('click', () => {
    const willShow = imageOverrideSlugEl.hidden;
    imageOverrideSlugEl.hidden = !willShow;
    if (willShow) imageOverrideSlugEl.focus();
  });

  async function recheckImageOverride() {
    if (!currentData) return; // nothing generated yet to attach an image to
    const info = await resolveImage(productNameEl.value.trim(), imageOverrideSlugEl.value);
    currentData._image = info;
    updateImageNote(info);
    renderPreview();
  }
  imageOverrideSlugEl.addEventListener('change', recheckImageOverride);
  imageOverrideSlugEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); recheckImageOverride(); }
  });

  // ── Widget HTML builders (inline styles, no Flexbox, h5/h6 only) ──
  // All three styles read from the SAME unified data shape:
  //   { category, headline, intro, points: [{icon,title,description,badge}] x4, footerText, footerBadge }
  // Layered / Numbered use points[0..2]; Grid uses all 4. This is what
  // makes instant style-switching possible without another AI call.
  //
  // Editable text carries a data-field attribute so makeEditable() can
  // wire it up and keep currentData in sync as the rep types.

  function gradientHeaderStyle(hex) {
    const dark = shadeHex(hex, -0.35);
    return `background-color:${hex};background-image:radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(135deg, ${dark} 0%, ${hex} 100%);background-size:14px 14px, 100% 100%;padding:16px 18px 14px;`;
  }

  function kickerHtml(text) {
    return `<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:5px;">${esc(text)}</div>`;
  }

  function headlineHtml(text) {
    return `<h5 data-field="headline" style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#ffffff;line-height:1.28;letter-spacing:-0.01em;">${esc(text)}</h5>`;
  }

  function introHtml(text) {
    return `<div style="padding:14px 18px;border-bottom:1px solid #e3e7ee;"><p data-field="intro" style="margin:0;font-size:13px;color:#586273;line-height:1.6;">${esc(text)}</p></div>`;
  }

  // Style 1 — Layered Rows
  function buildLayeredHtml(data, hex) {
    const points = (data.points || []).slice(0, 3);
    const rows = points.map((pt, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;${tint}">
    <tr>
      <td style="padding:10px 14px;width:40px;vertical-align:top;">
        <span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:#eaf1fc;font-size:16px;">${esc(pt.icon || '•')}</span>
      </td>
      <td style="padding:10px 14px 10px 0;vertical-align:top;">
        <div data-field="point${idx}-title" style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
        <div data-field="point${idx}-description" style="font-size:12px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
      </td>
    </tr>
  </table>`;
    }).join('');

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${imageStripHtml(data._image)}
  ${introHtml(data.intro || '')}
  ${rows}
</div>`;
  }

  // Style 2 — Numbered Blocks
  function buildNumberedHtml(data, hex) {
    const points = (data.points || []).slice(0, 3);
    const rows = points.map((pt, idx) => {
      const tint = idx % 2 !== 0 ? 'background:#f4f7fb;' : '';
      return `<table width="100%" style="border-collapse:collapse;border-bottom:1px solid #e3e7ee;${tint}">
    <tr>
      <td style="width:36px;background:${esc(hex)};color:#ffffff;text-align:center;font-size:14px;font-weight:700;vertical-align:middle;padding:10px 0;">${idx + 1}</td>
      <td style="padding:10px 14px;vertical-align:top;">
        <div data-field="point${idx}-title" style="font-size:13px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
        <div data-field="point${idx}-description" style="font-size:12px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
      </td>
      <td style="width:80px;text-align:center;vertical-align:middle;padding:10px 6px;">
        <span data-field="point${idx}-badge" style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(pt.badge || 'Included')}</span>
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
    const points = (data.points || []).slice(0, 4);
    while (points.length < 4) points.push({ icon: '•', title: '', description: '' });

    const cell = (pt, idx, borderRight, borderBottom) => {
      const border = `${borderRight ? 'border-right:1px solid #e3e7ee;' : ''}${borderBottom ? 'border-bottom:1px solid #e3e7ee;' : ''}`;
      return `<td style="padding:12px 14px;vertical-align:top;width:50%;${border}">
      <div style="font-size:16px;margin-bottom:4px;">${esc(pt.icon || '•')}</div>
      <div data-field="point${idx}-title" style="font-size:12.5px;font-weight:700;color:#0b1220;margin-bottom:2px;">${esc(pt.title || '')}</div>
      <div data-field="point${idx}-description" style="font-size:11.5px;color:#586273;line-height:1.5;">${esc(pt.description || '')}</div>
    </td>`;
    };

    const grid = `<table width="100%" style="border-collapse:collapse;">
    <tr>${cell(points[0], 0, true, true)}${cell(points[1], 1, false, true)}</tr>
    <tr>${cell(points[2], 2, true, false)}${cell(points[3], 3, false, false)}</tr>
  </table>`;

    const footer = `<table width="100%" style="border-collapse:collapse;background:#f4f7fb;border-top:1px solid #e3e7ee;">
    <tr>
      <td data-field="footerText" style="padding:10px 14px;font-size:11.5px;color:#9ca3af;">${esc(data.footerText || 'Managed & supported by your IT team')}</td>
      <td style="padding:10px 14px;text-align:right;">
        <span data-field="footerBadge" style="display:inline-block;background:#dcfce7;color:#15a05a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;">${esc(data.footerBadge || '✓ Fully managed')}</span>
      </td>
    </tr>
  </table>`;

    return `<div style="width:100%;background:#ffffff;border:1px solid #e3e7ee;overflow:hidden;">
  <div style="${gradientHeaderStyle(hex)}">
    ${kickerHtml(data.category || '')}
    ${headlineHtml(data.headline || '')}
  </div>
  ${imageStripHtml(data._image)}
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

  // ── Inline editing (contenteditable, no raw HTML view) ──
  // Reps only ever click into the rendered widget and type — no HTML
  // is ever shown. Edits sync back into currentData immediately so
  // switching style or theme afterwards preserves the edited copy.
  function makeEditable(frame) {
    frame.querySelectorAll('[data-field]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.addEventListener('input', () => {
        const field = el.dataset.field;
        const text = el.textContent;
        const pointMatch = field.match(/^point(\d)-(title|description|badge)$/);
        if (pointMatch) {
          const idx = parseInt(pointMatch[1], 10);
          const sub = pointMatch[2];
          if (currentData.points && currentData.points[idx]) {
            currentData.points[idx][sub] = text;
          }
        } else {
          currentData[field] = text;
        }
        currentHtml = getWidgetHtmlFromFrame(frame);
      });
    });
  }

  // Capture the current live widget HTML (with edits applied), stripping
  // the contenteditable attributes that only make sense in the tool UI.
  function getWidgetHtmlFromFrame(frame) {
    const clone = frame.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
    return clone.innerHTML;
  }

  // ── Single render entry point used by generate / regenerate / style / theme ──
  function renderPreview() {
    const html = renderWidgetHtml(selectedStyle, currentData, currentThemeHex);
    widgetPreview.innerHTML = html;
    makeEditable(widgetPreview);
    currentHtml = getWidgetHtmlFromFrame(widgetPreview);
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

  // Scrolls so the output panel's top is comfortably in view — used the
  // moment Generate/Regenerate is clicked so the loader and result both
  // land where the rep is already looking, instead of below the fold.
  function scrollToOutput() {
    const panel = widgetOutput.closest('.output-panel') || widgetOutput.parentElement;
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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

    // Scroll to the output panel right away so the loader — and then the
    // widget — is in view. On narrow / stacked layouts the right column
    // can otherwise sit well below the fold when Generate is clicked.
    scrollToOutput();

    try {
      const [json, imageInfo] = await Promise.all([
        fetch('/api/product-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        }).then(r => r.json()),
        resolveImage(requestPayload.name, imageOverrideSlugEl.value)
      ]);
      if (!json.ok) throw new Error(json.error || 'Generation failed.');

      currentData  = json.data;
      currentData._image = imageInfo;
      currentTitle = `${requestPayload.name} — Explainer`;
      updateImageNote(imageInfo);
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
    renderPreview();
    widgetTitleEl.textContent = currentTitle;

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
    scrollToOutput();
    try {
      const [json, imageInfo] = await Promise.all([
        fetch('/api/product-explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lastRequest)
        }).then(r => r.json()),
        resolveImage(lastRequest.name, imageOverrideSlugEl.value)
      ]);
      if (!json.ok) throw new Error(json.error || 'Regeneration failed.');
      currentData = json.data;
      currentData._image = imageInfo;
      updateImageNote(imageInfo);
      renderOutput();
    } catch (e) {
      showError('Regeneration failed: ' + e.message);
    } finally {
      regenerateBtn.disabled = false;
      regenerateBtn.textContent = '↺ Regenerate';
    }
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

  // ── Clear (start over for the next line item) ────────────
  // Resets product name / context / preview, but deliberately keeps
  // selectedStyle and currentThemeHex so the MSP doesn't have to
  // re-pick them for every product in a batch quote.
  function clearForm() {
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

    imageOverrideSlugEl.value = '';
    imageOverrideSlugEl.hidden = true;
    imageSlugNote.hidden = true;

    widgetOutput.hidden = true;
    emptyState.hidden = false;
    hideError();

    productNameEl.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  clearBtn.addEventListener('click', clearForm);

  // ── Generated this session list ───────────────
  function addToSessionList(title, html) {
    sessionWidgets.unshift({ title, html });
    renderSessionList();
  }

  function renderSessionList() {
    // Only earns its keep once there's more than one widget to choose
    // from — with just one, it's a redundant duplicate of the Copy HTML
    // button right above it in the main preview.
    if (sessionWidgets.length < 2) { sessionListBlock.hidden = true; return; }
    sessionListBlock.hidden = false;
    sessionList.innerHTML = '';
    sessionWidgets.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'session-item';
      row.innerHTML = `
        <span class="session-item-name">${esc(item.title)}</span>
        <span class="session-item-actions">
          <button type="button" class="session-copy-btn">Copy HTML</button>
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
