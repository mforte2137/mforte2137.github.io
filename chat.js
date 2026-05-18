/* =============================================
   SALESBUILDR SUPPORT TOOL
   chat.js
============================================= */

// ─── API PROXY ────────────────────────────────
// Calls go to the Netlify function which holds the key server-side.
// No API key needed in the frontend code.

// ─── DEFAULT INSTRUCTIONS ────────────────────
const DEFAULT_INSTRUCTIONS = `You are a support assistant for Salesbuildr, a B2B sales platform for MSPs and IT resellers.

PRODUCT CONTEXT:
Salesbuildr helps managed service providers and IT resellers create quotes, manage opportunities, connect to distributors, and give customers a self-service storefront. The main modules are: Opportunities, Quotes, Products, Storefront, Whitespace, Post-Sale, Companies, Contacts, Distributors, Integrations, and Admin.

Documentation is at https://help.salesbuildr.com/

RULES FOR ALL RESPONSES:
- Never use double dashes (--) anywhere in your output. This is a clear sign of AI writing.
- Write in a natural, direct, human tone. Avoid AI-sounding phrases and corporate filler.
- Never use customer names or end-customer data unless absolutely necessary.
- When referring to the customer in tickets, they should be able to refer to themselves as "We".
- Check the documentation at help.salesbuildr.com if a customer asks something that is clearly explained there, and reference the relevant article.

TICKET FORMATTING:
- Bug titles follow the pattern: [Area]: [Short description]
  Example: "Opportunity: UDF value not persisted on opportunity creation - requires second save"
- Add a blank line after every element (description, steps to reproduce, expected behaviour, impact, recording link).
- Avoid dense blocks of text. Keep it scannable.
- Do not include customer names or end-customer data.

DOCUMENTATION GAPS:
- When a support case required explaining platform behaviour not clearly documented, flag the gap.
- Always check the relevant help article at help.salesbuildr.com before suggesting updates.
- Format gap reports as:
  Article title + URL
  Where: exact location within the article
  What to write: full copy-ready insertion text, matching the article's tone and heading style.`;

// ─── STATE ────────────────────────────────────
let instructions = localStorage.getItem('sb_instructions') || DEFAULT_INSTRUCTIONS;

// ─── HISTORY ──────────────────────────────────
const HISTORY_KEY = 'sb_history';
const HISTORY_MAX = 10;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function saveToHistory(type, label, text) {
  const history = loadHistory();
  history.unshift({
    id:    Date.now(),
    type,
    label,
    text,
    time:  new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  });
  if (history.length > HISTORY_MAX) history.splice(HISTORY_MAX);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const history = loadHistory();
  const list    = document.getElementById('historyList');
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">No history yet. Outputs will appear here.</div>';
    return;
  }
  list.innerHTML = history.map(item => `
    <div class="history-item" data-id="${item.id}">
      <div class="history-item-meta">
        <span class="history-item-type">${item.type}</span>
        <span class="history-item-time">${item.time}</span>
      </div>
      <div class="history-item-preview">${item.label}</div>
    </div>
  `).join('');

  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      const id   = parseInt(el.dataset.id);
      const item = loadHistory().find(h => h.id === id);
      if (!item) return;
      openHistoryDetail(item);
    });
  });
}

// ─── TABS ─────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ─── TICKET TYPE TOGGLE ───────────────────────
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('ticketType').value = btn.dataset.type;
  });
});

// ─── CLEAR BUTTONS ────────────────────────────
document.getElementById('replyClearBtn').addEventListener('click', () => {
  document.getElementById('replyConversation').value = '';
  document.getElementById('replyContext').value = '';
  document.getElementById('replyTone').value = 'standard';
  document.getElementById('replyOutput').classList.add('hidden');
  document.getElementById('replyDocGap').classList.add('hidden');
});

document.getElementById('ticketClearBtn').addEventListener('click', () => {
  document.getElementById('ticketArea').value = '';
  document.getElementById('ticketShortDesc').value = '';
  document.getElementById('ticketDetails').value = '';
  document.getElementById('ticketAlsoReply').checked = false;
  document.getElementById('ticketOutput').classList.add('hidden');
  document.getElementById('ticketReplyOutput').classList.add('hidden');
  // Reset toggle to Bug
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.toggle-btn[data-type="bug"]').classList.add('active');
  document.getElementById('ticketType').value = 'bug';
});

document.getElementById('docsClearBtn').addEventListener('click', () => {
  document.getElementById('docsSearchQuery').value = '';
  document.getElementById('docsConversation').value = '';
  document.getElementById('docsArticleUrl').value = '';
  document.getElementById('docsSearchOutput').classList.add('hidden');
  document.getElementById('docsOutput').classList.add('hidden');
});

// ─── HISTORY DRAWER ───────────────────────────
const historyDrawer  = document.getElementById('historyDrawer');
const historyOverlay = document.getElementById('historyOverlay');

function openHistoryDrawer() {
  renderHistory();
  historyDrawer.classList.remove('hidden');
  historyOverlay.classList.remove('hidden');
}

function closeHistoryDrawer() {
  historyDrawer.classList.add('hidden');
  historyOverlay.classList.add('hidden');
}

document.getElementById('historyBtn').addEventListener('click', openHistoryDrawer);
document.getElementById('historyClose').addEventListener('click', closeHistoryDrawer);
document.getElementById('historyOverlay').addEventListener('click', closeHistoryDrawer);

document.getElementById('historyClearAll').addEventListener('click', () => {
  if (confirm('Clear all history?')) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

// ─── HISTORY DETAIL DRAWER ────────────────────
const historyDetailDrawer  = document.getElementById('historyDetailDrawer');
const historyDetailOverlay = document.getElementById('historyDetailOverlay');

function openHistoryDetail(item) {
  document.getElementById('historyDetailTitle').textContent = item.type + ' — ' + item.time;
  document.getElementById('historyDetailText').textContent  = item.text;
  historyDetailDrawer.classList.remove('hidden');
  historyDetailOverlay.classList.remove('hidden');
}

function closeHistoryDetail() {
  historyDetailDrawer.classList.add('hidden');
  historyDetailOverlay.classList.add('hidden');
}

document.getElementById('historyDetailClose').addEventListener('click', closeHistoryDetail);
document.getElementById('historyDetailOverlay').addEventListener('click', closeHistoryDetail);

document.getElementById('historyDetailCopy').addEventListener('click', () => {
  const text = document.getElementById('historyDetailText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('historyDetailCopy');
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
});

// ─── INSTRUCTIONS DRAWER ─────────────────────
const drawer          = document.getElementById('instructionsDrawer');
const drawerOverlay   = document.getElementById('drawerOverlay');
const drawerClose     = document.getElementById('drawerClose');
const settingsBtn     = document.getElementById('settingsBtn');
const instructionsTxt = document.getElementById('instructionsText');
const instructionsSave  = document.getElementById('instructionsSave');
const instructionsReset = document.getElementById('instructionsReset');

function openDrawer() {
  instructionsTxt.value = instructions;
  drawer.classList.remove('hidden');
  drawerOverlay.classList.remove('hidden');
}

function closeDrawer() {
  drawer.classList.add('hidden');
  drawerOverlay.classList.add('hidden');
}

settingsBtn.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

instructionsSave.addEventListener('click', () => {
  instructions = instructionsTxt.value;
  localStorage.setItem('sb_instructions', instructions);
  closeDrawer();
});

instructionsReset.addEventListener('click', () => {
  if (confirm('Reset instructions to default?')) {
    instructions = DEFAULT_INSTRUCTIONS;
    localStorage.setItem('sb_instructions', instructions);
    instructionsTxt.value = instructions;
  }
});

// ─── COPY BUTTONS ─────────────────────────────
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    navigator.clipboard.writeText(target.innerText).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});

// ─── API CALL ─────────────────────────────────
async function callClaude(userPrompt) {
  const response = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system: instructions,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ─── LOADING STATE ────────────────────────────
function setLoading(btn, loading) {
  const textEl   = btn.querySelector('.btn-text');
  const loaderEl = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  textEl.classList.toggle('hidden', loading);
  loaderEl.classList.toggle('hidden', !loading);
}

// ─── REPLY TAB ────────────────────────────────
document.getElementById('replyBtn').addEventListener('click', async () => {
  const conversation = document.getElementById('replyConversation').value.trim();
  const context      = document.getElementById('replyContext').value.trim();
  const tone         = document.getElementById('replyTone').value;
  const btn          = document.getElementById('replyBtn');

  if (!conversation) { alert('Please paste a conversation first.'); return; }

  const toneMap = {
    brief:    'Keep the reply concise — 2 to 3 short paragraphs maximum.',
    standard: 'Write a clear, complete reply at a natural length.',
    detailed: 'Write a thorough, detailed reply covering all aspects of the issue.'
  };

  const prompt = `A customer has sent the following conversation. Draft a reply I can send to them.

CONVERSATION:
${conversation}
${context ? `\nEXTRA CONTEXT:\n${context}` : ''}

TONE: ${toneMap[tone]}

Also, if this conversation reveals a gap in the Salesbuildr documentation (something the docs don't clearly explain), include a DOCUMENTATION GAP section at the end using exactly this format:

DOCUMENTATION GAP DETECTED
Article: [title and URL]
Where: [exact location in the article]
What to write: [full copy-ready insertion text]

If there is no documentation gap, do not include that section at all.`;

  setLoading(btn, true);

  try {
    const result = await callClaude(prompt);

    const gapMarker = 'DOCUMENTATION GAP DETECTED';
    const gapIndex  = result.indexOf(gapMarker);
    let replyText = result;
    let gapText   = '';

    if (gapIndex !== -1) {
      replyText = result.slice(0, gapIndex).trim();
      gapText   = result.slice(gapIndex + gapMarker.length).trim();
    }

    const outputBlock = document.getElementById('replyOutput');
    const outputText  = document.getElementById('replyOutputText');
    const docGapBlock = document.getElementById('replyDocGap');
    const docGapText  = document.getElementById('replyDocGapText');

    outputText.innerText = replyText;
    outputBlock.classList.remove('hidden');

    if (gapText) {
      docGapText.innerText = gapText;
      docGapBlock.classList.remove('hidden');
    } else {
      docGapBlock.classList.add('hidden');
    }

    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Reply', conversation.slice(0, 80) + (conversation.length > 80 ? '...' : ''), replyText);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── TICKET TAB ───────────────────────────────
document.getElementById('ticketBtn').addEventListener('click', async () => {
  const type       = document.getElementById('ticketType').value;
  const area       = document.getElementById('ticketArea').value;
  const shortDesc  = document.getElementById('ticketShortDesc').value.trim();
  const details    = document.getElementById('ticketDetails').value.trim();
  const alsoReply  = document.getElementById('ticketAlsoReply').checked;
  const btn        = document.getElementById('ticketBtn');

  if (!area)      { alert('Please select an area.'); return; }
  if (!shortDesc) { alert('Please enter a short description.'); return; }
  if (!details)   { alert('Please provide details or paste a conversation.'); return; }

  const typeLabel = type === 'bug' ? 'Bug' : 'Feature Request';

  const prompt = `Draft a Jira ${typeLabel} ticket based on the following.

Area: ${area}
Short description: ${shortDesc}
Details / conversation:
${details}

FORMAT THE TICKET EXACTLY AS FOLLOWS:

Title: ${area}: ${shortDesc}

Type: ${typeLabel}

Description:
[2-3 sentence overview of the issue or request, written from the customer's perspective. The customer should be able to refer to themselves as "We".]

${type === 'bug' ? `Steps to Reproduce:
[Numbered steps]

Expected Behaviour:
[What should happen]

Actual Behaviour:
[What actually happens]

Impact:
[Business or workflow impact]` : `Use Case:
[Why this is needed, from the customer's perspective]

Proposed Solution:
[What the customer is asking for]

Expected Benefit:
[What would improve for the customer]`}

Leave a blank line after every section. Do not include customer names or end-customer data.
${alsoReply ? '\nAfter the ticket, add a section clearly separated by the marker CUSTOMER_REPLY_START, then write a reply I can send to the customer about this issue or request.' : ''}`;

  setLoading(btn, true);

  try {
    const result = await callClaude(prompt);

    const ticketOutput     = document.getElementById('ticketOutput');
    const ticketOutputText = document.getElementById('ticketOutputText');
    const replyOutput      = document.getElementById('ticketReplyOutput');
    const replyOutputText  = document.getElementById('ticketReplyOutputText');

    const replyMarker = 'CUSTOMER_REPLY_START';
    const replyIndex  = result.indexOf(replyMarker);

    let ticketText = result;
    let replyText  = '';

    if (replyIndex !== -1) {
      ticketText = result.slice(0, replyIndex).trim();
      replyText  = result.slice(replyIndex + replyMarker.length).trim();
    }

    ticketOutputText.innerText = ticketText;
    ticketOutput.classList.remove('hidden');

    if (alsoReply && replyText) {
      replyOutputText.innerText = replyText;
      replyOutput.classList.remove('hidden');
    } else {
      replyOutput.classList.add('hidden');
    }

    ticketOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Ticket (' + typeLabel + ')', area + ': ' + shortDesc, ticketText);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── DOCS SEARCH ──────────────────────────────
document.getElementById('docsSearchBtn').addEventListener('click', async () => {
  const query = document.getElementById('docsSearchQuery').value.trim();
  const btn   = document.getElementById('docsSearchBtn');

  if (!query) { alert('Please enter a topic or question to search.'); return; }

  const prompt = `A support agent wants to know whether Salesbuildr's documentation covers a specific topic.

QUERY: "${query}"

Please check https://help.salesbuildr.com/ and tell me:
1. Whether documentation exists on this topic
2. The title and URL of any relevant articles
3. A brief summary of what each article covers
4. Whether there are any obvious gaps or things not covered

Be direct and specific. If you find relevant articles, list them clearly with their URLs. If nothing exists on this topic, say so plainly.`;

  setLoading(btn, true);

  try {
    const result = await callClaude(prompt);

    const outputBlock = document.getElementById('docsSearchOutput');
    const outputText  = document.getElementById('docsSearchOutputText');

    outputText.innerText = result;
    outputBlock.classList.remove('hidden');
    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Doc Search', query, result);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── DOCS GAP DETECTION ───────────────────────
document.getElementById('docsBtn').addEventListener('click', async () => {
  const conversation = document.getElementById('docsConversation').value.trim();
  const articleUrl   = document.getElementById('docsArticleUrl').value.trim();
  const btn          = document.getElementById('docsBtn');

  if (!conversation) { alert('Please paste a support explanation first.'); return; }

  const prompt = `A support agent had to explain platform behaviour to a customer that was not clearly covered in the Salesbuildr documentation.

EXPLANATION / CASE:
${conversation}

${articleUrl ? `The suspected help article is: ${articleUrl}` : 'Check https://help.salesbuildr.com/ to find the most relevant article.'}

Identify the documentation gap and provide a gap report using EXACTLY this format:

Article: [title and full URL]
Where: [exact location — e.g. "after the X section, before the Y subsection"]
What to write: [full copy-ready insertion text, formatted consistently with the article — same heading levels, tone, and structure]

If the gap spans multiple articles, address each one separately.
Do not suggest restructuring existing content unless strictly necessary. Prefer clean insertions.`;

  setLoading(btn, true);

  try {
    const result = await callClaude(prompt);

    const docsOutput     = document.getElementById('docsOutput');
    const docsOutputText = document.getElementById('docsOutputText');

    docsOutputText.innerText = result;
    docsOutput.classList.remove('hidden');
    docsOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Doc Gap', conversation.slice(0, 80) + (conversation.length > 80 ? '...' : ''), result);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});
