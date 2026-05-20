exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { system, userMsg } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();

    // Surface API errors clearly
    if (!response.ok) {
      console.error('[matrix-proxy] Anthropic API error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || 'Anthropic API error' })
      };
    }

    const text = data.content?.[0]?.text || '';

    if (!text) {
      console.error('[matrix-proxy] Empty text in response:', JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Empty response from Claude', detail: data })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    };
  } catch (err) {
    console.error('[matrix-proxy] Exception:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
