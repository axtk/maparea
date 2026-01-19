import { MapArea } from "../MapArea/index.ts";
import { DynamicString } from "../types/DynamicString.ts";
import { GeoCoords } from "../types/GeoCoords.ts";
import { getLayer } from "../utils/getLayer.ts";
import { resolveString } from "../utils/resolveString.ts";
import { toPrecision } from "../utils/toPrecision.ts";

export type MapAreaElementOptions = {
  className?: string;
  /** Geographical position (`[lat, lon]`) of the element's top left corner. */
  coords?: GeoCoords;
  /** CSS `inset` (disregarding `coords`). */
  inset?: DynamicString;
  /** Target layer. */
  layer?: Element;
  /** HTML content of the element. */
  content?: DynamicString;
};

export function addElement(map: MapArea, element: HTMLElement | SVGSVGElement, { className, coords, inset, layer, content }: MapAreaElementOptions) {
  let effectiveLayer = layer ?? getLayer(map, { className: "elements" });

  // SVGs require `setAttribute()`
  if (className) element.setAttribute("class", className);

  element.style.position = "absolute";
  effectiveLayer.append(element);

  map.onRender(() => {
    if (inset) element.style.inset = resolveString(map, inset);
    else if (coords) {
      let {
        centerCoords: [cx, cy],
        box: { w, h },
      } = map;

      let [px, py] = map.toPixelCoords(...coords);

      let x = toPrecision(px - cx + w/2, 2);
      let y = toPrecision(py - cy + h/2, 2);

      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    if (content) {
      let resolvedContent = resolveString(map, content);

      if (element.innerHTML !== resolvedContent)
        element.innerHTML = resolvedContent;
    }
  });
}
