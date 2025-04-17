import json
import base64
import os
from extract_images import process_pdf  # import your actual logic
from tempfile import NamedTemporaryFile

def handler(event, context):
    try:
        body = json.loads(event["body"])
        filename = body["filename"]
        file_data = base64.b64decode(body["file"])  # assumes base64 PDF string
        
        with NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(file_data)
            tmp_pdf_path = tmp_pdf.name

        output_dir = "/tmp/output"
        os.makedirs(output_dir, exist_ok=True)
        process_pdf(tmp_pdf_path, output_dir=output_dir, page_numbers=[1], dpi=300)
        
        # Return the path of the generated PNG
        output_files = os.listdir(output_dir)
        png_files = [f for f in output_files if f.endswith(".png")]
        if not png_files:
            return {"statusCode": 500, "body": json.dumps({"error": "No image output."})}
        
        output_path = os.path.join(output_dir, png_files[0])
        with open(output_path, "rb") as out_f:
            encoded_img = base64.b64encode(out_f.read()).decode("utf-8")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "filename": png_files[0],
                "image": encoded_img
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
