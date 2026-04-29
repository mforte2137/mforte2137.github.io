// =========================================================
// push-widgets.js — Netlify function
// Path: /api/push-widgets
//
// Accepts POST { widgets, prefix, apiKey, integrationKey }
//
// Keys come from the REQUEST BODY — not environment vars.
// This ensures each MSP uses their own Salesbuildr account.
// No keys in the request = 401. No cross-tenant pollution.
// =========================================================

const BASE = 'https://portal.us1-salesbuildr.com/public-api/quote-widget-template';
const ORDER_START = 900;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' })
    };
  }

  const { widgets, prefix, apiKey, integrationKey } = body;

  // Keys must be provided explicitly — no env var fallback
  if (!apiKey || !integrationKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Salesbuildr API credentials required. Please connect your account.'
      })
    };
  }

  if (!Array.isArray(widgets) || widgets.length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'No widgets provided.' })
    };
  }

  const headers = {
    'Content-Type':    'application/json',
    'api-key':         apiKey,
    'integration-key': integrationKey
  };

  const results = [];

  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const name   = prefix ? `${prefix} – ${widget.title}` : widget.title;

    try {
      const res  = await fetch(BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          widget: {
            type:             'items',
            contentTemplate:  widget.html,
            titleTemplate:    widget.title,
            showProductImage: false,
            products:         [],
            hidden:           false,
            locked:           false,
            attachments:      [],
            choice:           null,
            showSubtotal:     false
          },
          order: ORDER_START + i
        })
      });

      const data = await res.json();
      results.push(res.ok
        ? { id: widget.id, title: widget.title, ok: true,  salesbuildrId: data.id }
        : { id: widget.id, title: widget.title, ok: false, error: data.message || `HTTP ${res.status}` }
      );
    } catch (err) {
      results.push({ id: widget.id, title: widget.title, ok: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.ok).length;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: successCount === widgets.length, successCount, total: widgets.length, results })
  };
};
