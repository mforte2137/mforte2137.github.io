// =========================================================
// create-opportunity.js — Netlify function
// Path: /api/create-opportunity
//
// Phase 2 — Guided Sales CRM integration
//
// Actions:
//   search-company     — find existing Salesbuildr companies
//   create-company     — create a new prospect company
//   upsert-opportunity — create/update opportunity with Sales Brief
//   create-quote       — create a draft quote against the opportunity
//
// Credentials come from the REQUEST BODY — never env vars.
// =========================================================

const BASE = 'https://portal.us1-salesbuildr.com/public-api';

function sbHeaders(apiKey, intKey) {
  return {
    'Content-Type': 'application/json',
    'api-key': apiKey,
    'integration-key': intKey
  };
}

function ok(data) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true, ...data })
  };
}

function err(msg, code = 200) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: false, error: msg })
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') return err('POST required.', 405);

  let body;
  try { body = JSON.parse(event.body); }
  catch { return err('Invalid JSON.', 400); }

  const { action, apiKey, integrationKey } = body;

  // Ping — warm-up call, no credentials needed
  if (action === 'ping') return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, pong: true }) };

  if (!apiKey || !integrationKey) return err('API credentials required.', 400);

  const headers = sbHeaders(apiKey, integrationKey);

  try {

    // ── search-company ──────────────────────────────────────
    if (action === 'search-company') {
      const { name } = body;
      if (!name) return err('Company name required.', 400);

      const res  = await fetch(`${BASE}/company?query=${encodeURIComponent(name)}&size=8`, { headers });
      const data = await res.json();

      // Handle all possible response shapes from Salesbuildr:
      //   { data: [...] }  |  { items: [...] }  |  { results: [...] }
      //   plain array [...]  |  single object {...}
      let companies = [];
      if (Array.isArray(data))              companies = data;
      else if (Array.isArray(data?.data))   companies = data.data;
      else if (Array.isArray(data?.items))  companies = data.items;
      else if (Array.isArray(data?.results))companies = data.results;
      else if (data?.id)                    companies = [data]; // single object returned

      // Expose the raw response keys for debugging when nothing found
      const debugShape = companies.length === 0
        ? { _rawKeys: Object.keys(data || {}), _isArray: Array.isArray(data) }
        : {};

      return ok({ companies, ...debugShape });
    }

    // ── ping ────────────────────────────────────────────────
    if (action === 'ping') return ok({ pong: true });

    // ── fetch-guided-catalog ─────────────────────────────────
    // Returns all products/services tagged 'guided' from the
    // MSP's Salesbuildr catalog — the curated set for guided sales.
    if (action === 'fetch-guided-catalog') {
      // Fetch all products unfiltered — server-side label filter unreliable for PSA items.
      // Filter client-side by checking labels array contains 'guided'.
      const res  = await fetch(`${BASE}/product?size=100`, { headers });
      const data = res.ok ? await res.json() : {};
      const all  = data?.results || data?.data || data?.items || (Array.isArray(data) ? data : []);

      // Client-side label filter
      const guided = all.filter(p => {
        const lbls = p.labels || [];
        return Array.isArray(lbls)
          ? lbls.some(l => (typeof l === 'string' ? l : l?.name || l?.value || '').toLowerCase() === 'guided')
          : false;
      });

      const catalog = guided.map(p => ({
        id:     p.id,
        name:   p.name || p.description || 'Unknown',
        price:  p.sellPrice ?? p.price ?? p.recurringPrice ?? p.unitPrice ?? 0,
        type:   p.productType || p.type || 'product',
        labels: Array.isArray(p.labels) ? p.labels.map(l => typeof l === 'string' ? l : (l?.name || '')).filter(Boolean) : [],
        unit:   (() => {
          const t = (p.productType || p.type || '').toLowerCase();
          if (t === 'bundle') return 'month'; // bundles are monthly recurring
          return (p.unit || p.term || '').toLowerCase();
        })(),
      }));

      // Debug to confirm what labels look like
      const debug = {
        totalFetched: all.length,
        guidedFound:  guided.length,
        firstLabels:  all[0]?.labels ?? 'n/a',
      };

      return ok({ catalog, _debug: debug });
    }

    // ── get-opportunity ─────────────────────────────────────
    // Fetches full OpportunityResponseDto so we can echo back
    // all existing IDs (contact, owner, stage, category) when
    // updating the description — avoids "field required" errors.
    if (action === 'get-opportunity') {
      const { opportunityId } = body;
      if (!opportunityId) return err('opportunityId required.', 400);
      const res  = await fetch(`${BASE}/opportunity/${opportunityId}`, { headers });
      const data = res.ok ? await res.json() : {};
      if (!res.ok) return err(data?.message || 'Failed to fetch opportunity.');
      return ok({ opportunity: data });
    }

    // ── search-opportunity ──────────────────────────────────
    // Find existing opportunities for a company so the rep
    // can connect the Sales Guide to one they already created.
    if (action === 'search-opportunity') {
      const { companyId } = body;
      if (!companyId) return err('companyId required.', 400);

      const res  = await fetch(`${BASE}/opportunity?filters=${encodeURIComponent('company.id:' + companyId)}&size=20`, { headers });
      const data = res.ok ? await res.json() : {};
      const opps = data?.results || data?.data || data?.items || (Array.isArray(data) ? data : []);
      return ok({ opportunities: opps });
    }

    // ── fetch-opp-fields ────────────────────────────────────
    // Tries multiple field name variants for each dropdown —
    // returns the first one that comes back with data.
    if (action === 'fetch-opp-fields') {
      const results = {};

      // Categories — confirmed working field name
      try {
        const res  = await fetch(`${BASE}/field/opportunity-category`, { headers });
        const data = res.ok ? await res.json() : {};
        results.categories = (data?.values || []).filter(v => !v.deleted);
      } catch { results.categories = []; }

      // Pipeline stages — try the same naming pattern that worked for category
      try {
        const candidates = ['opportunity-stage', 'opportunity-pipeline-stage', 'pipeline-stage', 'pipelineStage'];
        results.pipelineStages = [];
        for (const name of candidates) {
          const res  = await fetch(`${BASE}/field/${encodeURIComponent(name)}`, { headers });
          const data = res.ok ? await res.json() : {};
          const vals = (data?.values || []).filter(v => !v.deleted);
          if (vals.length > 0) { results.pipelineStages = vals; break; }
        }
      } catch { results.pipelineStages = []; }

      // Owners — quote list returns full QuoteResponseDto with owner nested object.
      // Response shape confirmed from OpenAPI: { results: [...], total: N }
      try {
        const res    = await fetch(`${BASE}/quote?size=20`, { headers });
        const data   = res.ok ? await res.json() : {};
        // Quote list uses 'results' key — not 'data' or 'items'
        const quotes = data?.results || data?.data || data?.items || (Array.isArray(data) ? data : []);
        const ownerMap = new Map();
        quotes.forEach(q => {
          const o = q.owner || q.createdBy;
          if (o?.id) {
            ownerMap.set(o.id, {
              id:           o.id,
              displayValue: o.name || o.email || o.id,
              extId:        o.externalIdentifier || o.email || null
            });
          }
        });
        results.owners = [...ownerMap.values()];
      } catch { results.owners = []; }

      return ok(results);
    }

    // ── search-contact ──────────────────────────────────────
    if (action === 'search-contact') {
      const { companyId } = body;
      if (!companyId) return err('companyId required.', 400);

      const res  = await fetch(`${BASE}/contact?filters=${encodeURIComponent('company.id:' + companyId)}&size=20`, { headers });
      const data = await res.json();

      let contacts = [];
      if (Array.isArray(data))              contacts = data;
      else if (Array.isArray(data?.data))   contacts = data.data;
      else if (Array.isArray(data?.items))  contacts = data.items;
      else if (Array.isArray(data?.results))contacts = data.results;
      else if (data?.id)                    contacts = [data];

      return ok({ contacts });
    }

    // ── create-company ──────────────────────────────────────
    if (action === 'create-company') {
      const { name } = body;
      if (!name) return err('Company name required.', 400);

      // Generate a short reference number (SG + 6-digit timestamp suffix)
      const number = 'SG-' + Date.now().toString().slice(-6);

      const res  = await fetch(`${BASE}/company`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ name, number, type: 'prospect' })
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create company.');
      return ok({ company: data });
    }

    // ── upsert-opportunity ──────────────────────────────────
    if (action === 'upsert-opportunity') {
      // Updates description of an EXISTING opportunity using its real
      // externalIdentifier (AT record ID). Never creates new records —
      // avoids the PSA sync issue caused by fake ext IDs.
      const { name, description, extId, companyId, contactId, ownerId, pipelineStageId, categoryId } = body;
      if (!extId) return err('extId required.', 400);

      // Echo back all existing field IDs so Salesbuildr doesn't
      // treat missing fields as intentional removals
      const payload = { name: name || 'Opportunity', description };
      if (companyId)       payload.companyId       = companyId;
      if (contactId)       payload.contactId       = contactId;
      if (ownerId)         payload.ownerId         = ownerId;
      if (pipelineStageId) payload.pipelineStageId = pipelineStageId;
      if (categoryId)      payload.categoryId      = categoryId;

      const res  = await fetch(`${BASE}/opportunity/ext/${encodeURIComponent(extId)}`, {
        method:  'PUT',
        headers,
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create opportunity.');
      return ok({ opportunity: data });
    }

    // ── create-quote ────────────────────────────────────────
    if (action === 'create-quote') {
      const { opportunityId, title, templateId, widgets } = body;
      if (!opportunityId) return err('opportunityId required.', 400);

      const resolvedTemplateId = templateId || null;
      const { products } = body; // array of {id, quantity}

      const payload = { opportunityId, title: title || 'Proposal' };
      if (resolvedTemplateId) payload.templateId = resolvedTemplateId;
      if (Array.isArray(products) && products.length > 0) payload.products = products;

      const res  = await fetch(`${BASE}/quote`, {
        method:  'POST',
        headers,
        body:    JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) return err(data?.message || data?.error || 'Failed to create quote.');
      return ok({ quote: data });
    }

    // ── search-products ─────────────────────────────────────
    // Claude Haiku-powered catalog matching for Quick Quote.
    // Fetches full catalog, sends product names + request to Haiku,
    // which returns the IDs of the best matching products.
    // This replaces keyword scoring — Claude understands semantics.
    if (action === 'search-products') {
      const { query } = body;
      if (!query) return err('query required.', 400);

      // 1. Fetch full catalog
      const res  = await fetch(`${BASE}/product?size=500`, { headers });
      const data = res.ok ? await res.json() : {};
      const all  = data?.results || data?.data || data?.items || (Array.isArray(data) ? data : []);

      // 2. Filter to listed, non-service, non-bundle products only
      const hardware = all.filter(p => {
        const t = (p.productType || p.type || '').toLowerCase();
        if (t === 'service' || t === 'labor' || t === 'bundle') return false;
        if (p.listed === false) return false;
        return true;
      });

      if (hardware.length === 0) return ok({ products: [], catalogSize: all.length, matched: 0 });

      // 3. Build a compact product list for Haiku — id + name only to minimise tokens
      const catalogList = hardware.map(p => `${p.id}|||${p.name}`).join('\n');

      // 4. Ask Haiku to match the request against the catalog
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: `You are a product catalog matching assistant for an MSP (IT services company).
Given a customer product request and a catalog of products, return the IDs of the best matching products.

Rules:
- Match products that the customer is clearly asking for
- Include close alternatives if the exact model isn't available (e.g. similar spec laptop)
- Exclude products that are clearly unrelated to the request
- Never include services, software licenses, or recurring billing items
- Return at most 8 product IDs
- Return ONLY a JSON array of ID strings, nothing else. Example: ["id1","id2","id3"]`,
          messages: [{
            role: 'user',
            content: `Customer request: "${query}"

Product catalog (format: ID|||Name):
${catalogList}

Return a JSON array of the IDs of matching products. Return [] if nothing matches.`
          }]
        })
      });

      const aiData = await aiRes.json();
      const aiText = aiData?.content?.[0]?.text?.trim() || '[]';

      // 5. Parse the returned IDs safely
      let matchedIds = [];
      try {
        const parsed = JSON.parse(aiText);
        if (Array.isArray(parsed)) matchedIds = parsed.filter(id => typeof id === 'string');
      } catch {
        // Haiku occasionally wraps in markdown — strip and retry
        const stripped = aiText.replace(/```json?|```/g, '').trim();
        try { matchedIds = JSON.parse(stripped); } catch { matchedIds = []; }
      }

      // 6. Look up full product details for matched IDs
      const idSet = new Set(matchedIds);
      const matched = hardware
        .filter(p => idSet.has(p.id))
        .sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id)) // preserve Haiku's order
        .map(p => ({
          id:     p.id,
          name:   p.name || p.description || 'Unknown',
          price:  p.sellPrice ?? p.price ?? p.recurringPrice ?? p.unitPrice ?? 0,
          type:   p.productType || p.type || 'product',
          unit:   (() => {
            const t = (p.productType || p.type || '').toLowerCase();
            if (t === 'bundle') return 'month';
            return (p.unit || p.term || '').toLowerCase();
          })(),
          vendor: p.manufacturer || '',
          sku:    p.mpn || p.ean || '',
          listed: p.listed ?? null,
        }));

      return ok({ products: matched, catalogSize: all.length, matched: matched.length });
    }


        return err('Unknown action.', 400);

  } catch (e) {
    return err(e.message || 'Unexpected server error.');
  }
};
