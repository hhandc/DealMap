type Coordinates = { lat: number; lng: number };
type TrackedLocation = Coordinates & { searchedAt: number };

const MIN_REFRESH_INTERVAL_MS = 90_000;
const MIN_REFRESH_DISTANCE_METERS = 500;

function distanceInMeters(a: Coordinates, b: Coordinates) {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latDelta = toRadians(b.lat - a.lat);
  const lngDelta = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(latDelta / 2);
  const sinLng = Math.sin(lngDelta / 2);
  const haversine = sinLat * sinLat + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLng * sinLng;
  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function shouldRefreshNearbySearch(last: TrackedLocation | null, next: Coordinates, now = Date.now()) {
  if (!last) return true;
  if (now - last.searchedAt < MIN_REFRESH_INTERVAL_MS) return false;
  return distanceInMeters(last, next) >= MIN_REFRESH_DISTANCE_METERS;
}
