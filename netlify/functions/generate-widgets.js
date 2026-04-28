// =========================================================
// Proposal Evaluator — Salesbuildr Widget Generator
// Path on the live site: /api/generate-widgets
//
// Accepts POST { analysis, textExcerpt, widgetId }
//   analysis    — the structured output from /api/analyze
//   textExcerpt — first ~1500 chars of the proposal text
//   widgetId    — "w1" | "w2" | "w3" | "w4" | "w5"
//
// Generates ONE widget per call. The browser makes 5
// sequential calls and renders each widget as it arrives.
// This keeps each call well inside the Netlify 10s timeout
// (Haiku returns a single widget in ~3-4 seconds).
//
// Model: claude-haiku-4-5-20251001 — same reasoning as
// analyze.js. Sonnet produces better copy but times out.
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

const SYSTEM_PROMPT = `You are a Salesbuildr widget creator for MSP proposals. You generate one buyer-facing HTML content widget that a Managed Service Provider pastes directly into their Salesbuildr proposal editor via TinyMCE.

=== SALESBUILDR TECHNICAL REQUIREMENTS — NON-NEGOTIABLE ===

- All CSS must be inline style="" attributes ONLY. No <style> blocks. No CSS classes. TinyMCE strips them.
- No <script> tags. No external resources. No web fonts.
- No <html>, <head>, or <body> tags. Output the content snippet only.
- The outermost element must be a single <div> — no siblings at root level.

=== COLOUR AND TYPOGRAPHY ===
- Navy:         #0d2d5e  (header backgrounds, heading text)
- Blue:         #1a6fc4  (callout borders, accent elements)
- Light blue:   #f0f6ff  (callout backgrounds, alternate rows)
- Border:       #d0e2f5
- Body text:    #1a1a1a, font-size:14px, line-height:1.8
- Muted text:   #5a6a7e
- White:        #ffffff
- Font:         'Segoe UI', Arial, sans-serif (on every element — TinyMCE resets fonts)

=== REQUIRED HTML STRUCTURE ===

Every widget must follow this structure exactly (populate with real content):

<div style="max-width:860px;margin:0 auto;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Header bar -->
  <div style="background-color:#0d2d5e;padding:20px 28px;margin-bottom:0;">
    <p style="margin:0 0 5px 0;font-size:11px;font-weight:600;letter-spacing:1.5px;color:#7eb3e8;text-transform:uppercase;font-family:'Segoe UI',Arial,sans-serif;">[WIDGET LABEL — e.g. W1 · Buyer Decision Journey]</p>
    <h2 style="margin:0;font-size:19px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;line-height:1.3;">[WIDGET TITLE]</h2>
  </div>

  <!-- Callout intro -->
  <div style="border-left:4px solid #1a6fc4;background-color:#f0f6ff;padding:18px 24px;margin-bottom:0;">
    <p style="margin:0;font-size:15px;color:#1a3a5c;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-weight:500;">[OPENING STATEMENT — leads with the buyer's situation or the point of this widget]</p>
  </div>

  <!-- Key points — use a 2-column table for 3-5 rows -->
  <table style="width:100%;border-collapse:collapse;margin:0;">
    <tr>
      <td style="width:32%;padding:13px 16px;border:1px solid #d0e2f5;font-size:13px;font-weight:700;color:#0d2d5e;background-color:#f0f6ff;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[LABEL]</td>
      <td style="padding:13px 16px;border:1px solid #d0e2f5;font-size:14px;color:#1a1a1a;line-height:1.7;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[DETAIL]</td>
    </tr>
    <!-- repeat <tr> for each point, alternate rows use background-color:#ffffff on the label td and no background on the detail td -->
  </table>

  <!-- Closing line -->
  <div style="padding:16px 24px;border-top:1px solid #d0e2f5;">
    <p style="margin:0;font-size:13px;color:#5a6a7e;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">[CLOSING STATEMENT — 1 sentence that bridges to the next widget or reinforces the point]</p>
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
        description: 'Short display title for this widget (5–8 words). Will appear in the app UI above the widget.'
      },
      html: {
        type: 'string',
        description: 'Complete self-contained HTML snippet. Inline CSS only. No <style> blocks. No scripts. Ready to paste into Salesbuildr TinyMCE via Source Code view.'
      }
    },
    required: ['title', 'html']
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON in request body.' })
    };
  }

  const { analysis, textExcerpt, widgetId } = body;

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

  // Build a compact, focused context string for Claude.
  // We use the analysis (already interpreted) not the raw document,
  // so token count stays low and response time stays fast.
  const w = (analysis.widgetSequence || []).find(x => x.num === parseInt(widgetId[1]));
  const fears = (analysis.fears || []).map(f => `• ${f.fear}`).join('\n');

  const userMessage = `Generate the ${brief.label} widget for this MSP proposal.

=== PROPOSAL ANALYSIS ===
Verdict: ${analysis.verdict?.headline || ''}
${analysis.verdict?.subtitle || ''}

Buyer fears (what keeps them up at 2am):
${fears}

This widget's status in the original proposal: ${w ? `${w.status} — ${w.detail}` : 'unknown'}

Sequence note: ${analysis.sequenceNote || ''}

Proposal excerpt (first 1,200 characters, for context and language matching):
${(textExcerpt || '').slice(0, 1200)}

=== WIDGET BRIEF ===
Widget: ${brief.label}
Suggested title: "${brief.title}"
Purpose: ${brief.purpose}
Tone: ${brief.tone}

Generate the widget now. Follow the HTML structure and inline CSS requirements exactly.`;

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
        system: SYSTEM_PROMPT,
        tools: [WIDGET_TOOL],
        tool_choice: { type: 'tool', name: 'submit_widget' },
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
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
      body: JSON.stringify({
        ok: false,
        error: 'Function threw an error.',
        details: err.message
      })
    };
  }
};
