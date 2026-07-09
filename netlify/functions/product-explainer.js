// =========================================================
// product-explainer.js — Netlify function
// Path: /api/product-explainer
//
// Accepts POST { name, category, context, style }
//   style: 'layered' | 'numbered' | 'grid'
//
// Returns AI-generated benefit-led copy for the Product & Service
// Explainer widget. Response shape depends on style:
//   layered / numbered -> { category, headline, intro, items: [...] }
//   grid               -> { category, headline, intro, benefits: [...], footerText, footerBadge }
// =========================================================

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 1. CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 2. Method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  // 3. Parse body
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const name     = (body.name || '').trim();
  const category = (body.category || '').trim();
  const context   = (body.context || '').trim();
  const style     = (body.style || 'layered').trim(); // 'layered' | 'numbered' | 'grid'

  // 4. Validate
  if (!name) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Product or service name is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API key not configured.' }) };
  }

  const isGrid = style === 'grid';

  const systemPrompt = `You write short, benefit-led explainer copy for MSP (Managed Service Provider) sales quotes. The reader is a business owner, not a technician — never use jargon or acronyms without explaining them in plain terms.

You have strong knowledge of common MSP products and services (Meraki, Dell, Yealink, Microsoft 365 SKUs, Datto, SentinelOne, Huntress, Acronis, Veeam, and similar). For recognised products, write accurate benefit content from that knowledge without needing a description. If custom context is provided, use it to shape the content — it likely describes something proprietary or unusual.

Rules:
- Headline: benefit-led, not product-name-led. E.g. "Stop Phishing Before It Reaches Your Team" not "Phishing Awareness Training Service".
- Intro: 1–2 sentences maximum, plain language — what it does and why it matters.
- ${isGrid ? 'Exactly 4 benefits' : 'Exactly 3 items'}, each with a short label/title and a one-line description.
- Emoji selection should suit the category — security gets shields/locks, cloud gets cloud/lightning bolt, hardware gets device-appropriate emoji, etc.
${isGrid
    ? `- Also write a short one-line footerText (a reassurance, e.g. "Managed & supported by your IT team") and a short footerBadge (e.g. "✓ Fully managed").`
    : `- Also choose a short badge for each item from: Included, Recommended, Essential, Standard, Premium — pick whichever fits that item best.`}

Return JSON only — no preamble, no markdown, no backticks. Use exactly this shape:
${isGrid
    ? `{"category":"...","headline":"...","intro":"...","benefits":[{"icon":"emoji","title":"...","description":"..."},{"icon":"emoji","title":"...","description":"..."},{"icon":"emoji","title":"...","description":"..."},{"icon":"emoji","title":"...","description":"..."}],"footerText":"...","footerBadge":"..."}`
    : `{"category":"...","headline":"...","intro":"...","items":[{"icon":"emoji","label":"...","description":"...","badge":"..."},{"icon":"emoji","label":"...","description":"...","badge":"..."},{"icon":"emoji","label":"...","description":"...","badge":"..."}]}`
}`;

  const userMessage = JSON.stringify({ name, category, context, style });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = (data && data.error && data.error.message) || `AI request failed (HTTP ${response.status}).`;
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: msg }) };
    }

    const text = (data.content && data.content[0] && data.content[0].text) || '';
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, style, data: parsed }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
