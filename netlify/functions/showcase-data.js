const { getStore } = require('@netlify/blobs');

const CONTRIBUTORS = ['victor', 'michael', 'bram'];

function getShowcaseStore() {
  // Prefer explicit config — Netlify's automatic environment injection for
  // Blobs doesn't always work reliably (see MissingBlobsEnvironmentError).
  // Falls back to zero-config auto-detection if these aren't set.
  if (process.env.BLOBS_SITE_ID && process.env.NETLIFY_BLOBS_TOKEN) {
    return getStore({
      name: 'showcase',
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN
    });
  }
  return getStore('showcase');
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // 1. CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const store = getShowcaseStore();

  // 2. Read all updates
  if (event.httpMethod === 'GET') {
    try {
      const [victor, michael, bram] = await Promise.all([
        store.get('updates/victor', { type: 'json' }).catch(() => []),
        store.get('updates/michael', { type: 'json' }).catch(() => []),
        store.get('updates/bram', { type: 'json' }).catch(() => [])
      ]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          victor: victor || [],
          michael: michael || [],
          bram: bram || []
        })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: 'Failed to read updates.' })
      };
    }
  }

  // 3. Write / delete an update
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
    }

    const { contributor, action, update, id } = body;

    if (!contributor || !CONTRIBUTORS.includes(contributor)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: 'A valid contributor is required.' })
      };
    }

    const key = `updates/${contributor}`;

    try {
      if (action === 'delete') {
        if (!id) {
          return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'id is required to delete.' }) };
        }
        const existing = await store.get(key, { type: 'json' }).catch(() => []);
        const filtered = (existing || []).filter((u) => u.id !== id);
        await store.set(key, JSON.stringify(filtered));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      if (action === 'edit') {
        if (!update || !update.id || !update.featureName || !update.status) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ ok: false, error: 'update.id, update.featureName and update.status are required to edit.' })
          };
        }
        const existing = await store.get(key, { type: 'json' }).catch(() => []);
        const index = (existing || []).findIndex((u) => u.id === update.id);
        if (index === -1) {
          return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'Update not found.' }) };
        }
        const updatedList = [...existing];
        updatedList[index] = update;
        await store.set(key, JSON.stringify(updatedList));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      // Default action: create a new update
      if (!update || !update.featureName || !update.status) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ ok: false, error: 'update.featureName and update.status are required.' })
        };
      }

      const existing = await store.get(key, { type: 'json' }).catch(() => []);
      const updated = [update, ...(existing || [])];
      await store.set(key, JSON.stringify(updated));

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: 'Failed to save update.' })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'GET or POST required.' }) };
};
