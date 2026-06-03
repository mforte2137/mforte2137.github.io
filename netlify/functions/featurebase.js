exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const fbKey      = process.env.FEATUREBASE_API_KEY;
  const claudeKey  = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!fbKey)     return { statusCode: 500, body: JSON.stringify({ error: 'FEATUREBASE_API_KEY not set.' }) };
  if (!claudeKey) return { statusCode: 500, body: JSON.stringify({ error: 'Anthropic API key not set.' }) };

  try {
    const { query, instructions } = JSON.parse(event.body);

    // ── Step 1: Fetch all articles from Featurebase ──────────────────────
    const articles = [];
    let cursor     = null;

    do {
      const url = new URL('https://do.featurebase.app/v2/help_center/articles');
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization':       `Bearer ${fbKey}`,
          'Featurebase-Version': '2026-01-01.nova'
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          statusCode: res.status,
          body: JSON.stringify({ error: err.error?.message || 'Featurebase API error' })
        };
      }

      const data = await res.json();

      // Each article has: id, title, slug, featurebaseUrl, externalUrl, status, collectionId
      for (const article of data.data || []) {
        // Include all articles — filter out only explicitly unpublished/draft ones
        const status = (article.status || '').toLowerCase();
        if (status === 'draft' || status === 'archived') continue;

        const title = article.title || article.name || '(untitled)';
        const url   = article.featurebaseUrl || article.externalUrl || '';
        const description = article.description || '';
        if (title && url) {
          articles.push({ title, url, description });
        }
      }

      cursor = data.nextCursor || null;
    } while (cursor);

    if (!articles.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          content: [{ type: 'text', text: 'No articles found in the Salesbuildr knowledge base. The KB may be empty or the API key may not have access.' }]
        })
      };
    }

    // ── Step 2: Ask Claude to search the article list ────────────────────
    const articleList = articles
      .map((a, i) => {
        let entry = `${i + 1}. ${a.title}\n   URL: ${a.url}`;
        if (a.description) entry += `\n   Description: ${a.description}`;
        return entry;
      })
      .join('\n\n');

    const prompt = `A support agent is searching the Salesbuildr knowledge base.

QUERY: "${query}"

Here is the complete list of published articles (${articles.length} total), each with title, URL and description where available:

${articleList}

Match the query against both titles AND descriptions. Answer:
1. Are there any articles that cover this topic — either directly in the title or in the description? If yes, give the exact title and URL.
2. What does each relevant article likely cover based on its title and description?
3. Is there anything the query asks about that no article seems to cover?

If no relevant articles exist, say so clearly.

At the very end, if there is a documentation gap, include a section using EXACTLY this marker:

THE GAP
[A concise plain-English description of what is missing — written so it can be forwarded to a developer or used as a brief for writing a new article.]

If there is no gap, do not include THE GAP section.
Only use URLs from the list above — do not modify or construct any URLs.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5',
        max_tokens: 1500,
        system:     instructions || '',
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    const claudeData = await claudeRes.json();

    return {
      statusCode: claudeRes.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claudeData)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
