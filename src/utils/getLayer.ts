import type { MapArea } from "../MapArea/index.ts";
import { getId } from "./getId.ts";

export type LayerOptions = {
  id?: string;
  className?: string;
  /** CSS `inset` */
  inset?: string;
};

/**
 * Returns an existing map layer based on the given properties,
 * and creates one if it doesn't exist yet.
 */
export function getLayer(
  map: MapArea,
  { id, className, inset = "0" }: LayerOptions = {},
): HTMLElement {
  let selector = `${className ? `.${className}` : ""}${id ? `[data-id="${id}"]` : ""}`;
  let layer = map.container.querySelector<HTMLElement>(selector);

  if (!layer) {
    layer = document.createElement("div");
    layer.className = `${className ? `${className} ` : ""}layer`;
    layer.dataset.id = id ?? getId();
    layer.style = `position: absolute; inset: ${inset};`;
    map.container.append(layer);
  }

  return layer;
}
