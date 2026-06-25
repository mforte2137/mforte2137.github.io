
// =========================================================
// planner-catalog.js — Netlify function
// Path: /api/planner-catalog
//
// Fetches labor SKUs from the MSP's Salesbuildr catalog.
// Tries productType:Labor first; falls back to productType:Services.
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

  async function fetchByType(productType) {
    const url = `${base}/public-api/product?filters=productType:${encodeURIComponent(productType)}&size=200&sort=+name`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.results || []);
    return results;
  }

  try {
    // Try Labor first
    let results = await fetchByType('Labor');

    // Fall back to Services if Labor returns nothing
    if (!results || results.length === 0) {
      results = await fetchByType('Services');
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
