// =========================================================
// product-explainer.js — Netlify function
// Path: /api/product-explainer
//
// TWO REQUEST SHAPES, same endpoint:
//
// 1. Single product — POST { name, category, context, style, knownSpecs }
//    Response: { ok:true, style, data: { category, headline, intro,
//      points:[{icon,title,description,badge}] x4, footerText, footerBadge } }
//    style only steers tone — response shape is always the same so the
//    frontend can switch Style 1/2/3 instantly client-side.
//
// 2. Bundle — POST { items: [{name, category, context}, ...] }
//    One AI call for the whole bundle (not one call per item — items only
//    need a single line each, not a full 4-point explainer, so a per-item
//    call would be both slower and wasted output).
//    Response: { ok:true, data: { headline, intro,
//      items:[{name, blurb}] } }  — same order as input, one blurb each.
//    Hero-vs-compact placement is a FRONTEND decision (based on whether
//    image-matching found a photo for that item), not something the AI
//    decides here.
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

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API key not configured.' }) };
  }

  async function callClaude(systemPrompt, userMessage) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const msg = (data && data.error && data.error.message) || `AI request failed (HTTP ${response.status}).`;
      throw new Error(msg);
    }
    const text = (data.content && data.content[0] && data.content[0].text) || '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  // Shared disambiguation guidance — same rule used for single-product
  // requests, condensed for reuse in the bundle prompt too.
  const DISAMBIGUATION_RULES = `Disambiguation — this matters: when a product name is just a brand plus a bare number (e.g. "Dell 7450", "Meraki 68", with no descriptive words like "laptop" or "firewall"), do NOT guess an unrelated or obscure product category for that number. Instead default to that brand's most common everyday MSP product line:
- Dell, HP, Lenovo, Apple, Asus, Acer + bare number -> business laptop. Note: Dell renamed its lineup twice in 2025-2026 — "Dell Latitude" (legacy, still valid for existing-fleet/replacement references) and the current "Dell Pro 3/5/7/Premium" (business laptops) and "Dell Pro Precision" (workstations, formerly Precision) are the SAME kind of product under different names depending on when it was bought. Don't treat "Dell Pro" as an unfamiliar or unrelated product — it's Dell's current business laptop line.
- Meraki, Cisco, SonicWall, Fortinet, WatchGuard, Aruba + bare number -> network security appliance
- Ubiquiti / UniFi (same company, either name used) + a model code like "U6", "UDM", "USW" -> access point / gateway / switch as the code indicates
- Yealink, Poly, Grandstream + bare number -> VoIP desk phone
- APC, Eaton, TrippLite + bare number -> UPS / battery backup
- Synology, QNAP + bare number -> NAS storage device
Each item's own category field is also authoritative context — stay consistent with it.`;

  // ── BUNDLE MODE ──────────────────────────────────────────
  if (Array.isArray(body.items)) {
    const items = body.items
      .map(i => ({
        name:     String((i && i.name) || '').trim(),
        category: String((i && i.category) || '').trim(),
        context:  String((i && i.context) || '').trim()
      }))
      .filter(i => i.name);

    if (!items.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one bundle item with a name is required.' }) };
    }

    const bundleSystemPrompt = `You write short, benefit-led copy for an MSP (Managed Service Provider) sales bundle — several products/services grouped into one line item for a business owner, not a technician.

You'll receive a list of items, each with a name, category, and optional one-line context. For EACH item, write exactly ONE short benefit-led sentence — not a paragraph, not multiple bullets — describing what it does for the business, in plain language with no jargon.

You'll also write ONE umbrella headline and a 1-2 sentence intro framing the WHOLE bundle as a cohesive package — not just listing the items, but describing the outcome of having them together (e.g. for a remote-worker hardware set: "Everything a new hire needs to be productive from day one.").

${DISAMBIGUATION_RULES}

If an item has custom context, weave it naturally into that ONE item's blurb where it adds something real (a scenario, reason, or constraint). If context is empty or too vague to add anything, ignore it rather than straining to reference it.

Return JSON only — no preamble, no markdown, no backticks. Use exactly this shape, with exactly one items entry per input item, in the same order:
{"headline":"...","intro":"...","items":[{"name":"...","blurb":"..."}]}`;

    const userMessage = JSON.stringify({ items });

    try {
      const parsed = await callClaude(bundleSystemPrompt, userMessage);

      // Defensive: force items to match input length/order — the AI
      // response drives blurb text only, never which items exist.
      const safeItems = items.map((input, idx) => {
        const match = Array.isArray(parsed.items) ? parsed.items[idx] : null;
        return {
          name: input.name,
          blurb: (match && match.blurb) ? String(match.blurb) : ''
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          data: {
            headline: parsed.headline || '',
            intro: parsed.intro || '',
            items: safeItems
          }
        })
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Bundle generation failed.' }) };
    }
  }

  // ── SINGLE PRODUCT MODE (unchanged) ──────────────────────
  const name       = (body.name || '').trim();
  const category   = (body.category || '').trim();
  const context    = (body.context || '').trim();
  const style      = (body.style || 'layered').trim(); // 'layered' | 'numbered' | 'grid' — tone hint only
  const knownSpecs = Array.isArray(body.knownSpecs) ? body.knownSpecs.filter(Boolean) : [];

  // 4. Validate
  if (!name) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Product or service name is required.' }) };
  }

  const systemPrompt = `You write short, benefit-led explainer copy for MSP (Managed Service Provider) sales quotes. The reader is a business owner, not a technician — never use jargon or acronyms without explaining them in plain terms.

You have strong knowledge of common MSP products and services (Meraki, Dell, Yealink, Microsoft 365 SKUs, Datto, SentinelOne, Huntress, Acronis, Veeam, and similar). For recognised products, write accurate benefit content from that knowledge without needing a description.

Custom context handling — the rep typing this is in a hurry and will often type a short fragment, not a full sentence (e.g. "broken display screen", "replacing a stolen device"). Treat terse fragments as fully valid input; do not expect or require clean grammar.
- If the context describes a specific scenario, reason, or constraint: it must show up in the intro AND shape at least one of the points — not just the opening line. E.g. context "broken display screen" should produce a point about fast replacement / minimal downtime / matching the existing fleet configuration, not just a mention in the intro followed by three generic laptop bullets.
- If the context is empty, or is too vague/generic to add anything real (e.g. "upgrade", "new one needed", or it just restates the product name), do not force it into a point — let the points stand as strong generic value props instead. Straining to reference a few vague words produces worse copy than leaving it out.

${DISAMBIGUATION_RULES}

Rules:
- Headline: benefit-led, not product-name-led. E.g. "Stop Phishing Before It Reaches Your Team" not "Phishing Awareness Training Service".
- Intro: 1–2 sentences maximum, plain language — what it does and why it matters.
- Always write exactly 4 points, each with: a short icon (single emoji, category-appropriate — security gets shields/locks, cloud gets cloud/lightning, hardware gets device-appropriate emoji), a short title/label, a one-line description, and a badge chosen from: Included, Recommended, Essential, Standard, Premium (pick whichever fits that point best). The first 3 points should stand alone as the most important; the 4th is used only in some layouts, so make sure all 4 are genuinely useful, not filler.
- Also write a short one-line footerText (a reassurance, e.g. "Managed & supported by your IT team") and a short footerBadge (e.g. "✓ Fully managed").
- The requested layout style is "${style}" — this only affects tone/emphasis slightly, not the response structure, which is always the same.
${knownSpecs.length ? `
Known specs for this exact product (authoritative — a human verified these, they are not your own recollection): 
${knownSpecs.map(s => `- ${s}`).join('\n')}
Use these facts to write at least one of the points so it's genuinely specific to THIS model rather than generic for the product family — translate them into plain benefit language, don't just list the raw spec. Do not state any additional specific number (port counts, capacities, user counts, speeds) beyond what's given here — if you want to make a claim needing a number not listed above, keep that claim qualitative instead ("built for larger teams" rather than a guessed figure).` : ''}

Return JSON only — no preamble, no markdown, no backticks. Use exactly this shape:
{"category":"...","headline":"...","intro":"...","points":[{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."},{"icon":"emoji","title":"...","description":"...","badge":"..."}],"footerText":"...","footerBadge":"..."}`;

  const userMessage = JSON.stringify({ name, category, context, style });

  try {
    const parsed = await callClaude(systemPrompt, userMessage);

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
