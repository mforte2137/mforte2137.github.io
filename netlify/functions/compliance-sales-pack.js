// =========================================================
// netlify/functions/compliance-sales-pack.js
// Path: /api/compliance-sales-pack
//
// Accepts POST {
//   framework, industry, engagement, customEngagement,
//   includeWidget4, regenKey
// }
//
// Returns { ok: true, widgets: { whyMatters, commonGaps, howWeGetThere, whatUnlocks? } }
// If regenKey is set, only that widget is generated and returned under that key.
// =========================================================

const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

const WIDGET_ORDER = ['whyMatters', 'commonGaps', 'howWeGetThere', 'whatUnlocks'];

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

  const { framework, industry, engagement, customEngagement, includeWidget4, regenKey } = body;

  if (!framework || !industry || !engagement) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'framework, industry, and engagement are required.' })
    };
  }

  const engagementLabel = engagement === 'Custom' && customEngagement
    ? customEngagement
    : engagement;

  const wantWidget4 = includeWidget4 !== false;
  const keysToGenerate = regenKey
    ? [regenKey]
    : WIDGET_ORDER.filter(k => k !== 'whatUnlocks' || wantWidget4);

  const systemPrompt = buildSystemPrompt(framework, industry, engagementLabel, keysToGenerate);
  const userMessage = JSON.stringify({
    framework,
    industry,
    engagement: engagementLabel,
    includeWidget4: keysToGenerate.includes('whatUnlocks')
  });

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[compliance-sales-pack] Anthropic error', response.status, JSON.stringify(data));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI service error.' }) };
    }

    const text = data.content && data.content[0] && data.content[0].text;
    if (!text) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI returned no content.' }) };
    }

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('[compliance-sales-pack] JSON parse error', text);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, widgets: parsed })
    };

  } catch (err) {
    console.error('[compliance-sales-pack] error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};

function buildSystemPrompt(framework, industry, engagementLabel, keys) {
  const shape = {};
  if (keys.includes('whyMatters')) {
    shape.whyMatters = {
      headline: 'string — punchy, framework + business specific',
      body: 'string — 3-5 short sentences, plain language, no jargon. Cover what the framework requires, then what non-compliance actually costs: fines/penalties with real public figures where they exist (e.g. GDPR up to 4% of global turnover, HIPAA up to $1.9M per violation category), audit failure consequences, insurance implications, reputational damage specific to this industry. Calm and factual, not alarmist.'
    };
  }
  if (keys.includes('commonGaps')) {
    shape.commonGaps = {
      headline: `string — e.g. "Where Most ${industry} Businesses Fall Short"`,
      gaps: [{ name: 'short gap name', why: 'one sentence on why it is typically missing', consequence: 'one sentence on the business consequence' }, '... 3 to 4 gaps total']
    };
  }
  if (keys.includes('howWeGetThere')) {
    shape.howWeGetThere = {
      headline: 'string',
      body: 'string — 3-5 short sentences. What the engagement includes based on the engagement type, what the client does vs what the MSP handles, what the end state looks like. Confident, practical, partner tone.',
      timeline: 'string — short, framework-appropriate timeline phrase, e.g. "Typically 3-6 months to full compliance documentation"'
    };
  }
  if (keys.includes('whatUnlocks')) {
    shape.whatUnlocks = {
      headline: 'string',
      benefits: ['3 to 4 short strings — specific business outcomes, not abstract trust statements']
    };
  }

  return `You write customer-facing sales widgets for an MSP (Managed Service Provider) proposing a compliance engagement to a business owner. Output is read by a non-technical business owner, not an IT person.

Context for this generation:
- Compliance framework: ${framework}
- Client industry: ${industry}
- What the MSP is proposing: ${engagementLabel}

Rules:
- Plain language. No technical jargon. No acronyms without a one-clause explanation.
- Widget "whyMatters": use real, public penalty/fine figures where they genuinely exist for this framework. Never invent figures. If no specific figure is well known for this framework, describe the consequence qualitatively instead of fabricating a number.
- Widget "commonGaps": use genuine, well-documented knowledge of common compliance gaps for this industry and framework. Frame every gap as an observation, not an accusation — use language like "Most ${industry} businesses we work with haven't yet..." never "You are missing...". Do not invent or exaggerate; these should be accurate and typical for the vast majority of SMBs in this industry.
- Widget "howWeGetThere": timeline must be realistic and framework-appropriate. Rough guidance: Cyber Essentials can be weeks; HIPAA typically 3-6 months; SOC 2 typically 6-9 months to first report; ISO 27001 typically 6-12 months; NIST CSF varies by scope, often 3-9 months; CMMC typically 6-18 months depending on the level being pursued; FedRAMP is typically 12-24 months given the assessment and authorization process; CIS Controls implementation can range from a few weeks to a few months depending on how many Implementation Group controls are in scope. Use judgment for the specific framework given rather than defaulting to one number.
- Widget "whatUnlocks": focus on concrete business outcomes (contracts won, premiums reduced, audits passed) not abstract trust statements. Tailor at least one benefit to the specific industry given.
- Tone across all widgets: calm, expert, partner. Never alarmist, never condescending.
- Weave the specific industry and framework into every widget so it reads as written for this exact business, not generic.

Return ONLY a JSON object with this exact shape (no markdown, no backticks, no preamble, no explanation):
${JSON.stringify(shape, null, 2)}`;
}
