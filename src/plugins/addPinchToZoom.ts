import type { MapArea } from "../MapArea/index.ts";
import type { PixelCoords } from "../types/PixelCoords.ts";

const { hypot, log2, abs, trunc } = Math;

function getDistance(
  { clientX: x1, clientY: y1 }: Touch,
  { clientX: x2, clientY: y2 }: Touch,
) {
  return hypot(x2 - x1, y2 - y1);
}

function getPinchCenter(
  { clientX: x1, clientY: y1 }: Touch,
  { clientX: x2, clientY: y2 }: Touch,
): PixelCoords {
  return [(x1 + x2) / 2, (y1 + y2) / 2];
}

export type AddPinchToZoomOptions = {
  /**
   * Defines how much the distance between the pinch touches should change
   * in order to change the map zoom by 1.
   */
  pace?: number;
};

const defaultPace = 1.2;

export function addPinchToZoom(
  map: MapArea,
  { pace = defaultPace }: AddPinchToZoomOptions = {},
) {
  let { container } = map;

  // Distance between the initial touches
  let d0: number | null = null;
  // Map zoom at the initial touch
  let z0: number | null = null;
  // Applied zoom change
  let dz0 = 0;

  function isPinchEvent(event: TouchEvent) {
    return event.touches.length === 2;
  }

  function handleTouchStart(event: TouchEvent) {
    if (isPinchEvent(event)) {
      event.preventDefault();

      d0 = getDistance(event.touches[0], event.touches[1]);
      z0 = map.zoom;
      dz0 = 0;
    }
  }

  let nextUpdate: ReturnType<typeof requestAnimationFrame> | null = null;

  function handleTouchMove(event: TouchEvent) {
    if (isPinchEvent(event) && d0 !== null && d0 !== 0 && z0 !== null) {
      event.preventDefault();

      let d = getDistance(event.touches[0], event.touches[1]);
      let dz = log2(d / d0) / log2(pace) - dz0;

      if (abs(dz) >= 1) {
        let {
          box: { x, y, w, h },
          centerCoords: [cx, cy],
        } = map;
        let [pinchX, pinchY] = getPinchCenter(
          event.touches[0],
          event.touches[1],
        );

        // Pinch position relative to the map center
        let px = pinchX - w / 2 - x;
        let py = pinchY - h / 2 - y;

        let [pinchLat, pinchLon] = map.toGeoCoords(cx + px, cy + py);

        // Apply zoom changes in whole numbers
        let zoomChange = trunc(dz);

        if (nextUpdate) cancelAnimationFrame(nextUpdate);

        nextUpdate = requestAnimationFrame(() => {
          map.zoom += zoomChange;
          // Accumulate the already applied zoom change so that the further
          // zoom changes don't include it
          dz0 += zoomChange;

          let [px2, py2] = map.toPixelCoords(pinchLat, pinchLon);
          let [cx2, cy2] = map.centerCoords;

          // Updated pinch position relative to the map center
          px2 -= cx2;
          py2 -= cy2;

          let dpx = px2 - px;
          let dpy = py2 - py;

          // Move the map center so that the pinch center sits at about the
          // same geographic position
          map.center = map.toGeoCoords(cx2 + dpx, cy2 + dpy);
        });
      }
    }
  }

  container.addEventListener("touchstart", handleTouchStart);
  container.addEventListener("touchmove", handleTouchMove);

  return () => {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
  };
}
