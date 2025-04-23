// functions/fallback-extractor.js
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    // Parse request body
    const { url, summaryLength = "2 Paragraphs" } = JSON.parse(event.body);
    
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
    
    // Remove non-content elements
    $('script, style, nav, footer, header, aside, .menu, .nav, .footer, .header, .sidebar').remove();
    
    // Get the page title
    const title = $('title').text().trim();
    
    // Extract basic metadata
    const metadata = {
      title: title,
      description: $('meta[name="description"]').attr('content') || 
                  $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || 
             $('meta[property="twitter:image"]').attr('content') || '',
    };
    
    // Find main content
    let mainContent = '';
    let paragraphs = [];
    let features = [];
    
    // Try to find a main content area
    const contentSelectors = [
      'main', 'article', 
      '.content', '#content', 
      '.main-content', '.post-content', 
      '.product-description', '.product-features',
      '[role="main"]', '.entry-content'
    ];
    
    let mainElement = null;
    
    // Find the main content element
    for (const selector of contentSelectors) {
      if ($(selector).length > 0) {
        mainElement = $(selector).first();
        break;
      }
    }
    
    // Extract paragraphs from main element
    if (mainElement) {
      mainElement.find('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 30) {
          paragraphs.push(text);
        }
      });
      
      // Extract features/bullets
      mainElement.find('ul li, ol li').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 15) {
          features.push(text);
        }
      });
    }
    
    // If we don't have enough paragraphs, look at the whole page
    if (paragraphs.length < 2) {
      // Use meta description as first paragraph if available
      if (metadata.description && metadata.description.length > 50) {
        paragraphs.unshift(metadata.description);
      }
      
      // Get paragraphs from the whole document
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      });
      
      // Sort paragraphs by length (longer paragraphs often have more content)
      paragraphs.sort((a, b) => b.length - a.length);
    }
    
    // If we still have no image, try to find the first significant image
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
          try {
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
          } catch (e) {
            // Skip invalid URLs
          }
        }
      });
    }
    
    // Determine how many paragraphs to include based on summaryLength
    let paragraphCount = 2; // Default
    if (summaryLength === "1 Paragraph") {
      paragraphCount = 1;
    } else if (summaryLength === "3 Paragraphs") {
      paragraphCount = 3;
    } else if (summaryLength === "4 Paragraphs") {
      paragraphCount = 4;
    }
    
    // Strictly enforce paragraph count
    const selectedParagraphs = paragraphs.slice(0, paragraphCount);
    
    // Create summary
    const summary = selectedParagraphs.join('\n\n');
    
    // Determine if we should include features based on paragraph count
    let includeFeatures = false;
    let featureCount = 0;
    
    // For 1-2 paragraph options, don't include features
    // For 3-4 paragraph options, include them but count toward paragraph limit
    if (summaryLength === "3 Paragraphs" || summaryLength === "4 Paragraphs") {
      includeFeatures = features.length > 0;
      // Calculate how many features to show (consider remaining paragraph count)
      featureCount = Math.min(features.length, paragraphCount - selectedParagraphs.length);
    }
    
    // Create formatted HTML content
    let formattedContent = '';
    
    if (selectedParagraphs.length > 0) {
      formattedContent = selectedParagraphs.map(p => `<p>${p}</p>`).join('');
      
      // Add features as a bulleted list if we have room
      if (includeFeatures && featureCount > 0) {
        formattedContent += '<h3>Key Features:</h3><ul>';
        features.slice(0, featureCount).forEach(feature => {
          formattedContent += `<li>${feature}</li>`;
        });
        formattedContent += '</ul>';
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title: metadata.title,
        mainImage: metadata.image,
        content: summary,
        formattedContent: formattedContent,
        features: features.slice(0, 6),
        _source: "fallback-extractor"
      }),
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
