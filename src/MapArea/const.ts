import type { Projection } from "../types/Projection.ts";

const { PI } = Math;

export const RAD = PI / 180;
export const DEG = 180 / PI;

export const eccentricityMap: Record<Projection, number> = {
  spherical: 0,
  ellipsoidal: 0.0818191908426,
};

export const MIN_LAT = -85.05;
export const MAX_LAT = 85.05;
export const MIN_LON = -180;
export const MAX_LON = 180;
