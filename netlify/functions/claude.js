exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured in Netlify environment variables.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const useWebSearch = body.use_web_search === true;
    delete body.use_web_search;

    // For non-search requests, pass straight through as before
    if (!useWebSearch) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    // ── Web search flow (multi-turn) ──────────────────────────────────────
    // Round 1: send with web_search tool — Claude will call it
    const round1Body = {
      ...body,
      max_tokens: 4000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5
        }
      ]
    };

    const r1 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(round1Body)
    });

    const d1 = await r1.json();

    if (!r1.ok) {
      return {
        statusCode: r1.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d1)
      };
    }

    // If Claude stopped without tool use, return the text directly
    if (d1.stop_reason !== 'tool_use') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d1)
      };
    }

    // Round 2: send tool results back so Claude can produce a final answer
    const round2Body = {
      ...body,
      max_tokens: 4000,
      tools: round1Body.tools,
      messages: [
        ...body.messages,
        { role: 'assistant', content: d1.content }
      ]
    };

    const r2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(round2Body)
    });

    const d2 = await r2.json();

    // If another tool_use round is needed (rare), do one more
    if (d2.stop_reason === 'tool_use') {
      const round3Body = {
        ...body,
        max_tokens: 4000,
        tools: round1Body.tools,
        messages: [
          ...body.messages,
          { role: 'assistant', content: d1.content },
          { role: 'assistant', content: d2.content }
        ]
      };

      const r3 = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(round3Body)
      });

      const d3 = await r3.json();
      return {
        statusCode: r3.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d3)
      };
    }

    return {
      statusCode: r2.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d2)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
