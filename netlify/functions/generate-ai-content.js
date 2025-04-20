// Netlify Serverless Function: generate-ai-content.js
const axios = require('axios');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    try {
        // Parse request body
        const requestBody = JSON.parse(event.body);
        const { topic, tone, length } = requestBody;
        
        if (!topic) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Topic is required' })
            };
        }
        
        // Get the Claude API key from environment variables
        const apiKey = process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }
        
        // Determine the number of paragraphs based on length
        let paragraphCount = 2; // Default
        if (length === '1 Paragraph') paragraphCount = 1;
        if (length === '3 Paragraphs') paragraphCount = 3;
        
        // Build the prompt for Claude
        const prompt = `
            Generate marketing content about "${topic}" in a ${tone.toLowerCase()} tone.
            
            The content should be ${paragraphCount} paragraphs in length.
            
            Include:
            - Strong value propositions
            - Engaging descriptions
            - Key benefits or features
            
            Make the content compelling and suitable for a business website widget.
            Format with proper paragraphs and include bullet points for key features if appropriate.
        `;
        
        // Call the Claude API
        const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: 'claude-3-haiku-20240307', // Using a faster, more cost-effective model
                max_tokens: 1000,
                messages: [
                    { role: 'user', content: prompt }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            }
        );
        
        // Extract the content from Claude's response
        const generatedContent = response.data.content[0].text;
        
        // Format the content
        const formattedContent = formatContentToHtml(generatedContent);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                content: generatedContent.trim(),
                formattedContent: formattedContent
            })
        };
    } catch (error) {
        console.error('Error generating content:', error.response?.data || error.message);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error generating content',
                details: error.response?.data || error.message
            })
        };
    }
};

// Helper function to format content with HTML
function formatContentToHtml(content) {
    if (!content) return '';
    
    // Split by new lines to identify paragraphs and lists
    const lines = content.split('\n');
    let html = '';
    let inList = false;
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) {
            // Empty line - close any open list
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            return;
        }
        
        // Check if it's a list item (bullet point)
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li>${line.substring(1).trim()}</li>`;
        } 
        // Check if it's a heading
        else if (line.startsWith('Key Features:') || line.startsWith('#')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<h3>${line.replace('#', '').trim()}</h3>`;
        }
        // Regular paragraph
        else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${line}</p>`;
        }
    });
    
    // Close any open list
    if (inList) {
        html += '</ul>';
    }
    
    return html;
}
