import type { MapArea } from "../MapArea/index.ts";

export type LayerOptions = {
  id: string;
  /** CSS `inset` */
  inset?: string;
};

/**
 * Returns an existing map layer based on the given properties,
 * or creates one if it doesn't exist yet.
 */
export function getLayer(
  map: MapArea,
  { id, inset = "0" }: LayerOptions,
): HTMLElement {
  let layer = map.container.querySelector<HTMLElement>(
    `.layer[data-id="${id}"]`,
  );

  if (!layer) {
    layer = document.createElement("div");
    layer.className = "layer";
    layer.dataset.id = id;
    layer.style.position = "absolute";
    layer.style.inset = inset;
    map.container.append(layer);
  }

  return layer;
}
