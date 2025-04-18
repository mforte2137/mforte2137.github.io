// functions/get-website-images.js
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url } = JSON.parse(event.body);
    
    // Fetch the webpage
    const response = await axios.get(url);
    const html = response.data;
    
    // Extract images
    const $ = cheerio.load(html);
    
    // First try to get Open Graph images (typically the main image)
    let mainImage = $('meta[property="og:image"]').attr('content');
    
    // If no OG image, look for other significant images
    if (!mainImage) {
      // Find all images larger than 200x200 (likely significant)
      const images = [];
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        const width = parseInt($(img).attr('width') || '0');
        const height = parseInt($(img).attr('height') || '0');
        
        if (width > 200 && height > 200 && src) {
          images.push({
            src: new URL(src, url).href, // Convert to absolute URL
            width,
            height,
            area: width * height
          });
        }
      });
      
      // Sort by image size (largest first)
      images.sort((a, b) => b.area - a.area);
      
      if (images.length > 0) {
        mainImage = images[0].src;
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        mainImage: mainImage || null,
        title: $('title').text()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
