/**
 * AI Content Generator JavaScript
 * Completely isolated from external CSS/styles
 */

function initAiGenerator() {
    // Define all necessary DOM elements - using let instead of const for elements that might be replaced
    let contentPreview = document.getElementById('content-preview');
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
    const previewWrapper = document.getElementById('ai-preview-wrapper');

    // Debug check to verify elements are found correctly
    const requiredElements = [
        { name: 'contentPreview', element: contentPreview },
        { name: 'customImage', element: customImage },
        { name: 'fileNameDisplay', element: fileNameDisplay },
        { name: 'contentTopic', element: contentTopic },
        { name: 'contentTone', element: contentTone },
        { name: 'aiContentText', element: aiContentText },
        { name: 'statusDiv', element: statusDiv },
        { name: 'generateBtn', element: generateBtn },
        { name: 'clearBtn', element: clearBtn },
        { name: 'copyHtmlBtn', element: copyHtmlBtn },
        { name: 'htmlCode', element: htmlCode },
        { name: 'previewWrapper', element: previewWrapper }
    ];

    // Check if required elements exist
    let missingElements = requiredElements.filter(item => !item.element);
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements.map(item => item.name).join(', '));
        return; // Exit initialization if critical elements are missing
    }

    // Return if we're not on the AI Generator tab
    if (!contentTopic || !contentTone) {
        console.log('Not on AI Generator tab, skipping initialization');
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

    // Ensure the preview container is properly set up
    if (contentPreview) {
        console.log('Content preview found, ensuring proper setup');
        
        // Make sure the container is empty and ready for content
        while (contentPreview.firstChild) {
            contentPreview.removeChild(contentPreview.firstChild);
        }
    } else {
        console.error('Content preview element not found');
    }

    // Toggle between upload and search options
    if (imageSourceRadios && imageSourceRadios.length > 0) {
        imageSourceRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'upload') {
                    if (uploadImageGroup) uploadImageGroup.style.display = 'block';
                    if (searchImageGroup) searchImageGroup.style.display = 'none';
                } else {
                    if (uploadImageGroup) uploadImageGroup.style.display = 'none';
                    if (searchImageGroup) searchImageGroup.style.display = 'block';
                }
            });
        });
    }

    // Handle image upload
    if (customImage) {
        customImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (fileNameDisplay) fileNameDisplay.textContent = file.name;
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
                if (fileNameDisplay) fileNameDisplay.textContent = 'No file selected';
            }
        });
    }

    // Handle image search with improved error handling
    if (searchImagesBtn) {
        searchImagesBtn.addEventListener('click', async function() {
            const query = imageSearchQuery ? imageSearchQuery.value.trim() : '';
            if (!query) {
                showStatus('error', 'Please enter search terms for the image search.');
                return;
            }

            // Use the content topic if no specific search query is entered
            const searchTerm = query || (contentTopic ? contentTopic.value.trim() : '');
            
            if (!searchTerm) {
                showStatus('error', 'Please enter a search term or specify an MSP service/product.');
                return;
            }

            showStatus('info', 'Searching for images...');
            searchImagesBtn.disabled = true;
            if (imageSearchResults) imageSearchResults.innerHTML = '<p>Searching...</p>';

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
                    if (imageSearchResults) imageSearchResults.innerHTML = '<p>No images found. Try different search terms.</p>';
                    showStatus('info', 'No images found for your search terms.');
                } else {
                    // Display image results
                    if (imageSearchResults) {
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
                    }
                    
                    showStatus('success', 'Images found! Click on an image to select it.');
                }
            } catch (error) {
                console.error('Image search error:', error);
                showStatus('error', 'An error occurred during image search: ' + error.message);
                if (imageSearchResults) imageSearchResults.innerHTML = '<p>Error loading images. Please try again.</p>';
            } finally {
                searchImagesBtn.disabled = false;
            }
        });
    }

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
    if (imagePositionRadios && imagePositionRadios.length > 0) {
        imagePositionRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                updatePreview();
                updateHtmlCode();
            });
        });
    }

    // Generate AI content
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            console.log('Generate AI Content button clicked');
            
            const topic = contentTopic ? contentTopic.value.trim() : '';
            const tone = contentTone ? contentTone.value : 'professional';
            const paragraphs = contentLength ? parseInt(contentLength.value) : 2;

            if (!topic) {
                showStatus('error', 'Please enter an MSP service or product to generate content about.');
                return;
            }

            // Show progress
            showStatus('info', 'Generating content for ' + topic + '...');
            if (progressContainer) progressContainer.style.display = 'block';
            generateBtn.disabled = true;

            try {
                console.log('Calling AI API with:', { topic, tone, paragraphs });
                
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

                if (aiContentText) {
                    aiContentText.value = generatedContent;
                    aiContentText.disabled = false;
                }

                showStatus('success', 'Content generated successfully!');
                
                // If no image is selected yet, automatically search for one
                if (!customImageBase64 && document.getElementById('image-source-search') && document.getElementById('image-source-search').checked) {
                    if (imageSearchQuery) {
                        imageSearchQuery.value = topic;
                        if (searchImagesBtn) searchImagesBtn.click();
                    }
                }
                
                updatePreview();
                updateHtmlCode();
            } catch (error) {
                console.error('Error generating content:', error);
                showStatus('error', 'An error occurred: ' + error.message);
            } finally {
                if (progressContainer) progressContainer.style.display = 'none';
                generateBtn.disabled = false;
            }
        });
    }

    // Clear all fields
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (contentTopic) contentTopic.value = '';
            if (contentTone) contentTone.selectedIndex = 0;
            if (contentLength) contentLength.selectedIndex = 1;
            if (aiContentText) aiContentText.value = '';
            generatedContent = '';
            customImageBase64 = null;
            selectedImageUrl = null;
            imageAttribution = null;
            if (fileNameDisplay) fileNameDisplay.textContent = 'No file selected';
            
            const uploadRadio = document.getElementById('image-source-upload');
            if (uploadRadio) uploadRadio.checked = true;
            
            if (uploadImageGroup) uploadImageGroup.style.display = 'block';
            if (searchImageGroup) searchImageGroup.style.display = 'none';
            
            const leftPositionRadio = document.getElementById('image-left');
            if (leftPositionRadio) leftPositionRadio.checked = true;
            
            if (imageSearchQuery) imageSearchQuery.value = '';
            if (imageSearchResults) imageSearchResults.innerHTML = '';
            if (customImage) customImage.value = ''; // Clear the file input

            // Clear preview and HTML
            if (contentPreview) contentPreview.innerHTML = '';
            if (htmlCode) htmlCode.textContent = '';

            showStatus('info', 'All fields cleared.');
        });
    }

    // Update content when edited
    if (aiContentText) {
        aiContentText.addEventListener('input', function() {
            generatedContent = this.value;
            updatePreview();
            updateHtmlCode();
        });
    }

    // Copy HTML code
    if (copyHtmlBtn) {
        copyHtmlBtn.addEventListener('click', function() {
            if (!htmlCode || !htmlCode.textContent) {
                showStatus('error', 'No HTML code to copy.');
                return;
            }
            
            navigator.clipboard.writeText(htmlCode.textContent)
            .then(() => {
                showStatus('success', 'HTML code copied to clipboard!');
            })
            .catch(err => {
                console.error('Clipboard error:', err);
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
    }

    // Helper functions
    function showStatus(type, message) {
        console.log(`Status: [${type}] ${message}`);
        
        if (!statusDiv) return;
        
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';

        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    function getImagePosition() {
        if (!imagePositionRadios || imagePositionRadios.length === 0) return 'left';
        
        for (const radio of imagePositionRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'left'; // Default position
    }

    // DIRECT DOM MANIPULATION PREVIEW
    function updatePreview() {
        console.log('Updating preview with:', {
            hasImage: !!customImageBase64,
            hasContent: !!generatedContent,
            imagePosition: getImagePosition()
        });
        
        if (!contentPreview) {
            console.error('Cannot update preview: content preview element not found');
            return;
        }
        
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
                if (!text.trim()) return; // Skip empty paragraphs
                
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
                if (!text.trim()) return; // Skip empty paragraphs
                
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
        console.log('Updating HTML code');
        
        if (!htmlCode) {
            console.error('Cannot update HTML code: HTML code element not found');
            return;
        }
        
        const imagePosition = getImagePosition();
        const topic = contentTopic ? contentTopic.value.trim() : 'MSP Service';

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
                .filter(p => p.trim())
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
                .filter(p => p.trim())
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
    
    // Log successful initialization
    console.log('AI Generator successfully initialized');
}

// Initialize the AI generator when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing AI Generator');
    initAiGenerator();
});

// Also initialize when the tab is clicked
document.addEventListener('DOMContentLoaded', function() {
    const aiTabButton = document.querySelector('.tab-button[data-tab="ai-generator"]');
    if (aiTabButton) {
        aiTabButton.addEventListener('click', function() {
            console.log('AI Generator tab clicked, reinitializing');
            setTimeout(initAiGenerator, 100); // Small delay to ensure DOM is updated after tab switch
        });
    }
});

// For debugging - output a message to help troubleshoot
console.log('AI Generator script loaded');
