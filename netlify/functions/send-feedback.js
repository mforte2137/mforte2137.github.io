// netlify/functions/send-feedback.js
// Receives CGOS beta feedback and emails it to mike@salesbuildr.com via Resend

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'POST required.' }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON.' }) }; }

  const {
    name, company, actions, sources,
    investigate, timecost, problem, autoassemble, onething,
    viewedCustomer, submittedAt
  } = body;

  const from   = [name, company].filter(Boolean).join(' — ') || 'Anonymous reviewer';
  const date   = new Date(submittedAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short'
  });

  const actionBlock      = actions?.length    ? actions.map(a  => `  • ${a}`).join('\n')  : '  (none selected)';
  const sourceBlock      = sources?.length    ? sources.map(s  => `  • ${s}`).join('\n')  : '  (none selected)';
  const investigateText  = investigate        || '(no answer)';
  const timecostText     = timecost           || '(no answer)';
  const problemText      = problem            || '(no answer)';
  const autoassembleText = autoassemble       || '(no answer)';
  const onethingText     = onething           || '(no answer)';

  const emailText = `Customer Growth Operating System — Beta Feedback
================================================
From:     ${from}
Viewed:   ${viewedCustomer}
Date:     ${date}

WHAT ACTIONS WOULD YOU WANT FROM HERE?
${actionBlock}

WHAT DATA SOURCES MATTER MOST?
${sourceBlock}

WHAT WOULD YOU INVESTIGATE FIRST?
  ${investigateText}

MOST TIME-CONSUMING PART OF PREPARING FOR REVIEWS?
  ${timecostText}

IF THIS EXISTED TOMORROW, WHAT PROBLEM WOULD IT SOLVE?
  ${problemText}

WHAT INFORMATION DO YOU WISH WAS AUTO-ASSEMBLED?
  ${autoassembleText}

THE ONE THING YOU WISH YOU KNEW ABOUT EVERY CUSTOMER?
  ${onethingText}
`;

  const section = (label, content) => `
  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;font-family:'Courier New',monospace;margin-bottom:6px;">${label}</div>
    <div style="background:#f5f2eb;padding:10px 12px;border-left:2px solid #c8c4bb;font-size:12px;white-space:pre-wrap;line-height:1.6;">${content}</div>
  </div>`;

  const pillList = (items) => items?.length
    ? items.map(i => `<span style="display:inline-block;font-size:10px;padding:2px 8px;border:1px solid #c8c4bb;margin:2px;font-family:'Courier New',monospace;">${i}</span>`).join('')
    : '<span style="color:#9e9b95;font-size:12px;">(none selected)</span>';

  const htmlEmail = `
<div style="font-family:'Courier New',monospace;font-size:13px;color:#1a1917;max-width:620px;margin:0 auto;">
  <div style="background:#1a1917;color:#f5f2eb;padding:16px 20px;margin-bottom:24px;">
    <strong>Customer Growth Operating System — Beta Feedback</strong>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:4px 0;color:#6b6860;width:100px;">From</td><td style="padding:4px 0;"><strong>${from}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#6b6860;">Viewed</td><td style="padding:4px 0;">${viewedCustomer}</td></tr>
    <tr><td style="padding:4px 0;color:#6b6860;">Submitted</td><td style="padding:4px 0;">${date}</td></tr>
  </table>

  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;margin-bottom:8px;">WHAT ACTIONS WOULD YOU WANT FROM HERE?</div>
    <div>${pillList(actions)}</div>
  </div>

  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;margin-bottom:8px;">WHAT DATA SOURCES MATTER MOST?</div>
    <div>${pillList(sources)}</div>
  </div>

  ${section('WHAT WOULD YOU INVESTIGATE FIRST?', investigateText)}
  ${section('MOST TIME-CONSUMING PART OF PREPARING FOR REVIEWS?', timecostText)}
  ${section('IF THIS EXISTED TOMORROW, WHAT PROBLEM WOULD IT SOLVE?', problemText)}
  ${section('WHAT INFORMATION DO YOU WISH WAS AUTO-ASSEMBLED?', autoassembleText)}
  ${section('THE ONE THING YOU WISH YOU KNEW ABOUT EVERY CUSTOMER?', onethingText)}
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
        from: 'CGOS Feedback <onboarding@resend.dev>',
        to:   ['mike@salesbuildr.com'],
        subject: `CGOS Beta Feedback — ${from}`,
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
