// Netlify function for Bing Image Search
const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const { query } = requestBody;

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query parameter is required' })
      };
    }

    // Get the Bing API key from environment variables
    const bingApiKey = process.env.BING_API_KEY;
    
    if (!bingApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Bing API key is not configured' })
      };
    }

    // Call the Bing Image Search API
    const response = await axios({
      method: 'get',
      url: 'https://api.bing.microsoft.com/v7.0/images/search',
      headers: {
        'Ocp-Apim-Subscription-Key': bingApiKey,
      },
      params: {
        q: query,
        count: 10,
        safeSearch: 'Moderate',
        license: 'Any',
        imageType: 'Photo'
      }
    });

    // Get the top image results
    const images = response.data.value.map(image => ({
      url: image.contentUrl,
      name: image.name,
      thumbnail: image.thumbnailUrl,
      hostPageUrl: image.hostPageUrl
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        images: images
      })
    };
  } catch (error) {
    console.error('Bing search error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error searching for images',
        details: error.message 
      })
    };
  }
};
