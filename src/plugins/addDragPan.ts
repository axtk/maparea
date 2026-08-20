import type { MapArea } from "../MapArea/index.ts";
import { type SetDragPanOptions, setDragPan } from "dragpan";

export type AddDragPanOptions = SetDragPanOptions;

const featureName = "plugin.drag_pan";

/**
 * Enables navigation over the given map container with a mouse or touches
 * or a scroll wheel (the latter can be disabled by setting `options.wheel`
 * to `false`).
 */
export function addDragPan(
  map: MapArea,
  { wheel = true, ignore, onStart, onMove, onEnd }: AddDragPanOptions = {},
) {
  if (map.features.has(featureName)) return;

  let x0 = 0;
  let y0 = 0;

  map.features.add(featureName);

  let unset = setDragPan(map.container, {
    onStart() {
      [x0, y0] = map.centerCoords;
      onStart?.();
    },
    onMove(dx, dy) {
      let x = x0 + dx;
      let y = y0 + dy;
      let geoCoords = map.toGeoCoords(x, y);

      if (map.canMoveTo(...geoCoords)) {
        map.center = geoCoords;
        x0 = x;
        y0 = y;
        onMove?.(dx, dy);
      }
    },
    onEnd,
    wheel,
    ignore,
  });

  return () => {
    unset();
    map.features.delete(featureName);
  };
}
