import { defaultTileSize } from "../MapArea/const.ts";
import type { MapArea } from "../MapArea/index.ts";
import type { Dynamic } from "../types/Dynamic.ts";
import { setInitialStyle } from "../utils/canvas/setInitialStyle.ts";
import { setSize } from "../utils/canvas/setSize.ts";
import { getCanvasLayer } from "../utils/getCanvasLayer.ts";
import { getLayer } from "../utils/getLayer.ts";
import { type GetTileBlobOptions, getTileBlob } from "../utils/getTileBlob.ts";
import {
  type GetTileIndicesOptions,
  getTileIndices,
} from "../utils/getTileIndices.ts";
import { resolveDynamic } from "../utils/resolveDynamic.ts";
import { SignatureFactory } from "../utils/SignatureFactory.ts";

export type AddTilesOptions = GetTileBlobOptions &
  GetTileIndicesOptions & {
    /** Defines whether a specific tile should be rendered. */
    shouldRender?: (map: MapArea, xIndex: number, yIndex: number) => boolean;
    /** Attribution HTML content. */
    attribution?: Dynamic<string>;
    /** Attribution's CSS `inset`. */
    attributionInset?: string;
    /** Custom target map layer. */
    layer?: HTMLCanvasElement;
    /** URL to be used instead of a tile that failed to load. */
    error?: Dynamic<string>;
    /** Custom tile rendering. */
    render?: (
      ctx: CanvasRenderingContext2D,
      xIndex: number,
      yIndex: number,
    ) => void;
    /** What should be done before each render. */
    prerender?: (map: MapArea, options?: AddTilesOptions) => Promise<void>;
    onReady?: () => void;
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
    prerender,
    render,
    error,
    signature,
    attribution,
    attributionInset = "auto 0 0 auto",
    onReady,
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

  let renderGridBox = (xi: number, yi: number) => {
    if (!grid || !ctx) return;

    let [x, y] = getTileCoords(xi, yi);
    let label = `${xi}, ${yi}, ${map.zoom}`;

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
    ctx.rect(x, y, size, size);
    ctx.stroke();
  };

  let getTileCoords = (xi: number, yi: number) => {
    let {
      box: { w, h },
      centerCoords: [cx, cy],
    } = map;

    return [
      Math.floor(0.5 * w - cx) + xi * size,
      Math.floor(0.5 * h - cy) + yi * size,
    ];
  };

  /** Maps tile IDs to images. */
  let imageCache = new Map<string, HTMLImageElement>();

  let renderTiles = () => {
    if (!ctx) return;

    setSize(canvas, map.box);
    setInitialStyle(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let { x: xi0, y: yi0, nx, ny } = getTileIndices(map, options);
    let errorSrc = resolveDynamic(map, error);

    let totalCount = nx * ny;
    let loadedCount = 0;

    let renderedIds = new Set<string>();
    let prerenderPromise: Promise<void>;

    if (prerender) prerenderPromise = prerender(map, options);
    else if (signature instanceof SignatureFactory)
      prerenderPromise = signature.prerender(map, options);
    else prerenderPromise = Promise.resolve();

    let renderFailedTile = (xi: number, yi: number) => {
      if (!errorSrc) return;

      let image = new Image();
      image.onload = () => {
        let [x, y] = getTileCoords(xi, yi);
        try {
          ctx.drawImage(image, x, y, size, size);
        } catch {}
      };
      image.src = errorSrc;
    };

    let renderLoadedTile = (
      image: HTMLImageElement,
      xi: number,
      yi: number,
    ) => {
      let [x, y] = getTileCoords(xi, yi);

      try {
        ctx.drawImage(image, x, y, size, size);
      } catch {}

      if (!loaded) {
        loaded = true;
        renderAttributionContent();
      }

      if (++loadedCount === totalCount) onReady?.();
    };

    let renderTile = async (xi: number, yi: number) => {
      if (render) {
        render(ctx, xi, yi);
        return;
      }

      let id = getTileId(map, xi, yi);
      let cachedImage = imageCache.get(id);

      renderGridBox(xi, yi);
      // The tile ID should be stored before async fetches
      renderedIds.add(id);

      if (!cachedImage) {
        let image = new Image();
        imageCache.set(id, image);

        await prerenderPromise;

        let blob = await getTileBlob(map, xi, yi, options);

        if (blob) {
          image.onload = () => {
            setInitialStyle(ctx);
            renderLoadedTile(image, xi, yi);
            renderGridBox(xi, yi);
          };
          image.onerror = () => {
            setInitialStyle(ctx);
            renderFailedTile(xi, yi);
            renderGridBox(xi, yi);
          };
          image.src = URL.createObjectURL(blob);
        }
      } else if (cachedImage.complete) {
        renderLoadedTile(cachedImage, xi, yi);
        renderGridBox(xi, yi);
      }
    };

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * Math.floor(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * Math.floor(nyi / 2);
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (ok) renderTile(xi, yi);
      }
    }

    // Remove unused tiles from the cache
    for (let [id, image] of imageCache.entries()) {
      if (!renderedIds.has(id)) {
        let blobURL = image.src;
        if (blobURL) URL.revokeObjectURL(blobURL);
        imageCache.delete(id);
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
