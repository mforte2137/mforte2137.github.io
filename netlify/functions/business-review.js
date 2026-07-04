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

  const systemPrompt = `You write client-facing business review content for an MSP (managed service provider) preparing for a client business review meeting.

Voice and rules:
- Write for a business owner — no technical jargon, no acronyms without a plain-language explanation.
- Every section must open with a strong, specific headline — never generic like "Your Q2 Review". Reference the client name, period, or a real detail from the inputs.
- Stats and numbers are the most persuasive part of a business review — feature them prominently whenever they are provided.
- If stats are missing for a field, write a strong qualitative narrative instead — never invent numbers or specific figures that were not given to you.
- Tone: confident, warm, and partner-like — this is a relationship conversation, not a compliance report.
- ${isAnnual ? 'This is an annual/strategic review — write in a more reflective, strategic tone, looking back across the full period.' : 'This is a quarterly/project check-in — keep the tone focused and action-oriented.'}
- For Recommended Services: lead every recommendation with the business benefit, not the product name. Reference specific gaps or risks identified elsewhere in the review inputs where relevant.
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
