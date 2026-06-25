// =========================================================
// planner-opportunities.js — Netlify function
// Path: /api/planner-opportunities
//
// Loads opportunities for a selected company.
// Tries company.id filter first, falls back to companyId filter,
// then falls back to fetching all and filtering client-side.
// POST { tenantUrl, apiKey, companyId }
// Returns: { ok, opportunities: [{ id, name, status }] }
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

  const { tenantUrl, apiKey, companyId } = body;

  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' })
    };
  }

  if (!companyId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'companyId is required.' })
    };
  }

  const base    = tenantUrl.trim().replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json', 'api-key': apiKey };

  async function tryFetch(filterStr) {
    const url = `${base}/public-api/opportunity?filters=${encodeURIComponent(filterStr)}&size=100&sort=-updatedAt`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  try {
    // Try multiple filter key variations — the correct key isn't documented
    let results = null;

    for (const filter of [`company.id:${companyId}`, `companyId:${companyId}`]) {
      const r = await tryFetch(filter);
      if (r && r.length > 0) { results = r; break; }
    }

    // Fallback: fetch recent opportunities and filter client-side by companyId
    if (!results || results.length === 0) {
      const url = `${base}/public-api/opportunity?size=200&sort=-updatedAt`;
      const res = await fetch(url, { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        const all  = Array.isArray(data) ? data : (data.results || []);
        results = all.filter(o => o.companyId === companyId || o.company?.id === companyId);
      }
    }

    const opportunities = (results || []).map(o => ({
      id:     o.id,
      name:   o.name,
      status: o.pipelineStageDisplayValue || o.statusId || ''
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, opportunities })
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message || 'Request failed.' })
    };
  }
};
