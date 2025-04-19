const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url, summaryLength = "2 Paragraphs" } = JSON.parse(event.body);
    console.log('Fetching content from URL:', url);
    
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
    let mainImage = findMainImage($, url);
    
    // Extract and process the main content
    const contentResult = extractContent($, url, summaryLength);
    
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
            title: pageTitle,
            content: contentResult.content,
            formattedContent: contentResult.formattedContent,
            features: contentResult.features
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
        title: pageTitle,
        content: contentResult.content,
        formattedContent: contentResult.formattedContent,
        features: contentResult.features
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

// Helper function to find the main image
function findMainImage($, url) {
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
      '[role="banner"] img',
      'article img',
      '.content img',
      '.main-content img'
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
      const alt = $(img).attr('alt') || '';
      
      // Skip icons, logos, and very small images
      if (src && (width > 200 || height > 200 || (!width && !height))) {
        // Skip small icons and logos
        if ((src.includes('icon') || src.includes('logo') || alt.includes('logo')) && 
            (width < 300 && height < 300)) {
          return;
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
  
  return mainImage;
}

// Helper function to extract and process content
function extractContent($, url, summaryLength) {
  let content = '';
  let paragraphs = [];
  let features = [];
  
  // 1. Try to find the main content area
  const contentSelectors = [
    'article', '.article', '.post-content', '.entry-content', 
    '.content', '.main-content', 'main', '#content', 
    '[role="main"]', '.page-content', '.product-description'
  ];
  
  let mainContentElement = null;
  
  for (const selector of contentSelectors) {
    if ($(selector).length > 0) {
      mainContentElement = $(selector).first();
      break;
    }
  }
  
  // If we found a main content element, extract text from it
  if (mainContentElement) {
    // Remove navigation, footers, sidebars, comments
    mainContentElement.find('nav, footer, .sidebar, .comments, .comment, .navigation, .menu, .widget').remove();
    
    // Extract paragraphs
    mainContentElement.find('p').each((i, el) => {
      const paragraphText = $(el).text().trim();
      if (paragraphText.length > 30 && !paragraphText.includes('©') && !paragraphText.includes('copyright')) {
        paragraphs.push(paragraphText);
      }
    });
    
    // Extract lists for features
    mainContentElement.find('ul li, ol li').each((i, el) => {
      const listItem = $(el).text().trim();
      if (listItem.length > 15 && !listItem.includes('©')) {
        features.push(listItem);
      }
    });
    
    // Extract headings and their content for additional features
    mainContentElement.find('h2, h3, h4').each((i, el) => {
      const headingText = $(el).text().trim();
      if (headingText.length > 5 && !headingText.toLowerCase().includes('comment') && 
          !headingText.toLowerCase().includes('related')) {
        
        // Find the text immediately following this heading
        let nextEl = $(el).next();
        let featureContent = '';
        
        // If next element is paragraph, use that
        if (nextEl.is('p')) {
          featureContent = nextEl.text().trim();
        } 
        // If next element is a list, extract list items
        else if (nextEl.is('ul, ol')) {
          const items = [];
          nextEl.find('li').each((j, li) => {
            items.push($(li).text().trim());
          });
          featureContent = items.join('. ');
        }
        
        if (featureContent && featureContent.length > 20) {
          features.push(`${headingText}: ${featureContent}`);
        }
      }
    });
  } else {
    // If no main content area found, look for all paragraphs
    $('p').each((i, el) => {
      const paragraphText = $(el).text().trim();
      // Filter out short paragraphs (likely navigation or footer text)
      if (paragraphText.length > 50) {
        paragraphs.push(paragraphText);
      }
    });
    
    // Extract lists for features
    $('ul li, ol li').each((i, el) => {
      const listItem = $(el).text().trim();
      if (listItem.length > 15 && !listItem.includes('©')) {
        features.push(listItem);
      }
    });
  }
  
  // Extract meta description as a potential summary paragraph
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 50) {
    // Add meta description as the first paragraph if it's substantial
    paragraphs.unshift(metaDescription);
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
  
  // Build the content string (limit to specified paragraph count)
  content = paragraphs.slice(0, paragraphCount).join('\n\n');
  
  // Format features for display
  let formattedFeatures = '';
  if (features.length > 0) {
    formattedFeatures = '\n\nKey Features:\n' + features.slice(0, 6).map(feature => `• ${feature}`).join('\n');
  }
  
  // Create a nicely formatted HTML version
  let formattedContent = '';
  const contentParagraphs = paragraphs.slice(0, paragraphCount);
  
  if (contentParagraphs.length > 0) {
    formattedContent = contentParagraphs.map(p => `<p>${p}</p>`).join('');
    
    // Add features as a bulleted list if we have them
    if (features.length > 0) {
      formattedContent += '<h3>Key Features:</h3><ul>';
      features.slice(0, 6).forEach(feature => {
        formattedContent += `<li>${feature}</li>`;
      });
      formattedContent += '</ul>';
    }
  }
  
  return {
    content: content + formattedFeatures,
    formattedContent: formattedContent,
    features: features.slice(0, 6)
  };
}
