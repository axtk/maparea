import type { MapArea } from "../MapArea/index.ts";
import { addPointerListener } from "../plugins/addPointerListener.ts";
import { type ExportImageOptions, exportImage } from "./exportImage.ts";

const saveImageIcon =
  '<svg viewBox="0 0 10 10" height="16"><path d="M 5 1 L 5 8 M 2 5 L 5 8 L 8 5 M 1 9 L 9 9" stroke="currentColor" fill="none"/></svg>';

export type ExportControlOptions = ExportImageOptions & {
  /** HTML content of the save image button */
  saveImage?: string;
};

/**
 * Returns an export control connected to the given map container.
 */
export function getExportControl(
  map: MapArea,
  options: ExportControlOptions = {},
): HTMLElement {
  let saveImage = document.createElement("button");
  saveImage.dataset.role = "export-image";
  saveImage.innerHTML = options.saveImage ?? saveImageIcon;

  addPointerListener(map, ({ originalEvent: event }) => {
    let target = event.target;
    if (target instanceof Element && saveImage.contains(target))
      exportImage(map, options);
  });

  return saveImage;
}
