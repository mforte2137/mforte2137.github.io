const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { topic, tone, paragraphs } = body;
    
    // Get API key from environment variable
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }

    // Create the prompt for Claude
    const prompt = `Write marketing content for an MSP (Managed Service Provider) about their "${topic}" service or product. 
The content should be ${paragraphs} paragraphs in length and use a ${tone} tone.
Focus on the benefits and features of the service.
Format the content with a blank line between paragraphs.
Don't include any headings, just the paragraphs.`;

    // Call the Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    
    // Check for errors in the API response
    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message || "API error" })
      };
    }

    // Return the content
    return {
      statusCode: 200,
      body: JSON.stringify({ content: data.content[0].text })
    };
  } catch (error) {
    console.log("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to call Claude API" })
    };
  }
};
