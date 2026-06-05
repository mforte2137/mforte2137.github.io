/* ============================================================
   netlify/functions/sb-create-company.js
   Creates a new company in Salesbuildr.
   Required: name, number, type
   ============================================================ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { tenantUrl, apiKey, name, website, number } = body;

  if (!tenantUrl || !apiKey || !name) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'tenantUrl, apiKey, and name are required.' }) };
  }

  const payload = {
    name,
    type: 'manufacturer',
    number: number || name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20),
    website: website || `https://www.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
  };

  try {
    const resp = await fetch(`${tenantUrl}/public-api/company`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr ${resp.status}: ${JSON.stringify(data).slice(0, 200)}` }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, companyId: data.id, companyName: data.name }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
