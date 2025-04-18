const axios = require('axios');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');

exports.handler = async function(event, context) {
  try {
    // Log incoming request (useful for debugging)
    console.log('Request received:', event.body);
    
    const { url } = JSON.parse(event.body);
    console.log('Attempting to fetch URL:', url);
    
    // Fetch webpage with additional headers and a timeout
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 8000, // 8 second timeout
      maxContentLength: 1000000 // Limit response size to avoid large pages
    });
    
    console.log('Successfully fetched page, status:', response.status);
    const html = response.data;
    
    // Extract text content
    const $ = cheerio.load(html);
    $('script, style, iframe, nav, footer, header').remove(); // Remove non-content elements
    const mainContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); // Limit content size
    
    console.log('Content extracted, length:', mainContent.length);
    console.log('Content preview:', mainContent.substring(0, 100) + '...');
    
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    console.log('Preparing to call OpenAI API');
    
    // Use AI to summarize
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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
          content: `Summarize this webpage content in 2-3 paragraphs: ${mainContent}`
        }
      ],
      max_tokens: 500 // Limit response size
    });
    
    console.log('OpenAI response received');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        summary: aiResponse.choices[0].message.content
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    
    // Detailed error reporting
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        responseStatus: error.response ? error.response.status : null,
        responseData: error.response ? (typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : 'Response data too complex') : null
      })
    };
  }
};
