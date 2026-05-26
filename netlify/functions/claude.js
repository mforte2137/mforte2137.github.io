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

    const requestBody = { ...body };

    if (useWebSearch) {
      requestBody.tools = [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3
        }
      ];
      // Ask for more tokens so web search results + final answer fit
      requestBody.max_tokens = 3000;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    // When web search is used the response content array contains a mix of
    // text blocks, web_search_tool_use blocks, and web_search_tool_result blocks.
    // Extract only the text blocks and join them as the final answer.
    if (useWebSearch && Array.isArray(data.content)) {
      const textOnly = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n\n');

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          content: [{ type: 'text', text: textOnly }]
        })
      };
    }

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
