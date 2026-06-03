/* ============================================================
   netlify/functions/sb-company.js
   Fetches the MSP's own company record (type:msp) to get
   the company name used as the default manufacturer on import.
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

  const { tenantUrl, apiKey } = body;
  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' }),
    };
  }

  try {
    const url = `${tenantUrl}/public-api/company?filters=type:msp&size=1`;
    const resp = await fetch(url, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr API ${resp.status}: ${txt.slice(0, 200)}` }),
      };
    }

    const data = await resp.json();
    const results = data.results || [];
    const mspName = results[0]?.name || null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, mspName }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
