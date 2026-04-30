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

const PLACID_TEMPLATE = 'o1dobplzksihm';
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
    const response = await fetch(PLACID_API, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        template_uuid: PLACID_TEMPLATE,
        layers: {
          photo:       { image:      TEST_PHOTO  },
          brand_color: { background: TEST_COLOR  },
          logo:        { image:      TEST_LOGO   }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: `Placid returned ${response.status}`, details: data })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ok:       true,
        imageUrl: data.image_url || data.url,
        status:   data.status,
        full:     data
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
