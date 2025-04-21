// Netlify function for Unsplash Image Search
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

    // Get the Unsplash API key from environment variables
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!unsplashAccessKey) {
      console.error('Unsplash API key not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unsplash API key is not configured' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log(`Searching Unsplash for images with query: ${query}`);
    
    // Call the Unsplash API
    const response = await axios({
      method: 'get',
      url: 'https://api.unsplash.com/search/photos',
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`
      },
      params: {
        query: query,
        per_page: 10,
        orientation: 'landscape'
      }
    });
    
    // Process the results
    const images = response.data.results.map(photo => ({
      url: photo.urls.regular,
      name: photo.description || photo.alt_description || query,
      thumbnail: photo.urls.thumb,
      hostPageUrl: photo.links.html,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html
    }));

    // Return the image data
    return {
      statusCode: 200,
      body: JSON.stringify({ images: images }),
      headers: { 'Content-Type': 'application/json' }
    };
    
  } catch (error) {
    console.error('Unsplash search error:', error.message);
    
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
