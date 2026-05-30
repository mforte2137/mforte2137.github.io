// netlify/functions/security-ai.js
// Generates AI content for security proposal widgets

exports.handler = async (event) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  // 2. Parse body
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  // 3. Validate
  if (!body.prompt) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'prompt is required.' }) };
  }

  // 4. Call Anthropic — use Sonnet for quality structured HTML output
  let aiResponse;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system:     'You are a cybersecurity consultant writing content for MSP security proposals. Return ONLY valid JSON as instructed. No markdown fences, no preamble, no commentary.',
        messages:   [{ role: 'user', content: body.prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: `Anthropic error: ${res.status}`, detail: err }) };
    }

    const data = await res.json();
    const content = data.content?.[0]?.text ?? '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, content })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
