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
    name, company, sections, sources, rankOrder,
    missingAction, timecost, onething, suggestions, microSummary,
    viewedCustomer, submittedAt
  } = body;

  const from   = [name, company].filter(Boolean).join(' — ') || 'Anonymous reviewer';
  const date   = new Date(submittedAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short'
  });

  // Plain text version
  const sectionBlock  = sections?.length   ? sections.map(s => `  • ${s}`).join('\n')  : '  (none selected)';
  const sourceBlock   = sources?.length    ? sources.map(s  => `  • ${s}`).join('\n')  : '  (none selected)';
  const rankBlock     = rankOrder?.length  ? rankOrder.map((r,i) => `  ${i+1}. ${r}`).join('\n') : '  (not ranked)';

  const emailText = `Customer Growth Operating System — Beta Feedback
================================================
From:     ${from}
Viewed:   ${viewedCustomer}
Date:     ${date}

MOST USEFUL SECTIONS
${sectionBlock}

DATA SOURCES THAT MATTER MOST
${sourceBlock}

FEATURE PRIORITY RANKING
${rankBlock}

SECTION RATINGS (micro-feedback)
  ${microSummary || '(none recorded)'}

MISSING ACTION FROM CURRENT QBR PROCESS
  ${missingAction || '(no answer)'}

MOST TIME-CONSUMING PART OF PREPARING FOR REVIEWS
  ${timecost || '(no answer)'}

THE ONE THING THEY WISH THEY KNEW ABOUT EVERY CUSTOMER
  ${onething || '(no answer)'}

WHAT WOULD YOU ADD OR CHANGE?
  ${suggestions || '(no answer)'}
`;

  // HTML version
  const section = (label, content) => `
  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;font-family:'Courier New',monospace;margin-bottom:6px;text-transform:uppercase;">${label}</div>
    <div style="background:#f5f2eb;padding:10px 12px;border-left:2px solid #c8c4bb;font-size:12px;white-space:pre-wrap;line-height:1.6;">${content || '(no answer)'}</div>
  </div>`;

  const pillList = (items) => items?.length
    ? items.map(i => `<span style="display:inline-block;font-size:10px;padding:2px 8px;border:1px solid #c8c4bb;margin:2px;font-family:'Courier New',monospace;">${i}</span>`).join('')
    : '<span style="color:#9e9b95;font-size:12px;">(none selected)</span>';

  const rankHtml = rankOrder?.length
    ? rankOrder.map((r,i) => `<div style="padding:4px 8px;border-bottom:1px solid #dedad3;font-size:12px;font-family:'Courier New',monospace;"><strong>${i+1}.</strong> ${r}</div>`).join('')
    : '<div style="color:#9e9b95;font-size:12px;padding:4px 0;">(not ranked)</div>';

  const htmlEmail = `
<div style="font-family:'Courier New',monospace;font-size:13px;color:#1a1917;max-width:620px;margin:0 auto;">
  <div style="background:#1a1917;color:#f5f2eb;padding:16px 20px;margin-bottom:24px;">
    <strong>Customer Growth Operating System — Beta Feedback</strong>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <tr><td style="padding:4px 0;color:#6b6860;width:120px;">From</td><td style="padding:4px 0;"><strong>${from}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#6b6860;">Viewed</td><td style="padding:4px 0;">${viewedCustomer}</td></tr>
    <tr><td style="padding:4px 0;color:#6b6860;">Submitted</td><td style="padding:4px 0;">${date}</td></tr>
  </table>

  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;margin-bottom:8px;text-transform:uppercase;">Most Useful Sections</div>
    <div>${pillList(sections)}</div>
  </div>

  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;margin-bottom:8px;text-transform:uppercase;">Data Sources That Matter Most</div>
    <div>${pillList(sources)}</div>
  </div>

  <div style="margin-bottom:18px;">
    <div style="font-size:10px;letter-spacing:0.1em;color:#6b6860;margin-bottom:8px;text-transform:uppercase;">Feature Priority Ranking</div>
    <div style="border:1px solid #dedad3;">${rankHtml}</div>
  </div>

  ${microSummary ? section('Section Ratings (micro-feedback)', microSummary) : ''}
  ${section('Missing Action From Current QBR Process', missingAction)}
  ${section('Most Time-Consuming Part of Preparing for Reviews', timecost)}
  ${section('The One Thing They Wish They Knew About Every Customer', onething)}
  ${section('What Would You Add or Change?', suggestions)}
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
