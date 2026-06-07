// netlify/functions/send-feedback.js
// Receives QBR demo feedback and emails it to mike@salesbuildr.com via Resend
// POST /api/send-feedback
// Env var required: RESEND_API_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { name, company, actions, sources, freeform, rating, viewedCustomer, submittedAt } = body;

  // Build plain-text email body
  const from    = [name, company].filter(Boolean).join(' — ') || 'Anonymous reviewer';
  const date    = new Date(submittedAt || Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });

  const actionBlock  = actions && actions.length  ? actions.map(a => `  • ${a}`).join('\n')  : '  (none selected)';
  const sourceBlock  = sources && sources.length  ? sources.map(s => `  • ${s}`).join('\n')  : '  (none selected)';
  const freeformText = freeform || '(no comment)';
  const ratingText   = rating   || '(not rated)';

  const emailText = `QBR Intelligence — Beta Feedback
================================
From:     ${from}
Customer viewed: ${viewedCustomer}
Submitted: ${date}

OVERALL REACTION
${ratingText}

ACTIONS THEY'D WANT TO TAKE
${actionBlock}

DATA SOURCES THAT MATTER MOST
${sourceBlock}

FREEFORM THOUGHTS
${freeformText}
`;

  const htmlEmail = `
<div style="font-family: 'Courier New', monospace; font-size: 13px; color: #1a1917; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1917; color: #f5f2eb; padding: 16px 20px; margin-bottom: 24px;">
    <strong>QBR Intelligence — Beta Feedback</strong>
  </div>

  <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
    <tr><td style="padding:4px 0; color:#6b6860; width:140px;">From</td><td style="padding:4px 0;"><strong>${from}</strong></td></tr>
    <tr><td style="padding:4px 0; color:#6b6860;">Customer viewed</td><td style="padding:4px 0;">${viewedCustomer}</td></tr>
    <tr><td style="padding:4px 0; color:#6b6860;">Submitted</td><td style="padding:4px 0;">${date}</td></tr>
    <tr><td style="padding:4px 0; color:#6b6860;">Overall rating</td><td style="padding:4px 0;">${ratingText}</td></tr>
  </table>

  <div style="margin-bottom:20px;">
    <div style="font-size:10px; letter-spacing:0.1em; color:#6b6860; margin-bottom:8px;">ACTIONS THEY'D WANT TO TAKE</div>
    ${actions && actions.length ? actions.map(a => `<div style="padding:3px 0; padding-left:12px; border-left:2px solid #dedad3;">${a}</div>`).join('') : '<div style="color:#9e9b95;">(none selected)</div>'}
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:10px; letter-spacing:0.1em; color:#6b6860; margin-bottom:8px;">DATA SOURCES THAT MATTER MOST</div>
    ${sources && sources.length ? sources.map(s => `<div style="padding:3px 0; padding-left:12px; border-left:2px solid #dedad3;">${s}</div>`).join('') : '<div style="color:#9e9b95;">(none selected)</div>'}
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:10px; letter-spacing:0.1em; color:#6b6860; margin-bottom:8px;">FREEFORM THOUGHTS</div>
    <div style="background:#f5f2eb; padding:12px; border-left:2px solid #c8c4bb; white-space:pre-wrap;">${freeformText}</div>
  </div>
</div>`;

  // Send via Resend
  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'QBR Intel Feedback <feedback@widgetcreator.netlify.app>',
        to:   ['mike@salesbuildr.com'],
        subject: `QBR Demo Feedback — ${from}`,
        text: emailText,
        html: htmlEmail
      })
    });
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: 'Could not reach Resend API.' }) };
  }

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    return { statusCode: 502, body: JSON.stringify({ ok: false, error: `Resend error ${resendRes.status}`, detail: errBody }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};
