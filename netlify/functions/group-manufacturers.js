/* ============================================================
   netlify/functions/group-manufacturers.js
   Sends mismatch products to Claude Haiku to suggest the
   correct manufacturer for each based on product name/MPN.
   ============================================================ */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: 'POST required.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }),
    };
  }

  if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'products array is required.' }),
    };
  }

  const prompt = `You are a product catalog analyst for an MSP technology reseller.
These products have an incorrect manufacturer — they were all defaulted to the MSP's own company name during PSA import.
Your job is to identify the correct manufacturer for each product based on its name, MPN, and description.

RULES:
- Use the most common/official brand name (e.g. "HP" not "Hewlett Packard", "Dell" not "Dell Technologies")
- For products where the manufacturer is truly unknown or it's a generic/custom item, return "Unknown"
- For clearly internal or test products (e.g. "test for quote1", "Test Product"), return "Unknown"
- Be consistent — all HP products should return "HP", all Dell products "Dell", etc.

Respond ONLY with a valid JSON array. No markdown, no explanation.
Format: [{"id":"...","manufacturer":"Brand Name"}]

Products:
${JSON.stringify(body.products, null, 2)}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'You are a product catalog analyst. Respond ONLY with valid JSON arrays. No preamble, no markdown.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, result }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: `AI call failed: ${err.message}` }),
    };
  }
};
