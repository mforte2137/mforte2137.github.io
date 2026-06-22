// netlify/functions/kb-featurebase-deep.js
//
// Two-step deep search for the KB app:
//   Step 1 — Fetch all article titles + descriptions, Haiku picks the top candidates
//   Step 2 — Fetch full body of each candidate, Haiku does a deep pass on real content
//
// Required Netlify environment variables:
//   FEATUREBASE_API_KEY   — your Featurebase API key
//   CLAUDE_API_KEY        — your Anthropic API key (also accepts ANTHROPIC_API_KEY)

const FB_BASE    = 'https://do.featurebase.app';
const FB_VERSION = '2026-01-01.nova';

function fbHeaders() {
    return {
        'Authorization':       `Bearer ${process.env.FEATUREBASE_API_KEY}`,
        'Featurebase-Version': FB_VERSION,
        'Content-Type':        'application/json'
    };
}

async function callClaude(claudeKey, prompt, maxTokens = 800) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type':      'application/json',
            'x-api-key':         claudeKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model:      'claude-haiku-4-5',
            max_tokens: maxTokens,
            messages:   [{ role: 'user', content: prompt }]
        })
    });
    const data = await res.json();
    if (data.error) throw new Error('Claude: ' + data.error.message);
    return data.content?.map(b => b.text || '').join('') || '';
}

// ── Step 1: fetch all articles (list endpoint — title + description + slug) ──
async function fetchArticleList() {
    const articles = [];
    let cursor = null;

    do {
        const url = new URL(`${FB_BASE}/v2/help_center/articles`);
        url.searchParams.set('limit', '100');
        if (cursor) url.searchParams.set('cursor', cursor);

        const res  = await fetch(url.toString(), { headers: fbHeaders() });
        const data = await res.json();

        if (!res.ok) throw new Error('Featurebase list error: ' + JSON.stringify(data));

        for (const a of (data.data || [])) {
            const status = (a.status || '').toLowerCase();
            if (status === 'draft' || status === 'archived') continue;
            if (!a.title) continue;
            articles.push({
                id:          a.id,
                title:       a.title,
                description: a.description || '',
                url:         a.featurebaseUrl || a.externalUrl || ''
            });
        }

        cursor = data.nextCursor || null;
    } while (cursor);

    return articles;
}

// ── Step 2: fetch the full body of a single article ──
async function fetchArticleBody(id) {
    const res  = await fetch(`${FB_BASE}/v2/help_center/articles/${id}`, { headers: fbHeaders() });
    const data = await res.json();
    if (!res.ok) return '';
    // API returns bodyMarkdown or content
    return (data.bodyMarkdown || data.content || data.body || '').slice(0, 3000);
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const fbKey     = process.env.FEATUREBASE_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!fbKey)     return { statusCode: 500, body: JSON.stringify({ error: 'FEATUREBASE_API_KEY not set.' }) };
    if (!claudeKey) return { statusCode: 500, body: JSON.stringify({ error: 'Anthropic API key not set.' }) };

    let query;
    try {
        ({ query } = JSON.parse(event.body));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON. Expected { query: "..." }' }) };
    }

    if (!query) return { statusCode: 400, body: JSON.stringify({ error: 'Missing query.' }) };

    try {
        // ── STEP 1: get article list and ask Haiku to shortlist ──────────
        const allArticles = await fetchArticleList();

        if (!allArticles.length) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    content: [{ type: 'text', text: 'No published articles found in the help centre.' }]
                })
            };
        }

        const listIndex = allArticles
            .map((a, i) => {
                let line = `[${i}] ID:${a.id} | ${a.title}`;
                if (a.description) line += ` — ${a.description}`;
                return line;
            })
            .join('\n');

        const step1Prompt = `A support agent is searching the Salesbuildr help centre.

QUERY: "${query}"

Here are all ${allArticles.length} published articles (index, ID, title, description):

${listIndex}

Your job: identify the indices of up to 5 articles most likely to answer the query, searching both title AND description. Consider partial matches and related topics.

Reply with ONLY a JSON array of index numbers, e.g.: [0, 3, 7]
If nothing is relevant at all, reply: []`;

        const step1Raw  = await callClaude(claudeKey, step1Prompt, 100);
        const indexMatch = step1Raw.match(/\[[\d,\s]*\]/);
        const topIndices = indexMatch ? JSON.parse(indexMatch[0]) : [];

        // ── STEP 2: fetch full bodies for shortlisted articles ───────────
        let finalAnswer;

        if (topIndices.length === 0) {
            // Nothing shortlisted — return gap response directly
            finalAnswer = `No articles in the Salesbuildr help centre appear to cover this topic.

THE GAP
${query} — no existing article addresses this. A new help article is needed covering this topic for Salesbuildr users.`;

        } else {
            const candidates = topIndices
                .filter(i => i >= 0 && i < allArticles.length)
                .slice(0, 5)
                .map(i => allArticles[i]);

            // Fetch bodies in parallel
            const bodies = await Promise.all(
                candidates.map(a => fetchArticleBody(a.id))
            );

            const deepIndex = candidates.map((a, i) => `
ARTICLE: ${a.title}
URL: ${a.url}
DESCRIPTION: ${a.description}
BODY:
${bodies[i] || '(no body content available)'}
`).join('\n---\n');

            const step2Prompt = `A support agent asked: "${query}"

Here are the full contents of the most relevant articles from the Salesbuildr help centre:

${deepIndex}

Search the full body of each article and answer:
1. Which article(s) directly answer the query? Give the exact title and URL.
2. What specific part of the article covers it? (Quote or summarise the relevant section.)
3. Is there anything the query asks about that the articles don't fully cover?

Only use URLs from the articles above — do not construct or modify any URLs.

At the very end, if there is a meaningful documentation gap, add this section using EXACTLY this marker on its own line:

THE GAP
[One paragraph describing what is missing.]

If the articles fully answer the query, do not include THE GAP section.`;

            finalAnswer = await callClaude(claudeKey, step2Prompt, 1200);
        }

        // Return in the same format as featurebase.js so kb.js can parse it identically
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: [{ type: 'text', text: finalAnswer }]
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};
