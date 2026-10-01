/* ============================================================
   netlify/functions/sb-update-product.js
   Updates a product's vendor by looking up the company ID first,
   then sending vendorId in the PUT call.
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

  const { tenantUrl, apiKey, productId, fields, skipLookup } = body;

  if (!tenantUrl || !apiKey || !productId || !fields) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl, apiKey, productId, and fields are required.' }),
    };
  }

  // If vendor name provided and not skipping lookup, resolve to company ID
  let resolvedFields = { ...fields };

  if (fields.vendor && !fields.vendorId && !skipLookup) {
    try {
      const compUrl = `${tenantUrl}/public-api/company?query=${encodeURIComponent(fields.vendor)}&size=20`;
      const compResp = await fetch(compUrl, {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      });

      if (compResp.ok) {
        const compData = await compResp.json();
        const results = compData.results || [];

        // Prefer exact name match, then priority: supplier > manufacturer > distributor
        const exactMatches = results.filter(c =>
          c.name.toLowerCase() === fields.vendor.toLowerCase()
        );
        const pool = exactMatches.length > 0 ? exactMatches : results;
        const typePriority = ['supplier', 'manufacturer', 'distributor'];
        let match = null;
        for (const type of typePriority) {
          match = pool.find(c => c.type === type);
          if (match) break;
        }
        if (!match) match = pool[0];

        if (match) {
          resolvedFields.vendor = match.id;
        }
      }
    } catch (e) {
      console.error('Company lookup failed:', e);
    }
  }

  // If vendor is still a name string (lookup failed), return error
  if (resolvedFields.vendor === fields.vendor && !skipLookup) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok: false,
        error: `"${fields.vendor}" was not found as a company in Salesbuildr. Add it as a company (Manufacturer type) in SB first, then click Update All again.`,
      }),
    };
  }

  try {
    const resp = await fetch(`${tenantUrl}/public-api/product/${productId}`, {
      method: 'PUT',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(resolvedFields),
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, productId, vendor: resolvedFields.vendor }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
