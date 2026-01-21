import type { MapArea } from "../MapArea/index.ts";
import { setMovableViewport } from "../utils/setMovableViewport.ts";

export type MapAreaNavigationOptions = {
  wheel?: boolean;
};

/**
 * Enables navigation over the given map container with a mouse or touches
 * or a scroll wheel (the latter can be disabled by setting `options.wheel`
 * to `false`).
 */
export function addMovableViewport(
  map: MapArea,
  options?: MapAreaNavigationOptions,
) {
  let x0 = 0;
  let y0 = 0;

  setMovableViewport(map.container, {
    onStart() {
      [x0, y0] = map.centerCoords;
    },
    onMove(dx, dy) {
      let x = x0 + dx;
      let y = y0 + dy;
      let geoCoords = map.toGeoCoords(x, y);

      if (map.canMoveTo(...geoCoords)) {
        map.center = geoCoords;
        x0 = x;
        y0 = y;
      }
    },
    wheel: options?.wheel ?? true,
  });
}
