import type { MapArea } from "../MapArea/index.ts";
import { addPointerListener } from "../plugins/addPointerListener.ts";

export type ZoomControlOptions = {
  /** HTML content of the zoom-in button */
  plus?: string;
  /** HTML content of the zoom-out button */
  minus?: string;
};

/**
 * Returns a zoom control connected to the given map container.
 */
export function getZoomControl(
  map: MapArea,
  options: ZoomControlOptions = {},
): HTMLElement {
  let {
    plus: plusContent = "➕",
    minus: minusContent = "➖",
  } = options;

  let control = document.createElement("fieldset");

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
    let target = event.target;

    if (target instanceof HTMLButtonElement && control.contains(target)) {
      map.zoom += target.dataset.id === "minus" ? -1 : 1;
      applyLimits();
    }
  });

  map.onRender(applyLimits);

  control.append(plus, minus);

  return control;
}
