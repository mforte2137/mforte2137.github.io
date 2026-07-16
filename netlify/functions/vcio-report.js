// =========================================================
// vcio-report.js — Netlify function
// Path: /api/vcio-report
//
// Accepts POST { clientName, mspName, reportType, period, data }
// Returns   { ok: true, narrative: { openingNote, helpdeskNarrative,
//              securityNarrative, infrastructureNarrative,
//              recommendationsNarrative, closingNote } }
//
// AI writes narrative only — numbers are used directly in the
// frontend output as entered. The AI does not calculate, interpret,
// or alter any numbers.
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

  // 4. Validate required fields
  const { clientName, reportType, period } = body;
  if (!clientName || !reportType || !period) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'clientName, reportType, and period are required.' })
    };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI API key not configured.' }) };
  }

  const hasPreviousPeriod = !!(body.previousPeriod && body.previousPeriod.data);
  const systemPrompt = buildSystemPrompt(reportType, hasPreviousPeriod);
  const userMessage = JSON.stringify({
    clientName,
    mspName: body.mspName || '',
    reportType,
    period,
    data: body.data || {},
    ...(hasPreviousPeriod ? { previousPeriod: body.previousPeriod } : {})
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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: data.error?.message || 'AI request failed.' })
      };
    }

    const text = data.content?.[0]?.text || '';
    let narrative;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      narrative = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, narrative }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};

function buildSystemPrompt(reportType, hasPreviousPeriod) {
  const depthGuidance = {
    monthly: 'Operational and specific — use the numbers prominently, write for an IT contact or operations lead. 2-3 sentences per section.',
    quarterly: 'Reflective and strategic — step back from individual metrics, write for a business owner or CFO. Business language, not technical jargon. 2-4 sentences per section.',
    snapshot: 'Brief and visual — 1-2 sentences per section maximum, designed to be scanned not read.'
  }[reportType] || 'Professional and clear.';

  const previousPeriodGuidance = hasPreviousPeriod ? `

Previous period data:
The user message includes a "previousPeriod" object with that client's data and period label from their last generated report. Use it as follows:
- You may reference clear numeric changes between the two periods (e.g. "up from 98.2% last month" or "threats blocked nearly doubled from 180 to 312"), but only when both the current and previous values for that specific metric are present.
- You may follow up on the previous period's recommendation (previousPeriod.data.recommendations) by name — e.g. "last month we flagged the SQL Server 2016 end-of-life; following up on that" — but do NOT assume it was resolved, ignored, or acted upon. Only the current period's own data and recommendation determine what's true now. If the current data doesn't say whether it was addressed, ask rather than assert (e.g. "has a migration meeting been scheduled?") rather than stating it as fact.
- If a metric has no equivalent in the previous period, or the current value is null, do not force a comparison — write it as you normally would.
- This should read as continuity in an ongoing relationship, not a data-diff report. Comparisons belong in at most one sentence per section, woven into the narrative — not a mechanical "previously X, now Y" every time.` : '';

  return `You are writing narrative sections for an MSP client report. Return JSON only — no preamble, no markdown, no backticks.

Report type: ${reportType}
Depth and tone: ${depthGuidance}

Rules:
- Never invent numbers. Use only the numbers provided in the data. If a field is null, write a qualitative statement instead (e.g. "we maintained strong availability throughout the period" without citing a number).
- Highlight fields: always incorporate them naturally — these are the moments that matter most to the client relationship.
- Tone: professional, warm, partner-like. This is a relationship communication, not a technical report.
- The MSP name should appear naturally in at least one place (e.g. "the Acme IT Solutions team resolved...").
- Use industry context where relevant if it can be inferred from the client name or data (e.g. healthcare gets patient-data/uptime language) — but do not force it if there's no signal.${previousPeriodGuidance}

Return a JSON object with exactly these keys:
{
  "openingNote": "1-2 sentence opening for the report",
  "helpdeskNarrative": "narrative for the helpdesk section, or empty string if not applicable to this report type",
  "securityNarrative": "narrative for the security section",
  "infrastructureNarrative": "narrative for the infrastructure section",
  "recommendationsNarrative": "narrative expanding on the recommendations text provided",
  "closingNote": "1-2 sentence closing, thanking the client for the partnership"
}`;
}
