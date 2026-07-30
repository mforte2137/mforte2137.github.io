exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  // 4. Validate required fields
  const introNotes = (body.introNotes || '').trim();
  const tipNotes = (body.tipNotes || '').trim();
  if (!introNotes && !tipNotes) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'introNotes or tipNotes is required.' }) };
  }
  const lastEmailBody = (body.lastEmailBody || '').trim();
  const lastEmailDate = (body.lastEmailDate || '').trim();

  // 5. Do the work — call Anthropic API
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'No Anthropic API key configured.' }) };
  }

  const systemPrompt = `You write short, informal "just checking in" emails from an MSP account manager to busy IT service provider contacts (their own customers/partners). These recipients are extremely busy — the email must be brief, warm, low-pressure, and genuinely useful, never salesy or corporate.

Rules:
- Tone: informal, friendly, human. Like a quick note from someone who knows them, not a marketing email.
- Length: short. 100-160 words total for the body.
- Structure: a brief warm check-in opener, then one clear tip/feature/value item, then a low-key closing line (no hard sell, no "let's schedule a call" pressure — just an easy open door).
- No corporate buzzwords, no exclamation-point overload, no "I hope this email finds you well."
- Do not repeat the substance of the last email sent to this group if one is provided — say something new.
- Return ONLY valid JSON, no markdown, no backticks, no preamble, in exactly this shape:
{"subject": "short subject line", "body": "full email body as plain text with line breaks as \\n"}`;

  let userMessage = `Intro / check-in notes from the sender:\n${introNotes || '(none given — just a general friendly check-in)'}\n\nTip or feature to highlight:\n${tipNotes || '(none given)'}`;
  if (lastEmailBody) {
    userMessage += `\n\nFor reference, here is the email sent to this same group last time (sent ${lastEmailDate}) — do NOT repeat this content, cover something new:\n${lastEmailBody}`;
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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: (data && data.error && data.error.message) || 'Anthropic API error.' }) };
    }

    const text = data.content && data.content[0] && data.content[0].text;
    if (!text) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'No content returned from AI.' }) };
    }

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON.' }) };
    }

    // 6. Return consistent shape
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, subject: parsed.subject || '', body: parsed.body || '' })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
