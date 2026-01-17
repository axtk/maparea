import type { MapArea } from "../MapArea/index.ts";
import type { DynamicString } from "../types/DynamicString.ts";

export function resolveString(
  map: MapArea,
  x: DynamicString | undefined,
): string | undefined {
  return typeof x === "function" ? x(map) : x;
}
