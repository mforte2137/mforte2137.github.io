// =========================================================
// multi-stakeholder-pack.js — Netlify function
// Path: /api/multi-stakeholder-pack
//
// Accepts POST with the full engagement description and returns
// AI-written CEO / CFO / IT & Operations proposal versions.
//
// Supports `regenKey` ("ceo" | "cfo" | "itops") to regenerate a
// single stakeholder version without touching the others.
// =========================================================

const STAKEHOLDER_LABELS = {
  ceo:   'CEO / Business Owner',
  cfo:   'CFO / Finance',
  itops: 'IT & Operations'
};

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

  const {
    clientType,
    clientName,
    industry,
    companySize,
    mspName,
    services,
    customEngagement,
    activeStakeholders,
    context,
    regenKey
  } = body;

  if (!clientName)  return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName is required.' }) };
  if (!industry)    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'industry is required.' }) };
  if (!Array.isArray(activeStakeholders) || activeStakeholders.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Select at least one stakeholder.' }) };
  }

  const targets = regenKey ? [regenKey] : activeStakeholders;
  const ctx = context || {};

  const engagementLines = [
    (services && services.length) ? `Services included: ${services.join(', ')}.` : '',
    (customEngagement && customEngagement.trim()) ? `Additional context on the engagement: ${customEngagement.trim()}` : ''
  ].filter(Boolean).join(' ');

  const stakeholderBriefs = targets.map(key => {
    const label = STAKEHOLDER_LABELS[key] || key;
    const note  = ctx[key] ? `Specific angle to address for this reader: ${ctx[key]}` : 'No specific angle provided — write strong general content for this reader.';
    return `- ${key} (${label}): ${note}`;
  }).join('\n');

  const jsonShape = {};
  targets.forEach(key => {
    if (key === 'cfo') {
      jsonShape[key] = { headline: 'string', comparisonTable: { headers: ['array of 4 short strings'], rows: ['array of 4 rows, each an array of 4 short strings'] }, body: 'string' };
    } else if (key === 'ceo') {
      jsonShape[key] = { headline: 'string', badges: ['array of exactly 3 short business-outcome phrases, 2-4 words each, no technology names'], body: 'string' };
    } else if (key === 'itops') {
      jsonShape[key] = { headline: 'string', timeline: [{ stage: 'string, e.g. "Day 1-30"', label: 'string, 2-5 words' }], body: 'string' };
    } else {
      jsonShape[key] = { headline: 'string', body: 'string' };
    }
  });

  const systemPrompt = `You are an expert MSP (Managed Service Provider) sales copywriter. You write short, sharp, stakeholder-specific sections of a sales proposal.

Client type: ${clientType === 'existing' ? 'EXISTING CLIENT — warmer tone, reference the established relationship, frame this as evolution not replacement.' : 'PROSPECT — credibility-building tone, address "why you?", establish trust from a standing start.'}

Rules for every version:
- Each version must feel genuinely written for that specific reader — not the same content with different headers.
- Industry context should be woven in naturally — a ${industry} organisation's risks and priorities differ from other verticals.
- Keep every section to 4-6 lines maximum — these are short widgets that sit alongside other proposal content.
- Never invent statistics. Only use well-known, real, citable benchmarks (e.g. IBM Cost of a Data Breach, Research and Markets MSP productivity data) when citing numbers, and only for the CFO version.
- Return JSON only. No preamble, no markdown, no backticks, no commentary.

Reader-specific rules:
- CEO / Business Owner: never mention technology by name. Talk about business outcomes, continuity, risk, and strategic partnership. Headline should be a risk-reframe or partnership statement. Also return "badges" — exactly 3 short business-outcome phrases (2-4 words, no tech names, e.g. "Predictable Operations", "24/7 Coverage", "Audit-Ready Compliance") that visually summarise the partnership's key benefits for this client.
- CFO / Finance: lead with numbers and comparisons. The comparisonTable must compare "Managed IT" (this proposal) vs "In-House IT" vs "Break-Fix" across 4 short rows (e.g. Monthly cost, Coverage, Risk exposure, Scalability). Every table cell must be qualitative only — 4-6 words maximum, NO specific pricing figures or invented numbers. Include one real, sourced statistic about the cost of a breach or downtime, and one real MSP productivity/cost-reduction benchmark, both used only as general framing, not as fabricated exact figures for this specific client.
- IT & Operations: be specific and practical about methodology — escalation, monitoring, change communication, what the first 30 days look like, and day-to-day staff impact. If the provided context mentions an internal IT person, acknowledge co-managed IT respectfully — the MSP as an extension, not a replacement. Also return "timeline" — exactly 3 stages that map to the transition process described in the body (e.g. stage "Day 1-30" / label "Onboarding & baselining", stage "Day 30+" / label "Steady-state support", stage "Monthly" / label "Reviews & priorities"), each label 2-5 words.

Return a JSON object with exactly this shape (only include the keys requested below):
${JSON.stringify(jsonShape, null, 2)}`;

  const userMessage = `Client: ${clientName}
Industry: ${industry}
Company size: ${companySize || 'not specified'}
MSP name: ${mspName || 'the MSP'}
${engagementLines}

Generate content for these stakeholders:
${stakeholderBriefs}`;

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API key not configured.' }) };
  }

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
        max_tokens: 1800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[multi-stakeholder-pack] Anthropic error', response.status, JSON.stringify(data));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: data.error?.message || 'AI request failed.' }) };
    }

    const text = data.content?.[0]?.text || '';
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error('[multi-stakeholder-pack] Bad JSON from AI:', text);
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, versions: parsed })
    };

  } catch (err) {
    console.error('[multi-stakeholder-pack] error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
