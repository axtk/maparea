import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { getGeoBounds } from "./getGeoBounds.ts";
import { isCoordsArray } from "./isCoordsArray.ts";

export function toGeoBounds(x: GeoCoords | GeoCoords[] | GeoBounds): GeoBounds {
  if (isCoordsArray(x))
    return { minLat: x[0], maxLat: x[0], minLon: x[1], maxLon: x[1] };

  return Array.isArray(x) ? getGeoBounds(x) : x;
}
