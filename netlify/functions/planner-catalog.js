// =========================================================
// planner-catalog.js — Netlify function
// Path: /api/planner-catalog
//
// Fetches labor SKUs from the MSP's Salesbuildr catalog.
// Fetches page 1 to get the total, then fires all remaining
// pages in parallel — fast even with large catalogs.
// Filters client-side by productType === "Labor".
// POST { tenantUrl, apiKey }
// Returns: { ok, skus: [{ id, name, price, unit }] }
// =========================================================

const PAGE_SIZE = 200;

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

  function pageUrl(from) {
    return `${base}/public-api/product?size=${PAGE_SIZE}&from=${from}&sort=%2Bname`;
  }

  try {
    // ── Page 1: get first batch + total count ──────────────
    const res1 = await fetch(pageUrl(0), { method: 'GET', headers });

    if (!res1.ok) {
      const errText = await res1.text().catch(() => '');
      return {
        statusCode: res1.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `Salesbuildr returned ${res1.status} — check your tenant URL and API key. ${errText.slice(0, 200)}` })
      };
    }

    const data1   = await res1.json();
    const page1   = Array.isArray(data1) ? data1 : (data1.results || []);
    const total   = data1.total || page1.length;

    // ── Remaining pages in parallel ────────────────────────
    const remainingPages = [];
    for (let from = PAGE_SIZE; from < total; from += PAGE_SIZE) {
      remainingPages.push(from);
    }

    const restResults = await Promise.all(
      remainingPages.map(async (from) => {
        try {
          const res  = await fetch(pageUrl(from), { method: 'GET', headers });
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data.results || []);
        } catch { return []; }
      })
    );

    const allProducts = [page1, ...restResults].flat();

    console.log(`[planner-catalog] total=${total} fetched=${allProducts.length} pages=${1 + remainingPages.length}`);

    // ── Filter to Labor, fall back to Service ──────────────
    const laborItems   = allProducts.filter(p => (p.productType || '').toLowerCase() === 'labor');
    const serviceItems = allProducts.filter(p =>
      (p.productType || '').toLowerCase() === 'service' ||
      (p.productType || '').toLowerCase() === 'services'
    );

    const chosen = laborItems.length > 0 ? laborItems : serviceItems;

    console.log(`[planner-catalog] labor=${laborItems.length} service=${serviceItems.length} returning=${chosen.length}`);

    const skus = chosen.map(p => ({
      id:    p.id,
      name:  p.name,
      price: p.price != null ? Number(p.price) : null,
      unit:  p.unit  || null
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, skus })
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message || 'Request failed.' })
    };
  }
};
