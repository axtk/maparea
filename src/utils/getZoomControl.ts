import type { MapArea } from "../MapArea/index.ts";
import { addPointerListener } from "../plugins/addPointerListener.ts";

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
  let { zoomIn: zoomInContent = "➕", zoomOut: zoomOutContent = "➖" } = options;

  let control = document.createElement("fieldset");
  control.dataset.element = "zoom";

  let zoomIn = document.createElement("button");
  zoomIn.dataset.element = "zoomin";
  zoomIn.innerHTML = zoomInContent;

  let zoomOut = document.createElement("button");
  zoomOut.dataset.element = "zoomout";
  zoomOut.innerHTML = zoomOutContent;

  let applyLimits = () => {
    zoomIn.toggleAttribute("disabled", map.zoom + 1 > map.maxZoom);
    zoomOut.toggleAttribute("disabled", map.zoom - 1 < map.minZoom);
  };

  addPointerListener(map, ({ originalEvent: event }) => {
    let target = event.target;

    if (target instanceof HTMLButtonElement && control.contains(target)) {
      map.zoom += target.dataset.element === "zoomout" ? -1 : 1;
      applyLimits();
    }
  });

  map.onRender(applyLimits);

  control.append(zoomIn, zoomOut);

  return control;
}
