import type { MapArea } from "../MapArea/index.ts";
import { addPointerListener } from "../plugins/addPointerListener.ts";

const zoomInIcon =
  '<svg viewBox="0 0 10 10" height="16"><path d="M 1 5 L 9 5 M 5 1 L 5 9" stroke="currentColor" fill="none"/></svg>';
const zoomOutIcon =
  '<svg viewBox="0 0 10 10" height="16"><path d="M 1 5 L 9 5" stroke="currentColor" fill="none"/></svg>';

export type ZoomControlOptions = {
  /** HTML content of the zoom-in button */
  zoomIn?: string;
  /** HTML content of the zoom-out button */
  zoomOut?: string;
};

/**
 * Returns a zoom control connected to the given map container.
 */
export function getZoomControl(
  map: MapArea,
  options: ZoomControlOptions = {},
): HTMLElement {
  let {
    zoomIn: zoomInContent = zoomInIcon,
    zoomOut: zoomOutContent = zoomOutIcon,
  } = options;

  let control = document.createElement("fieldset");
  control.dataset.role = "zoom";

  let zoomIn = document.createElement("button");
  zoomIn.dataset.role = "zoomin";
  zoomIn.innerHTML = zoomInContent;

  let zoomOut = document.createElement("button");
  zoomOut.dataset.role = "zoomout";
  zoomOut.innerHTML = zoomOutContent;

  let applyLimits = () => {
    zoomIn.toggleAttribute("disabled", map.zoom + 1 > map.maxZoom);
    zoomOut.toggleAttribute("disabled", map.zoom - 1 < map.minZoom);
  };

  addPointerListener(map, ({ originalEvent: event }) => {
    let target = event.target;
    let z = map.zoom;

    if (target instanceof Element) {
      if (zoomIn.contains(target)) z += 1;
      else if (zoomOut.contains(target)) z -= 1;

      if (map.zoom !== z) {
        map.zoom = z;
        applyLimits();
      }
    }
  });

  map.onRender(applyLimits);

  control.append(zoomIn, zoomOut);

  return control;
}
