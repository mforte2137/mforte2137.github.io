// =========================================================
// account-growth.js — Netlify function
// Path: /api/account-growth
//
// Accepts POST body:
// {
//   clientName, industry, currentCoverage[], recommendedAddition[],
//   trigger, triggerDetail, includeExecutiveSummary,
//   regenWidget: 'growth' | 'exec'  (optional — regenerate just one widget)
// }
//
// Always generates both widgets in one AI call (regardless of the
// includeExecutiveSummary toggle) unless regenWidget narrows the request
// to a single widget. The toggle only controls what the frontend shows/pushes.
// =========================================================

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

  const {
    clientName,
    industry,
    currentCoverage,
    recommendedAddition,
    trigger,
    triggerDetail,
    regenWidget
  } = body;

  if (!industry) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'industry is required.' }) };
  }
  if (!Array.isArray(currentCoverage) || currentCoverage.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'currentCoverage is required.' }) };
  }
  if (!Array.isArray(recommendedAddition) || recommendedAddition.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'recommendedAddition is required.' }) };
  }
  if (!trigger) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'trigger is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };
  }

  const wantGrowth = regenWidget !== 'exec';
  const wantExec   = regenWidget !== 'growth';

  const systemPrompt = buildSystemPrompt({ wantGrowth, wantExec });
  const userMessage = JSON.stringify({
    clientName: clientName || null,
    industry,
    currentCoverage,
    recommendedAddition,
    trigger,
    triggerDetail: triggerDetail || null
  });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: (data && data.error && data.error.message) || 'AI request failed.' }) };
    }

    const text = data.content && data.content[0] && data.content[0].text || '';

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    const result = { ok: true };
    if (wantGrowth && parsed.growthWidget) result.growthWidget = parsed.growthWidget;
    if (wantExec && parsed.executiveSummary) result.executiveSummary = parsed.executiveSummary;

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};

function buildSystemPrompt({ wantGrowth, wantExec }) {
  const parts = [];

  parts.push(
    `You are a virtual CIO writing on behalf of an MSP (managed service provider), making the business case for a service upgrade to an existing client.`,
    `You will receive: clientName (may be null), industry, currentCoverage (array of services the client already has), recommendedAddition (array of services being proposed — the delta between currentCoverage and recommendedAddition is the upgrade story), trigger (why now), and triggerDetail (optional one-line specific context).`,
    ``,
    `Rules that apply to everything you write:`,
    `- Never mention specific product or vendor names. Say "endpoint protection" not a brand name, "email filtering" not a brand name.`,
    `- Never include pricing or cost figures.`,
    `- Use genuine industry context: healthcare should reference patient data and trust, legal should reference client confidentiality and privilege, finance should reference regulatory exposure, and so on for other industries.`,
    `- The gap between currentCoverage and recommendedAddition is the story — reference it specifically, not generically.`,
    `- Return ONLY valid JSON. No preamble, no markdown, no code fences.`
  );

  if (wantGrowth) {
    parts.push(
      ``,
      `Write "growthWidget" — for the decision-maker already in the conversation. Advisory, confident, partner-like tone, like a trusted vCIO speaking to a client they know. 2-4 sentences per field.`,
      `Fields:`,
      `- headline: short punchy headline for the recommendation (e.g. "Your Next Step — A Stronger Security Foundation")`,
      `- currentState: acknowledge what the client already has today, framed as a solid foundation, not a criticism`,
      `- triggerContext: introduce the trigger naturally so the timing feels logical, not manufactured`,
      `- recommendation: frame the upgrade as the natural next step, name the specific gap honestly and without alarmism`,
      `- businessOutcome: one clear statement, in business terms only, of what changes for the client once this is in place`
    );
  }

  if (wantExec) {
    parts.push(
      ``,
      `Write "executiveSummary" — a one-page snapshot for someone who is NOT in the room (a CEO, CFO, or board member who gets this forwarded). No technical terms whatsoever — describe technical items in plain business language (e.g. "advanced threat protection on every device" instead of any technical/product term). Four short, confident statements, one sentence each. This is a leave-behind, not a report.`,
      `Fields:`,
      `- headline: short headline (e.g. "IT Advisory Summary — [Client]")`,
      `- snapshot: one sentence — what we manage for you today`,
      `- recommendation: one sentence — what we're recommending`,
      `- riskIfDelayed: one sentence — the business risk if this is delayed, framed in the language of that industry's leadership`,
      `- nextStep: one sentence — what happens next`
    );
  }

  parts.push(
    ``,
    `Respond with a JSON object containing${wantGrowth && wantExec ? ' "growthWidget" and "executiveSummary"' : wantGrowth ? ' only "growthWidget"' : ' only "executiveSummary"'}, each an object with exactly the fields listed above (plus include the client name in the headline naturally if one was given).`
  );

  return parts.join('\n');
}
