/* ============================================================
   SALESBUILDR — Complementary Services Widget Builder
   complementary-services.js  v2
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────────
const state = {
  services: [],
  theme: 'blue',
  themeColor: '#2E74DC',
  widgetTitle: "Here's what we recommend next",
  widgetSubtitle: "Services that pair well with this project — let's talk about what makes sense for you.",
  selectedProject: null,   // preset id or 'custom'
  dragSrcIndex: null,
  abortController: null,
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

// ── Common MSP project presets ─────────────────────────────────
const PROJECT_PRESETS = [
  {
    id: 'm365-migration',
    icon: '☁️',
    name: 'M365 Migration',
    prompt: 'Microsoft 365 Business Premium migration — moving email to Exchange Online, files to SharePoint, and collaboration to Teams',
  },
  {
    id: 'server-refresh',
    icon: '🖥️',
    name: 'Server Refresh',
    prompt: 'On-premise server hardware refresh — replacing ageing physical servers with new infrastructure, including data migration and reconfiguration',
  },
  {
    id: 'network-install',
    icon: '🌐',
    name: 'Network Install',
    prompt: 'New network installation — structured cabling, managed switches, firewall, wireless access points, and WAN connectivity',
  },
  {
    id: 'security-stack',
    icon: '🔒',
    name: 'Security Stack',
    prompt: 'Security stack deployment — rolling out endpoint protection, MFA, email filtering, and security awareness training across the business',
  },
  {
    id: 'voip-comms',
    icon: '📞',
    name: 'VoIP & Comms',
    prompt: 'VoIP and business communications upgrade — replacing the legacy phone system with a cloud-based platform including number porting and Teams voice integration',
  },
  {
    id: 'cloud-migration',
    icon: '⬆️',
    name: 'Cloud Migration',
    prompt: 'On-premise to cloud migration — moving servers, line-of-business applications and file storage to cloud-hosted infrastructure',
  },
  {
    id: 'azure-setup',
    icon: '🔷',
    name: 'Azure Setup',
    prompt: 'Azure environment build — setting up Azure tenant, virtual machines, networking, storage, and identity services (Entra ID)',
  },
  {
    id: 'backup-dr',
    icon: '💾',
    name: 'Backup & DR',
    prompt: 'Backup and disaster recovery implementation — deploying cloud backup for servers and endpoints, with tested recovery procedures',
  },
  {
    id: 'compliance',
    icon: '📋',
    name: 'Compliance Project',
    prompt: 'Compliance and governance project — helping the business meet a specific regulatory standard such as Cyber Essentials, ISO 27001, or GDPR requirements',
  },
  {
    id: 'new-office',
    icon: '🏢',
    name: 'Office IT Setup',
    prompt: 'New office IT setup — complete infrastructure for a new or relocated office including network, workstations, printers, and connectivity',
  },
  {
    id: 'sharepoint',
    icon: '📁',
    name: 'SharePoint / Intranet',
    prompt: 'SharePoint intranet and document management project — migrating file shares to SharePoint Online with folder structure, permissions, and user training',
  },
  {
    id: 'custom',
    icon: '✏️',
    name: 'Custom Project',
    prompt: '',
  },
];

// ── Baked-in service library ───────────────────────────────────
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

// ── DOM shorthand ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  renderProjectGrid();
  renderLibrary();
  bindEvents();
});

// ── Render project preset grid ─────────────────────────────────
function renderProjectGrid() {
  const grid = $('project-grid');
  grid.innerHTML = '';
  PROJECT_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'project-chip';
    btn.dataset.id = preset.id;
    btn.innerHTML = `
      <span class="project-chip-icon" aria-hidden="true">${preset.icon}</span>
      <span class="project-chip-name">${preset.name}</span>
    `;
    btn.addEventListener('click', () => selectProject(preset.id));
    grid.appendChild(btn);
  });
}

function selectProject(id) {
  state.selectedProject = id;
  const preset = PROJECT_PRESETS.find(p => p.id === id);

  // Update chip visual
  document.querySelectorAll('.project-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  // Enable suggest button
  $('btn-suggest').disabled = false;
  $('input-hint').textContent = id === 'custom'
    ? 'Describe your project in the box below, then click Suggest Services'
    : 'Add optional details below, or click Suggest Services now';

  // For custom: clear and focus textarea; for presets: pre-fill placeholder hint
  const ta = $('input-project');
  if (id === 'custom') {
    ta.placeholder = 'Describe the project you are proposing…';
    ta.value = '';
    ta.focus();
  } else {
    ta.placeholder = preset ? `e.g. ${preset.prompt.slice(0, 80)}…` : '';
    // Don't overwrite if the rep has typed something
    if (!ta.value.trim()) ta.value = '';
  }
}

// ── Events ─────────────────────────────────────────────────────
function bindEvents() {
  $('btn-settings').addEventListener('click', toggleSettings);
  $('btn-close-settings').addEventListener('click', toggleSettings);
  $('btn-save-settings').addEventListener('click', saveSettings);

  $('btn-suggest').addEventListener('click', handleSuggest);

  $('btn-cancel-loading').addEventListener('click', () => {
    if (state.abortController) state.abortController.abort();
    hideLoading();
    showToast('Cancelled.');
  });

  $('widget-title').addEventListener('input', () => {
    state.widgetTitle = $('widget-title').value;
    renderPreview();
  });
  $('widget-subtitle').addEventListener('input', () => {
    state.widgetSubtitle = $('widget-subtitle').value;
    renderPreview();
  });

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

  $('btn-copy').addEventListener('click', handleCopy);
  $('btn-push').addEventListener('click', handlePush);

  $('library-search').addEventListener('input', () => {
    const q = $('library-search').value.toLowerCase();
    document.querySelectorAll('.lib-item').forEach(el => {
      el.hidden = !el.dataset.name.toLowerCase().includes(q);
    });
  });

  $('btn-ai-custom').addEventListener('click', handleAiCustom);
}

// ── Settings ───────────────────────────────────────────────────
function loadSettings() {
  $('input-tenant-url').value = localStorage.getItem('sb_tenant_url') || '';
  $('input-api-key').value    = localStorage.getItem('sb_api_key') || '';
}
function saveSettings() {
  localStorage.setItem('sb_tenant_url', $('input-tenant-url').value.trim());
  localStorage.setItem('sb_api_key',    $('input-api-key').value.trim());
  $('settings-status').textContent = 'Saved ✓';
  setTimeout(() => { $('settings-status').textContent = ''; }, 2000);
}
function toggleSettings() {
  $('settings-drawer').hidden = !$('settings-drawer').hidden;
}

// ── Build the project string sent to AI ───────────────────────
function buildProjectString() {
  const preset = PROJECT_PRESETS.find(p => p.id === state.selectedProject);
  const customText = $('input-project').value.trim();

  if (!preset || state.selectedProject === 'custom') {
    return customText || 'Custom IT project';
  }
  // Combine preset prompt with any extra detail the rep typed
  return customText ? `${preset.prompt}. Additional context: ${customText}` : preset.prompt;
}

// ── Step 1: AI Suggest ─────────────────────────────────────────
async function handleSuggest() {
  if (!state.selectedProject) {
    showToast('Select a project type first.');
    return;
  }
  if (state.selectedProject === 'custom' && !$('input-project').value.trim()) {
    showToast('Describe the custom project first.');
    $('input-project').focus();
    return;
  }

  const project = buildProjectString();
  showLoading('Analysing your project…');

  state.abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    if (state.abortController) state.abortController.abort();
  }, 25000);

  try {
    const res = await fetch('/api/complementary-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
      signal: state.abortController.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    hideLoading();

    if (!data.ok) throw new Error(data.error || 'The AI service returned an error.');

    const incoming = Array.isArray(data.result) ? data.result : [data.result];
    state.services = incoming.slice(0, 4).map((s, i) => ({
      id: `svc-${Date.now()}-${i}`,
      name: s.name || 'Unnamed Service',
      description: s.description || s.reason || '',
      priority: s.priority === 'optional' ? 'optional' : 'recommended',
    }));

    openBuilder();

  } catch (err) {
    clearTimeout(timeoutId);
    hideLoading();
    if (err.name === 'AbortError') {
      showToast('Request timed out — check the server is running and try again.');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      showToast('Cannot reach the API — is the Netlify dev server running? (netlify dev)');
    } else {
      showToast('Error: ' + err.message);
    }
  }
}

function openBuilder() {
  $('panel-builder').hidden = false;
  $('panel-preview').hidden = false;
  $('widget-title').value = state.widgetTitle;
  $('widget-subtitle').value = state.widgetSubtitle;
  renderStack();
  renderLibrary();
  renderPreview();
  $('panel-builder').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── AI Custom Service ──────────────────────────────────────────
async function handleAiCustom() {
  const desc = $('custom-desc').value.trim();
  if (!desc) { showToast('Describe the service first.'); return; }
  if (state.services.length >= 4) { showToast('Stack is full — remove a service first.'); return; }

  showLoading('Building custom service…');
  state.abortController = new AbortController();
  const timeoutId = setTimeout(() => state.abortController.abort(), 25000);

  try {
    const res = await fetch('/api/complementary-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: desc, mode: 'custom', customDescription: desc }),
      signal: state.abortController.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();
    hideLoading();

    if (!data.ok) throw new Error(data.error || 'AI service error');

    const s = Array.isArray(data.result) ? data.result[0] : data.result;
    addServiceToStack({
      id: `svc-custom-${Date.now()}`,
      name: s.name || 'Custom Service',
      description: s.description || s.reason || desc,
      priority: 'recommended',
    });
    $('custom-desc').value = '';

  } catch (err) {
    clearTimeout(timeoutId);
    hideLoading();
    if (err.name === 'AbortError') {
      showToast('Request timed out — check the server is running.');
    } else {
      showToast('Error: ' + err.message);
    }
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
  $('stack-count').textContent = `${state.services.length} / 4`;
  container.innerHTML = '';

  if (state.services.length === 0) {
    $('stack-empty').hidden = false;
    return;
  }
  $('stack-empty').hidden = true;

  state.services.forEach((svc, index) => {
    const isRec = svc.priority === 'recommended';
    const card = document.createElement('div');
    card.className = 'svc-card';
    card.dataset.id = svc.id;
    card.dataset.index = index;
    card.draggable = true;

    card.innerHTML = `
      <div class="card-accent-bar" style="background:${isRec ? state.themeColor : '#D1D5DB'}"></div>
      <div class="card-drag-handle" aria-label="Drag to reorder">
        <div class="drag-icon">
          <div class="drag-dot"></div>
          <div class="drag-dot"></div>
          <div class="drag-dot"></div>
        </div>
      </div>
      <div class="card-body">
        <div class="card-top">
          <input class="card-name-input" type="text" value="${escHtml(svc.name)}" aria-label="Service name" data-id="${svc.id}" />
          <button class="rec-toggle ${isRec ? 'is-recommended' : 'is-optional'}" data-id="${svc.id}" title="Click to toggle Recommended / Optional">
            ${isRec ? '★ Recommended' : '◎ Optional'}
          </button>
        </div>
        <textarea class="card-desc-input" aria-label="Service description" data-id="${svc.id}" rows="2">${escHtml(svc.description)}</textarea>
      </div>
      <div class="card-actions">
        <button class="card-remove-btn" data-id="${svc.id}" aria-label="Remove service" title="Remove">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;

    // Drag events (stack reorder)
    card.addEventListener('dragstart', e => {
      state.dragSrcIndex = index;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'stack');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.svc-card').forEach(c => c.classList.remove('drag-over'));
    });
    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (!e.dataTransfer.types.includes('text/plain')) return;
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
      const s = state.services.find(x => x.id === e.target.dataset.id);
      if (s) { s.name = e.target.value; renderPreview(); }
    });
    card.querySelector('.card-desc-input').addEventListener('input', e => {
      const s = state.services.find(x => x.id === e.target.dataset.id);
      if (s) { s.description = e.target.value; renderPreview(); }
    });

    card.querySelector('.rec-toggle').addEventListener('click', e => {
      togglePriority(e.currentTarget.dataset.id);
    });
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
      <button class="lib-add-btn" title="${inStack ? 'Already in stack' : 'Add to stack'}">${inStack ? '✓' : '+'}</button>
    `;

    if (!inStack) {
      item.querySelector('.lib-add-btn').addEventListener('click', () => {
        addServiceToStack({ id: `lib-${lib.id}-${Date.now()}`, name: lib.name, description: lib.description, priority: 'recommended' });
      });
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/x-lib-id', lib.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
    }
    list.appendChild(item);
  });

  // Stack drop zone for library items
  const stack = $('service-stack');
  // Remove old listeners by cloning, then re-attach
  const newStack = stack.cloneNode(true);
  stack.parentNode.replaceChild(newStack, stack);
  // Re-render into new node — but since renderStack already ran we just attach the dragover/drop
  $('service-stack').addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('application/x-lib-id')) e.preventDefault();
  });
  $('service-stack').addEventListener('drop', e => {
    const libId = e.dataTransfer.getData('application/x-lib-id');
    if (libId) {
      const lib = LIBRARY_SERVICES.find(l => l.id === libId);
      if (lib) addServiceToStack({ id: `lib-${lib.id}-${Date.now()}`, name: lib.name, description: lib.description, priority: 'recommended' });
    }
  });
}

// ── Live Preview ───────────────────────────────────────────────
function renderPreview() {
  $('preview-frame').innerHTML = generateWidgetHtml();
}

// ── Widget HTML Generator (TinyMCE-safe) ───────────────────────
function generateWidgetHtml() {
  const color = state.themeColor;
  const recBadgeBg  = hexToRgba(color, 0.10);

  const rows = state.services.map(svc => {
    const isRec = svc.priority === 'recommended';
    const accentColor = isRec ? color : '#D1D5DB';
    const badge = isRec
      ? `<span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:0.07em;text-transform:uppercase;padding:2px 9px;border-radius:20px;background:${recBadgeBg};color:${color};">&#9733; Recommended</span>`
      : `<span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:bold;letter-spacing:0.07em;text-transform:uppercase;padding:2px 9px;border-radius:20px;background:#F5F5F2;color:#9CA3AF;border:1px solid #E5E3DC;">Optional</span>`;

    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;border-collapse:collapse;"><tr><td width="4" style="background:${accentColor};padding:0;">&nbsp;</td><td width="8" style="padding:0;">&nbsp;</td><td style="padding:12px 14px;background:#FAFAF7;border:1px solid #E8E6DF;border-left:none;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-bottom:5px;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;color:#0B0E14;">${escHtml(svc.name)}</span>&nbsp;&nbsp;${badge}</td></tr><tr><td><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4B5563;line-height:1.55;">${escHtml(svc.description)}</p></td></tr></table></td></tr></table>`;
  }).join('\n');

  return `<div style="background:#FFFFFF;border:1px solid #E8E6DF;border-radius:6px;padding:22px 24px;font-family:Arial,Helvetica,sans-serif;max-width:100%;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border-collapse:collapse;"><tr><td width="4" style="background:${color};padding:0;">&nbsp;</td><td width="12" style="padding:0;">&nbsp;</td><td style="padding:4px 0;"><h5 style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:bold;color:#0B0E14;line-height:1.25;">${escHtml(state.widgetTitle)}</h5><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B7280;">${escHtml(state.widgetSubtitle)}</p></td></tr></table>\n${rows}\n</div>`;
}

// ── Export: Copy ───────────────────────────────────────────────
function handleCopy() {
  if (state.services.length === 0) { showToast('Add at least one service first.'); return; }
  navigator.clipboard.writeText(generateWidgetHtml()).then(() => {
    const btn = $('btn-copy');
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = 'Copy Widget HTML'; }, 2000);
  }).catch(() => showToast('Copy failed — please try again.'));
}

// ── Export: Push to Salesbuildr ────────────────────────────────
async function handlePush() {
  if (state.services.length === 0) { showToast('Add at least one service first.'); return; }
  const tenantUrl = localStorage.getItem('sb_tenant_url');
  const apiKey    = localStorage.getItem('sb_api_key');
  if (!tenantUrl || !apiKey) {
    $('settings-drawer').hidden = false;
    showToast('Enter your Salesbuildr connection details first.');
    return;
  }

  const preset = PROJECT_PRESETS.find(p => p.id === state.selectedProject);
  const widgetName = preset && preset.id !== 'custom'
    ? `Complementary Services — ${preset.name}`
    : `Complementary Services — ${($('input-project').value.trim() || 'Custom').slice(0, 60)}`;

  $('export-status').textContent = 'Pushing…';
  try {
    const res = await fetch(`${tenantUrl.replace(/\/$/, '')}/api/public/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ name: widgetName, content: generateWidgetHtml() }),
    });
    $('export-status').textContent = '';
    if (res.ok) {
      showToast('Widget pushed to Salesbuildr ✓');
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(`Push failed: ${err.message || res.status}`);
    }
  } catch {
    $('export-status').textContent = '';
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
  state.abortController = null;
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3800);
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
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
