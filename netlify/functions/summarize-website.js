const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  try {
    const { url } = JSON.parse(event.body);
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
    
    // Try to find main content
    let mainContent = '';
    
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
        mainContent += $(selector).text() + ' ';
      }
    }
    
    // If no specific content found, use a more generic approach
    if (!mainContent.trim()) {
      // Get the largest text block in the page (often the main content)
      const paragraphs = $('p');
      let largestParagraphSection = '';
      
      // First try to find sections with multiple paragraphs
      $('div, section').each((i, section) => {
        const sectionParagraphs = $(section).find('p');
        if (sectionParagraphs.length >= 3) {
          const sectionText = $(section).text().trim();
          if (sectionText.length > largestParagraphSection.length) {
            largestParagraphSection = sectionText;
          }
        }
      });
      
      // If we found a good section with paragraphs, use that
      if (largestParagraphSection.length > 100) {
        mainContent = largestParagraphSection;
      } else {
        // Otherwise concatenate the largest paragraphs
        const paragraphTexts = [];
        paragraphs.each((i, el) => {
          paragraphTexts.push($(el).text().trim());
        });
        
        // Sort paragraphs by length (longest first)
        paragraphTexts.sort((a, b) => b.length - a.length);
        
        // Take the top paragraphs
        mainContent = paragraphTexts.slice(0, 5).join(' ');
      }
    }
    
    // Clean the text
    mainContent = mainContent
      .replace(/\s+/g, ' ')
      .replace(/;([a-zA-Z])/g, '; $1') // Add space after semicolons
      .replace(/\.([a-zA-Z])/g, '. $1') // Add space after periods
      .trim();
    
    // Create a simple summary (first few sentences)
    const sentences = mainContent.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
    let summary = sentences.slice(0, 5).join(' ').trim();
    
    if (summary.length > 1000) {
      summary = summary.substring(0, 1000) + '...';
    }
    
    console.log(`Extracted summary (${summary.length} chars) and title: ${pageTitle}`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        summary: summary,
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
