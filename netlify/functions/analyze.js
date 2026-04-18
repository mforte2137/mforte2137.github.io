// =========================================================
// Proposal Evaluator — serverless analyze endpoint
// Path on the live site: /api/analyze
//   (netlify.toml redirects /api/* to /.netlify/functions/*)
//
// Current state: "hello world" verification.
// Confirms three things before we add the real Claude call:
//   1. Netlify deploys the function to the expected URL
//   2. The function reads ANTHROPIC_API_KEY from env vars
//   3. The frontend (or browser) can reach it and get JSON back
//
// The real Anthropic API call will be wired in the next step.
// =========================================================

exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      ok: true,
      message: 'Evaluator function is live.',
      apiKeyDetected: !!process.env.ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
      method: event.httpMethod
    })
  };
};
