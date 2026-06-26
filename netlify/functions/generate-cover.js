// =========================================================
// generate-cover.js — Netlify function
// Path: /api/generate-cover
//
// Actions:
//   analyse       — AI-powered: extract colour, logo, photo in one pass
//   start-all     — fire all 4 Placid renders in parallel
//   extract-color — fetches prospect website, extracts brand colour
//   photos        — Unsplash photo search
//   website-photos— extract.pics photo extraction
//   proxy-logo    — server-side logo fetch to bypass CORS
//   start         — single Placid render (manual mode)
//   poll          — check Placid render status
//   push          — creates Salesbuildr image widget template
// =========================================================

const PLACID_API  = 'https://api.placid.app/api/rest/images';
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

// Template registry — add new Placid templates here as they're created
const TEMPLATES = {
  chevron: {
    uuid:        'o1dobplzksihm',
    name:        'Chevron',
    colorLayers: ['chevron', 'accent_bar']
  },
  half_circle: {
    uuid:        'su7f9dcxtokvs',
    name:        'Half Circle',
    colorLayers: ['half_circle', 'accent_bar']
  },
  corporate: {
    uuid:        '6upetkewtuvkp',
    name:        'Corporate',
    colorLayers: ['bar_bottom', 'accent_bar']
  },
  modern: {
    uuid:        '1xwzoe6a2m3wa',
    name:        'Modern',
    colorLayers: ['rectangle']
  }
  // future templates added here:
};

// Photo category → Unsplash search keyword mapping (all tech-focused)
const INDUSTRY_KEYWORDS = {
  office:          'modern office team computers professional workspace',
  datacenter:      'data center server room racks infrastructure',
  cloud:           'cloud computing technology digital network server',
  network:         'network cables ethernet switch router technology',
  security:        'cybersecurity digital network protection encrypted screen',
  consulting:      'business IT consulting meeting professional boardroom',
  technician:      'IT technician network engineer field support technology',
  abstract_lines:  'abstract technology digital lines neon light background',
  abstract_circuit:'circuit board electronics macro technology close up',
  abstract_fiber:  'fiber optic light bokeh glow technology abstract'
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
  const html = `<div style="text-align:center;width:100%;">
  <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
  <h2 style="font-size:22pt;font-weight:700;color:${brandColor};font-family:'Segoe UI',Arial,sans-serif;margin:0 0 10px 0;line-height:1.2;">{{quote.title}}</h2>
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

  // ── ACTION: analyse ────────────────────────────────────
  // AI-powered single-pass: colour + logo + photo selection
  if (action === 'analyse') {
    const { websiteUrl } = body;
    if (!websiteUrl) return err('websiteUrl required.', 400);

    try {
      // Run colour extraction and extract.pics in parallel
      const [color, extractRes] = await Promise.all([
        extractBrandColor(websiteUrl),
        fetch('https://api.extract.pics/v0/extractions', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${process.env.EXTRACT_API}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ url: websiteUrl })
        }).then(r => r.json())
      ]);

      if (!extractRes.data || !extractRes.data.id) return err('Could not scan website.');
      const extractId = extractRes.data.id;

      // Poll extract.pics until done (max 20s)
      let allImages = [];
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const poll = await fetch(`https://api.extract.pics/v0/extractions/${extractId}`, {
          headers: { 'Authorization': `Bearer ${process.env.EXTRACT_API}` }
        }).then(r => r.json());
        if (poll.data.status === 'done') { allImages = poll.data.images || []; break; }
        if (poll.data.status === 'error') return err('Website scan failed.');
      }

      // Find logo candidates from extracted images
      const logoKeywords = ['logo', 'icon', 'favicon', 'brand', 'symbol', 'mark', 'thumb', 'badge', 'seal', 'crest'];

      const logoImages = allImages.filter(img => {
        if (!img.url) return false;
        // Allow SVGs for logos — often highest quality version
        const url = img.url.toLowerCase();
        const alt = (img.alt || '').toLowerCase();
        const isLogo = logoKeywords.some(k => url.includes(k) || alt.includes(k));
        const w = img.width || 0;
        const h = img.height || 0;
        const isTypicalLogoShape = w > 0 && h > 0 && (w === h || (w / h > 2 && h < 300));
        return isLogo || isTypicalLogoShape;
      });

      // Pass all images to Haiku — SVGs included since they're often the best logo source
      const allForAI = allImages.filter(img => img.url).slice(0, 30);

      // Use Haiku to pick the best logo
      const haikusPrompt = `You are helping find a company logo for a professional proposal cover page.

Website: ${websiteUrl}

ALL IMAGES FROM SITE (${allForAI.length} total):
${allForAI.map((img, i) => `${i+1}. URL: ${img.url} | alt: "${img.alt || ''}" | size: ${img.width||'?'}x${img.height||'?'}`).join('\n')}

Task: Pick the single best logo for the company at ${websiteUrl}.
PREFER in this order:
1. Full lockup logo (company name + icon together) — SVG format ideal
2. Full lockup logo in PNG
3. Icon/mark only if no full lockup exists
AVOID: Microsoft/vendor logos, certification badges, partner logos, favicon-sized images
Return null if no suitable logo found.

Respond ONLY with valid JSON, no markdown:
{"logoUrl": "url or null"}`;

      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages:   [{ role: 'user', content: haikusPrompt }]
        })
      });
      const aiData = await aiRes.json();
      let logoUrl = null;

      try {
        const parsed = JSON.parse(aiData.content[0].text);
        logoUrl = parsed.logoUrl || null;
      } catch (e) { /* AI parse failed — will use fallback */ }

      // Fallback: if AI found no logo, pick first logo candidate
      if (!logoUrl && logoImages.length > 0) logoUrl = logoImages[0].url;

      // ── Photo selection from curated GitHub library ────────
      const PHOTO_BASE       = 'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/photos/';
      const PHOTO_COUNT      = 12;
      const NON_ABSTRACT     = ['office', 'datacenter', 'network', 'security', 'team'];

      // Modern always uses abstract.
      // Other 3 templates each get a different randomly-chosen non-abstract category.
      const pool = [...NON_ABSTRACT].sort(() => Math.random() - 0.5); // shuffle
      const templateCategories = {
        chevron:     pool[0],
        half_circle: pool[1],
        corporate:   pool[2],
        modern:      'abstract'
      };

      // Pick a random image from each template's assigned category
      const seed = Date.now();
      const photoByTemplate = {};
      Object.entries(templateCategories).forEach(([templateId, category], i) => {
        const idx = (Math.floor(seed / 1000 + i * 37) % PHOTO_COUNT) + 1;
        photoByTemplate[templateId] = `${PHOTO_BASE}${category}-${idx}.jpg`;
      });

      const categoryMap = templateCategories;

      return ok200({
        brandColor:      color || '#1a4da0',
        logoUrl,
        photoByTemplate,
        categoryMap,
        photoBase:   PHOTO_BASE,
        photoCount:  PHOTO_COUNT,
        photoUrl:    photoByTemplate.chevron,
        photo2Url:   photoByTemplate.half_circle
      });

    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: refresh-tile ───────────────────────────────
  // Re-render a single template with a new random photo from the curated library
  if (action === 'refresh-tile') {
    const { templateId, brandColor, logoUrl, category, excludeUrl } = body;
    if (!templateId || !brandColor) return err('templateId and brandColor required.', 400);

    const PHOTO_BASE  = 'https://raw.githubusercontent.com/mforte2137/mforte2137.github.io/main/images/photos/';
    const PHOTO_COUNT = 12;
    const NON_ABSTRACT     = ['office', 'datacenter', 'network', 'security', 'team'];
    const DEFAULT_CATEGORIES = { modern: 'abstract' }; // only modern is fixed
    // For non-modern: use provided category or pick random non-abstract
    const cat = templateId === 'modern'
      ? 'abstract'
      : (category && category !== 'abstract' ? category : NON_ABSTRACT[Math.floor(Math.random() * NON_ABSTRACT.length)]);

    // Pick a random photo, avoiding the one currently shown
    let photoUrl, attempts = 0;
    do {
      const idx = Math.floor(Math.random() * PHOTO_COUNT) + 1;
      photoUrl = `${PHOTO_BASE}${cat}-${idx}.jpg`;
      attempts++;
    } while (photoUrl === excludeUrl && attempts < 5);

    const template = TEMPLATES[templateId];
    if (!template) return err('Unknown template.', 400);

    const hex8  = brandColor.replace('#', '').padEnd(6,'0').slice(0,6).toUpperCase() + 'FF';
    const color = '#' + hex8;
    const layers = { photo: { image: photoUrl } };
    if (logoUrl) layers.logo = { image: logoUrl };
    for (const layer of template.colorLayers) layers[layer] = { background_color: color };

    try {
      const res  = await fetch(PLACID_API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` },
        body:    JSON.stringify({ template_uuid: template.uuid, layers })
      });
      const data = await res.json();
      if (!res.ok) return err(data.message || `Placid error ${res.status}`);
      return ok200({ imageId: data.id, imageUrl: data.image_url || null, photoUrl });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: start-all ──────────────────────────────────
  if (action === 'start-all') {
    const { brandColor, logoUrl, photoUrl, photo2Url, photoByTemplate } = body;
    if (!brandColor || !photoUrl) return err('brandColor and photoUrl required.', 400);

    const hex8 = brandColor.replace('#', '').padEnd(6,'0').slice(0,6).toUpperCase() + 'FF';
    const color = '#' + hex8;

    // Use per-template photos if provided, otherwise fall back to photo1/photo2 split
    const photoForTemplate = photoByTemplate || {
      chevron:     photoUrl,
      corporate:   photoUrl,
      half_circle: photo2Url || photoUrl,
      modern:      photo2Url || photoUrl
    };

    try {
      const results = await Promise.all(
        Object.entries(TEMPLATES).map(async ([templateId, template]) => {
          const photo  = photoForTemplate[templateId] || photoUrl;
          const layers = { photo: { image: photo } };
          if (logoUrl) layers.logo = { image: logoUrl };
          for (const layer of template.colorLayers) layers[layer] = { background_color: color };

          const res  = await fetch(PLACID_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` },
            body:    JSON.stringify({ template_uuid: template.uuid, layers })
          });
          const data = await res.json();
          if (!res.ok) {
            console.error(`Placid ${templateId} error. UUID: ${template.uuid} Layers: ${JSON.stringify(layers)} Response: ${JSON.stringify(data)}`);
            throw new Error(`Placid error for ${templateId}: ${data.message}`);
          }
          return { templateId, name: template.name, imageId: data.id, imageUrl: data.image_url || null };
        })
      );
      return ok200({ renders: results });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: poll-all ───────────────────────────────────
  // Poll multiple imageIds at once, return status of each
  if (action === 'poll-all') {
    const { imageIds } = body; // array of {templateId, imageId}
    if (!imageIds || !imageIds.length) return err('imageIds required.', 400);
    try {
      const results = await Promise.all(
        imageIds.map(async ({ templateId, imageId }) => {
          const res  = await fetch(`https://api.placid.app/api/rest/images/${imageId}`, {
            headers: { 'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}` }
          });
          const data = await res.json();
          return {
            templateId,
            ready:    data.status === 'finished' && !!data.image_url,
            imageUrl: data.image_url || null,
            status:   data.status
          };
        })
      );
      return ok200({ renders: results });
    } catch (e) {
      return err(e.message);
    }
  }

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
      const keyword = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS.office;
      const page    = Math.max(1, parseInt(body.page) || 1);
      const params  = new URLSearchParams({
        query:       keyword,
        orientation: 'portrait',
        per_page:    '4',
        page:        page,
        client_id:   process.env.UNSPLASH_ACCESS_KEY
      });
      const res  = await fetch(`${UNSPLASH_API}?${params}`);
      const data = await res.json();
      if (!data.results || data.results.length === 0) return err('No photos found for this industry.');

      // Return 4 varied results — thumbnail for display, regular for generation
      const photos = data.results.map(p => ({
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

  // ── ACTION: website-photos ─────────────────────────────
  // Extracts images from the prospect's website via extract.pics API
  // Filters to images >= 1000px wide, returns up to 12
  if (action === 'website-photos') {
    const { websiteUrl } = body;
    if (!websiteUrl) return err('websiteUrl required.', 400);
    try {
      // Start extraction
      const startRes  = await fetch('https://api.extract.pics/v0/extractions', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXTRACT_API}`,
          'Content-Type':  'application/json'
        },
        body: JSON.stringify({ url: websiteUrl })
      });
      const startData = await startRes.json();
      if (!startRes.ok) return err(startData.message || 'Could not start extraction.');
      const id = startData.data.id;

      // Poll until done (max 20 seconds)
      let images = [];
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes  = await fetch(`https://api.extract.pics/v0/extractions/${id}`, {
          headers: { 'Authorization': `Bearer ${process.env.EXTRACT_API}` }
        });
        const pollData = await pollRes.json();
        if (pollData.data.status === 'done') {
          images = pollData.data.images || [];
          console.log(`extract.pics: ${images.length} images found before filtering`);
          break;
        }
        if (pollData.data.status === 'error') return err('Image extraction failed.');
      }

      // Filter using extract.pics recommended logic + our size threshold
      const seen = new Set();
      const filtered = images
        .filter(img => {
          if (!img.url || seen.has(img.url)) return false;

          const url = img.url.toLowerCase();
          const alt = (img.alt || '').toLowerCase();
          const w   = img.width  || 0;
          const h   = img.height || 0;

          // Skip SVGs
          if (url.endsWith('.svg')) return false;

          // 1. Keyword check — skip logos, icons, favicons
          if (url.includes('logo') || url.includes('icon') || url.includes('favicon') ||
              url.includes('brand') || alt.includes('logo') || alt.includes('icon') ||
              alt.includes('favicon')) return false;

          // 2. Size — skip if we know it's small (< 200px either dimension)
          if (w > 0 && w < 200) return false;
          if (h > 0 && h < 200) return false;

          // 3. Aspect ratio — skip perfect squares (icons/badges) and extreme banners
          if (w > 0 && h > 0) {
            if (w === h) return false;                    // perfect square
            const ratio = w / h;
            if (ratio > 4 || ratio < 0.25) return false; // extreme banner or tall sliver
          }

          seen.add(img.url);
          return true;
        })
        .slice(0, 4)
        .map(img => ({
          url:    img.url,
          thumb:  img.url,
          width:  img.width,
          height: img.height,
          alt:    img.alt || img.url.split('/').pop() || 'Website photo'
        }));

      return ok200({ photos: filtered });
    } catch (e) {
      return err(e.message);
    }
  }

  // ── ACTION: proxy-logo ─────────────────────────────────
  // Fetches a logo URL server-side to bypass browser CORS restrictions
  if (action === 'proxy-logo') {
    const { logoUrl } = body;
    if (!logoUrl) return err('logoUrl required.', 400);
    try {
      const res = await fetch(logoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FirstImpression/1.0)' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) return err(`Could not fetch logo (${res.status}).`);
      const contentType = res.headers.get('content-type') || 'image/png';
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return ok200({ dataUrl: `data:${contentType};base64,${base64}` });
    } catch (e) {
      return err('Could not fetch logo from that URL. Check the address and try again.');
    }
  }

  // ── ACTION: start (phase 1 — Unsplash + kick off Placid) ─
  if (action === 'start') {
    const { templateId, brandColor, logoUrl, industry } = body;
    if (!brandColor) return err('brandColor required.', 400);
    if (!logoUrl)    return err('logoUrl required.', 400);

    try {
      // logo is always a URL — file uploads are sent as base64 via the start action directly
      const resolvedLogoUrl = logoUrl;

      // Use pre-selected photo if provided, otherwise fetch from Unsplash
      const photoUrl   = body.photoUrl || await getPhoto(industry || 'generic');
      const template = TEMPLATES[templateId || 'chevron'];
      if (!template) return err('Unknown template.', 400);

      const hex8 = brandColor.replace('#', '').padEnd(6,'0').slice(0,6).toUpperCase() + 'FF';
      const color = '#' + hex8;
      const layers = { photo: { image: photoUrl } };
      if (resolvedLogoUrl) layers.logo = { image: resolvedLogoUrl };
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
    const { imageUrl, companyName, brandColor, apiKey, tenantUrl } = body;
    if (!apiKey || !tenantUrl) return err('Salesbuildr credentials required.', 401);
    if (!imageUrl)             return err('imageUrl required.', 400);

    const zones    = buildOverlayZones(brandColor || '#1a1a1a');
    const name     = companyName ? `${companyName} – Cover Page` : 'Cover Page';
    const sbUrl    = `${tenantUrl.replace(/\/$/, '')}/public-api/quote-widget-template`;

    try {
      const res = await fetch(sbUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
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
