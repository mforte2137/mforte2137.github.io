// netlify/functions/proposal-defence-kit.js

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
  const { prospect, industry, offering, situation, modules, themeColor } = body;
  if (!prospect || !industry || !offering || !situation || !modules) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing required fields.' }) };
  }

  const anyActive = Object.values(modules).some(m => m.active);
  if (!anyActive) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one module must be active.' }) };
  }

  // 5. Build AI prompt
  const theme = themeColor || '#0f1f3d';

  const systemPrompt = buildSystemPrompt(theme);
  const userMessage = buildUserMessage(body);

  // 6. Call Anthropic
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

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
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
    const aiData = await aiRes.json();
    if (!aiData.content || !aiData.content[0]) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned no content.' }) };
    }
    aiText = aiData.content[0].text;
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI request failed.' }) };
  }

  // 7. Parse AI JSON
  let parsed;
  try {
    const clean = aiText.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.', raw: aiText.slice(0, 500) }) };
  }

  // 8. Convert widget body strings to HTML
  const result = {};
  if (modules.competitor && modules.competitor.active && parsed.competitor) {
    result.competitor = {
      widget: {
        html: parsed.competitor.widget.html || widgetFallback(parsed.competitor.widget, theme)
      },
      talkTrack: parsed.competitor.talkTrack
    };
  }
  if (modules.pricing && modules.pricing.active && parsed.pricing) {
    result.pricing = {
      widget: {
        html: parsed.pricing.widget.html || widgetFallback(parsed.pricing.widget, theme)
      },
      talkTrack: parsed.pricing.talkTrack
    };
  }
  if (modules.objections && modules.objections.active && parsed.objections) {
    result.objections = {
      widget: {
        html: parsed.objections.widget.html || widgetFallback(parsed.objections.widget, theme)
      },
      talkTrack: parsed.objections.talkTrack
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, result })
  };
};

/* ─── Fallback widget renderer (if AI returns structured data instead of HTML) ─── */
function widgetFallback(widget, theme) {
  const headline = widget.headline || '';
  const body = widget.body || '';
  return `<div style="font-family:'Inter',sans-serif;width:100%;padding:20px;background:#FFFFFF;border:1px solid #E5E7EB;">
    <h5 style="font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:${theme};margin:0 0 12px;">${headline}</h5>
    <p style="font-size:13px;color:#4B5563;line-height:1.6;margin:0;">${body}</p>
  </div>`;
}

/* ─── System prompt ─── */
function buildSystemPrompt(themeColor) {
  return `You are an expert MSP sales coach generating content for the Proposal Defence Kit — a tool that helps MSP sales reps re-engage stalled or rejected proposals.

TONE:
- Calm, confident, professional throughout
- Never defensive, never aggressive, never disparaging about competitors
- Widget content is customer-facing — polished and reassuring
- Talk track content is spoken-word for the rep — natural, conversational, human

COMPETITOR MODULE RULES:
- Focus entirely on the MSP's strengths and the prospect's risk
- Never make claims about what the competitor does or does not offer that cannot be substantiated
- Frame as "here's what you're comparing" not "here's why they're worse"

PRICING MODULE RULES:
- Factual and reframing — shift how the prospect thinks about the cost
- Do not argue; reframe IT support as insurance not overhead
- Per-user/per-day math is powerful — use it

OBJECTION MODULE RULES:
- Every response follows: Acknowledge → Reframe → Evidence → Ask
- Calm and confident, not defensive
- Max 4–5 Q&As in the widget; combine closely related objections if more than 5 selected

WIDGET HTML RULES (non-negotiable):
- Return complete, self-contained HTML for each widget
- All styles MUST be inline — no CSS classes, no style blocks, no external stylesheets
- Width 100% — never fixed pixel widths
- Headings: <h5> or <h6> only — never h1/h2/h3/h4
- No Flexbox, no CSS Grid — use <table width="100%"> for any multi-column layout
- Maximum 3 columns per table row
- No JavaScript
- Safe elements only: div, table, tr, td, p, span, h5, h6, ul, li, strong, em
- Use hex colors directly in inline styles — no CSS variables
- Body text: 13-14px
- Keep each section to 3–5 lines maximum — these sit inside a larger proposal
- Theme color: ${themeColor} — use this for headings, accents, and borders where appropriate

BRAND COLORS:
- Primary text: #0B0E14
- Secondary text: #4B5563
- Muted text: #9CA3AF
- Page background: #FAFAF7
- Panel/white: #FFFFFF
- Border: #E5E7EB
- Theme/accent: ${themeColor}

TALK TRACK RULES:
- Write as natural spoken language the rep will actually say on a call
- Not formal copy — conversational and warm
- Structured as a guide, not a script to read verbatim
- Industry context woven in naturally throughout

OUTPUT FORMAT:
Return a single valid JSON object. No preamble, no markdown, no backticks. Only JSON.

The JSON shape must match exactly:
{
  "competitor": {           // only if competitor module active
    "widget": {
      "html": "<complete self-contained HTML string>"
    },
    "talkTrack": {
      "opener": "string",
      "responses": ["string", "string"],
      "riskQuestion": "string",
      "closingAsk": "string"
    }
  },
  "pricing": {              // only if pricing module active
    "widget": {
      "html": "<complete self-contained HTML string>"
    },
    "talkTrack": {
      "opener": "string",
      "reframe": "string",
      "riskQuestion": "string",
      "insuranceAnalogy": "string",
      "closingAsk": "string"
    }
  },
  "objections": {           // only if objections module active
    "widget": {
      "html": "<complete self-contained HTML string>"
    },
    "talkTrack": {
      "responses": [
        { "objection": "string", "response": "string" }
      ],
      "transitionLine": "string"
    }
  }
}

Only include keys for modules that are active.`;
}

/* ─── User message ─── */
function buildUserMessage(body) {
  const { prospect, industry, offering, situation, modules, themeColor } = body;

  let msg = `DEAL CONTEXT:
- Prospect: ${prospect}
- Industry: ${industry}
- What we are proposing: ${offering}
- Situation: ${situation}
- Widget theme color: ${themeColor || '#0f1f3d'}

ACTIVE MODULES:\n`;

  if (modules.competitor && modules.competitor.active) {
    const m = modules.competitor;
    msg += `
MODULE 1 — COMPETITOR COMPARISON (active):
- Competitor: ${m.competitorName || 'a competitor'}
- What the prospect was told they were offered: ${m.prospectTold || 'Not specified'}
- What makes our offering stronger: ${m.differentiators}
${m.ourPrice ? `- Our monthly price: ${m.ourPrice}` : ''}
${m.theirPrice ? `- Their quoted price: ${m.theirPrice}` : ''}

Generate widget HTML titled "What You're Really Comparing" — a calm, confident comparison focused on value and risk. And generate talk track for re-engaging on the competing quote.
`;
  }

  if (modules.pricing && modules.pricing.active) {
    const m = modules.pricing;
    const perUser = m.users > 0 && m.monthlyPrice
      ? `Per-user: approximately ${calculatePerUser(m.monthlyPrice, m.users)}/user/month`
      : '';
    msg += `
MODULE 2 — PRICING JUSTIFICATION (active):
- Monthly price: ${m.monthlyPrice}
- Users/devices: ${m.users || 'not specified'}
- What's included: ${m.included && m.included.length > 0 ? m.included.join(', ') : 'full managed IT services'}
${m.inHouseCost ? `- In-house alternative cost: ${m.inHouseCost}` : ''}
- Primary risk if not covered: ${m.riskFocus || 'various'}
${perUser}

Generate widget HTML titled "Understanding Your Investment" — breaks down what's covered, reframes cost, compares to the risk of not having it. And generate talk track addressing the price objection.
`;
  }

  if (modules.objections && modules.objections.active) {
    const m = modules.objections;
    msg += `
MODULE 3 — OBJECTION & FAQ (active):
- Objections to address: ${m.objections && m.objections.length > 0 ? m.objections.join(' | ') : 'general objections'}
${m.context ? `- Additional context: ${m.context}` : ''}

Generate widget HTML titled "Common Questions Answered" — FAQ style, each objection becomes a question with a calm, confident answer. Acknowledge → Reframe → Evidence → Ask. Max 4–5 Q&As. And generate talk track with one response per objection plus a transition line.
`;
  }

  msg += `\nReturn only the JSON object. No preamble, no markdown, no backticks.`;
  return msg;
}

/* ─── Helper: calculate per-user cost ─── */
function calculatePerUser(priceStr, users) {
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  if (!num || !users) return 'N/A';
  const perUser = (num / users).toFixed(0);
  const perDay = (num / users / 22).toFixed(2); // ~22 working days
  return `$${perUser}/user/month (~$${perDay}/user/working day)`;
}
