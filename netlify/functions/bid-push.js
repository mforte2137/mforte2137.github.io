// =========================================================
// bid-push.js — Netlify function
// Path: /api/bid-push
//
// Two actions:
//   categories — fetch the MSP's Salesbuildr category tree
//   push       — push one batch (max 100) of products to
//                Salesbuildr via POST /public-api/product/batch
//
// Keys come from the request body — never from env vars.
// The client calls push repeatedly for large files (batching
// at 100 products per call stays well inside the 10s timeout).
// =========================================================

const SB_BASE = 'https://portal.us1-salesbuildr.com/public-api';

// Maps Special Bid CSV field names → Salesbuildr API field names
function toApiProduct(row, categoryId) {
  const p = { name: (row['Name'] || '').trim(), categoryId };

  if (!p.name) return null;

  if (row['MPN']?.toString().trim())          p.mpn              = row['MPN'].toString().trim();
  if (row['Description']?.toString().trim())  p.shortDescription = row['Description'].toString().trim();

  const cost       = parseFloat(row['Cost']);
  const salesPrice = parseFloat(row['Sales Price']);
  const markup     = parseFloat(row['Markup']);
  const margin     = parseFloat(row['Margin']);
  const msrp       = parseFloat(row['MSRP']);

  if (!isNaN(cost)       && cost > 0)        p.cost   = cost;
  if (!isNaN(salesPrice) && salesPrice > 0)  p.price  = salesPrice;
  if (!isNaN(markup)     && markup >= 0)     p.markup = markup;
  if (!isNaN(margin)     && margin >= 0)     p.margin = margin;
  if (!isNaN(msrp)       && msrp > 0)        p.msrp   = msrp;

  const unit = row['Unit']?.toString().trim();
  const term = row['Term']?.toString().trim();
  if (unit) p.unit = unit;
  if (term) p.term = term;

  // Manufacturer preferred; fall back to Distributor as vendor label
  const vendor = row['Manufacturer']?.toString().trim() || row['Distributor']?.toString().trim();
  if (vendor) p.vendor = vendor;

  return p;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { action, apiKey, integrationKey } = body;
  if (!apiKey || !integrationKey) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Salesbuildr credentials required.' }) };
  }

  const sbHeaders = { 'Content-Type': 'application/json', 'api-key': apiKey, 'integration-key': integrationKey };
  const ok200 = (data) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, ...data }) });
  const err   = (msg, code = 500) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: msg }) });

  // ── ACTION: categories ────────────────────────────────────
  if (action === 'categories') {
    try {
      const res  = await fetch(`${SB_BASE}/category`, { headers: sbHeaders });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        return err(e.message || `Salesbuildr returned ${res.status}`, res.status);
      }
      const data = await res.json();
      // Return flat list with id, name, parentName for easy dropdown display
      const cats = (Array.isArray(data) ? data : data.results || []).map(c => ({
        id:         c.id,
        name:       c.name,
        parentName: c.parentCategory?.name || null,
        label:      c.parentCategory?.name ? `${c.parentCategory.name} → ${c.name}` : c.name
      })).sort((a, b) => a.label.localeCompare(b.label));
      return ok200({ categories: cats });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: push (one batch of up to 100 products) ────────
  if (action === 'push') {
    const { rows, categoryId, enrich } = body;
    if (!Array.isArray(rows) || rows.length === 0) return err('No rows provided.', 400);
    if (!categoryId) return err('categoryId required.', 400);

    // Convert CSV rows to API product objects, skip invalid
    const products = rows.map(r => toApiProduct(r, categoryId)).filter(Boolean);
    if (products.length === 0) return err('No valid products after conversion.', 400);

    try {
      const url = `${SB_BASE}/product/batch${enrich ? '?enrich=true' : ''}`;
      const res  = await fetch(url, {
        method:  'POST',
        headers: sbHeaders,
        body:    JSON.stringify({ products })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return err(data.message || `Salesbuildr returned ${res.status}`, res.status);

      const pushed = Array.isArray(data.products) ? data.products.length : products.length;
      return ok200({ pushed, total: rows.length, products: data.products || [] });

    } catch (e) {
      return err(e.message);
    }
  }

  return err('Unknown action. Use "categories" or "push".', 400);
};
