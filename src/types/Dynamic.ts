import type { MapArea } from "../MapArea/index.ts";

export type Dynamic<T> = T | ((map: MapArea) => T);
