// netlify/functions/business-review-data.js
// Session read/write for the Business Review Builder, backed by Netlify Blobs.
// Blob keys:
//   business-review/sessions/{id}
//   business-review/session-index   (list of active session index entries)

const { getStore } = require('@netlify/blobs');

const MAX_ACTIVE_SESSIONS = 5;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { action } = body;
  if (!action) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'action is required.' }) };
  }

  const store = getStore('business-review');

  try {
    if (action === 'list') {
      const index = (await store.get('session-index', { type: 'json' })) || [];
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, sessions: index }) };
    }

    if (action === 'get') {
      if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'id is required.' }) };
      const session = await store.get(`sessions/${body.id}`, { type: 'json' });
      if (!session) return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'Session not found.' }) };
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, session }) };
    }

    if (action === 'save') {
      const { session } = body;
      if (!session || !session.id) {
        return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'session with id is required.' }) };
      }

      let index = (await store.get('session-index', { type: 'json' })) || [];
      const existingIdx = index.findIndex(s => s.id === session.id);
      const activeCount = index.filter(s => !s.archived && s.id !== session.id).length;

      if (existingIdx < 0 && !session.archived && activeCount >= MAX_ACTIVE_SESSIONS) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: `Maximum of ${MAX_ACTIVE_SESSIONS} active reviews reached. Archive or delete one first.` })
        };
      }

      session.updatedAt = new Date().toISOString();
      await store.setJSON(`sessions/${session.id}`, session);

      const indexEntry = {
        id: session.id,
        clientName: session.clientName || 'Untitled review',
        reviewPeriod: session.reviewPeriod || '',
        reviewType: session.reviewType || '',
        archived: !!session.archived,
        updatedAt: session.updatedAt
      };
      if (existingIdx >= 0) index[existingIdx] = indexEntry;
      else index.push(indexEntry);

      await store.setJSON('session-index', index);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, session }) };
    }

    if (action === 'archive') {
      if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'id is required.' }) };
      const session = await store.get(`sessions/${body.id}`, { type: 'json' });
      if (!session) return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'Session not found.' }) };
      session.archived = true;
      session.updatedAt = new Date().toISOString();
      await store.setJSON(`sessions/${body.id}`, session);

      let index = (await store.get('session-index', { type: 'json' })) || [];
      index = index.map(s => s.id === body.id ? { ...s, archived: true, updatedAt: session.updatedAt } : s);
      await store.setJSON('session-index', index);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (action === 'delete') {
      if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'id is required.' }) };
      await store.delete(`sessions/${body.id}`);
      let index = (await store.get('session-index', { type: 'json' })) || [];
      index = index.filter(s => s.id !== body.id);
      await store.setJSON('session-index', index);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: `Unknown action: ${action}` }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
