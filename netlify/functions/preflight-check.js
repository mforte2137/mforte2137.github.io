// =========================================================
// preflight-check.js — Netlify function
// Path: /api/preflight-check
//
// Accepts POST { action, quoteId, apiKey, integrationKey, quoteText }
//
// action: 'structural' — fetches quote + runs logic checks (no Claude, instant)
// action: 'content'   — sends quote data + extracted text to Claude for deep review
//
// Structural checks use pure JS logic — fast, cheap, exact.
// Content review uses Claude Sonnet for language analysis.
// =========================================================

const SB_BASE      = 'https://portal.us1-salesbuildr.com/public-api';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

// ── Structural check — pure logic, no AI ─────────────────
function runStructuralCheck(quote) {
  const critical = [];
  const warnings = [];
  const passed   = [];

  const items = quote.items || [];

  for (const item of items) {
    const name = item.name || `Unnamed item (${item.id})`;

    // Markup
    if (item.markup === 0 || item.markup === null || item.markup === undefined) {
      critical.push({ item: name, issue: 'No markup set — this item will generate no margin', fix: 'Set a markup percentage for this item in Salesbuildr' });
    } else {
      passed.push(`${name} — markup ${item.markup}%`);
    }

    // Sell price vs cost
    if (item.cost > 0 && item.price <= item.cost) {
      critical.push({ item: name, issue: `Sell price (${item.price}) is at or below cost (${item.cost})`, fix: 'Increase the sell price or check the cost is correct' });
    }

    // Zero quantity
    if (item.quantity === 0) {
      critical.push({ item: name, issue: 'Quantity is zero', fix: 'Set the correct quantity or remove this item' });
    }

    // Term (flag items with no term — likely managed services)
    if (!item.term || item.term.trim() === '') {
      warnings.push({ item: name, issue: 'No service term set', fix: 'Add a term (e.g. 12 months, month-to-month) — especially important for recurring services' });
    }

    // Setup cost with zero setup price
    if (item.setupCost > 0 && (item.setupPrice === 0 || !item.setupPrice)) {
      warnings.push({ item: name, issue: `Setup cost is set (${item.setupCost}) but setup price is 0 — you are absorbing setup cost with no charge`, fix: 'Add a setup price or confirm this is intentional' });
    }

    // High discount
    if (item.discount > 20) {
      warnings.push({ item: name, issue: `Discount is ${item.discount}% — unusually high`, fix: 'Confirm this discount level is intentional and approved' });
    }

    // Missing description
    if (!item.shortDescription || item.shortDescription.trim() === '') {
      warnings.push({ item: name, issue: 'No description — buyers may not understand what this item is', fix: 'Add a short, buyer-facing description' });
    }
  }

  // Quote-level checks
  if (!quote.contractStartDate) {
    warnings.push({ item: 'Quote', issue: 'Contract start date not set', fix: 'Add a contract start date' });
  } else {
    passed.push(`Contract start date: ${quote.contractStartDate}`);
  }

  const hasDuration = quote.contractDuration &&
    (typeof quote.contractDuration !== 'object' || Object.keys(quote.contractDuration).length > 0);
  if (!hasDuration) {
    warnings.push({ item: 'Quote', issue: 'Contract duration not set', fix: 'Add a contract duration' });
  } else {
    passed.push('Contract duration is set');
  }

  if (!quote.paymentTerms) {
    warnings.push({ item: 'Quote', issue: 'Payment terms not set', fix: 'Add payment terms so the buyer knows when payment is expected' });
  } else {
    passed.push(`Payment terms: ${quote.paymentTerms}`);
  }

  if (!quote.expiresAt) {
    warnings.push({ item: 'Quote', issue: 'Quote expiry date not set — without one there\'s no urgency to accept', fix: 'Add an expiry date' });
  } else {
    passed.push(`Quote expires: ${new Date(quote.expiresAt).toLocaleDateString()}`);
  }

  if (items.length === 0) {
    critical.push({ item: 'Quote', issue: 'No line items found on this quote', fix: 'Add products or services to the quote' });
  }

  const verdict = critical.length > 0 ? 'not-ready' : warnings.length > 0 ? 'warnings' : 'ready';
  return { critical, warnings, passed, verdict, itemCount: items.length };
}

// ── Content review system prompt ──────────────────────────
const CONTENT_SYSTEM = `You are Preflight, a pre-send quality reviewer for MSP proposals. You have access to both the structured quote data (line items, prices, terms) AND the extracted proposal text. This dual view lets you catch issues nobody else can.

Review the provided content and check for ALL of the following:

1. ALIGNMENT ISSUES — anything promised in the narrative that doesn't match the priced line items. E.g. "24/7 monitoring" in the text but "Business Hours Support" in the pricing. These cause post-sale disputes.

2. JARGON & UNEXPLAINED ACRONYMS — technical terms a non-technical CEO buyer may not understand. Flag: MDR, XDR, SIEM, SOC, RMM, PSA, EDR, BCDR, NOC, and any other IT acronyms used without a plain-English explanation.

3. INSIDE-OUT LANGUAGE — copy that describes what the MSP does rather than what the customer gets. "We provide..." / "We install..." / "Our team will..." — these should be reframed as buyer outcomes.

4. CONFIDENCE ISSUES — wishy-washy phrases that undermine trust. "We will try to...", "approximately...", "we hope to...", "we aim to...", "where possible...". Proposals should make commitments, not wish-lists.

5. PLACEHOLDER TEXT — anything that looks like unfilled template content. TBD, [insert here], XX months, text in brackets, obviously generic placeholder names or dates.

6. SUGGESTED REWRITES — identify the 2–3 sections most in need of improvement and provide a tightened rewrite. Focus on the highest-impact fixes. Keep rewrites concise and buyer-focused.

Be specific — quote the actual text you're flagging. If something is clean, don't invent issues.

Use the submit_content_review tool to return your output.`;

const CONTENT_TOOL = {
  name: 'submit_content_review',
  description: 'Submit the content quality review of the MSP proposal',
  input_schema: {
    type: 'object',
    properties: {
      alignment: {
        type: 'array',
        description: 'Mismatches between what the narrative promises and what is priced',
        items: {
          type: 'object',
          properties: {
            issue:  { type: 'string', description: 'What the mismatch is' },
            detail: { type: 'string', description: 'Specific examples from both the text and the pricing' },
            fix:    { type: 'string', description: 'How to resolve it' }
          },
          required: ['issue', 'detail', 'fix']
        }
      },
      jargon: {
        type: 'array',
        description: 'Technical terms or acronyms used without plain-English explanation',
        items: {
          type: 'object',
          properties: {
            term:       { type: 'string' },
            context:    { type: 'string', description: 'Where it appears' },
            suggestion: { type: 'string', description: 'Plain-English alternative or explanation to add' }
          },
          required: ['term', 'context', 'suggestion']
        }
      },
      language: {
        type: 'array',
        description: 'Language quality issues: inside-out framing, wishy-washy phrases, placeholder text',
        items: {
          type: 'object',
          properties: {
            type:    { type: 'string', enum: ['inside-out', 'wishy-washy', 'placeholder', 'other'] },
            excerpt: { type: 'string', description: 'The actual text that has the issue' },
            fix:     { type: 'string', description: 'How to improve it' }
          },
          required: ['type', 'excerpt', 'fix']
        }
      },
      rewrites: {
        type: 'array',
        description: 'Suggested rewrites for the 2-3 sections most in need of improvement',
        minItems: 0,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            section:   { type: 'string', description: 'Which section or item this rewrite applies to' },
            original:  { type: 'string', description: 'The original text (verbatim, kept short)' },
            suggested: { type: 'string', description: 'The improved version' },
            reason:    { type: 'string', description: 'Why this version is stronger' }
          },
          required: ['section', 'original', 'suggested', 'reason']
        }
      },
      overall: {
        type: 'string',
        description: 'One sentence overall assessment of content quality'
      }
    },
    required: ['alignment', 'jargon', 'language', 'rewrites', 'overall']
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

  const { action, quoteId, apiKey, integrationKey, quoteText } = body;

  if (!apiKey || !integrationKey) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Salesbuildr API credentials required.' }) };
  }
  if (!quoteId) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Quote ID required.' }) };
  }

  const sbHeaders = { 'Content-Type': 'application/json', 'api-key': apiKey, 'integration-key': integrationKey };

  // ── ACTION: structural ────────────────────────────────────
  if (action === 'structural') {
    try {
      const quoteRes = await fetch(`${SB_BASE}/quote/${quoteId}`, { method: 'GET', headers: sbHeaders });

      if (!quoteRes.ok) {
        const err = await quoteRes.json().catch(() => ({}));
        return {
          statusCode: quoteRes.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: err.message || `Salesbuildr returned ${quoteRes.status}. Check the quote ID and your credentials.` })
        };
      }

      const quote  = await quoteRes.json();
      const review = runStructuralCheck(quote);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, review, quote: { id: quote.id, title: quote.title || quoteId, status: quote.status, company: quote.company?.name || '' } })
      };
    } catch (err) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: err.message }) };
    }
  }

  // ── ACTION: content ───────────────────────────────────────
  if (action === 'content') {
    if (!quoteText || quoteText.length < 100) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Quote text is too short. Make sure the PDF was extracted correctly.' }) };
    }

    // Fetch quote items for alignment checking
    let quoteItems = [];
    try {
      const quoteRes = await fetch(`${SB_BASE}/quote/${quoteId}`, { method: 'GET', headers: sbHeaders });
      if (quoteRes.ok) {
        const quote = await quoteRes.json();
        quoteItems  = quote.items || [];
      }
    } catch (e) { /* proceed without items if fetch fails */ }

    // Build item summary for Claude
    const itemSummary = quoteItems.map(item =>
      `- ${item.name}${item.term ? ` (${item.term})` : ''}${item.shortDescription ? `: ${item.shortDescription}` : ''}`
    ).join('\n') || 'No items available';

    const userMessage = `Review this MSP proposal for content quality issues.

=== PRICED LINE ITEMS ===
${itemSummary}

=== PROPOSAL TEXT (extracted from PDF) ===
${quoteText.slice(0, 4000)}
${quoteText.length > 4000 ? '\n[Text truncated — first 4,000 characters shown]' : ''}

Check for all issues described in your instructions: alignment between the text and pricing, jargon, inside-out language, wishy-washy phrases, and placeholder text. Provide rewrites for the 2-3 most impactful improvements.`;

    try {
      const aiRes = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model:       'claude-haiku-4-5-20251001',
          max_tokens:  2000,
          system:      CONTENT_SYSTEM,
          tools:       [CONTENT_TOOL],
          tool_choice: { type: 'tool', name: 'submit_content_review' },
          messages:    [{ role: 'user', content: userMessage }]
        })
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        return { statusCode: aiRes.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: `AI review failed: ${err.slice(0, 200)}` }) };
      }

      const aiData    = await aiRes.json();
      const toolBlock = Array.isArray(aiData.content) ? aiData.content.find(b => b.type === 'tool_use') : null;

      if (!toolBlock) {
        return { statusCode: 502, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'AI did not return a review.' }) };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, review: toolBlock.input })
      };
    } catch (err) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: err.message }) };
    }
  }

  return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Unknown action. Use "structural" or "content".' }) };
};
