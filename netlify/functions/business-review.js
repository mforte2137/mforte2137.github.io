// netlify/functions/business-review.js
// Generates the AI narrative for all active business-review sections in one call.

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

  const session = body.session;
  if (!session || !session.clientName) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'session.clientName is required.' }) };
  }
  const sections = session.sections || {};
  const activeKeys = Object.keys(sections);
  if (!activeKeys.length) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one active section is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI is not configured. Missing API key.' }) };
  }

  const isAnnual = /annual/i.test(session.reviewType || '');

  // Work out whether the proposed investment is going up, down, or staying flat,
  // and tell the model explicitly rather than leaving it to infer direction from
  // two loosely-formatted currency strings — a decrease deserves very different
  // framing than an increase, and the model shouldn't guess wrong.
  function parseMoney(str) {
    if (!str) return null;
    const m = String(str).replace(/,/g, '').match(/[\d.]+/);
    return m ? parseFloat(m[0]) : null;
  }
  if (sections.investmentSummary) {
    const current = parseMoney(sections.investmentSummary.currentMonthlyInvestment);
    const proposed = parseMoney(sections.investmentSummary.proposedNextPeriod);
    let direction = 'unknown';
    if (current !== null && proposed !== null) {
      if (proposed < current) direction = 'decrease';
      else if (proposed > current) direction = 'increase';
      else direction = 'flat';
    }
    sections.investmentSummary._computedDirection = direction;
  }

  const systemPrompt = `You write client-facing business review content for an MSP (managed service provider) preparing for a client business review meeting.

Voice and rules:
- Write for a business owner — no technical jargon, no acronyms without a plain-language explanation.
- Every section must open with a strong, specific headline — never generic like "Your Q2 Review". Reference the client name, period, or a real detail from the inputs.
- Stats and numbers are the most persuasive part of a business review — feature them prominently whenever they are provided.
- If stats are missing for a field, write a strong qualitative narrative instead — never invent numbers or specific figures that were not given to you.
- Tone: confident, warm, and partner-like — this is a relationship conversation, not a compliance report.
- ${isAnnual ? 'This is an annual/strategic review — write in a more reflective, strategic tone, looking back across the full period.' : 'This is a quarterly/project check-in — keep the tone focused and action-oriented.'}
- For Recommended Services: lead every recommendation with the business benefit, not the product name. Reference specific gaps or risks identified elsewhere in the review inputs where relevant.
- For Investment Summary specifically, the input includes a "_computedDirection" field ("increase", "decrease", "flat", or "unknown") comparing the current monthly investment to the proposed figure. Follow it exactly — do not contradict it or soften a decrease into vague language like "slight adjustment" that obscures which direction it's moving:
  - "decrease": Say plainly and early that the monthly investment is going down. Give the concrete reason from the inputs (e.g. a project rolling off, work moving from active buildout to steady-state support). Explicitly reassure the client that their level of service is not being reduced — a lower bill should read as good stewardship, not a downgrade.
  - "increase": Say plainly that the investment is going up, and explain what new scope, risk, or work is driving it.
  - "flat": Reinforce the value already being delivered at the current level; do not imply any change.
  - "unknown": No usable numbers were given — write a value-focused narrative without stating a direction or inventing figures.
- Return JSON only. No preamble, no markdown formatting, no code fences, no commentary — just the raw JSON object.

Only include keys in your response for the sections present in the input. Use exactly this shape per section key:

periodInReview: { "headline": string, "narrative": string, "stats": string[] }
securityPosture: { "headline": string, "narrative": string, "riskLevel": string, "highlights": string[] }
whatWeDelivered: { "headline": string, "narrative": string, "wins": string[] }
technologyHealth: { "headline": string, "narrative": string, "rating": string, "alerts": string[] }
lookingAhead: { "headline": string, "narrative": string, "priorities": string[] }
investmentSummary: { "headline": string, "narrative": string }
recommendedServices: { "headline": string, "narrative": string, "recommendations": [{ "name": string, "reason": string, "urgency": string }] }

Arrays of stats/highlights/wins/alerts/priorities should have 2-4 short items each, written as short phrases (e.g. "847 tickets resolved", "Zero incidents"). recommendedServices.recommendations should have 2-4 items.`;

  const userMessage = JSON.stringify({
    clientName: session.clientName,
    reviewPeriod: session.reviewPeriod,
    reviewType: session.reviewType,
    mspName: session.mspName,
    industry: session.industry,
    activeSections: sections
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
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `AI request failed: ${errText.slice(0, 300)}` }) };
    }

    const data = await response.json();
    const text = data.content && data.content[0] && data.content[0].text;
    if (!text) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI returned an empty response.' }) };
    }

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, generated: parsed }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error calling AI.' }) };
  }
};
