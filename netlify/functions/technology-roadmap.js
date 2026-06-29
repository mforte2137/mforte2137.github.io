/* =============================================
   Technology Roadmap Builder — Netlify Function
   netlify/functions/technology-roadmap.js
   ============================================= */

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  if (!body.clientName) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'clientName is required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };
  }

  const isProspect  = body.clientType !== 'existing';
  const toneNote    = isProspect
    ? 'Tone: aspirational and collaborative — use "together", "we\'ll", "your goals". Frame as a vision the MSP will help them achieve.'
    : 'Tone: continuation and strategic — reference the established partnership, frame as natural evolution. Use "as we continue", "our next chapter", "building on what we\'ve achieved".';

  const isAiPhases  = body.phaseMode !== 'manual';
  const horizon     = body.roadmapHorizon || '24 months';

  // Build stack summary, handling multi-select arrays
  function stackVal(v) {
    if (Array.isArray(v)) return v.length ? v.join(', ') : 'Not specified';
    return v || 'Not specified';
  }
  const stack = body.stack || {};
  const stackSummary = [
    `Endpoints: ${stackVal(stack.endpoints)}`,
    `Email: ${stackVal(stack.email)}`,
    `Security: ${stackVal(stack.security)}`,
    `Backup: ${stackVal(stack.backup)}`,
    `Connectivity: ${stackVal(stack.connectivity)}`,
    `Server: ${stackVal(stack.server)}`,
    `Remote access: ${stackVal(stack.remote)}`,
    `Identity: ${stackVal(stack.identity)}`,
    `Compliance: ${stackVal(stack.compliance)}${stack.complianceCert ? ` (${stack.complianceCert})` : ''}`,
    `IT support: ${stackVal(stack.itSupport)}`
  ].join(' | ');

  // Phase instructions vary by mode
  const phaseInstruction = isAiPhases
    ? `PHASE BUILDING: You are building the phases from scratch to fit within a total horizon of ${horizon}. Distribute the three phases across this window intelligently. For shorter horizons (6–12 months), keep phases tight and focused on immediate impact. For longer horizons (24–36 months), allow more breathing room and include strategic transformation in later phases. Phase 1 should address immediate security and stability gaps (Critical priority); Phase 2 should optimize and modernize core infrastructure (High priority); Phase 3 should deliver strategic transformation and competitive advantage (Strategic priority). Draw from the goals and stack assessment to decide which services go in which phase. Use appropriate labels (Stabilize / Optimize / Transform or similar). Ensure all three phase timeframes together add up to approximately ${horizon}.`
    : `PHASE BUILDING: Use the phases exactly as provided by the MSP. Do not invent or reorder services. Write outcomes that match the specific services in each phase.`;

  const manualPhaseSummary = !isAiPhases && (body.phases || []).filter(p => p.services && p.services.length).map(p =>
    `Phase ${p.number}${p.label ? ` (${p.label})` : ''}: ${p.timeframe || 'TBD'} | Priority: ${p.priority || 'unset'} | Services: ${p.services.join(', ')}`
  ).join('\n');

  const systemPrompt = `You are an expert MSP copywriter generating executive-facing technology roadmap content for a US-based MSP. Return ONLY valid JSON — no preamble, no markdown, no backticks.

RULES:
- Write in US English throughout (optimize not optimise, center not centre, fiber not fibre, etc.)
- Write for a business owner or executive — no unexplained technical jargon or acronyms
- ${toneNote}
- Phase outcomes are the most important part — each must be a clear business benefit, not a technical description
- Business outcomes must map directly to the selected goals — do not invent goals that were not chosen
- Investment Summary: frame as phased, planned investment — never mention specific prices. Use budget range only to frame scale if provided.
- Weave industry context into all content — a healthcare roadmap reads very differently from a construction roadmap
- Keep every widget concise — executives scan, not read
- ${phaseInstruction}
- Return JSON only — no preamble, no markdown, no backticks

Return this exact JSON shape:
{
  "whereYouAreToday": {
    "headline": "...",
    "body": "Two to three short paragraphs separated by newline characters (\\n). Acknowledge genuine strengths first, then gaps. Empathetic tone — makes the roadmap feel necessary, not a judgment."
  },
  "roadmap": {
    "headline": "Your Technology Roadmap",
    "phases": [
      {
        "label": "Phase label (e.g. Stabilize)",
        "timeframe": "0–3 months",
        "priority": "Critical",
        "services": ["Service 1", "Service 2", "Service 3"],
        "outcome": "One clear sentence stating the business benefit achieved — not a technical description."
      }
    ]
  },
  "businessOutcomes": {
    "headline": "What This Means for Your Business",
    "outcomes": [
      { "goal": "Exact goal name from the list provided", "result": "One sentence outcome in the client's language, not the MSP's." }
    ]
  },
  "investmentSummary": {
    "headline": "Phased Investment Overview",
    "body": "Three to four sentences. Frame the commitment as a planned, phased investment. Close with a confident forward statement. No specific prices."
  }
}`;

  const userMessage = `Generate technology roadmap content for the following:

Client: ${body.clientName}
Client type: ${isProspect ? 'Prospect' : 'Existing customer'}
Industry: ${body.industry || 'Not specified'}
Company size: ${body.companySize || 'Not specified'}
Locations: ${body.locationCount || 'Not specified'}

Current stack: ${stackSummary}
${stack.notes ? `Stack notes: ${stack.notes}` : ''}

Business goals: ${(body.goals || []).join(', ') || 'Not specified'}

${isAiPhases
  ? `Phase mode: AI-generated — build optimal phases from best practices for this profile, fitting within a ${horizon} total horizon.`
  : `Phase mode: Manual — use exactly as provided:\n${manualPhaseSummary}`
}

Budget range: ${body.budget || 'Not disclosed'}
Constraints: ${(body.constraints || []).join(', ') || 'None specified'}
${body.notes ? `Additional notes: ${body.notes}` : ''}`;

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

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API error: ' + txt.slice(0, 200) }) };
    }

    const aiData = await aiRes.json();
    const text   = aiData.content?.[0]?.text || '';

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Raw: ' + text.slice(0, 300) }) };
    }

    if (!parsed.whereYouAreToday || !parsed.roadmap || !parsed.businessOutcomes || !parsed.investmentSummary) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI response missing required sections.' }) };
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        ok: true,
        whereYouAreToday:  parsed.whereYouAreToday,
        roadmap:           parsed.roadmap,
        businessOutcomes:  parsed.businessOutcomes,
        investmentSummary: parsed.investmentSummary
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
