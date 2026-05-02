// =========================================================
// sales-guide.js — Netlify function
// Path: /api/sales-guide
//
// Two actions:
//   discover  — takes 6 discovery answers → Claude Sonnet
//               recommendation with coaching insight,
//               hardware checklist, service recommendations,
//               and widget briefs for all 5 W-questions
//
//   execute   — takes a free-text spec description → Claude
//               translates technical solution into buyer
//               language with widget briefs + scope notes
// =========================================================

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ── Discovery system prompt ───────────────────────────────
const DISCOVER_SYSTEM = `You are a senior MSP sales strategist built into Salesbuildr. Your job is to help MSP sales reps build compelling proposals — starting from a customer's problem, not from a product catalog.

You understand that most MSP sales reps are technically strong but commercially weak. They default to listing products and acronyms that mean nothing to a business owner or CFO. Your role is to bridge that gap.

The framework you work within is the Buyer Decision Journey — five questions every customer asks before they say yes:
W1: "Do they understand my situation?"
W2: "Why should I care about this now?"
W3: "Why should I trust this MSP?"
W4: "What exactly am I getting?"
W5: "Is this worth it?"

Every recommendation you make should move the customer through those five questions.

When you see a discovery profile, your job is to:
1. Identify the real business problem beneath the technical symptoms
2. Recommend the right shape of solution (services + project scope)
3. Flag hardware components that need to be confirmed at a site survey
4. Give the rep a coaching insight they can use in the room with the customer
5. Provide specific, buyer-focused briefs for each of the 5 proposal widgets

Always frame recommendations in business outcomes — never in product names or acronyms.
Use the submit_discovery_recommendation tool to return your output.`;

// ── Execution system prompt ───────────────────────────────
const EXECUTE_SYSTEM = `You are a senior MSP sales strategist built into Salesbuildr. A design desk or senior engineer has already determined the technical solution. Your job is to translate that technical specification into compelling buyer language that will move a business owner or CFO to say yes.

The customer does not care what brand of firewall is being installed. They care that their business is protected, their team can work without interruption, and they can pass their cyber insurance audit.

Your job is to take the technical spec provided and:
1. Identify the key business outcomes this solution delivers
2. Spot the strongest "why now" angle in the spec
3. Give the rep a coaching insight for the sales conversation
4. Produce specific, outcome-focused briefs for all 5 proposal widgets

The Buyer Decision Journey framework:
W1: Situation — show you understand their world
W2: Urgency — why act now, not later
W3: Trust — why this MSP is the right partner
W4: Outcome — what their business looks like after this project
W5: Investment — frame the value, not just the cost

Translate ALL technical terms into plain business language.
Use the submit_execution_recommendation tool to return your output.`;

// ── Tool schemas ──────────────────────────────────────────
const DISCOVER_TOOL = {
  name: 'submit_discovery_recommendation',
  description: 'Submit the sales recommendation based on discovery answers',
  input_schema: {
    type: 'object',
    properties: {
      coaching_insight: {
        type: 'string',
        description: 'The key insight the rep should carry into the room. What does this customer really care about? What will make or break this sale? 2-3 sentences, direct and actionable.'
      },
      engagement_type: {
        type: 'string',
        enum: ['managed_services', 'network_upgrade', 'security_project', 'compliance', 'new_client_onboarding', 'project_plus_managed', 'mixed'],
        description: 'The primary type of engagement this is'
      },
      solution_summary: {
        type: 'string',
        description: 'One paragraph summary of the recommended solution in buyer language — what it does for their business, not what it is technically'
      },
      hardware_needed: {
        type: 'boolean',
        description: 'Whether physical hardware is a significant part of this engagement'
      },
      hardware_checklist: {
        type: 'array',
        description: 'Hardware components to confirm at a site survey. Only populate if hardware_needed is true.',
        items: {
          type: 'object',
          properties: {
            component:    { type: 'string', description: 'Component type e.g. Core Switch, Firewall, Wireless AP' },
            confirm:      { type: 'string', description: 'The specific question to answer at the site visit e.g. How many wired ports needed — determines 24 vs 48 port' },
            never_forget: { type: 'string', description: 'Why this component matters / what gets missed — e.g. UPS is almost always forgotten' }
          },
          required: ['component', 'confirm']
        }
      },
      services_recommended: {
        type: 'array',
        description: 'Managed and recurring services to include in the proposal',
        items: {
          type: 'object',
          properties: {
            service:  { type: 'string', description: 'Service name in plain language e.g. Managed Security, Network Monitoring' },
            billing:  { type: 'string', enum: ['monthly', 'annual', 'one-time'], description: 'How this service is billed' },
            reason:   { type: 'string', description: 'Why this service is right for this specific customer — connected to their pain' },
            optional: { type: 'boolean', description: 'True if this should be presented as an optional add-on' }
          },
          required: ['service', 'billing', 'reason', 'optional']
        }
      },
      widget_briefs: {
        type: 'object',
        description: 'Specific context to drive each of the 5 buyer-journey widgets. Be specific to this customer — use what you know about their situation, trigger, and goals.',
        properties: {
          w1: { type: 'string', description: 'Their situation: what is their world like right now? What pain are they carrying? Be specific.' },
          w2: { type: 'string', description: 'Why now: what makes this urgent? What happens if they wait 6 months? Connect to their trigger.' },
          w3: { type: 'string', description: 'Why trust us: what credibility angle fits this engagement type? What does a great outcome look like for this customer?' },
          w4: { type: 'string', description: 'What they get: the key outcomes in business language. What does life look like after this project?' },
          w5: { type: 'string', description: 'Investment framing: how should the investment be positioned? What does it replace, prevent, or enable?' }
        },
        required: ['w1', 'w2', 'w3', 'w4', 'w5']
      },
      roi_angle: {
        type: 'string',
        description: 'The strongest ROI angle for this customer — productivity, security risk, compliance, or cost savings? One sentence.'
      }
    },
    required: ['coaching_insight', 'engagement_type', 'solution_summary', 'hardware_needed', 'services_recommended', 'widget_briefs']
  }
};

const EXECUTE_TOOL = {
  name: 'submit_execution_recommendation',
  description: 'Submit the buyer-language translation of the technical spec',
  input_schema: {
    type: 'object',
    properties: {
      coaching_insight: {
        type: 'string',
        description: 'What the rep should emphasise in the meeting — the strongest commercial angle in this spec. 2-3 sentences.'
      },
      buyer_summary: {
        type: 'string',
        description: 'The technical spec translated into a paragraph of buyer language — what this solution DOES for the business, zero technical jargon'
      },
      widget_briefs: {
        type: 'object',
        properties: {
          w1: { type: 'string', description: 'Situation context implied by this spec' },
          w2: { type: 'string', description: 'Urgency angle from this spec — what risk does it address?' },
          w3: { type: 'string', description: 'Trust/credibility angle for this type of project' },
          w4: { type: 'string', description: 'Specific outcomes from this spec in buyer language' },
          w5: { type: 'string', description: 'Investment framing — what does this replace, prevent, or enable?' }
        },
        required: ['w1', 'w2', 'w3', 'w4', 'w5']
      },
      scope_notes: {
        type: 'string',
        description: 'Key project scope considerations based on the spec — what the project scope builder should emphasise'
      },
      billing_shape: {
        type: 'string',
        description: 'Brief note on the billing shape — e.g. primarily one-time project, monthly recurring services, or mixed'
      }
    },
    required: ['coaching_insight', 'buyer_summary', 'widget_briefs']
  }
};

// ── Main handler ──────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { action } = body;
  const ok = (data) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, ...data }) });
  const err = (msg, code = 500) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: msg }) });

  // ── ACTION: discover ──────────────────────────────────────
  if (action === 'discover') {
    const { answers } = body;
    if (!answers) return err('Discovery answers required.', 400);

    const userMsg = `Here are the discovery answers for a new sales opportunity:

Primary challenge: ${answers.challenge || 'Not specified'}
Business type: ${answers.industry || 'Not specified'}, ${answers.staffCount || '?'} staff
Trigger for this conversation: ${answers.trigger || 'Not specified'}
What matters most to the decision-maker: ${answers.outcome || 'Not specified'}
What they're comparing us against: ${answers.comparison || 'Not specified'}
Shape of this engagement: ${answers.shape || 'Not specified'}
Additional context: ${answers.other || 'None'}

Build a sales recommendation and widget briefs for this opportunity.`;

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: DISCOVER_SYSTEM,
          tools: [DISCOVER_TOOL],
          tool_choice: { type: 'tool', name: 'submit_discovery_recommendation' },
          messages: [{ role: 'user', content: userMsg }]
        })
      });
      const data = await res.json();
      const tool = Array.isArray(data.content) ? data.content.find(b => b.type === 'tool_use') : null;
      if (!tool) return err('No recommendation returned.');
      return ok({ recommendation: tool.input });
    } catch (e) { return err(e.message); }
  }

  // ── ACTION: execute ───────────────────────────────────────
  if (action === 'execute') {
    const { spec, customerContext } = body;
    if (!spec) return err('Spec description required.', 400);

    const userMsg = `Here is the confirmed technical specification for a customer proposal:

${spec}

${customerContext ? `Customer context: ${customerContext}` : ''}

Translate this into buyer language and generate widget briefs for a compelling proposal.`;

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: EXECUTE_SYSTEM,
          tools: [EXECUTE_TOOL],
          tool_choice: { type: 'tool', name: 'submit_execution_recommendation' },
          messages: [{ role: 'user', content: userMsg }]
        })
      });
      const data = await res.json();
      const tool = Array.isArray(data.content) ? data.content.find(b => b.type === 'tool_use') : null;
      if (!tool) return err('No recommendation returned.');
      return ok({ recommendation: tool.input });
    } catch (e) { return err(e.message); }
  }

  return err('Unknown action.', 400);
};
