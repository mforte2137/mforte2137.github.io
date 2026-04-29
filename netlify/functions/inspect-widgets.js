// =========================================================
// inspect-widgets.js — diagnostic, tries multiple auth
// methods so we can identify the correct one.
// DELETE after we find what works.
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

  const BASE = 'https://portal.us1-salesbuildr.com/public-api/quote-widget-template';

  // Try four different auth approaches in parallel
  const attempts = [
    { method: 'integration-key header',    headers: { 'Content-Type': 'application/json', 'integration-key': apiKey } },
    { method: 'Authorization Bearer',      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
    { method: 'Authorization plain',       headers: { 'Content-Type': 'application/json', 'Authorization': apiKey } },
    { method: 'x-api-key header',          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey } },
  ];

  const results = await Promise.all(
    attempts.map(async ({ method, headers }) => {
      try {
        const res  = await fetch(BASE, { method: 'GET', headers });
        const body = await res.json();
        return { method, status: res.status, body };
      } catch (err) {
        return { method, error: err.message };
      }
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, keyLength: apiKey.length, results }, null, 2)
  };
};
