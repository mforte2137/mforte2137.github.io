// =========================================================
// deluxe-ai.js — Netlify function
// Path: /api/deluxe-ai
//
// Handles three modes:
//   generate — build a full project scope from a description
//   review   — review and validate an existing scope
//   adjust   — adjust scope for team/deadline constraints
//   format   — reformat raw project notes into customer HTML
//   chat     — general assistant responses
// =========================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(mode) {
  if (mode === 'generate') {
    return `You are an expert MSP project planner. Generate a detailed project scope from a description.
Return ONLY valid JSON with this exact structure:
{
  "projectTitle": "string",
  "overview": "string — 2-3 sentence customer-facing overview",
  "exclusions": "string — common exclusions, one per line (\\n separated)",
  "message": "string — brief summary of what you generated",
  "tasks": [
    { "task": "string", "role": "string", "hours": number, "notes": "string" }
  ]
}
Generate 10-20 realistic tasks. Include a project management task. Return ONLY valid JSON, no markdown.`;
  }

  if (mode === 'review') {
    return `You are an expert MSP project planner reviewing a scope. Analyze for completeness, realistic hours, and missing tasks.
Return ONLY valid JSON:
{
  "summary": "string — 1-2 sentence overall assessment",
  "feedback": [{ "type": "warning|suggestion|ok", "text": "string" }],
  "suggestedTasks": [{ "task": "string", "role": "string", "hours": number, "notes": "string" }]
}
Return ONLY valid JSON, no markdown.`;
  }

  if (mode === 'adjust') {
    return `You are an expert MSP project planner helping adjust a scope to fit constraints.
Return ONLY valid JSON:
{
  "summary": "string",
  "feedback": [{ "type": "warning|suggestion|ok", "text": "string" }],
  "suggestedTasks": []
}
Return ONLY valid JSON, no markdown.`;
  }

  if (mode === 'format') {
    return `You are a professional technical writer. Your ONLY job is to reformat and clean up raw technical notes into a well-structured, professional customer-facing HTML document.

STRICT RULES:
- Preserve EVERY technical fact, detail, measurement, model number, URL, and piece of information from the original
- Do NOT add any information that is not in the original notes
- Do NOT invent, assume, or embellish any details
- Do NOT remove any information
- You MAY fix grammar, improve sentence structure, add appropriate headings, and improve formatting
- You MAY reorganize information into logical sections with H2/H3 headings
- You MAY convert run-on text into proper paragraphs and bullet lists
- Return clean HTML only — use h2, h3, p, ul, li, strong, em tags
- No wrapper div, no inline styles, no markdown, no code fences
- Start directly with the HTML content`;
  }

  // Default chat
  return `You are a helpful MSP project planning assistant. Answer questions about project planning, scoping, and IT project delivery concisely. Return JSON: { "text": "your response" }`;
}

function buildUserMessage(mode, message, currentScope) {
  if (mode === 'generate') return `Generate a project scope for: ${message}`;
  if (mode === 'review' || mode === 'adjust') {
    const scopeStr = currentScope ? `\n\nCurrent scope:\nProject: ${currentScope.projectTitle||'(untitled)'}\nCustomer: ${currentScope.customerName||'—'}\n\nOverview:\n${currentScope.overview||'(none)'}\n\nTasks:\n${(currentScope.tasks||[]).map(t=>`- ${t.task} | Role: ${t.role||'—'} | Hours: ${t.hours}`).join('\n')}` : '';
    return `${message}${scopeStr}`;
  }
  if (mode === 'format') return `Please reformat these technical notes into a professional customer-facing HTML document:\n\n${message}`;
  return message;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:false, error:'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:false, error:'Invalid JSON.' }) }; }

  const { mode, message, currentScope } = body;
  if (!message?.trim()) {
    return { statusCode: 400, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:false, error:'message is required.' }) };
  }

  const systemPrompt = buildSystemPrompt(mode);
  const userMessage  = buildUserMessage(mode, message, currentScope);

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system: systemPrompt, messages: [{ role:'user', content: userMessage }] })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { statusCode: 502, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:false, error:`AI API error ${res.status}: ${errText.slice(0,200)}` }) };
    }

    const aiData  = await res.json();
    const rawText = aiData.content?.[0]?.text || '';

    // Format mode returns HTML directly
    if (mode === 'format') {
      const cleaned = rawText.replace(/```html|```/g, '').trim();
      return { statusCode: 200, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:true, html: cleaned }) };
    }

    // All other modes return JSON
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { text: rawText };
    }

    return { statusCode: 200, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:true, ...parsed }) };

  } catch (err) {
    return { statusCode: 502, headers: { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*' }, body: JSON.stringify({ ok:false, error: err.message||'Request failed.' }) };
  }
};
