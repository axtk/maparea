import type { IgnoredElement } from "../types/IgnoredElement.ts";

export function shouldIgnore(x: unknown, ignored: IgnoredElement | undefined) {
  if (ignored === undefined || !(x instanceof Element)) return false;

  return (
    (typeof ignored === "function" && ignored(x)) ||
    (typeof ignored === "string" && x.closest(ignored) !== null)
  );
}
