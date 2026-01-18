import type { MapArea } from "../MapArea/index.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
import { getPointerPosition } from "../utils/getPointerPosition.ts";
import { shouldIgnore } from "../utils/shouldIgnore.ts";

export type MapAreaClickEvent = {
  x: number;
  y: number;
  lat: number;
  lon: number;
  originalEvent: MouseEvent | TouchEvent;
};

export type MapAreaClickCallback = (event: MapAreaClickEvent) => void;

/**
 * Adds a click listener to the map and returns a function
 * removing the added click listener.
 */
export function addClickListener(
  map: MapArea,
  callback: MapAreaClickCallback,
  ignored?: IgnoredElement,
) {
  let t0 = Date.now();
  let pointerPosition: [number, number] | null = null;

  let start = (event: MouseEvent | TouchEvent) => {
    t0 = Date.now();
    pointerPosition = getPointerPosition(event);
  };

  let end = (event: MouseEvent | TouchEvent) => {
    if (shouldIgnore(event.target, ignored) || !pointerPosition) return;

    // Skip the click handler if the pointer was dragged
    if (Date.now() - t0 > 150) return;

    let {
      box,
      centerCoords: [cx, cy],
    } = map;

    let x = pointerPosition[0] - box.x;
    let y = pointerPosition[1] - box.y;

    let [lat, lon] = map.toGeoCoords(
      x - 0.5 * box.w + cx,
      y - 0.5 * box.h + cy,
    );

    callback({ x, y, lat, lon, originalEvent: event });
    pointerPosition = null;
  };

  map.container.addEventListener("mousedown", start);
  map.container.addEventListener("mouseup", end);

  map.container.addEventListener("touchstart", start);
  map.container.addEventListener("touchend", end);

  return () => {
    map.container.removeEventListener("mousedown", start);
    map.container.removeEventListener("mouseup", end);

    map.container.removeEventListener("touchstart", start);
    map.container.removeEventListener("touchend", end);
  };
}
