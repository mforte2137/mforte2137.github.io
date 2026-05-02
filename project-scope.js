/* =========================================================
   Project Scope Builder — project-scope.js
   ========================================================= */

const LS_KEY     = 'sb_project_scope_v1';
const LS_API_KEY = 'sb_api_key';
const LS_INT_KEY = 'sb_int_key';

// ── Utilities ─────────────────────────────────────────────
function esc(str) {
  return (str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function roundDisp(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }

function durationStr(hours, hpd) {
  const h = num(hours); const d = Math.max(1, num(hpd));
  if (h <= 0) return '';
  const raw = h / d;
  const rounded = Math.ceil(raw * 2) / 2;
  if (rounded % 1 === 0) return `${rounded} day${rounded === 1 ? '' : 's'}`;
  const lo = Math.floor(rounded);
  return `${lo}–${lo + 1} days`;
}

function totalDurationStr(totalHours, hpd) {
  const h = num(totalHours); const d = Math.max(1, num(hpd));
  if (h <= 0) return '—';
  const raw = h / d;
  const rounded = Math.ceil(raw * 2) / 2;
  if (rounded % 1 === 0) return `${rounded} day${rounded === 1 ? '' : 's'}`;
  const lo = Math.floor(rounded);
  return `${lo}–${lo + 1} days`;
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1600);
}

// ── Preset data ───────────────────────────────────────────
const PRESETS = {
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
    overview:  'This project covers the full migration from your current on-premises email and file infrastructure to Microsoft 365, including Exchange Online, SharePoint, Teams, and OneDrive — with a staged approach designed to minimise disruption during the transition.',
    exclusions:'Third-party application integrations not listed in scope\nCustom development or workflow automation\nEnd-user device setup beyond standard mail profile configuration\nMicrosoft 365 licensing costs\nData older than agreed retention period',
    tasks: [
      { task:'Project Kickoff & Tenant Assessment', role:'PM / Senior Engineer', hours:'8', notes:'Current environment review, license planning' },
      { task:'DNS & Domain Configuration', role:'Engineer', hours:'4', notes:'MX, SPF, DKIM, DMARC records' },
      { task:'Exchange Online Setup & Mail Flow', role:'Senior Engineer', hours:'8', notes:'Connectors, hybrid config, mail routing' },
      { task:'Mailbox Migration — Batch 1', role:'Engineer', hours:'16', notes:'Priority users, pilot group' },
      { task:'Mailbox Migration — Remaining Users', role:'Engineer', hours:'24', notes:'Full organisation migration, integrity checks' },
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
    overview:  'This project transitions your organisation onto our managed services platform, establishing monitoring, security, backup, and support processes — giving your team a reliable, proactive IT partner from day one.',
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
    title:     'Cybersecurity Assessment',
    overview:  'This engagement delivers a comprehensive assessment of your organisation\'s current cybersecurity posture, identifying vulnerabilities, gaps, and risks — with a prioritised remediation roadmap and executive-level findings report.',
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

function defaultRow() { return { task:'', role:'', hours:'', notes:'' }; }

// ── Persistence ───────────────────────────────────────────
function saveState() {
  const state = {
    projectTitle:  document.getElementById('projectTitle').value,
    customerName:  document.getElementById('customerName').value,
    hoursPerDay:   document.getElementById('hoursPerDay').value,
    overview:      document.getElementById('overview').value,
    exclusions:    document.getElementById('exclusions').value,
    showRole:      document.getElementById('showRole').checked,
    showHours:     document.getElementById('showHours').checked,
    showNotes:     document.getElementById('showNotes').checked,
    rows
  };
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.rows)) return false;
    document.getElementById('projectTitle').value = s.projectTitle ?? '';
    document.getElementById('customerName').value = s.customerName  ?? '';
    document.getElementById('hoursPerDay').value  = s.hoursPerDay   ?? 8;
    document.getElementById('overview').value     = s.overview      ?? '';
    document.getElementById('exclusions').value   = s.exclusions    ?? '';
    document.getElementById('showRole').checked   = s.showRole  !== false;
    document.getElementById('showHours').checked  = s.showHours === true;
    document.getElementById('showNotes').checked  = s.showNotes !== false;
    rows = s.rows;
    return true;
  } catch { return false; }
}

// ── Render task grid ──────────────────────────────────────
function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  const hpd = document.getElementById('hoursPerDay').value;

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');

    // Drag handle
    tr.dataset.idx = idx;
    const tdDrag = document.createElement('td'); tdDrag.className = 'col-drag';
    tdDrag.innerHTML = '<div class="drag-handle" title="Drag to reorder">⠿</div>';

    // Task
    const tdTask = document.createElement('td'); tdTask.className = 'col-task';
    const inTask = document.createElement('input'); inTask.type = 'text'; inTask.value = esc(r.task); inTask.placeholder = 'Task description';
    inTask.addEventListener('input', e => { rows[idx].task = e.target.value; saveState(); autoRefresh(); });
    tdTask.appendChild(inTask);

    // Role
    const tdRole = document.createElement('td'); tdRole.className = 'col-role';
    const inRole = document.createElement('input'); inRole.type = 'text'; inRole.value = esc(r.role); inRole.placeholder = 'e.g. Engineer';
    inRole.addEventListener('input', e => { rows[idx].role = e.target.value; saveState(); autoRefresh(); });
    tdRole.appendChild(inRole);

    // Hours
    const tdHours = document.createElement('td'); tdHours.className = 'col-hours';
    const inHours = document.createElement('input'); inHours.type = 'number'; inHours.min = '0'; inHours.step = '0.5'; inHours.value = esc(r.hours); inHours.placeholder = '0';
    inHours.addEventListener('input', e => { rows[idx].hours = e.target.value; updateSummary(); saveState(); autoRefresh(); });
    tdHours.appendChild(inHours);

    // Duration (internal)
    const tdDur = document.createElement('td'); tdDur.className = 'col-dur';
    tdDur.textContent = durationStr(r.hours, hpd);

    // Notes
    const tdNotes = document.createElement('td'); tdNotes.className = 'col-notes';
    const txNotes = document.createElement('textarea'); txNotes.value = esc(r.notes); txNotes.placeholder = 'Notes shown to customer...';
    txNotes.addEventListener('input', e => { rows[idx].notes = e.target.value; saveState(); autoRefresh(); });
    tdNotes.appendChild(txNotes);

    // Delete
    const tdDel = document.createElement('td'); tdDel.className = 'col-del';
    const delBtn = document.createElement('button'); delBtn.className = 'btn danger'; delBtn.textContent = '🗑️'; delBtn.title = 'Delete row';
    delBtn.addEventListener('click', () => { rows.splice(idx, 1); render(); updateSummary(); saveState(); autoRefresh(); });
    tdDel.appendChild(delBtn);

    tr.append(tdDrag, tdTask, tdRole, tdHours, tdDur, tdNotes, tdDel);
    tbody.appendChild(tr);
  });
  updateSummary();
  initSortable();
}

function initSortable() {
  if (typeof Sortable === 'undefined') return;
  const tbody = document.getElementById('tbody');
  Sortable.create(tbody, {
    handle:     '.drag-handle',
    animation:  150,
    ghostClass: 'row-ghost',
    dragClass:  'row-drag',
    onEnd: function() {
      // Read new DOM order and sync the rows array
      const newRows = [];
      Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
        const idx = parseInt(tr.dataset.idx);
        if (!isNaN(idx)) newRows.push(rows[idx]);
      });
      rows = newRows;
      render();    // re-render so all indices and event listeners are correct
      saveState();
      autoRefresh();
    }
  });
}

function updateSummary() {
  const hpd = document.getElementById('hoursPerDay').value;
  // Update duration cells
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
  const title       = (document.getElementById('projectTitle').value || '').trim();
  const overview    = (document.getElementById('overview').value     || '').trim();
  const exclusions  = (document.getElementById('exclusions').value   || '').trim();
  const hpd         = document.getElementById('hoursPerDay').value;
  const showRole    = document.getElementById('showRole').checked;
  const showHours   = document.getElementById('showHours').checked;
  const showNotes   = document.getElementById('showNotes').checked;

  const included = rows
    .map(r => ({ task:(r.task||'').trim(), role:(r.role||'').trim(), notes:(r.notes||'').trim(), hours:num(r.hours) }))
    .filter(r => r.hours > 0 && (r.task || r.role || r.notes));

  const total    = included.reduce((s, r) => s + r.hours, 0);
  const duration = totalDurationStr(total, hpd);

  // Table headers
  const thCols = ['<th style="text-align:left;padding:8px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;">Task</th>'];
  if (showRole)  thCols.push('<th style="text-align:left;padding:8px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;white-space:nowrap;">Role</th>');
  if (showHours) thCols.push('<th style="text-align:left;padding:8px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;white-space:nowrap;">Hours</th>');
  if (showNotes) thCols.push('<th style="text-align:left;padding:8px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px;">Notes</th>');

  // Table rows
  const tbRows = included.map(r => {
    const cells = [`<td style="padding:8px 10px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;"><strong>${esc(r.task)}</strong></td>`];
    if (showRole)  cells.push(`<td style="padding:8px 10px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;">${esc(r.role)}</td>`);
    if (showHours) cells.push(`<td style="padding:8px 10px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;white-space:nowrap;">${esc(roundDisp(r.hours))}</td>`);
    if (showNotes) cells.push(`<td style="padding:8px 10px;border:1px solid #e2e8f0;vertical-align:top;font-size:13px;">${esc(r.notes)}</td>`);
    return `<tr>\n  ${cells.join('\n  ')}\n</tr>`;
  }).join('\n');

  // Exclusions
  const exLines = exclusions.split('\n').map(l => l.trim()).filter(Boolean);
  const exclusionsHtml = exLines.length > 0 ? `
<h3 style="margin:20px 0 8px;font-size:15px;color:#0f172a;">What's Not Included</h3>
<ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:1.7;">
  ${exLines.map(l => `<li>${esc(l)}</li>`).join('\n  ')}
</ul>` : '';

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:860px;">
${title ? `  <h2 style="margin:0 0 14px;font-size:20px;color:#0f172a;">${esc(title)}</h2>` : ''}
${overview ? `  <h3 style="margin:0 0 6px;font-size:15px;color:#0f172a;">Project Overview</h3>
  <p style="margin:0 0 18px;font-size:13px;color:#334155;line-height:1.65;">${esc(overview)}</p>` : ''}
  <h3 style="margin:0 0 8px;font-size:15px;color:#0f172a;">Scope of Work</h3>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr>
        ${thCols.join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${tbRows || '<tr><td colspan="4" style="padding:10px;border:1px solid #e2e8f0;color:#94a3b8;">No tasks with hours &gt; 0.</td></tr>'}
    </tbody>
  </table>
  <p style="margin:10px 0 0;font-size:13px;color:#334155;">
    <strong>Total Effort:</strong> ${esc(roundDisp(total))} hours
    ${duration !== '—' ? ` &nbsp;·&nbsp; <strong>Estimated Duration:</strong> ${esc(duration)}` : ''}
  </p>${exclusionsHtml}
</div>`.trim();

  return html;
}

function autoRefresh() {
  const pre = document.getElementById('htmlOut');
  if (!pre.textContent.trim()) return;
  const html = generateWidget();
  pre.textContent = html;
  document.getElementById('preview').innerHTML = html;
}

// ── Event listeners ───────────────────────────────────────

// Settings changes
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
  document.getElementById('copyBtn').disabled    = true;
  render();
  saveState();
  showToast(`Loaded: ${p.title}`);
});

// Add row
document.getElementById('addRowBtn').addEventListener('click', () => {
  rows.push(defaultRow()); render(); saveState();
});

// Clear
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Clear everything and start fresh?')) return;
  rows = [defaultRow()];
  document.getElementById('projectTitle').value  = '';
  document.getElementById('customerName').value  = '';
  document.getElementById('overview').value      = '';
  document.getElementById('exclusions').value    = '';
  document.getElementById('htmlOut').textContent = '';
  document.getElementById('preview').innerHTML   = '';
  document.getElementById('copyBtn').disabled    = true;
  sbPushBtn.textContent = 'Save to Salesbuildr →';
  sbPushBtn.disabled    = !(sbApiKey.value.trim() && sbIntKey.value.trim());
  sbResult.hidden       = true;
  render(); saveState(); showToast('Cleared');
});

// Generate
document.getElementById('generateBtn').addEventListener('click', () => {
  const html = generateWidget();
  document.getElementById('htmlOut').textContent = html;
  document.getElementById('preview').innerHTML   = html;
  document.getElementById('copyBtn').disabled    = false;
  showToast('Widget generated');
  saveState();
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

// ── Salesbuildr connect & push ────────────────────────────
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
  if (savedApi && savedInt) { sbRemember.checked = true; }
  updateSbBtn();
}

function updateSbBtn() {
  sbPushBtn.disabled = !(sbApiKey.value.trim() && sbIntKey.value.trim());
}

sbToggleBtn.addEventListener('click', () => {
  const open = !sbBody.hidden;
  sbBody.hidden = open;
  sbArrow.classList.toggle('open', !open);
});
sbApiKey.addEventListener('input', updateSbBtn);
sbIntKey.addEventListener('input', updateSbBtn);

sbPushBtn.addEventListener('click', async () => {
  const html = document.getElementById('htmlOut').textContent.trim();
  if (!html) {
    showToast('Generate the widget first');
    document.getElementById('generateBtn').click();
    return;
  }

  const apiKey = sbApiKey.value.trim();
  const intKey = sbIntKey.value.trim();
  if (!apiKey || !intKey) return;

  if (sbRemember.checked) { localStorage.setItem(LS_API_KEY, apiKey); localStorage.setItem(LS_INT_KEY, intKey); }
  else { localStorage.removeItem(LS_API_KEY); localStorage.removeItem(LS_INT_KEY); }

  sbPushBtn.disabled    = true;
  sbPushBtn.textContent = 'Saving…';
  sbResult.hidden       = true;

  const title  = (document.getElementById('projectTitle').value || 'Project Scope').trim();
  const prefix = sbPrefix.value.trim();
  const widget = { id: 'project-scope', title, html };

  try {
    const res  = await fetch('/api/push-widgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ widgets:[widget], prefix, apiKey, integrationKey:intKey })
    });
    const data = await res.json();
    if (data.successCount > 0) {
      sbResult.textContent = `✓ Saved as "${prefix ? prefix + ' – ' : ''}${title}" in your Salesbuildr widget library.`;
      sbResult.className   = 'sb-result ok';
      sbResult.hidden      = false;
      sbPushBtn.textContent = '✓ Saved';
    } else {
      const err = (data.results?.[0]?.error) || data.error || 'Unknown error';
      throw new Error(err);
    }
  } catch (e) {
    sbResult.textContent = `✕ ${e.message}`;
    sbResult.className   = 'sb-result error';
    sbResult.hidden      = false;
    sbPushBtn.disabled    = false;
    sbPushBtn.textContent = 'Save to Salesbuildr →';
  }
});

// ── Init ──────────────────────────────────────────────────
(function init() {
  const hasSaved = loadState();
  if (!hasSaved) {
    rows = PRESETS.azure.tasks.map(t => ({ ...t }));
    document.getElementById('projectTitle').value = PRESETS.azure.title;
    document.getElementById('overview').value     = PRESETS.azure.overview;
    document.getElementById('exclusions').value   = PRESETS.azure.exclusions;
  }
  render();
  initSbCredentials();
})();
