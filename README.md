# MSP AI Content Generator

A simple web application that generates professional marketing content for MSP services and products using Claude AI, with the ability to search for and include relevant images.

## Features

- Generate marketing content for MSP services and products
- Multiple tone options (professional, casual, enthusiastic, informative)
- Adjustable content length
- Image search functionality using Bing Search API
- Option to upload custom images
- Preview content with images
- Generate and copy HTML code for use in websites or email campaigns

## Setup

### Prerequisites

- Node.js (v14 or newer)
- Netlify account
- Claude API key
- Bing Search API key

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/msp-ai-content-generator.git
   cd msp-ai-content-generator
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables in Netlify:
   - `CLAUDE_API_KEY` - Your Anthropic Claude API key
   - `BING_API_KEY` - Your Microsoft Bing Search API key

4. Deploy to Netlify:
   ```
   netlify deploy
   ```

### Local Development

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Create a `.env` file in the project root with the following:
   ```
   CLAUDE_API_KEY=your_claude_api_key
   BING_API_KEY=your_bing_api_key
   ```

3. Start the local development server:
   ```
   netlify dev
   ```

## Usage

1. Enter an MSP service or product name
2. Select the desired tone and content length
3. Click "Generate AI Content"
4. Choose to either upload an image or search for one
5. Adjust the image position (left or right)
6. Preview the content and make any edits needed
7. Copy the generated HTML code for use in your marketing materials

## Files

- `ai.html` - Main application file
- `netlify/functions/claude-api.js` - Netlify function for the Claude API
- `netlify/functions/bing-search.js` - Netlify function for Bing Image Search
- `netlify/functions/fetch-image.js` - Netlify function to fetch and convert images to base64
- `netlify.toml` - Netlify configuration file
- `package.json` - Node.js dependencies

## Getting API Keys

### Claude API
1. Sign up for an account at [Anthropic](https://www.anthropic.com/)
2. Create an API key in your dashboard

### Bing Search API
1. Sign up for an Azure account if you don't have one
2. Go to the [Azure Portal](https://portal.azure.com/)
3. Create a Bing Search resource
4. Get your API key from the resource overview
