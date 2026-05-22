// netlify/functions/scope-ai.js
// AI assistant for Project Scope Builder
// Powers both "generate scope from description" and "review existing scope"
// Model: claude-haiku-4-5-20251001

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST required' }) };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { mode, message, currentScope } = JSON.parse(event.body || '{}');
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error('API key not configured');

    let systemPrompt = '';
    let userPrompt   = '';

    if (mode === 'generate') {
      systemPrompt = `You are an expert MSP (Managed Service Provider) project scoping assistant. 
Your job is to generate detailed project scopes for IT projects based on a plain English description.

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "projectTitle": "string",
  "overview": "string (2-3 sentences, customer-facing)",
  "exclusions": "string (newline-separated list)",
  "tasks": [
    { "task": "string", "role": "string", "hours": "number as string", "notes": "string" }
  ],
  "message": "string (brief summary of what you created and any key assumptions)"
}

Role values must be one of: PM, Senior Engineer, Engineer, Technician, Account Manager — or combinations like "PM / Senior Engineer".
Hours should be realistic for an MSP engagement.
Generate 10-16 tasks covering the full project lifecycle.`;
      userPrompt = message;
    } else if (mode === 'review') {
      systemPrompt = `You are an expert MSP project scoping assistant reviewing an existing project scope.
Provide clear, actionable feedback. Be specific — name the tasks you're commenting on.

You must respond ONLY with valid JSON in this exact format, no preamble or markdown:
{
  "feedback": [
    { "type": "warning|suggestion|ok", "text": "string" }
  ],
  "summary": "string (2-3 sentence overall assessment)",
  "suggestedTasks": [
    { "task": "string", "role": "string", "hours": "string", "notes": "string" }
  ]
}

suggestedTasks should only include NEW tasks you recommend adding, not existing ones.
Keep feedback items concise — max 15 words each.`;
      userPrompt = `Please review this project scope:\n\nProject: ${currentScope?.projectTitle || 'Untitled'}\nCustomer: ${currentScope?.customerName || 'Not specified'}\nHours/day: ${currentScope?.hoursPerDay || 8}\n\nOverview: ${currentScope?.overview || 'None'}\n\nTasks:\n${(currentScope?.tasks || []).map(t => `- ${t.task} (${t.role}, ${t.hours}h): ${t.notes}`).join('\n')}\n\nExclusions:\n${currentScope?.exclusions || 'None'}\n\nUser message: ${message}`;
    } else if (mode === 'chat') {
      systemPrompt = `You are a helpful MSP project scoping assistant. Answer questions about project scoping, effort estimation, and IT project management concisely. Keep responses under 150 words.`;
      userPrompt = message;
      // For chat mode return plain text response
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      return { statusCode: 200, headers, body: JSON.stringify({ text }) };
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      })
    });

    const data = await res.json();
    const raw  = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    console.error('scope-ai error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
