import type { MapArea } from "../MapArea/index.ts";
import { getLayer } from "../utils/getLayer.ts";
import { addPointerListener } from "./addPointerListener.ts";

export type ZoomControlOptions = {
  /** HTML content of the zoom-in button */
  plus?: string;
  /** HTML content of the zoom-out button */
  minus?: string;
  /** CSS `inset` */
  inset?: string;
};

/**
 * Adds customizable zoom controls to the given map container.
 */
export function addZoomControls(
  map: MapArea,
  options: ZoomControlOptions = {},
) {
  let {
    plus: plusContent = "➕",
    minus: minusContent = "➖",
    inset = "0 0 auto auto",
  } = options;

  let layer = getLayer(map, {
    className: "zoom-controls",
    inset,
  });

  let plus = document.createElement("button");
  plus.dataset.id = "plus";
  plus.innerHTML = plusContent;

  let minus = document.createElement("button");
  minus.dataset.id = "minus";
  minus.innerHTML = minusContent;

  let applyLimits = () => {
    plus.toggleAttribute("disabled", map.zoom + 1 > map.maxZoom);
    minus.toggleAttribute("disabled", map.zoom - 1 < map.minZoom);
  };

  addPointerListener(map, ({ originalEvent: event }) => {
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
