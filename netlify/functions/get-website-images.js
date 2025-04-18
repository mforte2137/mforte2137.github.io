const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url } = JSON.parse(event.body);
    console.log('Fetching images from URL:', url);
    
    // Fetch the webpage with additional headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 8000
    });
    
    const html = response.data;
    console.log('Successfully fetched page');
    
    // Extract images
    const $ = cheerio.load(html);
    
    // First try to get Open Graph images (typically the main image)
    let mainImage = $('meta[property="og:image"]').attr('content');
    console.log('OpenGraph image found:', mainImage ? 'Yes' : 'No');
    
    // If no OG image, look for other significant images
    if (!mainImage) {
      // Find all images
      const images = [];
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src) {
          try {
            // Try to convert to absolute URL
            const absoluteUrl = new URL(src, url).href;
            images.push(absoluteUrl);
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });
      
      console.log('Found images:', images.length);
      
      if (images.length > 0) {
        mainImage = images[0];
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        mainImage: mainImage || null,
        title: $('title').text()
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
