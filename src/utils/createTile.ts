import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { resolveDynamic } from "./resolveDynamic.ts";

const { floor, random } = Math;

function handleTileLoaded(event: Event) {
  let tile = event.target;

  if (tile instanceof HTMLImageElement) tile.style.opacity = "";
}

export type CreateTileOptions = {
  /**
   * Tile URL, either a string with placeholders (`{x}` and `{y}` for the
   * tile indices, `{z}` for the zoom level, `{lang}` for the map language)
   * or a function of `(map, x, y) => string` returning a fixed string URL.
   */
  url?: string | ((map: MapArea, xIndex: number, yIndex: number) => string);
  /** Maximum retry count per tile. */
  retries?: number;
  /** Delay before retrying a tile request in milliseconds. */
  retryDelay?: number | ((iteration: number) => number);
  /** Values of the `{s}` placeholder of the tile URLs. */
  subdomains?: string[];
  /** URL to be used instead of a tile that failed to load. */
  error?: Dynamic<string>;
  /**
   * Whether to load the tiles lazily.
   * @default true
   */
  lazy?: boolean;
  /** Called for each tile when it's loaded. */
  onLoad?: (tile: HTMLImageElement) => void;
  /** Called for each tile when it fails to be loaded. */
  onError?: (tile: HTMLImageElement) => void;
  /** Whether to add container elements for tiles. */
  containers?: boolean;
  /** Whether to show labels with the tiles' indices. */
  labels?: boolean;
};

export function createTile(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  {
    url,
    subdomains,
    retries = 0,
    retryDelay,
    error,
    lazy = true,
    onLoad,
    onError,
    containers,
    labels,
  }: CreateTileOptions,
): HTMLElement {
  let tile = new Image();
  let errorCount = 0;

  let getURL = (x: number, y: number) => {
    if (!url) return "";

    if (typeof url === "function") return url(map, xIndex, yIndex);

    let resolvedURL = url
      .replaceAll("{x}", String(x))
      .replaceAll("{y}", String(y))
      .replaceAll("{z}", String(map.zoom))
      .replaceAll("{lang}", map.lang);

    if (subdomains && resolvedURL.includes("{s}"))
      resolvedURL = resolvedURL.replaceAll(
        "{s}",
        subdomains[floor(subdomains.length * random())],
      );

    return resolvedURL;
  };

  let handleLoad = onLoad
    ? (event: Event) => {
        handleTileLoaded(event);
        onLoad(tile);
      }
    : handleTileLoaded;

  let handleError = () => {
    if (errorCount < retries) {
      let delay =
        typeof retryDelay === "function"
          ? retryDelay(errorCount)
          : (retryDelay ?? 0);

      setTimeout(() => {
        let srcURL = new URL(tile.src);

        srcURL.searchParams.set("_t", String(Date.now()));
        srcURL.searchParams.set("_r", String(errorCount));
        tile.src = srcURL.href;
      }, delay);

      errorCount++;
      return;
    }

    let errorSrc = resolveDynamic(map, error);

    if (errorSrc) {
      tile.dataset.src = tile.src;
      tile.src = errorSrc;
    }

    if (onError) onError(tile);

    tile.removeEventListener("error", handleError);
  };

  if (lazy) tile.loading = "lazy";

  tile.src = getURL(xIndex, yIndex);
  tile.style.position = "absolute";

  tile.addEventListener("load", handleLoad);
  tile.addEventListener("error", handleError);

  if (!tile.complete) tile.style.opacity = "0";

  if (containers || labels) {
    let container = document.createElement("span");
    container.style.position = "absolute";
    container.append(tile);

    if (labels) {
      let label = document.createElement("i");
      label.style.position = "absolute";
      label.textContent = `${xIndex}, ${yIndex}`;
      container.append(label);
    }

    return container;
  }

  return tile;
}
