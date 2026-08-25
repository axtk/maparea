import { defaultTileSize } from "../MapArea/const.ts";
import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { getLayer } from "../utils/getLayer.ts";
import {
  type GetTileImageOptions,
  getTileImage,
} from "../utils/getTileImage.ts";
import { initCanvasContext } from "../utils/initCanvasContext.ts";
import { resolveDynamic } from "../utils/resolveDynamic.ts";
import { setCanvasSize } from "../utils/setCanvasSize.ts";

const { floor, ceil } = Math;

export type AddTilesOptions = GetTileImageOptions & {
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
  layer?: HTMLCanvasElement;
};

function getTileId(map: MapArea, xIndex: number, yIndex: number) {
  return `${xIndex},${yIndex},${map.zoom},${map.lang}`;
}

/**
 * Adds image tiles to the given map container based on `options.url`,
 * which is a string URL with placeholders or a function of
 * `(map, xIndex, yIndex) => string`.
 */
export function addTiles(map: MapArea, options: AddTilesOptions = {}) {
  let { attribution, attributionInset = "auto 0 0 auto" } = options;

  let canvas = options.layer ?? getCanvasLayer(map, { id: "maparea.tiles" });
  let attributionLayer = getLayer(map, {
    id: "maparea.attribution",
    inset: attributionInset,
  });

  let ctx = initCanvasContext(canvas);
  let tileCache = new Map<string, HTMLImageElement>();

  let renderTiles = () => {
    if (!ctx) return;

    setCanvasSize(canvas, map.box);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let { w, h } = map.box;
    let [cx, cy] = map.centerCoords;

    let resolvedSize = resolveDynamic(map, options.size) ?? defaultTileSize;
    let { margin, shouldRender } = options;

    if (margin === undefined)
      margin = (map.features.has("plugin.drag_pan") ? 2 : 1) * resolvedSize;

    // Viewport margins
    let dx = Array.isArray(margin) ? margin[0] : margin;
    let dy = Array.isArray(margin) ? margin[1] : margin;

    // Number of tiles in the viewport along the axes
    let nx = ceil((w + 2 * dx) / resolvedSize);
    let ny = ceil((h + 2 * dy) / resolvedSize);

    // Center tile indices
    let xi0 = floor(cx / resolvedSize);
    let yi0 = floor(cy / resolvedSize);

    let renderedIds = new Set<string>();

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * floor(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * floor(nyi / 2);
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (!ok) continue;

        let id = getTileId(map, xi, yi);
        let tile = tileCache.get(id);

        let x = 0.5 * w + xi * resolvedSize - cx;
        let y = 0.5 * h + yi * resolvedSize - cy;

        if (!tile) {
          tile = getTileImage(map, xi, yi, {
            ...options,
            onLoad(image) {
              let [cx2, cy2] = map.centerCoords;

              // The map might have been moved away while the tile was loading
              x += cx - cx2;
              y += cy - cy2;

              // Catch the broken image exceptions
              try {
                ctx.drawImage(image, x, y, resolvedSize, resolvedSize);
              } catch {}

              options.onLoad?.(image);
            },
          });
          tileCache.set(id, tile);
        } else if (tile.complete) {
          try {
            ctx.drawImage(tile, x, y, resolvedSize, resolvedSize);
          } catch {}
        }
        renderedIds.add(id);
      }
    }

    // Remove unused tiles from the cache
    for (let id of tileCache.keys()) {
      if (!renderedIds.has(id)) tileCache.delete(id);
    }

    let attributionContent = resolveDynamic(map, attribution) ?? "";

    attributionLayer.toggleAttribute("hidden", !attributionContent);

    if (attributionLayer.innerHTML !== attributionContent)
      attributionLayer.innerHTML = attributionContent;
  };

  map.onRender(renderTiles);

  return {
    container: canvas,
    clear() {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
