import type { MapArea } from "../MapArea/index.ts";
import { setInitialStyle } from "./canvas/setInitialStyle.ts";
import { setSize } from "./canvas/setSize.ts";

export async function getCompositeImage(
  map: MapArea,
  type?: string,
  quality?: number,
): Promise<Blob | null> {
  let canvas = document.createElement("canvas");
  setSize(canvas, map.box);

  let ctx = canvas.getContext("2d");
  if (ctx === null) return null;

  setInitialStyle(ctx);

  for (let layer of map.container.querySelectorAll<HTMLCanvasElement>("canvas.layer"))
    ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
