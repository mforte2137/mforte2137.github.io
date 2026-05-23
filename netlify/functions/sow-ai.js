// netlify/functions/sow-ai.js
// AI assistant for SOW Generator
// Modes: generate, review, improve, convert, chat
// Model: claude-haiku-4-5-20251001
// Prompts tuned for plain business English output — no technical jargon

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST required' }) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    const { mode, message, currentSow, scopeProject } = JSON.parse(event.body || '{}');
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error('API key not configured');

    let systemPrompt = '';
    let userPrompt   = '';
    let maxTokens    = 1500;

    // ── GENERATE mode ────────────────────────────────────────
    if (mode === 'generate') {
      systemPrompt = `You are an expert MSP (Managed Service Provider) proposal writer specialising in plain-language Statements of Work.

Your job is to write all sections of a customer-facing SOW based on a plain English description of the engagement. 

TONE RULES — critical:
- Write for a business decision-maker, not a technical person
- No acronyms without explanation, no jargon
- Confident and reassuring — this is a sales document as much as a project document
- Outcomes, not tasks — "Your team will have X" not "We will configure X"
- Short paragraphs, plain sentences

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "sections": {
    "engagement": "string (2-3 sentences — what's happening and why it matters to the customer's business)",
    "deliverables": "string (newline-separated outcome statements — each on its own line — what the customer ends up with)",
    "howWeWork": "string (communication rhythm, single point of contact, what the MSP needs from the customer)",
    "milestones": ["string", "string", "string", "string"],
    "commitment": "string (what the MSP guarantees — response times, named contact, post-project support window)",
    "nextSteps": "string (clear call to action — how to proceed)"
  },
  "message": "string (1-2 sentences summarising what you generated and any key assumptions)"
}

milestones should be 3-4 short labels only — no dates. Examples: "Kickoff & Planning", "Migration", "Testing", "Go Live".
deliverables should be newline-separated — each line is one outcome statement starting with a result, not an action.`;

      userPrompt = message;
      maxTokens  = 1800;

    // ── REVIEW mode ──────────────────────────────────────────
    } else if (mode === 'review') {
      systemPrompt = `You are an expert MSP proposal reviewer. Your job is to review a Statement of Work and provide clear, actionable feedback.

Focus on:
- Tone: Is it written for a business decision-maker or does it sound too technical?
- Clarity: Would an executive understand every sentence without IT knowledge?
- Confidence: Does the document feel reassuring and professional, or hesitant?
- Completeness: Are any key sections missing or thin?
- Language: Identify any jargon, passive voice, or vague commitments

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "feedback": [
    { "type": "warning|suggestion|ok", "text": "string (max 15 words)" }
  ],
  "summary": "string (2-3 sentences overall assessment)"
}

Keep feedback items concise and specific. Max 6 feedback items total.`;

      userPrompt = `Please review this SOW:

Project: ${currentSow?.projectTitle || 'Untitled'}
Customer: ${currentSow?.customerName || 'Not specified'}

THE ENGAGEMENT:
${currentSow?.engagement || 'Not filled in'}

WHAT WE WILL DELIVER:
${currentSow?.deliverables || 'Not filled in'}

HOW WE WORK TOGETHER:
${currentSow?.howWeWork || 'Not filled in'}

OUR COMMITMENT:
${currentSow?.commitment || 'Not filled in'}

NEXT STEPS:
${currentSow?.nextSteps || 'Not filled in'}

User message: ${message}`;

    // ── IMPROVE mode ─────────────────────────────────────────
    } else if (mode === 'improve') {
      systemPrompt = `You are an expert MSP proposal copywriter. Your job is to rewrite a specific section of a Statement of Work in cleaner, more confident business language.

TONE RULES — critical:
- Written for business decision-makers, not technical staff
- Confident and specific — avoid vague phrases like "we will endeavour to" or "we will try to"
- Outcomes, not process — say what the customer gets or experiences
- Short sentences, active voice
- No IT jargon unless it is unavoidable (and if so, explain it in plain English immediately)

Identify which section the user wants improved based on their message. The sections available are:
- engagement (The Engagement paragraph)
- deliverables (What We Will Deliver bullet list — return as newline-separated outcomes)
- howWeWork (How We Work Together paragraph)
- commitment (Our Commitment paragraph)
- nextSteps (Next Steps / call to action)

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "field": "engagement|deliverables|howWeWork|commitment|nextSteps",
  "improved": "string (the rewritten section)",
  "note": "string (optional — one sentence on what you changed)"
}`;

      userPrompt = `Current SOW sections for context:

Engagement: ${currentSow?.engagement || '(empty)'}
Deliverables: ${currentSow?.deliverables || '(empty)'}
How We Work Together: ${currentSow?.howWeWork || '(empty)'}
Our Commitment: ${currentSow?.commitment || '(empty)'}
Next Steps: ${currentSow?.nextSteps || '(empty)'}

User request: ${message}`;

    // ── CONVERT mode ─────────────────────────────────────────
    } else if (mode === 'convert') {
      systemPrompt = `You are an expert MSP proposal writer. Your job is to convert a technical project scope (a list of tasks with roles and hours) into a customer-facing Statement of Work written in plain business English.

The scope is written for internal use — tasks like "Configure Azure VMs" or "Deploy RMM agent". Your job is to translate these into OUTCOME STATEMENTS that a business decision-maker cares about: "Your team will have a fully configured Azure environment, tested and ready to use."

RULES:
- Translate tasks → outcomes (what the customer ends up with, not what the MSP does)
- No technical jargon in the output
- Confident, specific, reassuring tone
- Group related tasks into single outcomes where appropriate

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "sections": {
    "engagement": "string (2-3 sentences — what this project is and why it matters to the customer)",
    "deliverables": "string (newline-separated outcome statements derived from the scope tasks)",
    "howWeWork": "string (infer communication approach from the project type)",
    "milestones": ["string", "string", "string", "string"],
    "commitment": "string (standard MSP commitment statement appropriate for this project type)",
    "nextSteps": "string (call to action)"
  },
  "message": "string (1-2 sentences confirming what you converted and any notes)"
}`;

      const tasks = (scopeProject?.rows || [])
        .filter(r => Number(r.hours) > 0 && r.task)
        .map(r => `- ${r.task} (${r.role}, ${r.hours}h)${r.notes ? ': ' + r.notes : ''}`)
        .join('\n');

      userPrompt = `Convert this project scope into a SOW:

Project: ${scopeProject?.projectTitle || 'Untitled'}
Customer: ${scopeProject?.customerName || 'Not specified'}

Overview: ${scopeProject?.overview || 'None provided'}

Tasks:
${tasks || 'No tasks found'}

Exclusions: ${scopeProject?.exclusions || 'None'}`;

      maxTokens = 1800;

    // ── CHAT mode ─────────────────────────────────────────────
    } else {
      systemPrompt = `You are a helpful MSP proposal assistant. You help managed service providers write better Statements of Work and customer-facing proposals. Answer questions about proposal writing, SOW best practices, and how to communicate with business decision-makers. Keep responses concise (under 150 words). Write in plain English — no jargon.`;
      userPrompt   = message;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      return { statusCode: 200, headers, body: JSON.stringify({ text }) };
    }

    // ── Call API for JSON modes ───────────────────────────────
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      })
    });

    const data  = await res.json();
    const raw   = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    console.error('sow-ai error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
