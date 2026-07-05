// =========================================================
// netlify/functions/copilot-proposal-pack.js
// Path: /api/copilot-proposal-pack
//
// Generates customer-facing copy for the Copilot Proposal Widget Pack.
// Plain-language, no marketing hype, no pricing anywhere — Copilot
// licence line items are added in Salesbuildr from the MSP's own
// catalog, so this tool never invents or references specific costs.
//
// Accepts POST {
//   clientName, industry, companySize, copilotSku, readinessStatus, mspName,
//   activeSections: [ "plainEnglish" | "yourTeam" | "dataPrivacy" | "gettingStarted" | "investment" | "readinessComplete" ],
//   includeTierMatrix: boolean,
//   regenSection?: string
// }
//
// Note: dataPrivacy only asks the AI for a one-sentence industry
// compliance note — the five core privacy facts and the readiness-
// confirmed sentence are fixed and built client-side. The tier
// comparison matrix asks the AI for feature descriptions only per a
// fixed set of three canonical SKU columns — never pricing, never a
// "recommended" flag (that's derived client-side from the SKU the
// rep selected).
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const SECTION_KEYS = ['plainEnglish', 'yourTeam', 'dataPrivacy', 'gettingStarted', 'investment', 'readinessComplete'];
const TIER_KEY = 'tierMatrix';
const TIER_LABELS = ['Copilot Business (standalone add-on)', 'Business Standard + Copilot', 'Business Premium + Copilot'];

const SYSTEM_PROMPT = `You write customer-facing sales copy for MSPs (Managed Service Providers) proposing Microsoft 365 Copilot to SMB clients. This proposal typically follows a completed or in-progress AI Readiness engagement.

Rules you must follow:
- Never use Microsoft marketing language — phrases like "AI-powered productivity," "transform your business," "unlock potential" erode trust with sceptical SMB buyers.
- Be specific, not vague. "Summarises the last 6 months of correspondence on a matter in 30 seconds" beats "improves productivity." Concrete beats abstract every time.
- Industry use cases must be genuinely specific to that vertical — not generic office scenarios with the industry name pasted in.
- NEVER include dollar figures, per-user costs, cost calculations, or breakeven math anywhere in any section. Copilot licensing is added directly in Salesbuildr from the MSP's own catalog with the MSP's real pricing — inventing or referencing costs here would create conflicting numbers and double-entry errors.
- Data privacy: factual and calm, no defensive language, no over-promising.
- Getting started: realistic timeline, no hype.
- Tone depends on the given readiness status: if "completed", be confident and forward-looking; if "in-progress", use parallel-track framing ("as we prepare your environment, here's what's coming"); if "recommended", use a warm plant-the-seed tone without being pushy about it.
- The Forrester benchmark (14–26 minutes saved per user per day) is real and citable in the investment section — use it qualitatively, never to compute a dollar total.
- For SKU/tier feature descriptions: keep claims general and qualitative (e.g. "includes advanced security and compliance controls") rather than asserting precise technical specifics you can't be fully certain of, since Microsoft's exact packaging can change.
- Return JSON only — no preamble, no markdown, no backticks, no explanation. Only the requested JSON object.`;

function sectionInstructions(keys, ctx) {
  const parts = [];

  if (keys.includes('plainEnglish')) {
    parts.push(`"plainEnglish": {
  "headline": string,
  "body": string, 2-3 sentences introducing what Copilot does for this business in plain terms,
  "appHighlights": [
    { "app": string (e.g. "Outlook", "Teams", "Word", "Excel", "PowerPoint"), "description": string, 1 sentence, concrete and specific to ${ctx.industry} }
  ] — 4 to 5 items, the apps most relevant to a ${ctx.industry} business
}`);
  }
  if (keys.includes('yourTeam')) {
    parts.push(`"yourTeam": {
  "headline": string,
  "scenarios": array of 3-4 strings — concrete day-in-the-life scenarios written from a staff member's perspective at a ${ctx.industry} business, specific enough that the reader pictures their own team doing this tomorrow morning. Style example: "Your paralegal asks Copilot to summarise the last 6 months of correspondence on a matter. It produces a one-page brief in 30 seconds."
}`);
  }
  if (keys.includes('dataPrivacy')) {
    parts.push(`"dataPrivacy": {
  "complianceNote": string, 1 sentence — an industry-specific compliance angle for a ${ctx.industry} business (e.g. HIPAA for healthcare, client privilege/confidentiality for legal, regulatory data handling for financial services), calm and factual, no other fields needed
}`);
  }
  if (keys.includes('gettingStarted')) {
    parts.push(`"gettingStarted": {
  "headline": string,
  "steps": array of 4-5 short strings describing the realistic rollout — e.g. Copilot appears inside the apps the team already uses, a roughly 1-hour training session per team, most users productive with basic features within the first week, ${ctx.mspName} handles the technical deployment, ongoing support included
}`);
  }
  if (keys.includes('investment')) {
    parts.push(`"investment": {
  "headline": string,
  "body": string, 2-3 sentences — qualitative time-value framing citing the Forrester benchmark (14–26 minutes saved per user per day). Describe what that means directionally for a team of this size reclaiming meaningful time each week. Absolutely no dollar figures, cost per user, or breakeven math.
}`);
  }
  if (keys.includes('readinessComplete')) {
    parts.push(`"readinessComplete": {
  "headline": string,
  "body": string, 2-3 sentences — a confident statement that the AI Readiness Assessment has been completed and the environment is ready for Copilot deployment. Acknowledge the groundwork without getting technical.
}`);
  }
  if (keys.includes(TIER_KEY)) {
    parts.push(`"tierMatrix": {
  "headline": string,
  "tiers": [
    { "features": array of 3-4 short strings describing what's generally included with "${TIER_LABELS[0]}" },
    { "features": array of 4-5 short strings describing what's generally included with "${TIER_LABELS[1]}" (builds on the previous tier) },
    { "features": array of 5-6 short strings describing what's generally included with "${TIER_LABELS[2]}" (builds on the previous tier, typically stronger security/compliance controls) }
  ]
  — return the tiers array in exactly this order. No pricing, no "name" field, no "recommended" field.
}`);
  }
  return parts.join(',\n');
}

function buildUserMessage(ctx, keys) {
  return `Generate Microsoft 365 Copilot proposal copy for the following context:

Client name: ${ctx.clientName}
Industry: ${ctx.industry}
Company size: ${ctx.companySize}
Copilot SKU being proposed: ${ctx.copilotSku}
Readiness status: ${ctx.readinessStatus}
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

  const { clientName, industry, companySize, copilotSku, readinessStatus, mspName, activeSections, includeTierMatrix, regenSection } = body;

  if (!clientName || !industry || !companySize || !copilotSku || !readinessStatus || !mspName) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName, industry, companySize, copilotSku, readinessStatus and mspName are all required.' }) };
  }

  let keys;
  if (regenSection) {
    keys = [regenSection];
  } else {
    keys = (Array.isArray(activeSections) ? activeSections : []).filter(k => SECTION_KEYS.includes(k));
    if (includeTierMatrix) keys.push(TIER_KEY);
  }

  if (keys.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'No sections selected.' }) };
  }

  const ctx = { clientName, industry, companySize, copilotSku, readinessStatus, mspName };
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
