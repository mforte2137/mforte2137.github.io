/* ══════════════════════════════════════════
   Customer Growth Operating System — cgos.js
   ══════════════════════════════════════════ */

/* ── DOM refs ── */
const customerSelect = document.getElementById('customer-select');
const chipType       = document.getElementById('chip-type');
const chipMrr        = document.getElementById('chip-mrr');
const chipSince      = document.getElementById('chip-since');
const chipHealth     = document.getElementById('chip-health');
const chipAm         = document.getElementById('chip-am');
const signalsList    = document.getElementById('signals-list');
const signalCount    = document.getElementById('signal-count');
// recsList removed — opportunity cards now rendered by renderOppCards into opp-cards-list
let oppTotal_val     = '$21,950 pipeline'; // updated per customer
const alignmentList  = document.getElementById('alignment-list');
const lifecycleList  = document.getElementById('lifecycle-list');
const lifecycleTotal = document.getElementById('lifecycle-total');
const priorityScore  = document.getElementById('priority-score');
const priorityReasons = document.getElementById('priority-reasons');
const priorityAction = document.getElementById('priority-action');
const chipPriority   = document.getElementById('chip-priority');
const chipConfidence = document.getElementById('chip-confidence');
const alignmentOverall = document.getElementById('alignment-overall');
const alignmentRec   = document.getElementById('alignment-rec');
const oppBar         = document.getElementById('opp-bar');
const oppChevron     = document.getElementById('opp-chevron');
const oppExpanded    = document.getElementById('opp-expanded');
const oppBarMeta     = document.getElementById('opp-bar-meta');
const suggestTitle   = document.getElementById('suggest-title');
const suggestDesc    = document.getElementById('suggest-desc');
const confBar        = document.getElementById('conf-bar');
const confLabel      = document.getElementById('conf-label');
const memoryMeta     = document.getElementById('memory-meta');
const memoryPreview  = document.getElementById('memory-preview');
const memoryChevron  = document.getElementById('memory-chevron');
const memoryBar      = document.getElementById('memory-bar');
const memoryExpanded = document.getElementById('memory-expanded');
const aiBtn          = document.getElementById('ai-btn');
const execBtn        = document.getElementById('exec-btn');
const aiOutput       = document.getElementById('ai-output');
const aiText         = document.getElementById('ai-text');
const closeAi        = document.getElementById('close-ai');
const execOutput     = document.getElementById('exec-output');
const execText       = document.getElementById('exec-text');
const closeExec      = document.getElementById('close-exec');
const feedbackToggle = document.getElementById('feedback-toggle');
const feedbackPanel  = document.getElementById('feedback-panel');
const fbClose        = document.getElementById('fb-close');
const fbSubmit       = document.getElementById('fb-submit');
const fbStatus       = document.getElementById('fb-status');
const modalOverlay   = document.getElementById('modal-overlay');
const modalTitle     = document.getElementById('modal-title');
const modalTabsEl    = document.getElementById('modal-tabs');
const modalBody      = document.getElementById('modal-body');
const modalFooter    = document.getElementById('modal-footer');
const modalClose     = document.getElementById('modal-close');
const portfolioList  = document.getElementById('portfolio-list');
const portAiBtn      = document.getElementById('port-ai-btn');
const portAiOutput   = document.getElementById('port-ai-output');
const portAiText     = document.getElementById('port-ai-text');
const closePortAi    = document.getElementById('close-port-ai');

/* ── State ── */
const activeSources  = new Set(['psa', 'rmm', 'sb']);
const srcKeyMap      = { 'PSA': 'psa', 'RMM': 'rmm', 'Salesbuildr': 'sb' };
let memoryOpen       = false;
let activeFilter     = 'all';
let oppOpen          = false;
let currentModalTabs = null;


/* ── SVG icons ── */
function svg(path) { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${path}</svg>`; }
function iconLaptop()   { return svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M0 21h24"/>'); }
function iconUsers()    { return svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'); }
function iconShield()   { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'); }
function iconShieldOk() { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>'); }
function iconMs()       { return svg('<rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/>'); }
function iconServer()   { return svg('<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>'); }
function iconBackup()   { return svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'); }
function iconCert()     { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'); }
function iconAudit()    { return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'); }
function iconDown()     { return svg('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'); }
function iconLabor()    { return svg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'); }

/* ══════════════════════════════════════════
   CUSTOMER DATA
   ══════════════════════════════════════════ */
const CUSTOMERS = {
  abc: {
    name: 'ABC Manufacturing', type: 'Fully Managed', location: 'Houston, TX',
    mrr: '$3,840', since: 'May 2021', health: 82, am: 'Sarah Johnson',
    contact: {
      name: 'Tom Mitchell', initials: 'TM', role: 'IT Manager',
      email: 'tom.mitchell@abcmfg.com', phone: '+1 713 555 0142'
    },
    notes: [
      { author: 'Sarah Johnson', date: 'Jun 10, 2026 · 2:14pm', text: 'Tom confirmed budget for device refresh but wants to phase over 2 quarters. Revised proposal to reflect phased approach.' },
      { author: 'Sarah Johnson', date: 'May 21, 2026 · after strategic review', text: 'MFA rollout agreed — targeting 90 days. Security assessment deferred to Q3. Tom flagged concern about backup reliability.' }
    ],
    memory: {
      meta: 'Last review: Nov 2025 &middot; 3 open items',
      items: [
        { status: 'done', label: 'Replace Server 2016',       date: 'Completed Oct 2025' },
        { status: 'warn', label: 'MFA rollout',               date: 'In progress' },
        { status: 'miss', label: 'Security assessment',       date: 'Not started' }
      ]
    },
    signals: [
      { src: 'RMM',         icon: iconLaptop(), cls: 'high', title: '14 devices reaching Windows 10 EOL',    sub: 'RMM &middot; 10 months away',           modal: 'eol',       action: 'Create opportunity', actionCls: 'act-primary' },
      { src: 'PSA',         icon: iconLabor(),  cls: 'high', title: 'Labor utilization 27% over agreement',  sub: 'PSA &middot; Last 30 days',             modal: 'labor',     action: 'Review scope', actionCls: 'act-warn' },
      { src: 'PSA',         icon: iconUsers(),  cls: 'med',  title: 'User count increased 18% — 7 unlicensed', sub: 'PSA / M365 &middot; Action needed',   modal: 'users',     action: 'Review users', actionCls: 'act-warn' },
      { src: 'RMM',         icon: iconBackup(), cls: 'med',  title: 'Backup failure rate increased this month', sub: 'RMM &middot; 14% failure rate',      modal: 'backup_abc', action: 'Create ticket', actionCls: 'act-danger' },
      { src: 'Salesbuildr', icon: iconShield(), cls: 'med',  title: 'No security review in 14 months',       sub: 'Salesbuildr &middot; Overdue',          modal: 'secrev',    action: 'Schedule review', actionCls: 'act-warn' },
      { src: 'Salesbuildr', icon: iconMs(),     cls: 'ok',   title: 'M365 licensing aligned',                sub: 'Salesbuildr &middot; On track',         modal: 'm365ok',    action: 'View detail', actionCls: 'act-ok' }
    ],
    recs: [
      { title: 'Device refresh planning',          sub: '14 Win10 devices reach EOL in 10 months. Budget conversation needed now.',  val: '$12,000 – $18,000' },
      { title: 'Managed services scope review',    sub: 'Labor consistently over agreement. Review scope and adjust MRR.',           val: '+$450/mo MRR'      },
      { title: 'Security & compliance assessment', sub: '14 months since last review. Liability risk increasing.',                   val: '$3,500 project'    },
      { title: 'User growth — licensing review',   sub: '18% user growth, 7 users potentially unlicensed. Review seat counts.',     val: 'Review M365 seats' }
    ],
    oppTotal: '$21,950 pipeline',
    oppCategories: [
      { label: 'Device Refresh',      val: '$14,000', cls: 'danger' },
      { label: 'Security',            val: '$3,500',  cls: 'warn'   },
      { label: 'Licensing',           val: '$1,680',  cls: 'warn'   },
      { label: 'Managed Svc Expansion', val: '$2,770', cls: 'info'  }
    ],
    opportunities: [
      {
        id: 'opp_abc_1', title: 'Device Refresh — Windows 10 EOL',
        status: 'active', statusLabel: 'Waiting for response',
        value: '$14,800', created: 'Apr 2, 2026',
        emails: 2, meetings: 1, proposalSent: false,
        lastActivity: 'Email drafted re: revised device pricing', lastActivityAge: '3 days ago',
        timeline: [
          { date: 'Jun 10', type: 'review',   title: 'Security review scheduled',             detail: 'Booked for Jun 24 — Sarah attending' },
          { date: 'Jun 4',  type: 'proposal', title: 'Revised proposal sent',                  detail: 'Updated pricing per customer request', val: '$13,200' },
          { date: 'May 28', type: 'email',    title: 'Customer requested revised pricing',     detail: '3 units removed from original scope' },
          { date: 'May 14', type: 'proposal', title: 'Initial proposal sent',                  detail: 'Device refresh — 14 units', val: '$14,800' },
          { date: 'Apr 22', type: 'decision', title: 'Customer confirmed EOL concern',         detail: 'Verbal approval to proceed with scoping' },
          { date: 'Apr 2',  type: 'opp',      title: 'Opportunity created',                    detail: 'Triggered by RMM EOL signal' }
        ]
      },
      {
        id: 'opp_abc_2', title: 'Managed Services Scope Review',
        status: 'active', statusLabel: 'In Discussion',
        value: '+$450/mo', created: 'May 15, 2026',
        emails: 2, meetings: 1, proposalSent: false,
        lastActivity: 'AM shared labour utilisation report with client', lastActivityAge: '12 days ago',
        timeline: [
          { date: 'Jun 1',  type: 'note',     title: 'AM shared utilisation report',          detail: 'Client acknowledged the overage' },
          { date: 'May 22', type: 'review',   title: 'Internal scope review completed',        detail: 'Recommended +$450/mo adjustment' },
          { date: 'May 15', type: 'opp',      title: 'Opportunity created',                    detail: 'Triggered by PSA labour overage signal' }
        ]
      },
      {
        id: 'opp_abc_3', title: 'Security & Compliance Assessment',
        status: 'active', statusLabel: 'Identified',
        value: '$3,500', created: 'Jun 5, 2026',
        emails: 0, meetings: 0, proposalSent: false,
        lastActivity: 'Opportunity created from CGOS signal', lastActivityAge: '7 days ago',
        timeline: [
          { date: 'Jun 5',  type: 'opp',      title: 'Opportunity created',                    detail: 'No security review in 14 months — flagged by CGOS' }
        ]
      }
    ],
    activityTimeline: [
      { date: 'Jun 10', type: 'review',   title: 'Security review scheduled',        detail: 'Booked for Jun 24' },
      { date: 'Jun 4',  type: 'proposal', title: 'Revised proposal sent — Device Refresh', detail: 'Updated pricing', val: '$13,200' },
      { date: 'Jun 1',  type: 'note',     title: 'Labour utilisation report shared with client', detail: 'Client acknowledged the overage' },
      { date: 'May 28', type: 'email',    title: 'Customer requested revised pricing', detail: 'Device refresh scope change' },
      { date: 'May 21', type: 'review',   title: 'Strategic review completed',        detail: 'MFA rollout agreed, security assessment deferred' },
      { date: 'May 15', type: 'opp',      title: 'Opportunity created — Scope Review', detail: 'Labour overage signal triggered', val: '+$450/mo' },
      { date: 'May 14', type: 'proposal', title: 'Initial proposal sent — Device Refresh', detail: '14 devices', val: '$14,800' },
      { date: 'Apr 22', type: 'decision', title: 'Customer confirmed EOL concern',    detail: 'Verbal approval for device refresh scoping' },
      { date: 'Apr 2',  type: 'opp',      title: 'Opportunity created — Device Refresh', detail: 'EOL signal from RMM', val: '$14,800' }
    ],
    healthBreakdown: {
      score: 82,
      dimensions: [
        { label: 'Relationship',        score: 95, note: 'Long-term client, strong engagement' },
        { label: 'Technical',           score: 78, note: '14 EOL devices, backup issues emerging' },
        { label: 'Security',            score: 71, note: 'MFA gap, no security review in 14 months' },
        { label: 'Alignment',           score: 86, note: 'Device and user count slightly out of sync' },
        { label: 'Lifecycle',           score: 74, note: 'Multiple renewals and EOL items in window' },
        { label: 'Strategic Engagement', score: 80, note: 'Last QBR 8 months ago — overdue' }
      ]
    },
    alignment: {
      overall: 86,
      items: [
        { label: 'Agreement vs Licensing',       score: 94, cls: 'good',   modal: 'align_licensing_abc'  },
        { label: 'Agreement vs Managed Devices', score: 82, cls: 'warn',   modal: 'align_devices_abc'    },
        { label: 'Agreement vs Backup Coverage', score: 68, cls: 'danger', modal: 'align_backup_abc'     },
        { label: 'Agreement vs User Count',      score: 85, cls: 'warn',   modal: 'align_users_abc',
          detail: '7 unlicensed · $1,680/yr' },
        { label: 'Security Coverage',            score: 71, cls: 'danger', modal: 'align_security_abc'   },
        { label: 'Billing Reconciliation',       score: 97, cls: 'good',   modal: 'align_billing_abc'    }
      ],
      rec: { title: 'Review Licensing & Device Alignment', val: '$4,200 annually', cls: 'warn' }
    },
    suggestTitle: 'Schedule strategic review — 5 signals require discussion',
    suggest: 'Lead with the device refresh timeline — it has the longest planning horizon and highest revenue potential. Then address labour over-utilisation to reset scope expectations. The user count and backup topics reinforce why a scope review is overdue. Close with the security assessment as a risk-based conversation.',
    confidence: 92,
    priority: {
      score: 96,
      reasons: [
        'Security review overdue 14 months',
        'User growth +18% — 7 unlicensed',
        '$21,950 opportunity pipeline',
        'Labor utilization 27% over agreement'
      ],
      action: 'Schedule Strategic Review'
    },
    workflow: {
      title: 'Prepare for strategic review',
      steps: [
        { id: 's1', label: 'Device Refresh EOL — Draft outreach email to Tom',        desc: 'Explain the key signals and why a review makes sense now. Set a partnership tone.',             action: 'Draft email',            actionFn: 'email',   done: true,  autoLog: 'Email drafted · Jun 10' },
        { id: 's2', label: 'Device Refresh EOL — Schedule the review meeting',        desc: 'Once Tom responds, lock in a date and generate an agenda based on current signals.',           action: 'Generate agenda',        actionFn: 'agenda',  done: false, waiting: 'Waiting for response'   },
        { id: 's3', label: 'Device Refresh EOL — Generate conversation brief', desc: 'AI-written brief: how to open, what to raise first, how to close with a next step.',          action: 'Generate brief',         actionFn: 'brief',   done: false  },
        { id: 's4', label: 'Device Refresh EOL — Build presentation deck',            desc: 'Slide deck summarising signals, alignment gaps, and recommendations to share with Tom.',       action: 'Build deck',             actionFn: 'deck',    done: false  },
        { id: 's5', label: 'Device Refresh EOL — Create opportunity in Salesbuildr', desc: 'Convert the review outcome into a tracked opportunity and link to a proposal when ready.',    action: 'Create opportunity',     actionFn: 'opp',     done: false  }
      ]
    },
    dataConfidence: {
      score: 92,
      cls: 'full',
      sources: [
        { label: 'PSA',             ok: true  },
        { label: 'RMM',             ok: true  },
        { label: 'M365 / Entra ID', ok: true  },
        { label: 'Security data',   ok: false, note: 'Missing — no security platform connected' },
        { label: 'Billing sync',    ok: false, note: 'Last sync 7 days ago'                     }
      ]
    },
    lifecycle: {
      total: '$18,400 potential',
      items: [
        { icon: 'eol',      title: '14 Windows 10 devices',          sub: 'EOL in 10 months',           val: '$14,000',  modal: 'eol'    },
        { icon: 'eol',      title: '2 Server 2016 systems',          sub: 'EOL Oct 2026',               val: '$4,000',   modal: 'servers_abc' },
        { icon: 'renewal',  title: 'Fortinet firewall renewal',      sub: 'Expires in 60 days',         val: '$1,200',   modal: 'fortinet' },
        { icon: 'renewal',  title: 'Veeam backup licence',           sub: 'Renewal in 90 days',         val: '$800',     modal: 'veeam'   },
        { icon: 'warranty', title: 'Warranty expiry — 3 workstations', sub: 'Expiring in 120 days',     val: 'Review',   modal: 'warranty_abc' }
      ]
    },
    changed: [
      { label: '+8 users onboarded',              delta: '+8',   cls: 'delta-up'   },
      { label: '+4 managed devices added',        delta: '+4',   cls: 'delta-up'   },
      { label: 'Ticket volume up 12%',            delta: '+12%', cls: 'delta-up'   },
      { label: '1 backup platform alert raised',  delta: '⚠',    cls: 'delta-neg'  },
      { label: '2 security policies updated',     delta: '✓',    cls: 'delta-down' }
    ]
  },
  river: {
    name: 'River Tech Solutions', type: 'Co-Managed', location: 'Austin, TX',
    mrr: '$2,100', since: 'Jan 2022', health: 71, am: 'Mark Davies',
    contact: {
      name: 'Marcus Webb', initials: 'MW', role: 'Director',
      email: 'marcus.webb@rivertech.com', phone: '+1 512 555 0198'
    },
    notes: [
      { author: 'Mark Davies', date: 'Jun 8, 2026 · 10:22am', text: 'Escalated SMART disk errors to Marcus immediately. He was unaware. Agreed to proceed with urgent remediation.' },
      { author: 'Mark Davies', date: 'Jun 3, 2026', text: 'Presented cloud vs on-prem options for server refresh. Marcus is leaning toward hybrid. Following up next week.' }
    ],
    memory: {
      meta: 'Last review: Aug 2025 &middot; 2 open items',
      items: [
        { status: 'done', label: 'Migrate email to M365',    date: 'Completed Sep 2025' },
        { status: 'miss', label: 'Server refresh proposal',  date: 'Not started' }
      ]
    },
    signals: [
      { src: 'RMM', icon: iconServer(),  cls: 'high', title: '3 servers approaching end of warranty',  sub: 'RMM &middot; 6 months away',            modal: 'servers',      action: 'Create opportunity', actionCls: 'act-primary' },
      { src: 'RMM', icon: iconBackup(),  cls: 'high', title: 'Backup failure rate up 22%',             sub: 'RMM &middot; Last 30 days',             modal: 'backup_river', action: 'Create urgent ticket', actionCls: 'act-danger' },
      { src: 'PSA', icon: iconUsers(),   cls: 'med',  title: 'User & device audit recommended',        sub: 'PSA / RMM &middot; 2 dormant found',    modal: 'users_river',  action: 'Schedule audit', actionCls: 'act-warn' },
      { src: 'RMM', icon: iconCert(),    cls: 'med',  title: 'SSL certificates expiring in 45 days',   sub: 'RMM &middot; 2 certificates affected',  modal: 'ssl',          action: 'Log reminder', actionCls: 'act-ok' },
      { src: 'Salesbuildr', icon: iconMs(), cls: 'ok', title: 'M365 licensing aligned',                sub: 'Salesbuildr &middot; On track',         modal: 'm365ok',       action: 'View detail', actionCls: 'act-ok' }
    ],
    recs: [
      { title: 'Server refresh planning', sub: '3 servers out of warranty in 6 months. Disaster recovery risk needs discussion.', val: '$8,000 – $15,000'      },
      { title: 'Backup & DR review',      sub: 'Failure rate increase warrants full backup audit and DR plan update.',            val: '$2,500 project'        },
      { title: 'User & device cleanup',   sub: '2 dormant devices and 1 offboarded user found. Cleanup recommended.',           val: 'License cost saving'   },
      { title: 'SSL certificate renewal', sub: '45 days is within action window. Confirm renewal process with client.',          val: 'Low urgency — confirm' }
    ],
    oppTotal: '$17,500 pipeline',
    oppCategories: [
      { label: 'Server Refresh',  val: '$12,000', cls: 'danger' },
      { label: 'Backup & DR',     val: '$2,500',  cls: 'danger' },
      { label: 'Security Stack',  val: '$3,200',  cls: 'warn'   },
      { label: 'Device Cleanup',  val: 'Saving',  cls: 'info'   }
    ],
    opportunities: [
      {
        id: 'opp_river_1', title: 'Server Refresh — 3 Servers EOW',
        status: 'active', statusLabel: 'In Discussion',
        value: '$12,000', created: 'May 20, 2026',
        emails: 3, meetings: 1, proposalSent: false,
        lastActivity: 'Mark presented cloud vs on-prem options to client', lastActivityAge: '8 days ago',
        timeline: [
          { date: 'Jun 3',  type: 'review',   title: 'Cloud vs on-prem options presented', detail: 'Client leaning toward hybrid' },
          { date: 'May 28', type: 'email',    title: 'Warranty expiry confirmed by vendor', detail: 'SRV-RIVER-01 warranty ends Aug 2026' },
          { date: 'May 20', type: 'opp',      title: 'Opportunity created',                 detail: 'Triggered by RMM warranty signal' }
        ]
      },
      {
        id: 'opp_river_2', title: 'Backup & DR Remediation',
        status: 'active', statusLabel: 'Urgent — In Progress',
        value: '$2,500', created: 'Jun 8, 2026',
        emails: 1, meetings: 0, proposalSent: false,
        lastActivity: 'SMART errors escalated — client notified', lastActivityAge: '4 days ago',
        timeline: [
          { date: 'Jun 8',  type: 'alert',    title: 'SMART errors detected on SRV-RIVER-03', detail: 'Client notified immediately' },
          { date: 'Jun 8',  type: 'opp',      title: 'Opportunity created — urgent',           detail: 'Backup target disk failure imminent' }
        ]
      }
    ],
    activityTimeline: [
      { date: 'Jun 8',  type: 'alert',    title: 'SMART disk errors detected',        detail: 'SRV-RIVER-03 — client notified' },
      { date: 'Jun 3',  type: 'review',   title: 'Cloud vs on-prem options presented', detail: 'Server refresh scoping call' },
      { date: 'May 28', type: 'email',    title: 'Vendor warranty confirmation received', detail: 'SRV-RIVER-01 expires Aug 2026' },
      { date: 'May 22', type: 'decision', title: 'M365 migration completed',           detail: 'Email fully migrated, signed off by client' },
      { date: 'May 20', type: 'opp',      title: 'Opportunity created — Server Refresh', detail: 'Warranty signal from RMM', val: '$12,000' },
      { date: 'Apr 15', type: 'review',   title: 'Quarterly check-in call',            detail: 'No major issues — backup not yet flagged' }
    ],
    healthBreakdown: {
      score: 71,
      dimensions: [
        { label: 'Relationship',        score: 82, note: 'Good relationship, co-managed dynamic' },
        { label: 'Technical',           score: 65, note: '3 servers EOW, backup target degrading' },
        { label: 'Security',            score: 61, note: 'No MFA, 4 security layers missing' },
        { label: 'Alignment',           score: 74, note: 'Dormant devices, contractor seat active' },
        { label: 'Lifecycle',           score: 68, note: 'Multiple warranty and renewal items due' },
        { label: 'Strategic Engagement', score: 72, note: 'Last review 4 months ago' }
      ]
    },
    alignment: {
      overall: 74,
      items: [
        { label: 'Agreement vs Licensing',       score: 88, cls: 'warn',   modal: 'align_licensing_river' },
        { label: 'Agreement vs Managed Devices', score: 65, cls: 'danger', modal: 'align_devices_river'   },
        { label: 'Agreement vs Backup Coverage', score: 54, cls: 'danger', modal: 'align_backup_river',
          detail: 'Backup target failing' },
        { label: 'Agreement vs User Count',      score: 92, cls: 'good',   modal: 'align_users_river',
          detail: '1 contractor to remove' },
        { label: 'Security Coverage',            score: 61, cls: 'danger', modal: 'align_security_river'  },
        { label: 'Billing Reconciliation',       score: 91, cls: 'good',   modal: 'align_billing_river'   }
      ],
      rec: { title: 'Managed Device & Security Scope Review', val: '$6,800 annually', cls: 'danger' }
    },
    suggestTitle: 'Schedule server review — infrastructure and backup risk are both active',
    suggest: 'Open with the server warranty conversation — it carries the most risk and the highest revenue opportunity. The backup failure rate reinforces the DR narrative and should be the second agenda item. Use the user and device audit finding to demonstrate proactive management.',
    confidence: 87,
    priority: {
      score: 88,
      reasons: [
        '3 servers approaching warranty end',
        'Backup failure rate up 22%',
        'Security coverage only 61%',
        '2 dormant devices — scope misalignment'
      ],
      action: 'Schedule Server & DR Review'
    },
    workflow: {
      title: 'Prepare for server & DR review',
      steps: [
        { id: 'r1', label: 'Server Refresh — Escalate backup disk failure to Marcus', desc: 'SRV-RIVER-03 SMART errors are urgent — client needs to know immediately.',               action: 'Draft urgent email',     actionFn: 'email',   done: true,  autoLog: 'Email sent · Jun 8'     },
        { id: 'r2', label: 'Server Refresh — Follow up on proposal',   desc: 'No response in 8 days. A brief check-in call may be needed to keep momentum.',          action: 'Draft follow-up',        actionFn: 'email',   done: false, waiting: 'Awaiting proposal decision' },
        { id: 'r3', label: 'Generate conversation brief',            desc: 'AI-written brief covering server warranty, backup risk, and DR options.',                 action: 'Generate brief',         actionFn: 'brief',   done: false  },
        { id: 'r4', label: 'Server Refresh — Schedule review meeting',         desc: 'Discuss server refresh vs cloud migration and agree on a path forward.',                 action: 'Generate agenda',        actionFn: 'agenda',  done: false  },
        { id: 'r5', label: 'Server Refresh — Create opportunity in Salesbuildr', desc: 'Server refresh or cloud migration — whichever direction Marcus chooses.',               action: 'Create opportunity',     actionFn: 'opp',     done: false  }
      ]
    },
    dataConfidence: {
      score: 78,
      cls: 'warn',
      sources: [
        { label: 'PSA',             ok: true  },
        { label: 'RMM',             ok: true  },
        { label: 'M365 / Entra ID', ok: true  },
        { label: 'Security data',   ok: false, note: 'No EDR platform connected'      },
        { label: 'Billing sync',    ok: false, note: 'Last sync 12 days ago'           }
      ]
    },
    lifecycle: {
      total: '$17,500 potential',
      items: [
        { icon: 'warranty', title: '3 servers — warranty expiring',  sub: 'Aug–Nov 2026',               val: '$12,000',  modal: 'servers' },
        { icon: 'eol',      title: 'SRV-RIVER-03 disk health',       sub: 'SMART errors detected',       val: 'Urgent',   modal: 'backup_river' },
        { icon: 'renewal',  title: 'SSL certificate renewals',       sub: '2 certs expire Jul 2026',    val: '$400',     modal: 'ssl'     },
        { icon: 'renewal',  title: 'RMM agent licences',             sub: 'Renewal in 45 days',         val: '$1,200',   modal: 'rmm_renewal' }
      ]
    },
    changed: [
      { label: 'Backup failure rate increased',    delta: '+22%', cls: 'delta-neg'  },
      { label: 'SRV-RIVER-03 disk warnings raised',delta: '⚠',    cls: 'delta-neg'  },
      { label: '2 new users onboarded',            delta: '+2',   cls: 'delta-up'   },
      { label: 'SSL certs flagged for renewal',    delta: '⚠',    cls: 'delta-up'   }
    ]
  },
  peak: {
    name: 'Peak Financial Group', type: 'Fully Managed', location: 'Denver, CO',
    mrr: '$5,200', since: 'Mar 2020', health: 91, am: 'Lisa Tran',
    contact: {
      name: 'Rachel Chen', initials: 'RC', role: 'CFO',
      email: 'r.chen@peakfinancial.com', phone: '+1 303 555 0176'
    },
    notes: [
      { author: 'Lisa Tran', date: 'May 28, 2026', text: 'Rachel confirmed audit scope — all four workstreams approved. She mentioned interest in expanding dark web monitoring to personal emails.' },
      { author: 'Lisa Tran', date: 'Apr 30, 2026 · after QBR', text: 'Excellent review. M365 E3 upgrade well received. Rachel asked about technology roadmap for next 18 months.' }
    ],
    memory: {
      meta: 'Last review: Apr 2026 &middot; 1 open item',
      items: [
        { status: 'done', label: 'Annual compliance audit',   date: 'Completed Mar 2026' },
        { status: 'done', label: 'M365 E3 upgrade',           date: 'Completed Feb 2026' },
        { status: 'warn', label: 'Technology roadmap review', date: 'Scheduled Jun 2026' }
      ]
    },
    signals: [
      { src: 'Salesbuildr', icon: iconAudit(),    cls: 'med', title: 'Annual compliance audit due in 60 days', sub: 'Salesbuildr &middot; Scheduled',      modal: 'audit',    action: 'Prepare agenda', actionCls: 'act-warn' },
      { src: 'RMM',         icon: iconShieldOk(), cls: 'ok',  title: 'All security patches current',           sub: 'RMM &middot; Last scan today',        modal: 'patches',  action: 'View detail', actionCls: 'act-ok' },
      { src: 'PSA',         icon: iconDown(),     cls: 'ok',  title: 'Ticket volume down 8%',                  sub: 'PSA &middot; Service delivery strong', modal: 'tickets',  action: 'View detail', actionCls: 'act-ok' }
    ],
    recs: [
      { title: 'Annual compliance review',  sub: 'Scheduled audit in 60 days. Prep checklist and confirm scope with client.', val: '$4,000 engagement'  },
      { title: 'Strategic growth planning', sub: 'Strong health score — ideal time to discuss technology roadmap.',            val: 'Retention & upsell' }
    ],
    oppTotal: '$4,000 pipeline',
    oppCategories: [
      { label: 'Compliance Audit', val: '$4,000', cls: 'warn' },
      { label: 'Dark Web Monitoring', val: '$480', cls: 'info' }
    ],
    healthBreakdown: {
      score: 91,
      dimensions: [
        { label: 'Relationship',        score: 96, note: 'Long-term client, strong strategic partner' },
        { label: 'Technical',           score: 94, note: 'All patches current, no EOL concerns' },
        { label: 'Security',            score: 94, note: 'Strong posture — minor dark web gap' },
        { label: 'Alignment',           score: 96, note: 'Near-perfect agreement alignment' },
        { label: 'Lifecycle',           score: 90, note: 'Only compliance audit in the window' },
        { label: 'Strategic Engagement', score: 88, note: 'QBR 2 months ago, roadmap in progress' }
      ]
    },
    alignment: {
      overall: 96,
      items: [
        { label: 'Agreement vs Licensing',       score: 98, cls: 'good', modal: 'align_licensing_peak' },
        { label: 'Agreement vs Managed Devices', score: 95, cls: 'good', modal: 'align_devices_peak'   },
        { label: 'Agreement vs Backup Coverage', score: 97, cls: 'good', modal: 'align_backup_peak',
          detail: 'All backups healthy' },
        { label: 'Agreement vs User Count',      score: 99, cls: 'good', modal: 'align_users_peak',
          detail: 'Fully aligned' },
        { label: 'Security Coverage',            score: 94, cls: 'good', modal: 'align_security_peak'  },
        { label: 'Billing Reconciliation',       score: 99, cls: 'good', modal: 'align_billing_peak'   }
      ],
      rec: { title: 'Strong alignment across all areas', val: 'No immediate action required', cls: 'good' }
    },
    suggestTitle: 'Relationship & planning conversation — strong health, one upcoming milestone',
    suggest: 'This is a relationship maintenance and growth conversation. Lead with appreciation for the strong health metrics, then move to compliance audit preparation. Use the positive momentum to open a technology roadmap discussion — this client is well positioned to invest.',
    confidence: 88,
    priority: {
      score: 52,
      reasons: [
        'Compliance audit due in 60 days',
        'Technology roadmap review pending',
        'Dark web monitoring gap'
      ],
      action: 'Schedule Compliance Prep Call'
    },
    workflow: {
      title: 'Prepare for compliance review',
      steps: [
        { id: 'p1', label: 'Compliance Audit — Confirm scope with Rachel',       desc: 'Scope is agreed — confirm the four workstreams are ready and nothing has changed.',       action: 'View notes',             actionFn: 'notes',   done: true,  autoLog: 'Scope confirmed · May 28' },
        { id: 'p2', label: 'Compliance Audit — Generate conversation brief', desc: 'AI brief for the compliance prep call — what to cover and how to close.',               action: 'Generate brief',         actionFn: 'brief',   done: false  },
        { id: 'p3', label: 'Compliance Audit — Prepare documentation checklist', desc: 'Confirm all four workstream documents are ready before the audit date.',               action: 'Open audit detail',      actionFn: 'audit',   done: false  },
        { id: 'p4', label: 'Compliance Audit — Propose dark web monitoring expansion', desc: 'Rachel expressed interest. Expand coverage to personal emails — $480/yr addition.',     action: 'Draft proposal email',   actionFn: 'email',   done: false  },
        { id: 'p5', label: 'Compliance Audit — Create opportunity in Salesbuildr', desc: 'Compliance audit engagement ($4,000) plus potential dark web expansion.',              action: 'Create opportunity',     actionFn: 'opp',     done: false  }
      ]
    },
    dataConfidence: {
      score: 98,
      cls: 'full',
      sources: [
        { label: 'PSA',             ok: true },
        { label: 'RMM',             ok: true },
        { label: 'M365 / Entra ID', ok: true },
        { label: 'Security stack',  ok: true },
        { label: 'Billing sync',    ok: true, note: 'Last sync today' }
      ]
    },
    lifecycle: {
      total: '$4,480 potential',
      items: [
        { icon: 'renewal', title: 'Annual compliance audit',        sub: 'Due in 60 days',             val: '$4,000',  modal: 'audit'   },
        { icon: 'renewal', title: 'M365 E3 licence renewal',        sub: 'Renewal in 4 months',        val: 'Renew',   modal: 'align_licensing_peak' },
        { icon: 'ok',      title: 'All endpoints under warranty',   sub: 'Next review Dec 2027',       val: 'On track', modal: null     }
      ]
    },
    changed: [
      { label: 'Annual compliance audit completed',  delta: '✓',   cls: 'delta-down' },
      { label: 'M365 E3 upgrade completed',          delta: '✓',   cls: 'delta-down' },
      { label: '1 new user onboarded',               delta: '+1',  cls: 'delta-up'   },
      { label: 'Ticket volume down 8%',              delta: '-8%', cls: 'delta-down' }
    ]
  }
};

/* ══════════════════════════════════════════
   RENDER WORKFLOW PANEL
   ══════════════════════════════════════════ */
const workflowStepDone = new Set(['s1','r1','p1']); // seeded completed steps

function renderWorkflow(c) {
  const wf = c.workflow;
  if (!wf) return;

  // Panel title — concise deal-focused label
  const wfPanelTitle = document.querySelector('#workflow-panel .panel-title');
  if (wfPanelTitle) wfPanelTitle.textContent = 'REVIEW WORKFLOW';

  // Context chips
  const priorityChip = document.getElementById('wf-priority-chip');
  const customerChip = document.getElementById('wf-customer-chip');
  const contactChip  = document.getElementById('wf-contact-chip');
  if (priorityChip) {
    priorityChip.textContent = `★ Priority ${c.priority.score}`;
    priorityChip.style.background = c.priority.score >= 80 ? 'var(--danger-bg)' : c.priority.score >= 60 ? 'var(--warn-bg)' : 'var(--good-bg)';
    priorityChip.style.color      = c.priority.score >= 80 ? 'var(--danger)'    : c.priority.score >= 60 ? 'var(--warn)'    : 'var(--good)';
  }
  if (customerChip) customerChip.textContent = c.name;
  if (contactChip && c.contact) contactChip.textContent = c.contact.name;

  const steps = wf.steps;
  const doneCount = steps.filter(s => workflowStepDone.has(s.id) || s.done).length;
  const activeIdx = Math.min(doneCount, steps.length - 1);

  // Progress dots
  const dotsEl = document.getElementById('wf-progress-dots');
  const labelEl = document.getElementById('wf-progress-label');
  if (dotsEl) {
    dotsEl.innerHTML = steps.map((s, i) => {
      const isDone   = workflowStepDone.has(s.id) || s.done;
      const isActive = !isDone && i === activeIdx;
      return `<div class="wf-dot ${isDone ? 'done' : isActive ? 'active' : ''}"></div>`;
    }).join('');
  }
  if (labelEl) labelEl.textContent = `Step ${activeIdx + 1} of ${steps.length}`;

  // Steps
  const stepsEl = document.getElementById('wf-steps-list');
  if (!stepsEl) return;

  stepsEl.innerHTML = steps.map((s, i) => {
    const isDone   = workflowStepDone.has(s.id) || s.done;
    const isActive = !isDone && i === activeIdx;
    const isLast   = i === steps.length - 1;

    return `
      <div class="wf-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}" data-step="${s.id}">
        <div class="wf-step-left">
          <div class="wf-step-num ${isDone ? 'done' : isActive ? 'active' : ''}">
            ${isDone ? '&#10003;' : i + 1}
          </div>
          ${!isLast ? `<div class="wf-step-connector ${isDone ? 'done' : ''}"></div>` : ''}
        </div>
        <div class="wf-step-body">
          <div class="wf-step-label ${isDone ? 'done' : ''}">${s.label}</div>
          <div class="wf-step-desc">${s.desc}</div>
          ${isDone && s.autoLog ? `<div class="wf-step-log">&#10003; ${s.autoLog} · auto-logged to activity timeline</div>` : ''}
          ${isActive ? `
            <div class="wf-step-actions">
              <button class="wf-action-btn primary" data-fn="${s.actionFn}" data-step="${s.id}">${s.action}</button>
              ${s.waiting ? `<button class="wf-action-btn secondary" data-step="${s.id}" data-waitbtn="1">${s.waiting}</button>` : ''}
            </div>
            <div class="wf-auto-log-note">&#8505; This action will be auto-logged to the customer activity timeline</div>
          ` : ''}
          ${!isDone && !isActive && s.action ? `
            <div class="wf-step-preview-action">${s.action} ›</div>
          ` : ''}
        </div>
      </div>`;
  }).join('');

  // Wire action buttons
  stepsEl.querySelectorAll('.wf-action-btn[data-fn]').forEach(btn => {
    btn.addEventListener('click', () => handleWorkflowAction(btn.dataset.fn, btn.dataset.step, c));
  });

  // Wire "waiting" soft-state toggle
  stepsEl.querySelectorAll('.wf-action-btn[data-waitbtn]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = btn.textContent === '✓ Marked as waiting' ? (c.workflow.steps.find(s => s.id === btn.dataset.step)?.waiting || 'Waiting') : '✓ Marked as waiting';
    });
  });

  // Wire step completion by clicking done state
  stepsEl.querySelectorAll('.wf-step.active .wf-step-num').forEach(num => {
    const stepId = num.closest('.wf-step').dataset.step;
    num.style.cursor = 'default';
  });

  // Footer links
  const noteLink = document.getElementById('wf-note-link');
  if (noteLink) {
    noteLink.onclick = () => {
      const noteInput = document.getElementById('note-input');
      if (noteInput) { noteInput.focus(); noteInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    };
  }
}

function handleWorkflowAction(fn, stepId, c) {
  const step = c.workflow.steps.find(s => s.id === stepId);
  if (!step) return;

  // Auto-log to activity timeline
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (c.activityTimeline) {
    c.activityTimeline.unshift({
      date: now, type: 'note',
      title: step.label,
      detail: 'Action taken via review workflow'
    });
  }

  if (fn === 'email')  { generateAlignmentEmail(c); return; }
  if (fn === 'brief')  { generateAIBrief(); return; }
  if (fn === 'exec' || fn === 'notes')   { generateExecSummary(); return; }
  if (fn === 'audit')  { openModal('audit'); return; }
  if (fn === 'agenda') {
    openAlignmentModal('Call agenda — ' + c.name, 'Generating agenda...', true);
    const sys = `You are helping an MSP account manager prepare a meeting agenda. Plain text only, no markdown. Write a concise agenda: greeting/opening (1 sentence), 4-5 agenda items with suggested time per item drawn from the signals, and a proposed close with next steps. Be specific.`;
    const prompt = `Customer: ${c.name} | Contact: ${c.contact?.name} (${c.contact?.role})\nSignals: ${c.signals.map(s => s.title).join('; ')}\nWorkflow title: ${c.workflow.title}\nGenerate a meeting agenda.`;
    callAI(prompt, sys)
      .then(text => updateAlignmentModal(text, [{ label: 'Copy agenda', primary: true, action: 'copy' }, { label: 'Close' }]))
      .catch(() => updateAlignmentModal('Could not reach AI service.', [{ label: 'Close' }]));
    return;
  }
  if (fn === 'opp') {
    openAlignmentModal('Create opportunity — ' + c.name, 'This will open in Salesbuildr in the production version. In this demo, here is a summary of the opportunity to create:', false);
    document.getElementById('modal-body').innerHTML = `
      <div style="font-size:13px;line-height:1.7;color:var(--text-2);">
        <strong style="color:var(--text);">Customer:</strong> ${c.name}<br>
        <strong style="color:var(--text);">Contact:</strong> ${c.contact?.name || 'N/A'}<br>
        <strong style="color:var(--text);">Pipeline:</strong> ${c.oppTotal}<br>
        <strong style="color:var(--text);">Source:</strong> ${c.workflow.title}<br>
        <strong style="color:var(--text);">Recommended action:</strong> ${c.priority.action}
      </div>`;
    document.getElementById('modal-footer').innerHTML = `<button class="modal-btn primary">Open in Salesbuildr ↗</button><button class="modal-btn" onclick="document.getElementById('modal-overlay').classList.remove('open');document.body.style.overflow='';">Close</button>`;
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('modal-overlay').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    return;
  }
  // Mark step done for any unhandled action
  workflowStepDone.add(stepId);
  renderWorkflow(c);
}

/* ══════════════════════════════════════════
   MY WORK TODAY DATA — Full week structure
   ══════════════════════════════════════════ */

const TASK_LIBRARY = {
  w1: { id: 'w1', text: 'Review backup failure signals',             source: 'RMM · completed 9:14am',              modal: 'backup_abc',   custKey: 'abc',   taskSignal: false },
  w2: { id: 'w2', text: 'Schedule Windows 10 refresh discussion',    source: 'Signal · 14 devices · EOL Oct 2026',  modal: 'eol',          custKey: 'abc',   taskSignal: true,
    taskBrief: '14 devices are hitting Windows 10 EOL in 10 months. The refresh planning window opens now — waiting until EOL creates emergency pricing and rushed deployments. Tom hasn\'t discussed this yet.',
    taskWhy: 'Longest planning horizon · $12–18k revenue · First-mover advantage',
    taskContext: { devices: '14 endpoints', eol: 'Oct 14, 2026 · 10 months', budget: '$12,000 – $18,000', lastDiscussed: 'Not yet raised', source: 'RMM · NinjaRMM', confidence: '94% — verified device scan' },
    oppTitle: 'Device Refresh — Windows 10 EOL' },
  w3: { id: 'w3', text: 'Follow up — device refresh email to Tom',   source: 'Opportunity · awaiting response',     modal: 'opp_abc_1',    custKey: 'abc',   taskSignal: true,
    taskBrief: 'Tom was contacted 3 days ago about the revised device pricing. No response yet. A brief follow-up keeps the deal moving without pressure.',
    taskWhy: 'Deal at risk · $14,800 pipeline · Awaiting response',
    taskContext: { contacted: 'Jun 15 · 3 days ago', value: '$14,800', units: '14 devices', status: 'Waiting for response', source: 'Salesbuildr · Opportunity', confidence: '100% — email logged' },
    oppTitle: 'Device Refresh — Windows 10 EOL' },
  w4: { id: 'w4', text: 'Follow up on server refresh proposal',      source: 'Opportunity · no response in 8 days', modal: 'opp_river_1',  custKey: 'river', taskSignal: true,
    taskBrief: 'Marcus has not responded to the server refresh proposal in 8 days. Server warranty expires in 6 months — delay now compresses the implementation window.',
    taskWhy: '$12,000 pipeline · Warranty window closing · No response 8 days',
    taskContext: { proposal: 'Sent May 20', lastActivity: 'Jun 3 · 8 days ago', value: '$12,000', status: 'No response', source: 'RMM · Warranty data', confidence: '91% — vendor warranty record' },
    oppTitle: 'Server Refresh — 3 Servers EOW' },
  w5: { id: 'w5', text: 'Escalate backup target disk failure',       source: 'RMM · SMART errors · urgent',         modal: 'backup_river', custKey: 'river', taskSignal: true,
    taskBrief: 'SMART errors on SRV-RIVER-03 indicate imminent disk failure. Backup SLA at risk — Marcus must be notified immediately.',
    taskWhy: 'SLA breach risk · Urgent remediation · Client notification required',
    taskContext: { server: 'SRV-RIVER-03', detected: 'Jun 8', risk: 'Imminent disk failure', sla: 'Backup SLA at risk', source: 'RMM · SMART monitoring', confidence: '98% — real-time sensor alert' },
    oppTitle: null },
  w6: { id: 'w6', text: 'Prepare Q3 compliance audit agenda',        source: 'Salesbuildr · audit in 60 days',      modal: 'audit',        custKey: 'peak',  taskSignal: true,
    taskBrief: 'The Q3 compliance audit is 60 days away. Rachel confirmed all four workstreams in May. Preparing the agenda now shows Peak Financial you\'re ahead of schedule.',
    taskWhy: 'Audit in 60 days · Scope confirmed · $4,000 engagement',
    taskContext: { auditDate: 'Aug 2026 · 60 days', scope: '4 workstreams confirmed', value: '$4,000', contact: 'Rachel Chen · CFO', source: 'Salesbuildr · Agreement', confidence: '100% — scope confirmed by CFO' },
    oppTitle: 'Annual Compliance Audit' },
  w7: { id: 'w7', text: 'Call Marcus — server refresh decision due', source: 'Scheduled follow-up · Jun 19',        modal: 'opp_river_1',  custKey: 'river', taskSignal: true,
    taskBrief: 'Marcus was given until Jun 19 to decide on cloud vs on-prem for the server refresh. Today is the day to call and close the direction.',
    taskWhy: '$12,000 pipeline · Decision deadline today',
    taskContext: { deadline: 'Jun 19 · today', value: '$12,000', options: 'Cloud vs on-prem', source: 'CGOS · Scheduled follow-up', confidence: '100% — manually scheduled' },
    oppTitle: 'Server Refresh — 3 Servers EOW' },
  w8: { id: 'w8', text: 'Peak Financial — pre-call brief review',    source: 'Scheduled · Jun 20 call at 2pm',      modal: 'audit',        custKey: 'peak',  taskSignal: true,
    taskBrief: 'You have a call with Rachel Chen on Friday at 2pm. Review the compliance audit brief and confirm all four workstreams are documented before the call.',
    taskWhy: 'Call Friday 2pm · $4,000 audit · Rachel Chen CFO',
    taskContext: { callDate: 'Jun 20 · Friday 2pm', contact: 'Rachel Chen · CFO', prep: 'Audit brief + workstream checklist', source: 'Calendar · Scheduled', confidence: '100% — call confirmed' },
    oppTitle: 'Annual Compliance Audit' },
  w9: { id: 'w9', text: 'ABC — security scope — draft email to Tom', source: 'Carried over · was due Jun 17',       modal: 'secrev',       custKey: 'abc',   taskSignal: true, overdue: true, overdueLabel: 'From yesterday',
    taskBrief: 'This task was due yesterday. The security assessment conversation with Tom has not been started. Every day of delay reduces urgency.',
    taskWhy: 'Overdue · Security review 14 months · $3,500 opportunity',
    taskContext: { originalDue: 'Jun 17 · yesterday', status: 'Not started', value: '$3,500', source: 'Salesbuildr · Signal', confidence: '88% — overdue flag' },
    oppTitle: 'Security & Compliance Assessment' }
};

const WEEK_SCHEDULE = {
  'Tue Jun 16': { done: ['w1'], tasks: [
    { id: 'w1', custKey: 'abc' }, { id: 'w2', custKey: 'abc' },
    { id: 'w4', custKey: 'river' }, { id: 'w5', custKey: 'river' }
  ]},
  'Wed Jun 17': { done: [], tasks: [
    { id: 'w9', custKey: 'abc' },
    { id: 'w3', custKey: 'abc' },
    { id: 'w6', custKey: 'peak' }
  ]},
  'Thu Jun 18': { done: ['w1'], tasks: [
    { id: 'w1', custKey: 'abc' }, { id: 'w2', custKey: 'abc' },
    { id: 'w3', custKey: 'abc' }, { id: 'w4', custKey: 'river' },
    { id: 'w5', custKey: 'river' }, { id: 'w6', custKey: 'peak' }
  ]},
  'Fri Jun 19': { done: [], tasks: [
    { id: 'w7', custKey: 'river' }, { id: 'w6', custKey: 'peak' }
  ]},
  'Sat Jun 20': { done: [], tasks: [
    { id: 'w8', custKey: 'peak' }
  ]}
};

const TODAY_KEY = 'Thu Jun 18';

function buildDayCustomers(dayKey) {
  const day = WEEK_SCHEDULE[dayKey];
  if (!day) return [];
  const byCustomer = {};
  day.tasks.forEach(t => {
    const task = Object.assign({}, TASK_LIBRARY[t.id]);
    task.done = day.done.includes(t.id) || completedActivities.has(t.id);
    if (!byCustomer[t.custKey]) byCustomer[t.custKey] = [];
    byCustomer[t.custKey].push(task);
  });
  const priorityMap = { abc: 'urgent', river: 'review', peak: 'ok' };
  const nameMap     = { abc: 'ABC Manufacturing', river: 'River Tech Solutions', peak: 'Peak Financial Group' };
  return Object.entries(byCustomer).map(([key, activities]) => ({
    key, name: nameMap[key], priority: priorityMap[key], activities
  }));
}

const WORK_TODAY = { date: TODAY_KEY, customers: [] }; // populated after completedActivities is defined

/* Track completed activities in session */
const completedActivities = new Set(['w1']);

// Populate today's tasks now that completedActivities exists
WORK_TODAY.customers = buildDayCustomers(TODAY_KEY);

/* Track task status — persists through session */
const taskStatus = {
  w2: { status: 'pending', lastAction: null, nextStep: null, followUpDate: null },
  w3: { status: 'waiting', lastAction: 'Proposal sent Jun 4', nextStep: 'Follow up if no response', followUpDate: 'Jun 19' },
  w4: { status: 'waiting', lastAction: 'Proposal sent May 20', nextStep: 'Call Marcus — 8 days no response', followUpDate: 'Today' },
  w5: { status: 'pending', lastAction: null, nextStep: 'Notify client immediately', followUpDate: null },
  w6: { status: 'pending', lastAction: 'Scope confirmed May 28', nextStep: 'Prepare agenda', followUpDate: null }
};

/* ══════════════════════════════════════════
   PORTFOLIO DATA
   ══════════════════════════════════════════ */
const PORTFOLIO = [
  { key: 'abc',    name: 'ABC Manufacturing',     type: 'Fully Managed', location: 'Houston, TX',   priority: 'urgent', health: 82, highSigs: 2, medSigs: 3, okSigs: 1, mrr: '$3,840', lastReview: '8 months ago', overdue: true  },
  { key: 'river',  name: 'River Tech Solutions',  type: 'Co-Managed',   location: 'Austin, TX',    priority: 'review', health: 71, highSigs: 2, medSigs: 2, okSigs: 1, mrr: '$2,100', lastReview: '4 months ago', overdue: false },
  { key: 'peak',   name: 'Peak Financial Group',  type: 'Fully Managed', location: 'Denver, CO',    priority: 'ok',     health: 91, highSigs: 0, medSigs: 1, okSigs: 2, mrr: '$5,200', lastReview: '2 months ago', overdue: false }
];

/* ══════════════════════════════════════════
   MODAL CONTENT
   Each modal can have: title, tabs[], footer[]
   tabs: [{ label, html }]
   Single-tab modals still use the tabs array (length 1, tabs UI hidden)
   ══════════════════════════════════════════ */
const MODALS = {

  eol: {
    title: '14 devices reaching Windows 10 EOL',
    tabs: [{
      label: 'Device list',
      html: `
        <table class="modal-table">
          <thead><tr><th>Device</th><th>OS</th><th>EOL date</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>DESK-MFG-004</td><td>Win 10 Pro</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2025</td><td><span class="eol-badge eol-critical">Critical</span></td></tr>
            <tr><td>DESK-MFG-011</td><td>Win 10 Pro</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2025</td><td><span class="eol-badge eol-critical">Critical</span></td></tr>
            <tr><td>DESK-MFG-017</td><td>Win 10 Home</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Jan 2026</td><td><span class="eol-badge eol-soon">Soon</span></td></tr>
            <tr><td>LAPTOP-EXEC-02</td><td>Win 10 Pro</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Jan 2026</td><td><span class="eol-badge eol-soon">Soon</span></td></tr>
            <tr><td>DESK-MFG-023</td><td>Win 10 Pro</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Mar 2026</td><td><span class="eol-badge eol-soon">Soon</span></td></tr>
            <tr><td style="color:var(--text-2);">+ 9 additional devices</td><td></td><td style="font-family:'Courier New',monospace;color:var(--text-3);">Mar–Oct 2026</td><td><span class="eol-badge eol-ok">On track</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Estimated refresh budget: <strong>$12,000 – $18,000</strong> &middot; 14 units @ avg $900–$1,300 per device</div>`
    }],
    footer: [{ label: 'Create opportunity in Salesbuildr', primary: true }, { label: 'Export device list' }]
  },

  labor: {
    title: 'Labor utilization 27% over agreement',
    tabs: [{
      label: 'Utilization breakdown',
      html: `
        <table class="modal-table">
          <thead><tr><th>Period</th><th>Included hours</th><th>Actual hours</th><th>Variance</th></tr></thead>
          <tbody>
            <tr><td>This month</td><td>25 hrs</td><td style="color:var(--danger);">42 hrs</td><td><span class="eol-badge eol-critical">+68%</span></td></tr>
            <tr><td>Last month</td><td>25 hrs</td><td style="color:var(--warn);">34 hrs</td><td><span class="eol-badge eol-soon">+36%</span></td></tr>
            <tr><td>Month before</td><td>25 hrs</td><td>27 hrs</td><td><span class="eol-badge eol-ok">+8%</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Trend: over-runs are increasing month-on-month. An agreement adjustment of <strong>+$450/mo MRR</strong> would align scope with actual usage.</div>`
    }],
    footer: [{ label: 'Create scope review opportunity', primary: true }, { label: 'View full ticket breakdown' }]
  },

  users: {
    title: 'User count +18% — licensed users & managed computers',
    tabs: [
      {
        label: 'Licensed users (47)',
        html: `
          <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">&#9651; 3 users flagged — review recommended before next billing cycle</div>
          <table class="modal-table">
            <thead><tr><th>Name</th><th>Role</th><th>Last login</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Sarah Mitchell</td><td>Plant Manager</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr><td>James Kowalski</td><td>Engineer</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Yesterday</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr><td>Priya Anand</td><td>Finance</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">2 days ago</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr class="row-warn"><td><strong>Tom Reardon</strong></td><td>Sales (left Mar 2026)</td><td style="font-family:'Courier New',monospace;color:var(--warn);">89 days ago</td><td><span class="eol-badge eol-soon">Dismissed?</span></td></tr>
              <tr class="row-warn"><td><strong>Lisa Okafor</strong></td><td>HR (left Apr 2026)</td><td style="font-family:'Courier New',monospace;color:var(--warn);">61 days ago</td><td><span class="eol-badge eol-soon">Dismissed?</span></td></tr>
              <tr class="row-danger"><td><strong>Dave Chu</strong></td><td>IT Contractor</td><td style="font-family:'Courier New',monospace;color:var(--danger);">127 days ago</td><td><span class="eol-badge eol-critical">Deactivate</span></td></tr>
              <tr><td style="color:var(--text-2);">+ 41 active users</td><td></td><td></td><td><span class="eol-badge eol-ok">Active</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat">3 accounts haven't logged in for 60+ days. <strong>Recommend deactivating</strong> before next M365 billing — potential saving of 3 seats (~$69/mo).</div>`
      },
      {
        label: 'Managed computers (47)',
        html: `
          <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">&#9651; 2 devices flagged — no activity in 60+ days</div>
          <table class="modal-table">
            <thead><tr><th>Device</th><th>Assigned to</th><th>Last seen</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>DESK-MFG-001</td><td>Sarah Mitchell</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr><td>DESK-MFG-002</td><td>James Kowalski</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr><td>LAPTOP-EXEC-01</td><td>Priya Anand</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Yesterday</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr class="row-warn"><td><strong>DESK-MFG-031</strong></td><td>Tom Reardon (left)</td><td style="font-family:'Courier New',monospace;color:var(--warn);">89 days ago</td><td><span class="eol-badge eol-soon">Dormant</span></td></tr>
              <tr class="row-danger"><td><strong>LAPTOP-SALES-07</strong></td><td>Unassigned</td><td style="font-family:'Courier New',monospace;color:var(--danger);">134 days ago</td><td><span class="eol-badge eol-critical">Dormant</span></td></tr>
              <tr><td style="color:var(--text-2);">+ 42 active devices</td><td></td><td></td><td><span class="eol-badge eol-ok">Active</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat">2 devices are dormant. <strong>Recommend audit</strong> to confirm hardware location and whether managed service billing should be adjusted.</div>`
      }
    ],
    footer: [{ label: 'Flag for offboarding review', primary: true }, { label: 'Export full user list' }]
  },

  users_river: {
    title: 'User & device audit — River Tech Solutions',
    tabs: [
      {
        label: 'Licensed users (28)',
        html: `
          <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">&#9651; 1 user flagged for review</div>
          <table class="modal-table">
            <thead><tr><th>Name</th><th>Role</th><th>Last login</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Marcus Webb</td><td>Director</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr><td>Chloe Park</td><td>Dev</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr class="row-warn"><td><strong>Ben Hartley</strong></td><td>Contractor (expired)</td><td style="font-family:'Courier New',monospace;color:var(--warn);">74 days ago</td><td><span class="eol-badge eol-soon">Review</span></td></tr>
              <tr><td style="color:var(--text-2);">+ 25 active users</td><td></td><td></td><td><span class="eol-badge eol-ok">Active</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat">1 contractor account appears to be expired. Recommend confirming status and deactivating if no longer required.</div>`
      },
      {
        label: 'Managed computers (28)',
        html: `
          <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">&#9651; 2 devices flagged as dormant</div>
          <table class="modal-table">
            <thead><tr><th>Device</th><th>Assigned to</th><th>Last seen</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>RIVER-WS-01</td><td>Marcus Webb</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today</td><td><span class="eol-badge eol-ok">Active</span></td></tr>
              <tr class="row-warn"><td><strong>RIVER-WS-14</strong></td><td>Ben Hartley</td><td style="font-family:'Courier New',monospace;color:var(--warn);">74 days ago</td><td><span class="eol-badge eol-soon">Dormant</span></td></tr>
              <tr class="row-danger"><td><strong>RIVER-LAPTOP-03</strong></td><td>Unassigned</td><td style="font-family:'Courier New',monospace;color:var(--danger);">143 days ago</td><td><span class="eol-badge eol-critical">Dormant</span></td></tr>
              <tr><td style="color:var(--text-2);">+ 25 active devices</td><td></td><td></td><td><span class="eol-badge eol-ok">Active</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat">2 dormant devices found. Confirm hardware location — if no longer in use, remove from managed service billing.</div>`
      }
    ],
    footer: [{ label: 'Flag for offboarding review', primary: true }, { label: 'Export device list' }]
  },

  backup_abc: {
    title: 'Backup status — ABC Manufacturing',
    tabs: [
      {
        label: 'Job history (30 days)',
        html: `
          <table class="modal-table">
            <thead><tr><th>Device / target</th><th>Type</th><th>Last success</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>SRV-ABC-FILE</td><td>Full + incremental</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today 02:14</td><td><span class="eol-badge eol-ok">Healthy</span></td></tr>
              <tr><td>SRV-ABC-APP</td><td>Full + incremental</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today 02:31</td><td><span class="eol-badge eol-ok">Healthy</span></td></tr>
              <tr><td>DESK-MFG-004</td><td>Image backup</td><td style="font-family:'Courier New',monospace;color:var(--warn);">6 days ago</td><td><span class="eol-badge eol-soon">Warning</span></td></tr>
              <tr><td>DESK-MFG-011</td><td>Image backup</td><td style="font-family:'Courier New',monospace;color:var(--warn);">8 days ago</td><td><span class="eol-badge eol-soon">Warning</span></td></tr>
              <tr><td>LAPTOP-EXEC-02</td><td>Cloud backup</td><td style="font-family:'Courier New',monospace;color:var(--danger);">14 days ago</td><td><span class="eol-badge eol-critical">Failed</span></td></tr>
              <tr><td>DESK-MFG-017</td><td>Image backup</td><td style="font-family:'Courier New',monospace;color:var(--danger);">19 days ago</td><td><span class="eol-badge eol-critical">Failed</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat">14% failure rate this month vs 3% last month. Failures concentrated on endpoint image backups — likely agent update issue. <strong>2 endpoints have no successful backup in 14+ days.</strong></div>`
      },
      {
        label: 'Storage & retention',
        html: `
          <table class="modal-table">
            <thead><tr><th>Backup target</th><th>Used storage</th><th>Retention</th><th>Last verified restore</th></tr></thead>
            <tbody>
              <tr><td>SRV-ABC-FILE</td><td>1.2 TB</td><td>30 days</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Mar 2026</td></tr>
              <tr><td>SRV-ABC-APP</td><td>480 GB</td><td>30 days</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Mar 2026</td></tr>
              <tr><td>Endpoint pool</td><td>620 GB</td><td>14 days</td><td style="font-family:'Courier New',monospace;color:var(--warn);">Nov 2025</td></tr>
            </tbody>
          </table>
          <div class="modal-stat">Last verified restore test was <strong>Nov 2025 — 7 months ago</strong>. Best practice is quarterly. Recommend scheduling a test restore as part of the next strategic review.</div>`
      }
    ],
    footer: [{ label: 'Create backup remediation ticket', primary: true }, { label: 'Schedule restore test' }]
  },

  backup_river: {
    title: 'Backup status — River Tech Solutions',
    tabs: [
      {
        label: 'Job history (30 days)',
        html: `
          <table class="modal-table">
            <thead><tr><th>Device / target</th><th>Type</th><th>Last success</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>SRV-RIVER-01</td><td>Full + incremental</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Today 03:10</td><td><span class="eol-badge eol-ok">Healthy</span></td></tr>
              <tr><td>SRV-RIVER-02</td><td>Full + incremental</td><td style="font-family:'Courier New',monospace;color:var(--warn);">4 days ago</td><td><span class="eol-badge eol-soon">Warning</span></td></tr>
              <tr><td>SRV-RIVER-03</td><td>Backup target</td><td style="font-family:'Courier New',monospace;color:var(--danger);">Disk warnings</td><td><span class="eol-badge eol-critical">At risk</span></td></tr>
              <tr><td>RIVER-WS-01</td><td>Cloud backup</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Yesterday</td><td><span class="eol-badge eol-ok">Healthy</span></td></tr>
            </tbody>
          </table>
          <div class="modal-stat"><strong>SRV-RIVER-03 is the backup target and is showing disk health warnings.</strong> This explains the 22% failure rate increase — the backup destination is degrading. Urgent action needed before data loss occurs.</div>`
      },
      {
        label: 'Storage & retention',
        html: `
          <table class="modal-table">
            <thead><tr><th>Backup target</th><th>Used storage</th><th>Disk health</th><th>Last verified restore</th></tr></thead>
            <tbody>
              <tr><td>SRV-RIVER-01</td><td>780 GB</td><td style="color:var(--good);">Good</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Feb 2026</td></tr>
              <tr><td>SRV-RIVER-03 (target)</td><td>2.1 TB</td><td style="color:var(--danger);font-weight:500;">SMART errors</td><td style="font-family:'Courier New',monospace;color:var(--warn);">Sep 2025</td></tr>
            </tbody>
          </table>
          <div class="modal-stat">SRV-RIVER-03 SMART errors indicate imminent disk failure. <strong>Backup target needs immediate replacement</strong> — this directly drives the server refresh conversation.</div>`
      }
    ],
    footer: [{ label: 'Create urgent remediation ticket', primary: true }, { label: 'Link to server refresh opportunity' }]
  },

  secrev: {
    title: 'No security review in 14 months',
    tabs: [{
      label: 'Review history',
      html: `
        <table class="modal-table">
          <thead><tr><th>Review type</th><th>Last completed</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Security assessment</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Apr 2025</td><td><span class="eol-badge eol-critical">Overdue</span></td></tr>
            <tr><td>Penetration test</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Never</td><td><span class="eol-badge eol-soon">Recommended</span></td></tr>
            <tr><td>Compliance audit</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Dec 2024</td><td><span class="eol-badge eol-ok">Within range</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Recommended: annual security assessment at <strong>$3,500</strong>. Manufacturing sector carries elevated OT/IT convergence risk.</div>`
    }],
    footer: [{ label: 'Create security assessment opportunity', primary: true }]
  },

  m365ok: {
    title: 'M365 licensing aligned',
    tabs: [{ label: 'Status', html: `<div style="font-size:13px;color:var(--text-2);line-height:1.6;">No action required. Current M365 Business Standard licensing is aligned with active user count. Next review recommended at onboarding of 5+ new users or at contract renewal.</div>` }],
    footer: []
  },

  servers: {
    title: '3 servers approaching end of warranty',
    tabs: [{
      label: 'Server list',
      html: `
        <table class="modal-table">
          <thead><tr><th>Server</th><th>Role</th><th>Warranty expires</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>SRV-RIVER-01</td><td>File server</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Aug 2026</td><td><span class="eol-badge eol-critical">Critical</span></td></tr>
            <tr><td>SRV-RIVER-02</td><td>Application</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Sep 2026</td><td><span class="eol-badge eol-soon">Soon</span></td></tr>
            <tr><td>SRV-RIVER-03</td><td>Backup target</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Nov 2026</td><td><span class="eol-badge eol-soon">Soon</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Estimated refresh: <strong>$8,000 – $15,000</strong> depending on physical vs. cloud migration route. Note: SRV-RIVER-03 also has active disk warnings — see Backup Status signal.</div>`
    }],
    footer: [{ label: 'Create server refresh opportunity', primary: true }, { label: 'Compare cloud migration options' }]
  },

  ssl: {
    title: 'SSL certificates expiring in 45 days',
    tabs: [{
      label: 'Certificates',
      html: `
        <table class="modal-table">
          <thead><tr><th>Domain</th><th>Expires</th><th>Auto-renew</th></tr></thead>
          <tbody>
            <tr><td>rivertech.com</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Jul 22, 2026</td><td style="color:var(--warn);">No</td></tr>
            <tr><td>portal.rivertech.com</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Jul 28, 2026</td><td style="color:var(--warn);">No</td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Both certificates require manual renewal. Confirm process with client — low urgency but act before the 30-day mark.</div>`
    }],
    footer: [{ label: 'Log renewal reminder' }]
  },

  audit: {
    title: 'Annual compliance audit due in 60 days',
    tabs: [{
      label: 'Audit checklist',
      html: `
        <table class="modal-table">
          <thead><tr><th>Audit item</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Documentation review</td><td><span class="eol-badge eol-ok">Ready</span></td></tr>
            <tr><td>Access control audit</td><td><span class="eol-badge eol-soon">In preparation</span></td></tr>
            <tr><td>Incident response plan</td><td><span class="eol-badge eol-soon">Update needed</span></td></tr>
            <tr><td>Vendor risk assessment</td><td><span class="eol-badge eol-critical">Not started</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Estimated audit engagement: <strong>$4,000</strong>. Financial sector compliance carries elevated penalties for lapses.</div>`
    }],
    footer: [{ label: 'Generate agenda', primary: true, actionFn: 'generate-audit-agenda' }, { label: 'Create audit opportunity', actionFn: 'create-audit-opp' }]
  },

  patches: {
    title: 'All security patches current',
    tabs: [{ label: 'Status', html: `<div style="font-size:13px;color:var(--text-2);line-height:1.6;">63 managed devices — 100% patch compliance. Last full scan completed today. No action required. This is a strong positive talking point for the next customer conversation.</div>` }],
    footer: []
  },

  tickets: {
    title: 'Ticket volume down 8%',
    tabs: [{
      label: 'Summary',
      html: `
        <table class="modal-table">
          <thead><tr><th>Period</th><th>Tickets</th><th>Avg resolution</th></tr></thead>
          <tbody>
            <tr><td>Last 90 days</td><td style="color:var(--good);">46</td><td>3.2 hrs</td></tr>
            <tr><td>Prior 90 days</td><td>50</td><td>3.8 hrs</td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Service delivery is strong. Use this as an opening talking point — it reinforces the value of the managed service and builds goodwill before strategic topics.</div>`
    }],
    footer: []
  },

  /* ── Alignment modals ── */

  align_licensing_abc: {
    title: 'Agreement vs Licensing — ABC Manufacturing',
    tabs: [{
      label: 'Licensing breakdown',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Contracted seats vs actual M365 assignments — 3 unlicensed users detected</div>
        <table class="modal-table">
          <thead><tr><th>License type</th><th>Contracted</th><th>In use</th><th>Variance</th></tr></thead>
          <tbody>
            <tr><td>M365 Business Standard</td><td>40</td><td style="color:var(--danger);">47</td><td><span class="eol-badge eol-critical">-7 seats</span></td></tr>
            <tr><td>M365 Business Basic</td><td>5</td><td>3</td><td><span class="eol-badge eol-ok">+2 spare</span></td></tr>
            <tr><td>Intune Device Mgmt</td><td>45</td><td>47</td><td><span class="eol-badge eol-soon">-2 seats</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">7 users are operating on M365 Business Standard without a contracted seat. At $22/user/mo this represents <strong>$1,848/yr in unbilled licensing</strong>. Agreement needs updating to reflect current headcount.</div>`
    }],
    footer: [{ label: 'Update agreement in Salesbuildr', primary: true }, { label: 'Create licensing review opportunity' }]
  },

  align_devices_abc: {
    title: 'Agreement vs Managed Devices — ABC Manufacturing',
    tabs: [{
      label: 'Device scope',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">2 devices managed outside contracted scope</div>
        <table class="modal-table">
          <thead><tr><th>Category</th><th>Contracted</th><th>Actual managed</th><th>Variance</th></tr></thead>
          <tbody>
            <tr><td>Workstations</td><td>40</td><td>42</td><td><span class="eol-badge eol-soon">+2</span></td></tr>
            <tr><td>Laptops</td><td>5</td><td>5</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Servers</td><td>2</td><td>2</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">2 workstations are being managed outside the contracted scope — likely added during the recent user growth period. At $45/device/mo this is <strong>$1,080/yr in unrecovered revenue</strong>.</div>`
    }],
    footer: [{ label: 'Update agreement scope', primary: true }, { label: 'Create scope adjustment opportunity' }]
  },

  align_security_abc: {
    title: 'Security Coverage — ABC Manufacturing',
    tabs: [{
      label: 'Coverage assessment',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">3 of 7 recommended security layers are missing or partially deployed</div>
        <table class="modal-table">
          <thead><tr><th>Security layer</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Endpoint Detection & Response</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All 47 endpoints</td></tr>
            <tr><td>Multi-Factor Authentication</td><td><span class="eol-badge eol-soon">Partial</span></td><td style="color:var(--text-2);font-size:11px;">31 of 47 users enrolled</td></tr>
            <tr><td>DNS Filtering</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All endpoints</td></tr>
            <tr><td>Email Security (DMARC/DKIM)</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">Configured</td></tr>
            <tr><td>Security Awareness Training</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
            <tr><td>Privileged Access Management</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
            <tr><td>Dark Web Monitoring</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
          </tbody>
        </table>
        <div class="modal-stat">MFA gap is the most urgent — 16 users without MFA is a significant exposure in a manufacturing environment with OT/IT convergence risk. Security awareness training adds <strong>$2,350/yr</strong> to agreement value.</div>`
    }],
    footer: [{ label: 'Create security assessment opportunity', primary: true }, { label: 'Schedule security review' }]
  },

  align_billing_abc: {
    title: 'Billing Reconciliation — ABC Manufacturing',
    tabs: [{
      label: 'Billing vs contract',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Billing is 97% aligned — 1 minor line item discrepancy found</div>
        <table class="modal-table">
          <thead><tr><th>Line item</th><th>Contracted</th><th>Billed</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Managed workstations (40)</td><td>$1,800/mo</td><td>$1,800/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Server management (2)</td><td>$400/mo</td><td>$400/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>M365 management</td><td>$480/mo</td><td>$480/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Backup management</td><td>$160/mo</td><td style="color:var(--warn);">$140/mo</td><td><span class="eol-badge eol-soon">Under-billed $20</span></td></tr>
            <tr><td>Security tools</td><td>$1,000/mo</td><td>$1,020/mo</td><td><span class="eol-badge eol-soon">Over-billed $20</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Net discrepancy is $0 — the under and over billing cancel out. <strong>No financial adjustment needed</strong> but line items should be corrected for clarity at next agreement review.</div>`
    }],
    footer: [{ label: 'Flag for agreement review', primary: true }]
  },

  align_licensing_river: {
    title: 'Agreement vs Licensing — River Tech Solutions',
    tabs: [{
      label: 'Licensing breakdown',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Contractor account active outside agreement scope</div>
        <table class="modal-table">
          <thead><tr><th>License type</th><th>Contracted</th><th>In use</th><th>Variance</th></tr></thead>
          <tbody>
            <tr><td>M365 Business Standard</td><td>25</td><td>26</td><td><span class="eol-badge eol-soon">-1 seat</span></td></tr>
            <tr><td>M365 Business Basic</td><td>3</td><td>2</td><td><span class="eol-badge eol-ok">+1 spare</span></td></tr>
            <tr><td>Intune Device Mgmt</td><td>28</td><td>28</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">1 unlicensed seat (Ben Hartley — expired contractor). Deactivating this account would bring licensing into alignment and <strong>save $22/mo</strong>.</div>`
    }],
    footer: [{ label: 'Deactivate contractor account', primary: true }, { label: 'Update agreement' }]
  },

  align_devices_river: {
    title: 'Agreement vs Managed Devices — River Tech Solutions',
    tabs: [{
      label: 'Device scope',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">2 dormant devices being billed — not in active use</div>
        <table class="modal-table">
          <thead><tr><th>Category</th><th>Contracted</th><th>Actual managed</th><th>Active</th></tr></thead>
          <tbody>
            <tr><td>Workstations</td><td>25</td><td>27</td><td style="color:var(--warn);">25 active, 2 dormant</td></tr>
            <tr><td>Servers</td><td>3</td><td>3</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">2 workstations (RIVER-WS-14 and RIVER-LAPTOP-03) have been dormant for 74 and 143 days respectively. If decommissioned, <strong>scope reduces by $90/mo</strong> — worth confirming with client whether these should remain managed.</div>`
    }],
    footer: [{ label: 'Schedule device audit with client', primary: true }, { label: 'Flag for scope review' }]
  },

  align_security_river: {
    title: 'Security Coverage — River Tech Solutions',
    tabs: [{
      label: 'Coverage assessment',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">4 of 7 security layers missing — significant coverage gap</div>
        <table class="modal-table">
          <thead><tr><th>Security layer</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Endpoint Detection & Response</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All endpoints</td></tr>
            <tr><td>Multi-Factor Authentication</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">0 users enrolled</td></tr>
            <tr><td>DNS Filtering</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All endpoints</td></tr>
            <tr><td>Email Security (DMARC/DKIM)</td><td><span class="eol-badge eol-soon">Partial</span></td><td style="color:var(--text-2);font-size:11px;">DKIM only</td></tr>
            <tr><td>Security Awareness Training</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
            <tr><td>Privileged Access Management</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
            <tr><td>Dark Web Monitoring</td><td><span class="eol-badge eol-critical">Not deployed</span></td><td style="color:var(--text-2);font-size:11px;">Not in agreement</td></tr>
          </tbody>
        </table>
        <div class="modal-stat">MFA is entirely absent — no users enrolled. This is the most critical gap and should be the lead conversation. Full security stack expansion is a <strong>$3,200/yr opportunity</strong>.</div>`
    }],
    footer: [{ label: 'Create security stack opportunity', primary: true }, { label: 'Schedule MFA rollout' }]
  },

  align_billing_river: {
    title: 'Billing Reconciliation — River Tech Solutions',
    tabs: [{
      label: 'Billing vs contract',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Billing aligned — no discrepancies found</div>
        <table class="modal-table">
          <thead><tr><th>Line item</th><th>Contracted</th><th>Billed</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Managed workstations (25)</td><td>$1,125/mo</td><td>$1,125/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Server management (3)</td><td>$600/mo</td><td>$600/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>M365 management</td><td>$280/mo</td><td>$280/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Backup management</td><td>$95/mo</td><td>$95/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Billing is fully reconciled. <strong>No adjustments needed.</strong> Note that dormant device charges are technically accurate under the current agreement — client conversation needed to decide whether to adjust scope.</div>`
    }],
    footer: [{ label: 'No action required — close' }]
  },

  align_licensing_peak: {
    title: 'Agreement vs Licensing — Peak Financial Group',
    tabs: [{
      label: 'Licensing breakdown',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Licensing fully aligned across all tiers</div>
        <table class="modal-table">
          <thead><tr><th>License type</th><th>Contracted</th><th>In use</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>M365 E3</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Intune Device Mgmt</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Defender for Business</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Licensing is perfectly aligned. <strong>No action required.</strong> Next review point: if headcount grows beyond 65, a volume tier review may be beneficial.</div>`
    }],
    footer: []
  },

  align_devices_peak: {
    title: 'Agreement vs Managed Devices — Peak Financial Group',
    tabs: [{
      label: 'Device scope',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">All 63 devices within contracted scope</div>
        <table class="modal-table">
          <thead><tr><th>Category</th><th>Contracted</th><th>Actual managed</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Workstations</td><td>50</td><td>50</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Laptops</td><td>10</td><td>10</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Servers</td><td>3</td><td>3</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Device scope is fully aligned. <strong>No action required.</strong></div>`
    }],
    footer: []
  },

  align_security_peak: {
    title: 'Security Coverage — Peak Financial Group',
    tabs: [{
      label: 'Coverage assessment',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">6 of 7 security layers deployed — strong coverage for a financial client</div>
        <table class="modal-table">
          <thead><tr><th>Security layer</th><th>Status</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Endpoint Detection & Response</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All 63 endpoints</td></tr>
            <tr><td>Multi-Factor Authentication</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">100% enrolled</td></tr>
            <tr><td>DNS Filtering</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">All endpoints</td></tr>
            <tr><td>Email Security (DMARC/DKIM)</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">Fully configured</td></tr>
            <tr><td>Security Awareness Training</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">Quarterly programme</td></tr>
            <tr><td>Privileged Access Management</td><td><span class="eol-badge eol-ok">Deployed</span></td><td style="color:var(--text-2);font-size:11px;">Admin accounts only</td></tr>
            <tr><td>Dark Web Monitoring</td><td><span class="eol-badge eol-soon">Partial</span></td><td style="color:var(--text-2);font-size:11px;">Domain only, not personal</td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Excellent security posture for a financial services client. Extending dark web monitoring to cover personal emails used for business would close the final gap — <strong>$480/yr addition</strong>.</div>`
    }],
    footer: [{ label: 'Propose dark web monitoring expansion', primary: true }]
  },

  align_billing_peak: {
    title: 'Billing Reconciliation — Peak Financial Group',
    tabs: [{
      label: 'Billing vs contract',
      html: `
        <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Billing fully reconciled — no discrepancies</div>
        <table class="modal-table">
          <thead><tr><th>Line item</th><th>Contracted</th><th>Billed</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Managed endpoints (63)</td><td>$2,835/mo</td><td>$2,835/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>M365 E3 management</td><td>$945/mo</td><td>$945/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Security stack</td><td>$1,260/mo</td><td>$1,260/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
            <tr><td>Compliance management</td><td>$160/mo</td><td>$160/mo</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          </tbody>
        </table>
        <div class="modal-stat">Billing is perfectly reconciled. <strong>No adjustments needed.</strong> This client is your cleanest agreement — worth highlighting internally as a model for other accounts.</div>`
    }],
    footer: []
  },


  servers_abc: {
    title: '2 Server 2016 systems — EOL Oct 2026',
    tabs: [{ label: 'Server detail', html: `
      <table class="modal-table">
        <thead><tr><th>Server</th><th>Role</th><th>OS EOL</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>SRV-ABC-FILE</td><td>File server</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2026</td><td><span class="eol-badge eol-soon">Plan now</span></td></tr>
          <tr><td>SRV-ABC-APP</td><td>Application</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2026</td><td><span class="eol-badge eol-soon">Plan now</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Both servers reach OS end of life Oct 2026. Budget conversation should happen now — <strong>estimated $4,000–$6,000</strong> for replacement or cloud migration.</div>` }],
    footer: [{ label: 'Create server refresh opportunity', primary: true }]
  },
  fortinet: {
    title: 'Fortinet firewall renewal — 60 days',
    tabs: [{ label: 'Renewal detail', html: `
      <table class="modal-table">
        <thead><tr><th>Device</th><th>Licence type</th><th>Expiry</th><th>Annual cost</th></tr></thead>
        <tbody>
          <tr><td>FortiGate 60F</td><td>UTM Bundle</td><td style="font-family:'Courier New',monospace;color:var(--warn);">Aug 10, 2026</td><td>$1,200</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Renewal is in 60 days. Auto-renewal is not configured — <strong>manual action required</strong>. Consider upgrading to FortiGate 80F at renewal for improved throughput.</div>` }],
    footer: [{ label: 'Create renewal opportunity', primary: true }, { label: 'Log reminder' }]
  },
  veeam: {
    title: 'Veeam backup licence renewal — 90 days',
    tabs: [{ label: 'Renewal detail', html: `
      <table class="modal-table">
        <thead><tr><th>Product</th><th>Licences</th><th>Expiry</th><th>Annual cost</th></tr></thead>
        <tbody>
          <tr><td>Veeam Backup Essentials</td><td>2 sockets</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Sep 2026</td><td>$800</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Standard renewal — no issues flagged. Note: given current backup failure rate, consider discussing an upgrade to Veeam Business+ which includes improved monitoring.</div>` }],
    footer: [{ label: 'Log renewal reminder', primary: true }]
  },
  warranty_abc: {
    title: 'Warranty expiry — 3 workstations',
    tabs: [{ label: 'Device list', html: `
      <table class="modal-table">
        <thead><tr><th>Device</th><th>Warranty expires</th><th>Replacement cost</th></tr></thead>
        <tbody>
          <tr><td>DESK-MFG-031</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2026</td><td>$900</td></tr>
          <tr><td>DESK-MFG-032</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Oct 2026</td><td>$900</td></tr>
          <tr><td>LAPTOP-EXEC-03</td><td style="font-family:'Courier New',monospace;color:var(--text-2);">Nov 2026</td><td>$1,300</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">3 devices expire within 6 months. These overlap with the Win10 EOL conversation — consider bundling into a single refresh proposal for <strong>$3,100</strong>.</div>` }],
    footer: [{ label: 'Bundle into refresh proposal', primary: true }]
  },
  rmm_renewal: {
    title: 'RMM agent licence renewal — 45 days',
    tabs: [{ label: 'Renewal detail', html: `
      <table class="modal-table">
        <thead><tr><th>Product</th><th>Agents</th><th>Expiry</th><th>Annual cost</th></tr></thead>
        <tbody>
          <tr><td>NinjaRMM Professional</td><td>28</td><td style="font-family:'Courier New',monospace;color:var(--warn);">Jul 2026</td><td>$1,176</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Standard renewal — 45 days out. No changes anticipated. Confirm device count at renewal in case dormant devices have been decommissioned.</div>` }],
    footer: [{ label: 'Log renewal reminder', primary: true }]
  },


  /* ── Stage 2: New alignment modals ── */

  align_backup_abc: {
    title: 'Agreement vs Backup Coverage — ABC Manufacturing',
    tabs: [{ label: 'Backup agreement', html: `
      <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Backup coverage is below contracted scope — 2 endpoints unprotected</div>
      <table class="modal-table">
        <thead><tr><th>Coverage type</th><th>Contracted</th><th>Actual</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Server image backup</td><td>2 servers</td><td>2 servers</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Endpoint backup</td><td>47 endpoints</td><td style="color:var(--danger);">45 endpoints</td><td><span class="eol-badge eol-critical">Gap</span></td></tr>
          <tr><td>Cloud data backup</td><td>M365 included</td><td>Configured</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Verified restore test</td><td>Quarterly</td><td style="color:var(--danger);">Last: Nov 2025</td><td><span class="eol-badge eol-critical">Overdue</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">2 endpoints are not covered by the backup agreement. The restore test is also 7 months overdue. <strong>Recommended: remediate both before next billing review.</strong></div>` }],
    footer: [{ label: 'Create backup remediation ticket', primary: true }, { label: 'Schedule restore test' }]
  },

  align_users_abc: {
    title: 'Agreement vs User Count — ABC Manufacturing',
    tabs: [{ label: 'User count detail', html: `
      <table class="modal-table">
        <thead><tr><th>Metric</th><th>Agreement</th><th>Actual</th><th>Variance</th></tr></thead>
        <tbody>
          <tr><td>Contracted users</td><td>40</td><td style="color:var(--danger);">47</td><td><span class="eol-badge eol-critical">+7 users</span></td></tr>
          <tr><td>M365 seats</td><td>40</td><td style="color:var(--danger);">47</td><td><span class="eol-badge eol-critical">7 unlicensed</span></td></tr>
          <tr><td>Managed endpoints/user</td><td>1.0</td><td>1.0</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">7 users are active above the contracted count. At $22/user/mo (M365) + $18/user/mo (management fee) this is <strong>$1,680/yr in unrecovered revenue</strong>. Agreement update needed.</div>` }],
    footer: [{ label: 'Update agreement to 47 users', primary: true }, { label: 'Create licensing opportunity' }]
  },

  align_backup_river: {
    title: 'Agreement vs Backup Coverage — River Tech Solutions',
    tabs: [{ label: 'Backup agreement', html: `
      <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Backup target hardware failure is breaking contracted coverage commitments</div>
      <table class="modal-table">
        <thead><tr><th>Coverage type</th><th>Contracted</th><th>Actual</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Server image backup</td><td>3 servers</td><td style="color:var(--danger);">2 healthy, 1 failing</td><td><span class="eol-badge eol-critical">At risk</span></td></tr>
          <tr><td>Endpoint backup</td><td>28 endpoints</td><td>26 endpoints</td><td><span class="eol-badge eol-soon">Gap</span></td></tr>
          <tr><td>Verified restore test</td><td>Quarterly</td><td style="color:var(--danger);">Last: Sep 2025</td><td><span class="eol-badge eol-critical">9 months overdue</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">SRV-RIVER-03 disk failure is actively breaking the backup SLA. This is a liability risk — <strong>urgent remediation required</strong> and the client should be notified.</div>` }],
    footer: [{ label: 'Create urgent remediation ticket', primary: true }, { label: 'Notify client' }]
  },

  align_users_river: {
    title: 'Agreement vs User Count — River Tech Solutions',
    tabs: [{ label: 'User count detail', html: `
      <table class="modal-table">
        <thead><tr><th>Metric</th><th>Agreement</th><th>Actual</th><th>Variance</th></tr></thead>
        <tbody>
          <tr><td>Contracted users</td><td>28</td><td>28</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Active users</td><td>28</td><td style="color:var(--warn);">27 active + 1 inactive</td><td><span class="eol-badge eol-soon">Review</span></td></tr>
          <tr><td>M365 seats</td><td>28</td><td>28</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">User count is technically aligned but 1 contractor account (Ben Hartley) is inactive. Deactivating would free a seat and clean up the directory. <strong>Saving: $22/mo ($264/yr).</strong></div>` }],
    footer: [{ label: 'Deactivate contractor account', primary: true }]
  },

  align_backup_peak: {
    title: 'Agreement vs Backup Coverage — Peak Financial Group',
    tabs: [{ label: 'Backup agreement', html: `
      <div style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;margin-bottom:10px;">Backup coverage fully aligned — all targets healthy</div>
      <table class="modal-table">
        <thead><tr><th>Coverage type</th><th>Contracted</th><th>Actual</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Server image backup</td><td>3 servers</td><td>3 servers</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Endpoint backup</td><td>63 endpoints</td><td>63 endpoints</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Cloud data backup</td><td>M365 E3 included</td><td>Configured</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>Verified restore test</td><td>Quarterly</td><td>Mar 2026</td><td><span class="eol-badge eol-ok">On schedule</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Backup coverage is exemplary. <strong>No action required.</strong> Use this as a positive talking point in the next review.</div>` }],
    footer: []
  },

  align_users_peak: {
    title: 'Agreement vs User Count — Peak Financial Group',
    tabs: [{ label: 'User count detail', html: `
      <table class="modal-table">
        <thead><tr><th>Metric</th><th>Agreement</th><th>Actual</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Contracted users</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>M365 E3 seats</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
          <tr><td>All accounts active</td><td>63</td><td>63</td><td><span class="eol-badge eol-ok">Aligned</span></td></tr>
        </tbody>
      </table>
      <div class="modal-stat">User count is perfectly aligned. <strong>No action required.</strong> Flag for review if headcount changes at next onboarding.</div>` }],
    footer: []
  },

  health_abc: {
    title: 'Health Score Breakdown — ABC Manufacturing',
    tabs: [{ label: 'Score breakdown', html: `
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <span style="font-size:36px;line-height:1;">82</span>
        <span style="font-size:14px;color:var(--text-2);">/100 &middot; Good</span>
      </div>
      <table class="modal-table">
        <thead><tr><th>Dimension</th><th>Score</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>Relationship</td><td style="color:var(--good);font-size:14px;">95</td><td style="font-size:11px;color:var(--text-2);">Long-term client, strong engagement</td></tr>
          <tr><td>Technical</td><td style="color:var(--warn);font-size:14px;">78</td><td style="font-size:11px;color:var(--text-2);">14 EOL devices, backup issues emerging</td></tr>
          <tr><td>Security</td><td style="color:var(--danger);font-size:14px;">71</td><td style="font-size:11px;color:var(--text-2);">MFA gap, no review in 14 months</td></tr>
          <tr><td>Alignment</td><td style="color:var(--warn);font-size:14px;">86</td><td style="font-size:11px;color:var(--text-2);">Device and user count slightly out of sync</td></tr>
          <tr><td>Lifecycle</td><td style="color:var(--warn);font-size:14px;">74</td><td style="font-size:11px;color:var(--text-2);">Multiple renewals and EOL items in window</td></tr>
          <tr><td>Strategic Engagement</td><td style="color:var(--warn);font-size:14px;">80</td><td style="font-size:11px;color:var(--text-2);">Last QBR 8 months ago — overdue</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Lowest scoring areas: Security (71) and Lifecycle (74). Addressing these in the next strategic review would push the overall health score above 88.</div>` }],
    footer: [{ label: 'Schedule strategic review', primary: true }]
  },

  health_river: {
    title: 'Health Score Breakdown — River Tech Solutions',
    tabs: [{ label: 'Score breakdown', html: `
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <span style="font-size:36px;line-height:1;color:var(--warn);">71</span>
        <span style="font-size:14px;color:var(--text-2);">/100 &middot; Needs attention</span>
      </div>
      <table class="modal-table">
        <thead><tr><th>Dimension</th><th>Score</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>Relationship</td><td style="color:var(--warn);font-size:14px;">82</td><td style="font-size:11px;color:var(--text-2);">Good relationship, co-managed dynamic</td></tr>
          <tr><td>Technical</td><td style="color:var(--danger);font-size:14px;">65</td><td style="font-size:11px;color:var(--text-2);">3 servers EOW, backup target degrading</td></tr>
          <tr><td>Security</td><td style="color:var(--danger);font-size:14px;">61</td><td style="font-size:11px;color:var(--text-2);">No MFA, 4 security layers missing</td></tr>
          <tr><td>Alignment</td><td style="color:var(--warn);font-size:14px;">74</td><td style="font-size:11px;color:var(--text-2);">Dormant devices, contractor seat active</td></tr>
          <tr><td>Lifecycle</td><td style="color:var(--danger);font-size:14px;">68</td><td style="font-size:11px;color:var(--text-2);">Multiple warranty and renewal items due</td></tr>
          <tr><td>Strategic Engagement</td><td style="color:var(--warn);font-size:14px;">72</td><td style="font-size:11px;color:var(--text-2);">Last review 4 months ago</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">Three dimensions below 70. Technical and Security are the most urgent — both are directly actionable with existing proposals. Resolving them would bring health to approximately 82.</div>` }],
    footer: [{ label: 'Schedule server & security review', primary: true }]
  },

  health_peak: {
    title: 'Health Score Breakdown — Peak Financial Group',
    tabs: [{ label: 'Score breakdown', html: `
      <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <span style="font-size:36px;line-height:1;color:var(--good);">91</span>
        <span style="font-size:14px;color:var(--text-2);">/100 &middot; Excellent</span>
      </div>
      <table class="modal-table">
        <thead><tr><th>Dimension</th><th>Score</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>Relationship</td><td style="color:var(--good);font-size:14px;">96</td><td style="font-size:11px;color:var(--text-2);">Long-term strategic partner</td></tr>
          <tr><td>Technical</td><td style="color:var(--good);font-size:14px;">94</td><td style="font-size:11px;color:var(--text-2);">All patches current, no EOL concerns</td></tr>
          <tr><td>Security</td><td style="color:var(--good);font-size:14px;">94</td><td style="font-size:11px;color:var(--text-2);">Strong posture — minor dark web gap</td></tr>
          <tr><td>Alignment</td><td style="color:var(--good);font-size:14px;">96</td><td style="font-size:11px;color:var(--text-2);">Near-perfect agreement alignment</td></tr>
          <tr><td>Lifecycle</td><td style="color:var(--good);font-size:14px;">90</td><td style="font-size:11px;color:var(--text-2);">Only compliance audit in the window</td></tr>
          <tr><td>Strategic Engagement</td><td style="color:var(--warn);font-size:14px;">88</td><td style="font-size:11px;color:var(--text-2);">QBR 2 months ago, roadmap in progress</td></tr>
        </tbody>
      </table>
      <div class="modal-stat">This is your healthiest account. Use Peak Financial as a benchmark for what excellent managed service delivery looks like internally.</div>` }],
    footer: []
  },


};

/* ══════════════════════════════════════════
   MODAL SYSTEM
   ══════════════════════════════════════════ */
function openModal(key) {
  const m = MODALS[key];
  if (!m) return;

  modalTitle.textContent = m.title;
  currentModalTabs = m.tabs;

  if (m.tabs.length > 1) {
    modalTabsEl.style.display = 'flex';
    modalTabsEl.innerHTML = m.tabs.map((t, i) =>
      `<button class="modal-tab${i === 0 ? ' active' : ''}" data-tab="${i}">${t.label}</button>`
    ).join('');
    modalTabsEl.querySelectorAll('.modal-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        modalTabsEl.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        modalBody.innerHTML = currentModalTabs[parseInt(btn.dataset.tab)].html;
      });
    });
  } else {
    modalTabsEl.style.display = 'none';
  }

  modalBody.innerHTML = m.tabs[0].html;
  modalFooter.innerHTML = m.footer.map(btn =>
    `<button class="modal-btn${btn.primary ? ' primary' : ''}">${btn.label}</button>`
  ).join('');

  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ══════════════════════════════════════════
   RENDER PRIMARY CONTACT
   ══════════════════════════════════════════ */
function renderContact(c) {
  const contactBar = document.getElementById('contact-bar');
  if (!contactBar) return;
  const ct = c.contact;
  contactBar.innerHTML = `
    <div class="contact-avatar">${ct.initials}</div>
    <div class="contact-info">
      <div class="contact-name">${ct.name}</div>
      <div class="contact-role">${ct.role} &middot; <a href="mailto:${ct.email}" class="contact-email">${ct.email}</a></div>
    </div>
    <div class="contact-actions">
      <button class="contact-action-btn primary" id="draft-email-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Draft email
      </button>
      <button class="contact-action-btn" id="schedule-call-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Schedule call
      </button>
      <button class="contact-action-btn" title="${ct.phone}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38a2 2 0 0 1 1.95-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.17 6.17l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        Call
      </button>
    </div>`;

  const draftBtn = document.getElementById('draft-email-btn');
  if (draftBtn) draftBtn.addEventListener('click', () => generateAlignmentEmail(c));

  const schedBtn = document.getElementById('schedule-call-btn');
  if (schedBtn) schedBtn.addEventListener('click', () => {
    openAlignmentModal('Schedule call — ' + c.name, 'Generating call agenda...', true);
    const sys = `You are helping an MSP account manager prepare a call agenda. Plain text only, no markdown. Write a concise call agenda: opening (2 sentences), 3-4 agenda items based on the signals, suggested duration per item, and a proposed close. Be specific and direct.`;
    const prompt = `Customer: ${c.name} | Contact: ${ct.name} (${ct.role})\nSignals: ${c.signals.map(s => s.title).join('; ')}\nGenerate a call agenda.`;
    callAI(prompt, sys).then(text => {
      updateAlignmentModal(text, [
        { label: 'Copy agenda', primary: true, action: 'copy' },
        { label: 'Close' }
      ]);
    }).catch(() => updateAlignmentModal('Could not reach AI service.', [{ label: 'Close' }]));
  });
}

/* ══════════════════════════════════════════
   RENDER NOTES
   ══════════════════════════════════════════ */
function renderNotes(c) {
  const notesPanel = document.getElementById('notes-panel');
  if (!notesPanel) return;

  const sessionNotes = window._sessionNotes = window._sessionNotes || {};
  if (!sessionNotes[customerSelect.value]) sessionNotes[customerSelect.value] = [];
  const allNotes = [...(sessionNotes[customerSelect.value] || []), ...(c.notes || [])];

  notesPanel.innerHTML = `
    <div class="notes-header">
      <span class="panel-title">NOTES</span>
      <span style="font-size:10px;color:var(--text-3);font-family:'Courier New',monospace;">${allNotes.length} note${allNotes.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="notes-list" id="notes-list">
      ${allNotes.map(n => `
        <div class="note-entry">
          <div class="note-meta">${n.author} &middot; ${n.date}</div>
          <div class="note-text">${n.text}</div>
        </div>`).join('')}
    </div>
    <div class="note-input-row">
      <input type="text" class="note-input" id="note-input" placeholder="Add a note about this customer..." />
      <button class="note-save-btn" id="note-save-btn">Save</button>
    </div>`;

  document.getElementById('note-save-btn').addEventListener('click', () => {
    const input = document.getElementById('note-input');
    const text  = input.value.trim();
    if (!text) return;
    const key = customerSelect.value;
    if (!sessionNotes[key]) sessionNotes[key] = [];
    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    sessionNotes[key].unshift({ author: CUSTOMERS[key].am, date: `${now} · just now`, text });
    input.value = '';
    renderNotes(CUSTOMERS[key]);
  });

  document.getElementById('note-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('note-save-btn').click();
  });
}

/* ══════════════════════════════════════════
   RENDER MY WORK TODAY
   ══════════════════════════════════════════ */
let weekMode = false;  // persists across renderWorkToday calls
let currentViewDay = TODAY_KEY;
function renderWorkToday() {
  const panel = document.getElementById('work-today-panel');
  if (!panel) return;

  const priorityCls = { urgent: 'wp-urgent', review: 'wp-review', ok: 'wp-ok' };
  const priorityLabel = { urgent: 'Urgent', review: 'Review', ok: 'On track' };

  const weekDays = Object.keys(WEEK_SCHEDULE);

  function buildWorkHTML(mode) {
    if (mode === 'week') {
      const dayBlocks = weekDays.map(day => {
        const isToday   = day === TODAY_KEY;
        const isPast    = weekDays.indexOf(day) < weekDays.indexOf(TODAY_KEY);
        const isFuture  = weekDays.indexOf(day) > weekDays.indexOf(TODAY_KEY);
        const customers = buildDayCustomers(day);
        const totalTasks = WEEK_SCHEDULE[day].tasks.length;
        const doneTasks  = WEEK_SCHEDULE[day].tasks.filter(t =>
          WEEK_SCHEDULE[day].done.includes(t.id) || completedActivities.has(t.id)).length;

        return `
          <div class="week-day-block ${isToday ? 'week-day-today' : isPast ? 'week-day-past' : 'week-day-future'}">
            <div class="week-day-header">
              <span class="week-day-label">${day}${isToday ? ' · TODAY' : isPast ? ' · Past' : ' · Upcoming'}</span>
              <span class="week-day-count">${doneTasks}/${totalTasks} done</span>
            </div>
            ${customers.map(cust => `
              <div class="work-customer">
                <div class="work-cust-row">
                  <span class="work-cust-name">${cust.name}</span>
                  <span class="work-priority ${cust.priority === 'urgent' ? 'wp-urgent' : cust.priority === 'review' ? 'wp-review' : 'wp-ok'}">${cust.priority === 'urgent' ? 'Urgent' : cust.priority === 'review' ? 'Review' : 'On track'}</span>
                </div>
                ${cust.activities.map(act => `
                  <div class="work-activity ${act.done ? 'done' : ''} ${act.overdue ? 'overdue' : ''}"
                       data-id="${act.id}" data-modal="${act.modal}" data-custkey="${cust.key}">
                    <div class="wa-checkbox ${act.done ? 'checked' : ''}" data-id="${act.id}">
                      ${act.done ? '&#10003;' : ''}
                    </div>
                    <div class="wa-body">
                      <div class="wa-text">${act.text}</div>
                      <div class="wa-source">${act.source}</div>
                      ${act.overdue ? `<div class="wa-overdue">${act.overdueLabel || 'Overdue'}</div>` : ''}
                    </div>
                    <button class="wa-open-btn" data-modal="${act.modal}" data-custkey="${cust.key}" title="Open detail">&#8250;</button>
                  </div>`).join('')}
              </div>`).join('')}
          </div>`;
      }).join('');

      return `
        <div class="work-header">
          <span class="work-title">MY WORK</span>
          <div class="work-view-toggle">
            <button class="work-view-btn" data-wv="today">Today</button>
            <button class="work-view-btn active" data-wv="week">This Week</button>
          </div>
        </div>
        <div class="week-view">${dayBlocks}</div>
        <div class="work-add-row" id="work-add-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add activity
        </div>`;
    }

    // Today mode
    const customers = buildDayCustomers(TODAY_KEY);
    const priorityLabel = { urgent: 'Urgent', review: 'Review', ok: 'On track' };
    const priorityCls   = { urgent: 'wp-urgent', review: 'wp-review', ok: 'wp-ok' };
    return `
      <div class="work-header">
        <span class="work-title">MY WORK TODAY</span>
        <div class="work-view-toggle">
          <button class="work-view-btn active" data-wv="today">Today</button>
          <button class="work-view-btn" data-wv="week">This Week</button>
        </div>
      </div>
      ${customers.map(cust => `
        <div class="work-customer">
          <div class="work-cust-row">
            <span class="work-cust-name">${cust.name}</span>
            <span class="work-priority ${priorityCls[cust.priority]}">${priorityLabel[cust.priority]}</span>
          </div>
          ${cust.activities.map(act => `
            <div class="work-activity ${completedActivities.has(act.id) || act.done ? 'done' : ''} ${act.overdue ? 'overdue' : ''}"
                 data-id="${act.id}" data-modal="${act.modal}" data-custkey="${cust.key}">
              <div class="wa-checkbox ${completedActivities.has(act.id) || act.done ? 'checked' : ''}" data-id="${act.id}">
                ${completedActivities.has(act.id) || act.done ? '&#10003;' : ''}
              </div>
              <div class="wa-body">
                <div class="wa-text">${act.text}</div>
                <div class="wa-source">${act.source}</div>
                ${act.overdue ? `<div class="wa-overdue">${act.overdueLabel || 'Overdue'}</div>` : ''}
              </div>
              <button class="wa-open-btn" data-modal="${act.modal}" data-custkey="${cust.key}" title="Open detail">&#8250;</button>
            </div>`).join('')}
        </div>`).join('')}
      <div class="work-add-row" id="work-add-row">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add activity
      </div>`;
  }

  panel.innerHTML = buildWorkHTML(weekMode ? 'week' : 'today');
  
  // Wire view toggle
  panel.querySelectorAll('.work-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      weekMode = btn.dataset.wv === 'week';
      renderWorkToday();
    });
  });



  // Checkbox toggle
  panel.querySelectorAll('.wa-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = cb.dataset.id;
      if (completedActivities.has(id)) completedActivities.delete(id);
      else completedActivities.add(id);
      renderWorkToday();
    });
  });

  // Open detail — use task modal for signal tasks, briefing for manual tasks
  function handleTaskClick(actId, custKey, e) {
    const cust = WORK_TODAY.customers.find(c => c.key === custKey);
    const act  = cust?.activities.find(a => a.id === actId);
    if (!act || !CUSTOMERS[custKey]) return;
    if (act.taskSignal) {
      openTaskModal(act, custKey);
    } else {
      switchView('briefing');
      ensureBriefingRendered(custKey);
      if (act.modal) setTimeout(() => openModal(act.modal), 300);
    }
  }

  panel.querySelectorAll('.wa-open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleTaskClick(btn.closest('.work-activity').dataset.id, btn.dataset.custkey, e);
    });
  });

  panel.querySelectorAll('.work-activity').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.wa-checkbox') || e.target.closest('.wa-open-btn')) return;
      handleTaskClick(row.dataset.id, row.dataset.custkey, e);
    });
  });

  // Add activity form — guard all elements (may not exist in week mode)
  const addRow    = document.getElementById('work-add-row');
  const addForm   = document.getElementById('work-add-form');
  const saveBtn   = document.getElementById('work-save-btn');
  const cancelBtn = document.getElementById('work-cancel-btn');

  if (addRow) addRow.addEventListener('click', () => {
    if (addForm) addForm.style.display = 'block';
    addRow.style.display = 'none';
    const tf = document.getElementById('work-add-text');
    if (tf) tf.focus();
  });
  if (saveBtn) saveBtn.addEventListener('click', () => {
    const tf      = document.getElementById('work-add-text');
    const custSel = document.getElementById('work-add-cust');
    const text    = tf ? tf.value.trim() : '';
    const custKey = custSel ? custSel.value : 'abc';
    if (!text) return;
    const newId = 'w' + Date.now();
    TASK_LIBRARY[newId] = { id: newId, text, source: 'Added manually', modal: null, custKey, taskSignal: false };
    const dayEntry = WEEK_SCHEDULE[TODAY_KEY];
    if (dayEntry) dayEntry.tasks.push({ id: newId, custKey });
    WORK_TODAY.customers = buildDayCustomers(TODAY_KEY);
    renderWorkToday();
  });
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    if (addForm) addForm.style.display = 'none';
    if (addRow)  addRow.style.display  = 'flex';
  });
}

/* ══════════════════════════════════════════
   RENDER LIFECYCLE & RENEWALS
   ══════════════════════════════════════════ */
function iconForLifecycle(type) {
  if (type === 'renewal')  return svg('<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>');
  if (type === 'eol')      return svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>');
  if (type === 'warranty') return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>');
  return svg('<polyline points="20 6 9 17 4 12"/>');
}

function renderLifecycle(c) {
  const lc = c.lifecycle;
  lifecycleTotal.textContent = lc.total;
  lifecycleList.innerHTML = lc.items.map(item => `
    <div class="lifecycle-row${item.modal ? '' : ' no-click'}" ${item.modal ? `data-modal="${item.modal}" tabindex="0" role="button"` : ''}>
      <div class="lifecycle-icon ${item.icon}">${iconForLifecycle(item.icon)}</div>
      <div class="lifecycle-body">
        <div class="lifecycle-title">${item.title}</div>
        <div class="lifecycle-sub">${item.sub}</div>
      </div>
      <div class="lifecycle-val">${item.val}</div>
      ${item.modal ? `<button class="inline-action act-primary" data-modal="${item.modal}">${item.icon === "eol" ? "Create opportunity" : item.icon === "renewal" ? "Plan renewal" : item.icon === "warranty" ? "Create opportunity" : "Plan now"}</button>` : ''}
      ${item.modal ? '<span class="signal-arrow">&#8250;</span>' : ''}
    </div>
  `).join('');

  document.querySelectorAll('.lifecycle-row[data-modal]').forEach(row => {
    row.addEventListener('click', (e) => { if (e.target.closest('.inline-action')) return; openModal(row.dataset.modal); });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
  });
  document.querySelectorAll('.lifecycle-row .inline-action').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(btn.dataset.modal); });
  });
}

/* ══════════════════════════════════════════
   RENDER PRIORITY SCORE
   ══════════════════════════════════════════ */
function renderPriority(c) {
  const p = c.priority;
  const scoreEl = document.getElementById('priority-score');
  scoreEl.textContent = p.score;
  scoreEl.style.color = p.score >= 80 ? 'var(--danger)' : p.score >= 60 ? 'var(--warn)' : 'var(--good)';
  priorityReasons.innerHTML = p.reasons.map(r =>
    `<div class="priority-reason-item">${r}</div>`
  ).join('');
  priorityAction.textContent = p.action;

  // Update chip
  chipPriority.textContent = `★ Priority ${p.score}`;
  chipPriority.style.background = p.score >= 80 ? '#8b1f1f' : p.score >= 60 ? '#7a4f0a' : '#2d6a2d';
  chipPriority.style.borderColor = chipPriority.style.background;
}

/* ══════════════════════════════════════════
   RENDER DATA CONFIDENCE
   ══════════════════════════════════════════ */
function renderDataConfidence(c) {
  const dc = c.dataConfidence;
  chipConfidence.textContent  = `✓ Data ${dc.score}%`;
  chipConfidence.className    = `cust-chip confidence-chip ${dc.cls}`;
}

/* ══════════════════════════════════════════
   RENDER STRATEGIC MEMORY (upgraded)
   ══════════════════════════════════════════ */
function renderMemoryExpanded(c) {
  const groups = {
    done:  { label: 'Completed', items: [] },
    warn:  { label: 'In Progress', items: [] },
    miss:  { label: 'Open', items: [] },
    over:  { label: 'Overdue', items: [] }
  };

  c.memory.items.forEach(i => {
    const key = i.status === 'overdue' ? 'over' : i.status;
    if (groups[key]) groups[key].items.push(i);
  });

  const completed = c.memory.items.filter(i => i.status === 'done').length;
  const total     = c.memory.items.length;

  const groupHtml = Object.values(groups).filter(g => g.items.length > 0).map(g => `
    <div class="memory-group">
      <div class="memory-group-label">${g.label}</div>
      ${g.items.map(i => `
        <div class="memory-row">
          <div class="mem-status ${i.status}">${i.status === 'done' ? '&#10003;' : i.status === 'warn' ? '&#9651;' : i.status === 'over' ? '&#9888;' : '&#9675;'}</div>
          <div class="mem-title">${i.label}</div>
          <div class="mem-date">${i.date}</div>
        </div>`).join('')}
    </div>`).join('');

  // What changed section
  const changedHtml = c.changed ? `
    <div class="changed-section">
      <div class="changed-label">WHAT CHANGED SINCE LAST REVIEW</div>
      ${c.changed.map(ch => `
        <div class="changed-row">
          <span class="changed-delta ${ch.cls}">${ch.delta}</span>
          <span>${ch.label}</span>
        </div>`).join('')}
    </div>` : '';

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  memoryExpanded.innerHTML = groupHtml + `
    <div class="memory-completion">
      <span>Roadmap: ${completed} / ${total} items complete</span>
      <div class="completion-bar-bg"><div class="completion-bar-fill" style="width:${completionPct}%"></div></div>
      <span>${completionPct}%</span>
    </div>` + changedHtml;
}

/* ══════════════════════════════════════════
   RENDER ALIGNMENT
   ══════════════════════════════════════════ */
function renderAlignment(c) {
  const a = c.alignment;
  const overallCls = a.overall >= 90 ? 'good' : a.overall >= 75 ? 'warn' : 'danger';
  alignmentOverall.textContent = `Overall ${a.overall}%`;
  alignmentOverall.style.color = overallCls === 'good' ? 'var(--good)' : overallCls === 'warn' ? 'var(--warn)' : 'var(--danger)';

  alignmentList.innerHTML = a.items.map(item => {
    const alignAction = item.cls === 'danger' ? 'Fix gap' : item.cls === 'warn' ? 'Review' : 'View detail';
    const alignActCls = item.cls === 'danger' ? 'act-danger' : item.cls === 'warn' ? 'act-warn' : 'act-ok';
    return `
    <div class="align-row" data-modal="${item.modal}" tabindex="0" role="button" aria-label="View details: ${item.label}">
      <div class="align-indicator ${item.cls}"></div>
      <div class="align-label-wrap">
        <div class="align-label">${item.label}</div>
        ${item.detail ? `<div class="align-detail">${item.detail}</div>` : ''}
      </div>
      <div class="align-bar-wrap">
        <div class="align-bar-bg"><div class="align-bar-fill ${item.cls}" style="width:${item.score}%"></div></div>
      </div>
      <div class="align-score ${item.cls}">${item.score}%</div>
      <button class="inline-action ${alignActCls}" data-modal="${item.modal}">${alignAction}</button>
      <span class="signal-arrow">&#8250;</span>
    </div>`; }).join('');

  document.querySelectorAll('.align-row[data-modal]').forEach(row => {
    row.addEventListener('click', (e) => { if (e.target.closest('.inline-action')) return; openModal(row.dataset.modal); });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
  });
  document.querySelectorAll('.align-row .inline-action').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(btn.dataset.modal); });
  });

  const rec = a.rec;
  alignmentRec.className = `alignment-rec${rec.cls === 'good' ? ' all-good' : ''}`;
  alignmentRec.innerHTML = `
    <div class="alignment-rec-top">
      <div>
        <div class="alignment-rec-label">RECOMMENDED CONVERSATION</div>
        <div class="alignment-rec-title">${rec.title}</div>
        <div class="alignment-rec-val">${rec.val}</div>
      </div>
      ${rec.cls !== 'good' ? `
      <div class="alignment-rec-actions">
        <button class="align-action-btn" id="align-report-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Summary Report
        </button>
        <button class="align-action-btn" id="align-email-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Draft Customer Email
        </button>
      </div>` : ''}
    </div>`;

  if (rec.cls !== 'good') {
    const reportBtn = document.getElementById('align-report-btn');
    const emailBtn  = document.getElementById('align-email-btn');
    if (reportBtn) reportBtn.addEventListener('click', () => generateAlignmentReport(c));
    if (emailBtn)  emailBtn.addEventListener('click',  () => generateAlignmentEmail(c));
  }
}

function renderOppBar(c) {
  const count = c.recs.length;
  const catPills = c.oppCategories
    ? c.oppCategories.map(cat =>
        `<span class="opp-cat-pill opp-cat-${cat.cls}">${cat.label} <strong>${cat.val}</strong></span>`
      ).join('')
    : '';
  oppBarMeta.innerHTML = `${count} opportunit${count !== 1 ? 'ies' : 'y'} &middot; ${c.oppTotal}`;
  const catsEl = document.getElementById('opp-categories');
  if (catsEl) catsEl.innerHTML = catPills;
}

/* ══════════════════════════════════════════
   RENDER CUSTOMER
   ══════════════════════════════════════════ */
function healthClass(score) {
  if (score >= 85) return 'good';
  if (score >= 70) return 'warn';
  return 'danger';
}

function renderCustomer(key) {
  const c = CUSTOMERS[key];

  chipType.textContent   = c.type;
  chipMrr.textContent    = `${c.mrr} MRR`;
  chipSince.textContent  = `Since ${c.since}`;
  chipAm.textContent     = c.am;
  chipHealth.textContent = `Health ${c.health}`;
  chipHealth.className   = `cust-chip health-chip ${healthClass(c.health)} clickable`;
  chipHealth.dataset.modal = `health_${customerSelect.value}`;

  memoryMeta.innerHTML = c.memory.meta;
  const doneCount = c.memory.items.filter(i => i.status === 'done').length;
  const totalItems = c.memory.items.length;
  memoryPreview.innerHTML = c.memory.items.slice(0, 3).map(i =>
    `<span class="mem-item ${i.status}">${i.status === 'done' ? '&#10003;' : i.status === 'warn' ? '&#9651;' : '&#10005;'} ${i.label}</span>`
  ).join('') + `<span class="mem-item" style="color:var(--text-3)">${doneCount}/${totalItems} complete</span>`;

  const filtered = c.signals.filter(s => {
    const srcKey = srcKeyMap[s.src];
    return !srcKey || activeSources.has(srcKey);
  });

  signalCount.textContent = `${filtered.length} signal${filtered.length !== 1 ? 's' : ''}`;
  signalsList.innerHTML = filtered.map(s => `
    <div class="signal-row" data-modal="${s.modal}" tabindex="0" role="button" aria-label="View details: ${s.title}">
      <div class="signal-dot ${s.cls}"></div>
      <div class="signal-body">
        <div class="signal-title">${s.title}</div>
        <div class="signal-sub">${s.sub}</div>
      </div>
      ${s.action ? `<button class="inline-action ${s.actionCls || ''}" data-modal="${s.modal}">${s.action}</button>` : ''}
      <span class="signal-arrow">&#8250;</span>
    </div>
  `).join('');

  document.querySelectorAll('.signal-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.inline-action')) return;
      openModal(row.dataset.modal);
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
  });
  document.querySelectorAll('.signal-row .inline-action').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); openModal(btn.dataset.modal); });
  });

  oppTotal_val             = c.oppTotal;
  renderAlignment(c);
  renderOppBar(c);
  renderOppCards(c);
  renderLifecycle(c);
  renderPriority(c);
  renderDataConfidence(c);
  renderWorkflow(c);
  renderActivityTimeline(c);
  initTimelineBar(c);
  renderContact(c);
  renderNotes(c);
  oppOpen = false;
  oppChevron.classList.remove('open');
  oppExpanded.classList.remove('open');
  suggestTitle.textContent = c.suggestTitle;
  suggestDesc.textContent  = c.suggest;
  confBar.style.width      = c.confidence + '%';
  confLabel.textContent    = c.confidence + '% confidence';
  aiOutput.style.display   = 'none';
  execOutput.style.display = 'none';
}

/* ══════════════════════════════════════════
   RENDER PORTFOLIO
   ══════════════════════════════════════════ */
function renderPortfolioRows(rows) {
  portfolioList.innerHTML = rows.map(r => {
    const pClass = r.priority === 'urgent' ? 'p-urgent' : r.priority === 'review' ? 'p-review' : 'p-ok';
    const pLabel = r.priority === 'urgent' ? '&#9679; Urgent' : r.priority === 'review' ? '&#9679; Review soon' : '&#9679; On track';
    const hClass = healthClass(r.health);
    const hColor = hClass === 'good' ? 'var(--good)' : hClass === 'warn' ? 'var(--warn)' : 'var(--danger)';
    const pills  = [
      r.highSigs ? `<span class="sig-pill sp-h">${r.highSigs} high</span>` : '',
      r.medSigs  ? `<span class="sig-pill sp-m">${r.medSigs} med</span>`   : '',
      r.okSigs   ? `<span class="sig-pill sp-o">${r.okSigs} ok</span>`     : ''
    ].filter(Boolean).join('');

    return `
      <div class="port-row" data-key="${r.key}" tabindex="0" role="button" aria-label="Open briefing for ${r.name}">
        <div><div class="port-name">${r.name}</div><div class="port-sub-txt">${r.type} &middot; ${r.location}</div></div>
        <span class="priority-badge ${pClass}">${pLabel}</span>
        <span class="health-val" style="color:${hColor};">${r.health}</span>
        <div class="sig-pills">${pills}</div>
        <span class="port-mrr">${r.mrr}</span>
        <span class="last-rev">${r.lastReview}</span>
        <span class="port-arrow">&#8250;</span>
      </div>`;
  }).join('');

  document.querySelectorAll('.port-row[data-key]').forEach(row => {
    const go = () => {
      const key = row.dataset.key;
      if (CUSTOMERS[key]) {
        activeSignalFilter = null;
        document.querySelectorAll('.port-intel-signal').forEach(c => c.classList.remove('active'));
        switchView('briefing');
        ensureBriefingRendered(key);
      }
    };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
}

function renderPortfolio(filter) {
  renderWorkToday();
  activeSignalFilter = null;
  document.querySelectorAll('.port-intel-signal').forEach(c => c.classList.remove('active'));
  let rows = PORTFOLIO;
  if (filter === 'urgent')  rows = rows.filter(r => r.priority === 'urgent');
  if (filter === 'overdue') rows = rows.filter(r => r.overdue);
  const urgentCount = PORTFOLIO.filter(r => r.priority === 'urgent').length;
  document.getElementById('port-sub').textContent =
    `${PORTFOLIO.length} accounts \u00b7 ${urgentCount} need attention this week`;
  renderPortfolioRows(rows);
}

/* ══════════════════════════════════════════
   VIEW SWITCHING
   ══════════════════════════════════════════ */
function switchView(view) {
  const views = { briefing: 'view-briefing', portfolio: 'view-portfolio', team: 'view-team' };
  const tabs  = { briefing: 'nav-briefing',  portfolio: 'nav-portfolio',  team: 'nav-team'  };
  Object.entries(views).forEach(([k, id]) => {
    document.getElementById(id).style.display = k === view ? '' : 'none';
  });
  Object.entries(tabs).forEach(([k, id]) => {
    document.getElementById(id).classList.toggle('active', k === view);
  });
  if (view === 'portfolio') renderPortfolio(activeFilter);
  if (view === 'team')      renderTeam();
  if (view === 'briefing')  ensureBriefingRendered();
  // Show/hide doc tab based on view
  const pl = document.querySelector('.page-layout');
  if (pl) {
    pl.classList.toggle('briefing-active', view === 'briefing');
    // Close doc panel if leaving briefing
    if (view !== 'briefing') {
      const dp = document.getElementById('doc-panel');
      if (dp) { dp.classList.remove('open'); dp.setAttribute('aria-hidden','true'); }
      pl.classList.remove('doc-open');
    }
  }
}

document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* ══════════════════════════════════════════
   STRATEGIC MEMORY TOGGLE
   ══════════════════════════════════════════ */
function toggleMemory() {
  memoryOpen = !memoryOpen;
  memoryChevron.classList.toggle('open', memoryOpen);
  const c = CUSTOMERS[customerSelect.value];
  if (memoryOpen) {
    renderMemoryExpanded(c);
    memoryExpanded.classList.add('open');
  } else {
    memoryExpanded.classList.remove('open');
  }
}
memoryBar.addEventListener('click', toggleMemory);

/* ── Opportunities bar toggle ── */
oppBar.addEventListener('click', () => {
  oppOpen = !oppOpen;
  oppChevron.classList.toggle('open', oppOpen);
  oppExpanded.classList.toggle('open', oppOpen);
});



/* ══════════════════════════════════════════
   AI FUNCTIONS
   ══════════════════════════════════════════ */
async function callAI(prompt, systemPrompt) {
  const res  = await fetch('/api/ai-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: customerSelect.value, prompt, systemPrompt })
  });
  const data = await res.json();
  return data.ok ? data.brief : 'Error: ' + (data.error || 'Unknown error');
}

async function generateAIBrief() {
  const c = CUSTOMERS[customerSelect.value];
  aiBtn.innerHTML = '<span class="spinner spinner-light"></span> Generating...';
  aiBtn.disabled  = true;
  aiOutput.style.display = execOutput.style.display = 'none';

  const prompt = `Customer: ${c.name} | Type: ${c.type} | MRR: ${c.mrr} | Health: ${c.health}/100 | Since: ${c.since} | AM: ${c.am}

Previous review items:
${c.memory.items.map(i => `- ${i.label}: ${i.date}`).join('\n')}

Change signals:
${c.signals.map(s => `- ${s.cls.toUpperCase()}: ${s.title} (${s.src})`).join('\n')}

Recommended conversations:
${c.recs.map((r, i) => `${i + 1}. ${r.title} — ${r.sub} [${r.val}]`).join('\n')}

Suggested approach: ${c.suggest}

Write my QBR conversation brief.`;

  const sys = `You are a QBR coach helping an MSP account manager prepare for a customer conversation. Write a concise brief the account manager can read in 60 seconds. Plain text only — no markdown, headers, bullets. 4 short paragraphs: (1) how to open, (2) first issue and why, (3) second/third topics, (4) how to close with a specific next step. Direct, specific, commercial.`;

  try { aiText.textContent = await callAI(prompt, sys); }
  catch { aiText.textContent = 'Could not reach the AI service. Ensure ANTHROPIC_API_KEY is set and the Netlify function is deployed.'; }

  aiOutput.style.display = 'block';
  aiBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> AI Conversation Brief`;
  aiBtn.disabled  = false;
  aiOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function generateExecSummary() {
  const c = CUSTOMERS[customerSelect.value];
  execBtn.innerHTML = '<span class="spinner"></span> Generating...';
  execBtn.disabled  = true;
  aiOutput.style.display = execOutput.style.display = 'none';

  const prompt = `Customer: ${c.name} | MRR: ${c.mrr} | Health: ${c.health}/100 | Since: ${c.since}
Signals: ${c.signals.map(s => `${s.title}`).join('; ')}
Recommendations: ${c.recs.map(r => `${r.title} [${r.val}]`).join('; ')}
Write an executive summary.`;

  const sys = `You are preparing a customer-facing executive summary for an MSP's strategic review. Plain text only — no markdown, no headers, no bullets. 4 paragraphs: (1) relationship and health, (2) key changes since last review, (3) 2-3 recommended conversations and why they matter, (4) next steps and Q3 priorities. Professional, confident, partnership-oriented tone. Written from the MSP to the customer.`;

  try { execText.textContent = await callAI(prompt, sys); }
  catch { execText.textContent = 'Could not reach the AI service.'; }

  execOutput.style.display = 'block';
  execBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Executive Summary`;
  execBtn.disabled  = false;
  execOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function generatePortfolioAI() {
  portAiBtn.innerHTML = '<span class="spinner"></span> Generating...';
  portAiBtn.disabled  = true;
  portAiOutput.style.display = 'none';

  const portLines = PORTFOLIO.map((r, i) =>
    `${i + 1}. ${r.name} — Health: ${r.health} — Priority: ${r.priority} — ${r.highSigs} high, ${r.medSigs} med signals — MRR: ${r.mrr} — Last review: ${r.lastReview}`
  ).join('\n');

  const sys = `You are a QBR coach helping an MSP plan their week. Plain text only, no markdown, no bullets. 3 paragraphs: (1) which 2-3 accounts to call this week and the single most important reason for each, (2) what commercial or risk angle to lead with in those calls, (3) accounts that are healthy but worth a brief check-in. Direct and specific.`;

  try { portAiText.textContent = await callAI(`Portfolio:\n${portLines}\n\nGenerate a prioritised weekly call plan.`, sys); }
  catch { portAiText.textContent = 'Could not reach the AI service.'; }

  portAiOutput.style.display = 'block';
  portAiBtn.innerHTML = 'Generate &rarr;';
  portAiBtn.disabled  = false;
}

/* ══════════════════════════════════════════
   FEEDBACK PANEL
   ══════════════════════════════════════════ */
function openFeedback()  { feedbackPanel.classList.add('open');    feedbackPanel.setAttribute('aria-hidden','false'); feedbackToggle.classList.add('active');    feedbackToggle.setAttribute('aria-expanded','true');  }
function closeFeedback() { feedbackPanel.classList.remove('open'); feedbackPanel.setAttribute('aria-hidden','true');  feedbackToggle.classList.remove('active'); feedbackToggle.setAttribute('aria-expanded','false'); }

feedbackToggle.addEventListener('click', () => feedbackPanel.classList.contains('open') ? closeFeedback() : openFeedback());
fbClose.addEventListener('click', closeFeedback);

/* ── Drag-to-rank ── */
let dragSrc = null;
function initRankList() {
  const list = document.getElementById('fb-rank-list');
  if (!list) return;
  list.querySelectorAll('.fb-rank-item').forEach(item => {
    item.addEventListener('dragstart', () => { dragSrc = item; item.style.opacity = '0.4'; });
    item.addEventListener('dragend',   () => { item.style.opacity = '1'; updateRankNums(); });
    item.addEventListener('dragover',  e => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (dragSrc && dragSrc !== item) {
        const items   = Array.from(list.querySelectorAll('.fb-rank-item'));
        const srcIdx  = items.indexOf(dragSrc);
        const destIdx = items.indexOf(item);
        if (srcIdx < destIdx) item.after(dragSrc); else item.before(dragSrc);
        updateRankNums();
      }
    });
  });
}
function updateRankNums() {
  document.querySelectorAll('#fb-rank-list .fb-rank-item').forEach((item, i) => {
    item.querySelector('.fb-rank-num').textContent = i + 1;
  });
}
function getRankOrder() {
  return Array.from(document.querySelectorAll('#fb-rank-list .fb-rank-item')).map(item => item.dataset.val);
}

/* ── Micro-feedback accumulator ── */
const microVotes = {};

function initMicroFeedback() {
  document.querySelectorAll('.micro-fb').forEach(group => {
    const section = group.dataset.section;
    group.querySelectorAll('.micro-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        microVotes[section] = btn.dataset.val;
        group.querySelectorAll('.micro-btn').forEach(b => b.classList.remove('voted'));
        btn.classList.add('voted');
      });
    });
  });
}

/* ── Helpers ── */
function getChecked(id) {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
}

/* ── Main submit ── */
async function submitFeedback() {
  const name          = document.getElementById('fb-name').value.trim();
  const company       = document.getElementById('fb-company').value.trim();
  const sections      = getChecked('fb-sections');
  const sources       = getChecked('fb-sources');
  const missingAction = document.getElementById('fb-missing-action').value.trim();
  const timecost      = document.getElementById('fb-timecost').value.trim();
  const onething      = document.getElementById('fb-onething').value.trim();
  const suggestions   = document.getElementById('fb-suggestions').value.trim();
  const rankOrder     = getRankOrder();
  const microSummary  = Object.keys(microVotes).length > 0
    ? Object.entries(microVotes).map(([s, v]) => `${s}: ${v === 'up' ? '👍' : '👎'}`).join(', ')
    : null;

  if (!sections.length && !sources.length && !missingAction && !timecost && !onething && !suggestions && !microSummary) {
    fbStatus.textContent = 'Please fill in at least one field.';
    fbStatus.className   = 'fb-status err';
    return;
  }

  fbSubmit.disabled    = true;
  fbSubmit.textContent = 'Sending...';
  fbStatus.textContent = '';
  fbStatus.className   = 'fb-status';

  const vBriefing  = document.getElementById('view-briefing');
  const vPortfolio = document.getElementById('view-portfolio');
  const activeView = vBriefing && vBriefing.style.display !== 'none'
    ? `Briefing — ${customerSelect.options[customerSelect.selectedIndex].text}`
    : vPortfolio && vPortfolio.style.display !== 'none'
      ? 'Portfolio View' : 'Team Performance';

  try {
    const res  = await fetch('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, company, sections, sources, rankOrder,
        missingAction, timecost, onething, suggestions, microSummary,
        viewedCustomer: activeView, submittedAt: new Date().toISOString()
      })
    });
    const data = await res.json();
    if (data.ok) {
      fbStatus.textContent = 'Feedback sent — thank you!';
      fbStatus.className   = 'fb-status ok';
      document.querySelectorAll('.fb-check input').forEach(cb => cb.checked = false);
      ['fb-missing-action','fb-timecost','fb-onething','fb-suggestions'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      document.querySelectorAll('.micro-btn').forEach(b => b.classList.remove('voted'));
      Object.keys(microVotes).forEach(k => delete microVotes[k]);
    } else {
      fbStatus.textContent = 'Error: ' + (data.error || 'Could not send.');
      fbStatus.className   = 'fb-status err';
    }
  } catch {
    fbStatus.textContent = 'Network error — could not send.';
    fbStatus.className   = 'fb-status err';
  }
  fbSubmit.disabled    = false;
  fbSubmit.textContent = 'Send Feedback';
}

fbSubmit.addEventListener('click', submitFeedback);

/* ── Portfolio filters ── */
document.querySelectorAll('.port-filters .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    activeFilter = pill.dataset.filter;
    document.querySelectorAll('.port-filters .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    renderPortfolio(activeFilter);
  });
});

/* ── Source pills ── */
document.querySelectorAll('.source-pills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const src = pill.dataset.src;
    if (activeSources.has(src)) { activeSources.delete(src); pill.classList.remove('active'); }
    else                        { activeSources.add(src);    pill.classList.add('active');    }
    renderCustomer(customerSelect.value);
  });
});

/* Health chip click */
document.getElementById('chip-health').addEventListener('click', () => {
  const key = customerSelect.value;
  openModal(`health_${key}`);
});

/* ── Wiring ── */
customerSelect.addEventListener('change', e => {
  setBriefingMode('intelligence'); // reset to intelligence on customer change
  updateDocPanel(e.target.value);
  memoryOpen = false;
  memoryChevron.classList.remove('open');
  memoryExpanded.classList.remove('open');
  oppOpen = false;
  oppChevron.classList.remove('open');
  oppExpanded.classList.remove('open');
  ensureBriefingRendered(e.target.value);
});
if (aiBtn)   aiBtn.addEventListener('click', generateAIBrief);
if (execBtn) execBtn.addEventListener('click', generateExecSummary);
closeAi.addEventListener('click',     () => { aiOutput.style.display   = 'none'; });
closeExec.addEventListener('click',   () => { execOutput.style.display = 'none'; });
portAiBtn.addEventListener('click',   generatePortfolioAI);
closePortAi.addEventListener('click', () => { portAiOutput.style.display = 'none'; });
document.getElementById('team-ai-btn').addEventListener('click', generateTeamAI);
document.getElementById('close-team-ai').addEventListener('click', () => {
  document.getElementById('team-ai-output').style.display = 'none';
});

/* ══════════════════════════════════════════
   OPPORTUNITY CARDS & ACTIVITY TIMELINE
   ══════════════════════════════════════════ */

function statusTagHtml(status, label) {
  const cls = { active: 'opp-tag-active', proposed: 'opp-tag-proposed', won: 'opp-tag-won', lost: 'opp-tag-lost' };
  return `<span class="opp-card-tag ${cls[status] || 'opp-tag-active'}">${label}</span>`;
}

function timelineDotClass(type) {
  return { proposal: 'td-proposal', review: 'td-review', decision: 'td-decision',
           alert: 'td-alert', note: 'td-note', email: 'td-email', opp: 'td-opp' }[type] || 'td-note';
}

function renderTimelineEntries(entries) {
  return `<div class="timeline-list">${entries.map(e => `
    <div class="timeline-entry">
      <div class="timeline-dot ${timelineDotClass(e.type)}"></div>
      <div class="timeline-body">
        <div class="timeline-date">${e.date}</div>
        <div class="timeline-title">${e.title}</div>
        ${e.detail ? `<div class="timeline-detail">${e.detail}</div>` : ''}
        ${e.val    ? `<div class="timeline-val">${e.val}</div>` : ''}
      </div>
    </div>`).join('')}
  </div>`;
}

function renderOppCards(c) {
  const container = document.getElementById('opp-cards-list');
  if (!container) return;
  if (!c.opportunities || !c.opportunities.length) {
    container.innerHTML = '<div style="padding:12px 16px;font-size:12px;color:var(--text-3);">No open opportunities.</div>';
    return;
  }

  container.innerHTML = `<div class="opp-cards-grid">${c.opportunities.map(opp => {
    const urgencyColor = opp.nextStepUrgency === 'danger' ? 'var(--danger)' : opp.nextStepUrgency === 'warn' ? 'var(--warn)' : 'var(--accent-2)';
    const urgencyBg    = opp.nextStepUrgency === 'danger' ? 'var(--danger-bg)' : opp.nextStepUrgency === 'warn' ? 'var(--warn-bg)' : 'var(--info-bg)';
    return `
    <div class="opp-card" data-opp="${opp.id}" tabindex="0" role="button" aria-label="View opportunity: ${opp.title}">
      <div class="opp-card-status opp-status-${opp.status}"></div>
      <div class="opp-card-body">
        <div class="opp-card-title">${opp.title}</div>
        <div class="opp-card-meta">
          ${statusTagHtml(opp.status, opp.statusLabel)}
          <span class="opp-card-date">Created ${opp.created}</span>
        </div>
        <div class="opp-card-last"><strong>Last:</strong> ${opp.lastActivity} <span style="color:var(--text-3);">&middot; ${opp.lastActivityAge}</span></div>
        ${opp.nextStep ? `
        <div class="opp-next-step" style="border-color:${urgencyColor};background:${urgencyBg};">
          <span class="opp-next-label" style="color:${urgencyColor};">NEXT STEP</span>
          <span class="opp-next-text" style="color:${urgencyColor};">${opp.nextStep}</span>
          ${opp.taskId ? `<button class="opp-followup-btn" data-taskid="${opp.taskId}" data-custkey="${customerSelect.value}" style="border-color:${urgencyColor};color:${urgencyColor};">Follow up &rarr;</button>` : ''}
        </div>` : ''}
      </div>
      <div class="opp-card-right">
        <div class="opp-card-val">${opp.value}</div>
        <div class="opp-card-activity">
          ${opp.emails    ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${opp.emails}</span>` : ''}
          ${opp.meetings  ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${opp.meetings}</span>` : ''}
          ${opp.proposalSent ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Proposal</span>` : ''}
        </div>
      </div>
      <span class="signal-arrow">&#8250;</span>
    </div>`; }).join('')}
  </div>`;

  document.querySelectorAll('.opp-card[data-opp]').forEach(card => {
    const open = (e) => {
      if (e && e.target.closest('.opp-followup-btn')) return;
      openOppModal(card.dataset.opp, c);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(e); });
  });

  document.querySelectorAll('.opp-followup-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId  = btn.dataset.taskid;
      const custKey = btn.dataset.custkey;
      const custData = WORK_TODAY.customers.find(cu => cu.key === custKey);
      const act = custData?.activities.find(a => a.id === taskId);
      if (act && act.taskSignal) openTaskModal(act, custKey);
    });
  });
}

function openOppModal(oppId, c) {
  const opp = c.opportunities.find(o => o.id === oppId);
  if (!opp) return;

  const statusCls = { active: 'opp-tag-active', proposed: 'opp-tag-proposed', won: 'opp-tag-won', lost: 'opp-tag-lost' };

  document.getElementById('modal-title').textContent = opp.title;
  document.getElementById('modal-tabs').style.display = 'none';
  document.getElementById('modal-body').innerHTML = `
    <div class="opp-modal-header">
      <div>
        <div class="opp-modal-val">${opp.value}</div>
        <div class="opp-modal-status-row">
          <span class="opp-card-tag ${statusCls[opp.status] || 'opp-tag-active'}">${opp.statusLabel}</span>
          <span style="font-size:11px;color:var(--text-3);font-family:'Courier New',monospace;">Created ${opp.created}</span>
        </div>
      </div>
    </div>
    <div class="opp-modal-meta-grid">
      <div class="omg-cell"><div class="omg-val">${opp.emails || 0}</div><div class="omg-lbl">Emails</div></div>
      <div class="omg-cell"><div class="omg-val">${opp.meetings || 0}</div><div class="omg-lbl">Meetings</div></div>
      <div class="omg-cell"><div class="omg-val">${opp.proposalSent ? 'Sent' : 'Not yet'}</div><div class="omg-lbl">Proposal</div></div>
    </div>
    <div style="font-size:12px;padding:8px 10px;background:var(--bg-row);border:1px solid var(--border);margin-bottom:14px;">
      <strong>Last activity:</strong> ${opp.lastActivity} <span style="color:var(--text-3);">&middot; ${opp.lastActivityAge}</span>
    </div>
    <div class="opp-modal-tl-label">ACTIVITY TIMELINE</div>
    <div class="opp-modal-timeline">${renderTimelineEntries(opp.timeline)}</div>`;

  document.getElementById('modal-footer').innerHTML = `
    <button class="modal-btn primary">Open in Salesbuildr</button>
    <button class="modal-btn">Add note</button>
    <button class="modal-btn">Log activity</button>`;

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-overlay').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function renderActivityTimeline(c) {
  const meta = document.getElementById('timeline-bar-meta');
  if (!c.activityTimeline || !c.activityTimeline.length) {
    if (meta) meta.textContent = 'No recent activity';
    return;
  }
  const count = c.activityTimeline.length;
  const last  = c.activityTimeline[0];
  if (meta) meta.innerHTML = `${count} events &middot; last activity ${last.date}`;

  const list = document.getElementById('timeline-list');
  if (list) list.innerHTML = '';
}

let timelineOpen = false;

function initTimelineBar(c) {
  const bar     = document.getElementById('timeline-bar');
  const chevron = document.getElementById('timeline-chevron');
  const expanded= document.getElementById('timeline-expanded');
  const list    = document.getElementById('timeline-list');
  if (!bar) return;

  // Reset on customer change
  timelineOpen = false;
  chevron.classList.remove('open');
  expanded.classList.remove('open');

  bar.onclick = () => {
    timelineOpen = !timelineOpen;
    chevron.classList.toggle('open', timelineOpen);
    if (timelineOpen) {
      list.innerHTML = renderTimelineEntries(c.activityTimeline);
      expanded.classList.add('open');
    } else {
      expanded.classList.remove('open');
    }
  };
}

/* ══════════════════════════════════════════
   ALIGNMENT ACTIONS
   ══════════════════════════════════════════ */

function buildAlignmentContext(c) {
  const items = c.alignment.items.map(i =>
    `- ${i.label}: ${i.score}% (${i.cls})${i.detail ? ' — ' + i.detail : ''}`
  ).join('\n');
  return `Customer: ${c.name} | Type: ${c.type} | MRR: ${c.mrr} | AM: ${c.am}
Overall alignment score: ${c.alignment.overall}%
Recommended conversation: ${c.alignment.rec.title} — ${c.alignment.rec.val}

Alignment breakdown:
${items}`;
}

async function generateAlignmentReport(c) {
  const sys = `You are preparing an internal alignment summary report for an MSP sales manager to review with their team or present to their business owner before a customer conversation.

Write a clean, professional report in plain text. No markdown, no asterisks. Use these exact section headings on their own lines followed by a colon and a line break:

EXECUTIVE SUMMARY:
ALIGNMENT FINDINGS:
REVENUE IMPACT:
RECOMMENDED CONVERSATION ORDER:
SUGGESTED NEXT STEPS:

Under each heading write 2-4 concise sentences or a short structured list using dashes. Be specific with numbers and dollar amounts. Tone: internal, factual, commercially focused.`;

  const prompt = buildAlignmentContext(c) + '\n\nGenerate the internal alignment summary report.';
  openAlignmentModal('Alignment Summary Report — ' + c.name, 'Generating report…', true);
  try {
    const text = await callAI(prompt, sys);
    updateAlignmentModal(text, [
      { label: 'Copy report', primary: true, action: 'copy' },
      { label: 'Close' }
    ]);
  } catch {
    updateAlignmentModal('Could not reach the AI service.', [{ label: 'Close' }]);
  }
}

async function generateAlignmentEmail(c) {
  const sys = `You are drafting a professional email from an MSP to a customer to initiate a proactive agreement alignment review conversation.

Format the output exactly like this — use these exact labels:

SUBJECT: [subject line here]

Dear [contact name],

[email body — 3 short paragraphs]

[sign-off]
[AM name]
[company]

Rules:
- Paragraph 1: Frame this as a proactive partnership service — not a billing issue or complaint.
- Paragraph 2: Reference 2-3 specific alignment findings by name and why they matter to the customer's business. Be factual, not alarming.
- Paragraph 3: Propose a short call or meeting to walk through the findings together and agree on next steps.
- Tone: warm, professional, partner-oriented. This is a trusted advisor reaching out, not a sales pitch.
- Do not mention specific dollar amounts in the email — keep those for the meeting.
- Sign off with the account manager's name.`;

  const prompt = buildAlignmentContext(c) + '\n\nDraft the customer email.';
  openAlignmentModal('Customer Email Draft — ' + c.name, 'Drafting email…', true);
  try {
    const text = await callAI(prompt, sys);
    updateAlignmentModal(text, [
      { label: 'Copy email', primary: true, action: 'copy' },
      { label: 'Close' }
    ]);
  } catch {
    updateAlignmentModal('Could not reach the AI service.', [{ label: 'Close' }]);
  }
}

function openAlignmentModal(title, loadingText, isLoading) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-tabs').style.display = 'none';
  document.getElementById('modal-body').innerHTML = isLoading
    ? `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;color:var(--text-2);font-size:13px;"><span class="spinner"></span>${loadingText}</div>`
    : `<div class="align-output-text">${loadingText}</div>`;
  document.getElementById('modal-footer').innerHTML = '';
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('modal-overlay').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function updateAlignmentModal(text, buttons) {
  document.getElementById('modal-body').innerHTML =
    `<div class="align-output-text">${escapeHtml(text)}</div>`;
  document.getElementById('modal-footer').innerHTML = buttons.map(btn =>
    `<button class="modal-btn${btn.primary ? ' primary' : ''}" ${btn.action ? `data-action="${btn.action}"` : ''}>${btn.label}</button>`
  ).join('');
  document.querySelectorAll('#modal-footer button[data-action="copy"]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = btn.dataset.action === 'copy' ? (text.includes('SUBJECT:') ? 'Copy email' : 'Copy report') : btn.textContent, 1500);
      });
    });
  });
  document.querySelectorAll('#modal-footer button:not([data-action])').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-overlay').classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════
   TASK MODAL
   ══════════════════════════════════════════ */

function openTaskModal(act, custKey) {
  const c  = CUSTOMERS[custKey];
  const ts = taskStatus[act.id] || { status: 'pending', lastAction: null, nextStep: null, followUpDate: null };
  const ctx = act.taskContext || {};

  const statusOptions = [
    { val: 'pending',   label: 'Not contacted yet' },
    { val: 'contacted', label: 'Contacted — waiting for response' },
    { val: 'meeting',   label: 'Meeting scheduled' },
    { val: 'quote',     label: 'Quote requested' },
    { val: 'won',       label: 'Won' },
    { val: 'deferred',  label: 'Deferred' }
  ];

  const nextStepSuggestions = {
    pending:   { text: 'Select a contact method and take the first action to get started', date: null },
    contacted: { text: `Follow up if no response by ${act.id === 'w4' ? 'Today' : 'Jun 19'}`, date: act.id === 'w4' ? 'Today' : 'Jun 19' },
    meeting:   { text: 'Prepare brief 1 day before the meeting', date: null },
    quote:     { text: 'Build proposal — move to Salesbuildr', date: null },
    won:       { text: 'Create opportunity and log outcome', date: null },
    deferred:  { text: 'Set a reminder to revisit', date: null }
  };

  const metaKeys = ['source', 'confidence'];
  const ctxRows = Object.entries(ctx).map(([k, v]) => {
    const isMeta = metaKeys.includes(k);
    const label  = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    return `
    <div class="tm-ctx-row ${isMeta ? 'tm-ctx-meta' : ''}">
      <span class="tm-ctx-key">${label}</span>
      <span class="tm-ctx-val ${isMeta ? 'tm-ctx-meta-val' : ''}">${v}</span>
    </div>`;
  }).join('');

  const overlay = document.getElementById('modal-overlay');
  const title   = document.getElementById('modal-title');
  const tabs    = document.getElementById('modal-tabs');
  const body    = document.getElementById('modal-body');
  const footer  = document.getElementById('modal-footer');

  title.textContent = act.text;
  tabs.style.display = 'none';

  body.innerHTML = `
    <div class="tm-source-bar">
      <span class="tm-source-tag">${act.source.split(' · ')[0]}</span>
      <span class="tm-source-detail">${act.source.split(' · ').slice(1).join(' · ')} &middot; ${c.name} &middot; ${c.contact?.name || ''}</span>
    </div>

    <div class="tm-section">
      <div class="tm-section-label">Why this matters</div>
      <div class="tm-brief">${act.taskBrief}</div>
      <div class="tm-why">${act.taskWhy}</div>
    </div>

    ${ctxRows ? `
    <div class="tm-section tm-ctx-grid">
      <div class="tm-section-label">Signal detail</div>
      ${ctxRows}
    </div>` : ''}

    <div class="tm-section">
      <div class="tm-section-label">How do you want to reach ${c.contact?.name?.split(' ')[0] || 'them'}?</div>
      <div class="tm-contact-btns">
        <button class="tm-contact-btn" data-contact="call">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38a2 2 0 0 1 1.95-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.17 6.17l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <div><div class="tm-cb-title">Call now</div><div class="tm-cb-desc">Get talking points</div></div>
        </button>
        <button class="tm-contact-btn" data-contact="email">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <div><div class="tm-cb-title">Draft email</div><div class="tm-cb-desc">AI writes it</div></div>
        </button>
        <button class="tm-contact-btn" data-contact="meeting">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <div><div class="tm-cb-title">Schedule meeting</div><div class="tm-cb-desc">Generate agenda</div></div>
        </button>
        <button class="tm-contact-btn" data-contact="quote">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div><div class="tm-cb-title">Send quote</div><div class="tm-cb-desc">Open in Salesbuildr</div></div>
        </button>
      </div>
      <div class="tm-action-output" id="tm-action-output" style="display:none;"></div>
    </div>

    <div class="tm-section">
      <div class="tm-section-label">Status</div>
      <div class="tm-status-options" id="tm-status-options">
        ${statusOptions.map(s => `
          <label class="tm-status-option ${ts.status === s.val ? 'selected' : ''}">
            <input type="radio" name="tmstatus" value="${s.val}" ${ts.status === s.val ? 'checked' : ''} />
            ${s.label}
          </label>`).join('')}
      </div>
    </div>

    <div class="tm-section tm-nextstep-section" id="tm-nextstep-section">
      <div class="tm-section-label">Next step</div>
      <div class="tm-nextstep" id="tm-nextstep-text">${nextStepSuggestions[ts.status]?.text || ''}</div>
      ${nextStepSuggestions[ts.status]?.date ? `<div class="tm-nextstep-date">Due: ${nextStepSuggestions[ts.status].date}</div>` : ''}
      <div class="tm-autolog-note">&#8505; Status changes are auto-logged to the customer activity timeline</div>
    </div>`;

  footer.innerHTML = `
    <button class="modal-btn primary" id="tm-done-btn">&#10003; Done for now</button>
    <button class="modal-btn" id="tm-close-btn">Close</button>`;

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Wire contact method buttons
  body.querySelectorAll('.tm-contact-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      body.querySelectorAll('.tm-contact-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      handleTaskContactAction(btn.dataset.contact, act, c);
      // Hide next step section once a method is chosen
      const nsSection = document.getElementById('tm-nextstep-section');
      if (nsSection) nsSection.style.display = 'none';
      // Auto-set status to contacted if pending
      if ((taskStatus[act.id] || {}).status === 'pending') {
        const radio = body.querySelector('input[name="tmstatus"][value="contacted"]');
        if (radio) { radio.checked = true; updateTaskStatus(act.id, 'contacted', c); }
      }
    });
  });

  // Wire status radio changes
  body.querySelectorAll('input[name="tmstatus"]').forEach(radio => {
    radio.addEventListener('change', () => {
      body.querySelectorAll('.tm-status-option').forEach(o => o.classList.remove('selected'));
      radio.closest('.tm-status-option').classList.add('selected');
      updateTaskStatus(act.id, radio.value, c);
      const ns = nextStepSuggestions[radio.value];
      const nsEl = document.getElementById('tm-nextstep-text');
      if (nsEl && ns) nsEl.textContent = ns.text;
    });
  });

  // Done for now — ticks checkbox, logs action, closes
  document.getElementById('tm-done-btn').addEventListener('click', () => {
    const currentStatus = (taskStatus[act.id] || {}).status || 'pending';
    completedActivities.add(act.id);
    autoLogToTimeline(c, act.text, `Done for now · Status: ${currentStatus}`);
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    renderWorkToday();
  });

  // Close — dismiss without logging
  document.getElementById('tm-close-btn').addEventListener('click', () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  });


}

function updateTaskStatus(actId, status, c) {
  if (!taskStatus[actId]) taskStatus[actId] = {};
  taskStatus[actId].status = status;
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  taskStatus[actId].lastAction = `Status updated to "${status}" · ${now}`;
  autoLogToTimeline(c, `Task status updated`, `Changed to: ${status}`);
}

async function handleTaskContactAction(method, act, c) {
  const output = document.getElementById('tm-action-output');
  if (!output) return;
  output.style.display = 'block';
  output.innerHTML = `<div class="tm-output-loading"><span class="spinner"></span> Generating...</div>`;

  const contactName = c.contact?.name?.split(' ')[0] || 'the contact';
  let sys = '', prompt = '';

  if (method === 'call') {
    sys = `You are preparing talking points for a brief phone call. Plain text only. Write 4 concise talking points — opening line, key message, one question to ask, suggested close. Each point one sentence. Label each: OPEN, KEY POINT, ASK, CLOSE.`;
    prompt = `Customer: ${c.name} | Contact: ${c.contact?.name} | Task: ${act.text} | Why: ${act.taskBrief} | Context: ${JSON.stringify(act.taskContext)}`;
  } else if (method === 'email') {
    sys = `Draft a short professional email from an MSP account manager to a customer contact. Format: SUBJECT: [line]\n\n[body — 2-3 short paragraphs]\n\n[sign-off]. Warm, direct, partnership tone. No dollar amounts. No markdown.`;
    prompt = `To: ${c.contact?.name} (${c.contact?.role}) at ${c.name} | From: ${c.am} | Task: ${act.text} | Context: ${act.taskBrief}`;
  } else if (method === 'meeting') {
    sys = `Write a meeting agenda. Format: AGENDA: [title]\nDuration: [time]\n\n1. [item] — [X mins]\n2. [item] — [X mins]\netc.\n\nClose: [proposed next step]. Plain text only. 4-5 items.`;
    prompt = `Meeting: ${act.text} | Customer: ${c.name} | Contact: ${c.contact?.name} | Context: ${act.taskBrief}`;
  } else if (method === 'quote') {
    output.innerHTML = `<div class="tm-output-quote">
      <div class="tm-output-label">Quote ready to build in Salesbuildr</div>
      <div class="tm-output-detail">Customer: ${c.name} &middot; ${act.oppTitle || act.text}</div>
      <button class="modal-btn primary" style="margin-top:8px;">Open in Salesbuildr ↗</button>
    </div>`;
    autoLogToTimeline(c, 'Quote requested', `${act.oppTitle || act.text} — sent to Salesbuildr`);
    return;
  }

  try {
    const text = await callAI(prompt, sys);
    output.innerHTML = `
      <div class="tm-output-label">${method === 'call' ? 'Talking points' : method === 'email' ? 'Draft email' : 'Meeting agenda'}</div>
      <div class="tm-output-text">${escapeHtml(text)}</div>
      <button class="tm-copy-btn" data-text="${encodeURIComponent(text)}">Copy</button>`;
    output.querySelector('.tm-copy-btn').addEventListener('click', btn => {
      navigator.clipboard.writeText(decodeURIComponent(btn.dataset.text)).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
      });
    });
    autoLogToTimeline(c, `${method === 'call' ? 'Call prep' : method === 'email' ? 'Email drafted' : 'Meeting agenda generated'}`, act.text);
  } catch {
    output.innerHTML = `<div class="tm-output-text" style="color:var(--danger);">Could not reach AI service.</div>`;
  }
}

function autoLogToTimeline(c, title, detail) {
  if (!c.activityTimeline) return;
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  c.activityTimeline.unshift({ date: now, type: 'note', title, detail });
}

/* ══════════════════════════════════════════
   TEAM DATA
   ══════════════════════════════════════════ */
const TEAM = [
  {
    key: 'sarah', name: 'Sarah Johnson', title: 'Senior Account Manager',
    accounts: ['ABC Manufacturing'],
    pipeline: '$21,950', avgHealth: 82, openOpps: 4,
    lastReview: '8 months ago', status: 'watch',
    note: 'Strong relationship but QBR overdue. Pipeline is healthy.'
  },
  {
    key: 'mark', name: 'Mark Davies', title: 'Account Manager',
    accounts: ['River Tech Solutions'],
    pipeline: '$17,500', avgHealth: 71, openOpps: 4,
    lastReview: '4 months ago', status: 'good',
    note: 'Actively working server refresh. Backup urgency needs escalation.'
  },
  {
    key: 'lisa', name: 'Lisa Tran', title: 'Senior Account Manager',
    accounts: ['Peak Financial Group'],
    pipeline: '$4,000', avgHealth: 91, openOpps: 2,
    lastReview: '2 months ago', status: 'strong',
    note: 'Exemplary account management. Best practice for the team.'
  }
];

const ATTENTION = [
  {
    key: 'abc', name: 'ABC Manufacturing', am: 'Sarah Johnson',
    priority: 96, pipeline: '$21,950',
    reasons: 'Security review 14 months overdue · 7 unlicensed users · EOL in 10 months'
  },
  {
    key: 'river', name: 'River Tech Solutions', am: 'Mark Davies',
    priority: 88, pipeline: '$17,500',
    reasons: 'Backup target failing · 3 servers out of warranty · No MFA deployed'
  }
];

/* ══════════════════════════════════════════
   PORTFOLIO INTELLIGENCE — signal filter map
   ══════════════════════════════════════════ */
const PORT_SIGNAL_FILTERS = {
  win10:    ['abc'],
  security: ['abc', 'river'],
  license:  ['abc', 'river'],
  price:    ['abc', 'river']
};
let activeSignalFilter = null;

/* ══════════════════════════════════════════
   RENDER TEAM
   ══════════════════════════════════════════ */
function renderTeam() {
  const statusMap = {
    strong: { cls: 'perf-strong', label: 'Strong' },
    good:   { cls: 'perf-good',   label: 'Good'   },
    watch:  { cls: 'perf-watch',  label: 'Watch'  },
    coach:  { cls: 'perf-coach',  label: 'Needs coaching' }
  };

  document.getElementById('team-list').innerHTML = TEAM.map(am => {
    const s = statusMap[am.status] || statusMap.good;
    const hColor = am.avgHealth >= 85 ? 'var(--good)' : am.avgHealth >= 70 ? 'var(--warn)' : 'var(--danger)';
    return `
      <div class="team-row">
        <div><div class="team-am-name">${am.name}</div><div class="team-am-title">${am.title}</div></div>
        <span style="font-size:12px;">${am.accounts.length}</span>
        <span class="team-pipeline">${am.pipeline}</span>
        <span style="font-size:14px;color:${hColor};">${am.avgHealth}</span>
        <span style="font-size:12px;">${am.openOpps}</span>
        <span style="font-size:11px;color:var(--text-2);font-family:'Courier New',monospace;">${am.lastReview}</span>
        <span class="perf-badge ${s.cls}">${s.label}</span>
      </div>`;
  }).join('');

  document.getElementById('attention-list').innerHTML = ATTENTION.map(a => {
    const pColor = a.priority >= 90 ? 'var(--danger)' : 'var(--warn)';
    return `
      <div class="attention-row" data-key="${a.key}" tabindex="0" role="button" aria-label="Open briefing for ${a.name}">
        <div class="att-priority" style="color:${pColor};">${a.priority}</div>
        <div class="att-body">
          <div class="att-name">${a.name}</div>
          <div class="att-am">${a.am}</div>
          <div class="att-reasons">${a.reasons}</div>
        </div>
        <div class="att-pipeline">${a.pipeline}</div>
        <span class="signal-arrow">&#8250;</span>
      </div>`;
  }).join('');

  document.querySelectorAll('.attention-row[data-key]').forEach(row => {
    const go = () => {
      const key = row.dataset.key;
      if (CUSTOMERS[key]) { switchView('briefing'); ensureBriefingRendered(key); }
    };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
}

/* ══════════════════════════════════════════
   PORTFOLIO INTELLIGENCE CARDS
   ══════════════════════════════════════════ */
function initPortfolioIntel() {
  document.querySelectorAll('.port-intel-signal').forEach(card => {
    card.addEventListener('click', () => {
      const sig = card.dataset.filterSignal;
      if (activeSignalFilter === sig) {
        activeSignalFilter = null;
        card.classList.remove('active');
        renderPortfolio(activeFilter);
      } else {
        activeSignalFilter = sig;
        document.querySelectorAll('.port-intel-signal').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        renderPortfolioBySignal(sig);
      }
    });
  });
}

function renderPortfolioBySignal(sig) {
  const keys = PORT_SIGNAL_FILTERS[sig] || [];
  let rows = PORTFOLIO.filter(r => keys.includes(r.key));
  renderPortfolioRows(rows);
  document.getElementById('port-sub').textContent =
    `Showing ${rows.length} account${rows.length !== 1 ? 's' : ''} with this signal`;
}

/* ══════════════════════════════════════════
   WELCOME BANNER & NUDGES
   ══════════════════════════════════════════ */
function initWelcomeBanner() {
  const banner = document.getElementById('welcome-banner');
  const closeBtn = document.getElementById('welcome-close');
  if (!banner) return;
  if (localStorage.getItem('cgos_welcome_dismissed')) {
    banner.style.display = 'none';
    return;
  }
  closeBtn.addEventListener('click', () => {
    banner.style.display = 'none';
    localStorage.setItem('cgos_welcome_dismissed', '1');
  });
}

function initNudges() {
  // Signal nudge
  const nudgeSignal = document.getElementById('nudge-signal');
  const closeSignal = document.getElementById('nudge-signal-close');
  if (nudgeSignal) {
    if (localStorage.getItem('cgos_nudge_signal')) nudgeSignal.classList.add('hidden');
    else {
      closeSignal.addEventListener('click', () => {
        nudgeSignal.classList.add('hidden');
        localStorage.setItem('cgos_nudge_signal', '1');
      });
    }
  }

  // Health nudge
  const nudgeHealth = document.getElementById('nudge-health');
  const closeHealth = document.getElementById('nudge-health-close');
  if (nudgeHealth) {
    if (localStorage.getItem('cgos_nudge_health')) nudgeHealth.classList.add('hidden');
    else {
      closeHealth.addEventListener('click', () => {
        nudgeHealth.classList.add('hidden');
        localStorage.setItem('cgos_nudge_health', '1');
      });
      // Also dismiss when health chip is clicked
      document.getElementById('chip-health').addEventListener('click', () => {
        nudgeHealth.classList.add('hidden');
        localStorage.setItem('cgos_nudge_health', '1');
      }, { once: true });
    }
  }

  // Dismiss signal nudge on first signal click
  document.addEventListener('click', function dismissSignalNudge(e) {
    if (e.target.closest('.signal-row')) {
      const n = document.getElementById('nudge-signal');
      if (n) { n.classList.add('hidden'); localStorage.setItem('cgos_nudge_signal', '1'); }
      document.removeEventListener('click', dismissSignalNudge);
    }
  });
}

/* ══════════════════════════════════════════
   TEAM AI BRIEF
   ══════════════════════════════════════════ */
async function generateTeamAI() {
  const teamBtn = document.getElementById('team-ai-btn');
  const out     = document.getElementById('team-ai-output');
  const txt     = document.getElementById('team-ai-text');
  teamBtn.innerHTML = '<span class="spinner"></span> Generating...';
  teamBtn.disabled  = true;
  out.style.display = 'none';

  const teamLines = TEAM.map(am =>
    `${am.name} (${am.title}): ${am.accounts.join(', ')} — Pipeline: ${am.pipeline} — Avg health: ${am.avgHealth} — Status: ${am.status} — ${am.note}`
  ).join('\n');
  const attnLines = ATTENTION.map(a =>
    `${a.name} (Priority ${a.priority}): ${a.reasons}`
  ).join('\n');

  const sys = `You are a sales manager coach reviewing an MSP account management team. Plain text only — no markdown, no bullets. 3 short paragraphs: (1) portfolio health summary and which AM is performing best, (2) where the manager should focus this week — specific accounts and specific reasons, (3) one coaching observation for the team. Be direct and specific. No platitudes.`;
  const prompt = `Team:\n${teamLines}\n\nAccounts needing attention:\n${attnLines}\n\nGenerate a manager brief.`;

  try { txt.textContent = await callAI(prompt, sys); }
  catch { txt.textContent = 'Could not reach the AI service.'; }

  out.style.display = 'block';
  teamBtn.innerHTML = 'Generate &rarr;';
  teamBtn.disabled  = false;
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ══════════════════════════════════════════
   BRIEFING MODE SWITCHING
   ══════════════════════════════════════════ */
let briefingMode = 'intelligence';

function setBriefingMode(mode) {
  briefingMode = mode;
  const intelSections    = document.getElementById('intelligence-sections');
  const pipelineSections = document.getElementById('pipeline-sections');
  const btnIntel         = document.getElementById('mode-intelligence');
  const btnPipeline      = document.getElementById('mode-pipeline');

  if (mode === 'pipeline') {
    if (intelSections)    intelSections.style.display    = 'none';
    if (pipelineSections) pipelineSections.style.display = '';
    if (btnIntel)         btnIntel.classList.remove('active');
    if (btnPipeline)      btnPipeline.classList.add('active');
    renderPipelineMode(customerSelect.value);
  } else {
    if (intelSections)    intelSections.style.display    = '';
    if (pipelineSections) pipelineSections.style.display = 'none';
    if (btnIntel)         btnIntel.classList.add('active');
    if (btnPipeline)      btnPipeline.classList.remove('active');
  }
}

function initModeToggle() {
  const btnIntel    = document.getElementById('mode-intelligence');
  const btnPipeline = document.getElementById('mode-pipeline');
  if (btnIntel)    btnIntel.addEventListener('click',    () => setBriefingMode('intelligence'));
  if (btnPipeline) btnPipeline.addEventListener('click', () => setBriefingMode('pipeline'));

  // New opportunity buttons — open Salesbuildr
  ['new-opp-btn','new-opp-btn-pipeline'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
      const custKey = customerSelect.value;
      const c = CUSTOMERS[custKey];
      // In production this would deep-link into Salesbuildr with customer pre-filled
      openAlignmentModal(
        'Create Opportunity — ' + (c ? c.name : 'Customer'),
        `In production, this opens the Salesbuildr opportunity form with ${c ? c.name : 'the customer'} pre-filled. The AM completes the form in Salesbuildr and the opportunity appears here automatically.`,
        false
      );
      document.getElementById('modal-footer').innerHTML = `
        <button class="modal-btn primary" onclick="window.open('https://app.salesbuildr.com/opportunities/new','_blank')">Open in Salesbuildr ↗</button>
        <button class="modal-btn" onclick="document.getElementById('modal-overlay').classList.remove('open');document.body.style.overflow='';">Close</button>`;
      document.getElementById('modal-overlay').classList.add('open');
      document.getElementById('modal-overlay').setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    });
  });
}

function renderPipelineMode(custKey) {
  const c = CUSTOMERS[custKey];
  if (!c || !c.opportunities) return;

  // Count and header
  const countEl = document.getElementById('pipeline-count');
  const active = c.opportunities.length;
  if (countEl) countEl.textContent = `${active} active deal${active !== 1 ? 's' : ''} · ${c.oppTotal}`;

  // Opportunity list — richer cards in pipeline mode
  const listEl = document.getElementById('pipeline-opp-list');
  if (!listEl) return;

  const urgencyColor = (u) => u === 'danger' ? 'var(--danger)' : u === 'warn' ? 'var(--warn)' : 'var(--accent-2)';
  const urgencyBg    = (u) => u === 'danger' ? 'var(--danger-bg)' : u === 'warn' ? 'var(--warn-bg)' : 'var(--info-bg)';

  listEl.innerHTML = c.opportunities.map(opp => {
    const hasProgress = opp.emails > 0 || opp.meetings > 0 || opp.proposalSent;
    const uc = urgencyColor(opp.nextStepUrgency);
    const ub = urgencyBg(opp.nextStepUrgency);
    return `
    <div class="pipeline-card" data-opp="${opp.id}">
      <div class="pipeline-card-header">
        <div class="pipeline-card-left">
          <div class="pipeline-card-status opp-status-${opp.status}"></div>
          <div>
            <div class="pipeline-card-title">${opp.title}</div>
            <div class="pipeline-card-meta">
              ${statusTagHtml(opp.status, opp.statusLabel)}
              <span class="opp-card-date">Created ${opp.created}</span>
              ${hasProgress ? '<span class="pipeline-wip-badge">In progress</span>' : ''}
            </div>
          </div>
        </div>
        <div class="pipeline-card-right">
          <div class="pipeline-card-val">${opp.value}</div>
          <div class="opp-card-activity">
            ${opp.emails    ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${opp.emails}</span>` : ''}
            ${opp.meetings  ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${opp.meetings}</span>` : ''}
            ${opp.proposalSent ? `<span class="opp-act-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Proposal</span>` : ''}
          </div>
        </div>
      </div>
      <div class="pipeline-card-last">
        <strong>Last:</strong> ${opp.lastActivity}
        <span style="color:var(--text-3);">&middot; ${opp.lastActivityAge}</span>
      </div>
      ${opp.nextStep ? `
      <div class="pipeline-nextstep" style="border-color:${uc};background:${ub};">
        <span class="opp-next-label" style="color:${uc};">NEXT STEP</span>
        <span class="opp-next-text" style="color:${uc};">${opp.nextStep}</span>
        ${opp.taskId ? `<button class="opp-followup-btn pipeline-followup" data-taskid="${opp.taskId}" data-custkey="${custKey}" style="border-color:${uc};color:${uc};">Follow up &rarr;</button>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');

  // Wire card click → opp modal
  listEl.querySelectorAll('.pipeline-card[data-opp]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.opp-followup-btn')) return;
      openOppModal(card.dataset.opp, c);
    });
  });

  // Wire follow up buttons
  listEl.querySelectorAll('.pipeline-followup').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const custData = WORK_TODAY.customers.find(cu => cu.key === btn.dataset.custkey);
      const act = custData?.activities.find(a => a.id === btn.dataset.taskid);
      if (act && act.taskSignal) openTaskModal(act, btn.dataset.custkey);
    });
  });

  // Timeline in pipeline mode
  const tlMeta = document.getElementById('pipeline-timeline-meta');
  const tlList = document.getElementById('pipeline-timeline-list');
  const tlChevron = document.getElementById('pipeline-timeline-chevron');
  const tlExpanded = document.getElementById('pipeline-timeline-expanded');
  if (c.activityTimeline && tlMeta) {
    tlMeta.innerHTML = `${c.activityTimeline.length} events &middot; last activity ${c.activityTimeline[0]?.date || ''}`;
  }
  if (tlChevron && tlExpanded && tlList) {
    let open = false;
    document.getElementById('pipeline-timeline-bar').onclick = () => {
      open = !open;
      tlChevron.classList.toggle('open', open);
      if (open) { tlList.innerHTML = renderTimelineEntries(c.activityTimeline); tlExpanded.classList.add('open'); }
      else tlExpanded.classList.remove('open');
    };
  }
}

/* ══════════════════════════════════════════
   DOCUMENT GENERATOR
   ══════════════════════════════════════════ */

/* Session document history */
const docHistory = {};  // { custKey: [{type, label, date, content}] }

/* Seeded history for demo */
const SEEDED_DOC_HISTORY = {
  abc:   [{ type:'health', label:'Health Report', date:'Jun 10' }, { type:'qbr', label:'QBR Document', date:'Apr 2026' }],
  river: [{ type:'qbr', label:'QBR Document', date:'Mar 2026' }],
  peak:  [{ type:'health', label:'Health Report', date:'May 2026' }, { type:'roadmap', label:'Technology Roadmap', date:'Jan 2026' }]
};

function initDocPanel() {
  const trigger   = document.getElementById('doc-tab-trigger');
  const panel     = document.getElementById('doc-panel');
  const closeBtn  = document.getElementById('doc-panel-close');
  const layout    = document.querySelector('.page-layout');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      if (layout) layout.classList.remove('doc-open');
    } else {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      if (layout) layout.classList.add('doc-open');
      updateDocPanel(customerSelect.value);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (layout) layout.classList.remove('doc-open');
  });

  // Wire generate buttons
  panel.querySelectorAll('.doc-gen-btn').forEach(btn => {
    btn.addEventListener('click', () => generateDocument(btn.dataset.doctype, customerSelect.value));
  });

  // Build output overlay
  if (!document.getElementById('doc-output-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'doc-output-overlay';
    overlay.id = 'doc-output-overlay';
    overlay.innerHTML = `
      <div class="doc-output-window">
        <div class="doc-output-header">
          <div class="doc-output-title" id="doc-output-title">Document</div>
          <div class="doc-output-actions">
            <button class="modal-btn" id="doc-print-btn">Print / Save PDF</button>
            <button class="doc-close-btn" id="doc-output-close">&times;</button>
          </div>
        </div>
        <div class="doc-output-body" id="doc-output-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('doc-output-close').addEventListener('click', () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
    document.getElementById('doc-print-btn').addEventListener('click', () => {
      const bodyEl  = document.getElementById('doc-output-body');
      const content = bodyEl ? bodyEl.innerHTML : '';
      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Document</title>
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; }
          @page { margin: 15mm; }
        </style>
      </head><body>${content}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 600);
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    });
  }
}

function updateDocPanel(custKey) {
  const c = CUSTOMERS[custKey];
  if (!c) return;
  const custEl = document.getElementById('doc-panel-cust');
  if (custEl) custEl.textContent = c.name;

  // Build history list
  const historyEl = document.getElementById('doc-history-list');
  if (!historyEl) return;
  const seeded   = SEEDED_DOC_HISTORY[custKey] || [];
  const session  = docHistory[custKey] || [];
  const all      = [...session, ...seeded];
  if (all.length === 0) {
    historyEl.innerHTML = '<div style="font-size:11px;color:var(--text-3);padding:2px 0;">No documents generated yet</div>';
    return;
  }
  historyEl.innerHTML = all.map(h => `
    <div class="doc-history-item">
      <div class="doc-history-dot doc-h-${h.type}"></div>
      <span class="doc-history-name">${h.label}</span>
      <span class="doc-history-date">${h.date}</span>
      <span class="doc-history-open" data-doctype="${h.type}" data-custkey="${custKey}">Open ↗</span>
    </div>`).join('');

  historyEl.querySelectorAll('.doc-history-open').forEach(link => {
    link.addEventListener('click', () => {
      const existing = (docHistory[link.dataset.custkey] || []).find(h => h.type === link.dataset.doctype);
      if (existing) showDocOutput(existing.label, existing.content);
      else generateDocument(link.dataset.doctype, link.dataset.custkey);
    });
  });
}

async function generateDocument(type, custKey) {
  const c = CUSTOMERS[custKey];
  if (!c) return;

  const labels = { health: 'Health Report', qbr: 'QBR Document', roadmap: 'Technology Roadmap' };
  const label  = labels[type];

  // Disable the button and show loading
  const btn = document.querySelector(`.doc-gen-btn[data-doctype="${type}"]`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating...'; }

  const now  = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  const shortDate = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' });

  let content = '';
  try {
    if (type === 'health')  content = await generateHealthReport(c, now);
    if (type === 'qbr')     content = await generateQBR(c, now);
    if (type === 'roadmap') content = await generateRoadmap(c, now);
  } catch(e) {
    content = `<div style="padding:24px;color:var(--danger);">Could not reach AI service. Please try again.</div>`;
  }

  // Restore button
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> ${type === 'health' ? 'Generate Health Report' : type === 'qbr' ? 'Generate QBR' : 'Generate Roadmap'}`;
    if (type === 'health') { btn.classList.add('doc-gen-primary'); }
  }

  // Save to session history
  if (!docHistory[custKey]) docHistory[custKey] = [];
  docHistory[custKey].unshift({ type, label, date: shortDate, content });

  // Auto-log to activity timeline
  autoLogToTimeline(c, `${label} generated`, `Generated ${now} · auto-logged to strategic memory`);

  // Update history display
  updateDocPanel(custKey);

  // Show output
  showDocOutput(`${label} — ${c.name}`, content);
}

function showDocOutput(title, content) {
  const overlay = document.getElementById('doc-output-overlay');
  const titleEl = document.getElementById('doc-output-title');
  const bodyEl  = document.getElementById('doc-output-body');
  if (!overlay || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML    = content;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* ─── Document templates ─────────────────────────────────────────────── */

async function generateHealthReport(c, date) {
  const sys = `You are a data assistant. Output ONLY valid JSON with these exact fields, no other text:
{"next_step_1_title":"...","next_step_1_detail":"...","next_step_1_date":"...","next_step_2_title":"...","next_step_2_detail":"...","next_step_2_date":"...","next_step_3_title":"...","next_step_3_detail":"...","next_step_3_date":"...","summary_sentence":"One sentence max 25 words on health status and biggest priority."}`;
  const prompt = `Customer: ${c.name} | Type: ${c.type} | MRR: ${c.mrr} | Health: ${c.health}/100 | AM: ${c.am} | Signals: ${c.signals.slice(0,3).map(s=>s.title+' ('+s.cls+')').join('; ')} | Alignment: ${c.alignment?.overall||0}% — ${c.alignment?.rec?.title||''} ${c.alignment?.rec?.val||''} | Dims: ${(c.healthBreakdown?.dimensions||[]).map(d=>d.label+':'+d.score).join(',')}. Generate 3 next steps and summary.`;
  const resp = await fetch('/api/ai-brief', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerName: c.name, prompt, systemPrompt: sys, maxTokens: 500 }) });
  const data = await resp.json();
  let ai = { next_step_1_title:'Schedule strategic review', next_step_1_detail:'Address top priority signals', next_step_1_date:'Next 30 days', next_step_2_title:'Review agreement alignment', next_step_2_detail:'Close identified gaps', next_step_2_date:'Next 60 days', next_step_3_title:'Security assessment', next_step_3_detail:'Overdue — schedule now', next_step_3_date:'Q3 2026', summary_sentence:`${c.name} health is ${c.health}/100 — priority action is ${c.signals[0]?.title || 'agreement review'}.` };
  try { const r = data.brief||''; const s=r.indexOf('{'),e=r.lastIndexOf('}'); if(s>-1&&e>-1) ai={...ai,...JSON.parse(r.slice(s,e+1))}; } catch(e){}
  const dims = c.healthBreakdown?.dimensions || [{label:'Relationship',score:95},{label:'Technical',score:78},{label:'Security',score:62},{label:'Alignment',score:86},{label:'Lifecycle',score:71},{label:'Engagement',score:88}];
  const dc = s => s>=85?'#16a34a':s>=70?'#d97706':'#dc2626';
  const dtc = s => s>=85?'#166534':s>=70?'#92400E':'#991B1B';
  const hc = c.health>=85?'#166534':c.health>=70?'#92400E':'#991B1B';
  const sd = cls => cls==='high'?'#dc2626':cls==='med'?'#d97706':'#16a34a';
  const sb = cls => cls==='high'?'#fee2e2':cls==='med'?'#fffbeb':'#f0fdf4';
  const stc = cls => cls==='high'?'#991B1B':cls==='med'?'#92400E':'#166534';
  const als = s => s>=85?'#166534':s>=70?'#92400E':'#991B1B';
  const al = c.alignment?.items || [];
  return `<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}</style>
<div style="font-family:Inter,system-ui,sans-serif;max-width:680px;margin:0 auto;padding:32px;color:#0B0E14;">
<div style="font-size:10px;letter-spacing:.1em;color:#9CA3AF;text-transform:uppercase;margin-bottom:5px;">Health Report · Confidential</div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;border-bottom:2.5px solid #2E74DC;margin-bottom:18px;">
  <div>
    <div style="font-size:24px;font-weight:700;color:#0B0E14;letter-spacing:-.02em;">${c.name}</div>
    <div style="font-size:12px;color:#4B5563;margin-top:4px;">${c.type} · ${c.mrr} MRR · Prepared ${date} · ${c.am}</div>
    <div style="font-size:12px;color:#6B7280;margin-top:3px;font-style:italic;">${ai.summary_sentence}</div>
  </div>
  <div style="text-align:right;flex-shrink:0;margin-left:20px;">
    <div style="font-size:42px;font-weight:700;line-height:1;color:${hc};">${c.health}</div>
    <div style="font-size:10px;letter-spacing:.08em;color:#9CA3AF;margin-top:2px;">HEALTH SCORE</div>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;">
  <div style="background:#F5F5F2;padding:10px 12px;border-radius:6px;"><div style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;">Account Manager</div><div style="font-size:13px;font-weight:600;color:#0B0E14;margin-top:3px;">${c.am}</div></div>
  <div style="background:#F5F5F2;padding:10px 12px;border-radius:6px;"><div style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;">Primary Contact</div><div style="font-size:13px;font-weight:600;color:#0B0E14;margin-top:3px;">${c.contact?.name||'—'}</div><div style="font-size:11px;color:#6B7280;">${c.contact?.role||''}</div></div>
  <div style="background:#F5F5F2;padding:10px 12px;border-radius:6px;"><div style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;">Customer Since</div><div style="font-size:13px;font-weight:600;color:#0B0E14;margin-top:3px;">${c.since||'—'}</div></div>
  <div style="background:#F5F5F2;padding:10px 12px;border-radius:6px;"><div style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;">Last Review</div><div style="font-size:13px;font-weight:600;color:#0B0E14;margin-top:3px;">${(c.memory?.meta||'—').replace('Last review: ','')}</div></div>
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Health Dimensions</div>
<div style="margin-bottom:18px;">
  ${dims.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:.5px solid #F0EFE8;"><span style="font-size:12px;color:#0B0E14;width:140px;flex-shrink:0;">${d.label}</span><div style="flex:1;height:7px;background:#F0EFE8;border-radius:4px;overflow:hidden;"><div style="width:${d.score}%;height:7px;background:${dc(d.score)};border-radius:4px;"></div></div><span style="font-size:12px;font-weight:600;width:28px;text-align:right;color:${dtc(d.score)};">${d.score}</span></div>`).join('')}
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Top Signals</div>
<div style="margin-bottom:18px;">
  ${c.signals.slice(0,3).map(s=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${sb(s.cls)};border-radius:6px;margin-bottom:5px;"><div style="width:8px;height:8px;border-radius:50%;background:${sd(s.cls)};flex-shrink:0;"></div><div style="flex:1;"><div style="font-size:12px;color:#0B0E14;">${s.title}</div><div style="font-size:10px;color:#6B7280;margin-top:1px;">${s.source||s.sub||''}</div></div><span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${sb(s.cls)};color:${stc(s.cls)};border:.5px solid ${sd(s.cls)}55;flex-shrink:0;">${s.action||(s.cls==='high'?'Urgent':s.cls==='med'?'Review':'OK')}</span></div>`).join('')}
</div>
<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;"><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;">Agreement Alignment</div><div style="font-size:10px;color:#6B7280;">Overall ${c.alignment?.overall||0}%</div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:18px;">
  ${al.slice(0,6).map(a=>`<div style="padding:8px 10px;border-radius:6px;border:.5px solid #E5E7EB;"><div style="font-size:10px;color:#6B7280;">${a.label}</div><div style="font-size:15px;font-weight:600;color:${als(a.score)};margin-top:2px;">${a.score}%</div></div>`).join('')}
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Recommended Next Steps</div>
<div style="margin-bottom:20px;">
  ${[1,2,3].map(n=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:.5px solid #F0EFE8;align-items:flex-start;"><div style="width:20px;height:20px;border-radius:50%;background:#2E74DC;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-top:1px;">${n}</div><div style="flex:1;"><div style="font-size:12px;font-weight:500;color:#0B0E14;">${ai['next_step_'+n+'_title']}</div><div style="font-size:11px;color:#6B7280;margin-top:2px;">${ai['next_step_'+n+'_detail']}</div></div><span style="font-size:10px;color:#2E74DC;flex-shrink:0;margin-top:2px;">${ai['next_step_'+n+'_date']}</span></div>`).join('')}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:.5px solid #E5E7EB;">
  <span style="font-size:11px;font-weight:700;color:#2E74DC;letter-spacing:.06em;">Salesbuildr</span>
  <span style="font-size:10px;color:#9CA3AF;">Prepared by ${c.am} · ${c.name} · ${date} · Confidential</span>
</div>
</div>`;
}

async function generateQBR(c, date) {
  const sys = `You are a data assistant. Output ONLY valid JSON, no other text:
{"achievements":[{"title":"...","detail":"..."}],"open_items":[{"title":"...","detail":"...","severity":"warn|danger"}],"risks":[{"title":"...","detail":"..."}],"strategic_priorities":["...","...","..."]}
Max 3 achievements, 2 open items, 2 risks, 3 priorities. Be specific and commercial.`;
  const memGroups = c.memory?.groups || [];
  const completed = memGroups.find(g=>g.label==='Completed')?.items||[];
  const openItems = memGroups.filter(g=>g.label!=='Completed').flatMap(g=>g.items||[]);
  const opps = (c.opportunities||[]).map(o=>`${o.title} ${o.value} (${o.statusLabel})`).join('; ')||'None';
  const prompt = `QBR data for ${c.name} | ${c.type} | ${c.mrr} MRR | Health ${c.health}/100 | AM: ${c.am} | ${date} | Last review: ${c.memory?.meta||''} | Completed: ${completed.slice(0,3).map(i=>i.text).join(', ')||'None'} | Open: ${openItems.slice(0,3).map(i=>i.text).join(', ')||'None'} | Opportunities: ${opps.slice(0,150)} | Alignment: ${c.alignment?.overall||0}% | Signals: ${c.signals.slice(0,3).map(s=>s.title).join('; ')}. Generate QBR JSON.`;
  const resp = await fetch('/api/ai-brief', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerName: c.name, prompt, systemPrompt: sys, maxTokens: 700 }) });
  const data = await resp.json();
  let ai = { achievements:[{title:'Strategic review completed',detail:'Account roadmap updated and agreed'},{title:'Technical alignment improved',detail:'Key gaps addressed this quarter'}], open_items:[{title:'Security review outstanding',detail:'Schedule before end of quarter',severity:'warn'}], risks:[{title:'EOL devices unplanned',detail:'Action required before deadline'}], strategic_priorities:['Maintain proactive review cadence','Address open security items','Align technology with business growth'] };
  try { const r=data.brief||''; const s=r.indexOf('{'),e=r.lastIndexOf('}'); if(s>-1&&e>-1) ai={...ai,...JSON.parse(r.slice(s,e+1))}; } catch(err){}
  const hc = c.health>=85?'#166534':c.health>=70?'#92400E':'#991B1B';
  const oppsTotal = c.opportunities?.reduce((t,o)=>{const v=parseFloat((o.value||'0').replace(/[^0-9.]/g,''));return t+(isNaN(v)?0:v);},0)||0;
  const lifecycle = (c.lifecycle?.items||[]).slice(0,4);
  const al = c.alignment?.items||[];
  const als = s=>s>=85?'#166534':s>=70?'#92400E':'#991B1B';
  return `<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}</style>
<div style="font-family:Inter,system-ui,sans-serif;max-width:680px;margin:0 auto;padding:32px;color:#0B0E14;">
<div style="font-size:10px;letter-spacing:.1em;color:#9CA3AF;text-transform:uppercase;margin-bottom:5px;">Quarterly Business Review · Confidential</div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;border-bottom:2.5px solid #2E74DC;margin-bottom:18px;">
  <div><div style="font-size:24px;font-weight:700;color:#0B0E14;letter-spacing:-.02em;">${c.name}</div><div style="font-size:12px;color:#4B5563;margin-top:4px;">${c.type} · ${c.mrr} MRR · ${date} · ${c.am}</div></div>
  <div style="text-align:right;flex-shrink:0;margin-left:20px;"><div style="font-size:42px;font-weight:700;line-height:1;color:${hc};">${c.health}</div><div style="font-size:10px;letter-spacing:.08em;color:#9CA3AF;margin-top:2px;">HEALTH SCORE</div></div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
  <div style="background:#F5F5F2;padding:10px;border-radius:6px;text-align:center;"><div style="font-size:20px;font-weight:700;color:#166534;">${ai.achievements?.length||0}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">Completed</div></div>
  <div style="background:#F5F5F2;padding:10px;border-radius:6px;text-align:center;"><div style="font-size:20px;font-weight:700;color:#92400E;">${ai.open_items?.length||0}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">Open items</div></div>
  <div style="background:#F5F5F2;padding:10px;border-radius:6px;text-align:center;"><div style="font-size:20px;font-weight:700;color:#991B1B;">${ai.risks?.length||0}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">Risks</div></div>
  <div style="background:#F5F5F2;padding:10px;border-radius:6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:#2E74DC;">$${oppsTotal.toLocaleString()}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">Pipeline</div></div>
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">This Quarter — Achievements</div>
${(ai.achievements||[]).map(a=>`<div style="padding:10px 12px;border-radius:6px;border-left:3px solid #16a34a;background:#f0fdf4;margin-bottom:6px;"><div style="font-size:12px;font-weight:600;color:#166534;">✓ ${a.title}</div><div style="font-size:11px;color:#4B5563;margin-top:2px;">${a.detail}</div></div>`).join('')}
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin:16px 0 10px;">Open Items &amp; Risks</div>
${(ai.open_items||[]).map(a=>`<div style="padding:10px 12px;border-radius:6px;border-left:3px solid ${a.severity==='danger'?'#dc2626':'#d97706'};background:${a.severity==='danger'?'#fef2f2':'#fffbeb'};margin-bottom:6px;"><div style="font-size:12px;font-weight:600;color:${a.severity==='danger'?'#991B1B':'#92400E'};">⚠ ${a.title}</div><div style="font-size:11px;color:#4B5563;margin-top:2px;">${a.detail}</div></div>`).join('')}
${(ai.risks||[]).map(a=>`<div style="padding:10px 12px;border-radius:6px;border-left:3px solid #dc2626;background:#fef2f2;margin-bottom:6px;"><div style="font-size:12px;font-weight:600;color:#991B1B;">✕ ${a.title}</div><div style="font-size:11px;color:#4B5563;margin-top:2px;">${a.detail}</div></div>`).join('')}
<div style="border-top:2px dashed #E5E7EB;margin:22px 0 18px;text-align:center;"><span style="background:#fff;padding:0 10px;font-size:10px;color:#9CA3AF;letter-spacing:.06em;text-transform:uppercase;">Page 2 — Forward View</span></div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Coming Up — Next 12 Months</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;">
  ${lifecycle.map(l=>`<div style="padding:10px 12px;border-radius:6px;border:.5px solid #E5E7EB;"><div style="font-size:11px;font-weight:600;color:#0B0E14;">${l.title}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">${l.sub}</div><div style="font-size:12px;font-weight:600;color:#2E74DC;margin-top:4px;">${l.val}</div></div>`).join('')}
  ${(c.opportunities||[]).slice(0,4-lifecycle.length).map(o=>`<div style="padding:10px 12px;border-radius:6px;border:.5px solid #E5E7EB;"><div style="font-size:11px;font-weight:600;color:#0B0E14;">${o.title}</div><div style="font-size:10px;color:#6B7280;margin-top:2px;">${o.statusLabel}</div><div style="font-size:12px;font-weight:600;color:#2E74DC;margin-top:4px;">${o.value}</div></div>`).join('')}
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Agreement Alignment · ${c.alignment?.overall||0}%</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:18px;">
  ${al.slice(0,6).map(a=>`<div style="padding:8px 10px;border-radius:6px;border:.5px solid #E5E7EB;"><div style="font-size:10px;color:#6B7280;">${a.label}</div><div style="font-size:15px;font-weight:600;color:${als(a.score)};margin-top:2px;">${a.score}%</div></div>`).join('')}
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Strategic Priorities</div>
<div style="margin-bottom:20px;">
  ${(ai.strategic_priorities||[]).map(p=>`<div style="display:flex;gap:10px;padding:7px 0;border-bottom:.5px solid #F0EFE8;align-items:flex-start;"><div style="width:6px;height:6px;border-radius:50%;background:#2E74DC;flex-shrink:0;margin-top:5px;"></div><div style="font-size:12px;color:#0B0E14;line-height:1.5;">${p}</div></div>`).join('')}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:.5px solid #E5E7EB;">
  <span style="font-size:11px;font-weight:700;color:#2E74DC;letter-spacing:.06em;">Salesbuildr</span>
  <span style="font-size:10px;color:#9CA3AF;">QBR · ${c.name} · ${date} · Confidential</span>
</div>
</div>`;
}

async function generateRoadmap(c, date) {
  const sys = `You are a data assistant. Output ONLY valid JSON, no other text:
{"strategic_priorities":["...","...","...","..."],"current_state":{"strengths":["...","..."],"gaps":["...","..."]},"investment_notes":"One sentence on total investment rationale."}
Max 4 priorities, 2 strengths, 2 gaps. Be specific, forward-looking, business-focused.`;
  const lifecycle = (c.lifecycle?.items||[]).slice(0,6);
  const opps = (c.opportunities||[]);
  const prompt = `Roadmap data for ${c.name} | ${c.type} | ${c.mrr} MRR | Health ${c.health}/100 | AM: ${c.am} | ${date} | Lifecycle: ${lifecycle.map(l=>l.title+' '+l.sub+' '+l.val).join('; ')} | Opportunities: ${opps.map(o=>o.title+' '+o.value).join('; ')} | Alignment: ${c.alignment?.overall||0}% | Signals: ${c.signals.slice(0,3).map(s=>s.title).join('; ')}. Generate roadmap JSON.`;
  const resp = await fetch('/api/ai-brief', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ customerName: c.name, prompt, systemPrompt: sys, maxTokens: 600 }) });
  const data = await resp.json();
  let ai = { strategic_priorities:['Proactively manage technology lifecycle to avoid emergency costs','Close security gaps before they become compliance issues','Align service agreements with actual usage and business growth','Establish quarterly review cadence for strategic alignment'], current_state:{strengths:['Strong relationship and communication','Core infrastructure stable'],gaps:['Security review overdue','Device refresh planning required']}, investment_notes:'Investment focused on proactive refresh and security to protect business continuity.' };
  try { const r=data.brief||''; const s=r.indexOf('{'),e=r.lastIndexOf('}'); if(s>-1&&e>-1) ai={...ai,...JSON.parse(r.slice(s,e+1))}; } catch(err){}
  const hc = c.health>=85?'#166534':c.health>=70?'#92400E':'#991B1B';
  const qtr = ['Q3 2026','Q4 2026','Q1 2027','Q2 2027'];
  const qtrSub = ['Jul · Aug · Sep','Oct · Nov · Dec','Jan · Feb · Mar','Apr · May · Jun'];
  const oppsTotal = opps.reduce((t,o)=>{const v=parseFloat((o.value||'0').replace(/[^0-9.]/g,''));return t+(isNaN(v)?0:v);},0)||0;
  const renewalTotal = lifecycle.filter(l=>l.icon==='renewal'||l.icon==='warranty').reduce((t,l)=>{const v=parseFloat((l.val||'0').replace(/[^0-9.]/g,''));return t+(isNaN(v)?0:v);},0)||0;

  // Assign lifecycle items to quarters
  const q = [[],[],[],[]];
  lifecycle.forEach((l,i) => { q[Math.min(i,3)].push(l); });
  opps.slice(0,2).forEach((o,i) => { q[i].push({title:o.title, val:o.value, icon:'opp', sub:o.statusLabel}); });

  const itemColor = icon => icon==='eol'?{bg:'#fee2e2',text:'#991B1B'}:icon==='warranty'?{bg:'#dbeafe',text:'#1E40AF'}:icon==='renewal'?{bg:'#fffbeb',text:'#92400E'}:icon==='opp'?{bg:'#dcfce7',text:'#166534'}:{bg:'#f3f4f6',text:'#374151'};

  return `<style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-sizing:border-box;margin:0;padding:0;}</style>
<div style="font-family:Inter,system-ui,sans-serif;max-width:680px;margin:0 auto;padding:32px;color:#0B0E14;">
<div style="font-size:10px;letter-spacing:.1em;color:#9CA3AF;text-transform:uppercase;margin-bottom:5px;">Technology Roadmap · 12-Month Plan · Confidential</div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:14px;border-bottom:2.5px solid #2E74DC;margin-bottom:18px;">
  <div><div style="font-size:24px;font-weight:700;color:#0B0E14;letter-spacing:-.02em;">${c.name}</div><div style="font-size:12px;color:#4B5563;margin-top:4px;">${c.type} · ${c.mrr} MRR · ${date} – ${date.replace('2026','2027')} · ${c.am}</div></div>
  <div style="text-align:right;flex-shrink:0;margin-left:20px;"><div style="font-size:12px;color:#9CA3AF;">Health</div><div style="font-size:28px;font-weight:700;color:${hc};line-height:1.1;">${c.health}</div></div>
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">12-Month Technology Timeline</div>
<div style="border:.5px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:18px;">
  <div style="display:grid;grid-template-columns:120px repeat(4,1fr);background:#2E74DC;">
    <div style="padding:8px 10px;font-size:10px;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.15);"></div>
    ${qtr.map((q,i)=>`<div style="padding:8px 10px;font-size:10px;color:#fff;font-weight:600;border-left:.5px solid rgba(255,255,255,0.2);">${q}<br><span style="font-size:9px;opacity:.7;">${qtrSub[i]}</span></div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:120px repeat(4,1fr);border-top:.5px solid #E5E7EB;">
    <div style="padding:10px;font-size:11px;font-weight:600;color:#2E74DC;border-right:.5px solid #E5E7EB;">EOL &amp; Refresh</div>
    ${q.map(items=>`<div style="padding:8px;border-right:.5px solid #E5E7EB;min-height:52px;vertical-align:top;">${items.filter(l=>l.icon==='eol').map(l=>{const co=itemColor(l.icon);return `<div style="padding:3px 7px;border-radius:4px;font-size:10px;margin-bottom:3px;line-height:1.3;background:${co.bg};color:${co.text};">${l.title} · ${l.val}</div>`}).join('')}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:120px repeat(4,1fr);border-top:.5px solid #E5E7EB;background:#FAFAF7;">
    <div style="padding:10px;font-size:11px;font-weight:600;color:#2E74DC;border-right:.5px solid #E5E7EB;">Renewals</div>
    ${q.map(items=>`<div style="padding:8px;border-right:.5px solid #E5E7EB;min-height:52px;">${items.filter(l=>l.icon==='renewal'||l.icon==='warranty').map(l=>{const co=itemColor(l.icon);return `<div style="padding:3px 7px;border-radius:4px;font-size:10px;margin-bottom:3px;line-height:1.3;background:${co.bg};color:${co.text};">${l.title} · ${l.val}</div>`}).join('')}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:120px repeat(4,1fr);border-top:.5px solid #E5E7EB;">
    <div style="padding:10px;font-size:11px;font-weight:600;color:#2E74DC;border-right:.5px solid #E5E7EB;">Opportunities</div>
    ${q.map(items=>`<div style="padding:8px;border-right:.5px solid #E5E7EB;min-height:52px;">${items.filter(l=>l.icon==='opp').map(l=>{const co=itemColor('opp');return `<div style="padding:3px 7px;border-radius:4px;font-size:10px;margin-bottom:3px;line-height:1.3;background:${co.bg};color:${co.text};">${l.title} · ${l.val}</div>`}).join('')}</div>`).join('')}
  </div>
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Investment Summary</div>
<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:18px;">
  <thead><tr style="border-bottom:.5px solid #E5E7EB;"><th style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;text-align:left;padding:6px 0;font-weight:500;">Item</th><th style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;text-align:right;padding:6px 0;font-weight:500;">Value</th><th style="font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9CA3AF;text-align:right;padding:6px 0;font-weight:500;">Quarter</th></tr></thead>
  <tbody>
    ${opps.map((o,i)=>`<tr style="border-bottom:.5px solid #F0EFE8;"><td style="padding:7px 0;color:#0B0E14;">${o.title}</td><td style="padding:7px 0;text-align:right;font-weight:600;color:#2E74DC;">${o.value}</td><td style="padding:7px 0;text-align:right;font-size:11px;color:#9CA3AF;">Q${i+3} 2026</td></tr>`).join('')}
    ${lifecycle.slice(0,2).map((l,i)=>`<tr style="border-bottom:.5px solid #F0EFE8;"><td style="padding:7px 0;color:#0B0E14;">${l.title}</td><td style="padding:7px 0;text-align:right;font-weight:600;color:#2E74DC;">${l.val}</td><td style="padding:7px 0;text-align:right;font-size:11px;color:#9CA3AF;">${l.sub}</td></tr>`).join('')}
    <tr><td style="padding:8px 0;font-weight:700;color:#0B0E14;">Total 12-month investment</td><td style="padding:8px 0;text-align:right;font-size:16px;font-weight:700;color:#2E74DC;" colspan="2">$${(oppsTotal+renewalTotal).toLocaleString()}</td></tr>
  </tbody>
</table>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
  <div>
    <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#166534;font-weight:600;margin-bottom:8px;">Current Strengths</div>
    ${(ai.current_state?.strengths||[]).map(s=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:.5px solid #F0EFE8;font-size:12px;"><div style="width:6px;height:6px;border-radius:50%;background:#16a34a;flex-shrink:0;margin-top:4px;"></div>${s}</div>`).join('')}
  </div>
  <div>
    <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#92400E;font-weight:600;margin-bottom:8px;">Gaps to Address</div>
    ${(ai.current_state?.gaps||[]).map(g=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:.5px solid #F0EFE8;font-size:12px;"><div style="width:6px;height:6px;border-radius:50%;background:#d97706;flex-shrink:0;margin-top:4px;"></div>${g}</div>`).join('')}
  </div>
</div>
<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#2E74DC;font-weight:600;margin-bottom:10px;">Strategic Priorities</div>
<div style="margin-bottom:20px;">
  ${(ai.strategic_priorities||[]).map((p,i)=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:.5px solid #F0EFE8;align-items:flex-start;"><div style="width:20px;height:20px;border-radius:50%;background:#2E74DC;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;margin-top:1px;">${i+1}</div><div style="font-size:12px;color:#0B0E14;line-height:1.5;">${p}</div></div>`).join('')}
</div>
<div style="font-size:11px;color:#6B7280;padding:10px 12px;background:#F5F5F2;border-radius:6px;margin-bottom:18px;font-style:italic;">${ai.investment_notes}</div>
<div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:.5px solid #E5E7EB;">
  <span style="font-size:11px;font-weight:700;color:#2E74DC;letter-spacing:.06em;">Salesbuildr</span>
  <span style="font-size:10px;color:#9CA3AF;">Technology Roadmap · ${c.name} · ${date} · Confidential</span>
</div>
</div>`;
}
