/* ============================================================
   netlify/functions/sb-products.js
   Proxy for Salesbuildr product API — avoids CORS restrictions.
   Fetches products filtered by stock status group so each
   product arrives pre-labelled for triage bucketing.
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

  const { tenantUrl, apiKey, size = 100, from = 0, stockFilter, notQuotedSince } = body;

  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' }),
    };
  }

  // Build filter string
  // stockFilter: e.g. "inStock|onlyDistributor|internal|lowStock"
  // notQuotedSince: ISO date string e.g. "2024-12-02"
  let filters = `productType:product`;
  if (stockFilter) filters += `,stock:${stockFilter}`;
  if (notQuotedSince) filters += `,not-quoted-since:${notQuotedSince}`;

  const url = `${tenantUrl}/public-api/product?size=${size}&from=${from}&filters=${encodeURIComponent(filters)}&sort=-updatedDate`;

  let data;
  try {
    const resp = await fetch(url, {
      headers: {
        'api-key': apiKey,
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
