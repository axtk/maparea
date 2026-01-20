import type { MapArea } from "../MapArea/index.ts";

export type MapAreaResizeEvent = {
  inlineSize?: number;
  blockSize?: number;
  width?: number;
  height?: number;
};

export type MapAreaResizeCallback = (event: MapAreaResizeEvent) => void;

/**
 * Adds a resize observer to the map and returns a function turning it off.
 */
export function addResizeObserver(
  map: MapArea,
  callback?: MapAreaResizeCallback,
) {
  let resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      if (!entry.contentBoxSize) continue;

      if (callback) {
        if (entry.contentBoxSize) {
          let { inlineSize, blockSize } =
            entry.contentBoxSize[0] ?? entry.contentBoxSize;

          callback({ inlineSize, blockSize });
        } else {
          let { width, height } = entry.contentRect;

          callback({ width, height });
        }
      }

      map.render();
    }
  });

  resizeObserver.observe(map.container);

  return () => {
    resizeObserver.unobserve(map.container);
  };
}
