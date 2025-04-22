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
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
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
    
    // Drop handler
    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
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
                            
                            downloadAllButton.addEventListener('click', () => {
                                try {
                                    logMessage('Preparing to download all images as ZIP...');
                                    
                                    const zip = new JSZip();
                                    
                                    // Add each image to the zip
                                    for (const { pageNum, imageData } of processedImages) {
                                        const filename = `${file.name.replace('.pdf', '')}_page${pageNum}.png`;
                                        zip.file(filename, imageData);
                                    }
                                    
                                    // Generate the zip
                                    zip.generateAsync({ type: 'blob' }).then((zipContent) => {
                                        // Download the zip
                                        const a = document.createElement('a');
                                        a.href = URL.createObjectURL(zipContent);
                                        a.download = `${file.name.replace('.pdf', '')}_all_pages.zip`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        
                                        logMessage('All pages downloaded as ZIP');
                                    }).catch(err => {
                                        logMessage(`Error creating ZIP: ${err.message}`, 'error');
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
    
    // Helper function to read a File as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
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
    
    // Process PDF function
    async function processPdf(pdfData, options = {}) {
        const {
            pageNumbers = null, // null means all pages
            dpi = 300,
            resizeToA4 = true
        } = options;
        
        const results = [];
        let pdfDoc = null;
        
        try {
            // Load the PDF document
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
                    
                    // Render the PDF page to the canvas
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
                    
                    // Remove text using the improved method that handles PDF coordinates correctly
                    removeTextUsingPdfData(imageData, textContent, scale, page, viewport);
                    
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
                    
                    // Convert canvas to PNG data
                    const pngData = await new Promise(resolve => {
                        finalCanvas.toBlob(blob => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(new Uint8Array(reader.result));
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
     * Remove text using PDF data coordinates
     * @param {ImageData} imageData - Canvas image data
     * @param {Object} textContent - PDF.js text content
     * @param {number} scale - Scale factor for coordinates
     * @param {Object} page - PDF.js page object
     * @param {Object} viewport - PDF.js viewport
     */
    function removeTextUsingPdfData(imageData, textContent, scale, page, viewport) {
        const { width, height, data } = imageData;
        
        // Protected areas for banners, logos, etc.
        const protectedAreas = [];
        
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
        
        // First, create a mask for all text areas
        const textMask = new Uint8Array(width * height);
        
        // Process all text items
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
            
            // Calculate text dimensions with very generous padding
            // We want to over-estimate rather than under-estimate
            const extraPadding = Math.max(fontSize * scale, 10);
            
            // For special elements like [Titre du document], use even more padding
            const isSpecialText = text.includes('[') || text.includes(']');
            const padding = isSpecialText ? extraPadding * 2 : extraPadding;
            
            // Calculate text box coordinates
            let x0 = Math.floor(itemX - padding);
            let y0 = Math.floor(itemY - fontSize * scale - padding);
            
            // Estimate width based on text content
            const textWidthFactor = isSpecialText ? 1.2 : 0.6; // Special text is usually wider
            const itemWidth = (item.width || (fontSize * text.length * textWidthFactor)) * scale;
            const itemHeight = fontSize * scale * 2; // Make it tall enough for descenders
            
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
            
            // Mark this area in the text mask
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    textMask[y * width + x] = 1;
                }
            }
            
            // Fill with white
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = 255;     // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
            }
            
            // For special text like [Titre du document], add additional rectangle
            // This helps with text that PDF.js doesn't properly report dimensions for
            if (isSpecialText) {
                // Add another rectangle with more padding
                const morePadding = padding * 2;
                const centerX = (x0 + x1) / 2;
                const centerY = (y0 + y1) / 2;
                const halfWidth = (x1 - x0) / 2 + morePadding;
                const halfHeight = (y1 - y0) / 2 + morePadding;
                
                const sx0 = Math.max(0, Math.floor(centerX - halfWidth));
                const sy0 = Math.max(0, Math.floor(centerY - halfHeight));
                const sx1 = Math.min(width - 1, Math.floor(centerX + halfWidth));
                const sy1 = Math.min(height - 1, Math.floor(centerY + halfHeight));
                
                // Skip invalid areas
                if (sx1 <= sx0 || sy1 <= sy0) continue;
                
                // Skip if in protected area
                let specialInProtectedArea = false;
                for (const area of protectedAreas) {
                    if (!(sx1 < area.x0 || sx0 > area.x1 || sy1 < area.y0 || sy0 > area.y1)) {
                        specialInProtectedArea = true;
                        break;
                    }
                }
                
                if (!specialInProtectedArea) {
                    // Fill with white
                    for (let y = sy0; y < sy1; y++) {
                        for (let x = sx0; x < sx1; x++) {
                            const idx = (y * width + x) * 4;
                            data[idx] = 255;     // R
                            data[idx + 1] = 255; // G
                            data[idx + 2] = 255; // B
                        }
                    }
                }
            }
        }
        
        // Additional pass for areas with much larger padding
        // This is needed for text that PDF.js doesn't report correctly
        for (const item of textContent.items) {
            const text = item.str.trim();
            if (!text) continue;
            
            // Only do this for text containing brackets or special characters
            // These are usually titles, headers, etc. that need special handling
            if (text.includes('[') || text.includes(']') || 
                text.includes('Titre') || text.includes('document') ||
                text.includes('Résumé') || text.includes('Catherine')) {
                
                const transform = item.transform;
                const fontSize = Math.abs(transform[3] * 1.5); // Make it larger
                
                // Calculate coordinates with very generous padding
                const itemX = transform[4] * scale;
                const itemY = viewport.height - (transform[5] * scale);
                
                const hugePadding = fontSize * scale * 2;
                
                let x0 = Math.floor(itemX - hugePadding);
                let y0 = Math.floor(itemY - fontSize * scale - hugePadding);
                
                // Make the width much larger for these special elements
                const itemWidth = fontSize * text.length * 1.5 * scale;
                const itemHeight = fontSize * scale * 3;
                
                let x1 = Math.floor(itemX + itemWidth + hugePadding);
                let y1 = Math.floor(itemY + itemHeight);
                
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
                    if (!(x1 < area.x0 || x0 > area.x1 || y1 < area.y0 || y0 > area.y1)) {
                        inProtectedArea = true;
                        break;
                    }
                }
                
                if (!inProtectedArea) {
                    // Fill with white
                    for (let y = y0; y < y1; y++) {
                        for (let x = x0; x < x1; x++) {
                            const idx = (y * width + x) * 4;
                            data[idx] = 255;     // R
                            data[idx + 1] = 255; // G
                            data[idx + 2] = 255; // B
                        }
                    }
                }
            }
        }
        
        // If this is a template like MicroAge, add targeted removal for known text positions
        if (checkForTemplateBanner(imageData)) {
            // Target central title area - [Titre du document]
            const titleY = Math.floor(height * 0.7);
            const titleHeight = Math.floor(height * 0.1);
            const titleX = Math.floor(width * 0.3);
            const titleWidth = Math.floor(width * 0.4);
            
            // Fill the title area with white
            for (let y = titleY; y < titleY + titleHeight; y++) {
                for (let x = titleX; x < titleX + titleWidth; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = 255;     // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
            }
            
            // Target subtitle area - [Sous-titre du document]
            const subtitleY = Math.floor(height * 0.8);
            const subtitleHeight = Math.floor(height * 0.05);
            const subtitleX = Math.floor(width * 0.35);
            const subtitleWidth = Math.floor(width * 0.3);
            
            // Fill the subtitle area with white
            for (let y = subtitleY; y < subtitleY + subtitleHeight; y++) {
                for (let x = subtitleX; x < subtitleX + subtitleWidth; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = 255;     // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
            }
            
            // Target Résumé text area
            const resumeY = Math.floor(height * 0.85);
            const resumeHeight = Math.floor(height * 0.1);
            const resumeX = Math.floor(width * 0.1);
            const resumeWidth = Math.floor(width * 0.8);
            
            // Fill the resume area with white
            for (let y = resumeY; y < resumeY + resumeHeight; y++) {
                for (let x = resumeX; x < resumeX + resumeWidth; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = 255;     // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
            }
            
            // Target the author name area
            const authorY = Math.floor(height * 0.95);
            const authorHeight = Math.floor(height * 0.04);
            const authorX = Math.floor(width * 0.5);
            const authorWidth = Math.floor(width * 0.45);
            
            // Fill the author area with white
            for (let y = authorY; y < authorY + authorHeight; y++) {
                for (let x = authorX; x < authorX + authorWidth; x++) {
                    const idx = (y * width + x) * 4;
                    data[idx] = 255;     // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                }
            }
        }
    }
}

// Initialize the PDF extractor when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPdfExtractor);
