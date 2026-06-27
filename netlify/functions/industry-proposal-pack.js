// netlify/functions/industry-proposal-pack.js
// Industry Proposal Pack — AI generation function

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
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
  }

  // 4. Validate
  const { vertical, engagement, mode, mergeTagsAvailable, regenKey } = body;

  if (!vertical) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'vertical is required.' }) };
  }

  // 5. Build prompt
  const isPersonalised = mode === 'personalised';
  const hasEngagement = engagement && engagement.trim().length > 0;

  const systemPrompt = `You are an expert MSP proposal copywriter. You write concise, professional, industry-specific content for managed IT service provider proposals.

Your output must be a JSON object — no preamble, no markdown, no backticks.

Rules:
- Write for a business owner or decision-maker — not a technical audience
- Every widget must be short and scannable — 3 to 5 lines maximum per section, no exceptions. Brevity is critical.
- Industry content must be specific and accurate — use the correct compliance frameworks, terminology, and pain points for that vertical
- Use plain language that feels like it came from someone who understands the industry, not someone selling software
- Tone: confident, professional, empathetic — not salesy or alarmist
- Do not invent compliance regulations — only reference frameworks that genuinely apply to the specified vertical
- For body content, use short paragraphs or bullet list lines starting with "- " for scannable lists
- You may use **bold** to highlight a key term or service name at the start of a bullet line (e.g. "- **Service name** — description"). Do not bold anything else.
- Keep all body content under 100 words per widget${isPersonalised ? `

Merge tags:
- You are in Personalised mode. Weave in {{company.name}}, {{contact.firstName}}, and {{servicingBranch.name}} at natural, conversational points
- Use {{company.name}} in Widget 4 (ourApproach) and Widget 5 (whatsIncluded) openings
- Use {{servicingBranch.name}} when referring to the MSP
- NEVER use merge tags in Widget 1 (painPoints), Widget 2 (whyItMatters), or Widget 3 (compliance) — they would feel out of place there
- Do not force merge tags — only use them where they read naturally` : `

Merge tags: You are in Generic mode. Do not use any merge tags in your output.`}${hasEngagement ? `

Engagement context: "${engagement.trim()}"
- Widget 4 (ourApproach) must reference this engagement directly — describe how the MSP's approach fits this specific scope
- Widget 5 (whatsIncluded) must list services that match this engagement, described in business terms, not technical jargon` : `

No engagement description was provided. Widget 4 should position the MSP as a specialist in this vertical generally. Widget 5 should list a sensible, typical set of services for this vertical, described in business terms.`}

Return exactly this JSON shape:
{
  "painPoints": {
    "headline": "string — a compelling, specific headline for this vertical",
    "body": "string — 3 to 5 bullet lines starting with '- ' describing real IT pain points for this vertical from the buyer's perspective"
  },
  "whyItMatters": {
    "headline": "string",
    "body": "string — 2 to 3 short paragraphs connecting IT reliability and security to business outcomes that matter to this vertical"
  },
  "compliance": {
    "headline": "string",
    "body": "string — 3 to 5 bullet lines starting with '- ' covering the relevant compliance frameworks, regulations, and risk factors for this vertical. Be specific and accurate."
  },
  "ourApproach": {
    "headline": "string",
    "body": "string — 3 to 4 bullet lines starting with '- ' on how the MSP's approach fits this vertical"
  },
  "whatsIncluded": {
    "headline": "string",
    "body": "string — a short list of services using '- ' bullet lines, each described in business value terms, not technical terms"
  }
}`;

  const userMessage = JSON.stringify({
    vertical,
    engagement: engagement || '',
    mode: mode || 'generic',
    mergeTagsAvailable: mergeTagsAvailable || [],
    regenKey: regenKey || null
  });

  // 6. Call Claude
  const claudeApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!claudeApiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'API key not configured.' }) };
  }

  let aiText;
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
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

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error('Anthropic API error:', aiData);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ ok: false, error: 'AI request failed: ' + (aiData.error?.message || aiRes.status) })
      };
    }

    aiText = aiData.content[0].text;
  } catch (err) {
    console.error('Fetch error calling Anthropic:', err);
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'Failed to reach AI service.' }) };
  }

  // 7. Parse JSON
  let widgets;
  try {
    const clean = aiText.replace(/```json|```/g, '').trim();
    widgets = JSON.parse(clean);
  } catch (e) {
    console.error('JSON parse error. Raw AI response:', aiText);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI returned invalid JSON. Try regenerating.' })
    };
  }

  // 8. If regenKey, return only that widget
  if (regenKey && widgets[regenKey]) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, widgets: { [regenKey]: widgets[regenKey] } })
    };
  }

  // 9. Validate all five keys are present
  const requiredKeys = ['painPoints', 'whyItMatters', 'compliance', 'ourApproach', 'whatsIncluded'];
  const missingKeys = requiredKeys.filter(k => !widgets[k]);
  if (missingKeys.length > 0) {
    console.error('Missing widget keys:', missingKeys, 'Raw:', aiText);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'AI response was incomplete. Try regenerating.' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, widgets })
  };
};
