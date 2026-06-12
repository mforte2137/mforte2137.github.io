/* ==========================================================================
   doc-to-widget.js

   Flow:
     1. .docx  →  mammoth  →  raw HTML
     2. Raw HTML is split into logical sections. Headings are detected from
        real heading tags (h1–h4) AND from fully-bold short paragraphs,
        because most MSP docs (including the sample) use bold paragraphs as
        headings, not Word heading styles.
     3. Sections are rendered into #widgetRoot with INLINE styles only —
        the preview IS the export. TinyMCE keeps inline styles; it strips
        <style> blocks and classes.
     4. The user edits in place. AI polish replaces section bodies via
        /api/improve-section, with per-section revert.
     5. Export = clone preview, strip editor attributes, serialize.
   ========================================================================== */

/* ---------- DOM references ---------- */

const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const browseBtn     = document.getElementById('browseBtn');
const fileMeta      = document.getElementById('fileMeta');
const fileNameEl    = document.getElementById('fileName');
const fileSections  = document.getElementById('fileSections');

const modeBlock     = document.getElementById('modeBlock');
const modeVerbatim  = document.getElementById('modeVerbatim');
const modeAI        = document.getElementById('modeAI');
const improveBtn    = document.getElementById('improveBtn');
const sectionList   = document.getElementById('sectionList');

const themeBlock    = document.getElementById('themeBlock');
const themeSwatches = document.getElementById('themeSwatches');
const customHex     = document.getElementById('customHex');
const customHexApply = document.getElementById('customHexApply');

const exportBlock   = document.getElementById('exportBlock');
const widgetNameEl  = document.getElementById('widgetName');
const copyBtn       = document.getElementById('copyBtn');

const sbTenantUrlEl = document.getElementById('sbTenantUrl');
const sbApiKeyEl    = document.getElementById('sbApiKey');
const sbRemember    = document.getElementById('sbRemember');
const sbPushBtn     = document.getElementById('sbPushBtn');
const sbStatus      = document.getElementById('sbStatus');

const previewHeader = document.getElementById('previewHeader');
const previewEmpty  = document.getElementById('previewEmpty');
const previewPage   = document.getElementById('previewPage');
const widgetRoot    = document.getElementById('widgetRoot');
const statusBar     = document.getElementById('statusBar');

/* ---------- Constants ---------- */

const LS_API_KEY    = 'sb_api_key';
const LS_TENANT_URL = 'sb_tenant_url';

const THEMES = [
  { name: 'Blue',     hex: '#1F4E8C' },
  { name: 'Navy',     hex: '#16324F' },
  { name: 'Slate',    hex: '#475569' },
  { name: 'Graphite', hex: '#2B2B2B' },
  { name: 'Forest',   hex: '#1E6B4F' },
  { name: 'Teal',     hex: '#0F6B6E' },
  { name: 'Burgundy', hex: '#7A1F2B' },
  { name: 'Copper',   hex: '#9A5B2D' }
];

/* Paragraphs whose entire text is bold and shorter than this are treated
   as headings. */
const HEADING_MAX_CHARS = 90;

/* ---------- State ---------- */

let currentTheme = THEMES[0].hex;
let sections = [];          // [{ id, title, originalBodyHtml, status }]
let docTitle = '';

/* ==========================================================================
   Colour helpers
   ========================================================================== */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

/* Mix a colour with white. amount 0 = colour, 1 = white. */
function tint(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function isValidHex(value) {
  return /^#?[0-9a-fA-F]{6}$/.test(value.trim());
}

function normaliseHex(value) {
  const v = value.trim();
  return v.startsWith('#') ? v : '#' + v;
}

/* ==========================================================================
   Document parsing
   ========================================================================== */

function getPlainText(el) {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

/* A paragraph is "fully bold" when every text character sits inside a
   <strong> or <b>. Mammoth outputs bold-paragraph headings this way. */
function isFullyBold(p) {
  const total = getPlainText(p);
  if (!total) return false;
  let boldText = '';
  p.querySelectorAll('strong, b').forEach((s) => { boldText += s.textContent; });
  boldText = boldText.replace(/\s+/g, ' ').trim();
  return boldText.length >= total.length;
}

function isHeadingLike(el) {
  if (/^H[1-4]$/.test(el.tagName)) return true;
  if (el.tagName !== 'P') return false;
  const text = getPlainText(el);
  if (!text || text.length > HEADING_MAX_CHARS) return false;
  return isFullyBold(el);
}

/* Bold labels ending in ":" (e.g. SITUATION:) are sub-headings inside a
   section, not new sections. */
function isSubLabel(el) {
  return isHeadingLike(el) && /:$/.test(getPlainText(el));
}

/* Word docs often put a bold label and its content in ONE paragraph,
   separated by <br/>:  <p><strong>SITUATION:</strong><br/>text…</p>
   Explode those into a sub-heading + a normal paragraph so the label can
   be styled and the section split stays correct. */
function explodeParagraph(p, doc) {
  if (p.tagName !== 'P' || !p.querySelector('br')) return [p];

  // Split child nodes into segments at <br> boundaries.
  const segments = [[]];
  Array.from(p.childNodes).forEach((node) => {
    if (node.nodeName === 'BR') segments.push([]);
    else segments[segments.length - 1].push(node);
  });
  if (segments.length < 2) return [p];

  // Is the first segment a short, fully-bold label ending in ":" ?
  const probe = doc.createElement('p');
  segments[0].forEach((n) => probe.appendChild(n.cloneNode(true)));
  const labelText = getPlainText(probe);
  const isLabel =
    labelText &&
    labelText.length <= HEADING_MAX_CHARS &&
    /:$/.test(labelText) &&
    isFullyBold(probe);

  if (!isLabel) return [p];

  const h = doc.createElement('h3');
  h.textContent = labelText;

  const rest = doc.createElement('p');
  segments.slice(1).forEach((seg, i) => {
    if (i > 0) rest.appendChild(doc.createElement('br'));
    seg.forEach((n) => rest.appendChild(n.cloneNode(true)));
  });

  return getPlainText(rest) ? [h, rest] : [h];
}

/* Split mammoth's flat HTML into { docTitle, sections[] }. */
function parseDocument(rawHtml) {
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const nodes = Array.from(doc.body.children).flatMap((n) => explodeParagraph(n, doc));

  let title = '';
  const parsed = [];
  let current = null;
  let prevWasSubLabel = false;

  const openSection = (heading) => {
    current = { title: heading, bodyNodes: [] };
    parsed.push(current);
  };

  nodes.forEach((node, i) => {
    const text = getPlainText(node);
    if (!text && !node.querySelector('img, table')) return; // skip empty paragraphs

    // First heading-like node becomes the document title.
    if (!title && i < 3 && isHeadingLike(node) && !isSubLabel(node) && !prevWasSubLabel) {
      title = text;
      return;
    }

    // A bold line directly after a label like "Service Name:" is that
    // label's VALUE, not a new section heading.
    if (isHeadingLike(node) && !isSubLabel(node) && !prevWasSubLabel) {
      openSection(text);
      prevWasSubLabel = false;
      return;
    }

    if (!current) openSection(''); // untitled intro section

    if (isSubLabel(node)) {
      const h = doc.createElement('h3');
      h.textContent = text;
      current.bodyNodes.push(h);
      prevWasSubLabel = true;
    } else {
      current.bodyNodes.push(node.cloneNode(true));
      prevWasSubLabel = false;
    }
  });

  const sectionData = parsed
    .map((s, idx) => {
      const wrap = doc.createElement('div');
      s.bodyNodes.forEach((n) => wrap.appendChild(n));
      return {
        id: 'sec-' + idx,
        title: s.title,
        originalBodyHtml: wrap.innerHTML,
        status: 'verbatim' // verbatim | working | rewritten | error
      };
    })
    .filter((s) => s.title || s.originalBodyHtml.trim());

  return { title, sections: sectionData };
}

/* ==========================================================================
   Widget rendering (inline styles only — the preview is the export)
   ========================================================================== */

function styleBodyContent(container, theme) {
  const subtle = tint(theme, 0.92);

  container.querySelectorAll('p').forEach((p) => {
    p.style.cssText = 'margin:0 0 12px; padding:0;';

    // Fully italic paragraphs become callouts.
    const text = getPlainText(p);
    let emText = '';
    p.querySelectorAll('em, i').forEach((e) => { emText += e.textContent; });
    if (text && emText.replace(/\s+/g, ' ').trim().length >= text.length) {
      p.style.cssText =
        `margin:0 0 16px; padding:14px 18px; background:${subtle};` +
        `border-left:3px solid ${theme}; font-style:italic;`;
    }
  });

  container.querySelectorAll('h3').forEach((h) => {
    h.style.cssText =
      'margin:20px 0 6px; font-size:15px; font-weight:700;' +
      'letter-spacing:0.02em; color:#1a1a1a;';
  });

  container.querySelectorAll('ul, ol').forEach((list) => {
    list.style.cssText = 'margin:0 0 16px; padding:0 0 0 22px;';
  });

  container.querySelectorAll('li').forEach((li) => {
    li.style.cssText = 'margin:0 0 7px; padding:0;';
  });

  container.querySelectorAll('table').forEach((t) => {
    t.style.cssText = 'border-collapse:collapse; width:100%; margin:0 0 16px;';
    t.querySelectorAll('td, th').forEach((cell) => {
      cell.style.cssText = 'border:1px solid #d9d9d9; padding:8px 12px; text-align:left;';
    });
    t.querySelectorAll('th').forEach((th) => {
      th.style.background = subtle;
    });
  });
}

function buildPreview() {
  widgetRoot.innerHTML = '';
  widgetRoot.style.cssText =
    'font-family:Arial, Helvetica, sans-serif; font-size:15px;' +
    'line-height:1.65; color:#1a1a1a;';

  if (docTitle) {
    const t = document.createElement('h1');
    t.setAttribute('data-role', 'doc-title');
    t.textContent = docTitle;
    widgetRoot.appendChild(t);
  }

  sections.forEach((sec) => {
    const wrap = document.createElement('div');
    wrap.setAttribute('data-role', 'section');
    wrap.setAttribute('data-sec-id', sec.id);

    if (sec.title) {
      const h = document.createElement('h2');
      h.setAttribute('data-role', 'heading');
      h.textContent = sec.title;
      wrap.appendChild(h);
    }

    const body = document.createElement('div');
    body.setAttribute('data-role', 'body');
    body.innerHTML = sec.originalBodyHtml;
    wrap.appendChild(body);

    widgetRoot.appendChild(wrap);
  });

  applyTheme(currentTheme);
}

/* Re-apply all inline styles. Safe to call after edits, AI rewrites or
   theme changes — it walks the live DOM rather than rebuilding it. */
function applyTheme(theme) {
  currentTheme = theme;

  const titleEl = widgetRoot.querySelector('[data-role="doc-title"]');
  if (titleEl) {
    titleEl.style.cssText =
      'margin:0 0 32px; padding:0 0 14px; font-size:26px; font-weight:700;' +
      `line-height:1.3; color:#1a1a1a; border-bottom:3px solid ${theme};`;
  }

  widgetRoot.querySelectorAll('[data-role="section"]').forEach((wrap, i) => {
    wrap.style.cssText = i === 0
      ? 'margin:0 0 8px; padding:0;'
      : 'margin:0 0 8px; padding:28px 0 0; border-top:1px solid #e4e4e4;';

    const h = wrap.querySelector('[data-role="heading"]');
    if (h) {
      h.style.cssText =
        `margin:0 0 14px; font-size:19px; font-weight:700; color:${theme};`;
    }

    const body = wrap.querySelector('[data-role="body"]');
    if (body) styleBodyContent(body, theme);
  });

  // swatch highlight
  themeSwatches.querySelectorAll('.swatch').forEach((s) => {
    s.classList.toggle('is-active', s.dataset.hex.toLowerCase() === theme.toLowerCase());
  });
}

/* ==========================================================================
   Export
   ========================================================================== */

function buildExportHtml() {
  const clone = widgetRoot.cloneNode(true);
  clone.removeAttribute('contenteditable');
  clone.removeAttribute('spellcheck');
  clone.removeAttribute('id');
  clone.querySelectorAll('[data-role]').forEach((el) => {
    el.removeAttribute('data-role');
    el.removeAttribute('data-sec-id');
  });
  return clone.outerHTML;
}

async function copyWidgetHtml() {
  const html = buildExportHtml();
  try {
    await navigator.clipboard.writeText(html);
    setStatus(statusBar, 'Widget HTML copied.', 'ok');
  } catch {
    // Fallback for older browsers / non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = html;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    setStatus(statusBar, 'Widget HTML copied.', 'ok');
  }
}

/* ==========================================================================
   AI polish
   ========================================================================== */

async function improveSection(sec) {
  const bodyEl = widgetRoot.querySelector(
    `[data-sec-id="${sec.id}"] [data-role="body"]`
  );
  if (!bodyEl) return;

  sec.status = 'working';
  renderSectionList();

  const res = await fetch('/api/improve-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: sec.title, html: bodyEl.innerHTML })
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Rewrite failed.');

  bodyEl.innerHTML = data.html;
  styleBodyContent(bodyEl, currentTheme);
  sec.status = 'rewritten';
}

async function improveAllSections() {
  improveBtn.disabled = true;
  setStatus(statusBar, 'Polishing writing\u2026', '');

  const results = await Promise.allSettled(
    sections.map((sec) =>
      improveSection(sec).catch((err) => {
        sec.status = 'error';
        throw err;
      })
    )
  );

  renderSectionList();
  improveBtn.disabled = false;

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed === 0) {
    setStatus(statusBar, 'Writing polished. Review and edit anything below.', 'ok');
  } else {
    setStatus(statusBar, `${failed} section(s) could not be polished \u2014 left verbatim.`, 'err');
  }
}

function revertSection(sec) {
  const bodyEl = widgetRoot.querySelector(
    `[data-sec-id="${sec.id}"] [data-role="body"]`
  );
  if (!bodyEl) return;
  bodyEl.innerHTML = sec.originalBodyHtml;
  styleBodyContent(bodyEl, currentTheme);
  sec.status = 'verbatim';
  renderSectionList();
}

function revertAllSections() {
  sections.forEach((sec) => {
    if (sec.status === 'rewritten' || sec.status === 'error') revertSection(sec);
  });
}

/* ==========================================================================
   Section list (left panel)
   ========================================================================== */

const STATUS_LABEL = {
  verbatim: 'verbatim',
  working: 'polishing\u2026',
  rewritten: 'polished \u2713',
  error: 'failed'
};

function renderSectionList() {
  sectionList.innerHTML = '';
  if (!sections.length) return;

  sections.forEach((sec) => {
    const li = document.createElement('li');

    const name = document.createElement('span');
    name.className = 'sec-name';
    name.textContent = sec.title || '(untitled section)';
    name.addEventListener('click', () => {
      const el = widgetRoot.querySelector(`[data-sec-id="${sec.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const status = document.createElement('span');
    status.className = 'sec-status';
    if (sec.status === 'rewritten') status.classList.add('is-done');
    if (sec.status === 'error') status.classList.add('is-err');
    status.textContent = STATUS_LABEL[sec.status];

    li.appendChild(name);
    li.appendChild(status);

    if (sec.status === 'rewritten') {
      const revert = document.createElement('button');
      revert.type = 'button';
      revert.className = 'sec-revert';
      revert.textContent = 'Revert';
      revert.addEventListener('click', () => revertSection(sec));
      li.appendChild(revert);
    }

    sectionList.appendChild(li);
  });
}

/* ==========================================================================
   File handling
   ========================================================================== */

async function handleFile(file) {
  if (!file || !file.name.toLowerCase().endsWith('.docx')) {
    setStatus(statusBar, 'Please upload a .docx file.', 'err');
    return;
  }

  setStatus(statusBar, 'Reading document\u2026', '');

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer });
    const parsed = parseDocument(result.value);

    docTitle = parsed.title;
    sections = parsed.sections;

    if (!sections.length) {
      setStatus(statusBar, 'No readable content found in that document.', 'err');
      return;
    }

    buildPreview();
    renderSectionList();

    fileNameEl.textContent = file.name;
    fileSections.textContent = sections.length + ' section' + (sections.length === 1 ? '' : 's');
    fileMeta.hidden = false;

    modeBlock.hidden = false;
    themeBlock.hidden = false;
    exportBlock.hidden = false;
    previewHeader.hidden = false;
    previewEmpty.hidden = true;
    previewPage.hidden = false;

    if (!widgetNameEl.value) {
      widgetNameEl.value = (docTitle || file.name.replace(/\.docx$/i, '')).slice(0, 80);
    }

    // Reset content mode on each new file.
    modeVerbatim.checked = true;
    improveBtn.hidden = true;

    setStatus(statusBar, 'Document loaded. Pick a theme, edit anything inline.', 'ok');
  } catch (err) {
    console.error(err);
    setStatus(statusBar, 'Could not read that document.', 'err');
  }
}

/* ==========================================================================
   Salesbuildr push
   ========================================================================== */

function initSbCredentials() {
  const savedApi    = localStorage.getItem(LS_API_KEY);
  const savedTenant = localStorage.getItem(LS_TENANT_URL);
  if (savedApi)    document.getElementById('sbApiKey').value    = savedApi;
  if (savedTenant) document.getElementById('sbTenantUrl').value = savedTenant;
  if (savedApi && savedTenant) document.getElementById('sbRemember').checked = true;
  updateSbBtn();
}

function updateSbBtn() {
  document.getElementById('sbPushBtn').disabled = !(
    document.getElementById('sbApiKey').value.trim() &&
    document.getElementById('sbTenantUrl').value.trim()
  );
}

async function pushToSalesbuildr() {
  const apiKey    = document.getElementById('sbApiKey').value.trim();
  const tenantUrl = document.getElementById('sbTenantUrl').value.trim();
  if (!apiKey || !tenantUrl) return;

  if (document.getElementById('sbRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  } else {
    localStorage.removeItem(LS_API_KEY);
    localStorage.removeItem(LS_TENANT_URL);
  }

  const title = widgetNameEl.value.trim() || docTitle || 'Imported widget';
  const widgets = [{ id: 'doc-' + Date.now(), title, html: buildExportHtml() }];

  sbPushBtn.disabled = true;
  setStatus(sbStatus, 'Pushing to Salesbuildr\u2026', '');

  try {
    const res = await fetch('/api/push-widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets, prefix: '', apiKey, tenantUrl })
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Server error \u2014 make sure the Netlify function is deployed.');
    }
    const data = await res.json();
    if (data.successCount > 0) {
      setStatus(sbStatus, '\u2713 Widget saved to your Salesbuildr widget library.', 'ok');
    } else {
      throw new Error(data.results?.[0]?.error || data.error || 'Unknown error');
    }
  } catch (err) {
    setStatus(sbStatus, '\u2715 ' + err.message, 'err');
  }

  sbPushBtn.disabled = false;
  updateSbBtn();
}

/* ==========================================================================
   Small utilities
   ========================================================================== */

function setStatus(el, message, kind) {
  el.textContent = message;
  el.classList.remove('is-ok', 'is-err');
  if (kind === 'ok') el.classList.add('is-ok');
  if (kind === 'err') el.classList.add('is-err');
}

function renderThemeSwatches() {
  THEMES.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.dataset.hex = t.hex;
    btn.innerHTML =
      `<span class="swatch-chip" style="background:${t.hex}"></span>` +
      `<span class="swatch-name">${t.name}</span>`;
    btn.addEventListener('click', () => applyTheme(t.hex));
    themeSwatches.appendChild(btn);
  });
}

function applyCustomHex() {
  if (!isValidHex(customHex.value)) {
    setStatus(statusBar, 'Enter a 6-digit hex colour, e.g. #1F4E8C.', 'err');
    return;
  }
  applyTheme(normaliseHex(customHex.value));
  setStatus(statusBar, 'Custom colour applied.', 'ok');
}

/* ==========================================================================
   Init
   ========================================================================== */

function initDropzone() {
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

  ['dragenter', 'dragover'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    })
  );
  dropZone.addEventListener('drop', (e) => {
    handleFile(e.dataTransfer.files[0]);
  });
}

function initContentMode() {
  modeVerbatim.addEventListener('change', () => {
    improveBtn.hidden = true;
    revertAllSections();
    setStatus(statusBar, 'Reverted to the original wording.', 'ok');
  });
  modeAI.addEventListener('change', () => {
    improveBtn.hidden = false;
  });
  improveBtn.addEventListener('click', improveAllSections);
}

function initTheme() {
  renderThemeSwatches();
  customHexApply.addEventListener('click', applyCustomHex);
  customHex.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyCustomHex();
  });
}

function initExport() {
  copyBtn.addEventListener('click', copyWidgetHtml);
}

function initSalesbuildr() {
  initSbCredentials();
  document.getElementById('sbApiKey').addEventListener('input', updateSbBtn);
  document.getElementById('sbTenantUrl').addEventListener('input', updateSbBtn);
  sbPushBtn.addEventListener('click', pushToSalesbuildr);
}

initDropzone();
initContentMode();
initTheme();
initExport();
initSalesbuildr();
