const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { 
      url, 
      summaryLength = "2 Paragraphs", 
      renderJs = true, 
      waitFor, 
      premiumProxy, 
      javascriptEnabled 
    } = requestBody;
    
    console.log('Fetching content from URL:', url);
    
    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Get domain-specific optimized parameters
    const optimizedParams = getOptimizedParams(url);
    console.log('Using optimized parameters for domain:', optimizedParams);
    
    // Retry mechanism
    const MAX_ATTEMPTS = 2;
    let attempts = 0;
    let error;
    
    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        // Adjust parameters for retry attempts
        let currentParams = { ...optimizedParams };
        if (attempts > 1) {
          console.log(`Retry attempt ${attempts}/${MAX_ATTEMPTS}`);
          // Increase wait time for retry attempts
          currentParams.waitFor = currentParams.waitFor ? currentParams.waitFor + 2000 : 5000;
          currentParams.renderJs = true;
          currentParams.premiumProxy = true;
        }
        
        // Use user provided parameters if present
        const finalParams = {
          renderJs: renderJs !== undefined ? renderJs : currentParams.renderJs,
          waitFor: waitFor || currentParams.waitFor,
          premiumProxy: premiumProxy !== undefined ? premiumProxy : currentParams.premiumProxy,
          javascriptEnabled: javascriptEnabled !== undefined ? javascriptEnabled : currentParams.javascriptEnabled
        };
        
        // Call ScrapingBee with the optimized parameters
        const result = await fetchContentFromScrapingBee(url, finalParams);
        
        // If successful, return the result
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
          body: JSON.stringify(result)
        };
      } catch (err) {
        console.error(`Attempt ${attempts} failed:`, err.message);
        error = err;
        // Continue to next attempt
      }
    }
    
    // If all attempts failed, try fallback method
    console.log('All ScrapingBee attempts failed, trying fallback method');
    try {
      const fallbackResult = await fetchWithFallbackMethod(url);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          ...fallbackResult,
          _note: 'Content extracted using fallback method'
        })
      };
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      // Return the original error
      throw error;
    }
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

// Get optimized parameters based on domain
function getOptimizedParams(url) {
  try {
    const domain = new URL(url).hostname;
    
    // Domain-specific optimizations
    const optimizations = {
      // Tech sites
      'techcrunch.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
      'theverge.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
      'wired.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
      
      // E-commerce sites
      'amazon.com': { renderJs: true, premiumProxy: true, waitFor: 5000, javascriptEnabled: true },
      'bestbuy.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
      'walmart.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
      
      // MSP and tech vendor sites
      'microsoft.com': { renderJs: true, waitFor: 3000 },
      'dell.com': { renderJs: true, waitFor: 3000 },
      'hp.com': { renderJs: true, waitFor: 3000 },
      'cisco.com': { renderJs: true, waitFor: 3000 },
      'ibm.com': { renderJs: true, waitFor: 3000 },
      
      // Default parameters
      'default': { renderJs: true, waitFor: 2000 }
    };
    
    // Check for partial domain matches
    for (const [key, value] of Object.entries(optimizations)) {
      if (domain.includes(key)) {
        return value;
      }
    }
    
    return optimizations.default;
  } catch (error) {
    console.error('Error getting optimized parameters:', error);
    return { renderJs: true, waitFor: 2000 };
  }
}

// Fetch content using ScrapingBee
async function fetchContentFromScrapingBee(url, params) {
  // ScrapingBee API key from environment variables
  const apiKey = process.env.SCRAPING_BEE_API_KEY || process.env.SCRAPINGBEE_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key is not configured');
  }

  // Build the ScrapingBee URL
  let scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(url)}`;
  
  // Add parameters
  if (params.renderJs === true || params.renderJs === 'true') {
    scrapingBeeUrl += '&render_js=true';
  }
  
  if (params.javascriptEnabled === true || params.javascriptEnabled === 'true') {
    scrapingBeeUrl += '&js_scenario={"instructions":[{"wait_for":3000}]}';
  }
  
  if (params.waitFor && !isNaN(parseInt(params.waitFor))) {
    scrapingBeeUrl += `&wait=${parseInt(params.waitFor)}`;
  } else {
    scrapingBeeUrl += '&wait=2000';
  }
  
  if (params.premiumProxy === true || params.premiumProxy === 'true') {
    scrapingBeeUrl += '&premium_proxy=true';
  }
  
  // Additional parameters to improve success rate
  scrapingBeeUrl += '&stealth_proxy=true';
  scrapingBeeUrl += '&country_code=us';
  
  console.log('Making request to ScrapingBee...');
  const response = await axios.get(scrapingBeeUrl, {
    responseType: 'arraybuffer',
    timeout: 30000 // 30 second timeout
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
  const contentResult = extractContent($, url, params.summaryLength || "2 Paragraphs");
  
  // Ensure the image URL is absolute
  if (mainImage) {
    try {
      mainImage = new URL(mainImage, url).href;
      console.log('Final image URL:', mainImage);
      
      // Create a proxied version of the image URL
      const proxiedImage = `https://images.weserv.nl/?url=${encodeURIComponent(mainImage)}`;
      
      return {
        mainImage: proxiedImage,
        originalImage: mainImage,
        title: pageTitle,
        content: contentResult.content,
        formattedContent: contentResult.formattedContent,
        features: contentResult.features
      };
    } catch (e) {
      console.error('Error converting to absolute URL:', e);
    }
  }
  
  // Return response if no image was found
  return {
    mainImage: null,
    originalImage: null,
    title: pageTitle,
    content: contentResult.content,
    formattedContent: contentResult.formattedContent,
    features: contentResult.features
  };
}

// Fallback method using direct HTTP request
async function fetchWithFallbackMethod(url) {
  console.log('Using fallback method for:', url);
  
  try {
    // Make a direct request without ScrapingBee
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Parse the HTML
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Extract basic metadata
    const title = $('title').text().trim();
    
    // Get meta description
    const metaDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || '';
    
    // Find main image
    const mainImage = findMainImage($, url);
    
    // Extract some basic content
    const contentResult = extractContent($, url, "2 Paragraphs");
    
    return {
      mainImage: mainImage ? new URL(mainImage, url).href : null,
      originalImage: mainImage ? new URL(mainImage, url).href : null,
      title: title,
      content: contentResult.content || metaDescription,
      formattedContent: contentResult.formattedContent || `<p>${metaDescription}</p>`,
      features: contentResult.features
    };
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    throw new Error('All extraction methods failed');
  }
}

// Helper function to find the main image (using your existing logic)
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

// Helper function to extract and process content (using your existing logic)
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
