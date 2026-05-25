/* ═══════════════════════════════════════════════════
   extract-brand.js  — Netlify Function
   Fetches a client website, uses Claude to extract
   dominant brand colors and logo URL.
   Place in:  netlify/functions/extract-brand.js
═══════════════════════════════════════════════════ */

const https = require('https');
const http  = require('http');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Fetch raw HTML from a URL (follows one redirect) */
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
      // Follow one redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchHTML(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

/* ── Strip HTML down to just the parts Claude needs ─
   Keeps: <style>, inline style attrs, <link> hrefs,
   <img> srcs, <svg> fills, meta tags.
   Discards: scripts, large blocks of content text.   */
function extractRelevantHTML(html, baseUrl) {
  // Pull out <head> section — richest source of brand info
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : '';

  // Pull inline <style> blocks
  const styles = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html)) !== null) styles.push(m[1].slice(0, 3000));

  // Pull <img> tags (first 20)
  const imgs = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgCount = 0;
  while ((m = imgRe.exec(html)) !== null && imgCount < 20) {
    imgs.push(m[1]); imgCount++;
  }

  // Pull SVG fill/stroke colors
  const svgColors = [];
  const svgRe = /(?:fill|stroke)=["']([^"']+)["']/gi;
  while ((m = svgRe.exec(html)) !== null) svgColors.push(m[1]);

  // Pull CSS custom properties / hex colors from all styles combined
  const allStyles = styles.join('\n');
  const hexColors = [...new Set((allStyles.match(/#[0-9a-fA-F]{3,6}\b/g) || []))].slice(0, 80);
  const cssVars   = [...new Set((allStyles.match(/--[\w-]+:\s*#[0-9a-fA-F]{3,6}/g) || []))].slice(0, 30);

  // Inline style hex colors from HTML
  const inlineHex = [...new Set((html.match(/(?:color|background)[^;'"]{0,20}#[0-9a-fA-F]{3,6}/gi) || []))].slice(0, 40);

  return {
    baseUrl,
    head:       head.slice(0, 2000),
    hexColors,
    cssVars,
    inlineHex,
    svgColors:  [...new Set(svgColors)].slice(0, 20),
    imgSrcs:    imgs,
  };
}

/* ── Resolve a possibly-relative URL against a base ─ */
function resolveUrl(src, base) {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

/* ─────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────── */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let url;
  try {
    const body = JSON.parse(event.body || '{}');
    url = body.url;
    if (!url) throw new Error('No URL provided');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: err.message }) };
  }

  try {
    // 1. Fetch the website HTML
    const html = await fetchHTML(url);

    // 2. Extract relevant fragments
    const extracted = extractRelevantHTML(html, url);

    // 3. Ask Claude to identify brand colors and logo
    const prompt = `You are a brand color extraction specialist. Analyse the following data extracted from a company website and identify:

1. The PRIMARY brand color (the most dominant, intentional brand color — usually used for buttons, headings, nav backgrounds, or key UI elements). Return as a hex code.
2. A SECONDARY brand color if clearly present (accent, highlight, or complementary color). Return as hex or null.
3. The most likely LOGO IMAGE URL from the img src list — look for filenames containing "logo", "brand", or the company name, or SVGs in the header area. Resolve relative URLs against the base URL. Return as a full URL or null.

Base URL: ${extracted.baseUrl}

CSS hex colors found (most likely brand colors): ${extracted.hexColors.join(', ')}
CSS custom properties: ${extracted.cssVars.join(', ')}
Inline style colors: ${extracted.inlineHex.join(', ')}
SVG fill/stroke values: ${extracted.svgColors.join(', ')}
Image src URLs: ${extracted.imgSrcs.join('\n')}

Head HTML snippet:
${extracted.head}

Rules:
- Ignore very light colors (near white: #f0f0f0 and above) and very dark (near black: #111111 and below) unless they are clearly the only brand color
- Ignore grey shades unless clearly intentional brand greys
- Prefer colors that appear multiple times
- For the logo URL, prefer PNG or SVG over JPG, prefer transparent-background images
- Return ONLY valid JSON, no explanation, no markdown:
{
  "primaryColor": "#xxxxxx",
  "secondaryColor": "#xxxxxx or null",
  "logoUrl": "https://... or null",
  "confidence": "high|medium|low",
  "notes": "one short sentence explaining your choices"
}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim();

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```json|^```|```$/gm, '').trim();
    const result = JSON.parse(clean);

    // Resolve logo URL if relative
    if (result.logoUrl) {
      result.logoUrl = resolveUrl(result.logoUrl, url);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (err) {
    console.error('extract-brand error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Extraction failed' }),
    };
  }
};
