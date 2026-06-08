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
const oppTotal       = document.getElementById('opp-total');
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
const fbFreeform     = document.getElementById('fb-freeform');
const ratingBtns     = document.querySelectorAll('.rating-btn');
const ratingLabel    = document.getElementById('rating-label');
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
let selectedRating   = null;
let memoryOpen       = false;
let activeFilter     = 'all';
let currentModalTabs = null;

const ratingLabels = { 1: 'Not useful', 2: 'Somewhat useful', 3: "Very useful — I'd use this" };

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
    suggestTitle: 'Schedule strategic review — 5 signals require discussion',
    suggest: 'Lead with the device refresh timeline — it has the longest planning horizon and highest revenue potential. Then address labour over-utilisation to reset scope expectations. The user count and backup topics reinforce why a scope review is overdue. Close with the security assessment as a risk-based conversation.',
    confidence: 92
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
    suggestTitle: 'Schedule server review — infrastructure and backup risk are both active',
    suggest: 'Open with the server warranty conversation — it carries the most risk and the highest revenue opportunity. The backup failure rate reinforces the DR narrative and should be the second agenda item. Use the user and device audit finding to demonstrate proactive management.',
    confidence: 87
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
    suggestTitle: 'Relationship & planning conversation — strong health, one upcoming milestone',
    suggest: 'This is a relationship maintenance and growth conversation. Lead with appreciation for the strong health metrics, then move to compliance audit preparation. Use the positive momentum to open a technology roadmap discussion — this client is well positioned to invest.',
    confidence: 88
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
  }
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
  chipHealth.className   = `cust-chip health-chip ${healthClass(c.health)}`;

  memoryMeta.innerHTML = c.memory.meta;
  memoryPreview.innerHTML = c.memory.items.map(i =>
    `<span class="mem-item ${i.status}">${i.status === 'done' ? '&#10003;' : i.status === 'warn' ? '&#9651;' : '&#10005;'} ${i.label}</span>`
  ).join('');

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

  oppTotal.textContent     = c.oppTotal;
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
    memoryExpanded.innerHTML = c.memory.items.map(i => `
      <div class="memory-row">
        <div class="mem-status ${i.status}">${i.status === 'done' ? '&#10003;' : i.status === 'warn' ? '&#9651;' : '&#10005;'}</div>
        <div class="mem-title">${i.label}</div>
        <div class="mem-date">${i.date}</div>
      </div>`).join('');
    memoryExpanded.classList.add('open');
  } else {
    memoryExpanded.classList.remove('open');
  }
}
memoryBar.addEventListener('click', toggleMemory);

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

ratingBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.dataset.val, 10);
    ratingBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    ratingLabel.textContent = ratingLabels[selectedRating] || '';
  });
});

function getChecked(id) {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
}

async function submitFeedback() {
  const actions  = getChecked('fb-actions');
  const sources  = getChecked('fb-sources');
  const freeform = fbFreeform.value.trim();
  const name     = document.getElementById('fb-name').value.trim();
  const company  = document.getElementById('fb-company').value.trim();

  if (!actions.length && !sources.length && !freeform && !selectedRating) {
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
      body: JSON.stringify({ name, company, actions, sources, freeform,
        rating: selectedRating ? `${selectedRating}/3 — ${ratingLabels[selectedRating]}` : null,
        viewedCustomer: activeView, submittedAt: new Date().toISOString() })
    });
    const data = await res.json();
    if (data.ok) {
      fbStatus.textContent = 'Feedback sent — thank you!';
      fbStatus.className   = 'fb-status ok';
      fbFreeform.value = '';
      document.querySelectorAll('.fb-check input').forEach(cb => cb.checked = false);
      ratingBtns.forEach(b => b.classList.remove('selected'));
      selectedRating = null;
      ratingLabel.textContent = '';
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
