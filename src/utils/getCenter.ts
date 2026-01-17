import type { GeoCoords } from "../types/GeoCoords.ts";
import { getBounds } from "./getBounds.ts";

export function getCenter(coords: GeoCoords[]): GeoCoords {
  let { minLat, maxLat, minLon, maxLon } = getBounds(coords);

  return [
    minLat === undefined || maxLat === undefined ? 0 : (maxLat + minLat) / 2,
    minLon === undefined || maxLon === undefined ? 0 : (maxLon + minLon) / 2,
  ];
}
