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

  const mode = body.mode === 'report' ? 'report' : 'email';

  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'No Anthropic API key configured.' }) };
  }

  let systemPrompt, userMessage;

  if (mode === 'email') {
    // 4. Validate required fields
    const introNotes = (body.introNotes || '').trim();
    const tipNotes = (body.tipNotes || '').trim();
    if (!introNotes && !tipNotes) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'introNotes or tipNotes is required.' }) };
    }
    const lastEmailBody = (body.lastEmailBody || '').trim();
    const lastEmailDate = (body.lastEmailDate || '').trim();

    systemPrompt = `You write short "just checking in" emails from an MSP account manager to busy IT service provider contacts (their own customers/partners). These recipients are extremely busy — the email must be brief, warm, low-pressure, and genuinely useful.

Tone — informal but professional, not slangy:
- Warm and conversational, like a trusted colleague — but this is still a business email to a customer, not a text to a friend.
- Do NOT use "Hey" as an opener. Use a plain, professional greeting instead (e.g. "Hi [Name]," or just open with the first line — no name token needed, a generic greeting is fine since this goes to a group).
- Do NOT use exaggerated slang or hype phrases — no "stupid easy," "crazy simple," "super quick," "awesome," or similar. Describe things plainly and factually instead (e.g. "it only takes a couple of clicks" rather than "it's stupid easy").
- No corporate buzzwords either. Avoid both extremes — neither stiff/corporate nor overly casual/slangy. Aim for the tone of a competent professional writing a quick, friendly note.
- No exclamation-point overload, no "I hope this email finds you well."

Structure:
- Length: short, 100-160 words total for the body.
- A brief warm check-in opener, then one clear tip/feature/value item, then a low-key closing line (no hard sell, no "let's schedule a call" pressure — just an easy open door).
- Do not repeat the substance of the last email sent to this group if one is provided — say something new.

Subject line:
- The subject must accurately reflect what the sender actually wrote in their notes below — do not invent a different framing or angle than what's in the notes. If the notes are an open-ended offer to help (e.g. "let me know if you have any questions"), the subject should reflect that framing (e.g. "Questions about [topic]" or "Here to help with [topic]") — not a different implied intent (e.g. do not write "Questions for [topic]" if the sender was offering to answer questions, not asking them).
- Keep it short and plain, no clickbait, no exclamation points.

Return ONLY valid JSON, no markdown, no backticks, no preamble, in exactly this shape:
{"subject": "short subject line", "body": "full email body as plain text with line breaks as \\n"}`;

    userMessage = `Intro / check-in notes from the sender:\n${introNotes || '(none given — just a general friendly check-in)'}\n\nTip or feature to highlight:\n${tipNotes || '(none given)'}`;
    if (lastEmailBody) {
      userMessage += `\n\nFor reference, here is the email sent to this same group last time (sent ${lastEmailDate}) — do NOT repeat this content, cover something new:\n${lastEmailBody}`;
    }
  } else {
    // mode === 'report'
    const companyName = (body.companyName || '').trim();
    const notes = Array.isArray(body.notes) ? body.notes : [];
    const todayDate = (body.todayDate || '').trim() || new Date().toISOString().slice(0, 10);
    if (!companyName || !notes.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'companyName and at least one note are required.' }) };
    }

    systemPrompt = `You help an MSP account manager quickly recall their history with a client company, so they can brief an internal sales colleague in a few sentences — the kind of thing said out loud in a hallway, not a formal report.

Today's date is ${todayDate}. Each note below has its own date, which may be in the past (something that already happened) or in the future (something scheduled/planned but not yet happened). This distinction matters a lot:
- For notes dated on or before today: describe them as things that already happened, in past tense (e.g. "emailed them on August 10", "Mary replied and set up a meeting").
- For notes dated after today: describe them as upcoming/scheduled, not completed (e.g. "has a meeting scheduled for August 5 to discuss...", "is planning to follow up next month about..."). Never say a future-dated event "happened" or use past tense for it.
- Compare every note's date against today's date (${todayDate}) individually before deciding tense — do not assume chronological note order means everything is in the past.

Rules:
- Length: 3-5 sentences, plain English, no headers or bullet points.
- Cover, in a natural narrative: what's happened so far (past tense, only for past-dated notes), current sentiment/status, any scheduled meeting or follow-up (future tense, clearly marked as upcoming), and the clear next step if one exists.
- Tone: plain, factual, conversational — like briefing a colleague, not writing marketing copy.
- Use the actual dates and contact names given where relevant, but keep it tight.
- Return ONLY valid JSON, no markdown, no backticks, no preamble, in exactly this shape:
{"report": "the narrative summary as plain text"}`;

    const notesList = notes.map(n => {
      const parts = [n.date];
      if (n.contactName) parts.push(n.contactName);
      parts.push(n.body);
      if (n.meetingLink) parts.push('(meeting link on file)');
      if (n.followUpDate) parts.push('(follow-up set for ' + n.followUpDate + ')');
      return '- ' + parts.filter(Boolean).join(' — ');
    }).join('\n');

    userMessage = `Today's date: ${todayDate}\nCompany: ${companyName}\n\nChronological notes (check each date against today's date before writing):\n${notesList}`;
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
    if (mode === 'email') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, subject: parsed.subject || '', body: parsed.body || '' })
      };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, report: parsed.report || '' })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: err.message || 'Unexpected error.' }) };
  }
};
