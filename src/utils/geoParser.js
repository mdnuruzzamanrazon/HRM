/**
 * Geographical coordinate parsing, sanitation, reversal protection,
 * and distance calculation utilities.
 */

// Earth's radius in meters
export const EARTH_RADIUS_METERS = 6371000;

/**
 * Validate if a given latitude and longitude pair is within legal WGS84 bounds.
 */
export function isValidCoordinate(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180
  );
}

/**
 * Sanitize coordinates and automatically detect accidental latitude / longitude reversal.
 * - Latitude must be in [-90, +90]
 * - Longitude must be in [-180, +180]
 */
export function sanitizeCoordinates(v1, v2) {
  let lat = Number(v1);
  let lng = Number(v2);

  if (isNaN(lat) || isNaN(lng)) return null;

  let wasSwapped = false;

  // If first value is > 90 or < -90, but within 180, and second value is within 90,
  // the user accidentally entered Longitude first!
  if (Math.abs(lat) > 90 && Math.abs(lat) <= 180 && Math.abs(lng) <= 90) {
    const temp = lat;
    lat = lng;
    lng = temp;
    wasSwapped = true;
  }

  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      wasSwapped,
    };
  }

  return null;
}

/**
 * Robust parser supporting Google Maps URLs, query strings, geo: URIs,
 * DMS coordinates, and raw coordinate text formats.
 */
export function parseLocationInput(input) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // Pattern 1: @lat,lng,zoom (Google Maps URL)
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    return sanitizeCoordinates(lat, lng);
  }

  // Pattern 2: ?q=lat,lng or &q=lat,lng or ?ll=lat,lng
  const qMatch = str.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    return sanitizeCoordinates(lat, lng);
  }

  // Pattern 3: geo:lat,lng URI
  const geoMatch = str.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (geoMatch) {
    const lat = parseFloat(geoMatch[1]);
    const lng = parseFloat(geoMatch[2]);
    return sanitizeCoordinates(lat, lng);
  }

  // Pattern 4: Raw coordinates format (lat, lng or lat lng)
  const coordMatch = str.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const v1 = parseFloat(coordMatch[1]);
    const v2 = parseFloat(coordMatch[2]);
    return sanitizeCoordinates(v1, v2);
  }

  // Pattern 5: Degrees Minutes Seconds (DMS) e.g. 37°46'29.7"N 122°25'09.9"W
  const dmsMatch = str.match(/(\d+)°(\d+)'([\d.]+)"?([NSEW])\s*(\d+)°(\d+)'([\d.]+)"?([NSEW])/i);
  if (dmsMatch) {
    const latDeg = parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600;
    const lat = dmsMatch[4].toUpperCase() === 'S' ? -latDeg : latDeg;
    const lngDeg = parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600;
    const lng = dmsMatch[8].toUpperCase() === 'W' ? -lngDeg : lngDeg;
    return sanitizeCoordinates(lat, lng);
  }

  return null;
}

/**
 * Haversine formula to compute geodesic surface distance between two points in meters.
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);
  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return Infinity;

  const toRad = (angle) => (angle * Math.PI) / 180;
  const φ1 = toRad(p1);
  const φ2 = toRad(p2);
  const Δφ = toRad(p2 - p1);
  const Δλ = toRad(l2 - l1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Format distance in user-friendly meters or kilometers.
 */
export function formatDistance(meters) {
  if (meters === undefined || meters === null || isNaN(meters)) return 'Unknown';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Check if coordinates appear reversed based on standard bounds.
 */
export function isReversedCoordinates(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return Math.abs(nLat) > 90 && Math.abs(nLat) <= 180 && Math.abs(nLng) <= 90;
}
