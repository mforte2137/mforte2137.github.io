// =========================================================
// scrape-quote.js — Netlify function
// Path: /api/scrape-quote
//
// Accepts POST { url }
// Uses ScrapingBee to fully render the Salesbuildr quote
// page (JavaScript SPA) and returns extracted plain text
// for analysis by /api/analyze.
//
// ScrapingBee renders JavaScript pages server-side so we
// get the full quote content, not just the HTML shell.
// =========================================================

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'POST required.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON in request body.' })
    };
  }

  const { url } = body;
  if (!url || !url.trim()) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'A URL is required.' })
    };
  }

  // Basic sanity check — must look like a Salesbuildr quote link
  if (!url.includes('salesbuildr.com')) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'URL must be a Salesbuildr quote link (e.g. https://portal.us1-salesbuildr.com/quote/...).'
      })
    };
  }

  const apiKey = process.env.SCRAPING_BEE_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'ScrapingBee API key is not configured.' })
    };
  }

  try {
    // wait=4000 gives the SPA time to fully render its content
    const scrapeUrl = new URL('https://app.scrapingbee.com/api/v1/');
    scrapeUrl.searchParams.set('api_key',   apiKey);
    scrapeUrl.searchParams.set('url',       url.trim());
    scrapeUrl.searchParams.set('render_js', 'true');
    scrapeUrl.searchParams.set('wait',      '4000');

    const response = await fetch(scrapeUrl.toString());

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: `ScrapingBee returned status ${response.status}.`,
          details: errText.slice(0, 300)
        })
      };
    }

    const html  = await response.text();
    const text  = extractText(html);
    const pages = Math.max(1, Math.round((text.match(/\S+/g) || []).length / 350));

    if (text.length < 200) {
      return {
        statusCode: 422,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: 'Not enough text could be extracted from the quote page. ' +
                 'Make sure the link includes the ?key= parameter and is publicly shareable.'
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ ok: true, text, pages })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Scraping failed: ' + err.message })
    };
  }
};

// Strip HTML tags and clean up whitespace to produce
// plain text suitable for Claude analysis.
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,  ' ')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi,       ' ')
    .replace(/<[^>]+>/g,   ' ')
    .replace(/&amp;/g,     '&')
    .replace(/&lt;/g,      '<')
    .replace(/&gt;/g,      '>')
    .replace(/&quot;/g,    '"')
    .replace(/&#39;/g,     "'")
    .replace(/&nbsp;/g,    ' ')
    .replace(/&#x27;/g,    "'")
    .replace(/[ \t]+/g,    ' ')
    .replace(/ *\n */g,    '\n')
    .replace(/\n{3,}/g,    '\n\n')
    .trim();
}
