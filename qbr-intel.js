/* ── DOM refs ── */
const customerSelect  = document.getElementById('customer-select');
const custAvatar      = document.getElementById('cust-avatar');
const custName        = document.getElementById('cust-name');
const custTag         = document.getElementById('cust-tag');
const custMrr         = document.getElementById('cust-mrr');
const custSince       = document.getElementById('cust-since');
const custHealth      = document.getElementById('cust-health');
const custAm          = document.getElementById('cust-am');
const statDevices     = document.getElementById('stat-devices');
const statEol         = document.getElementById('stat-eol');
const statTickets     = document.getElementById('stat-tickets');
const statTicketSub   = document.getElementById('stat-ticket-sub');
const statUsers       = document.getElementById('stat-users');
const statUserSub     = document.getElementById('stat-user-sub');
const statOpenOpps    = document.getElementById('stat-open-opps');
const statOppVal      = document.getElementById('stat-opp-val');
const signalsList     = document.getElementById('signals-list');
const signalCount     = document.getElementById('signal-count');
const recsList        = document.getElementById('recs-list');
const aiBtn           = document.getElementById('ai-btn');
const aiOutput        = document.getElementById('ai-output');
const aiText          = document.getElementById('ai-text');
const closeAi         = document.getElementById('close-ai');
const suggestTitle    = document.getElementById('suggest-title');
const suggestDesc     = document.getElementById('suggest-desc');
const confBar         = document.getElementById('conf-bar');
const confLabel       = document.getElementById('conf-label');

/* ── Source filter state ── */
const activeSources = new Set(['psa', 'rmm', 'sb']);
const srcKeyMap     = { 'PSA': 'psa', 'RMM': 'rmm', 'Salesbuildr': 'sb' };

/* ── Seeded customer data ── */
const CUSTOMERS = {
  abc: {
    name: 'ABC Manufacturing',
    initials: 'AM',
    tag: 'Fully Managed &middot; Houston, TX',
    mrr: '$3,840',
    since: 'May 2021',
    health: '82',
    healthColor: '#2d6a2d',
    am: 'Sarah Johnson',
    devices: '47', eol: '14 near EOL',
    tickets: '+34%', ticketSub: 'vs prior 90 days',
    users: '+18%', userSub: '8 new users added',
    openOpps: '3', oppVal: '$21,950 pipeline',
    signals: [
      { src: 'RMM',  icon: iconLaptop(),   cls: 'high', title: '14 devices reaching Windows 10 EOL',    sub: 'RMM &middot; 10 months away',        badge: 'badge-high', label: 'HIGH'   },
      { src: 'PSA',  icon: iconClock(),    cls: 'high', title: 'Labor utilization 27% over agreement',  sub: 'PSA &middot; Last 30 days',           badge: 'badge-high', label: 'HIGH'   },
      { src: 'PSA',  icon: iconUsers(),    cls: 'med',  title: 'User count increased 18%',              sub: 'PSA &middot; 8 new users this quarter', badge: 'badge-med',  label: 'MEDIUM' },
      { src: 'Salesbuildr', icon: iconShield(), cls: 'med', title: 'No security review in 14 months',  sub: 'Salesbuildr &middot; Overdue',        badge: 'badge-med',  label: 'MEDIUM' },
      { src: 'Salesbuildr', icon: iconMs(),    cls: 'ok',  title: 'M365 licensing aligned',             sub: 'Salesbuildr &middot; On track',       badge: 'badge-ok',   label: 'OK'     }
    ],
    recs: [
      { title: 'Device refresh planning',       sub: '14 Win10 devices reach EOL in 10 months. Budget conversation needed now.',    val: '$12,000 – $18,000 potential'   },
      { title: 'Managed services scope review', sub: 'Labor consistently over agreement. Review scope and adjust MRR.',              val: '+$450/mo MRR opportunity'       },
      { title: 'Security & compliance assessment', sub: '14 months since last review. Liability risk increasing.',                   val: '$3,500 project potential'       },
      { title: 'User growth — licensing review', sub: '18% user growth may mean licensing gaps or an upsell opportunity.',          val: 'Review M365 seat counts'        }
    ],
    suggestTitle: 'Schedule strategic review — 4 active signals require discussion',
    suggest: 'Lead with the device refresh timeline — it has the longest planning horizon and the highest revenue potential. Then address labour over-utilisation to reset scope expectations before the security review conversation. User growth gives you a natural upsell bridge into the licensing topic.',
    confidence: 92
  },

  river: {
    name: 'River Tech Solutions',
    initials: 'RT',
    tag: 'Co-Managed &middot; Austin, TX',
    mrr: '$2,100',
    since: 'Jan 2022',
    health: '71',
    healthColor: '#7a4f0a',
    am: 'Mark Davies',
    devices: '28', eol: '6 near EOL',
    tickets: '+12%', ticketSub: 'vs prior 90 days',
    users: '+5%', userSub: '2 new users added',
    openOpps: '1', oppVal: '$8,000 pipeline',
    signals: [
      { src: 'RMM',  icon: iconServer(), cls: 'high', title: '3 servers approaching end of warranty',  sub: 'RMM &middot; 6 months away',              badge: 'badge-high', label: 'HIGH'   },
      { src: 'RMM',  icon: iconBackup(), cls: 'med',  title: 'Backup failure rate up 22%',             sub: 'RMM &middot; Last 30 days',               badge: 'badge-med',  label: 'MEDIUM' },
      { src: 'RMM',  icon: iconCert(),   cls: 'med',  title: 'SSL certificates expiring in 45 days',   sub: 'RMM &middot; 2 certificates affected',     badge: 'badge-med',  label: 'MEDIUM' },
      { src: 'Salesbuildr', icon: iconMs(), cls: 'ok', title: 'M365 licensing aligned',                sub: 'Salesbuildr &middot; On track',           badge: 'badge-ok',   label: 'OK'     }
    ],
    recs: [
      { title: 'Server refresh planning',   sub: '3 servers out of warranty in 6 months. Disaster recovery risk conversation needed.',  val: '$8,000 – $15,000 potential' },
      { title: 'Backup & DR review',        sub: 'Failure rate increase warrants a full backup audit and DR plan update.',               val: '$2,500 project potential'   },
      { title: 'SSL certificate renewal',   sub: '45 days is within action window. Confirm renewal process with client.',               val: 'Confirm — low urgency'       }
    ],
    suggestTitle: 'Schedule server review — infrastructure risk is the lead conversation',
    suggest: 'Open with the server warranty conversation — it carries the most risk and the highest revenue opportunity. The backup failure rate reinforces the DR narrative naturally, making it the second agenda item. SSL is a quick win to close on.',
    confidence: 87
  },

  peak: {
    name: 'Peak Financial Group',
    initials: 'PF',
    tag: 'Fully Managed &middot; Denver, CO',
    mrr: '$5,200',
    since: 'Mar 2020',
    health: '91',
    healthColor: '#2d6a2d',
    am: 'Lisa Tran',
    devices: '63', eol: '2 near EOL',
    tickets: '-8%', ticketSub: 'vs prior 90 days',
    users: '+2%', userSub: '1 new user added',
    openOpps: '2', oppVal: '$4,000 pipeline',
    signals: [
      { src: 'Salesbuildr', icon: iconAudit(), cls: 'med', title: 'Annual compliance audit due in 60 days', sub: 'Salesbuildr &middot; Scheduled',    badge: 'badge-med', label: 'MEDIUM' },
      { src: 'RMM', icon: iconShieldOk(), cls: 'ok', title: 'All security patches current',                sub: 'RMM &middot; Last scan today',       badge: 'badge-ok',  label: 'OK'     },
      { src: 'PSA', icon: iconDown(),     cls: 'ok', title: 'Ticket volume down 8%',                      sub: 'PSA &middot; Service delivery strong', badge: 'badge-ok',  label: 'OK'     }
    ],
    recs: [
      { title: 'Annual compliance review',  sub: 'Scheduled audit in 60 days. Prep checklist and confirm scope with client.',     val: '$4,000 audit engagement'     },
      { title: 'Strategic growth planning', sub: 'Strong health score — ideal time to discuss technology roadmap and expansion.', val: 'Upsell & retention focus'    }
    ],
    suggestTitle: 'Relationship & planning conversation — strong health, one upcoming milestone',
    suggest: 'This is a relationship maintenance and growth conversation. Lead with appreciation for the strong health metrics, then move naturally to compliance audit preparation. Use the positive momentum to open a technology roadmap discussion — this client is in a position to invest.',
    confidence: 88
  }
};

/* ── Inline SVG icon helpers ── */
function svg(path) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${path}</svg>`;
}
function iconLaptop()   { return svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M0 21h24"/>'); }
function iconClock()    { return svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'); }
function iconUsers()    { return svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'); }
function iconShield()   { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'); }
function iconShieldOk() { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>'); }
function iconMs()       { return svg('<rect x="2" y="2" width="9" height="9"/><rect x="13" y="2" width="9" height="9"/><rect x="2" y="13" width="9" height="9"/><rect x="13" y="13" width="9" height="9"/>'); }
function iconServer()   { return svg('<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/>'); }
function iconBackup()   { return svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'); }
function iconCert()     { return svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'); }
function iconAudit()    { return svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'); }
function iconDown()     { return svg('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'); }

/* ── Render ── */
function renderCustomer(key) {
  const c = CUSTOMERS[key];

  custAvatar.textContent  = c.initials;
  custName.textContent    = c.name;
  custTag.innerHTML       = c.tag;
  custMrr.textContent     = c.mrr;
  custSince.textContent   = c.since;
  custHealth.textContent  = c.health;
  custHealth.style.color  = c.healthColor;
  custAm.textContent      = c.am;
  statDevices.textContent = c.devices;
  statEol.textContent     = c.eol;
  statTickets.textContent = c.tickets;
  statTicketSub.textContent = c.ticketSub;
  statUsers.textContent   = c.users;
  statUserSub.textContent = c.userSub;
  statOpenOpps.textContent = c.openOpps;
  statOppVal.textContent  = c.oppVal;

  const filtered = c.signals.filter(s => {
    const srcKey = srcKeyMap[s.src];
    return !srcKey || activeSources.has(srcKey);
  });

  signalCount.textContent = `${filtered.length} signal${filtered.length !== 1 ? 's' : ''}`;

  signalsList.innerHTML = filtered.map(s => `
    <div class="signal-row">
      <div class="signal-icon ${s.cls}">${s.icon}</div>
      <div class="signal-body">
        <div class="signal-title">${s.title}</div>
        <div class="signal-sub">${s.sub}</div>
      </div>
      <span class="signal-badge ${s.badge}">${s.label}</span>
    </div>
  `).join('');

  recsList.innerHTML = c.recs.map((r, i) => `
    <div class="rec-row">
      <div class="rec-num">${i + 1}</div>
      <div class="rec-body">
        <div class="rec-title">${r.title}</div>
        <div class="rec-sub">${r.sub}</div>
        <div class="rec-value">${r.val}</div>
      </div>
    </div>
  `).join('');

  suggestTitle.textContent  = c.suggestTitle;
  suggestDesc.textContent   = c.suggest;
  confBar.style.width       = c.confidence + '%';
  confLabel.textContent     = c.confidence + '% confidence';

  aiOutput.style.display = 'none';
}

/* ── AI brief ── */
async function generateAIBrief() {
  const key = customerSelect.value;
  const c   = CUSTOMERS[key];

  aiBtn.innerHTML  = '<span class="spinner"></span> Generating brief...';
  aiBtn.disabled   = true;
  aiOutput.style.display = 'none';

  const signalLines = c.signals
    .map(s => `- ${s.label}: ${s.title} (${s.src})`)
    .join('\n');

  const recLines = c.recs
    .map((r, i) => `${i + 1}. ${r.title} — ${r.sub} [${r.val}]`)
    .join('\n');

  const prompt = `Customer: ${c.name}
MRR: ${c.mrr} | Health score: ${c.health}/100 | Client since: ${c.since} | Account manager: ${c.am}

Change signals:
${signalLines}

Recommended conversations:
${recLines}

Suggested approach: ${c.suggest}

Write my QBR conversation brief.`;

  try {
    const res = await fetch('/api/ai-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: c.name, prompt })
    });

    const data = await res.json();

    if (data.ok) {
      aiText.textContent = data.brief;
    } else {
      aiText.textContent = 'Error generating brief: ' + (data.error || 'Unknown error');
    }
  } catch (e) {
    aiText.textContent = 'Could not reach the AI service. Make sure the Netlify function is deployed and ANTHROPIC_API_KEY is set in your environment variables.';
  }

  aiOutput.style.display = 'block';
  aiBtn.innerHTML  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Generate AI Conversation Brief`;
  aiBtn.disabled   = false;
  aiOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Event listeners ── */
customerSelect.addEventListener('change', e => {
  renderCustomer(e.target.value);
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const src = pill.dataset.src;
    if (activeSources.has(src)) {
      activeSources.delete(src);
      pill.classList.remove('active');
    } else {
      activeSources.add(src);
      pill.classList.add('active');
    }
    renderCustomer(customerSelect.value);
  });
});

aiBtn.addEventListener('click', generateAIBrief);

closeAi.addEventListener('click', () => {
  aiOutput.style.display = 'none';
});

/* ── Init ── */
renderCustomer('abc');
