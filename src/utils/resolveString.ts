import type { MapArea } from "../MapArea/index.ts";
import type { DynamicString } from "../types/DynamicString.ts";

/**
 * Resolves a dynamic value to a static value based on the context.
 */
export function resolveString(
  map: MapArea,
  x: DynamicString | undefined,
): string {
  return typeof x === "function" ? x(map) : (x ?? "");
}
