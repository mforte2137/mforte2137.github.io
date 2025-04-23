/**
 * AI Content Generator JavaScript
 * Completely isolated from external CSS/styles
 */

function initAiGenerator() {
    // Define all necessary DOM elements
    const contentPreview = document.getElementById('content-preview');
    const customImage = document.getElementById('custom-image-ai');
    const fileNameDisplay = document.getElementById('file-name-display');
    const contentTopic = document.getElementById('content-topic');
    const contentTone = document.getElementById('content-tone');
    const contentLength = document.getElementById('content-length');
    const aiContentText = document.getElementById('ai-content-text');
    const statusDiv = document.getElementById('ai-status');
    const progressContainer = document.getElementById('ai-progress-container');
    const generateBtn = document.getElementById('generate-ai-btn');
    const clearBtn = document.getElementById('clear-ai-btn');
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    const htmlCode = document.getElementById('html-code');
    const searchImagesBtn = document.getElementById('search-images-btn');
    const imageSearchQuery = document.getElementById('image-search-query');
    const imageSearchResults = document.getElementById('image-search-results');
    const imageSourceRadios = document.querySelectorAll('input[name="image-source"]');
    const uploadImageGroup = document.getElementById('upload-image-group');
    const searchImageGroup = document.getElementById('search-image-group');
    const imagePositionRadios = document.querySelectorAll('input[name="image-position"]');

    // Return if we're not on the AI Generator tab
    if (!contentTopic || !contentTone) {
        return;
    }

    // State variables
    let customImageBase64 = null;
    let generatedContent = "";
    let selectedImageUrl = null;
    let imageAttribution = null;

    // Initialize - ensure preview area is ready
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }

    // THIS IS CRITICAL: Create a completely controlled preview container
    if (contentPreview) {
        // Replace the original container with our controlled version
        const originalParent = contentPreview.parentNode;
        const newContainer = document.createElement('div');
        newContainer.id = 'content-preview-wrapper';
        newContainer.style.cssText = 'width: 100%; background: white; padding: 20px; border-radius: 4px;';
        originalParent.replaceChild(newContainer, contentPreview);
        
        // Create a new controlled preview element
        const newPreview = document.createElement('div');
        newPreview.id = 'content-preview';
        newPreview.style.cssText = 'width: 100%; display: block; box-sizing: border-box;';
        newContainer.appendChild(newPreview);
        
        // Update reference to the new element
        contentPreview = newPreview;
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
                selectedImageUrl = null;
                imageAttribution = null;
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

    // Fetch image and convert to base64
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
        uploadImageGroup.style.display = 'block';
        searchImageGroup.style.display = 'none';
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

    // DIRECT DOM MANIPULATION PREVIEW
    function updatePreview() {
        // First clear any existing content
        while (contentPreview.firstChild) {
            contentPreview.removeChild(contentPreview.firstChild);
        }
        
        // Only create content with image if there's an image
        if (customImageBase64 && generatedContent) {
            // Create table element with controlled styles
            const table = document.createElement('table');
            table.style.cssText = 'width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;';
            
            const tbody = document.createElement('tbody');
            const tr = document.createElement('tr');
            
            // Create the cells based on image position
            const imageCell = document.createElement('td');
            const contentCell = document.createElement('td');
            
            if (getImagePosition() === 'left') {
                imageCell.style.cssText = 'width: 40%; padding: 10px; vertical-align: top; text-align: center;';
                contentCell.style.cssText = 'width: 60%; padding: 10px; vertical-align: top;';
                tr.appendChild(imageCell);
                tr.appendChild(contentCell);
            } else {
                contentCell.style.cssText = 'width: 60%; padding: 10px; vertical-align: top;';
                imageCell.style.cssText = 'width: 40%; padding: 10px; vertical-align: top; text-align: center;';
                tr.appendChild(contentCell);
                tr.appendChild(imageCell);
            }
            
            // Create and add the image with attribution if needed
            const img = document.createElement('img');
            img.src = customImageBase64;
            img.alt = 'Content Image';
            img.style.cssText = 'max-width: 100%; height: auto; margin: 0 auto; display: block;';
            
            if (imageAttribution) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position: relative;';
                
                wrapper.appendChild(img);
                
                const attribution = document.createElement('div');
                attribution.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 4px; text-align: center;';
                attribution.innerHTML = imageAttribution;
                
                wrapper.appendChild(attribution);
                imageCell.appendChild(wrapper);
            } else {
                imageCell.appendChild(img);
            }
            
            // Add the content paragraphs
            const paragraphs = generatedContent.split('\n\n');
            
            paragraphs.forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                p.style.cssText = 'margin: 0 0 15px 0;';
                contentCell.appendChild(p);
            });
            
            // Assemble and add the table
            tbody.appendChild(tr);
            table.appendChild(tbody);
            contentPreview.appendChild(table);
        } else if (customImageBase64) {
            // Only image, no content
            if (imageAttribution) {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'position: relative; width: 100%; text-align: center;';
                
                const img = document.createElement('img');
                img.src = customImageBase64;
                img.alt = 'Content Image';
                img.style.cssText = 'max-width: 100%; height: auto;';
                
                wrapper.appendChild(img);
                
                const attribution = document.createElement('div');
                attribution.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.6); color: white; font-size: 10px; padding: 4px; text-align: center;';
                attribution.innerHTML = imageAttribution;
                
                wrapper.appendChild(attribution);
                contentPreview.appendChild(wrapper);
            } else {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'width: 100%; text-align: center;';
                
                const img = document.createElement('img');
                img.src = customImageBase64;
                img.alt = 'Content Image';
                img.style.cssText = 'max-width: 100%; height: auto;';
                
                wrapper.appendChild(img);
                contentPreview.appendChild(wrapper);
            }
        } else if (generatedContent) {
            // Only content, no image - create a single-cell table
            const table = document.createElement('table');
            table.style.cssText = 'width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;';
            
            const tbody = document.createElement('tbody');
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            
            td.style.cssText = 'width: 100%; padding: 10px; vertical-align: top;';
            
            // Add the content paragraphs
            const paragraphs = generatedContent.split('\n\n');
            
            paragraphs.forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                p.style.cssText = 'margin: 0 0 15px 0;';
                td.appendChild(p);
            });
            
            tr.appendChild(td);
            tbody.appendChild(tr);
            table.appendChild(tbody);
            contentPreview.appendChild(table);
        }
    }

    // Update HTML code
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
  border: none;
  table-layout: fixed;
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
  table, tbody, tr, td {
    display: block;
    width: 100% !important;
  }
  td {
    padding: 10px 0;
  }
}
</style>
</head>
<body>
<h1>${topic}</h1>`;

        // Format content and add it to HTML
        if (customImageBase64 && generatedContent) {
            // Both image and content - create two-column layout
            const formattedContent = generatedContent
                .split('\n\n')
                .map(p => `<p>${p}</p>`)
                .join('\n  ');

            // Add image with attribution if present
            if (imageAttribution) {
                htmlCodeContent += `
<table style="width:100%; table-layout:fixed;">
  <tr>
    <td style="width: ${imagePosition === 'left' ? '40%' : '60%'};">
      ${imagePosition === 'left' ? `
      <div style="position: relative; text-align:center;">
        <img src="${customImageBase64}" alt="${topic} Image">
        <div class="image-attribution">
          ${imageAttribution}
        </div>
      </div>` : formattedContent}
    </td>
    <td style="width: ${imagePosition === 'left' ? '60%' : '40%'};">
      ${imagePosition === 'left' ? formattedContent : `
      <div style="position: relative; text-align:center;">
        <img src="${customImageBase64}" alt="${topic} Image">
        <div class="image-attribution">
          ${imageAttribution}
        </div>
      </div>`}
    </td>
  </tr>
</table>`;
            } else {
                htmlCodeContent += `
<table style="width:100%; table-layout:fixed;">
  <tr>
    <td style="width: ${imagePosition === 'left' ? '40%' : '60%'}; text-align:${imagePosition === 'left' ? 'center' : 'left'};">
      ${imagePosition === 'left' ? `
      <img src="${customImageBase64}" alt="${topic} Image">` : formattedContent}
    </td>
    <td style="width: ${imagePosition === 'left' ? '60%' : '40%'}; text-align:${imagePosition === 'left' ? 'left' : 'center'};">
      ${imagePosition === 'left' ? formattedContent : `
      <img src="${customImageBase64}" alt="${topic} Image">`}
    </td>
  </tr>
</table>`;
            }
        } else if (customImageBase64) {
            // Only image
            if (imageAttribution) {
                htmlCodeContent += `
<div style="position: relative; text-align: center; width:100%;">
  <img src="${customImageBase64}" alt="${topic} Image">
  <div class="image-attribution">
    ${imageAttribution}
  </div>
</div>`;
            } else {
                htmlCodeContent += `
<div style="text-align: center; width:100%;">
  <img src="${customImageBase64}" alt="${topic} Image">
</div>`;
            }
        } else if (generatedContent) {
            // Only content - use a single column table for consistency
            const formattedContent = generatedContent
                .split('\n\n')
                .map(p => `<p>${p}</p>`)
                .join('\n  ');

            htmlCodeContent += `
<table style="width:100%; table-layout:fixed;">
  <tr>
    <td style="width: 100%;">
      ${formattedContent}
    </td>
  </tr>
</table>`;
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
