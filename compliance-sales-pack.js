/* ============================================================
   Compliance Sales Pack — Frontend JS
   ============================================================ */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────
  let currentTheme = '#0f1f3d';
  let includeWidget4 = true;
  let generatedWidgets = null; // { whyMatters, commonGaps, howWeGetThere, whatUnlocks }
  let currentFramework = '';
  let currentIndustry = '';

  const WIDGET_DEFS = [
    { key: 'whyMatters',    label: 'Why This Framework Matters',            pushName: (fw) => `Why ${fw} Matters`,     always: true  },
    { key: 'commonGaps',    label: 'Where Most Businesses Fall Short',      pushName: ()    => 'Common Gaps',          always: true  },
    { key: 'howWeGetThere', label: 'How We Get You There',                  pushName: ()    => 'How We Get There',     always: true  },
    { key: 'whatUnlocks',   label: 'What Compliance Unlocks',               pushName: (fw) => `What ${fw} Unlocks`,    always: false },
  ];

  // ─── DOM refs ─────────────────────────────────────────────
  const frameworkSel        = document.getElementById('framework');
  const industrySel         = document.getElementById('industry');
  const engagementSel       = document.getElementById('engagementType');
  const customEngagementWrap= document.getElementById('customEngagementWrap');
  const customEngagementTA  = document.getElementById('customEngagement');
  const charCount           = document.getElementById('charCount');
  const widget4Toggle       = document.getElementById('widget4Toggle');
  const swatchRow           = document.getElementById('swatchRow');
  const customHexInput      = document.getElementById('customHex');
  const hexPreview          = document.getElementById('hexPreview');
  const generateBtn         = document.getElementById('generateBtn');
  const clearBtn            = document.getElementById('clearBtn');
  const emptyState          = document.getElementById('emptyState');
  const loadingState        = document.getElementById('loadingState');
  const loadingMsg          = document.getElementById('loadingMsg');
  const outputPanel         = document.getElementById('outputPanel');
  const outputLabel         = document.getElementById('outputLabel');
  const regenAllBtn         = document.getElementById('regenAllBtn');
  const widgetPanels        = document.getElementById('widgetPanels');
  const copyAllBtn          = document.getElementById('copyAllBtn');
  const pushIndividualBtn   = document.getElementById('pushIndividualBtn');
  const pushPackBtn         = document.getElementById('pushPackBtn');
  const credsForm           = document.getElementById('credsForm');
  const sbApiKeyInput       = document.getElementById('sbApiKey');
  const sbTenantUrlInput    = document.getElementById('sbTenantUrl');
  const saveCredsBtn        = document.getElementById('saveCredsBtn');
  const pushStatus          = document.getElementById('pushStatus');

  let pendingPushAction = null; // 'pack' | 'individual' — retried after creds saved

  // ─── Engagement type — show/hide custom field ──────────────
  engagementSel.addEventListener('change', () => {
    customEngagementWrap.hidden = engagementSel.value !== 'Custom';
  });
  customEngagementTA.addEventListener('input', () => {
    charCount.textContent = customEngagementTA.value.length;
  });

  // ─── Widget 4 toggle ────────────────────────────────────────
  widget4Toggle.addEventListener('click', () => {
    includeWidget4 = !includeWidget4;
    widget4Toggle.dataset.state = includeWidget4 ? 'on' : 'off';
    widget4Toggle.setAttribute('aria-checked', String(includeWidget4));
  });

  // ─── Color theme ───────────────────────────────────────────
  function setTheme(hex) {
    currentTheme = hex;
    hexPreview.style.background = hex;
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.hex.toLowerCase() === hex.toLowerCase());
    });
    if (generatedWidgets) renderAllPreviews();
  }

  swatchRow.querySelectorAll('.swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      customHexInput.value = '';
      setTheme(btn.dataset.hex);
    });
  });

  customHexInput.addEventListener('input', () => {
    const val = customHexInput.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    customHexInput.value = val;
    if (val.length === 6) setTheme('#' + val);
  });

  // ─── Generate ───────────────────────────────────────────────
  async function generate(regenKey = null) {
    const framework = frameworkSel.value;
    const industry  = industrySel.value;
    const engagement = engagementSel.value;
    const customEngagement = engagement === 'Custom' ? customEngagementTA.value.trim() : '';

    if (engagement === 'Custom' && !customEngagement) {
      customEngagementTA.focus();
      customEngagementTA.style.outline = '2px solid var(--danger)';
      setTimeout(() => customEngagementTA.style.outline = '', 1500);
      return;
    }

    currentFramework = framework;
    currentIndustry  = industry;

    showLoading('Building your compliance proposal…');
    generateBtn.disabled = true;
    regenAllBtn.disabled = true;

    try {
      const payload = {
        framework,
        industry,
        engagement,
        customEngagement,
        includeWidget4,
        regenKey
      };

      const res = await fetch('/api/compliance-sales-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.ok) {
        alert('Generation failed: ' + (data.error || 'Unknown error'));
        return;
      }

      if (regenKey) {
        generatedWidgets = generatedWidgets || {};
        generatedWidgets[regenKey] = data.widgets[regenKey];
      } else {
        generatedWidgets = data.widgets;
      }

      renderWidgets(regenKey);
      outputPanel.hidden = false;
      emptyState.hidden = true;
      outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    } finally {
      hideLoading();
      generateBtn.disabled = false;
      regenAllBtn.disabled = false;
    }
  }

  generateBtn.addEventListener('click', () => generate());
  regenAllBtn.addEventListener('click', () => generate());

  // ─── Clear / Start Over ─────────────────────────────────────
  clearBtn.addEventListener('click', () => {
    frameworkSel.selectedIndex = 0;
    industrySel.selectedIndex = 0;
    engagementSel.selectedIndex = 0;
    customEngagementWrap.hidden = true;
    customEngagementTA.value = '';
    charCount.textContent = '0';
    includeWidget4 = true;
    widget4Toggle.dataset.state = 'on';
    widget4Toggle.setAttribute('aria-checked', 'true');
    setTheme('#0f1f3d');
    customHexInput.value = '';

    generatedWidgets = null;
    widgetPanels.innerHTML = '';
    outputPanel.hidden = true;
    emptyState.hidden = false;
    pushStatus.hidden = true;
    credsForm.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ─── Render widget panels ───────────────────────────────────
  function activeDefs() {
    return WIDGET_DEFS.filter(d => d.always || includeWidget4);
  }

  function renderWidgets(regenKey = null) {
    outputLabel.textContent = `${currentFramework} — ${currentIndustry}`;

    if (regenKey) {
      const existing = document.getElementById('panel-' + regenKey);
      const def = WIDGET_DEFS.find(d => d.key === regenKey);
      const fresh = buildWidgetPanel(def);
      if (existing) existing.replaceWith(fresh);
      else widgetPanels.appendChild(fresh);
    } else {
      widgetPanels.innerHTML = '';
      activeDefs().forEach(def => widgetPanels.appendChild(buildWidgetPanel(def)));
    }
  }

  function renderAllPreviews() {
    activeDefs().forEach(def => {
      const wrap = document.getElementById('preview-' + def.key);
      if (wrap && generatedWidgets && generatedWidgets[def.key]) {
        wrap.innerHTML = buildWidgetHtml(def.key, generatedWidgets[def.key], currentTheme);
        bindEditable(wrap, def.key);
      }
    });
  }

  function buildWidgetPanel(def) {
    const panel = document.createElement('div');
    panel.className = 'widget-panel';
    panel.id = 'panel-' + def.key;

    const header = document.createElement('div');
    header.className = 'widget-panel-header';
    header.innerHTML = `
      <span class="widget-panel-name">${escHtml(def.label)}</span>
      <div class="widget-panel-actions">
        <button class="btn-regen" data-key="${def.key}">↺ Regenerate</button>
        <button class="btn-copy-widget" data-key="${def.key}">Copy HTML</button>
        <button class="btn-push-widget" data-key="${def.key}">Push Widget</button>
      </div>
    `;
    panel.appendChild(header);

    const previewWrap = document.createElement('div');
    previewWrap.className = 'widget-preview-wrap';
    previewWrap.id = 'preview-' + def.key;
    previewWrap.innerHTML = buildWidgetHtml(def.key, generatedWidgets[def.key], currentTheme);
    panel.appendChild(previewWrap);

    bindEditable(previewWrap, def.key);

    header.querySelector('.btn-regen').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '…';
      await generate(def.key);
      btn.disabled = false;
      btn.textContent = '↺ Regenerate';
    });

    header.querySelector('.btn-copy-widget').addEventListener('click', (e) => {
      const html = getLiveHtml(def.key);
      copyToClipboard(html, e.currentTarget, 'Copy HTML', 'Copied ✓');
    });

    header.querySelector('.btn-push-widget').addEventListener('click', () => {
      pushSingleWidget(def);
    });

    return panel;
  }

  // ─── Editable regions ───────────────────────────────────────
  // Every field the AI generates is directly editable in place — click and type.
  // Three shapes are supported:
  //   1. Plain field on the widget object      (data-editable-id="headline")
  //   2. One item in an array of strings         (data-editable-id="benefits" data-editable-idx="1")
  //   3. One property of one item in an array     (data-editable-id="gaps" data-editable-idx="1" data-editable-sub="why")
  // Multi-paragraph fields (like "body") are made contenteditable as a single block
  // so paragraph breaks are preserved and edits don't clobber the rest of the field.
  function bindEditable(wrap, key) {
    wrap.querySelectorAll('[data-editable-id]').forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.title = 'Click to edit';
      el.addEventListener('input', () => {
        if (!generatedWidgets || !generatedWidgets[key]) return;
        const field = el.dataset.editableId;
        const idx = el.dataset.editableIdx;
        const sub = el.dataset.editableSub;

        if (idx !== undefined) {
          const arr = generatedWidgets[key][field];
          if (!Array.isArray(arr)) return;
          if (sub) {
            arr[Number(idx)] = { ...arr[Number(idx)], [sub]: el.textContent };
          } else {
            arr[Number(idx)] = el.textContent;
          }
        } else if (el.dataset.editableMulti === 'true') {
          generatedWidgets[key][field] = extractMultilineText(el);
        } else {
          generatedWidgets[key][field] = el.textContent;
        }
      });
    });
  }

  // Reconstruct a "\n"-joined string from a contenteditable block made of <p> children,
  // falling back to plain textContent if the browser has collapsed the paragraphs.
  function extractMultilineText(el) {
    const paras = el.querySelectorAll('p');
    if (paras.length) return Array.from(paras).map(p => p.textContent).join('\n');
    return el.textContent;
  }

  function getLiveHtml(key) {
    const wrap = document.getElementById('preview-' + key);
    const clone = wrap.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('title');
    });
    return clone.innerHTML.trim();
  }

  // ─── Widget HTML builders (TinyMCE-safe, inline styles only) ─

  function shade(hex, factor) {
    const h = hex.replace('#', '');
    const r = Math.round(parseInt(h.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(h.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(h.substr(4, 2), 16) * factor);
    const clamp = v => Math.max(0, Math.min(255, v));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function buildHeader(kicker, title, subtitle, hex, headlineEditId) {
    const dark = shade(hex, 0.55);
    return `
  <div style="background:linear-gradient(135deg, ${dark} 0%, ${hex} 100%);background-image:radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(135deg, ${dark} 0%, ${hex} 100%);background-size:14px 14px, cover;padding:16px 18px 14px;">
    <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:5px;">${escHtml(kicker)}</div>
    <h5 data-editable-id="${headlineEditId}" style="margin:0;font-size:16px;font-weight:700;color:#ffffff;line-height:1.3;letter-spacing:-0.01em;">${escHtml(title)}</h5>
    ${subtitle ? `<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;">${escHtml(subtitle)}</div>` : ''}
  </div>`;
  }

  function buildFooter(label, hex) {
    return `
  <div style="background:#f4f7fb;border-top:1px solid #e3e7ee;padding:8px 16px;">
    <span style="font-size:11px;font-weight:600;color:${hex};">${escHtml(label)}</span>
  </div>`;
  }

  function buildWidgetHtml(key, widget, hex) {
    if (!widget) return '';
    switch (key) {
      case 'whyMatters':    return buildWhyMatters(widget, hex);
      case 'commonGaps':    return buildCommonGaps(widget, hex);
      case 'howWeGetThere': return buildHowWeGetThere(widget, hex);
      case 'whatUnlocks':   return buildWhatUnlocks(widget, hex);
      default: return '';
    }
  }

  function bodyParagraphs(text, editId) {
    const lines = (text || '').split('\n').filter(l => l.trim());
    const paras = (lines.length ? lines : ['']).map(l =>
      `<p style="margin:0 0 8px 0;font-size:13px;color:#586273;line-height:1.65;">${escHtml(l.trim())}</p>`
    ).join('');
    return `<div data-editable-id="${editId}" data-editable-multi="true">${paras}</div>`;
  }

  function buildWhyMatters(w, hex) {
    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};width:100%;max-width:100%;overflow:hidden;">
${buildHeader('COMPLIANCE — WHY IT MATTERS', w.headline, '', hex, 'headline')}
  <div style="padding:16px 18px;">
    ${bodyParagraphs(w.body, 'body')}
  </div>
${buildFooter('Understanding the requirement — and what non-compliance really costs', hex)}
</div>`;
  }

  function buildCommonGaps(w, hex) {
    const gaps = Array.isArray(w.gaps) ? w.gaps : [];
    const rows = gaps.map((gap, i) => `
    <div style="padding:12px 0;${i > 0 ? 'border-top:1px solid #e3e7ee;' : ''}">
      <span style="display:inline-block;background:#fef3c7;color:#b3760a;font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:6px;" data-editable-id="gaps" data-editable-idx="${i}" data-editable-sub="name">${escHtml(gap.name || '')}</span>
      <p style="margin:2px 0 0;font-size:12px;color:#586273;line-height:1.6;"><strong style="color:#0b1220;">Why it's typical:</strong> <span data-editable-id="gaps" data-editable-idx="${i}" data-editable-sub="why">${escHtml(gap.why || '')}</span></p>
      <p style="margin:2px 0 0;font-size:12px;color:#586273;line-height:1.6;"><strong style="color:#0b1220;">The consequence:</strong> <span data-editable-id="gaps" data-editable-idx="${i}" data-editable-sub="consequence">${escHtml(gap.consequence || '')}</span></p>
    </div>`).join('');

    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};width:100%;max-width:100%;overflow:hidden;">
${buildHeader('COMPLIANCE — COMMON GAPS', w.headline, '', hex, 'headline')}
  <div style="padding:6px 18px 16px;">
    ${rows}
  </div>
${buildFooter("Most businesses we work with haven't closed these yet — this is where discovery starts", hex)}
</div>`;
  }

  function buildHowWeGetThere(w, hex) {
    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};width:100%;max-width:100%;overflow:hidden;">
${buildHeader('COMPLIANCE — THE PATH', w.headline, '', hex, 'headline')}
  <div style="padding:16px 18px;">
    ${bodyParagraphs(w.body, 'body')}
    ${w.timeline ? `<div style="margin-top:12px;padding:8px 12px;background:#f4f7fb;border-left:3px solid ${hex};border-radius:4px;">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${hex};">Typical Timeline</span>
      <p data-editable-id="timeline" style="margin:2px 0 0;font-size:12px;color:#0b1220;font-weight:600;">${escHtml(w.timeline)}</p>
    </div>` : ''}
  </div>
${buildFooter('A clear, managed path — not a daunting overhaul', hex)}
</div>`;
  }

  function buildWhatUnlocks(w, hex) {
    const benefits = Array.isArray(w.benefits) ? w.benefits : [];
    const items = benefits.map((b, i) => `
    <div style="display:table;width:100%;margin-bottom:8px;">
      <div style="display:table-cell;width:20px;color:${hex};font-weight:700;vertical-align:top;">✓</div>
      <div style="display:table-cell;font-size:13px;color:#586273;line-height:1.6;" data-editable-id="benefits" data-editable-idx="${i}">${escHtml(b)}</div>
    </div>`).join('');

    return `<div style="font-family:'Source Sans Pro',Arial,sans-serif;background:#ffffff;border:1px solid #e3e7ee;border-top:3px solid ${hex};width:100%;max-width:100%;overflow:hidden;">
${buildHeader('COMPLIANCE — THE UPSIDE', w.headline, '', hex, 'headline')}
  <div style="padding:16px 18px;">
    ${items}
  </div>
${buildFooter('Compliance as an enabler, not just a cost', hex)}
</div>`;
  }

  // ─── Copy all HTML ──────────────────────────────────────────
  copyAllBtn.addEventListener('click', () => {
    if (!generatedWidgets) return;
    const full = activeDefs().map(d => getLiveHtml(d.key)).join('\n\n');
    copyToClipboard(full, copyAllBtn, 'Copy All HTML', 'Copied ✓');
  });

  // ─── Push helpers ───────────────────────────────────────────
  function widgetTitle(def) {
    return `${currentFramework} — Compliance — ${def.pushName(currentFramework)}`;
  }

  function ensureCreds(action) {
    const key = localStorage.getItem('sb_api_key');
    const url = localStorage.getItem('sb_tenant_url');
    if (!key || !url) {
      pendingPushAction = action;
      credsForm.hidden = false;
      credsForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      sbApiKeyInput.focus();
      return null;
    }
    return { key, url };
  }

  async function pushSingleWidget(def) {
    const creds = ensureCreds({ type: 'single', def });
    if (!creds) return;
    const title = widgetTitle(def);
    await doPush([{ type: 'html', content: getLiveHtml(def.key), title }], title, creds);
  }

  pushIndividualBtn.addEventListener('click', async () => {
    if (!generatedWidgets) return;
    const creds = ensureCreds({ type: 'individual' });
    if (!creds) return;
    const widgets = activeDefs().map(d => ({ type: 'html', content: getLiveHtml(d.key), title: widgetTitle(d) }));
    await doPush(widgets, `${currentFramework} — Compliance`, creds);
  });

  pushPackBtn.addEventListener('click', async () => {
    if (!generatedWidgets) return;
    const creds = ensureCreds({ type: 'pack' });
    if (!creds) return;
    const full = activeDefs().map(d => getLiveHtml(d.key)).join('\n\n');
    const title = `${currentFramework} — Compliance — Full Pack`;
    await doPush([{ type: 'html', content: full, title }], title, creds);
  });

  saveCredsBtn.addEventListener('click', () => {
    const key = sbApiKeyInput.value.trim();
    const url = sbTenantUrlInput.value.trim();
    if (!key || !url) { alert('Please enter both your API key and tenant URL.'); return; }
    localStorage.setItem('sb_api_key', key);
    localStorage.setItem('sb_tenant_url', url);
    credsForm.hidden = true;

    const action = pendingPushAction;
    pendingPushAction = null;
    if (!action) return;

    if (action.type === 'single') pushSingleWidget(action.def);
    else if (action.type === 'individual') pushIndividualBtn.click();
    else if (action.type === 'pack') pushPackBtn.click();
  });

  async function doPush(widgets, prefix, creds) {
    showPushStatus('Pushing to Salesbuildr…', '');
    pushPackBtn.disabled = true;
    pushIndividualBtn.disabled = true;

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets, prefix, apiKey: creds.key, tenantUrl: creds.url })
      });
      const data = await res.json();

      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`✓ ${widgets.length > 1 ? widgets.length + ' widgets' : '1 widget'} pushed to Salesbuildr.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error. Check your credentials.'), 'err');
      }
    } catch (err) {
      console.error(err);
      showPushStatus('Push failed: ' + (err.message || 'Network error.'), 'err');
    } finally {
      pushPackBtn.disabled = false;
      pushIndividualBtn.disabled = false;
    }
  }

  function showPushStatus(msg, type) {
    pushStatus.hidden = false;
    pushStatus.className = 'push-status' + (type ? ' ' + type : '');
    pushStatus.textContent = msg;
    pushStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Pre-fill creds inputs
  (function prefillCreds() {
    const key = localStorage.getItem('sb_api_key');
    const url = localStorage.getItem('sb_tenant_url');
    if (key) sbApiKeyInput.value = key;
    if (url) sbTenantUrlInput.value = url;
  })();

  // ─── Loading helpers ────────────────────────────────────────
  function showLoading(msg) {
    loadingMsg.textContent = msg || 'Building your compliance proposal…';
    loadingState.hidden = false;
    emptyState.hidden = true;
    loadingState.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function hideLoading() { loadingState.hidden = true; }

  // ─── Clipboard ──────────────────────────────────────────────
  function copyToClipboard(text, btn, defaultLabel, doneLabel) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = doneLabel;
      setTimeout(() => { btn.textContent = defaultLabel || orig; }, 2000);
    }).catch(() => alert('Could not copy to clipboard. Try again.'));
  }

  // ─── Escape ─────────────────────────────────────────────────
  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
