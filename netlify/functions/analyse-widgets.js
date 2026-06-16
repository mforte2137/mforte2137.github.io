// netlify/functions/analyse-widgets.js
// Receives widget list, asks Claude to classify into safe/review/ok
// POST body: { widgets: [...] }

const MAX_BATCH = 60; // Claude Haiku safe limit per call

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

  // Strip to absolute minimum — only what Claude needs for classification
  // Truncate name to 80 chars in case of pathological data
  const summary = widgets.map(w => ({
    id:   w.id,
    name: (w.name || '').slice(0, 80),
    type: inferType(w.widget),
    keys: w.widget ? Object.keys(w.widget).slice(0, 10) : []
  }));

  // Log payload size to Netlify function logs for debugging
  const payloadSize = JSON.stringify(summary).length;
  console.log(`Widget analysis: ${summary.length} widgets, summary payload ${payloadSize} bytes`);

  // Batch if large — keeps each Claude call well under context limits
  const batches = [];
  for (let i = 0; i < summary.length; i += MAX_BATCH) {
    batches.push(summary.slice(i, i + MAX_BATCH));
  }

  console.log(`Processing ${batches.length} batch(es)`);

  const reasonMap = {};

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const batchPayload = JSON.stringify(batch);
    console.log(`Batch ${b + 1}/${batches.length}: ${batch.length} widgets, ${batchPayload.length} bytes`);

    const result = await classifyBatch(batch);
    if (!result.ok) return { statusCode: 502, body: JSON.stringify(result) };

    const { classification } = result;
    (classification.safe   || []).forEach(item => { reasonMap[item.id] = { group: 'safe',   reason: item.reason || '' }; });
    (classification.review || []).forEach(item => { reasonMap[item.id] = { group: 'review', reason: item.reason || '' }; });
    (classification.ok     || []).forEach(item => { reasonMap[item.id] = { group: 'ok',     reason: '' }; });
  }

  // Assemble full widget objects — anything unclassified → ok
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

async function classifyBatch(batch) {
  const systemPrompt = `You are a widget library analyst for an MSP quoting tool. Classify widget templates into three groups.

Each widget has: id, name, type, keys (config property names).

Groups:
1. "safe" — delete candidates: name contains test/temp/copy/draft/old/backup/v2/v3/final/new/(1)/(2)/duplicate/unused/demo/sample/placeholder, OR exact/near-exact duplicate names
2. "review" — possible overlaps: same type + similar name/purpose to another widget in this list
3. "ok" — unique, clearly distinct

Rules:
- Every input ID must appear in exactly one group
- "safe" and "review" items must have a "reason" field (max 10 words, specific)
- Output ONLY raw JSON, no markdown, no explanation`;

  const userMessage = `Classify these ${batch.length} widgets:\n${JSON.stringify(batch)}`;

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
        max_tokens: 2000,
        system:     systemPrompt,
        messages: [
          { role: 'user',      content: userMessage },
          { role: 'assistant', content: '{"safe":'  }  // prefill — forces clean JSON start
        ]
      })
    });
  } catch (err) {
    return { ok: false, error: 'Claude API unreachable: ' + err.message };
  }

  if (!claudeRes.ok) {
    const errText = await claudeRes.text().catch(() => '');
    console.error(`Claude API ${claudeRes.status}:`, errText.slice(0, 300));
    return { ok: false, error: `Claude API error ${claudeRes.status}: ${errText.slice(0, 200)}` };
  }

  let claudeData;
  try { claudeData = await claudeRes.json(); }
  catch { return { ok: false, error: 'Invalid JSON from Claude API.' }; }

  // Reconstruct — we prefilled '{"safe":' so prepend it back
  const rawText = '{"safe":' + (claudeData.content?.[0]?.text || '');
  console.log(`Claude raw response (first 200): ${rawText.slice(0, 200)}`);

  let classification;
  try {
    classification = JSON.parse(extractJSON(rawText));
  } catch (err) {
    console.error('JSON parse failed:', err.message, '| raw:', rawText.slice(0, 400));
    return { ok: false, error: 'Could not parse Claude response: ' + err.message };
  }

  if (!classification.safe && !classification.review && !classification.ok) {
    return { ok: false, error: 'Claude response missing expected groups.' };
  }

  return { ok: true, classification };
}

// Extract the outermost balanced { ... } from a string
function extractJSON(str) {
  const stripped = str.replace(/```json|```/g, '').trim();
  const start = stripped.indexOf('{');
  if (start === -1) throw new Error('No JSON object found');

  let depth = 0, inString = false, escape = false;
  for (let i = start; i < stripped.length; i++) {
    const ch = stripped[i];
    if (escape)              { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"')          { inString = !inString; continue; }
    if (inString)            continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) return stripped.slice(start, i + 1); }
  }
  throw new Error('Unbalanced braces — response likely truncated');
}

function inferType(widgetObj) {
  if (!widgetObj)                          return 'unknown';
  if (widgetObj.type)                      return widgetObj.type;
  if (widgetObj.items    !== undefined)    return 'items';
  if (widgetObj.html     !== undefined)    return 'html-content';
  if (widgetObj.content  !== undefined)    return 'content';
  if (widgetObj.mediaUrl !== undefined)    return 'single-media';
  if (widgetObj.imageUrl !== undefined)    return 'image';
  if (widgetObj.fields   !== undefined)    return 'form';
  return 'widget';
}
