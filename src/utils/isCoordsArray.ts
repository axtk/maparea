/**
 * Checks whether the given value is an array of coordinates.
 */
export function isCoordsArray(x: unknown): x is [number, number] {
  return (
    Array.isArray(x) &&
    x.length === 2 &&
    typeof x[0] === "number" &&
    typeof x[1] === "number"
  );
}
