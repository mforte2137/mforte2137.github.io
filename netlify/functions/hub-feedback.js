// netlify/functions/hub-feedback.js
// Receives MSP Tools Hub feedback and emails it to mike@salesbuildr.com via Resend

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const { tool, type, message, name, email, submittedAt } = body;

  if (!message || !message.trim()) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Message is required.' }) };
  }

  const date = new Date(submittedAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short'
  });

  const toolLabel = tool || 'General (no tool selected)';
  const typeLabel = type || 'General';
  const nameLabel = name || '';
  const emailLabel = email || '';
  const hasContact = nameLabel || emailLabel;

  // Plain text
  const emailText = `MSP Tools Hub — Feedback
========================
Tool:    ${toolLabel}
Type:    ${typeLabel}
Date:    ${date}${hasContact ? `
Name:    ${nameLabel || '(not provided)'}
Email:   ${emailLabel || '(not provided)'}` : ''}

MESSAGE
${message}
`;

  // HTML
  const htmlEmail = `
<div style="font-family:'Inter',system-ui,sans-serif;font-size:13px;color:#0B0E14;max-width:580px;margin:0 auto;">
  <div style="background:#0B0E14;color:#FAFAF7;padding:14px 20px;margin-bottom:24px;">
    <strong style="font-family:'Space Grotesk',sans-serif;font-size:15px;">MSP Tools Hub — Feedback</strong>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">
    <tr>
      <td style="padding:5px 0;color:#9CA3AF;width:80px;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Tool</td>
      <td style="padding:5px 0;"><strong>${toolLabel}</strong></td>
    </tr>
    ${hasContact ? `<tr>
      <td style="padding:5px 0;color:#9CA3AF;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">From</td>
      <td style="padding:5px 0;">${nameLabel || ''}${nameLabel && emailLabel ? ' — ' : ''}${emailLabel ? `<a href="mailto:${emailLabel}" style="color:#2E74DC;">${emailLabel}</a>` : ''}</td>
    </tr>` : ''}
    <tr>
      <td style="padding:5px 0;color:#9CA3AF;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Type</td>
      <td style="padding:5px 0;">
        <span style="display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;font-family:'JetBrains Mono',monospace;background:#DCFCE7;color:#166534;">${typeLabel}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 0;color:#9CA3AF;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Date</td>
      <td style="padding:5px 0;">${date}</td>
    </tr>
  </table>
  <div style="margin-bottom:8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;">Message</div>
  <div style="background:#F5F5F2;border-left:3px solid #2E74DC;padding:12px 16px;font-size:13px;line-height:1.6;white-space:pre-wrap;">${message}</div>
</div>`;

  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'MSP Tools Hub <onboarding@resend.dev>',
        to:   ['mike@salesbuildr.com'],
        subject: `Hub Feedback — ${typeLabel}: ${toolLabel}`,
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
