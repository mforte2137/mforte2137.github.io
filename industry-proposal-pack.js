/* ============================================================
   Industry Proposal Pack — Frontend JS
   ============================================================ */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────
  let currentMode = 'generic';
  let currentTheme = '#0f1f3d';
  let currentVertical = '';
  let generatedWidgets = null; // { painPoints, whyItMatters, compliance, ourApproach, whatsIncluded }

  // Widget manifest — order, label, key
  const WIDGET_DEFS = [
    { key: 'painPoints',    label: 'Pain Points',    name: 'Pain Points' },
    { key: 'whyItMatters',  label: 'Why IT Matters', name: 'Why IT Matters' },
    { key: 'compliance',    label: 'Compliance & Risk', name: 'Compliance & Risk' },
    { key: 'ourApproach',   label: 'Our Approach',   name: 'Our Approach' },
    { key: 'whatsIncluded', label: "What's Included", name: "What's Included" },
  ];

  // ─── DOM refs ─────────────────────────────────────────────
  const loadingOverlay   = document.getElementById('loadingOverlay');
  const loadingMsg       = document.getElementById('loadingMsg');
  const verticalSel      = document.getElementById('vertical');
  const engagementTA     = document.getElementById('engagement');
  const charCount        = document.getElementById('charCount');
  const btnGeneric       = document.getElementById('btnGeneric');
  const btnPersonalised  = document.getElementById('btnPersonalised');
  const mergeTagNote     = document.getElementById('mergeTagNote');
  const swatchRow        = document.getElementById('swatchRow');
  const customHexInput   = document.getElementById('customHex');
  const generateBtn      = document.getElementById('generateBtn');
  const deliveryPanel    = document.getElementById('deliveryPanel');
  const copyHtmlBtn      = document.getElementById('copyHtmlBtn');
  const pushPackBtn      = document.getElementById('pushPackBtn');
  const pushIndividualBtn= document.getElementById('pushIndividualBtn');
  const pushStatus       = document.getElementById('pushStatus');
  const credsForm        = document.getElementById('credsForm');
  const sbApiKeyInput    = document.getElementById('sbApiKey');
  const sbTenantUrlInput = document.getElementById('sbTenantUrl');
  const saveCredsBtn     = document.getElementById('saveCredsBtn');
  const outputEmpty      = document.getElementById('outputEmpty');
  const widgetsContainer = document.getElementById('widgetsContainer');
  const widgetsLabel     = document.getElementById('widgetsLabel');
  const regenAllBtn      = document.getElementById('regenAllBtn');
  const widgetPanels     = document.getElementById('widgetPanels');

  // ─── Char counter ─────────────────────────────────────────
  engagementTA.addEventListener('input', () => {
    charCount.textContent = engagementTA.value.length;
  });

  // ─── Mode toggle ──────────────────────────────────────────
  function setMode(mode) {
    currentMode = mode;
    btnGeneric.classList.toggle('active', mode === 'generic');
    btnPersonalised.classList.toggle('active', mode === 'personalised');
    mergeTagNote.hidden = mode !== 'personalised';
  }

  btnGeneric.addEventListener('click', () => setMode('generic'));
  btnPersonalised.addEventListener('click', () => setMode('personalised'));

  // ─── Colour swatches ──────────────────────────────────────
  function setTheme(hex) {
    currentTheme = hex;
    // update active swatch
    document.querySelectorAll('.swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.hex === hex);
    });
    // re-render previews if we have widgets
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
    if (val.length === 6) {
      const hex = '#' + val;
      // Deactivate all swatches
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      currentTheme = hex;
      if (generatedWidgets) renderAllPreviews();
    }
  });

  // ─── Generate ─────────────────────────────────────────────
  async function generate(regenKey = null) {
    const vertical = verticalSel.value;
    if (!vertical) {
      verticalSel.focus();
      verticalSel.style.outline = '2px solid var(--danger)';
      setTimeout(() => verticalSel.style.outline = '', 2000);
      return;
    }

    currentVertical = vertical;
    const engagement = engagementTA.value.trim();

    showLoading('Generating your industry pack…');
    generateBtn.disabled = true;
    regenAllBtn.disabled = true;

    try {
      const payload = {
        vertical,
        engagement,
        mode: currentMode,
        mergeTagsAvailable: ['{{company.name}}', '{{contact.firstName}}', '{{servicingBranch.name}}'],
        regenKey
      };

      const res = await fetch('/api/industry-proposal-pack', {
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
        // Merge single widget back in
        generatedWidgets[regenKey] = data.widgets[regenKey];
      } else {
        generatedWidgets = data.widgets;
      }

      renderWidgets(regenKey);
      showDelivery();

    } catch (err) {
      console.error(err);
      alert('Something went wrong. Check the console and Netlify function logs.');
    } finally {
      hideLoading();
      generateBtn.disabled = false;
      regenAllBtn.disabled = false;
    }
  }

  generateBtn.addEventListener('click', () => generate());
  regenAllBtn.addEventListener('click', () => generate());

  // ─── Render widgets ───────────────────────────────────────
  function renderWidgets(regenKey = null) {
    outputEmpty.hidden = true;
    widgetsContainer.hidden = false;
    widgetsLabel.textContent = currentVertical + ' — 5 Widgets';

    if (regenKey) {
      // Re-render just that panel
      const panelEl = document.getElementById('panel-' + regenKey);
      if (panelEl) {
        const w = generatedWidgets[regenKey];
        const def = WIDGET_DEFS.find(d => d.key === regenKey);
        panelEl.replaceWith(buildWidgetPanel(def, w));
      }
    } else {
      widgetPanels.innerHTML = '';
      WIDGET_DEFS.forEach(def => {
        const w = generatedWidgets[def.key];
        widgetPanels.appendChild(buildWidgetPanel(def, w));
      });
    }
  }

  function buildWidgetPanel(def, widget) {
    const panel = document.createElement('div');
    panel.className = 'widget-panel';
    panel.id = 'panel-' + def.key;

    // Header
    const header = document.createElement('div');
    header.className = 'widget-panel-header';
    header.innerHTML = `
      <span class="widget-panel-name">${def.label}</span>
      <div class="widget-panel-actions">
        <button class="btn-copy-widget" data-key="${def.key}">Copy HTML</button>
        <button class="btn-regen" data-key="${def.key}">Regenerate</button>
      </div>
    `;
    panel.appendChild(header);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'widget-tabs';
    tabs.innerHTML = `
      <button class="widget-tab active" data-tab="preview" data-key="${def.key}">Preview</button>
      <button class="widget-tab" data-tab="edit" data-key="${def.key}">Edit</button>
    `;
    panel.appendChild(tabs);

    // Preview
    const previewDiv = document.createElement('div');
    previewDiv.className = 'widget-preview';
    previewDiv.id = 'preview-' + def.key;
    previewDiv.innerHTML = buildWidgetHtml(widget, currentTheme);
    panel.appendChild(previewDiv);

    // Edit
    const editDiv = document.createElement('div');
    editDiv.className = 'widget-edit';
    editDiv.id = 'edit-' + def.key;
    editDiv.hidden = true;
    editDiv.innerHTML = `
      <div class="edit-field">
        <label>Headline</label>
        <input type="text" class="edit-input" id="edit-headline-${def.key}" value="${escAttr(widget.headline)}" />
      </div>
      <div class="edit-field">
        <label>Body</label>
        <textarea class="edit-textarea" id="edit-body-${def.key}" rows="8">${escHtml(widget.body)}</textarea>
      </div>
      <button class="btn-apply-edits" data-key="${def.key}">Apply Changes</button>
    `;
    panel.appendChild(editDiv);

    // ── Events ──
    // Tabs
    panel.querySelectorAll('.widget-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        const key = tab.dataset.key;
        panel.querySelectorAll('.widget-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        document.getElementById('preview-' + key).hidden = tabName !== 'preview';
        document.getElementById('edit-' + key).hidden = tabName !== 'edit';
      });
    });

    // Regen single
    panel.querySelector('.btn-regen').addEventListener('click', async (e) => {
      const key = e.currentTarget.dataset.key;
      e.currentTarget.disabled = true;
      e.currentTarget.textContent = '…';
      await generate(key);
      e.currentTarget.disabled = false;
      e.currentTarget.textContent = 'Regenerate';
    });

    // Copy single widget
    panel.querySelector('.btn-copy-widget').addEventListener('click', (e) => {
      const key = e.currentTarget.dataset.key;
      const html = buildWidgetHtml(generatedWidgets[key], currentTheme);
      copyToClipboard(html, e.currentTarget, 'Copy HTML', 'Copied ✓');
    });

    // Apply edits
    panel.querySelector('.btn-apply-edits').addEventListener('click', (e) => {
      const key = e.currentTarget.dataset.key;
      const newHeadline = document.getElementById('edit-headline-' + key).value;
      const newBody = document.getElementById('edit-body-' + key).value;
      generatedWidgets[key] = { headline: newHeadline, body: newBody };
      document.getElementById('preview-' + key).innerHTML = buildWidgetHtml(generatedWidgets[key], currentTheme);
    });

    return panel;
  }

  // ─── Re-render all previews on theme change ───────────────
  function renderAllPreviews() {
    WIDGET_DEFS.forEach(def => {
      const previewEl = document.getElementById('preview-' + def.key);
      if (previewEl && generatedWidgets && generatedWidgets[def.key]) {
        previewEl.innerHTML = buildWidgetHtml(generatedWidgets[def.key], currentTheme);
      }
    });
  }

  // ─── Build widget HTML (inline styles, TinyMCE-safe) ──────
  function buildWidgetHtml(widget, themeHex) {
    if (!widget) return '';
    const { headline, body } = widget;

    // Convert body lines — support simple markdown-ish:
    // lines starting with "- " become <li> items; else <p>
    const lines = body.split('\n').filter(l => l.trim() !== '');
    const bulletLines = lines.filter(l => l.trim().startsWith('- '));
    const isBulletList = bulletLines.length > 2 && bulletLines.length >= lines.length * 0.6;

    let bodyHtml;
    if (isBulletList) {
      const items = lines.map(l => {
        const text = l.trim().replace(/^- /, '');
        return `<li style="margin:0 0 6px 0;padding:0;font-size:13px;color:#4B5563;line-height:1.55;">${escHtml(text)}</li>`;
      }).join('');
      bodyHtml = `<ul style="margin:0;padding:0 0 0 18px;list-style:disc;">${items}</ul>`;
    } else {
      bodyHtml = lines.map(l =>
        `<p style="margin:0 0 8px 0;font-size:13px;color:#4B5563;line-height:1.55;">${escHtml(l.trim())}</p>`
      ).join('');
    }

    return `<div style="font-family:'Inter',system-ui,sans-serif;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:6px;padding:20px;width:100%;max-width:100%;">
  <div style="border-left:3px solid ${themeHex};padding-left:12px;margin-bottom:14px;">
    <h5 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:${themeHex};line-height:1.3;letter-spacing:-0.01em;">${escHtml(headline)}</h5>
  </div>
  <div style="padding-left:0;">${bodyHtml}</div>
</div>`;
  }

  // ─── Show delivery section ─────────────────────────────────
  function showDelivery() {
    deliveryPanel.hidden = false;
    pushStatus.hidden = true;
  }

  // ─── Copy full HTML pack ───────────────────────────────────
  copyHtmlBtn.addEventListener('click', () => {
    if (!generatedWidgets) return;
    const fullHtml = WIDGET_DEFS.map(d => buildWidgetHtml(generatedWidgets[d.key], currentTheme)).join('\n\n');
    copyToClipboard(fullHtml, copyHtmlBtn, 'Copy HTML (Full Pack)', 'Copied ✓');
  });

  // ─── Push as Pack ─────────────────────────────────────────
  pushPackBtn.addEventListener('click', async () => {
    if (!ensureCreds()) return;
    const fullHtml = WIDGET_DEFS.map(d => buildWidgetHtml(generatedWidgets[d.key], currentTheme)).join('\n\n');
    const title = `{{company.name}} — ${currentVertical} — Full Pack`;
    await pushWidgets([{ type: 'html', content: fullHtml, title }], title);
  });

  // ─── Push Individual Widgets ───────────────────────────────
  pushIndividualBtn.addEventListener('click', async () => {
    if (!ensureCreds()) return;
    const widgets = WIDGET_DEFS.map(d => ({
      type: 'html',
      content: buildWidgetHtml(generatedWidgets[d.key], currentTheme),
      title: `{{company.name}} — ${currentVertical} — ${d.name}`
    }));
    await pushWidgets(widgets, `{{company.name}} — ${currentVertical}`);
  });

  async function pushWidgets(widgets, prefix) {
    const apiKey = localStorage.getItem('sb_api_key');
    const tenantUrl = localStorage.getItem('sb_tenant_url');

    showPushStatus('Pushing to Salesbuildr…', '');

    try {
      const res = await fetch('/api/push-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets, prefix, apiKey, tenantUrl })
      });
      const data = await res.json();

      if (data.ok || (data.successCount && data.successCount > 0)) {
        showPushStatus(`✓ ${widgets.length > 1 ? widgets.length + ' widgets' : '1 widget'} pushed to Salesbuildr.`, 'ok');
      } else {
        showPushStatus('Push failed: ' + (data.error || 'Unknown error'), 'err');
      }
    } catch (err) {
      console.error(err);
      showPushStatus('Push failed. Check the console.', 'err');
    }
  }

  function showPushStatus(msg, type) {
    pushStatus.textContent = msg;
    pushStatus.className = 'push-status' + (type ? ' ' + type : '');
    pushStatus.hidden = false;
  }

  // ─── Credentials ──────────────────────────────────────────
  function ensureCreds() {
    const key = localStorage.getItem('sb_api_key');
    const url = localStorage.getItem('sb_tenant_url');
    if (!key || !url) {
      credsForm.hidden = false;
      sbApiKeyInput.focus();
      return false;
    }
    credsForm.hidden = true;
    return true;
  }

  saveCredsBtn.addEventListener('click', () => {
    const key = sbApiKeyInput.value.trim();
    const url = sbTenantUrlInput.value.trim();
    if (!key || !url) {
      alert('Please enter both API key and tenant URL.');
      return;
    }
    localStorage.setItem('sb_api_key', key);
    localStorage.setItem('sb_tenant_url', url);
    credsForm.hidden = true;
    // Pre-populate from storage next time
    sbApiKeyInput.value = '';
    sbTenantUrlInput.value = '';
    // Retry the push that triggered the form
    if (document.activeElement && document.activeElement.id === 'saveCredsBtn') {
      pushPackBtn.click();
    }
  });

  // Pre-populate credentials inputs from storage
  const storedKey = localStorage.getItem('sb_api_key');
  const storedUrl = localStorage.getItem('sb_tenant_url');
  if (storedKey) sbApiKeyInput.value = storedKey;
  if (storedUrl) sbTenantUrlInput.value = storedUrl;

  // ─── Loading helpers ───────────────────────────────────────
  function showLoading(msg) {
    loadingMsg.textContent = msg || 'Generating your industry pack…';
    loadingOverlay.hidden = false;
  }

  function hideLoading() {
    loadingOverlay.hidden = true;
  }

  // ─── Clipboard helper ─────────────────────────────────────
  function copyToClipboard(text, btn, defaultLabel, doneLabel) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = doneLabel;
      setTimeout(() => { btn.textContent = defaultLabel || orig; }, 2000);
    }).catch(err => {
      console.error('Clipboard error', err);
    });
  }

  // ─── Escape helpers ───────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

})();
