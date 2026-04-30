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
Primary:     {{PRIMARY}}  (header backgrounds, bold label text)
Accent:      {{ACCENT}}   (callout left border, highlight colour)
Light tint:  {{LIGHT}}    (callout background, alternate row background)
Border:      {{BORDER}}   (table and divider borders)
Body text:   #1a1a1a, font-size:14px, line-height:1.8
Muted:       #5a6a7e
Font:        'Segoe UI', Arial, sans-serif — repeat on EVERY element

=== REQUIRED HTML STRUCTURE ===

White background throughout. Colour accents only — never fills. Single column. Clean and airy.

<div style="width:100%;padding:28px 32px 32px;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Title: large, bold, near-black — NOT the primary colour, no background bar -->
  <h2 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 20px 0;line-height:1.25;padding:0;border:none;font-family:'Segoe UI',Arial,sans-serif;">[WIDGET TITLE]</h2>

  <!-- Opening callout: light tint background, centred, italic — the one key idea -->
  <div style="background-color:{{LIGHT}};padding:18px 24px;margin:0 0 26px 0;">
    <p style="margin:0;font-size:15px;color:#444444;line-height:1.7;font-style:italic;text-align:center;font-family:'Segoe UI',Arial,sans-serif;">[OPENING STATEMENT — one sentence, the buyer's core situation or the widget's central idea]</p>
  </div>

  <!-- Section: left accent border + heading in primary colour + body text. Repeat 2–4 times. -->
  <div style="border-left:4px solid {{ACCENT}};padding:0 0 0 18px;margin:0 0 22px 0;">
    <h3 style="font-size:15px;font-weight:700;color:{{PRIMARY}};margin:0 0 9px 0;padding:0;font-family:'Segoe UI',Arial,sans-serif;">[SECTION HEADING]</h3>
    <p style="margin:0 0 8px 0;font-size:14px;color:#2d2d2d;line-height:1.8;font-family:'Segoe UI',Arial,sans-serif;">[PARAGRAPH — or use bullet items below instead]</p>
    <!-- Bullet items: one <p> per bullet using · character. Do NOT use <ul> or <li> tags. -->
    <p style="margin:0 0 5px 0;font-size:14px;color:#2d2d2d;line-height:1.6;font-family:'Segoe UI',Arial,sans-serif;">· [BULLET ITEM]</p>
  </div>

  <!-- Repeat the section <div> above for each key point (2–4 sections total) -->

  <!-- Closing line: muted, separated by a subtle rule -->
  <p style="margin:24px 0 0 0;padding-top:16px;border-top:1px solid #e8e8e8;font-size:13px;color:#6b6b6b;line-height:1.6;font-style:italic;font-family:'Segoe UI',Arial,sans-serif;">[CLOSING STATEMENT — one sentence that bridges to the next section of the proposal]</p>

</div>

STRUCTURE RULES — follow these exactly:
- NO full-width coloured header bars or background fills on the title
- NO table layouts, NO two-column layouts, NO alternating row colours
- White background (#ffffff) on the outer div and all sections
- The ONLY use of {{PRIMARY}} is on section headings (h3 colour)
- The ONLY use of {{ACCENT}} is on the left border of section divs
- The ONLY use of {{LIGHT}} is on the opening callout background
- Bullet items must use · character in individual <p> tags — never <ul> or <li>
- 2–4 sections per widget maximum — keep it airy and readable

=== CONTENT RULES ===
- CEO audience. Plain business language. No technical jargon or product acronyms.
- Buyer-first framing: "You get…" and "Your business will…" not "We provide…" or "We install…"
- 150–250 words of visible text per widget.
- Make the content specific to the customer's industry, situation, and the solution described — not generic boilerplate.
- For W3 (trust/credibility): use clearly labelled placeholders like [X years in business] so the MSP knows to replace them.
- Write in English unless the brief indicates otherwise.

=== SALESBUILDR TEMPLATE VARIABLES ===
Use these variables naturally in the widget text. Salesbuildr replaces them automatically when the quote is rendered — the widget personalises itself for each customer without any manual editing.

VARIABLES TO USE:
- {{company.name}} — the customer's company name. Use instead of "your business", "your firm", "your organisation". Use it 2–4 times naturally across the widget.
- {{servicingBranch.name}} — the MSP's own company name. Use in W3 and W5 when referring to "we" or "our team" formally, e.g. "At {{servicingBranch.name}}, we handle exactly this kind of project."
- {{contact.firstName}} — the buyer's first name. Use once at the opening of W1 to address them directly, e.g. "{{contact.firstName}}, here's what we've heard from businesses like yours…"
- {{owner.firstName}}, {{owner.email}}, {{owner.phone}} — the quote owner's contact details. Use in W5 for the call to action, e.g. "Reach out to {{owner.firstName}} at {{owner.email}} or call {{owner.phone}} to take the next step."
- {{date quote.expiresAt}} — the quote expiry date. Use optionally in W2 to add deadline-driven urgency, e.g. "This proposal is valid until {{date quote.expiresAt}}."

RULES FOR VARIABLES:
- Variables must appear exactly as shown, with double curly braces — e.g. {{company.name}} not {company.name} or [company.name].
- Place variables only inside visible text content — never inside HTML attributes, style="" values, or CSS.
- Use them naturally — do not force every variable into every widget.
- {{company.name}} is the most important: use it consistently throughout every widget.

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

  const { fields, widgetId, colors } = body;
  if (!fields || !widgetId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Request must include fields and widgetId.' })
    };
  }

  // Apply brand colours — fall back to corporate blue defaults
  const primary = (colors && colors.primary) || '#0d2d5e';
  const accent  = (colors && colors.accent)  || '#1a6fc4';
  const light   = (colors && colors.light)   || '#f0f6ff';

  // Derive a border colour: a slightly darker version of the light tint
  // Simple approach: lighten the accent at 75% instead of 91%
  function lightenHex(hex, amount) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    const nr = Math.round(r + (255-r) * amount);
    const ng = Math.round(g + (255-g) * amount);
    const nb = Math.round(b + (255-b) * amount);
    return `#${nr.toString(16).padStart(2,'0')}${ng.toString(16).padStart(2,'0')}${nb.toString(16).padStart(2,'0')}`;
  }
  const border = lightenHex(accent, 0.65);

  // Substitute colour tokens into the system prompt
  const systemPrompt = SYSTEM_PROMPT
    .replace(/\{\{PRIMARY\}\}/g, primary)
    .replace(/\{\{ACCENT\}\}/g,  accent)
    .replace(/\{\{LIGHT\}\}/g,   light)
    .replace(/\{\{BORDER\}\}/g,  border);

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
