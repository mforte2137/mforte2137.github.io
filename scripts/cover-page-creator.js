/**
 * Cover Page Creator JavaScript
 * Handles PDF processing and image extraction functionality
 */

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

function initPdfExtractor() {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const processBtn = document.getElementById('process-btn');
    const clearBtn = document.getElementById('clear-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const previewContainer = document.getElementById('preview-container');
    const statusElement = document.getElementById('status');
    const logContainer = document.getElementById('log-container');
    const pageInput = document.getElementById('page-input');
    const dpiInput = document.getElementById('dpi-input');
    const resizeInput = document.getElementById('resize-input');
    
    // Uploaded files storage
    let uploadedFiles = [];
    
    // Set up logging
    function logMessage(message, level = 'info') {
        const entry = document.createElement('p');
        entry.className = `log-entry ${level}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(entry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Also log to console
        switch(level) {
            case 'error': console.error(message); break;
            case 'warn': console.warn(message); break;
            default: console.log(message);
        }
    }
    
    // Prevent defaults for drag and drop
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropzone.classList.add('dragover');
    }
    
    function unhighlight() {
        dropzone.classList.remove('dragover');
    }
    
    // Setup drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults);
        document.body.addEventListener(eventName, preventDefaults);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight);
    });
    
    // Handle file selection
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change handler - FIXED version using function declaration
    fileInput.addEventListener('change', function(e) {
        console.log("File input change event triggered");
        const files = this.files;
        if (!files || files.length === 0) {
            console.log("No files selected");
            return;
        }
        
        console.log("Files selected:", files.length);
        
        // Filter for PDF files
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            showStatus('No PDF files were selected.', 'error');
            return;
        }
        
        // Store the files and enable the process button
        uploadedFiles = pdfFiles;
        logMessage(`Selected ${uploadedFiles.length} PDF files`);
        processBtn.disabled = false;
        
        // Clear previous results
        previewContainer.innerHTML = '';
        hideStatus();
    });
    
    // Drop handler - FIXED version using function declaration
    dropzone.addEventListener('drop', function(e) {
        console.log("Drop event triggered");
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) {
            console.log("No files dropped");
            return;
        }
        
        console.log("Files dropped:", files.length);
        
        // Filter for PDF files
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            showStatus('No PDF files were selected.', 'error');
            return;
        }
        
        // Store the files and enable the process button
        uploadedFiles = pdfFiles;
        logMessage(`Selected ${uploadedFiles.length} PDF files`);
        processBtn.disabled = false;
        
        // Clear previous results
        previewContainer.innerHTML = '';
        hideStatus();
    });
    
    // Process button click handler
    processBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) return;
        
        // Parse options
        const dpi = parseInt(dpiInput.value, 10);
        const resizeToA4 = resizeInput.value === 'true';
        
        // Parse page numbers
        let pageNumbers = [];
        if (pageInput.value.trim()) {
            pageNumbers = pageInput.value.split(',')
                .map(p => parseInt(p.trim(), 10))
                .filter(p => !isNaN(p) && p > 0);
        }
        
        const options = {
            dpi,
            resizeToA4,
            pageNumbers: pageNumbers.length > 0 ? pageNumbers : null
        };
        
        logMessage(`Processing ${uploadedFiles.length} files with options: ` + 
                  `DPI=${options.dpi}, Resize=${options.resizeToA4}, Pages=${options.pageNumbers || 'all'}`);
        
        // Disable the button during processing
        processBtn.disabled = true;
        
        // Show progress
        progressContainer.style.display = 'block';
        progressBar.max = uploadedFiles.length;
        progressBar.value = 0;
        progressText.textContent = `Processing 0/${uploadedFiles.length} files...`;
        
        // Clear previous results
        previewContainer.innerHTML = '';
        
        try {
            let processedCount = 0;
            
            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];
                progressText.textContent = `Processing ${i+1}/${uploadedFiles.length}: ${file.name}`;
                
                try {
                    logMessage(`Processing ${file.name}`);
                    
                    // Read the file as array buffer
                    const fileData = await readFileAsArrayBuffer(file);
                    
                    // Process the PDF
                    const processedImages = await processPdf(fileData, options);
                    
                    if (processedImages.length > 0) {
                        logMessage(`Successfully processed ${file.name}, ${processedImages.length} pages extracted`);
                        processedCount++;
                        
                        // Display the results
                        processedImages.forEach(({ pageNum, imageData }) => {
                            displayImage(file.name, pageNum, imageData);
                        });
                        
                        // Add a "Download All" button for multiple pages
                        if (processedImages.length > 1) {
                            const downloadAllButton = document.createElement('button');
                            downloadAllButton.textContent = `Download All Pages (${processedImages.length})`;
                            downloadAllButton.className = 'download-all-button';
                            
                            downloadAllButton.addEventListener('click', function() {
                                try {
                                    logMessage('Preparing to download all images as ZIP...');
                                    
                                    const zip = new JSZip();
                                    
                                    // Add each image to the zip
                                    for (const { pageNum, imageData } of processedImages) {
                                        const filename = `${file.name.replace('.pdf', '')}_page${pageNum}.png`;
                                        zip.file(filename, imageData);
                                    }
                                    
                                    // Generate the zip - FIXED promise chain
                                    zip.generateAsync({ type: 'blob' })
                                        .then(function(zipContent) {
                                            // Download the zip
                                            const a = document.createElement('a');
                                            a.href = URL.createObjectURL(zipContent);
                                            a.download = `${file.name.replace('.pdf', '')}_all_pages.zip`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(a.href);
                                            
                                            logMessage('All pages downloaded as ZIP');
                                        })
                                        .catch(function(error) {
                                            logMessage(`Error creating ZIP: ${error.message}`, 'error');
                                        });
                                } catch (err) {
                                    logMessage(`Error creating ZIP: ${err.message}`, 'error');
                                }
                            });
                            
                            previewContainer.insertAdjacentElement('beforebegin', downloadAllButton);
                        }
                    } else {
                        logMessage(`No images extracted from ${file.name}`, 'warn');
                    }
                } catch (err) {
                    logMessage(`Error processing ${file.name}: ${err.message}`, 'error');
                }
                
                // Update progress bar
                progressBar.value = i + 1;
            }
            
            progressText.textContent = `Processed ${processedCount}/${uploadedFiles.length} files`;
            showStatus(`Successfully processed ${processedCount} out of ${uploadedFiles.length} files`, 'success');
        } catch (err) {
            logMessage(`Error during processing: ${err.message}`, 'error');
            showStatus('An error occurred during processing. Check the log for details.', 'error');
        } finally {
            processBtn.disabled = false;
        }
    });
    // Clear fields button
    clearBtn.addEventListener('click', clearFields);
    
    // Function to clear all fields and reset the application
    function clearFields() {
        // Reset uploaded files
        uploadedFiles = [];
        
        // Reset input fields to defaults
        pageInput.value = '1';
        dpiInput.value = '300';
        resizeInput.value = 'true';
        
        // Clear results and status
        previewContainer.innerHTML = '';
        hideStatus();
        
        // Reset log container (keep only the initial message)
        logContainer.innerHTML = '<p class="log-entry info">System ready. Upload PDF files to begin.</p>';
        
        // Disable process button
        processBtn.disabled = true;
        
        // Hide progress container
        progressContainer.style.display = 'none';
        
        // Remove any download all buttons
        const downloadAllButtons = document.querySelectorAll('.download-all-button');
        downloadAllButtons.forEach(button => button.remove());
        
        // Clear the file input value
        fileInput.value = '';
        
        logMessage('All fields cleared. Ready for new files.');
    }
    
    // Display an image in the preview container
    function displayImage(fileName, pageNum, imageData) {
        // Create blob URL from the image data
        const blob = new Blob([imageData], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        // Create preview item
        const item = document.createElement('div');
        item.className = 'preview-item';
        
        // Preview header
        const header = document.createElement('div');
        header.className = 'preview-header';
        
        const title = document.createElement('h3');
        title.className = 'preview-title';
        title.textContent = `${fileName} - Page ${pageNum}`;
        header.appendChild(title);
        
        item.appendChild(header);
        
        // Preview image
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.src = url;
        img.alt = `${fileName} - Page ${pageNum}`;
        item.appendChild(img);
        
        // Preview actions
        const actions = document.createElement('div');
        actions.className = 'preview-actions';
        
        // PNG Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download PNG';
        downloadBtn.addEventListener('click', () => {
            // Create a download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName.replace('.pdf', '')}_page${pageNum}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
        
        actions.appendChild(downloadBtn);
        item.appendChild(actions);
        
        // Add to preview container
        previewContainer.appendChild(item);
    }
    
    // Helper function to read a File as ArrayBuffer - FIXED promise handling
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            reader.onerror = function(event) {
                reject(new Error('Failed to read file'));
            };
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Helper functions for status display
    function showStatus(message, type) {
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
        statusElement.style.display = 'block';
    }
    
    function hideStatus() {
        statusElement.style.display = 'none';
    }
    
    /**
     * Process PDF function
     */
    async function processPdf(pdfData, options = {}) {
        const {
            pageNumbers = null, // null means all pages
            dpi = 300,
            resizeToA4 = true
        } = options;
        
        const results = [];
        let pdfDoc = null;
        
        try {
            // Load the PDF document - FIXED promise handling
            pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            logMessage(`PDF loaded with ${pdfDoc.numPages} pages`);
            
            // Determine which pages to process
            const pagesToProcess = pageNumbers || Array.from(
                { length: pdfDoc.numPages }, 
                (_, i) => i + 1
            );
            
            // A4 dimensions in pixels at specified DPI (210mm × 297mm)
            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            const MM_TO_INCHES = 1 / 25.4;
            const widthInches = A4_WIDTH_MM * MM_TO_INCHES;
            const heightInches = A4_HEIGHT_MM * MM_TO_INCHES;
            const widthPx = Math.round(widthInches * dpi);
            const heightPx = Math.round(heightInches * dpi);
            
            // Process requested pages
            for (const pageNum of pagesToProcess) {
                if (pageNum < 1 || pageNum > pdfDoc.numPages) {
                    logMessage(`Page ${pageNum} out of range, skipping`, 'warn');
                    continue;
                }
                
                try {
                    // Get the page
                    const page = await pdfDoc.getPage(pageNum);
                    
                    // Calculate scale to match desired DPI
                    // PDF uses 72 DPI as default
                    const scale = dpi / 72;
                    const viewport = page.getViewport({ scale });
                    
                    // Create canvas for rendering
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');
                    
                    // Render the PDF page to the canvas - FIXED promise handling
                    await page.render({
                        canvasContext: ctx,
                        viewport
                    }).promise;
                    
                    // Get text content
                    const textContent = await page.getTextContent();
                    logMessage(`Found ${textContent.items.length} text items on page ${pageNum}`);
                    
                    // Get the canvas image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Detect if this is a template with a banner
                    const isTemplate = checkForTemplateBanner(imageData);
                    if (isTemplate) {
                        logMessage(`Detected template document - using specialized text removal`);
                    }
                    
                    // Remove text using the edge-based sampling method (inspired by the Python script)
                    removeTextUsingEdgeSampling(imageData, textContent, scale, page, viewport);
                    
                    // Put the processed image data back to the canvas
                    ctx.putImageData(imageData, 0, 0);
                    
                    // Resize to A4 if requested
                    let finalCanvas = canvas;
                    if (resizeToA4) {
                        finalCanvas = document.createElement('canvas');
                        finalCanvas.width = widthPx;
                        finalCanvas.height = heightPx;
                        const finalCtx = finalCanvas.getContext('2d');
                        // Use better quality resizing
                        finalCtx.imageSmoothingQuality = 'high';
                        finalCtx.drawImage(canvas, 0, 0, widthPx, heightPx);
                    }
                    
                    // Convert canvas to PNG data - FIXED promise handling
                    const pngData = await new Promise((resolve, reject) => {
                        finalCanvas.toBlob(function(blob) {
                            if (!blob) {
                                reject(new Error('Failed to create blob from canvas'));
                                return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                resolve(new Uint8Array(reader.result));
                            };
                            reader.onerror = function() {
                                reject(new Error('Failed to read blob data'));
                            };
                            reader.readAsArrayBuffer(blob);
                        }, 'image/png');
                    });
                    
                    results.push({
                        pageNum,
                        imageData: pngData
                    });
                    
                    logMessage(`Successfully processed page ${pageNum}`);
                } catch (err) {
                    logMessage(`Error processing page ${pageNum}: ${err.message}`, 'error');
                }
            }
            
            return results;
        } catch (err) {
            logMessage(`Error processing PDF: ${err.message}`, 'error');
            throw err;
        }
    }
    
    /**
     * Check if the image contains a template banner (like MicroAge)
     * @param {ImageData} imageData - Canvas image data
     * @returns {boolean} - True if a banner is detected
     */
    function checkForTemplateBanner(imageData) {
        const { width, height, data } = imageData;
        
        // Sample the top area of the image to check for red banner
        const redPixelCount = {count: 0, total: 0};
        const sampleHeight = Math.floor(height * 0.15); // Check top 15% of image
        
        // Sample every 10th pixel to save processing
        for (let y = 0; y < sampleHeight; y += 10) {
            for (let x = 0; x < width; x += 10) {
                const idx = (y * width + x) * 4;
                
                // Count pixels with high red component and low green/blue (red banner)
                if (data[idx] > 180 && data[idx+1] < 100 && data[idx+2] < 100) {
                    redPixelCount.count++;
                }
                
                redPixelCount.total++;
            }
        }
        
        // If at least 5% of sampled pixels are red, consider it a banner
        return (redPixelCount.count / redPixelCount.total) > 0.05;
    }
    /**
     * Remove text using the edge-based sampling method inspired by the Python script
     * This is the key method that replaces the previous text removal approach
     * @param {ImageData} imageData - Canvas image data
     * @param {Object} textContent - PDF.js text content
     * @param {number} scale - Scale factor for coordinates
     * @param {Object} page - PDF.js page object
     * @param {Object} viewport - PDF.js viewport
     */
    function removeTextUsingEdgeSampling(imageData, textContent, scale, page, viewport) {
        const { width, height, data } = imageData;
        
        // Protected areas for banners, logos, etc.
        const protectedAreas = [];
        
        // Protect the logo areas - common in most documents
        // Right side logo area (in many templates)
        protectedAreas.push({
            x0: Math.floor(width * 0.7),
            y0: Math.floor(height * 0.2),
            x1: width,
            y1: Math.floor(height * 0.4)
        });
        
        // If this is a template with header, protect the top area
        if (checkForTemplateBanner(imageData)) {
            // Protect the top area (header/banner)
            const bannerHeight = Math.floor(height * 0.2);
            protectedAreas.push({
                x0: 0,
                y0: 0, 
                x1: width,
                y1: bannerHeight
            });
            
            // Also protect the logo area
            const logoWidth = Math.floor(width * 0.2);
            const logoHeight = Math.floor(height * 0.35);
            protectedAreas.push({
                x0: 0,
                y0: 0,
                x1: logoWidth,
                y1: logoHeight
            });
        }
        
        // Detect and protect image areas
        protectImageAreas(imageData, protectedAreas);
        
        // Process all text items using edge sampling technique
        for (const item of textContent.items) {
            const text = item.str.trim();
            if (!text) continue;
            
            // Get font information
            const transform = item.transform;
            const fontSize = Math.abs(transform[3]);
            
            // PDF coordinates start from bottom-left with y-axis pointing up
            // Canvas coordinates start from top-left with y-axis pointing down
            // Need to flip the y-coordinate
            const itemX = transform[4] * scale;
            const itemY = viewport.height - (transform[5] * scale);
            
            // Calculate padding based on font size
            const padding = Math.max(fontSize * scale * 0.4, 5);
            
            // Calculate text box coordinates
            let x0 = Math.floor(itemX - padding);
            let y0 = Math.floor(itemY - fontSize * scale - padding);
            
            // Width estimation based on text content
            const itemWidth = (item.width || (fontSize * text.length * 0.6)) * scale;
            
            let x1 = Math.floor(itemX + itemWidth + padding);
            let y1 = Math.floor(itemY + padding);
            
            // Ensure coordinates are within image bounds
            x0 = Math.max(0, x0);
            y0 = Math.max(0, y0);
            x1 = Math.min(width - 1, x1);
            y1 = Math.min(height - 1, y1);
            
            // Skip invalid areas
            if (x1 <= x0 || y1 <= y0) continue;
            
            // Check if this text is in a protected area
            let inProtectedArea = false;
            for (const area of protectedAreas) {
                // Check for overlap
                if (!(x1 < area.x0 || x0 > area.x1 || y1 < area.y0 || y0 > area.y1)) {
                    inProtectedArea = true;
                    break;
                }
            }
            
            // Skip if in protected area
            if (inProtectedArea) continue;
            
            // Use edge pixel sampling to determine background color (key technique from Python script)
            const edgeColor = sampleEdgePixels(imageData, x0, y0, x1, y1);
            
            // Fill the text area with the edge color
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = edgeColor.r;     // R
                    data[idx + 1] = edgeColor.g; // G
                    data[idx + 2] = edgeColor.b; // B
                }
            }
        }
        
        // Process additional areas that may contain text but weren't detected by PDF.js
        processUndetectedTextAreas(imageData, protectedAreas, data);
    }
    
    /**
     * Sample edge pixels to determine the background color (key method from Python script)
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x0 - Left boundary
     * @param {number} y0 - Top boundary
     * @param {number} x1 - Right boundary
     * @param {number} y1 - Bottom boundary
     * @returns {Object} - Background color {r, g, b}
     */
    function sampleEdgePixels(imageData, x0, y0, x1, y1) {
        const { width, height, data } = imageData;
        
        // Collect edge pixels like in the Python script
        const edgePixels = [];
        
        // Top and bottom edges
        if (y0 > 0 && y1 < height) {
            // Top edge (just above the text block)
            for (let x = x0; x < x1; x++) {
                if (y0 > 0) {
                    const idx = ((y0 - 1) * width + x) * 4;
                    edgePixels.push({
                        r: data[idx],
                        g: data[idx + 1],
                        b: data[idx + 2]
                    });
                }
            }
            
            // Bottom edge (just below the text block)
            for (let x = x0; x < x1; x++) {
                if (y1 < height) {
                    const idx = (y1 * width + x) * 4;
                    edgePixels.push({
                        r: data[idx],
                        g: data[idx + 1],
                        b: data[idx + 2]
                    });
                }
            }
        }
        
        // Left and right edges
        if (x0 > 0 && x1 < width) {
            // Left edge (just before the text block)
            for (let y = y0; y < y1; y++) {
                if (x0 > 0) {
                    const idx = (y * width + (x0 - 1)) * 4;
                    edgePixels.push({
                        r: data[idx],
                        g: data[idx + 1],
                        b: data[idx + 2]
                    });
                }
            }
            
            // Right edge (just after the text block)
            for (let y = y0; y < y1; y++) {
                if (x1 < width) {
                    const idx = (y * width + x1) * 4;
                    edgePixels.push({
                        r: data[idx],
                        g: data[idx + 1],
                        b: data[idx + 2]
                    });
                }
            }
        }
        
        // If we found edge pixels, find the most common color
        if (edgePixels.length > 0) {
            return findMostCommonColor(edgePixels);
        }
        
        // Default to white if no edge pixels were found
        return { r: 255, g: 255, b: 255 };
    }
    
    /**
     * Find the most common color in a collection of pixels
     * This mimics the Counter.most_common functionality from Python
     * @param {Array} pixels - Array of pixel colors {r, g, b}
     * @returns {Object} - Most common color {r, g, b}
     */
    function findMostCommonColor(pixels) {
        // Create a counter-like object using a Map
        const colorCounter = new Map();
        
        // Count occurrences of each color
        for (const pixel of pixels) {
            const colorKey = `${pixel.r},${pixel.g},${pixel.b}`;
            if (colorCounter.has(colorKey)) {
                colorCounter.set(colorKey, colorCounter.get(colorKey) + 1);
            } else {
                colorCounter.set(colorKey, 1);
            }
        }
        
        // Find the most common color
        let mostCommonColor = null;
        let maxCount = 0;
        
        for (const [colorKey, count] of colorCounter.entries()) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = colorKey.split(',').map(Number);
                mostCommonColor = { r, g, b };
            }
        }
        
        // Return the most common color, or white if none found
        return mostCommonColor || { r: 255, g: 255, b: 255 };
    }
    
    /**
     * Detect and protect image areas in the document
     * @param {ImageData} imageData - Canvas image data
     * @param {Array} protectedAreas - Array to store protected areas
     */
    function protectImageAreas(imageData, protectedAreas) {
        const { width, height, data } = imageData;
        
        // Find significant visual elements by looking for color variations and patterns
        // This is a simplified approach that looks for areas with high color variation
        
        // We'll use a grid-based approach for efficiency
        const gridSize = 20;
        const gridCellsX = Math.ceil(width / gridSize);
        const gridCellsY = Math.ceil(height / gridSize);
        
        // Track color variance in each grid cell
        for (let gridY = 0; gridY < gridCellsY; gridY++) {
            for (let gridX = 0; gridX < gridCellsX; gridX++) {
                const startX = gridX * gridSize;
                const startY = gridY * gridSize;
                const endX = Math.min(startX + gridSize, width);
                const endY = Math.min(startY + gridSize, height);
                
                // Check color variance in this grid cell
                const colorVariance = calculateColorVariance(imageData, startX, startY, endX, endY);
                
                // If there's high color variance but not extremely high (which might be text),
                // consider it a potential image area
                if (colorVariance > 1000 && colorVariance < 8000) {
                    // Find the boundaries of this image area by expanding from this grid cell
                    const area = expandImageArea(imageData, startX, startY, endX, endY);
                    
                    // Only add areas of certain minimum size
                    const areaSize = (area.x1 - area.x0) * (area.y1 - area.y0);
                    if (areaSize > 10000) {  // Minimum area size threshold
                        protectedAreas.push(area);
                    }
                }
            }
        }
        
        // Common image areas in cover pages - city skyline images, diagrams, etc.
        // These are typically found in the center sections of the page
        const centerImageArea = {
            x0: Math.floor(width * 0.2),
            y0: Math.floor(height * 0.3),
            x1: Math.floor(width * 0.8),
            y1: Math.floor(height * 0.7)
        };
        
        // Check if this area has sufficient color variance to be an image
        const centerVariance = calculateColorVariance(imageData, 
            centerImageArea.x0, centerImageArea.y0, centerImageArea.x1, centerImageArea.y1);
            
        if (centerVariance > 800) {
            protectedAreas.push(centerImageArea);
        }
    }
    
    /**
     * Calculate color variance in an area to detect images
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x0 - Left boundary
     * @param {number} y0 - Top boundary
     * @param {number} x1 - Right boundary
     * @param {number} y1 - Bottom boundary
     * @returns {number} - Color variance score
     */
    function calculateColorVariance(imageData, x0, y0, x1, y1) {
        const { width, data } = imageData;
        
        // Sample points for efficiency
        const sampleStep = 5;
        
        // Collect color samples
        const samples = [];
        for (let y = y0; y < y1; y += sampleStep) {
            for (let x = x0; x < x1; x += sampleStep) {
                const idx = (y * width + x) * 4;
                samples.push({
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2]
                });
            }
        }
        
        // Calculate variance
        if (samples.length < 2) return 0;
        
        // Calculate mean color values
        let sumR = 0, sumG = 0, sumB = 0;
        for (const sample of samples) {
            sumR += sample.r;
            sumG += sample.g;
            sumB += sample.b;
        }
        
        const meanR = sumR / samples.length;
        const meanG = sumG / samples.length;
        const meanB = sumB / samples.length;
        
        // Calculate variance
        let varR = 0, varG = 0, varB = 0;
        for (const sample of samples) {
            varR += Math.pow(sample.r - meanR, 2);
            varG += Math.pow(sample.g - meanG, 2);
            varB += Math.pow(sample.b - meanB, 2);
        }
        
        varR /= samples.length;
        varG /= samples.length;
        varB /= samples.length;
        
        // Return total variance
        return varR + varG + varB;
    }
    
    /**
     * Expand from a starting area to find the full boundaries of an image
     * @param {ImageData} imageData - Canvas image data
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} endX - Ending X coordinate
     * @param {number} endY - Ending Y coordinate
     * @returns {Object} - Expanded area {x0, y0, x1, y1}
     */
    function expandImageArea(imageData, startX, startY, endX, endY) {
        // For simplicity, add some padding around the initial area
        const { width, height } = imageData;
        const padding = 15;
        
        return {
            x0: Math.max(0, startX - padding),
            y0: Math.max(0, startY - padding),
            x1: Math.min(width, endX + padding),
            y1: Math.min(height, endY + padding)
        };
    }
    
    /**
     * Process areas that may contain text but weren't detected by PDF.js
     * @param {ImageData} imageData - Canvas image data
     * @param {Array} protectedAreas - Protected areas to avoid
     * @param {Uint8ClampedArray} data - Image data array
     */
    function processUndetectedTextAreas(imageData, protectedAreas, data) {
        const { width, height } = imageData;
        
        // Common text area locations in cover pages
        const commonTextAreas = [
            // Title area (often at the bottom or middle of the page)
            {
                x0: Math.floor(width * 0.3),
                y0: Math.floor(height * 0.65),
                x1: Math.floor(width * 0.7),
                y1: Math.floor(height * 0.75)
            },
            // Quote number area (usually bottom right)
            {
                x0: Math.floor(width * 0.6),
                y0: Math.floor(height * 0.75),
                x1: Math.floor(width * 0.9),
                y1: Math.floor(height * 0.8)
            },
            // "Prepared for" area (usually bottom left)
            {
                x0: Math.floor(width * 0.05),
                y0: Math.floor(height * 0.85),
                x1: Math.floor(width * 0.3),
                y1: Math.floor(height * 0.95)
            },
            // "Prepared by" area (usually bottom right)
            {
                x0: Math.floor(width * 0.7),
                y0: Math.floor(height * 0.85),
                x1: Math.floor(width * 0.95),
                y1: Math.floor(height * 0.95)
            },
            // Header area (company name, address, etc.)
            {
                x0: Math.floor(width * 0.05),
                y0: Math.floor(height * 0.05),
                x1: Math.floor(width * 0.5),
                y1: Math.floor(height * 0.15)
            }
        ];
        
        // Process each common text area
        for (const area of commonTextAreas) {
            // Check if this area overlaps with any protected area
            let overlapsProtected = false;
            for (const protected of protectedAreas) {
                // Check for overlap
                if (!(area.x1 < protected.x0 || area.x0 > protected.x1 || 
                      area.y1 < protected.y0 || area.y0 > protected.y1)) {
                    overlapsProtected = true;
                    break;
                }
            }
            
            // Skip if overlaps with protected area
            if (overlapsProtected) continue;
            
            // Check if this area contains text-like content
            const containsText = checkForTextContent(imageData, area.x0, area.y0, area.x1, area.y1);
            
            if (containsText) {
                // Sample background color using edge pixels
                const bgColor = sampleEdgePixels(imageData, area.x0, area.y0, area.x1, area.y1);
                
                // Fill the area with the background color
                for (let y = area.y0; y < area.y1; y++) {
                    for (let x = area.x0; x < area.x1; x++) {
                        const idx = (y * width + x) * 4;
                        data[idx] = bgColor.r;     // R
                        data[idx + 1] = bgColor.g; // G
                        data[idx + 2] = bgColor.b; // B
                    }
                }
            }
        }
    }
    
    /**
     * Check if an area contains text-like content
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x0 - Left boundary
     * @param {number} y0 - Top boundary
     * @param {number} x1 - Right boundary
     * @param {number} y1 - Bottom boundary
     * @returns {boolean} - True if area likely contains text
     */
    function checkForTextContent(imageData, x0, y0, x1, y1) {
        const { width, data } = imageData;
        
        // Count dark pixels (likely text)
        let darkPixelCount = 0;
        let totalPixels = 0;
        
        // Sample every few pixels for efficiency
        const sampleStep = 3;
        
        for (let y = y0; y < y1; y += sampleStep) {
            for (let x = x0; x < x1; x += sampleStep) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                // Consider dark pixels as potential text
                if (brightness < 150) {
                    darkPixelCount++;
                }
                
                totalPixels++;
            }
        }
        
        // If more than 2% of pixels are dark, it likely contains text
        return totalPixels > 0 && (darkPixelCount / totalPixels) > 0.02;
    }
    
    // Initialize the PDF extractor
    logMessage('PDF Extractor initialized');
    logMessage('System ready. Upload PDF files to begin.');
}

// Initialize the module when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing PDF Extractor...');
        initPdfExtractor();
    } catch (err) {
        console.error('Error initializing PDF Extractor:', err);
    }
});
