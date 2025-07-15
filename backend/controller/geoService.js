// geoService.js
import fetch from "node-fetch";
import proj4 from "proj4";
import { fileURLToPath } from "url";

// ——————————————
// Config from env
// ——————————————
const GEOCODING_API_URL = process.env.GEOCODING_API_URL;
const GEOCODING_API_KEY = process.env.GEOCODING_API_KEY;

// ——————————————
// Internal helper to call Google’s reverse-geocode API
// ——————————————
async function reverseGeocode(lat, lon) {
  const url = `${GEOCODING_API_URL}?latlng=${lat},${lon}&key=${GEOCODING_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.status !== "OK") {
    console.error("Reverse-geocode error:", json);
    throw new Error(`Geocoding failed: ${json.status}`);
  }
  return json.results[0]?.address_components || [];
}

// ——————————————
// Reverse-geocoding helpers
// ——————————————
export async function lookupCountry(lat, lon) {
  const components = await reverseGeocode(lat, lon);
  const country = components.find((c) => c.types.includes("country"));
  return country?.long_name || "";
}

export async function lookupDistrict(lat, lon) {
  const components = await reverseGeocode(lat, lon);
  const district =
    components.find((c) => c.types.includes("administrative_area_level_2")) ||
    components.find((c) => c.types.includes("administrative_area_level_1"));
  return district?.long_name || "";
}

// ——————————————
// Geometry/dimension helpers
// ——————————————

/**
 * Compute “A x B” (meters) from corner lat/lon pairs
 * using the haversine formula.
 */
export function computeDimensionsFromCorners(corners /* [{lat,lon},…] */) {
  if (!corners.length) return "0 x 0";
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;

  function hav(a, b) {
    const φ1 = toRad(a.lat),
      φ2 = toRad(b.lat);
    const Δφ = toRad(b.lat - a.lat),
      Δλ = toRad(b.lon - a.lon);
    const sφ = Math.sin(Δφ / 2) ** 2,
      sλ = Math.sin(Δλ / 2) ** 2;
    const c =
      2 *
      Math.atan2(
        Math.sqrt(sφ + Math.cos(φ1) * Math.cos(φ2) * sλ),
        Math.sqrt(1 - sφ - Math.cos(φ1) * Math.cos(φ2) * sλ)
      );
    return R * c;
  }

  const lats = corners.map((p) => p.lat),
    lons = corners.map((p) => p.lon);

  const northSpan = hav(
    { lat: Math.min(...lats), lon: corners[0].lon },
    { lat: Math.max(...lats), lon: corners[0].lon }
  );
  const eastSpan = hav(
    { lat: corners[0].lat, lon: Math.min(...lons) },
    { lat: corners[0].lat, lon: Math.max(...lons) }
  );
  return `${northSpan.toFixed(2)} x ${eastSpan.toFixed(2)}`;
}

/**
 * Compute centroid (lat,lon) of an array of UTM coords.
 * Assumes all points share the same UTM zone string like "32N".
 */
export function computeUtmCentroid(utmArray /* [{easting,northing,zone},…] */) {
  const sumE = utmArray.reduce((s, p) => s + p.easting, 0);
  const sumN = utmArray.reduce((s, p) => s + p.northing, 0);
  const avgE = sumE / utmArray.length,
    avgN = sumN / utmArray.length;
  const zone = utmArray[0].zone; // e.g. "32N"

  const utmDef = `+proj=utm +zone=${zone.slice(0, -1)} +${
    zone.slice(-1) === "N" ? "north" : "south"
  } +datum=WGS84 +units=m +no_defs`;

  const [lon, lat] = proj4(utmDef, "+proj=longlat +datum=WGS84 +no_defs", [
    avgE,
    avgN,
  ]);
  return { lat, lon };
}

/**
 * Compute the true side-lengths (meters) of a UTM quadrilateral.
 * Assumes utmArray is ordered [A, B, C, D].
 * Returns [AB, BC, CD, DA].
 */
function computeSideLengthsFromUtm(utmArray /* [{easting,northing,zone},…] */) {
  if (!Array.isArray(utmArray) || utmArray.length < 2) return [];
  return utmArray.map((curr, i) => {
    const next = utmArray[(i + 1) % utmArray.length];
    const Δe = next.easting - curr.easting,
      Δn = next.northing - curr.northing;
    return Math.hypot(Δe, Δn);
  });
}

/**
 * Compute “A x B” (meters) from the true side-lengths
 * of a UTM quadrilateral [A, B, C, D].
 * A = the shorter side, B = the longer side.
 */
export function computeDimensionsFromUtm(
  utmArray /* [{easting,northing,zone},…] */
) {
  const sides = computeSideLengthsFromUtm(utmArray);
  if (sides.length < 2) return "0 x 0";
  const shortSide = Math.min(...sides),
    longSide = Math.max(...sides);
  return `${shortSide.toFixed(2)} x ${longSide.toFixed(2)}`;
}

// ——————————————
// Demo when run directly under ES modules
// ——————————————
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const corners = [
    { easting: 309014, northing: 1463359, zone: "32N" }, // A
    { easting: 309034, northing: 1463362, zone: "32N" }, // B
    { easting: 309038, northing: 1463384, zone: "32N" }, // C
    { easting: 309018, northing: 1463381, zone: "32N" }, // D
  ];

  const dims = computeDimensionsFromUtm(corners);
  console.log(`Plot side-lengths (short × long): ${dims} meters`);
}
