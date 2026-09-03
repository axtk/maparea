import type { MapArea } from "../MapArea/index.ts";
import { SignatureFactory } from "./SignatureFactory.ts";

export type GetTileURLOptions = {
  /**
   * Tile URL, either a string with placeholders (`{x}` and `{y}` for the
   * tile indices, `{z}` for the zoom level, `{lang}` for the map language)
   * or a function of `(map, x, y) => string` returning a fixed string URL.
   */
  url?: string | ((map: MapArea, xIndex: number, yIndex: number) => string);
  /** Returns the signature URL parameter value for the given tile. */
  signature?:
    | ((map: MapArea, xIndex: number, yIndex: number) => string)
    | SignatureFactory;
  /** Values of the `{s}` placeholder of the tile URLs. */
  subdomains?: string[];
};

export function getTileURL(
  map: MapArea,
  xIndex: number,
  yIndex: number,
  { url, signature, subdomains }: GetTileURLOptions = {},
) {
  if (!url) return "";

  if (typeof url === "function") return url(map, xIndex, yIndex);

  let resolvedURL = url
    .replaceAll("{x}", String(xIndex))
    .replaceAll("{y}", String(yIndex))
    .replaceAll("{z}", String(map.zoom))
    .replaceAll("{lang}", map.lang);

  if (subdomains && resolvedURL.includes("{s}"))
    resolvedURL = resolvedURL.replaceAll(
      "{s}",
      subdomains[Math.floor(subdomains.length * Math.random())],
    );

  if (signature !== undefined) {
    let s = "";

    if (signature instanceof SignatureFactory)
      s = signature.getValue(resolvedURL) ?? "";
    else if (typeof signature === "function")
      s = signature(map, xIndex, yIndex);

    if (s)
      resolvedURL += `${resolvedURL.includes("?") ? "&" : "?"}signature=${encodeURIComponent(s)}`;
  }

  return resolvedURL;
}
