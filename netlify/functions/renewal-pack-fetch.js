// =========================================================
// renewal-pack-fetch.js — Netlify function
// Path: /api/renewal-pack-fetch
//
// Fetches a single Salesbuildr quote by ID.
// Credentials come from the request body — never stored server-side.
// Quote ID can be passed directly or extracted from a full URL
// before calling this function (frontend handles extraction).
//
// Returns the full quote object so the frontend can render
// the items checklist and meta panel.
// =========================================================

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { quoteId, apiKey, tenantUrl } = body;

  if (!quoteId)    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'quoteId is required.' }) };
  if (!apiKey)     return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'apiKey is required.' }) };
  if (!tenantUrl)  return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'tenantUrl is required.' }) };

  const base = tenantUrl.replace(/\/+$/, '');
  const url  = `${base}/public-api/quote/${encodeURIComponent(quoteId)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    if (res.status === 404) {
      return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: `Quote "${quoteId}" not found. Check the URL or ID and try again.` }) };
    }
    if (res.status === 401 || res.status === 403) {
      return { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: 'Authentication failed. Check your API key.' }) };
    }
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { statusCode: res.status, headers, body: JSON.stringify({ ok: false, error: errBody.message || `Salesbuildr returned ${res.status}` }) };
    }

    const quote = await res.json();

    // Return the full quote — the frontend decides what to show
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, quote })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
