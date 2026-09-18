exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const fbKey = process.env.FEATUREBASE_API_KEY;
  if (!fbKey) return { statusCode: 500, body: JSON.stringify({ error: 'FEATUREBASE_API_KEY not set.' }) };

  const headers = {
    'Content-Type':        'application/json',
    'Authorization':       `Bearer ${fbKey}`,
    'Featurebase-Version': '2026-01-01.nova'
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    // ── Action: get boards ────────────────────────────────────────────────
    if (action === 'get_boards') {
      const res  = await fetch('https://do.featurebase.app/v2/boards', { headers });
      const data = await res.json();
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    // ── Action: get post by URL or ID ─────────────────────────────────────
    if (action === 'get_post') {
      const { postUrl } = body;

      const slugMatch = postUrl.match(/\/p\/([^/?#]+)/);
      if (!slugMatch) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Could not extract post slug from URL.' }) };
      }
      const slug       = slugMatch[1];
      const titleQuery = slug.replace(/-/g, ' ');

      // Use q parameter (correct param per API docs — searches title + content)
      const searchRes  = await fetch(
        `https://do.featurebase.app/v2/posts?q=${encodeURIComponent(titleQuery)}&limit=10`,
        { headers }
      );
      const searchData = await searchRes.json();
      const posts      = searchData.data || [];

      // Match by slug field, then postUrl containing slug, then first result
      const post = posts.find(p => p.slug === slug) ||
                   posts.find(p => (p.postUrl || '').includes(slug)) ||
                   posts[0];

      if (!post) {
        return { statusCode: 404, body: JSON.stringify({ error: `Post not found for "${titleQuery}". API returned ${posts.length} results.` }) };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: { id: post.id, title: post.title, content: post.content || '' } })
      };
    }

    // ── Action: post comment ──────────────────────────────────────────────
    if (action === 'post_comment') {
      const { postId, content, isPrivate = true } = body;

      if (!postId || !content) {
        return { statusCode: 400, body: JSON.stringify({ error: 'postId and content are required.' }) };
      }

      // Convert plain text to basic HTML
      const htmlContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      const commentBody = {
        postId,
        content:  `<p>${htmlContent}</p>`,
        isPrivate // private = admin-only, not visible to the customer
      };

      const res  = await fetch('https://do.featurebase.app/v2/comments', {
        method: 'POST',
        headers,
        body: JSON.stringify(commentBody)
      });
      const data = await res.json();

      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
