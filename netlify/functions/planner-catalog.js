// =========================================================
// planner-catalog.js — Netlify function
// Path: /api/planner-catalog
//
// Fetches labor SKUs from the MSP's Salesbuildr catalog.
// Tries multiple filter key/value combinations since the
// exact filter key varies — falls back gracefully.
// POST { tenantUrl, apiKey }
// Returns: { ok, skus: [{ id, name, price, unit }] }
// =========================================================

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' })
    };
  }

  const { tenantUrl, apiKey } = body;

  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' })
    };
  }

  const base    = tenantUrl.trim().replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json', 'api-key': apiKey };

  // Helper: fetch products with a given filter string, return results array or null on error
  async function fetchFiltered(filterStr) {
    const url = `${base}/public-api/product?filters=${encodeURIComponent(filterStr)}&size=200&sort=%2Bname`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    // API always returns paginated object: { results: [...], total, ... }
    return Array.isArray(data) ? data : (data.results || []);
  }

  // Helper: fetch ALL products (no filter) as last resort
  async function fetchAll() {
    const url = `${base}/public-api/product?size=200&sort=%2Bname`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  try {
    // Strategy: try filter variations in order, use first that returns results.
    // The Salesbuildr UI shows "Labor (15)" so the value is definitely "Labor".
    // The filter KEY is uncertain — try "type" first (matches UI sidebar key),
    // then "productType" (field name in the DTO), then unfiltered fallback.
    const attempts = [
      'type:Labor',
      'productType:Labor',
      'type:Service',
      'productType:Service',
      'type:Services',
      'productType:Services',
    ];

    let results = null;
    let usedFilter = '';

    for (const filter of attempts) {
      const r = await fetchFiltered(filter);
      if (r && r.length > 0) {
        results = r;
        usedFilter = filter;
        break;
      }
    }

    // Last resort: fetch everything and filter client-side by productType field
    if (!results || results.length === 0) {
      const all = await fetchAll();
      if (all && all.length > 0) {
        // Try to pick Labor/Service types from the full list
        const laborItems = all.filter(p =>
          (p.productType || '').toLowerCase() === 'labor' ||
          (p.productType || '').toLowerCase() === 'service' ||
          (p.productType || '').toLowerCase() === 'services'
        );
        results = laborItems.length > 0 ? laborItems : all;
        usedFilter = 'unfiltered';
      }
    }

    if (!results) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: 'Could not reach Salesbuildr. Check your tenant URL and API key.' })
      };
    }

    const skus = results.map(p => ({
      id:    p.id,
      name:  p.name,
      price: p.price != null ? Number(p.price) : null,
      unit:  p.unit  || null
    }));

    console.log(`[planner-catalog] filter="${usedFilter}" found ${skus.length} SKUs`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, skus, _filter: usedFilter })
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message || 'Request failed.' })
    };
  }
};
