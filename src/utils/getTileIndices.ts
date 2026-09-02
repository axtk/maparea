import { defaultTileSize } from "../MapArea/const.ts";
import type { MapArea } from "../MapArea/index.ts";

export type GetTileIndicesOptions = {
  /** Tile size. */
  size?: number;
  /**
   * Margin in pixels, or a tuple of an x- and y-margin, to be tiled
   * outside the viewport.
   */
  margin?: number | [number, number];
};

export type GetTileIndicesResult = {
  /** X index of the center tile. */
  x: number;
  /** Y index of the center tile. */
  y: number;
  /** Number of requested tiles along the X axis. */
  nx: number;
  /** Number of requested tiles along the Y axis. */
  ny: number;
};

/**
 * Returns the indices of the center tile (`x`, `y`) and the numbers of tiles
 * requested along the horizontal and vertical axes (`nx`, `ny`) for the
 * current map state.
 */
export function getTileIndices(
  map: MapArea,
  { margin, size = defaultTileSize }: GetTileIndicesOptions = {},
): GetTileIndicesResult {
  let {
    box: { w, h },
    centerCoords: [cx, cy],
  } = map;

  if (margin === undefined)
    margin = (map.features.has("plugin.drag_pan") ? 2 : 1) * size;

  // Viewport margins
  let dx = Array.isArray(margin) ? margin[0] : margin;
  let dy = Array.isArray(margin) ? margin[1] : margin;

  // Number of tiles in the viewport along the axes
  let nx = Math.ceil((w + 2 * dx) / size);
  let ny = Math.ceil((h + 2 * dy) / size);

  // Center tile indices
  let x = Math.floor(cx / size);
  let y = Math.floor(cy / size);

  return { x, y, nx, ny };
}
