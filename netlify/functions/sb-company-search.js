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
    // Search all company types — no filter, get all matches
    const url = `${tenantUrl}/public-api/company?query=${encodeURIComponent(query)}&size=20`;
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

    if (results.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, companyId: null, error: `"${query}" not found as a company in Salesbuildr.` }),
      };
    }

    // Exact name matches only
    const exactMatches = results.filter(c =>
      c.name.toLowerCase() === query.toLowerCase()
    );
    const pool = exactMatches.length > 0 ? exactMatches : results;

    // Priority: supplier > manufacturer > distributor > other
    // Supplier type is used by distributor-linked companies in SB
    const typePriority = ['supplier', 'manufacturer', 'distributor'];
    let match = null;
    for (const type of typePriority) {
      match = pool.find(c => c.type === type);
      if (match) break;
    }
    if (!match) match = pool[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, companyId: match.id, companyName: match.name, companyType: match.type }),
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
