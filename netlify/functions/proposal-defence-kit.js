// netlify/functions/proposal-defence-kit.js
// Two calls per active module, all in parallel:
//   call A → raw HTML widget only
//   call B → talk track JSON only

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

  const { prospect, industry, offering, situation, modules, themeColor } = body;
  if (!prospect || !industry || !offering || !situation || !modules)
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Missing required fields.' }) };

  const anyActive = Object.values(modules).some(m => m.active);
  if (!anyActive)
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'At least one module must be active.' }) };

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  const theme = themeColor || '#0f1f3d';

  const activeKeys = ['competitor', 'pricing', 'objections'].filter(k => modules[k] && modules[k].active);

  // Fire widget + talktrack calls in parallel for every active module
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
        talkTrack: { opener: 'Could not load talking points. Please use the Regenerate button.' }
      };
    }
  });

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, result }) };
};

/* ─── Call A: HTML widget only — no JSON ─── */
async function callWidget(moduleKey, body, theme, apiKey) {
  const { prospect, industry, offering, situation, modules } = body;
  const ctx = `Prospect: ${prospect} | Industry: ${industry} | Offering: ${offering} | Situation: ${situation}`;

  // Pre-calculate savings for pricing module
  let savingsContext = '';
  if (moduleKey === 'pricing' && modules.pricing) {
    const m = modules.pricing;
    const monthly = parseFloat(String(m.monthlyPrice || '').replace(/[^0-9.]/g, ''));
    const annual  = monthly ? monthly * 12 : 0;
    const inHouseRaw = parseFloat(String(m.inHouseCost || '').replace(/[^0-9.]/g, ''));

    if (monthly && m.users > 0) {
      const perUser    = (monthly / m.users).toFixed(0);
      const perDay     = (monthly / m.users / 22).toFixed(2);
      savingsContext += `Per-user/month: $${perUser} | Per-user/working day: $${perDay}\n`;
    }
    if (inHouseRaw && annual) {
      const saving = Math.round(inHouseRaw - annual);
      savingsContext += `Annual MSP cost: $${annual.toLocaleString()} | In-house cost: $${inHouseRaw.toLocaleString()} | Annual saving vs in-house: $${saving.toLocaleString()}\n`;
    }
  }

  const systemPrompt = `You are an expert MSP sales coach writing a customer-facing HTML widget for inclusion in a re-proposal document.

OUTPUT RULES — non-negotiable:
- Return ONLY raw HTML. No JSON. No markdown. No backticks. No explanation.
- Your entire response must start with <div and end with </div>
- All styles must be inline (style="...") — no CSS classes, no <style> blocks
- Width 100% — never fixed pixel widths
- Headings: use <h5> or <h6> only — styled with font-size:16px or 15px, font-weight:700, color:${theme}
- No Flexbox, no CSS Grid — use <table width="100%"> for any multi-column layout, max 3 columns
- No JavaScript. Safe elements only: div, table, tr, td, p, span, h5, h6, ul, li, strong, em
- Inline hex colors only — no CSS variables
- Body text 13–14px. Keep each section concise and scannable.
- Tone: calm, confident, professional — never defensive or aggressive

STYLE GUIDE — match this pattern from our SOW tool:
- Widget outer wrapper: border-left:4px solid ${theme}; padding:0; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;
- Section headings: font-size:11px; font-weight:700; color:${theme}; text-transform:uppercase; letter-spacing:0.07em; margin:0 0 10px;
- Main heading (h5/h6): font-size:16px; font-weight:700; color:${theme}; margin:0 0 6px;
- Body text: font-size:13px; color:#334155; line-height:1.65;
- Table header row: background:${theme}; color:#ffffff; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; padding:8px 12px;
- Table data rows: alternate between background:#ffffff and background:rgba from ${theme} at 0.05 opacity — use #f8f9fa for alternating rows
- Table cell padding: 10px 12px; vertical-align:top; border-bottom:1px solid #e2e8f0;
- Bullet lists: use › character in ${theme} color as the bullet, no default list markers
- Stat boxes (for numbers): background:${theme}; color:#ffffff; text-align:center; padding:16px; with label above in rgba(255,255,255,0.75) and value in font-size:22px; font-weight:700;
- Savings/positive stat: background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;`;

  const userMessages = {
    competitor: () => {
      const m = modules.competitor;
      return `${ctx}
Competitor: ${m.competitorName || 'a competitor'}
What prospect was told: ${m.prospectTold || 'not specified'}
Our differentiators: ${m.differentiators}
${m.ourPrice ? `Our price: ${m.ourPrice}` : ''}
${m.theirPrice ? `Their price: ${m.theirPrice}` : ''}

Write a widget with heading "What You're Really Comparing".
Structure:
1. Brief intro paragraph (1-2 sentences, calm and factual).
2. Comparison table with colored header row: SERVICE ELEMENT / OUR MODEL / WHAT YOU ACHIEVE. 3-4 rows based on the differentiators provided.
3. A section headed "THE VALUE BEHIND THE PRICE" with exactly 3 bullet points using › as bullet marker in theme color. CRITICAL: every bullet must be a complete, specific sentence of 15-25 words explaining a real business risk or benefit — never a single word, never a placeholder, never truncated. Write all 3 bullets before closing any tags. Example of a good bullet: "› Without local on-site support, hardware failures can mean days of downtime waiting for a remote provider to dispatch a technician."

Never disparage the competitor. Focus on our strengths and the prospect's business risk.`;
    },
    pricing: () => {
      const m = modules.pricing;
      return `${ctx}
Monthly price: ${m.monthlyPrice}
Users/devices: ${m.users || 'not specified'}
Included services: ${m.included && m.included.length ? m.included.join(', ') : 'full managed IT'}
${m.inHouseCost ? `In-house alternative cost: ${m.inHouseCost}` : ''}
Primary risk if uncovered: ${m.riskFocus || 'various'}
${savingsContext}

Write a widget with heading "Understanding Your Investment".
Structure:
1. Section "WHAT'S INCLUDED IN ${m.monthlyPrice}/MONTH" — bullet list using › in theme color of all included services, grouped logically.
2. Stats row — a 3-column table with colored stat boxes:
   - Col 1 (theme color bg, white text): label "PER USER / MONTH", value "$[calculated]"
   - Col 2 (theme color bg, white text): label "PER USER / WORKING DAY", value "$[calculated]"  
   - Col 3 (GREEN bg #f0fdf4, green text #166534, border #bbf7d0): label "YOU SAVE VS. IN-HOUSE", value "~$[saving]/yr" with sub-text "vs. hiring one IT person" — ONLY include this column if in-house cost was provided, otherwise show a risk stat instead.
3. Section "WHY THIS MATTERS" — 2-3 sentences positioning IT as insurance, referencing the specific risk focus and the per-user/day cost to make it feel minimal.
Make the savings figure the most prominent thing the reader's eye lands on.`;
    },
    objections: () => {
      const m = modules.objections;
      return `${ctx}
Objections to address: ${m.objections && m.objections.length ? m.objections.join(' | ') : 'general value and pricing objections'}
${m.context ? `Additional context: ${m.context}` : ''}

Write a widget with heading "Common Questions Answered".
Format as an FAQ. Each objection becomes a bold question in theme color. Each answer follows: Acknowledge → Reframe → Brief evidence → Forward-leaning close. Max 4–5 Q&As — combine closely related objections. Answers 2–4 sentences each, calm and confident. Separate each Q&A with a thin border line.`;
    }
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessages[moduleKey]() }]
    })
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) throw new Error(`No widget content for ${moduleKey}`);

  let html = data.content[0].text.trim();
  html = html.replace(/^```html?\s*/i, '').replace(/\s*```$/, '').trim();
  if (!html.startsWith('<')) throw new Error(`Widget response for ${moduleKey} was not HTML`);
  return html;
}

/* ─── Call B: talk track JSON only — no HTML ─── */
async function callTalkTrack(moduleKey, body, theme, apiKey) {
  const { prospect, industry, offering, situation, modules } = body;
  const ctx = `Prospect: ${prospect} | Industry: ${industry} | Offering: ${offering} | Situation: ${situation}`;

  const shapes = {
    competitor: `{"opener":"string","responses":["string","string"],"riskQuestion":"string","closingAsk":"string"}`,
    pricing:    `{"opener":"string","reframe":"string","riskQuestion":"string","insuranceAnalogy":"string","closingAsk":"string"}`,
    objections: `{"responses":[{"objection":"string","response":"string"}],"transitionLine":"string"}`
  };

  const systemPrompt = `You are an expert MSP sales coach writing private talking points for a sales rep's follow-up call.

OUTPUT RULES — non-negotiable:
- Return ONLY a valid JSON object. No markdown. No backticks. No preamble. No explanation.
- Your entire response must be a single JSON object starting with { and ending with }
- All string values must be plain text — no HTML tags inside values
- Tone: natural spoken language the rep will say on a call — warm, conversational, confident
- Weave in the industry and prospect context naturally throughout

Required JSON shape:
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

Write talking points to re-engage after a competing quote was mentioned. Opener to restart naturally, 2-3 calm responses to "but they're cheaper", a risk question to plant, closing ask.`;
    },
    pricing: () => {
      const m = modules.pricing;
      const monthly = parseFloat(String(m.monthlyPrice || '').replace(/[^0-9.]/g, ''));
      const perUser = (monthly && m.users) ? `$${(monthly/m.users).toFixed(0)}/user/month (~$${(monthly/m.users/22).toFixed(2)}/working day)` : '';
      return `${ctx}
Monthly price: ${m.monthlyPrice}
Users/devices: ${m.users || 'not specified'}
Included: ${m.included && m.included.length ? m.included.join(', ') : 'full managed IT'}
${m.inHouseCost ? `In-house alternative: ${m.inHouseCost}` : ''}
Risk if uncovered: ${m.riskFocus || 'various'}
${perUser ? `Per-user math: ${perUser}` : ''}

Write talking points to address the price objection without being defensive. Opener, per-user reframe script, cost-of-not-having-it question, insurance analogy and when to use it, closing ask.`;
    },
    objections: () => {
      const m = modules.objections;
      return `${ctx}
Objections: ${m.objections && m.objections.length ? m.objections.join(' | ') : 'general objections'}
${m.context ? `Context: ${m.context}` : ''}

One response per objection: Acknowledge → Reframe → Evidence → Ask. Plus a transition line to move back to the proposal.`;
    }
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessages[moduleKey]() }]
    })
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) throw new Error(`No talk track content for ${moduleKey}`);

  const text  = data.content[0].text.trim();
  const clean = text.replace(/^```json?\s*/i, '').replace(/\s*```$/, '').trim();

  try { return JSON.parse(clean); }
  catch { return { opener: 'Talking points could not be loaded — please use the Regenerate button.' }; }
}

/* ─── Helpers ─── */
function errorWidget(moduleKey, theme) {
  const labels = { competitor: 'Competitor Comparison', pricing: 'Pricing Justification', objections: 'Objection & FAQ' };
  return `<div style="font-family:Inter,sans-serif;width:100%;padding:16px;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:4px;">
<p style="font-size:13px;color:#991B1B;margin:0;">Could not generate ${labels[moduleKey] || moduleKey} widget. Please use the Regenerate button to retry.</p>
</div>`;
}
