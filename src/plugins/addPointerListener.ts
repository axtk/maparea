import type { MapArea } from "../MapArea/index.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
import { shouldIgnore } from "../utils/shouldIgnore.ts";

export type MapAreaPointerEvent = {
  x: number;
  y: number;
  lat: number;
  lon: number;
  originalEvent: MouseEvent | TouchEvent;
};

export type MapAreaPointerEventCallback = (event: MapAreaPointerEvent) => void;

export type AddPointerListenerOptions = {
  ignore?: IgnoredElement;
};

/**
 * Adds a pointer event listener to the map and returns a function that
 * removes the added listener.
 */
export function addPointerListener(
  map: MapArea,
  callback: MapAreaPointerEventCallback,
  { ignore }: AddPointerListenerOptions = {},
) {
  let x0: number | null = null;
  let y0: number | null = null;
  let t0 = Date.now();

  let start = (event: PointerEvent) => {
    x0 = event.clientX;
    y0 = event.clientY;
    t0 = Date.now();
  };

  let end = (event: PointerEvent) => {
    if (shouldIgnore(event.target, ignore) || x0 === null || y0 === null)
      return;

    // Skip the click handler if the pointer was dragged
    if (Date.now() - t0 > 150) return;

    let {
      box,
      centerCoords: [cx, cy],
    } = map;

    let x = x0 - box.x;
    let y = y0 - box.y;

    let [lat, lon] = map.toGeoCoords(
      x - 0.5 * box.w + cx,
      y - 0.5 * box.h + cy,
    );

    callback({ x, y, lat, lon, originalEvent: event });

    x0 = null;
    y0 = null;
  };

  map.container.addEventListener("pointerdown", start);
  map.container.addEventListener("pointerup", end);
  map.container.addEventListener("pointercancel", end);

  return () => {
    map.container.removeEventListener("pointerdown", start);
    map.container.removeEventListener("pointerup", end);
    map.container.removeEventListener("pointercancel", end);
  };
}
