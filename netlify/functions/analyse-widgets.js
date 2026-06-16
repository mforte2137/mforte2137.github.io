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

  // Pre-process: detect shared prefixes (company names, brand names used as namespaces)
  // These appear in many widget names and should NOT be treated as similarity signals
  const strippedSummary = stripCommonPrefixes(summary);

  const batches = [];
  for (let i = 0; i < strippedSummary.length; i += MAX_BATCH) {
    batches.push(strippedSummary.slice(i, i + MAX_BATCH));
  }

  console.log(`Processing ${batches.length} batch(es)`);

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

  const groups = {
    safe:   Object.entries(safeMap).map(([id, reason]) => ({ id, reason })),
    review: Object.entries(reviewMap).map(([id, data]) => ({ id, ...data })),
    ok:     Object.keys(okMap).map(id => ({ id }))
  };

  // Unclassified -> ok
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

// Words that are meaningful cleanup signals — must NEVER be stripped as noise,
// even if they appear in many widget names.
const PROTECTED_SIGNALS = new Set([
  'test', 'temp', 'copy', 'draft', 'old', 'backup',
  'demo', 'sample', 'placeholder', 'unused', 'duplicate',
  'delete', 'remove', 'v2', 'v3', 'v4', 'final', 'new'
]);

// Detect tokens that appear in many widget names (company names, brand prefixes)
// and strip them before sending to Claude so they don't pollute similarity signals.
// We keep the original name in originalName for Claude to use in reason text.
function stripCommonPrefixes(summary) {
  // Tokenise all names into words
  const tokenCount = {};
  summary.forEach(w => {
    const tokens = tokenise(w.name);
    new Set(tokens).forEach(tok => {
      tokenCount[tok] = (tokenCount[tok] || 0) + 1;
    });
  });

  // A token is "noise" if it appears in more than 40% of widgets and in at least 4 widgets
  const threshold = Math.max(4, Math.ceil(summary.length * 0.4));
  const noiseTokens = new Set(
    Object.entries(tokenCount)
      .filter(([tok, count]) => count >= threshold && !PROTECTED_SIGNALS.has(tok))
      .map(([tok]) => tok)
  );

  console.log(`Noise tokens (stripped before analysis): ${[...noiseTokens].join(', ')}`);

  return summary.map(w => {
    const cleaned = tokenise(w.name)
      .filter(tok => !noiseTokens.has(tok))
      .join(' ')
      .trim();

    return {
      ...w,
      originalName: w.name,           // preserved for reason text
      name: cleaned || w.name         // fallback to original if everything stripped
    };
  });
}

function tokenise(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);    // ignore single-char tokens
}

async function classifyBatch(batch) {
  const systemPrompt = `You are a widget library analyst for an MSP quoting tool called Salesbuildr. Help users identify duplicates and redundant widgets so they can clean up their library.

Each widget has: id, name (already cleaned — shared company/brand name prefixes have been removed), originalName (the real display name, use this in all reason text), type, keys (config property names).

Classify every widget into exactly one group. Output a JSON object with keys: "safe", "reviewGroups", "ok".

━━ SAFE ━━
Strong delete candidates. Array of { id, reason }.
Flag if the ORIGINAL name (originalName) contains any of:
  test, temp, copy, draft, old, backup, v2, v3, v4, final, new, (1), (2), duplicate, unused, delete, demo, sample, example, placeholder
OR if two widgets have near-identical originalNames (ignoring case/whitespace).

━━ REVIEW GROUPS ━━
Widgets that are genuinely functionally redundant — they serve the same purpose and an MSP realistically only needs one.
Array of groups: { groupId, keepId, members: [{id, reason}] }

CRITICAL RULES for grouping:
- Base grouping on FUNCTIONAL similarity — what the widget actually does, not superficial name overlap
- The cleaned "name" field has had shared prefixes removed — use it to compare actual function
- A shared word in the cleaned name is meaningful; a shared word only in originalName may just be a brand prefix — ignore it
- Widgets of DIFFERENT types (items vs html-content vs form) almost never serve the same function — do not group across types unless it is extremely obvious
- Do NOT group widgets just because they share a client/company name in their originalName
- Only create a group if you are confident the MSP genuinely only needs one of them
- keepId: pick the widget whose cleaned name (or originalName) is most complete/descriptive
- Member reasons: keeper gets "Keep — most descriptive version"; others get specific reason like "Narrower version of '[originalName]'" or "Near-identical to '[originalName]'"
- NEVER write a reason that references a widget's own originalName

━━ OK ━━
Everything else — unique, distinct, clearly serving a different purpose.
Array of { id }.

Every input ID must appear exactly once across safe, reviewGroup members, and ok.
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

  // Normalise: handle old-style flat review array
  if (!classification.reviewGroups && classification.review) {
    classification.reviewGroups = (classification.review || []).map((item, i) => ({
      groupId: `group-${i}`,
      keepId:  null,
      members: [{ id: item.id, reason: item.reason || '' }]
    }));
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
    if (esc)                 { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true;  continue; }
    if (c === '"')           { inStr = !inStr; continue; }
    if (inStr)               continue;
    if (c === '{') depth++;
    if (c === '}') { depth--; if (depth === 0) return s.slice(start, i + 1); }
  }
  throw new Error('Unbalanced braces — response may be truncated');
}
