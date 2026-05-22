const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getStore({
      name: 'scope-templates',
      consistency: 'strong',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN
    });

    const body = JSON.parse(event.body || '{}');
    const { method, hash, name, entry } = body;

    if (method === 'getIndex') {
      const val = await store.get(`index:${hash}`);
      return { statusCode: 200, headers, body: JSON.stringify(val ? JSON.parse(val) : []) };
    }

    if (method === 'getTemplate') {
      const val = await store.get(`tmpl:${hash}:${name}`);
      return { statusCode: 200, headers, body: JSON.stringify(val ? JSON.parse(val) : null) };
    }

    if (method === 'saveTemplate') {
      await store.set(`tmpl:${hash}:${name}`, JSON.stringify(entry));
      const idxRaw = await store.get(`index:${hash}`);
      const idx = idxRaw ? JSON.parse(idxRaw) : [];
      if (!idx.includes(name)) idx.push(name);
      await store.set(`index:${hash}`, JSON.stringify(idx));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (method === 'deleteTemplate') {
      await store.delete(`tmpl:${hash}:${name}`);
      const idxRaw = await store.get(`index:${hash}`);
      const idx = idxRaw ? JSON.parse(idxRaw) : [];
      await store.set(`index:${hash}`, JSON.stringify(idx.filter(n => n !== name)));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown method' }) };

  } catch (err) {
    console.error('scope-templates error:', err.message, err.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
