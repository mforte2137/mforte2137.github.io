/* ============================================================
   Customer Check-In — app logic
   Single-tenant, localStorage-backed. AI drafting via /api/customer-checkin.
   ============================================================ */

const LS_CONTACTS = 'cci_contacts';
const LS_GROUPS = 'cci_groups';
const LS_SEEDED = 'cci_seeded_v1';
const LS_CAMPAIGN = 'cci_current_campaign';
const LS_NOTES = 'cci_company_notes';
const LS_REPORTS = 'cci_company_reports';

/* ---------- Seed data (from companies-2026-07-30.csv) ---------- */
const SEED_COMPANIES = [
  ["24HourTek","United States","ConnectWise"],
  ["Adaptive Technical","Canada","Autotask"],
  ["Agile IT","United States","Autotask"],
  ["Bonded Networks","United States","ConnectWise"],
  ["CentriServe IT","United States","Halo"],
  ["cloudIT","United States","ConnectWise"],
  ["CMIT Solutions","United States","Autotask"],
  ["CrucialLogics","Canada","Autotask"],
  ["Fast Computers","Canada","ConnectWise"],
  ["GC Brieau","Canada","Autotask"],
  ["ID Tech Solutions Inc","United States","ConnectWise"],
  ["Imagine IT","United States","ConnectWise"],
  ["IMS Solutions Group","United States","Autotask"],
  ["Integrid LLC","United States","Autotask"],
  ["Kalleo Technologies LLC","United States","ConnectWise"],
  ["Litefoot Technology","United States","Autotask"],
  ["Logivision Technologies","United States","Autotask"],
  ["MICROAGE QUEBEC","Canada","Autotask"],
  ["NetFusion Designs","Canada","ConnectWise"],
  ["Northrock Technologies","Canada","Halo"],
  ["NPI","United States","ConnectWise"],
  ["Onit","Canada","ConnectWise"],
  ["PGH Networks, LLC","United States","ConnectWise"],
  ["Portsmouth Computer Group, Llc","United States","ConnectWise"],
  ["Primary ICT Support","United Kingdom","Halo"],
  ["Silloway Networks","United States","Autotask"],
  ["StarPOS","Canada","Autotask"],
  ["SupercityOS","Canada","Halo"],
  ["TAG Solutions, LLC","United States","Autotask"],
  ["Tech-Keys","United States","ConnectWise"],
  ["Technology Lab","United States","Halo"],
  ["Twinstate Technologies","United States","Halo"],
  ["Two River Technology Group","United States","ConnectWise"],
  ["Whitehat Virtual Technologies","United States","Autotask"],
  ["Xceptional Networks","US","Autotask"],
  ["XeroWaste","Canada",""]
];

function uid() { return 'c_' + Math.random().toString(36).slice(2, 10); }

function seedIfNeeded() {
  if (localStorage.getItem(LS_SEEDED)) return;
  const contacts = SEED_COMPANIES.map(([company, country, psa]) => ({
    id: uid(),
    company, country, psa,
    firstName: '', lastName: '', email: '',
    firstName2: '', lastName2: '', email2: '',
    groupId: '',
    status: 'active',
    replyStatus: 'none',
    replySubject: '',
    replyOther: ''
  }));
  localStorage.setItem(LS_CONTACTS, JSON.stringify(contacts));

  const today = new Date('2026-07-30');
  const groups = [1, 2, 3, 4].map(id => {
    const d = new Date(today);
    d.setDate(d.getDate() + (id - 1) * 7);
    return {
      id,
      name: 'Group ' + id,
      nextSendDate: isoDate(d),
      lastSentDate: null,
      history: [],
      draft: null
    };
  });
  localStorage.setItem(LS_GROUPS, JSON.stringify(groups));
  localStorage.setItem(LS_SEEDED, '1');
}

function isoDate(d) { return d.toISOString().slice(0, 10); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getContacts() { return JSON.parse(localStorage.getItem(LS_CONTACTS) || '[]'); }
function setContacts(c) { localStorage.setItem(LS_CONTACTS, JSON.stringify(c)); }
function getGroups() { return JSON.parse(localStorage.getItem(LS_GROUPS) || '[]'); }
function setGroups(g) { localStorage.setItem(LS_GROUPS, JSON.stringify(g)); }

function activeContactsInGroup(groupId) {
  return getContacts().filter(c => c.status === 'active' && String(c.groupId) === String(groupId));
}

/* ---------- Shared monthly campaign ---------- */
function getCurrentCampaign() {
  const raw = localStorage.getItem(LS_CAMPAIGN);
  return raw ? JSON.parse(raw) : null;
}
function setCurrentCampaign(campaign) { localStorage.setItem(LS_CAMPAIGN, JSON.stringify(campaign)); }
function clearCurrentCampaign() { localStorage.removeItem(LS_CAMPAIGN); }

function getMostRecentSentCampaign() {
  let latest = null;
  getGroups().forEach(g => {
    (g.history || []).forEach(entry => {
      if (!latest || new Date(entry.date) > new Date(latest.date)) latest = entry;
    });
  });
  return latest;
}

/* ============================================================
   Tabs
   ============================================================ */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'dashboard') renderDashboard();
      if (btn.dataset.tab === 'campaign') renderCampaignTab();
      if (btn.dataset.tab === 'contacts') renderContactsTab();
      if (btn.dataset.tab === 'notes') renderNotesTab();
    });
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function getUpcomingGroup() {
  const groups = getGroups().filter(g => activeContactsInGroup(g.id).length > 0);
  if (!groups.length) return null;
  groups.sort((a, b) => new Date(a.nextSendDate) - new Date(b.nextSendDate));
  return groups[0];
}

function renderDashboard() {
  const groups = getGroups();
  const upcoming = getUpcomingGroup();
  const noGroupsMsg = document.getElementById('noGroupsMsg');
  const card = document.getElementById('upcomingGroupCard');

  if (!upcoming) {
    noGroupsMsg.hidden = false;
    card.hidden = true;
    document.getElementById('otherGroupsList').innerHTML = '';
    return;
  }
  noGroupsMsg.hidden = true;
  card.hidden = false;

  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(upcoming.nextSendDate + 'T00:00:00');
  const diffDays = Math.round((due - today) / 86400000);
  const dueLabel = document.getElementById('upGroupDueLabel');
  if (diffDays <= 0) { dueLabel.textContent = 'DUE NOW'; }
  else if (diffDays === 1) { dueLabel.textContent = 'DUE TOMORROW'; }
  else { dueLabel.textContent = 'DUE IN ' + diffDays + ' DAYS'; }

  document.getElementById('upGroupName').textContent = upcoming.name;
  const dateInput = document.getElementById('upGroupDateInput');
  dateInput.value = upcoming.nextSendDate;
  dateInput.onchange = () => updateGroupSendDate(upcoming.id, dateInput.value);

  document.getElementById('noCampaignBanner').hidden = !!getCurrentCampaign();
  document.getElementById('draftReadyBanner').hidden = !getCurrentCampaign();

  const tbody = document.querySelector('#upcomingContactsTable tbody');
  tbody.innerHTML = '';
  const contacts = activeContactsInGroup(upcoming.id);
  contacts.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(c.firstName + ' ' + c.lastName) || '<span class="muted-text">—</span>'}</td>
      <td>${escapeHtml(c.company)}</td>
      <td>${escapeHtml(c.email) || '<span class="muted-text">—</span>'}</td>
      <td>${replyBadge(c)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('btnCopyBcc').onclick = () => {
    const emails = contacts.map(c => c.email).filter(Boolean).join(', ');
    if (!emails) { showToast('No emails saved for this group yet.'); return; }
    navigator.clipboard.writeText(emails).then(() => showToast('BCC list copied (' + contacts.filter(c=>c.email).length + ' emails).'));
  };

  document.getElementById('btnViewLast').onclick = () => openLastEmailModal(upcoming.id);

  // Other groups
  const otherList = document.getElementById('otherGroupsList');
  otherList.innerHTML = '';
  groups.filter(g => g.id !== upcoming.id).sort((a,b) => new Date(a.nextSendDate) - new Date(b.nextSendDate)).forEach(g => {
    const count = activeContactsInGroup(g.id).length;
    const div = document.createElement('div');
    div.className = 'other-group-card';
    div.innerHTML = `
      <div class="g-name">${escapeHtml(g.name)}</div>
      <div class="date-edit-row">
        <span class="g-date">Next send:</span>
        <input type="date" class="date-input" value="${g.nextSendDate}" data-group-date="${g.id}" />
      </div>
      <div class="g-count">${count} contact${count === 1 ? '' : 's'}</div>
    `;
    otherList.appendChild(div);
  });
  otherList.querySelectorAll('[data-group-date]').forEach(input => {
    input.addEventListener('change', () => updateGroupSendDate(Number(input.dataset.groupDate), input.value));
  });
}

function updateGroupSendDate(groupId, newDate) {
  if (!newDate) return;
  const groups = getGroups();
  const idx = groups.findIndex(g => g.id === groupId);
  if (idx === -1) return;
  groups[idx].nextSendDate = newDate;
  setGroups(groups);
  renderDashboard();
  showToast(groups[idx].name + ' send date set to ' + formatDate(newDate) + '.');
}

function replyBadge(c) {
  const map = {
    none: ['badge-neutral', 'No reply'],
    replied_no_action: ['badge-good', 'Replied — no action'],
    replied_meeting: ['badge-info', 'Wants meeting' + (c.replySubject ? ': ' + escapeHtml(c.replySubject) : '')],
    other: ['badge-warn', 'Other']
  };
  const [cls, label] = map[c.replyStatus] || map.none;
  return `<span class="badge ${cls}">${label}</span>`;
}

function openLastEmailModal(groupId) {
  const groups = getGroups();
  const g = groups.find(x => x.id === groupId);
  const modal = document.getElementById('lastEmailModal');
  document.getElementById('modalGroupTitle').textContent = 'Last Email — ' + g.name;
  const last = g.history[g.history.length - 1];
  document.getElementById('modalEmptyState').hidden = !!last;
  document.getElementById('modalContent').hidden = !last;
  if (last) {
    document.getElementById('modalDate').textContent = 'Sent ' + formatDate(last.date);
    document.getElementById('modalSubject').textContent = last.subject || '(no subject)';
    document.getElementById('modalBody').textContent = last.body;
  }
  modal.hidden = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalCloseBtn').addEventListener('click', () => {
    document.getElementById('lastEmailModal').hidden = true;
  });
});

/* ============================================================
   BUILD CAMPAIGN TAB
   ============================================================ */
function renderCampaignTab() {
  document.getElementById('campaignMonthLabel').textContent =
    new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  // Shared campaign card
  const campaign = getCurrentCampaign();
  document.getElementById('noCampaignYet').hidden = !!campaign;
  document.getElementById('draftSubject').value = campaign ? campaign.subject || '' : '';
  document.getElementById('draftBody').value = campaign ? campaign.body || '' : '';
  document.getElementById('introNotes').value = campaign ? campaign.introNotes || '' : '';
  document.getElementById('tipNotes').value = campaign ? campaign.tipNotes || '' : '';

  const lastCampaign = getMostRecentSentCampaign();
  const refBox = document.getElementById('lastMonthReference');
  refBox.hidden = !lastCampaign;
  if (lastCampaign) {
    document.getElementById('lastMonthRefContent').textContent =
      formatDate(lastCampaign.date) + ' — "' + (lastCampaign.subject || 'no subject') + '" — ' +
      lastCampaign.body.slice(0, 220) + (lastCampaign.body.length > 220 ? '…' : '');
  }

  // Group select for sending
  const groups = getGroups();
  const select = document.getElementById('campaignGroupSelect');
  const upcoming = getUpcomingGroup();
  select.innerHTML = groups.map(g => {
    const count = activeContactsInGroup(g.id).length;
    return `<option value="${g.id}">${escapeHtml(g.name)} — ${count} contacts — next send ${formatDate(g.nextSendDate)}</option>`;
  }).join('');
  if (upcoming) select.value = upcoming.id;
  loadSendGroupPanel();
  select.onchange = loadSendGroupPanel;
}

function refreshCampaignGroupOptionLabels() {
  const select = document.getElementById('campaignGroupSelect');
  const keep = select.value;
  const groups = getGroups();
  select.innerHTML = groups.map(g => {
    const count = activeContactsInGroup(g.id).length;
    return `<option value="${g.id}">${escapeHtml(g.name)} — ${count} contacts — next send ${formatDate(g.nextSendDate)}</option>`;
  }).join('');
  select.value = keep;
}

function currentCampaignGroup() {
  const id = Number(document.getElementById('campaignGroupSelect').value);
  return getGroups().find(g => g.id === id);
}

function loadSendGroupPanel() {
  const g = currentCampaignGroup();
  if (!g) return;
  const dateInput = document.getElementById('campaignGroupDateInput');
  dateInput.value = g.nextSendDate;
  dateInput.onchange = () => {
    updateGroupSendDate(g.id, dateInput.value);
    refreshCampaignGroupOptionLabels();
  };
  const refBox = document.getElementById('lastEmailReference');
  const last = g.history[g.history.length - 1];
  refBox.hidden = !last;
  if (last) {
    document.getElementById('lastEmailRefContent').textContent =
      formatDate(last.date) + ' — "' + (last.subject || 'no subject') + '" — ' + last.body.slice(0, 220) + (last.body.length > 220 ? '…' : '');
  }
  renderSendRecipients(g.id);
}

function renderSendRecipients(groupId) {
  const contacts = activeContactsInGroup(groupId);
  const list = document.getElementById('sendRecipientsList');
  list.innerHTML = contacts.map(c => `
    <div class="recipient-row">
      <input type="checkbox" data-recipient="${c.id}" ${c.replyStatus === 'none' ? 'checked' : ''} />
      <span class="recipient-name">${escapeHtml(c.firstName + ' ' + c.lastName).trim() || escapeHtml(c.company)}</span>
      <span class="recipient-email">${escapeHtml(c.email) || '— no email —'}</span>
      ${replyBadge(c)}
    </div>
  `).join('');
  list.querySelectorAll('[data-recipient]').forEach(cb => cb.addEventListener('change', updateRecipientCountLabel));
  updateRecipientCountLabel();
}

function getSelectedRecipientIds() {
  return Array.from(document.querySelectorAll('#sendRecipientsList [data-recipient]:checked')).map(cb => cb.dataset.recipient);
}

function updateRecipientCountLabel() {
  const total = document.querySelectorAll('#sendRecipientsList [data-recipient]').length;
  const selected = getSelectedRecipientIds().length;
  document.getElementById('recipientCountLabel').textContent = selected + ' of ' + total + ' selected for this send.';
}

async function handleGenerate() {
  const introNotes = document.getElementById('introNotes').value.trim();
  const tipNotes = document.getElementById('tipNotes').value.trim();
  if (!tipNotes && !introNotes) {
    showToast('Add a quick note about the check-in or tip first.');
    return;
  }
  const last = getMostRecentSentCampaign();
  const statusEl = document.getElementById('generateStatus');
  statusEl.hidden = false;
  statusEl.textContent = 'Generating...';

  try {
    const res = await fetch('/api/customer-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        introNotes,
        tipNotes,
        lastEmailBody: last ? last.body : '',
        lastEmailDate: last ? last.date : ''
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Generation failed.');
    document.getElementById('draftSubject').value = data.subject || '';
    document.getElementById('draftBody').value = data.body || '';
    statusEl.textContent = 'Draft ready — feel free to edit, then save it below.';
    setTimeout(() => { statusEl.hidden = true; }, 3500);
    saveCampaign(false);
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
  }
}

function saveCampaign(silent) {
  const subject = document.getElementById('draftSubject').value.trim();
  const body = document.getElementById('draftBody').value.trim();
  if (!body) { if (!silent) showToast('Nothing to save yet — generate or write an email first.'); return; }
  setCurrentCampaign({
    subject, body,
    introNotes: document.getElementById('introNotes').value,
    tipNotes: document.getElementById('tipNotes').value,
    createdDate: isoDate(new Date())
  });
  document.getElementById('noCampaignYet').hidden = true;
  renderDashboard();
  if (!silent) showToast('This month\'s campaign saved.');
}

function startNewMonthCampaign() {
  if (!confirm('Start a new month\'s campaign? This clears the current subject, body, and notes — last month\'s sent copies stay archived in each group\'s history.')) return;
  clearCurrentCampaign();
  renderCampaignTab();
  renderDashboard();
  showToast('Ready for a new month\'s campaign.');
}

function markGroupSent() {
  const g = currentCampaignGroup();
  const campaign = getCurrentCampaign();
  if (!g) return;
  if (!campaign || !campaign.body) {
    showToast('Write or generate this month\'s campaign first.');
    return;
  }
  const selectedIds = getSelectedRecipientIds();
  if (!selectedIds.length) {
    showToast('No recipients selected for this send.');
    return;
  }
  const skippedCount = document.querySelectorAll('#sendRecipientsList [data-recipient]').length - selectedIds.length;
  const confirmMsg = 'Copy this email and mark ' + g.name + ' as sent to ' + selectedIds.length + ' recipient' + (selectedIds.length === 1 ? '' : 's') +
    (skippedCount ? ' (' + skippedCount + ' skipped, rolling over to next month)' : '') +
    '? The group\'s next send date will move forward one month.';
  if (!confirm(confirmMsg)) return;

  const groups = getGroups();
  const idx = groups.findIndex(x => x.id === g.id);
  const today = isoDate(new Date());
  groups[idx].history.push({ date: today, subject: campaign.subject, body: campaign.body });
  groups[idx].lastSentDate = today;
  const next = new Date(today + 'T00:00:00');
  next.setMonth(next.getMonth() + 1);
  groups[idx].nextSendDate = isoDate(next);
  setGroups(groups);

  const contacts = getContacts();
  selectedIds.forEach(id => {
    const cIdx = contacts.findIndex(c => c.id === id);
    if (cIdx !== -1) contacts[cIdx].lastEmailedDate = today;
  });
  setContacts(contacts);

  navigator.clipboard.writeText(campaign.body).then(() => {
    showToast(g.name + ' marked as sent. Email copied — paste into Gmail.');
  }).catch(() => showToast(g.name + ' marked as sent.'));

  renderCampaignTab();
  renderDashboard();
}

function copyBccForCampaignGroup() {
  const g = currentCampaignGroup();
  if (!g) return;
  const selectedIds = new Set(getSelectedRecipientIds());
  const emails = activeContactsInGroup(g.id)
    .filter(c => selectedIds.has(c.id))
    .map(c => c.email)
    .filter(Boolean);
  if (!emails.length) { showToast('No emails selected for this group yet.'); return; }
  navigator.clipboard.writeText(emails.join(', ')).then(() =>
    showToast('BCC list copied (' + emails.length + ' emails) for ' + g.name + '.')
  );
}

/* ============================================================
   CONTACTS TAB
   ============================================================ */
function renderContactsTab() {
  const search = document.getElementById('contactSearch').value.toLowerCase();
  const filterGroup = document.getElementById('filterGroup').value;
  const showRemoved = document.getElementById('showRemoved').checked;

  let contacts = getContacts();
  if (!showRemoved) contacts = contacts.filter(c => c.status !== 'removed');
  if (filterGroup === 'unassigned') contacts = contacts.filter(c => !c.groupId);
  else if (filterGroup) contacts = contacts.filter(c => String(c.groupId) === filterGroup);
  if (search) {
    contacts = contacts.filter(c =>
      (c.company + ' ' + c.firstName + ' ' + c.lastName).toLowerCase().includes(search)
    );
  }

  const tbody = document.querySelector('#contactsTable tbody');
  tbody.innerHTML = '';
  contacts.forEach(c => {
    const tr = document.createElement('tr');
    if (c.status === 'removed') tr.classList.add('removed-row');
    tr.innerHTML = `
      <td>${escapeHtml(c.company)}</td>
      <td>${escapeHtml(c.country)}</td>
      <td>${escapeHtml(c.psa)}</td>
      <td>${escapeHtml(c.firstName + ' ' + c.lastName).trim() || '<span class="muted-text">— add name —</span>'}</td>
      <td>${escapeHtml(c.email) || '<span class="muted-text">— add email —</span>'}</td>
      <td>${c.groupId ? 'Group ' + c.groupId : '<span class="muted-text">Unassigned</span>'}</td>
      <td><button class="badge badge-clickable ${replyBadgeClass(c)}" data-reply="${c.id}">${replyBadgeLabel(c)}</button></td>
      <td>
        <button class="btn-secondary" data-edit="${c.id}" style="padding:4px 10px;font-size:11px;">Edit</button>
        ${c.status === 'removed'
          ? `<button class="btn-secondary" data-restore="${c.id}" style="padding:4px 10px;font-size:11px;">Restore</button>`
          : `<button class="btn-danger" data-remove="${c.id}">Remove</button>`}
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openContactModal(b.dataset.edit));
  tbody.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => setContactStatus(b.dataset.remove, 'removed'));
  tbody.querySelectorAll('[data-restore]').forEach(b => b.onclick = () => setContactStatus(b.dataset.restore, 'active'));
  tbody.querySelectorAll('[data-reply]').forEach(b => b.onclick = () => openReplyModal(b.dataset.reply));
}

function replyBadgeClass(c) {
  const map = { none: 'badge-neutral', replied_no_action: 'badge-good', replied_meeting: 'badge-info', other: 'badge-warn' };
  return map[c.replyStatus] || 'badge-neutral';
}
function replyBadgeLabel(c) {
  const map = {
    none: 'No reply',
    replied_no_action: 'No action needed',
    replied_meeting: 'Wants meeting',
    other: 'Other'
  };
  return map[c.replyStatus] || 'No reply';
}

function setContactStatus(id, status) {
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return;
  contacts[idx].status = status;
  setContacts(contacts);
  renderContactsTab();
  renderDashboard();
  showToast(status === 'removed' ? 'Contact removed.' : 'Contact restored.');
}

function openContactModal(id) {
  const modal = document.getElementById('contactModal');
  const title = document.getElementById('contactModalTitle');
  if (id) {
    const c = getContacts().find(x => x.id === id);
    title.textContent = 'Edit Contact';
    document.getElementById('cmId').value = c.id;
    document.getElementById('cmCompany').value = c.company;
    document.getElementById('cmCountry').value = c.country;
    document.getElementById('cmPsa').value = c.psa;
    document.getElementById('cmFirstName').value = c.firstName;
    document.getElementById('cmLastName').value = c.lastName;
    document.getElementById('cmEmail').value = c.email;
    document.getElementById('cmGroup').value = c.groupId || '';
    document.getElementById('cmFirstName2').value = c.firstName2 || '';
    document.getElementById('cmLastName2').value = c.lastName2 || '';
    document.getElementById('cmEmail2').value = c.email2 || '';
  } else {
    title.textContent = 'Add Contact';
    ['cmId','cmCompany','cmCountry','cmPsa','cmFirstName','cmLastName','cmEmail','cmFirstName2','cmLastName2','cmEmail2']
      .forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('cmGroup').value = '';
  }
  modal.hidden = false;
}

function saveContactModal() {
  const id = document.getElementById('cmId').value;
  const company = document.getElementById('cmCompany').value.trim();
  if (!company) { showToast('Company name is required.'); return; }

  const record = {
    company,
    country: document.getElementById('cmCountry').value.trim(),
    psa: document.getElementById('cmPsa').value.trim(),
    firstName: document.getElementById('cmFirstName').value.trim(),
    lastName: document.getElementById('cmLastName').value.trim(),
    email: document.getElementById('cmEmail').value.trim(),
    groupId: document.getElementById('cmGroup').value,
    firstName2: document.getElementById('cmFirstName2').value.trim(),
    lastName2: document.getElementById('cmLastName2').value.trim(),
    email2: document.getElementById('cmEmail2').value.trim(),
  };

  const contacts = getContacts();
  if (id) {
    const idx = contacts.findIndex(c => c.id === id);
    contacts[idx] = { ...contacts[idx], ...record };
  } else {
    contacts.push({
      id: uid(),
      status: 'active',
      replyStatus: 'none',
      replySubject: '',
      replyOther: '',
      ...record
    });
  }
  setContacts(contacts);
  document.getElementById('contactModal').hidden = true;
  renderContactsTab();
  renderDashboard();
  showToast('Contact saved.');
}

/* ---------- Reply status modal ---------- */
let selectedReplyStatus = 'none';
function openReplyModal(id) {
  const c = getContacts().find(x => x.id === id);
  document.getElementById('rmContactId').value = id;
  selectedReplyStatus = c.replyStatus || 'none';
  document.getElementById('rmSubject').value = c.replySubject || '';
  document.getElementById('rmOther').value = c.replyOther || '';
  updateReplyPillUI();
  document.getElementById('replyModal').hidden = false;
}

function updateReplyPillUI() {
  document.querySelectorAll('#replyPillGroup .pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.status === selectedReplyStatus);
  });
  document.getElementById('replySubjectWrap').hidden = selectedReplyStatus !== 'replied_meeting';
  document.getElementById('replyOtherWrap').hidden = selectedReplyStatus !== 'other';
  const logWrap = document.getElementById('replyLogNoteWrap');
  const showLogOption = selectedReplyStatus === 'replied_meeting' || selectedReplyStatus === 'other';
  logWrap.hidden = !showLogOption;
  if (showLogOption) document.getElementById('rmLogAsNote').checked = true;
}

function saveReplyModal() {
  const id = document.getElementById('rmContactId').value;
  const contacts = getContacts();
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return;
  contacts[idx].replyStatus = selectedReplyStatus;
  contacts[idx].replySubject = document.getElementById('rmSubject').value.trim();
  contacts[idx].replyOther = document.getElementById('rmOther').value.trim();
  setContacts(contacts);

  if (!document.getElementById('replyLogNoteWrap').hidden && document.getElementById('rmLogAsNote').checked) {
    const c = contacts[idx];
    let body = '';
    if (selectedReplyStatus === 'replied_meeting') {
      body = 'Replied — wants a meeting' + (c.replySubject ? ' about: ' + c.replySubject : '') + '.';
    } else if (selectedReplyStatus === 'other') {
      body = c.replyOther || 'Replied — other.';
    }
    const notes = getNotes();
    notes.push({
      id: uid(),
      company: c.company,
      contactId: c.id,
      date: isoDate(new Date()),
      meetingLink: '',
      followUpDate: '',
      body,
      createdAt: new Date().toISOString()
    });
    setNotes(notes);
  }

  document.getElementById('replyModal').hidden = true;
  renderContactsTab();
  renderDashboard();
  showToast('Reply status updated.');
}

/* ============================================================
   COMPANY NOTES TAB
   ============================================================ */
function getNotes() { return JSON.parse(localStorage.getItem(LS_NOTES) || '[]'); }
function setNotes(n) { localStorage.setItem(LS_NOTES, JSON.stringify(n)); }
function getReports() { return JSON.parse(localStorage.getItem(LS_REPORTS) || '{}'); }
function setReports(r) { localStorage.setItem(LS_REPORTS, JSON.stringify(r)); }

let currentNotesCompany = null;

function getAllCompanyNames() {
  const names = new Set(getContacts().map(c => c.company).filter(Boolean));
  return Array.from(names).sort();
}

function renderNotesTab() {
  document.getElementById('notesCompanySearch').value = '';
  document.getElementById('notesCompanyResults').hidden = true;
  if (currentNotesCompany && getAllCompanyNames().includes(currentNotesCompany)) {
    showNotesCompanyView(currentNotesCompany);
  } else {
    currentNotesCompany = null;
    document.getElementById('notesCompanyView').hidden = true;
  }
}

function searchNotesCompanies(query) {
  const resultsEl = document.getElementById('notesCompanyResults');
  const q = query.trim().toLowerCase();
  if (!q) { resultsEl.hidden = true; resultsEl.innerHTML = ''; return; }

  const contacts = getContacts();
  const matchesByCompany = new Map();
  contacts.forEach(c => {
    const fullName = (c.firstName + ' ' + c.lastName).trim();
    const hay = (c.company + ' ' + fullName + ' ' + (c.firstName2 || '') + ' ' + (c.lastName2 || '')).toLowerCase();
    if (hay.includes(q) && c.company) {
      if (!matchesByCompany.has(c.company)) matchesByCompany.set(c.company, []);
      if (fullName) matchesByCompany.get(c.company).push(fullName);
    }
  });

  const entries = Array.from(matchesByCompany.entries()).slice(0, 8);
  if (!entries.length) {
    resultsEl.innerHTML = '<div class="search-result-row muted-text">No matching company or contact.</div>';
    resultsEl.hidden = false;
    return;
  }
  resultsEl.innerHTML = entries.map(([company, names]) => `
    <div class="search-result-row" data-company="${escapeHtml(company)}">
      <div class="sr-company">${escapeHtml(company)}</div>
      ${names.length ? `<div class="sr-meta">${escapeHtml(names.join(', '))}</div>` : ''}
    </div>
  `).join('');
  resultsEl.hidden = false;
  resultsEl.querySelectorAll('[data-company]').forEach(row => {
    row.addEventListener('click', () => {
      document.getElementById('notesCompanySearch').value = '';
      resultsEl.hidden = true;
      showNotesCompanyView(row.dataset.company);
    });
  });
}

function showNotesCompanyView(company) {
  currentNotesCompany = company;
  document.getElementById('notesCompanyView').hidden = false;
  document.getElementById('notesCompanyName').textContent = company;

  const contactsAtCompany = getContacts().filter(c => c.company === company);
  const meta = contactsAtCompany[0] || {};
  document.getElementById('notesCompanyMeta').textContent =
    [meta.country, meta.psa].filter(Boolean).join(' — ');

  const contactSelect = document.getElementById('noteContact');
  contactSelect.innerHTML = '<option value="">General / no specific contact</option>' +
    contactsAtCompany.map(c => {
      const n1 = (c.firstName + ' ' + c.lastName).trim();
      const n2 = (c.firstName2 + ' ' + c.lastName2).trim();
      let opts = '';
      if (n1) opts += `<option value="${c.id}">${escapeHtml(n1)}</option>`;
      if (n2) opts += `<option value="${c.id}::2">${escapeHtml(n2)} (2nd contact)</option>`;
      return opts;
    }).join('');

  document.getElementById('noteDate').value = isoDate(new Date());
  document.getElementById('noteMeetingLink').value = '';
  document.getElementById('noteFollowUpDate').value = '';
  document.getElementById('noteBody').value = '';

  renderNotesTimeline(company);
  renderReportSection(company);
}

function renderNotesTimeline(company) {
  const notes = getNotes().filter(n => n.company === company).sort((a, b) => new Date(b.date) - new Date(a.date));
  const el = document.getElementById('notesTimeline');
  if (!notes.length) {
    el.innerHTML = '<div class="hint-text">No notes yet for this company.</div>';
    return;
  }
  const contacts = getContacts();
  el.innerHTML = notes.map(n => {
    const contact = contacts.find(c => c.id === n.contactId);
    let contactLabel = '';
    if (contact) {
      contactLabel = n.contactId && n.contactId.includes && n.contactId.includes('::2')
        ? (contact.firstName2 + ' ' + contact.lastName2).trim()
        : (contact.firstName + ' ' + contact.lastName).trim();
    }
    return `
      <div class="note-entry">
        <div class="note-entry-top">
          <div class="note-entry-date">${formatDate(n.date)}${contactLabel ? ' — ' + escapeHtml(contactLabel) : ''}</div>
          <div class="note-entry-tags">
            ${n.followUpDate ? `<span class="badge badge-info">Follow up: ${formatDate(n.followUpDate)}</span>` : ''}
            <button class="btn-danger" data-delete-note="${n.id}">Delete</button>
          </div>
        </div>
        <div class="note-entry-body">${escapeHtml(n.body)}</div>
        ${n.meetingLink ? `<div class="note-entry-link"><a href="${escapeHtml(n.meetingLink)}" target="_blank" rel="noopener">${escapeHtml(n.meetingLink)}</a></div>` : ''}
      </div>
    `;
  }).join('');
  el.querySelectorAll('[data-delete-note]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this note?')) return;
      setNotes(getNotes().filter(n => n.id !== btn.dataset.deleteNote));
      renderNotesTimeline(company);
      renderReportSection(company);
    });
  });
}

function saveNote() {
  if (!currentNotesCompany) return;
  const body = document.getElementById('noteBody').value.trim();
  if (!body) { showToast('Add a note first.'); return; }
  const notes = getNotes();
  notes.push({
    id: uid(),
    company: currentNotesCompany,
    contactId: document.getElementById('noteContact').value || null,
    date: document.getElementById('noteDate').value || isoDate(new Date()),
    meetingLink: document.getElementById('noteMeetingLink').value.trim(),
    followUpDate: document.getElementById('noteFollowUpDate').value || '',
    body,
    createdAt: new Date().toISOString()
  });
  setNotes(notes);

  document.getElementById('noteMeetingLink').value = '';
  document.getElementById('noteFollowUpDate').value = '';
  document.getElementById('noteBody').value = '';

  renderNotesTimeline(currentNotesCompany);
  renderReportSection(currentNotesCompany);
  showToast('Note saved.');
}

function renderReportSection(company) {
  const reports = getReports();
  const report = reports[company];
  const notes = getNotes().filter(n => n.company === company);

  document.getElementById('reportEmpty').hidden = notes.length > 0 || !!report;
  document.getElementById('reportContent').hidden = !report;
  document.getElementById('reportActions').hidden = !report;
  document.getElementById('reportStale').hidden = true;

  if (report) {
    document.getElementById('reportContent').textContent = report.summary;
    document.getElementById('reportContent').hidden = false;
    document.getElementById('reportActions').hidden = false;
    const newCount = notes.length - report.noteCountAtGeneration;
    if (newCount > 0) {
      document.getElementById('reportStale').hidden = false;
      document.getElementById('reportStale').textContent =
        newCount + ' new note' + (newCount === 1 ? '' : 's') + ' since this report — regenerate for the latest.';
    }
  }
}

async function generateReport() {
  if (!currentNotesCompany) return;
  const notes = getNotes().filter(n => n.company === currentNotesCompany).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!notes.length) { showToast('Add at least one note first.'); return; }

  const contacts = getContacts();
  const notesForApi = notes.map(n => {
    const contact = contacts.find(c => c.id === n.contactId);
    let contactLabel = '';
    if (contact) {
      contactLabel = (n.contactId && n.contactId.includes && n.contactId.includes('::2'))
        ? (contact.firstName2 + ' ' + contact.lastName2).trim()
        : (contact.firstName + ' ' + contact.lastName).trim();
    }
    return { date: n.date, contactName: contactLabel, meetingLink: n.meetingLink, followUpDate: n.followUpDate, body: n.body };
  });

  const statusEl = document.getElementById('reportStatus');
  statusEl.hidden = false;
  statusEl.textContent = 'Generating report...';

  try {
    const res = await fetch('/api/customer-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'report',
        companyName: currentNotesCompany,
        notes: notesForApi,
        todayDate: isoDate(new Date())
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Report generation failed.');

    const reports = getReports();
    reports[currentNotesCompany] = {
      summary: data.report || '',
      generatedAt: new Date().toISOString(),
      noteCountAtGeneration: notes.length
    };
    setReports(reports);
    renderReportSection(currentNotesCompany);
    statusEl.hidden = true;
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
  }
}

/* ============================================================
   Utilities
   ============================================================ */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function exportBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    contacts: getContacts(),
    groups: getGroups(),
    campaign: getCurrentCampaign(),
    notes: getNotes(),
    reports: getReports()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = isoDate(new Date());
  a.href = url;
  a.download = 'customer-checkin-backup-' + stamp + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup downloaded.');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (e) {
      showToast('That file is not valid JSON.');
      return;
    }
    if (!Array.isArray(data.contacts) || !Array.isArray(data.groups)) {
      showToast('That file does not look like a Customer Check-In backup.');
      return;
    }
    const confirmMsg = 'Import this backup? This will replace all current contacts and groups in this browser' +
      (data.exportedAt ? ' (backup from ' + formatDate(data.exportedAt.slice(0, 10)) + ')' : '') + '.';
    if (!confirm(confirmMsg)) return;

    setContacts(data.contacts);
    setGroups(data.groups);
    if (data.campaign) setCurrentCampaign(data.campaign); else clearCurrentCampaign();
    setNotes(Array.isArray(data.notes) ? data.notes : []);
    setReports(data.reports && typeof data.reports === 'object' ? data.reports : {});
    localStorage.setItem(LS_SEEDED, '1');

    renderDashboard();
    renderContactsTab();
    if (document.getElementById('tab-campaign').classList.contains('active')) renderCampaignTab();
    if (document.getElementById('tab-notes').classList.contains('active')) renderNotesTab();
    showToast('Backup imported successfully.');
  };
  reader.readAsText(file);
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  seedIfNeeded();
  initTabs();
  renderDashboard();

  document.getElementById('btnGenerate').addEventListener('click', handleGenerate);
  document.getElementById('btnCopyDraft').addEventListener('click', () => {
    const body = document.getElementById('draftBody').value;
    if (!body.trim()) { showToast('Nothing to copy yet.'); return; }
    navigator.clipboard.writeText(body).then(() => showToast('Copied to clipboard.'));
  });
  document.getElementById('btnSaveDraft').addEventListener('click', () => saveCampaign(false));
  document.getElementById('btnNewMonth').addEventListener('click', startNewMonthCampaign);
  document.getElementById('btnMarkSent').addEventListener('click', markGroupSent);
  document.getElementById('btnCopyBccCampaign').addEventListener('click', copyBccForCampaignGroup);
  document.getElementById('btnSelectAllRecipients').addEventListener('click', () => {
    document.querySelectorAll('#sendRecipientsList [data-recipient]').forEach(cb => cb.checked = true);
    updateRecipientCountLabel();
  });
  document.getElementById('btnSelectNoneRecipients').addEventListener('click', () => {
    document.querySelectorAll('#sendRecipientsList [data-recipient]').forEach(cb => cb.checked = false);
    updateRecipientCountLabel();
  });

  document.getElementById('btnAddContact').addEventListener('click', () => openContactModal(null));
  document.getElementById('contactModalCloseBtn').addEventListener('click', () => document.getElementById('contactModal').hidden = true);
  document.getElementById('cmSaveBtn').addEventListener('click', saveContactModal);

  document.getElementById('contactSearch').addEventListener('input', renderContactsTab);
  document.getElementById('filterGroup').addEventListener('change', renderContactsTab);
  document.getElementById('showRemoved').addEventListener('change', renderContactsTab);

  document.getElementById('replyModalCloseBtn').addEventListener('click', () => document.getElementById('replyModal').hidden = true);
  document.getElementById('rmSaveBtn').addEventListener('click', saveReplyModal);
  document.querySelectorAll('#replyPillGroup .pill').forEach(p => {
    p.addEventListener('click', () => { selectedReplyStatus = p.dataset.status; updateReplyPillUI(); });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });
  });

  document.getElementById('btnExportBackup').addEventListener('click', exportBackup);
  document.getElementById('btnImportBackup').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importBackup(file);
    e.target.value = '';
  });

  document.getElementById('notesCompanySearch').addEventListener('input', (e) => searchNotesCompanies(e.target.value));
  document.getElementById('btnChangeCompany').addEventListener('click', () => {
    currentNotesCompany = null;
    document.getElementById('notesCompanyView').hidden = true;
    document.getElementById('notesCompanySearch').focus();
  });
  document.getElementById('btnSaveNote').addEventListener('click', saveNote);
  document.getElementById('btnGenerateReport').addEventListener('click', generateReport);
  document.getElementById('btnCopyReport').addEventListener('click', () => {
    const text = document.getElementById('reportContent').textContent;
    if (!text.trim()) { showToast('Nothing to copy yet.'); return; }
    navigator.clipboard.writeText(text).then(() => showToast('Report copied to clipboard.'));
  });
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('notesSearchWrap');
    if (wrap && !wrap.contains(e.target)) document.getElementById('notesCompanyResults').hidden = true;
  });
}

document.addEventListener('DOMContentLoaded', init);
