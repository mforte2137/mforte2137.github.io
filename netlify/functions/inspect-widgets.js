// =========================================================
// inspect-widgets.js — Netlify function (TEMPORARY)
// Path: /api/inspect-widgets
// DELETE after we confirm the API structure.
// =========================================================

exports.handler = async (event) => {
  const apiKey = process.env.SALESBUILDR_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'SALESBUILDR_API_KEY not set.' })
    };
  }

  try {
    const response = await fetch(
      'https://portal.us1-salesbuildr.com/public-api/quote-widget-template',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'integration-key': apiKey
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
        apiStatus: response.status,
        keyLength: apiKey.length,
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
