// =========================================================
// inspect-widgets.js — Netlify function (TEMPORARY)
// Path: /api/inspect-widgets
//
// Fetches all widget templates from the Salesbuildr API
// and returns the raw JSON so we can see the exact
// structure needed to create html-content widgets.
//
// DELETE THIS FILE once we have the structure we need.
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
    const response = await fetch('https://portal.salesbuildr.com/public-api/quote-widget-template', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, status: response.status, data }, null, 2)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
