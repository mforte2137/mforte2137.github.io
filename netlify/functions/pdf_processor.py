import json
import base64
import os
from .extract_images import process_pdf  # <- Adjusted to local import
from tempfile import NamedTemporaryFile

def handler(event, context):
    try:
        body = json.loads(event["body"])
        filename = body["filename"]
        file_data = base64.b64decode(body["file"])  # base64 PDF file

        # Save uploaded PDF temporarily
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(file_data)
            tmp_pdf_path = tmp_pdf.name

        # Create temporary output directory
        output_dir = "/tmp/output"
        os.makedirs(output_dir, exist_ok=True)

        # Run your PDF processing logic
        success = process_pdf(tmp_pdf_path, output_dir=output_dir, page_numbers=[1], dpi=300)

        if not success:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "PDF processing failed."})
            }

        # Find output PNG file
        pdf_name = os.path.splitext(os.path.basename(filename))[0]
        png_path = os.path.join(output_dir, pdf_name, f"{pdf_name}_page1.png")
        if not os.path.exists(png_path):
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "Image output not found."})
            }

        # Encode PNG to base64
        with open(png_path, "rb") as f:
            encoded_img = base64.b64encode(f.read()).decode("utf-8")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "filename": os.path.basename(png_path),
                "image": encoded_img
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
