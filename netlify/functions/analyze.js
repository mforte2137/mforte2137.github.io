// =========================================================
// Proposal Evaluator — serverless analyze endpoint
// Path on the live site: /api/analyze
//   (netlify.toml redirects /api/* to /.netlify/functions/*)
//
// Current state: "hello Claude" verification.
// Sends a tiny, hardcoded prompt to Anthropic's API and
// returns Claude's response. Proves that:
//   1. The API key is valid
//   2. Netlify can reach api.anthropic.com
//   3. The response shape is what we'll need later
//
// The real proposal-analysis logic will be added in the next
// step once we've confirmed this works end to end.
// =========================================================

exports.handler = async (event) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: 'Say hello in one short sentence and confirm which Claude model you are.'
          }
        ]
      })
    });

    // If Anthropic returns an error (bad key, rate limit, etc.),
    // surface it clearly instead of throwing a generic 500.
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: `Anthropic API returned ${response.status}`,
          details: errorText
        })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ok: true,
        message: 'Claude responded successfully.',
        claudeReply: data.content[0].text,
        model: data.model,
        usage: data.usage,
        timestamp: new Date().toISOString()
      })
    };
  } catch (err) {
    // Network errors, JSON parse errors, etc.
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Function threw an error',
        details: err.message
      })
    };
  }
};
