import type { CanvasStyles } from "./CanvasStyles.ts";

export type RenderingProps = {
  lineDash?: number[];
  fillRule?: CanvasFillRule;
} & CanvasStyles;
