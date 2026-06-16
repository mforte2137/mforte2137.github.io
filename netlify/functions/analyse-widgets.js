// netlify/functions/analyse-widgets.js
// Receives the full widget list, asks Claude to group into safe/review/ok
// POST body: { widgets: [...] }

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { widgets } = body;
  if (!widgets || !Array.isArray(widgets)) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'widgets array is required.' }) };
  }

  // Build a compact summary for Claude — id, name, type (inferred), and a shallow config snapshot
  const summary = widgets.map(w => ({
    id:         w.id,
    name:       w.name,
    type:       inferType(w.widget),
    labels:     w.entityLabels || [],
    configKeys: w.widget ? Object.keys(w.widget) : []
  }));

  const systemPrompt = `You are a widget library analyst for an MSP quoting tool called Salesbuildr. Analyse a list of widget templates and identify duplicates, near-duplicates, and candidates for cleanup.

Each widget summary has: id, name, type, labels, configKeys.

Classify every widget into exactly one of three groups:

1. "safe" — High-confidence candidates for deletion:
   - Name contains: test, temp, copy, draft, old, backup, v2, v3, v4, final, new, (1), (2), duplicate, unused, delete, remove, demo, sample, example, placeholder
   - Exact or near-exact duplicate names (case/spacing variations)
   - Generic placeholder-style names

2. "review" — May overlap in purpose with another widget:
   - Same type with similar names (e.g. "Standard Items" and "Default Product List")
   - Very similar configKeys suggesting near-identical structure
   - Pairs or groups that seem to serve the same function

3. "ok" — Unique, clearly distinct, no overlap

Rules:
- Every input ID must appear in exactly one group — no omissions, no duplicates
- For "safe" and "review" items include a "reason" string of max 12 words
- Respond with ONLY the JSON object — no explanation, no markdown, no preamble`;

  const userMessage = `Classify these ${summary.length} widgets:\n\n${JSON.stringify(summary)}`;

  let claudeRes;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system:     systemPrompt,
        messages: [
          { role: 'user',      content: userMessage },
          { role: 'assistant', content: '{' }   // prefill forces JSON-only response
        ]
      })
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Claude API unreachable: ' + err.message }) };
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text().catch(() => '');
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: `Claude API error ${claudeRes.status}: ${errText.slice(0, 300)}` }) };
  }

  let claudeData;
  try { claudeData = await claudeRes.json(); }
  catch { return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Invalid JSON from Claude API.' }) }; }

  // Reconstruct full response — we prefilled '{' so prepend it back
  const rawText = '{' + (claudeData.content?.[0]?.text || '');

  // Robust JSON extraction — find the outermost { ... } block
  let classification;
  try {
    const extracted = extractJSON(rawText);
    classification = JSON.parse(extracted);
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({
        ok:    false,
        error: 'Could not parse Claude response as JSON: ' + err.message,
        raw:   rawText.slice(0, 800)
      })
    };
  }

  // Validate expected shape
  if (!classification.safe && !classification.review && !classification.ok) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Claude response missing expected groups.', raw: rawText.slice(0, 400) }) };
  }

  // Build lookup map
  const reasonMap = {};
  (classification.safe   || []).forEach(item => { reasonMap[item.id] = { group: 'safe',   reason: item.reason || '' }; });
  (classification.review || []).forEach(item => { reasonMap[item.id] = { group: 'review', reason: item.reason || '' }; });
  (classification.ok     || []).forEach(item => { reasonMap[item.id] = { group: 'ok',     reason: '' }; });

  // Assemble full widget objects — anything unclassified falls to 'ok'
  const groups = { safe: [], review: [], ok: [] };
  widgets.forEach(w => {
    const entry = reasonMap[w.id] || { group: 'ok', reason: '' };
    groups[entry.group].push({ ...w, reason: entry.reason });
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, groups })
  };
};

// Extract the outermost JSON object from a string that may have surrounding text
function extractJSON(str) {
  // Strip markdown fences first
  const stripped = str.replace(/```json|```/g, '').trim();

  // Find the first { and match to its closing }
  const start = stripped.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return stripped.slice(start, i + 1);
    }
  }
  // If we never closed, try parsing what we have (truncation recovery)
  throw new Error('Unbalanced JSON braces — response may have been truncated');
}

function inferType(widgetObj) {
  if (!widgetObj) return 'unknown';
  if (widgetObj.type)                      return widgetObj.type;
  if (widgetObj.items    !== undefined)    return 'items';
  if (widgetObj.html     !== undefined)    return 'html-content';
  if (widgetObj.content  !== undefined)    return 'content';
  if (widgetObj.mediaUrl !== undefined)    return 'single-media';
  if (widgetObj.imageUrl !== undefined)    return 'image';
  if (widgetObj.fields   !== undefined)    return 'form';
  return 'widget';
}
