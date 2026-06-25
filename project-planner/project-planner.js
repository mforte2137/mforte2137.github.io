/* =========================================================
   Project Planner — project-planner.js
   Adapted from project-scope.js (v2)
   All Phases: credentials, catalog, SKU dropdown, widget
   generation, widget push, quote creation, AI assistant
   ========================================================= */

// ── Constants ─────────────────────────────────────────────
const LS_KEY         = 'pp_project_planner_v1';
const LS_PROJECTS    = 'pp_projects_v1';
const LS_TEMPLATES   = 'pp_scope_templates_v1';
const LS_BRAND_COLOR = 'sb_brand_color_v1';  // shared across tools
const LS_API_KEY     = 'sb_api_key';          // shared across tools
const LS_TENANT_URL  = 'sb_tenant_url';       // shared across tools
const SS_CATALOG     = 'pp_catalog_cache';    // sessionStorage

const API_TEMPLATES   = '/api/scope-templates';
const API_AI          = '/api/planner-ai';
const API_CATALOG     = '/api/planner-catalog';
const API_COMPANIES   = '/api/planner-companies';
const API_OPPS        = '/api/planner-opportunities';
const API_QT          = '/api/planner-templates';
const API_QUOTE       = '/api/planner-quote';

const PROJ_COLORS = ['#3b82f6','#f97316','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#6366f1'];

let brandColor  = localStorage.getItem(LS_BRAND_COLOR) || '#2563eb';
let catalog     = [];     // [{ id, name, price, unit }]
let catalogLoaded = false;

// ── Presets (same tasks as Scope Builder, role left blank for SKU mapping) ──
const PRESETS = {
  copilot: {
    title: 'Microsoft Copilot Readiness & Deployment',
    overview: 'This project prepares your Microsoft 365 environment for Copilot, deploys it to a pilot group, and drives adoption across your team. Before Copilot can be activated safely, your tenant data needs to be governed correctly — we handle the sensitivity labelling, SharePoint structure review, and security posture checks that most deployments skip.',
    exclusions: 'Microsoft 365 Copilot licensing costs\nCustom Copilot Studio agent development (available as a separate engagement)\nThird-party AI tool integrations\nData migration or SharePoint redesign beyond the scope of Copilot readiness\nLegal or compliance review of AI acceptable-use policy',
    tasks: [
      { task:'Copilot Readiness Assessment', role:'', hours:'8', notes:'Licensing eligibility, tenant configuration, security score, MFA status' },
      { task:'Data Governance Review — SharePoint & OneDrive', role:'', hours:'12', notes:'Oversharing audit, orphaned sites, broad permissions, stale content' },
      { task:'Sensitivity Label Design & Implementation', role:'', hours:'12', notes:'Label taxonomy, auto-labelling policies, default labels per site/library' },
      { task:'Information Barriers & Access Review', role:'', hours:'8', notes:'Confirm no unintended data exposure before Copilot surfaces content' },
      { task:'Microsoft Purview Configuration', role:'', hours:'8', notes:'DLP policies, retention labels, audit logging baseline' },
      { task:'Copilot Licensing Activation & Admin Centre Setup', role:'', hours:'4', notes:'License assignment, Copilot admin settings, web access policy' },
      { task:'Pilot Group Selection & Onboarding', role:'', hours:'4', notes:'5–15 users across key roles, briefing, feedback process setup' },
      { task:'Copilot in Teams — Configuration & Pilot', role:'', hours:'6', notes:'Meeting transcription, recap, call notes — test with pilot group' },
      { task:'Copilot in Outlook — Configuration & Pilot', role:'', hours:'4', notes:'Email summary, draft assist, thread summary — pilot validation' },
      { task:'Copilot in Word, Excel & PowerPoint — Pilot', role:'', hours:'4', notes:'Document generation, data analysis, presentation drafting' },
      { task:'Prompt Engineering Training — Pilot Group', role:'', hours:'6', notes:'How to write effective prompts, practical use cases per role' },
      { task:'Pilot Review & Feedback Analysis', role:'', hours:'4', notes:'Usage data review, feedback collation, blockers and wins documented' },
      { task:'Broad Rollout & Department Training', role:'', hours:'12', notes:'Role-specific training sessions — how Copilot helps their actual job' },
      { task:'Copilot Adoption & Usage Reporting Setup', role:'', hours:'4', notes:'Microsoft 365 Copilot dashboard, usage metrics, value reporting' },
      { task:'AI Acceptable Use Policy — Template & Review', role:'', hours:'4', notes:'Draft policy for client review — what Copilot can and cannot be used for' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, stakeholder communications, milestone tracking' }
    ]
  },
  azure: {
    title: 'Azure Cloud Migration',
    overview: 'This project covers the full migration of your on-premises server infrastructure to Microsoft Azure, delivering improved reliability, scalability, and remote access — with minimal disruption to your team and day-to-day operations.',
    exclusions: 'Application code changes or custom development\nThird-party vendor coordination beyond 2 hours per vendor\nEnd-user training (available as a separate engagement)\nHardware procurement and shipping costs\nMicrosoft licensing costs',
    tasks: [
      { task:'Project Kickoff & Planning', role:'', hours:'8', notes:'Scope confirmation, schedule, communication plan' },
      { task:'Current Environment Assessment', role:'', hours:'12', notes:'Inventory servers, workloads, dependencies, network' },
      { task:'Azure Network Design & VPN Architecture', role:'', hours:'8', notes:'Address space, subnets, gateway sizing' },
      { task:'Create & Configure Azure Virtual Network & VPN Gateway', role:'', hours:'8', notes:'Includes site-to-site VPN to office(s)' },
      { task:'Create & Configure Azure Server VMs', role:'', hours:'48', notes:'VM provisioning, OS config, patching' },
      { task:'Security & Baseline Configuration', role:'', hours:'24', notes:'NSGs, firewall rules, access controls' },
      { task:'Data Migration Planning & Validation', role:'', hours:'24', notes:'Migration approach and test validation' },
      { task:'Migrate Data from On-Prem to Azure (standard servers)', role:'', hours:'48', notes:'File/data migration, integrity checks' },
      { task:'Configure Workstations & Printers for New Network', role:'', hours:'24', notes:'DNS, drive mappings, printer updates' },
      { task:'User Acceptance & Environment Validation', role:'', hours:'12', notes:'Confirmation Azure environment is fully working' },
      { task:'Decommission On-Prem VMs', role:'', hours:'12', notes:'Graceful shutdown, data verification' },
      { task:'Update Network & Process Documentation', role:'', hours:'8', notes:'Diagrams, runbooks, credentials handling' },
      { task:'Project Management (ongoing)', role:'', hours:'48', notes:'Status updates, stakeholder coordination, reporting' }
    ]
  },
  m365: {
    title: 'Microsoft 365 Migration',
    overview: 'This project covers the full migration from your current on-premises email and file infrastructure to Microsoft 365, including Exchange Online, SharePoint, Teams, and OneDrive — with a staged approach designed to minimize disruption during the transition.',
    exclusions: 'Third-party application integrations not listed in scope\nCustom development or workflow automation\nEnd-user device setup beyond standard mail profile configuration\nMicrosoft 365 licensing costs\nData older than agreed retention period',
    tasks: [
      { task:'Project Kickoff & Tenant Assessment', role:'', hours:'8', notes:'Current environment review, license planning' },
      { task:'DNS & Domain Configuration', role:'', hours:'4', notes:'MX, SPF, DKIM, DMARC records' },
      { task:'Exchange Online Setup & Mail Flow', role:'', hours:'8', notes:'Connectors, hybrid config, mail routing' },
      { task:'Mailbox Migration — Batch 1', role:'', hours:'16', notes:'Priority users, pilot group' },
      { task:'Mailbox Migration — Remaining Users', role:'', hours:'24', notes:'Full organization migration, integrity checks' },
      { task:'SharePoint Online Setup & Structure', role:'', hours:'12', notes:'Sites, libraries, permissions' },
      { task:'File Data Migration to SharePoint / OneDrive', role:'', hours:'16', notes:'On-prem file shares to cloud storage' },
      { task:'Microsoft Teams Setup & Policies', role:'', hours:'8', notes:'Teams, channels, meeting policies' },
      { task:'Security & Compliance Configuration', role:'', hours:'12', notes:'MFA, Conditional Access, DLP policies' },
      { task:'Cutover Planning & Execution', role:'', hours:'8', notes:'MX record cutover, final sync' },
      { task:'User Onboarding & Orientation', role:'', hours:'12', notes:'Profile setup, Outlook config, basic guidance' },
      { task:'Post-Migration Validation & Support', role:'', hours:'16', notes:'30-day hypercare, issue resolution' },
      { task:'Documentation Update', role:'', hours:'4', notes:'Updated environment docs, admin guide' },
      { task:'Project Management', role:'', hours:'24', notes:'Scheduling, status reporting, stakeholder comms' }
    ]
  },
  network: {
    title: 'Network Infrastructure Upgrade',
    overview: 'This project delivers a full replacement and modernisation of your existing network infrastructure, including next-generation firewall, managed switching, structured cabling, and wireless access points — installed after hours to ensure zero disruption to your team.',
    exclusions: 'Structured cabling beyond agreed scope\nISP or WAN circuit changes\nThird-party equipment not supplied through this engagement\nAV or physical security systems',
    tasks: [
      { task:'Site Survey & Current Environment Assessment', role:'', hours:'8', notes:'Cabling audit, device inventory, coverage mapping' },
      { task:'Network Design & Architecture', role:'', hours:'8', notes:'IP addressing, VLANs, segmentation design' },
      { task:'Procurement & Equipment Staging', role:'', hours:'4', notes:'Order management, pre-configuration' },
      { task:'Firewall Installation & Configuration', role:'', hours:'12', notes:'Rules, NAT, VPN, remote access policies' },
      { task:'Core Switch Deployment', role:'', hours:'8', notes:'Uplink config, VLAN tagging, redundancy' },
      { task:'Access Switch Deployment', role:'', hours:'12', notes:'Port config, PoE, patch panel connections' },
      { task:'Wireless Access Point Deployment', role:'', hours:'8', notes:'Controller config, SSID setup, coverage validation' },
      { task:'VLAN & Network Segmentation', role:'', hours:'8', notes:'Traffic isolation, guest network, IoT separation' },
      { task:'Network Testing & Validation', role:'', hours:'8', notes:'Throughput, failover, segmentation testing' },
      { task:'Network Documentation & Diagrams', role:'', hours:'6', notes:'Topology diagrams, VLAN tables, port mapping' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, vendor coordination, comms' }
    ]
  },
  endpoint: {
    title: 'Endpoint Refresh & Device Deployment',
    overview: 'This project replaces aging workstations and laptops across your organization — ensuring all staff are on modern, supported hardware with minimal disruption to each user.',
    exclusions: 'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nPersonal files or non-business data',
    tasks: [
      { task:'Asset Audit & Device Inventory', role:'', hours:'4', notes:'Catalogue all existing devices, specs, age and OS version' },
      { task:'New Device Specification & Procurement', role:'', hours:'4', notes:'Hardware selection, ordering, delivery tracking' },
      { task:'Image & Build Preparation', role:'', hours:'8', notes:'Standard image creation, software stack, policies' },
      { task:'Device Imaging & Pre-configuration', role:'', hours:'16', notes:'OS imaging, domain join, software deployment per device' },
      { task:'Data Migration — User Files & Profile', role:'', hours:'24', notes:'Documents, desktop, browser favourites, Outlook PST' },
      { task:'Intune / MDM Enrolment', role:'', hours:'8', notes:'Device enrolment, compliance policies, app deployment' },
      { task:'User Handover & Orientation', role:'', hours:'8', notes:'New device walkthrough, key differences, helpdesk contact' },
      { task:'Old Device Wipe & Disposal', role:'', hours:'8', notes:'Secure data wipe, WEEE disposal or trade-in coordination' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, user communications, progress tracking' }
    ]
  },
  server: {
    title: 'Server Refresh & Hardware Deployment',
    overview: 'This project replaces your existing server hardware with new equipment, migrating all roles, services, and data with minimal downtime.',
    exclusions: 'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nEnd-user device setup',
    tasks: [
      { task:'Current Environment Assessment', role:'', hours:'8', notes:'Server roles, services, data volumes, dependencies' },
      { task:'Migration Planning & Risk Assessment', role:'', hours:'6', notes:'Cutover approach, rollback plan, schedule' },
      { task:'New Server OS Installation & Patching', role:'', hours:'8', notes:'Base OS build, drivers, security baseline' },
      { task:'Active Directory, DNS & DHCP Migration', role:'', hours:'12', notes:'Role migration, replication, cutover' },
      { task:'Application Server Migration', role:'', hours:'16', notes:'Line-of-business apps, databases, dependencies' },
      { task:'File Server Data Migration', role:'', hours:'16', notes:'Share migration, permissions, DFS replication' },
      { task:'Backup Configuration on New Hardware', role:'', hours:'6', notes:'BDR agent, policies, initial backup run' },
      { task:'User Acceptance Testing', role:'', hours:'6', notes:'Sign-off testing with key users' },
      { task:'Old Server Decommission', role:'', hours:'6', notes:'Data wipe verification, hardware retirement' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, stakeholder updates, sign-off' }
    ]
  },
  voip: {
    title: 'VoIP & Business Communications Upgrade',
    overview: 'This project replaces your existing phone system with a modern cloud-based VoIP or UCaaS solution — delivering reliable business communications, mobile flexibility, and Microsoft Teams integration.',
    exclusions: 'Ongoing SIP trunk or UCaaS subscription costs\nISP or internet circuit upgrades\nCustom auto-attendant scripting beyond agreed call flows',
    tasks: [
      { task:'Current System Audit & Requirements Gathering', role:'', hours:'6', notes:'Existing numbers, call flows, voicemail, hunt groups' },
      { task:'Internet & Network Readiness Assessment', role:'', hours:'4', notes:'Bandwidth, QoS capability, VLAN design for voice traffic' },
      { task:'Solution Design & Call Flow Planning', role:'', hours:'8', notes:'Auto-attendant, hunt groups, voicemail, hold music' },
      { task:'Number Porting Coordination', role:'', hours:'6', notes:'LOA submission, carrier liaison, porting schedule' },
      { task:'UCaaS / Teams Voice Tenant Configuration', role:'', hours:'8', notes:'Licensing, dial plan, emergency locations' },
      { task:'VoIP Hardware Deployment', role:'', hours:'12', notes:'Desk phone provisioning, headsets, ATA adapters' },
      { task:'Auto-Attendant & Call Flow Configuration', role:'', hours:'8', notes:'IVR menus, business hours, after-hours routing' },
      { task:'Testing & Pre-Cutover Validation', role:'', hours:'6', notes:'Inbound/outbound calls, hunt groups, failover' },
      { task:'Cutover Execution', role:'', hours:'4', notes:'Number activation, final routing switch, live monitoring' },
      { task:'User Training & Handover', role:'', hours:'8', notes:'Handset use, Teams calling, voicemail walkthrough' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, number porting liaison, stakeholder comms' }
    ]
  },
  onboarding: {
    title: 'New Client Onboarding',
    overview: 'This project transitions your organization onto our managed services platform, establishing monitoring, security, backup, and support processes.',
    exclusions: 'Hardware procurement or replacement\nSoftware licensing costs\nMajor remediation work identified during assessment',
    tasks: [
      { task:'Kickoff Meeting & Discovery', role:'', hours:'4', notes:'Goals, contacts, priorities, schedule' },
      { task:'Environment Assessment & Asset Inventory', role:'', hours:'8', notes:'Servers, workstations, network devices, software' },
      { task:'RMM Agent Deployment', role:'', hours:'8', notes:'Monitoring and management agent on all devices' },
      { task:'Security Baseline Configuration', role:'', hours:'8', notes:'Password policies, admin accounts, baseline hardening' },
      { task:'Endpoint Protection Deployment', role:'', hours:'6', notes:'AV/EDR deployment and policy configuration' },
      { task:'Backup Solution Setup', role:'', hours:'8', notes:'BDR agent, policy config, initial backup run' },
      { task:'Email Security Configuration', role:'', hours:'6', notes:'SPF, DKIM, DMARC, anti-spam, anti-phishing' },
      { task:'MFA & Identity Setup', role:'', hours:'6', notes:'MFA enforcement, admin account review' },
      { task:'Network & Environment Documentation', role:'', hours:'6', notes:'Topology, credentials vault, asset register' },
      { task:'30-Day Review & Optimisation', role:'', hours:'4', notes:'Alert tuning, policy adjustments, initial report' }
    ]
  },
  security: {
    title: 'Cybersecurity & Compliance Assessment',
    overview: 'This engagement delivers a comprehensive assessment of your organization\'s current cybersecurity posture and compliance position, identifying vulnerabilities, gaps, and risks.',
    exclusions: 'Remediation implementation (available as a follow-on engagement)\nPhysical security assessment\nSocial engineering or phishing simulation exercises',
    tasks: [
      { task:'Scoping & Kickoff', role:'', hours:'4', notes:'Scope agreement, access requirements, schedule' },
      { task:'External Attack Surface Scan', role:'', hours:'8', notes:'Internet-facing assets, open ports, exposed services' },
      { task:'Internal Vulnerability Assessment', role:'', hours:'8', notes:'Network, server, and endpoint vulnerability scan' },
      { task:'Active Directory Security Review', role:'', hours:'8', notes:'Privilege review, group policies, stale accounts' },
      { task:'Email Security Assessment', role:'', hours:'6', notes:'SPF/DKIM/DMARC, filtering, phishing exposure' },
      { task:'Firewall & Network Policy Review', role:'', hours:'6', notes:'Rule audit, segmentation, VPN config review' },
      { task:'Risk Scoring & Findings Analysis', role:'', hours:'12', notes:'CVSS scoring, business impact mapping, prioritisation' },
      { task:'Executive Report Preparation', role:'', hours:'8', notes:'Non-technical summary, risk heat map, key findings' },
      { task:'Remediation Roadmap Development', role:'', hours:'8', notes:'Prioritised action plan with effort estimates' },
      { task:'Findings Presentation', role:'', hours:'4', notes:'Walkthrough with key stakeholders, Q&A' }
    ]
  },
  backup: {
    title: 'Backup & Disaster Recovery Implementation',
    overview: 'This project designs and deploys a comprehensive backup and disaster recovery solution covering your servers, endpoints, and cloud data — including documented recovery procedures and tested restore capability.',
    exclusions: 'Off-site hardware colocation or data centre costs\nBackup software licensing costs\nApplication-level recovery for custom-built or bespoke systems',
    tasks: [
      { task:'Assessment & Solution Design', role:'', hours:'6', notes:'RPO/RTO requirements, data volume, retention policy' },
      { task:'BDR Appliance Installation & Configuration', role:'', hours:'8', notes:'Physical or virtual appliance setup' },
      { task:'Server Backup Policy Configuration', role:'', hours:'8', notes:'Schedules, retention, exclusions, verification' },
      { task:'Workstation / Endpoint Backup Configuration', role:'', hours:'8', notes:'Agent deployment, policy, selective backup' },
      { task:'Cloud Replication Setup', role:'', hours:'6', notes:'Off-site cloud backup target, encryption, throttling' },
      { task:'Microsoft 365 Backup Configuration', role:'', hours:'4', notes:'Exchange, SharePoint, Teams, OneDrive' },
      { task:'Initial Backup Run & Validation', role:'', hours:'4', notes:'Full backup completion, integrity verification' },
      { task:'Bare Metal / VM Recovery Test', role:'', hours:'6', notes:'Full system recovery test, RTO validation' },
      { task:'DR Plan Documentation', role:'', hours:'8', notes:'Step-by-step recovery runbook, contact list' },
      { task:'Project Management', role:'', hours:'16', notes:'Scheduling, vendor coordination, reporting' }
    ]
  }
};

// ── Utilities ─────────────────────────────────────────────
function esc(str) {
  return (str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function roundDisp(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function fmt(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function durationStr(hours, hpd) {
  const h = num(hours); const d = Math.max(1, num(hpd));
  if (h <= 0) return '';
  const raw = h / d; const rounded = Math.ceil(raw * 2) / 2;
  if (rounded % 1 === 0) return `${rounded} day${rounded === 1 ? '' : 's'}`;
  return `${Math.floor(rounded)}–${Math.floor(rounded)+1} days`;
}

function totalDurationStr(totalHours, hpd) {
  const h = num(totalHours); const d = Math.max(1, num(hpd));
  if (h <= 0) return '—';
  const raw = h / d; const rounded = Math.ceil(raw * 2) / 2;
  if (rounded % 1 === 0) return `${rounded} day${rounded === 1 ? '' : 's'}`;
  return `${Math.floor(rounded)}–${Math.floor(rounded)+1} days`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ── Credentials & Catalog ─────────────────────────────────
function getCredentials() {
  return {
    tenantUrl: document.getElementById('sbTenantUrl').value.trim(),
    apiKey:    document.getElementById('sbApiKey').value.trim()
  };
}

function initCredentials() {
  const savedApi    = localStorage.getItem(LS_API_KEY);
  const savedTenant = localStorage.getItem(LS_TENANT_URL);
  if (savedApi)    document.getElementById('sbApiKey').value    = savedApi;
  if (savedTenant) document.getElementById('sbTenantUrl').value = savedTenant;
  if (savedApi && savedTenant) document.getElementById('sbRemember').checked = true;

  // Try to restore catalog from sessionStorage
  try {
    const cached = sessionStorage.getItem(SS_CATALOG);
    if (cached) {
      catalog = JSON.parse(cached);
      if (catalog && catalog.length > 0) {
        catalogLoaded = true;
        setConnectStatus('ok', `Connected — ${catalog.length} labor SKUs loaded`);
        // Re-render so SKU dropdowns are populated immediately on page load
        // (rows may already be loaded from localStorage before initCredentials runs)
        render();
        updateSummary();
        return;
      }
    }
  } catch {}

  if (savedApi && savedTenant) {
    // Auto-connect on page load if credentials remembered
    connectToSalesbuildr();
  }
}

function setConnectStatus(type, message) {
  const el = document.getElementById('connectStatus');
  el.textContent = message;
  el.className = `connect-status connect-status-${type}`;
}

async function connectToSalesbuildr() {
  const { tenantUrl, apiKey } = getCredentials();
  if (!tenantUrl || !apiKey) { showToast('Enter tenant URL and API key first'); return; }

  setConnectStatus('loading', 'Connecting…');
  document.getElementById('connectBtn').disabled = true;

  if (document.getElementById('sbRemember').checked) {
    localStorage.setItem(LS_API_KEY, apiKey);
    localStorage.setItem(LS_TENANT_URL, tenantUrl);
  }

  try {
    const res  = await fetch(API_CATALOG, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantUrl, apiKey })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Connection failed');

    catalog = data.skus || [];
    catalogLoaded = true;
    sessionStorage.setItem(SS_CATALOG, JSON.stringify(catalog));
    setConnectStatus('ok', `Connected — ${catalog.length} labor SKU${catalog.length !== 1 ? 's' : ''} loaded`);
    // Re-render the grid so SKU dropdowns populate
    render();
    updateSummary();
    showToast(`Connected — ${catalog.length} SKUs loaded`);

    // Also pre-load quote templates in the background
    loadQuoteTemplates();

  } catch (e) {
    setConnectStatus('error', '✕ ' + (e.message || 'Connection failed'));
    catalog = [];
    catalogLoaded = false;
    sessionStorage.removeItem(SS_CATALOG);
  } finally {
    document.getElementById('connectBtn').disabled = false;
  }
}

// ── Brand color ───────────────────────────────────────────
function saveBrandColor(color) {
  brandColor = color;
  localStorage.setItem(LS_BRAND_COLOR, color);
}

function initBrandColor() {
  const stored = localStorage.getItem(LS_BRAND_COLOR);
  if (stored) brandColor = stored;
  const swatches = document.querySelectorAll('.brand-swatch:not(.brand-swatch-custom)');
  let matched = false;
  swatches.forEach(sw => {
    const isActive = sw.dataset.color === brandColor;
    sw.classList.toggle('active', isActive);
    if (isActive) matched = true;
  });
  const customSwatch = document.getElementById('brandCustomSwatch');
  if (!matched) {
    customSwatch.classList.add('active');
    customSwatch.style.background = brandColor;
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').value = brandColor;
  } else {
    customSwatch.classList.remove('active');
  }
}

function setupBrandColorListeners() {
  document.querySelectorAll('.brand-swatch:not(.brand-swatch-custom)').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.brand-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      saveBrandColor(sw.dataset.color);
      document.getElementById('brandHexRow').style.display = 'none';
      document.getElementById('brandCustomSwatch').style.background = 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)';
      autoRefresh();
    });
  });
  document.getElementById('brandCustomSwatch').addEventListener('click', () => {
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').focus();
  });
  document.getElementById('brandHexApply').addEventListener('click', applyCustomHex);
  document.getElementById('brandHexInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyCustomHex();
  });
}

function applyCustomHex() {
  let val = document.getElementById('brandHexInput').value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) { showToast('Enter a valid 6-digit hex e.g. #2563eb'); return; }
  document.querySelectorAll('.brand-swatch').forEach(s => s.classList.remove('active'));
  const customSwatch = document.getElementById('brandCustomSwatch');
  customSwatch.classList.add('active');
  customSwatch.style.background = val;
  saveBrandColor(val);
  autoRefresh();
  showToast('Brand color updated');
}

// ── State ─────────────────────────────────────────────────
let rows = [];           // [{ task, role, skuId, hours, notes }]
let currentProjectId = null;

function defaultRow() { return { task:'', role:'', skuId:'', hours:'', notes:'' }; }
function genId()       { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// ── Passphrase / team mode ────────────────────────────────
function getPassphrase() { return (document.getElementById('tmplPassphrase')?.value || '').trim(); }
function hashPassphrase(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}
function isTeamMode() { return getPassphrase().length > 0; }

function updatePassphraseUI() {
  const badge = document.getElementById('tmplPassphraseBadge');
  const label = document.getElementById('tmplModeLabel');
  if (!badge) return;
  if (isTeamMode()) {
    badge.textContent = '🔗 Team'; badge.className = 'lp-badge lp-badge-team';
    if (label) label.textContent = '(team — shared)';
  } else {
    badge.textContent = '💾 Local'; badge.className = 'lp-badge lp-badge-local';
    if (label) label.textContent = '(local)';
  }
}

// ── Template storage ──────────────────────────────────────
function localGetAll()       { try { return JSON.parse(localStorage.getItem(LS_TEMPLATES)) || []; } catch { return []; } }
function localSaveAll(tmpl)  { localStorage.setItem(LS_TEMPLATES, JSON.stringify(tmpl)); }

async function apiCall(payload) {
  const res = await fetch(API_TEMPLATES, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
async function teamGetIndex(hash)                  { return apiCall({ method: 'getIndex', hash }); }
async function teamGetTemplate(hash, name)         { return apiCall({ method: 'getTemplate', hash, name }); }
async function teamSaveTemplate(hash, name, entry) { return apiCall({ method: 'saveTemplate', hash, name, entry }); }
async function teamDeleteTemplate(hash, name)      { return apiCall({ method: 'deleteTemplate', hash, name }); }

async function renderTemplateSelect(preserveSelection = true) {
  const sel   = document.getElementById('templateSelect');
  const saved = preserveSelection ? sel.value : '';
  if (isTeamMode()) {
    sel.innerHTML = '<option value="">⏳ Loading…</option>';
    const hash  = hashPassphrase(getPassphrase());
    const names = await teamGetIndex(hash);
    sel.innerHTML = `<option value="">— ${names.length ? 'Team templates' : 'No team templates yet'} —</option>` +
      names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if (saved && names.includes(saved)) sel.value = saved;
  } else {
    const all = localGetAll();
    sel.innerHTML = `<option value="">— ${all.length ? 'Local templates' : 'No local templates yet'} —</option>` +
      all.map(t => `<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
    if (saved && all.find(t => t.name === saved)) sel.value = saved;
  }
}

function promptForPassphrase(action = 'use shared templates') {
  const input  = document.getElementById('tmplPassphrase');
  const phrase = prompt(`No team passphrase set.\n\nEnter a passphrase to ${action} with your team, or leave blank for local storage.`);
  if (phrase === null) return false;
  if (phrase.trim().length > 0) { input.value = phrase.trim(); updatePassphraseUI(); return true; }
  return false;
}

// ── Projects ──────────────────────────────────────────────
function getProjects()          { try { return JSON.parse(localStorage.getItem(LS_PROJECTS)) || []; } catch { return []; } }
function saveProjects(projects) { localStorage.setItem(LS_PROJECTS, JSON.stringify(projects)); }

function captureCurrentState() {
  return {
    projectTitle: document.getElementById('projectTitle').value,
    customerName: document.getElementById('customerName').value,
    hoursPerDay:  document.getElementById('hoursPerDay').value,
    overview:     document.getElementById('overview').value,
    exclusions:   document.getElementById('exclusions').value,
    rows:         rows.map(r => ({ ...r }))
  };
}

function autoSaveCurrentProject() {
  if (!currentProjectId) return;
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === currentProjectId);
  if (idx < 0) return;
  projects[idx] = { ...projects[idx], ...captureCurrentState(), updatedAt: new Date().toISOString() };
  saveProjects(projects);
}

function renderProjects() {
  const list = document.getElementById('projectList');
  const projects = getProjects();
  list.innerHTML = '';
  if (projects.length === 0) {
    list.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px 2px;">No projects yet</div>';
    return;
  }
  projects.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'lp-proj-item' + (p.id === currentProjectId ? ' active' : '');
    const color  = PROJ_COLORS[i % PROJ_COLORS.length];
    const totalHrs = (p.rows || []).reduce((s, r) => s + num(r.hours), 0);
    const ago    = p.updatedAt ? relativeTime(p.updatedAt) : 'new';
    item.innerHTML = `
      <div class="lp-proj-dot" style="background:${color}"></div>
      <div class="lp-proj-info">
        <div class="lp-proj-name">${esc(p.projectTitle || 'Untitled project')}</div>
        <div class="lp-proj-meta">${esc(p.customerName || '')}${p.customerName ? ' · ' : ''}${totalHrs}h · ${ago}</div>
      </div>
      <span class="lp-proj-badge lp-proj-badge-local">local</span>
      <span class="lp-proj-delete" title="Delete project" data-id="${esc(p.id)}"><i class="ti ti-x"></i></span>
    `;
    item.addEventListener('click', e => {
      if (e.target.closest('.lp-proj-delete')) return;
      switchToProject(p.id);
    });
    item.querySelector('.lp-proj-delete').addEventListener('click', e => {
      e.stopPropagation(); deleteProject(p.id);
    });
    list.appendChild(item);
  });
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function switchToProject(id) {
  autoSaveCurrentProject();
  const p = getProjects().find(proj => proj.id === id);
  if (!p) return;
  currentProjectId = id;
  applyState(p); renderProjects(); updateCenterHeader();
}

function deleteProject(id) {
  const projects = getProjects();
  const p = projects.find(proj => proj.id === id);
  if (!confirm(`Delete project "${p?.projectTitle || 'this project'}"?`)) return;
  const updated = projects.filter(proj => proj.id !== id);
  saveProjects(updated);
  if (currentProjectId === id) {
    currentProjectId = null;
    if (updated.length > 0) { switchToProject(updated[0].id); return; }
    rows = [defaultRow()];
    document.getElementById('projectTitle').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('overview').value = '';
    document.getElementById('exclusions').value = '';
    render(); updateSummary();
  }
  renderProjects(); showToast('Project deleted');
}

function saveCurrentAsProject(title) {
  const projects = getProjects();
  const state    = captureCurrentState();
  if (currentProjectId) {
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...state, updatedAt: new Date().toISOString() };
      saveProjects(projects); renderProjects(); return;
    }
  }
  const newProj = { id: genId(), ...state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  projects.push(newProj);
  currentProjectId = newProj.id;
  saveProjects(projects); renderProjects();
}

function newProject() {
  autoSaveCurrentProject();
  currentProjectId = null;
  rows = [defaultRow()];
  document.getElementById('projectTitle').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('hoursPerDay').value  = '8';
  document.getElementById('overview').value     = '';
  document.getElementById('exclusions').value   = '';
  document.getElementById('presetSelect').value = '';
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML  = '';
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled   = true;
  resetQuoteUI();
  render(); updateSummary(); renderProjects(); updateCenterHeader();
  saveState(); showToast('New project started');
}

function updateCenterHeader() {
  const title    = document.getElementById('projectTitle').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  document.getElementById('centerTitle').textContent = title || 'Project Planner';
  let sub = title ? '' : 'Connect to Salesbuildr to load your labor catalog, or start adding tasks';
  if (title && customer) sub = customer;
  else if (title) sub = '💾 Local project';
  document.getElementById('centerSub').textContent = sub;
}

// ── Persistence ───────────────────────────────────────────
function saveState() {
  const state = captureCurrentState();
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  autoSaveCurrentProject();
  updateCenterHeader();
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.rows)) return false;
    document.getElementById('projectTitle').value = s.projectTitle ?? '';
    document.getElementById('customerName').value = s.customerName ?? '';
    document.getElementById('hoursPerDay').value  = s.hoursPerDay  ?? 8;
    document.getElementById('overview').value     = s.overview     ?? '';
    document.getElementById('exclusions').value   = s.exclusions   ?? '';
    rows = s.rows.map(r => ({ task:'', role:'', skuId:'', hours:'', notes:'', ...r }));
    return true;
  } catch { return false; }
}

function applyState(s) {
  document.getElementById('projectTitle').value = s.projectTitle ?? '';
  document.getElementById('customerName').value = s.customerName ?? '';
  document.getElementById('hoursPerDay').value  = s.hoursPerDay  ?? 8;
  document.getElementById('overview').value     = s.overview     ?? '';
  document.getElementById('exclusions').value   = s.exclusions   ?? '';
  rows = (s.rows || []).map(r => ({ task:'', role:'', skuId:'', hours:'', notes:'', ...r }));
  render(); updateSummary(); saveState(); updateCenterHeader();
}

// ── SKU helpers ───────────────────────────────────────────
function getSkuById(id) { return catalog.find(s => s.id === id) || null; }
function getSkuPrice(id) {
  if (!id) return null;
  const sku = getSkuById(id);
  return sku ? sku.price : null;
}

// ── SKU searchable dropdown ───────────────────────────────
function buildSkuSelect(row, idx) {
  const wrap      = document.createElement('div'); wrap.className = 'sku-select';
  const trigger   = document.createElement('button'); trigger.type = 'button';
  const hasSku    = !!row.skuId;
  const skuItem   = hasSku ? getSkuById(row.skuId) : null;
  const labelText = hasSku && skuItem ? skuItem.name : (row.role || '');

  trigger.className = 'sku-trigger' + (hasSku ? ' has-sku' : '') + (!labelText ? ' placeholder' : '');
  trigger.textContent = labelText || (catalogLoaded ? 'Select SKU…' : row.role || 'Type role or connect for SKUs');

  if (!catalogLoaded) {
    // Fallback to free text
    const input = document.createElement('input'); input.type = 'text';
    input.value = row.role || ''; input.placeholder = 'Role (connect for SKUs)';
    input.style.cssText = 'width:100%;font-size:12px;padding:5px 7px;border:1px solid var(--border);border-radius:0;background:transparent;color:var(--text);outline:none;';
    input.addEventListener('input', e => {
      rows[idx].role  = e.target.value;
      rows[idx].skuId = '';
      saveState(); autoRefresh(); updateSummary();
    });
    wrap.appendChild(input); return wrap;
  }

  const dropdown = document.createElement('div'); dropdown.className = 'sku-dropdown'; dropdown.hidden = true;
  const searchIn = document.createElement('input'); searchIn.type = 'text'; searchIn.className = 'sku-search'; searchIn.placeholder = 'Search SKUs…';

  const listEl = document.createElement('div'); listEl.className = 'sku-list';

  function renderSkuOptions(filter = '') {
    listEl.innerHTML = '';
    const lc = filter.toLowerCase();
    const items = catalog.filter(s => !lc || s.name.toLowerCase().includes(lc));
    if (items.length === 0) {
      listEl.innerHTML = `<div class="sku-option-empty">${filter ? 'No matches' : 'No SKUs loaded'}</div>`;
      return;
    }
    items.forEach(s => {
      const opt = document.createElement('div'); opt.className = 'sku-option' + (rows[idx].skuId === s.id ? ' active' : '');
      opt.innerHTML = `<span class="sku-option-name">${esc(s.name)}</span><span class="sku-option-price">${s.price != null ? fmt(s.price) : ''}</span>`;
      opt.addEventListener('mousedown', e => {
        e.preventDefault();
        rows[idx].skuId = s.id;
        rows[idx].role  = s.name;
        dropdown.hidden = true;
        saveState(); render(); updateSummary(); autoRefresh();
      });
      listEl.appendChild(opt);
    });
  }

  const clearBtn = document.createElement('button'); clearBtn.className = 'sku-clear-btn'; clearBtn.textContent = '✕ Clear selection';
  clearBtn.addEventListener('mousedown', e => {
    e.preventDefault();
    rows[idx].skuId = '';
    rows[idx].role  = '';
    dropdown.hidden = true;
    saveState(); render(); updateSummary(); autoRefresh();
  });

  searchIn.addEventListener('input', () => renderSkuOptions(searchIn.value));
  renderSkuOptions();
  dropdown.appendChild(searchIn); dropdown.appendChild(listEl);
  // Always include clear button — hidden when no SKU assigned
  clearBtn.style.display = hasSku ? 'block' : 'none';
  dropdown.appendChild(clearBtn);

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    // Close every other open dropdown across the whole document
    document.querySelectorAll('.sku-dropdown').forEach(d => {
      if (d !== dropdown) d.hidden = true;
    });
    dropdown.hidden = !dropdown.hidden;
    if (!dropdown.hidden) { searchIn.value = ''; renderSkuOptions(); searchIn.focus(); }
  });

  wrap.appendChild(trigger); wrap.appendChild(dropdown);
  return wrap;
}

document.addEventListener('click', () => {
  document.querySelectorAll('.sku-dropdown').forEach(d => d.hidden = true);
});

// ── Render task grid ──────────────────────────────────────
function render() {
  // Close any open dropdowns before wiping the DOM
  document.querySelectorAll('.sku-dropdown').forEach(d => d.hidden = true);
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  const hpd = document.getElementById('hoursPerDay').value;

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr'); tr.dataset.idx = idx;

    const tdDrag = document.createElement('td'); tdDrag.className = 'col-drag';
    tdDrag.innerHTML = '<div class="drag-handle" title="Drag to reorder">⠿</div>';

    const tdTask = document.createElement('td'); tdTask.className = 'col-task';
    const inTask = document.createElement('input'); inTask.type = 'text'; inTask.value = r.task || ''; inTask.placeholder = 'Task description';
    inTask.addEventListener('input', e => { rows[idx].task = e.target.value; saveState(); autoRefresh(); });
    tdTask.appendChild(inTask);

    const tdRole = document.createElement('td'); tdRole.className = 'col-role';
    tdRole.appendChild(buildSkuSelect(r, idx));

    const tdHours = document.createElement('td'); tdHours.className = 'col-hours';
    const inHours = document.createElement('input'); inHours.type = 'number'; inHours.min = '0'; inHours.step = '0.5'; inHours.value = r.hours || ''; inHours.placeholder = '0';
    inHours.addEventListener('input', e => { rows[idx].hours = e.target.value; updateSummary(); saveState(); autoRefresh(); });
    tdHours.appendChild(inHours);

    const tdDur = document.createElement('td'); tdDur.className = 'col-dur';
    tdDur.textContent = durationStr(r.hours, hpd);

    const tdNotes = document.createElement('td'); tdNotes.className = 'col-notes';
    const txNotes = document.createElement('textarea'); txNotes.value = r.notes || ''; txNotes.placeholder = 'Notes…';
    txNotes.addEventListener('input', e => { rows[idx].notes = e.target.value; saveState(); autoRefresh(); });
    tdNotes.appendChild(txNotes);

    const tdDel = document.createElement('td'); tdDel.className = 'col-del';
    const delBtn = document.createElement('button'); delBtn.className = 'del-row-btn'; delBtn.innerHTML = '<i class="ti ti-trash"></i>'; delBtn.title = 'Delete row';
    delBtn.addEventListener('click', () => { rows.splice(idx, 1); render(); updateSummary(); saveState(); autoRefresh(); });
    tdDel.appendChild(delBtn);

    tr.append(tdDrag, tdTask, tdRole, tdHours, tdDur, tdNotes, tdDel);
    tbody.appendChild(tr);
  });
  updateSummary(); initSortable();
}

function initSortable() {
  if (typeof Sortable === 'undefined') return;
  const tbody = document.getElementById('tbody');
  Sortable.create(tbody, {
    handle: '.drag-handle', animation: 150, ghostClass: 'row-ghost', dragClass: 'row-drag',
    onEnd: function() {
      const newRows = [];
      Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        const idx = parseInt(tr.dataset.idx);
        if (!isNaN(idx)) newRows.push(rows[idx]);
      });
      rows = newRows; render(); saveState(); autoRefresh();
    }
  });
}

function updateSummary() {
  const hpd = document.getElementById('hoursPerDay').value;
  document.querySelectorAll('#tbody tr').forEach((tr, idx) => {
    const dur = tr.querySelector('.col-dur');
    if (dur) dur.textContent = durationStr(rows[idx]?.hours, hpd);
  });

  let totalHrs = 0, totalVal = 0, included = 0, valKnown = true;
  rows.forEach(r => {
    const h = num(r.hours);
    if (h > 0) {
      totalHrs += h;
      included++;
      const price = getSkuPrice(r.skuId);
      if (price != null) { totalVal += h * price; }
      else { valKnown = false; }
    }
  });

  document.getElementById('totalHours').textContent    = roundDisp(totalHrs);
  document.getElementById('totalDuration').textContent = totalDurationStr(totalHrs, hpd);
  document.getElementById('includedCount').textContent = included;

  const valEl = document.getElementById('totalValue');
  if (totalHrs === 0) { valEl.textContent = '—'; }
  else if (valKnown && totalVal > 0) { valEl.textContent = fmt(totalVal); }
  else if (totalVal > 0) { valEl.textContent = fmt(totalVal) + '+'; }
  else { valEl.textContent = '—'; }

  // Update the quote title placeholder
  const titleEl = document.getElementById('projectTitle');
  const quoteTitleEl = document.getElementById('quoteTitle');
  if (quoteTitleEl && !quoteTitleEl.dataset.manuallyEdited) {
    quoteTitleEl.value = titleEl.value || '';
  }
}

// ── Widget HTML generation ────────────────────────────────
function generateWidget() {
  const title      = (document.getElementById('projectTitle').value || '').trim();
  const customer   = (document.getElementById('customerName').value || '').trim();
  const overview   = (document.getElementById('overview').value     || '').trim();
  const exclusions = (document.getElementById('exclusions').value   || '').trim();
  const hpd        = document.getElementById('hoursPerDay').value;

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
  const brandRgb  = hexToRgb(brandColor);
  const rowTint   = `rgba(${brandRgb},0.06)`;
  const totalTint = `rgba(${brandRgb},0.10)`;

  const included = rows
    .map(r => ({
      task:  (r.task  || '').trim(),
      role:  (r.role  || '').trim(),
      skuId: r.skuId || '',
      notes: (r.notes || '').trim(),
      hours: num(r.hours),
      price: getSkuPrice(r.skuId)
    }))
    .filter(r => r.hours > 0 && (r.task || r.role || r.notes));

  const totalHrs = included.reduce((s, r) => s + r.hours, 0);
  const totalVal = included.reduce((s, r) => s + (r.price != null ? r.hours * r.price : 0), 0);
  const hasVal   = included.some(r => r.price != null);
  const duration = totalDurationStr(totalHrs, hpd);
  const colCount = 4; // Task, Role, Hours, Notes

  const thCols = [
    `<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;">Task</th>`,
    `<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;white-space:nowrap;">Role / SKU</th>`,
    `<th style="text-align:right;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;white-space:nowrap;">Hours</th>`,
    `<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;">Notes</th>`
  ];

  const tbRows = included.map((r, i) => {
    const bg = i % 2 === 1 ? `background:${rowTint};` : '';
    const priceNote = r.price != null ? ` <span style="color:#94a3b8;font-size:11px;">(${fmt(r.price)}/hr)</span>` : '';
    return `<tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}"><strong>${esc(r.task)}</strong></td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;${bg}">${esc(r.role)}${priceNote}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;text-align:right;white-space:nowrap;${bg}">${esc(roundDisp(r.hours))}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}">${esc(r.notes)}</td>
    </tr>`;
  }).join('\n      ');

  const valStr = hasVal && totalVal > 0 ? `&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:${brandColor};">Est. Value:</strong> <strong>${fmt(totalVal)}</strong>` : '';
  const totalsRow = `<tr>
    <td colspan="${colCount}" style="padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;background:${totalTint};">
      <strong style="color:${brandColor};">Total Effort:</strong> <strong>${esc(roundDisp(totalHrs))} hours</strong>${duration !== '—' ? `&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:${brandColor};">Est. Duration:</strong> <strong>${esc(duration)}</strong>` : ''}${valStr}
    </td>
  </tr>`;

  const exLines = exclusions.split('\n').map(l => l.trim()).filter(Boolean);
  const exclusionsHtml = exLines.length > 0 ? `
<h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">What's Not Included</h3>
<ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:1.8;">
  ${exLines.map(l => `<li>${esc(l)}</li>`).join('\n  ')}
</ul>` : '';

  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:100%;color:#0f172a;">
${title ? `  <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${brandColor};">${esc(title)}</h2>` : ''}
${customer ? `  <p style="margin:0 0 16px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;font-weight:600;">${esc(customer)}</p>` : '<br>'}
${overview ? `  <h3 style="margin:0 0 6px;font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">Project Overview</h3>
  <p style="margin:0 0 20px;font-size:13px;color:#334155;line-height:1.7;border-left:3px solid ${brandColor};padding-left:12px;">${esc(overview)}</p>` : ''}
  <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">Scope of Work</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr>${thCols.join('')}</tr></thead>
    <tbody>
      ${tbRows || `<tr><td colspan="${colCount}" style="padding:10px;border:1px solid #e2e8f0;color:#94a3b8;">No tasks with hours &gt; 0.</td></tr>`}
      ${totalsRow}
    </tbody>
  </table>${exclusionsHtml}
</div>`.trim();
}

function autoRefresh() {
  const panels = document.getElementById('outputPanels');
  if (!panels || panels.hidden) return;
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML   = html;
}

// ── Widget push to Salesbuildr ────────────────────────────
document.getElementById('sbWidgetToggle').addEventListener('click', () => {
  const body  = document.getElementById('sbWidgetBody');
  const arrow = document.getElementById('sbWidgetArrow');
  body.hidden = !body.hidden;
  arrow.classList.toggle('open', !body.hidden);
});

document.getElementById('sbWidgetPushBtn').addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent.trim();
  if (!html) { showToast('Generate the widget first'); document.getElementById('generateBtn').click(); return; }
  const { tenantUrl, apiKey } = getCredentials();
  if (!tenantUrl || !apiKey) { showToast('Connect to Salesbuildr first'); return; }

  const btn    = document.getElementById('sbWidgetPushBtn');
  const result = document.getElementById('sbWidgetResult');
  const prefix = document.getElementById('sbWidgetPrefix').value.trim();
  const title  = (document.getElementById('projectTitle').value || 'Project Plan').trim();

  btn.disabled = true; btn.textContent = 'Pushing…'; result.hidden = true;

  try {
    const res  = await fetch('/api/push-widgets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: [{ id: 'project-plan', title, html }], prefix, apiKey, tenantUrl })
    });
    const data = await res.json();
    if (data.successCount > 0) {
      result.textContent = `✓ Saved as "${prefix ? prefix + ' – ' : ''}${title}" in Salesbuildr.`;
      result.className = 'sb-result ok'; result.hidden = false; btn.textContent = '✓ Saved';
    } else { throw new Error((data.results?.[0]?.error) || data.error || 'Unknown error'); }
  } catch (e) {
    result.textContent = `✕ ${e.message}`; result.className = 'sb-result error'; result.hidden = false;
    btn.disabled = false; btn.textContent = 'Push →';
  }
});

// ── Quote creation ────────────────────────────────────────
let selectedCompany = null;
let quoteTemplatesLoaded = false;

async function loadQuoteTemplates() {
  if (quoteTemplatesLoaded) return;
  const { tenantUrl, apiKey } = getCredentials();
  if (!tenantUrl || !apiKey) return;
  try {
    const res  = await fetch(API_QT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantUrl, apiKey }) });
    const data = await res.json();
    if (!data.ok) return;
    const sel = document.getElementById('quoteTemplateSelect');
    sel.innerHTML = '<option value="">— None —</option>' +
      (data.templates || []).map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
    quoteTemplatesLoaded = true;
  } catch {}
}

let companySearchTimeout = null;
document.getElementById('companySearch').addEventListener('input', () => {
  clearTimeout(companySearchTimeout);
  companySearchTimeout = setTimeout(doCompanySearch, 350);
});
document.getElementById('companySearch').addEventListener('focus', () => {
  if (document.getElementById('companySearch').value.length >= 2) doCompanySearch();
});

// Opportunity search — fires on every keystroke once a company is selected
let oppSearchTimeout = null;
document.getElementById('opportunitySearch').addEventListener('input', () => {
  // Clear selected ID when user edits the field
  document.getElementById('opportunitySearch').dataset.selectedId = '';
  clearTimeout(oppSearchTimeout);
  oppSearchTimeout = setTimeout(() => {
    if (selectedCompany) loadOpportunities(selectedCompany.id, document.getElementById('opportunitySearch').value.trim());
  }, 350);
});
document.getElementById('opportunitySearch').addEventListener('focus', () => {
  if (selectedCompany) loadOpportunities(selectedCompany.id, document.getElementById('opportunitySearch').value.trim());
});

async function doCompanySearch() {
  const q = document.getElementById('companySearch').value.trim();
  if (q.length < 2) { document.getElementById('companyDropdown').hidden = true; return; }
  const { tenantUrl, apiKey } = getCredentials();
  if (!tenantUrl || !apiKey) { showToast('Connect to Salesbuildr first'); return; }

  const drop = document.getElementById('companyDropdown');
  drop.innerHTML = '<div class="company-option-empty">Searching…</div>';
  drop.hidden = false;

  try {
    const res  = await fetch(API_COMPANIES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantUrl, apiKey, query: q }) });
    const data = await res.json();
    drop.innerHTML = '';
    if (!data.ok || !data.companies || data.companies.length === 0) {
      drop.innerHTML = '<div class="company-option-empty">No companies found</div>';
      return;
    }
    data.companies.forEach(c => {
      const opt = document.createElement('div'); opt.className = 'company-option'; opt.textContent = c.name;
      opt.addEventListener('click', () => selectCompany(c));
      drop.appendChild(opt);
    });
  } catch {
    drop.innerHTML = '<div class="company-option-empty">Search failed</div>';
  }
}

function selectCompany(company) {
  selectedCompany = company;
  document.getElementById('companyDropdown').hidden = true;
  document.getElementById('companySearch').value = '';

  const disp = document.getElementById('selectedCompanyDisplay');
  disp.hidden = false;
  disp.innerHTML = `<span>${esc(company.name)}</span><button class="selected-entity-clear" title="Clear" id="clearCompanyBtn"><i class="ti ti-x"></i></button>`;
  document.getElementById('clearCompanyBtn').addEventListener('click', () => {
    selectedCompany = null; disp.hidden = true;
    document.getElementById('opportunityField').style.display = 'none';
    document.getElementById('quoteTemplateField').style.display = 'none';
    document.getElementById('quoteTitleField').style.display = 'none';
    document.getElementById('createQuoteBtn').style.display = 'none';
    document.getElementById('quoteResult').hidden = true;
  });

  // Load opportunities
  loadOpportunities(company.id);
  // Load templates if not already
  loadQuoteTemplates();
}

async function loadOpportunities(companyId, query) {
  const { tenantUrl, apiKey } = getCredentials();
  if (!tenantUrl || !apiKey) return;

  const field   = document.getElementById('opportunityField');
  const drop    = document.getElementById('opportunityDropdown');
  field.style.display = 'flex';
  drop.innerHTML = '<div class="company-option-empty">Loading…</div>';
  drop.hidden = false;

  try {
    const res  = await fetch(API_OPPS, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantUrl, apiKey, companyId, query: query || '' })
    });
    const data = await res.json();
    drop.innerHTML = '';

    if (!data.ok || !data.opportunities || data.opportunities.length === 0) {
      drop.innerHTML = '<div class="company-option-empty">No active opportunities found</div>';
      return;
    }

    data.opportunities.forEach(o => {
      const opt = document.createElement('div'); opt.className = 'company-option';
      opt.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:8px;';
      const nameSpan   = document.createElement('span'); nameSpan.textContent = o.name; nameSpan.style.flex = '1';
      const statusSpan = document.createElement('span');
      statusSpan.textContent = o.status || '';
      statusSpan.style.cssText = 'font-family:var(--mono);font-size:10px;color:var(--text-3);white-space:nowrap;';
      opt.appendChild(nameSpan); opt.appendChild(statusSpan);
      opt.addEventListener('click', () => selectOpportunity(o));
      drop.appendChild(opt);
    });
  } catch {
    drop.innerHTML = '<div class="company-option-empty">Failed to load opportunities</div>';
  }
}

function selectOpportunity(opp) {
  document.getElementById('opportunityDropdown').hidden = true;
  document.getElementById('opportunitySearch').value   = opp.name;
  document.getElementById('opportunitySearch').dataset.selectedId = opp.id;

  document.getElementById('quoteTemplateField').style.display = 'flex';
  document.getElementById('quoteTitleField').style.display    = 'flex';
  document.getElementById('createQuoteBtn').style.display     = 'flex';
  const qt = document.getElementById('quoteTitle');
  if (!qt.dataset.manuallyEdited) qt.value = document.getElementById('projectTitle').value || '';
}

document.getElementById('quoteTitle').addEventListener('input', function() {
  this.dataset.manuallyEdited = '1';
});

document.getElementById('createQuoteBtn').addEventListener('click', async () => {
  const opportunityId = document.getElementById('opportunitySearch').dataset.selectedId || '';
  if (!opportunityId) { showToast('Select an opportunity'); return; }

  const title      = document.getElementById('quoteTitle').value.trim() || (document.getElementById('projectTitle').value.trim() || 'Project Quote');
  const templateId = document.getElementById('quoteTemplateSelect').value || undefined;
  const { tenantUrl, apiKey } = getCredentials();

  // Build products list — rows with hours > 0 and a skuId
  const products = rows
    .filter(r => num(r.hours) > 0 && r.skuId)
    .map(r => ({ id: r.skuId, quantity: num(r.hours) }));

  if (products.length === 0) {
    showToast('No rows have both hours and a SKU assigned');
    return;
  }

  // Build note field — task breakdown
  const note = rows
    .filter(r => num(r.hours) > 0)
    .map(r => `Task: ${r.task || '(untitled)'} | Role: ${r.role || '—'} | Hours: ${r.hours}${r.notes ? ' | Notes: ' + r.notes : ''}`)
    .join('\n');

  const btn    = document.getElementById('createQuoteBtn');
  const result = document.getElementById('quoteResult');
  btn.disabled = true; btn.textContent = 'Creating…'; result.hidden = true;

  try {
    const res  = await fetch(API_QUOTE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantUrl, apiKey, opportunityId, title, templateId, products, note })
    });
    const data = await res.json();
    if (!data.ok) {
      const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error || 'Quote creation failed');
      throw new Error(errMsg);
    }

    const quoteUrl = data.quoteUrl || `${tenantUrl}/quotes/${data.quoteId}`;
    result.innerHTML = `✓ Quote created — <a href="${quoteUrl}" target="_blank" rel="noopener" style="color:var(--good);text-decoration:underline;">Open in Salesbuildr →</a>`;
    result.className = 'sb-result ok'; result.hidden = false;
    btn.innerHTML = '<i class="ti ti-file-invoice"></i> ✓ Created';
  } catch (e) {
    const errMsg = typeof e.message === 'string' ? e.message : JSON.stringify(e);
    result.textContent = `✕ ${errMsg}`; result.className = 'sb-result error'; result.hidden = false;
    btn.innerHTML = '<i class="ti ti-file-invoice"></i> Create quote';
    btn.disabled = false;
  }
});

function resetQuoteUI() {
  selectedCompany = null;
  document.getElementById('companySearch').value = '';
  document.getElementById('selectedCompanyDisplay').hidden = true;
  document.getElementById('opportunitySearch').value = '';
  document.getElementById('opportunitySearch').dataset.selectedId = '';
  document.getElementById('opportunityDropdown').hidden = true;
  document.getElementById('opportunityField').style.display    = 'none';
  document.getElementById('quoteTemplateField').style.display  = 'none';
  document.getElementById('quoteTitleField').style.display     = 'none';
  document.getElementById('createQuoteBtn').style.display      = 'none';
  document.getElementById('quoteResult').hidden = true;
}

// Close dropdowns on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.company-search-wrap') && !e.target.closest('.company-dropdown')) {
    document.getElementById('companyDropdown').hidden = true;
  }
  if (!e.target.closest('#opportunitySearch') && !e.target.closest('#opportunityDropdown')) {
    document.getElementById('opportunityDropdown').hidden = true;
  }
});

// ── AI Assistant ──────────────────────────────────────────
let aiPendingMode = null;

function addAiMessage(role, html, extraClass = '') {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}${extraClass ? ' ' + extraClass : ''}`;
  if (role === 'assistant') {
    div.innerHTML = `<div class="ai-msg-label">Assistant</div>${html}`;
  } else {
    div.innerHTML = `<div class="ai-msg-label" style="text-align:right">You</div>${html}`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addAiTyping() {
  const container = document.getElementById('aiMessages');
  const div = document.createElement('div');
  div.className = 'ai-typing'; div.id = 'aiTyping';
  div.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function removeAiTyping() {
  const el = document.getElementById('aiTyping'); if (el) el.remove();
}

async function sendAiMessage(userText, mode) {
  if (!userText.trim()) return;
  const btn = document.getElementById('aiSendBtn'); btn.disabled = true;
  addAiMessage('user', esc(userText).replace(/\n/g, '<br>'));
  addAiTyping();

  try {
    const payload = { mode: mode || 'chat', message: userText };
    if (mode === 'review' || mode === 'adjust') {
      payload.currentScope = {
        ...captureCurrentState(),
        tasks: rows.map(r => ({ task: r.task, role: r.role, skuId: r.skuId, hours: r.hours, notes: r.notes }))
      };
    }
    if (mode === 'generate' && catalog.length > 0) {
      payload.skus = catalog.map(s => ({ name: s.name, price: s.price }));
    }

    const res  = await fetch(API_AI, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    removeAiTyping();
    if (!res.ok) throw new Error(data.error || 'AI error');

    if (mode === 'generate' && data.tasks) {
      const taskPreview = data.tasks.slice(0, 5).map(t =>
        `<div class="ai-task-item"><strong>${esc(t.task)}</strong> — ${esc(t.role || '—')}, ${t.hours}h</div>`
      ).join('') + (data.tasks.length > 5 ? `<div class="ai-task-item" style="color:var(--accent);font-style:italic;">+ ${data.tasks.length - 5} more — click Apply to see all</div>` : '');

      const msgDiv = document.createElement('div');
      msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
        ${esc(data.message || `Generated ${data.tasks.length} tasks`)}
        <div class="ai-task-list">${taskPreview}</div>
        <button class="ai-apply-btn" id="aiApplyGenBtn"><i class="ti ti-check"></i> Apply to scope</button>`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      document.getElementById('aiApplyGenBtn').addEventListener('click', () => {
        // Match AI-suggested roles to catalog SKUs by name
        const appliedTasks = (data.tasks || []).map(t => {
          let skuId = '';
          const matchedSku = catalog.find(s => s.name.toLowerCase() === (t.role || '').toLowerCase());
          if (matchedSku) skuId = matchedSku.id;
          return { task: t.task || '', role: t.role || '', skuId, hours: String(t.hours || ''), notes: t.notes || '' };
        });
        applyState({
          projectTitle: data.projectTitle || document.getElementById('projectTitle').value,
          customerName: document.getElementById('customerName').value,
          hoursPerDay:  document.getElementById('hoursPerDay').value,
          overview:     data.overview     || document.getElementById('overview').value,
          exclusions:   data.exclusions   || document.getElementById('exclusions').value,
          rows:         appliedTasks
        });
        saveCurrentAsProject(data.projectTitle);
        renderProjects();
        showToast('Scope applied ✓');
        addAiMessage('assistant', '✅ Scope applied. Review tasks and assign any missing SKUs from the Role / SKU column.');
      });

    } else if ((mode === 'review' || mode === 'adjust') && data.feedback) {
      const feedbackHtml = (data.feedback || []).map(f =>
        `<div class="ai-feedback-item ai-feedback-${f.type}">${esc(f.text)}</div>`
      ).join('');

      let suggestBtn = '';
      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        suggestBtn = `<button class="ai-apply-btn" id="aiApplySugBtn" style="margin-top:6px"><i class="ti ti-plus"></i> Add ${data.suggestedTasks.length} suggested task${data.suggestedTasks.length > 1 ? 's' : ''}</button>`;
      }

      const msgDiv = document.createElement('div');
      msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
        ${esc(data.summary || 'Here\'s my review:')}
        <div style="margin-top:8px">${feedbackHtml}</div>
        ${suggestBtn}`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        document.getElementById('aiApplySugBtn')?.addEventListener('click', () => {
          const added = data.suggestedTasks.map(t => {
            let skuId = '';
            const matchedSku = catalog.find(s => s.name.toLowerCase() === (t.role || '').toLowerCase());
            if (matchedSku) skuId = matchedSku.id;
            return { task: t.task || '', role: t.role || '', skuId, hours: String(t.hours || ''), notes: t.notes || '' };
          });
          rows.push(...added);
          render(); updateSummary(); saveState();
          showToast(`Added ${data.suggestedTasks.length} tasks`);
          addAiMessage('assistant', `✅ Added ${data.suggestedTasks.length} task${data.suggestedTasks.length > 1 ? 's' : ''} to your scope.`);
        });
      }

    } else {
      addAiMessage('assistant', esc(data.text || '').replace(/\n/g, '<br>'));
    }

  } catch (err) {
    removeAiTyping();
    const errDiv = document.createElement('div');
    errDiv.className = 'ai-msg-error';
    errDiv.textContent = '⚠️ ' + (err.message || 'Something went wrong. Please try again.');
    document.getElementById('aiMessages').appendChild(errDiv);
  } finally {
    btn.disabled = false;
    aiPendingMode = null;
  }
}

// AI send button
document.getElementById('aiSendBtn').addEventListener('click', () => {
  const input = document.getElementById('aiInput');
  const text  = input.value.trim();
  if (!text) return;
  const mode = aiPendingMode || 'chat';
  input.value = '';
  sendAiMessage(text, mode);
});

document.getElementById('aiInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('aiSendBtn').click(); }
});

// AI suggestion chips
document.querySelectorAll('.ai-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const action = chip.dataset.action;
    const input  = document.getElementById('aiInput');
    if (action === 'generate') {
      aiPendingMode = 'generate';
      input.value = '';
      input.placeholder = 'Describe the project…';
      input.focus();
      addAiMessage('assistant', 'Describe the project in plain English and I\'ll generate a full scope — tasks, roles, hours, overview, and exclusions. ' +
        (catalog.length > 0 ? `I'll suggest specific SKUs from your ${catalog.length} loaded labor SKUs.` : 'Connect to Salesbuildr to get SKU suggestions.'));
    } else if (action === 'review') {
      input.value = '';
      input.placeholder = 'Any specific concerns? Or just press send…';
      sendAiMessage('Please review my current scope', 'review');
    } else if (action === 'adjust') {
      aiPendingMode = 'adjust';
      input.value = '';
      input.placeholder = 'e.g. "We only have 2 engineers and 4 weeks"';
      input.focus();
      addAiMessage('assistant', 'Tell me your constraints — team size, deadline, or budget — and I\'ll flag anything in the scope that needs adjusting.');
    }
  });
});

// ── Event listeners ───────────────────────────────────────
['projectTitle','customerName','overview','exclusions'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { saveState(); autoRefresh(); });
});
document.getElementById('hoursPerDay').addEventListener('input', () => { updateSummary(); saveState(); autoRefresh(); });

// Connect button
document.getElementById('connectBtn').addEventListener('click', connectToSalesbuildr);

// Preset loader
document.getElementById('loadPresetBtn').addEventListener('click', () => {
  const key = document.getElementById('presetSelect').value;
  if (!key) { showToast('Select a preset first'); return; }
  const p = PRESETS[key]; if (!p) return;
  if (rows.length > 0 && !confirm(`Load "${p.title}" preset? This will replace your current tasks.`)) return;
  rows = p.tasks.map(t => ({ ...t, skuId: '' }));
  document.getElementById('projectTitle').value = p.title;
  document.getElementById('overview').value     = p.overview;
  document.getElementById('exclusions').value   = p.exclusions;
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled    = true;
  render(); saveState(); showToast(`Loaded: ${p.title}`);
  saveCurrentAsProject(p.title); renderProjects();
});

// New project
document.getElementById('newProjectBtn').addEventListener('click', newProject);

// Add row
document.getElementById('addRowBtn').addEventListener('click', () => { rows.push(defaultRow()); render(); saveState(); });

// Clear
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear this project and start fresh?')) return;
  currentProjectId = null;
  newProject();
  localStorage.removeItem(LS_KEY);
});

// Generate widget
document.getElementById('generateBtn').addEventListener('click', () => {
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML   = html;
  document.getElementById('outputPanels').hidden = false;
  document.getElementById('copyBtn').disabled    = false;
  showToast('Widget generated'); saveState();
});

// Close output
document.getElementById('closeOutputBtn').addEventListener('click', () => {
  document.getElementById('outputPanels').hidden = true;
});

// Copy
document.getElementById('copyBtn').addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent;
  if (!html.trim()) return;
  try {
    await navigator.clipboard.writeText(html);
    showToast('Copied to clipboard');
  } catch {
    const ta = document.createElement('textarea'); ta.value = html; ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Copied (fallback)');
  }
});

// Passphrase
document.getElementById('tmplPassphrase').addEventListener('input', async () => {
  updatePassphraseUI();
  await renderTemplateSelect();
  updateCenterHeader();
});

// Template buttons
document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
  if (!isTeamMode()) { promptForPassphrase('save templates'); await renderTemplateSelect(); }
  const def  = document.getElementById('projectTitle').value.trim() || 'My Template';
  const name = prompt('Name this template:', def);
  if (!name?.trim()) return;
  const trimmed = name.trim();
  const btn   = document.getElementById('saveTemplateBtn');
  const entry = { name: trimmed, savedAt: new Date().toISOString(), ...captureCurrentState() };
  btn.disabled = true;
  try {
    if (isTeamMode()) {
      const hash = hashPassphrase(getPassphrase());
      const existing = (await teamGetIndex(hash)).includes(trimmed);
      if (existing && !confirm(`Replace team template "${trimmed}"?`)) { btn.disabled = false; return; }
      await teamSaveTemplate(hash, trimmed, entry);
      showToast(`"${trimmed}" saved for the team`);
    } else {
      const all = localGetAll(); const existing = all.findIndex(t => t.name === trimmed);
      if (existing >= 0) { if (!confirm(`Replace local template "${trimmed}"?`)) { btn.disabled = false; return; } all[existing] = entry; } else { all.push(entry); }
      localSaveAll(all); showToast(`"${trimmed}" saved locally`);
    }
    await renderTemplateSelect(); document.getElementById('templateSelect').value = trimmed;
  } catch { showToast('⚠️ Save failed — try again'); } finally { btn.disabled = false; }
});

document.getElementById('loadTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  const btn  = document.getElementById('loadTemplateBtn'); btn.disabled = true;
  try {
    let tmpl;
    if (isTeamMode()) { tmpl = await teamGetTemplate(hashPassphrase(getPassphrase()), name); }
    else { tmpl = localGetAll().find(t => t.name === name) || null; }
    if (!tmpl) { showToast('Template not found'); return; }
    if (rows.length && !confirm(`Load "${name}"? Current scope will be replaced.`)) return;
    applyState(tmpl); showToast(`"${name}" loaded`);
    saveCurrentAsProject(tmpl.projectTitle); renderProjects();
  } catch { showToast('⚠️ Load failed — try again'); } finally { btn.disabled = false; }
});

document.getElementById('deleteTemplateBtn').addEventListener('click', async () => {
  const name = document.getElementById('templateSelect').value; if (!name) return;
  const isTeam = isTeamMode();
  if (!confirm(isTeam ? `Delete team template "${name}"? This removes it for everyone.` : `Delete local template "${name}"?`)) return;
  const btn = document.getElementById('deleteTemplateBtn'); btn.disabled = true;
  try {
    if (isTeam) { await teamDeleteTemplate(hashPassphrase(getPassphrase()), name); }
    else { localSaveAll(localGetAll().filter(t => t.name !== name)); }
    await renderTemplateSelect(false); showToast(`"${name}" deleted`);
  } catch { showToast('⚠️ Delete failed — try again'); } finally { btn.disabled = false; }
});

// ── Init ──────────────────────────────────────────────────
(async function init() {
  const urlPreset = new URLSearchParams(window.location.search).get('preset');

  if (!urlPreset) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const hasTitle = (s.projectTitle || '').trim();
        const hasHours = (s.rows || []).some(r => num(r.hours) > 0);
        if (!hasTitle && !hasHours) localStorage.removeItem(LS_KEY);
      }
    } catch { localStorage.removeItem(LS_KEY); }
  }

  const hasSaved = urlPreset ? false : loadState();

  if (urlPreset && PRESETS[urlPreset]) {
    rows = PRESETS[urlPreset].tasks.map(t => ({ ...t, skuId: '' }));
    document.getElementById('projectTitle').value = PRESETS[urlPreset].title;
    document.getElementById('overview').value     = PRESETS[urlPreset].overview;
    document.getElementById('exclusions').value   = PRESETS[urlPreset].exclusions;
  } else if (!hasSaved) {
    rows = [defaultRow()];
  }

  if (!rows.length) rows = [defaultRow()];

  render();
  updatePassphraseUI();
  updateCenterHeader();
  renderProjects();
  initBrandColor();
  setupBrandColorListeners();
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('copyBtn').disabled    = true;
  await renderTemplateSelect();
  initCredentials();
})();
