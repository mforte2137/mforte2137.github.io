// =========================================================
// push-widgets.js — Netlify function
// Path: /api/push-widgets
//
// Accepts POST { widgets, prefix, apiKey, tenantUrl, cleanup }
//
// tenantUrl: the MSP's Salesbuildr tenant e.g. https://acme.salesbuildr.com
// apiKey:    generated at Admin → Integrations → API Key in Salesbuildr
//
// Pushes individual widget templates to Salesbuildr with:
//   - Standardised naming: [prefix] – widget title
//   - pageBreak: false on first widget, true on subsequent (PDF page breaks)
//   - Optional cleanup: deletes previous templates with same prefix
//
// Keys come from the REQUEST BODY — not env vars.
// =========================================================

const ORDER_START = 900;

function getBase(tenantUrl) {
  // Normalise — strip trailing slash, append API path
  const base = (tenantUrl || '').trim().replace(/\/+$/, '');
  return `${base}/public-api/quote-widget-template`;
}

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
  catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' })
    };
  }

  const { widgets, prefix, apiKey, tenantUrl, cleanup } = body;

  if (!apiKey || !tenantUrl) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Salesbuildr API key and tenant URL are required.' })
    };
  }

  if (!Array.isArray(widgets) || widgets.length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'No widgets provided.' })
    };
  }

  const BASE = getBase(tenantUrl);

  const headers = {
    'Content-Type': 'application/json',
    'api-key':      apiKey
  };

  const cleanPrefix  = (prefix || '').trim();
  let   deletedCount = 0;

  // ── Step 1: Cleanup previous set if requested ─────────────
  if (cleanup && cleanPrefix) {
    try {
      const listRes = await fetch(BASE, { method: 'GET', headers });
      if (listRes.ok) {
        const allTemplates = await listRes.json();
        const searchPrefix = cleanPrefix + ' –';
        const matching = Array.isArray(allTemplates)
          ? allTemplates.filter(t => t.name && t.name.startsWith(searchPrefix))
          : [];

        for (const template of matching) {
          try {
            await fetch(`${BASE}/${template.id}`, { method: 'DELETE', headers });
            deletedCount++;
          } catch (e) {
            // Continue even if one delete fails
          }
        }
      }
    } catch (err) {
      // Cleanup failure doesn't block creation — proceed anyway
    }
  }

  // ── Step 2: Push widgets ───────────────────────────────────
  const results = [];

  for (let i = 0; i < widgets.length; i++) {
    const widget = widgets[i];
    const name   = cleanPrefix
      ? `${cleanPrefix} – ${widget.title || `Widget ${i + 1}`}`
      : (widget.title || `Widget ${i + 1}`);

    try {
      const res = await fetch(BASE, {
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
            showSubtotal:     false,
            pageBreak:        i > 0   // false for first widget, true for subsequent
          },
          order: ORDER_START + i
        })
      });

      const data = await res.json();
      console.log('[push-widgets] SB response', res.status, JSON.stringify(data));
      results.push(res.ok
        ? { id: widget.id, name, ok: true,  salesbuildrId: data.id }
        : { id: widget.id, name, ok: false, error: data.message || `HTTP ${res.status}` }
      );
    } catch (err) {
      results.push({ id: widget.id, name, ok: false, error: err.message });
    }
  }

  const successCount = results.filter(r => r.ok).length;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      ok: successCount === widgets.length,
      successCount,
      total:   widgets.length,
      deleted: deletedCount,
      results
    })
  };
};
