import json
import base64
import os
import io
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import numpy as np
from collections import Counter

def handler(event, context):
    # Parse request body
    try:
        # Check if the request is a POST
        if event['httpMethod'] != 'POST':
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }
        
        # Parse the request body
        body = json.loads(event['body'])
        
        # Get the PDF data
        pdf_base64 = body.get('pdf')
        if not pdf_base64:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'PDF data is required'})
            }
        
        # Get page number to process (default to 1)
        page_number = int(body.get('page', 1))
        
        # Get DPI setting (default to 300)
        dpi = int(body.get('dpi', 300))
        
        # Decode the PDF
        pdf_data = base64.b64decode(pdf_base64.split(',')[1] if ',' in pdf_base64 else pdf_base64)
        
        # Process the PDF
        output_image = process_pdf_data(pdf_data, page_number, dpi)
        
        # Return the processed image
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'image': output_image
            })
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_pdf_data(pdf_data, page_number, dpi):
    """Process PDF data and return the image as base64"""
    try:
        # Open the PDF from memory
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        
        # Check if page number is valid
        if page_number < 1 or page_number > len(doc):
            raise ValueError(f"Page number {page_number} is out of range (1-{len(doc)})")
        
        # Get the page (convert to 0-based index)
        page_idx = page_number - 1
        page = doc[page_idx]
        
        # A4 dimensions in pixels at specified DPI
        # A4 is 210mm × 297mm
        width_mm, height_mm = 210, 297
        width_in, height_in = width_mm / 25.4, height_mm / 25.4  # Convert mm to inches
        width_px, height_px = int(width_in * dpi), int(height_in * dpi)
        
        # Render the page at the specified DPI
        zoom = dpi / 72  # PDF uses 72 dpi as default
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # Convert pixmap to PIL Image
        img_data = pix.samples
        img = Image.frombytes("RGB", [pix.width, pix.height], img_data)
        
        # Get text blocks
        text_blocks = page.get_text("blocks")
        
        # Create a new image same size as original
        result_img = img.copy()
        draw = ImageDraw.Draw(result_img)
        
        # Create a numpy array from the image for easier processing
        img_array = np.array(img)
        
        # Process each text block
        for block in text_blocks:
            if block[6] == 0:  # Text blocks typically have type 0
                # Get block coordinates and scale to match the rendered image
                x0, y0, x1, y1 = int(block[0]*zoom), int(block[1]*zoom), int(block[2]*zoom), int(block[3]*zoom)
                
                # Make sure coordinates are within image bounds
                x0 = max(0, min(x0, img.width-1))
                y0 = max(0, min(y0, img.height-1))
                x1 = max(0, min(x1, img.width-1))
                y1 = max(0, min(y1, img.height-1))
                
                # If the block is too small, skip it
                if x1 <= x0 or y1 <= y0:
                    continue
                
                # Extract the block region
                block_region = img_array[y0:y1, x0:x1]
                
                # Get edge pixels to determine background
                edge_pixels = []
                # Top and bottom edges
                if y0 > 0 and y1 < img.height:
                    edge_pixels.extend([tuple(img_array[y0-1, x]) for x in range(x0, x1) if y0 > 0])
                    edge_pixels.extend([tuple(img_array[y1, x]) for x in range(x0, x1) if y1 < img.height])
                # Left and right edges
                if x0 > 0 and x1 < img.width:
                    edge_pixels.extend([tuple(img_array[y, x0-1]) for y in range(y0, y1) if x0 > 0])
                    edge_pixels.extend([tuple(img_array[y, x1]) for y in range(y0, y1) if x1 < img.width])
                
                # Get background color from edge pixels
                if edge_pixels:
                    edge_counter = Counter(edge_pixels)
                    bg_color = edge_counter.most_common(1)[0][0]
                else:
                    # Fallback: use dominant color from block
                    pixels = block_region.reshape(-1, 3)
                    pixel_counter = Counter([tuple(pixel) for pixel in pixels])
                    bg_color = pixel_counter.most_common(1)[0][0]
                
                # Fill the text area with the background color
                draw.rectangle([x0, y0, x1, y1], fill=bg_color)
        
        # Resize to A4
        result_img = result_img.resize((width_px, height_px), Image.LANCZOS)
        
        # Save the result to a BytesIO object
        img_byte_arr = io.BytesIO()
        result_img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Convert to base64
        img_base64 = base64.b64encode(img_byte_arr.read()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
        
    finally:
        if 'doc' in locals():
            doc.close()
