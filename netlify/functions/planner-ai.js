// =========================================================
// planner-ai.js — Netlify function
// Path: /api/planner-ai
//
// AI assistant for the Project Planner.
// Same architecture as scope-ai.js with SKU-aware generate mode.
// POST { mode, message, currentScope?, skus? }
// =========================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(mode, skus) {
  const skuList = skus && skus.length > 0
    ? `\n\nThe MSP's labor SKU catalog (use these exact names when suggesting roles):\n${skus.map(s => `- ${s.name}${s.price != null ? ' ($' + Number(s.price).toFixed(2) + '/hr)' : ''}`).join('\n')}`
    : '';

  if (mode === 'generate') {
    return `You are an expert MSP project planner. When given a project description, generate a detailed project task list suitable for a managed service provider delivering IT projects.${skuList}

Return a JSON object with this exact structure:
{
  "projectTitle": "string — concise professional title",
  "overview": "string — 2–3 sentence customer-facing project overview",
  "exclusions": "string — common exclusions, one per line (\\n separated)",
  "message": "string — brief explanation of what you've generated",
  "tasks": [
    {
      "task": "Task name",
      "role": "Role name — MUST match a SKU name from the catalog above if one fits, otherwise use a sensible role like 'Senior Engineer', 'Engineer', 'PM', or 'Technician'",
      "hours": number,
      "notes": "Brief notes about this task"
    }
  ]
}

Rules:
- Generate 10–20 realistic tasks
- Hours should be realistic for an MSP engagement (not too low, not inflated)
- When a SKU catalog is provided, match roles to SKU names exactly (case-sensitive)
- Include a project management task
- Return ONLY valid JSON, no markdown, no commentary`;
  }

  if (mode === 'review') {
    return `You are an expert MSP project planner reviewing a project scope. Analyze the provided scope for completeness, realistic hours, missing tasks, and potential issues.${skuList}

Return a JSON object with this exact structure:
{
  "summary": "string — 1–2 sentence overall assessment",
  "feedback": [
    { "type": "warning|suggestion|ok", "text": "Feedback item" }
  ],
  "suggestedTasks": [
    { "task": "string", "role": "string", "hours": number, "notes": "string" }
  ]
}

Rules:
- type "warning" = something likely missing or problematic
- type "suggestion" = nice-to-have improvement
- type "ok" = something done well
- suggestedTasks = any tasks you recommend adding (can be empty array)
- Return ONLY valid JSON`;
  }

  if (mode === 'adjust') {
    return `You are an expert MSP project planner helping adjust a project scope to fit constraints.${skuList}

Return a JSON object with this exact structure:
{
  "summary": "string — brief assessment",
  "feedback": [
    { "type": "warning|suggestion|ok", "text": "Specific adjustment recommendation" }
  ],
  "suggestedTasks": []
}

Return ONLY valid JSON, no markdown`;
  }

  // Default chat
  return `You are a helpful MSP project planning assistant. Answer questions about project planning, scoping, estimating, and IT project delivery concisely and practically. Keep responses under 200 words.${skuList}

Return a JSON object: { "text": "your response" }`;
}

function buildUserMessage(mode, message, currentScope) {
  if (mode === 'generate') {
    return `Generate a project scope for: ${message}`;
  }
  if (mode === 'review' || mode === 'adjust') {
    const scopeStr = currentScope
      ? `\n\nCurrent scope:\nProject: ${currentScope.projectTitle || '(untitled)'}\nCustomer: ${currentScope.customerName || '—'}\nHours/day: ${currentScope.hoursPerDay || 8}\n\nOverview:\n${currentScope.overview || '(none)'}\n\nTasks:\n${(currentScope.tasks || []).map(t => `- ${t.task} | Role: ${t.role || '—'} | Hours: ${t.hours}`).join('\n')}`
      : '';
    return `${message}${scopeStr}`;
  }
  return message;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON.' })
    };
  }

  const { mode, message, currentScope, skus } = body;

  if (!message || !message.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'message is required.' })
    };
  }

  const systemPrompt  = buildSystemPrompt(mode, mode === 'generate' ? skus : null);
  const userMessage   = buildUserMessage(mode, message, currentScope);

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }]
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: `AI API error ${res.status}: ${errText.slice(0, 200)}` })
      };
    }

    const aiData = await res.json();
    const rawText = aiData.content?.[0]?.text || '';

    // Parse JSON response
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat as plain text chat
      parsed = { text: rawText };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, ...parsed })
    };

  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message || 'AI request failed.' })
    };
  }
};
