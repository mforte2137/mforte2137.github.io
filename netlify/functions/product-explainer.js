// =========================================================
// product-explainer.js — Netlify function
// Path: /api/product-explainer
//
// Accepts POST { name, category, context, style }
//   style is used only to steer tone/emphasis in the prompt — the
//   RESPONSE SHAPE IS ALWAYS THE SAME regardless of style. This lets
//   the frontend switch between Style 1 / 2 / 3 instantly, client-side,
//   without another AI call (same idea as the colour-theme swap).
//
// Response shape (always):
// {
//   category, headline, intro,
//   points: [ {icon, title, description, badge} x4 ],
//   footerText, footerBadge
// }
// Layered Rows / Numbered Blocks use points[0..2] (first 3).
// Benefit Grid uses all 4 points, plus footerText/footerBadge.
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
  const context  = (body.context || '').trim();
  const style    = (body.style || 'layered').trim(); // 'layered' | 'numbered' | 'grid' — tone hint only

  // 4. Validate
  if (!name) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Product or service name is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API key not configured.' }) };
  }

  const systemPrompt = `You write short, benefit-led explainer copy for MSP (Managed Service Provider) sales quotes. The reader is a business owner, not a technician — never use jargon or acronyms without explaining them in plain terms.

You have strong knowledge of common MSP products and services (Meraki, Dell, Yealink, Microsoft 365 SKUs, Datto, SentinelOne, Huntress, Acronis, Veeam, and similar). For recognised products, write accurate benefit content from that knowledge without needing a description.

Custom context handling — the rep typing this is in a hurry and will often type a short fragment, not a full sentence (e.g. "broken display screen", "replacing a stolen device"). Treat terse fragments as fully valid input; do not expect or require clean grammar.
- If the context describes a specific scenario, reason, or constraint: it must show up in the intro AND shape at least one of the points — not just the opening line. E.g. context "broken display screen" should produce a point about fast replacement / minimal downtime / matching the existing fleet configuration, not just a mention in the intro followed by three generic laptop bullets.
- If the context is empty, or is too vague/generic to add anything real (e.g. "upgrade", "new one needed", or it just restates the product name), do not force it into a point — let the points stand as strong generic value props instead. Straining to reference a few vague words produces worse copy than leaving it out.

Disambiguation — this matters: when the product name is just a brand plus a bare number (e.g. "Dell 7450", "Meraki 68", with no descriptive words like "laptop" or "firewall"), do NOT guess an unrelated or obscure product category for that number (e.g. do not interpret a Dell model number as telecom/networking equipment just because a similar number exists in another industry). Instead default to that brand's most common everyday MSP product line:
- Dell, HP, Lenovo, Apple, Asus, Acer + bare number -> business laptop (e.g. Dell Latitude, HP EliteBook/ProBook, Lenovo ThinkPad)
- Meraki, Cisco, SonicWall, Fortinet, WatchGuard, Aruba + bare number -> network security appliance (firewall/switch/AP as fits the number pattern)
- Ubiquiti / UniFi (same company, either name is used) + a model code like "U6", "UDM", "USW" -> network equipment (access point, gateway/router, or switch as the code indicates — U-prefixed codes are APs, UDM is a gateway, USW is a switch)
- Yealink, Poly, Grandstream + bare number -> VoIP desk phone
- APC, Eaton, TrippLite + bare number -> UPS / battery backup
- Synology, QNAP + bare number -> NAS storage device
The category selected by the rep ("${category}") is also authoritative context — treat it as a strong signal for what kind of item this is, and stay consistent with it.

Rules:
- Headline: benefit-led, not product-name-led. E.g. "Stop Phishing Before It Reaches Your Team" not "Phishing Awareness Training Service".
- Intro: 1–2 sentences maximum, plain language — what it does and why it matters.
- Always write exactly 4 points, each with: a short icon (single emoji, category-appropriate — security gets shields/locks, cloud gets cloud/lightning, hardware gets device-appropriate emoji), a short title/label, a one-line description, and a badge chosen from: Included, Recommended, Essential, Standard, Premium (pick whichever fits that point best). The first 3 points should stand alone as the most important; the 4th is used only in some layouts, so make sure all 4 are genuinely useful, not filler.
- Also write a short one-line footerText (a reassurance, e.g. "Managed & supported by your IT team") and a short footerBadge (e.g. "✓ Fully managed").
- The requested layout style is "${style}" — this only affects tone/emphasis slightly, not the response structure, which is always the same.

Return JSON only — no preamble, no markdown, no backticks. Use exactly this shape:
{"category":"...","headline":"...","intro":"...","points":[{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."}],"footerText":"...","footerBadge":"..."}`;

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

    // Defensive: make sure points is always an array of 4
    if (!Array.isArray(parsed.points)) parsed.points = [];
    while (parsed.points.length < 4) {
      parsed.points.push({ icon: '•', title: '', description: '', badge: 'Included' });
    }
    parsed.points = parsed.points.slice(0, 4);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, style, data: parsed }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
