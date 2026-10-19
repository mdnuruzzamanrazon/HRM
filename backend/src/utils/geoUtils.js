/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 in decimal degrees
 * @param {number} lon1 - Longitude of point 1 in decimal degrees
 * @param {number} lat2 - Latitude of point 2 in decimal degrees
 * @param {number} lon2 - Longitude of point 2 in decimal degrees
 * @returns {number} Distance in meters (rounded to nearest integer)
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    throw new Error('Invalid coordinates provided to calculateDistanceMeters');
  }

  const R = 6371e3; // Earth's mean radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;

  const φ1 = toRad(p1);
  const φ2 = toRad(p2);
  const Δφ = toRad(p2 - p1);
  const Δλ = toRad(l2 - l1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format meters into human-readable distance (e.g. "45 m" or "1.2 km")
 * @param {number} meters 
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters === undefined || meters === null || isNaN(meters)) return 'N/A';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Validate that latitude and longitude are within standard geographical bounds
 * @param {number} lat 
 * @param {number} lng 
 * @returns {boolean}
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
