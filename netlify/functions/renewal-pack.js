// =========================================================
// renewal-pack.js — Netlify function v2
// Path: /api/renewal-pack
//
// Generates: cover letter (Widget 0), five core widgets,
// and one upsell card per selected service.
// Uses forced tool-use for reliable structured output.
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ── Tool schema ──────────────────────────────────────────
const WIDGETS_TOOL = {
  name: 'generate_renewal_widgets',
  description: 'Generate all renewal widgets for this client.',
  input_schema: {
    type: 'object',
    properties: {
      coverLetter: {
        type: 'object',
        description: 'Widget 0 — Executive cover letter with optional inline stats.',
        properties: {
          headline: { type: 'string', description: 'Professional cover letter headline. Hard limit: 60 characters. Grammatically complete.' },
          intro:    { type: 'string', description: 'Opening paragraph — 2-3 sentences setting context for the renewal.' },
          stats:    {
            type: 'array',
            description: 'Up to 3 key metrics to display as stat boxes. Only include if stats were provided. Omit array if no stats.',
            items: {
              type: 'object',
              properties: {
                value: { type: 'string', description: 'The metric value, e.g. "847" or "99.97%" or "14 min"' },
                label: { type: 'string', description: 'Short label, e.g. "Tickets Resolved" or "Avg Response"' }
              },
              required: ['value', 'label']
            }
          },
          closing: { type: 'string', description: 'Closing paragraph — 2 sentences on the relationship and the path forward.' }
        },
        required: ['headline', 'intro', 'closing']
      },
      valueDelivered: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Punchy, metric-driven if stats exist. Hard limit: 60 characters. Grammatically complete.' },
          body:     { type: 'string', description: '3-5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      partnership: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Warm, relationship-focused. Hard limit: 60 characters. Grammatically complete.' },
          body:     { type: 'string', description: '3-5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      continuity: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Direct and complete. Hard limit: 60 characters. Must be a full sentence — never end on a preposition, verb, or incomplete thought. Wrong: "Here\'s why we hold" — Right: "Here\'s why staying makes sense".' },
          body:     { type: 'string', description: '3-5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      whatsIncluded: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Clear and direct. Hard limit: 60 characters. Grammatically complete.' },
          body:     { type: 'string', description: 'Each service on its own line: service name, then a one-sentence plain-language benefit. Use \\n between services.' }
        },
        required: ['headline', 'body']
      },
      whatsNext: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'Forward-looking (standard) or commitment-framing (at-risk). Hard limit: 60 characters. Grammatically complete — never trail off.' },
          body:     { type: 'string', description: '3-5 sentences. Use \\n to separate paragraphs.' }
        },
        required: ['headline', 'body']
      },
      upsells: {
        type: 'array',
        description: 'One entry per upsell service selected. Omit if no upsells.',
        items: {
          type: 'object',
          properties: {
            service:  { type: 'string', description: 'The service name exactly as provided.' },
            headline: { type: 'string', description: 'Benefit-led headline for this service. Hard limit: 60 characters. Outcome language — no jargon.' },
            body:     { type: 'string', description: '3-4 sentences in plain business language. What it does for the client, why it matters now, what outcome it delivers. No technical terms. Use \\n to separate paragraphs.' }
          },
          required: ['service', 'headline', 'body']
        }
      }
    },
    required: ['coverLetter', 'valueDelivered', 'partnership', 'continuity', 'whatsIncluded', 'whatsNext']
  }
};

// ── System prompt ─────────────────────────────────────────
function buildSystemPrompt(mode, personalised) {
  const mergeTip = personalised
    ? 'Use {{company.name}} and {{servicingBranch.name}} naturally — once or twice across all widgets, not in every sentence.'
    : 'Do not use merge tags.';

  const toneTip = mode === 'at-risk'
    ? `Tone: Empathetic first, factual second. Never defensive. Acknowledge the client's concern(s) directly in Widget 3 (continuity) — do not write a generic switching-cost argument. Widget 5 must feel like a genuine commitment, not a sales pitch.`
    : `Tone: Confident, warm, forward-looking. The client is happy — reinforce the relationship and build momentum.`;

  return `You are a senior MSP account manager writing renewal proposal content.

${toneTip}

Rules:
- Use stats and highlights prominently when provided — specific numbers are more persuasive than general claims
- If stats are missing, write around them using the services and highlights — never invent numbers
- Keep each widget body to 3-5 sentences maximum — brevity is essential
- Widget 4 (whatsIncluded): plain business language — what each service does for the client, not what it is technically
- Cover letter stats: only include the stats array if actual numbers were provided
- Upsell cards: outcome language only — what it means for the client's business, not how it works technically. No acronyms unexplained. Each card stands alone.
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

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  if (!body.client)              return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'client is required.' }) };
  if (!body.services?.length)    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one service is required.' }) };
  if (body.mode === 'at-risk' && !body.concern) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'concern is required for at-risk mode.' }) };

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };

  // ── Build user message ──────────────────────
  const statsLines = [];
  if (body.stats?.tickets)      statsLines.push(`Support tickets resolved: ${body.stats.tickets}`);
  if (body.stats?.responseTime) statsLines.push(`Average response time: ${body.stats.responseTime}`);
  if (body.stats?.uptime)       statsLines.push(`Uptime: ${body.stats.uptime}`);

  const upsellSection = body.upsells?.length
    ? `\nRECOMMENDED ADDITIONS (generate one upsell card per service)\n${body.upsells.map(u => `- ${u}`).join('\n')}`
    : '';

  const atRiskSection = body.mode === 'at-risk' ? `
AT-RISK CONTEXT
Client's stated concern(s): ${body.concern}
What has changed since signing: ${body.changesSinceSigning || 'Not provided'}
Proposed response / offer: ${body.proposedResponse || 'Not provided'}` : '';

  const userMessage = `Generate all renewal widgets for this client.

CLIENT & CONTRACT
Company: ${body.client}
Quote title: ${body.quoteTitle || 'Not provided'}
Contract start: ${body.contractStart || 'Not provided'}
Contract end / renewal date: ${body.contractEnd || 'Not provided'}
Monthly value: ${body.monthlyValue ? '£' + body.monthlyValue : 'Not provided'}

SERVICES BEING RENEWED
${body.services.map(s => `- ${s}`).join('\n')}

PERFORMANCE STATS
${statsLines.length ? statsLines.join('\n') : 'None provided — write around this.'}

KEY WINS / HIGHLIGHTS
${body.highlights || 'None provided.'}
${atRiskSection}${upsellSection}

MODE: ${body.mode === 'at-risk' ? 'AT-RISK RENEWAL' : 'STANDARD RENEWAL'}
PERSONALISED: ${body.personalised ? 'Yes' : 'No'}`;

  // ── Call Claude ─────────────────────────────
  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': claudeApiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model:       'claude-haiku-4-5-20251001',
        max_tokens:  2000,
        system:      buildSystemPrompt(body.mode, body.personalised),
        tools:       [WIDGETS_TOOL],
        tool_choice: { type: 'tool', name: 'generate_renewal_widgets' },
        messages:    [{ role: 'user', content: userMessage }]
      })
    });

    const data = await res.json();
    const toolBlock = Array.isArray(data.content)
      ? data.content.find(b => b.type === 'tool_use' && b.name === 'generate_renewal_widgets')
      : null;

    if (!toolBlock) {
      console.error('[renewal-pack] No tool_use block:', JSON.stringify(data).slice(0, 400));
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI did not return structured data.' }) };
    }

    const result = toolBlock.input;

    // Validate core widgets present
    const required = ['coverLetter', 'valueDelivered', 'partnership', 'continuity', 'whatsIncluded', 'whatsNext'];
    for (const key of required) {
      if (!result[key]) return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: `Missing: ${key}` }) };
    }

    // Safety net: hard-truncate headlines over 60 chars at last complete word
    const headlineFields = ['valueDelivered', 'partnership', 'continuity', 'whatsIncluded', 'whatsNext', 'coverLetter'];
    for (const key of headlineFields) {
      if (result[key]?.headline?.length > 60) {
        result[key].headline = result[key].headline.slice(0, 60).replace(/\s+\S*$/, '').replace(/[.,;:—–-]+$/, '');
      }
    }
    if (result.upsells) {
      result.upsells.forEach(u => {
        if (u.headline?.length > 60) u.headline = u.headline.slice(0, 60).replace(/\s+\S*$/, '').replace(/[.,;:—–-]+$/, '');
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...result }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message }) };
  }
};
