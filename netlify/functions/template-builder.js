/* =====================================================
   netlify/functions/template-builder.js
   Path: /api/template-builder

   Actions (POST { action, ... }):
     generate               { widget, engagement, engagementDesc, customDescription, language }
                            → { ok, content }   (structured JSON for one widget)
     listTemplates          { apiKey, tenantUrl } → { ok, templates: [{ id, name }] }
     createTemplate         { apiKey, tenantUrl, name, widgets: [{ key, html }], existingId? }
                            → { ok, id, name, updated }
     validateWidgetTemplates{ apiKey, tenantUrl, widgets: [{ name, html }] }
                            → { ok, failures: [{ name, error }] }

   Widget templates (Option B) are pushed by the frontend through the
   shared /api/push-widgets function — not from here.

   Salesbuildr credentials always come from the request body (multi-tenant).
   ===================================================== */

const MODEL = 'claude-haiku-4-5-20251001';

// Merge tags the AI is allowed to write. Anything else is stripped so an
// unresolved {{placeholder}} never reaches a customer-facing quote.
const ALLOWED_TAGS = ['company.name', 'servicingBranch.name', 'contact.firstName'];

// Page breaks for the PDF version of the quote template.
// Banner + cover letter share page one; exec summary and W1 start new pages.
const PAGE_BREAK_BEFORE = { executiveSummary: true, w1: true };

// Widget title shown by Salesbuildr above each widget. Our widgets carry
// their own headings, so this is left empty to avoid a duplicate heading.
const SHOW_WIDGET_TITLES = false;

const WIDGET_NAMES = {
  banner: 'Banner Image',
  coverLetter: 'Cover Letter',
  executiveSummary: 'Executive Summary',
  w1: 'Their Situation',
  w2: 'Why Now',
  w3: 'What We Do',
  w4: 'Why Us',
  w5: 'Next Steps'
};

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  const reply = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) });

  // 1. CORS preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  // 2. Method check
  if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'POST required.' });

  // 3. Parse body
  let body;
  try { body = JSON.parse(event.body); }
  catch { return reply(400, { ok: false, error: 'Invalid JSON.' }); }

  const action = body.action || 'generate';

  try {
    if (action === 'generate')                return await handleGenerate(body, reply);
    if (action === 'listTemplates')           return await handleListTemplates(body, reply);
    if (action === 'createTemplate')          return await handleCreateTemplate(body, reply);
    if (action === 'validateWidgetTemplates') return await handleValidateWidgets(body, reply);
    return reply(400, { ok: false, error: `Unknown action: ${action}` });
  } catch (err) {
    return reply(500, { ok: false, error: err.message || 'Function threw an error.' });
  }
};

/* ─────────────────────────────────────────────────────
   AI generation — one widget per call
   (keeps every call well inside the 26s Netlify limit)
   ───────────────────────────────────────────────────── */

const WIDGET_SPECS = {
  coverLetter: {
    tokens: 900,
    spec: `COVER LETTER — the personal opening of the proposal.
The greeting ("Dear {{contact.firstName}},") and the sign-off are added automatically — do NOT include them.
Write 3 or 4 short paragraphs (each 35–60 words):
1. A warm, engagement-specific opening that thanks {{company.name}} for the opportunity.
2. What you understand they are trying to achieve with this engagement.
3. How {{servicingBranch.name}} will approach it and what the proposal covers.
4. (optional) A short, confident close inviting questions.
Return: { "paragraphs": ["...", "...", "..."] }`
  },
  executiveSummary: {
    tokens: 900,
    spec: `EXECUTIVE SUMMARY — a one-page snapshot for a busy decision-maker.
Return:
{
  "headline": "Outcome-focused headline, max 10 words",
  "intro": "2 sentences: what this engagement delivers in business terms (max 50 words)",
  "outcomes": [ { "title": "max 5 words", "detail": "one sentence, max 20 words" } ]   // exactly 3
  "investment": "1–2 sentences framing the cost as a planned, managed investment. Never mention prices or numbers (max 35 words)"
}`
  },
  w1: {
    tokens: 900,
    spec: `W1 — THEIR SITUATION. Show the customer you have listened. They should read it and nod.
Second person ("Your business…", "Your team…"). Pain points common to this engagement type — specific and resonant, never generic.
Return:
{
  "headline": "max 10 words, written to the reader",
  "intro": "2 sentences that mirror their reality back to them (max 45 words)",
  "painPoints": [ { "title": "max 6 words", "detail": "one or two sentences, max 30 words" } ],   // exactly 3
  "closing": "one sentence that bridges to why this matters now (max 25 words)"
}`
  },
  w2: {
    tokens: 900,
    spec: `W2 — WHY NOW. Create urgency without pressure. Connect the cost of inaction to risk, cost or competitive disadvantage.
Statistic rule: only use a widely published figure you are confident about, from a named, reputable source relevant to the language region (e.g. a government survey, a major industry report). If you are not confident of an exact figure, set "value" to a short qualitative phrase (e.g. "Rising") rather than inventing a number. Never fabricate.
Return:
{
  "headline": "max 10 words",
  "stat": { "value": "e.g. 43% — max 8 characters", "label": "what the figure measures, max 14 words", "source": "source name and year" },
  "intro": "2 sentences on what is changing in their world (max 45 words)",
  "risks": [ { "title": "max 6 words", "detail": "one sentence, max 25 words" } ],   // exactly 3
  "implication": "One sentence starting 'Every month without …' (max 25 words)"
}`
  },
  w3: {
    tokens: 1000,
    spec: `W3 — WHAT WE DO. Position {{servicingBranch.name}} as the expert. NOT a feature list — explain the outcome they are buying and how the engagement runs.
Return:
{
  "headline": "max 10 words",
  "intro": "2 sentences on the outcome they are buying (max 45 words)",
  "phases": [ { "name": "phase name, max 4 words", "detail": "what happens and what it achieves, max 28 words" } ],   // 3 or 4, in order
  "experience": "2 sentences on what working with {{servicingBranch.name}} feels like for the client during the engagement (max 45 words)"
}`
  },
  w4: {
    tokens: 900,
    spec: `W4 — WHY US. Answer the question every buyer is silently asking: "Why should I trust you with this?" Differentiate on trust, methodology and accountability — never on price.
This is a reusable template: do NOT invent years in business, client counts, named certifications, awards or testimonials. Describe trust signals as commitments and ways of working the MSP can stand behind; the MSP will add their real credentials.
Use {{servicingBranch.name}} naturally.
Return:
{
  "headline": "max 10 words",
  "intro": "2 sentences (max 40 words)",
  "signals": [ { "title": "max 5 words", "detail": "one sentence, max 22 words" } ],   // exactly 4
  "closing": "one confident sentence (max 25 words)"
}`
  },
  w5: {
    tokens: 900,
    spec: `W5 — NEXT STEPS. Remove the last objection and make it easy to say yes. Low friction, clear action, warm tone — this is a relationship starting.
Do not state specific dates or timescales in days; keep it general ("within the first week" is fine).
Return:
{
  "headline": "max 10 words",
  "intro": "one sentence (max 25 words)",
  "steps": [ { "title": "max 5 words", "detail": "one sentence, max 25 words" } ],   // exactly 3, in order: what happens when they agree, what the MSP does first, what the client needs to do
  "closing": "one or two warm sentences (max 35 words)"
}`
  },
  products: {
    tokens: 500,
    spec: `SUGGESTED PRODUCTS — a starting list the MSP will use to add products from their own catalogue. Informational only.
Return 5 to 8 entries relevant to this engagement. Format each as "Product or service — e.g. VendorA, VendorB", or just "Service name" if vendor-agnostic.
Return: { "products": ["...", "..."] }`
  }
};

const ENGAGEMENT_PRESETS = {
  'Managed IT Services — New Client': 'Taking over day-to-day IT for a business: helpdesk, monitoring, patching, security baseline and strategic planning.',
  'Microsoft 365 Licensing & Migration': 'Moving email, files and collaboration to Microsoft 365, rightsizing licences and securing the tenant.',
  'Microsoft Copilot / AI Rollout': 'Preparing data, permissions and people for Microsoft Copilot and practical AI adoption.',
  'Network Refresh': 'Replacing ageing switches, firewalls and Wi-Fi with a reliable, secure, well-documented network.',
  'Security Package': 'Layered cyber security: endpoint protection, email security, MFA, awareness training and monitoring.',
  'Backup & Disaster Recovery': 'Protecting data and systems with tested backups and a recovery plan the business can rely on.',
  'Cyber Insurance Readiness': 'Meeting insurer security requirements so the business can obtain or renew cover on good terms.',
  'Cloud Migration (Azure / Hybrid)': 'Moving servers and workloads to Azure or a hybrid model with a clear, low-disruption plan.',
  'Hardware Refresh': 'Replacing end-of-life laptops, desktops and servers on a planned lifecycle.',
  'VoIP / Phone System': 'Moving to a modern cloud phone system with mobility, call handling and a smooth number port.',
  'Compliance Engagement': 'Meeting a regulatory or certification standard with documented controls and evidence.'
};

async function handleGenerate(body, reply) {
  const widget = body.widget;
  const spec = WIDGET_SPECS[widget];
  if (!spec) return reply(400, { ok: false, error: 'widget must be one of: ' + Object.keys(WIDGET_SPECS).join(', ') });
  if (!body.engagement) return reply(400, { ok: false, error: 'engagement is required.' });

  const isCustom = body.engagement === 'Custom Engagement';
  if (isCustom && !(body.customDescription || '').trim()) {
    return reply(400, { ok: false, error: 'customDescription is required for a custom engagement.' });
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) return reply(500, { ok: false, error: 'API key not configured.' });

  const isUS = body.language === 'US';
  const languageRules = isUS
    ? `Write in US English throughout. Use US spelling and vocabulary (organization, color, license, recognize, program, center). Where regulation is relevant use US references (HIPAA, FTC Safeguards Rule, NIST Cybersecurity Framework, state privacy laws, CMMC). Tone: direct and confident.`
    : `Write in UK English throughout. Use UK spelling and vocabulary (organisation, colour, licence, recognise, programme, centre). Where regulation is relevant use UK references (Cyber Essentials, ICO, UK GDPR, NCSC guidance). Tone: professional and slightly more formal.`;

  const engagementLine = isCustom
    ? `ENGAGEMENT (custom, described by the MSP): ${String(body.customDescription).trim().slice(0, 1500)}`
    : `ENGAGEMENT: ${body.engagement} — ${body.engagementDesc || ENGAGEMENT_PRESETS[body.engagement] || ''}`;

  const systemPrompt = `You write copy for Salesbuildr proposal templates used by MSPs (managed IT service providers) selling to small and mid-sized businesses.

${languageRules}

${engagementLine}

RULES:
- These are REUSABLE TEMPLATES. Never invent client names, people, MSP names, prices, or specific dates.
- Refer to the client as {{company.name}} and the MSP as {{servicingBranch.name}} where a name is needed. {{contact.firstName}} is the client contact's first name.
- These are the ONLY merge tags allowed: {{company.name}}, {{servicingBranch.name}}, {{contact.firstName}}. Never use any other {{ }} tag.
- Write for a business owner: plain language, no unexplained acronyms, no vendor or product names (except in the suggested products list).
- Be specific to this engagement — copy that could sit in any proposal is a failure.
- Respect every word limit. Executives scan.
- Plain text only inside JSON strings — no HTML, no markdown.
- Return ONLY a JSON object matching the shape below. No preamble, no markdown, no backticks.

${spec.spec}`;

  const userMessage = `Write the ${widget === 'products' ? 'suggested products list' : WIDGET_NAMES[widget] + ' widget'} for this engagement. Return JSON only.`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: spec.tokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!aiRes.ok) {
    const txt = await aiRes.text();
    return reply(502, { ok: false, error: `AI API returned ${aiRes.status}: ${txt.slice(0, 200)}` });
  }

  const aiData = await aiRes.json();
  const text = aiData.content?.[0]?.text || '';

  let parsed;
  try {
    let clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);
    parsed = JSON.parse(clean);
  } catch {
    return reply(500, { ok: false, error: 'AI returned invalid JSON. Please regenerate.' });
  }

  const missing = checkShape(widget, parsed);
  if (missing) return reply(500, { ok: false, error: `AI response missing ${missing}. Please regenerate.` });

  return reply(200, { ok: true, widget, content: sanitiseTags(parsed) });
}

function checkShape(widget, d) {
  const need = {
    coverLetter: ['paragraphs'],
    executiveSummary: ['headline', 'intro', 'outcomes', 'investment'],
    w1: ['headline', 'intro', 'painPoints'],
    w2: ['headline', 'stat', 'intro', 'risks', 'implication'],
    w3: ['headline', 'intro', 'phases'],
    w4: ['headline', 'intro', 'signals'],
    w5: ['headline', 'steps'],
    products: ['products']
  }[widget] || [];
  for (const k of need) {
    if (d[k] === undefined || d[k] === null) return k;
  }
  const arrays = { coverLetter: 'paragraphs', executiveSummary: 'outcomes', w1: 'painPoints', w2: 'risks', w3: 'phases', w4: 'signals', w5: 'steps', products: 'products' };
  const arrKey = arrays[widget];
  if (arrKey && (!Array.isArray(d[arrKey]) || !d[arrKey].length)) return arrKey;
  return null;
}

// Recursively strip any {{tag}} not on the allowlist, and normalise spacing inside allowed tags.
function sanitiseTags(value) {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, tag) =>
      ALLOWED_TAGS.includes(tag.trim()) ? `{{${tag.trim()}}}` : ''
    ).replace(/\s{2,}/g, ' ').trim();
  }
  if (Array.isArray(value)) return value.map(sanitiseTags);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = sanitiseTags(value[k]);
    return out;
  }
  return value;
}

/* ─────────────────────────────────────────────────────
   Salesbuildr Public API
   ───────────────────────────────────────────────────── */

function sbBase(tenantUrl) {
  let base = String(tenantUrl || '').trim().replace(/\/+$/, '');
  if (base && !/^https?:\/\//i.test(base)) base = 'https://' + base;
  let url;
  try { url = new URL(base); } catch { throw new Error('Tenant URL is not a valid URL.'); }
  if (url.protocol !== 'https:') throw new Error('Tenant URL must use https.');
  return `${url.origin}/public-api`;
}

async function sbFetch(body, path, method = 'GET', payload) {
  if (!body.apiKey || !body.tenantUrl) {
    const e = new Error('Salesbuildr API key and tenant URL are required.');
    e.status = 401;
    throw e;
  }
  const res = await fetch(sbBase(body.tenantUrl) + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'api-key': body.apiKey },
    body: payload ? JSON.stringify(payload) : undefined
  });
  let data = null;
  const raw = await res.text();
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  return { ok: res.ok, status: res.status, data };
}

function sbError(r, fallback) {
  if (r.status === 401 || r.status === 403) return 'Salesbuildr rejected the API key (HTTP ' + r.status + '). Check the key and that the Public API is enabled for this tenant.';
  if (r.status === 404) return 'Salesbuildr endpoint not found (HTTP 404). Check the tenant URL.';
  if (r.status === 429) return 'Salesbuildr rate limit reached (500 requests per 10 minutes). Wait a few minutes and try again.';
  const msg = r.data && (r.data.message || r.data.error);
  const detail = Array.isArray(msg) ? msg.join('; ') : msg;
  return `${fallback} (HTTP ${r.status})${detail ? ': ' + detail : ''}`;
}

async function handleListTemplates(body, reply) {
  let r;
  try { r = await sbFetch(body, '/quote-template'); }
  catch (e) { return reply(e.status || 400, { ok: false, error: e.message }); }
  if (!r.ok) return reply(200, { ok: false, status: r.status, error: sbError(r, 'Could not read quote templates') });
  const templates = Array.isArray(r.data) ? r.data.map(t => ({ id: t.id, name: t.name })) : [];
  return reply(200, { ok: true, templates });
}

// Same widget shape that push-widgets.js uses (confirmed in production).
function buildSbWidget(html, title, pageBreak) {
  return {
    type: 'items',
    contentTemplate: html,
    titleTemplate: SHOW_WIDGET_TITLES ? title : '',
    showProductImage: false,
    products: [],
    hidden: false,
    locked: false,
    attachments: [],
    choice: null,
    showSubtotal: false,
    pageBreak: !!pageBreak
  };
}

async function handleCreateTemplate(body, reply) {
  const name = String(body.name || '').trim();
  if (!name) return reply(400, { ok: false, error: 'Template name is required.' });
  if (!Array.isArray(body.widgets) || !body.widgets.length) return reply(400, { ok: false, error: 'No widgets provided.' });

  const payload = {
    name,
    widgets: body.widgets.map((w, i) =>
      buildSbWidget(w.html, WIDGET_NAMES[w.key] || `Widget ${i + 1}`, i > 0 && PAGE_BREAK_BEFORE[w.key])
    )
  };

  // 1. Validate first
  let v;
  try { v = await sbFetch(body, '/quote-template/validate', 'POST', payload); }
  catch (e) { return reply(e.status || 400, { ok: false, error: e.message }); }
  if (!v.ok) return reply(200, { ok: false, stage: 'validate', error: sbError(v, 'Salesbuildr rejected the template during validation') });

  // Warn (don't block) if validation silently dropped the widget HTML
  let warning = null;
  const vw = v.data && Array.isArray(v.data.widgets) ? v.data.widgets : null;
  if (vw && vw.length && vw.some(w => w && w.contentTemplate === undefined)) {
    warning = 'Salesbuildr validation returned widgets without content. Open the template in Salesbuildr to check it.';
  }

  // 2. Create or update
  const existingId = body.existingId ? String(body.existingId) : null;
  const r = existingId
    ? await sbFetch(body, `/quote-template/${encodeURIComponent(existingId)}`, 'PUT', payload)
    : await sbFetch(body, '/quote-template', 'POST', payload);

  if (!r.ok) return reply(200, { ok: false, stage: existingId ? 'update' : 'create', error: sbError(r, existingId ? 'Could not update the template' : 'Could not create the template') });

  return reply(200, {
    ok: true,
    id: (r.data && r.data.id) || existingId,
    name,
    updated: !!existingId,
    warning
  });
}

async function handleValidateWidgets(body, reply) {
  if (!Array.isArray(body.widgets) || !body.widgets.length) return reply(400, { ok: false, error: 'No widgets provided.' });
  const checks = await Promise.all(body.widgets.map(async (w, i) => {
    try {
      const r = await sbFetch(body, '/quote-widget-template/validate', 'POST', {
        name: w.name,
        widget: buildSbWidget(w.html, w.name, i > 0),
        order: 900 + i
      });
      return r.ok ? null : { name: w.name, error: sbError(r, 'Validation failed') };
    } catch (e) {
      return { name: w.name, error: e.message };
    }
  }));
  const failures = checks.filter(Boolean);
  return reply(200, { ok: failures.length === 0, failures, error: failures.length ? failures[0].error : undefined });
}
