import type { MapArea } from "../MapArea/index.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import { getLayer } from "../utils/getLayer.ts";

export type AddElementOptions = {
  /** Target layer. */
  layer?: HTMLElement;
  /** Geographical position (`[lat, lon]`) of the element's top left corner. */
  position?: GeoCoords;
};

/**
 * Adds an HTML or SVG element to the map.
 *
 * The element is added onto a dedicated map layer. To add multiple elements
 * with `addElement()`, consider creating a layer with `getLayer()` beforehand,
 * which can be passed to `addElement()` as `options.layer`.
 */
export function addElement(
  map: MapArea,
  element: HTMLElement | SVGSVGElement,
  options: AddElementOptions = {},
) {
  let layer = options.layer ?? getLayer(map, { id: "maparea.elements" });

  element.style.position = "absolute";
  layer.append(element);

  map.onRender(() => {
    let { position } = options;
    if (!position) return;

    let [x, y] = map.toViewportCoords(...position);
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  return {
    container: layer,
    clear() {
      element.remove();
    },
  };
}
