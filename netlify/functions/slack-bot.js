exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SLACK_BOT_TOKEN not set.' }) };
  }

  const CHANNEL_ID  = 'C0B4KND7RR8'; // #questions-slack-bot
  const BOT_USER_ID = 'U0921CTNKLG'; // @Internal Questions Bot

  try {
    const { question } = JSON.parse(event.body);
    if (!question) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No question provided.' }) };
    }

    // ── Step 1: Post question to #questions-slack-bot ─────────────────────
    const postRes = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json; charset=utf-8',
        'Authorization': `Bearer ${slackToken}`
      },
      body: JSON.stringify({
        channel: CHANNEL_ID,
        text:    `<@${BOT_USER_ID}> ${question}`
      })
    });

    const postData = await postRes.json();

    if (!postData.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Slack post failed: ${postData.error}` })
      };
    }

    const messageTs = postData.ts;

    // ── Step 2: Poll for bot reply in thread (up to 20 seconds) ──────────
    const maxAttempts = 12;
    const delayMs     = 2500;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, delayMs));

      const threadRes = await fetch(
        `https://slack.com/api/conversations.replies?channel=${CHANNEL_ID}&ts=${messageTs}&limit=10`,
        { headers: { 'Authorization': `Bearer ${slackToken}` } }
      );

      const threadData = await threadRes.json();

      if (!threadData.ok) continue;

      // Find a substantive reply from the bot — ignore short acknowledgements
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

      const botReply = (threadData.messages || []).find(m => {
        if (m.ts === messageTs) return false;
        if (!m.bot_id) return false;
        // Strip Slack emoji codes (:emoji_name:) then clean to plain text
        const cleaned = (m.text || '')
          .replace(/:[a-z0-9_+-]+:/g, '')  // remove :emoji_name: codes
          .replace(/[^a-z ]/gi, '')
          .toLowerCase()
          .trim();
        // Skip if it matches a known acknowledgement phrase
        if (ACKNOWLEDGEMENTS.some(ack => cleaned.includes(ack))) return false;
        // Skip if remaining text is very short after stripping emoji
        if (cleaned.length < 30) return false;
        return true;
      });

      if (botReply) {
        // Strip the Sources section — internal doc paths shouldn't reach the customer reply
        let answer = botReply.text || '';
        const sourcesIdx = answer.search(/\n\*?Sources?:?\*?/i);
        if (sourcesIdx !== -1) answer = answer.slice(0, sourcesIdx).trim();

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer,
            thread_url: `https://salesbuildr.slack.com/archives/${CHANNEL_ID}/p${messageTs.replace('.', '')}`
          })
        };
      }
    }

    // Timed out — bot didn't reply in time
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer:     null,
        thread_url: `https://salesbuildr.slack.com/archives/${CHANNEL_ID}/p${messageTs.replace('.', '')}`
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
