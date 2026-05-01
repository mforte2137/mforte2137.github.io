// =========================================================
// generate-cover.js — Netlify function
// Path: /api/generate-cover
//
// Actions:
//   extract-color — fetches prospect website, extracts brand colour
//   generate      — Unsplash photo + Placid image generation
//   push          — creates Salesbuildr image widget template
// =========================================================

const PLACID_API  = 'https://api.placid.app/api/rest/images';
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';
const SB_BASE     = 'https://portal.us1-salesbuildr.com/public-api/quote-widget-template';

// Template registry — add new Placid templates here as they're created
const TEMPLATES = {
  chevron: {
    uuid:        'o1dobplzksihm',
    name:        'Chevron',
    colorLayers: ['chevron', 'accent_bar']
  }
  // future templates added here:
  // split:    { uuid: '...', name: 'Split Panel', colorLayers: ['color_panel'] },
  // minimal:  { uuid: '...', name: 'Minimal',    colorLayers: ['accent_stripe'] }
};

// Photo category → Unsplash search keyword mapping (all tech-focused)
const INDUSTRY_KEYWORDS = {
  office:        'modern office team computers professional workspace',
  datacenter:    'data center server room technology infrastructure',
  cloud:         'cloud technology server digital infrastructure',
  network:       'network cables ethernet connectivity technology',
  security:      'cybersecurity data security digital protection lock',
  consulting:    'business IT consulting meeting professional team',
  technician:    'IT technician network engineer technology support field',
  abstract_lines:'abstract technology digital lines light background',
  abstract_circuit:'circuit board technology macro abstract close up',
  abstract_fiber:'fiber optic light technology abstract bokeh glow'
};

// ── Extract brand colour from website ─────────────────────
async function extractBrandColor(url) {
  try {
    const res  = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FirstImpression/1.0)' },
      signal:  AbortSignal.timeout(5000)
    });
    const html = await res.text();

    // 1. Meta theme-color (most reliable)
    const themeA = html.match(/name=["']theme-color["'][^>]+content=["']([#][0-9a-fA-F]{3,8})["']/i);
    const themeB = html.match(/content=["']([#][0-9a-fA-F]{3,8})["'][^>]+name=["']theme-color["']/i);
    if (themeA) return themeA[1].slice(0, 7);
    if (themeB) return themeB[1].slice(0, 7);

    // 2. CSS custom properties
    const cssVar = html.match(/--(?:primary|brand|accent|main|color-primary|theme-color|base-color)[^:]*:\s*(#[0-9a-fA-F]{6})/i);
    if (cssVar) return cssVar[1];

    // 3. Common hex colours in styles (skip near-black and near-white)
    const hexes = [...html.matchAll(/#([0-9a-fA-F]{6})/g)]
      .map(m => '#' + m[1].toLowerCase())
      .filter(h => !['#000000','#ffffff','#333333','#666666','#999999','#cccccc','#f0f0f0','#eeeeee'].includes(h));
    if (hexes.length > 0) return hexes[0];

    return null;
  } catch (e) {
    return null;
  }
}

// ── Unsplash photo search ─────────────────────────────────
async function getPhoto(industry) {
  const keyword = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.generic;
  const params  = new URLSearchParams({
    query:       keyword,
    orientation: 'portrait',
    per_page:    '5',
    client_id:   process.env.UNSPLASH_ACCESS_KEY
  });

  const res  = await fetch(`${UNSPLASH_API}?${params}`);
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    // Pick a varied result based on current minute so reruns give different photos
    const idx = new Date().getMinutes() % Math.min(data.results.length, 5);
    return data.results[idx].urls.regular + '&w=1200&q=80';
  }
  throw new Error('Could not find a suitable photo. Try a different industry.');
}

// ── Upload base64 logo to Placid file storage ─────────────
// If the logo is a base64 data URL (uploaded file), we upload it
// to Placid's servers and get back a public HTTPS URL that
// Placid can use when rendering the template.
async function uploadLogoToPlacid(base64DataUrl) {
  const matches = base64DataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image data — please use a logo URL instead.');

  const mimeType = matches[1];
  const buffer   = Buffer.from(matches[2], 'base64');
  const ext      = mimeType.split('/')[1] || 'png';
  const filename = `logo-upload.${ext}`;
  const boundary = 'FormBoundary' + Date.now().toString(36);

  const bodyParts = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const res  = await fetch('https://api.placid.app/api/rest/files', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}`,
      'Content-Type':  `multipart/form-data; boundary=${boundary}`
    },
    body: bodyParts
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Logo upload to Placid failed.');
  return data.url; // public HTTPS URL hosted by Placid
}

// ── Placid image generation ───────────────────────────────
async function generateImage(templateId, brandColor, photoUrl, logoUrl) {
  const template = TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  // Ensure 8-digit hex (add FF alpha for full opacity)
  const hex8 = brandColor.replace('#', '').padEnd(6, '0').slice(0, 6).toUpperCase() + 'FF';
  const color = '#' + hex8;

  const layers = {
    photo: { image: photoUrl },
    logo:  { image: logoUrl  }
  };
  for (const layer of template.colorLayers) {
    layers[layer] = { background_color: color };
  }

  const res  = await fetch(PLACID_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` },
    body:    JSON.stringify({ template_uuid: template.uuid, layers })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Placid error ${res.status}`);

  // Poll for completion (max 8 seconds)
  let imageUrl = data.image_url;
  if (!imageUrl && data.polling_url) {
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const poll     = await fetch(data.polling_url, { headers: { 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` } });
      const pollData = await poll.json();
      if (pollData.image_url) { imageUrl = pollData.image_url; break; }
    }
  }
  if (!imageUrl) throw new Error('Image generation timed out — please try again.');
  return imageUrl;
}

// ── Build Salesbuildr overlay HTML ────────────────────────
// Uses topTemplate=null, middleTemplate=null, bottomTemplate=content
// The white rounded rectangle sits in the lower-middle of the image,
// so we use bottomTemplate with top-heavy padding to sit inside the panel.
function buildOverlay(brandColor) {
  const html = `<div style="display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;padding:0 48px 24px;text-align:center;">
  <h2 style="font-size:22pt;font-weight:700;color:${brandColor};font-family:'Segoe UI',Arial,sans-serif;margin:0 0 10px 0;line-height:1.2;">{{company.name}}</h2>
  <p style="font-size:11pt;color:#333333;font-family:'Segoe UI',Arial,sans-serif;margin:3px 0;">Prepared for {{contact.firstName}} {{contact.lastName}}</p>
  <p style="font-size:10pt;color:#666666;font-family:'Segoe UI',Arial,sans-serif;margin:3px 0;">Presented by {{owner.fullName}}</p>
</div>`;
  return html;
}

function buildOverlayZones(brandColor) {
  return {
    topTemplate:    null,
    middleTemplate: buildOverlay(brandColor),
    bottomTemplate: null
  };
}

// ── Main handler ──────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) { return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { action } = body;
  const ok200 = (data) => ({ statusCode: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, ...data }) });
  const err   = (msg, code = 500) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: msg }) });

  // ── ACTION: extract-color ──────────────────────────────
  if (action === 'extract-color') {
    const { websiteUrl } = body;
    if (!websiteUrl) return err('websiteUrl required.', 400);
    const color = await extractBrandColor(websiteUrl);
    return ok200({ color, found: !!color });
  }

  // ── ACTION: photos — return 4 Unsplash options ────────────
  if (action === 'photos') {
    const { industry } = body;
    try {
      const keyword = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.generic;
      const params  = new URLSearchParams({
        query:       keyword,
        orientation: 'portrait',
        per_page:    '8',
        client_id:   process.env.UNSPLASH_ACCESS_KEY
      });
      const res  = await fetch(`${UNSPLASH_API}?${params}`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) return err('No photos found for this industry.');

      // Return 4 varied results — thumbnail for display, regular for generation
      const photos = data.results.slice(0, 4).map(p => ({
        id:        p.id,
        thumb:     p.urls.small,
        full:      p.urls.regular + '&w=1200&q=80',
        alt:       p.alt_description || 'Professional photo',
        credit:    p.user.name
      }));
      return ok200({ photos });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: start (phase 1 — Unsplash + kick off Placid) ─
  if (action === 'start') {
    const { templateId, brandColor, logoUrl, industry } = body;
    if (!brandColor) return err('brandColor required.', 400);
    if (!logoUrl)    return err('logoUrl required.', 400);

    try {
      // If logo is a base64 data URL (file upload), host it on Placid first
      let resolvedLogoUrl = logoUrl;
      if (logoUrl && logoUrl.startsWith('data:')) {
        resolvedLogoUrl = await uploadLogoToPlacid(logoUrl);
      }

      // Use pre-selected photo if provided, otherwise fetch from Unsplash
      const photoUrl = body.photoUrl || await getPhoto(industry || 'generic');
      const template = TEMPLATES[templateId || 'chevron'];
      if (!template) return err('Unknown template.', 400);

      const hex8 = brandColor.replace('#', '').padEnd(6,'0').slice(0,6).toUpperCase() + 'FF';
      const color = '#' + hex8;
      const layers = { photo: { image: photoUrl }, logo: { image: resolvedLogoUrl } };
      for (const layer of template.colorLayers) layers[layer] = { background_color: color };

      const res  = await fetch(PLACID_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` },
        body:    JSON.stringify({ template_uuid: template.uuid, layers })
      });
      const data = await res.json();
      if (!res.ok) return err(data.message || `Placid error ${res.status}`);

      // Return immediately — client will poll
      return ok200({ imageId: data.id, photoUrl, status: data.status, imageUrl: data.image_url || null });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: poll (phase 2 — check if Placid is done) ──
  if (action === 'poll') {
    const { imageId } = body;
    if (!imageId) return err('imageId required.', 400);
    try {
      const res  = await fetch(`https://api.placid.app/api/rest/images/${imageId}`, {
        headers: { 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` }
      });
      const data = await res.json();
      return ok200({
        ready:    data.status === 'finished' && !!data.image_url,
        imageUrl: data.image_url || null,
        status:   data.status
      });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: push ───────────────────────────────────────
  if (action === 'push') {
    const { imageUrl, companyName, brandColor, apiKey, integrationKey } = body;
    if (!apiKey || !integrationKey) return err('Salesbuildr credentials required.', 401);
    if (!imageUrl)                  return err('imageUrl required.', 400);

    const zones = buildOverlayZones(brandColor || '#1a1a1a');
    const name  = companyName ? `${companyName} – Cover Page` : 'Cover Page';

    try {
      const res = await fetch(SB_BASE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey, 'integration-key': integrationKey },
        body:    JSON.stringify({
          name,
          widget: {
            type:           'image',
            hidden:         false,
            locked:         false,
            attachments:    [],
            image:          { ref: imageUrl, source: imageUrl, mediaType: 'image' },
            topTemplate:    zones.topTemplate,
            middleTemplate: zones.middleTemplate,
            bottomTemplate: zones.bottomTemplate
          },
          order: 950
        })
      });
      const data = await res.json();
      if (!res.ok) return err(data.message || `Salesbuildr error ${res.status}`);
      return ok200({ salesbuildrId: data.id, name });
    } catch (e) {
      return err(e.message);
    }
  }

  return err('Unknown action.', 400);
};
