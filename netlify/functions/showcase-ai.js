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
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
  }

  const { mode } = body;
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI is not configured.' }) };
  }

  if (mode === 'summary') {
    return handleSummary(body, claudeApiKey, headers);
  }
  if (mode === 'stuck') {
    return handleStuck(body, claudeApiKey, headers);
  }

  return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'mode must be "summary" or "stuck".' }) };
};

async function handleSummary(body, claudeApiKey, headers) {
  const { updates } = body;
  if (!Array.isArray(updates)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'updates array is required.' }) };
  }

  const systemPrompt = `You are writing a brief weekly standup-style summary for the Salesbuildr development team.
Rules:
- 3 to 5 sentences maximum.
- Cover what's progressing well, what's in exploration, and flag anything stuck.
- Where a "nextStep" is provided for an item, weave in what's planned for next week.
- Name each contributor by first name.
- Tone: upbeat, professional, like a brief standup summary.
- Return plain text only — no markdown, no headings, no preamble.`;

  const userMessage = `Here is the current state of updates across all contributors:\n\n${JSON.stringify(updates, null, 2)}`;

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
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('No text returned from AI.');

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, summary: text.trim() }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Failed to generate summary.' }) };
  }
}

async function handleStuck(body, claudeApiKey, headers) {
  const { featureName, description } = body;
  if (!featureName || !description) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'featureName and description are required.' })
    };
  }

  const systemPrompt = `You are a helpful peer engineer giving a quick nudge to a teammate who is stuck on a feature.
Rules:
- Return 2 to 3 concrete, actionable suggestions — not generic advice.
- Keep it short — this is a quick nudge, not a design document.
- Tone: collaborative, practical, peer-to-peer.
- Return JSON only, no markdown, no backticks, in exactly this shape: {"suggestions": ["...", "...", "..."]}`;

  const userMessage = `Feature: ${featureName}\n\nWhere they're stuck:\n${description}`;

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
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('No text returned from AI.');

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    if (!Array.isArray(parsed.suggestions)) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI response missing suggestions.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, suggestions: parsed.suggestions }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Failed to generate suggestions.' }) };
  }
}
