// =========================================================
// renewal-pack.js — Netlify function
// Path: /api/renewal-pack
//
// Receives quote data + context from the frontend.
// Uses Claude tool-use (forced) to return structured widget
// content — same pattern as bid-analyze.js for reliability.
//
// Returns five widgets: valueDelivered, partnership,
// continuity, whatsIncluded, whatsNext.
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ── Tool schema ──────────────────────────────────────────
const WIDGETS_TOOL = {
  name: 'generate_renewal_widgets',
  description: 'Generate five renewal widgets based on the provided quote and client context.',
  input_schema: {
    type: 'object',
    properties: {
      valueDelivered: {
        type: 'object',
        description: 'Widget 1 — Proves the relationship has been worth it.',
        properties: {
          headline: { type: 'string', description: 'Punchy headline, metric-driven if stats exist. Max 10 words.' },
          body:     { type: 'string', description: '3–5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      partnership: {
        type: 'object',
        description: 'Widget 2 — Frames the relationship as a partnership, not a vendor transaction.',
        properties: {
          headline: { type: 'string', description: 'Warm, relationship-focused. Max 10 words.' },
          body:     { type: 'string', description: '3–5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      continuity: {
        type: 'object',
        description: 'Widget 3 — Makes the case for staying without being defensive.',
        properties: {
          headline: { type: 'string', description: 'Direct and practical. Max 10 words.' },
          body:     { type: 'string', description: '3–5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      whatsIncluded: {
        type: 'object',
        description: "Widget 4 — What's included in the renewed agreement.",
        properties: {
          headline: { type: 'string', description: 'Clear and direct. Max 10 words.' },
          body:     { type: 'string', description: 'Each service on its own line with a one-sentence plain-language value statement. Use \\n between services.' }
        },
        required: ['headline', 'body']
      },
      whatsNext: {
        type: 'object',
        description: "Widget 5 — What's Next (standard) or Our Commitment Going Forward (at-risk).",
        properties: {
          headline: { type: 'string', description: 'Forward-looking (standard) or commitment-framing (at-risk). Max 10 words.' },
          body:     { type: 'string', description: '3–5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      }
    },
    required: ['valueDelivered', 'partnership', 'continuity', 'whatsIncluded', 'whatsNext']
  }
};

// ── System prompt by mode ─────────────────────────────────
function buildSystemPrompt(mode, personalised) {
  const mergeTip = personalised
    ? 'Use {{company.name}} and {{servicingBranch.name}} naturally — once or twice across all widgets, not in every sentence.'
    : 'Do not use merge tags.';

  const toneTip = mode === 'at-risk'
    ? `Tone: Empathetic first, factual second. Never defensive. Acknowledge the client's concern directly in Widget 3 (continuity) before making the case — do not write a generic switching-cost argument. Widget 5 must feel like a genuine commitment, not a sales pitch.`
    : `Tone: Confident, warm, forward-looking. The client is happy — reinforce the relationship and build momentum.`;

  return `You are a senior MSP account manager writing renewal proposal content.

${toneTip}

Rules:
- Use stats and highlights prominently when provided — specific numbers are more persuasive than general claims
- If stats are missing, write around them using the services and highlights — never invent numbers
- Keep each widget body to 3–5 sentences maximum — brevity is essential
- Widget 4 (whatsIncluded): describe each service in plain business language, not technical jargon — what it does for the client, not what it is
- ${mergeTip}
- You must call the generate_renewal_widgets tool — do not return free text`;
}

// ── Handler ───────────────────────────────────────────────
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

  if (!body.client)   return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'client is required.' }) };
  if (!body.services || !body.services.length) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one service is required.' }) };
  if (body.mode === 'at-risk' && !body.concern) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'concern is required for at-risk mode.' }) };

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };

  // ── Build user message ──────────────────────
  const statsLines = [];
  if (body.stats?.tickets)      statsLines.push(`Support tickets resolved: ${body.stats.tickets}`);
  if (body.stats?.responseTime) statsLines.push(`Average response time: ${body.stats.responseTime}`);
  if (body.stats?.uptime)       statsLines.push(`Uptime: ${body.stats.uptime}`);

  const userMessage = `Generate five renewal widgets for this client and quote.

CLIENT & CONTRACT
Company: ${body.client}
Quote title: ${body.quoteTitle || 'Not provided'}
Contract start: ${body.contractStart || 'Not provided'}
Contract end / renewal date: ${body.contractEnd || 'Not provided'}
Monthly value: ${body.monthlyValue ? '£' + body.monthlyValue : 'Not provided'}

SERVICES BEING RENEWED (these are the actual line items on the quote — base Widget 4 on these)
${body.services.map(s => `- ${s}`).join('\n')}

PERFORMANCE STATS
${statsLines.length ? statsLines.join('\n') : 'None provided — write around this using the services and highlights.'}

KEY WINS / HIGHLIGHTS
${body.highlights || 'None provided.'}

${body.mode === 'at-risk' ? `AT-RISK CONTEXT
Client's stated concern: ${body.concern}
What has changed since signing: ${body.changesSinceSigning || 'Not provided'}
Proposed response / offer: ${body.proposedResponse || 'Not provided'}` : ''}

${body.upgrade ? `UPGRADE OPPORTUNITY\n${body.upgrade}` : ''}

MODE: ${body.mode === 'at-risk' ? 'AT-RISK RENEWAL' : 'STANDARD RENEWAL'}
PERSONALISED: ${body.personalised ? 'Yes — use merge tags naturally' : 'No'}`;

  // ── Call Claude with forced tool use ────────
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:       'claude-haiku-4-5-20251001',
        max_tokens:  1500,
        system:      buildSystemPrompt(body.mode, body.personalised),
        tools:       [WIDGETS_TOOL],
        tool_choice: { type: 'tool', name: 'generate_renewal_widgets' },
        messages:    [{ role: 'user', content: userMessage }]
      })
    });

    const data = await res.json();

    // Find the tool_use block
    const toolBlock = Array.isArray(data.content)
      ? data.content.find(b => b.type === 'tool_use' && b.name === 'generate_renewal_widgets')
      : null;

    if (!toolBlock) {
      console.error('[renewal-pack] Claude did not return tool_use block:', JSON.stringify(data).slice(0, 400));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI did not return structured widget data.' }) };
    }

    const result = toolBlock.input;

    // Validate all five keys are present
    const required = ['valueDelivered', 'partnership', 'continuity', 'whatsIncluded', 'whatsNext'];
    for (const key of required) {
      if (!result[key]?.headline || !result[key]?.body) {
        return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `Missing widget data: ${key}` }) };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, ...result })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
