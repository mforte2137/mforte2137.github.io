/* =========================================================
   Project Scope Builder — project-scope.js  (v2)
   Phases 2 + 3 + 4: three-column layout, projects, AI
   ========================================================= */

// ── Constants ─────────────────────────────────────────────
const LS_KEY       = 'sb_project_scope_v1';
const LS_PROJECTS  = 'sb_projects_v1';
const LS_BRAND_COLOR = 'sb_brand_color_v1';
let brandColor = localStorage.getItem(LS_BRAND_COLOR) || '#2563eb';

function saveBrandColor(color) {
  brandColor = color;
  localStorage.setItem(LS_BRAND_COLOR, color);
}

function initBrandColor() {
  const stored = localStorage.getItem(LS_BRAND_COLOR);
  if (stored) brandColor = stored;
  // Mark the matching swatch as active, or custom if no match
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
  // Preset swatches
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
  // Custom swatch — show hex input
  document.getElementById('brandCustomSwatch').addEventListener('click', () => {
    document.getElementById('brandHexRow').style.display = 'flex';
    document.getElementById('brandHexInput').focus();
  });
  // Apply custom hex
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

const LS_TEMPLATES  = 'sb_scope_templates_v1';
const LS_API_KEY   = 'sb_api_key';
const LS_INT_KEY   = 'sb_int_key';
const API_TEMPLATES = '/api/scope-templates';
const API_AI        = '/api/scope-ai';
const ROLES = ['PM', 'Senior Engineer', 'Engineer', 'Technician', 'Account Manager'];
const PROJ_COLORS = ['#3b82f6','#f97316','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#6366f1'];

// ── Utilities ─────────────────────────────────────────────
function esc(str) {
  return (str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function roundDisp(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }

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
  setTimeout(() => el.classList.remove('show'), 1800);
}

// ── Presets ───────────────────────────────────────────────
const PRESETS = {
  copilot: {
    title:     'Microsoft Copilot Readiness & Deployment',
    overview:  'This project prepares your Microsoft 365 environment for Copilot, deploys it to a pilot group, and drives adoption across your team. Before Copilot can be activated safely, your tenant data needs to be governed correctly — we handle the sensitivity labelling, SharePoint structure review, and security posture checks that most deployments skip, and that organisations later regret. The result is a Copilot deployment your staff actually use, with your business data protected.',
    exclusions:'Microsoft 365 Copilot licensing costs\nCustom Copilot Studio agent development (available as a separate engagement)\nThird-party AI tool integrations\nData migration or SharePoint redesign beyond the scope of Copilot readiness\nLegal or compliance review of AI acceptable-use policy',
    tasks: [
      { task:'Copilot Readiness Assessment', role:'Senior Engineer', hours:'8', notes:'Licensing eligibility, tenant configuration, security score, MFA status' },
      { task:'Data Governance Review — SharePoint & OneDrive', role:'Senior Engineer', hours:'12', notes:'Oversharing audit, orphaned sites, broad permissions, stale content' },
      { task:'Sensitivity Label Design & Implementation', role:'Senior Engineer', hours:'12', notes:'Label taxonomy, auto-labelling policies, default labels per site/library' },
      { task:'Information Barriers & Access Review', role:'Senior Engineer', hours:'8', notes:'Confirm no unintended data exposure before Copilot surfaces content' },
      { task:'Microsoft Purview Configuration', role:'Senior Engineer', hours:'8', notes:'DLP policies, retention labels, audit logging baseline' },
      { task:'Copilot Licensing Activation & Admin Centre Setup', role:'Engineer', hours:'4', notes:'License assignment, Copilot admin settings, web access policy' },
      { task:'Pilot Group Selection & Onboarding', role:'PM', hours:'4', notes:'5–15 users across key roles, briefing, feedback process setup' },
      { task:'Copilot in Teams — Configuration & Pilot', role:'Engineer', hours:'6', notes:'Meeting transcription, recap, call notes — test with pilot group' },
      { task:'Copilot in Outlook — Configuration & Pilot', role:'Engineer', hours:'4', notes:'Email summary, draft assist, thread summary — pilot validation' },
      { task:'Copilot in Word, Excel & PowerPoint — Pilot', role:'Engineer', hours:'4', notes:'Document generation, data analysis, presentation drafting' },
      { task:'Prompt Engineering Training — Pilot Group', role:'PM / Senior Engineer', hours:'6', notes:'How to write effective prompts, practical use cases per role' },
      { task:'Pilot Review & Feedback Analysis', role:'PM', hours:'4', notes:'Usage data review, feedback collation, blockers and wins documented' },
      { task:'Broad Rollout & Department Training', role:'PM / Engineer', hours:'12', notes:'Role-specific training sessions — how Copilot helps their actual job' },
      { task:'Copilot Adoption & Usage Reporting Setup', role:'Engineer', hours:'4', notes:'Microsoft 365 Copilot dashboard, usage metrics, value reporting' },
      { task:'AI Acceptable Use Policy — Template & Review', role:'PM', hours:'4', notes:'Draft policy for client review — what Copilot can and cannot be used for' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, stakeholder communications, milestone tracking' }
    ]
  },
  azure: {
    title:     'Azure Cloud Migration',
    overview:  'This project covers the full migration of your on-premises server infrastructure to Microsoft Azure, delivering improved reliability, scalability, and remote access — with minimal disruption to your team and day-to-day operations.',
    exclusions:'Application code changes or custom development\nThird-party vendor coordination beyond 2 hours per vendor\nEnd-user training (available as a separate engagement)\nHardware procurement and shipping costs\nMicrosoft licensing costs',
    tasks: [
      { task:'Project Kickoff & Planning', role:'PM', hours:'8', notes:'Scope confirmation, schedule, communication plan' },
      { task:'Azure Network Design & VPN Architecture', role:'Senior Engineer', hours:'8', notes:'Address space, subnets, gateway sizing' },
      { task:'Create & Configure Azure Virtual Network & VPN Gateway', role:'Senior Engineer', hours:'8', notes:'Includes site-to-site VPN to office(s)' },
      { task:'Create & Configure Azure Server VMs', role:'Engineer', hours:'48', notes:'VM provisioning, OS config, patching' },
      { task:'Security & Baseline Configuration', role:'Senior Engineer', hours:'24', notes:'NSGs, firewall rules, access controls' },
      { task:'Data Migration Planning & Validation', role:'Senior Engineer', hours:'24', notes:'Migration approach and test validation' },
      { task:'Migrate Data from On-Prem to Azure (standard servers)', role:'Engineer', hours:'48', notes:'File/data migration, integrity checks' },
      { task:'Migrate Data from On-Prem to Azure (vendor-supported, optional)', role:'Senior Engineer', hours:'36', notes:'Coordination and migration with vendor support' },
      { task:'Configure Workstations & Printers for New Network', role:'Engineer', hours:'24', notes:'DNS, drive mappings, printer updates' },
      { task:'Azure Virtual Desktop (AVD) Validation', role:'Senior Engineer', hours:'24', notes:'User access and performance validation (if applicable)' },
      { task:'User Acceptance & Environment Validation', role:'PM / Engineer', hours:'12', notes:'Confirmation Azure environment is fully working' },
      { task:'Decommission On-Prem VMs', role:'Engineer', hours:'12', notes:'Graceful shutdown, data verification' },
      { task:'Decommission On-Prem Hosts', role:'Engineer', hours:'4', notes:'Host retirement and cleanup' },
      { task:'Update Network & Process Documentation', role:'Engineer', hours:'8', notes:'Diagrams, runbooks, credentials handling' },
      { task:'Project Management (ongoing)', role:'PM', hours:'48', notes:'Status updates, stakeholder coordination, reporting' }
    ]
  },
  m365: {
    title:     'Microsoft 365 Migration',
    overview:  'This project covers the full migration from your current on-premises email and file infrastructure to Microsoft 365, including Exchange Online, SharePoint, Teams, and OneDrive — with a staged approach designed to minimize disruption during the transition.',
    exclusions:'Third-party application integrations not listed in scope\nCustom development or workflow automation\nEnd-user device setup beyond standard mail profile configuration\nMicrosoft 365 licensing costs\nData older than agreed retention period',
    tasks: [
      { task:'Project Kickoff & Tenant Assessment', role:'PM / Senior Engineer', hours:'8', notes:'Current environment review, license planning' },
      { task:'DNS & Domain Configuration', role:'Engineer', hours:'4', notes:'MX, SPF, DKIM, DMARC records' },
      { task:'Exchange Online Setup & Mail Flow', role:'Senior Engineer', hours:'8', notes:'Connectors, hybrid config, mail routing' },
      { task:'Mailbox Migration — Batch 1', role:'Engineer', hours:'16', notes:'Priority users, pilot group' },
      { task:'Mailbox Migration — Remaining Users', role:'Engineer', hours:'24', notes:'Full organization migration, integrity checks' },
      { task:'SharePoint Online Setup & Structure', role:'Senior Engineer', hours:'12', notes:'Sites, libraries, permissions' },
      { task:'File Data Migration to SharePoint / OneDrive', role:'Engineer', hours:'16', notes:'On-prem file shares to cloud storage' },
      { task:'Microsoft Teams Setup & Policies', role:'Engineer', hours:'8', notes:'Teams, channels, meeting policies' },
      { task:'Security & Compliance Configuration', role:'Senior Engineer', hours:'12', notes:'MFA, Conditional Access, DLP policies' },
      { task:'Cutover Planning & Execution', role:'Senior Engineer', hours:'8', notes:'MX record cutover, final sync' },
      { task:'User Onboarding & Orientation', role:'PM / Engineer', hours:'12', notes:'Profile setup, Outlook config, basic guidance' },
      { task:'Post-Migration Validation & Support', role:'Engineer', hours:'16', notes:'30-day hypercare, issue resolution' },
      { task:'Documentation Update', role:'Engineer', hours:'4', notes:'Updated environment docs, admin guide' },
      { task:'Project Management', role:'PM', hours:'24', notes:'Scheduling, status reporting, stakeholder comms' }
    ]
  },
  network: {
    title:     'Network Infrastructure Upgrade',
    overview:  'This project delivers a full replacement and modernisation of your existing network infrastructure, including next-generation firewall, managed switching, structured cabling, and wireless access points — installed after hours to ensure zero disruption to your team.',
    exclusions:'Structured cabling beyond agreed scope (additional runs quoted separately)\nISP or WAN circuit changes\nThird-party equipment not supplied through this engagement\nAV or physical security systems\nBuilding access or facilities coordination',
    tasks: [
      { task:'Site Survey & Current Environment Assessment', role:'Senior Engineer', hours:'8', notes:'Cabling audit, device inventory, coverage mapping' },
      { task:'Network Design & Architecture', role:'Senior Engineer', hours:'8', notes:'IP addressing, VLANs, segmentation design' },
      { task:'Procurement & Equipment Staging', role:'PM', hours:'4', notes:'Order management, pre-configuration' },
      { task:'Firewall Installation & Configuration', role:'Senior Engineer', hours:'12', notes:'Rules, NAT, VPN, remote access policies' },
      { task:'Core Switch Deployment', role:'Engineer', hours:'8', notes:'Uplink config, VLAN tagging, redundancy' },
      { task:'Access Switch Deployment', role:'Engineer', hours:'12', notes:'Port config, PoE, patch panel connections' },
      { task:'Structured Cabling Installation', role:'Engineer', hours:'24', notes:'Cat6A runs, faceplates, patch panel termination' },
      { task:'Wireless Access Point Deployment', role:'Engineer', hours:'8', notes:'Controller config, SSID setup, coverage validation' },
      { task:'VLAN & Network Segmentation', role:'Senior Engineer', hours:'8', notes:'Traffic isolation, guest network, IoT separation' },
      { task:'WAN / Internet Failover Configuration', role:'Senior Engineer', hours:'6', notes:'Dual-WAN setup or failover routing' },
      { task:'Site-to-Site VPN (if applicable)', role:'Senior Engineer', hours:'6', notes:'Branch connectivity or cloud VPN' },
      { task:'Network Testing & Validation', role:'Senior Engineer', hours:'8', notes:'Throughput, failover, segmentation testing' },
      { task:'Workstation & Printer Reconnection', role:'Engineer', hours:'8', notes:'DNS updates, drive mappings, printer config' },
      { task:'Network Documentation & Diagrams', role:'Engineer', hours:'6', notes:'Topology diagrams, VLAN tables, port mapping' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, vendor coordination, comms' }
    ]
  },
  onboarding: {
    title:     'New Client Onboarding',
    overview:  'This project transitions your organization onto our managed services platform, establishing monitoring, security, backup, and support processes — giving your team a reliable, proactive IT partner from day one.',
    exclusions:'Hardware procurement or replacement\nSoftware licensing costs\nMajor remediation work identified during assessment (quoted separately)\nEnd-user training beyond basic helpdesk introduction\nThird-party vendor account setup',
    tasks: [
      { task:'Kickoff Meeting & Discovery', role:'PM', hours:'4', notes:'Goals, contacts, priorities, schedule' },
      { task:'Environment Assessment & Asset Inventory', role:'Senior Engineer', hours:'8', notes:'Servers, workstations, network devices, software' },
      { task:'RMM Agent Deployment', role:'Engineer', hours:'8', notes:'Monitoring and management agent on all devices' },
      { task:'Security Baseline Configuration', role:'Senior Engineer', hours:'8', notes:'Password policies, admin accounts, baseline hardening' },
      { task:'Endpoint Protection Deployment', role:'Engineer', hours:'6', notes:'AV/EDR deployment and policy configuration' },
      { task:'Backup Solution Setup', role:'Engineer', hours:'8', notes:'BDR agent, policy config, initial backup run' },
      { task:'Email Security Configuration', role:'Senior Engineer', hours:'6', notes:'SPF, DKIM, DMARC, anti-spam, anti-phishing' },
      { task:'MFA & Identity Setup', role:'Senior Engineer', hours:'6', notes:'MFA enforcement, admin account review' },
      { task:'Patch Management Configuration', role:'Engineer', hours:'4', notes:'Patch schedule, approval workflows, reporting' },
      { task:'Network & Environment Documentation', role:'Senior Engineer', hours:'6', notes:'Topology, credentials vault, asset register' },
      { task:'Helpdesk Onboarding & Ticketing Setup', role:'PM', hours:'4', notes:'Ticket routing, escalation paths, contacts' },
      { task:'Staff Introduction & Communication', role:'PM', hours:'2', notes:'Team intro email, helpdesk contact info' },
      { task:'30-Day Review & Optimisation', role:'Senior Engineer', hours:'4', notes:'Alert tuning, policy adjustments, initial report' }
    ]
  },
  security: {
    title:     'Cybersecurity & Compliance Assessment',
    overview:  'This engagement delivers a comprehensive assessment of your organization\'s current cybersecurity posture and compliance position, identifying vulnerabilities, gaps, and risks — with a prioritized remediation roadmap and executive-level findings report.',
    exclusions:'Remediation implementation (available as a follow-on engagement)\nPhysical security assessment\nSocial engineering or phishing simulation exercises\nCompliance certification or audit submission\nThird-party system access not granted during the assessment window',
    tasks: [
      { task:'Scoping & Kickoff', role:'PM', hours:'4', notes:'Scope agreement, access requirements, schedule' },
      { task:'External Attack Surface Scan', role:'Senior Engineer', hours:'8', notes:'Internet-facing assets, open ports, exposed services' },
      { task:'Internal Vulnerability Assessment', role:'Senior Engineer', hours:'8', notes:'Network, server, and endpoint vulnerability scan' },
      { task:'Active Directory Security Review', role:'Senior Engineer', hours:'8', notes:'Privilege review, group policies, stale accounts' },
      { task:'Email Security Assessment', role:'Senior Engineer', hours:'6', notes:'SPF/DKIM/DMARC, filtering, phishing exposure' },
      { task:'Firewall & Network Policy Review', role:'Senior Engineer', hours:'6', notes:'Rule audit, segmentation, VPN config review' },
      { task:'Endpoint Security Review', role:'Engineer', hours:'8', notes:'AV/EDR coverage, patch status, USB/removable media' },
      { task:'Backup & DR Review', role:'Engineer', hours:'4', notes:'Coverage, retention, last-tested date, recovery capability' },
      { task:'Cloud Security Review (Microsoft 365 / Azure)', role:'Senior Engineer', hours:'8', notes:'Tenant config, MFA, Conditional Access, Shadow IT' },
      { task:'Risk Scoring & Findings Analysis', role:'Senior Engineer', hours:'12', notes:'CVSS scoring, business impact mapping, prioritisation' },
      { task:'Executive Report Preparation', role:'PM / Senior Engineer', hours:'8', notes:'Non-technical summary, risk heat map, key findings' },
      { task:'Remediation Roadmap Development', role:'Senior Engineer', hours:'8', notes:'Prioritised action plan with effort estimates' },
      { task:'Findings Presentation', role:'PM', hours:'4', notes:'Walkthrough with key stakeholders, Q&A' }
    ]
  },
  backup: {
    title:     'Backup & Disaster Recovery Implementation',
    overview:  'This project designs and deploys a comprehensive backup and disaster recovery solution covering your servers, endpoints, and cloud data — including documented recovery procedures and tested restore capability to meet your business continuity and cyber insurance requirements.',
    exclusions:'Off-site hardware colocation or data centre costs\nBackup software licensing costs\nThird-party cloud storage costs beyond agreed capacity\nRecovery exercises beyond those included in scope\nApplication-level recovery for custom-built or bespoke systems',
    tasks: [
      { task:'Assessment & Solution Design', role:'Senior Engineer', hours:'6', notes:'RPO/RTO requirements, data volume, retention policy' },
      { task:'Solution Selection & Procurement', role:'PM', hours:'4', notes:'Vendor recommendation, licensing, hardware ordering' },
      { task:'BDR Appliance Installation & Configuration', role:'Engineer', hours:'8', notes:'Physical or virtual appliance setup' },
      { task:'Server Backup Policy Configuration', role:'Senior Engineer', hours:'8', notes:'Schedules, retention, exclusions, verification' },
      { task:'Workstation / Endpoint Backup Configuration', role:'Engineer', hours:'8', notes:'Agent deployment, policy, selective backup' },
      { task:'Cloud Replication Setup', role:'Senior Engineer', hours:'6', notes:'Off-site cloud backup target, encryption, throttling' },
      { task:'Microsoft 365 Backup Configuration', role:'Engineer', hours:'4', notes:'Exchange, SharePoint, Teams, OneDrive' },
      { task:'Initial Backup Run & Validation', role:'Senior Engineer', hours:'4', notes:'Full backup completion, integrity verification' },
      { task:'File-Level Recovery Test', role:'Senior Engineer', hours:'4', notes:'Documented restore from backup with sign-off' },
      { task:'Bare Metal / VM Recovery Test', role:'Senior Engineer', hours:'6', notes:'Full system recovery test, RTO validation' },
      { task:'DR Plan Documentation', role:'PM / Senior Engineer', hours:'8', notes:'Step-by-step recovery runbook, contact list' },
      { task:'Staff Handover & Training', role:'PM', hours:'4', notes:'Admin training, monitoring dashboard walkthrough' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, vendor coordination, reporting' }
    ]
  },
  endpoint: {
    title:     'Endpoint Refresh & Device Deployment',
    overview:  'This project replaces aging workstations and laptops across your organization — ensuring all staff are on modern, supported hardware ahead of the Windows 10 end-of-life deadline. Devices will be pre-configured, data migrated, and handed over with minimal disruption to each user.',
    exclusions:'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nData that cannot be located or accessed on the old device\nPersonal files or non-business data\nPrinter or peripheral setup beyond standard USB connection',
    tasks: [
      { task:'Asset Audit & Device Inventory', role:'Engineer', hours:'4', notes:'Catalogue all existing devices, specs, age and OS version' },
      { task:'New Device Specification & Procurement', role:'PM', hours:'4', notes:'Hardware selection, ordering, delivery tracking' },
      { task:'Image & Build Preparation', role:'Senior Engineer', hours:'8', notes:'Standard image creation, software stack, policies' },
      { task:'Device Imaging & Pre-configuration', role:'Engineer', hours:'16', notes:'OS imaging, domain join, software deployment per device' },
      { task:'Data Migration — User Files & Profile', role:'Engineer', hours:'24', notes:'Documents, desktop, browser favourites, Outlook PST' },
      { task:'Application Configuration per User', role:'Engineer', hours:'16', notes:'Line-of-business apps, email profile, mapped drives, printers' },
      { task:'BitLocker & Security Policy Enforcement', role:'Senior Engineer', hours:'4', notes:'Encryption, screen lock, endpoint protection agent' },
      { task:'Intune / MDM Enrolment', role:'Senior Engineer', hours:'8', notes:'Device enrolment, compliance policies, app deployment' },
      { task:'User Handover & Orientation', role:'Engineer', hours:'8', notes:'New device walkthrough, key differences, helpdesk contact' },
      { task:'Old Device Wipe & Disposal', role:'Engineer', hours:'8', notes:'Secure data wipe, WEEE disposal or trade-in coordination' },
      { task:'Windows 10 EOL Communication & Documentation', role:'PM', hours:'4', notes:'Timeline comms, asset register update, completion sign-off' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, user communications, progress tracking' }
    ]
  },
  voip: {
    title:     'VoIP & Business Communications Upgrade',
    overview:  'This project replaces your existing phone system with a modern cloud-based VoIP or UCaaS solution — delivering reliable business communications, mobile flexibility, and Microsoft Teams integration. Number porting, hardware installation, and user training are included to ensure a smooth cutover.',
    exclusions:'Ongoing SIP trunk or UCaaS subscription costs\nISP or internet circuit upgrades (quoted separately if required)\nCabling or structured wiring beyond standard patch cable runs\nCustom auto-attendant scripting beyond agreed call flows\nThird-party application integrations not listed in scope',
    tasks: [
      { task:'Current System Audit & Requirements Gathering', role:'Senior Engineer', hours:'6', notes:'Existing numbers, call flows, voicemail, hunt groups, fax lines' },
      { task:'Internet & Network Readiness Assessment', role:'Senior Engineer', hours:'4', notes:'Bandwidth, QoS capability, VLAN design for voice traffic' },
      { task:'Solution Design & Call Flow Planning', role:'Senior Engineer', hours:'8', notes:'Auto-attendant, hunt groups, voicemail, hold music, hours' },
      { task:'Number Porting Coordination', role:'PM', hours:'6', notes:'LOA submission, carrier liaison, porting schedule management' },
      { task:'UCaaS / Teams Voice Tenant Configuration', role:'Senior Engineer', hours:'8', notes:'Licensing, dial plan, emergency locations, policy assignment' },
      { task:'QoS & Network Configuration for Voice', role:'Senior Engineer', hours:'6', notes:'VLAN tagging, traffic prioritisation, firewall rules' },
      { task:'VoIP Hardware Deployment', role:'Engineer', hours:'12', notes:'Desk phone provisioning, headsets, ATA adapters for fax/analogue' },
      { task:'Auto-Attendant & Call Flow Configuration', role:'Senior Engineer', hours:'8', notes:'IVR menus, business hours, after-hours routing, voicemail-to-email' },
      { task:'Microsoft Teams Voice Integration', role:'Senior Engineer', hours:'8', notes:'Direct Routing or Calling Plans, Teams app configuration' },
      { task:'User Provisioning & Extension Assignment', role:'Engineer', hours:'8', notes:'DDI assignment, voicemail setup, softphone configuration' },
      { task:'Testing & Pre-Cutover Validation', role:'Senior Engineer', hours:'6', notes:'Inbound/outbound calls, hunt groups, failover, emergency dialling' },
      { task:'Cutover Execution', role:'Senior Engineer', hours:'4', notes:'Number activation, final routing switch, live monitoring' },
      { task:'User Training & Handover', role:'PM / Engineer', hours:'8', notes:'Handset use, Teams calling, voicemail, call transfer walkthrough' },
      { task:'Post-Cutover Support & Optimisation', role:'Engineer', hours:'8', notes:'48-72hr hypercare, issue resolution, call quality tuning' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, number porting liaison, stakeholder communications' }
    ]
  },
  server: {
    title:     'Server Refresh & Hardware Deployment',
    overview:  'This project replaces your existing server hardware with new equipment, migrating all roles, services, and data with minimal downtime — leaving your environment fully documented and supported on modern, warrantied infrastructure.',
    exclusions:'Hardware procurement costs (quoted separately)\nSoftware or operating system licensing costs\nMicrosoft 365 or cloud migrations (available as a separate engagement)\nEnd-user device setup\nData older than agreed retention period',
    tasks: [
      { task:'Current Environment Assessment', role:'Senior Engineer', hours:'8', notes:'Server roles, services, data volumes, dependencies' },
      { task:'Migration Planning & Risk Assessment', role:'PM / Senior Engineer', hours:'6', notes:'Cutover approach, rollback plan, schedule' },
      { task:'Procurement & Hardware Staging', role:'PM', hours:'4', notes:'Order tracking, pre-config, rack preparation' },
      { task:'New Server OS Installation & Patching', role:'Engineer', hours:'8', notes:'Base OS build, drivers, security baseline' },
      { task:'Active Directory, DNS & DHCP Migration', role:'Senior Engineer', hours:'12', notes:'Role migration, replication, cutover' },
      { task:'Application Server Migration', role:'Senior Engineer', hours:'16', notes:'Line-of-business apps, databases, dependencies' },
      { task:'File Server Data Migration', role:'Engineer', hours:'16', notes:'Share migration, permissions, DFS replication' },
      { task:'Backup Configuration on New Hardware', role:'Engineer', hours:'6', notes:'BDR agent, policies, initial backup run' },
      { task:'Network Integration & Testing', role:'Senior Engineer', hours:'6', notes:'IP addressing, VLAN, connectivity validation' },
      { task:'Workstation Reconfiguration', role:'Engineer', hours:'12', notes:'Drive mappings, printers, application shortcuts' },
      { task:'User Acceptance Testing', role:'Senior Engineer', hours:'6', notes:'Sign-off testing with key users' },
      { task:'Old Server Decommission', role:'Engineer', hours:'6', notes:'Data wipe verification, hardware retirement' },
      { task:'Environment Documentation Update', role:'Engineer', hours:'4', notes:'Updated diagrams, asset register, admin guide' },
      { task:'Project Management', role:'PM', hours:'16', notes:'Scheduling, stakeholder updates, sign-off' }
    ]
  }
};

// ── State ─────────────────────────────────────────────────
let rows = [];
let currentProjectId = null;

function defaultRow() { return { task:'', role:'', hours:'', notes:'' }; }

// ── Project ID generation ─────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

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
    badge.textContent = '🔗 Team';
    badge.className = 'lp-badge lp-badge-team';
    if (label) label.textContent = '(team — shared)';
  } else {
    badge.textContent = '💾 Local';
    badge.className = 'lp-badge lp-badge-local';
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
  const input = document.getElementById('tmplPassphrase');
  const phrase = prompt(`No team passphrase set.\n\nEnter a passphrase to ${action} with your team, or leave blank for local storage.`);
  if (phrase === null) return false;
  if (phrase.trim().length > 0) { input.value = phrase.trim(); updatePassphraseUI(); return true; }
  return false;
}

// ── Projects (Phase 3) ────────────────────────────────────
function getProjects() { try { return JSON.parse(localStorage.getItem(LS_PROJECTS)) || []; } catch { return []; } }
function saveProjects(projects) { localStorage.setItem(LS_PROJECTS, JSON.stringify(projects)); }

function captureCurrentState() {
  return {
    projectTitle: document.getElementById('projectTitle').value,
    customerName: document.getElementById('customerName').value,
    hoursPerDay:  document.getElementById('hoursPerDay').value,
    overview:     document.getElementById('overview').value,
    exclusions:   document.getElementById('exclusions').value,
    showRole:     document.getElementById('showRole').checked,
    showHours:    document.getElementById('showHours').checked,
    showNotes:    document.getElementById('showNotes').checked,
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
    const color = PROJ_COLORS[i % PROJ_COLORS.length];
    const isShared = !!p.shared;
    const totalHrs = (p.rows || []).reduce((s, r) => s + num(r.hours), 0);
    const ago = p.updatedAt ? relativeTime(p.updatedAt) : 'new';
    item.innerHTML = `
      <div class="lp-proj-dot" style="background:${color}"></div>
      <div class="lp-proj-info">
        <div class="lp-proj-name">${esc(p.projectTitle || 'Untitled project')}</div>
        <div class="lp-proj-meta">${esc(p.customerName || '')}${p.customerName ? ' · ' : ''}${totalHrs}h · ${ago}</div>
      </div>
      <span class="lp-proj-badge ${isShared ? 'lp-proj-badge-shared' : 'lp-proj-badge-local'}">${isShared ? 'shared' : 'local'}</span>
      <span class="lp-proj-delete" title="Delete project" data-id="${esc(p.id)}"><i class="ti ti-x"></i></span>
    `;
    item.addEventListener('click', (e) => {
      if (e.target.closest('.lp-proj-delete')) return;
      switchToProject(p.id);
    });
    item.querySelector('.lp-proj-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProject(p.id);
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
  const projects = getProjects();
  const p = projects.find(proj => proj.id === id);
  if (!p) return;
  currentProjectId = id;
  applyState(p);
  renderProjects();
  updateCenterHeader();
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
    // Start fresh
    rows = [defaultRow()];
    document.getElementById('projectTitle').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('overview').value = '';
    document.getElementById('exclusions').value = '';
    render(); updateSummary();
  }
  renderProjects();
  showToast('Project deleted');
}

function saveCurrentAsProject(title) {
  const projects = getProjects();
  const state = captureCurrentState();
  const isShared = isTeamMode();
  if (currentProjectId) {
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], ...state, updatedAt: new Date().toISOString(), shared: isShared };
      saveProjects(projects);
      renderProjects();
      return;
    }
  }
  const newProj = { id: genId(), ...state, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), shared: isShared };
  projects.push(newProj);
  currentProjectId = newProj.id;
  saveProjects(projects);
  renderProjects();
}

function newProject() {
  autoSaveCurrentProject();
  currentProjectId = null;
  rows = [defaultRow()];
  document.getElementById('projectTitle').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('hoursPerDay').value = '8';
  document.getElementById('overview').value = '';
  document.getElementById('exclusions').value = '';
  document.getElementById('presetSelect').value = '';
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML = '';
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('copyBtn').disabled = true;
  render(); updateSummary(); renderProjects(); updateCenterHeader();
  saveState();  // persist blank state so reload doesn't restore old data
  showToast('New project started');
}

function updateCenterHeader() {
  const title    = document.getElementById('projectTitle').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  document.getElementById('centerTitle').textContent = title || 'Project Scope Builder';
  let sub = title ? '' : 'Start by loading a preset or entering your project details';
  if (title && customer) sub = customer + (isTeamMode() ? ' · 🔗 shared with team' : '');
  else if (title) sub = isTeamMode() ? '🔗 Shared with team' : '💾 Local project';
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
    document.getElementById('showRole').checked   = s.showRole  !== false;
    document.getElementById('showHours').checked  = s.showHours === true;
    document.getElementById('showNotes').checked  = s.showNotes !== false;
    rows = s.rows;
    return true;
  } catch { return false; }
}

function applyState(s) {
  document.getElementById('projectTitle').value = s.projectTitle ?? '';
  document.getElementById('customerName').value = s.customerName ?? '';
  document.getElementById('hoursPerDay').value  = s.hoursPerDay  ?? 8;
  document.getElementById('overview').value     = s.overview     ?? '';
  document.getElementById('exclusions').value   = s.exclusions   ?? '';
  document.getElementById('showRole').checked   = s.showRole  !== false;
  document.getElementById('showHours').checked  = s.showHours === true;
  document.getElementById('showNotes').checked  = s.showNotes !== false;
  rows = (s.rows || []).map(r => ({ ...r }));
  render(); updateSummary(); saveState(); updateCenterHeader();
}

// ── Render task grid ──────────────────────────────────────
function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  const hpd = document.getElementById('hoursPerDay').value;
  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;

    const tdDrag = document.createElement('td'); tdDrag.className = 'col-drag';
    tdDrag.innerHTML = '<div class="drag-handle" title="Drag to reorder">⠿</div>';

    const tdTask = document.createElement('td'); tdTask.className = 'col-task';
    const inTask = document.createElement('input'); inTask.type = 'text'; inTask.value = r.task || ''; inTask.placeholder = 'Task description';
    inTask.addEventListener('input', e => { rows[idx].task = e.target.value; saveState(); autoRefresh(); });
    tdTask.appendChild(inTask);

    const tdRole = document.createElement('td'); tdRole.className = 'col-role';
    tdRole.appendChild(buildRoleSelect(r.role, idx));

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

// ── Role multi-select ─────────────────────────────────────
function buildRoleSelect(currentRole, idx) {
  const selected       = (currentRole || '').split(' / ').map(r => r.trim()).filter(Boolean);
  const knownSelected  = selected.filter(r => ROLES.includes(r));
  const customSelected = selected.filter(r => !ROLES.includes(r));
  const wrap = document.createElement('div'); wrap.className = 'role-select';
  const trigger = document.createElement('button'); trigger.type = 'button';
  trigger.className = 'role-trigger' + (selected.length ? '' : ' placeholder');
  trigger.textContent = selected.length ? selected.join(' / ') : 'Select roles…';
  const dropdown = document.createElement('div'); dropdown.className = 'role-dropdown'; dropdown.hidden = true;
  ROLES.forEach(role => {
    const label = document.createElement('label'); label.className = 'role-option';
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = role; cb.checked = knownSelected.includes(role);
    cb.addEventListener('change', () => updateRoleSelection(dropdown, trigger, idx));
    label.appendChild(cb); label.appendChild(document.createTextNode(' ' + role)); dropdown.appendChild(label);
  });
  const divider = document.createElement('div'); divider.className = 'role-divider'; dropdown.appendChild(divider);
  const customWrap = document.createElement('div'); customWrap.className = 'role-custom-wrap';
  const customInput = document.createElement('input'); customInput.type = 'text'; customInput.className = 'role-custom'; customInput.placeholder = 'Other…'; customInput.value = customSelected.join(' / ');
  customInput.addEventListener('input', () => updateRoleSelection(dropdown, trigger, idx));
  customInput.addEventListener('click', e => e.stopPropagation());
  customWrap.appendChild(customInput); dropdown.appendChild(customWrap);
  trigger.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.role-dropdown').forEach(d => { if (d !== dropdown) d.hidden = true; });
    dropdown.hidden = !dropdown.hidden;
  });
  wrap.appendChild(trigger); wrap.appendChild(dropdown);
  return wrap;
}

function updateRoleSelection(dropdown, trigger, idx) {
  const parts = [];
  dropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => parts.push(cb.value));
  const custom = dropdown.querySelector('.role-custom').value.trim();
  if (custom) parts.push(custom);
  const roleStr = parts.join(' / ');
  rows[idx].role = roleStr;
  trigger.textContent = roleStr || 'Select roles…';
  trigger.classList.toggle('placeholder', !roleStr);
  saveState(); autoRefresh();
}

document.addEventListener('click', () => {
  document.querySelectorAll('.role-dropdown').forEach(d => d.hidden = true);
});

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
  let total = 0, included = 0;
  rows.forEach(r => { const h = num(r.hours); if (h > 0) { total += h; included++; } });
  document.getElementById('totalHours').textContent    = roundDisp(total);
  document.getElementById('totalDuration').textContent = totalDurationStr(total, hpd);
  document.getElementById('includedCount').textContent = included;
}

// ── Widget HTML generation ────────────────────────────────
function generateWidget() {
  const title      = (document.getElementById('projectTitle').value || '').trim();
  const customer   = (document.getElementById('customerName').value || '').trim();
  const overview   = (document.getElementById('overview').value     || '').trim();
  const exclusions = (document.getElementById('exclusions').value   || '').trim();
  const hpd        = document.getElementById('hoursPerDay').value;
  const showRole   = document.getElementById('showRole').checked;
  const showHours  = document.getElementById('showHours').checked;
  const showNotes  = document.getElementById('showNotes').checked;

  // Derive a subtle tint (8% opacity) of the brand color for alternating rows
  // Works by converting hex to rgb and applying rgba
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
    .map(r => ({ task:(r.task||'').trim(), role:(r.role||'').trim(), notes:(r.notes||'').trim(), hours:num(r.hours) }))
    .filter(r => r.hours > 0 && (r.task || r.role || r.notes));
  const total    = included.reduce((s, r) => s + r.hours, 0);
  const duration = totalDurationStr(total, hpd);
  const colCount = 1 + (showRole?1:0) + (showHours?1:0) + (showNotes?1:0);

  // ── Table header row ──
  const thCols = [`<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;">Task</th>`];
  if (showRole)  thCols.push(`<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;white-space:nowrap;">Role</th>`);
  if (showHours) thCols.push(`<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;white-space:nowrap;">Hours</th>`);
  if (showNotes) thCols.push(`<th style="text-align:left;padding:9px 12px;border:1px solid #e2e8f0;background:${brandColor};color:#ffffff;font-size:13px;font-weight:600;">Notes</th>`);

  // ── Task rows — alternating tint ──
  const tbRows = included.map((r, i) => {
    const bg = i % 2 === 1 ? `background:${rowTint};` : '';
    const cells = [`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}"><strong>${esc(r.task)}</strong></td>`];
    if (showRole)  cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;${bg}">${esc(r.role)}</td>`);
    if (showHours) cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;${bg}">${esc(roundDisp(r.hours))}</td>`);
    if (showNotes) cells.push(`<td style="padding:8px 12px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;${bg}">${esc(r.notes)}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  }).join('\n      ');

  // ── Totals row — brand tint background ──
  const totalsRow = `<tr>
    <td colspan="${colCount}" style="padding:9px 12px;border:1px solid #e2e8f0;font-size:13px;background:${totalTint};">
      <strong style="color:${brandColor};">Total Effort:</strong> <strong>${esc(roundDisp(total))} hours</strong>${duration !== '—' ? `&nbsp;&nbsp;·&nbsp;&nbsp;<strong style="color:${brandColor};">Estimated Duration:</strong> <strong>${esc(duration)}</strong>` : ''}
    </td>
  </tr>`;

  // ── Exclusions ──
  const exLines = exclusions.split('\n').map(l => l.trim()).filter(Boolean);
  const exclusionsHtml = exLines.length > 0 ? `
<h3 style="margin:24px 0 8px;font-size:14px;font-weight:700;color:${brandColor};text-transform:uppercase;letter-spacing:.05em;">What's Not Included</h3>
<ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:1.8;">
  ${exLines.map(l => `<li>${esc(l)}</li>`).join('\n  ')}
</ul>` : '';

  // ── Assemble ──
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
  // Only update output if panels are already visible — never auto-show them
  const panels = document.getElementById('outputPanels');
  if (!panels || panels.hidden) return;
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML = html;
}

// ── AI Assistant (Phase 4) ────────────────────────────────
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
  const el = document.getElementById('aiTyping');
  if (el) el.remove();
}

async function sendAiMessage(userText, mode) {
  if (!userText.trim()) return;
  const btn = document.getElementById('aiSendBtn');
  btn.disabled = true;

  addAiMessage('user', esc(userText).replace(/\n/g, '<br>'));
  addAiTyping();

  try {
    const payload = { mode: mode || 'chat', message: userText };
    if (mode === 'review' || mode === 'adjust') {
      payload.currentScope = {
        ...captureCurrentState(),
        tasks: rows.map(r => ({ task: r.task, role: r.role, hours: r.hours, notes: r.notes }))
      };
    }

    const res  = await fetch(API_AI, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    removeAiTyping();

    if (!res.ok) throw new Error(data.error || 'AI error');

    if (mode === 'generate' && data.tasks) {
      // Build preview of tasks
      const taskPreview = data.tasks.slice(0, 5).map(t =>
        `<div class="ai-task-item"><strong>${esc(t.task)}</strong> — ${esc(t.role)}, ${t.hours}h</div>`
      ).join('') + (data.tasks.length > 5 ? `<div class="ai-task-item" style="color:var(--accent);font-style:italic;">+ ${data.tasks.length - 5} more tasks — click Apply to see all</div>` : '');

      const msgDiv = document.createElement('div');
      msgDiv.className = 'ai-msg ai-msg-assistant';
      msgDiv.innerHTML = `<div class="ai-msg-label">Assistant</div>
        ${esc(data.message || `Generated ${data.tasks.length} tasks for "${data.projectTitle}"`)}
        <div class="ai-task-list">${taskPreview}</div>
        <button class="ai-apply-btn" id="aiApplyGenBtn"><i class="ti ti-check"></i> Apply to scope</button>`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      document.getElementById('aiApplyGenBtn').addEventListener('click', () => {
        applyState({
          projectTitle: data.projectTitle || document.getElementById('projectTitle').value,
          customerName: document.getElementById('customerName').value,
          hoursPerDay:  document.getElementById('hoursPerDay').value,
          overview:     data.overview || document.getElementById('overview').value,
          exclusions:   data.exclusions || document.getElementById('exclusions').value,
          showRole: true, showHours: false, showNotes: true,
          rows: data.tasks
        });
        saveCurrentAsProject(data.projectTitle);
        renderProjects();
        showToast('Scope applied ✓');
        addAiMessage('assistant', '✅ Scope applied to the editor. Review the tasks and make any adjustments.');
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
        ${esc(data.summary || 'Here\'s my review of your scope:')}
        <div style="margin-top:8px">${feedbackHtml}</div>
        ${suggestBtn}`;
      document.getElementById('aiMessages').appendChild(msgDiv);
      document.getElementById('aiMessages').scrollTop = 99999;

      if (data.suggestedTasks && data.suggestedTasks.length > 0) {
        document.getElementById('aiApplySugBtn')?.addEventListener('click', () => {
          rows.push(...data.suggestedTasks.map(t => ({ task: t.task || '', role: t.role || '', hours: String(t.hours || ''), notes: t.notes || '' })));
          render(); updateSummary(); saveState();
          showToast(`Added ${data.suggestedTasks.length} tasks`);
          addAiMessage('assistant', `✅ Added ${data.suggestedTasks.length} task${data.suggestedTasks.length > 1 ? 's' : ''} to your scope.`);
        });
      }

    } else {
      // Chat / plain text
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
      input.placeholder = 'Describe the project (e.g. "M365 for a 15-person office, include Teams and SharePoint")';
      input.focus();
      addAiMessage('assistant', 'Describe the project in plain English and I\'ll generate a full scope — tasks, roles, hours, overview, and exclusions. Then use Review or Adjust to refine it for your team.');
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
['showRole','showHours','showNotes'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { saveState(); autoRefresh(); });
});

// Preset loader
document.getElementById('loadPresetBtn').addEventListener('click', () => {
  const key = document.getElementById('presetSelect').value;
  if (!key) { showToast('Select a preset first'); return; }
  const p = PRESETS[key];
  if (!p) return;
  if (rows.length > 0 && !confirm(`Load "${p.title}" preset? This will replace your current tasks.`)) return;
  rows = p.tasks.map(t => ({ ...t }));
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
  currentProjectId = null;  // prevent autoSave writing stale data
  newProject();
  localStorage.removeItem(LS_KEY);  // remove after newProject so saveState can't restore it
});

// Generate
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
    const ta = document.createElement('textarea');
    ta.value = html; ta.style.cssText = 'position:fixed;left:-9999px;';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Copied (fallback)');
  }
});

// Export JSON
document.getElementById('exportBtn').addEventListener('click', () => {
  const state = captureCurrentState();
  const slug  = (state.projectTitle || 'scope').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const json  = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
  const a     = document.createElement('a');
  a.href      = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download  = `${slug}.json`; a.click(); URL.revokeObjectURL(a.href);
});

// Import JSON
document.getElementById('importInput').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.rows)) throw new Error('Not a valid scope file');
      if (rows.length && !confirm(`Import "${data.projectTitle || file.name}"? Current scope will be replaced.`)) return;
      applyState(data); showToast(`Imported: ${data.projectTitle || file.name}`);
      saveCurrentAsProject(data.projectTitle); renderProjects();
    } catch { alert('Could not read this file — make sure it is a valid scope JSON export.'); }
  };
  reader.readAsText(file); e.target.value = '';
});

// Passphrase
document.getElementById('tmplPassphrase').addEventListener('input', async () => {
  updatePassphraseUI();
  await renderTemplateSelect();
  updateCenterHeader();
});

// Template buttons
document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
  if (!isTeamMode()) { const goTeam = promptForPassphrase('save templates'); if (!goTeam) {} await renderTemplateSelect(); }
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

// ── Salesbuildr ───────────────────────────────────────────
const sbToggleBtn = document.getElementById('sbToggle');
const sbArrow     = document.getElementById('sbArrow');
const sbBody      = document.getElementById('sbBody');
const sbApiKey    = document.getElementById('sbApiKey');
const sbIntKey    = document.getElementById('sbIntKey');
const sbRemember  = document.getElementById('sbRemember');
const sbPushBtn   = document.getElementById('sbPushBtn');
const sbResult    = document.getElementById('sbResult');
const sbPrefix    = document.getElementById('sbPrefix');

function initSbCredentials() {
  const savedApi = localStorage.getItem(LS_API_KEY);
  const savedInt = localStorage.getItem(LS_INT_KEY);
  if (savedApi) sbApiKey.value = savedApi;
  if (savedInt) sbIntKey.value = savedInt;
  if (savedApi && savedInt) sbRemember.checked = true;
  updateSbBtn();
}
function updateSbBtn() { sbPushBtn.disabled = !(sbApiKey.value.trim() && sbIntKey.value.trim()); }

sbToggleBtn.addEventListener('click', () => {
  const open = !sbBody.hidden; sbBody.hidden = open;
  sbArrow.classList.toggle('open', !open);
});
sbApiKey.addEventListener('input', updateSbBtn);
sbIntKey.addEventListener('input', updateSbBtn);

sbPushBtn.addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent.trim();
  if (!html) { showToast('Generate the widget first'); document.getElementById('generateBtn').click(); return; }
  const apiKey = sbApiKey.value.trim(); const intKey = sbIntKey.value.trim();
  if (!apiKey || !intKey) return;
  if (sbRemember.checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }
  sbPushBtn.disabled = true; sbPushBtn.textContent = 'Saving…'; sbResult.hidden = true;
  const title  = (document.getElementById('projectTitle').value || 'Project Scope').trim();
  const prefix = sbPrefix.value.trim();
  try {
    const res  = await fetch('/api/push-widgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widgets:[{ id:'project-scope', title, html }], prefix, apiKey, integrationKey:intKey }) });
    const data = await res.json();
    if (data.successCount > 0) {
      sbResult.textContent = `✓ Saved as "${prefix ? prefix + ' – ' : ''}${title}" in Salesbuildr.`;
      sbResult.className = 'sb-result ok'; sbResult.hidden = false; sbPushBtn.textContent = '✓ Saved';
    } else { throw new Error((data.results?.[0]?.error) || data.error || 'Unknown error'); }
  } catch (e) {
    sbResult.textContent = `✕ ${e.message}`; sbResult.className = 'sb-result error'; sbResult.hidden = false;
    sbPushBtn.disabled = false; sbPushBtn.textContent = 'Push →';
  }
});

// ── Init ──────────────────────────────────────────────────
(async function init() {
  const urlPreset = new URLSearchParams(window.location.search).get('preset');

  // Pre-check: if saved state has no title and no hours, wipe it before loading
  if (!urlPreset) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const hasTitle = (s.projectTitle || '').trim();
        const hasHours = (s.rows || []).some(r => num(r.hours) > 0);
        if (!hasTitle && !hasHours) {
          localStorage.removeItem(LS_KEY);
        }
      }
    } catch { localStorage.removeItem(LS_KEY); }
  }

  const hasSaved = urlPreset ? false : loadState();

  if (urlPreset && PRESETS[urlPreset]) {
    rows = PRESETS[urlPreset].tasks.map(t => ({ ...t }));
    document.getElementById('projectTitle').value = PRESETS[urlPreset].title;
    document.getElementById('overview').value     = PRESETS[urlPreset].overview;
    document.getElementById('exclusions').value   = PRESETS[urlPreset].exclusions;
  } else if (!hasSaved) {
    rows = [defaultRow()];
  }

  // Always ensure at least one blank row
  if (!rows.length) rows = [defaultRow()];

  render();
  updatePassphraseUI();
  updateCenterHeader();
  renderProjects();
  initBrandColor();
  setupBrandColorListeners();
  document.getElementById('outputPanels').hidden = true;
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML = '';
  document.getElementById('copyBtn').disabled = true;
  await renderTemplateSelect();
  initSbCredentials();
})();
