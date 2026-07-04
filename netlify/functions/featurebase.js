exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const fbKey = process.env.FEATUREBASE_API_KEY;
  if (!fbKey) return { statusCode: 500, body: JSON.stringify({ error: 'FEATUREBASE_API_KEY not set.' }) };

  try {
    const headers = {
      'Authorization':       `Bearer ${fbKey}`,
      'Featurebase-Version': '2026-01-01.nova'
    };

    const articles = [];
    let cursor = null;

    do {
      const url = new URL('https://do.featurebase.app/v2/help_center/articles');
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { statusCode: res.status, body: JSON.stringify({ error: err.error?.message || 'Featurebase API error' }) };
      }

      const data = await res.json();

      for (const article of data.data || []) {
        const status = (article.status || '').toLowerCase();
        if (status === 'draft' || status === 'archived') continue;
        const title       = article.title || article.name || '';
        const url         = article.featurebaseUrl || article.externalUrl || '';
        const description = (article.description || '').slice(0, 200);
        if (title && url) articles.push({ title, url, description });
      }

      cursor = data.nextCursor || null;
    } while (cursor);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
