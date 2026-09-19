import type { MapArea } from "../MapArea/index.ts";
import { expBackoff } from "./expBackoff.ts";
import { type GetTileURLOptions, getTileURL } from "./getTileURL.ts";

export type GetTileBlobOptions = GetTileURLOptions & {
  /**
   * Maximum retry count per tile.
   * @default 5
   */
  retries?: number;
  /**
   * Delay before retrying a tile request in milliseconds.
   * @default expBackoff()
   */
  retryDelay?: number | ((iteration: number) => number);
};

export async function getTileBlob(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  options: GetTileBlobOptions,
): Promise<Blob | null> {
  let resolvedURL = getTileURL(map, xIndex, yIndex, options);
  let { retries = 5, retryDelay = expBackoff() } = options;

  return new Promise<Blob | null>((resolve) => {
    let errorCount = 0;

    let load = async () => {
      let fetchOptions: RequestInit = {};
      if (errorCount !== 0) fetchOptions.cache = "reload";

      try {
        // Loading tile images via fetch allows for retries without modifying the URL,
        // which is crucial for signed URLs
        let res = await fetch(resolvedURL, fetchOptions);

        if (!res.ok) throw new Error("Failed to fetch tile");

        resolve(await res.blob());
      } catch {
        if (errorCount < retries) {
          let resolvedDelay =
            typeof retryDelay === "function"
              ? retryDelay(errorCount)
              : retryDelay;

          setTimeout(load, resolvedDelay);
          errorCount++;
        } else resolve(null);
      }
    };

    load();
  });
}
