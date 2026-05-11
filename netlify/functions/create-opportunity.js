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
    // Catalog search for Quick Quote mode.
    // Fetches the full catalog and scores products client-side
    // against keywords extracted from the plain-language request.
    // The Salesbuildr ?query= param is unreliable for PSA items,
    // so we pull everything and rank by keyword match score.
    if (action === 'search-products') {
      const { query, keywords } = body;
      if (!query && (!keywords || keywords.length === 0)) return err('query required.', 400);

      // Single fetch — Salesbuildr API doesn't support pagination params (page= or offset=).
      // size=500 returns whatever the API allows in one call.
      const res  = await fetch(`${BASE}/product?size=500`, { headers });
      const data = res.ok ? await res.json() : {};
      const all  = data?.results || data?.data || data?.items || (Array.isArray(data) ? data : []);

      // Score every product against the keyword list sent from the client
      const kws = Array.isArray(keywords) && keywords.length > 0
        ? keywords
        : (query || '').toLowerCase().split(/\s+/)
            .filter(w => w.length > 2 && !['one','two','three','four','five','six','seven','eight','nine','ten'].includes(w));

      // Exclude services, labor, bundles, and unlisted items.
      // listed:false means the rep has hidden it from their catalog — don't quote it.
      const hardwareOnly = all.filter(p => {
        const t = (p.productType || p.type || '').toLowerCase();
        if (t === 'service' || t === 'labor' || t === 'bundle') return false;
        if (p.listed === false) return false;  // confirmed field name from API
        return true;
      });

      // Synonym expansion — common customer terms → catalog terms
      // e.g. "dock" → also search "docking", "station", "hub"
      const synonyms = {
        dock:     ['dock', 'docking', 'station', 'hub'],
        monitor:  ['monitor', 'display', 'screen'],
        laptop:   ['laptop', 'notebook', 'portable'],
        phone:    ['phone', 'handset', 'voip', 'telephone'],
        printer:  ['printer', 'mfp', 'multifunction'],
        keyboard: ['keyboard', 'kbd'],
        mouse:    ['mouse', 'pointer'],
        headset:  ['headset', 'headphone', 'earphone'],
        cable:    ['cable', 'lead', 'connector'],
        switch:   ['switch', 'swh'],
        server:   ['server', 'srv'],
        // Carry cases — reps say "bag", products say "backpack", "briefcase", "topload", "sleeve"
        bag:      ['bag', 'backpack', 'briefcase', 'topload', 'sleeve', 'satchel', 'tote'],
        backpack: ['bag', 'backpack', 'briefcase', 'topload', 'sleeve', 'satchel', 'tote'],
        // Networking infrastructure
        patch:    ['patch', 'panel', 'keystone', 'punchdown'],
        panel:    ['patch', 'panel', 'keystone', 'punchdown'],
        unifi:    ['unifi', 'ubiquiti', 'u6', 'uap', 'udm', 'usw'],
        ubiquiti: ['unifi', 'ubiquiti', 'u6', 'uap', 'udm', 'usw'],
      };

      // Expand keywords with synonyms
      const expandedKws = new Set(kws);
      for (const kw of kws) {
        for (const [base, syns] of Object.entries(synonyms)) {
          if (kw.includes(base) || base.includes(kw)) {
            syns.forEach(s => expandedKws.add(s));
          }
        }
      }
      const allKws = [...expandedKws];

      const requestLower = (query || '').toLowerCase();

      // Detect what broad categories the request is about
      const wantsLaptop   = requestLower.includes('laptop') || requestLower.includes('notebook');
      const wantsMonitor  = requestLower.includes('monitor') || requestLower.includes('display') || requestLower.includes('screen');
      const wantsDock     = requestLower.includes('dock') || requestLower.includes('docking') || requestLower.includes('station');
      const wantsPhone    = requestLower.includes('phone') || requestLower.includes('voip') || requestLower.includes('handset')
                         || requestLower.includes('yealink') || requestLower.includes('snom') || requestLower.includes('poly')
                         || requestLower.includes('cisco') || requestLower.includes('t54') || requestLower.includes('t57');
      const wantsDell     = requestLower.includes('dell');
      const wantsLenovo   = requestLower.includes('lenovo');
      const wantsHp       = requestLower.includes('hp') || requestLower.includes('elitebook') || requestLower.includes('probook');

      // Detect model numbers — high-signal tokens like "510", "p7", "t54w", "g5"
      // Model keywords: tokens with digits that look like model numbers (e.g. "510", "t54w", "g5")
      // Exclude pure storage/RAM sizes like "512", "256", "16gb" — these match too many products
      const modelKws = allKws.filter(k => {
        if (/^\d+$/.test(k) && k.length <= 4) return false;  // pure number like "510", "512" — ambiguous
        if (/^\d+(gb|tb|mb)$/i.test(k)) return false;         // storage size like "512gb", "16gb"
        return /[0-9]/.test(k);                                 // alphanumeric model like "t54w", "p7", "g5"
      });

      // Detect brand keywords from the request
      const knownBrands = ['dell','lenovo','hp','jabra','yealink','snom','poly','cisco',
        'logitech','bose','samsung','lg','adesso','epos','plantronics','apple','startech',
        'kingston','sandisk','microsoft','philips','axis','creative','asus','acer','sony',
        'ubiquiti','unifi','netgear','tplink','zyxel','fortinet','meraki','aruba','ruckus',
        'targus','kensington','brother','epson','canon','xerox','zebra'];
      const brandKws = allKws.filter(k => knownBrands.includes(k.toLowerCase()));

      function scoreProduct(p) {
        const nameLower = (p.name || '').toLowerCase();
        const mfr       = (p.manufacturer || '').toLowerCase();
        const haystackRaw = [
          p.name || '', p.shortDescription || '', p.manufacturer || '', p.mpn || '', p.ean || ''
        ].join(' ').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
        // Also build a space-collapsed version so "top load" matches keyword "topload"
        const haystackCompact = haystackRaw.replace(/ /g, '');
        const haystack = haystackRaw;

        let score = 0;

        // Model number match — very high signal (+6 each)
        for (const kw of modelKws) {
          if (haystack.includes(kw) || haystackCompact.includes(kw)) score += 6;
        }

        // Brand match — reward products from a requested brand (+4)
        for (const bk of brandKws) {
          if (mfr.includes(bk) || nameLower.startsWith(bk) || nameLower.includes(bk)) score += 4;
        }

        // General category keywords — lower weight
        for (const kw of allKws) {
          if (modelKws.includes(kw) || brandKws.includes(kw)) continue;
          const k = kw.replace(/[^a-z0-9]/g, '');
          if (!k || k.length < 3) continue;
          if (haystack.includes(k) || haystackCompact.includes(k)) score += k.length > 5 ? 2 : 1;
        }

        // Off-brand penalty — only penalise when the product is in the same category
        // as the requested brand. Don't penalise accessories/bags from other brands
        // just because the rep also asked for a Jabra or Dell item.
        if (brandKws.length > 0) {
          const fromRequestedBrand = brandKws.some(bk => mfr.includes(bk) || nameLower.includes(bk));
          if (!fromRequestedBrand) {
            // Only penalise if this product looks like it competes with the branded item
            // (i.e. it's also a laptop, phone, speaker, monitor — not an accessory/bag)
            const isAccessory = nameLower.includes('bag') || nameLower.includes('backpack')
              || nameLower.includes('sleeve') || nameLower.includes('topload') || haystackCompact.includes('topload')
              || nameLower.includes('briefcase') || nameLower.includes('cable')
              || nameLower.includes('charger') || nameLower.includes('adapter')
              || nameLower.includes('mouse') || nameLower.includes('keyboard');
            if (!isAccessory) score -= 3;
          }
        }

        // Category mismatch penalties
        const isPhone    = nameLower.includes('voip') || nameLower.includes('sip-') || /phone/.test(nameLower) || nameLower.includes('handset');
        const isAIO      = nameLower.includes('all-in-one') || nameLower.includes('neo 50a');
        const isCharger  = nameLower.includes('charger') || nameLower.includes('wall charger') || nameLower.includes('power adapter');
        const isRefurb   = nameLower.startsWith('refurb') || nameLower.startsWith('excess') || nameLower.includes('demo ');
        const isWorkstation = nameLower.includes('workstation') || /thinkpad p/.test(nameLower);
        const isDrive    = nameLower.includes('hard drive') || nameLower.includes('internal drive') || nameLower.includes('hdd') || /\bsas\b/.test(nameLower);
        const isCommercialAudio = nameLower.includes('pa system') || nameLower.includes('ip speaker') || nameLower.includes('soundbar') || nameLower.includes('edgemax');
        const wantsLargeMonitor = wantsMonitor && (requestLower.includes('27') || requestLower.includes('24') || requestLower.includes('32'));
        const isSmallMonitor    = wantsLargeMonitor && (nameLower.includes('13.') || nameLower.includes('15.') || nameLower.includes('portable'));

        if (isPhone && !wantsPhone)   score -= 8;
        if (isAIO && (wantsMonitor || wantsLaptop)) score -= 6;
        if (isCharger)                score -= 6;
        if (isDrive && !requestLower.includes('drive') && !requestLower.includes('storage')) score -= 7;
        if (isSmallMonitor)           score -= 5;
        if (isRefurb)                 score -= 4;
        if (isWorkstation && wantsLaptop && !requestLower.includes('workstation')) score -= 4;
        if (isCommercialAudio && !requestLower.includes('pa') && !requestLower.includes('soundbar')) score -= 5;

        return score;
      }

      // Per-product adaptive threshold:
      // A product that matched a brand or model keyword must score 5+ (strong match).
      // A product that only matched generic category keywords needs just 2+ (weak match ok).
      // This handles mixed requests like "Jabra speaker and a laptop bag" — the bag
      // has no brand/model so it qualifies at 2, while the Jabra needs a strong match at 5.
      function meetsThreshold(p, score) {
        if (score <= 0) return false;
        const nameLower = (p.name || '').toLowerCase();
        const mfr       = (p.manufacturer || '').toLowerCase();
        const hay       = (nameLower + ' ' + mfr).replace(/[^a-z0-9 ]/g, ' ');
        const hitsBrand = brandKws.some(bk => hay.includes(bk));
        const hitsModel = modelKws.some(mk => hay.includes(mk));
        return (hitsBrand || hitsModel) ? score >= 5 : score >= 2;
      }

      const scored = hardwareOnly
        .map(p => ({ p, score: scoreProduct(p) }))
        .filter(({ p, score }) => meetsThreshold(p, score))
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      const products = scored.map(({ p, score }) => ({
        id:          p.id,
        name:        p.name || p.description || 'Unknown',
        price:       p.sellPrice ?? p.price ?? p.recurringPrice ?? p.unitPrice ?? 0,
        type:        p.productType || p.type || 'product',
        unit:        (() => {
          const t = (p.productType || p.type || '').toLowerCase();
          if (t === 'bundle') return 'month';
          return (p.unit || p.term || '').toLowerCase();
        })(),
        vendor:      p.manufacturer || '',
        sku:         p.mpn || p.ean || '',
        listed:      p.listed ?? null,  // confirmed API field — false = hidden from catalog
        _rawAvail:   `listed:${p.listed}`,
        _score:      score
      }));

      // Debug: expose raw field names from first result so we know what the API actually returns
      const debugFields = scored[0] ? Object.keys(scored[0].p) : [];

      return ok({ products, catalogSize: all.length, matched: products.length });
    }

        return err('Unknown action.', 400);

  } catch (e) {
    return err(e.message || 'Unexpected server error.');
  }
};
