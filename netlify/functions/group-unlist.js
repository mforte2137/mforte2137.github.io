/* ============================================================
   netlify/functions/group-unlist.js
   Groups "Likely Unlist" products by theme using AI notes.
   Returns 4 groups: EOL/Discontinued, Invalid MPN,
   Source Direct, Current Product.
   ============================================================ */

const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { products } = body;
  if (!products?.length) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'products array required.' }) };
  }

  const client = new Anthropic();

  const prompt = `You are analyzing a list of products that are not found in any distributor feed.
Each product has an AI note explaining why it is not found.
Group each product into exactly one of these 4 categories:

1. "eol" — EOL, discontinued, legacy, or obsolete products (old server gens, end-of-life hardware, superseded models)
2. "invalid_mpn" — Invalid or fake MPNs (internal bundle codes, licensing SKUs, config strings, fictional products, non-existent models)
3. "source_direct" — Products the MSP likely sources outside distribution (cables, accessories, consumables, direct-from-vendor items)
4. "current" — Current products temporarily out of distribution (may return to stock, recently released, niche items)

Respond ONLY with a valid JSON array. No markdown, no explanation.
Format: [{"id":"...","group":"eol|invalid_mpn|source_direct|current"}]

Products:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, note: p.note })), null, 2)}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content[0]?.text || '[]';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, result }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
