exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SLACK_BOT_TOKEN not set.' }) };
  }

  const ACKNOWLEDGEMENTS = [
    'looking into it',
    'let me check',
    'one moment',
    'give me a moment',
    'checking',
    'on it',
    'researching',
    'searching',
  ];

  try {
    const { message_ts, channel_id } = JSON.parse(event.body);
    if (!message_ts || !channel_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'message_ts and channel_id required.' }) };
    }

    // Strategy: wait 5s for bot to process acknowledgement, then poll every 3s
    // Total: 5s + (6 × 3s) = 23s — safely under 26s Netlify limit
    await new Promise(r => setTimeout(r, 5000));

    const maxAttempts = 6;
    const delayMs     = 3000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, delayMs));

      const threadRes = await fetch(
        `https://slack.com/api/conversations.replies?channel=${channel_id}&ts=${message_ts}&limit=20`,
        { headers: { 'Authorization': `Bearer ${slackToken}` } }
      );

      const threadData = await threadRes.json();
      if (!threadData.ok) continue;

      const botReply = (threadData.messages || []).find(m => {
        if (m.ts === message_ts) return false;
        if (!m.bot_id) return false;

        const cleaned = (m.text || '')
          .replace(/:[a-z0-9_+-]+:/g, '')
          .replace(/[^a-z ]/gi, '')
          .toLowerCase()
          .trim();

        if (ACKNOWLEDGEMENTS.some(ack => cleaned.includes(ack))) return false;
        if (cleaned.length < 30) return false;
        return true;
      });

      if (botReply) {
        let answer = botReply.text || '';
        const sourcesIdx = answer.search(/\n\*?Sources?:?\*?/i);
        if (sourcesIdx !== -1) answer = answer.slice(0, sourcesIdx).trim();

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer,
            thread_url: `https://salesbuildr.slack.com/archives/${channel_id}/p${message_ts.replace('.', '')}`
          })
        };
      }
    }

    // Timed out — return null so frontend can show KB answer only
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: null, thread_url: null })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
