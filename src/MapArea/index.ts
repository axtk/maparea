import type { BoxDimensions } from "../types/BoxDimensions.ts";
import type { GeoBounds } from "../types/GeoBounds.ts";
import type { GeoCoords } from "../types/GeoCoords.ts";
import type { PixelCoords } from "../types/PixelCoords.ts";
import type { Projection } from "../types/Projection.ts";
import {
  DEG,
  eccentricityMap,
  MAX_LAT,
  MAX_LON,
  MIN_LAT,
  MIN_LON,
  RAD,
} from "./const.ts";

const { PI, sin, tan, atan, pow, exp, log, abs } = Math;

export type MapAreaOptions = {
  container: string;
  center?: GeoCoords;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Minimal and maximal latitudes and longitudes */
  bounds?: GeoBounds;
  /** Map projection (default: `"spherical"`) */
  projection?: Projection;
  lang?: string;
};

export type RenderCallback = (map: MapArea) => void;

export class MapArea {
  /** Map parameters */
  _p: MapAreaOptions;
  /** Map container */
  _c: HTMLElement | undefined;
  /** Pixel coordinates of the map center */
  _cc: PixelCoords | undefined;
  /** Render callbacks */
  _r = new Set<RenderCallback>();
  constructor(options: MapAreaOptions) {
    this._p = options;
    this.container.style =
      "position: relative; overflow: hidden; touch-action: none;";
    this.container.dataset.element = "maparea";
  }
  render() {
    for (let callback of this._r) callback(this);
  }
  onRender(callback: RenderCallback, skipInitialCall = false) {
    this._r.add(callback);

    if (!skipInitialCall) callback(this);

    return () => {
      this._r.delete(callback);
    };
  }
  getOptions(): MapAreaOptions {
    return {
      ...this._p,
      center: this.center,
      bounds: this.bounds,
    };
  }
  setOptions(options: Partial<MapAreaOptions>) {
    this._p = { ...this._p, ...options };

    // Flush cache
    if ("container" in options) delete this._c;
    delete this._cc;

    this.render();
  }
  get container(): HTMLElement {
    if (!this._c) {
      let container = document.querySelector<HTMLElement>(this._p.container);

      if (!container) throw new Error("missing container element");

      this._c = container;
    }

    return this._c;
  }
  get box(): BoxDimensions {
    let box = this.container.getBoundingClientRect();

    return {
      x: box.left,
      y: box.top,
      w: box.width,
      h: box.height,
    };
  }
  get bounds(): GeoBounds {
    let value = this._p.bounds;

    return value ? { ...value } : {};
  }
  set bounds(value: GeoBounds) {
    this._p.bounds = value;
  }
  get center(): GeoCoords {
    let value = this._p.center;

    return (value ? value.slice() : [0, 0]) as GeoCoords;
  }
  set center(value: GeoCoords) {
    this._p.center = value;
    delete this._cc;
    this.render();
  }
  get centerCoords(): PixelCoords {
    if (!this._cc) {
      let [lat, lon] = this.center;

      this._cc = this.toPixelCoords(lat, lon);
    }

    return this._cc;
  }
  get zoom() {
    return this._p.zoom ?? this._p.minZoom ?? 0;
  }
  set zoom(value: number) {
    let { minZoom, maxZoom } = this;
    let effectiveValue = value;

    if (value < minZoom) effectiveValue = minZoom;
    if (value > maxZoom) effectiveValue = maxZoom;

    this._p.zoom = effectiveValue;
    delete this._cc;
    this.render();
  }
  get minZoom() {
    return this._p.minZoom ?? -Infinity;
  }
  set minZoom(value: number) {
    this._p.minZoom = value;
    if (this.zoom < this.minZoom) this.zoom = this.minZoom;
  }
  get maxZoom() {
    return this._p.maxZoom ?? Infinity;
  }
  set maxZoom(value: number) {
    this._p.maxZoom = value;
    if (this.zoom > this.maxZoom) this.zoom = this.maxZoom;
  }
  get projection() {
    return this._p.projection ?? "spherical";
  }
  set projection(value: Projection) {
    this._p.projection = value;
    this.render();
  }
  get lang() {
    return this._p.lang ?? "";
  }
  set lang(value: string) {
    this._p.lang = value;
    this.render();
  }
  inPixelBounds(x: number, y: number) {
    let [lat, lon] = this.toGeoCoords(x, y);

    return this.inBounds(lat, lon);
  }
  inBounds(lat: number, lon: number) {
    let {
      minLat = MIN_LAT,
      maxLat = MAX_LAT,
      minLon = MIN_LON,
      maxLon = MAX_LON,
    } = this.bounds;

    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
  }
  canMoveTo(lat: number, lon: number) {
    if (!this.inBounds(lat, lon)) return false;

    let { w, h } = this.box;

    if (w === 0 || h === 0) return false;

    let [cx, cy] = this.toPixelCoords(lat, lon);

    return (
      this.inPixelBounds(cx - w / 2, cy - h / 2) &&
      this.inPixelBounds(cx + w / 2, cy + h / 2)
    );
  }
  /** Converts geographic coordinates to pixel coordinates. */
  toPixelCoords(lat: number, lon: number): PixelCoords {
    // https://yandex.com/maps-api/docs/tiles-api/index.html#get-tile-number
    // https://en.wikipedia.org/wiki/Web_Mercator_projection#Formulas
    let e = eccentricityMap[this.projection];
    let rho = pow(2, this.zoom + 7) / PI;

    let phi = lat * RAD;
    let q = e === 0 ? 1 : pow((1 - e * sin(phi)) / (1 + e * sin(phi)), e / 2);

    let x = rho * (PI + lon * RAD);
    let y = rho * (PI - log(q * tan(PI / 4 + phi / 2)));

    return [x, y];
  }
  /** Converts pixel coordinates to geographic coordinates. */
  toGeoCoords(x: number, y: number): GeoCoords {
    let e = eccentricityMap[this.projection];
    let rho = pow(2, this.zoom + 7) / PI;

    let lon = (x / rho - PI) * DEG;
    let lat: number;

    // Spherical projection
    if (e === 0) lat = 2 * (atan(exp(PI - y / rho)) - PI / 4) * DEG;
    else {
      // With no analytic form for a non-spherical projection,
      // `lat` is derived from `y` via binary search
      lat = MIN_LAT;

      let dlat = MAX_LAT - MIN_LAT;
      let y0 = Number.NaN;
      let k = 0;

      while ((Number.isNaN(y0) || abs(y0 - y) > 0.1) && k++ < 30) {
        dlat /= 2;
        y0 = this.toPixelCoords(lat + dlat, lon)[1];

        if (y0 > y) lat += dlat;
      }
    }

    // Bring the values to the regular bounds
    if (lon < -180 || lon >= 180) lon = ((lon + 180) % 360) - 180;
    if (lat < -90 || lat >= 90) lat = ((lat + 90) % 180) - 90;

    return [lat, lon];
  }
}
