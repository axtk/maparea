import { MapArea } from "../MapArea/index.ts";
import { GeoBounds } from "../types/GeoBounds.ts";

const { abs, log2, min, floor } = Math;

export function fitBounds(map: MapArea, bounds: GeoBounds) {
  let { box: { w, h }, center: [lat, lon], zoom } = map;
  let { minLat, maxLat, minLon, maxLon } = bounds;

  let dzx = 0;
  let dzy = 0;

  if (minLon !== undefined && maxLon !== undefined) {
    let dx = abs(map.toPixelCoords(lat, maxLon)[0] - map.toPixelCoords(lat, minLon)[0]);

    if (dx !== 0) dzx = log2(w / dx);
  }

  if (minLat !== undefined && maxLat !== undefined) {
    let dy = abs(map.toPixelCoords(minLat, lon)[1] - map.toPixelCoords(maxLat, lon)[1]);

    if (dy !== 0) dzy = log2(h / dy);
  }

  let nextZoom = floor(min(zoom + dzx, zoom + dzy));

  if (nextZoom !== zoom) map.zoom = nextZoom;
}
