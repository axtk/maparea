import type { BlobOptions } from "./BlobOptions.ts";

export async function getImageBlob(
  canvas: HTMLCanvasElement,
  options?: BlobOptions,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), options?.type, options?.quality);
  });
}
