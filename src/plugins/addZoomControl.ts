import type { MapArea } from "../MapArea/index.ts";
import { getLayer } from "../utils/getLayer.ts";
import {
  getZoomControl,
  type ZoomControlOptions,
} from "../utils/getZoomControl.ts";

export type AddZoomControlOptions = ZoomControlOptions & {
  /** CSS `inset` */
  inset?: string;
};

/**
 * Adds a customizable zoom control to the given map container.
 */
export function addZoomControl(
  map: MapArea,
  options: AddZoomControlOptions = {},
) {
  let layer = getLayer(map, {
    className: "controls",
    inset: options.inset ?? "0 0 auto auto",
  });

  layer.append(getZoomControl(map, options));

  return layer;
}
