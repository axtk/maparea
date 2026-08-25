import type { MapArea } from "../MapArea/index.ts";
import { type GetTileURLOptions, getTileURL } from "./getTileURL.ts";

export type GetTileBlobOptions = GetTileURLOptions & {
  /** Maximum retry count per tile. */
  retries?: number;
  /** Delay before retrying a tile request in milliseconds. */
  retryDelay?: number | ((iteration: number) => number);
};

export async function getTileBlob(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  options: GetTileBlobOptions,
): Promise<Blob | null> {
  let resolvedURL = getTileURL(map, xIndex, yIndex, options);
  let { retries = 0, retryDelay = 0 } = options;

  return await new Promise<Blob | null>((resolve) => {
    let errorCount = 0;
    let f = async (url: string) => {
      let res = await fetch(url);

      try {
        if (res.ok) {
          resolve(await res.blob());
          return;
        }
      } catch {}

      if (errorCount < retries) {
        let resolvedDelay =
          typeof retryDelay === "function"
            ? retryDelay(errorCount)
            : retryDelay;

        setTimeout(() => {
          let u = new URL(url);
          u.searchParams.set("_t", String(Date.now()));
          u.searchParams.set("_r", String(errorCount));
          f(u.href);
        }, resolvedDelay);

        errorCount++;
      } else resolve(null);
    };
    f(resolvedURL);
  });
}
