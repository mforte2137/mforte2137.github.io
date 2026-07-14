/* =====================================================
   netlify/functions/it-maturity.js
   IT Maturity Assessment Widget — target-setting + narrative via Claude Haiku.
   ===================================================== */

const DIMENSION_LABELS = {
  security: 'Security',
  continuity: 'Business Continuity',
  productivity: 'Productivity & Cloud',
  compliance: 'Compliance & Risk',
  strategicAlignment: 'Strategic Alignment'
};

const LEVEL_LABELS = { 1: 'Reactive', 2: 'Managed', 3: 'Optimised', 4: 'Strategic' };

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
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
  }

  // 4. Validate required fields
  const { clientName, industry, companySize, ratings } = body;
  if (!clientName || !clientName.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName is required.' }) };
  }
  if (!industry || !industry.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'industry is required.' }) };
  }
  if (!companySize || !companySize.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'companySize is required.' }) };
  }
  const dimKeys = Object.keys(DIMENSION_LABELS);
  if (!ratings || typeof ratings !== 'object') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'ratings object is required.' }) };
  }
  for (const key of dimKeys) {
    const val = ratings[key];
    if (!Number.isInteger(val) || val < 1 || val > 4) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: `ratings.${key} must be an integer 1-4.` })
      };
    }
  }

  // 5. Build prompts
  const systemPrompt = `You are an experienced vCIO advisor helping an MSP (Managed Service Provider) explain a client's IT maturity to a business owner.

You have two jobs:

JOB 1 — Set a target maturity level (1-4) for each of five dimensions, based on the client's industry and company size:
- 1 = Reactive, 2 = Managed, 3 = Optimised, 4 = Strategic
- Healthcare, Legal, and Finance industries: Security target minimum 3 (Optimised), Compliance target minimum 3 (Optimised)
- Small businesses (1-50 employees): targets typically 2-3 (Managed to Optimised) — Strategic (4) is rarely appropriate at this size
- Mid-market (51-200 employees): targets typically 3 (Optimised) across most dimensions
- Never set a target more than 2 levels above the current rating — the gap should feel achievable, not overwhelming
- If the current rating is already 4 (Strategic), the target must stay at 4 — no gap, acknowledge the achievement
- Targets can later be overridden by the MSP, so make your best professional judgement

JOB 2 — Write a short narrative (3-5 sentences) that:
- Acknowledges what's working well before addressing gaps — never lead with criticism
- Names the single biggest-gap dimension as the priority, with the business reason why it matters for this industry/size
- Describes what moving toward the targets looks like in business terms (not technical jargon)
- Optionally closes with a soft handoff line about a technology roadmap addressing these priorities over the next 12 months
- Uses industry-specific risk language where relevant: healthcare gets HIPAA/patient data, legal gets client privilege, finance gets regulatory exposure
- Tone: advisory, confident, constructive — a trusted partner, not a salesperson
- Written for a business owner — no technical jargon

OUTPUT FORMAT:
Return a valid JSON object only. No preamble, no explanation, no markdown, no backticks. The JSON must have exactly these keys:
{
  "targets": { "security": 1-4, "continuity": 1-4, "productivity": 1-4, "compliance": 1-4, "strategicAlignment": 1-4 },
  "targetRationale": { "security": "one sentence", "continuity": "one sentence", "productivity": "one sentence", "compliance": "one sentence", "strategicAlignment": "one sentence" },
  "narrative": "3-5 sentence paragraph"
}`;

  const ratingLines = dimKeys
    .map((key) => `- ${DIMENSION_LABELS[key]}: ${ratings[key]} (${LEVEL_LABELS[ratings[key]]})`)
    .join('\n');

  const userMessage = `CLIENT: ${clientName}
INDUSTRY: ${industry}
COMPANY SIZE: ${companySize}

CURRENT RATINGS:
${ratingLines}

Set target levels for each dimension and write the narrative. Return JSON only.`;

  // 6. Call Claude
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
        max_tokens: 1000,
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

  // 7. Parse AI JSON
  let result;
  try {
    const clean = aiText.replace(/```json|```/g, '').trim();
    result = JSON.parse(clean);
  } catch {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Please try again.' })
    };
  }

  // 8. Validate expected shape, clamp targets to sane bounds, never below current
  if (!result.targets || !result.narrative) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI response missing required keys.' })
    };
  }
  for (const key of dimKeys) {
    let t = result.targets[key];
    if (!Number.isInteger(t) || t < 1 || t > 4) t = ratings[key];
    if (t < ratings[key]) t = ratings[key];
    result.targets[key] = t;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      targets: result.targets,
      targetRationale: result.targetRationale || {},
      narrative: result.narrative
    })
  };
};
