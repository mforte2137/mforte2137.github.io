const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url, summaryLength = "2 Paragraphs" } = JSON.parse(event.body);
    console.log('Fetching website content from:', url);
    
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
    
    // Remove non-content elements
    $('script, style, nav, footer, header, aside, .menu, .nav, .footer, .header, .sidebar').remove();
    
    // Get the page title
    const pageTitle = $('title').text().trim();
    
    // Extract content from the page
    const extractionResult = extractAndFormatContent($, url, summaryLength);
    
    console.log(`Extracted summary and formatted content for: ${pageTitle}`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        summary: extractionResult.plainText,
        formattedContent: extractionResult.formattedContent,
        features: extractionResult.features,
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
      
      if (error.response.data) {
        try {
          if (typeof error.response.data === 'string') {
            errorDetails.data = error.response.data.substring(0, 200);
          } else if (Buffer.isBuffer(error.response.data)) {
            errorDetails.data = new TextDecoder().decode(error.response.data.slice(0, 200));
          }
        } catch (e) {
          errorDetails.dataError = e.message;
        }
      }
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

// Function to extract and format content
function extractAndFormatContent($, url, summaryLength) {
  // Array to store paragraph content
  const paragraphs = [];
  
  // Array to store features/benefits
  const features = [];
  
  // Try to find main content
  let mainContentElement = null;
  
  // Look for content in common content containers
  const contentSelectors = [
    'main', 'article', 
    '.content', '#content', 
    '.main-content', '.post-content', 
    '.product-description', '.product-features',
    '[role="main"]', '.entry-content'
  ];
  
  for (const selector of contentSelectors) {
    if ($(selector).length > 0) {
      mainContentElement = $(selector).first();
      break;
    }
  }
  
  // If we found a main content element, extract text and structure from it
  if (mainContentElement) {
    // Extract paragraphs
    mainContentElement.find('p').each((i, el) => {
      const paragraphText = $(el).text().trim();
      if (paragraphText.length > 30 && !paragraphText.includes('©') && !paragraphText.includes('copyright')) {
        paragraphs.push(paragraphText);
      }
    });
    
    // Extract list items as features/benefits
    mainContentElement.find('ul li, ol li').each((i, el) => {
      const listItem = $(el).text().trim();
      if (listItem.length > 15 && !listItem.includes('©') && !listItem.includes('copyright')) {
        features.push(listItem);
      }
    });
    
    // Extract headings and their content for additional features
    mainContentElement.find('h2, h3, h4').each((i, el) => {
      const headingText = $(el).text().trim();
      if (headingText.length > 5 && 
          !headingText.toLowerCase().includes('comment') && 
          !headingText.toLowerCase().includes('related')) {
        
        // Find the text immediately following this heading
        let nextEl = $(el).next();
        let featureContent = '';
        
        // If next element is paragraph, use that
        if (nextEl.is('p')) {
          featureContent = nextEl.text().trim();
          if (featureContent.length > 20) {
            features.push(`${headingText}: ${featureContent}`);
          }
        } 
        // If next element is a list, extract list items
        else if (nextEl.is('ul, ol')) {
          let items = [];
          nextEl.find('li').each((j, li) => {
            items.push($(li).text().trim());
          });
          
          if (items.length > 0) {
            features.push(`${headingText}:`);
            items.forEach(item => {
              features.push(item);
            });
          }
        }
      }
    });
  }
  
  // If we didn't find enough paragraphs in the main content area, fall back to generic approach
  if (paragraphs.length < 2) {
    // Check for meta description first (often a good summary)
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription && metaDescription.length > 50) {
      paragraphs.unshift(metaDescription);
    }
    
    // Get paragraphs from entire document as a fallback
    if (paragraphs.length < 2) {
      const allParagraphs = [];
      $('p').each((i, el) => {
        const paragraphText = $(el).text().trim();
        if (paragraphText.length > 50 && !paragraphText.includes('©') && !paragraphText.includes('copyright')) {
          allParagraphs.push(paragraphText);
        }
      });
      
      // Sort by length (often longer paragraphs are more content-rich)
      allParagraphs.sort((a, b) => b.length - a.length);
      
      // Add top paragraphs if we need more
      for (let i = 0; i < allParagraphs.length && paragraphs.length < 3; i++) {
        // Avoid duplicates
        if (!paragraphs.includes(allParagraphs[i])) {
          paragraphs.push(allParagraphs[i]);
        }
      }
    }
  }
  
  // If we still don't have enough content, use your original approach of finding the largest text blocks
  if (paragraphs.length < 2 && features.length === 0) {
    let largestParagraphSection = '';
    
    // First try to find sections with multiple paragraphs
    $('div, section').each((i, section) => {
      const sectionParagraphs = $(section).find('p');
      if (sectionParagraphs.length >= 2) {
        const sectionText = $(section).text().trim();
        if (sectionText.length > largestParagraphSection.length) {
          largestParagraphSection = sectionText;
        }
      }
    });
    
    // If we found a good section with paragraphs, use that
    if (largestParagraphSection.length > 100) {
      // Break into sentences and then create paragraphs
      const sentences = largestParagraphSection
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 10);
      
      // Group sentences into paragraphs (approximately 2-3 sentences per paragraph)
      for (let i = 0; i < sentences.length; i += 3) {
        const paragraphSentences = sentences.slice(i, i + 3);
        if (paragraphSentences.length > 0) {
          paragraphs.push(paragraphSentences.join(' '));
        }
      }
    }
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
  
  // Limit to requested paragraph count
  const selectedParagraphs = paragraphs.slice(0, paragraphCount);
  
  // Create plain text version (for editing)
  let plainText = selectedParagraphs.join('\n\n');
  
  // Add features/benefits to plain text if we have any
  if (features.length > 0) {
    plainText += '\n\nKey Features:\n';
    features.slice(0, 6).forEach(feature => {
      plainText += `• ${feature}\n`;
    });
  }
  
  // Create HTML formatted version
  let formattedContent = '';
  
  if (selectedParagraphs.length > 0) {
    formattedContent = selectedParagraphs.map(p => `<p>${p}</p>`).join('');
    
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
    plainText: plainText,
    formattedContent: formattedContent,
    features: features.slice(0, 6)
  };
}
