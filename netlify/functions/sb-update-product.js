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

  const { tenantUrl, apiKey, productId, fields } = body;

  if (!tenantUrl || !apiKey || !productId || !fields) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'tenantUrl, apiKey, productId, and fields are required.' }),
    };
  }

  // If vendor name provided, look up the company ID first
  let resolvedFields = { ...fields };

  if (fields.vendor && !fields.vendorId) {
    try {
      const compUrl = `${tenantUrl}/public-api/company?query=${encodeURIComponent(fields.vendor)}&filters=type:manufacturer&size=5`;
      const compResp = await fetch(compUrl, {
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      });

      if (compResp.ok) {
        const compData = await compResp.json();
        const results = compData.results || [];

        // Find exact match first, then fallback to first result
        const exact = results.find(c =>
          c.name.toLowerCase() === fields.vendor.toLowerCase()
        );
        const match = exact || results[0];

        if (match) {
          resolvedFields.vendorId = match.id;
        } else {
          // No manufacturer found — try without type filter
          const compUrl2 = `${tenantUrl}/public-api/company?query=${encodeURIComponent(fields.vendor)}&size=5`;
          const compResp2 = await fetch(compUrl2, {
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
          });
          if (compResp2.ok) {
            const compData2 = await compResp2.json();
            const results2 = compData2.results || [];
            const exact2 = results2.find(c =>
              c.name.toLowerCase() === fields.vendor.toLowerCase()
            );
            const match2 = exact2 || results2[0];
            if (match2) resolvedFields.vendorId = match2.id;
          }
        }
      }
    } catch (e) {
      console.error('Company lookup failed:', e);
    }

    // Remove the string vendor field — API wants vendorId
    delete resolvedFields.vendor;
  }

  if (!resolvedFields.vendorId && fields.vendor) {
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
      body: JSON.stringify({ ok: true, productId, vendorId: resolvedFields.vendorId }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `Proxy fetch failed: ${err.message}` }),
    };
  }
};
