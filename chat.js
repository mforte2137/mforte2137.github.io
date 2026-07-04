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
  document.getElementById('ticketKbBlock').classList.add('hidden');
  document.getElementById('ticketKbText').innerText = '';
  // Reset toggle to Bug
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.toggle-btn[data-type="bug"]').classList.add('active');
  document.getElementById('ticketType').value = 'bug';
});

document.getElementById('docsClearBtn').addEventListener('click', () => {
  document.getElementById('docsSearchQuery').value = '';
  document.getElementById('docsSearchOutput').classList.add('hidden');
  document.getElementById('docsSearchGap').classList.add('hidden');
  document.getElementById('docsArticleTitle').value = '';
  document.getElementById('docsContentNotes').value = '';
  document.getElementById('docsScreenshots').value = '';
  document.getElementById('docsRelatedArticles').value = '';
  document.getElementById('docsExistingArticle').value = '';
  document.getElementById('docsCollection').selectedIndex = 0;
  document.getElementById('docsTicketOutput').classList.add('hidden');
  // Reset type toggle to New
  document.querySelectorAll('[data-doctype]').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-doctype="new"]').classList.add('active');
  document.getElementById('docsArticleType').value = 'new';
  document.getElementById('docsExistingArticleGroup').classList.add('hidden');
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
async function callClaude(userPrompt, options = {}) {
  const payload = {
    // Sonnet for web search (Haiku doesn't support the tool), Haiku for everything else
    model: options.webSearch ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
    max_tokens: 1500,
    system: instructions,
    messages: [{ role: 'user', content: userPrompt }]
  };

  if (options.webSearch) {
    payload.use_web_search = true;
  }

  const response = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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

  setLoading(btn, true);

  try {
    // ── Step 1: Extract the core question from the conversation ───────────
    const extractPrompt = `Read this customer support conversation and extract the core question or issue in 10 words or less. Return only the question, nothing else.

CONVERSATION:
${conversation}`;

    const coreQuestion = await callClaude(extractPrompt);

    // ── Step 2: Search Featurebase KB for relevant articles ───────────────
    let kbContext = '';
    try {
      const kbText = await searchFeaturebase(coreQuestion);
      const gapIdx = kbText.indexOf('THE GAP');
      kbContext = gapIdx !== -1 ? kbText.slice(0, gapIdx).trim() : kbText.trim();
    } catch (_) {
      // KB search failed silently — reply still drafts without it
    }

    // ── Step 3: Draft reply grounded in KB results ────────────────────────
    const hasKbResults = kbContext && !kbContext.toLowerCase().includes('no articles') && !kbContext.toLowerCase().includes('no published');

    const prompt = `A customer has sent the following conversation. Draft a reply I can send to them.

CONVERSATION:
${conversation}
${context ? `\nEXTRA CONTEXT:\n${context}` : ''}

TONE: ${toneMap[tone]}

${hasKbResults
  ? `KNOWLEDGE BASE RESULTS — use these as your primary source of truth for any product details:
${kbContext}

If a relevant article was found, reference it naturally in your reply (e.g. "You can find full details in our [article title] article here: [url]"). Do not invent product details beyond what the KB results and conversation contain.`
  : `No matching KB article was found for this query. Draft the best reply you can from the conversation context, but be careful not to invent specific product details you are not certain about.`
}

At the end of your response, include one of these two sections:

If a relevant KB article was found and referenced:
KB ARTICLE REFERENCED
[Article title and URL]

If no relevant article exists in the KB:
DOCUMENTATION GAP DETECTED
[A plain-English description of what is missing — what question the docs don't answer]

Always include exactly one of these two sections.`;

    const result = await callClaude(prompt);

    // ── Step 4: Parse reply and KB/gap section ────────────────────────────
    const refMarker = 'KB ARTICLE REFERENCED';
    const gapMarker = 'DOCUMENTATION GAP DETECTED';

    let replyText = result;
    let gapText   = '';
    let refText   = '';

    const refIndex = result.indexOf(refMarker);
    const gapIndex = result.indexOf(gapMarker);

    if (refIndex !== -1) {
      replyText = result.slice(0, refIndex).trim();
      refText   = result.slice(refIndex + refMarker.length).trim();
    } else if (gapIndex !== -1) {
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
      // No article found — show amber gap callout
      docGapText.innerText = gapText;
      docGapBlock.querySelector('.doc-gap-header span').textContent = 'Documentation Gap Detected';
      docGapBlock.classList.remove('kb-found');
      docGapBlock.classList.remove('hidden');
    } else if (refText) {
      // Article found — show green confirmation
      docGapText.innerText = refText;
      docGapBlock.querySelector('.doc-gap-header span').textContent = 'KB Article Referenced';
      docGapBlock.classList.add('kb-found');
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

  setLoading(btn, true);

  try {
    // ── Step 1: Search KB to check if this is documented behaviour ────────
    let kbNote = '';
    try {
      const kbText   = await searchFeaturebase(shortDesc);
      const gapIdx   = kbText.indexOf('THE GAP');
      const kbResult = gapIdx !== -1 ? kbText.slice(0, gapIdx).trim() : kbText.trim();
      const noArticle = kbResult.toLowerCase().includes('no articles') ||
                        kbResult.toLowerCase().includes('no published') ||
                        kbResult.toLowerCase().includes('does not exist') ||
                        kbResult.toLowerCase().includes('none found');
      const cleanResult = kbResult.split(/\n---|\n## Documentation Gap/i)[0].trim();
      if (!noArticle) kbNote = cleanResult;
    } catch (_) {
      // KB check failed silently — ticket still drafts without it
    }

    // ── Step 2: Draft the ticket, informed by KB result ───────────────────
    const prompt = `Draft a Jira ${typeLabel} ticket based on the following.

Area: ${area}
Short description: ${shortDesc}
Details / conversation:
${details}

${kbNote ? `KNOWLEDGE BASE CONTEXT — an article may already cover some of this behaviour:
${kbNote}
If this article suggests the reported behaviour is actually documented and expected, note that clearly in the Description so the team can assess before investigating.
` : ''}
FORMAT THE TICKET EXACTLY AS FOLLOWS:

Title: ${area}: ${shortDesc}

Type: ${typeLabel}

Description:
[2-3 sentence overview of the issue or request, written from the customer's perspective. The customer should be able to refer to themselves as "We". If relevant KB articles were found, note them here so the team can check whether this is documented behaviour before investigating.]

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

    // Show KB note as green callout if an article was found
    const ticketKbBlock = document.getElementById('ticketKbBlock');
    const ticketKbText  = document.getElementById('ticketKbText');
    if (kbNote && ticketKbBlock) {
      ticketKbText.innerText = kbNote;
      ticketKbBlock.classList.remove('hidden');
    } else if (ticketKbBlock) {
      ticketKbBlock.classList.add('hidden');
    }

    ticketOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Ticket (' + typeLabel + ')', area + ': ' + shortDesc, ticketText);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── FEATUREBASE SEARCH ───────────────────────
async function searchFeaturebase(query) {
  // Step 1: fetch article list from Featurebase
  const fbRes = await fetch('/.netlify/functions/featurebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!fbRes.ok) {
    const err = await fbRes.json().catch(() => ({}));
    throw new Error(err.error || `Featurebase error ${fbRes.status}`);
  }

  const { articles } = await fbRes.json();

  if (!articles || !articles.length) {
    return 'No articles found in the Salesbuildr knowledge base.';
  }

  // Step 2: ask Claude to match query against the article list
  const articleList = articles
    .map((a, i) => {
      const desc = a.description ? ` — ${a.description}` : '';
      return `${i + 1}. ${a.title}${desc}\n   ${a.url}`;
    })
    .join('\n');

  const prompt = `Search the Salesbuildr knowledge base for: "${query}"

ARTICLES (${articles.length} total):
${articleList}

Match the query against titles AND descriptions. Reply with:
1. Relevant articles found (title + URL) — or "None found" if nothing matches
2. One sentence on what each covers
3. Whether anything in the query is NOT covered

If there is a gap, end with exactly:
THE GAP
[plain-English description of what is missing]

Only use URLs from the list. Never construct URLs.`;

  return await callClaude(prompt);
}

// ─── DOCS SEARCH ──────────────────────────────
document.getElementById('docsSearchBtn').addEventListener('click', async () => {
  const query = document.getElementById('docsSearchQuery').value.trim();
  const btn   = document.getElementById('docsSearchBtn');

  if (!query) { alert('Please enter a topic or question to search.'); return; }

  setLoading(btn, true);

  // Reset downstream panels
  document.getElementById('docsSearchGap').classList.add('hidden');
  document.getElementById('articleOutput').classList.add('hidden');
  document.getElementById('articleRendered').innerHTML = '';
  document.getElementById('writeArticleContext').value = '';

  try {
    const result = await searchFeaturebase(query);

    const outputBlock = document.getElementById('docsSearchOutput');
    const outputText  = document.getElementById('docsSearchOutputText');
    const gapBlock    = document.getElementById('docsSearchGap');
    const gapText     = document.getElementById('docsSearchGapText');
    const writePanel  = document.getElementById('writeArticlePanel');

    const gapMarker = 'THE GAP';
    const gapIndex  = result.indexOf(gapMarker);
    let searchText  = result;
    let gapContent  = '';

    if (gapIndex !== -1) {
      searchText = result.slice(0, gapIndex).trim();
      gapContent = result.slice(gapIndex + gapMarker.length).trim();
    }

    outputText.innerText = searchText;
    outputBlock.classList.remove('hidden');

    if (gapContent) {
      gapText.innerText = gapContent;
      gapBlock.classList.remove('hidden');
    }

    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Doc Search', query, searchText + (gapContent ? '\n\nTHE GAP\n' + gapContent : ''));

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── DOCS TYPE TOGGLE ─────────────────────────
document.querySelectorAll('[data-doctype]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-doctype]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.dataset.doctype;
    document.getElementById('docsArticleType').value = type;
    const existingGroup = document.getElementById('docsExistingArticleGroup');
    existingGroup.classList.toggle('hidden', type === 'new');
  });
});

// ─── BUILD JIRA TICKET ────────────────────────
document.getElementById('docsTicketBtn').addEventListener('click', async () => {
  const articleTitle    = document.getElementById('docsArticleTitle').value.trim();
  const type            = document.getElementById('docsArticleType').value;
  const collection      = document.getElementById('docsCollection').value;
  const notes           = document.getElementById('docsContentNotes').value.trim();
  const screenshots     = document.getElementById('docsScreenshots').value.trim();
  const relatedArticles = document.getElementById('docsRelatedArticles').value.trim();
  const existingArticle = document.getElementById('docsExistingArticle').value.trim();
  const searchContext   = document.getElementById('docsSearchOutputText').innerText.trim();
  const btn             = document.getElementById('docsTicketBtn');

  if (!articleTitle) { alert('Please enter an article title.'); return; }
  if (!notes)        { alert('Please add some notes for the content field.'); return; }

  const typeLabel = type === 'new' ? 'New article'
    : type === 'update' ? `Update existing${existingArticle ? ` — ${existingArticle}` : ''}`
    : 'Not sure — agent, check and decide';

  setLoading(btn, true);

  try {
    // Ask Claude to polish the notes into proper article content
    const contentPrompt = `You are preparing the CONTENT field for a Jira [customer-docs] ticket that an AI agent (Skynet) will use to write a Salesbuildr help-center article.

ARTICLE TITLE: ${articleTitle}
${searchContext ? `\nKB SEARCH CONTEXT (what currently exists or is missing):\n${searchContext}` : ''}

AGENT NOTES FROM SUPPORT TEAM:
${notes}

Write polished, structured article content that Skynet can use directly. Rules:
- Use clear headings, numbered steps for procedures, bullet points for options
- Bold key UI labels and menu paths
- Where you are unsure of specific UI details, write [confirm with dev] as a placeholder
- Do not use double dashes (--)
- Keep the tone clear, direct and practical
- Do not add a title line — just the body content
- Output the content only, no preamble`;

    const polishedContent = await callClaude(contentPrompt);

    // Build the full Jira ticket
    const ticket = `TITLE
[customer-docs] ${articleTitle}

ASSIGNEE
Skynet

WHAT
Help-center article. Documentation only — no code changes.

NEW OR UPDATE?
${typeLabel}

COLLECTION (HELP-CENTER SECTION)
${collection}

ARTICLE TITLE
${articleTitle}

CONTENT
${polishedContent}

Verify the facts against how the product actually works and correct the text if something is wrong.
${screenshots ? `\nSCREENSHOTS\n${screenshots}` : '\nSCREENSHOTS\nNone provided — agent to capture as needed.'}

RELATED ARTICLES
${relatedArticles || 'Only if they exist, otherwise skip.'}`;

    const outputBlock = document.getElementById('docsTicketOutput');
    const outputText  = document.getElementById('docsTicketOutputText');
    outputText.innerText = ticket;
    outputBlock.classList.remove('hidden');
    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Docs Ticket', articleTitle, ticket);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── KB PANEL ─────────────────────────────────
// Stores last search articles for copy buttons
let kbLastArticles = [];

async function runKbAsk() {
  const query = document.getElementById('kbAskInput').value.trim();
  if (!query) return;

  const btn        = document.getElementById('kbAskBtn');
  const btnText    = btn.querySelector('.kb-ask-btn-text');
  const btnLoader  = btn.querySelector('.kb-ask-btn-loader');
  const answerBlock   = document.getElementById('kbAnswerBlock');
  const answerText    = document.getElementById('kbAnswerText');
  const articlesBlock = document.getElementById('kbArticlesBlock');
  const articlesList  = document.getElementById('kbArticlesList');

  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  answerBlock.classList.add('hidden');
  articlesBlock.classList.add('hidden');

  try {
    // Step 1: search KB for matching articles
    const kbText    = await searchFeaturebase(query);
    const gapIdx    = kbText.indexOf('THE GAP');
    const kbClean   = gapIdx !== -1 ? kbText.slice(0, gapIdx).trim() : kbText.trim();
    const noResults = kbClean.toLowerCase().includes('no articles') ||
                      kbClean.toLowerCase().includes('no published') ||
                      kbClean.toLowerCase().includes('does not exist') ||
                      kbClean.toLowerCase().includes('none found');

    // Step 2: ask Claude to give a direct answer grounded in KB results
    const answerPrompt = `You are answering a support question on behalf of Salesbuildr.

QUESTION: "${query}"

${!noResults ? `KNOWLEDGE BASE CONTEXT — use this as your only source of truth:
${kbClean}

Answer the question directly and concisely based only on the KB context above. 2-3 sentences maximum. If the KB doesn't contain enough to fully answer, say so briefly.` : `No matching article was found in the Salesbuildr knowledge base for this query. Say so clearly in one sentence.`}

Do not invent product details. Do not use double dashes.`;

    const answer = await callClaude(answerPrompt);
    answerText.innerText = answer;
    answerBlock.classList.remove('hidden');

    // Step 3: extract article links from KB response and render them
    const urlRegex = /https?:\/\/[^\s\)\"]+/g;
    const titleUrlPairs = [];
    const lines = kbClean.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const urls = line.match(urlRegex);
      if (urls) {
        // Try to get title from previous or same line
        let title = '';
        const boldMatch = line.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          title = boldMatch[1];
        } else if (i > 0) {
          const prevBold = lines[i-1].match(/\*\*([^*]+)\*\*/);
          if (prevBold) title = prevBold[1];
        }
        for (const url of urls) {
          if (url.includes('featurebase') || url.includes('salesbuildr')) {
            if (!title) {
              // Derive title from URL slug
              const slug = url.split('/').pop() || '';
              title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/^\d+\s*/, '');
            }
            if (title && !titleUrlPairs.find(p => p.url === url)) {
              titleUrlPairs.push({ title: title.trim(), url });
            }
          }
        }
      }
    }

    kbLastArticles = titleUrlPairs;

    if (titleUrlPairs.length) {
      articlesList.innerHTML = titleUrlPairs.map((item, i) => `
        <div class="kb-article-item">
          <a class="kb-article-link" href="${item.url}" target="_blank" title="${item.title}">${item.title}</a>
          <button class="kb-article-copy" data-index="${i}">Copy</button>
        </div>
      `).join('');

      articlesList.querySelectorAll('.kb-article-copy').forEach(btn => {
        btn.addEventListener('click', () => {
          const article = kbLastArticles[parseInt(btn.dataset.index)];
          if (!article) return;
          navigator.clipboard.writeText(article.url).then(() => {
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
          });
        });
      });

      articlesBlock.classList.remove('hidden');
    }

  } catch (e) {
    document.getElementById('kbAnswerText').innerText = 'Something went wrong: ' + e.message;
    document.getElementById('kbAnswerBlock').classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
  }
}

document.getElementById('kbAskBtn').addEventListener('click', runKbAsk);

document.getElementById('kbAskInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runKbAsk();
});
