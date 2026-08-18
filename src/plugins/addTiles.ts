import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { createTile, CreateTileOptions } from "../utils/createTile.ts";
import { getLayer } from "../utils/getLayer.ts";
import { resolveDynamic } from "../utils/resolveDynamic.ts";
import { toPrecision } from "../utils/toPrecision.ts";

const { floor, ceil } = Math;

const defaultTileSize = 256;

export type AddTilesOptions = (CreateTileOptions | {
  /** Custom tile creation mechanism. */
  create?: (map: MapArea, xIndex: number, yIndex: number) => HTMLElement | null;
}) & {
  /** Defines whether a specific tile should be rendered. */
  shouldRender?: (map: MapArea, xIndex: number, yIndex: number) => boolean;
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
  /** Target map layer. */
  layer?: HTMLElement;
};

function getTileId(map: MapArea, xIndex: number, yIndex: number) {
  return `${xIndex},${yIndex},${map.zoom},${map.lang}`;
}

function getTiles(layer: HTMLElement) {
  return layer.querySelectorAll<HTMLElement>("[data-id]");
}

function getTile(layer: HTMLElement, id: string) {
  return layer.querySelector<HTMLElement>(`[data-id="${id}"]`);
}

function setTileSize(tile: HTMLElement, resolvedSize: number) {
  if (tile instanceof HTMLImageElement) {
    tile.width = resolvedSize;
    tile.height = resolvedSize;
  } else {
    tile.style.width = `${resolvedSize}px`;
    tile.style.height = `${resolvedSize}px`;
  }
  return tile;
}

/**
 * Adds image tiles to the given map container based on `options.url`,
 * which is a string URL with placeholders or a function of
 * `(map, xIndex, yIndex) => string`.
 */
export function addTiles(map: MapArea, options: AddTilesOptions = {}) {
  let { attribution, attributionInset = "auto 0 0 auto" } = options;

  let layer = options.layer ?? getLayer(map, { className: "tiles" });
  let attributionLayer = getLayer(map, {
    id: layer.dataset.id,
    className: "tiles-attribution",
    inset: attributionInset,
  });

  let renderTiles = () => {
    let {
      box: { w, h },
      centerCoords: [cx, cy],
    } = map;

    let { size, margin = 0, shouldRender } = options;
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
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (!ok) continue;

        id = getTileId(map, xi, yi);
        tile = getTile(layer, id);

        if (!tile) {
          tile = "create" in options && options.create !== undefined
            ? options.create(map, xi, yi)
            : createTile(map, xi, yi, options as CreateTileOptions);

          if (tile) {
            tile.dataset.id = id;
            layer.append(setTileSize(tile, resolvedSize));
          }
        }

        if (tile) {
          let x = toPrecision(0.5 * w + xi * resolvedSize - cx, 2);
          let y = toPrecision(0.5 * h + yi * resolvedSize - cy, 2);

          tile.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          nextIds.add(id);
        }
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
