// netlify/functions/proposal-defence-kit.js
// Parallel AI calls — one per active module — to stay well within the 26s timeout.

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

  // Build one promise per active module, all fired in parallel
  const tasks = {};

  if (modules.competitor && modules.competitor.active) {
    tasks.competitor = callModule('competitor', body, theme, claudeApiKey);
  }
  if (modules.pricing && modules.pricing.active) {
    tasks.pricing = callModule('pricing', body, theme, claudeApiKey);
  }
  if (modules.objections && modules.objections.active) {
    tasks.objections = callModule('objections', body, theme, claudeApiKey);
  }

  // Run all in parallel
  const keys = Object.keys(tasks);
  let settled;
  try {
    settled = await Promise.all(keys.map(k => tasks[k]));
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'One or more AI calls failed.' }) };
  }

  const result = {};
  keys.forEach((k, i) => { result[k] = settled[i]; });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, result })
  };
};

/* ─── Call AI for a single module ─── */
async function callModule(moduleKey, body, theme, apiKey) {
  const system = buildModuleSystemPrompt(moduleKey, theme);
  const user   = buildModuleUserMessage(moduleKey, body, theme);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) throw new Error(`No content from AI for ${moduleKey}`);

  const text = data.content[0].text;
  let parsed;
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    // Last-resort: return a plain error widget so the UI doesn't crash
    return {
      widget: { html: errorWidget(moduleKey, theme) },
      talkTrack: { opener: 'AI response could not be parsed. Please regenerate this module.' }
    };
  }

  // Ensure widget.html exists
  if (parsed.widget && !parsed.widget.html) {
    parsed.widget.html = widgetFallback(parsed.widget, theme);
  }
  return parsed;
}

/* ─── Per-module system prompt — tight and focused ─── */
function buildModuleSystemPrompt(moduleKey, theme) {
  const shared = `You are an expert MSP sales coach. Tone: calm, confident, professional. Never defensive or aggressive.

WIDGET HTML RULES (non-negotiable):
- All styles inline — no CSS classes, no <style> blocks
- Width 100% — no fixed pixel widths
- Headings: <h5> or <h6> only
- No Flexbox, no CSS Grid — use <table width="100%"> for columns
- Max 3 columns per table row
- No JavaScript
- Safe elements only: div, table, tr, td, p, span, h5, h6, ul, li, strong, em
- Inline hex colors only — no CSS variables
- Body text 13–14px, each section 3–5 lines max
- Theme color: ${theme}
Brand colors: text #0B0E14, secondary #4B5563, muted #9CA3AF, bg #FAFAF7, white #FFFFFF, border #E5E7EB, accent ${theme}

TALK TRACK: Natural spoken language the rep will say on a call. Conversational, not formal copy.

Return ONLY valid JSON — no preamble, no markdown, no backticks.`;

  const shapes = {
    competitor: `${shared}

Output shape:
{"widget":{"html":"<full inline-styled HTML>"},"talkTrack":{"opener":"string","responses":["string","string"],"riskQuestion":"string","closingAsk":"string"}}`,

    pricing: `${shared}

Output shape:
{"widget":{"html":"<full inline-styled HTML>"},"talkTrack":{"opener":"string","reframe":"string","riskQuestion":"string","insuranceAnalogy":"string","closingAsk":"string"}}`,

    objections: `${shared}

Output shape (max 4–5 Q&As, combine related ones):
{"widget":{"html":"<full inline-styled HTML>"},"talkTrack":{"responses":[{"objection":"string","response":"string"}],"transitionLine":"string"}}`
  };

  return shapes[moduleKey];
}

/* ─── Per-module user message — only the relevant inputs ─── */
function buildModuleUserMessage(moduleKey, body, theme) {
  const { prospect, industry, offering, situation, modules } = body;
  const ctx = `Prospect: ${prospect} | Industry: ${industry} | Offering: ${offering} | Situation: ${situation} | Theme: ${theme}`;

  if (moduleKey === 'competitor') {
    const m = modules.competitor;
    return `${ctx}

MODULE: Competitor Comparison
Competitor: ${m.competitorName || 'a competitor'}
What prospect was told: ${m.prospectTold || 'not specified'}
Our differentiators: ${m.differentiators}
${m.ourPrice ? `Our price: ${m.ourPrice}` : ''}
${m.theirPrice ? `Their price: ${m.theirPrice}` : ''}

Generate widget titled "What You're Really Comparing" — calm, confident, focused on value depth and risk. Never disparage the competitor. Frame as "here's what you're comparing."
Generate talk track for re-engaging after the competing quote was mentioned.
Return only the JSON.`;
  }

  if (moduleKey === 'pricing') {
    const m = modules.pricing;
    const perUser = calculatePerUser(m.monthlyPrice, m.users);
    return `${ctx}

MODULE: Pricing Justification
Monthly price: ${m.monthlyPrice}
Users/devices: ${m.users || 'not specified'}
Included: ${m.included && m.included.length ? m.included.join(', ') : 'full managed IT'}
${m.inHouseCost ? `In-house alternative: ${m.inHouseCost}` : ''}
Risk if uncovered: ${m.riskFocus || 'various'}
${perUser ? `Per-user math: ${perUser}` : ''}

Generate widget titled "Understanding Your Investment" — break down what's included, reframe per-user cost, compare to the cost of a single incident. Position IT as insurance not overhead.
Generate talk track addressing the price objection without being defensive.
Return only the JSON.`;
  }

  if (moduleKey === 'objections') {
    const m = modules.objections;
    return `${ctx}

MODULE: Objection & FAQ
Objections: ${m.objections && m.objections.length ? m.objections.join(' | ') : 'general objections'}
${m.context ? `Context: ${m.context}` : ''}

Generate widget titled "Common Questions Answered" — FAQ style. Each objection becomes a calm Q&A. Format: Acknowledge → Reframe → Evidence → Ask. Max 4–5 Q&As, combine related ones.
Generate talk track with one response per objection (Acknowledge → Reframe → Evidence → Ask) plus a transition line to move back to the proposal.
Return only the JSON.`;
  }
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

function widgetFallback(widget, theme) {
  return `<div style="font-family:Inter,sans-serif;width:100%;padding:20px;background:#FFFFFF;border:1px solid #E5E7EB;">
<h5 style="font-size:15px;font-weight:700;color:${theme};margin:0 0 10px;">${widget.headline || ''}</h5>
<p style="font-size:13px;color:#4B5563;line-height:1.6;margin:0;">${widget.body || ''}</p>
</div>`;
}

function errorWidget(moduleKey, theme) {
  const labels = { competitor: 'Competitor Comparison', pricing: 'Pricing Justification', objections: 'Objection & FAQ' };
  return `<div style="font-family:Inter,sans-serif;width:100%;padding:16px;background:#FEE2E2;border:1px solid #FCA5A5;">
<p style="font-size:13px;color:#991B1B;margin:0;">Could not generate ${labels[moduleKey] || moduleKey} widget. Please use the Regenerate button to retry.</p>
</div>`;
}
