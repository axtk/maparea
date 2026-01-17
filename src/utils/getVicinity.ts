import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { getBounds } from "./getBounds.ts";
import { isGeoCoords } from "./isGeoCoords.ts";

const defaultPadding: GeoCoords = [0.005, 0.018];

function toGeoBounds(x: GeoCoords | GeoCoords[] | GeoBounds): GeoBounds {
  if (Array.isArray(x)) {
    if (isGeoCoords(x))
      return { minLat: x[0], maxLat: x[0], minLon: x[1], maxLon: x[1] };
    else return getBounds(x);
  }
  return x;
}

export function getVicinity(
  x: GeoCoords | GeoCoords[] | GeoBounds,
  [dLat, dLon] = defaultPadding,
): GeoBounds {
  let { minLat = 0, maxLat = 0, minLon = 0, maxLon = 0 } = toGeoBounds(x);

  return {
    minLat: minLat - dLat,
    maxLat: maxLat + dLat,
    minLon: minLon - dLon,
    maxLon: maxLon + dLon,
  };
}
