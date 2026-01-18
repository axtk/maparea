import type { MapArea } from "../MapArea/index.ts";
import type { GeoVertex } from "../types/GeoVertex.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
import type { ShapeLayerOptions } from "../types/ShapeLayerOptions.ts";
import { getId } from "../utils/getId.ts";
import { renderShapeLayer } from "../utils/renderShapeLayer.ts";
import { addClickListener } from "./addClickListener.ts";

export type ShapeEditorOptions = {
  onUpdate?: (shape: GeoVertex[]) => void;
  ignoreClicks?: IgnoredElement;
};

export function addShapeEditor(map: MapArea, options?: ShapeEditorOptions) {
  let shape: GeoVertex[] = [];
  let clickTimeout: ReturnType<typeof setTimeout> | null = null;

  let layerOptions: ShapeLayerOptions = {
    className: "shape-editor",
    markers: true,
  };

  let update = () => {
    renderShapeLayer(map, shape, layerOptions);
    options?.onUpdate?.(shape);
  };

  addClickListener(
    map,
    ({ lat, lon, originalEvent }) => {
      let marker = (
        originalEvent.target as HTMLElement | null
      )?.closest<SVGElement>(".marker");

      let markerId = marker?.dataset.id;

      if (markerId && clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;

        shape = shape.filter(({ id }) => id !== markerId);
        update();

        return;
      }

      let addPoint = () => {
        shape.push({
          id: getId(),
          coords: [lat, lon],
        });
        update();
        clickTimeout = null;
      };

      // Allow for a double click to remove a previously added marker
      if (markerId) clickTimeout = setTimeout(addPoint, 250);
      else addPoint();
    },
    options?.ignoreClicks,
  );

  map.onRender(update);
}
