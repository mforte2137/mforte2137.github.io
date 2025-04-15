const axios = require('axios');
const cheerio = require('cheerio');


module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');


  // Handle OPTIONS request (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }


  try {
    // Get the URL from the query parameters
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }


    // Validate URL format (basic check)
    if (!url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }


    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });


    // Parse the HTML with Cheerio
    const $ = cheerio.load(response.data);
    
    // Extract useful information
    const title = $('title').text().trim() || '';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';
    
    // Return the extracted data
    return res.status(200).json({
      title,
      description,
      imageUrl
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch URL',
      message: error.message
    });
  }
};