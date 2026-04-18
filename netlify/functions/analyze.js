// =========================================================
// Proposal Evaluator — serverless analyze endpoint
// Path on the live site: /api/analyze
//   (netlify.toml redirects /api/* to /.netlify/functions/*)
//
// Accepts POST { text, filename, pages }. Sends the
// proposal text to Claude with Mike Minkler's MSP framework
// as the system prompt, and forces structured JSON output
// via Claude's tool_use feature.
//
// Using claude-haiku-4-5 for speed and cost — a full
// analysis runs in ~5 seconds and costs well under $0.01.
// Upgrade to Sonnet by changing the model string below if
// writing quality needs a boost.
// =========================================================

const SYSTEM_PROMPT = `You are a proposal evaluator built on Mike Minkler's framework for MSP proposals. You analyze real proposals and produce a sharp, decisive "Buyer Decision Journey Report" that helps MSPs see their proposal through a buyer's eyes.

=== MIKE'S FRAMEWORK ===

THREE MINDSET PRINCIPLES:
1. Buyers are buying INSURANCE, not IT. Loss aversion beats appeal of gain.
2. Trust comes BEFORE price. If price appears before trust is built, price becomes the only evaluable thing.
3. Your competitor is INERTIA. The most common outcome is "they did nothing," not "they chose someone else."

THE FIVE BUYER QUESTIONS — every proposal must answer these, IN THIS ORDER:
W1. "Do they understand my situation?" → Client context in business language. Common mistake: opening with the MSP's own company.
W2. "Why should I care about this now?" → Risk, pain, cost of inaction. Urgency lives here. Common mistake: skipping it entirely.
W3. "Why should I trust you?" → Social proof, case studies, team, testimonials. Common mistake: burying this after the price.
W4. "What exactly am I getting?" → Services in buyer-friendly language. Common mistake: leading with this — it belongs fourth.
W5. "Is this worth it?" → Pricing framed as investment + clear CTA. Common mistake: bare price with no value framing.

Winning flow: Problem → Outcome → Approach → Investment.
Signature phrases to echo in your output: "outside-in vs. inside-out", "what is your buyer worried about at 2am?", "clarity creates confidence, confidence drives decisions", "the buyer decides emotionally and justifies rationally".

=== CRITICAL: IGNORE SAMPLING ARTIFACTS ===

Proposals uploaded here are samples. The uploader is not the buyer — they are an MSP sharing an old or test quote. DO NOT flag any of the following, under any circumstances:
- Expired or stale expiration/delivery dates (e.g., Expiration Date: 2024)
- Unfilled template placeholders ("Clayton client name", "Dear ,", blank "Prepared for" fields)
- Placeholder term lengths ("XX months", "Month DD, YYYY", "xx months")
- Visible multi-option template blocks like "(OPTION 1) (OPTION 2) (OPTION 3)"
- Test or generic company names
- Template IDs, quote numbers, version labels
- Any artifact that clearly reflects "this is a template, not a real filled-out proposal"

DO flag (these are real proposal-design problems):
- Inside-out language: the MSP talks about themselves, their process, their product vs. the buyer's outcome
- Missing widgets: no situation understanding, no pain/urgency narrative, no trust-building content
- Over-weighted W4: services listed as acronyms/jargon (MDR, XDR, SIEM) rather than outcomes
- Bare pricing with no value framing
- Absent social proof, case studies, team bios, testimonials
- Unclear or MSP-centric calls to action

=== TONE ===

Sharp. Decisive. Editorial. Never nitpick. Never soft-pedal. Write like an editor delivering a verdict on the document — not a coach delivering feedback.

When you select quotes for the "inside-out language" section, they must be literal, verbatim text from the proposal. Do not paraphrase or combine. Every quote must be something a ctrl-F search for it would find in the document.

When you generate the 2am fears, infer them from signals in the proposal (industry, company size clues, services discussed, region). Make each fear a specific scenario a real business owner would carry, not a generic IT concern.

=== LANGUAGE ===

Write the entire analysis in the same language as the proposal. Dutch proposal → Dutch report. French (including Québécois) proposal → French report in that register. English proposal → English report, matching the regional variant (US/UK/Canadian) signaled by the document. Match the proposal's locale and register throughout.

The "their" quotes in insideOutQuotes are verbatim text — they stay in the document's original language by definition. The "ours" rewrites must also be in that language so the MSP can use them directly with their client. Translate the signature phrases naturally into the target language rather than keeping them in English.

Use the submit_analysis tool to return your output.`;

const ANALYSIS_TOOL = {
  name: "submit_analysis",
  description: "Submit the Buyer Decision Journey Report analysis of the MSP proposal",
  input_schema: {
    type: "object",
    properties: {
      verdict: {
        type: "object",
        description: "The overall verdict — what your buyer actually experiences reading this proposal.",
        properties: {
          headline: {
            type: "string",
            description: "A single sharp sentence. Max ~10 words. Examples of the tone: 'This is a quote. Not a proposal.' / 'The services are listed. The reason to buy isn't.' / 'Your buyer meets the price before they meet you.'"
          },
          subtitle: {
            type: "string",
            description: "1-2 sentences expanding on the headline. What your buyer experiences and why it matters."
          }
        },
        required: ["headline", "subtitle"]
      },
      widgetSequence: {
        type: "array",
        description: "Exactly 5 items, one per widget (W1-W5), in order 1 through 5.",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            num: { type: "integer", description: "Widget number 1-5", minimum: 1, maximum: 5 },
            label: {
              type: "string",
              description: "Short fixed label for the widget: 'Their situation' (W1), 'Why care now' (W2), 'Why trust you' (W3), 'What they get' (W4), 'Is it worth it' (W5)."
            },
            status: {
              type: "string",
              enum: ["present", "missing", "overweight"],
              description: "present = adequately addressed in the proposal; missing = not addressed at all; overweight = over-present / dominates the document"
            },
            detail: {
              type: "string",
              description: "Very brief (1-5 words) characterization that appears on the widget in the visual. Examples: 'Missing', '40+ line items', '$279/mo', 'One case study', 'Bare price'"
            }
          },
          required: ["num", "label", "status", "detail"]
        }
      },
      sequenceNote: {
        type: "string",
        description: "A paragraph (2-4 sentences) explaining what the widget sequence means for THIS proposal. Name specific questions that are missing or out of order. End with the consequence for the buyer."
      },
      fears: {
        type: "array",
        description: "3 to 5 specific 2am fears the likely buyer for this proposal would carry. Infer from industry/size/location signals in the document. Each fear is a scenario, not a generic IT concern.",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            fear: {
              type: "string",
              description: "A specific scenario the buyer fears, in full sentence. E.g., 'A ransomware attack takes the business offline for two weeks and wipes the margin for the year.'"
            },
            proposalGap: {
              type: "string",
              description: "One sentence showing how the proposal fails to address this fear, italic-tone. Reference specific services or absences. E.g., 'Managed Detection & Response appears as a bullet. The breach scenario it prevents does not.'"
            }
          },
          required: ["fear", "proposalGap"]
        }
      },
      insideOutQuotes: {
        type: "array",
        description: "4 to 5 examples of inside-out language with outside-in rewrites. Each 'their' quote must be literal text lifted from the proposal, not paraphrased.",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            their: {
              type: "string",
              description: "Verbatim text from the proposal. Must be something a ctrl-F search would find. 5-40 words."
            },
            ours: {
              type: "string",
              description: "Outside-in rewrite. Buyer-focused, outcome-focused. In Mike's voice. Roughly the same length as the original."
            }
          },
          required: ["their", "ours"]
        }
      },
      openingRewrite: {
        type: "object",
        description: "ONE rewrite of the proposal's opening paragraph. Not multiple — just one sharp rewrite.",
        properties: {
          before: {
            type: "string",
            description: "The actual opening text of the proposal, as written. If there is a cover letter or opening line, use that. 1-3 sentences."
          },
          after: {
            type: "string",
            description: "A single outside-in rewrite that leads with the buyer's situation and the outcome. In Mike's voice. 1-3 sentences."
          }
        },
        required: ["before", "after"]
      }
    },
    required: ["verdict", "widgetSequence", "sequenceNote", "fears", "insideOutQuotes", "openingRewrite"]
  }
};

exports.handler = async (event) => {
  // Only accept POST with proposal text.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'This endpoint requires POST with a JSON body containing { text, filename, pages }.'
      })
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

  const { text, filename, pages } = body;
  if (!text || text.length < 100) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Request must include a "text" field with at least 100 characters.'
      })
    };
  }

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
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: 'tool', name: 'submit_analysis' },
        messages: [
          {
            role: 'user',
            content: `Analyze this MSP proposal using the framework and rules in your system prompt.\n\nFilename: ${filename || 'unknown'}\nPages: ${pages || 'unknown'}\n\n=== PROPOSAL TEXT ===\n${text}\n=== END PROPOSAL TEXT ===`
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

    // Claude should have used the tool. Pull the analysis out of
    // the tool_use block in the response content.
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
        analysis: toolUseBlock.input,
        model: data.model,
        usage: data.usage,
        timestamp: new Date().toISOString()
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Function threw an error',
        details: err.message
      })
    };
  }
};
