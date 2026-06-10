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
const recsList       = document.getElementById('recs-list');
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
    memory: {
      meta: 'Last review: Nov 2025 &middot; 3 open items',
      items: [
        { status: 'done', label: 'Replace Server 2016',       date: 'Completed Oct 2025' },
        { status: 'warn', label: 'MFA rollout',               date: 'In progress' },
        { status: 'miss', label: 'Security assessment',       date: 'Not started' }
      ]
    },
    signals: [
      { src: 'RMM',         icon: iconLaptop(), cls: 'high', title: '14 devices reaching Windows 10 EOL',    sub: 'RMM &middot; 10 months away',           modal: 'eol'     },
      { src: 'PSA',         icon: iconLabor(),  cls: 'high', title: 'Labor utilization 27% over agreement',  sub: 'PSA &middot; Last 30 days',             modal: 'labor'   },
      { src: 'PSA',         icon: iconUsers(),  cls: 'med',  title: 'User count increased 18% — 7 unlicensed', sub: 'PSA / M365 &middot; Action needed',   modal: 'users'   },
      { src: 'RMM',         icon: iconBackup(), cls: 'med',  title: 'Backup failure rate increased this month', sub: 'RMM &middot; 14% failure rate',      modal: 'backup_abc' },
      { src: 'Salesbuildr', icon: iconShield(), cls: 'med',  title: 'No security review in 14 months',       sub: 'Salesbuildr &middot; Overdue',          modal: 'secrev'  },
      { src: 'Salesbuildr', icon: iconMs(),     cls: 'ok',   title: 'M365 licensing aligned',                sub: 'Salesbuildr &middot; On track',         modal: 'm365ok'  }
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
    memory: {
      meta: 'Last review: Aug 2025 &middot; 2 open items',
      items: [
        { status: 'done', label: 'Migrate email to M365',    date: 'Completed Sep 2025' },
        { status: 'miss', label: 'Server refresh proposal',  date: 'Not started' }
      ]
    },
    signals: [
      { src: 'RMM', icon: iconServer(),  cls: 'high', title: '3 servers approaching end of warranty',  sub: 'RMM &middot; 6 months away',            modal: 'servers'     },
      { src: 'RMM', icon: iconBackup(),  cls: 'high', title: 'Backup failure rate up 22%',             sub: 'RMM &middot; Last 30 days',             modal: 'backup_river'},
      { src: 'PSA', icon: iconUsers(),   cls: 'med',  title: 'User & device audit recommended',        sub: 'PSA / RMM &middot; 2 dormant found',    modal: 'users_river' },
      { src: 'RMM', icon: iconCert(),    cls: 'med',  title: 'SSL certificates expiring in 45 days',   sub: 'RMM &middot; 2 certificates affected',  modal: 'ssl'         },
      { src: 'Salesbuildr', icon: iconMs(), cls: 'ok', title: 'M365 licensing aligned',                sub: 'Salesbuildr &middot; On track',         modal: 'm365ok'      }
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
    memory: {
      meta: 'Last review: Apr 2026 &middot; 1 open item',
      items: [
        { status: 'done', label: 'Annual compliance audit',   date: 'Completed Mar 2026' },
        { status: 'done', label: 'M365 E3 upgrade',           date: 'Completed Feb 2026' },
        { status: 'warn', label: 'Technology roadmap review', date: 'Scheduled Jun 2026' }
      ]
    },
    signals: [
      { src: 'Salesbuildr', icon: iconAudit(),    cls: 'med', title: 'Annual compliance audit due in 60 days', sub: 'Salesbuildr &middot; Scheduled',      modal: 'audit'   },
      { src: 'RMM',         icon: iconShieldOk(), cls: 'ok',  title: 'All security patches current',           sub: 'RMM &middot; Last scan today',        modal: 'patches' },
      { src: 'PSA',         icon: iconDown(),     cls: 'ok',  title: 'Ticket volume down 8%',                  sub: 'PSA &middot; Service delivery strong', modal: 'tickets' }
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
    footer: [{ label: 'Create audit engagement opportunity', primary: true }]
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
      ${item.modal ? '<span class="signal-arrow">&#8250;</span>' : ''}
    </div>
  `).join('');

  document.querySelectorAll('.lifecycle-row[data-modal]').forEach(row => {
    row.addEventListener('click', () => openModal(row.dataset.modal));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
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

  alignmentList.innerHTML = a.items.map(item => `
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
      <span class="signal-arrow">&#8250;</span>
    </div>
  `).join('');

  document.querySelectorAll('.align-row[data-modal]').forEach(row => {
    row.addEventListener('click', () => openModal(row.dataset.modal));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
  });

  const rec = a.rec;
  alignmentRec.className = `alignment-rec${rec.cls === 'good' ? ' all-good' : ''}`;
  alignmentRec.innerHTML = `
    <div class="alignment-rec-label">RECOMMENDED CONVERSATION</div>
    <div class="alignment-rec-title">${rec.title}</div>
    <div class="alignment-rec-val">${rec.val}</div>`;
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
      <span class="signal-arrow">&#8250;</span>
    </div>
  `).join('');

  document.querySelectorAll('.signal-row').forEach(row => {
    row.addEventListener('click', () => openModal(row.dataset.modal));
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(row.dataset.modal); });
  });

  recsList.innerHTML = c.recs.map((r, i) => `
    <div class="rec-row">
      <div class="rec-num">${i + 1}</div>
      <div>
        <div class="rec-title">${r.title}</div>
        <div class="rec-sub">${r.sub}</div>
        <div class="rec-value">${r.val}</div>
      </div>
    </div>
  `).join('');

  oppTotal_val             = c.oppTotal;
  renderAlignment(c);
  renderOppBar(c);
  renderLifecycle(c);
  renderPriority(c);
  renderDataConfidence(c);
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
function renderPortfolio(filter) {
  let rows = PORTFOLIO;
  if (filter === 'urgent')  rows = rows.filter(r => r.priority === 'urgent');
  if (filter === 'overdue') rows = rows.filter(r => r.overdue);

  const urgentCount = PORTFOLIO.filter(r => r.priority === 'urgent').length;
  document.getElementById('port-sub').textContent =
    `${PORTFOLIO.length} accounts \u00b7 ${urgentCount} need attention this week`;

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
        switchView('briefing');
        customerSelect.value = key;
        renderCustomer(key);
      }
    };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
}

/* ══════════════════════════════════════════
   VIEW SWITCHING
   ══════════════════════════════════════════ */
function switchView(view) {
  const vBriefing  = document.getElementById('view-briefing');
  const vPortfolio = document.getElementById('view-portfolio');
  const tBriefing  = document.getElementById('nav-briefing');
  const tPortfolio = document.getElementById('nav-portfolio');

  if (view === 'briefing') {
    vBriefing.style.display  = '';
    vPortfolio.style.display = 'none';
    tBriefing.classList.add('active');
    tPortfolio.classList.remove('active');
  } else {
    vBriefing.style.display  = 'none';
    vPortfolio.style.display = '';
    tBriefing.classList.remove('active');
    tPortfolio.classList.add('active');
    renderPortfolio(activeFilter);
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

/* Show/hide Other text input when Other radio selected */
document.querySelectorAll('input[name="investigate"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const otherInput = document.getElementById('fb-investigate-other');
    otherInput.classList.toggle('visible', radio.value === 'Other' && radio.checked);
  });
});

function getChecked(id) {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
}

async function submitFeedback() {
  const actions       = getChecked('fb-actions');
  const sources       = getChecked('fb-sources');
  const name          = document.getElementById('fb-name').value.trim();
  const company       = document.getElementById('fb-company').value.trim();
  const timecost      = document.getElementById('fb-timecost').value.trim();
  const problem       = document.getElementById('fb-problem').value.trim();
  const autoassemble  = document.getElementById('fb-autoassemble').value.trim();
  const onething      = document.getElementById('fb-onething').value.trim();

  // Investigate radio
  const investigateRadio = document.querySelector('input[name="investigate"]:checked');
  let investigate = investigateRadio ? investigateRadio.value : null;
  if (investigate === 'Other') {
    const otherVal = document.getElementById('fb-investigate-other').value.trim();
    if (otherVal) investigate = `Other: ${otherVal}`;
  }

  if (!actions.length && !sources.length && !investigate && !timecost && !problem && !autoassemble && !onething) {
    fbStatus.textContent = 'Please fill in at least one field.';
    fbStatus.className   = 'fb-status err';
    return;
  }
  fbSubmit.disabled    = true;
  fbSubmit.textContent = 'Sending...';
  fbStatus.textContent = '';
  fbStatus.className   = 'fb-status';

  const activeView = document.getElementById('view-portfolio').style.display === 'none'
    ? `Briefing — ${customerSelect.options[customerSelect.selectedIndex].text}`
    : 'Portfolio view';

  try {
    const res  = await fetch('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, actions, sources,
        investigate, timecost, problem, autoassemble, onething,
        viewedCustomer: activeView, submittedAt: new Date().toISOString() })
    });
    const data = await res.json();
    if (data.ok) {
      fbStatus.textContent = 'Feedback sent — thank you!';
      fbStatus.className   = 'fb-status ok';
      document.querySelectorAll('.fb-check input').forEach(cb => cb.checked = false);
      document.querySelectorAll('input[name="investigate"]').forEach(r => r.checked = false);
      document.getElementById('fb-investigate-other').classList.remove('visible');
      document.getElementById('fb-timecost').value     = '';
      document.getElementById('fb-problem').value      = '';
      document.getElementById('fb-autoassemble').value = '';
      document.getElementById('fb-onething').value     = '';
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
  memoryOpen = false;
  memoryChevron.classList.remove('open');
  memoryExpanded.classList.remove('open');
  renderCustomer(e.target.value);
});
aiBtn.addEventListener('click', generateAIBrief);
execBtn.addEventListener('click', generateExecSummary);
closeAi.addEventListener('click',     () => { aiOutput.style.display   = 'none'; });
closeExec.addEventListener('click',   () => { execOutput.style.display = 'none'; });
portAiBtn.addEventListener('click',   generatePortfolioAI);
closePortAi.addEventListener('click', () => { portAiOutput.style.display = 'none'; });

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
renderCustomer('abc');
openFeedback();
