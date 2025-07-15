import sys
import pytesseract
from PIL import Image
import re
import json

# Force Tesseract path on Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_names(image_path):
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    text = re.sub(r'\s+', ' ', text)

    owner_match = re.search(r'thumb printed by the name[,:\s]*([A-Z .]+)', text, re.IGNORECASE)
    transferee_match = re.search(r'The said (Mr\.|Mrs\.|Miss)?\s*([A-Z .]+)', text, re.IGNORECASE)

    owner_name = owner_match.group(1).strip() if owner_match else ""
    transferred_to = transferee_match.group(2).strip() if transferee_match else ""

    result = {
        "ownerName": owner_name,
        "transferredTo": transferred_to
    }

    # ✅ THIS IS CRITICAL: Use JSON print for Node to parse
    print(json.dumps(result))

if __name__ == "__main__":
    extract_names(sys.argv[1])
