/* =====================================================
   netlify/functions/case-study-widget.js
   Generates case study text via Claude Haiku.
   ===================================================== */

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // 1. CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 2. Method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  // 3. Parse body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
  }

  // 4. Validate required fields
  const required = ['industry', 'companySize', 'challenge', 'solution', 'outcome', 'engagementType'];
  for (const field of required) {
    if (!body[field] || !body[field].trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: `Missing required field: ${field}` }),
      };
    }
  }

  if (!body.anonymise && !body.companyName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'companyName is required when anonymise is false.' }),
    };
  }

  // 5. Build prompts
  const systemPrompt = `You are a professional copywriter specialising in B2B IT managed services. Your job is to write compelling, concise case study copy for MSP (Managed Service Provider) proposals.

WRITING RULES:
- Tone: confident, professional, and credible — not salesy, not technical jargon
- The challenge section must make the reader feel the pain, not just describe it
- The solution section must focus on outcomes and approach — no feature lists, no product names
- The outcome section must be specific — if metrics are provided, lead with them
- The headline must be punchy and outcome-focused — never generic like "Case Study: Acme Corp"
- Keep each section concise — this is a proposal widget, not a whitepaper
- When anonymising, build the descriptor naturally into the narrative so it reads as a real story, not a redacted document
- Write from the client's perspective — make their pain real, then show the transformation

OUTPUT FORMAT:
Return a valid JSON object only. No preamble, no explanation, no markdown, no backticks. The JSON must have exactly these keys:
{
  "client": "descriptor or real name",
  "headline": "outcome-focused headline",
  "challenge": "challenge paragraph",
  "solution": "solution paragraph",
  "outcome": "outcome paragraph with metrics prominent",
  "quote": "testimonial quote text, or empty string if no quote",
  "engagement": "engagement type label"
}`;

  const clientDescriptor = body.anonymise
    ? buildDescriptor(body)
    : body.companyName;

  const userMessage = `Generate a case study widget for an MSP proposal using these details:

CLIENT: ${clientDescriptor}
INDUSTRY: ${body.industry}
COMPANY SIZE: ${body.companySize}
LOCATION: ${body.location || 'not specified'}
ENGAGEMENT TYPE: ${body.engagementType}

THE CHALLENGE (raw notes):
${body.challenge}

WHAT WE DID (raw notes):
${body.solution}

THE OUTCOME (raw notes):
${body.outcome}

${body.clientQuote ? `CLIENT QUOTE:\n"${body.clientQuote}"` : 'CLIENT QUOTE: none provided — return an empty string for the quote field.'}

ANONYMISE: ${body.anonymise ? 'Yes — use the client descriptor naturally throughout, never use a company name.' : 'No — use the real company name: ' + body.companyName}

Write the case study sections. Return JSON only.`;

  // 6. Call Claude
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'API key not configured.' }),
    };
  }

  let aiText;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok || !aiData.content || !aiData.content[0]) {
      throw new Error(aiData.error?.message || 'Claude returned an unexpected response.');
    }

    aiText = aiData.content[0].text;
  } catch (e) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI call failed: ' + e.message }),
    };
  }

  // 7. Parse AI JSON
  let caseStudy;
  try {
    const clean = aiText.replace(/```json|```/g, '').trim();
    caseStudy = JSON.parse(clean);
  } catch {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Please try again.' }),
    };
  }

  // 8. Validate expected keys
  const expectedKeys = ['client', 'headline', 'challenge', 'solution', 'outcome', 'quote', 'engagement'];
  for (const key of expectedKeys) {
    if (typeof caseStudy[key] === 'undefined') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ ok: false, error: `AI response missing key: ${key}` }),
      };
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, caseStudy }),
  };
};

// Build a natural anonymised descriptor from form inputs
function buildDescriptor(body) {
  const parts = [];

  if (body.companySize) parts.push(body.companySize);

  if (body.industry) parts.push(body.industry.toLowerCase() + ' firm');

  if (body.location) parts.push('in ' + body.location);

  const descriptor = parts.length > 0
    ? 'a ' + parts.join(' ')
    : 'a mid-sized professional services firm';

  return descriptor;
}
