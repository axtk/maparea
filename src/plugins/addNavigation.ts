import type { MapArea } from "../MapArea/index.ts";
import { addElementNavigation } from "../utils/addElementNavigation.ts";

export function addNavigation(map: MapArea) {
  let x0 = 0;
  let y0 = 0;

  addElementNavigation(map.container, {
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
    wheel: true,
  });
}
