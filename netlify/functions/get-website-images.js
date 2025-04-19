const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url } = JSON.parse(event.body);
    console.log('Fetching images from URL:', url);
    
    // Use ScrapingBee to fetch the page
    const apiKey = process.env.SCRAPING_BEE_API_KEY;
    const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}&render_js=true`;
    
    console.log('Making request to ScrapingBee...');
    const response = await axios.get(scrapingBeeUrl, {
      responseType: 'arraybuffer'
    });
    
    // Convert binary response to text
    const html = new TextDecoder().decode(response.data);
    console.log('Response received from ScrapingBee');
    
    // Use Cheerio to parse the HTML
    const $ = cheerio.load(html);
    
    // Get the page title
    const pageTitle = $('title').text().trim();
    console.log('Page title:', pageTitle);
    
    // Find images using various strategies
    
    // 1. First try Open Graph images (usually the main featured image)
    let mainImage = $('meta[property="og:image"]').attr('content');
    console.log('OpenGraph image:', mainImage || 'None found');
    
    // 2. If no OG image, look for Twitter card image
    if (!mainImage) {
      mainImage = $('meta[name="twitter:image"]').attr('content');
      console.log('Twitter card image:', mainImage || 'None found');
    }
    
    // 3. If still no image, look for structured data (JSON-LD)
    if (!mainImage) {
      $('script[type="application/ld+json"]').each((i, el) => {
        if (mainImage) return; // Skip if we already found an image
        
        try {
          const jsonData = JSON.parse($(el).html());
          // Look for image in JSON-LD data
          if (jsonData.image) {
            if (typeof jsonData.image === 'string') {
              mainImage = jsonData.image;
            } else if (Array.isArray(jsonData.image) && jsonData.image.length > 0) {
              mainImage = jsonData.image[0].url || jsonData.image[0];
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });
      console.log('JSON-LD image:', mainImage || 'None found');
    }
    
    // 4. Look for hero images or main content images
    if (!mainImage) {
      const heroSelectors = [
        '.hero img', 
        '.banner img', 
        '.featured-image img',
        '.product-image img',
        '#hero img',
        '[role="banner"] img'
      ];
      
      for (const selector of heroSelectors) {
        if ($(selector).length > 0) {
          mainImage = $(selector).first().attr('src');
          if (mainImage) break;
        }
      }
      console.log('Hero image:', mainImage || 'None found');
    }
    
    // 5. Find largest image on the page
    if (!mainImage) {
      const images = [];
      $('img').each((i, img) => {
        const src = $(img).attr('src');
        const width = parseInt($(img).attr('width') || '0');
        const height = parseInt($(img).attr('height') || '0');
        
        if (src && (width > 100 || height > 100 || (!width && !height))) {
          // Skip small icons and logos
          if (src.includes('icon') || src.includes('logo')) {
            if (width < 200 && height < 200) return;
          }
          
          try {
            // Convert to absolute URL
            const absoluteUrl = new URL(src, url).href;
            images.push({
              url: absoluteUrl,
              area: width && height ? width * height : 0
            });
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });
      
      // Sort by image size (largest first)
      images.sort((a, b) => b.area - a.area);
      
      if (images.length > 0) {
        mainImage = images[0].url;
      }
      console.log(`Found ${images.length} potential images`);
    }
    
    // Ensure the image URL is absolute
    if (mainImage) {
      try {
        mainImage = new URL(mainImage, url).href;
        console.log('Final image URL:', mainImage);
        
        // Create a proxied version of the image URL
        const proxiedImage = `https://images.weserv.nl/?url=${encodeURIComponent(mainImage)}`;
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
          body: JSON.stringify({
            mainImage: proxiedImage,
            originalImage: mainImage,
            title: pageTitle
          })
        };
      } catch (e) {
        console.error('Error converting to absolute URL:', e);
      }
    }
    
    // Return response if no image was found
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        mainImage: null,
        originalImage: null,
        title: pageTitle
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    
    // Detailed error reporting
    const errorDetails = {
      message: error.message,
      stack: error.stack
    };
    
    // Add ScrapingBee specific error details if available
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
    }
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(errorDetails)
    };
  }
};
