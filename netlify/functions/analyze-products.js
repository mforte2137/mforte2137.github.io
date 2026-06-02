/* ============================================================
   netlify/functions/analyze-products.js
   Receives a batch of products, sends to Claude Haiku for
   cleanup triage classification, returns structured JSON.
   ============================================================ */

exports.handler = async (event) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'POST required.' }),
    };
  }

  // 2. Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
    };
  }

  // 3. Validate
  if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'products array is required.' }),
    };
  }

  if (!body.prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'prompt is required.' }),
    };
  }

  // 4. Call Claude Haiku
  let aiResult;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'You are a product catalog analyst. You respond ONLY with valid JSON arrays. No preamble, no markdown, no explanation outside the JSON structure.',
        messages: [{ role: 'user', content: body.prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    aiResult = data.content?.[0]?.text || '';
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `AI call failed: ${err.message}` }),
    };
  }

  // 5. Return
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ ok: true, result: aiResult }),
  };
};
