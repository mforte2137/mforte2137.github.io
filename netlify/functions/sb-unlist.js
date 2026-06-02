/* ============================================================
   netlify/functions/sb-unlist.js
   Proxy for Salesbuildr product PUT — sets listed:false.
   Server-side call avoids CORS restrictions.
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

  const { tenantUrl, apiKey, productId } = body;

  if (!tenantUrl || !apiKey || !productId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl, apiKey, and productId are required.' }),
    };
  }

  try {
    const resp = await fetch(`${tenantUrl}/public-api/product/${productId}`, {
      method: 'PUT',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listed: false }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr ${resp.status}: ${txt.slice(0, 200)}` }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ ok: true, productId }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
