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

For the service_widget_html field: generate a clean, self-contained HTML widget that describes the recommended service stack in buyer language. Rules:
- No vendor or product names (not "Sophos MDR" — say "24/7 threat detection and response")
- Describe what each service DOES for the business, not what it is technically
- 3-5 service categories appropriate to the engagement type
- Use simple inline CSS only — no external dependencies
- Professional appearance suitable for a sales proposal
- Include a brief intro sentence at the top

Use the submit_discovery_recommendation tool to return your output.`;

// ── Execution system prompt ───────────────────────────────
const EXECUTE_SYSTEM = `You are a senior MSP sales strategist built into Salesbuildr. A design desk or senior engineer has already determined the technical solution. Your job is to translate that technical specification into compelling buyer language that will move a business owner or CFO to say yes.

The customer does not care what brand of firewall is being installed. They care that their business is protected, their team can work without interruption, and they can pass their cyber insurance audit.

Your job is to take the technical spec provided and:
1. Identify the key business outcomes this solution delivers
2. Spot the strongest "why now" angle in the spec
3. Give the rep a coaching insight for the sales conversation
4. Produce specific, outcome-focused briefs for all 5 proposal widgets
5. Categorise EVERY line item into: hardware (physical products with MPNs like firewalls, switches, laptops, cables, patch panels), service (recurring managed services like MDR, monitoring, NOC), labor (professional services / installation hours), software (licenses or subscriptions), or unknown

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
        description: '1-2 sentences maximum — the single most important thing the rep must know walking into this meeting. Direct, punchy, actionable. No fluff.'
      },
      engagement_type: {
        type: 'string',
        enum: ['managed_services', 'network_upgrade', 'endpoint_refresh', 'server_eol', 'security_project', 'compliance', 'new_client_onboarding', 'project_plus_managed', 'voip_project', 'backup_dr', 'copilot_ai', 'mixed'],
        description: 'The primary type of engagement this is'
      },
      solution_bullets: {
        type: 'array',
        description: '3-4 bullet points describing the recommended approach in plain language — what needs to be in place for this customer. Each bullet: one clear, buyer-focused outcome. No jargon.',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 4
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
            confirm:      { type: 'string', description: 'The specific question to answer at the site visit' },
            never_forget: { type: 'string', description: 'One sentence: the single most common mistake reps make on this component' }
          },
          required: ['component', 'confirm']
        }
      },
      // services_recommended removed — curated per-engagement framework used instead
      w1_situation: { type: 'string', description: 'W1 — their situation in 1-2 sentences: what pain are they carrying right now?' },
      w2_urgency:   { type: 'string', description: 'W2 — urgency in 1-2 sentences: why act now, what happens if they wait?' },
      w3_trust:     { type: 'string', description: 'W3 — trust angle in 1-2 sentences: why is this MSP the right partner for this?' },
      w4_outcome:   { type: 'string', description: 'W4 — outcomes in 1-2 sentences: what does their business look like after this?' },
      w5_investment:{ type: 'string', description: 'W5 — investment framing in 1-2 sentences: what does it replace, prevent, or enable?' },
      roi_angle: {
        type: 'string',
        description: 'The strongest ROI angle for this customer — productivity, security risk, compliance, or cost savings? One sentence.'
      },
      service_widget_html: {
        type: 'string',
        description: 'A self-contained HTML widget describing the recommended service stack for this engagement in buyer language. No product names or brand names — describe what each service DOES for the business. Use simple inline styles. 3-5 service categories. Each with a short headline and 1-2 sentence description of the business outcome it delivers. Format as a clean, professional widget that could appear in a sales proposal.'
      }
    },
    required: ['coaching_insight', 'engagement_type', 'solution_bullets', 'hardware_needed', 'w1_situation', 'w2_urgency', 'w3_trust', 'w4_outcome', 'w5_investment']
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
        description: 'What the rep should emphasise in the meeting — the strongest commercial angle in this spec. 1-2 sentences maximum, punchy and direct.'
      },
      buyer_summary: {
        type: 'string',
        description: 'The technical spec translated into a paragraph of buyer language — what this solution DOES for the business, zero technical jargon'
      },
      w1_situation: { type: 'string', description: 'Situation context implied by this spec' },
      w2_urgency:   { type: 'string', description: 'Urgency angle from this spec — what risk does it address?' },
      w3_trust:     { type: 'string', description: 'Trust/credibility angle for this type of project' },
      w4_outcome:   { type: 'string', description: 'Specific outcomes from this spec in buyer language' },
      w5_investment:{ type: 'string', description: 'Investment framing — what does this replace, prevent, or enable?' },
      scope_notes: {
        type: 'string',
        description: 'Key project scope considerations based on the spec — what the project scope builder should emphasise'
      },
      billing_shape: {
        type: 'string',
        description: 'Brief note on the billing shape — e.g. primarily one-time project, monthly recurring services, or mixed'
      },
      spec_gaps: {
        type: 'array',
        description: 'Items in the spec that are unclear, missing detail, or could not be confidently translated. Each as a short plain-language note. Leave empty if spec is complete.',
        items: { type: 'string' }
      },
      line_items: {
        type: 'array',
        description: 'Every line item from the spec, categorised by type. Include ALL rows — nothing should be omitted.',
        items: {
          type: 'object',
          properties: {
            name:        { type: 'string',  description: 'Product or service name from the spec' },
            mpn:         { type: 'string',  description: 'The product identifier from the spec — this could be a manufacturer part number (e.g. XGS136, USW-48-POE) OR an internal service code (e.g. LABOR-INSTALL-NET, MDR-MONTHLY, NET-MON-MONTHLY). Always populate this from whatever code or identifier appears in the spec — never leave it empty if an identifier exists.' },
            manufacturer:{ type: 'string',  description: 'Manufacturer or vendor name (e.g. Sophos, Ubiquiti, Tripp Lite). For internal services use the vendor column value if present.' },
            quantity:    { type: 'number',  description: 'Quantity from the spec — default to 1 if not specified' },
            unit:        { type: 'string',  description: 'Billing unit: one-time, monthly, hourly, or annual' },
            type:        {
              type: 'string',
              enum: ['hardware', 'service', 'labor', 'software', 'unknown'],
              description: 'hardware = physical product with MPN (firewall, switch, laptop, cable); service = recurring managed service (MDR, monitoring, NOC); labor = professional services / installation hours; software = license or subscription without hardware; unknown = cannot determine'
            },
            description: { type: 'string',  description: 'Brief plain-language description of what this item is' }
          },
          required: ['name', 'quantity', 'unit', 'type']
        }
      }
    },
    required: ['coaching_insight', 'buyer_summary', 'w1_situation', 'w2_urgency', 'w3_trust', 'w4_outcome', 'w5_investment']
  }
};


// ── Quick Quote tool schema ───────────────────────────────
const QUICK_QUOTE_TOOL = {
  name: 'submit_quick_quote',
  description: 'Submit a plain-English cover note for a simple product quote',
  input_schema: {
    type: 'object',
    properties: {
      cover_note: {
        type: 'string',
        description: 'One short paragraph (3-5 sentences). Acknowledge what the customer asked for, confirm what is being quoted, and close with one sentence on the value or outcome — e.g. equipping a new team member, standardising the office setup. No bullet points, no jargon. Warm and professional.'
      },
      unmatched_items: {
        type: 'array',
        description: 'Items clearly requested but not found in catalog. Plain language descriptions.',
        items: { type: 'string' }
      }
    },
    required: ['cover_note']
  }
};


// ── Suggest products tool schema (web search fallback) ────
const SUGGEST_PRODUCTS_TOOL = {
  name: 'suggest_products',
  description: 'Suggest real commercial products with MPNs when none are found in the local catalog',
  input_schema: {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        description: '2-3 real products that match the request, found via web search',
        items: {
          type: 'object',
          properties: {
            name:         { type: 'string', description: 'Full commercial product name' },
            manufacturer: { type: 'string', description: 'Manufacturer / brand name' },
            mpn:          { type: 'string', description: 'Manufacturer Part Number — must be accurate' },
            approx_price: { type: 'number', description: 'Approximate retail price as a single number in USD — no currency symbol, no range. e.g. 29.99' },
            description:  { type: 'string', description: 'One sentence: what it is and why it fits the request' }
          },
          required: ['name', 'manufacturer', 'mpn', 'description']
        },
        minItems: 1,
        maxItems: 3
      },
      not_found_reason: {
        type: 'string',
        description: 'Brief note if the exact product genuinely cannot be identified — leave empty if suggestions were found'
      }
    },
    required: ['suggestions']
  }
};


// ── Find missing items tool schema ───────────────────────
const FIND_MISSING_TOOL = {
  name: 'report_missing_items',
  description: 'Report which parts of the customer request were not covered by catalog matches',
  input_schema: {
    type: 'object',
    properties: {
      missing_items: {
        type: 'array',
        description: 'Specific product requests not covered by the catalog matches — each as a clear search phrase',
        items: { type: 'string' }
      },
      all_covered: {
        type: 'boolean',
        description: 'True if all requested items were found in the catalog matches'
      }
    },
    required: ['missing_items', 'all_covered']
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
          model: 'claude-haiku-4-5-20251001',
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
      // Surface stop_reason so client can detect truncation
      return ok({ recommendation: tool.input, stop_reason: data.stop_reason });
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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2500,
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

  // ── ACTION: quick-quote ──────────────────────────────────
  if (action === 'quick-quote') {
    const { request } = body;
    if (!request) return err('Product request required.', 400);

    const userMsg = `A customer has made the following product request:

"${request}"

Write a short, professional cover note for the quote.`;

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: 'You are a professional MSP sales assistant. Write clear, warm, concise cover notes for product quotes. Plain business English only — no technical jargon, no bullet points, one paragraph. 3-5 sentences maximum.',
          tools: [QUICK_QUOTE_TOOL],
          tool_choice: { type: 'tool', name: 'submit_quick_quote' },
          messages: [{ role: 'user', content: userMsg }]
        })
      });
      const data = await res.json();
      const tool = Array.isArray(data.content) ? data.content.find(b => b.type === 'tool_use') : null;
      if (!tool) return err('No cover note returned.');
      return ok({ cover_note: tool.input.cover_note, unmatched_items: tool.input.unmatched_items || [] });
    } catch (e) { return err(e.message); }
  }

  // ── ACTION: quick-quote-standalone ─────────────────────
  // Single Haiku call with web search — identifies product types
  // and finds 2 business-grade options per item in one pass.
  // Uses a tool to return structured results — no sequential calls.
  if (action === 'quick-quote-standalone') {
    const { request } = body;
    if (!request) return err('Product request required.', 400);

    const QQ_TOOL = {
      name: 'submit_quick_quote',
      description: 'Submit product suggestions grouped by item type',
      input_schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'One entry per distinct product type requested',
            items: {
              type: 'object',
              properties: {
                requestedItem: { type: 'string', description: 'The product type e.g. "27-inch monitor"' },
                suggestions: {
                  type: 'array',
                  maxItems: 2,
                  items: {
                    type: 'object',
                    properties: {
                      name:         { type: 'string' },
                      description:  { type: 'string', description: 'One sentence, plain language, key specs' },
                      manufacturer: { type: 'string' },
                      mpn:          { type: 'string' },
                      approx_price: { type: 'number', description: 'USD price as number' }
                    },
                    required: ['name', 'manufacturer', 'mpn']
                  }
                }
              },
              required: ['requestedItem', 'suggestions']
            }
          },
          cover_note: { type: 'string', description: 'Brief 2-sentence professional cover note for this quote' }
        },
        required: ['items', 'cover_note']
      }
    };

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          tools: [
            { type: 'web_search_20250305', name: 'web_search' },
            QQ_TOOL
          ],
          tool_choice: { type: 'auto' },
          system: 'You are a product research assistant for a Managed Service Provider (MSP). The user will describe products they need to quote for a customer. Your job: 1) Identify each distinct product type in the request. 2) Search for exactly 2 real business-grade products per type from CDW, Insight, Connection, Provantage, or manufacturer sites — never Amazon, Best Buy, or Walmart. 3) Return accurate MPNs. 4) Treat each product type as completely separate — never combine features from different products. 5) Write a brief professional cover note. Use the submit_quick_quote tool to return your results.',
          messages: [{ role: 'user', content: 'Find business-grade product options for this customer request: ' + request }]
        })
      });

      const data = await res.json();
      const tool = Array.isArray(data.content)
        ? data.content.find(b => b.type === 'tool_use' && b.name === 'submit_quick_quote')
        : null;

      if (!tool) return err('No results returned — try rephrasing your request.');

      return ok({
        items:      tool.input.items      || [],
        cover_note: tool.input.cover_note || ''
      });

    } catch(e) { return err(e.message); }
  }


  // ── ACTION: suggest-products ─────────────────────────────
  // Fires when Quick Quote finds zero catalog matches.
  // Uses web search to find real products with MPNs so the
  // rep can import them from the Salesbuildr marketplace.
  if (action === 'suggest-products') {
    const { request } = body;
    if (!request) return err('Product request required.', 400);

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          tools: [
            { type: 'web_search_20250305', name: 'web_search' },
            SUGGEST_PRODUCTS_TOOL
          ],
          tool_choice: { type: 'auto' },
          system: 'You are a product research assistant for an MSP (IT services company). Find real, currently available business-grade products with accurate MPNs. Search business IT reseller sites such as CDW, Insight, Connection, Provantage, PC Connection, or direct manufacturer sites. Avoid consumer retail sites like Amazon, Best Buy, Walmart, or Newegg. Prioritise products that MSPs and IT resellers commonly stock. Use the suggest_products tool.',
          messages: [{
            role: 'user',
            content: `Find 2-3 real products matching this request: "${request}". Search the web and return accurate MPNs using the suggest_products tool.`
          }]
        })
      });

      const data = await res.json();
      // Surface Anthropic API errors clearly
      if (!res.ok || data.type === 'error') {
        return err(`Anthropic error: ${data?.error?.message || data?.type || res.status}`);
      }
      const tool = Array.isArray(data.content)
        ? data.content.find(b => b.type === 'tool_use' && b.name === 'suggest_products')
        : null;

      if (!tool) {
        // Log what we got for debugging
        const textBlock = data.content?.find(b => b.type === 'text');
        return err(`No suggestions returned. Stop reason: ${data.stop_reason}. Text: ${textBlock?.text?.slice(0,100) || 'none'}`);
      }
      return ok({
        suggestions:      tool.input.suggestions || [],
        not_found_reason: tool.input.not_found_reason || ''
      });
    } catch (e) { return err(e.message); }
  }

    // ── ACTION: find-missing ─────────────────────────────────
  // Given a customer request and the catalog products that matched,
  // asks Haiku to identify what parts of the request weren't covered.
  // Used to trigger web search for the unmatched portion only.
  if (action === 'find-missing') {
    const { request, matchedNames } = body;
    if (!request) return err('Request required.', 400);

    const matchedList = Array.isArray(matchedNames) && matchedNames.length > 0
      ? matchedNames.map((n, i) => `${i+1}. ${n}`).join('\n')
      : 'None';

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          tools: [FIND_MISSING_TOOL],
          tool_choice: { type: 'tool', name: 'report_missing_items' },
          system: 'You are a product matching assistant. Determine if the catalog matches fully cover the customer request.',
          messages: [{
            role: 'user',
            content: `Customer request: "${request}"

Products found in catalog:
${matchedList}

Do the catalog matches cover everything the customer asked for? If not, what specific items are still missing? Use the report_missing_items tool.`
          }]
        })
      });
      const data = await res.json();
      const tool = Array.isArray(data.content) ? data.content.find(b => b.type === 'tool_use') : null;
      if (!tool) return ok({ missing_items: [], all_covered: true });
      return ok({ missing_items: tool.input.missing_items || [], all_covered: tool.input.all_covered ?? true });
    } catch (e) { return err(e.message); }
  }

    // ── ACTION: match-to-engagement ──────────────────────────
  // Takes the MSP's catalog services and an engagement type,
  // uses Haiku to semantically match the most relevant items.
  // Returns ranked matches — works with any MSP catalog, no labels needed.
  if (action === 'match-to-engagement') {
    const { services, engagementType, staffCount } = body;
    if (!Array.isArray(services) || services.length === 0) return err('services required.', 400);
    if (!engagementType) return err('engagementType required.', 400);

    // Build a compact catalog list for Haiku — id|||name|||type|||unit
    const catalogList = services
      .slice(0, 150) // cap at 150 to keep prompt tight
      .map(s => `${s.id}|||${s.name}|||${s.type}|||${s.unit}`)
      .join('\n');

    const engagementDescriptions = {
      managed_services:      'fully managed IT services — helpdesk, monitoring, endpoint protection, backup',
      network_upgrade:       'network infrastructure upgrade — firewall, switching, wireless, monitoring',
      endpoint_refresh:      'endpoint/device refresh — laptops, desktops, endpoint protection, patch management',
      server_eol:            'server end of life — server replacement or migration, backup, monitoring',
      security_project:      'security project — EDR, email security, DNS filtering, backup, MDR',
      compliance:            'compliance project — HIPAA, NIST, cyber insurance controls, security monitoring',
      new_client_onboarding: 'new client onboarding — full managed services stack, helpdesk, security, backup',
      project_plus_managed:  'project plus managed services — hardware project with ongoing managed services',
      voip_project:          'VoIP or phone system upgrade — hosted VoIP, UCaaS, Teams Voice, monitoring',
      backup_dr:             'backup and disaster recovery — cloud backup, DR planning, recovery testing',
      copilot_ai:            'Microsoft Copilot and AI readiness — M365 Copilot licensing, governance, training',
      mixed:                 'general IT services — managed support, security, backup',
    };

    const engDesc = engagementDescriptions[engagementType] || 'managed IT services';
    const qty = staffCount || 1;

    const prompt = `You are matching an MSP's service catalog to a customer engagement type.

ENGAGEMENT: ${engDesc}
STAFF COUNT: ${qty}

CATALOG (id|||name|||type|||unit):
${catalogList}

Select the most relevant catalog items for this engagement. Return ONLY a JSON object with two arrays:
- "recommended": array of catalog IDs that are core to this engagement (pre-select these)
- "optional": array of catalog IDs that are useful add-ons for this engagement

Rules:
- Include 3-8 items in recommended, 0-4 in optional
- Prefer recurring/monthly services over one-time items
- Prefer bundles that cover multiple services
- Do not include items clearly unrelated to the engagement
- Return only IDs that appear in the catalog above
- No markdown, no explanation, just the JSON object`;

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();
      const text = (data?.content?.[0]?.text || '{}').replace(/```json?|```/g, '').trim();
      const objMatch = text.match(/\{[\s\S]*?\}/);
      const result = objMatch ? JSON.parse(objMatch[0]) : { recommended: [], optional: [] };

      return ok({
        recommended: Array.isArray(result.recommended) ? result.recommended : [],
        optional:    Array.isArray(result.optional)    ? result.optional    : [],
      });
    } catch(e) {
      return err(e.message || 'Matching failed');
    }
  }

    return err('Unknown action.', 400);
};
