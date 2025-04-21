// Netlify function to fetch an image and convert it to base64
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
    const { imageUrl } = requestBody;

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Image URL is required' })
      };
    }

    // Fetch the image
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    // Get the content type (image/jpeg, image/png, etc.)
    const contentType = response.headers['content-type'];
    
    // Convert the image to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataUri = `data:${contentType};base64,${base64Image}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        imageData: dataUri
      })
    };
  } catch (error) {
    console.error('Image fetch error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Error fetching image',
        details: error.message 
      })
    };
  }
};
