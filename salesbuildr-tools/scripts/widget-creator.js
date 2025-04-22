/**
 * Widget Creator JavaScript
 * Handles widget creation and content extraction from websites
 */

function initWidgetCreator() {
    // DOM Elements
    const urlInput = document.getElementById('website-url');
    const fetchBtn = document.getElementById('fetch-content-btn');
    const imagePositionSelect = document.getElementById('image-position');
    const summaryLengthSelect = document.getElementById('summary-length');
    const customImageInput = document.getElementById('custom-image');
    const summaryTextarea = document.getElementById('summary-text');
    const generateWidgetBtn = document.getElementById('generate-widget-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const widgetStatus = document.getElementById('widget-status');
    const widgetPreviewContainer = document.getElementById('widget-preview-container');
    const widgetPreview = document.getElementById('widget-preview');
    const widgetCode = document.getElementById('widget-code');
    const copyCodeBtn = document.getElementById('copy-code-btn');
    
    // Initialize with widget-preview-container hidden
    if (widgetPreviewContainer) {
        widgetPreviewContainer.style.display = 'none';
    }
    
    // Add event listener to detect changes in the summary textarea
    if (summaryTextarea) {
        summaryTextarea.addEventListener('input', function() {
            // Clear the formatted content from the data attribute when user edits the text
            delete summaryTextarea.dataset.formattedContent;
        });
    }
    
    // Event Listeners
    if (fetchBtn) fetchBtn.addEventListener('click', fetchWebsiteContent);
    if (customImageInput) customImageInput.addEventListener('change', handleCustomImage);
    if (generateWidgetBtn) generateWidgetBtn.addEventListener('click', generateWidget);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearWidgetForm);
    if (copyCodeBtn) copyCodeBtn.addEventListener('click', copyWidgetCode);
    
    // State variables
    let currentImageUrl = null;
    let customImageUrl = null;
    
    // Helper function for showing widget status messages
    function showWidgetStatus(message, type) {
        if (!widgetStatus) return;
        
        widgetStatus.textContent = message;
        widgetStatus.className = `status ${type}`;
        widgetStatus.style.display = 'block';
        setTimeout(() => {
            widgetStatus.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }
    
    // Handle custom image upload
    function handleCustomImage(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showWidgetStatus('Please select a valid image file.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            customImageUrl = event.target.result;
            showWidgetStatus('Custom image uploaded successfully.', 'success');
        };
        reader.readAsDataURL(file);
    }
    
    // Fetch website content
    async function fetchWebsiteContent() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showWidgetStatus('Please enter a valid URL.', 'error');
            return;
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            showWidgetStatus('URL must start with http:// or https://.', 'error');
            return;
        }
        
        try {
            // Show loading status
            showWidgetStatus('Fetching website content...', 'info');
            fetchBtn.disabled = true;
            fetchBtn.textContent = 'Fetching...';
            summaryTextarea.value = 'Loading content...';
            
            // First get the image from get-website-images
            const imageResponse = await fetch('/.netlify/functions/get-website-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            if (!imageResponse.ok) {
                throw new Error('Error fetching website images');
            }
            
            const imageData = await imageResponse.json();
            
            // Then get the content from summarize-website
            const summaryLength = summaryLengthSelect.value;
            const contentResponse = await fetch('/.netlify/functions/summarize-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, summaryLength })
            });
            
            if (!contentResponse.ok) {
                throw new Error('Error fetching website content');
            }
            
            const contentData = await contentResponse.json();
            
            // Update UI with the fetched content
            summaryTextarea.value = contentData.summary || "No summary available";
            currentImageUrl = imageData.mainImage || null;
            
            // Convert image to Base64 immediately to avoid CORS issues later
            if (currentImageUrl) {
                try {
                    const base64Image = await convertImageToBase64(currentImageUrl);
                    currentImageUrl = base64Image;
                } catch (error) {
                    console.error('Error converting image to Base64:', error);
                    // Keep the original URL if conversion fails
                }
            }
            
            // Store original content in data attributes
            summaryTextarea.dataset.originalContent = contentData.summary;
            summaryTextarea.dataset.formattedContent = contentData.formattedContent || formatTextToHtml(contentData.summary);
            summaryTextarea.dataset.imageUrl = currentImageUrl;
            
            // Update the preview with the fetched data
            const formattedContent = contentData.formattedContent || formatTextToHtml(contentData.summary);
            const position = imagePositionSelect.value;
            
            await updateWidgetPreview(currentImageUrl, formattedContent, position);
            
            showWidgetStatus('Content fetched successfully!', 'success');
            widgetPreviewContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching website content:', error);
            summaryTextarea.value = 'Error fetching content. Please try again.';
            showWidgetStatus('Error fetching website content. The website might be blocking requests.', 'error');
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Fetch Content';
        }
    }
    
    // Convert image URL to Base64
    function convertImageToBase64(url) {
        return new Promise((resolve, reject) => {
            // Handle if the URL is already a base64 string
            if (url.startsWith('data:image')) {
                resolve(url);
                return;
            }
            
            // Handle if the URL is a blob URL from a file upload
            if (url.startsWith('blob:')) {
                // We need to fetch the blob and convert it
                fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    })
                    .catch(reject);
                return;
            }
            
            // For regular URLs, create an image element to load the image
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
            
            img.onload = function() {
                try {
                    // Create a canvas and draw the image on it
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert the canvas to a Base64 data URL
                    const dataURL = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for better compression
                    resolve(dataURL);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = function() {
                // If CORS or other issues prevent loading the image,
                // try using a proxy or fall back to the original URL
                if (url.startsWith('https://images.weserv.nl/')) {
                    // If already using a proxy, just reject
                    reject(new Error('Cannot load image even with proxy'));
                } else {
                    // Try with a proxy service
                    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
                    convertImageToBase64(proxyUrl)
                        .then(resolve)
                        .catch(() => {
                            // If still can't load, reject with the original error
                            reject(new Error('Cannot load image'));
                        });
                }
            };
            
            img.src = url;
        });
    }
    
    // Generate widget preview and code
    async function generateWidget() {
        // Get settings
        const imagePosition = imagePositionSelect.value;
        const summaryText = summaryTextarea.value.trim();
        
        if (!summaryText) {
            showWidgetStatus('Please fetch or enter content first.', 'error');
            return;
        }
        
        // Use custom image if uploaded, otherwise use fetched image
        const imageUrl = customImageUrl || currentImageUrl || 'https://via.placeholder.com/400x300/cccccc/666666?text=No+Image';
        
        // Get the formatted content (either from data attribute or format the current text)
        const formattedContent = formatTextToHtml(summaryText);
        
        // Update the widget preview
        await updateWidgetPreview(imageUrl, formattedContent, imagePosition);
        
        // Generate the widget code for embedding
        const widgetCode = await generateWidgetCode(imageUrl, formattedContent, imagePosition);
        
        // Show the widget code
        if (widgetCode) {
            document.getElementById('widget-code').textContent = widgetCode;
            widgetPreviewContainer.style.display = 'block';
        }
        
        showWidgetStatus('Widget generated successfully!', 'success');
    }
    
    // Update the widget preview with the given content and image position
    async function updateWidgetPreview(imageUrl, content, position = 'left') {
        if (!widgetPreview) return;
        
        // Convert the image to Base64 if it's a URL
        let base64Image = '';
        if (imageUrl) {
            try {
                base64Image = await convertImageToBase64(imageUrl);
            } catch (error) {
                console.error('Error converting image to Base64:', error);
                showWidgetStatus('Error processing image. Using original URL.', 'error');
                base64Image = imageUrl; // Fallback to original URL
            }
        }
        
        // Always create a 2-column x 1-row table layout with centered image
        let widgetHtml = `
            <table style="width:100%; border-collapse:collapse; border:none;">
                <tr>
        `;
        
        if (position === 'left') {
            widgetHtml += `
                    <td style="width:30%; vertical-align:middle; text-align:center; padding:10px;">
                        <img src="${base64Image}" alt="Website Content" style="max-width:100%; height:auto; margin:0 auto; display:block;">
                    </td>
                    <td style="width:70%; vertical-align:top; padding:10px;">
                        ${content}
                    </td>
            `;
        } else if (position === 'right') {
            widgetHtml += `
                    <td style="width:70%; vertical-align:top; padding:10px;">
                        ${content}
                    </td>
                    <td style="width:30%; vertical-align:middle; text-align:center; padding:10px;">
                        <img src="${base64Image}" alt="Website Content" style="max-width:100%; height:auto; margin:0 auto; display:block;">
                    </td>
            `;
        } else if (position === 'top' || position === 'bottom') {
            // For top/bottom positions, we'll still use a 2-column table but make the image span both columns
            const imageHtml = `
                <td colspan="2" style="text-align:center; padding:10px;">
                    <img src="${base64Image}" alt="Website Content" style="max-width:50%; height:auto; margin:0 auto; display:block;">
                </td>
            `;
            
            const contentHtml = `
                <td colspan="2" style="padding:10px;">
                    ${content}
                </td>
            `;
            
            // Close the first row and add a second row
            widgetHtml += position === 'top' 
                ? `${imageHtml}</tr><tr>${contentHtml}`
                : `${contentHtml}</tr><tr>${imageHtml}`;
        } else {
            // No image - content takes full width
            widgetHtml += `
                    <td colspan="2" style="padding:10px;">
                        ${content}
                    </td>
            `;
        }
        
        widgetHtml += `
                </tr>
            </table>
        `;
        
        // Update the preview area
        widgetPreview.innerHTML = widgetHtml;
    }
    
    // Format plain text to HTML (detect paragraphs and lists)
    function formatTextToHtml(text) {
        if (!text) return '';
        
        // Split by new lines to identify paragraphs and lists
        const lines = text.split('\n');
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
    
    // Generate embeddable widget code with base64 image
    async function generateWidgetCode(imageUrl, content, position) {
        // Convert the image to Base64 if it's a URL
        let base64Image = '';
        if (imageUrl) {
            try {
                base64Image = await convertImageToBase64(imageUrl);
            } catch (error) {
                console.error('Error converting image to Base64:', error);
                base64Image = imageUrl; // Fallback to original URL
            }
        }
        
        // Create a simple 2-column x 1-row table with centered image
        let widgetHtml = `<table style="width:100%; border-collapse:collapse; border:none;">\n  <tr>\n`;
        
        if (position === 'left') {
            widgetHtml += `    <td style="width:30%; vertical-align:middle; text-align:center; padding:10px;">\n      <img src="${base64Image}" alt="Website Content" style="max-width:100%; height:auto; margin:0 auto; display:block;">\n    </td>\n    <td style="width:70%; vertical-align:top; padding:10px;">\n      ${content}\n    </td>\n`;
        } else if (position === 'right') {
            widgetHtml += `    <td style="width:70%; vertical-align:top; padding:10px;">\n      ${content}\n    </td>\n    <td style="width:30%; vertical-align:middle; text-align:center; padding:10px;">\n      <img src="${base64Image}" alt="Website Content" style="max-width:100%; height:auto; margin:0 auto; display:block;">\n    </td>\n`;
        } else if (position === 'top') {
            widgetHtml += `    <td colspan="2" style="text-align:center; padding:10px;">\n      <img src="${base64Image}" alt="Website Content" style="max-width:50%; height:auto; margin:0 auto; display:block;">\n    </td>\n  </tr>\n  <tr>\n    <td colspan="2" style="padding:10px;">\n      ${content}\n    </td>\n`;
        } else if (position === 'bottom') {
            widgetHtml += `    <td colspan="2" style="padding:10px;">\n      ${content}\n    </td>\n  </tr>\n  <tr>\n    <td colspan="2" style="text-align:center; padding:10px;">\n      <img src="${base64Image}" alt="Website Content" style="max-width:50%; height:auto; margin:0 auto; display:block;">\n    </td>\n`;
        } else {
            // No image - content takes full width
            widgetHtml += `    <td colspan="2" style="padding:10px;">\n      ${content}\n    </td>\n`;
        }
        
        widgetHtml += `  </tr>\n</table>`;
        
        return widgetHtml;
    }
    
    // Copy widget code to clipboard
    function copyWidgetCode() {
        const codeText = document.getElementById('widget-code').textContent;
        
        navigator.clipboard.writeText(codeText)
            .then(() => {
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyCodeBtn.textContent = 'Copy Code';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                
                // Fallback copy method
                const textarea = document.createElement('textarea');
                textarea.value = codeText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyCodeBtn.textContent = 'Copy Code';
                }, 2000);
            });
    }
    
    // Clear widget form
    function clearWidgetForm() {
        if (urlInput) urlInput.value = '';
        if (summaryTextarea) summaryTextarea.value = '';
        if (customImageInput) customImageInput.value = '';
        
        // Reset data attributes
        if (summaryTextarea) {
            delete summaryTextarea.dataset.originalContent;
            delete summaryTextarea.dataset.formattedContent;
            delete summaryTextarea.dataset.imageUrl;
        }
        
        // Reset state variables
        currentImageUrl = null;
        customImageUrl = null;
        
        // Hide preview container
        if (widgetPreviewContainer) {
            widgetPreviewContainer.style.display = 'none';
        }
        
        // Clear preview
        if (widgetPreview) {
            widgetPreview.innerHTML = '';
        }
        
        // Clear code
        if (widgetCode) {
            widgetCode.textContent = '';
        }
        
        showWidgetStatus('Form cleared.', 'info');
    }
}

// Initialize the widget creator when the DOM is loaded
document.addEventListener('DOMContentLoaded', initWidgetCreator);
