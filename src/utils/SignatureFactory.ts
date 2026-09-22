import type { MapArea } from "../MapArea/index.ts";
import type { AddTilesOptions } from "../plugins/addTiles.ts";
import { getTileIndices } from "./getTileIndices.ts";
import { getTileURL } from "./getTileURL.ts";

export type FetchSignatureMap = (
  urls: string[],
) => Promise<Record<string, string>>;

export type SignatureFactoryOptions = {
  maxSize?: number;
  ttl?: number;
};

export type SignatureMapEntry = {
  /** Signature value. */
  v: string;
  /** Time the signature value was received. */
  t: number;
};

export class SignatureFactory {
  /** Endpoint URL or async function serving signatures. */
  _src: string | FetchSignatureMap;
  /** Signature map indexed by URLs without origins. */
  _m: Map<string, SignatureMapEntry>;
  /**
   * Maximum signature map size.
   * @default 300
   */
  maxSize: number;
  /**
   * Signature time-to-live.
   * @default 1800000
   */
  ttl: number;
  /**
   * @param source - Endpoint URL or async function serving signatures.
   *
   * The endpoint URL should accept a POST request with a JSON array of URLs to sign
   * and return a JSON mapping the URLs to their signatures `{ "<url>": "<signature>" }`.
   */
  constructor(source: string | FetchSignatureMap, options: SignatureFactoryOptions = {}) {
    this._src = source;
    this._m = new Map();
    this.maxSize = options.maxSize ?? 300;
    this.ttl = options.ttl ?? 1800000;
  }
  async fetch(urls: string[]): Promise<Record<string, string>> {
    if (typeof this._src === "function") return this._src(urls);

    try {
      let res = await fetch(this._src, {
        method: "POST",
        body: JSON.stringify(urls),
      });

      if (res.ok) {
        let body = await res.json();
        return body as Record<string, string>;
      }
    } catch {}

    return {};
  }
  async prerender(map: MapArea, options: AddTilesOptions = {}) {
    if (!this._src) return;

    let { shouldRender, signature, ...p } = options;
    let { x: xi0, y: yi0, nx, ny } = getTileIndices(map, options);

    let signedURLs = new Set<string>();
    let unsignedURLs = new Set<string>();
    let t = Date.now();

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * Math.ceil(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * Math.ceil(nyi / 2);
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (ok) {
          let u = getTileURL(map, xi, yi, p);
          let vPrev = this._m.get(u);
          if (vPrev === undefined || t - vPrev.t > this.ttl) unsignedURLs.add(u);
          else signedURLs.add(u);
        }
      }
    }

    if (unsignedURLs.size === 0) return;

    let m = await this.fetch(Array.from(unsignedURLs));
    let size = Object.keys(m).length;

    if (size !== 0) {
      let overflow = this._m.size + size - this.maxSize;
      if (overflow > 0) {
        let i = 0;
        for (let k of this._m.keys()) {
          if (i === overflow) break;
          // Keep the previously signed URLs in the map as long as they are
          // still required
          if (!signedURLs.has(k)) {
            this._m.delete(k);
            i++;
          }
        }
      }
      for (let [k, v] of Object.entries(m)) {
        let vPrev = this._m.get(k);
        if (vPrev === undefined || t - vPrev.t > this.ttl)
          this._m.set(k, { v, t });
      }
    }
  }
  getValue(url: string): string | undefined {
    return this._m.get(url)?.v;
  }
}
