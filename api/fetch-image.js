const axios = require('axios');


module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');


  // Handle OPTIONS request (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }


  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }


    // Validate URL format
    if (!url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }


    // Fetch the image
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });


    // Set content type based on the response
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);


    // Return the image data
    return res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error('Error fetching image:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch image',
      message: error.message
    });
  }
};