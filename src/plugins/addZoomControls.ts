import type { MapArea } from "../MapArea/index.ts";
import { getLayer } from "../utils/getLayer.ts";

export type ZoomControlOptions = {
  /** Minimal zoom value */
  min?: number;
  /** Maximal zoom value */
  max?: number;
  /** HTML content of the zoom-in button */
  plus?: string;
  /** HTML content of the zoom-out button */
  minus?: string;
};

export function addZoomControls(
  map: MapArea,
  options: ZoomControlOptions = {},
) {
  let layer = getLayer(map, {
    className: "zoom-controls",
    inset: "0 0 auto auto",
  });

  let {
    min,
    max,
    plus: plusContent = "➕",
    minus: minusContent = "➖",
  } = options;

  let plus = document.createElement("button");
  plus.dataset.id = "plus";
  plus.innerHTML = plusContent;

  let minus = document.createElement("button");
  minus.dataset.id = "minus";
  minus.innerHTML = minusContent;

  let applyLimits = () => {
    if (max !== undefined) plus.toggleAttribute("disabled", map.zoom + 1 > max);
    if (min !== undefined)
      minus.toggleAttribute("disabled", map.zoom - 1 < min);
  };

  layer.addEventListener("click", (event) => {
    let button = (event.target as HTMLElement | null)?.closest("button");

    if (button) {
      event.stopPropagation();
      map.zoom += button.dataset.id === "minus" ? -1 : 1;
      applyLimits();
    }
  });

  map.onRender(applyLimits);
  layer.append(plus, minus);

  return layer;
}
