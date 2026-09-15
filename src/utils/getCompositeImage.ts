import type { MapArea } from "../MapArea/index.ts";
import { setSize } from "./canvas/setSize.ts";

async function getBlob(
  canvas: HTMLCanvasElement,
  type?: string,
  quality?: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function getCompositeImage(
  map: MapArea,
  type?: string,
  quality?: number,
): Promise<Blob | null> {
  let canvas = document.createElement("canvas");
  setSize(canvas, map.box);

  let ctx = canvas.getContext("2d");
  if (ctx === null) return null;

  for (let layer of map.container.querySelectorAll<HTMLCanvasElement>(
    "canvas.layer",
  )) {
    try {
      // Pick only the layers that can be converted to Blob without errors
      await getBlob(layer, type, quality);
      ctx.drawImage(layer, 0, 0);
    } catch (e) {
      console.warn(
        `Error occurred while exporting '${layer.dataset.id}' layer.\n${e}`,
      );
    }
  }

  return getBlob(canvas, type, quality);
}
