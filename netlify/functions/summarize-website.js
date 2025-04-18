const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    console.log('Request received');
    
    const { url } = JSON.parse(event.body);
    console.log('Attempting to fetch URL:', url);
    
    // Fetch webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 8000
    });
    
    console.log('Successfully fetched page');
    const html = response.data;
    
    // Extract text content
    const $ = cheerio.load(html);
    
    // Remove non-content elements
    $('script, style, nav, footer, header, aside, .menu, .nav, .footer, .header, .sidebar').remove();
    
    // Get the page title
    const title = $('title').text().trim();
    
    // Try to find main content
    let mainContent = '';
    
    // Check for common content containers
    const contentSelectors = ['main', 'article', '.content', '#content', '.main-content', '.post-content', '.article'];
    
    for (const selector of contentSelectors) {
      if ($(selector).length > 0) {
        mainContent = $(selector).text();
        break;
      }
    }
    
    // If no specific content found, use body text
    if (!mainContent) {
      mainContent = $('body').text();
    }
    
    // Clean the text (remove excess whitespace)
    mainContent = mainContent.replace(/\s+/g, ' ').trim();
    
    // Create a simple summary (first 2-3 sentences, up to ~500 chars)
    const sentences = mainContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let summary = sentences.slice(0, 5).join('. ').trim() + '.';
    
    if (summary.length > 500) {
      summary = summary.substring(0, 500) + '...';
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        title: title,
        summary: summary,
        wordCount: mainContent.split(/\s+/).length
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        responseStatus: error.response ? error.response.status : null
      })
    };
  }
};
