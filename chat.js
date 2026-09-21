/* =============================================
   SALESBUILDR SUPPORT TOOL
   chat.js
============================================= */

// ─── API PROXY ────────────────────────────────
// Calls go to the Netlify function which holds the key server-side.
// No API key needed in the frontend code.

// ─── DEFAULT INSTRUCTIONS ────────────────────
const DEFAULT_INSTRUCTIONS = `You are a customer support agent for Salesbuildr, a B2B sales platform for MSPs and IT resellers.

PRODUCT CONTEXT:
Salesbuildr helps managed service providers and IT resellers create quotes, manage opportunities, connect to distributors, and give customers a self-service storefront. The main modules are: Opportunities, Quotes, Products, Storefront, Whitespace, Post-Sale, Companies, Contacts, Distributors, Integrations, and Admin.

Documentation is at https://salesbuildr.featurebase.app/en/help

RULES FOR ALL RESPONSES:
- Never use double dashes (--) anywhere in your output.
- Write in a natural, direct, human tone. No filler phrases, no "great question", no "I hope this helps".
- Answer the question then stop. Do not pad the response.
- Never use customer names or end-customer data unless absolutely necessary.

CUSTOMER-APPROPRIATE RESPONSES:
- You are writing to a customer, not a developer. Keep responses simple and actionable.
- Never direct a customer to internal logs, error consoles, sync diagnostic panels, or any technical area they would not normally visit. These are for the internal team only.
- If you need diagnostic information, ask for it the same way a CS agent would: ask for a screenshot, a URL, or a description of what they see — not raw log data.
- If the issue requires investigation by the technical team, say so clearly and tell the customer what information to send. Do not try to get the customer to self-diagnose.
- A good CS response asks for exactly what is needed to investigate — no more, no less. Model your response on how a knowledgeable colleague would reply, not how a developer would troubleshoot.

WHEN ANSWERING FROM KB ARTICLES:
- Answer using only what the article says. Do not add reasoning or assumptions.
- If the article describes a self-serve flow, tell the customer to follow those steps.
- If the article says instructions are inside the Salesbuildr tool, direct the customer there.
- Do not hedge with phrases like "this may vary" unless the article says that.

TICKET FORMATTING:
- Bug titles follow the pattern: [Area]: [Short description]
- Add a blank line after every element.
- Avoid dense blocks of text. Keep it scannable.
- Do not include customer names or end-customer data.`;

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

// ─── IMAGE UPLOAD ─────────────────────────────
const MAX_IMAGES = 3;
let attachedImages = []; // [{ base64, mediaType, previewUrl }]

function renderImagePreviews() {
  const list = document.getElementById('imagePreviewList');
  list.innerHTML = attachedImages.map((img, i) => `
    <div class="image-preview-item">
      <img src="${img.previewUrl}" alt="Screenshot ${i+1}" />
      <button class="image-preview-remove" data-index="${i}">✕</button>
    </div>
  `).join('');
  list.querySelectorAll('.image-preview-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      attachedImages.splice(parseInt(btn.dataset.index), 1);
      renderImagePreviews();
    });
  });
}

async function addImageFile(file) {
  if (!file.type.startsWith('image/')) return;
  if (attachedImages.length >= MAX_IMAGES) {
    alert(`Maximum ${MAX_IMAGES} images per request.`);
    return;
  }
  const mediaType = file.type; // e.g. 'image/jpeg'
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const previewUrl = URL.createObjectURL(file);
  attachedImages.push({ base64, mediaType, previewUrl });
  renderImagePreviews();
}

// Browse button
document.getElementById('imageBrowseBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('imageFileInput').click();
});

document.getElementById('imageFileInput').addEventListener('change', (e) => {
  Array.from(e.target.files).forEach(addImageFile);
  e.target.value = '';
});

// Drag and drop
const dropZone = document.getElementById('imageDropZone');
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  Array.from(e.dataTransfer.files).forEach(addImageFile);
});

// Paste anywhere on the page
document.addEventListener('paste', (e) => {
  // Only intercept if Reply tab is active
  if (!document.getElementById('tab-reply').classList.contains('active')) return;
  const items = Array.from(e.clipboardData.items || []);
  const imageItems = items.filter(item => item.type.startsWith('image/'));
  imageItems.forEach(item => addImageFile(item.getAsFile()));
});

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
  document.getElementById('replyInternalBot').classList.add('hidden');
  attachedImages = [];
  renderImagePreviews();
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

document.getElementById('translateClearBtn').addEventListener('click', () => {
  document.getElementById('translateInput').value = '';
  document.getElementById('translateOutput').classList.add('hidden');
  document.getElementById('translateOutputText').innerText = '';
  document.getElementById('translateDetected').textContent = '';
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
  // Build message content — text only, or text + images
  let messageContent;
  if (options.images && options.images.length > 0) {
    messageContent = [
      ...options.images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 }
      })),
      { type: 'text', text: userPrompt }
    ];
  } else {
    messageContent = userPrompt;
  }

  const payload = {
    model: options.webSearch ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
    max_tokens: 1500,
    system: instructions,
    messages: [{ role: 'user', content: messageContent }]
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
    brief:    'Be very concise — 2 to 3 short paragraphs maximum. No greetings, no sign-off.',
    standard: 'Be direct and concise. Answer the question clearly. No unnecessary padding, no "great question", no lengthy sign-offs. 3 to 4 short paragraphs maximum.',
    detailed: 'Be thorough — cover all aspects of the issue with full context and steps.'
  };

  setLoading(btn, true);

  // Reset all callouts
  document.getElementById('replyDocGap').classList.add('hidden');
  document.getElementById('replyInternalBot').classList.add('hidden');

  try {
    // ── Step 1: Extract core question (include images if attached) ─────────
    const extractPrompt = `Read this customer support conversation and extract the core question or issue in 10 words or less. Return only the question, nothing else.
${attachedImages.length ? '\nScreenshots are also attached — factor them into the question if they reveal additional context.' : ''}
CONVERSATION:
${conversation}`;
    const coreQuestion = await callClaude(extractPrompt, {
      images: attachedImages.length ? attachedImages : undefined
    });

    // ── Step 1b: If images attached, get a description for the Slack bot ───
    let imageDescription = '';
    if (attachedImages.length > 0) {
      const descPrompt = `Describe what you see in these screenshots in 2-3 sentences. Focus on: what UI/screen is shown, any error messages, relevant settings or values visible. Be specific and factual.`;
      imageDescription = await callClaude(descPrompt, { images: attachedImages });
    }

    // ── Step 2: Search Featurebase KB ─────────────────────────────────────
    let kbContext    = '';
    let kbSource     = 'none';
    let botAnswer    = '';
    let botThreadUrl = '';

    try {
      const kbText = await searchFeaturebase(coreQuestion);
      const gapIdx = kbText.indexOf('THE GAP');
      kbContext = gapIdx !== -1 ? kbText.slice(0, gapIdx).trim() : kbText.trim();
      const noKb = kbContext.toLowerCase().includes('no articles') ||
                   kbContext.toLowerCase().includes('none found') ||
                   kbContext.toLowerCase().includes('no published') ||
                   kbContext.toLowerCase().includes('does not exist');
      if (!noKb && kbContext) kbSource = 'kb';
    } catch (_) { /* silent */ }

    // ── Step 3: If KB found nothing, ask Internal Questions Bot ───────────
    if (kbSource === 'none') {
      try {
        // Build enriched question — include image description if available
        const botQuestion = imageDescription
          ? `${coreQuestion}\n\nScreenshot context: ${imageDescription}`
          : coreQuestion;
        const botRes = await fetch('/.netlify/functions/slack-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: botQuestion })
        });
        if (botRes.ok) {
          const botData = await botRes.json();
          if (botData.answer) {
            botAnswer    = botData.answer;
            botThreadUrl = botData.thread_url || '';
            kbSource     = 'bot';
          }
        }
      } catch (_) { /* silent */ }
    }

    // ── Step 4: Draft reply grounded in best available source ─────────────
    const sourceContext = kbSource === 'kb'
      ? `KNOWLEDGE BASE RESULTS — use as primary source of truth:\n${kbContext}\n\nReference the relevant article naturally in your reply with its URL.`
      : kbSource === 'bot'
      ? `INTERNAL DOCUMENTATION — use as source of truth:\n${botAnswer}\n\nDo not mention that this came from an internal bot. Present the information naturally.`
      : `No matching documentation was found. Draft the best reply you can from the conversation, but do not invent specific product details.`;

    const prompt = `A customer has sent the following conversation. Draft a reply I can send to them.

CONVERSATION:
${conversation}
${context ? `\nEXTRA CONTEXT:\n${context}` : ''}

TONE: ${toneMap[tone]}

${sourceContext}

STYLE RULES:
- Do not use double dashes (--)
- No "Great question!", no "I hope this helps", no "feel free to reach out" — cut all filler
- Answer the question directly, then stop
- You are writing to a customer — keep it simple and human
- NEVER direct a customer to internal logs, error consoles, sync diagnostic panels, or Settings > Tools > Issues. These are internal tools the customer has never seen and should not be asked to navigate.
- If the issue needs investigation, ask for a screenshot and/or a URL. That is all a customer can reasonably provide.
- If the KB article describes internal troubleshooting steps, translate them into what you need FROM the customer, not what the customer should do themselves.${attachedImages.length ? '\n- Screenshots are attached — reference what you see in them where relevant' : ''}`;

    const result = await callClaude(prompt, {
      images: attachedImages.length ? attachedImages : undefined
    });

    // ── Step 5: Render output and appropriate callout ─────────────────────
    const outputBlock = document.getElementById('replyOutput');
    const outputText  = document.getElementById('replyOutputText');
    outputText.innerText = result;
    outputBlock.classList.remove('hidden');

    const docGapBlock = document.getElementById('replyDocGap');
    const docGapText  = document.getElementById('replyDocGapText');

    if (kbSource === 'kb') {
      docGapText.innerText = kbContext;
      docGapBlock.querySelector('.doc-gap-header span').textContent = 'KB Article Referenced';
      docGapBlock.classList.add('kb-found');
      docGapBlock.classList.remove('hidden');
    } else if (kbSource === 'bot') {
      const botBlock = document.getElementById('replyInternalBot');
      const botText  = document.getElementById('replyInternalBotText');
      const botLink  = document.getElementById('replyInternalBotLink');
      // Render basic markdown — bold, italic, bullets
      botText.innerHTML = botAnswer
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([\s\S]+?)_/g, '<em>$1</em>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
      if (botThreadUrl) {
        botLink.href = botThreadUrl;
        botLink.classList.remove('hidden');
      }
      botBlock.classList.remove('hidden');
    } else {
      docGapText.innerText = `No matching article or internal documentation found for: "${coreQuestion}"`;
      docGapBlock.querySelector('.doc-gap-header span').textContent = 'Documentation Gap Detected';
      docGapBlock.classList.remove('kb-found');
      docGapBlock.classList.remove('hidden');
    }

    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Reply', conversation.slice(0, 80) + (conversation.length > 80 ? '...' : ''), result);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── SCOPE TAB ────────────────────────────────
let scopePostId   = null; // Featurebase post ID if URL was provided
let scopePostTitle = '';

// Clear button
document.getElementById('ticketClearBtn').addEventListener('click', () => {
  document.getElementById('ticketDetails').value = '';
  document.getElementById('ticketContext').value = '';
  document.getElementById('ticketPostUrl').value = '';
  document.getElementById('ticketOutput').classList.add('hidden');
  document.getElementById('scopePostedBlock').classList.add('hidden');
  document.querySelectorAll('.toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
  document.querySelector('.toggle-btn[data-type="bug"]').classList.add('active');
  document.getElementById('ticketType').value = 'bug';
  scopePostId    = null;
  scopePostTitle = '';
});

// Type toggle
document.querySelectorAll('.toggle-btn[data-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('ticketType').value = btn.dataset.type;
  });
});

// Generate scope
document.getElementById('ticketBtn').addEventListener('click', async () => {
  const type    = document.getElementById('ticketType').value;
  const details = document.getElementById('ticketDetails').value.trim();
  const context = document.getElementById('ticketContext').value.trim();
  const postUrl = document.getElementById('ticketPostUrl').value.trim();
  const btn     = document.getElementById('ticketBtn');

  if (!details) { alert('Please paste the customer\'s request or conversation.'); return; }

  const typeLabel = type === 'bug' ? 'Bug Report' : 'Feature Request';
  setLoading(btn, true);
  scopePostId    = null;
  scopePostTitle = '';

  try {
    // ── Step 1: Resolve Featurebase post URL if provided ──────────────────
    if (postUrl) {
      try {
        const postRes = await fetch('/.netlify/functions/featurebase-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_post', postUrl })
        });
        if (postRes.ok) {
          const postData = await postRes.json();
          if (postData.post) {
            scopePostId    = postData.post.id;
            scopePostTitle = postData.post.title;
          }
        }
      } catch (_) { /* silent — still generate scope */ }
    }

    // ── Step 2: Generate structured scope ─────────────────────────────────
    const prompt = type === 'feature'
      ? `You are a product manager writing a structured feature request brief for the Salesbuildr development team.

The customer submitted the following request:
${details}
${context ? `\nAdditional context from the support agent:\n${context}` : ''}

Write a structured feature brief using EXACTLY these sections. Be specific and concrete — no vague filler.

**Summary**
One paragraph. What the customer is trying to do and why the current product doesn't support it.

**Background**
The workflow or use case context. What the customer does today and where it breaks down.

**What Was Investigated**
Any workarounds or alternatives that were explored and why they don't solve the problem. If nothing was investigated, write "Not yet investigated — further discovery needed."

**The Gap**
A precise description of what is missing from the product today.

**Requested Feature**
Specific requirements — what the feature should do, where it should appear, how it should behave. Use bullet points.

**Why This Matters**
Business impact. Who else is affected. What happens if this isn't built.

**Proposed Priority**
Low / Medium / Medium-High / High with a one-line justification.

Write in clear, direct English. No double dashes. Do not include customer names or company names.`

      : `You are a product manager writing a structured bug report for the Salesbuildr development team.

The customer reported the following issue:
${details}
${context ? `\nAdditional context from the support agent:\n${context}` : ''}

Write a structured bug report using EXACTLY these sections.

**Summary**
One paragraph. What is broken and what the customer was trying to do.

**Steps to Reproduce**
Numbered steps to trigger the bug. If unknown, write "To be confirmed with customer."

**Expected Behaviour**
What should happen.

**Actual Behaviour**
What actually happens.

**Impact**
How this affects the customer's workflow. Severity — is it blocking or a workaround exists?

**What Was Investigated**
Any investigation already done. If none, write "Not yet investigated."

**Proposed Priority**
Low / Medium / Medium-High / High / Critical with a one-line justification.

Write in clear, direct English. No double dashes. Do not include customer names or company names.`;

    const result = await callClaude(prompt);

    // ── Step 3: Show output ───────────────────────────────────────────────
    const outputBlock = document.getElementById('ticketOutput');
    const outputText  = document.getElementById('ticketOutputText');
    const outputLabel = document.getElementById('ticketOutputLabel');
    const postRow     = document.getElementById('scopePostRow');
    const postHint    = document.getElementById('scopePostHint');

    outputLabel.textContent = typeLabel + ' Brief';
    outputText.innerText    = result;
    outputBlock.classList.remove('hidden');
    document.getElementById('scopePostedBlock').classList.add('hidden');

    // Show post row with appropriate hint
    if (scopePostId) {
      postHint.textContent = `Will post as private admin comment on: "${scopePostTitle}"`;
    } else if (postUrl) {
      postHint.textContent = 'Could not find that Featurebase post — copy and paste manually.';
      document.getElementById('scopePostBtn').disabled = true;
    } else {
      postHint.textContent = 'No post URL provided — copy the brief and paste it into Featurebase manually.';
      document.getElementById('scopePostBtn').disabled = true;
    }
    postRow.style.display = 'flex';

    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    saveToHistory('Scope (' + typeLabel + ')', details.slice(0, 80) + (details.length > 80 ? '...' : ''), result);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// Post to Featurebase
document.getElementById('scopePostBtn').addEventListener('click', async () => {
  if (!scopePostId) return;
  const content = document.getElementById('ticketOutputText').innerText;
  const btn     = document.getElementById('scopePostBtn');

  setLoading(btn, true);

  try {
    const res = await fetch('/.netlify/functions/featurebase-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action:    'post_comment',
        postId:    scopePostId,
        content,
        isPrivate: true
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert('Failed to post: ' + (data.error || res.status));
      return;
    }

    const postedBlock = document.getElementById('scopePostedBlock');
    const postedText  = document.getElementById('scopePostedText');
    postedText.innerText = `Posted as a private admin comment on "${scopePostTitle}" in Featurebase. Only admins can see it.`;
    postedBlock.classList.remove('hidden');
    document.getElementById('scopePostBtn').disabled = true;
    postedBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── FEATUREBASE SEARCH ───────────────────────
async function searchFeaturebase(query) {
  // Step 1: fetch article list
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

  // Step 2: ask Claude to identify matching article IDs
  const articleList = articles
    .map((a, i) => {
      const desc = a.description ? ` — ${a.description}` : '';
      return `${i + 1}. [ID:${a.id}] ${a.title}${desc}\n   ${a.url}`;
    })
    .join('\n');

  const matchPrompt = `Search the Salesbuildr knowledge base for: "${query}"

ARTICLES (${articles.length} total):
${articleList}

Identify up to 2 articles most relevant to the query. Reply with ONLY a JSON array of their IDs, e.g.: ["abc123","def456"]
If nothing is relevant, reply with: []`;

  const matchResult = await callClaude(matchPrompt);

  // Parse matched IDs
  let matchedIds = [];
  try {
    const jsonStr = matchResult.match(/\[.*?\]/s)?.[0] || '[]';
    matchedIds = JSON.parse(jsonStr).filter(id => id && typeof id === 'string');
  } catch (_) { matchedIds = []; }

  // Step 3: fetch full content of matched articles
  if (matchedIds.length > 0) {
    const contentRes = await fetch('/.netlify/functions/featurebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleIds: matchedIds })
    });

    if (contentRes.ok) {
      const { contents } = await contentRes.json();

      if (contents && contents.length > 0) {
        const richContext = contents.map(a =>
          `ARTICLE: ${a.title}\nURL: ${a.url}\n\nCONTENT:\n${a.content}`
        ).join('\n\n---\n\n');

        // Step 4: answer query using full article content
        const answerPrompt = `You are answering a customer support question using ONLY the content of these KB articles. Do not add anything that is not in the articles.

QUESTION: "${query}"

ARTICLE CONTENT:
${richContext}

STRICT RULES — follow these exactly:
1. Answer using ONLY information from the articles above. Do not add reasoning, assumptions, or general knowledge.
2. If the article describes self-serve steps (a UI flow the user does themselves), list those exact steps. Do not suggest contacting support.
3. If the article says credentials or instructions appear inside the Salesbuildr tool itself, tell the customer to go there — do not speculate about what those credentials might be.
4. Do not say things like "this varies by distributor" or "I'd recommend checking with your account manager" unless the article explicitly says that.
5. If the article contains internal troubleshooting steps (like checking logs, error consoles, or admin diagnostic panels), do NOT pass those to the customer. Instead, note what information those steps would reveal, and ask the customer for a screenshot or URL that would give you the same information.
6. If the article does not cover something the customer asked, say so plainly at the end.

If there is a genuine gap (something the customer asked that is not in the article at all), end with:
THE GAP
[what is missing]

Do not add a THE GAP section if the article covers the topic — even partially.`;

        return await callClaude(answerPrompt);
      }
    }
  }

  // Fallback — no matches found
  const fallbackPrompt = `Search the Salesbuildr knowledge base for: "${query}"

ARTICLES (${articles.length} total):
${articles.map((a, i) => `${i + 1}. ${a.title}${a.description ? ` — ${a.description}` : ''}\n   ${a.url}`).join('\n')}

Match query against titles AND descriptions. Reply with:
1. Relevant articles found (title + URL) — or "None found"
2. One sentence on what each covers
3. Whether anything is NOT covered

If there is a gap, end with:
THE GAP
[plain-English description of what is missing]

Only use URLs from the list. Never construct URLs.`;

  return await callClaude(fallbackPrompt);
}

// ─── TRANSLATE TAB ────────────────────────────
document.getElementById('translateBtn').addEventListener('click', async () => {
  const text = document.getElementById('translateInput').value.trim();
  const btn  = document.getElementById('translateBtn');

  if (!text) { alert('Please paste a conversation to translate.'); return; }

  setLoading(btn, true);
  document.getElementById('translateDetected').textContent = '';

  try {
    const prompt = `Translate the following customer support conversation into English.

Keep the conversation structure intact — preserve who said what (e.g. "Customer:", "Agent:" labels if present). If the text is already in English, say so and return it unchanged.

At the very start of your response, on its own line, write:
Detected language: [language name]

Then leave a blank line, then give the full translation.

CONVERSATION:
${text}`;

    const result = await callClaude(prompt);

    const lines = result.split('\n');
    let detectedLine = '';
    let translationStart = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().startsWith('detected language:')) {
        detectedLine = lines[i];
        translationStart = i + 1;
        break;
      }
    }

    const translation = lines.slice(translationStart).join('\n').trim();

    if (detectedLine) {
      document.getElementById('translateDetected').textContent = detectedLine;
    }

    const outputBlock = document.getElementById('translateOutput');
    const outputText  = document.getElementById('translateOutputText');
    outputText.innerText = translation;
    outputBlock.classList.remove('hidden');
    outputBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    document.getElementById('translateDraftReplyBtn').onclick = () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelector('.nav-item[data-tab="reply"]').classList.add('active');
      document.getElementById('tab-reply').classList.add('active');
      document.getElementById('replyConversation').value = translation;
      const lang = detectedLine ? detectedLine.replace('Detected language:', '').trim() : 'another language';
      document.getElementById('replyContext').value = `This conversation was originally in ${lang} and has been translated to English.`;
      document.getElementById('tab-reply').scrollTo({ top: 0, behavior: 'smooth' });
    };

    saveToHistory('Translation', text.slice(0, 80) + (text.length > 80 ? '...' : ''), translation);

  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    setLoading(btn, false);
  }
});

// ─── KB PANEL ─────────────────────────────────
let kbLastArticles = [];

async function runKbAsk() {
  const query = document.getElementById('kbAskInput').value.trim();
  if (!query) return;

  const btn       = document.getElementById('kbAskBtn');
  const btnText   = btn.querySelector('.kb-ask-btn-text');
  const btnLoader = btn.querySelector('.kb-ask-btn-loader');

  btn.disabled = true;
  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');

  // Reset all blocks
  document.getElementById('kbAnswerBlock').classList.add('hidden');
  document.getElementById('kbAnswerText').innerHTML = '';
  document.getElementById('kbBotBlock').classList.add('hidden');
  document.getElementById('kbBotText').innerHTML = '';
  document.getElementById('kbBotLink').classList.add('hidden');
  document.getElementById('kbArticlesBlock').classList.add('hidden');
  document.getElementById('kbArticlesList').innerHTML = '';
  document.getElementById('kbCreateTicket').classList.add('hidden');

  try {
    // ── Run KB search and bot query in parallel ────────────────────────────
    const [kbResult, botResult] = await Promise.allSettled([
      searchFeaturebase(query),
      fetch('/.netlify/functions/slack-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query })
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);

    const kbText    = kbResult.status === 'fulfilled' ? kbResult.value : '';
    const gapIdx    = kbText.indexOf('THE GAP');
    const kbClean   = gapIdx !== -1 ? kbText.slice(0, gapIdx).trim() : kbText.trim();
    const noResults = !kbClean || kbClean.toLowerCase().includes('no articles') ||
                      kbClean.toLowerCase().includes('no published') ||
                      kbClean.toLowerCase().includes('does not exist') ||
                      kbClean.toLowerCase().includes('none found');

    const botData   = botResult.status === 'fulfilled' ? botResult.value : null;
    const botAnswer = botData?.answer || '';

    if (!noResults) {
      // ── KB found something — show answer and articles ──────────────────
      const answerPrompt = `You are answering a support question on behalf of Salesbuildr.

QUESTION: "${query}"

KNOWLEDGE BASE CONTEXT — use this as your only source of truth:
${kbClean}

Answer the question directly and concisely. 2-3 sentences maximum.
Do not invent product details. Do not use double dashes.`;

      const answer = await callClaude(answerPrompt);
      const answerText = document.getElementById('kbAnswerText');
      answerText.innerHTML = answer
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent);">$1</a>')
        .replace(/\n/g, '<br>');
      document.getElementById('kbAnswerBlock').classList.remove('hidden');

      // Extract article links
      const urlRegex    = /https?:\/\/[^\s\)\"]+/g;
      const titleUrlPairs = [];
      const lines       = kbClean.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const urls = line.match(urlRegex);
        if (urls) {
          let title = '';
          const boldMatch = line.match(/\*\*([^*]+)\*\*/);
          if (boldMatch) title = boldMatch[1];
          else if (i > 0) { const pb = lines[i-1].match(/\*\*([^*]+)\*\*/); if (pb) title = pb[1]; }
          for (const url of urls) {
            if (url.includes('featurebase') || url.includes('salesbuildr') || url.includes('feedback')) {
              if (!title) { const slug = url.split('/').pop() || ''; title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/^\d+\s*/, ''); }
              if (title && !titleUrlPairs.find(p => p.url === url)) titleUrlPairs.push({ title: title.trim(), url });
            }
          }
        }
      }
      kbLastArticles = titleUrlPairs;
      if (titleUrlPairs.length) {
        const articlesList = document.getElementById('kbArticlesList');
        articlesList.innerHTML = titleUrlPairs.map((item, i) => `
          <div class="kb-article-item">
            <a class="kb-article-link" href="${item.url}" target="_blank" title="${item.title}">${item.title}</a>
            <button class="kb-article-copy" data-index="${i}">Copy</button>
          </div>`).join('');
        articlesList.querySelectorAll('.kb-article-copy').forEach(b => {
          b.addEventListener('click', () => {
            const article = kbLastArticles[parseInt(b.dataset.index)];
            if (!article) return;
            navigator.clipboard.writeText(article.url).then(() => {
              b.textContent = 'Copied!'; b.classList.add('copied');
              setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('copied'); }, 2000);
            });
          });
        });
        document.getElementById('kbArticlesBlock').classList.remove('hidden');
      }
    }

    // ── Always show bot answer if it came back ─────────────────────────────
    if (botAnswer) {
      const botText = document.getElementById('kbBotText');
      botText.innerHTML = botAnswer
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/^[•\-] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>[\s\S]+?<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n/g, '<br>');
      if (botData?.thread_url) {
        const botLink = document.getElementById('kbBotLink');
        botLink.href = botData.thread_url;
        botLink.classList.remove('hidden');
      }
      document.getElementById('kbBotBlock').classList.remove('hidden');
    }

    // If neither source found anything
    if (noResults && !botAnswer) {
      document.getElementById('kbAnswerText').innerHTML = 'No information found in the public KB or internal documentation for this query.';
      document.getElementById('kbAnswerBlock').classList.remove('hidden');
    }

    // Always show create ticket button
    document.getElementById('kbCreateTicket').classList.remove('hidden');

  } catch (e) {
    document.getElementById('kbAnswerText').innerText = 'Something went wrong: ' + e.message;
    document.getElementById('kbAnswerBlock').classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    btnLoader.textContent = '...';
  }
}

document.getElementById('kbClearBtn').addEventListener('click', () => {
  document.getElementById('kbAskInput').value = '';
  document.getElementById('kbAnswerBlock').classList.add('hidden');
  document.getElementById('kbAnswerText').innerHTML = '';
  document.getElementById('kbBotBlock').classList.add('hidden');
  document.getElementById('kbBotText').innerHTML = '';
  document.getElementById('kbBotLink').classList.add('hidden');
  document.getElementById('kbArticlesBlock').classList.add('hidden');
  document.getElementById('kbArticlesList').innerHTML = '';
  document.getElementById('kbCreateTicket').classList.add('hidden');
  kbLastArticles = [];
});

document.getElementById('kbAskBtn').addEventListener('click', runKbAsk);

document.getElementById('kbAskInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runKbAsk();
});

document.getElementById('kbCreateTicketBtn').addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.nav-item[data-tab="reply"]').classList.add('active');
  document.getElementById('tab-reply').classList.add('active');
  const query = document.getElementById('kbAskInput').value.trim();
  if (query) {
    document.getElementById('replyConversation').value = '';
    document.getElementById('replyContext').value = query;
  }
  document.getElementById('tab-reply').scrollTo({ top: 0, behavior: 'smooth' });
});
