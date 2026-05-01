// =========================================================
// push-widgets.js — Netlify function
// Path: /api/push-widgets
//
// Accepts POST { widgets, prefix, apiKey, integrationKey, cleanup }
//
// Pushes 5 individual widget templates to Salesbuildr with:
//   - Standardised naming: [prefix] – W1 · Their Situation etc.
//   - pageBreak: false on W1, true on W2–W5 (PDF page breaks)
//   - Optional cleanup: deletes previous templates with same prefix
//
// Keys come from the REQUEST BODY — not env vars.
// =========================================================

const BASE = 'https://portal.us1-salesbuildr.com/public-api/quote-widget-template';
const ORDER_START = 900;

// Fixed, predictable names regardless of what Claude titled each widget
const STANDARD_NAMES = {
  w1: 'W1 · Their Situation',
  w2: 'W2 · Why Now',
  w3: 'W3 · Why Trust Us',
  w4: 'W4 · What They Get',
  w5: 'W5 · The Investment'
};

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

  const { widgets, prefix, apiKey, integrationKey, cleanup } = body;

  if (!apiKey || !integrationKey) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Salesbuildr API credentials required.' })
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

        // Delete each matching template (sequential to avoid rate limits)
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
      // Cleanup failure doesn't block creation — we proceed anyway
    }
  }

  // ── Step 2: Push 5 individual widgets ─────────────────────
  const results = [];

  for (let i = 0; i < widgets.length; i++) {
    const widget       = widgets[i];
    const standardName = STANDARD_NAMES[widget.id] || widget.title || `Widget ${i + 1}`;
    const name         = cleanPrefix ? `${cleanPrefix} – ${standardName}` : standardName;

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
            pageBreak:        i > 0   // false for W1, true for W2–W5
          },
          order: ORDER_START + i
        })
      });

      const data = await res.json();
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
