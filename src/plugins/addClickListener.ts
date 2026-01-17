import type { MapArea } from "../MapArea/index.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
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

  let start = () => {
    t0 = Date.now();
  };

  let end = (event: MouseEvent) => {
    if (shouldIgnore(event.target, ignored)) return;

    // Skip the click handler if the pointer was dragged
    if (Date.now() - t0 > 150) return;

    let {
      box,
      centerCoords: [cx, cy],
    } = map;

    let x = event.clientX - box.x;
    let y = event.clientY - box.y;

    let [lat, lon] = map.toGeoCoords(
      x - 0.5 * box.w + cx,
      y - 0.5 * box.h + cy,
    );

    callback({ x, y, lat, lon, originalEvent: event });
  };

  map.container.addEventListener("mousedown", start);
  map.container.addEventListener("mouseup", end);

  return () => {
    map.container.removeEventListener("mousedown", start);
    map.container.removeEventListener("mouseup", end);
  };
}
