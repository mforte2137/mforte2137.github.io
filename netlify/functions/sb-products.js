/* ============================================================
   netlify/functions/sb-products.js
   Proxy for Salesbuildr product API — avoids CORS restrictions.
   Forwards requests server-side where CORS does not apply.
   ============================================================ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'POST required.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
    };
  }

  const { tenantUrl, apiKey, size = 100, from = 0 } = body;

  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' }),
    };
  }

  const url = `${tenantUrl}/public-api/product?size=${size}&from=${from}&filters=type:product&sort=-updatedDate`;

  let data;
  try {
    const resp = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr API ${resp.status}: ${txt.slice(0, 200)}` }),
      };
    }

    data = await resp.json();
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      ok: true,
      results: data.results || [],
      total: data.total || 0,
      filters: data.filters || [],
    }),
  };
};
