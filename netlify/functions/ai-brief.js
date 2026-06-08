// netlify/functions/ai-brief.js
// Generates AI briefs for the Customer Growth Operating System
// POST /api/ai-brief  — accepts { customerName, prompt, systemPrompt }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  if (!body.prompt || !body.customerName) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'prompt and customerName are required.' }) };
  }

  const systemPrompt = body.systemPrompt || `You are a QBR coach helping an MSP account manager prepare for a customer conversation.
Write a concise, practical conversation brief. Plain text only — no markdown, no headers, no bullets.
Write 4 short paragraphs: opening, first topic, second/third topics, close with next step. Be direct and commercial.`;

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
        max_tokens: 700,
        system: systemPrompt,
        messages: [{ role: 'user', content: body.prompt }]
      })
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Failed to reach Anthropic API.' }) };
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: `Anthropic error ${anthropicRes.status}`, detail: errText }) };
  }

  const aiData = await anthropicRes.json();
  const brief  = aiData?.content?.[0]?.text || '';

  if (!brief) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Empty response from Anthropic.' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, brief })
  };
};
