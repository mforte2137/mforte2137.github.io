import os
import io
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import logging
import traceback
import numpy as np
from collections import Counter
import glob

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def process_pdf(pdf_path, output_dir="output", page_numbers=None, dpi=300):
    """
    Process a single PDF file, extracting images while ignoring text.
    
    Args:
        pdf_path (str): Path to the PDF file
        output_dir (str): Directory to save extracted images
        page_numbers (list, optional): List of page numbers to process (1-based). If None, process all pages.
        dpi (int): Resolution for the output images
    """
    doc = None
    try:
        # Get PDF filename without extension for output folder
        pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
        pdf_output_dir = os.path.join(output_dir, pdf_name)
        
        # Create output directory if it doesn't exist
        os.makedirs(pdf_output_dir, exist_ok=True)
        
        # Open the PDF
        doc = fitz.open(pdf_path)
        logger.info(f"Processing PDF: {pdf_path} with {len(doc)} pages")
        
        # If no page numbers specified, process only page 1
        if page_numbers is None:
            page_numbers = [1]  # Default to just processing the first page
        
        # A4 dimensions in pixels at specified DPI
        # A4 is 210mm × 297mm
        width_mm, height_mm = 210, 297
        width_in, height_in = width_mm / 25.4, height_mm / 25.4  # Convert mm to inches
        width_px, height_px = int(width_in * dpi), int(height_in * dpi)
        
        for page_num in page_numbers:
            if page_num < 1 or page_num > len(doc):
                logger.warning(f"Page {page_num} out of range, skipping")
                continue
                
            page_idx = page_num - 1  # Convert 1-based to 0-based indexing
            page = doc[page_idx]
            
            # Improved background-matching text removal
            try:
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
                        
                        # Alternative: Use edge pixels to determine background
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
                
                # Save the final A4 PNG
                output_filename = f"{pdf_name}_page{page_num}.png"
                output_path = os.path.join(pdf_output_dir, output_filename)
                result_img.save(output_path, "PNG")
                logger.info(f"Saved: {output_path}")
                
            except Exception as e:
                logger.error(f"Error processing page {page_num}: {e}")
                logger.error(traceback.format_exc())
        
        return True
    
    except Exception as e:
        logger.error(f"Error processing PDF {pdf_path}: {e}")
        logger.error(traceback.format_exc())
        return False
    finally:
        if doc:
            doc.close()

def process_current_directory(output_dir="output", page_numbers=None, dpi=300):
    """
    Process all PDF files in the current directory
    
    Args:
        output_dir (str): Directory to save extracted images
        page_numbers (list, optional): List of page numbers to process (1-based). If None, process page 1.
        dpi (int): Resolution for the output images
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all PDF files in the current directory
    pdf_files = glob.glob("*.pdf")
    
    if not pdf_files:
        logger.warning("No PDF files found in the current directory")
        return
    
    logger.info(f"Found {len(pdf_files)} PDF files in the current directory")
    
    # Process each PDF file
    success_count = 0
    for pdf_file in pdf_files:
        logger.info(f"Processing {pdf_file}")
        if process_pdf(pdf_file, output_dir, page_numbers, dpi):
            success_count += 1
    
    logger.info(f"Successfully processed {success_count} out of {len(pdf_files)} PDF files")
    logger.info(f"Results saved in '{output_dir}' directory")

# Simple main function - no command line arguments needed
if __name__ == "__main__":
    print("PDF Image Extractor - Processing all PDFs in the current directory")
    print("This will extract page 1 from each PDF and save it as a PNG with text removed")
    print("Starting processing...")
    
    # Process all PDFs in the current directory, extracting only page 1
    process_current_directory()
    
    print("Processing complete. Check the 'output' folder for results.")
