/**
 * Widget Creator JavaScript
 * Handles widget creation and content extraction from websites
 * Improved version with better scraping success rate
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
    
    // Added feature to extract domain from URL
    if (urlInput) {
        urlInput.addEventListener('blur', function() {
            const url = urlInput.value.trim();
            if (url) {
                try {
                    const domain = new URL(url).hostname;
                    console.log('Domain extracted:', domain);
                } catch (error) {
                    // Invalid URL, do nothing
                }
            }
        });
    }
    
    // State variables
    let currentImageUrl = null;
    let customImageUrl = null;
    let fetchAttempts = 0;
    const MAX_ATTEMPTS = 2; // Maximum number of retry attempts
    
    // Helper function for showing widget status messages
    function showWidgetStatus(message, type) {
        if (!widgetStatus) return;
        
        console.log(`Widget Status: [${type}] ${message}`);
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
    
    // Normalize URL to ensure it's valid
    function normalizeUrl(url) {
        // Trim whitespace
        url = url.trim();
        
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Try to create a URL object to validate
        try {
            const urlObj = new URL(url);
            return urlObj.toString();
        } catch (e) {
            throw new Error('Invalid URL format');
        }
    }
    
    // Extract domain from URL
    function extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return null;
        }
    }
    
    // Preload parameters based on website domain
    function getOptimizedParams(url) {
        const domain = extractDomain(url);
        if (!domain) return {};
        
        // Domain-specific optimizations
        const optimizations = {
            // Tech sites often have article content
            'techcrunch.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
            'theverge.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
            'wired.com': { renderJs: true, premiumProxy: true, waitFor: 3000 },
            
            // E-commerce sites
            'amazon.com': { renderJs: true, premiumProxy: true, waitFor: 5000, javascriptEnabled: true },
            'bestbuy.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
            'walmart.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
            
            // Social media
            'twitter.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
            'linkedin.com': { renderJs: true, premiumProxy: true, waitFor: 5000 },
            
            // MSP and tech vendor sites
            'microsoft.com': { renderJs: true, waitFor: 3000 },
            'dell.com': { renderJs: true, waitFor: 3000 },
            'hp.com': { renderJs: true, waitFor: 3000 },
            'cisco.com': { renderJs: true, waitFor: 3000 },
            'ibm.com': { renderJs: true, waitFor: 3000 },
            
            // Default parameters for other domains
            'default': { renderJs: true, waitFor: 2000 }
        };
        
        // Check for partial domain matches (e.g., subdomain.example.com should match example.com)
        for (const [key, value] of Object.entries(optimizations)) {
            if (domain.includes(key)) {
                console.log(`Using optimized parameters for ${domain}`);
                return value;
            }
        }
        
        return optimizations.default;
    }
    
    // Fetch website content
    async function fetchWebsiteContent() {
        let url = urlInput.value.trim();
        
        if (!url) {
            showWidgetStatus('Please enter a valid URL.', 'error');
            return;
        }
        
        try {
            // Normalize the URL
            url = normalizeUrl(url);
        } catch (error) {
            showWidgetStatus('Please enter a valid URL.', 'error');
            return;
        }
        
        try {
            // Reset attempt counter
            fetchAttempts = 0;
            
            // Show loading status
            showWidgetStatus('Fetching website content...', 'info');
            fetchBtn.disabled = true;
            fetchBtn.textContent = 'Fetching...';
            summaryTextarea.value = 'Loading content...';
            
            // Get optimized parameters for this domain
            const optimizedParams = getOptimizedParams(url);
            console.log('Using optimized parameters:', optimizedParams);
            
            // Try fetching content with improved error handling and retries
            await fetchContentWithRetry(url, optimizedParams);
            
        } catch (error) {
            console.error('Error fetching website content:', error);
            summaryTextarea.value = 'Error fetching content. Please try again or enter content manually.';
            showWidgetStatus('Error fetching website content. The website might be blocking requests.', 'error');
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Fetch Content';
        }
    }
    
    // Fetch content with automatic retry logic
    async function fetchContentWithRetry(url, optimizedParams) {
        while (fetchAttempts < MAX_ATTEMPTS) {
            try {
                // Increment attempt counter
                fetchAttempts++;
                
                if (fetchAttempts > 1) {
                    showWidgetStatus(`Retry attempt ${fetchAttempts}/${MAX_ATTEMPTS}...`, 'info');
                    
                    // Adjust parameters for retry attempts
                    optimizedParams.renderJs = true; // Always enable JS rendering on retries
                    optimizedParams.waitFor = optimizedParams.waitFor ? optimizedParams.waitFor + 2000 : 5000; // Increase wait time
                    optimizedParams.premiumProxy = true; // Use premium proxy on retries
                }
                
                // First get the image from get-website-images
                const imageResponse = await fetch('/.netlify/functions/get-website-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url,
                        ...optimizedParams
                    })
                });
                
                // Check if we got a successful response
                if (!imageResponse.ok) {
                    const errorData = await imageResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to fetch images: ${imageResponse.status}`);
                }
                
                const imageData = await imageResponse.json();
                
                // Then get the content from summarize-website
                const summaryLength = summaryLengthSelect.value;
                const contentResponse = await fetch('/.netlify/functions/summarize-website', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        url, 
                        summaryLength,
                        ...optimizedParams
                    })
                });
                
                // Check if we got a successful response
                if (!contentResponse.ok) {
                    const errorData = await contentResponse.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to fetch content: ${contentResponse.status}`);
                }
                
                const contentData = await contentResponse.json();
                
                // If no content was found, try a fallback approach
                if (!contentData.summary || contentData.summary.trim() === '') {
                    throw new Error('No content extracted from website');
                }
                
                // Update UI with the fetched content
                summaryTextarea.value = contentData.summary || "No summary available";
                currentImageUrl = imageData.mainImage || null;
                
                // If we got an image but no content or vice versa, wait a bit and try again
                if ((!currentImageUrl && contentData.summary) || (currentImageUrl && !contentData.summary)) {
                    console.log('Partial data received - got', 
                        currentImageUrl ? 'image' : 'no image', 
                        contentData.summary ? 'content' : 'no content');
                        
                    if (fetchAttempts < MAX_ATTEMPTS) {
                        // Try once more with adjusted parameters
                        continue;
                    }
                }
                
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
                
                // If we reached here, we succeeded
                return;
                
            } catch (error) {
                console.error(`Attempt ${fetchAttempts}/${MAX_ATTEMPTS} failed:`, error);
                
                if (fetchAttempts >= MAX_ATTEMPTS) {
                    // If we've exhausted our attempts, try a different approach: direct meta tags
                    try {
                        console.log('Trying fallback method: Direct meta tag extraction');
                        showWidgetStatus('Trying alternative method...', 'info');
                        
                        // Call a dedicated fallback function that uses a different approach
                        const fallbackData = await fetchWithFallbackMethod(url);
                        
                        if (fallbackData.success) {
                            // Update with fallback data
                            summaryTextarea.value = fallbackData.summary || "Limited content available. Please edit as needed.";
                            currentImageUrl = fallbackData.image || null;
                            
                            // Convert image if available
                            if (currentImageUrl) {
                                try {
                                    const base64Image = await convertImageToBase64(currentImageUrl);
                                    currentImageUrl = base64Image;
                                } catch (error) {
                                    console.error('Error converting fallback image to Base64:', error);
                                }
                            }
                            
                            // Store in data attributes
                            summaryTextarea.dataset.originalContent = fallbackData.summary;
                            const formattedContent = formatTextToHtml(fallbackData.summary);
                            summaryTextarea.dataset.formattedContent = formattedContent;
                            summaryTextarea.dataset.imageUrl = currentImageUrl;
                            
                            // Update preview
                            const position = imagePositionSelect.value;
                            await updateWidgetPreview(currentImageUrl, formattedContent, position);
                            
                            showWidgetStatus('Limited content extracted. You may need to edit it.', 'warning');
                            widgetPreviewContainer.style.display = 'block';
                            return;
                        } else {
                            throw new Error('Fallback method also failed');
                        }
                    } catch (fallbackError) {
                        console.error('Fallback method failed:', fallbackError);
                        throw new Error('All extraction methods failed. Please enter content manually.');
                    }
                }
                
                // If we're not at max attempts yet, we'll retry in the next loop iteration
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
            }
        }
    }
    
    // Fallback method for extracting content directly
    async function fetchWithFallbackMethod(url) {
        // This function represents a different approach to extract content
        // It could use a different API endpoint or a simpler extraction technique
        
        try {
            // Try to fetch basic metadata directly
            const response = await fetch('/.netlify/functions/fallback-extractor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                throw new Error(`Fallback API failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Check if we got useful data
            if (data && (data.title || data.description || data.image)) {
                // Construct a summary from the metadata
                let summary = '';
                
                if (data.title) {
                    summary += data.title + '\n\n';
                }
                
                if (data.description) {
                    summary += data.description;
                }
                
                return {
                    success: true,
                    summary: summary,
                    image: data.image || null
                };
            } else {
                throw new Error('No useful data from fallback method');
            }
        } catch (error) {
            console.error('Fallback extraction failed:', error);
            return { success: false };
        }
    }
    
    // Convert image URL to Base64 with improved error handling
    async function convertImageToBase64(url) {
        return new Promise(async (resolve, reject) => {
            // Handle if the URL is already a base64 string
            if (url.startsWith('data:image')) {
                resolve(url);
                return;
            }
            
            // Handle if the URL is a blob URL from a file upload
            if (url.startsWith('blob:')) {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                } catch (error) {
                    reject(error);
                }
                return;
            }
            
            // Try to use the server-side fetch-image API first (more reliable for CORS)
            try {
                const response = await fetch('/.netlify/functions/fetch-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: url })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.imageData) {
                        resolve(data.imageData);
                        return;
                    }
                }
                // If server-side fetch fails, continue with client-side approach
                console.log('Server-side image fetch failed, trying client-side approach');
            } catch (error) {
                console.warn('Server-side image fetch failed:', error);
                // Continue with client-side approach
            }
            
            // For regular URLs, create an image element to load the image
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Try to avoid CORS issues
            
            // Set a timeout to avoid hanging
            const timeoutId = setTimeout(() => {
                img.src = ''; // Cancel the image load
                reject(new Error('Image loading timed out'));
            }, 10000);
            
            img.onload = function() {
                clearTimeout(timeoutId);
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
                clearTimeout(timeoutId);
                
                // If CORS or other issues prevent loading the image,
                // try using a proxy or fall back to the original URL
                if (url.includes('images.weserv.nl') || url.includes('cors-anywhere') || url.includes('api.allorigins.win')) {
                    // If already using a proxy, just reject
                    reject(new Error('Cannot load image even with proxy'));
                } else {
                    // Try with different proxy services
                    const proxyUrls = [
                        `https://images.weserv.nl/?url=${encodeURIComponent(url)}`,
                        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                        `https://cors-anywhere.herokuapp.com/${url}`
                    ];
                    
                    // Try the first proxy
                    tryLoadWithProxy(proxyUrls, 0);
                }
            };
            
            // Helper function to try loading with different proxies
            function tryLoadWithProxy(proxyUrls, index) {
                if (index >= proxyUrls.length) {
                    // We've tried all proxies, use a placeholder instead
                    console.warn('All proxy attempts failed, using placeholder image');
                    resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+');
                    return;
                }
                
                // Try loading with current proxy
                console.log(`Trying proxy ${index + 1}/${proxyUrls.length}: ${proxyUrls[index]}`);
                convertImageToBase64(proxyUrls[index])
                    .then(resolve)
                    .catch(() => {
                        // Try the next proxy
                        tryLoadWithProxy(proxyUrls, index + 1);
                    });
            }
            
            // Start loading the image
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
        const formattedContent = summaryTextarea.dataset.formattedContent || formatTextToHtml(summaryText);
        
        // Update the widget preview
        await updateWidgetPreview(imageUrl, formattedContent, imagePosition);
        
        // Generate the widget code for embedding
        const widgetCode = await generateWidgetCode(imageUrl, formattedContent, imagePosition);
        
        // Show the widget code
        if (document.getElementById('widget-code') && widgetCode) {
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
                showWidgetStatus('Error processing image. Using original URL or placeholder.', 'error');
                
                // Use placeholder if conversion fails
                base64Image = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
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
    
    // Format plain text to HTML with improved detection for paragraphs, lists, and headings
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
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || 
                line.match(/^\d+\.\s/)) { // Numbered lists like "1. Item"
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                // Clean up the bullet point or number
                let cleanedLine = line;
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    cleanedLine = line.substring(1).trim();
                } else if (line.match(/^\d+\.\s/)) {
                    cleanedLine = line.replace(/^\d+\.\s/, '').trim();
                }
                html += `<li>${cleanedLine}</li>`;
            } 
            // Check if it's a heading - look for common heading patterns
            else if (line.startsWith('#') || 
                     line.toUpperCase() === line && line.length < 50 || // All caps short line
                     line.match(/^(Features|Benefits|Overview|Key Points|Specifications|Details|Summary):/i) ||
                     line.startsWith('Key Features:')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Clean up the heading text
                let headingText = line;
                if (line.startsWith('#')) {
                    headingText = line.replace(/^#+\s*/, ''); // Remove # characters
                }
                if (line.match(/^(Features|Benefits|Overview|Key Points|Specifications|Details|Summary):/i)) {
                    headingText = line; // Keep the colon for these common headings
                }
                
                html += `<h3>${headingText.trim()}</h3>`;
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
                // Use placeholder if conversion fails
                base64Image = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+';
            }
        }
        
        // Create responsive table layout
        let widgetHtml = `<table style="width:100%; border-collapse:collapse; border:none; font-family:Arial, sans-serif;">\n  <tr>\n`;
        
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
        
        widgetHtml += `  </tr>\n</table>\n\n<!-- Add this style for responsive tables -->\n<style>\n@media (max-width: 600px) {\n  table, tbody, tr, td {\n    display: block;\n    width: 100% !important;\n  }\n  td {\n    padding: 10px 0;\n    text-align: center;\n  }\n}\n</style>`;
        
        return widgetHtml;
    }
    
    // Copy widget code to clipboard
    function copyWidgetCode() {
        const codeElement = document.getElementById('widget-code');
        if (!codeElement) return;
        
        const codeText = codeElement.textContent;
        if (!codeText) {
            showWidgetStatus('No code to copy', 'error');
            return;
        }
        
        navigator.clipboard.writeText(codeText)
            .then(() => {
                if (copyCodeBtn) {
                    copyCodeBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyCodeBtn.textContent = 'Copy Code';
                    }, 2000);
                }
                showWidgetStatus('Code copied to clipboard!', 'success');
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
                
                if (copyCodeBtn) {
                    copyCodeBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyCodeBtn.textContent = 'Copy Code';
                    }, 2000);
                }
                showWidgetStatus('Code copied to clipboard!', 'success');
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
        fetchAttempts = 0;
        
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

// Also initialize when the tab is clicked
document.addEventListener('DOMContentLoaded', function() {
    const widgetTabButton = document.querySelector('.tab-button[data-tab="widget"]');
    if (widgetTabButton) {
        widgetTabButton.addEventListener('click', function() {
            console.log('Widget Creator tab clicked, reinitializing');
            setTimeout(initWidgetCreator, 100); // Small delay to ensure DOM is updated after tab switch
        });
    }
});

// For debugging - output a message to help troubleshoot
console.log('Widget Creator script loaded');
