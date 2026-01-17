import type { MapArea } from "../MapArea/index.ts";

export type DynamicString = string | ((map: MapArea) => string);
