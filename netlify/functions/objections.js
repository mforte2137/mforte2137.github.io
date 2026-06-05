// =========================================================
// Salesbuildr Widget Creator — objections.js
//
// FILE LOCATION: netlify/functions/objections.js
// URL ROUTE:     /api/objections  (Netlify maps functions/ to /api/ automatically)
//
// Accepts POST { fields }
//   fields — guided form data (solution, business, size,
//            trigger, outcomes, urgency)
//
// Returns { ok: true, text: "..." }
//
// Model: claude-haiku-4-5-20251001
// Haiku is used deliberately: the output is plain text
// (not HTML), the prompt is compact, and speed matters
// more than elaboration here. Stays well inside the
// Netlify 10s function timeout.
// =========================================================

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON in request body.' })
    };
  }

  const { fields } = body;
  if (!fields || !fields.solution || !fields.business) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Request must include fields.solution and fields.business.' })
    };
  }

  const userMessage = `You are a senior MSP sales coach. Based on the following proposal context, write a concise private coaching note for the sales rep.

List the 4–6 most likely objections the customer will raise during or after reviewing this proposal, and give a short, practical response to each.

=== PROPOSAL CONTEXT ===
Service proposed: ${fields.solution}
Customer: ${fields.business}${fields.size ? `, ${fields.size}` : ''}${fields.trigger  ? `\nTrigger: ${fields.trigger}`           : ''}${fields.outcomes ? `\nDesired outcomes: ${fields.outcomes}` : ''}${fields.urgency  ? `\nUrgency: ${fields.urgency}`             : ''}

=== FORMAT ===
For each objection use exactly this format:

OBJECTION: [their likely words — quote how a real person would say it]
RESPONSE: [how to handle it — practical and specific, 2–3 sentences, not generic advice]

Rules:
- Start directly with the first objection. No preamble, no sign-off.
- Keep responses grounded in the specific proposal context above.
- Do not repeat the same advice across multiple responses.
- Plain text only — no markdown, no bullet symbols, no bold.`;

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 900,
        messages:   [{ role: 'user', content: userMessage }]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return {
        statusCode: anthropicResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: `Anthropic API returned ${anthropicResponse.status}`,
          details: errorText
        })
      };
    }

    const data = await anthropicResponse.json();
    const text = Array.isArray(data.content)
      ? data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
      : '';

    if (!text) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'No text content returned from Claude.' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Function threw an error.', details: err.message })
    };
  }
};
