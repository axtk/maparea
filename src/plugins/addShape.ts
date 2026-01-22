import type { MapArea } from "../MapArea/index.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import type { ShapeOptions } from "../types/ShapeOptions.ts";
import { getId } from "../utils/getId.ts";
import { renderShape } from "../utils/renderShape.ts";

/**
 * Adds a shape based on the given array of geographic coordinates to
 * the specified map layer.
 */
export function addShape(
  map: MapArea,
  coords: GeoCoords[],
  options?: ShapeOptions,
) {
  let shape = coords.map((point) => ({
    id: getId(),
    coords: point,
  }));

  map.onRender(() => {
    renderShape(map, shape, options);
  });

  let remove = () => {
    shape = [];
    renderShape(map, shape, options);
  };

  return { remove };
}
