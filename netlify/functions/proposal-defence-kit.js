// netlify/functions/proposal-defence-kit.js
// Two calls per active module, all in parallel:
//   call A → raw HTML widget only (no JSON wrapping, nothing to corrupt)
//   call B → talk track JSON only (no HTML, clean parse every time)

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

  const { prospect, industry, offering, situation, modules, themeColor } = body;
  if (!prospect || !industry || !offering || !situation || !modules) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing required fields.' }) };
  }

  const anyActive = Object.values(modules).some(m => m.active);
  if (!anyActive) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one module must be active.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  const theme = themeColor || '#0f1f3d';

  // For each active module fire widget + talktrack calls simultaneously
  const activeKeys = ['competitor', 'pricing', 'objections'].filter(k => modules[k] && modules[k].active);

  const promises = activeKeys.map(k => Promise.all([
    callWidget(k, body, theme, claudeApiKey),
    callTalkTrack(k, body, theme, claudeApiKey)
  ]));

  const settled = await Promise.allSettled(promises);

  const result = {};
  activeKeys.forEach((k, i) => {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      const [html, talkTrack] = outcome.value;
      result[k] = { widget: { html }, talkTrack };
    } else {
      result[k] = {
        widget: { html: errorWidget(k, theme) },
        talkTrack: { opener: 'Could not load talking points. Please regenerate.' }
      };
    }
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, result })
  };
};

/* ─── Call A: widget HTML only — AI returns raw HTML, no JSON wrapper ─── */
async function callWidget(moduleKey, body, theme, apiKey) {
  const { prospect, industry, offering, situation, modules } = body;
  const ctx = `Prospect: ${prospect} | Industry: ${industry} | Offering: ${offering} | Situation: ${situation}`;

  const systemPrompt = `You are an expert MSP sales coach writing a customer-facing HTML widget for a re-proposal.

OUTPUT RULES — non-negotiable:
- Return ONLY raw HTML. No JSON. No markdown. No backticks. No preamble. No explanation.
- Your entire response must start with <div and end with </div>
- All styles must be inline (style="...") — no CSS classes, no <style> blocks
- Width 100% — never fixed pixel widths
- Headings: <h5> or <h6> only — never h1/h2/h3/h4
- No Flexbox, no CSS Grid — use <table width="100%"> for any multi-column layout, max 3 columns
- No JavaScript. Safe elements only: div, table, tr, td, p, span, h5, h6, ul, li, strong, em
- Inline hex colors only — no CSS variables
- Body text 13–14px. Keep each section to 3–5 lines. Concise and scannable.
- Theme accent color: ${theme}
- Brand colors: primary text #0B0E14, secondary #4B5563, muted #9CA3AF, background #FAFAF7, white #FFFFFF, border #E5E7EB
- Tone: calm, confident, professional — never defensive or aggressive`;

  const userMessages = {
    competitor: () => {
      const m = modules.competitor;
      return `${ctx}
Competitor: ${m.competitorName || 'a competitor'}
What prospect was told: ${m.prospectTold || 'not specified'}
Our differentiators: ${m.differentiators}
${m.ourPrice ? `Our price: ${m.ourPrice}` : ''}
${m.theirPrice ? `Their price: ${m.theirPrice}` : ''}

Write a widget titled "What You're Really Comparing". Show what the prospect is comparing in a calm, structured way. Focus entirely on our strengths and the risk of the cheaper option in business terms. Never disparage the competitor or make unverifiable claims about them. Frame it as "here is what you are comparing" not "here is why they are worse". Use a table if helpful for side-by-side structure.`;
    },
    pricing: () => {
      const m = modules.pricing;
      const perUser = calculatePerUser(m.monthlyPrice, m.users);
      return `${ctx}
Monthly price: ${m.monthlyPrice}
Users/devices: ${m.users || 'not specified'}
Included services: ${m.included && m.included.length ? m.included.join(', ') : 'full managed IT'}
${m.inHouseCost ? `In-house alternative cost: ${m.inHouseCost}` : ''}
Primary risk if uncovered: ${m.riskFocus || 'various'}
${perUser ? `Per-user calculation: ${perUser}` : ''}

Write a widget titled "Understanding Your Investment". Break down what the monthly fee covers, reframe the per-user cost into a daily or per-user figure, compare it to the cost of a single incident or the in-house alternative. Position managed IT as insurance not overhead. Factual and calm — no pressure language.`;
    },
    objections: () => {
      const m = modules.objections;
      return `${ctx}
Objections to address: ${m.objections && m.objections.length ? m.objections.join(' | ') : 'general value and pricing objections'}
${m.context ? `Additional context: ${m.context}` : ''}

Write a widget titled "Common Questions Answered". Format as an FAQ — each objection becomes a question, each answer is calm and confident. Follow this structure per answer: Acknowledge the concern → Reframe it → Provide brief evidence → End with a forward-leaning statement. Max 4–5 Q&As — combine closely related objections into one. Keep answers concise, 2–4 sentences each.`;
    }
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessages[moduleKey]() }]
    })
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) throw new Error(`No widget content for ${moduleKey}`);

  // Strip any accidental markdown fences, return raw HTML
  let html = data.content[0].text.trim();
  html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();

  // Sanity check — if it doesn't look like HTML, use fallback
  if (!html.startsWith('<')) {
    throw new Error(`Widget response for ${moduleKey} was not HTML`);
  }

  return html;
}

/* ─── Call B: talk track JSON only — no HTML anywhere near this call ─── */
async function callTalkTrack(moduleKey, body, theme, apiKey) {
  const { prospect, industry, offering, situation, modules } = body;
  const ctx = `Prospect: ${prospect} | Industry: ${industry} | Offering: ${offering} | Situation: ${situation}`;

  const shapes = {
    competitor: `{"opener":"string","responses":["string","string"],"riskQuestion":"string","closingAsk":"string"}`,
    pricing:    `{"opener":"string","reframe":"string","riskQuestion":"string","insuranceAnalogy":"string","closingAsk":"string"}`,
    objections: `{"responses":[{"objection":"string","response":"string"}],"transitionLine":"string"}`
  };

  const systemPrompt = `You are an expert MSP sales coach writing private talking points for a sales rep to use on a follow-up call.

OUTPUT RULES — non-negotiable:
- Return ONLY a valid JSON object. No markdown. No backticks. No preamble. No explanation.
- Your entire response must be a single JSON object starting with { and ending with }
- All string values must use straight double quotes and have no unescaped characters
- Keep all strings as plain text — no HTML tags inside JSON values
- Tone: natural spoken language the rep will actually say on a call — conversational, not formal copy
- Weave in the industry and prospect context naturally

Required JSON shape for ${moduleKey}:
${shapes[moduleKey]}`;

  const userMessages = {
    competitor: () => {
      const m = modules.competitor;
      return `${ctx}
Competitor: ${m.competitorName || 'a competitor'}
What prospect was told: ${m.prospectTold || 'not specified'}
Our differentiators: ${m.differentiators}
${m.ourPrice ? `Our price: ${m.ourPrice}` : ''}
${m.theirPrice ? `Their price: ${m.theirPrice}` : ''}

Write talking points to re-engage the prospect after they mentioned a competing quote. Include: an opener to restart the conversation naturally, 2-3 calm responses to "but they're cheaper", a risk question to plant, and a suggested closing ask for this conversation.`;
    },
    pricing: () => {
      const m = modules.pricing;
      const perUser = calculatePerUser(m.monthlyPrice, m.users);
      return `${ctx}
Monthly price: ${m.monthlyPrice}
Users/devices: ${m.users || 'not specified'}
Included: ${m.included && m.included.length ? m.included.join(', ') : 'full managed IT'}
${m.inHouseCost ? `In-house alternative: ${m.inHouseCost}` : ''}
Risk if uncovered: ${m.riskFocus || 'various'}
${perUser ? `Per-user math: ${perUser}` : ''}

Write talking points to address the price objection. Include: an opener that addresses pricing without being defensive, a per-user reframe script, a cost-of-not-having-it question, an insurance analogy and when to use it, and a closing ask.`;
    },
    objections: () => {
      const m = modules.objections;
      return `${ctx}
Objections: ${m.objections && m.objections.length ? m.objections.join(' | ') : 'general objections'}
${m.context ? `Context: ${m.context}` : ''}

Write one talk track response per objection. Each response follows: Acknowledge the concern → Reframe it → Brief evidence → Ask to move forward. Also include a transition line to move from objection-handling back to the proposal.`;
    }
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessages[moduleKey]() }]
    })
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) throw new Error(`No talk track content for ${moduleKey}`);

  const text = data.content[0].text.trim();

  // Strip any accidental markdown fences before parsing
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Return a minimal valid structure so the widget still renders
    return { opener: 'Talking points could not be loaded — please use the Regenerate button.' };
  }

  return parsed;
}

/* ─── Helpers ─── */
function calculatePerUser(priceStr, users) {
  if (!priceStr || !users) return '';
  const num = parseFloat(String(priceStr).replace(/[^0-9.]/g, ''));
  if (!num || isNaN(num)) return '';
  const perUser = (num / users).toFixed(0);
  const perDay  = (num / users / 22).toFixed(2);
  return `$${perUser}/user/month (~$${perDay}/user/working day)`;
}

function errorWidget(moduleKey, theme) {
  const labels = { competitor: 'Competitor Comparison', pricing: 'Pricing Justification', objections: 'Objection & FAQ' };
  return `<div style="font-family:Inter,sans-serif;width:100%;padding:16px;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:4px;">
<p style="font-size:13px;color:#991B1B;margin:0;">Could not generate ${labels[moduleKey] || moduleKey} widget. Please use the Regenerate button to retry.</p>
</div>`;
}
