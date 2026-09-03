import type { MapArea } from "../MapArea/index.ts";
import type { AddTilesOptions } from "../plugins/addTiles.ts";
import { getTileIndices } from "./getTileIndices.ts";
import { getTileURL } from "./getTileURL.ts";

export type FetchSignatureMap = (
  urls: string[],
) => Promise<Record<string, string>>;

export class SignatureFactory {
  /** Endpoint URL or async function serving signatures. */
  _u: string | FetchSignatureMap;
  /** Signature map indexed by URLs without origins. */
  _m: Map<string, string>;
  /**
   * Maximum signature map size.
   * @default 150
   */
  maxSize: number;
  /**
   * @param url - Endpoint URL or async function serving signatures.
   *
   * The endpoint URL should accept a POST request with a JSON array of URLs to sign
   * and return a JSON mapping the URLs to their signatures `{ "<url>": "<signature>" }`.
   */
  constructor(url: string | FetchSignatureMap, maxSize = 150) {
    this._u = url;
    this._m = new Map();
    this.maxSize = maxSize;
  }
  async fetch(urls: string[]): Promise<Record<string, string>> {
    if (typeof this._u === "function") return this._u(urls);

    try {
      let res = await fetch(this._u, {
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
    if (!this._u) return;

    let { shouldRender, signature, ...p } = options;
    let { x: xi0, y: yi0, nx, ny } = getTileIndices(map, options);
    let urls: string[] = [];

    for (let nxi = 0; nxi <= nx; nxi++) {
      // Start from the center tile, then move to the sides alternately
      let xi = xi0 + (nxi % 2 === 0 ? -1 : 1) * Math.floor(nxi / 2);

      for (let nyi = 0; nyi <= ny; nyi++) {
        let yi = yi0 + (nyi % 2 === 0 ? -1 : 1) * Math.floor(nyi / 2);
        let ok = shouldRender?.(map, xi, yi) ?? true;

        if (ok) {
          let u = getTileURL(map, xi, yi, p);
          if (!this._m.has(u)) urls.push(u);
        }
      }
    }

    let m = await this.fetch(urls);
    let size = Object.keys(m).length;

    if (size !== 0) {
      let overflow = this._m.size + size - this.maxSize;
      if (overflow > 0) {
        let i = 0;
        for (let k of this._m.keys()) {
          if (i === overflow) break;
          this._m.delete(k);
          i++;
        }
      }
      for (let [k, v] of Object.entries(m)) this._m.set(k, v);
    }
  }
  getValue(url: string) {
    return this._m.get(url);
  }
}
