// =========================================================
// netlify/functions/ai-readiness-pack.js
// Path: /api/ai-readiness-pack
//
// Generates customer-facing copy for the AI Readiness Proposal Pack.
// No client environment is assessed — this sells the readiness
// service before any work has been done.
//
// Accepts POST {
//   clientName, industry, companySize, copilotSku, mspName,
//   activeSections: [ "whyMatters" | "whatCovers" | "whatYouGet" | "withoutIt" | "nextStep" ],
//   regenSection?: string   // if present, only that one section is (re)generated
// }
//
// Note: the Readiness Maturity Matrix widget is fixed, generic content
// (not client-specific) and is built entirely client-side — it never
// hits this function.
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SECTION_KEYS = ['whyMatters', 'whatCovers', 'whatYouGet', 'withoutIt', 'nextStep'];

const SYSTEM_PROMPT = `You write customer-facing sales copy for MSPs (Managed Service Providers) proposing an "AI Readiness" service to their clients — before any assessment work has been done. No results are shown, no client environment has been scanned. This is a proposal tool, not a reporting tool.

Rules you must follow:
- This tool sells a service — not a product. The MSP is the expert guide, not a vendor.
- Tone throughout: calm, expert, advisory, trustworthy — like a conversation with a knowledgeable IT partner who genuinely has the client's interests in mind.
- Never alarmist — state consequences factually, not as threats.
- Industry context must be specific — a legal firm should hear about client privilege and matter confidentiality, a healthcare practice should hear about patient data (HIPAA), an accounting firm should hear about client financial records, and so on for whatever industry is given.
- Avoid Microsoft marketing language — phrases like "AI-powered productivity" erode trust with sceptical SMB buyers.
- The three service pillars (Identity & Access, Data Governance, Security Baseline) must be described in plain business language — what it means for the business, not technical detail.
- The "what you get" section must end with a warm, confident handoff toward Copilot deployment — the goal is to sell readiness AND plant the seed for the next conversation.
- Never invent specific statistics, dollar figures, or client names.
- Return JSON only — no preamble, no markdown, no backticks, no explanation. Only the requested JSON object.`;

function sectionInstructions(keys, ctx) {
  const parts = [];

  if (keys.includes('whyMatters')) {
    parts.push(`"whyMatters": {
  "headline": string — punchy headline about readiness coming before Copilot,
  "body": string, 2-4 sentences — plain-language explanation of what happens when AI is deployed into an unprepared Microsoft 365 environment: data exposure through over-permissioned files, compliance violations, failed adoption, wasted licensing spend. Weave in ${ctx.industry}-specific context.
}`);
  }
  if (keys.includes('whatCovers')) {
    parts.push(`"whatCovers": {
  "headline": string,
  "pillars": [
    { "name": "Identity & Access", "description": string, 1-2 sentences, plain business language },
    { "name": "Data Governance", "description": string, 1-2 sentences, plain business language },
    { "name": "Security Baseline", "description": string, 1-2 sentences, plain business language }
  ]
}`);
  }
  if (keys.includes('whatYouGet')) {
    parts.push(`"whatYouGet": {
  "headline": string,
  "deliverables": array of 4-5 short strings (each under 8 words) — e.g. a readiness report, a gap remediation plan, a go/no-go recommendation, a deployment roadmap,
  "handoff": string, 1 sentence — warm, confident handoff toward deploying Copilot once ready
}`);
  }
  if (keys.includes('withoutIt')) {
    parts.push(`"withoutIt": {
  "headline": string,
  "risks": array of 4-5 short strings, 1 sentence each — specific, factual, calm consequences of skipping readiness, framed as "what we've seen happen" not threats, with ${ctx.industry}-specific relevance where natural
}`);
  }
  if (keys.includes('nextStep')) {
    parts.push(`"nextStep": {
  "headline": string,
  "body": string, 2-3 sentences — how long the readiness assessment takes, what's needed from the client (typically minimal — access credentials and a discovery call), what happens after. Low-friction, high-value framing.
}`);
  }
  return parts.join(',\n');
}

function buildUserMessage(ctx, keys) {
  return `Generate AI Readiness proposal copy for the following context:

Client name: ${ctx.clientName}
Industry: ${ctx.industry}
Company size: ${ctx.companySize}
Copilot SKU being considered: ${ctx.copilotSku}
MSP name (service provider): ${ctx.mspName}

Return a single JSON object with exactly these keys and shapes:
{
${sectionInstructions(keys, ctx)}
}

Only include the keys listed above. Return JSON only.`;
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { clientName, industry, companySize, copilotSku, mspName, activeSections, regenSection } = body;

  if (!clientName || !industry || !companySize || !copilotSku || !mspName) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName, industry, companySize, copilotSku and mspName are all required.' }) };
  }

  // Determine which keys to generate this call
  let keys;
  if (regenSection) {
    keys = [regenSection];
  } else {
    keys = (Array.isArray(activeSections) ? activeSections : []).filter(k => SECTION_KEYS.includes(k));
  }

  if (keys.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'No sections selected.' }) };
  }

  const ctx = { clientName, industry, companySize, copilotSku, mspName };
  const userMessage = buildUserMessage(ctx, keys);

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  try {
    const aiRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return { statusCode: aiRes.status, headers, body: JSON.stringify({ ok: false, error: `AI request failed: ${errText.slice(0, 300)}` }) };
    }

    const aiData = await aiRes.json();
    const text = aiData.content && aiData.content[0] && aiData.content[0].text;

    if (!text) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI returned no content.' }) };
    }

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, data: parsed }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
