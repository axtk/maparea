import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";

export function getGeoBounds(coords: GeoCoords[]): GeoBounds {
  if (coords.length === 0) return {};

  let minLat = coords[0][0];
  let maxLat = minLat;
  let minLon = coords[0][1];
  let maxLon = minLon;

  for (let [lat, lon] of coords) {
    if (minLat > lat) minLat = lat;
    if (maxLat < lat) maxLat = lat;
    if (minLon > lon) minLon = lon;
    if (maxLon < lon) maxLon = lon;
  }

  return { minLat, maxLat, minLon, maxLon };
}
