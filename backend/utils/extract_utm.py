import sys
import re
import json
import platform
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

# ✅ Set Tesseract path only on Windows
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

image_path = sys.argv[1]
image = Image.open(image_path).convert("L")
image = ImageEnhance.Contrast(image).enhance(2.5)
image = image.filter(ImageFilter.SHARPEN)

text = pytesseract.image_to_string(image)

text = text.replace("\n", " ").replace("\r", " ")
text = text.replace("O", "0").replace("|", "1").replace("GPS Coordinates:", "")
text = re.sub(r'\s+', ' ', text)
text = text.replace("a=", "A=").replace("b=", "B=").replace("c=", "C=").replace("d=", "D=")
text = text.replace("A :", "A=").replace("B :", "B=").replace("C :", "C=").replace("D :", "D=")

matches = re.findall(r'([A-D])\s*=\s*(\d{6})\s+(\d{7})', text)

results = []
for label, easting, northing in matches:
    results.append({
        "label": label,
        "zone": "32N",
        "easting": int(easting),
        "northing": int(northing)
    })

print(json.dumps(results))
