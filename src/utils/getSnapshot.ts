import type { MapArea } from "../MapArea/index.ts";
import type { BlobOptions } from "./canvas/BlobOptions.ts";
import { getImageBlob } from "./canvas/getImageBlob.ts";
import { setSize } from "./canvas/setSize.ts";
import { toCanvas } from "./canvas/toCanvas.ts";
import { getLayer } from "./getLayer.ts";

function toSet(x: string[] | undefined, fallback?: string[]) {
  if (x === undefined) return fallback === undefined ? null : new Set(fallback);
  return new Set(x);
}

const defaultExcludes = ["maparea.controls"];

export type GetSnapshotOptions = BlobOptions & {
  /** List of map layer IDs (`data-id` values) to be included into the image. */
  include?: string[];
  /** List of map layer IDs (`data-id` values) to be excluded from the image. */
  exclude?: string[];
};

export async function getSnapshot(
  map: MapArea,
  options: GetSnapshotOptions = {},
): Promise<Blob | null> {
  let canvas = document.createElement("canvas");
  setSize(canvas, map.box);

  let ctx = canvas.getContext("2d");
  if (ctx === null) return null;

  let layers = map.container.querySelectorAll<HTMLElement>(".layer");
  let includes = toSet(options.include);
  let excludes = toSet(options.exclude, defaultExcludes);

  for (let layer of layers) {
    let id = layer.dataset.id ?? "";

    if (includes !== null && !includes.has(id)) continue;
    if (excludes?.has(id)) continue;

    let c: HTMLCanvasElement;

    if (layer instanceof HTMLCanvasElement) c = layer;
    else {
      // Wrap the HTML layer into a container to preserve its positioning
      let tmp = getLayer(map, {
        id: `tmp-${Math.random().toString(36).slice(2)}`,
      });
      layer.before(tmp);
      tmp.append(layer);

      c = await toCanvas(tmp);

      // Unwrap the layer
      tmp.before(layer);
      tmp.remove();
    }

    // Pick only the layers that can be converted to Blob without errors
    try {
      await getImageBlob(c, options);
      ctx.drawImage(c, 0, 0);
    } catch (e) {
      console.warn(
        `Error occurred while exporting '${layer.dataset.id}' layer.\n${e}`,
      );
    }
  }

  return getImageBlob(canvas, options);
}
