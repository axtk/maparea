import type { GeoCoords } from "../types/GeoCoords.ts";

export function isGeoCoords(x: unknown): x is GeoCoords {
  return (
    Array.isArray(x) &&
    x.length === 2 &&
    typeof x[0] === "number" &&
    typeof x[1] === "number"
  );
}
