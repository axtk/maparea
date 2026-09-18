import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { expBackoff } from "./expBackoff.ts";
import { type GetTileURLOptions, getTileURL } from "./getTileURL.ts";
import { resolveDynamic } from "./resolveDynamic.ts";

export type GetTileImageOptions = GetTileURLOptions & {
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
  /** URL to be used instead of a tile that failed to load. */
  error?: Dynamic<string>;
  /** Called for each tile when it's loaded. */
  onLoad?: (tile: HTMLImageElement) => void;
  /** Called for each tile when it fails to be loaded. */
  onError?: (tile: HTMLImageElement) => void;
};

export function getTileImage(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  options: GetTileImageOptions,
): HTMLImageElement {
  let resolvedURL = getTileURL(map, xIndex, yIndex, options);
  let {
    retries = 5,
    retryDelay = expBackoff(),
    onLoad,
    onError,
    error,
  } = options;

  let image = new Image();
  let errorCount = 0;

  let loadImage = () => {
    let fetchOptions: RequestInit = {};
    if (errorCount !== 0) fetchOptions.cache = "reload";

    // Loading tile images via fetch allows for retries without modifying the URL,
    // which is crucial for signed URLs
    fetch(resolvedURL, fetchOptions)
      .then((res) => res.blob())
      .then((blob) => {
        let url = URL.createObjectURL(blob);
        image.addEventListener("load", () => {
          onLoad?.(image);
          URL.revokeObjectURL(url);
        });
        image.addEventListener("error", () => {
          onError?.(image);
        });
        image.src = url;
      })
      .catch(() => {
        if (errorCount < retries) {
          let resolvedDelay =
            typeof retryDelay === "function"
              ? retryDelay(errorCount)
              : retryDelay;

          setTimeout(loadImage, resolvedDelay);
          errorCount++;
        } else {
          let errorSrc = resolveDynamic(map, error);
          if (errorSrc) {
            image.dataset.src = image.src;
            image.src = errorSrc;
          }
          onError?.(image);
        }
      });
  };

  loadImage();

  return image;
}
