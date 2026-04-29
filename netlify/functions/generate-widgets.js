// =========================================================
// Proposal Evaluator — Salesbuildr Widget Generator
// Path on the live site: /api/generate-widgets
//
// Accepts POST { analysis, textExcerpt, widgetId, colors }
//   analysis    — structured output from /api/analyze
//   textExcerpt — first ~1500 chars of the proposal text
//   widgetId    — "w1" | "w2" | "w3" | "w4" | "w5"
//   colors      — { primary, accent, light } (optional,
//                  defaults to corporate blue)
//
// One widget per call — stays inside the Netlify 10s limit.
// Model: claude-haiku-4-5-20251001
// =========================================================

const WIDGET_BRIEFS = {
  w1: {
    label:   'W1 · Their Situation',
    title:   'We Understand Your World',
    purpose: 'Show the buyer you have listened before you sold. Open with their situation in plain business language — not IT language. Reflect the industry, business pressures, and context you inferred from the proposal. Name what would derail them. The buyer should feel seen, not sold to.',
    tone:    'Empathetic, specific, zero jargon.'
  },
  w2: {
    label:   'W2 · Why Care Now',
    title:   'The Cost of Waiting',
    purpose: 'Create urgency without pressure. What is changing in their environment — threat landscape, regulation, growth, competitive pressure — that makes this the right moment? Frame inaction in business consequences: revenue at risk, operational disruption, compliance exposure. Not "you might get hacked" but "a two-week outage costs you the margin for the quarter."',
    tone:    'Direct, factual, consequence-focused. No scare tactics — just business logic.'
  },
  w3: {
    label:   'W3 · Why Trust Us',
    title:   'Why Businesses Like Yours Choose Us',
    purpose: 'Build the case for trust before price appears. Draw on any credibility signals in the analysis: certifications, response times, team size, years in business, client outcomes, industries served. If the analysis shows W3 is missing or weak from the original proposal, use plausible but clearly placeholder-labelled credibility markers (e.g., "[X] years in business", "[X] clients supported") so the MSP knows to replace them.',
    tone:    'Confident, evidence-based. Let proof do the talking.'
  },
  w4: {
    label:   'W4 · What They Get',
    title:   'What This Looks Like for Your Business',
    purpose: 'Services framed as outcomes, never acronyms. Every service line should be described in terms of what changes for the buyer — not what the MSP delivers. If the analysis flags W4 as overweight or jargon-heavy, deliberately simplify: no unexplained acronyms, no bullet lists of product names. Frame each item as: "You get [outcome]" not "We provide [service]."',
    tone:    'Clear, concrete, buyer-first.'
  },
  w5: {
    label:   'W5 · Is It Worth It',
    title:   'Understanding the Investment',
    purpose: 'Frame value before the buyer sees price. What does managed IT replace (internal overhead, ad-hoc fixes, downtime costs)? What does it prevent (breaches, outages, compliance penalties)? What does it enable (focus, growth, confidence)? End with a clear, low-friction call to action — a conversation, not a commitment. Do NOT include specific pricing figures.',
    tone:    'Business case, not sales pitch. Confident and calm.'
  }
};

// Colour tokens use {{PRIMARY}}, {{ACCENT}}, {{LIGHT}}, {{BORDER}}
// — substituted in the handler before sending to Claude.
const SYSTEM_PROMPT = `You are a Salesbuildr widget creator for MSP proposals. You generate one buyer-facing HTML content widget that a Managed Service Provider pastes directly into their Salesbuildr proposal editor via TinyMCE.

=== SALESBUILDR TECHNICAL REQUIREMENTS — NON-NEGOTIABLE ===

- All CSS must be inline style="" attributes ONLY. No <style> blocks. No CSS classes. TinyMCE strips them.
- No <script> tags. No external resources. No web fonts.
- No <html>, <head>, or <body> tags. Output the content snippet only.
- The outermost element must be a single <div> — no siblings at root level.

=== COLOUR AND TYPOGRAPHY ===
- Primary:    {{PRIMARY}}  (header backgrounds, bold label text)
- Accent:     {{ACCENT}}   (callout left border, highlight colour)
- Light tint: {{LIGHT}}    (callout background, alternate row background)
- Border:     {{BORDER}}   (table and divider borders)
- Body text:  #1a1a1a, font-size:14px, line-height:1.8
- Muted:      #5a6a7e
- Font:       'Segoe UI', Arial, sans-serif (on every element — TinyMCE resets fonts)

=== REQUIRED HTML STRUCTURE ===

Every widget must follow this structure exactly (populate with real content):

<div style="width:100%;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Header bar: primary colour background, white title only -->
  <div style="background-color:{{PRIMARY}};padding:20px 28px;margin-bottom:0;">
    <h2 style="margin:0;font-size:19px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;line-height:1.3;">[WIDGET TITLE]</h2>
  </div>

  <!-- Callout intro: left accent border, light tint background -->
  <div style="border-left:4px solid {{ACCENT}};background-color:{{LIGHT}};padding:18px 24px;margin-bottom:0;">
    <p style="margin:0;font-size:15px;color:#1a3a5c;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-weight:500;">[OPENING STATEMENT]</p>
  </div>

  <!-- Key points — 2-column table, 3-5 rows -->
  <table style="width:100%;border-collapse:collapse;margin:0;">
    <tr>
      <td style="width:32%;padding:13px 16px;border:1px solid {{BORDER}};font-size:13px;font-weight:700;color:{{PRIMARY}};background-color:{{LIGHT}};vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[LABEL]</td>
      <td style="padding:13px 16px;border:1px solid {{BORDER}};font-size:14px;color:#1a1a1a;line-height:1.7;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[DETAIL]</td>
    </tr>
    <!-- Alternate rows: label td background-color:#ffffff, detail td no background -->
  </table>

  <!-- Closing line -->
  <div style="padding:16px 24px;border-top:1px solid {{BORDER}};">
    <p style="margin:0;font-size:13px;color:#5a6a7e;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">[CLOSING STATEMENT]</p>
  </div>

</div>

=== CONTENT GUIDELINES ===
- CEO audience. Clear, confident, no technical jargon.
- 150–250 words of visible text total. Concise wins.
- Buyer-first language: "You get…" not "We provide…"
- Every claim should feel specific to this MSP and this buyer — not generic boilerplate.
- Write in the same language as the proposal (infer from the analysis content).

Use the submit_widget tool to return your output.`;

const WIDGET_TOOL = {
  name: 'submit_widget',
  description: 'Submit one Salesbuildr proposal widget as a self-contained HTML snippet with inline CSS.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Short display title for this widget (5–8 words).'
      },
      html: {
        type: 'string',
        description: 'Complete self-contained HTML snippet with inline CSS only. No <style> blocks. No scripts.'
      }
    },
    required: ['title', 'html']
  }
};

// Lighten a hex colour by mixing with white
function lightenHex(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON in request body.' })
    };
  }

  const { analysis, textExcerpt, widgetId, colors } = body;

  if (!analysis || !widgetId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Request must include analysis and widgetId.' })
    };
  }

  const brief = WIDGET_BRIEFS[widgetId];
  if (!brief) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: `Unknown widgetId "${widgetId}". Must be w1–w5.` })
    };
  }

  // Resolve brand colours — fall back to corporate blue defaults
  const primary = (colors && colors.primary) || '#0d2d5e';
  const accent  = (colors && colors.accent)  || '#1a6fc4';
  const light   = (colors && colors.light)   || '#f0f6ff';
  const border  = lightenHex(accent, 0.65);

  // Substitute colour tokens into the system prompt
  const systemPrompt = SYSTEM_PROMPT
    .replace(/\{\{PRIMARY\}\}/g, primary)
    .replace(/\{\{ACCENT\}\}/g,  accent)
    .replace(/\{\{LIGHT\}\}/g,   light)
    .replace(/\{\{BORDER\}\}/g,  border);

  // Compact context string for Claude
  const w = (analysis.widgetSequence || []).find(x => x.num === parseInt(widgetId[1]));
  const fears = (analysis.fears || []).map(f => `• ${f.fear}`).join('\n');

  const userMessage = `Generate the ${brief.label} widget for this MSP proposal.

=== PROPOSAL ANALYSIS ===
Verdict: ${analysis.verdict?.headline || ''}
${analysis.verdict?.subtitle || ''}

Buyer fears:
${fears}

This widget's status in the original proposal: ${w ? `${w.status} — ${w.detail}` : 'unknown'}

Sequence note: ${analysis.sequenceNote || ''}

Proposal excerpt:
${(textExcerpt || '').slice(0, 1200)}

=== WIDGET BRIEF ===
Widget: ${brief.label}
Suggested title: "${brief.title}"
Purpose: ${brief.purpose}
Tone: ${brief.tone}

Generate the widget now.`;

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        tools: [WIDGET_TOOL],
        tool_choice: { type: 'tool', name: 'submit_widget' },
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return {
        statusCode: anthropicResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: `Anthropic API returned ${anthropicResponse.status}`,
          details: errorText
        })
      };
    }

    const data = await anthropicResponse.json();
    const toolUseBlock = Array.isArray(data.content)
      ? data.content.find(block => block.type === 'tool_use')
      : null;

    if (!toolUseBlock) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: 'Claude did not return a tool_use block.',
          details: JSON.stringify(data).slice(0, 2000)
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        ok: true,
        widget: {
          id:    widgetId,
          label: brief.label,
          title: toolUseBlock.input.title,
          html:  toolUseBlock.input.html
        },
        model: data.model,
        usage: data.usage
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Function threw an error.', details: err.message })
    };
  }
};
