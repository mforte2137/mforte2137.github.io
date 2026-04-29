// =========================================================
// inspect-widgets.js — Netlify function (TEMPORARY)
// Path: /api/inspect-widgets
// DELETE after we confirm the API structure.
// =========================================================

exports.handler = async (event) => {
  const apiKey         = process.env.SALESBUILDR_API_KEY;
  const integrationKey = process.env.SALESBUILDR_INTEGRATION_KEY;

  if (!apiKey || !integrationKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Missing env vars. Need both SALESBUILDR_API_KEY and SALESBUILDR_INTEGRATION_KEY.'
      })
    };
  }

  try {
    const response = await fetch(
      'https://portal.us1-salesbuildr.com/public-api/quote-widget-template',
      {
        method: 'GET',
        headers: {
          'Content-Type':    'application/json',
          'api-key':         apiKey,
          'integration-key': integrationKey
        }
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ok: true,
        apiStatus:          response.status,
        apiKeyLength:       apiKey.length,
        integrationKeyLength: integrationKey.length,
        data
      }, null, 2)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
