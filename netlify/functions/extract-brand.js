/* ═══════════════════════════════════════════════════
   extract-brand.js  — Netlify Function
   Two endpoints in one:
     POST { url }           → extract brand colors + logo URL
     POST { proxyUrl }      → fetch image bytes and return as base64
   Place in:  netlify/functions/extract-brand.js
═══════════════════════════════════════════════════ */

const https = require('https');
const http  = require('http');

/* ── Plain https POST to Anthropic API ──────────── */
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return reject(new Error('No Claude API key configured'));

    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(new Error('Failed to parse Claude response'));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/* ── Fetch raw HTML (follows one redirect) ──────── */
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandExtractor/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    }, res => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from target site`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; if (body.length > 500000) { req.destroy(); resolve(body); } });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

/* ── Extract brand-relevant data from raw HTML ───── */
function extractRelevantHTML(html, baseUrl) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : '';

  const styles = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html)) !== null) styles.push(m[1].slice(0, 3000));

  const imgs = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
  let imgCount = 0;
  while ((m = imgRe.exec(html)) !== null && imgCount < 25) {
    imgs.push(m[1]); imgCount++;
  }

  const svgColors = [];
  const svgRe = /(?:fill|stroke)=["']([^"'#none]{0,30})["']/gi;
  while ((m = svgRe.exec(html)) !== null) svgColors.push(m[1]);

  const allStyles = styles.join('\n');
  const hexColors = [...new Set((allStyles.match(/#[0-9a-fA-F]{3,6}\b/g) || []))].slice(0, 80);
  const cssVars   = [...new Set((allStyles.match(/--[\w-]+:\s*#[0-9a-fA-F]{3,6}/g) || []))].slice(0, 30);
  const inlineHex = [...new Set((html.match(/(?:color|background)[^;'"]{0,20}#[0-9a-fA-F]{3,6}/gi) || []))].slice(0, 40);

  return { baseUrl, head: head.slice(0, 2000), hexColors, cssVars, inlineHex,
           svgColors: [...new Set(svgColors)].slice(0, 20), imgSrcs: imgs };
}

function resolveUrl(src, base) {
  try { return new URL(src, base).href; } catch { return src; }
}

/* ── Fetch image bytes and return as base64 data URL ─ */
function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandExtractor/1.0)',
        'Accept': 'image/*,*/*',
      },
      timeout: 10000,
    }, res => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const contentType = res.headers['content-type'] || 'image/png';
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const b64 = buffer.toString('base64');
        resolve({ dataUrl: `data:${contentType};base64,${b64}`, contentType });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/* ─────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────── */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  // ── Route: image proxy ─────────────────────────
  if (body.proxyUrl) {
    try {
      const { dataUrl } = await fetchImageAsBase64(body.proxyUrl);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      };
    } catch (err) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
  }

  // ── Route: brand extraction ────────────────────
  let url;
  try {
    url = (body.url || '').trim();
    if (!url) throw new Error('No URL provided');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }

  try {
    const html      = await fetchHTML(url);
    const extracted = extractRelevantHTML(html, url);

    const prompt = `You are a brand color extraction specialist. Analyse the following data extracted from a company website and identify:

1. The PRIMARY brand color (dominant intentional brand color — buttons, headings, nav backgrounds, key UI elements). Return as a 6-digit hex code.
2. A SECONDARY brand color if clearly present (accent, highlight, complementary). Return as 6-digit hex or null.
3. The most likely LOGO IMAGE URL — look for filenames containing "logo", "brand", or the company name, or SVGs in the header. Return as full absolute URL or null.

Base URL: ${extracted.baseUrl}

CSS hex colors found: ${extracted.hexColors.join(', ')}
CSS custom properties: ${extracted.cssVars.join(', ')}
Inline style colors: ${extracted.inlineHex.join(', ')}
SVG fill/stroke values: ${extracted.svgColors.join(', ')}
Image src URLs:
${extracted.imgSrcs.join('\n')}

Head HTML:
${extracted.head}

Rules:
- Ignore near-white (#f0f0f0 and lighter) and near-black (#111111 and darker) unless clearly the only brand color
- Ignore generic greys unless clearly intentional
- Prefer colors appearing multiple times
- For logo: prefer PNG or SVG, prefer transparent-background images, resolve relative URLs against the Base URL
- Return ONLY valid JSON with no markdown fences or explanation:
{"primaryColor":"#xxxxxx","secondaryColor":"#xxxxxx or null","logoUrl":"https://... or null","confidence":"high|medium|low","notes":"one sentence"}`;

    const raw    = await callClaude(prompt);
    const clean  = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    if (result.logoUrl) result.logoUrl = resolveUrl(result.logoUrl, url);

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error('extract-brand error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Extraction failed' }) };
  }
};
