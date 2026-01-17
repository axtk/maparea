import type { MapArea } from "../MapArea/index.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import type { LayerOptions } from "../types/LayerOptions.ts";
import { getId } from "../utils/getId.ts";
import { renderShapeLayer } from "../utils/renderShapeLayer.ts";

export function addShape(
  map: MapArea,
  coords: GeoCoords[],
  layerOptions?: LayerOptions,
) {
  let defaultLayerOptions: LayerOptions = {
    id: `shape-${getId()}`,
    className: "shape",
  };

  let shape = coords.map((point) => ({
    id: getId(),
    coords: point,
  }));

  map.onRender(() => {
    renderShapeLayer(map, shape, { ...defaultLayerOptions, ...layerOptions });
  });
}
