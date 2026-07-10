import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { toGeoBounds } from "./toGeoBounds.ts";

function getDefaultPadding({
  minLat = 0,
  maxLat = 0,
  minLon = 0,
  maxLon = 0,
}: GeoBounds): GeoCoords {
  let d = 0.03 * Math.max(maxLat - minLat, maxLon - minLon);
  return [d, d];
}

/**
 * Returns the minimal and maximal latitudes and longitudes of a region
 * surrounding a geographic area, an array of geographic coordinates,
 * or a single point.
 */
export function getVicinity(
  x: GeoCoords | GeoCoords[] | GeoBounds,
  padding?: GeoCoords,
): GeoBounds {
  let bounds = toGeoBounds(x);
  let [dLat, dLon] = padding ?? getDefaultPadding(bounds);
  let { minLat = 0, maxLat = 0, minLon = 0, maxLon = 0 } = bounds;

  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLon: minLon - dLon,
    maxLon: maxLon + dLon,
  };
}
