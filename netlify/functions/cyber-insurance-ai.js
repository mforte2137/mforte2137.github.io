// =========================================================
// netlify/functions/cyber-insurance-ai.js
// Generates gap-explanation and path-to-readiness copy via Claude Haiku.
// Pattern matches complementary-services.js / case-study-widget.js exactly.
//
// Available at /api/cyber-insurance-ai
//
// Accepts POST { clientName, industry, gaps, includePathToReadiness }
//   gaps: [{ control, status, severity }]
//
// Returns:
// { ok: true, gapExplanations: [{control, explanation}],
//   pathToReadiness: { items: [{control, description}], closing } }
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

  const { clientName, industry, gaps, includePathToReadiness } = body;

  // 4. Validate
  if (!Array.isArray(gaps)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'gaps array is required.' }) };
  }
  if (gaps.length === 0) {
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: true, gapExplanations: [], pathToReadiness: { items: [], closing: '' } })
    };
  }

  // 5. Build prompt
  const systemPrompt = `You write plain-language copy for MSP sales proposals about cyber insurance readiness, for a business owner audience — no technical jargon.

RULES:
- Gap explanations: exactly one factual sentence per gap. Reference insurer behaviour specifically, e.g. "Most underwriters now require..." or "Claims related to X may be denied without...".
- If industry context fits naturally, you may reference it (Healthcare → HIPAA implications, Legal → client data, Financial Services → regulatory requirements). Do not force it if it doesn't fit.
- Path to readiness: one short line per gap naming a generic SERVICE CATEGORY that addresses it — never a vendor name or specific product.
- Also write one closing sentence for the path-to-readiness widget.
${includePathToReadiness ? '' : '- pathToReadiness was not requested this call — return it as { "items": [], "closing": "" }.'}

OUTPUT FORMAT:
Return a valid JSON object only. No preamble, no explanation, no markdown, no backticks. The JSON must have exactly these keys:
{
  "gapExplanations": [{ "control": "control name exactly as given", "explanation": "one sentence" }],
  "pathToReadiness": { "items": [{ "control": "control name exactly as given", "description": "one line service category" }], "closing": "one closing sentence" }
}`;

  const userMessage = `CLIENT: ${clientName || 'the client'}
INDUSTRY: ${industry || 'not specified'}

GAPS:
${gaps.map(g => `- ${g.control} — status: ${g.status}, severity: ${g.severity}`).join('\n')}

Write the gap explanations${includePathToReadiness ? ' and the path-to-readiness copy' : ''}. Return JSON only.`;

  // 6. Call Claude — API key fallback pattern
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };
  }

  let aiText;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok || !aiData.content || !aiData.content[0]) {
      throw new Error(aiData.error?.message || 'Claude returned an unexpected response.');
    }

    aiText = aiData.content[0].text;
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI call failed: ' + e.message }) };
  }

  // 7. Parse AI JSON — strip + try/catch
  let parsed;
  try {
    const clean = aiText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Please try again.' }) };
  }

  // 8. Return consistent shape
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      gapExplanations: parsed.gapExplanations || [],
      pathToReadiness: parsed.pathToReadiness || { items: [], closing: '' }
    })
  };
};
