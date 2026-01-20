import { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { toGeoBounds } from "./toGeoBounds.ts";

/**
 * Calculates the geographic coordinates of the center of an array
 * of geographic coordinates or a geographic region.
 */
export function getCenter(coords: GeoCoords[] | GeoBounds): GeoCoords {
  let { minLat, maxLat, minLon, maxLon } = toGeoBounds(coords);

  return [
    minLat === undefined || maxLat === undefined ? 0 : (maxLat + minLat) / 2,
    minLon === undefined || maxLon === undefined ? 0 : (maxLon + minLon) / 2,
  ];
}
