// netlify/functions/analyse-widgets.js
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

  const batches = [];
  for (let i = 0; i < summary.length; i += MAX_BATCH) {
    batches.push(summary.slice(i, i + MAX_BATCH));
  }

  console.log(`Processing ${batches.length} batch(es)`);

  // safe: { id → reason }
  // review: { id → { reason, groupId, keepId } }  — groupId links pairs/clusters
  // ok: { id → true }
  const safeMap   = {};
  const reviewMap = {};
  const okMap     = {};

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`Batch ${b + 1}/${batches.length}: ${batch.length} widgets`);

    const result = await classifyBatch(batch);
    if (!result.ok) {
      return { statusCode: 502, body: JSON.stringify({ ok: false, error: result.error }) };
    }

    const { classification } = result;

    (classification.safe || []).forEach(item => {
      safeMap[item.id] = item.reason || '';
    });

    // Review items come back as groups: { groupId, keepId, members: [{id, reason}] }
    (classification.reviewGroups || []).forEach(group => {
      group.members.forEach(member => {
        reviewMap[member.id] = {
          reason:  member.reason || '',
          groupId: group.groupId,
          keepId:  group.keepId || null
        };
      });
    });

    (classification.ok || []).forEach(item => {
      okMap[item.id] = true;
    });
  }

  // Build groups array — review items carry groupId and keepId for client-side pairing
  const groups = {
    safe:   Object.entries(safeMap).map(([id, reason]) => ({ id, reason })),
    review: Object.entries(reviewMap).map(([id, data]) => ({ id, ...data })),
    ok:     Object.keys(okMap).map(id => ({ id }))
  };

  // Unclassified → ok
  summary.forEach(w => {
    if (!safeMap[w.id] && !reviewMap[w.id] && !okMap[w.id]) {
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

Each widget: id, name, type, keys (config property names).

Output a JSON object with three keys: "safe", "reviewGroups", "ok".

── SAFE ──
Array of widgets that are strong delete candidates:
- Name contains: test, temp, copy, draft, old, backup, v2, v3, v4, final, new, (1), (2), duplicate, unused, delete, demo, sample, example, placeholder
- Exact or near-exact duplicate names (ignore case/whitespace)
Format: { "id": "...", "reason": "Name contains 'test'" }

── REVIEW GROUPS ──
Array of GROUPS where widgets overlap in purpose. Each group has:
- "groupId": short slug like "group-1", "group-2"
- "keepId": the ID of the widget the user should probably KEEP (the most complete/canonical name)
- "members": array of ALL widgets in the group including the keep candidate

Rules for groups:
- Only create a group if 2+ widgets genuinely overlap
- keepId must be one of the member IDs — pick the widget with the most descriptive/canonical name
- Each member needs a "reason" that is NOT self-referential:
  - For the keepId member: "Keep — most complete version"
  - For other members: "Possible duplicate of '[keepName]'" or "Narrower version of '[keepName]'"
- NEVER write a reason that references the widget's own name

── OK ──
Array of widgets that are unique and distinct: { "id": "..." }

Every input ID must appear in exactly one place (safe, a reviewGroup member, or ok).
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

  const rawText = '{"safe":[' + (claudeData.content?.[0]?.text || '');
  console.log(`Claude response preview: ${rawText.slice(0, 300)}`);

  let classification;
  try {
    classification = JSON.parse(extractJSON(rawText));
  } catch (err) {
    console.error('JSON parse error:', err.message, '| raw:', rawText.slice(0, 500));
    return { ok: false, error: 'Could not parse Claude response: ' + err.message };
  }

  // Normalise: if Claude returned old-style "review" array instead of "reviewGroups", convert it
  if (!classification.reviewGroups && classification.review) {
    classification.reviewGroups = [];
    (classification.review || []).forEach((item, i) => {
      classification.reviewGroups.push({
        groupId: `group-${i}`,
        keepId:  null,
        members: [{ id: item.id, reason: item.reason || '' }]
      });
    });
    delete classification.review;
  }
  if (!classification.reviewGroups) classification.reviewGroups = [];

  return { ok: true, classification };
}

function extractJSON(str) {
  const s = str.replace(/```json|```/g, '').trim();
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (esc)                { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true;  continue; }
    if (c === '"')          { inStr = !inStr; continue; }
    if (inStr)              continue;
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
  }
  throw new Error('Unbalanced braces — response may be truncated');
}
