import type { MapArea } from "../MapArea/index.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { setSize } from "../utils/canvas/setSize.ts";
import { setInitialStyle } from "../utils/canvas/setInitialStyle.ts";
import type { Shape } from "../utils/canvas/Shape.ts";

export type AddShapesOptions = {
  /** Target map layer. */
  layer?: HTMLCanvasElement;
};

/**
 * Adds a shape based on the given array of geographic coordinates to
 * the specified map layer.
 */
export function addShapes(
  map: MapArea,
  shapes: Shape[],
  options: AddShapesOptions = {},
) {
  let canvas = options.layer ?? getCanvasLayer(map, { id: "maparea.shapes" });
  let ctx = canvas.getContext("2d");

  let renderShapes = () => {
    if (!ctx) return;

    setSize(canvas, map.box);
    setInitialStyle(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let shape of shapes) shape.render(ctx, map);
  };

  map.onRender(renderShapes);

  return {
    container: canvas,
    clear() {
      setInitialStyle(ctx);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
