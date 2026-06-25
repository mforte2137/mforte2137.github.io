// =========================================================
// planner-opportunities.js — Netlify function
// Path: /api/planner-opportunities
//
// Searches opportunities for a selected company.
// Filters to open/active only, sorted newest first.
// POST { tenantUrl, apiKey, companyId, query? }
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

  const { tenantUrl, apiKey, companyId, query } = body;

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

  async function tryFetch(filterStr, queryStr) {
    let url = `${base}/public-api/opportunity?filters=${encodeURIComponent(filterStr)}&size=100&sort=-updatedAt`;
    if (queryStr) url += `&query=${encodeURIComponent(queryStr)}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  try {
    let results = null;

    // Try combinations of company filter + active status filter
    const companyFilters = [
      `company.id:${companyId},statusId:active`,
      `companyId:${companyId},statusId:active`,
      `company.id:${companyId},statusId:open`,
      `companyId:${companyId},statusId:open`,
      // Without status filter as fallback
      `company.id:${companyId}`,
      `companyId:${companyId}`,
    ];

    for (const filter of companyFilters) {
      const r = await tryFetch(filter, query);
      if (r && r.length > 0) { results = r; break; }
    }

    // Last resort: fetch all recent opps, filter client-side
    if (!results || results.length === 0) {
      let url = `${base}/public-api/opportunity?size=200&sort=-updatedAt`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        const all  = Array.isArray(data) ? data : (data.results || []);
        // Filter by company and prefer active/open status
        const matched = all.filter(o =>
          o.companyId === companyId || o.company?.id === companyId
        );
        // Sort: active first, then by updatedAt
        matched.sort((a, b) => {
          const aActive = (a.statusId || '').toLowerCase().includes('active') || (a.statusId || '').toLowerCase().includes('open');
          const bActive = (b.statusId || '').toLowerCase().includes('active') || (b.statusId || '').toLowerCase().includes('open');
          if (aActive && !bActive) return -1;
          if (!aActive && bActive) return 1;
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        });
        results = matched;
      }
    }

    const opportunities = (results || []).map(o => ({
      id:     o.id,
      name:   o.name,
      status: o.pipelineStageDisplayValue || o.statusId || '',
      updatedAt: o.updatedAt || ''
    }));

    console.log(`[planner-opportunities] companyId=${companyId} query="${query||''}" found=${opportunities.length}`);

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
