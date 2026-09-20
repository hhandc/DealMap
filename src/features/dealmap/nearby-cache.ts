type Coordinates = { lat: number; lng: number };

const CACHE_TTL_MS = 10 * 60 * 1000;
const LOCATION_GRID = 0.003;

function cacheKey(location: Coordinates, brands: string[]) {
  const latCell = Math.floor(location.lat / LOCATION_GRID);
  const lngCell = Math.floor(location.lng / LOCATION_GRID);
  const brandKey = [...brands].sort().join("|");
  return `${latCell}:${lngCell}:${brandKey}`;
}

export class NearbySearchCache<T> {
  private entries = new Map<string, { savedAt: number; value: T }>();

  read(location: Coordinates, brands: string[], now = Date.now()) {
    const entry = this.entries.get(cacheKey(location, brands));
    if (!entry || now - entry.savedAt >= CACHE_TTL_MS) return null;
    return entry.value;
  }

  store(location: Coordinates, brands: string[], value: T, now = Date.now()) {
    this.entries.set(cacheKey(location, brands), { savedAt: now, value });
  }
}
