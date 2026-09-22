exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const slackToken = process.env.SLACK_BOT_TOKEN;
  if (!slackToken) {
    return { statusCode: 500, body: JSON.stringify({ error: 'SLACK_BOT_TOKEN not set.' }) };
  }

  const CHANNEL_ID  = 'C0B4KND7RR8';
  const BOT_USER_ID = 'U0921CTNKLG';

  try {
    const { question } = JSON.parse(event.body);
    if (!question) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No question provided.' }) };
    }

    // Post question and return immediately — polling is handled by slack-poll.js
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_ts: postData.ts,
        channel_id: CHANNEL_ID,
        thread_url: `https://salesbuildr.slack.com/archives/${CHANNEL_ID}/p${postData.ts.replace('.', '')}`
      })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
