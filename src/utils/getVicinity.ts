import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { toGeoBounds } from "./toGeoBounds.ts";

const defaultPadding: GeoCoords = [0.005, 0.018];

/**
 * Returns the minimal and maximal latitudes and longitudes of a region
 * surrounding a geographic area, an array of geographic coordinates,
 * or a single point.
 */
export function getVicinity(
  x: GeoCoords | GeoCoords[] | GeoBounds,
  padding = defaultPadding,
): GeoBounds {
  let { minLat = 0, maxLat = 0, minLon = 0, maxLon = 0 } = toGeoBounds(x);
  let [dLat, dLon] = padding;

  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLon: minLon - dLon,
    maxLon: maxLon + dLon,
  };
}
