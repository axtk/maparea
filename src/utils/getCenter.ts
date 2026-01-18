import type { GeoCoords } from "../types/GeoCoords.ts";
import { getGeoBounds } from "./getGeoBounds.ts";

export function getCenter(coords: GeoCoords[]): GeoCoords {
  let { minLat, maxLat, minLon, maxLon } = getGeoBounds(coords);

  return [
    minLat === undefined || maxLat === undefined ? 0 : (maxLat + minLat) / 2,
    minLon === undefined || maxLon === undefined ? 0 : (maxLon + minLon) / 2,
  ];
}
