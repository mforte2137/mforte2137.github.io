// netlify/functions/ai-brief.js
// Generates a QBR conversation brief via Anthropic API (claude-haiku for speed)
// Called by qbr-intel.js — POST /api/ai-brief

exports.handler = async (event) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  // 2. Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' })
    };
  }

  // 3. Validate
  if (!body.prompt || !body.customerName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'prompt and customerName are required.' })
    };
  }

  // 4. Call Anthropic
  const systemPrompt = `You are a QBR coach helping an MSP account manager prepare for a customer conversation. 
Write a concise, practical conversation brief that the account manager can read in 60 seconds before a call.

Rules:
- Plain text only. No markdown, no headers, no bullet points, no asterisks.
- Write exactly 4 short paragraphs separated by blank lines.
- Paragraph 1: One or two sentences on how to open — what to acknowledge, what tone to set.
- Paragraph 2: The most important issue to raise first, and why it should come first (urgency, revenue, or risk).
- Paragraph 3: The second and third topics to cover, and how to sequence them naturally.
- Paragraph 4: How to close — what specific next step to propose and how to phrase it.
- Be direct, specific, and commercial. No platitudes.`;

  let anthropicRes;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: body.prompt }]
      })
    });
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ ok: false, error: 'Failed to reach Anthropic API.' })
    };
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return {
      statusCode: 502,
      body: JSON.stringify({ ok: false, error: `Anthropic API error: ${anthropicRes.status}`, detail: errText })
    };
  }

  const aiData = await anthropicRes.json();
  const brief  = aiData?.content?.[0]?.text || '';

  if (!brief) {
    return {
      statusCode: 502,
      body: JSON.stringify({ ok: false, error: 'Empty response from Anthropic API.' })
    };
  }

  // 5. Return
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ ok: true, brief })
  };
};
