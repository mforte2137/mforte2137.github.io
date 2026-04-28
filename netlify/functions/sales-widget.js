// =========================================================
// Salesbuildr Widget Creator — sales-widgets.js
// Path on the live site: /api/sales-widgets
//
// Accepts POST { fields, widgetId }
//   fields   — guided form data from sales.html
//   widgetId — "w1" | "w2" | "w3" | "w4" | "w5"
//
// Generates ONE widget per call. The browser makes 5
// sequential calls and renders each card as it arrives.
//
// Model: claude-sonnet-4-6
// Input is small (guided fields only, ~400 tokens) so
// Sonnet should comfortably fit inside the 10s Netlify
// timeout. If you see timeouts in production, swap the
// model string to 'claude-haiku-4-5-20251001'.
// =========================================================

const WIDGET_BRIEFS = {
  w1: {
    title:   'We Understand Your Situation',
    purpose: `Frame the customer's current world before introducing any solution. Describe the business pressures, risks, or limitations they are living with right now — in plain business language, not IT language. Reference their industry, team size, and the specific trigger or pain that prompted this proposal. The customer should feel understood, not sold to. Do NOT mention the proposed solution in this widget.`,
    tone:    'Empathetic, specific, zero jargon. CEO-level language.'
  },
  w2: {
    title:   'Why This Matters Now',
    purpose: `Build the business case for acting now rather than later. What are the consequences of inaction over the next 6–12 months? Connect the customer's situation to real business risk — operational disruption, security exposure, compliance liability, lost productivity, or competitive disadvantage. Frame urgency around business outcomes, not technology obsolescence. If a trigger event was provided (lease, incident, deadline), lead with that.`,
    tone:    'Direct, factual, consequence-focused. No scare tactics — just business logic.'
  },
  w3: {
    title:   'Why We\'re the Right Partner',
    purpose: `Establish trust and credibility before the customer sees scope or price. This MSP handles exactly this kind of project — make that case. Reference the type of work being proposed (network projects, infrastructure upgrades, etc.) and what a well-managed project looks like from the customer's perspective: clear communication, minimal disruption, a team that takes ownership. Use professional but generic credibility markers (years in business, clients supported, response times) clearly labelled as placeholders for the MSP to replace with their real figures.`,
    tone:    'Confident, proof-driven. Let the process and track record do the talking.'
  },
  w4: {
    title:   'What This Project Delivers',
    purpose: `Describe the proposed solution entirely in terms of business outcomes — never in terms of technical specifications or product names. For every component of the proposal, translate it into what changes for the customer: reliability, security, speed, capacity, compliance, peace of mind. No acronyms without plain-English explanation. No model numbers. The customer should be able to read this widget and understand exactly what their business will look and feel like after this project is complete.`,
    tone:    'Clear, concrete, outcome-first. Every sentence answers "what does this mean for my business?"'
  },
  w5: {
    title:   'Understanding the Investment',
    purpose: `Frame value before the customer encounters the price. What does this investment replace (reactive IT costs, downtime, temporary fixes)? What does it prevent (breaches, outages, compliance penalties, staff frustration)? What does it enable (growth, confidence, focus on the core business)? End with a clear, low-friction next step — a conversation, a site visit, a sign-off — not a hard close. Do NOT include specific pricing figures.`,
    tone:    'Business case, not sales pitch. Calm and confident.'
  }
};

const SYSTEM_PROMPT = `You are a Salesbuildr widget creator for MSP (Managed Service Provider) proposals. You generate one buyer-facing HTML content widget at a time, based on a guided brief provided by the MSP.

Your output is pasted directly into a Salesbuildr proposal editor via TinyMCE. The widgets follow the Buyer Decision Journey framework — each addresses one of five questions a buyer asks before they say yes.

=== SALESBUILDR TECHNICAL REQUIREMENTS — NON-NEGOTIABLE ===

- All CSS must be inline style="" attributes ONLY. No <style> blocks. No CSS classes. TinyMCE strips them.
- No <script> tags. No external resources. No web fonts.
- No <html>, <head>, or <body> tags. Output the content snippet only.
- The outermost element must be a single <div>.

=== COLOUR AND TYPOGRAPHY ===
Navy:        #0d2d5e  (header backgrounds)
Blue:        #1a6fc4  (callout borders, accent)
Light blue:  #f0f6ff  (callout and alternate row backgrounds)
Border:      #d0e2f5
Body text:   #1a1a1a, font-size:14px, line-height:1.8
Muted:       #5a6a7e
Font:        'Segoe UI', Arial, sans-serif — repeat on EVERY element

=== REQUIRED HTML STRUCTURE ===

<div style="width:100%;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Header bar: navy background, white title only — no W1/W2 labels -->
  <div style="background-color:#0d2d5e;padding:20px 28px;">
    <h2 style="margin:0;font-size:19px;font-weight:700;color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;line-height:1.3;">[WIDGET TITLE]</h2>
  </div>

  <!-- Callout intro: left blue border, light blue background -->
  <div style="border-left:4px solid #1a6fc4;background-color:#f0f6ff;padding:18px 24px;">
    <p style="margin:0;font-size:15px;color:#1a3a5c;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-weight:500;">[OPENING STATEMENT]</p>
  </div>

  <!-- Key points: 2-column table, 3–5 rows -->
  <table style="width:100%;border-collapse:collapse;margin:0;">
    <tr>
      <td style="width:32%;padding:13px 16px;border:1px solid #d0e2f5;font-size:13px;font-weight:700;color:#0d2d5e;background-color:#f0f6ff;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[LABEL]</td>
      <td style="padding:13px 16px;border:1px solid #d0e2f5;font-size:14px;color:#1a1a1a;line-height:1.7;vertical-align:top;font-family:'Segoe UI',Arial,sans-serif;">[DETAIL]</td>
    </tr>
    <!-- Alternate rows: label td background-color:#ffffff, detail td no background -->
  </table>

  <!-- Closing line -->
  <div style="padding:16px 24px;border-top:1px solid #d0e2f5;">
    <p style="margin:0;font-size:13px;color:#5a6a7e;line-height:1.7;font-family:'Segoe UI',Arial,sans-serif;font-style:italic;">[CLOSING STATEMENT]</p>
  </div>

</div>

=== CONTENT RULES ===
- CEO audience. Plain business language. No technical jargon or product acronyms.
- Buyer-first framing: "You get…" and "Your business will…" not "We provide…" or "We install…"
- 150–250 words of visible text per widget.
- Make the content specific to the customer's industry, situation, and the solution described — not generic boilerplate.
- For W3 (trust/credibility): use clearly labelled placeholders like [X years in business] so the MSP knows to replace them.
- Write in English unless the brief indicates otherwise.

Use the submit_widget tool to return your output.`;

const WIDGET_TOOL = {
  name: 'submit_widget',
  description: 'Submit one Salesbuildr proposal widget as a self-contained HTML snippet with inline CSS.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Display title for this widget (5–8 words). Appears in the app UI above the preview.'
      },
      html: {
        type: 'string',
        description: 'Complete self-contained HTML snippet with inline CSS only. No <style> blocks. No scripts. Ready to paste into Salesbuildr TinyMCE via Source Code view.'
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

  const { fields, widgetId } = body;
  if (!fields || !widgetId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Request must include fields and widgetId.' })
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

  // Build a focused, compact user message from the guided fields
  const userMessage = `Generate a Salesbuildr widget for the following MSP proposal.

=== PROPOSAL BRIEF ===
What is being proposed:
${fields.solution}

Customer's business:
${fields.business}${fields.size ? ` — approximately ${fields.size}` : ''}
${fields.trigger  ? `\nWhat's prompting this:\n${fields.trigger}`   : ''}
${fields.outcomes ? `\nWhat success looks like for the customer:\n${fields.outcomes}` : ''}
${fields.urgency  ? `\nUrgency or deadline:\n${fields.urgency}`     : ''}

=== WIDGET TO GENERATE ===
Widget: ${widgetId.toUpperCase()} — ${brief.title}
Purpose: ${brief.purpose}
Tone: ${brief.tone}

Generate the widget now. Follow the HTML structure and inline CSS requirements in your system prompt exactly.`;

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
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
