// Netlify function for Claude AI with variable placeholders - Fixed version
const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { topic, tone, paragraphs } = requestBody;

    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic parameter is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get the Claude API key from environment variables
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      console.error('Claude API key not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Claude API key is not configured' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log(`Generating content for: ${topic} with tone: ${tone} and paragraphs: ${paragraphs}`);
    
    // Build the prompt for Claude
    const userPrompt = `
    Please write ${paragraphs} paragraph(s) of marketing content for a Managed Service Provider (MSP) selling "${topic}". 
    The tone should be ${tone}.
    
    IMPORTANT: 
    1. Use "{{servicingBranch.name}}" instead of generic terms like "Our Managed Service Provider" or "our company"
    2. This is a template, so "{{servicingBranch.name}}" should appear exactly like that - don't replace it
    3. Start with a compelling headline that includes "${topic}" and "{{servicingBranch.name}}"
    4. Make sure to mention "{{servicingBranch.name}}" at least once in each paragraph
    5. Do not add any disclaimers or labels indicating this is AI-generated content
    
    Your response should be just the marketing content, nothing else.`;

    console.log("Making request to Claude API...");
    
    // Call the Claude API with the most current format
    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      data: {
        model: 'claude-3-haiku-20240307',  // Using a more widely available model
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      },
      timeout: 30000 // 30-second timeout
    });

    console.log("Received response from Claude API");
    
    // Extract the generated content
    const generatedContent = response.data.content[0].text;

    // Return the generated content
    return {
      statusCode: 200,
      body: JSON.stringify({
        content: generatedContent
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Provide more detailed error information for debugging
    const errorDetails = {
      error: 'Error generating content',
      message: error.message,
      status: error.response ? error.response.status : 'unknown',
      statusText: error.response ? error.response.statusText : '',
      data: error.response && error.response.data ? error.response.data : null
    };
    
    return {
      statusCode: 502,
      body: JSON.stringify(errorDetails),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
