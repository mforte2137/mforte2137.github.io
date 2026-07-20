// =========================================================
// netlify/functions/new-business-kit.js
// Path: /api/new-business-kit
//
// Accepts POST { path, company, industry, size, contact, role,
//                trigger, triggerDetail, engagementNotes, mspName,
//                includeFirstImpression }
//   engagementNotes: { pills: string[], text: string }
//
// One function, three prompts, distinguished by `path`:
//   'cold'    -> plain text email + PDF leave-behind content
//   'warm'    -> HTML follow-up email content + optional First Impression widget content
//   'quoting' -> proposal opener pack (welcome letter, problem, why it matters, solution
//                approach) + proposal plan (3-5 recommended hub tools, sequenced)
//
// Widgets that get pushed to Salesbuildr (First Impression, Proposal Opener Pack) use
// literal Salesbuildr merge tags (e.g. {{contact.firstName}}, {{company.name}},
// {{servicingBranch.name}}, {{creator.*}}) inserted by the frontend HTML builders —
// the AI never sees or generates these, it only writes body prose.
// =========================================================

const TRIGGER_TEXT = {
  referral: 'a mutual contact referred them',
  event: 'they attended an event the MSP was also at',
  news: 'the rep saw something specific about their business (news, LinkedIn, a job posting)',
  proactive: 'the MSP is proactively reaching out because this industry is a specialty',
  renewal: "their IT contract is likely coming up for renewal",
  incident: 'there has been a recent cybersecurity incident in their sector',
  inbound: 'they reached out to the MSP first (inbound)',
  reactivation: 'the MSP has worked with them before and this is a reactivation',
  general: 'there is no specific trigger — this is general outreach'
};

const TOOL_LIST = [
  'IT Maturity Assessment Widget',
  'Industry Proposal Pack',
  'Cyber Insurance Readiness Widget',
  'Service Tier Widget Builder',
  'Multi-Stakeholder Pack',
  'Case Study Widget',
  'Compliance Sales Pack'
];

function formatEngagementNotes(engagementNotes) {
  const pills = (engagementNotes && engagementNotes.pills) || [];
  const text = (engagementNotes && engagementNotes.text) || '';
  if (!pills.length && !text.trim()) return null;
  const lines = [];
  if (pills.length) lines.push('Signals the rep tapped in: ' + pills.join('; '));
  if (text.trim()) lines.push('Specific notes from the rep: "' + text.trim() + '"');
  return lines.join('\n');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Safety net: if the model writes the literal company/contact name despite instructions,
// swap it back to the live merge tag so a pushed widget never displays stale text.
function sanitizeMergeTags(pack, company, contact) {
  if (!pack) return pack;
  const companyName = (company || '').trim();
  const contactFirst = (contact || '').trim().split(/\s+/)[0] || '';
  const out = {};
  for (const key of Object.keys(pack)) {
    let text = pack[key];
    if (typeof text === 'string') {
      if (companyName) text = text.replace(new RegExp(escapeRegex(companyName), 'gi'), '{{company.name}}');
      if (contactFirst) text = text.replace(new RegExp('\\b' + escapeRegex(contactFirst) + '\\b', 'g'), '{{contact.firstName}}');
    }
    out[key] = text;
  }
  return out;
}

// Reverse direction — for content that stays inside the app (never pushed to Salesbuildr,
// e.g. the proposalPlan "why" lines), swap any merge-tag literal the model wrote back to
// the real value so the rep never sees raw {{...}} text in the tool's own UI.
function unsanitizeMergeTags(text, company, contact, mspName) {
  if (typeof text !== 'string') return text;
  const companyName = (company || '').trim() || 'this prospect';
  const contactFirst = (contact || '').trim().split(/\s+/)[0] || 'the contact';
  return text
    .replace(/\{\{\s*company\.name\s*\}\}/gi, companyName)
    .replace(/\{\{\s*contact\.firstName\s*\}\}/gi, contactFirst)
    .replace(/\{\{\s*servicingBranch\.name\s*\}\}/gi, mspName || 'your MSP');
}

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

  const {
    path, company, industry, size, contact, role,
    trigger, triggerDetail, engagementNotes, mspName, includeFirstImpression
  } = body;

  if (!path || !['cold', 'warm', 'quoting'].includes(path)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'A valid path (cold, warm, quoting) is required.' }) };
  }
  if (!industry || !size) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Industry and company size are required.' }) };
  }

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  const triggerContext = TRIGGER_TEXT[trigger] || 'no specific trigger was given';
  const engagementSummary = formatEngagementNotes(engagementNotes);

  const contextBlock = `
Company: ${company || '(not provided)'}
Industry: ${industry}
Company size: ${size} employees
Contact: ${contact || '(not provided)'}${role ? `, role: ${role}` : ''}
Trigger context: ${triggerContext}${triggerDetail ? ` — specific detail: "${triggerDetail}"` : ''}
Your company (the MSP sending this outreach — NOT the prospect's current provider): ${mspName || 'Your MSP'}
`.trim();

  // Shared by Warm and Quoting — both need the actual conversation content, not just
  // industry+size, to avoid producing generic output that just repeats the cold email.
  const engagementContextBlock = `
Company: ${company || '(not provided)'}
Industry: ${industry}
Company size: ${size} employees
Contact: ${contact || '(not provided)'}${role ? `, role: ${role}` : ''}
How this relationship originally started (background only — do not lead with this, it was likely already referenced in an earlier email): ${triggerContext}${triggerDetail ? ` — "${triggerDetail}"` : ''}
What's actually known about this engagement from conversations so far (THIS is the main source of content — do not fall back on generic industry language if this is present):
${engagementSummary || '(not provided — keep content short and clearly templated/placeholder so the rep knows to fill in specifics before sending)'}
Your company (the MSP sending this — NOT the prospect's current or former provider, even if the notes above mention "another MSP" or "current MSP"): ${mspName || 'Your MSP'}
`.trim();

  let systemPrompt, userMessage;

  if (path === 'cold') {
    systemPrompt = `You write cold B2B outreach for MSPs (managed service providers) reaching out to prospective clients.
Industry knowledge must be genuine — healthcare gets HIPAA and patient data language, legal gets client privilege, finance gets regulatory language, etc.
Company size calibrates everything — a 10-person firm and a 200-person firm in the same industry have different problems.
The trigger is the most important personalisation signal — use it specifically, not generically.
Tone: peer-to-peer, confident, brief — not salesy, not desperate.
Never mention specific product names or vendors. Never invent statistics — use known benchmarks (IBM Cost of a Data Breach, Kaseya MSP statistics) or write qualitatively.
If the trigger detail names a specific competing MSP or provider (e.g. a reactivation trigger mentioning who they switched to), use that only for context — refer to them generically ("your previous provider," "your current IT provider") in the email itself, never by name.
Return JSON only — no preamble, no markdown, no backticks. Match this exact shape:
{
  "email": { "subject": "short, specific, references trigger or industry — never 'Managed IT Services for X'", "body": "5-7 sentences max, plain text, no bullet points, no bold. Opening references the trigger specifically. Middle: one specific relevant problem for that industry/size. One credibility sentence. One low-friction ask (20-minute call). Signature placeholder: '\\n\\n[Your name]\\n[Title]\\n' + mspName + '\\n[Phone]'." },
  "leaveBehind": {
    "risks": ["3 genuine, current IT risks for this industry — not generic 'cybersecurity is important'"],
    "benchmark": "1-2 sentences: what a well-run business this size actually has in place, specific enough to be useful",
    "questions": ["3 questions a business owner probably can't answer about their own IT — create awareness of gaps without being threatening"]
  }
}`;
    userMessage = `Write the cold outreach email and leave-behind content for this prospect:\n\n${contextBlock}`;

  } else if (path === 'warm') {
    systemPrompt = `You write warm B2B follow-up communications for MSPs after a first meeting or conversation with a prospect.
CRITICAL: This prospect has already received a cold outreach message that referenced the industry generically and the original reason for contact. This follow-up must NOT repeat that framing — it must sound like it comes from an actual conversation that happened, using specific details the rep captured about that conversation (company size, current tools, concerns raised, what the prospect said mattered to them). If those details are thin or absent, keep the summary bullets short and clearly templated/placeholder so the rep knows to edit them — never fall back on generic industry-risk language, since that would just repeat the cold email in nicer formatting.
CRITICAL — do not confuse entities: "Your company" in the context below is the MSP sending this email (the sender). If the engagement notes mention the prospect currently has "another MSP," "an internal IT person," "no dedicated MSP," or similar, that refers to a separate, unnamed third party or their own staff — NEVER state or imply the prospect is currently a customer of, or working with, "your company." Your company is reaching OUT to them; it is not their existing provider.
CRITICAL — never name a competitor: if the rep's notes mention a specific competing provider by name (e.g. "currently with ACME MSP"), use that only to understand the situation — refer to them generically in the output ("your current IT provider," "your existing provider"), never by name. Naming a competitor in outward-facing copy reads as unprofessional and risks disparagement — always genericize.
The original outreach trigger (referral, event, etc.) is background only — mention it briefly if at all (e.g. "great meeting you at X"), never as the substance of the email.
Industry knowledge must be genuine and specific to size and sector, but should feel like it's drawing on what was actually said, not a generic industry primer.
Tone: warm, professional, confident.
Next step must be concrete with a timeframe — never vague "let me know if you have questions."
Never mention specific product names or vendors. Never invent statistics.
Return JSON only — no preamble, no markdown, no backticks. Match this exact shape:
{
  "followUpEmail": {
    "subject": "short, references the meeting or a specific point discussed — not a repeat of the cold email subject",
    "opening": "1 sentence referencing something specific from the actual conversation notes provided, not 'it was great meeting you'",
    "summaryBullets": ["2-3 short bullets — what the MSP heard/understood about their situation, drawn from the conversation notes provided, not generic industry language"],
    "recommendation": "1-2 sentences, one clear next step recommended and why it fits what was specifically discussed — not a list of services, not a repeat of the cold email's problem framing",
    "nextStep": "1 concrete sentence with a timeframe, e.g. 'I'll send a proposal by Friday' or a specific day/time for a call"
  }${includeFirstImpression ? `,
  "firstImpressionWidget": {
    "whyIndustry": "1-2 sentences on why the MSP works well with this industry specifically. This is pushed to Salesbuildr as a widget — if you refer to the prospect's company by name, write the literal placeholder {{company.name}} instead of the actual name, and never address the contact by first name.",
    "engagementExpectations": "1-2 sentences on what the prospect can expect in the first 30/60/90 days. Same rule: use {{company.name}} instead of the actual company name if referring to them; no first-name address.",
    "credibilityStatement": "1 sentence, a specific credibility statement relevant to that industry. Same rule: use {{company.name}} instead of the actual company name if referring to them; no first-name address."
  }` : ''}
}`;
    userMessage = `Write the warm follow-up email content${includeFirstImpression ? ' and First Impression widget content' : ''} for this prospect:\n\n${engagementContextBlock}`;

  } else {
    systemPrompt = `You write two things for MSPs (managed service providers) preparing a Salesbuildr proposal for a prospect: (1) a short "proposal opener pack" of narrative content that sits at the front of the proposal, ahead of the specs and pricing the MSP's design desk will add separately, and (2) an advisory plan recommending which other hub tools to use.

=== PART 1: PROPOSAL OPENER PACK ===
Write plain body prose only for each of 4 pieces — NO greeting/salutation, NO signature block, NO headers — those are added separately by the app using live merge tags. If a piece needs more than one paragraph, separate paragraphs with a blank line.

CRITICAL CONSTRAINTS for all 4 pieces:
- This is general sales narrative, NOT a parts/services list. Never name specific products, vendors, SKUs, license names, or brands. Never invent or imply specific pricing, quantities, or contract terms — those are added downstream from the MSP's own catalog.
- Do not confuse entities: "Your company" in the context below is the MSP writing this proposal (the sender). If the engagement notes mention the prospect currently has "another MSP," "an internal IT person," "no dedicated MSP," or similar, that refers to a separate, unnamed third party or their own staff — NEVER state or imply the prospect is currently a customer of "your company." This proposal is being written TO win their business, not describing an existing relationship.
- Never name a competitor: if the rep's notes mention a specific competing provider by name (e.g. "currently with ACME MSP"), use that only to understand the situation — refer to them generically ("your current IT provider," "your existing provider"), never by name. Always genericize.
- Draw primarily from "what's actually known about this engagement" in the context below (the tapped signals and any specific notes) — not just industry+size generically. If little is known, keep content directionally useful but avoid inventing specifics that weren't given.
- Tone: peer-to-peer consultative — confident and warm, like a trusted advisor, not corporate or salesy.
- Vertical fluency should show through one specific, genuine detail about the industry — not a vague "we understand your industry" claim.
- Never invent statistics.
- MERGE TAGS — IMPORTANT: whenever you refer to the prospect's company by name, write the literal placeholder text {{company.name}} — do NOT write the actual company name. Never address the contact by their first name anywhere in the body (the app already inserts "Dear {{contact.firstName}}," as a separate salutation line before welcomeLetter's body, so opening with their name again would be redundant) — use "you" / "your team" / "your practice" instead of a name. Do not write {{contact.firstName}} anywhere except naturally as flowing prose would use "you."

The 4 pieces:
1. welcomeLetter — A short, warm note (2-3 short paragraphs). Reinforce that being proactive/careful about this decision puts them ahead of peers in their industry who only address IT reactively — this should feel like validation of a smart decision, not a defensive purchase. Reference the engagement specifics naturally. End by briefly framing that what follows is built around their specific situation, not a generic package.
2. problemStatement — "We understand the problem" (1-2 short paragraphs). Articulate the core problem this prospect faces, grounded in what's known about the engagement plus genuine industry/size-specific risk — specific enough to feel like it was written for them, not a generic industry primer.
3. whyItMatters — "Why it's important" (1-2 short paragraphs). The business stakes and consequences of not addressing the problem — what's at risk (compliance, reputation, continuity, growth, cost) specific to this industry and size.
4. solutionApproach — "What our solution is" (1-2 short paragraphs). The DIRECTION and APPROACH the MSP recommends (e.g. phased rollout, right-sized for their size, addressing their top priorities first) — never specific services, products, or line items, since those come from the MSP's own catalog in the sections that follow.

=== PART 2: PROPOSAL PLAN ===
IMPORTANT: this part is displayed only inside the MSP's own tool as advisory text for the rep to read — it is never pushed to Salesbuildr. Do NOT use merge tag placeholders like {{company.name}} here; write the actual company name (or "this prospect" / "they" if no name was given) and refer to the contact normally if needed. The merge-tag rule from Part 1 does not apply here.
Recommend 3-5 hub tools MAXIMUM, chosen only from this exact list (use these exact strings for "tool"): ${TOOL_LIST.join(', ')}.
Sequence matters: diagnostic tools first, value tools second, differentiation tools third.
Rules to follow, using the engagement signals as your primary evidence:
- Budget-conscious or price-sensitive signals: lead with IT Maturity Assessment Widget (value/risk before price).
- Multiple stakeholders involved: always include Multi-Stakeholder Pack.
- A compliance-related concern was raised, or the industry has strong compliance needs (healthcare, finance, legal): always include Cyber Insurance Readiness Widget or Compliance Sales Pack.
- No dedicated MSP today, or this is a new relationship with no prior work together: always include Case Study Widget for credibility.
- Comparing more than one provider, or tiered options would help avoid single-price anchoring: include Service Tier Widget Builder.
- Include Industry Proposal Pack when it fits the sector.
Each recommendation needs a one-line "why this, why now" tied to the specific prospect context — advisory, confident tone.

Return JSON only — no preamble, no markdown, no backticks. Match this exact shape:
{
  "proposalPack": {
    "welcomeLetter": "2-3 short paragraphs, separated by blank lines if more than one",
    "problemStatement": "1-2 short paragraphs",
    "whyItMatters": "1-2 short paragraphs",
    "solutionApproach": "1-2 short paragraphs"
  },
  "proposalPlan": [
    { "tool": "exact tool name from the list", "why": "one line, specific to this prospect's context" }
  ]
}`;
    userMessage = `Write the proposal opener pack and recommend a sequenced proposal plan (3-5 tools) for this prospect:\n\n${engagementContextBlock}`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: path === 'quoting' ? 2200 : 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: (data && data.error && data.error.message) || 'AI request failed.' }) };
    }

    const text = data.content && data.content[0] && data.content[0].text;
    if (!text) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'AI returned an empty response.' }) };
    }

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    if (path === 'quoting' && parsed.proposalPack) {
      parsed.proposalPack = sanitizeMergeTags(parsed.proposalPack, company, contact);
    }
    if (path === 'quoting' && Array.isArray(parsed.proposalPlan)) {
      parsed.proposalPlan = parsed.proposalPlan.map(item => ({
        ...item,
        why: unsanitizeMergeTags(item.why, company, contact, mspName)
      }));
    }
    if (path === 'warm' && parsed.firstImpressionWidget) {
      parsed.firstImpressionWidget = sanitizeMergeTags(parsed.firstImpressionWidget, company, contact);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, ...parsed })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected server error.' }) };
  }
};
