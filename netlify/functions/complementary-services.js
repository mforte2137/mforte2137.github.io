exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  const { project, mode, customDescription } = body;

  if (!project && !customDescription) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'project or customDescription is required.' }) };
  }

  const systemPrompt = mode === 'custom'
    ? `You are an experienced MSP services advisor helping build a compelling service description for a proposal widget.
The MSP has described a service they want to add. Return a single JSON object only — no preamble, no markdown, no backticks:
{"name":"...","description":"...","priority":"recommended"}
Rules:
- name: short, generic service name (2–5 words, no vendor names)
- description: 1–2 sentences, buyer-focused, explains the business value and risk of not having it. Compelling but not pushy.
- priority: always "recommended" for custom services`
    : `You are an experienced MSP services advisor helping build a customer-facing proposal widget.
The MSP is proposing the project described. Return exactly 4 complementary services as a JSON array only — no preamble, no markdown, no backticks:
[{"name":"...","description":"...","priority":"recommended"|"optional"}]
Rules:
- name: short, generic service name (2–5 words, never vendor-specific e.g. "Email Backup" not "Veeam for M365")
- description: 1–2 sentences, buyer-focused language. Explain the business risk or value — make it a genuine reason to consider the service, not a sales slogan.
- priority: "recommended" for the 2 most critical follow-on services, "optional" for the other 2
- Order by how commonly and urgently the service follows the described project
- Never repeat the primary project as a suggestion`;

  const userMessage = mode === 'custom'
    ? `Build a service card for: ${customDescription}`
    : `Project being proposed: ${project}`;

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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI service error. Please try again.' }) };
    }

    const text = data.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, result: parsed }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'Unexpected error. Please try again.' }),
    };
  }
};
