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
    id:     w.id,
    name:   w.name,
    type:   inferType(w.widget),
    labels: w.entityLabels || [],
    // Send a shallow config snapshot — enough for semantic comparison without huge tokens
    configKeys: w.widget ? Object.keys(w.widget) : []
  }));

  const systemPrompt = `You are a widget library analyst for an MSP quoting tool called Salesbuildr. Your job is to analyse a list of widget templates and identify duplicates, near-duplicates, and candidates for cleanup.

You will receive a JSON array of widget summaries. Each has: id, name, type, labels, configKeys.

Classify each widget into one of three groups:

1. "safe" — High-confidence candidates for deletion:
   - Name contains words like: test, temp, copy, draft, old, backup, v2, v3, v4, final, new, (1), (2), duplicate, unused, delete, remove, demo, sample, example, placeholder
   - Exact or near-exact duplicate names (e.g. "Product Table" and "Product table" and "Product Table ")
   - Widgets with generic placeholder-style names

2. "review" — Widgets that may overlap in purpose with others:
   - Widgets of the same type with similar names or purposes (e.g. "Standard Items", "Default Product List", "Items Widget")
   - Pairs or groups where multiple widgets seem to serve the same function
   - Widgets with very similar configKeys suggesting near-identical structure

3. "ok" — Unique, clearly distinct widgets with no obvious overlap

For every widget in "safe" and "review", include a short "reason" string (max 12 words) explaining why it was flagged. Be specific — reference the name, the duplicate, or the pattern.

Return ONLY a valid JSON object in this exact shape, nothing else:
{
  "safe":   [ { "id": "...", "reason": "..." }, ... ],
  "review": [ { "id": "...", "reason": "..." }, ... ],
  "ok":     [ { "id": "..." }, ... ]
}

Every widget ID from the input must appear in exactly one group. Do not omit any IDs.`;

  const userMessage = `Analyse these ${summary.length} widget templates:\n\n${JSON.stringify(summary, null, 2)}`;

  let claudeRes;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userMessage }]
      })
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Claude API unreachable: ' + err.message }) };
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text().catch(() => '');
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: `Claude API error ${claudeRes.status}: ${errText.slice(0, 200)}` }) };
  }

  let claudeData;
  try { claudeData = await claudeRes.json(); }
  catch { return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Invalid JSON from Claude.' }) }; }

  const rawText = claudeData.content?.[0]?.text || '';

  // Parse Claude's JSON response
  let classification;
  try {
    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    classification = JSON.parse(cleaned);
  } catch {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Could not parse Claude response as JSON.', raw: rawText.slice(0, 500) }) };
  }

  // Build a lookup map from the classification
  const reasonMap = {};
  (classification.safe   || []).forEach(item => { reasonMap[item.id] = { group: 'safe',   reason: item.reason || '' }; });
  (classification.review || []).forEach(item => { reasonMap[item.id] = { group: 'review', reason: item.reason || '' }; });
  (classification.ok     || []).forEach(item => { reasonMap[item.id] = { group: 'ok',     reason: '' }; });

  // Assemble full widget objects with reasons
  const groups = { safe: [], review: [], ok: [] };

  widgets.forEach(w => {
    const entry = reasonMap[w.id] || { group: 'ok', reason: '' };
    groups[entry.group].push({ ...w, reason: entry.reason });
  });

  // Any widget not classified by Claude (shouldn't happen) → ok
  // Already handled by defaulting to 'ok' above

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, groups })
  };
};

function inferType(widgetObj) {
  if (!widgetObj) return 'unknown';
  if (widgetObj.type) return widgetObj.type;
  if (widgetObj.items    !== undefined) return 'items';
  if (widgetObj.html     !== undefined) return 'html-content';
  if (widgetObj.content  !== undefined) return 'content';
  if (widgetObj.mediaUrl !== undefined) return 'single-media';
  if (widgetObj.imageUrl !== undefined) return 'image';
  if (widgetObj.fields   !== undefined) return 'form';
  return 'widget';
}
