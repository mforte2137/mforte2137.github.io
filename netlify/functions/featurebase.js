exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const fbKey = process.env.FEATUREBASE_API_KEY;
  if (!fbKey) return { statusCode: 500, body: JSON.stringify({ error: 'FEATUREBASE_API_KEY not set.' }) };

  const headers = {
    'Authorization':       `Bearer ${fbKey}`,
    'Featurebase-Version': '2026-01-01.nova'
  };

  try {
    const body = JSON.parse(event.body || '{}');

    // ── Mode 2: fetch full content for specific article IDs ───────────────
    if (body.articleIds && body.articleIds.length) {
      const contents = await Promise.all(
        body.articleIds.slice(0, 3).map(async (id) => {
          try {
            const res  = await fetch(`https://do.featurebase.app/v2/help_center/articles/${id}`, { headers });
            if (!res.ok) return null;
            const data = await res.json();
            const article = data.data || data;

            // Extract plain text from HTML content
            const html    = article.content || article.body || '';
            const text    = html
              .replace(/<[^>]+>/g, ' ')  // strip HTML tags
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/\s{2,}/g, ' ')
              .trim()
              .slice(0, 6000); // cap per article to stay within token limits

            return {
              id,
              title: article.title || '',
              url:   article.featurebaseUrl || article.externalUrl || '',
              content: text
            };
          } catch (_) { return null; }
        })
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents.filter(Boolean) })
      };
    }

    // ── Mode 1: fetch full article list (default) ─────────────────────────
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
        const id          = article.id || article._id || '';
        if (title && url) articles.push({ id, title, url, description });
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
