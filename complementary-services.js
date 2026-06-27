/* ============================================================
   SALESBUILDR — Complementary Services Widget Builder
   complementary-services.js
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────────
const state = {
  services: [],          // { id, name, description, priority: 'recommended'|'optional' }
  theme: 'blue',
  themeColor: '#2E74DC',
  widgetTitle: 'Here\'s what we recommend next',
  widgetSubtitle: 'Services that pair well with this project — let\'s talk about what makes sense for you.',
  dragSrcIndex: null,
};

// ── Theme palette ──────────────────────────────────────────────
const THEMES = {
  blue:     '#2E74DC',
  slate:    '#334155',
  teal:     '#0F766E',
  violet:   '#6D28D9',
  orange:   '#C2410C',
  rose:     '#BE123C',
  green:    '#166534',
  charcoal: '#1C1C1E',
};

// ── Baked-in library of common MSP services ────────────────────
const LIBRARY_SERVICES = [
  { id: 'lib-mfa',        name: 'MFA & Conditional Access',      description: 'Prevents credential-based attacks by requiring a second factor for every login — one of the highest-impact security controls available.' },
  { id: 'lib-edr',        name: 'Endpoint Detection & Response',  description: 'Monitors every device for suspicious behaviour in real time, catching threats that traditional antivirus misses.' },
  { id: 'lib-backup',     name: 'Cloud Backup & Recovery',        description: 'Ensures your data can be recovered quickly after accidental deletion, ransomware, or a service outage — without manual intervention.' },
  { id: 'lib-patch',      name: 'Patch Management',               description: 'Keeps every server and workstation up to date automatically, closing the vulnerabilities attackers exploit most.' },
  { id: 'lib-sec-review', name: 'Security Posture Review',        description: 'A structured assessment of your current environment that identifies gaps, prioritises remediation, and gives you a clear action plan.' },
  { id: 'lib-awareness',  name: 'Security Awareness Training',    description: 'Turns your staff into a line of defence with ongoing phishing simulations and bite-sized training modules.' },
  { id: 'lib-email-arch', name: 'Email Archiving',                description: 'Maintains a tamper-proof, searchable record of all email — important for compliance, legal discovery, and audit trails.' },
  { id: 'lib-siem',       name: 'SIEM & Log Monitoring',          description: 'Correlates security events across your environment 24/7, alerting on anomalies before they become incidents.' },
  { id: 'lib-intune',     name: 'Endpoint Management (Intune)',   description: 'Gives you centralised control over every device — patching, compliance policies, app deployment, and remote wipe from one console.' },
  { id: 'lib-dns',        name: 'DNS Filtering',                  description: 'Blocks malicious websites, phishing domains, and unwanted content at the DNS layer before they can reach your users.' },
  { id: 'lib-drp',        name: 'Disaster Recovery Planning',     description: 'Documents and tests a repeatable process for restoring operations after a major incident — so recovery is measured in hours, not weeks.' },
  { id: 'lib-voip',       name: 'VoIP & Business Comms',          description: 'Moves your phone system to the cloud — cutting costs, enabling remote calling, and integrating with your collaboration tools.' },
  { id: 'lib-pw',         name: 'Password Manager Deployment',    description: 'Eliminates weak and reused passwords across the organisation with a managed, policy-enforced password vault.' },
  { id: 'lib-sd-wan',     name: 'SD-WAN & Network Optimisation',  description: 'Improves reliability and performance for cloud applications by intelligently routing traffic across your network connections.' },
  { id: 'lib-dark-web',   name: 'Dark Web Monitoring',            description: 'Alerts you the moment staff credentials appear in breach databases — before attackers can exploit them.' },
  { id: 'lib-vci',        name: 'Virtual CIO Advisory',           description: 'Provides strategic IT guidance aligned to your business goals — budgeting, roadmap planning, and vendor management.' },
];

// ── DOM refs ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  renderLibrary();
  bindEvents();
});

function bindEvents() {
  // Header settings
  $('btn-settings').addEventListener('click', toggleSettings);
  $('btn-close-settings').addEventListener('click', toggleSettings);
  $('btn-save-settings').addEventListener('click', saveSettings);

  // Step 1 — Suggest
  $('btn-suggest').addEventListener('click', handleSuggest);
  $('input-project').addEventListener('input', () => {
    const len = $('input-project').value.trim().length;
    $('char-hint').textContent = len ? `${len} chars` : '';
  });
  $('input-project').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSuggest();
  });

  // Title / subtitle live update
  $('widget-title').addEventListener('input', () => {
    state.widgetTitle = $('widget-title').value;
    renderPreview();
  });
  $('widget-subtitle').addEventListener('input', () => {
    state.widgetSubtitle = $('widget-subtitle').value;
    renderPreview();
  });

  // Theme swatches
  $('theme-swatches').addEventListener('click', e => {
    const swatch = e.target.closest('.swatch');
    if (!swatch) return;
    const theme = swatch.dataset.theme;
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    if (theme === 'custom') {
      $('custom-hex-wrap').hidden = false;
    } else {
      $('custom-hex-wrap').hidden = true;
      state.theme = theme;
      state.themeColor = THEMES[theme];
      renderPreview();
    }
  });

  $('btn-apply-hex').addEventListener('click', () => {
    const val = $('custom-hex').value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      state.theme = 'custom';
      state.themeColor = val;
      renderPreview();
    } else {
      showToast('Enter a valid hex colour e.g. #2E74DC');
    }
  });

  // Export
  $('btn-copy').addEventListener('click', handleCopy);
  $('btn-push').addEventListener('click', handlePush);

  // Library search
  $('library-search').addEventListener('input', () => {
    const q = $('library-search').value.toLowerCase();
    document.querySelectorAll('.lib-item').forEach(el => {
      el.hidden = !el.dataset.name.toLowerCase().includes(q);
    });
  });

  // AI custom service
  $('btn-ai-custom').addEventListener('click', handleAiCustom);
}

// ── Settings ───────────────────────────────────────────────────
function loadSettings() {
  const url = localStorage.getItem('sb_tenant_url') || '';
  const key = localStorage.getItem('sb_api_key') || '';
  $('input-tenant-url').value = url;
  $('input-api-key').value = key;
}

function saveSettings() {
  const url = $('input-tenant-url').value.trim();
  const key = $('input-api-key').value.trim();
  localStorage.setItem('sb_tenant_url', url);
  localStorage.setItem('sb_api_key', key);
  $('settings-status').textContent = 'Saved ✓';
  setTimeout(() => { $('settings-status').textContent = ''; }, 2000);
}

function toggleSettings() {
  const drawer = $('settings-drawer');
  drawer.hidden = !drawer.hidden;
}

// ── Step 1: AI Suggest ─────────────────────────────────────────
async function handleSuggest() {
  const project = $('input-project').value.trim();
  if (!project) { showToast('Please describe the project first.'); return; }

  showLoading('Analysing your project…');

  try {
    const res = await fetch('/api/complementary-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });
    const data = await res.json();
    hideLoading();

    if (!data.ok) throw new Error(data.error || 'Unknown error');

    const incoming = Array.isArray(data.result) ? data.result : [data.result];
    state.services = incoming.slice(0, 4).map((s, i) => ({
      id: `svc-${Date.now()}-${i}`,
      name: s.name || 'Unnamed Service',
      description: s.description || s.reason || '',
      priority: s.priority === 'optional' ? 'optional' : 'recommended',
    }));

    $('panel-builder').hidden = false;
    $('panel-preview').hidden = false;
    $('widget-title').value = state.widgetTitle;
    $('widget-subtitle').value = state.widgetSubtitle;

    renderStack();
    renderLibrary();
    renderPreview();
    $('panel-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message);
  }
}

// ── AI Custom Service ──────────────────────────────────────────
async function handleAiCustom() {
  const desc = $('custom-desc').value.trim();
  if (!desc) { showToast('Describe the service first.'); return; }
  if (state.services.length >= 4) { showToast('Stack is full — remove a service first.'); return; }

  showLoading('Building custom service…');

  try {
    const res = await fetch('/api/complementary-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: desc, mode: 'custom', customDescription: desc }),
    });
    const data = await res.json();
    hideLoading();

    if (!data.ok) throw new Error(data.error || 'Unknown error');

    const s = Array.isArray(data.result) ? data.result[0] : data.result;
    addServiceToStack({
      id: `svc-custom-${Date.now()}`,
      name: s.name || 'Custom Service',
      description: s.description || s.reason || desc,
      priority: 'recommended',
    });
    $('custom-desc').value = '';

  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message);
  }
}

// ── Stack Management ───────────────────────────────────────────
function addServiceToStack(svc) {
  if (state.services.length >= 4) {
    showToast('Stack is full (max 4). Remove a service first.');
    return;
  }
  state.services.push(svc);
  $('panel-builder').hidden = false;
  $('panel-preview').hidden = false;
  renderStack();
  renderLibrary();
  renderPreview();
}

function removeService(id) {
  state.services = state.services.filter(s => s.id !== id);
  renderStack();
  renderLibrary();
  renderPreview();
}

function togglePriority(id) {
  const svc = state.services.find(s => s.id === id);
  if (!svc) return;
  svc.priority = svc.priority === 'recommended' ? 'optional' : 'recommended';
  renderStack();
  renderPreview();
}

// ── Render Stack ───────────────────────────────────────────────
function renderStack() {
  const container = $('service-stack');
  const empty = $('stack-empty');
  const count = $('stack-count');

  container.innerHTML = '';
  count.textContent = `${state.services.length} / 4`;

  if (state.services.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  state.services.forEach((svc, index) => {
    const card = document.createElement('div');
    card.className = 'svc-card';
    card.dataset.id = svc.id;
    card.dataset.index = index;
    card.draggable = true;

    const isRec = svc.priority === 'recommended';

    card.innerHTML = `
      <div class="card-accent-bar ${isRec ? '' : 'optional'}" style="background:${isRec ? state.themeColor : '#D1D5DB'}"></div>
      <div class="card-drag-handle" aria-label="Drag to reorder">
        <div class="drag-icon">
          <div class="drag-dot"></div>
          <div class="drag-dot"></div>
          <div class="drag-dot"></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-top">
          <input
            class="card-name-input"
            type="text"
            value="${escHtml(svc.name)}"
            aria-label="Service name"
            data-field="name"
            data-id="${svc.id}"
          />
          <button
            class="rec-toggle ${isRec ? 'is-recommended' : 'is-optional'}"
            data-id="${svc.id}"
            aria-label="Toggle recommended status"
            title="Click to toggle Recommended / Optional"
          >${isRec ? '★ Recommended' : '◎ Optional'}</button>
        </div>
        <textarea
          class="card-desc-input"
          aria-label="Service description"
          data-field="description"
          data-id="${svc.id}"
          rows="2"
        >${escHtml(svc.description)}</textarea>
      </div>
      <div class="card-actions">
        <button class="card-remove-btn" data-id="${svc.id}" aria-label="Remove service" title="Remove">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;

    // Drag events
    card.addEventListener('dragstart', e => {
      state.dragSrcIndex = index;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });
    card.addEventListener('drop', e => {
      e.preventDefault();
      const toIndex = parseInt(card.dataset.index);
      if (state.dragSrcIndex !== null && state.dragSrcIndex !== toIndex) {
        const moved = state.services.splice(state.dragSrcIndex, 1)[0];
        state.services.splice(toIndex, 0, moved);
        state.dragSrcIndex = null;
        renderStack();
        renderPreview();
      }
    });

    // Inline edit
    card.querySelector('.card-name-input').addEventListener('input', e => {
      const svc = state.services.find(s => s.id === e.target.dataset.id);
      if (svc) { svc.name = e.target.value; renderPreview(); }
    });
    card.querySelector('.card-desc-input').addEventListener('input', e => {
      const svc = state.services.find(s => s.id === e.target.dataset.id);
      if (svc) { svc.description = e.target.value; renderPreview(); }
    });

    // Priority toggle
    card.querySelector('.rec-toggle').addEventListener('click', e => {
      togglePriority(e.currentTarget.dataset.id);
    });

    // Remove
    card.querySelector('.card-remove-btn').addEventListener('click', e => {
      removeService(e.currentTarget.dataset.id);
    });

    container.appendChild(card);
  });
}

// ── Render Library ─────────────────────────────────────────────
function renderLibrary() {
  const list = $('library-list');
  const stackNames = state.services.map(s => s.name.toLowerCase());

  list.innerHTML = '';
  LIBRARY_SERVICES.forEach(lib => {
    const inStack = stackNames.includes(lib.name.toLowerCase());
    const item = document.createElement('div');
    item.className = `lib-item${inStack ? ' in-stack' : ''}`;
    item.dataset.name = lib.name;
    item.draggable = !inStack;
    item.innerHTML = `
      <span class="lib-item-name">${escHtml(lib.name)}</span>
      <button class="lib-add-btn" aria-label="Add ${escHtml(lib.name)}" title="${inStack ? 'Already in stack' : 'Add to stack'}">${inStack ? '✓' : '+'}</button>
    `;

    if (!inStack) {
      item.querySelector('.lib-add-btn').addEventListener('click', () => {
        addServiceToStack({
          id: `lib-${lib.id}-${Date.now()}`,
          name: lib.name,
          description: lib.description,
          priority: 'recommended',
        });
      });

      // Drag from library
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/x-lib-id', lib.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
    }

    list.appendChild(item);
  });

  // Allow stack to accept library drops
  $('service-stack').addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('application/x-lib-id')) e.preventDefault();
  });
  $('service-stack').addEventListener('drop', e => {
    const libId = e.dataTransfer.getData('application/x-lib-id');
    if (libId) {
      const lib = LIBRARY_SERVICES.find(l => l.id === libId);
      if (lib) addServiceToStack({
        id: `lib-${lib.id}-${Date.now()}`,
        name: lib.name,
        description: lib.description,
        priority: 'recommended',
      });
    }
  });
}

// ── Live Preview ───────────────────────────────────────────────
function renderPreview() {
  const frame = $('preview-frame');
  frame.innerHTML = generateWidgetHtml();
}

// ── Widget HTML Generator ──────────────────────────────────────
// Produces TinyMCE-safe, fully inline-styled HTML
function generateWidgetHtml() {
  const color = state.themeColor;
  const lightBg = hexToRgba(color, 0.06);
  const lightBorder = hexToRgba(color, 0.20);
  const recBadgeBg = hexToRgba(color, 0.10);

  const rows = state.services.map((svc, i) => {
    const isRec = svc.priority === 'recommended';
    const accentBarColor = isRec ? color : '#D1D5DB';
    const badge = isRec
      ? `<span style="display:inline-block;font-family:Georgia,serif;font-size:9px;font-weight:bold;letter-spacing:0.07em;text-transform:uppercase;padding:2px 9px;border-radius:20px;background:${recBadgeBg};color:${color};">★ Recommended</span>`
      : `<span style="display:inline-block;font-family:Georgia,serif;font-size:9px;font-weight:bold;letter-spacing:0.07em;text-transform:uppercase;padding:2px 9px;border-radius:20px;background:#F5F5F2;color:#9CA3AF;border:1px solid #E5E3DC;">Optional</span>`;

    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border-collapse:collapse;">
  <tr>
    <td width="4" style="background:${accentBarColor};border-radius:2px;padding:0;">&nbsp;</td>
    <td width="8" style="padding:0;">&nbsp;</td>
    <td style="padding:12px 14px;background:#FAFAF7;border:1px solid #E8E6DF;border-left:none;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom:5px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#0B0E14;">${escHtml(svc.name)}</span>
            &nbsp;&nbsp;${badge}
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4B5563;line-height:1.55;">${escHtml(svc.description)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
  }).join('\n');

  return `
<div style="background:#FFFFFF;border:1px solid #E8E6DF;border-radius:6px;padding:22px 24px;font-family:Arial,Helvetica,sans-serif;max-width:100%;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-collapse:collapse;">
    <tr>
      <td width="4" style="background:${color};border-radius:2px;">&nbsp;</td>
      <td width="12" style="padding:0;">&nbsp;</td>
      <td style="padding:4px 0;">
        <h5 style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:#0B0E14;line-height:1.25;">${escHtml(state.widgetTitle)}</h5>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;">${escHtml(state.widgetSubtitle)}</p>
      </td>
    </tr>
  </table>

  ${rows}

</div>`.trim();
}

// ── Export: Copy HTML ──────────────────────────────────────────
function handleCopy() {
  if (state.services.length === 0) { showToast('Add at least one service first.'); return; }
  const html = generateWidgetHtml();
  navigator.clipboard.writeText(html).then(() => {
    const btn = $('btn-copy');
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = 'Copy Widget HTML'; }, 2000);
  }).catch(() => {
    showToast('Copy failed — please try again.');
  });
}

// ── Export: Push to Salesbuildr ────────────────────────────────
async function handlePush() {
  if (state.services.length === 0) { showToast('Add at least one service first.'); return; }

  const tenantUrl = localStorage.getItem('sb_tenant_url');
  const apiKey = localStorage.getItem('sb_api_key');

  if (!tenantUrl || !apiKey) {
    $('settings-drawer').hidden = false;
    showToast('Enter your Salesbuildr connection details first.');
    return;
  }

  const projectDesc = $('input-project').value.trim();
  const widgetName = projectDesc
    ? `Complementary Services — ${projectDesc.slice(0, 60)}${projectDesc.length > 60 ? '…' : ''}`
    : 'Complementary Services Widget';

  const html = generateWidgetHtml();
  const status = $('export-status');
  status.textContent = 'Pushing…';

  try {
    const endpoint = `${tenantUrl.replace(/\/$/, '')}/api/public/widgets`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ name: widgetName, content: html }),
    });

    if (res.ok) {
      status.textContent = '';
      showToast('Widget pushed to Salesbuildr ✓');
    } else {
      const err = await res.json().catch(() => ({}));
      status.textContent = '';
      showToast(`Push failed: ${err.message || res.status}`);
    }
  } catch (err) {
    status.textContent = '';
    showToast('Push failed — check your connection settings.');
  }
}

// ── Loading ────────────────────────────────────────────────────
function showLoading(msg) {
  $('loading-msg').textContent = msg || 'Working…';
  $('loading-overlay').hidden = false;
}
function hideLoading() {
  $('loading-overlay').hidden = true;
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

// ── Helpers ────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
