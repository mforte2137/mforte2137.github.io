// =========================================================
// planner-quote.js — Netlify function
// Path: /api/planner-quote
//
// Creates a draft quote in Salesbuildr with line items.
// POST { tenantUrl, apiKey, opportunityId, title, templateId?, products, note }
//   products: [{ id, quantity }]
// Returns: { ok, quoteId, quoteUrl }
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

  const { tenantUrl, apiKey, opportunityId, title, templateId, products, note } = body;

  if (!tenantUrl || !apiKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'tenantUrl and apiKey are required.' })
    };
  }

  if (!opportunityId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'opportunityId is required.' })
    };
  }

  if (!title || !title.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'title is required.' })
    };
  }

  if (!Array.isArray(products) || products.length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'products array is required and must not be empty.' })
    };
  }

  const base    = tenantUrl.trim().replace(/\/+$/, '');
  const headers = { 'Content-Type': 'application/json', 'api-key': apiKey };

  // Build the CreateQuoteDto payload
  const quotePayload = {
    opportunityId: opportunityId.trim(),
    title:         title.trim(),
    products:      products.map(p => ({ id: p.id, quantity: Number(p.quantity) }))
  };

  if (templateId && templateId.trim()) {
    quotePayload.templateId = templateId.trim();
  }

  if (note && note.trim()) {
    quotePayload.note = note.trim();
  }

  try {
    const url = `${base}/public-api/quote`;
    const res = await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify(quotePayload)
    });

    // Always try to get the response body for error detail
    const rawText = await res.text().catch(() => '');
    let data = {};
    try { data = JSON.parse(rawText); } catch {}

    if (!res.ok) {
      // Extract the most useful error message from Salesbuildr's response
      // Their 400 responses can be: string, { message }, { error }, or an array
      let errMsg = `Salesbuildr returned ${res.status}`;
      if (typeof data === 'string' && data.length > 0) {
        errMsg = data;
      } else if (data.message && typeof data.message === 'string') {
        errMsg = data.message;
      } else if (data.error && typeof data.error === 'string') {
        errMsg = data.error;
      } else if (Array.isArray(data) && data[0]?.message) {
        errMsg = data[0].message;
      } else if (rawText.length > 0 && rawText.length < 300) {
        errMsg = rawText;
      }

      console.log(`[planner-quote] ${res.status} payload=${JSON.stringify(quotePayload)} response=${rawText.slice(0, 500)}`);

      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: errMsg })
      };
    }

    const quoteId  = data.id;
    const quoteUrl = `${base}/quotes/${quoteId}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, quoteId, quoteUrl })
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message || 'Request failed.' })
    };
  }
};
