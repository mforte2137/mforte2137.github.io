// =========================================================
// test-image-widget.js — Netlify function (TEMPORARY)
// Path: /api/test-image-widget
//
// Tests whether Salesbuildr's image widget accepts an
// external URL as the image source, or whether it requires
// uploading to Salesbuildr's own storage first.
//
// Tries three approaches and reports back what works:
//   A — Direct external HTTPS URL
//   B — Unsplash direct image URL
//   C — Content widget with <img> tag pointing to external URL
//
// DELETE after testing.
// =========================================================

const BASE = 'https://portal.us1-salesbuildr.com/public-api/quote-widget-template';

// A real Unsplash photo (tech/office theme, no API key needed for direct URL)
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80';

exports.handler = async (event) => {
  const apiKey         = process.env.SALESBUILDR_API_KEY;
  const integrationKey = process.env.SALESBUILDR_INTEGRATION_KEY;

  if (!apiKey || !integrationKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'API keys not configured.' })
    };
  }

  const headers = {
    'Content-Type':    'application/json',
    'api-key':         apiKey,
    'integration-key': integrationKey
  };

  const results = {};

  // ── Test A: image widget with external URL as ref ─────────
  try {
    const resA = await fetch(BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'TEST-A — External URL image widget (delete me)',
        widget: {
          type:       'image',
          hidden:     false,
          locked:     false,
          attachments: [],
          image: {
            ref:       TEST_IMAGE_URL,
            source:    TEST_IMAGE_URL,
            mediaType: 'image'
          },
          topTemplate:    '<p style="color:#ffffff;font-size:24pt;text-align:center;padding:40px;font-family:sans-serif;">Test A — External URL</p>',
          middleTemplate: null,
          bottomTemplate: null
        },
        order: 999
      })
    });
    const dataA = await resA.json();
    results.testA = {
      description: 'image widget with external URL as ref/source',
      status:      resA.status,
      ok:          resA.ok,
      response:    resA.ok ? { id: dataA.id, name: dataA.name } : dataA
    };
  } catch (err) {
    results.testA = { description: 'image widget with external URL', error: err.message };
  }

  // ── Test B: content widget with background-image CSS ─────
  try {
    const resB = await fetch(BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'TEST-B — Content widget background-image (delete me)',
        widget: {
          type:             'content',
          hidden:           false,
          locked:           false,
          attachments:      [],
          backgroundColor:  null,
          pageBreak:        false,
          contentTemplate:  `<div style="width:100%;height:800px;background-image:url('${TEST_IMAGE_URL}');background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:40px;">
            <h1 style="color:#ffffff;font-size:32pt;font-family:sans-serif;text-shadow:0 2px 8px rgba(0,0,0,0.5);">Test B — CSS background-image</h1>
          </div>`
        },
        order: 998
      })
    });
    const dataB = await resB.json();
    results.testB = {
      description: 'content widget with background-image CSS pointing to external URL',
      status:      resB.status,
      ok:          resB.ok,
      response:    resB.ok ? { id: dataB.id, name: dataB.name } : dataB
    };
  } catch (err) {
    results.testB = { description: 'content widget with CSS background', error: err.message };
  }

  // ── Test C: items widget with <img> tag ───────────────────
  try {
    const resC = await fetch(BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'TEST-C — Items widget with img tag (delete me)',
        widget: {
          type:             'items',
          hidden:           false,
          locked:           false,
          attachments:      [],
          showProductImage: false,
          products:         [],
          choice:           null,
          showSubtotal:     false,
          titleTemplate:    'Test C',
          contentTemplate:  `<div style="position:relative;width:100%;min-height:600px;overflow:hidden;">
            <img src="${TEST_IMAGE_URL}" style="width:100%;height:600px;object-fit:cover;display:block;" />
            <div style="position:absolute;bottom:0;left:0;right:0;padding:40px;background:linear-gradient(transparent,rgba(0,0,0,0.7));">
              <h1 style="color:#ffffff;font-size:28pt;font-family:sans-serif;margin:0;">Test C — img tag external URL</h1>
              <p style="color:#ffffff;font-family:sans-serif;margin:8px 0 0;">{{company.name}} · {{owner.fullName}}</p>
            </div>
          </div>`
        },
        order: 997
      })
    });
    const dataC = await resC.json();
    results.testC = {
      description: 'items widget with <img> tag pointing to external URL (also tests variable rendering)',
      status:      resC.status,
      ok:          resC.ok,
      response:    resC.ok ? { id: dataC.id, name: dataC.name } : dataC
    };
  } catch (err) {
    results.testC = { description: 'items widget with img tag', error: err.message };
  }

  // ── Summary ───────────────────────────────────────────────
  const passed = Object.entries(results).filter(([, v]) => v.ok).map(([k]) => k);
  const failed = Object.entries(results).filter(([, v]) => !v.ok).map(([k]) => k);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      summary: {
        passed,
        failed,
        recommendation: passed.length > 0
          ? `Use approach ${passed[0].replace('test', '').toUpperCase()} — full automated flow is possible`
          : 'All external URL approaches failed — image must be uploaded to Salesbuildr storage first'
      },
      results
    }, null, 2)
  };
};
