/**
 * AI Content Generator JavaScript
 * Handles generation of marketing content for MSP services and products
 */

function initAiGenerator() {
    // Initialize state variables
    let customImageBase64 = null;
    let generatedContent = "";
    let selectedImageUrl = null;
    let imageAttribution = null;

    // DOM Element References
    const imageSourceRadios = document.querySelectorAll('input[name="image-source"]');
    const uploadImageGroup = document.getElementById('upload-image-group');
    const searchImageGroup = document.getElementById('search-image-group');
    const customImage = document.getElementById('custom-image-ai');
    const fileNameDisplay = document.getElementById('file-name-display');
    const searchImagesBtn = document.getElementById('search-images-btn');
    const imageSearchQuery = document.getElementById('image-search-query');
    const imageSearchResults = document.getElementById('image-search-results');
    const imagePositionRadios = document.querySelectorAll('input[name="image-position"]');
    const generateBtn = document.getElementById('generate-ai-btn');
    const clearBtn = document.getElementById('clear-ai-btn');
    const contentTopic = document.getElementById('content-topic');
    const contentTone = document.getElementById('content-tone');
    const contentLength = document.getElementById('content-length');
    const statusDiv = document.getElementById('ai-status');
    const progressContainer = document.getElementById('ai-progress-container');
    const progressBar = document.getElementById('ai-progress-bar');
    const aiContentText = document.getElementById('ai-content-text');
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    const contentPreview = document.getElementById('content-preview');
    const htmlCode = document.getElementById('html-code');

    // Check if elements exist - return if we're not on the AI generator tab
    if (!contentTopic || !contentTone) {
        return;
    }

    // Hide progress container initially
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }

    // Toggle between upload and search options
    imageSourceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'upload') {
                uploadImageGroup.style.display = 'block';
                searchImageGroup.style.display = 'none';
            } else {
                uploadImageGroup.style.display = 'none';
                searchImageGroup.style.display = 'block';
            }
        });
    });

    // Handle image upload
    customImage.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = function(event) {
                customImageBase64 = event.target.result;
                selectedImageUrl = null; // Clear any previously selected search image
                imageAttribution = null; // Clear any attribution
                updatePreview();
                updateHtmlCode();
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = 'No file selected';
        }
    });

    // Handle image search with improved error handling
    searchImagesBtn.addEventListener('click', async function() {
        const query = imageSearchQuery.value.trim();
        if (!query) {
            showStatus('error', 'Please enter search terms for the image search.');
            return;
        }

        // Use the content topic if no specific search query is entered
        const searchTerm = query || contentTopic.value.trim();
        
        if (!searchTerm) {
            showStatus('error', 'Please enter a search term or specify an MSP service/product.');
            return;
        }

        showStatus('info', 'Searching for images...');
        searchImagesBtn.disabled = true;
        imageSearchResults.innerHTML = '<p>Searching...</p>';

        try {
            // Call the Image Search API via Netlify function
            const response = await fetch('/api/image-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: searchTerm
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.details || 'Image search failed');
            }
            
            if (!data.images || data.images.length === 0) {
                imageSearchResults.innerHTML = '<p>No images found. Try different search terms.</p>';
                showStatus('info', 'No images found for your search terms.');
            } else {
                // Display image results
                imageSearchResults.innerHTML = '';
                data.images.forEach((image, index) => {
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-item';
                    imageItem.dataset.url = image.url;
                    imageItem.dataset.photographer = image.photographer || '';
                    imageItem.dataset.photographerUrl = image.photographerUrl || '';
                    
                    const img = document.createElement('img');
                    img.src = image.thumbnail;
                    img.alt = image.name;
                    img.onerror = function() {
                        // Replace broken images with a placeholder
                        this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2210%22%20x%3D%2210%22%20y%3D%2255%22%3EImage%20Error%3C%2Ftext%3E%3C%2Fsvg%3E';
                    };
                    
                    // Add photographer attribution
                    const attribution = document.createElement('div');
                    attribution.className = 'image-attribution';
                    attribution.innerHTML = `Photo by <a href="${image.photographerUrl}" target="_blank">${image.photographer}</a> on <a href="https://unsplash.com" target="_blank">Unsplash</a>`;
                    
                    imageItem.appendChild(img);
                    imageItem.appendChild(attribution);
                    imageSearchResults.appendChild(imageItem);
                    
                    // Add click event to select image
                    imageItem.addEventListener('click', function() {
                        // Remove selected class from all images
                        document.querySelectorAll('.image-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        
                        // Add selected class to clicked image
                        this.classList.add('selected');
                        
                        // Save the selected image URL
                        selectedImageUrl = this.dataset.url;
                        
                        // Fetch and convert the image to base64 with attribution
                        fetchImageAsBase64(
                            selectedImageUrl, 
                            this.dataset.photographer, 
                            this.dataset.photographerUrl
                        );
                    });
                });
                
                showStatus('success', 'Images found! Click on an image to select it.');
            }
        } catch (error) {
            console.error('Image search error:', error);
            showStatus('error', 'An error occurred during image search: ' + error.message);
            imageSearchResults.innerHTML = '<p>Error loading images. Please try again.</p>';
        } finally {
            searchImagesBtn.disabled = false;
        }
    });

    // Fetch image and convert to base64 with improved error handling
    async function fetchImageAsBase64(imageUrl, photographer, photographerUrl) {
        if (!imageUrl) return;
        
        // Store attribution information
        if (photographer && photographerUrl) {
            imageAttribution = `Photo by <a href="${photographerUrl}" target="_blank">${photographer}</a> on <a href="https://unsplash.com" target="_blank">Unsplash</a>`;
        } else {
            imageAttribution = null;
        }
        
        showStatus('info', 'Loading image...');
        
        try {
            const response = await fetch('/api/fetch-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: imageUrl
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to fetch image');
            }

            if (data.imageData) {
                customImageBase64 = data.imageData;
                updatePreview();
                updateHtmlCode();
                showStatus('success', 'Image loaded successfully!');
            } else {
                throw new Error('No image data received');
            }
        } catch (error) {
            console.error('Failed to load image:', error);
            showStatus('error', 'Failed to load image: ' + error.message);
            customImageBase64 = null;
            imageAttribution = null;
        }
    }

    // Handle image position change
    imagePositionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updatePreview();
            updateHtmlCode();
        });
    });

    // Generate AI content
    generateBtn.addEventListener('click', async function() {
        const topic = contentTopic.value.trim();
        const tone = contentTone.value;
        const paragraphs = parseInt(contentLength.value);

        if (!topic) {
            showStatus('error', 'Please enter an MSP service or product to generate content about.');
            return;
        }

        // Show progress
        showStatus('info', 'Generating content for ' + topic + '...');
        progressContainer.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Use the Netlify function to call Claude API
            const response = await fetch('/api/claude-api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic,
                    tone,
                    paragraphs
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            generatedContent = data.content;

            aiContentText.value = generatedContent;
            aiContentText.disabled = false;

            showStatus('success', 'Content generated successfully!');
            
            // If no image is selected yet, automatically search for one
            if (!customImageBase64 && document.getElementById('image-source-search').checked) {
                imageSearchQuery.value = topic;
                searchImagesBtn.click();
            }
            
            updatePreview();
            updateHtmlCode();
        } catch (error) {
            showStatus('error', 'An error occurred: ' + error.message);
        } finally {
            progressContainer.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    // Clear all fields
    clearBtn.addEventListener('click', function() {
        contentTopic.value = '';
        contentTone.selectedIndex = 0;
        contentLength.selectedIndex = 1;
        aiContentText.value = '';
        generatedContent = '';
        customImageBase64 = null;
        selectedImageUrl = null;
        imageAttribution = null;
        fileNameDisplay.textContent = 'No file selected';
        document.getElementById('image-source-upload').checked = true;
        document.getElementById('upload-image-group').style.display = 'block';
        document.getElementById('search-image-group').style.display = 'none';
        document.getElementById('image-left').checked = true;
        imageSearchQuery.value = '';
        imageSearchResults.innerHTML = '';
        customImage.value = ''; // Clear the file input

        // Clear preview and HTML
        contentPreview.innerHTML = '';
        htmlCode.textContent = '';

        showStatus('info', 'All fields cleared.');
    });

    // Update content when edited
    aiContentText.addEventListener('input', function() {
        generatedContent = this.value;
        updatePreview();
        updateHtmlCode();
    });

    // Copy HTML code
    copyHtmlBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(htmlCode.textContent)
        .then(() => {
            showStatus('success', 'HTML code copied to clipboard!');
        })
        .catch(err => {
            showStatus('error', 'Failed to copy code: ' + err);
            
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = htmlCode.textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            showStatus('success', 'HTML code copied to clipboard!');
        });
    });

    // Helper functions
    function showStatus(type, message) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';

        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    function getImagePosition() {
        for (const radio of imagePositionRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'left'; // Default position
    }

    function updatePreview() {
        // Format the content as paragraphs
        let formattedContent = '';
        if (generatedContent) {
            formattedContent = generatedContent
                .split('\n\n')
                .map(p => `<p>${p}</p>`)
                .join('');
        }
        
        // CORRECTED: Create a proper two-column layout with image and content
        if (customImageBase64 && generatedContent) {
            const imagePosition = getImagePosition();
            
            // Create image HTML with attribution if present
            let imageHtml = `<img src="${customImageBase64}" alt="Content Image" style="max-width:100%; height:auto; display:block;">`;
            if (imageAttribution) {
                imageHtml = `
                <div style="position: relative;">
                    ${imageHtml}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 4px; text-align: center;">
                        ${imageAttribution}
                    </div>
                </div>`;
            }
            
            // Create table with image on left or right
            let tableHtml = '';
            if (imagePosition === 'left') {
                tableHtml = `
                <table style="width:100%; border-collapse:collapse; border:none;">
                    <tr>
                        <td style="width:40%; vertical-align:top; padding:10px;">
                            ${imageHtml}
                        </td>
                        <td style="width:60%; vertical-align:top; padding:10px;">
                            ${formattedContent}
                        </td>
                    </tr>
                </table>`;
            } else {
                tableHtml = `
                <table style="width:100%; border-collapse:collapse; border:none;">
                    <tr>
                        <td style="width:60%; vertical-align:top; padding:10px;">
                            ${formattedContent}
                        </td>
                        <td style="width:40%; vertical-align:top; padding:10px;">
                            ${imageHtml}
                        </td>
                    </tr>
                </table>`;
            }
            
            contentPreview.innerHTML = tableHtml;
            
        } else if (customImageBase64) {
            // Only image, no content
            let imageHtml = `<img src="${customImageBase64}" alt="Content Image" style="max-width:100%; height:auto;">`;
            if (imageAttribution) {
                imageHtml = `
                <div style="position: relative;">
                    ${imageHtml}
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 4px; text-align: center;">
                        ${imageAttribution}
                    </div>
                </div>`;
            }
            contentPreview.innerHTML = imageHtml;
            
        } else if (generatedContent) {
            // Only content, no image
            contentPreview.innerHTML = formattedContent;
            
        } else {
            // Nothing to display
            contentPreview.innerHTML = '';
        }
    }

    function updateHtmlCode() {
        const imagePosition = getImagePosition();
        const topic = contentTopic.value.trim() || 'MSP Service';

        let htmlCodeContent = '';

        // Start building the HTML content
        htmlCodeContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${topic}</title>
<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h1 {
  color: #2c3e50;
}
p {
  margin-bottom: 1.2em;
}
img {
  max-width: 100%;
  height: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
td {
  vertical-align: top;
  padding: 10px;
}
.image-attribution {
  font-size: 10px;
  color: white;
  background-color: rgba(0,0,0,0.6);
  padding: 4px;
  text-align: center;
}
.image-attribution a {
  color: white;
  text-decoration: underline;
}
@media (max-width: 600px) {
  table, tr, td {
    display: block;
    width: 100%;
  }
  td {
    margin-bottom: 20px;
  }
}
</style>
</head>
<body>
<h1>${topic}</h1>`;

        // Format the paragraphs
        const formattedContent = generatedContent
            .split('\n\n')
            .map(p => `<p>${p}</p>`)
            .join('\n  ');

        // Add the content with image
        if (customImageBase64 && generatedContent) {
            // Create the image HTML with attribution if present
            let imageHtml = '';
            if (imageAttribution) {
                imageHtml = `
<div style="position: relative;">
  <img src="${customImageBase64}" alt="${topic} Image">
  <div class="image-attribution">
    ${imageAttribution}
  </div>
</div>`;
            } else {
                imageHtml = `
<img src="${customImageBase64}" alt="${topic} Image">`;
            }

            // Create table-based layout with image on left or right
            if (imagePosition === 'left') {
                htmlCodeContent += `
<table>
  <tr>
    <td style="width: 40%;">
      ${imageHtml}
    </td>
    <td style="width: 60%;">
      ${formattedContent}
    </td>
  </tr>
</table>`;
            } else {
                htmlCodeContent += `
<table>
  <tr>
    <td style="width: 60%;">
      ${formattedContent}
    </td>
    <td style="width: 40%;">
      ${imageHtml}
    </td>
  </tr>
</table>`;
            }
        } else if (customImageBase64) {
            // Only image
            if (imageAttribution) {
                htmlCodeContent += `
<div style="position: relative;">
  <img src="${customImageBase64}" alt="${topic} Image">
  <div class="image-attribution">
    ${imageAttribution}
  </div>
</div>`;
            } else {
                htmlCodeContent += `
<img src="${customImageBase64}" alt="${topic} Image">`;
            }
        } else if (generatedContent) {
            // Only content
            htmlCodeContent += `
${formattedContent}`;
        }

        // Close the HTML
        htmlCodeContent += `
</body>
</html>`;

        htmlCode.textContent = htmlCodeContent;
    }
}

// Initialize the AI generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', initAiGenerator);
