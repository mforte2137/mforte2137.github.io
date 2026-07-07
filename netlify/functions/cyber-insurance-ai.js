// =========================================================
// netlify/functions/cyber-insurance-ai.js
// Generates cover-letter copy, gap-explanation copy, and path-to-readiness
// copy via Claude Haiku — one call, one function file per the tool's
// one-function-per-tool convention (mode-style switch, same idea as
// complementary-services.js's `mode` param).
//
// Available at /api/cyber-insurance-ai
//
// Accepts POST { clientName, industry, score, scoreBandLabel, gaps, includePathToReadiness }
//   gaps: [{ control, status, severity }]  — may be an empty array
//
// Returns:
// { ok: true,
//   coverLetter: { opening, summaryFraming, closing },
//   gapExplanations: [{control, explanation}],
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

  const { clientName, industry, score, scoreBandLabel, gaps, includePathToReadiness } = body;

  // 4. Validate — gaps must be an array, but CAN be empty (a fully compliant
  // client still needs a cover letter; only gap/path copy becomes moot).
  if (!Array.isArray(gaps)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'gaps array is required (it may be empty).' }) };
  }

  // 5. Build prompt
  const systemPrompt = `You write plain-language copy for MSP sales proposals about cyber insurance readiness, and a short professional cover letter introducing the assessment, for a business owner audience — no technical jargon.

SECTIONS TO WRITE:

1. Cover letter copy — ALWAYS write this, regardless of whether there are any gaps:
   - opening: exactly 2 sentences. Warmly introduces the purpose of this readiness assessment. Reference the industry naturally only if it fits — don't force it.
   - summaryFraming: exactly 1 sentence framing what the results mean in plain business terms (urgency or risk to coverage/premium if gaps exist; reassurance and reinforcement if the score is strong). Do NOT restate the numeric score or gap counts yourself — those are inserted separately by the application, you are only writing the sentence that surrounds them.
   - closing: exactly 2 sentences. Transition into "the following pages detail our specific findings and the recommended path forward." Confident, forward-looking tone.

2. Gap explanations — only meaningful if gaps are provided. For each gap, one factual sentence referencing insurer behaviour specifically, e.g. "Most underwriters now require..." or "Claims related to X may be denied without...". If industry context fits naturally (Healthcare → HIPAA implications, Legal → client data, Financial Services → regulatory requirements), you may reference it — don't force it.

3. Path to readiness — only if requested. One short line per gap naming a generic SERVICE CATEGORY that addresses it (never a vendor name or specific product), plus one closing sentence.
${includePathToReadiness ? '' : 'pathToReadiness was not requested this call — return it as { "items": [], "closing": "" }.'}
${gaps.length === 0 ? 'No gaps were provided — return gapExplanations as an empty array.' : ''}

OUTPUT FORMAT:
Return a valid JSON object only. No preamble, no explanation, no markdown, no backticks. The JSON must have exactly these keys:
{
  "coverLetter": { "opening": "...", "summaryFraming": "...", "closing": "..." },
  "gapExplanations": [{ "control": "control name exactly as given", "explanation": "one sentence" }],
  "pathToReadiness": { "items": [{ "control": "control name exactly as given", "description": "one line service category" }], "closing": "one closing sentence" }
}
coverLetter must always be fully populated even when gaps is empty.`;

  const userMessage = `CLIENT: ${clientName || 'the client'}
INDUSTRY: ${industry || 'not specified'}
READINESS SCORE: ${typeof score === 'number' ? score.toFixed(1) + '/10' : 'not provided'}
RISK BAND: ${scoreBandLabel || 'not provided'}

GAPS:
${gaps.length ? gaps.map(g => `- ${g.control} — status: ${g.status}, severity: ${g.severity}`).join('\n') : '(none — this client is fully compliant across all controls reviewed)'}

Write the cover letter copy${gaps.length ? ', the gap explanations,' : ','}${includePathToReadiness ? ' and the path-to-readiness copy' : ''}. Return JSON only.`;

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
        max_tokens: 1500,
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
      coverLetter: parsed.coverLetter || { opening: '', summaryFraming: '', closing: '' },
      gapExplanations: parsed.gapExplanations || [],
      pathToReadiness: parsed.pathToReadiness || { items: [], closing: '' }
    })
  };
};
