const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const { project, mode, customDescription } = body;

  if (!project && !customDescription) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'project or customDescription is required.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    console.error('No API key found — set CLAUDE_API_KEY or ANTHROPIC_API_KEY in Netlify environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: 'Claude API key is not configured' }),
      headers: { 'Content-Type': 'application/json' }
    };
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

  console.log(`Complementary services request — mode: ${mode || 'suggest'}, project: ${project}`);

  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      data: {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      },
      timeout: 25000
    });

    console.log('Received response from Claude API');

    const text = response.data.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result: parsed }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };

  } catch (error) {
    console.error('Claude API error:', error.message);
    return {
      statusCode: 502,
      body: JSON.stringify({
        ok: false,
        error: 'Error generating suggestions',
        message: error.message,
        status: error.response ? error.response.status : 'unknown',
        data: error.response && error.response.data ? error.response.data : null
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
