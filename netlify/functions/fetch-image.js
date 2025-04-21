// Netlify function to fetch an image and convert it to base64
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
    const { imageUrl } = requestBody;

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image URL is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log(`Fetching image from: ${imageUrl}`);

    // Fetch the image
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
      // Add timeout to prevent hanging requests
      timeout: 10000,
      // Handle redirects
      maxRedirects: 5,
      validateStatus: status => status < 400
    });

    // Get the content type (image/jpeg, image/png, etc.)
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // Convert the image to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataUri = `data:${contentType};base64,${base64Image}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageData: dataUri
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Image fetch error:', error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error fetching image',
        details: error.message,
        stack: error.stack
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
