/* =============================================
   Technology Roadmap Builder — Netlify Function
   netlify/functions/technology-roadmap.js
   ============================================= */

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

  if (!body.clientName) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };
  }

  // Build structured discovery summary for the prompt
  const isProspect  = body.clientType !== 'existing';
  const clientLabel = isProspect ? 'prospect' : 'existing customer';
  const toneNote    = isProspect
    ? 'Tone: aspirational and collaborative — use "together", "we\'ll", "your goals". Frame as a vision the MSP will help them achieve.'
    : 'Tone: continuation and strategic — reference the established partnership, frame as evolution not replacement. Use "as we continue", "our next chapter".';

  const phases = (body.phases || []).filter(p => p.services && p.services.length > 0);
  const phaseSummary = phases.map(p =>
    `Phase ${p.number}${p.label ? ` (${p.label})` : ''}: ${p.timeframe || 'TBD'} | Priority: ${p.priority || 'Not set'} | Services: ${p.services.join(', ')}`
  ).join('\n');

  const stackEntries = Object.entries(body.stack || {})
    .filter(([k, v]) => v && k !== 'notes')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const systemPrompt = `You are an expert MSP copywriter generating executive-facing technology roadmap content. Return ONLY valid JSON — no preamble, no markdown, no backticks.

RULES:
- Write for a business owner or executive — no technical jargon, no unexplained acronyms
- ${toneNote}
- Roadmap phase outcomes are the most important part — each must be a clear business benefit, not a technical description
- Business outcomes must map directly to the goals provided — do not invent goals
- Investment Summary: frame as budget phasing and business value — never mention specific prices
- Industry context must be woven into the content — a healthcare roadmap reads very differently from a construction roadmap
- Keep every widget concise — executives scan, not read. Short paragraphs, clear structure.
- Return JSON only — no preamble, no markdown, no backticks

Return this exact JSON shape:
{
  "whereYouAreToday": {
    "headline": "...",
    "body": "Two to three short paragraphs separated by newline characters (\\n). Acknowledge strengths before gaps. Written empathetically — an honest picture that makes the roadmap feel necessary, not a list of failures."
  },
  "roadmap": {
    "headline": "Your Technology Roadmap",
    "phases": [
      {
        "label": "Phase label (use provided label or suggest one like Stabilise/Optimise/Transform)",
        "timeframe": "...",
        "priority": "...",
        "services": ["Service 1", "Service 2", "Service 3"],
        "outcome": "One sentence — a clear business benefit, not a technical description."
      }
    ]
  },
  "businessOutcomes": {
    "headline": "What This Means for Your Business",
    "outcomes": [
      { "goal": "Goal name", "result": "One sentence outcome written in the client's language." }
    ]
  },
  "investmentSummary": {
    "headline": "Phased Investment Overview",
    "body": "Three to four sentences max. Frame the financial commitment as a phased, planned investment. Close with a confident forward statement. No specific prices. Use the budget range only to frame scale if provided."
  }
}`;

  const userMessage = `Generate technology roadmap content for the following:

Client: ${body.clientName}
Client type: ${clientLabel}
Industry: ${body.industry || 'Not specified'}
Company size: ${body.companySize || 'Not specified'}
Locations: ${body.locationCount || 'Not specified'}

Current stack: ${stackEntries || 'Not assessed'}
${body.stack?.notes ? `Stack notes: ${body.stack.notes}` : ''}

Business goals: ${(body.goals || []).join(', ') || 'Not specified'}

Roadmap phases:
${phaseSummary || 'No phases defined'}

Budget range: ${body.budget || 'Not disclosed'}
Constraints: ${(body.constraints || []).join(', ') || 'None'}
${body.notes ? `Additional notes: ${body.notes}` : ''}`;

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API error: ' + errText.slice(0, 200) }) };
    }

    const aiData = await aiRes.json();
    const text   = aiData.content?.[0]?.text || '';

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Raw: ' + text.slice(0, 300) }) };
    }

    // Validate shape
    if (!parsed.whereYouAreToday || !parsed.roadmap || !parsed.businessOutcomes || !parsed.investmentSummary) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI response missing required sections.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        whereYouAreToday:  parsed.whereYouAreToday,
        roadmap:           parsed.roadmap,
        businessOutcomes:  parsed.businessOutcomes,
        investmentSummary: parsed.investmentSummary
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
