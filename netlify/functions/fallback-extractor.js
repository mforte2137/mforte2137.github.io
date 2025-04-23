// functions/fallback-extractor.js
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    // Parse request body
    const { url } = JSON.parse(event.body);
    
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Make a direct request without ScrapingBee
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    // Parse the HTML
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract basic metadata
    const metadata = {
      title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || 
                  $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || 
             $('meta[property="twitter:image"]').attr('content') || '',
    };
    
    // If we have no image, try to find the first significant image
    if (!metadata.image) {
      $('img').each(function() {
        const src = $(this).attr('src');
        const width = parseInt($(this).attr('width') || '0');
        const height = parseInt($(this).attr('height') || '0');
        
        // Ignore small images and common icons
        if (src && 
            !src.includes('icon') && 
            !src.includes('logo') && 
            !src.includes('avatar') &&
            (width > 100 || height > 100 || (!width && !height))) {
          // Ensure the src is an absolute URL
          if (src.startsWith('http')) {
            metadata.image = src;
          } else if (src.startsWith('//')) {
            metadata.image = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            metadata.image = `${urlObj.protocol}//${urlObj.host}${src}`;
          } else {
            // Handle relative paths
            const urlObj = new URL(url);
            const basePath = urlObj.pathname.split('/').slice(0, -1).join('/') + '/';
            metadata.image = `${urlObj.protocol}//${urlObj.host}${basePath}${src}`;
          }
          return false; // Break the loop after finding the first suitable image
        }
      });
    }
    
    // If still no description, try to extract from content
    if (!metadata.description) {
      // Look for first paragraph with significant text
      const paragraphs = [];
      $('p').each(function() {
        const text = $(this).text().trim();
        if (text.length > 50) {
          paragraphs.push(text);
        }
      });
      
      if (paragraphs.length > 0) {
        metadata.description = paragraphs[0];
      } else {
        // If no good paragraphs, grab all text from body
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        metadata.description = bodyText.substring(0, 200) + '...';
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(metadata),
    };
  } catch (error) {
    console.log('Error in fallback-extractor:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to extract content', 
        details: error.message 
      }),
    };
  }
};
