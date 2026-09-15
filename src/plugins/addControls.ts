import type { MapArea } from "../MapArea/index.ts";
import { getLayer } from "../utils/getLayer.ts";
import {
  getZoomControl,
  type ZoomControlOptions,
} from "../utils/getZoomControl.ts";

export type ControlType = "zoom";

export type AddControlsOptions = {
  /** CSS `inset` */
  inset?: string;
  zoom?: ZoomControlOptions;
};

/**
 * Adds a customizable control pane to the given map container with the
 * control types listed in the second parameter.
 */
export function addControls(
  map: MapArea,
  types: ControlType[],
  options: AddControlsOptions = {},
) {
  let typeSet = new Set(types);
  let layer = getLayer(map, {
    id: "maparea.controls",
    inset: options.inset ?? "0 0 auto auto",
  });

  if (typeSet.has("zoom")) layer.append(getZoomControl(map, options.zoom));

  return layer;
}
