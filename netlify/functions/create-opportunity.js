// =========================================================
// create-opportunity.js — Netlify function
// Path: /api/create-opportunity
//
// Phase 2 — Guided Sales CRM integration
//
// Actions:
//   search-company     — find existing Salesbuildr companies
//   create-company     — create a new prospect company
//   upsert-opportunity — create/update opportunity with Sales Brief
//   create-quote       — create a draft quote against the opportunity
//
// Credentials come from the REQUEST BODY — never env vars.
// =========================================================

const BASE = 'https://portal.us1-salesbuildr.com/public-api';

function sbHeaders(apiKey, intKey) {
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
    'integration-key': intKey
  };
}

function ok(data) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, ...data })
  };
}

function err(msg, code = 200) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: false, error: msg })
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') return err('POST required.', 405);

  let body;
  try { body = JSON.parse(event.body); }
  catch { return err('Invalid JSON.', 400); }

  const { action, apiKey, integrationKey } = body;
  if (!apiKey || !integrationKey) return err('API credentials required.', 400);

  const headers = sbHeaders(apiKey, integrationKey);

  try {

    // ── search-company ──────────────────────────────────────
    if (action === 'search-company') {
      const { name } = body;
      if (!name) return err('Company name required.', 400);

      const res  = await fetch(`${BASE}/company?search=${encodeURIComponent(name)}&limit=8`, { headers });
      const data = await res.json();

      // Salesbuildr returns { data: [...] } or plain array
      const companies = data?.data || (Array.isArray(data) ? data : []);
      return ok({ companies });
    }

    // ── create-company ──────────────────────────────────────
    if (action === 'create-company') {
      const { name } = body;
      if (!name) return err('Company name required.', 400);

      // Generate a short reference number (SG + 6-digit timestamp suffix)
      const number = 'SG-' + Date.now().toString().slice(-6);

      const res  = await fetch(`${BASE}/company`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ name, number, type: 'prospect' })
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create company.');
      return ok({ company: data });
    }

    // ── upsert-opportunity ──────────────────────────────────
    if (action === 'upsert-opportunity') {
      const { companyId, name, description, extId } = body;
      if (!companyId) return err('companyId required.', 400);
      if (!extId)     return err('extId required.', 400);

      const payload = { name: name || 'New Opportunity', companyId, description };

      const res  = await fetch(`${BASE}/opportunity/ext/${encodeURIComponent(extId)}`, {
        method:  'PUT',
        headers,
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create opportunity.');
      return ok({ opportunity: data });
    }

    // ── create-quote ────────────────────────────────────────
    if (action === 'create-quote') {
      const { opportunityId, title, templateId } = body;
      if (!opportunityId) return err('opportunityId required.', 400);

      const payload = { opportunityId, title: title || 'Proposal' };
      if (templateId) payload.templateId = templateId;

      const res  = await fetch(`${BASE}/quote`, {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create quote.');
      return ok({ quote: data });
    }

    return err('Unknown action.', 400);

  } catch (e) {
    return err(e.message || 'Unexpected server error.');
  }
};
