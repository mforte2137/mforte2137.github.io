exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) };
  }

  const { contributor, featureName, comment, name } = body;

  if (!contributor || !featureName || !comment) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'contributor, featureName, and comment are required.' })
    };
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Salesbuildr Showroom <onboarding@resend.dev>',
        to: ['mike@salesbuildr.com'],
        subject: `Showroom Feedback — ${contributor} — ${featureName}`,
        text: `From: ${name || 'Anonymous'}\n\nFeature: ${featureName}\nContributor: ${contributor}\n\nComment:\n${comment}`
      })
    });

    if (!resendRes.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Failed to send email.' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Failed to send email.' }) };
  }
};
