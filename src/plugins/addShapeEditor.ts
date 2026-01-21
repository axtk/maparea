import type { MapArea } from "../MapArea/index.ts";
import type { GeoVertex } from "../types/GeoVertex.ts";
import type { IgnoredElement } from "../types/IgnoredElement.ts";
import type { ShapeLayerOptions } from "../types/ShapeLayerOptions.ts";
import { getId } from "../utils/getId.ts";
import { renderShapeLayer } from "../utils/renderShapeLayer.ts";
import { addPointerListener } from "./addPointerListener.ts";

export type ShapeEditorOptions = {
  /** Adds a shape update callback. */
  onUpdate?: (shape: GeoVertex[]) => void;
  /** Map elements to be ignored in the shape editor when clicked. */
  ignore?: IgnoredElement;
};

/**
 * Adds a shape editor to the given map container.
 */
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

  addPointerListener(
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
    { ignore: options?.ignore },
  );

  map.onRender(update);
}
