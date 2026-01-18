import type { MapArea } from "../MapArea/index.ts";
import type { DynamicString } from "../types/DynamicString.ts";
import type { LayerOptions } from "../types/LayerOptions.ts";
import { getId } from "../utils/getId.ts";
import { getLayer } from "../utils/getLayer.ts";
import { resolveString } from "../utils/resolveString.ts";
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
  /** Values of the `{s}` placeholder of the tile URLs. */
  subdomains?: string[];
  /** Maximum retry count per tile. */
  retries?: number;
  /** URL to be used instead of a tile that failed to load. */
  error?: DynamicString;
  /** Tile size. */
  size?: number;
  /**
   * Margin in pixels, or a tuple of an x- and y-margin, to be tiled
   * outside the viewport.
   */
  margin?: number | [number, number];
  /** Attribution HTML content. */
  attribution?: DynamicString;
  /** Attribution's CSS [`inset`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/inset). */
  attributionInset?: string;
};

function getTileId(map: MapArea, xIndex: number, yIndex: number) {
  return `${xIndex},${yIndex},${map.zoom},${map.lang}`;
}

function createTile(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  {
    size = defaultTileSize,
    url,
    subdomains,
    retries = 0,
    error,
  }: MapAreaTileOptions,
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

    if (subdomains)
      resolvedURL = resolvedURL.replaceAll(
        "{s}",
        subdomains[floor(subdomains.length * random())],
      );

    return resolvedURL;
  };

  tile.width = size;
  tile.height = size;
  tile.src = getURL(xIndex, yIndex);
  tile.dataset.id = getTileId(map, xIndex, yIndex);
  tile.style = "position: absolute;";

  tile.onerror = () => {
    errorCount++;

    let { src } = tile;

    if (!src || errorCount > retries) {
      let errorSrc = resolveString(map, error);

      if (errorSrc) {
        tile.onerror = () => {};
        tile.src = errorSrc;
      }

      return;
    }

    let x = xIndex * size;
    let y = yIndex * size;

    // Check whether the tile is from the repeated part of the map
    let xNorm = map.toPixelCoords(...map.toGeoCoords(x, y))[0];
    let xIndexNorm = floor(xNorm / size);

    if (xIndex !== xIndexNorm) tile.src = getURL(xIndexNorm, yIndex);
    else {
      let tileURL = new URL(src);

      tileURL.searchParams.set("_t", String(Date.now()));
      tile.src = tileURL.href;
    }
  };

  return tile;
}

function setAttributionElement(
  map: MapArea,
  layer: HTMLElement,
  { attribution, attributionInset = "auto 0 0 auto" }: MapAreaTileOptions,
): HTMLElement | null {
  let element = layer.querySelector<HTMLElement>(".attribution");
  let content = resolveString(map, attribution);

  if (!content) {
    if (element) element.remove();

    return null;
  }

  if (!element) {
    element = document.createElement("div");
    element.className = "attribution";
    element.style = `position: absolute; inset: ${attributionInset};`;
    layer.append(element);
  }

  if (element.innerHTML !== content) element.innerHTML = content;

  return element;
}

function getTiles(layer: HTMLElement) {
  return layer.querySelectorAll<HTMLElement>("img[data-id]");
}

function getTile(layer: HTMLElement, id: string) {
  return layer.querySelector<HTMLElement>(`img[data-id="${id}"]`);
}

export function addTiles(map: MapArea, options: MapAreaTileOptions = {}) {
  let { id = `tiles-${getId()}`, className = "tiles" } = options;

  let layerOptions: LayerOptions = { id, className };
  let layer = getLayer(map, layerOptions);

  let renderTiles = () => {
    let attribution = setAttributionElement(map, layer, options);

    let {
      box: { w, h },
      centerCoords: [cx, cy],
    } = map;

    let { size = defaultTileSize, margin = 0 } = options;

    // Viewport margins
    let dx = Array.isArray(margin) ? margin[0] : margin;
    let dy = Array.isArray(margin) ? margin[1] : margin;

    // Number of tiles along the axes
    let nx = ceil((w + 2 * dx) / size);
    let ny = ceil((h + 2 * dy) / size);

    // Center tile indices
    let xi0 = floor(cx / size);
    let yi0 = floor(cy / size);

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
          layer.insertBefore(tile, attribution);
        }

        let x = toPrecision(0.5 * w + xi * size - cx, 2);
        let y = toPrecision(0.5 * h + yi * size - cy, 2);

        tile.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        nextIds.add(id);
      }
    }

    // Clean up unused previously added tiles
    for (let tile of getTiles(layer)) {
      let { id } = tile.dataset;

      if (id && !nextIds.has(id)) tile.remove();
    }
  };

  let prevZoom = map.zoom;
  let renderTimeout: ReturnType<typeof setTimeout> | null = null;

  map.onRender(() => {
    if (renderTimeout !== null) {
      clearTimeout(renderTimeout);
      renderTimeout = null;
    }

    if (map.zoom === prevZoom) renderTiles();
    else {
      layer.style.opacity = "0";
      // Wait for all quick zoom changes to get through before
      // requesting new tiles
      renderTimeout = setTimeout(() => {
        renderTimeout = null;
        layer.style.opacity = "";
        renderTiles();
      }, 300);
    }

    prevZoom = map.zoom;
  });

  return layer;
}
