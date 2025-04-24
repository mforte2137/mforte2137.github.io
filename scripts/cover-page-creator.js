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
                    
                    // Remove text using the improved method
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
     * Remove text using PDF data coordinates with improved boundary detection
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
        
        // Check for color areas to protect (like the blue curve)
        const colorAreasToProtect = detectColorAreas(imageData);
        protectedAreas.push(...colorAreasToProtect);
        
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
            
            // More precise padding calculation based on font size
            // Use smaller padding to avoid overlapping with graphics
            const basePadding = Math.max(fontSize * scale * 0.3, 5);
            
            // For special elements like [Titre du document], use more padding, but still reduced
            const isSpecialText = text.includes('[') || text.includes(']');
            const padding = isSpecialText ? basePadding * 1.5 : basePadding;
            
            // Calculate text box coordinates
            let x0 = Math.floor(itemX - padding);
            let y0 = Math.floor(itemY - fontSize * scale - padding);
            
            // More precise width estimation based on text content
            const textWidthFactor = isSpecialText ? 1.1 : 0.55;
            const itemWidth = (item.width || (fontSize * text.length * textWidthFactor)) * scale;
            const itemHeight = fontSize * scale * 1.5; // Reduced height factor
            
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
            
            // Check if we're about to mask over a non-white area
            // This helps protect graphics that may not be in explicitly protected areas
            if (wouldMaskOverGraphics(imageData, x0, y0, x1, y1)) {
                // Refine the mask area to only cover actual text pixels
                refineTextMaskArea(imageData, x0, y0, x1, y1, data);
            } else {
                // Sample the background color from corners of the text area
                // to ensure we match off-white or colored backgrounds exactly
                const bgColor = determineDominantBackgroundColor(imageData, x0, y0, x1, y1);
                
                // Fill with the sampled background color (not just white)
                for (let y = y0; y < y1; y++) {
                    for (let x = x0; x < x1; x++) {
                        const idx = (y * width + x) * 4;
                        data[idx] = bgColor.r;     // R
                        data[idx + 1] = bgColor.g; // G
                        data[idx + 2] = bgColor.b; // B
                    }
                }
            }
            
            // Mark this area in the text mask
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    textMask[y * width + x] = 1;
                }
            }
        }
        
        // Additional pass for specific template elements when needed
        // but with more conservative masking
        if (checkForTemplateBanner(imageData)) {
            // Use adaptive text masking for template areas to avoid damaging graphics
            maskTemplateSpecificAreas(imageData, protectedAreas, data, width, height);
        }
    }
    
    /**
     * Detect significant color areas that should be protected (like the blue curve)
     * @param {ImageData} imageData - Canvas image data
     * @returns {Array} - Array of areas to protect
     */
    function detectColorAreas(imageData) {
        const { width, height, data } = imageData;
        const colorAreas = [];
        const visited = new Uint8Array(width * height);
        
        // Threshold for what's considered a "significant" color
        // (not white/black/gray)
        const isSignificantColor = (r, g, b) => {
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;
            
            // Check if it's a color (not grayscale) and not too light
            return diff > 30 && max < 240;
        };
        
        // Scan the image for significant color areas
        // Use a grid-based approach for efficiency
        const gridSize = 10; // Check every 10th pixel
        
        for (let y = 0; y < height; y += gridSize) {
            for (let x = 0; x < width; x += gridSize) {
                const idx = (y * width + x) * 4;
                
                // Skip if already visited
                if (visited[y * width + x]) continue;
                
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (isSignificantColor(r, g, b)) {
                    // When we find a significant color, expand to find the area
                    const area = expandColorArea(imageData, x, y, r, g, b, visited);
                    
                    // Only add significant sized areas
                    if ((area.x1 - area.x0) * (area.y1 - area.y0) > 100) {
                        colorAreas.push(area);
                    }
                }
            }
        }
        
        return colorAreas;
    }
    
    /**
     * Expand from a starting point to find the boundaries of a color area
     * @param {ImageData} imageData - Canvas image data
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} targetR - Target red value
     * @param {number} targetG - Target green value
     * @param {number} targetB - Target blue value
     * @param {Uint8Array} visited - Visited pixels mask
     * @returns {Object} - Area boundaries
     */
    function expandColorArea(imageData, startX, startY, targetR, targetG, targetB, visited) {
        const { width, height, data } = imageData;
        
        // Color similarity threshold
        const MAX_DISTANCE = 30;
        
        // Calculate color distance
        const colorDistance = (r, g, b) => {
            return Math.sqrt(
                Math.pow(r - targetR, 2) +
                Math.pow(g - targetG, 2) +
                Math.pow(b - targetB, 2)
            );
        };
        
        // Initialize boundaries
        let minX = startX, maxX = startX;
        let minY = startY, maxY = startY;
        
        // Expand the sampling area
        const sampleRadius = 5;
        
        // For efficiency, sample a grid around the starting point
        for (let y = Math.max(0, startY - sampleRadius); y < Math.min(height, startY + sampleRadius); y++) {
            for (let x = Math.max(0, startX - sampleRadius); x < Math.min(width, startX + sampleRadius); x++) {
                const idx = (y * width + x) * 4;
                
                // Skip if already visited
                if (visited[y * width + x]) continue;
                
                // Mark as visited
                visited[y * width + x] = 1;
                
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // If color is similar, update boundaries
                if (colorDistance(r, g, b) < MAX_DISTANCE) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // Add some padding to protect the area
        return {
            x0: Math.max(0, minX - 5),
            y0: Math.max(0, minY - 5),
            x1: Math.min(width, maxX + 5),
            y1: Math.min(height, maxY + 5)
        };
    }
    
    /**
     * Check if masking an area would cover non-white/graphics areas
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x0 - Left boundary
     * @param {number} y0 - Top boundary
     * @param {number} x1 - Right boundary
     * @param {number} y1 - Bottom boundary
     * @returns {boolean} - True if masking would cover graphics
     */
    function wouldMaskOverGraphics(imageData, x0, y0, x1, y1) {
        const { width, data } = imageData;
        
        // Sample points in the area (use a sparse grid for efficiency)
        const sampleStep = 3;
        
        // Count non-white pixels
        let nonWhiteCount = 0;
        let totalSamples = 0;
        
        for (let y = y0; y < y1; y += sampleStep) {
            for (let x = x0; x < x1; x += sampleStep) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // Check if pixel is not white or very light gray
                // A more sophisticated check can be used if needed
                if (r < 240 || g < 240 || b < 240) {
                    nonWhiteCount++;
                }
                
                totalSamples++;
            }
        }
        
        // If more than 15% of pixels are non-white, consider this a graphic area
        return totalSamples > 0 && (nonWhiteCount / totalSamples) > 0.15;
    }
    
    /**
     * Refine the text mask area to only cover actual text pixels
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x0 - Left boundary
     * @param {number} y0 - Top boundary
     * @param {number} x1 - Right boundary
     * @param {number} y1 - Bottom boundary
     * @param {Uint8ClampedArray} data - Image data array
     */
    function refineTextMaskArea(imageData, x0, y0, x1, y1, data) {
        const { width } = imageData;
        
        // Use pixel-by-pixel analysis to handle text that crosses different backgrounds
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                // Detect text pixels (usually darker than background)
                const brightness = (r + g + b) / 3;
                
                if (brightness < 180) { // Likely text pixel
                    // For each text pixel, we need to determine if it's on a 
                    // colored background or white background
                    
                    // Sample in a wider area to determine local background color
                    const radius = 8; // Larger radius to better detect background
                    const localBgColor = sampleLocalBackgroundColor(imageData, x, y, radius);
                    
                    // Replace text pixel with sampled background color
                    data[idx] = localBgColor.r;
                    data[idx + 1] = localBgColor.g;
                    data[idx + 2] = localBgColor.b;
                }
            }
        }
    }
    
    /**
     * Sample the local background color around a text pixel
     * This is especially important for text that crosses background boundaries
     * @param {ImageData} imageData - Canvas image data
     * @param {number} x - Current X coordinate
     * @param {number} y - Current Y coordinate
     * @param {number} radius - Sampling radius
     * @returns {Object} - Background color {r, g, b}
     */
    function sampleLocalBackgroundColor(imageData, x, y, radius) {
        const { width, height, data } = imageData;
        
        // Collect samples in rings around the pixel
        const samples = [];
        
        // Start with nearby samples
        for (let r = 3; r <= radius; r += 2) {
            const samplePoints = [];
            
            // Sample in a circle around the pixel
            for (let angle = 0; angle < 360; angle += 45) {
                const radians = angle * Math.PI / 180;
                const dx = Math.round(r * Math.cos(radians));
                const dy = Math.round(r * Math.sin(radians));
                
                const sx = x + dx;
                const sy = y + dy;
                
                // Make sure the sample is within image bounds
                if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                    samplePoints.push({ x: sx, y: sy });
                }
            }
            
            // Check each sample point
            for (const point of samplePoints) {
                const idx = (point.y * width + point.x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r + g + b) / 3;
                
                // Skip likely text pixels (dark)
                if (brightness > 180) {
                    samples.push({ r, g, b, brightness });
                }
            }
            
            // If we've found enough samples, we can stop
            if (samples.length >= 5) break;
        }
        
        if (samples.length === 0) {
            // Fallback to white if no good samples found
            return { r: 255, g: 255, b: 255 };
        }
        
        // Analyze the samples to detect if we're near a background color boundary
        // (like text that crosses from white background to colored area)
        
        // First, check if we have significant color variation in samples
        // This would indicate the text is near a color boundary
        let hasColorBoundary = false;
        let colorfulSamples = [];
        let whiteSamples = [];
        
        for (const sample of samples) {
            // Check if this is a colorful pixel (not white/gray)
            const max = Math.max(sample.r, sample.g, sample.b);
            const min = Math.min(sample.r, sample.g, sample.b);
            const colorfulness = max - min;
            
            if (colorfulness > 30 && sample.brightness < 240) {
                colorfulSamples.push(sample);
            } else if (sample.brightness > 230) {
                whiteSamples.push(sample);
            }
        }
        
        // If we have both colorful and white samples, we're likely at a boundary
        if (colorfulSamples.length > 0 && whiteSamples.length > 0) {
            // Determine which side of the boundary we're on
            // We want to choose the color that's closest to the current pixel
            
            // For simplicity, we can check which samples are closer (smaller radius)
            // The first samples in our array come from smaller radius
            for (let i = 0; i < Math.min(3, samples.length); i++) {
                const sample = samples[i];
                const max = Math.max(sample.r, sample.g, sample.b);
                const min = Math.min(sample.r, sample.g, sample.b);
                const colorfulness = max - min;
                
                if (colorfulness > 30 && sample.brightness < 240) {
                    // We're closer to a colorful area, use average of colorful samples
                    return averageColors(colorfulSamples);
                } else if (sample.brightness > 230) {
                    // We're closer to a white area, use average of white samples
                    return averageColors(whiteSamples);
                }
            }
        }
        
        // If no clear boundary detected, use average of all samples
        return averageColors(samples);
    }
    
    /**
     * Calculate the average color from samples
     * @param {Array} samples - Array of color samples {r, g, b}
     * @returns {Object} - Average color {r, g, b}
     */
    function averageColors(samples) {
        if (samples.length === 0) return { r: 255, g: 255, b: 255 };
        
        const sum = samples.reduce((acc, sample) => {
            acc.r += sample.r;
            acc.g += sample.g;
            acc.b += sample.b;
            return acc;
        }, { r: 0, g: 0, b: 0 });
        
        return {
            r: Math.round(sum.r / samples.length),
            g: Math.round(sum.g / samples.length),
            b: Math.round(sum.b / samples.length)
        };
    }
    
    /**
     * Mask specific areas in template documents with more precision
     * @param {ImageData} imageData - Canvas image data
     * @param {Array} protectedAreas - Areas to protect
     * @param {Uint8ClampedArray} data - Image data array
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    function maskTemplateSpecificAreas(imageData, protectedAreas, data, width, height) {
        // Template-specific areas to mask
        const areasToMask = [
            // Title area - [Titre du document]
            {
                x0: Math.floor(width * 0.3),
                y0: Math.floor(height * 0.7),
                x1: Math.floor(width * 0.7), 
                y1: Math.floor(height * 0.78)
            },
            // Subtitle area - [Sous-titre du document]
            {
                x0: Math.floor(width * 0.35),
                y0: Math.floor(height * 0.8),
                x1: Math.floor(width * 0.65),
                y1: Math.floor(height * 0.84)
            },
            // Résumé text area
            {
                x0: Math.floor(width * 0.1),
                y0: Math.floor(height * 0.85),
                x1: Math.floor(width * 0.9),
                y1: Math.floor(height * 0.93)
            },
            // Author name area
            {
                x0: Math.floor(width * 0.5),
                y0: Math.floor(height * 0.95),
                x1: Math.floor(width * 0.95),
                y1: Math.floor(height * 0.98)
            }
        ];
        
        // Process each area to mask
        for (const area of areasToMask) {
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
            
            // Use adaptive masking to preserve graphics
            const usePreciseMasking = wouldMaskOverGraphics(
                imageData, area.x0, area.y0, area.x1, area.y1);
                
            if (usePreciseMasking) {
                // Process the area more carefully
                for (let y = area.y0; y < area.y1; y++) {
                    for (let x = area.x0; x < area.x1; x++) {
                        const idx = (y * width + x) * 4;
                        
                        // Check if this is likely text (darker than surroundings)
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        
                        const brightness = (r + g + b) / 3;
                        
                        // Only replace likely text pixels
                        if (brightness < 180) {
                            // Sample background color
                            const bgColor = sampleBackgroundColor(
                                imageData, x, y, area.x0, area.y0, area.x1, area.y1);
                                
                            // Replace text with background color
                            data[idx] = bgColor.r;
                            data[idx + 1] = bgColor.g;
                            data[idx + 2] = bgColor.b;
                        }
                    }
                }
            } else {
                // Standard white fill for areas without graphics
                for (let y = area.y0; y < area.y1; y++) {
                    for (let x = area.x0; x < area.x1; x++) {
                        const idx = (y * width + x) * 4;
                        data[idx] = 255;     // R
                        data[idx + 1] = 255; // G
                        data[idx + 2] = 255; // B
                    }
                }
            }
        }
    }
}

// Initialize the PDF extractor when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPdfExtractor);


