// netlify/functions/analyse-widgets.js
// Receives a slim widget summary (built client-side), asks Claude to classify
// POST body: { summary: [{ id, name, type, keys }] }

const MAX_BATCH = 60;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { summary } = body;
  if (!summary || !Array.isArray(summary)) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'summary array is required.' }) };
  }

  console.log(`Widget analysis: ${summary.length} widgets, payload ${JSON.stringify(summary).length} bytes`);

  // Batch into chunks of MAX_BATCH to stay well under Claude context limits
  const batches = [];
  for (let i = 0; i < summary.length; i += MAX_BATCH) {
    batches.push(summary.slice(i, i + MAX_BATCH));
  }

  console.log(`Processing ${batches.length} batch(es)`);

  const safeIds   = {};
  const reviewIds = {};
  const okIds     = {};

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length}: ${batch.length} widgets`);

    const result = await classifyBatch(batch);
    if (!result.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: result.error }) };
    }

    const { classification } = result;
    (classification.safe   || []).forEach(item => { safeIds[item.id]   = item.reason || ''; });
    (classification.review || []).forEach(item => { reviewIds[item.id] = item.reason || ''; });
    (classification.ok     || []).forEach(item => { okIds[item.id]     = true; });
  }

  const groups = {
    safe:   Object.entries(safeIds).map(([id, reason]) => ({ id, reason })),
    review: Object.entries(reviewIds).map(([id, reason]) => ({ id, reason })),
    ok:     Object.keys(okIds).map(id => ({ id }))
  };

  // Any IDs not classified fall to ok
  summary.forEach(w => {
    if (!safeIds[w.id] && !reviewIds[w.id] && !okIds[w.id]) {
      groups.ok.push({ id: w.id });
    }
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, groups })
  };
};

async function classifyBatch(batch) {
  const systemPrompt = `You are a widget library analyst for an MSP quoting tool called Salesbuildr. Classify widget templates to help users clean up duplicates.

Each widget has: id, name, type, keys (config property names).

Classify every widget into exactly one group:

1. "safe" — strong delete candidates:
   - Name contains any of: test, temp, copy, draft, old, backup, v2, v3, v4, final, new, (1), (2), duplicate, unused, delete, remove, demo, sample, example, placeholder
   - Exact or near-exact duplicate names (ignore case/whitespace)

2. "review" — possible functional overlaps:
   - Same type AND similar name/purpose to another widget in this list
   - Nearly identical keys arrays

3. "ok" — unique and distinct

Every input ID must appear in exactly one group.

Reason field rules (required for safe and review, max 12 words):
- ALWAYS reference widgets by their NAME, never by ID
- Keyword match: write  →  Name contains 'test'  (use the actual word found, lowercase)
- Exact duplicate: write  →  Duplicate of "[other widget name]"
- Version: write  →  Versioned copy of "[base widget name]"
- Overlap: write  →  Similar purpose to "[other widget name]"

Output raw JSON only — no markdown, no explanation.`;

  const userMessage = `Classify these ${batch.length} widgets:\n${JSON.stringify(batch)}`;

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
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
          { role: 'assistant', content: '{"safe":[' }
        ]
      })
    });
  } catch (err) {
    return { ok: false, error: 'Claude API unreachable: ' + err.message };
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`Claude ${res.status}:`, errText.slice(0, 300));
    return { ok: false, error: `Claude API error ${res.status}: ${errText.slice(0, 200)}` };
  }

  let claudeData;
  try { claudeData = await res.json(); }
  catch { return { ok: false, error: 'Could not parse Claude API response.' }; }

  // We prefilled '{"safe":[' so prepend it back
  const rawText = '{"safe":[' + (claudeData.content?.[0]?.text || '');
  console.log(`Claude response preview: ${rawText.slice(0, 200)}`);

  let classification;
  try {
    classification = JSON.parse(extractJSON(rawText));
  } catch (err) {
    console.error('JSON parse error:', err.message, '| raw:', rawText.slice(0, 500));
    return { ok: false, error: 'Could not parse Claude response: ' + err.message };
  }

  return { ok: true, classification };
}

// Extract outermost balanced { ... } block
function extractJSON(str) {
  const s = str.replace(/```json|```/g, '').trim();
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response');

  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc)               { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"')         { inStr = !inStr; continue; }
    if (inStr)             continue;
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
  }
  throw new Error('Unbalanced braces — response may be truncated');
}
