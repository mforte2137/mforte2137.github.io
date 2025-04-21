// Netlify function for Bing Image Search with confirmed base URL
const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body || '{}');
    const { query } = requestBody;

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query parameter is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Get the Bing API key from environment variables
    const bingApiKey = process.env.BING_API_KEY;
    
    if (!bingApiKey) {
      console.error('Bing API key not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Bing API key is not configured' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // For debugging
    console.log(`Searching Bing for images with query: ${query}`);
    
    // Confirmed base URL from Azure documentation
    const baseUrl = 'https://api.cognitive.microsoft.com';
    
    // Possible path combinations to try
    const paths = [
      '/bing/v7.0/images/search',  // Most common path
      '/bing/v7.0/search/images',  // Alternate structure
      '/bing/v7.0/images',         // Simplified path
      '/bing/v5.0/images/search',  // Older API version
      '/bing/images/search',       // Version-less path
      '/bing/images'               // Most simplified
    ];

    let lastError = null;
    
    // Try each path until one works
    for (const path of paths) {
      try {
        const fullUrl = baseUrl + path;
        console.log(`Trying endpoint: ${fullUrl}`);
        
        const response = await axios({
          method: 'get',
          url: fullUrl,
          headers: {
            'Ocp-Apim-Subscription-Key': bingApiKey
          },
          params: {
            q: query,
            count: 10,
            safeSearch: 'Moderate',
            license: 'Any',
            imageType: 'Photo'
          },
          // Set a short timeout to quickly try the next path
          timeout: 5000
        });
        
        // If we get here, the request was successful
        console.log(`Success with endpoint: ${fullUrl}`);
        
        // Get the top image results
        const images = response.data.value.map(image => ({
          url: image.contentUrl,
          name: image.name,
          thumbnail: image.thumbnailUrl,
          hostPageUrl: image.hostPageUrl || ''
        }));
    
        // Return the image data
        return {
          statusCode: 200,
          body: JSON.stringify({ images: images }),
          headers: { 'Content-Type': 'application/json' }
        };
      } catch (error) {
        console.log(`Error with path ${path}: ${error.message}`);
        lastError = error;
        // Continue to the next path
      }
    }
    
    // If we get here, all paths failed
    throw lastError || new Error('All endpoints failed');
    
  } catch (error) {
    console.error('Bing search error:', error.message);
    
    // Provide more detailed error information for debugging
    const errorDetails = {
      error: 'Error searching for images',
      details: error.message,
      code: error.response ? error.response.status : 'unknown',
      data: error.response ? error.response.data : null
    };
    
    return {
      statusCode: 500,
      body: JSON.stringify(errorDetails),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
