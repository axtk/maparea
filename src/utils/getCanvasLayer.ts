import type { MapArea } from "../MapArea/index.ts";
import { setSize } from "./canvas/setSize.ts";

export type CanvasLayerOptions = {
  id: string;
};

/**
 * Returns an existing map canvas layer based on the given properties,
 * or creates one if it doesn't exist yet.
 */
export function getCanvasLayer(
  map: MapArea,
  { id }: CanvasLayerOptions,
): HTMLCanvasElement {
  let { container } = map;
  let canvas = container.querySelector<HTMLCanvasElement>(
    `canvas[data-id="${id}"]`,
  );

  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "layer";
    canvas.dataset.id = id;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";

    let existingCanvas = container.querySelector(`canvas[data-id]`);

    if (existingCanvas) existingCanvas.after(canvas);
    else container.prepend(canvas);

    setSize(canvas, map.box);
  }

  return canvas;
}
