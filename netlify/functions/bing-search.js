// Netlify function for Bing Image Search using the custom endpoint
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
    
    // Using the custom endpoint found in Azure portal
    const customEndpoint = 'https://widgetimage.search.windows.net';
    console.log(`Using custom endpoint: ${customEndpoint}`);
    
    // Try a few different path combinations with the custom endpoint
    const paths = [
      '/images/search',      // Most likely path
      '/v7.0/images/search', // With version
      '/images',             // Simplified
      '/search'              // Most basic
    ];
    
    let lastError = null;
    let successResponse = null;
    
    // Try each path until one works
    for (const path of paths) {
      try {
        const fullUrl = customEndpoint + path;
        console.log(`Trying endpoint: ${fullUrl}`);
        
        const response = await axios({
          method: 'get',
          url: fullUrl,
          headers: {
            'Ocp-Apim-Subscription-Key': bingApiKey,
            // Add Azure-specific header
            'Accept': 'application/json'
          },
          params: {
            q: query,
            count: 10,
            safeSearch: 'Moderate'
          },
          timeout: 5000
        });
        
        // If we get here, the request was successful
        console.log(`Success with endpoint: ${fullUrl}`);
        successResponse = response;
        break; // Exit the loop if successful
      } catch (error) {
        console.log(`Error with path ${path}: ${error.message}`);
        lastError = error;
        // Continue to the next path
      }
    }
    
    // If we found a successful endpoint
    if (successResponse) {
      // Process the data based on the structure
      let images = [];
      
      if (successResponse.data.value && Array.isArray(successResponse.data.value)) {
        // Standard Bing Search API format
        images = successResponse.data.value.map(image => ({
          url: image.contentUrl || image.url || '',
          name: image.name || image.title || '',
          thumbnail: image.thumbnailUrl || image.thumbnail || '',
          hostPageUrl: image.hostPageUrl || ''
        }));
      } else if (successResponse.data.results && Array.isArray(successResponse.data.results)) {
        // Alternative format sometimes used
        images = successResponse.data.results.map(image => ({
          url: image.contentUrl || image.url || '',
          name: image.name || image.title || '',
          thumbnail: image.thumbnailUrl || image.thumbnail || '',
          hostPageUrl: image.hostPageUrl || ''
        }));
      }
      
      // Return the image data
      return {
        statusCode: 200,
        body: JSON.stringify({ images: images }),
        headers: { 'Content-Type': 'application/json' }
      };
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
