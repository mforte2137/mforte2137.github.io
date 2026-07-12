// =========================================================
// service-tier-builder.js — Netlify function
// Path: /api/service-tier-builder
//
// Accepts POST { tierCount, tierNames, services }
//   tierCount: 2 or 3
//   tierNames: array of strings, length === tierCount
//   services:  flat array of service name strings the MSP offers
//              (across their whole stack — not yet assigned to tiers)
//
// Returns { ok, tiers: [{ name, tagline, recommended, services: [{name, value}] }] }
//   value is "yes" | "no" | "partial" — the widget renders a symbol only,
//   no per-cell description text (matches the Matrix Creator cell style).
//   The MSP can still override any cell to custom text in the UI ("T" option)
//   after generation — that's a frontend-only edit, not part of the AI contract.
//
// Category grouping is NOT handled here — the frontend already knows which
// category each service belongs to (from its own SERVICE_LIBRARY) and groups
// rows itself when it builds the widget HTML.
// =========================================================

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { tierCount, tierNames, services } = body;

  if (!tierCount || (tierCount !== 2 && tierCount !== 3)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'tierCount must be 2 or 3.' }) };
  }
  if (!Array.isArray(tierNames) || tierNames.length !== tierCount) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: `tierNames must be an array of ${tierCount} names.` }) };
  }
  if (!Array.isArray(services) || services.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Select at least one service.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI is not configured on the server.' }) };
  }

  const tierGuidance = tierCount === 3
    ? `- Tier 1 ("${tierNames[0]}", entry/essential): Core monitoring, basic helpdesk, patch management, basic backup, standard antivirus/EDR lite. Business hours support. The "keep the lights on" tier.
- Tier 2 ("${tierNames[1]}", mid/professional): Everything in Tier 1 plus: full EDR, email security, MFA management, cloud backup, extended support hours, basic vCIO. The "well-managed" tier.
- Tier 3 ("${tierNames[2]}", premium): Everything in Tier 2 plus: MDR, dark web monitoring, PAM, full compliance support, dedicated account manager, monthly vCIO, DR planning. The "fully protected and strategic" tier.`
    : `- Tier 1 ("${tierNames[0]}", entry/essential): Core monitoring, basic helpdesk, patch management, basic backup, standard antivirus/EDR lite. Business hours support. The "keep the lights on" tier.
- Tier 2 ("${tierNames[1]}", premium): Everything in Tier 1 plus: full EDR, email security, MFA management, cloud backup, extended hours or 24/7 support, MDR/dark web monitoring if selected, vCIO, dedicated account manager. The "fully managed" tier.`;

  const systemPrompt = `You are an MSP (Managed Service Provider) packaging expert. Given a flat list of services an MSP offers, assign each service to the appropriate tier(s) out of exactly ${tierCount} tiers, following standard MSP good/better/best packaging patterns.

Tier definitions (in order, lowest to highest):
${tierGuidance}

Rules:
- For every service in every tier, output a "value" of exactly "yes" (fully included), "no" (not included), or "partial" (a limited or partial version is included).
- A service marked "yes" in a lower tier must also be "yes" in every higher tier (cumulative — nothing is removed going up). A "partial" in a lower tier may become "yes" in a higher tier.
- Every tier's "services" array must contain exactly one entry for every service in the input list, in the same order as given.
- Mark exactly one tier as "recommended": true (all others omit this field or set it false) — default to the middle tier for 3 tiers, or the higher tier for 2 tiers, unless the service mix clearly suggests otherwise.
- Write a short tagline (5-9 words) per tier describing who it's for or what it delivers.
- Do not invent services that were not in the input list.
- Do not write any descriptions — the widget shows only a symbol per cell, no text.

CRITICAL: Return raw JSON only. No prose, no markdown, no code fences, no explanation before or after.
Exactly this structure:
{"tiers":[{"name":"...","tagline":"...","recommended":true,"services":[{"name":"...","value":"yes"}]}]}`;

  const userMessage = `Tier names in order: ${tierNames.join(', ')}\nServices to assign:\n${services.map(s => `- ${s}`).join('\n')}`;

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
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `Anthropic API error (HTTP ${response.status})`;
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: errMsg }) };
    }

    const text = data.content?.[0]?.text || '';
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    if (!parsed || !Array.isArray(parsed.tiers) || parsed.tiers.length !== tierCount) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI response did not match the expected tier structure.' }) };
    }

    // Ensure exactly one tier is marked recommended — fall back to middle tier if AI omitted it
    const anyRecommended = parsed.tiers.some(t => t.recommended === true);
    if (!anyRecommended) {
      const fallbackIdx = tierCount === 3 ? 1 : (tierCount - 1);
      parsed.tiers.forEach((t, i) => { t.recommended = (i === fallbackIdx); });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, tiers: parsed.tiers })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected server error.' }) };
  }
};
