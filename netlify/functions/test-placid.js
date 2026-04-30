// =========================================================
// test-placid.js — Netlify function (TEMPORARY)
// Path: /api/test-placid
//
// Tests the Placid API with the CoverPage template using:
//   - A real Unsplash photo (office/tech)
//   - A test brand colour (Salesbuildr blue)
//   - A test logo (Salesbuildr logo from their site)
//
// If the response includes an image URL, open it to see
// the rendered cover page. Tweak the template in Placid
// if anything looks off, then delete this function.
// =========================================================

const PLACID_TEMPLATE = 'vpbjjbo7ymmowci1diwnnd7cplidafpy';
const PLACID_API      = 'https://api.placid.app/api/rest/images';

// Test values — replace with real prospect data in the full app
const TEST_PHOTO  = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80'; // modern office
const TEST_COLOR  = '#1a4da0';  // deep blue
const TEST_LOGO   = 'https://www.salesbuildr.com/images/salesbuildr.png';

exports.handler = async (event) => {
  const token = process.env.PLACID_API_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'PLACID_API_TOKEN not set in Netlify.' })
    };
  }

  try {
    // Step 1: List all templates accessible with this token
    const listRes  = await fetch('https://api.placid.app/api/rest/templates', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();

    if (!listRes.ok) {
      return {
        statusCode: listRes.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: `Token rejected — Placid returned ${listRes.status}`, details: listData })
      };
    }

    // Return the list so we can see which templates are accessible
    const templates = Array.isArray(listData)
      ? listData.map(t => ({ uuid: t.uuid, title: t.title, status: t.status }))
      : listData;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok:               true,
        templateCount:    Array.isArray(templates) ? templates.length : '?',
        ourTemplateUuid:  PLACID_TEMPLATE,
        uuidFound:        Array.isArray(templates) && templates.some(t => t.uuid === PLACID_TEMPLATE),
        templates
      }, null, 2)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
