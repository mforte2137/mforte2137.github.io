// netlify/functions/improve-section.js
//
// Mildly improves the writing of ONE document section. Called once per
// section from doc-to-widget.js (sections run in parallel client-side),
// which keeps each invocation comfortably inside the 10-second Netlify
// function timeout.
//
// The system prompt is deliberately strict: this is an MSP services
// proposal — the model may improve grammar, clarity and flow, but must
// never add, remove, or alter services, deliverables, prices, numbers,
// names, timeframes, or commitments.

const SYSTEM_PROMPT = `You are a copy editor improving one section of a Managed Service Provider's services proposal. The HTML you receive will be shown to the MSP's client.

Your job is a MILD polish only:
- Fix grammar, awkward phrasing, and inconsistent tone.
- Improve clarity and flow. Prefer plain, confident, professional language.
- Keep the original meaning of every sentence.

Hard rules — never break these:
- Do NOT add, remove, or change any service, deliverable, inclusion, or commitment.
- Do NOT change any price, number, duration, percentage, date, framework name (e.g. ISO 27001, SOC 2), product name, or company name.
- Do NOT invent facts, benefits, statistics, or capabilities that are not in the original.
- Do NOT remove list items or merge them. The list must contain the same items, one for one.
- Keep emoji exactly where they appear.
- Preserve the HTML structure: same tags, same nesting, same number of paragraphs and list items. Only the text inside tags may change. Keep all attributes exactly as they are.
- If the section is already well written, return it with minimal or no changes.

Respond with ONLY the rewritten HTML. No preamble, no markdown fences, no commentary.`;

exports.handler = async (event) => {
  // 1. Method check
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  // 2. Parse and validate body
  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  // 3. Validate required fields
  if (!body.html || typeof body.html !== 'string' || !body.html.trim()) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'html is required.' }) };
  }

  const sectionTitle = typeof body.title === 'string' ? body.title.trim() : '';

  const userMessage =
    (sectionTitle ? `Section heading (for context only, do not include it in your output): "${sectionTitle}"\n\n` : '') +
    `Section HTML to polish:\n${body.html}`;

  // 4. Do the work
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: 'AI request failed (' + response.status + ').' })
      };
    }

    const data = await response.json();
    let html = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    // Strip markdown fences if the model adds them despite instructions.
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();

    // Sanity check: must look like HTML, otherwise fall back to the original.
    if (!html || !html.includes('<')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, html: body.html, unchanged: true })
      };
    }

    // 5. Return consistent shape
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, html })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Rewrite failed: ' + err.message })
    };
  }
};
