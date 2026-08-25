import type { MapArea } from "../MapArea/index.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { initCanvasContext } from "../utils/initCanvasContext.ts";
import { setCanvasSize } from "../utils/setCanvasSize.ts";
import type { Shape } from "../utils/shapes/Shape.ts";

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
  let ctx = initCanvasContext(canvas);

  let renderShapes = () => {
    if (!ctx) return;

    setCanvasSize(canvas, map.box);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let shape of shapes) shape.render(ctx, map);
  };

  map.onRender(renderShapes);

  return {
    container: canvas,
    clear() {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
