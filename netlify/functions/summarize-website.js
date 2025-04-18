// functions/summarize-website.js
const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');

exports.handler = async function(event, context) {
  try {
    const { url } = JSON.parse(event.body);
    
    // Fetch the webpage
    const response = await axios.get(url);
    const html = response.data;
    
    // Extract text content
    const $ = cheerio.load(html);
    $('script, style').remove(); // Remove scripts and styles
    const mainContent = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Use AI to summarize
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY // Set this in Netlify environment variables
    });
    
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes webpage content."
        },
        {
          role: "user",
          content: `Summarize this webpage content in 2-3 paragraphs: ${mainContent.substring(0, 6000)}`
        }
      ]
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: aiResponse.choices[0].message.content
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
