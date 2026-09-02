import { defaultTileSize } from "../MapArea/const.ts";
import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { setInitialStyle } from "../utils/canvas/setInitialStyle.ts";
import { setSize } from "../utils/canvas/setSize.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { getLayer } from "../utils/getLayer.ts";
import {
  type GetTileImageOptions,
  getTileImage,
} from "../utils/getTileImage.ts";
import {
  type GetTileIndicesOptions,
  getTileIndices,
} from "../utils/getTileIndices.ts";
import { resolveDynamic } from "../utils/resolveDynamic.ts";

export type AddTilesOptions = GetTileImageOptions &
  GetTileIndicesOptions & {
    /** Defines whether a specific tile should be rendered. */
    shouldRender?: (map: MapArea, xIndex: number, yIndex: number) => boolean;
    /** Attribution HTML content. */
    attribution?: Dynamic<string>;
    /** Attribution's CSS `inset`. */
    attributionInset?: string;
    /** Custom target map layer. */
    layer?: HTMLCanvasElement;
    /** Custom tile rendering. */
    render?: (
      ctx: CanvasRenderingContext2D,
      xIndex: number,
      yIndex: number,
    ) => void;
    /** Whether to show the grid with the tiles' indices. */
    grid?:
      | boolean
      | string
      | {
          /** Color of grid lines. */
          lines: string;
          /** Color of grid captions. */
          text: string;
        };
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
  let {
    size = defaultTileSize,
    shouldRender,
    attribution,
    attributionInset = "auto 0 0 auto",
    grid,
  } = options;

  let canvas = options.layer ?? getCanvasLayer(map, { id: "maparea.tiles" });
  let attributionLayer = getLayer(map, {
    id: "maparea.attribution",
    inset: attributionInset,
  });

  let ctx = canvas.getContext("2d");
  let loaded = false;

  let renderAttributionContent = () => {
    if (!loaded) return;

    let attributionContent = resolveDynamic(map, attribution) ?? "";

    attributionLayer.toggleAttribute("hidden", !attributionContent);

    if (attributionLayer.innerHTML !== attributionContent)
      attributionLayer.innerHTML = attributionContent;
  };

  let renderGridBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
  ) => {
    if (!grid || !ctx) return;

    ctx.font = "normal 12px/1 sans-serif";

    let metrics = ctx.measureText(label);
    let labelWidth = metrics.width;
    let labelHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    let lineColor = "black";
    let textColor = "black";
    let labelBox = false;

    if (typeof grid === "object") {
      lineColor = grid.lines;
      textColor = grid.text;
      labelBox = true;
    } else if (typeof grid === "string") {
      lineColor = grid;
      textColor = grid;
    }

    ctx.beginPath();

    if (labelBox) {
      ctx.fillStyle = lineColor;
      ctx.rect(x, y, labelWidth + 8, labelHeight + 5);
      ctx.fill();
    }

    ctx.fillStyle = textColor;
    ctx.fillText(label, x + 4, y + labelHeight + 2);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.6;
    ctx.rect(x, y, w, h);
    ctx.stroke();
  };

  let imageCache = new Map<string, HTMLImageElement>();
  let renderedIds = new Set<string>();

  let renderTile =
    options.render ??
    ((ctx: CanvasRenderingContext2D, xi: number, yi: number) => {
      let {
        box: { w, h },
        centerCoords: [cx, cy],
        zoom: z,
      } = map;

      let id = getTileId(map, xi, yi);
      let image = imageCache.get(id);
      let gridLabel = `${xi}, ${yi}, ${z}`;

      let x = 0.5 * w + xi * size - cx;
      let y = 0.5 * h + yi * size - cy;

      if (!image) {
        image = getTileImage(map, xi, yi, {
          ...options,
          onLoad(image) {
            let [cx2, cy2] = map.centerCoords;

            // The map might have been moved away while the tile was loading
            x += cx - cx2;
            y += cy - cy2;

            setInitialStyle(ctx);

            // Catch the broken image exceptions
            try {
              ctx.drawImage(image, x, y, size, size);
            } catch {}

            renderGridBox(x, y, size, size, gridLabel);

            if (!loaded) {
              loaded = true;
              renderAttributionContent();
            }

            options.onLoad?.(image);
          },
        });
        imageCache.set(id, image);
      } else if (image.complete) {
        try {
          ctx.drawImage(image, x, y, size, size);
        } catch {}
        loaded = true;
      }

      renderedIds.add(id);
      renderGridBox(x, y, size, size, gridLabel);
    });

  let renderTiles = () => {
    if (!ctx) return;

    setSize(canvas, map.box);
    setInitialStyle(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let { x: xi0, y: yi0, nx, ny } = getTileIndices(map, options);

    renderedIds.clear();

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * Math.floor(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * Math.floor(nyi / 2);
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (ok) renderTile(ctx, xi, yi);
      }
    }

    if (imageCache.size !== 0) {
      // Remove unused tiles from the cache
      for (let id of imageCache.keys()) {
        if (!renderedIds.has(id)) imageCache.delete(id);
      }
    }

    renderAttributionContent();
  };

  map.onRender(renderTiles);

  return {
    container: canvas,
    clear() {
      setInitialStyle(ctx);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
