// netlify/functions/widget-cleaner-api.js
// Handles: list all widgets, delete a widget
// POST body: { action, apiKey, tenantUrl, widgetId? }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { action, apiKey, tenantUrl, widgetId } = body;

  if (!action)    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'action is required.' }) };
  if (!apiKey)    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'apiKey is required.' }) };
  if (!tenantUrl) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'tenantUrl is required.' }) };

  // Normalise tenant URL — strip trailing slash
  const base = tenantUrl.replace(/\/$/, '');

  const headers = {
    'Content-Type': 'application/json',
    'api-key':      apiKey
  };

  // ── LIST ──
  if (action === 'list') {
    let res;
    try {
      res = await fetch(`${base}/public-api/quote-widget-template`, { headers });
    } catch (err) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Could not reach Salesbuildr: ' + err.message }) };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        statusCode: res.status,
        body: JSON.stringify({ ok: false, error: `Salesbuildr returned ${res.status}: ${text.slice(0, 200)}` })
      };
    }

    let widgets;
    try { widgets = await res.json(); }
    catch { return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Invalid JSON from Salesbuildr.' }) }; }

    // Salesbuildr returns an array directly
    const list = Array.isArray(widgets) ? widgets : (widgets.data || widgets.items || []);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, widgets: list })
    };
  }

  // ── DELETE ──
  if (action === 'delete') {
    if (!widgetId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'widgetId is required for delete.' }) };

    let res;
    try {
      res = await fetch(`${base}/public-api/quote-widget-template/${widgetId}`, {
        method: 'DELETE',
        headers
      });
    } catch (err) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Could not reach Salesbuildr: ' + err.message }) };
    }

    // 204 No Content = success
    if (res.status === 204 || res.ok) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true })
      };
    }

    const text = await res.text().catch(() => '');
    return {
      statusCode: res.status,
      body: JSON.stringify({ ok: false, error: `Salesbuildr returned ${res.status}: ${text.slice(0, 200)}` })
    };
  }

  return { statusCode: 400, body: JSON.stringify({ ok: false, error: `Unknown action: ${action}` }) };
};
