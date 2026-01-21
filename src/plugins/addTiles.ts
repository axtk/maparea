import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import type { LayerOptions } from "../types/LayerOptions.ts";
import { getId } from "../utils/getId.ts";
import { getLayer } from "../utils/getLayer.ts";
import { resolveDynamic } from "../utils/resolveDynamic.ts";
import { toPrecision } from "../utils/toPrecision.ts";

const { floor, ceil, random } = Math;

const defaultTileSize = 256;

export type MapAreaTileOptions = LayerOptions & {
  /**
   * Tile URL, either a string with placeholders (`{x}` and `{y}` for the
   * tile indices, `{z}` for the zoom level, `{lang}` for the map language)
   * or a function of `(map, x, y) => string` returning a fixed string URL.
   */
  url?: string | ((map: MapArea, xIndex: number, yIndex: number) => string);
  /** Maximum retry count per tile. */
  retries?: number;
  /** Values of the `{s}` placeholder of the tile URLs. */
  subdomains?: string[];
  /** URL to be used instead of a tile that failed to load. */
  error?: Dynamic<string>;
  /** Tile size. */
  size?: Dynamic<number>;
  /**
   * Margin in pixels, or a tuple of an x- and y-margin, to be tiled
   * outside the viewport.
   */
  margin?: number | [number, number];
  /** Attribution HTML content. */
  attribution?: Dynamic<string>;
  /** Attribution's CSS `inset`. */
  attributionInset?: string;
};

function getTileId(map: MapArea, xIndex: number, yIndex: number) {
  return `${xIndex},${yIndex},${map.zoom},${map.lang}`;
}

function createTile(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  { size, url, subdomains, retries = 0, error }: MapAreaTileOptions,
): HTMLElement {
  let tile = new Image();
  let resolvedSize = resolveDynamic(map, size) ?? defaultTileSize;
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

  let handleError = (event: ErrorEvent) => {
    let failedTile = event.target;

    if (failedTile instanceof HTMLImageElement) {
      if (errorCount++ < retries) {
        let srcURL = new URL(failedTile.src);

        srcURL.searchParams.set("_t", String(Date.now()));
        failedTile.src = srcURL.href;

        return;
      }

      let errorSrc = resolveDynamic(map, error);

      if (errorSrc) {
        failedTile.dataset.src = failedTile.src;
        failedTile.src = errorSrc;
      }

      tile.removeEventListener("error", handleError);
    }
  };

  tile.width = resolvedSize;
  tile.height = resolvedSize;
  tile.src = getURL(xIndex, yIndex);
  tile.dataset.id = getTileId(map, xIndex, yIndex);
  tile.style = "position: absolute;";
  tile.addEventListener("error", handleError);

  return tile;
}

function getTiles(layer: HTMLElement) {
  return layer.querySelectorAll<HTMLElement>("img[data-id]");
}

function getTile(layer: HTMLElement, id: string) {
  return layer.querySelector<HTMLElement>(`img[data-id="${id}"]`);
}

/**
 * Adds image tiles to the given map container based on `options.url`,
 * which is a string URL with placeholders or a function of
 * `(map, xIndex, yIndex) => string`.
 */
export function addTiles(map: MapArea, options: MapAreaTileOptions = {}) {
  let {
    id = getId(),
    attribution,
    attributionInset = "auto 0 0 auto",
  } = options;

  let layer = getLayer(map, { id, className: "tiles", ...options });
  let attributionLayer = getLayer(map, {
    id,
    className: "tiles-attribution",
    inset: attributionInset,
  });

  let renderTiles = () => {
    let {
      box: { w, h },
      centerCoords: [cx, cy],
    } = map;

    let { size, margin = 0 } = options;
    let resolvedSize = resolveDynamic(map, size) ?? defaultTileSize;

    // Viewport margins
    let dx = Array.isArray(margin) ? margin[0] : margin;
    let dy = Array.isArray(margin) ? margin[1] : margin;

    // Number of tiles in the viewport along the axes
    let nx = ceil((w + 2 * dx) / resolvedSize);
    let ny = ceil((h + 2 * dy) / resolvedSize);

    // Center tile indices
    let xi0 = floor(cx / resolvedSize);
    let yi0 = floor(cy / resolvedSize);

    let tile: HTMLElement | null = null;
    let nextIds = new Set<string>();
    let id = "";

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * floor(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * floor(nyi / 2);

        id = getTileId(map, xi, yi);
        tile = getTile(layer, id);

        if (!tile) {
          tile = createTile(map, xi, yi, options);
          layer.append(tile);
        }

        let x = toPrecision(0.5 * w + xi * resolvedSize - cx, 2);
        let y = toPrecision(0.5 * h + yi * resolvedSize - cy, 2);

        tile.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        nextIds.add(id);
      }
    }

    // Clean up unused previously added tiles
    for (let tile of getTiles(layer)) {
      let { id } = tile.dataset;

      if (id && !nextIds.has(id)) tile.remove();
    }

    let attributionContent = resolveDynamic(map, attribution) ?? "";

    attributionLayer.toggleAttribute("hidden", !attributionContent);

    if (attributionLayer.innerHTML !== attributionContent)
      attributionLayer.innerHTML = attributionContent;
  };

  let prevZoom = map.zoom;
  let renderTimeout: ReturnType<typeof setTimeout> | null = null;

  map.onRender(() => {
    if (renderTimeout !== null) {
      clearTimeout(renderTimeout);
      renderTimeout = null;
    }

    if (map.zoom === prevZoom) {
      if (layer.style.opacity) layer.style.opacity = "";
      renderTiles();
    } else {
      layer.style.opacity = "0";
      // Wait for all quick zoom changes to get through before
      // requesting new tiles
      renderTimeout = setTimeout(() => {
        renderTimeout = null;
        if (layer.style.opacity) layer.style.opacity = "";
        renderTiles();
      }, 300);
    }

    prevZoom = map.zoom;
  });

  return layer;
}
