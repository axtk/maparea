import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";

/**
 * Resolves a dynamic value to a static value based on the context.
 */
export function resolveDynamic<T>(
  map: MapArea,
  x: Dynamic<T> | undefined,
): T | undefined {
  if (x === undefined) return x;

  return x instanceof Function ? x(map) : x;
}
