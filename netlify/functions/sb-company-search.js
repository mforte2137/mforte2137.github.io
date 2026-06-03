/* ============================================================
   netlify/functions/sb-company-search.js
   Searches for a company by name and returns its ID.
   Used by manufacturer fix to resolve name → company ID
   before sending vendor: companyId to the product PUT.
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

  const { tenantUrl, apiKey, query } = body;

  if (!tenantUrl || !apiKey || !query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl, apiKey, and query are required.' }),
    };
  }

  try {
    // Try manufacturer type first
    const url = `${tenantUrl}/public-api/company?query=${encodeURIComponent(query)}&filters=type:manufacturer&size=10`;
    const resp = await fetch(url, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr ${resp.status}: ${txt.slice(0, 200)}` }),
      };
    }

    const data = await resp.json();
    const results = data.results || [];

    // Exact match first, then first result
    const exact = results.find(c => c.name.toLowerCase() === query.toLowerCase());
    const match = exact || results[0];

    if (match) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, companyId: match.id, companyName: match.name }),
      };
    }

    // Fallback — search without type filter
    const url2 = `${tenantUrl}/public-api/company?query=${encodeURIComponent(query)}&size=10`;
    const resp2 = await fetch(url2, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    });

    if (resp2.ok) {
      const data2 = await resp2.json();
      const results2 = data2.results || [];
      const exact2 = results2.find(c => c.name.toLowerCase() === query.toLowerCase());
      const match2 = exact2 || results2[0];
      if (match2) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ ok: true, companyId: match2.id, companyName: match2.name }),
        };
      }
    }

    // Not found
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, companyId: null, error: `"${query}" not found as a company in Salesbuildr.` }),
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
