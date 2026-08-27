import type { MapArea } from "../MapArea/index.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { setSize } from "../utils/canvas/setSize.ts";
import { setInitialStyle } from "../utils/canvas/setInitialStyle.ts";
import { Circle, type CircleAttributes } from "../utils/canvas/Circle.ts";
import { Path, type PathAttributes } from "../utils/canvas/Path.ts";
import { addPointerListener } from "./addPointerListener.ts";

export type AddPathEditorOptions = {
  layer?: HTMLCanvasElement;
  onUpdate?: (points: GeoCoords[]) => void;
  ignore?: IgnoredElement;
  path?: PathAttributes;
  markers?: CircleAttributes;
  clickRadius?: number;
};

export function addPathEditor(
  map: MapArea,
  options: AddPathEditorOptions = {},
) {
  let points: GeoCoords[] = [];
  let clickTimeout: ReturnType<typeof setTimeout> | null = null;

  let canvas =
    options.layer ?? getCanvasLayer(map, { id: "maparea.path-editor" });
  let ctx = canvas.getContext("2d");

  let renderPath = () => {
    if (!ctx) return;

    setSize(canvas, map.box);
    setInitialStyle(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length === 0) return;

    let path = new Path(points);
    path.setAttributes(options.path);
    path.render(ctx, map);

    for (let p of points) {
      let marker = new Circle(p);
      marker.setAttributes(options.markers);
      marker.render(ctx, map);
    }
  };

  // Renders and reports an update
  let updatePath = () => {
    renderPath();
    options.onUpdate?.(points);
  };

  let clickRadius = options.clickRadius ?? 5;

  addPointerListener(
    map,
    ({ lat, lon, x, y }) => {
      let pointIndex = -1;
      for (let i = 0; i < points.length && pointIndex === -1; i++) {
        let [px, py] = map.toViewportCoords(...points[i]);
        if (Math.hypot(px - x, py - y) <= clickRadius) pointIndex = i;
      }

      if (pointIndex !== -1 && clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;

        points.splice(pointIndex, 1);
        updatePath();

        return;
      }

      let addPoint = () => {
        clickTimeout = null;
        points.push([lat, lon]);
        updatePath();
      };

      // Allow for a double click to remove a previously added marker
      if (pointIndex === -1) addPoint();
      else clickTimeout = setTimeout(addPoint, 250);
    },
    { ignore: options.ignore },
  );

  map.onRender(renderPath, true);
  updatePath();

  return {
    container: canvas,
    clear() {
      points = [];
      updatePath();
    },
  };
}
