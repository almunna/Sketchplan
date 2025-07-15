import sys
import os
import json
import requests
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
from pyproj import Proj, Transformer

submission_id = sys.argv[1]
data = json.loads(sys.argv[2])
GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_KEY")

# Load fonts
try:
    font_bold = ImageFont.truetype("DejaVuSans-Bold.ttf", 28)
    font_regular = ImageFont.truetype("DejaVuSans.ttf", 20)
    font_small = ImageFont.truetype("DejaVuSans.ttf", 18)
except:
    font_bold = font_regular = font_small = ImageFont.load_default()

os.makedirs("renders", exist_ok=True)


def draw_common_elements(img, plot, location, length=None, width=None):
    draw = ImageDraw.Draw(img)
    draw.rectangle([(220, 180 + 40), (420, 440 + 40)], outline="white", width=4)
    draw.text((230, 250 + 40), plot, fill="white", font=font_bold)
    if length and width:
        draw.text((230, 280 + 40), f"{length}m x {width}m", fill="white", font=font_regular)
    draw.text((10, 10), location, fill="white", font=font_regular)


# === Option A: Single Point + Length/Width ===
if "lat" in data and "lon" in data and "length" in data and "width" in data:
    lat = float(data["lat"])
    lon = float(data["lon"])
    length = float(data["length"])
    width = float(data["width"])
    plot = data.get("plotNumber", "Plot A")
    location = data.get("address", "")
    zoom = 20

    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={lat},{lon}&zoom={zoom}&size=640x640"
        f"&maptype=satellite&key={GOOGLE_MAPS_KEY}"
    )
    response = requests.get(url)
    sat_img = Image.open(BytesIO(response.content))

    canvas_height = sat_img.height + 140
    canvas = Image.new("RGB", (sat_img.width, canvas_height), "white")
    canvas.paste(sat_img, (0, 40))

    draw_common_elements(canvas, plot, location, length, width)

    out_path = f"renders/{submission_id}.png"
    canvas.save(out_path)
    print(out_path)
    sys.exit(0)

# === Option B: 4 Latitude/Longitude Corners ===
if "latLngCorners" in data:
    corners = data["latLngCorners"]
    lats = [pt["lat"] for pt in corners]
    lons = [pt["lon"] for pt in corners]
    center_lat = sum(lats) / len(lats)
    center_lon = sum(lons) / len(lons)
    zoom = 20

    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={center_lat},{center_lon}&zoom={zoom}&size=640x640"
        f"&maptype=satellite&key={GOOGLE_MAPS_KEY}"
    )
    response = requests.get(url)
    sat_img = Image.open(BytesIO(response.content))

    canvas_height = sat_img.height + 140
    canvas = Image.new("RGB", (sat_img.width, canvas_height), "white")
    canvas.paste(sat_img, (0, 40))

    plot = data.get("plotNumber", "Plot")
    location = data.get("address", "Gambia")
    length = float(data["length"]) if "length" in data else None
    width = float(data["width"]) if "width" in data else None

    draw_common_elements(canvas, plot, location, length, width)

    out_path = f"renders/{submission_id}.png"
    canvas.save(out_path)
    print(out_path)
    sys.exit(0)

# === Option C: UTM Coordinates (Convert to Lat/Lon) ===
if "utmCoords" in data:
    utm_coords = [(float(p["easting"]), float(p["northing"])) for p in data["utmCoords"]]
    utm_proj = Proj(proj="utm", zone=28, ellps="WGS84")
    latlon_proj = Proj(proj="latlong", datum="WGS84")
    transformer = Transformer.from_crs(utm_proj.crs, latlon_proj.crs, always_xy=True)
    latlon_coords = [transformer.transform(e, n) for e, n in utm_coords]

    latLngCorners = [{"lat": lat, "lon": lon} for lon, lat in latlon_coords]
    lats = [pt["lat"] for pt in latLngCorners]
    lons = [pt["lon"] for pt in latLngCorners]
    center_lat = sum(lats) / len(lats)
    center_lon = sum(lons) / len(lons)
    zoom = 20

    url = (
        f"https://maps.googleapis.com/maps/api/staticmap"
        f"?center={center_lat},{center_lon}&zoom={zoom}&size=640x640"
        f"&maptype=satellite&key={GOOGLE_MAPS_KEY}"
    )
    response = requests.get(url)
    sat_img = Image.open(BytesIO(response.content))

    canvas_height = sat_img.height + 140
    canvas = Image.new("RGB", (sat_img.width, canvas_height), "white")
    canvas.paste(sat_img, (0, 40))

    plot = data.get("plotNumber", "Plot")
    location = data.get("address", "Gambia")
    length = float(data["length"]) if "length" in data else None
    width = float(data["width"]) if "width" in data else None

    draw_common_elements(canvas, plot, location, length, width)

    out_path = f"renders/{submission_id}.png"
    canvas.save(out_path)
    print(out_path)
    sys.exit(0)
